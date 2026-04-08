import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { FONT } from "../constants.js";

export const GoalReachedScreen = ({ profile, weightEntries, workoutLog, onMaintenance, onNewGoal }) => {
  useEffect(() => {
    const fire = (originX) => confetti({
      particleCount: 120,
      spread: 70,
      origin: { x: originX, y: 1 },
      colors: ["#3B82F6","#22C55E","#F59E0B","#EC4899","#8B5CF6","#EF4444","#06B6D4","#F97316"],
      ticks: 300,
      gravity: 0.8,
      scalar: 1.1,
      shapes: ["square", "circle"],
    });
    setTimeout(() => { fire(0.1); fire(0.9); }, 300);
    setTimeout(() => { fire(0.2); fire(0.8); }, 600);
    setTimeout(() => { fire(0.5); }, 900);
  }, []);

  const name = profile?.name || "champion";
  const goal = profile?.goal || "lose_weight";
  const isWeightGoal = goal === "lose_weight" || goal === "all";

  // Stats
  const startKg = parseFloat(profile?.startWeight || profile?.startWeightKg || 80);
  const currentKg = weightEntries?.length > 0 ? weightEntries[weightEntries.length - 1].weight : startKg;
  const kgLost = Math.max(0, startKg - currentKg).toFixed(1);

  const startDate = profile?.trainingStartDate ? new Date(profile.trainingStartDate) : new Date();
  const weeksTaken = ((Date.now() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)).toFixed(1);

  const workoutsCompleted = workoutLog ? Object.keys(workoutLog).length : 0;

  const subtext = isWeightGoal
    ? `You set out to lose ${kgLost}kg and you've done exactly that. That takes real consistency.`
    : "You've completed your full training programme. That takes real dedication.";

  const stats = isWeightGoal
    ? [
        { value: `${kgLost}kg`, label: "Total lost" },
        { value: weeksTaken, label: "Weeks" },
        { value: workoutsCompleted, label: "Workouts" },
      ]
    : [
        { value: workoutsCompleted, label: "Workouts" },
        { value: weeksTaken, label: "Weeks trained" },
        { value: `${currentKg}kg`, label: "Current weight" },
      ];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9999, background:"#0d1117", overflow:"auto", fontFamily:FONT }}>
      <div style={{ maxWidth:440, margin:"0 auto", padding:"60px 24px 48px", textAlign:"center" }}>

        {/* Trophy */}
        <div style={{ width:88, height:88, borderRadius:99, background:"rgba(245,158,11,0.12)", border:"2px solid rgba(245,158,11,0.3)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px" }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" /><path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" />
            <path d="M6 3h12v6a6 6 0 0 1-12 0V3z" /><path d="M12 15v3" /><path d="M8 21h8" /><path d="M8 21v-3h8v3" />
          </svg>
        </div>

        {/* Badge */}
        <div style={{ display:"inline-block", background:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.3)", borderRadius:99, padding:"5px 16px", marginBottom:20 }}>
          <span style={{ color:"#22C55E", fontSize:13, fontWeight:600 }}>Goal reached</span>
        </div>

        {/* Headline */}
        <h1 style={{ color:"#fff", fontSize:32, fontWeight:800, margin:"0 0 12px", lineHeight:1.15, letterSpacing:"-0.02em" }}>
          You did it, {name}.
        </h1>

        {/* Subtext */}
        <p style={{ color:"rgba(255,255,255,0.6)", fontSize:15, lineHeight:1.65, margin:"0 0 36px", maxWidth:340, marginLeft:"auto", marginRight:"auto" }}>
          {subtext}
        </p>

        {/* Stat cards */}
        <div style={{ display:"flex", gap:10, marginBottom:36 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ flex:1, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:"18px 12px" }}>
              <div style={{ color:"#fff", fontSize:24, fontWeight:800, marginBottom:4 }}>{s.value}</div>
              <div style={{ color:"rgba(255,255,255,0.5)", fontSize:12 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height:1, background:"rgba(255,255,255,0.08)", marginBottom:32 }} />

        {/* What's next */}
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:12, fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:16 }}>What's next?</p>

        {/* Buttons */}
        <button onClick={onMaintenance} style={{ width:"100%", background:"#22C55E", border:"none", borderRadius:14, padding:"15px 0", color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:FONT, marginBottom:10 }}>
          Switch to maintenance
        </button>
        <button onClick={onNewGoal} style={{ width:"100%", background:"#3B82F6", border:"none", borderRadius:14, padding:"15px 0", color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:FONT }}>
          Set a new goal
        </button>
      </div>
    </div>
  );
};
