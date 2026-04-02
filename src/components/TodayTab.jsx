import React, { useState } from "react";
import { useTheme } from "../ThemeContext.jsx";
import { FONT } from "../constants.js";
import { todayKey, toKg, calcTDEE, getPace } from "../helpers.js";
import { getCurrentBlock, getWeeklyPlan } from "../data/workouts.js";
import { JournalCard } from "./JournalCard.jsx";

export const TodayTab = ({ profile, entries, mealLog, setMealLog, workoutLog, water, setWater, journal, setJournal, measurements, mealPlan, setTab }) => {
  const C = useTheme();
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


