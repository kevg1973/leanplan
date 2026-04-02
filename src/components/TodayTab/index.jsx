import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { FONT } from "../../constants/theme.js";
import { DAILY_TIPS, ALL_MEALS } from "../../constants/data.js";
import { todayKey, fmtDate, calcTDEE, toKg } from "../../utils/index.js";
import { Card, Icon, Btn, ProgressBar, StatBox } from "../shared/index.jsx";

// ── Meal filter ───────────────────────────────────────────────────────────────
const filterMeals = (profile, removed=[]) => ALL_MEALS.filter(m => {
  if (removed.includes(m.id)) return false;
  for (const a of (profile.allergies||[])) if (m.allergens.includes(a.toLowerCase())) return false;
  for (const d of (profile.dislikes||[])) {
    const dl=d.toLowerCase();
    if (m.name.toLowerCase().includes(dl)||m.items.some(i=>i.toLowerCase().includes(dl))) return false;
  }
  return true;
});

// ── Chart ─────────────────────────────────────────────────────────────────────
export const Chart = ({ entries, startWeight, targetWeight, color }) => {
  const { C } = useTheme();
  const chartColor = color || C.accent;
  const pts=[{label:"Start",weight:startWeight},...entries];
  if (pts.length<2) return null;
  const ws=pts.map(p=>p.weight).concat(targetWeight);
  const minW=Math.min(...ws)-2, maxW=Math.max(...ws)+2, range=maxW-minW;
  const W=340,H=150,P={t:14,r:14,b:32,l:44};
  const cW=W-P.l-P.r,cH=H-P.t-P.b;
  const tx=i=>P.l+(i/(pts.length-1))*cW;
  const ty=w=>P.t+cH-((w-minW)/range)*cH;
  const line=pts.map((p,i)=>`${i===0?"M":"L"}${tx(i).toFixed(1)},${ty(p.weight).toFixed(1)}`).join(" ");
  const area=line+` L${tx(pts.length-1).toFixed(1)},${H-P.b} L${P.l},${H-P.b} Z`;
  const ticks=[Math.ceil(minW+1),Math.round((minW+maxW)/2),Math.floor(maxW-1)];
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:"block"}}>
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.2"/><stop offset="100%" stopColor={color} stopOpacity="0.02"/></linearGradient>
      </defs>
      {ticks.map(w=><line key={w} x1={P.l} y1={ty(w)} x2={W-P.r} y2={ty(w)} stroke={C.border} strokeWidth="1"/>)}
      <line x1={P.l} y1={ty(targetWeight)} x2={W-P.r} y2={ty(targetWeight)} stroke={C.green} strokeWidth="1.5" strokeDasharray="5,4" opacity="0.8"/>
      <text x={W-P.r-2} y={ty(targetWeight)-5} fill={C.green} fontSize="9" textAnchor="end" fontWeight="600">target</text>
      <path d={area} fill="url(#cg)"/>
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p,i)=><circle key={i} cx={tx(i)} cy={ty(p.weight)} r={i===pts.length-1?5.5:3.5} fill={i===pts.length-1?color:"#fff"} stroke={color} strokeWidth="2"/>)}
      {ticks.map(w=><text key={w} x={P.l-5} y={ty(w)+4} fill={C.muted} fontSize="9" textAnchor="end">{Math.round(w)}</text>)}
      {pts.map((p,i)=><text key={i} x={tx(i)} y={H-P.b+14} fill={C.muted} fontSize="8.5" textAnchor="middle">{p.label}</text>)}
    </svg>
  );
};

// ── TODAY TAB ─────────────────────────────────────────────────────────────────

// ── Daily Tip Splash Screen ───────────────────────────────────────────────────
export const TipSplashScreen = ({ tip, onDismiss }) => {
  const { C } = useTheme();
  const startY = React.useRef(null);
  const [offsetY, setOffsetY] = React.useState(0);
  const [dismissed, setDismissed] = React.useState(false);

  const dismiss = () => {
    setDismissed(true);
    setTimeout(onDismiss, 300);
  };

  const handleTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (startY.current === null) return;
    const dy = startY.current - e.touches[0].clientY;
    if (dy > 0) setOffsetY(dy);
  };

  const handleTouchEnd = () => {
    if (offsetY > 60) {
      dismiss();
    } else {
      setOffsetY(0);
    }
    startY.current = null;
  };

  const [visible, setVisible] = React.useState(false);
  React.useEffect(()=>{ setTimeout(()=>setVisible(true), 150); }, []);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position:"fixed", inset:0, zIndex:9999,
        background:"#000",
        display:"flex", flexDirection:"column",
        justifyContent:"space-between",
        padding:"48px 32px 40px",
        transform:`translateY(${dismissed ? "-100%" : `-${offsetY}px`})`,
        transition:dismissed ? "transform 0.3s ease-in" : offsetY > 0 ? "none" : "transform 0.1s ease-out",
        opacity: visible ? 1 : 0,
        userSelect:"none",
        fontFamily:FONT,
        overflow:"hidden",
      }}
    >
      {/* Background image */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:0 }}>
        <img src="/splash_bg.png" alt="" style={{ width:"100%", height:"100%", objectFit:"cover", opacity:0.6 }} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.8) 100%)" }} />
      </div>

      {/* Top — branding */}
      <div style={{ position:"relative", zIndex:1,
        opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(10px)",
        transition:"opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s"
      }}>
        <img src="/transparent-logo.png" alt="LeanPlan" style={{ height:42, objectFit:"contain" }} />
      </div>

      {/* Middle — tip */}
      <div style={{ position:"relative", zIndex:1, marginTop:"-40px",
        opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)",
        transition:"opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s"
      }}>
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:11, fontWeight:700, letterSpacing:"0.14em", marginBottom:16, textTransform:"uppercase" }}>Today's tip</p>
        <p style={{ color:"#fff", fontSize:34, fontWeight:800, lineHeight:1.25, margin:0, fontFamily:FONT }}>{tip}</p>
      </div>

      {/* Bottom — swipe indicator */}
      <div onClick={dismiss} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, cursor:"pointer", position:"relative", zIndex:1,
        opacity: visible ? 1 : 0, transition:"opacity 0.6s ease 0.2s"
      }}>
        <div style={{ width:36, height:4, background:"rgba(255,255,255,0.2)", borderRadius:99 }} />
        <p style={{ color:"rgba(255,255,255,0.3)", fontSize:12, margin:0, letterSpacing:"0.04em" }}>Swipe up or tap to continue</p>
      </div>
    </div>
  );
};

const JournalCard = ({ journal, setJournal, today }) => {
  const { C } = useTheme();
  const [showJournal, setShowJournal] = useState(false);
  return (
    <Card>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:showJournal?12:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}><Icon name="note" size={14} color={C.muted} /><p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", margin:0 }}>DAILY JOURNAL</p></div>
        <button onClick={()=>setShowJournal(s=>!s)} style={{ background:"none", border:"none", color:C.accent, fontSize:13, cursor:"pointer", fontFamily:FONT, fontWeight:600 }}>{showJournal?"Done":"Write"}</button>
      </div>
      {showJournal&&<textarea value={journal[today]||""} onChange={e=>setJournal(j=>({...j,[today]:e.target.value}))} placeholder="How are you feeling today? Energy levels, sleep, anything notable..." style={{ width:"100%", minHeight:80, background:C.sectionBg, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 12px", fontSize:14, fontFamily:FONT, color:C.text, outline:"none", resize:"vertical" }} />}
      {!showJournal&&journal[today]&&<p style={{ color:C.textSec, fontSize:14, margin:0, marginTop:8, lineHeight:1.6 }}>{journal[today]}</p>}
    </Card>
  );
};

export const TodayTab = ({ profile, entries, mealLog, setMealLog, workoutLog, water, setWater, journal, setJournal, measurements, mealPlan, setTab }) => {
  const { C } = useTheme();
  const today = todayKey();
  const cur = entries.length>0?entries[entries.length-1].weight:profile.startWeightLbs;
  const lost = Math.max(0,profile.startWeightLbs-cur);
  const lostKg = parseFloat((lost*0.453592).toFixed(1));
  const pace = getPace(profile.paceId||"normal");
  const tdee = calcTDEE(profile);
  const targetCals = tdee ? tdee - Math.round(pace.lbs*500) : 2000;
  const targetProtein = profile.age>=50 ? Math.round((profile.startWeightLbs*0.453592)*2.4) : Math.round((profile.startWeightLbs*0.453592)*2.2);
  const targetCarbs = Math.round((targetCals * 0.4) / 4);
  const targetFat = Math.round((targetCals * 0.3) / 9);
  const todayMeals = mealLog[today]||[];
  const todayCalories = todayMeals.reduce((a,m)=>a+m.cals,0);
  const todayProtein = todayMeals.reduce((a,m)=>a+m.protein,0);
  const todayCarbs = todayMeals.reduce((a,m)=>a+(m.carbs||0),0);
  const todayFat = todayMeals.reduce((a,m)=>a+(m.fat||0),0);
  const todayWater = water[today]||0;
  const todayWorked = workoutLog[today];

  // Planned meals count
  const todayPlan = mealPlan?.days?.find(d => d.date === today);
  const plannedCount = todayPlan?.meals?.length || 5;

  // Streak
  let streak=0;
  for (let i=0;;i++) {
    const d=new Date(); d.setDate(d.getDate()-i);
    const k=d.toISOString().split("T")[0];
    if ((mealLog[k]||[]).length>0||(workoutLog[k])||((water[k]||0)>0)) streak++;
    else break;
  }

  // Today's workout
  const weekPlan = getWeeklyPlan(profile);
  const dayMap = { Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6, Sun:0 };
  const todayDayOfWeek = new Date().getDay();
  const sessionIdx = weekPlan.days.findIndex(d => dayMap[d] === todayDayOfWeek);
  const todaySession = sessionIdx !== -1 ? weekPlan.sessions[sessionIdx] : null;
  const block = getCurrentBlock(profile);

  // Calorie ring
  const circumference = 2 * Math.PI * 34;
  const calOffset = circumference - (circumference * Math.min(1, todayCalories / targetCals));

  // Personalised insights — pick the most relevant one for today
  const insights = (() => {
    const msgs = [];
    const hour = new Date().getHours();

    // Workout insights
    const weekWorkouts = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-d.getDay()+1+i); return workoutLog[d.toISOString().split("T")[0]]?1:0; }).reduce((a,b)=>a+b,0);
    if (todayWorked) msgs.push({ text:`Workout done ✓ — ${weekWorkouts} of ${profile.workoutsPerWeek||3} this week`, priority:2 });
    if (!todayWorked && todaySession && hour >= 16) msgs.push({ text:`Still time for your ${todaySession.label} today 💪`, priority:3 });

    // Protein insights
    const proteinDaysHit = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-i); const k=d.toISOString().split("T")[0]; return (mealLog[k]||[]).reduce((a,m)=>a+m.protein,0) >= targetProtein ? 1 : 0; }).reduce((a,b)=>a+b,0);
    if (proteinDaysHit >= 4) msgs.push({ text:`Protein target hit ${proteinDaysHit} days this week 💪`, priority:2 });
    if (todayProtein >= targetProtein) msgs.push({ text:`Protein target hit today — great work!`, priority:1 });
    if (todayProtein > 0 && todayProtein < targetProtein * 0.5 && hour >= 18) msgs.push({ text:`You're low on protein today — add a shake or snack`, priority:4 });

    // Calorie insights
    if (todayCalories > 0 && todayCalories < targetCals * 0.6 && hour >= 19) msgs.push({ text:`You're ${targetCals - todayCalories} calories under today — consider a snack`, priority:3 });
    if (todayCalories > targetCals * 1.1) msgs.push({ text:`Over your calorie target today — balance it out tomorrow`, priority:3 });

    // Streak insights
    if (streak >= 7) msgs.push({ text:`${streak} day streak — you're on fire! 🔥`, priority:1 });
    if (streak >= 3 && streak < 7) msgs.push({ text:`${streak} day streak — keep it going! 🔥`, priority:2 });

    // Water insights
    if (todayWater >= 8) msgs.push({ text:`Hydration goal hit today — well done 💧`, priority:1 });
    if (todayWater === 0 && hour >= 12) msgs.push({ text:`Don't forget to drink water today 💧`, priority:3 });

    // Weight progress
    if (lostKg >= 1) msgs.push({ text:`${lostKg}kg lost so far — you're making real progress`, priority:2 });

    // Weekly workout goal hit
    if (weekWorkouts >= (profile.workoutsPerWeek||3)) msgs.push({ text:`Weekly workout goal hit! 🎯 Rest up or go for a bonus session`, priority:1 });

    // Sort by priority (lower = more important) and return top one
    if (msgs.length === 0) return { text:`Log your meals and workouts to get personalised insights`, priority:5 };
    return msgs.sort((a,b) => a.priority - b.priority)[0];
  })();

  // Date + greeting
  const dayName = new Date().toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"long" });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom:12 }}>
        <p style={{ color:C.muted, fontSize:13, margin:"0 0 2px" }}>{dayName}</p>
        <h2 style={{ color:C.text, fontSize:22, fontWeight:700, margin:"0 0 8px" }}>{greeting}{profile.name?`, ${profile.name}`:""} 👋</h2>
        <div style={{ background:`${C.accent}18`, border:`1px solid ${C.accent}44`, borderRadius:12, padding:"10px 14px" }}>
          <p style={{ color:C.accent, fontSize:14, fontWeight:600, margin:0 }}>{insights.text}</p>
        </div>
      </div>

      {/* Calorie ring + macros */}
      <div style={{ background:C.card, borderRadius:16, padding:"14px 16px", marginBottom:10, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:16 }}>
        <div style={{ position:"relative", width:80, height:80, flexShrink:0 }}>
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke={C.sectionBg} strokeWidth="8"/>
            <circle cx="40" cy="40" r="34" fill="none" stroke={C.accent} strokeWidth="8"
              strokeDasharray={circumference} strokeDashoffset={calOffset}
              strokeLinecap="round" transform="rotate(-90 40 40)"
              style={{ transition:"stroke-dashoffset 0.6s ease" }}/>
          </svg>
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
            <span style={{ color:C.text, fontSize:16, fontWeight:700, lineHeight:1 }}>{todayCalories}</span>
            <span style={{ color:C.muted, fontSize:10 }}>/ {targetCals}</span>
          </div>
        </div>
        <div style={{ flex:1 }}>
          <p style={{ color:C.muted, fontSize:11, fontWeight:600, letterSpacing:"0.06em", margin:"0 0 8px" }}>CALORIES TODAY</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
            {[
              { label:"protein", val:todayProtein, target:targetProtein, color:C.green },
              { label:"carbs", val:todayCarbs, target:targetCarbs, color:C.orange },
              { label:"fat", val:todayFat, target:targetFat, color:C.red },
            ].map(m=>(
              <div key={m.label}>
                <p style={{ color:C.text, fontSize:14, fontWeight:700, margin:0 }}>{m.val}g</p>
                <p style={{ color:C.muted, fontSize:11, margin:0 }}>{m.label}</p>
                <div style={{ height:3, background:C.sectionBg, borderRadius:99, marginTop:4 }}>
                  <div style={{ width:`${Math.min(100, Math.round((m.val/m.target)*100))}%`, height:"100%", background:m.color, borderRadius:99 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Meals + Workout summary */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
        <div style={{ background:C.card, borderRadius:16, padding:14, border:`1px solid ${C.border}` }}>
          <p style={{ color:C.muted, fontSize:11, fontWeight:600, letterSpacing:"0.06em", margin:"0 0 6px" }}>MEALS</p>
          <p style={{ color:C.text, fontSize:22, fontWeight:700, margin:"0 0 2px" }}>{todayMeals.length}<span style={{ color:C.muted, fontSize:14, fontWeight:400 }}> / {plannedCount}</span></p>
          <p style={{ color:C.muted, fontSize:12, margin:"0 0 10px" }}>logged today</p>
          <button onClick={()=>setTab("Meals")} style={{ width:"100%", background:C.accent, border:"none", borderRadius:10, padding:"7px 0", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:FONT }}>View meals →</button>
        </div>
        <div style={{ background:C.card, borderRadius:16, padding:14, border:`1px solid ${C.border}` }}>
          <p style={{ color:C.muted, fontSize:11, fontWeight:600, letterSpacing:"0.06em", margin:"0 0 6px" }}>WORKOUT</p>
          {todayWorked ? (
            <>
              <p style={{ color:C.green, fontSize:15, fontWeight:700, margin:"0 0 2px" }}>Done ✓</p>
              <p style={{ color:C.muted, fontSize:12, margin:"0 0 10px" }}>{todayWorked.type.split("-").join(" ")}</p>
            </>
          ) : todaySession ? (
            <>
              <p style={{ color:C.text, fontSize:15, fontWeight:700, margin:"0 0 2px" }}>{todaySession.label}</p>
              <p style={{ color:C.muted, fontSize:12, margin:"0 0 10px" }}>Week {block.week} · {block.sets} sets</p>
            </>
          ) : (
            <>
              <p style={{ color:C.text, fontSize:15, fontWeight:700, margin:"0 0 2px" }}>Rest day</p>
              <p style={{ color:C.muted, fontSize:12, margin:"0 0 10px" }}>Recover well</p>
            </>
          )}
          {!todayWorked && todaySession ? (
            <button onClick={()=>setTab("Train")} style={{ width:"100%", background:C.accent, border:"none", borderRadius:10, padding:"7px 0", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:FONT }}>Start →</button>
          ) : (
            <button onClick={()=>setTab("Train")} style={{ width:"100%", background:"none", border:`1px solid ${C.border}`, borderRadius:10, padding:"7px 0", color:C.muted, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:FONT }}>View plan →</button>
          )}
        </div>
      </div>

      {/* Water + Progress */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
        <div style={{ background:C.card, borderRadius:16, padding:14, border:`1px solid ${C.border}` }}>
          <p style={{ color:C.muted, fontSize:11, fontWeight:600, letterSpacing:"0.06em", margin:"0 0 6px" }}>WATER</p>
          <p style={{ color:C.teal, fontSize:22, fontWeight:700, margin:"0 0 4px" }}>{(todayWater*0.25).toFixed(2)}L</p>
          <div style={{ height:4, background:C.sectionBg, borderRadius:99, marginBottom:8 }}>
            <div style={{ width:`${Math.min(100, Math.round((todayWater/8)*100))}%`, height:"100%", background:C.teal, borderRadius:99 }} />
          </div>
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={()=>setWater(w=>({...w,[today]:Math.max(0,(w[today]||0)-1)}))} style={{ flex:1, background:C.sectionBg, border:"none", borderRadius:8, padding:"6px 0", color:C.teal, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:FONT }}>−</button>
            <button onClick={()=>setWater(w=>({...w,[today]:Math.min(16,(w[today]||0)+1)}))} style={{ flex:2, background:`${C.teal}18`, border:`1px solid ${C.teal}44`, borderRadius:8, padding:"6px 0", color:C.teal, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:FONT }}>+250ml</button>
          </div>
        </div>
        <div style={{ background:C.card, borderRadius:16, padding:14, border:`1px solid ${C.border}` }}>
          <p style={{ color:C.muted, fontSize:11, fontWeight:600, letterSpacing:"0.06em", margin:"0 0 6px" }}>PROGRESS</p>
          <p style={{ color:C.text, fontSize:22, fontWeight:700, margin:"0 0 2px" }}>{toKg(cur)}<span style={{ fontSize:14, color:C.muted }}> kg</span></p>
          <p style={{ color:lostKg>0?C.green:C.muted, fontSize:12, fontWeight:600, margin:"0 0 6px" }}>{lostKg>0?`${lostKg} kg lost`:"Starting weight"}</p>
          <p style={{ color:C.muted, fontSize:11, margin:0 }}>🔥 {streak} day streak</p>
        </div>
      </div>

      {/* Journal */}
      <JournalCard journal={journal} setJournal={setJournal} today={today} />
    </div>
  );
};


