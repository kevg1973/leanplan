import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase.js";
import { ThemeProvider } from "./ThemeContext.jsx";
import { FONT, TABS, TAB_ICON_MAP, DAY_NAMES, ALLERGENS, DISLIKES_LIST, TRIAL_DAYS } from "./constants.js";
import { toKg, fromKg, pick, todayKey, fmtDate, getTrialStart, setTrialStart, getTrialDaysLeft, isTrialActive, isTrialExpired, calcTDEE, calcBMI, PACE_OPTIONS, getPace } from "./helpers.js";
import { Icon } from "./components/Icon.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { Onboarding } from "./components/Onboarding.jsx";
import { TipSplashScreen } from "./components/TipSplashScreen.jsx";
import { MealPlanLoader } from "./components/MealPlanLoader.jsx";
import { ProBanner } from "./components/ProBanner.jsx";
import { AvatarCropModal } from "./components/AvatarCropModal.jsx";
import { Card, Section, Row, Btn, Chip, BigChip, Toggle, TInput, StatBox, ProgressBar } from "./components/ui.jsx";
import { Chart } from "./components/Chart.jsx";
import { MealCarousel } from "./components/MealCarousel.jsx";
import { JournalCard } from "./components/JournalCard.jsx";
import { LiftTracker } from "./components/LiftTracker.jsx";
import { LockedTab } from "./components/LockedTab.jsx";
import { WelcomeScreen } from "./components/WelcomeScreen.jsx";
import { TrialExpiredScreen } from "./components/TrialExpiredScreen.jsx";
import { WeeklyCheckIn } from "./components/WeeklyCheckIn.jsx";
import { PaywallModal } from "./components/PaywallModal.jsx";
import { CreateAccountScreen } from "./components/CreateAccountScreen.jsx";
import { AuthScreen } from "./components/AuthScreen.jsx";
import { PacePicker } from "./components/PacePicker.jsx";
import { CoachTab } from "./components/CoachTab.jsx";
import { ProgressPhotos } from "./components/ProgressPhotos.jsx";
import { TodayTab } from "./components/TodayTab.jsx";
import { TrackTab } from "./components/TrackTab.jsx";
import { MealsTab } from "./components/MealsTab.jsx";
import { EXERCISE_DB } from "./data/exercises.js";
import { PERIODISATION_BLOCKS, getProgrammeLengthWeeks, getCurrentBlock, buildWorkout, WORKOUTS, SHOPPING, SUPPS, DAILY_TIPS, getWeeklyPlan } from "./data/workouts.js";
import { ALL_MEALS, filterMeals } from "./data/meals.js";

const LIGHT = {
  bg:"#f2f2f7", surface:"#ffffff", card:"#ffffff",
  accent:"#007aff", green:"#34c759", red:"#ff3b30",
  orange:"#ff9500", purple:"#af52de", teal:"#5ac8fa",
  pink:"#ff2d55", yellow:"#ffcc00", indigo:"#5856d6",
  text:"#000000", textSec:"#3c3c43", muted:"#8e8e93",
  border:"#e5e5ea", divider:"#c6c6c8", sectionBg:"#f2f2f7",
};

const DARK = {
  bg:"#000000", surface:"#1c1c1e", card:"#2c2c2e",
  accent:"#0a84ff", green:"#30d158", red:"#ff453a",
  orange:"#ff9f0a", purple:"#bf5af2", teal:"#5ac8fa",
  pink:"#ff375f", yellow:"#ffd60a", indigo:"#5e5ce6",
  text:"#ffffff", textSec:"#ebebf5", muted:"#8e8e93",
  border:"#3a3a3c", divider:"#48484a", sectionBg:"#1c1c1e",
};

// C is set dynamically in the App — components read it via the global
let C = LIGHT;


// ── TRAIN TAB ─────────────────────────────────────────────────────────────────
const TrainTab = ({ profile, workoutLog, setWorkoutLog, setProfile, savedWorkout, setSavedWorkout, entries=[] }) => {
  const [selectedType, setSelectedType] = useState("full-body");
  const activeWorkout = savedWorkout?.workout || null;
  const activeExercises = savedWorkout?.exercises || [];
  const setActiveWorkout = (w) => setSavedWorkout(w ? { workout:w, exercises:savedWorkout?.exercises||[] } : null);
  const setActiveExercises = (e) => setSavedWorkout(prev => prev ? { ...prev, exercises:e } : null);
  const isGuided = profile?.appMode !== "custom";
  const [view, setView] = useState(isGuided ? "calendar" : "workout");
  const [expandedEx, setExpandedEx] = useState(null);
  const [loggedWeights, setLoggedWeights] = useState({});
  const [liftInputs, setLiftInputs] = useState({});
  const [lifts, setLifts] = useState(() => {
    try { return JSON.parse(localStorage.getItem("leanplan_lifts")||"{}" ); } catch { return {}; }
  });
  const [prToast, setPrToast] = useState(null);

  const showPrToast = (msg) => {
    setPrToast(msg);
    setTimeout(() => setPrToast(null), 3000);
  };

  const saveLift = (exName, weight, reps, sets) => {
    if (!weight) return;
    const newWeight = parseFloat(weight);
    const entry = { date:todayKey(), weight:newWeight, reps:parseInt(reps)||0, sets:parseInt(sets)||3, timestamp:Date.now() };
    const previous = lifts[exName] || [];
    const updated = {...lifts, [exName]: [...previous, entry].slice(-20)};
    setLifts(updated);
    localStorage.setItem("leanplan_lifts", JSON.stringify(updated));
    setLoggedWeights(lw => ({...lw, [exName]: true}));

    // Check for personal best
    const prevBest = previous.length > 0 ? Math.max(...previous.map(e => e.weight)) : 0;
    if (newWeight > prevBest && previous.length > 0) {
      showPrToast(`🏆 New PB! ${exName} — ${newWeight}kg`);
    }

    // Auto-log the workout on first exercise saved
    if (!workoutLog[todayKey()] && activeWorkout) {
      setWorkoutLog(wl=>({...wl,[todayKey()]:{type:selectedType,date:todayKey(),time:new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}}));
    }
  };
  const getLastLift = (exName) => {
    const entries = lifts[exName];
    if (!entries || entries.length === 0) return null;
    return entries[entries.length - 1];
  };
  const today = todayKey();

  const days = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-d.getDay()+1+i); return d; });
  const dayKey = d => d.toISOString().split("T")[0];
  const weekWorkouts = days.filter(d=>workoutLog[dayKey(d)]).length;

  // Get current training block
  const block = getCurrentBlock(profile);
  const weekInBlock = block.weekInBlock || 0;
  const isDeload = weekInBlock === 3;

  // Set training start date if not set
  useEffect(() => {
    if (!profile?.trainingStartDate) {
      setProfile(p => ({...p, trainingStartDate: new Date().toISOString()}));
    }
  }, []);

  const buildAndShowWorkout = (type) => {
    const w = WORKOUTS[type];
    const exercises = buildWorkout(type, profile, isDeload ? {...block, sets: Math.max(2, block.sets-1), reps:"12-15", rest:"60 sec"} : block);
    setSavedWorkout({ workout:w, exercises });
    setView("workout");
  };

  const logWorkout = (type) => {
    setWorkoutLog(wl=>({...wl,[today]:{type,date:today,time:new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}}));
    buildAndShowWorkout(type);
  };

  const historyWeeks = Array.from({length:4},(_,i)=>{
    const start=new Date(); start.setDate(start.getDate()-start.getDay()+1-(i*7));
    const count=Array.from({length:7},(__,j)=>{ const d=new Date(start); d.setDate(d.getDate()+j); return workoutLog[dayKey(d)]?1:0; }).reduce((a,b)=>a+b,0);
    return {label:i===0?"This week":i===1?"Last week":`${i+1}w ago`,count};
  }).reverse();

  const trainDays = profile.workoutsPerWeek||3;
  const restDays = 7 - trainDays;
  const suggestion = trainDays<=3 ? "Mon · Wed · Fri" : trainDays===4 ? "Mon · Tue · Thu · Fri" : "Mon · Tue · Thu · Fri · Sat";

  // Determine today's prescribed session from weekly plan
  const getTodaySession = () => {
    const weekPlan = getWeeklyPlan(profile);
    const dayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon...
    // Map day names to day-of-week indices
    const dayMap = { Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6, Sun:0 };
    const sessionIndex = weekPlan.days.findIndex(d => dayMap[d] === dayOfWeek);
    if (sessionIndex === -1) return null; // rest day
    return { ...weekPlan.sessions[sessionIndex], dayName: weekPlan.days[sessionIndex] };
  };
  const todaySession = getTodaySession();
  const todayDayName = new Date().toLocaleDateString("en-GB", { weekday:"long" });

  return (
    <div>
      {/* PR Toast */}
      {prToast && (
        <div style={{ position:"fixed", top:80, left:"50%", transform:"translateX(-50%)", background:"linear-gradient(135deg, #f5a623, #f76b1c)", color:"#fff", borderRadius:14, padding:"12px 20px", fontSize:14, fontWeight:700, zIndex:999, boxShadow:"0 4px 20px rgba(0,0,0,0.25)", whiteSpace:"nowrap" }}>
          {prToast}
        </div>
      )}
      <div style={{ display:"flex", background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:3, marginBottom:12, gap:2 }}>
        {[["workout", isGuided?"Custom":"Workout"],["calendar","Programme"],["lifts","Progress"]].map(([k,l])=>(
          <button key={k} onClick={()=>setView(k)} style={{ flex:1, background:view===k?C.accent:"transparent", color:view===k?"#fff":C.muted, border:"none", borderRadius:10, padding:"8px 0", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:FONT, transition:"all 0.2s" }}>{l}</button>
        ))}
      </div>

      {view==="calendar"&&<>

        {/* End of programme celebration screen */}
        {isGuided && block.isProgrammeComplete && (() => {
          const goal = profile?.goal || "lose_weight";
          const isWeightGoal = goal === "lose_weight" || goal === "all";
          const startKg = parseFloat(profile?.startWeight || profile?.startWeightKg || 0);
          const targetKg = parseFloat(profile?.targetRaw || profile?.targetWeightKg || 0);
          const currentKg = entries?.length > 0 ? entries[entries.length-1].weight : startKg;
          const lostKg = startKg > 0 ? parseFloat((startKg - currentKg).toFixed(1)) : 0;
          const toGoKg = isWeightGoal ? parseFloat(Math.max(0, currentKg - targetKg).toFixed(1)) : 0;
          const targetHit = isWeightGoal && toGoKg === 0;
          const weeksCompleted = block.programmeLengthWeeks || 16;
          const startDate = profile?.trainingStartDate ? new Date(profile.trainingStartDate).toISOString().split("T")[0] : null;
          const totalWorkouts = startDate ? Object.keys(workoutLog).filter(d => d >= startDate).length : Object.keys(workoutLog).length;

          const motivationalLine = targetHit
            ? "You set a goal and you crushed it. Time to set a new one."
            : goal === "build_muscle"
            ? "Sixteen weeks of consistent training. Your body is stronger than when you started."
            : goal === "get_fitter"
            ? "Sixteen weeks of showing up. Your fitness foundation is built — now build higher."
            : `You've made real progress. ${toGoKg}kg to go — you know exactly what to do.`;

          const handleContinueToTarget = () => {
            setProfile({ ...profile, trainingStartDate: new Date().toISOString() });
          };
          const handleStartFresh = () => {
            setProfile({ ...profile, trainingStartDate: new Date().toISOString(), startWeight: String(currentKg), startWeightKg: currentKg });
          };

          return (
            <div style={{ marginBottom: 16 }}>
              <div style={{ background: `linear-gradient(135deg, ${C.yellow}22, ${C.orange}18)`, border: `1.5px solid ${C.yellow}55`, borderRadius: 20, padding: "22px 20px 18px", marginBottom: 12, textAlign: "center" }}>
                <div style={{ fontSize: 52, marginBottom: 8 }}>🏆</div>
                <h2 style={{ color: C.text, fontSize: 24, fontWeight: 800, margin: "0 0 6px" }}>Programme Complete!</h2>
                <p style={{ color: C.muted, fontSize: 14, margin: "0 0 16px" }}>{weeksCompleted} weeks. You did it.</p>
                <p style={{ color: C.textSec, fontSize: 13, lineHeight: 1.6, margin: "0 0 18px", fontStyle: "italic" }}>{motivationalLine}</p>
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  <div style={{ background: C.card, borderRadius: 12, padding: "10px 14px", flex: 1 }}>
                    <div style={{ color: C.accent, fontSize: 20, fontWeight: 800 }}>{totalWorkouts}</div>
                    <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>workouts</div>
                  </div>
                  {isWeightGoal && lostKg > 0 && (
                    <div style={{ background: C.card, borderRadius: 12, padding: "10px 14px", flex: 1 }}>
                      <div style={{ color: C.green, fontSize: 20, fontWeight: 800 }}>▼{lostKg}kg</div>
                      <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>lost</div>
                    </div>
                  )}
                  {isWeightGoal && !targetHit && toGoKg > 0 && (
                    <div style={{ background: C.card, borderRadius: 12, padding: "10px 14px", flex: 1 }}>
                      <div style={{ color: C.orange, fontSize: 20, fontWeight: 800 }}>{toGoKg}kg</div>
                      <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>to go</div>
                    </div>
                  )}
                  <div style={{ background: C.card, borderRadius: 12, padding: "10px 14px", flex: 1 }}>
                    <div style={{ color: C.purple, fontSize: 20, fontWeight: 800 }}>{weeksCompleted}</div>
                    <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>weeks</div>
                  </div>
                </div>
              </div>
              {targetHit ? (
                <button onClick={handleStartFresh} style={{ width: "100%", background: C.accent, border: "none", borderRadius: 14, padding: "14px 0", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>Start a new programme →</button>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {isWeightGoal && toGoKg > 0 && (
                    <button onClick={handleContinueToTarget} style={{ width: "100%", background: C.accent, border: "none", borderRadius: 14, padding: "14px 0", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>Continue to my target ({toGoKg}kg to go) →</button>
                  )}
                  <button onClick={handleStartFresh} style={{ width: "100%", background: "none", border: `1.5px solid ${C.border}`, borderRadius: 14, padding: "13px 0", color: C.textSec, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>{isWeightGoal ? "Change my goal and start fresh" : "Start a new programme"}</button>
                </div>
              )}
            </div>
          );
        })()}

        {/* Today's session card */}
        {isGuided && !block.isProgrammeComplete && (
          <div style={{ marginBottom:14 }}>
            {todaySession ? (
              <div style={{ background:`linear-gradient(135deg, ${todaySession.color}22, ${todaySession.color}08)`, border:`1.5px solid ${todaySession.color}44`, borderRadius:20, padding:"16px 18px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                  <div>
                    <p style={{ color:C.muted, fontSize:11, fontWeight:700, letterSpacing:"0.08em", margin:"0 0 4px" }}>TODAY — {todayDayName.toUpperCase()}</p>
                    <h3 style={{ color:C.text, fontSize:20, fontWeight:800, margin:"0 0 4px" }}>🏋️ {todaySession.label}</h3>
                    <p style={{ color:C.muted, fontSize:13, margin:0 }}>{block.name} Block · Week {weekInBlock+1} · {isDeload?"Deload":block.reps+" reps · "+block.sets+" sets"}</p>
                  </div>
                  {workoutLog[today] ? (
                    <div style={{ background:`${C.green}20`, border:`1px solid ${C.green}44`, borderRadius:12, padding:"8px 12px", textAlign:"center" }}>
                      <div style={{ fontSize:20 }}>✓</div>
                      <div style={{ color:C.green, fontSize:10, fontWeight:700 }}>DONE</div>
                    </div>
                  ) : (
                    <div style={{ background:`${todaySession.color}20`, borderRadius:12, padding:"8px 12px", textAlign:"center" }}>
                      <div style={{ color:todaySession.color, fontSize:18, fontWeight:800 }}>{todaySession.desc.split(" ")[0]}</div>
                      <div style={{ color:todaySession.color, fontSize:10, fontWeight:700, opacity:0.8 }}>TODAY</div>
                    </div>
                  )}
                </div>
                <p style={{ color:C.muted, fontSize:13, margin:"0 0 14px" }}>{todaySession.desc}</p>
                {!workoutLog[today] ? (
                  <div>
                    <button
                      onClick={()=>{ buildAndShowWorkout(todaySession.type); setView("workout"); }}
                      style={{ width:"100%", background:todaySession.color, border:"none", borderRadius:14, padding:"13px 0", color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:FONT, marginBottom:8 }}
                    >Start Today's Workout →</button>
                    <button
                      onClick={()=>setView("workout")}
                      style={{ width:"100%", background:"none", border:"none", padding:"4px 0", color:C.muted, fontSize:12, cursor:"pointer", fontFamily:FONT }}
                    >Choose a different workout instead</button>
                  </div>
                ) : (
                  <button
                    onClick={()=>{ buildAndShowWorkout(todaySession.type); setView("workout"); }}
                    style={{ width:"100%", background:"none", border:`1.5px solid ${C.green}`, borderRadius:14, padding:"12px 0", color:C.green, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:FONT }}
                  >↻ Do it again</button>
                )}
              </div>
            ) : (
              <div style={{ background:`${C.green}08`, border:`1px solid ${C.green}22`, borderRadius:20, padding:"16px 18px" }}>
                <p style={{ color:C.muted, fontSize:11, fontWeight:700, letterSpacing:"0.08em", margin:"0 0 4px" }}>TODAY — {todayDayName.toUpperCase()}</p>
                <h3 style={{ color:C.text, fontSize:20, fontWeight:800, margin:"0 0 6px" }}>💚 Rest Day</h3>
                <p style={{ color:C.muted, fontSize:13, margin:"0 0 14px", lineHeight:1.6 }}>Recovery is where the gains happen. A short walk, stretching, or foam rolling will help you come back stronger tomorrow.</p>
                <div style={{ display:"flex", gap:8 }}>
                  {["🚶 Walk","🧘 Stretch","🫁 Breathe"].map(a=>(
                    <div key={a} style={{ flex:1, background:C.sectionBg, borderRadius:12, padding:"10px 8px", textAlign:"center" }}>
                      <p style={{ color:C.text, fontSize:13, margin:0 }}>{a}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!block.isProgrammeComplete && <>

        {/* Training Block Card */}
        <div style={{ background:`linear-gradient(135deg, ${block.color}, ${block.color}aa)`, borderRadius:16, padding:"16px 18px", marginBottom:14, color:"#fff" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <p style={{ opacity:0.85, fontSize:11, fontWeight:700, letterSpacing:"0.08em", margin:"0 0 4px" }}>TRAINING BLOCK {block.id} OF 4</p>
              <h3 style={{ margin:0, fontSize:20, fontWeight:800 }}>{block.name}</h3>
              <p style={{ opacity:0.8, fontSize:12, margin:"3px 0 0" }}>{block.subtitle}</p>
              <p style={{ opacity:0.7, fontSize:11, margin:"4px 0 0" }}>Week {(block.weeksSinceStart||0)+1} of {block.programmeLengthWeeks||16} · {Math.max(0,(block.programmeLengthWeeks||16)-((block.weeksSinceStart||0)+1))} weeks remaining</p>
            </div>
            <div style={{ background:"rgba(255,255,255,0.2)", borderRadius:12, padding:"8px 12px", textAlign:"center" }}>
              <div style={{ fontSize:18, fontWeight:800 }}>W{weekInBlock+1}</div>
              <div style={{ fontSize:10, opacity:0.85 }}>of 4</div>
            </div>
          </div>
          {isDeload&&<div style={{ background:"rgba(255,255,255,0.2)", borderRadius:10, padding:"8px 12px", marginTop:10 }}>
            <p style={{ fontSize:12, fontWeight:700, margin:"0 0 2px" }}>🔄 DELOAD WEEK</p>
            <p style={{ fontSize:12, opacity:0.9, margin:0 }}>Reduced volume — let your body recover and grow stronger.</p>
          </div>}
          {!isDeload&&<p style={{ opacity:0.8, fontSize:12, margin:"8px 0 0" }}>{block.weeklyNote?.[weekInBlock]}</p>}
          <div style={{ display:"flex", gap:12, marginTop:12 }}>
            <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:8, padding:"6px 10px", fontSize:12 }}>
              <span style={{ opacity:0.8 }}>Reps: </span><strong>{isDeload?"12-15":block.reps}</strong>
            </div>
            <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:8, padding:"6px 10px", fontSize:12 }}>
              <span style={{ opacity:0.8 }}>Sets: </span><strong>{isDeload?Math.max(2,block.sets-1):block.sets}</strong>
            </div>
            <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:8, padding:"6px 10px", fontSize:12 }}>
              <span style={{ opacity:0.8 }}>Rest: </span><strong>{isDeload?"60s":block.rest}</strong>
            </div>
          </div>
        </div>

        <Card>
          <p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", marginBottom:12 }}>THIS WEEK — {weekWorkouts}/{profile.workoutsPerWeek} WORKOUTS</p>
          <ProgressBar value={weekWorkouts} max={profile.workoutsPerWeek||3} color={weekWorkouts>=(profile.workoutsPerWeek||3)?C.green:C.accent} height={6} />
          <div style={{ display:"flex", gap:6, marginTop:14 }}>
            {days.map((d,i)=>{
              const k=dayKey(d); const logged=workoutLog[k]; const isToday=k===today;
              return <div key={i} style={{ flex:1, textAlign:"center" }}>
                <div style={{ fontSize:10, color:isToday?C.accent:C.muted, fontWeight:isToday?700:400, marginBottom:4 }}>{DAY_NAMES[i]}</div>
                <div style={{ width:"100%", aspectRatio:"1", borderRadius:10, background:logged?C.accent:isToday?`${C.accent}15`:C.sectionBg, border:`1.5px solid ${logged?C.accent:isToday?C.accent:C.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {logged?<span style={{ color:"#fff", fontSize:11 }}>✓</span>:<span style={{ color:C.muted, fontSize:10 }}>{d.getDate()}</span>}
                </div>
                {logged&&<div style={{ fontSize:9, color:C.accent, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{logged.type.split("-")[0]}</div>}
              </div>;
            })}
          </div>
        </Card>

        {(()=>{
          const weekPlan = getWeeklyPlan(profile);
          return (
            <Card>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
                <Icon name="calendar" size={14} color={C.accent} />
                <p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", margin:0 }}>YOUR WEEKLY PLAN</p>
              </div>
              <p style={{ color:C.muted, fontSize:12, lineHeight:1.6, margin:"0 0 14px" }}>{weekPlan.note}</p>

              {/* Session cards */}
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
                {weekPlan.sessions.map((session, i) => {
                  const dayMap = { Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6, Sun:0 };
                  const sessionDayIndex = dayMap[weekPlan.days[i]];
                  const todayDayIndex = new Date().getDay();
                  const isSessionToday = sessionDayIndex === todayDayIndex;
                  return (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:12, background:isSessionToday?`${session.color}12`:C.sectionBg, borderRadius:12, padding:"10px 14px", borderLeft:`3px solid ${isSessionToday?session.color:C.border}`, opacity: isSessionToday?1:0.75 }}>
                      <div style={{ width:28, height:28, borderRadius:99, background:`${session.color}20`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <span style={{ color:session.color, fontSize:12, fontWeight:800 }}>{weekPlan.days[i]?.slice(0,1) || i+1}</span>
                      </div>
                      <div style={{ flex:1 }}>
                        <p style={{ color:C.text, fontWeight:isSessionToday?800:600, fontSize:14, margin:0 }}>
                          {weekPlan.days[i] || `Session ${i+1}`} — {session.label}
                          {isSessionToday && <span style={{ color:session.color, fontSize:11, fontWeight:700, marginLeft:8 }}>TODAY</span>}
                        </p>
                        <p style={{ color:C.muted, fontSize:12, margin:"2px 0 0" }}>{session.desc}</p>
                      </div>
                      <button onClick={()=>{ setSelectedType(session.type); buildAndShowWorkout(session.type); setView("workout"); }} style={{ background:isSessionToday?session.color:"none", border:`1px solid ${isSessionToday?session.color:C.border}`, borderRadius:8, padding:"6px 12px", color:isSessionToday?"#fff":C.muted, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:FONT, flexShrink:0 }}>Start</button>
                    </div>
                  );
                })}
              </div>

              {/* Rest days */}
              <div style={{ background:C.sectionBg, borderRadius:10, padding:"10px 12px", marginBottom:10 }}>
                <p style={{ color:C.muted, fontSize:12, fontWeight:600, marginBottom:4 }}>💚 REST DAYS ({restDays} per week)</p>
                <p style={{ color:C.textSec, fontSize:12, lineHeight:1.6, margin:0 }}>15–20 min gentle walk · Stretching · Foam rolling · Extra sleep</p>
              </div>

              <p style={{ color:C.muted, fontSize:11, margin:0 }}>Tap Start on any session to build your workout, or choose your own type in the Workout tab.</p>
            </Card>
          );
        })()}


        </>}

      </>}

      {view==="workout"&&<>
        {!activeWorkout&&<>
          {isGuided && (
            <div style={{ background:todaySession?`${todaySession.color}10`:`${C.green}10`, border:`1px solid ${todaySession?`${todaySession.color}30`:`${C.green}30`}`, borderRadius:14, padding:"10px 14px", marginBottom:12, display:"flex", gap:10, alignItems:"center" }}>
              <span style={{ fontSize:18, flexShrink:0 }}>{todaySession ? "💡" : "💚"}</span>
              <p style={{ color:C.text, fontSize:13, margin:0, lineHeight:1.5 }}>
                {todaySession
                  ? <>Your programme has <strong>{todaySession.label}</strong> scheduled today. Choosing a custom workout won't affect your targets.</>
                  : <>Today is a <strong>rest day</strong> in your programme. Training is fine — just make sure to recover well tomorrow.</>
                }
              </p>
            </div>
          )}
          <Card>
            <p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", marginBottom:12 }}>{isGuided ? "CUSTOM WORKOUT" : "CHOOSE WORKOUT"}</p>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
              {Object.entries(WORKOUTS).map(([key,val])=><BigChip key={key} color={val.color} active={selectedType===key} onClick={()=>setSelectedType(key)}>{key.replace(/-/g," ")}</BigChip>)}
            </div>
            <Btn onClick={()=>buildAndShowWorkout(selectedType)} color={WORKOUTS[selectedType].color} style={{ width:"100%" }}>✦ Build My Workout</Btn>
          </Card>
        </>}

        {activeWorkout&&<>
          <div style={{ background:`linear-gradient(135deg, ${activeWorkout.color}, ${activeWorkout.color}88)`, borderRadius:16, padding:"16px 18px", marginBottom:14, color:"#fff" }}>
            <h3 style={{ margin:0, fontSize:20, fontWeight:700 }}>{activeWorkout.title}</h3>
            <p style={{ opacity:0.85, fontSize:13, margin:"4px 0 0" }}>{block.name} Block · Week {weekInBlock+1} · {isDeload?"Deload":block.reps+" reps"}</p>
          </div>
          <Section title={<div style={{display:"flex",alignItems:"center",gap:6}}><Icon name="flame" size={13} color={C.orange} /><span>Warm Up</span></div>}>
            {activeWorkout.warmup.map((x,i)=><Row key={i} label={x} last={i===activeWorkout.warmup.length-1} />)}
          </Section>
          {activeExercises.map((ex,i)=>{
            const isExp = expandedEx === i;
            const fullEx = EXERCISE_DB.find(e=>e.name===ex.name);
            const lastLift = getLastLift(ex.name);
            const allLifts = lifts[ex.name] || [];
            const personalBest = allLifts.length > 0 ? Math.max(...allLifts.map(e => e.weight)) : null;
            const isLogged = loggedWeights[ex.name];
            const loggedEntry = allLifts.length > 0 ? allLifts[allLifts.length - 1] : null;
            const isNewPB = isLogged && loggedEntry && personalBest && loggedEntry.weight >= personalBest;
            const inputs = liftInputs[ex.name] || { weight:"", reps: String(ex.reps?.split("-")?.[0]||"10"), sets: String(ex.sets||"3") };
            const setInput = (field, val) => setLiftInputs(li => ({...li, [ex.name]: {...(li[ex.name]||{weight:"",reps:String(ex.reps?.split("-")?.[0]||"10"),sets:String(ex.sets||"3")}), [field]: val}}));
            return <Card key={i} style={{ borderLeft:`3px solid ${isLogged ? C.green : activeWorkout.color}` }}>
              <div onClick={()=>setExpandedEx(isExp?null:i)} style={{ cursor:"pointer" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <p style={{ color:isLogged?C.green:activeWorkout.color, fontWeight:700, fontSize:16, margin:0 }}>{i+1}. {ex.name}</p>
                      {isLogged&&<span style={{ color:C.green, fontSize:13 }}>✓</span>}
                    </div>
                    <span style={{ color:C.muted, fontSize:12 }}>{ex.equipment} · {ex.muscle}</span>
                    {fullEx?.muscles&&<p style={{ color:C.muted, fontSize:11, margin:"2px 0 0" }}>🎯 {fullEx.muscles}</p>}
                  </div>
                  <div style={{ background:`${isLogged?C.green:activeWorkout.color}15`, borderRadius:10, padding:"8px 12px", textAlign:"right", flexShrink:0 }}>
                    <div style={{ color:C.text, fontSize:16, fontWeight:700 }}>{ex.sets} × {ex.reps}</div>
                    <div style={{ color:C.muted, fontSize:11 }}>Rest: {ex.rest}</div>
                  </div>
                </div>
                {ex.tip&&<div style={{ background:C.sectionBg, borderRadius:8, padding:"8px 12px", fontSize:12, color:C.textSec, borderLeft:`3px solid ${C.yellow}`, marginBottom:6 }}>💬 {ex.tip}</div>}
                <p style={{ color:C.accent, fontSize:12, fontWeight:600, margin:0 }}>{isExp?"▲ Hide instructions":"▼ How to do this exercise"}</p>
              </div>

              {/* Inline weight logger — always visible */}
              <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${C.border}` }}>
                {lastLift&&!isLogged&&<p style={{ color:C.muted, fontSize:11, margin:"0 0 8px" }}>Last time: <span style={{ color:C.accent, fontWeight:600 }}>{lastLift.weight}kg × {lastLift.reps} reps</span></p>}
                {isLogged ? (
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ flex:1, background:`${C.green}10`, border:`1px solid ${C.green}33`, borderRadius:10, padding:"8px 12px" }}>
                      <span style={{ color:C.green, fontSize:13, fontWeight:600 }}>✓ Logged: {inputs.weight}kg × {inputs.reps} reps × {inputs.sets} sets</span>
                      {isNewPB && <p style={{ color:"#f5a623", fontSize:11, fontWeight:600, margin:"4px 0 0" }}>🏆 New personal best!</p>}
                    </div>
                    <button onClick={()=>setLoggedWeights(lw=>({...lw,[ex.name]:false}))} style={{ background:"none", border:"none", color:C.muted, fontSize:12, cursor:"pointer", fontFamily:FONT, padding:"4px 6px" }}>Edit</button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display:"flex", gap:6, marginBottom:8 }}>
                      <div style={{ flex:1 }}>
                        <p style={{ color:C.muted, fontSize:11, margin:"0 0 4px", fontWeight:600 }}>KG</p>
                        <input type="number" value={inputs.weight} onChange={e=>setInput("weight",e.target.value)} placeholder={lastLift?`${lastLift.weight}`:"0"} style={{ width:"100%", background:C.sectionBg, border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 10px", fontSize:14, fontFamily:FONT, color:C.text, outline:"none" }} />
                      </div>
                      <div style={{ flex:1 }}>
                        <p style={{ color:C.muted, fontSize:11, margin:"0 0 4px", fontWeight:600 }}>REPS</p>
                        <input type="number" value={inputs.reps} onChange={e=>setInput("reps",e.target.value)} placeholder="10" style={{ width:"100%", background:C.sectionBg, border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 10px", fontSize:14, fontFamily:FONT, color:C.text, outline:"none" }} />
                      </div>
                      <div style={{ flex:1 }}>
                        <p style={{ color:C.muted, fontSize:11, margin:"0 0 4px", fontWeight:600 }}>SETS</p>
                        <input type="number" value={inputs.sets} onChange={e=>setInput("sets",e.target.value)} placeholder="3" style={{ width:"100%", background:C.sectionBg, border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 10px", fontSize:14, fontFamily:FONT, color:C.text, outline:"none" }} />
                      </div>
                    </div>
                    <button onClick={()=>saveLift(ex.name, inputs.weight, inputs.reps, inputs.sets)} disabled={!inputs.weight} style={{ width:"100%", background:inputs.weight?C.green:C.sectionBg, border:"none", borderRadius:10, padding:"9px 0", color:inputs.weight?"#fff":C.muted, fontSize:13, fontWeight:700, cursor:inputs.weight?"pointer":"default", fontFamily:FONT, transition:"all 0.2s" }}>
                      Log Weight
                    </button>
                  </div>
                )}
              </div>

              {isExp&&fullEx&&<div style={{ marginTop:12 }}>
                <div style={{ background:C.sectionBg, borderRadius:10, padding:"12px 14px", marginBottom:8 }}>
                  <p style={{ color:C.muted, fontSize:11, fontWeight:700, letterSpacing:"0.06em", marginBottom:8 }}>STEP-BY-STEP</p>
                  {fullEx.steps.map((s,j)=><div key={j} style={{ display:"flex", gap:10, marginBottom:6 }}>
                    <div style={{ width:20, height:20, borderRadius:99, background:activeWorkout.color, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                      <span style={{ color:"#fff", fontSize:10, fontWeight:700 }}>{j+1}</span>
                    </div>
                    <p style={{ color:C.text, fontSize:13, lineHeight:1.6, margin:0 }}>{s}</p>
                  </div>)}
                </div>
                {fullEx.mistakes&&<div style={{ background:`${C.red}08`, border:`1px solid ${C.red}22`, borderRadius:10, padding:"12px 14px", marginBottom:8 }}>
                  <p style={{ color:C.red, fontSize:11, fontWeight:700, letterSpacing:"0.06em", marginBottom:6 }}>⚠️ COMMON MISTAKES</p>
                  {fullEx.mistakes.map((m,j)=><p key={j} style={{ color:C.textSec, fontSize:13, lineHeight:1.5, margin:"0 0 4px" }}>· {m}</p>)}
                </div>}
                <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name+" exercise technique")}`} target="_blank" rel="noopener noreferrer" style={{ display:"block", background:C.sectionBg, borderRadius:10, padding:"10px 14px", textDecoration:"none", textAlign:"center" }}>
                  <span style={{ color:C.accent, fontSize:13, fontWeight:600 }}>▶ Watch technique on YouTube</span>
                </a>
              </div>}
            </Card>;
          })}
          {activeExercises.length===0&&<Card><p style={{ color:C.muted, textAlign:"center", fontSize:14 }}>No exercises match your equipment. Try selecting more equipment in Profile → Fitness.</p></Card>}
          <Section title={<div style={{display:"flex",alignItems:"center",gap:6}}><Icon name="snowflake" size={13} color={C.teal} /><span>Cool Down</span></div>}>
            {activeWorkout.cooldown.map((x,i)=><Row key={i} label={x} last={i===activeWorkout.cooldown.length-1} />)}
          </Section>
          <Card style={{ background:`${activeWorkout.color}08`, borderColor:`${activeWorkout.color}33` }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}><Icon name="medal" size={14} color={activeWorkout.color} /><p style={{ color:activeWorkout.color, fontSize:12, fontWeight:700, margin:0 }}>COACH NOTES</p></div>
            <p style={{ color:C.text, fontSize:13, lineHeight:1.75, margin:0 }}>{activeWorkout.note}</p>
          </Card>
          <div style={{ display:"flex", gap:8 }}>
            <Btn onClick={()=>setActiveWorkout(null)} outline color={C.accent} style={{ width:"100%" }}>← Back to workout selection</Btn>
          </div>
        </>}
      </>}

      {view==="lifts"&&<LiftTracker lifts={lifts} setLifts={setLifts} workoutLog={workoutLog} />}
    </div>
  );
};

// ── PROFILE TAB ───────────────────────────────────────────────────────────────
const ProfileTab = ({ profile, setProfile, onReset, isDark, darkOverride, setDarkOverride, isPro, proData, onUpgrade, user, onShowAuth, onClearMealPlan, avatarUrl, setAvatarUrl }) => {
  const [editing, setEditing] = useState(null);
  const [tempData, setTempData] = useState({});
  const [showChangePw, setShowChangePw] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [showMealPlanNudge, setShowMealPlanNudge] = useState(false);
  // avatarUrl/setAvatarUrl lifted to App level (persists across tab switches)
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showCropModal, setShowCropModal] = useState(null);
  const croppieRef = React.useRef(null);

  // Load avatar on mount
  useEffect(() => {
    if (!user?.id) return;
    const loadAvatar = async () => {
      // Public bucket — just check if file exists by trying to fetch the public URL
      const { data } = supabase.storage.from("progress-photos").getPublicUrl(`${user.id}/avatar.jpg`);
      if (data?.publicUrl) {
        // Verify file actually exists with a HEAD request
        try {
          const res = await fetch(data.publicUrl, { method: "HEAD" });
          if (res.ok) setAvatarUrl(data.publicUrl);
        } catch(e) {}
      }
    };
    loadAvatar();
  }, [user?.id]);

  // Load croppie dynamically
  const loadCroppie = () => new Promise((resolve) => {
    if (window.Croppie) return resolve();
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://cdnjs.cloudflare.com/ajax/libs/croppie/2.6.5/croppie.min.css";
    document.head.appendChild(css);
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/croppie/2.6.5/croppie.min.js";
    script.onload = resolve;
    document.head.appendChild(script);
  });

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    e.target.value = "";
    await loadCroppie();
    const objectUrl = URL.createObjectURL(file);
    setShowCropModal({ url: objectUrl });
  };

  const handleCropSave = async () => {
    if (!showCropModal || !croppieRef.current) return;
    setAvatarUploading(true);
    try {
      // Get blob BEFORE closing modal (closing destroys croppie instance)
      const blob = await croppieRef.current.result({ type: "blob", size: { width: 400, height: 400 }, format: "jpeg", quality: 0.9 });
      setShowCropModal(null); // close modal after getting result
      const path = `${user.id}/avatar.jpg`;
      const { error } = await supabase.storage.from("progress-photos").upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (!error) {
        const { data } = supabase.storage.from("progress-photos").getPublicUrl(path);
        if (data?.publicUrl) setAvatarUrl(data.publicUrl);
      } else {
        console.error("Avatar upload error:", error);
      }
    } catch(e) { console.error("Avatar crop/upload error:", e); }
    setAvatarUploading(false);
  };

  const handleCropCancel = () => {
    if (croppieRef.current) { croppieRef.current.destroy(); croppieRef.current = null; }
    setShowCropModal(null);
  };

  const initials = (profile.name || "?").split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase();
  const toggleArr = (k,v) => setTempData(d=>({...d,[k]:d[k].includes(v)?d[k].filter(x=>x!==v):[...d[k],v]}));
  const startEdit = (s) => { setTempData({...profile}); setEditing(s); };
  const save = () => {
    // If meal plan length changed, clear the existing plan so user regenerates
    if (tempData.mealPlanDays && tempData.mealPlanDays !== profile.mealPlanDays) {
      onClearMealPlan?.();
    }
    // If workout frequency, diet, goal or pace changed, nudge user to regenerate meal plan
    const mealRelevantChanged = (
      tempData.workoutsPerWeek !== profile.workoutsPerWeek ||
      tempData.goal !== profile.goal ||
      tempData.paceId !== profile.paceId ||
      tempData.dietType !== profile.dietType ||
      tempData.dairyPref !== profile.dairyPref ||
      tempData.glutenPref !== profile.glutenPref
    );
    if (mealRelevantChanged) {
      setShowMealPlanNudge(true);
    }
    setProfile({...profile,...tempData});
    setEditing(null);
  };

  if (showChangePw) return (
    <div style={{ padding:"0 20px", maxWidth:480, margin:"0 auto" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:28, paddingTop:8 }}>
        <button onClick={()=>{ setShowChangePw(false); setNewPw(""); setConfirmPw(""); setPwError(null); setPwSuccess(false); }} style={{ background:"none", border:"none", color:C.accent, fontSize:16, cursor:"pointer", fontFamily:FONT }}>←</button>
        <h2 style={{ color:C.text, fontSize:20, fontWeight:700, margin:0 }}>Change Password</h2>
      </div>

      {pwSuccess ? (
        <div style={{ textAlign:"center", padding:"40px 0" }}>
          <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
          <h3 style={{ color:C.text, fontSize:20, fontWeight:700, marginBottom:8 }}>Password updated!</h3>
          <p style={{ color:C.muted, fontSize:15 }}>Your new password is saved.</p>
          <Btn color={C.accent} onClick={()=>{ setShowChangePw(false); setNewPw(""); setConfirmPw(""); setPwSuccess(false); }} style={{ marginTop:24 }}>Done</Btn>
        </div>
      ) : (
        <>
          <div style={{ marginBottom:14 }}>
            <p style={{ color:C.textSec, fontSize:13, fontWeight:500, marginBottom:6 }}>New password</p>
            <TInput
              value={newPw}
              onChange={e=>setNewPw(e.target.value)}
              placeholder="Min 6 characters"
              type="password"
              autoComplete="new-password"
            />
          </div>
          <div style={{ marginBottom:20 }}>
            <p style={{ color:C.textSec, fontSize:13, fontWeight:500, marginBottom:6 }}>Confirm password</p>
            <TInput
              value={confirmPw}
              onChange={e=>setConfirmPw(e.target.value)}
              placeholder="Repeat new password"
              type="password"
              autoComplete="new-password"
            />
          </div>
          {pwError && <div style={{ background:`${C.red}10`, border:`1px solid ${C.red}33`, borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
            <p style={{ color:C.red, fontSize:13, margin:0 }}>{pwError}</p>
          </div>}
          <Btn color={C.accent} disabled={pwLoading} onClick={async()=>{
            if (!newPw || newPw.length < 6) { setPwError("Password must be at least 6 characters"); return; }
            if (newPw !== confirmPw) { setPwError("Passwords don't match"); return; }
            setPwLoading(true); setPwError(null);
            const { error } = await supabase.auth.updateUser({ password: newPw });
            if (error) { setPwError(error.message); setPwLoading(false); return; }
            setPwSuccess(true); setPwLoading(false);
          }} style={{ width:"100%" }}>
            {pwLoading ? "Updating..." : "Update Password"}
          </Btn>
        </>
      )}
    </div>
  );

  if (editing) return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
        <button onClick={()=>setEditing(null)} style={{ background:"none", border:"none", color:C.accent, fontSize:16, cursor:"pointer", fontFamily:FONT }}>←</button>
        <h2 style={{ color:C.text, fontSize:20, fontWeight:700, margin:0, flex:1 }}>Edit {editing}</h2>
        <Btn onClick={save} small color={C.accent}>Save</Btn>
      </div>

      {editing==="fitness"&&<>
        <div style={{ marginBottom:20 }}>
          <p style={{ color:C.muted, fontSize:13, fontWeight:600, marginBottom:10 }}>FITNESS LEVEL</p>
          {[["beginner","Beginner","New to exercise or returning after a break"],["intermediate","Intermediate","Exercise 1-3x per week, some experience"],["active","Active","Regular training 3-5x per week"],["athlete","Athlete","Advanced training 5+ times per week"]].map(([val,label,desc])=>(
            <div key={val} onClick={()=>setTempData(d=>({...d,fitnessLevel:val}))} style={{ background:tempData.fitnessLevel===val?`${C.accent}12`:C.card, border:`1.5px solid ${tempData.fitnessLevel===val?C.accent:C.border}`, borderRadius:14, padding:"12px 16px", marginBottom:8, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <p style={{ color:C.text, fontWeight:600, fontSize:15, margin:0 }}>{label}</p>
                <p style={{ color:C.muted, fontSize:13, margin:"2px 0 0" }}>{desc}</p>
              </div>
              {tempData.fitnessLevel===val && <span style={{ color:C.accent, fontSize:18 }}>✓</span>}
            </div>
          ))}
        </div>
        <div style={{ marginBottom:20 }}>
          <p style={{ color:C.muted, fontSize:13, fontWeight:600, marginBottom:10 }}>INJURIES / LIMITATIONS</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
            {[["none","No limitations"],["back","Lower back"],["knees","Knees"],["hips","Hips"],["shoulders","Shoulders"],["wrists","Wrists"],["ankles","Ankles"]].map(([val,label])=>(
              <BigChip key={val} color={C.orange} active={tempData.injuries?.includes(val)} onClick={()=>{
                const without = (tempData.injuries||[]).filter(x=>x!=="none");
                if (val==="none") setTempData(d=>({...d,injuries:["none"]}));
                else if (without.includes(val)) setTempData(d=>({...d,injuries:without.filter(x=>x!==val)}));
                else setTempData(d=>({...d,injuries:[...without,val]}));
              }}>{label}</BigChip>
            ))}
          </div>
        </div>
        <div>
          <p style={{ color:C.muted, fontSize:13, fontWeight:600, marginBottom:10 }}>EQUIPMENT</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
            {[["gym_machines","Gym machines"],["dumbbells","Dumbbells"],["barbell","Barbell"],["cables","Cable machine"],["rowing","Rowing machine"],["crosstrainer","Cross trainer"],["treadmill","Treadmill"],["bike","Exercise bike"],["resistance_bands","Resistance bands"],["bodyweight","Bodyweight only"]].map(([val,label])=>(
              <BigChip key={val} color={C.green} active={tempData.equipment?.includes(val)} onClick={()=>{
                const eq = tempData.equipment||[];
                setTempData(d=>({...d,equipment:eq.includes(val)?eq.filter(x=>x!==val):[...eq,val]}));
              }}>{label}</BigChip>
            ))}
          </div>
        </div>
      </>}

      {editing==="goal"&&<>
        {[["lose_weight","🎯","Lose weight"],["build_muscle","💪","Build muscle"],["get_fitter","🏃","Get fitter"],["all","⭐","All of the above"]].map(([val,ico,title])=>(
          <Card key={val} onClick={()=>setTempData(d=>({...d,goal:val}))} style={{ borderColor:tempData.goal===val?C.accent:C.border, borderWidth:tempData.goal===val?2:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontSize:24 }}>{ico}</span><span style={{ color:C.text, fontWeight:600 }}>{title}</span>
              {tempData.goal===val&&<span style={{ marginLeft:"auto", color:C.accent }}>✓</span>}
            </div>
          </Card>
        ))}
      </>}

      {editing==="weight"&&<>
        <p style={{ color:C.muted, fontSize:14, marginBottom:16 }}>Update your weight target and pace</p>
        <div style={{ marginBottom:14 }}>
          <p style={{ color:C.muted, fontSize:13, marginBottom:8 }}>Weight loss target</p>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {[3,5,7,10,15,20].map(kg=>{ const lbs=parseFloat((kg*2.20462).toFixed(1)); return <BigChip key={kg} color={C.accent} active={Math.abs((tempData.targetLbs||0)-lbs)<0.6} onClick={()=>setTempData(d=>({...d,targetLbs:lbs}))}>{kg} kg</BigChip>; })}
          </div>
        </div>
        <div>
          <p style={{ color:C.textSec, fontSize:13, fontWeight:500, marginBottom:8 }}>Weekly pace</p>
          <PacePicker value={tempData.paceId||"normal"} onChange={v=>setTempData(d=>({...d,paceId:v}))} targetLbs={tempData.targetLbs||14} />
        </div>
      </>}

      {editing==="details"&&<>
        <div style={{ display:"flex", gap:10, marginBottom:14 }}>
          <div style={{ flex:1 }}><p style={{ color:C.textSec, fontSize:13, fontWeight:500, marginBottom:6 }}>Height (cm)</p><TInput value={tempData.heightCm||""} onChange={e=>setTempData(d=>({...d,heightCm:e.target.value}))} placeholder="e.g. 178" type="number" /></div>
          <div style={{ flex:1 }}><p style={{ color:C.textSec, fontSize:13, fontWeight:500, marginBottom:6 }}>Age</p><TInput value={tempData.age||""} onChange={e=>setTempData(d=>({...d,age:e.target.value}))} placeholder="e.g. 53" type="number" /></div>
        </div>
        <div style={{ marginBottom:14 }}>
          <p style={{ color:C.muted, fontSize:13, marginBottom:10 }}>Biological sex</p>
          <div style={{ display:"flex", gap:10 }}>
            {[["male","Male"],["female","Female"]].map(([v,l])=><BigChip key={v} color={C.accent} active={tempData.sex===v} onClick={()=>setTempData(d=>({...d,sex:v}))}>{l}</BigChip>)}
          </div>
        </div>
        <div>
          <p style={{ color:C.muted, fontSize:13, marginBottom:10 }}>Workouts per week</p>
          <div style={{ display:"flex", gap:10 }}>
            {[2,3,4,5].map(n=><BigChip key={n} color={C.purple} active={tempData.workoutsPerWeek===n} onClick={()=>setTempData(d=>({...d,workoutsPerWeek:n}))}>{n}x</BigChip>)}
          </div>
        </div>
      </>}

      {editing==="allergies"&&<>
        <p style={{ color:C.muted, fontSize:14, marginBottom:16 }}>Select all that apply</p>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {ALLERGENS.map(a=><BigChip key={a} color={C.red} active={tempData.allergies.includes(a)} onClick={()=>toggleArr("allergies",a)}>{a}</BigChip>)}
        </div>
      </>}

      {editing==="dislikes"&&<>
        <p style={{ color:C.muted, fontSize:14, marginBottom:16 }}>Foods to exclude from meal plans</p>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {DISLIKES_LIST.map(d=><BigChip key={d} color={C.orange} active={tempData.dislikes.includes(d)} onClick={()=>toggleArr("dislikes",d)}>{d}</BigChip>)}
        </div>
      </>}

      {editing==="milkalt"&&<>
        <p style={{ color:C.muted, fontSize:14, marginBottom:20 }}>Which milk alternative do you prefer? This will be used in recipes, smoothies and cereals.</p>
        {[["soya","Soya milk","High protein, neutral taste"],["oat","Oat milk","Creamy, naturally sweet — check GF if needed"],["almond","Almond milk","Light, mild nutty flavour"],["coconut","Coconut milk","Rich and creamy, great for cooking"],["rice","Rice milk","Mild and slightly sweet, thinner texture"]].map(([val,label,desc])=>(
          <div key={val} onClick={()=>setTempData(d=>({...d,milkAlt:val}))} style={{ background:tempData.milkAlt===val?`${C.accent}12`:C.card, border:`1.5px solid ${tempData.milkAlt===val?C.accent:C.border}`, borderRadius:14, padding:"12px 16px", marginBottom:10, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <p style={{ color:C.text, fontWeight:600, fontSize:15, margin:0 }}>{label}</p>
              <p style={{ color:C.muted, fontSize:13, margin:"2px 0 0" }}>{desc}</p>
            </div>
            {tempData.milkAlt===val && <span style={{ color:C.accent, fontSize:18 }}>✓</span>}
          </div>
        ))}
      </>}

      {editing==="cookingtime"&&<>
        <p style={{ color:C.muted, fontSize:14, marginBottom:20 }}>How long are you happy to spend preparing a meal? This affects the recipes we generate for you.</p>
        {[
          ["quick",   "Quick",           "15 minutes max — minimal prep, simple assembly"],
          ["moderate","Moderate",        "Around 30 minutes — proper cooking but nothing complex"],
          ["enjoy",   "I enjoy cooking", "Up to an hour — happy to try more involved recipes"],
        ].map(([val, label, desc]) => (
          <div key={val} onClick={()=>setTempData(d=>({...d, cookingTime:val}))} style={{ background:tempData.cookingTime===val?`${C.accent}12`:C.card, border:`1.5px solid ${tempData.cookingTime===val?C.accent:C.border}`, borderRadius:14, padding:"14px 16px", marginBottom:10, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <p style={{ color:C.text, fontWeight:600, fontSize:15, margin:0 }}>{label}</p>
              <p style={{ color:C.muted, fontSize:13, margin:"2px 0 0" }}>{desc}</p>
            </div>
            {tempData.cookingTime===val && <span style={{ color:C.accent, fontSize:18 }}>✓</span>}
          </div>
        ))}
        <div style={{ background:`${C.accent}10`, border:`1px solid ${C.accent}22`, borderRadius:12, padding:"10px 14px", marginTop:4 }}>
          <p style={{ color:C.accent, fontSize:13, margin:0 }}>💡 Regenerate your meal plan after saving to apply the new cooking time.</p>
        </div>
      </>}

      {editing==="mealplan"&&<>
        <p style={{ color:C.muted, fontSize:14, marginBottom:20 }}>How many days would you like your meal plan to cover? Your shopping list is built from the full plan.</p>
        {[
          [1, "Every day", "Plan one day at a time"],
          [3, "3 days", "Shop a couple of times a week"],
          [5, "5 days", "One big weekday shop"],
          [7, "7 days", "One big weekly shop"],
        ].map(([days, label, desc]) => (
          <div key={days} onClick={()=>setTempData(d=>({...d, mealPlanDays:days}))} style={{ background:tempData.mealPlanDays===days?`${C.accent}12`:C.card, border:`1.5px solid ${tempData.mealPlanDays===days?C.accent:C.border}`, borderRadius:14, padding:"14px 16px", marginBottom:10, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <p style={{ color:C.text, fontWeight:600, fontSize:15, margin:0 }}>{label}</p>
              <p style={{ color:C.muted, fontSize:13, margin:"2px 0 0" }}>{desc}</p>
            </div>
            {tempData.mealPlanDays===days && <span style={{ color:C.accent, fontSize:18 }}>✓</span>}
          </div>
        ))}
        {tempData.mealPlanDays !== (profile.mealPlanDays||5) && (
          <div style={{ background:`${C.green}12`, border:`1px solid ${C.green}33`, borderRadius:12, padding:"10px 14px", marginTop:4 }}>
            <p style={{ color:C.green, fontSize:13, margin:0 }}>✓ Saving will clear your current plan — a new {tempData.mealPlanDays}-day plan will be ready to generate.</p>
          </div>
        )}
      </>}

      {editing==="name"&&<>
        <p style={{ color:C.muted, fontSize:14, marginBottom:16 }}>What should we call you?</p>
        <TInput value={tempData.name||""} onChange={e=>setTempData(d=>({...d,name:e.target.value}))} placeholder="Your first name" />
      </>}

      {editing==="diet"&&<>
        <div style={{ marginBottom:20 }}>
          <p style={{ color:C.muted, fontSize:13, fontWeight:600, marginBottom:10 }}>DIET TYPE</p>
          {[["omnivore","Omnivore","Eat everything"],["pescatarian","Pescatarian","Fish and seafood, no meat"],["vegetarian","Vegetarian","No meat or fish"],["vegan","Vegan","No animal products"]].map(([val,label,desc])=>(
            <div key={val} onClick={()=>setTempData(d=>({...d,dietType:val}))} style={{ background:tempData.dietType===val?`${C.accent}12`:C.card, border:`1.5px solid ${tempData.dietType===val?C.accent:C.border}`, borderRadius:14, padding:"12px 16px", marginBottom:8, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div><p style={{ color:C.text, fontWeight:600, fontSize:15, margin:0 }}>{label}</p><p style={{ color:C.muted, fontSize:13, margin:"2px 0 0" }}>{desc}</p></div>
              {tempData.dietType===val && <span style={{ color:C.accent, fontSize:18 }}>✓</span>}
            </div>
          ))}
        </div>
        <div style={{ marginBottom:20 }}>
          <p style={{ color:C.muted, fontSize:13, fontWeight:600, marginBottom:10 }}>DAIRY</p>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {[["full_dairy","Full dairy"],["lactose_free","Lactose-free"],["dairy_free","Dairy-free"]].map(([val,label])=>(
              <BigChip key={val} color={C.accent} active={tempData.dairyPref===val} onClick={()=>setTempData(d=>({...d,dairyPref:val}))}>{label}</BigChip>
            ))}
          </div>
        </div>
        <div>
          <p style={{ color:C.muted, fontSize:13, fontWeight:600, marginBottom:10 }}>GLUTEN</p>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {[["regular","Regular"],["gluten_free","Gluten-free"]].map(([val,label])=>(
              <BigChip key={val} color={C.accent} active={tempData.glutenPref===val} onClick={()=>setTempData(d=>({...d,glutenPref:val}))}>{label}</BigChip>
            ))}
          </div>
        </div>
        <div style={{ background:`${C.orange}12`, border:`1px solid ${C.orange}33`, borderRadius:12, padding:"10px 14px", marginTop:14 }}>
          <p style={{ color:C.orange, fontSize:13, margin:0 }}>⚠️ Regenerate your meal plan after saving to apply changes.</p>
        </div>
      </>}

      {editing==="supplements"&&<>
        <div style={{ marginBottom:20 }}>
          <p style={{ color:C.muted, fontSize:13, fontWeight:600, marginBottom:10 }}>SUPPLEMENT PREFERENCE</p>
          {[["yes","Yes — I'm open to them","Show me what's relevant to my goals"],["maybe","Maybe — tell me more","I'd like to learn before deciding"],["no","No thanks — food only","I prefer to get everything from diet"]].map(([val,label,desc])=>(
            <div key={val} onClick={()=>setTempData(d=>({...d,supplementsOpen:val}))} style={{ background:tempData.supplementsOpen===val?`${C.accent}12`:C.card, border:`1.5px solid ${tempData.supplementsOpen===val?C.accent:C.border}`, borderRadius:14, padding:"12px 16px", marginBottom:8, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div><p style={{ color:C.text, fontWeight:600, fontSize:15, margin:0 }}>{label}</p><p style={{ color:C.muted, fontSize:13, margin:"2px 0 0" }}>{desc}</p></div>
              {tempData.supplementsOpen===val && <span style={{ color:C.accent, fontSize:18 }}>✓</span>}
            </div>
          ))}
        </div>
        {(tempData.supplementsOpen==="yes"||tempData.supplementsOpen==="maybe")&&<div>
          <p style={{ color:C.muted, fontSize:13, fontWeight:600, marginBottom:10 }}>INTERESTED IN</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
            {[["creatine","Creatine"],["protein","Protein powder"],["vitd","Vitamin D3+K2"],["omega3","Omega-3"],["magnesium","Magnesium"],["multivitamin","Multivitamin"],["collagen","Collagen"],["probiotics","Probiotics"]].map(([val,label])=>(
              <BigChip key={val} color={C.purple} active={tempData.supplementsInterested?.includes(val)} onClick={()=>{
                const curr = tempData.supplementsInterested||[];
                setTempData(d=>({...d,supplementsInterested:curr.includes(val)?curr.filter(x=>x!==val):[...curr,val]}));
              }}>{label}</BigChip>
            ))}
          </div>
        </div>}
      </>}

      {editing==="appmode"&&<>
        <p style={{ color:C.muted, fontSize:14, marginBottom:20 }}>Choose how you want LeanPlan to work for you.</p>
        <div onClick={()=>setTempData(d=>({...d,appMode:"guided"}))} style={{ background:tempData.appMode==="guided"?`${C.accent}12`:C.card, border:`1.5px solid ${tempData.appMode==="guided"?C.accent:C.border}`, borderRadius:16, padding:"16px", marginBottom:12, cursor:"pointer" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
            <p style={{ color:C.text, fontWeight:700, fontSize:16, margin:0 }}>🎯 Guided</p>
            {tempData.appMode==="guided" && <span style={{ color:C.accent, fontSize:18 }}>✓</span>}
          </div>
          <p style={{ color:C.muted, fontSize:13, margin:0, lineHeight:1.6 }}>LeanPlan builds your complete programme — personalised meal plans, structured workouts and shopping lists.</p>
        </div>
        <div style={{ background:C.card, border:`1.5px solid ${C.border}`, borderRadius:16, padding:"16px", opacity:0.5 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
            <p style={{ color:C.text, fontWeight:700, fontSize:16, margin:0 }}>⚙️ Custom</p>
            <span style={{ color:C.orange, fontSize:12, fontWeight:600 }}>Coming soon</span>
          </div>
          <p style={{ color:C.muted, fontSize:13, margin:0, lineHeight:1.6 }}>Log your own meals and workouts. Use LeanPlan as a flexible tracking tool.</p>
        </div>
      </>}

      {editing==="lifestyle"&&<>
        <div style={{ marginBottom:20 }}>
          <p style={{ color:C.muted, fontSize:13, fontWeight:600, marginBottom:10 }}>ACTIVITY LEVEL (outside workouts)</p>
          {[["sedentary","Sedentary","Desk job, mostly sitting"],["light","Lightly active","Some walking, light activity"],["moderate","Moderately active","On feet a lot, active job"],["very","Very active","Physical job or very active lifestyle"]].map(([val,label,desc])=>(
            <div key={val} onClick={()=>setTempData(d=>({...d,activityLevel:val}))} style={{ background:tempData.activityLevel===val?`${C.accent}12`:C.card, border:`1.5px solid ${tempData.activityLevel===val?C.accent:C.border}`, borderRadius:14, padding:"12px 16px", marginBottom:8, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div><p style={{ color:C.text, fontWeight:600, fontSize:15, margin:0 }}>{label}</p><p style={{ color:C.muted, fontSize:13, margin:"2px 0 0" }}>{desc}</p></div>
              {tempData.activityLevel===val && <span style={{ color:C.accent, fontSize:18 }}>✓</span>}
            </div>
          ))}
        </div>
        <div>
          <p style={{ color:C.muted, fontSize:13, fontWeight:600, marginBottom:10 }}>WORKOUT STYLE</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
            {[["mixed","Mixed"],["weights","Weights"],["cardio","Cardio"],["home","Home workouts"],["classes","Classes"]].map(([val,label])=>(
              <span key={val} onClick={()=>setTempData(d=>({...d,workoutStyle:val}))} style={{ background:tempData.workoutStyle===val?C.accent:`${C.accent}12`, color:tempData.workoutStyle===val?"#fff":C.accent, border:`1.5px solid ${tempData.workoutStyle===val?C.accent:`${C.accent}55`}`, borderRadius:99, padding:"10px 20px", fontSize:15, fontWeight:600, cursor:"pointer", transition:"all 0.2s", display:"inline-block" }}>{label}</span>
            ))}
          </div>
        </div>
      </>}

    </div>
  );

  const tdee = calcTDEE(profile);
  const bmi = calcBMI(profile);

  return (
    <div>
      <div style={{ textAlign:"center", padding:"24px 0 20px" }}>
        <div style={{ position:"relative", width:88, height:88, margin:"0 auto 12px" }}>
          <label htmlFor="avatar-upload" style={{ cursor:"pointer", display:"block" }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" style={{ width:88, height:88, borderRadius:99, objectFit:"cover", border:`3px solid ${C.accent}`, display:"block" }} />
            ) : (
              <div style={{ width:88, height:88, borderRadius:99, background:`linear-gradient(135deg, ${C.accent}, ${C.purple})`, display:"flex", alignItems:"center", justifyContent:"center", border:`3px solid ${C.accent}` }}>
                <span style={{ color:"#fff", fontSize:28, fontWeight:700 }}>{initials}</span>
              </div>
            )}
          </label>
          <label htmlFor="avatar-upload" style={{ position:"absolute", bottom:0, right:0, width:26, height:26, borderRadius:99, background:C.accent, border:`2px solid ${C.bg}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            {avatarUploading ? <span style={{ fontSize:10, color:"#fff" }}>...</span> : <span style={{ fontSize:13 }}>📷</span>}
          </label>
          <input id="avatar-upload" type="file" accept="image/*" style={{ display:"none" }} onChange={handleAvatarUpload} />
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          <h2 style={{ color:C.text, fontSize:22, fontWeight:700, margin:0 }}>{profile.name||"Your Profile"}</h2>
          <button onClick={()=>startEdit("name")} style={{ background:"none", border:"none", color:C.accent, fontSize:13, cursor:"pointer", fontFamily:FONT, padding:"2px 6px" }}>Edit</button>
        </div>
        <p style={{ color:C.muted, fontSize:14, margin:"4px 0 0" }}>Age {profile.age||"—"} · {profile.sex||""}</p>
        {tdee&&<p style={{ color:C.accent, fontSize:14, margin:"4px 0 0", fontWeight:600 }}>TDEE: {tdee} cal · BMI: {bmi}</p>}
      </div>

      {showMealPlanNudge && (
        <div style={{ background:`${C.orange}12`, border:`1px solid ${C.orange}33`, borderRadius:12, padding:"12px 14px", marginBottom:14, display:"flex", gap:10, alignItems:"flex-start" }}>
          <span style={{ fontSize:16, flexShrink:0 }}>🍽️</span>
          <div style={{ flex:1 }}>
            <p style={{ color:C.text, fontWeight:600, fontSize:13, margin:"0 0 2px" }}>Regenerate your meal plan</p>
            <p style={{ color:C.muted, fontSize:12, margin:"0 0 8px", lineHeight:1.5 }}>Your changes affect calorie targets and training days. Regenerate for an updated plan.</p>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>{ onClearMealPlan?.(); setShowMealPlanNudge(false); }} style={{ background:C.orange, border:"none", borderRadius:8, padding:"6px 14px", color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:FONT }}>Regenerate now</button>
              <button onClick={()=>setShowMealPlanNudge(false)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 14px", color:C.muted, fontSize:12, cursor:"pointer", fontFamily:FONT }}>Later</button>
            </div>
          </div>
        </div>
      )}

      <Section title="Goals">
        <Row label="Main goal" value={profile.goal?.replace("_"," ")} onClick={()=>startEdit("goal")} />
        <Row label="Weight target" value={`${toKg(profile.startWeightLbs - profile.targetLbs)} kg target`} onClick={()=>startEdit("weight")} />
        <Row label="Weekly pace" value={`${getPace(profile.paceId||"normal").kgPerWk} kg/wk — ${getPace(profile.paceId||"normal").label}`} onClick={()=>startEdit("weight")} last />
      </Section>

      <Section title="My Details">
        <Row label="Name" value={profile.name||"Not set"} onClick={()=>startEdit("name")} />
        <Row label="Age" value={profile.age||"Not set"} onClick={()=>startEdit("details")} />
        <Row label="Sex" value={profile.sex||"Not set"} onClick={()=>startEdit("details")} />
        <Row label="Height" value={profile.heightCm?`${profile.heightCm} cm`:"Not set"} onClick={()=>startEdit("details")} />
        <Row label="Workouts/week" value={`${profile.workoutsPerWeek}x`} onClick={()=>startEdit("details")} last />
      </Section>

      <Section title="Fitness">
        <Row label="Fitness level" value={profile.fitnessLevel||"Not set"} onClick={()=>startEdit("fitness")} />
        <Row label="Injuries / limitations" value={profile.injuries?.length>0?profile.injuries.join(", "):"None"} onClick={()=>startEdit("fitness")} />
        <Row label="Equipment" value={profile.equipment?.length>0?`${profile.equipment.length} items`:"Not set"} onClick={()=>startEdit("fitness")} last />
      </Section>

      <Section title="Diet & Meals">
        <Row label="Diet type" value={profile.dietType||"omnivore"} onClick={()=>startEdit("diet")} />
        <Row label="Dairy" value={profile.dairyPref?.replace(/_/g," ")||"Not set"} onClick={()=>startEdit("diet")} />
        {(profile.dairyPref==="dairy_free"||profile.dairyPref==="lactose_free")&&<Row label="Milk alternative" value={profile.milkAlt||"Not set"} onClick={()=>startEdit("milkalt")} />}
        <Row label="Gluten" value={profile.glutenPref?.replace(/_/g," ")||"Not set"} onClick={()=>startEdit("diet")} />
        <Row label="Allergies" value={profile.allergies?.length>0?`${profile.allergies.length} selected`:"None"} onClick={()=>startEdit("allergies")} />
        <Row label="Dislikes" value={profile.dislikes?.length>0?`${profile.dislikes.length} foods`:"None"} onClick={()=>startEdit("dislikes")} />
        <Row label="Cooking time" value={{"quick":"Quick (15 min)","moderate":"Moderate (30 min)","enjoy":"I enjoy cooking (1hr)"}[profile.cookingTime||"moderate"]} onClick={()=>startEdit("cookingtime")} />
        <Row label="Meal plan length" value={`${profile.mealPlanDays||5} days`} onClick={()=>startEdit("mealplan")} last />
      </Section>

      <Section title="Supplements">
        <Row label="Supplement preference" value={{"yes":"Open to supplements","maybe":"Maybe","no":"Food only"}[profile.supplementsOpen||"maybe"]} onClick={()=>startEdit("supplements")} />
        <Row label="Interested in" value={profile.supplementsInterested?.length>0?profile.supplementsInterested.join(", "):"None selected"} onClick={()=>startEdit("supplements")} last />
      </Section>

      <Section title="Lifestyle">
        <Row label="Activity level" value={{"sedentary":"Sedentary","light":"Lightly active","moderate":"Moderately active","very":"Very active"}[profile.activityLevel||"moderate"]} onClick={()=>startEdit("lifestyle")} />
        <Row label="Workout style" value={profile.workoutStyle||"mixed"} onClick={()=>startEdit("lifestyle")} last />
      </Section>

      <Section title="App Mode">
        <Row label="Mode" value={profile.appMode==="custom"?"Custom (coming soon)":"Guided"} onClick={()=>startEdit("appmode")} />
        <Row label="About" value={profile.appMode==="guided"?"LeanPlan plans everything for you":"Log your own meals and workouts"} color={C.muted} last />
      </Section>

      <Section title="Appearance">
        <div style={{ padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:20 }}>{isDark ? "🌙" : "☀️"}</span>
            <div>
              <p style={{ color:C.text, fontSize:15, margin:0 }}>Dark Mode</p>
              <p style={{ color:C.muted, fontSize:12, margin:"2px 0 0" }}>{darkOverride===null?"Following system":darkOverride?"Always on":"Always off"}</p>
            </div>
          </div>
          <Toggle value={isDark} onChange={v => setDarkOverride(v)} />
        </div>
        <div style={{ padding:"0 16px 14px", display:"flex", gap:8 }}>
          {[["📱","Auto",null],["☀️","Light",false],["🌙","Dark",true]].map(([ico, label, val]) => {
            const isActive = darkOverride === val;
            return (
              <div key={label} onClick={() => setDarkOverride(val)}
                style={{ flex:1, textAlign:"center", padding:"10px 4px", borderRadius:12,
                  background: isActive ? C.accent : C.sectionBg,
                  border: `1.5px solid ${isActive ? C.accent : C.border}`,
                  cursor:"pointer", transition:"all 0.2s" }}>
                <div style={{ fontSize:16, marginBottom:4 }}>{ico}</div>
                <div style={{ color: isActive ? "#fff" : C.text, fontSize:12, fontWeight: isActive ? 700 : 400 }}>{label}</div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Account section */}
      <Section title="Account">
        {user ? (
          <div>
            <Row label="Signed in as" value={user.email} />
            <Row label="Data sync" value="✓ Synced to cloud" color={C.green} />
            <Row label="Change password" value="••••••••" onClick={()=>setShowChangePw(true)} last />
            <div style={{ padding:"8px 16px 4px" }}>
              <button onClick={async()=>{ await supabase.auth.signOut(); localStorage.removeItem("leanplan_v4"); window.location.reload(); }}
                style={{ width:"100%", background:"none", border:`1px solid ${C.red}44`, borderRadius:10, color:C.red, fontSize:14, fontWeight:600, textAlign:"center", cursor:"pointer", padding:"10px 0", fontFamily:FONT }}>
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div>
            <Row label="Account" value="Not signed in" color={C.muted} last />
            <div style={{ padding:"12px 16px" }}>
              <Btn color={C.accent} onClick={onShowAuth} style={{ width:"100%", marginBottom:8 }}>Sign In to Existing Account</Btn>
              <p style={{ color:C.muted, fontSize:12, textAlign:"center", margin:0 }}>Have an account? Sign in to sync your data across devices</p>
            </div>
          </div>
        )}
      </Section>

      {/* Pro status */}
      {isPro && proData?.customerId && proData?.customerId !== 'bypass' && proData?.subscriptionId !== 'bypass' ? (
        <div style={{ background:`${C.green}10`, border:`1px solid ${C.green}33`, borderRadius:14, padding:"14px 16px", marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <p style={{ color:C.green, fontWeight:700, fontSize:15, margin:0 }}>✓ LeanPlan Pro</p>
              <p style={{ color:C.muted, fontSize:12, margin:"2px 0 0" }}>{proData?.plan === "annual" ? "Annual plan" : "Monthly plan"}</p>
            </div>
            {proData?.customerId && proData.customerId !== "bypass" && (
              <Btn small outline color={C.green} onClick={async()=>{
                try {
                  const res = await fetch("/api/stripe/portal",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({customerId:proData.customerId})});
                  const data = await res.json();
                  if (data.url) window.location.href = data.url;
                  else alert("Could not open billing portal. Please contact support.");
                } catch(e){ alert("Could not connect. Please try again."); }
              }}>Manage</Btn>
            )}
          </div>
        </div>
      ) : proData?.customerId === "bypass" ? (
        <div style={{ background:"linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:14, padding:"14px 16px", marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <p style={{ color:"#f59e0b", fontWeight:700, fontSize:15, margin:0 }}>⭐ Lifetime Pro</p>
              <p style={{ color:"rgba(255,255,255,0.5)", fontSize:12, margin:"2px 0 0" }}>Admin access — all features unlocked</p>
            </div>
          </div>
        </div>
      ) : (
        <Btn onClick={onUpgrade} color="#5856d6" style={{ width:"100%", marginBottom:16 }}>✦ Upgrade to Pro from £9.99/mo</Btn>
      )}

      <div style={{ marginTop:8 }}>
        <Btn onClick={onReset} outline color={C.red} style={{ width:"100%" }}>Reset All Data</Btn>
      </div>
      <p style={{ color:C.muted, fontSize:12, textAlign:"center", marginTop:16, lineHeight:1.6 }}>General guidance only. Consult your GP before making significant diet or exercise changes.</p>

      {/* Avatar crop modal — rendered as portal-style fixed overlay */}
      {showCropModal && <AvatarCropModal
        url={showCropModal.url}
        onSave={handleCropSave}
        onCancel={handleCropCancel}
        saving={avatarUploading}
        croppieRef={croppieRef}
      />}
    </div>
  );
};


// ── MAIN ──────────────────────────────────────────────────────────────────────
function AppInner() {
  const RESET_KEYS = [
    "leanplan_v4", "leanplan_lifts", "leanplan_pro", "leanplan_device_id",
    "leanplan_trial_start", "leanplan_gen_count", "leanplan_disliked_meals",
    "leanplan_liked_meals", "leanplan_meal_plan", "leanplan_todays_meals",
    "leanplan_pantry",
  ];
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("Today");
  const [isPro, setIsPro] = useState(false);
  // Trial users get full Pro access
  const effectiveIsPro = isPro || isTrialActive();
  const [proData, setProData] = useState(null);
  const [proLoading, setProLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [mealPlan, setMealPlan] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("leanplan_meal_plan") || "null");
      if (saved?.generatedDate) {
        // Check plan still has future/today dates
        const today = new Date().toISOString().split("T")[0];
        const hasFuture = saved.days?.some(d => d.date >= today);
        if (hasFuture) return saved;
      }
    } catch(e){}
    return null;
  });
  const saveMealPlan = (plan) => {
    setMealPlan(plan);
    try {
      if (plan) localStorage.setItem("leanplan_meal_plan", JSON.stringify(plan));
      else localStorage.removeItem("leanplan_meal_plan");
    } catch(e){}
  };
  // Meal generation state — lives at App level so it survives tab switches
  const [generating, setGenerating] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [generateProgress, setGenerateProgress] = useState(null);
  const [generateError, setGenerateError] = useState(null);

  // todaysMeals derived from mealPlan for backward compat
  const todayKey2 = new Date().toISOString().split("T")[0];
  const todaysMeals = mealPlan?.days?.find(d => d.date === todayKey2)?.meals || null;
  const [todaysWorkout, setTodaysWorkout] = useState(null);
  const [entries, setEntries] = useState([]);
  const [favourites, setFavourites] = useState([]);
  const [removed, setRemoved] = useState([]);
  const [mealLog, setMealLog] = useState({});
  const [workoutLog, setWorkoutLog] = useState({});
  const [water, setWater] = useState({});
  const [journal, setJournal] = useState({});
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkOverride, setDarkOverride] = useState(null);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  // Auth state
  const [user, setUser] = useState(null); // Supabase user
  const [authChecked, setAuthChecked] = useState(false); // has auth been checked
  const [showAuth, setShowAuth] = useState(false); // show auth screen
  const [showCreateAccount, setShowCreateAccount] = useState(false); // show create account after onboarding
  const [pendingProfile, setPendingProfile] = useState(null); // profile data waiting for account creation
  const [showTipSplash, setShowTipSplash] = useState(true);
  const [showWeeklyCheckIn, setShowWeeklyCheckIn] = useState(false);
  const [splashTipIdx] = useState(()=>Math.floor(Math.random()*DAILY_TIPS.length)); // show tip on open
  const [showWelcome, setShowWelcome] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [authLoading, setAuthLoading] = useState(true); // true until auth check completes
  const [syncing, setSyncing] = useState(false);

  // Listen to system dark mode changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = e => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Check for dev bypass and Stripe return
  // Reset daily state at midnight
  useEffect(()=>{
    const msUntilMidnight = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24,0,0,0);
      return midnight - now;
    };
    const timer = setTimeout(()=>{
      setTodaysWorkout(null);
      // Don't clear mealPlan at midnight - it spans multiple days
    }, msUntilMidnight());
    return () => clearTimeout(timer);
  }, []);

  useEffect(()=>{
    // Check server-side bypass flag — pass email for admin override
    const emailParam = user?.email ? `?email=${encodeURIComponent(user.email)}` : "";
    fetch(`/api/pro-status${emailParam}`)
      .then(r => r.json())
      .then(data => {
        if (data.bypass) {
          setIsPro(true);
          setProData({ plan:"annual", customerId:"bypass", subscriptionId:"bypass" });
        }
      })
      .catch(()=>{})
      .finally(()=>{ setProLoading(false); });

    const params = new URLSearchParams(window.location.search);
    const proStatus = params.get("pro");
    const sessionId = params.get("session_id");
    if (proStatus === "success" && sessionId) {
      fetch(`/api/stripe/verify?session_id=${sessionId}`)
        .then(r => r.json())
        .then(data => {
          if (data.pro) {
            setIsPro(true);
            setProData({ customerId: data.customerId, subscriptionId: data.subscriptionId, plan: data.plan });
            localStorage.setItem("leanplan_pro", JSON.stringify({ isPro: true, customerId: data.customerId, subscriptionId: data.subscriptionId, plan: data.plan }));
          }
        })
        .catch(()=>{});
      window.history.replaceState({}, "", "/");
    }
    // Load saved pro status
    try {
      const savedPro = localStorage.getItem("leanplan_pro");
      if (savedPro) {
        const pd = JSON.parse(savedPro);
        if (pd.isPro) { setIsPro(true); setProData(pd); }
      }
    } catch(e){}
  }, [user]);

  // Load data from localStorage first (fast), then sync from Supabase if logged in
  const loadFromLocal = () => {
    try {
      const raw = localStorage.getItem("leanplan_v4");
      if (raw) {
        const d = JSON.parse(raw);
        if (d.profile) setProfile(d.profile);
        if (d.entries) setEntries(d.entries);
        if (d.favourites) setFavourites(d.favourites);
        if (d.removed) setRemoved(d.removed);
        if (d.mealLog) setMealLog(d.mealLog);
        if (d.workoutLog) setWorkoutLog(d.workoutLog);
        if (d.water) setWater(d.water);
        if (d.journal) setJournal(d.journal);
        if (d.measurements) setMeasurements(d.measurements);
        if (d.darkOverride !== undefined) setDarkOverride(d.darkOverride);
      }
    } catch(e){}
  };

  const loadFromSupabase = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (error || !data) return;
      if (data.profile_data && Object.keys(data.profile_data).length > 0) setProfile(data.profile_data);
      if (data.entries?.length) setEntries(data.entries);
      if (data.favourites?.length) setFavourites(data.favourites);
      if (data.removed?.length) setRemoved(data.removed);
      if (data.meal_log && Object.keys(data.meal_log).length) setMealLog(data.meal_log);
      if (data.workout_log && Object.keys(data.workout_log).length) setWorkoutLog(data.workout_log);
      if (data.water && Object.keys(data.water).length) setWater(data.water);
      if (data.journal && Object.keys(data.journal).length) setJournal(data.journal);
      if (data.measurements?.length) setMeasurements(data.measurements);
      if (data.dark_override !== null && data.dark_override !== undefined) setDarkOverride(data.dark_override);
      if (data.is_pro) { setIsPro(true); setProData({ customerId: data.stripe_customer_id, subscriptionId: data.stripe_subscription_id, plan: data.stripe_plan, cancelAt: data.cancel_at || null }); }
      // Sync trial_start from Supabase — ensures consistent trial across devices
      if (data.trial_start && !localStorage.getItem("leanplan_trial_start")) {
        localStorage.setItem("leanplan_trial_start", data.trial_start);
      }
      if (data.meal_plan && data.meal_plan.days) {
        // Only load if plan has future/today dates
        const today = new Date().toISOString().split("T")[0];
        const hasFuture = data.meal_plan.days.some(d => d.date >= today);
        if (hasFuture) {
          setMealPlan(data.meal_plan);
          localStorage.setItem("leanplan_meal_plan", JSON.stringify(data.meal_plan));
        }
      }
    } catch(e){ console.error("Supabase load error:", e); }
  };

  const saveToSupabase = async (userId, data) => {
    try {
      await supabase.from("profiles").upsert({
        id: userId,
        profile_data: data.profile || {},
        entries: data.entries || [],
        favourites: data.favourites || [],
        removed: data.removed || [],
        meal_log: data.mealLog || {},
        workout_log: data.workoutLog || {},
        water: data.water || {},
        journal: data.journal || {},
        measurements: data.measurements || [],
        dark_override: data.darkOverride,
        meal_plan: data.mealPlan || null,
        trial_start: localStorage.getItem("leanplan_trial_start") || null,
        updated_at: new Date().toISOString(),
      });
    } catch(e){ console.error("Supabase save error:", e); }
  };

  // Check auth on mount
  useEffect(()=>{
    let loadingDone = false;

    // Load from localStorage IMMEDIATELY — don't wait for Supabase
    loadFromLocal();
    setLoading(false); // Show the app straight away from cache

    // Clear any leftover recovery flags from previous attempts
    localStorage.removeItem("leanplan_recovery");
    localStorage.removeItem("leanplan_recovery_token");
    localStorage.removeItem("leanplan_recovery_refresh");

    // Show weekly check-in on Monday mornings (once per week)
    const isMonday = new Date().getDay() === 1;
    const lastCheckIn = localStorage.getItem("leanplan_last_checkin");
    const thisWeekMonday = (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1); return d.toISOString().split("T")[0]; })();
    if (isMonday && lastCheckIn !== thisWeekMonday) {
      setTimeout(() => setShowWeeklyCheckIn(true), 1500);
    }

    const finishLoading = () => {
      if (!loadingDone) {
        loadingDone = true;
        setAuthChecked(true);
        setAuthLoading(false);
      }
    };

    // Safety timeout
    const safetyTimer = setTimeout(() => {
      finishLoading();
    }, 5000);

    // onAuthStateChange catches ALL auth events including email confirmation
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        if (session?.user) {
          setUser(session.user);
          loadFromLocal();
          try {
            // Check if Supabase has profile data
            const { data } = await supabase.from("profiles").select("profile_data").eq("id", session.user.id).single();
            if (!data?.profile_data || Object.keys(data.profile_data).length === 0) {
              // Profile is empty — push local data up immediately
              const local = JSON.parse(localStorage.getItem("leanplan_v4") || "{}");
              if (local.profile) {
                console.log("Pushing local profile to Supabase...");
                await saveToSupabase(session.user.id, local);
                setProfile(local.profile);
              }
            } else {
              await loadFromSupabase(session.user.id);
            }
          } catch(e){ console.error("Supabase sync failed:", e); }
          clearTimeout(safetyTimer);
          finishLoading();
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        clearTimeout(safetyTimer);
        finishLoading();
      } else if (event === "INITIAL_SESSION") {
        if (session?.user) {
          // Valid session exists — set user immediately, don't wait for SIGNED_IN
          setUser(session.user);
          loadFromLocal();
          try {
            await loadFromSupabase(session.user.id);
          } catch(e){ console.error("Supabase sync failed:", e); }
          clearTimeout(safetyTimer);
          finishLoading();
        } else {
          loadFromLocal();
          clearTimeout(safetyTimer);
          finishLoading();
        }
      }
    });

    return () => { subscription.unsubscribe(); clearTimeout(safetyTimer); };
  }, []);

  // Save to both localStorage and Supabase when data changes
  useEffect(()=>{
    if (loading) return;
    const data = {profile,entries,favourites,removed,mealLog,workoutLog,water,journal,measurements,darkOverride,mealPlan};
    try { localStorage.setItem("leanplan_v4", JSON.stringify(data)); } catch(e){}
    if (user) {
      // Debounce Supabase saves to avoid too many writes
      const timer = setTimeout(() => saveToSupabase(user.id, data), 2000);
      return () => clearTimeout(timer);
    }
  },[profile,entries,favourites,removed,mealLog,workoutLog,water,journal,measurements,darkOverride,mealPlan,loading,user]);

  const loadBg = systemDark ? "#000" : "#f2f2f7";
  const loadText = systemDark ? "#8e8e93" : "#8e8e93";
  if (loading) return <div style={{ minHeight:"100vh", background:loadBg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:FONT }}><div style={{ textAlign:"center" }}><div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
        <img src="/leanplan_app_icon.png" alt="" style={{ height:52, width:52, objectFit:"contain", borderRadius:12 }} />
        <span style={{ fontSize:28, fontWeight:800, letterSpacing:"-0.02em", fontFamily:FONT }}>
          <span style={{ color:loadBg==="#000"?"#fff":"#000" }}>Lean</span><span style={{ color:"#0a84ff" }}>Plan</span>
        </span>
      </div>
      <p style={{ color:loadText }}>Loading...</p></div></div>;





  // Apply theme first — needed by all render paths
  const isDark = darkOverride !== null ? darkOverride : systemDark;
  C = isDark ? DARK : LIGHT;

  // ── Render sequence ──────────────────────────────────────────────────────────

  // Show tip splash on every open (after profile is loaded)
  if (showTipSplash && profile && !showAuth && !showWelcome && !showOnboarding) {
    return <TipSplashScreen tip={DAILY_TIPS[splashTipIdx]} onDismiss={()=>setShowTipSplash(false)} />;
  }

  // 1. Auth screen — shown when explicitly requested
  if (showAuth) return <AuthScreen
    onAuth={async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setShowAuth(false);
        setSyncing(true);
        try {
          await loadFromSupabase(session.user.id);
          // Push any local data up if Supabase is empty
          const { data } = await supabase.from("profiles").select("profile_data").eq("id", session.user.id).single();
          if (!data?.profile_data || Object.keys(data.profile_data).length === 0) {
            const local = JSON.parse(localStorage.getItem("leanplan_v4") || "{}");
            if (local.profile) await saveToSupabase(session.user.id, local);
          }
        } catch(e){}
        setSyncing(false);
      }
    }}
    onSkip={()=>setShowAuth(false)}
  />;

  // 2. Loading screen — only while auth check runs with no cached data
  if (authLoading && !profile) return <div style={{ minHeight:"100vh", background:loadBg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:FONT }}><div style={{ textAlign:"center" }}><div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}><img src="/leanplan_app_icon.png" alt="" style={{ height:52, width:52, objectFit:"contain", borderRadius:12 }} /><span style={{ fontSize:28, fontWeight:800, letterSpacing:"-0.02em", fontFamily:FONT }}><span style={{ color:loadBg==="#000"?"#fff":"#000" }}>Lean</span><span style={{ color:"#0a84ff" }}>Plan</span></span></div><p style={{ color:loadText }}>Loading...</p></div></div>;

  // 3. Welcome screen — first time, no profile, no user
  if (!profile && !user && !showOnboarding) return <WelcomeScreen
    onNew={()=>{ setShowOnboarding(true); }}
    onSignIn={()=>setShowAuth(true)}
  />;

  // 3b. Signed out but have local data — show sign in screen (only after auth check completes)
  if (profile && !user && !authLoading) return <AuthScreen
    onAuth={async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setSyncing(true);
        try {
          await loadFromSupabase(session.user.id);
          const { data } = await supabase.from("profiles").select("profile_data").eq("id", session.user.id).single();
          if (!data?.profile_data || Object.keys(data.profile_data).length === 0) {
            const local = JSON.parse(localStorage.getItem("leanplan_v4") || "{}");
            if (local.profile) await saveToSupabase(session.user.id, local);
          }
        } catch(e){}
        setSyncing(false);
      }
    }}
    onSkip={null}
    onStartFresh={() => {
      if (!window.confirm("Start fresh? This will clear all your current data and cannot be undone.")) return;
      RESET_KEYS.forEach(k => localStorage.removeItem(k));
      setProfile(null); setEntries([]); setFavourites([]); setRemoved([]);
      setMealLog({}); setWorkoutLog({}); setWater({}); setJournal({}); setMeasurements([]);
      setIsPro(false); setProData(null); setMealPlan(null);
    }}
  />;

  // 4. Onboarding — after Get Started
  if (!profile && !showCreateAccount) return <Onboarding onDone={p=>{ 
    setPendingProfile(p);
    setShowCreateAccount(true);
    try {
      localStorage.setItem("leanplan_v4", JSON.stringify({profile:p, entries:[], favourites:[], removed:[], mealLog:{}, workoutLog:{}, water:{}, journal:{}, measurements:[], darkOverride:null}));
    } catch(e){}
  }} />;

  // 4b. Create account — mandatory after onboarding (skip if already signed in)
  if (showCreateAccount && pendingProfile) {
    if (user) {
      // Already signed in (e.g. after reset) — just save profile and continue
      setProfile(pendingProfile);
      setShowCreateAccount(false);
      setPendingProfile(null);
      setTrialStart();
      saveToSupabase(user.id, { profile: pendingProfile, entries:[], favourites:[], removed:[], mealLog:{}, workoutLog:{}, water:{}, journal:{}, measurements:[], darkOverride:null });
      return null;
    }
    return <CreateAccountScreen
      profileData={pendingProfile}
      onDone={async (supabaseUser, email) => {
        setUser(supabaseUser);
        setProfile(pendingProfile);
        setShowCreateAccount(false);
        setPendingProfile(null);
        setTrialStart();
      }}
    />;
  }

  // 5. Trial expired — show subscribe screen
  if (!proLoading && isTrialExpired() && !isPro && proData?.customerId !== 'bypass') return <TrialExpiredScreen onSubscribe={()=>setShowPaywall(true)} />;

  const cur = entries.length>0?entries[entries.length-1].weight:profile.startWeightLbs;
  const lost = Math.max(0,profile.startWeightLbs-cur);
  const pct = Math.min(100,Math.round((lost/profile.targetLbs)*100));
  const TAB_COLORS = {Today:"#007aff",Meals:"#34c759",Train:"#5ac8fa",Track:"#af52de",Coach:"#ff2d55",Profile:"#ff9500"};

  const handleReset = async () => {
    const savedPro = localStorage.getItem("leanplan_pro");
    const hasRealSub = savedPro && JSON.parse(savedPro)?.customerId && JSON.parse(savedPro)?.customerId !== "bypass";

    const confirmMsg = hasRealSub
      ? "Reset your fitness data and start fresh?\n\n✓ Your Pro subscription will be kept\n✓ All workout, meal and progress data will be cleared\n✓ You can set up a new goal in onboarding\n\nTap OK to reset your data."
      : "Reset all data? This cannot be undone.";

    if (!window.confirm(confirmMsg)) return;

    // Wipe Supabase row BEFORE signing out so the same email starts clean next time
    if (user?.id) {
      try {
        await supabase.from("profiles").upsert({
          id: user.id,
          profile_data: {}, entries: [], favourites: [], removed: [],
          meal_log: {}, workout_log: {}, water: {}, journal: {},
          measurements: [], dark_override: null, meal_plan: null,
          trial_start: null, reminder_sent: false,
          is_pro: hasRealSub ? true : false,
          updated_at: new Date().toISOString(),
        });
      } catch(e){ console.error("Supabase wipe error:", e); }
    }

    RESET_KEYS.forEach(k => localStorage.removeItem(k));
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <ThemeProvider isDark={isDark}>
    <div style={{ background:C.bg, minHeight:"100vh", fontFamily:FONT, color:C.text, width:"100%", overflowX:"hidden" }}>
      <style>{`* { box-sizing:border-box; margin:0; padding:0; } input,select,textarea { outline:none; } html,body { width:100%; overflow-x:hidden; background:${C.bg}; font-family:${FONT}; color-scheme:${isDark?"dark":"light"}; } #root { width:100%; } ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-thumb { background:${C.divider}; border-radius:4px; } ::placeholder { color:${C.muted}; }`}</style>

      <div style={{ paddingTop:"max(12px, env(safe-area-inset-top))", paddingLeft:18, paddingRight:18, paddingBottom:10, background:isDark?"rgba(0,0,0,0.85)":"rgba(242,242,247,0.95)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, zIndex:10, width:"100%" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center" }}>
              <span style={{ fontSize:22, fontWeight:800, letterSpacing:"-0.02em", fontFamily:FONT }}>
                <span style={{ color:isDark?"#ffffff":"#3d3d3d" }}>Lean</span><span style={{ color:"#3d8ef0" }}>Plan</span>
              </span>
            </div>
            <p style={{ fontSize:11, color:C.muted, margin:0 }}>{profile.name?.toUpperCase()||"YOUR PLAN"}</p>
          </div>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"6px 14px", textAlign:"right", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
            <div><span style={{ color:C.green, fontWeight:700, fontSize:16 }}>{toKg(lost)}</span><span style={{ color:C.muted, fontSize:13 }}> / {(profile.targetLbs*0.453592).toFixed(1)} kg</span></div>
            <div style={{ background:C.border, borderRadius:99, height:3, marginTop:4, overflow:"hidden", width:80 }}>
              <div style={{ width:`${pct}%`, height:"100%", background:`linear-gradient(90deg, ${C.accent}, ${C.green})`, borderRadius:99 }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding:"8px 14px 100px" }}>
        {/* Cancellation notice */}
        {isPro && proData?.cancelAt && (
          <div style={{ background:`linear-gradient(135deg, #2d1f00, #3d2a00)`, border:`1px solid rgba(255,159,10,0.4)`, borderRadius:14, padding:"12px 16px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <p style={{ color:"#ff9f0a", fontWeight:700, fontSize:13, margin:0 }}>⚠️ Subscription cancelled</p>
              <p style={{ color:"rgba(255,255,255,0.6)", fontSize:11, margin:"2px 0 0" }}>
                Access continues until {new Date(proData.cancelAt).toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" })}
              </p>
            </div>
            <button onClick={()=>setShowPaywall(true)} style={{ background:"#ff9f0a", border:"none", borderRadius:99, padding:"7px 14px", color:"#000", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:FONT, whiteSpace:"nowrap" }}>Resubscribe</button>
          </div>
        )}

        {/* Trial banner */}
        {!isPro && isTrialActive() && (()=>{
          const daysLeft = getTrialDaysLeft();
          const trialMsg = daysLeft >= 7
            ? { icon:"🎯", text:"Your personalised plan is ready", sub:"Everything is set up, just follow today's plan", color:"#34c759", bg:"linear-gradient(135deg,#0a2a1f,#0d3d2a)", border:"rgba(52,199,89,0.5)" }
            : daysLeft === 6
            ? { icon:"💪", text:"Day 2 — let's keep this going", sub:"Small wins today = big results later", color:"#34c759", bg:"linear-gradient(135deg,#0a2a1f,#0d3d2a)", border:"rgba(52,199,89,0.5)" }
            : daysLeft === 5
            ? { icon:"📈", text:"You're on track", sub:"Keep building the momentum", color:"#34c759", bg:"linear-gradient(135deg,#0a2a1f,#0d3d2a)", border:"rgba(52,199,89,0.5)" }
            : daysLeft === 4
            ? { icon:"🔒", text:"Your plan is working well", sub:"Keep everything moving in the right direction", color:"#0a84ff", bg:"linear-gradient(135deg,#0a1a2a,#0d2a3d)", border:"rgba(10,132,255,0.5)" }
            : daysLeft === 3
            ? { icon:"⏳", text:"Your trial is ending soon", sub:"Keep your plan going without interruption", color:"#ff9f0a", bg:"linear-gradient(135deg,#1a1200,#2a1e00)", border:"rgba(255,159,10,0.5)" }
            : daysLeft === 2
            ? { icon:"⚠️", text:"Nearly there — choose a plan to keep your progress going", sub:"", color:"#ff9f0a", bg:"linear-gradient(135deg,#1a1200,#2a1e00)", border:"rgba(255,159,10,0.6)" }
            : daysLeft === 1
            ? { icon:"🚨", text:"Last day of your trial", sub:"Continue your plan and keep your progress", color:"#ff453a", bg:"linear-gradient(135deg,#1a0a0a,#2a0d0d)", border:"rgba(255,69,58,0.6)" }
            : { icon:"🔒", text:"Your plan is paused", sub:"Unlock it to continue where you left off", color:"#ff453a", bg:"linear-gradient(135deg,#1a0a0a,#2a0d0d)", border:"rgba(255,69,58,0.6)" };
          return (
            <div style={{ background:trialMsg.bg, border:`1px solid ${trialMsg.border}`, borderRadius:14, padding:"12px 16px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ flex:1, marginRight:12 }}>
                <p style={{ color:trialMsg.color, fontWeight:700, fontSize:13, margin:0 }}>{trialMsg.icon} {trialMsg.text}</p>
                <p style={{ color:"rgba(255,255,255,0.6)", fontSize:11, margin:"2px 0 0" }}>{trialMsg.sub}</p>
              </div>
              <button onClick={()=>setShowPaywall(true)} style={{ background:trialMsg.color, border:"none", borderRadius:99, padding:"7px 14px", color: daysLeft <= 3 ? "#fff" : "#000", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:FONT, whiteSpace:"nowrap", flexShrink:0 }}>Subscribe →</button>
            </div>
          );
        })()}
        {!effectiveIsPro && <ProBanner onUpgrade={()=>setShowPaywall(true)} />}
        {generating && tab !== "Meals" && (
          <div onClick={()=>setTab("Meals")} style={{ background:`${C.accent}15`, border:`1px solid ${C.accent}33`, borderRadius:10, padding:"10px 14px", marginBottom:10, display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:C.accent, flexShrink:0, animation:"pulse 1.2s ease-in-out infinite" }} />
            <p style={{ color:C.accent, fontSize:13, fontWeight:600, margin:0, flex:1 }}>Generating your meal plan...</p>
            <span style={{ color:C.accent, fontSize:12 }}>View →</span>
          </div>
        )}

        {tab==="Today"&&<TodayTab profile={profile} entries={entries} mealLog={mealLog} setMealLog={setMealLog} workoutLog={workoutLog} water={water} setWater={setWater} journal={journal} setJournal={setJournal} measurements={measurements} mealPlan={mealPlan} setTab={setTab} />}
        <div style={{ display: tab==="Meals" ? "block" : "none" }}><MealsTab profile={profile} favourites={favourites} setFavourites={setFavourites} removed={removed} setRemoved={setRemoved} mealLog={mealLog} setMealLog={setMealLog} isPro={effectiveIsPro} onUpgrade={()=>setShowPaywall(true)} mealPlan={mealPlan} onSaveMealPlan={saveMealPlan} generating={generating} setGenerating={setGenerating} generateProgress={generateProgress} setGenerateProgress={setGenerateProgress} generateError={generateError} setGenerateError={setGenerateError} user={user} /></div>
        {tab==="Train"&&(effectiveIsPro ? <TrainTab profile={profile} workoutLog={workoutLog} setWorkoutLog={setWorkoutLog} setProfile={setProfile} savedWorkout={todaysWorkout} setSavedWorkout={setTodaysWorkout} /> : <LockedTab feature="Workout tracking, lift tracker and rest day planner" onUpgrade={()=>setShowPaywall(true)} />)}
        <div style={{ display: tab==="Track" ? "block" : "none" }}>{effectiveIsPro ? <TrackTab profile={profile} entries={entries} setEntries={fn=>setEntries(typeof fn==="function"?fn(entries):fn)} measurements={measurements} setMeasurements={setMeasurements} workoutLog={workoutLog} user={user} /> : <LockedTab feature="Progress tracking, measurements and body stats" onUpgrade={()=>setShowPaywall(true)} />}</div>
        {tab==="Coach"&&(effectiveIsPro ? <CoachTab profile={profile} setProfile={setProfile} mealPlan={mealPlan} mealLog={mealLog} workoutLog={workoutLog} entries={entries} isAdmin={proData?.customerId === "bypass"} /> : <LockedTab feature="AI personal coach" onUpgrade={()=>setShowPaywall(true)} />)}
        <div style={{ display: tab==="Profile" ? "block" : "none" }}><ProfileTab profile={profile} setProfile={setProfile} onReset={handleReset} isDark={isDark} darkOverride={darkOverride} setDarkOverride={setDarkOverride} isPro={effectiveIsPro} proData={proData} onUpgrade={()=>setShowPaywall(true)} user={user} onShowAuth={()=>setShowAuth(true)} onClearMealPlan={()=>saveMealPlan(null)} avatarUrl={avatarUrl} setAvatarUrl={setAvatarUrl} /></div>

      </div>

      {/* Paywall modal — outside scroll container */}
      {showPaywall && <PaywallModal onClose={()=>setShowPaywall(false)} />}

      <div style={{ position:"fixed", bottom:0, left:0, right:0, width:"100%", background:isDark?"rgba(0,0,0,0.85)":"rgba(242,242,247,0.95)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderTop:`1px solid ${C.border}`, display:"flex", padding:"8px 0 20px" }}>
        {TABS.map(t=>{
          const col=TAB_COLORS[t]; const active=tab===t;
          return <div key={t} onClick={()=>setTab(t)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", cursor:"pointer", gap:3 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:active?col:"transparent", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s" }}>
              <Icon name={TAB_ICON_MAP[t]} size={20} color={active?"#fff":C.muted} />
            </div>
            <span style={{ fontSize:10, fontWeight:active?700:600, color:active?col:"#555" }}>{t}</span>
          </div>;
        })}
      </div>

      {/* Weekly check-in modal */}
      {showWeeklyCheckIn && profile && (
        <WeeklyCheckIn
          profile={profile}
          onDone={() => setShowWeeklyCheckIn(false)}
          onAddEntry={(entry) => setEntries(prev => [...prev, entry])}
        />
      )}
    </div>
    </ThemeProvider>
  );
}

export default function App() {
  return <ErrorBoundary><AppInner /></ErrorBoundary>;
}