import React, { useState, useEffect } from "react";
import { useTheme } from "../ThemeContext.jsx";
import { FONT, DAY_NAMES } from "../constants.js";
import { todayKey } from "../helpers.js";
import { getCurrentBlock, buildWorkout, getWeeklyPlan, WORKOUTS } from "../data/workouts.js";
import { EXERCISE_DB } from "../data/exercises.js";
import { Icon } from "./Icon.jsx";
import { Card, Section, Row, Btn, BigChip, ProgressBar } from "./ui.jsx";
import { LiftTracker } from "./LiftTracker.jsx";

export const TrainTab = ({ profile, workoutLog, setWorkoutLog, setProfile, savedWorkout, setSavedWorkout, entries=[] }) => {
  const C = useTheme();
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

  const finishWorkout = () => {
    setWorkoutLog(wl=>({...wl,[todayKey()]:{type:selectedType,date:todayKey(),time:new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}}));
    setSavedWorkout(null);
    setLoggedWeights({});
    showPrToast("Workout complete! Well done. 💪");
    setView("calendar");
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
        {[["workout", "Workout"],["calendar","Programme"],["lifts","Progress"]].map(([k,l])=>(
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
          {!workoutLog[todayKey()]&&<Btn onClick={finishWorkout} color={C.green} style={{ width:"100%", marginBottom:8 }}>Finish workout ✓</Btn>}
          <div style={{ display:"flex", gap:8 }}>
            <Btn onClick={()=>setActiveWorkout(null)} outline color={C.accent} style={{ width:"100%" }}>← Back to workout selection</Btn>
          </div>
        </>}
      </>}

      {view==="lifts"&&<LiftTracker lifts={lifts} setLifts={setLifts} workoutLog={workoutLog} />}
    </div>
  );
};

