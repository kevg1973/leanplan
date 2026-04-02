import React, { useState } from "react";
import { useTheme } from "../ThemeContext.jsx";
import { FONT } from "../constants.js";
import { toKg } from "../helpers.js";
import { TInput, Btn } from "./ui.jsx";

export const WeeklyCheckIn = ({ profile, onDone, onAddEntry }) => {
  const C = useTheme();
  const [weight, setWeight] = useState("");
  const [energy, setEnergy] = useState(null);
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);

  const energyLabels = ["😴 Drained", "😕 Low", "😐 OK", "😊 Good", "🔥 Great"];

  const handleSubmit = () => {
    // Save weight entry if provided
    if (weight) {
      const weightKg = parseFloat(weight);
      const weightLbs = weightKg / 0.453592;
      onAddEntry({ weight: weightLbs, weightKg, label: `W`, date: new Date().toLocaleDateString("en-GB", { day:"numeric", month:"short" }) });
    }
    // Record check-in date
    const thisWeekMonday = (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1); return d.toISOString().split("T")[0]; })();
    localStorage.setItem("leanplan_last_checkin", thisWeekMonday);
    setDone(true);
    setTimeout(() => onDone(), 1500);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:200, fontFamily:FONT }}>
      <div style={{ background:C.bg, borderRadius:"20px 20px 0 0", padding:"24px 20px 40px", width:"100%", maxWidth:480 }}>
        {done ? (
          <div style={{ textAlign:"center", padding:"20px 0" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🎯</div>
            <h3 style={{ color:C.text, fontSize:20, fontWeight:700, margin:"0 0 8px" }}>Check-in saved!</h3>
            <p style={{ color:C.muted, fontSize:14, margin:0 }}>Have a great week.</p>
          </div>
        ) : (
          <>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div>
                <p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", margin:"0 0 2px" }}>WEEKLY CHECK-IN</p>
                <h3 style={{ color:C.text, fontSize:20, fontWeight:700, margin:0 }}>How was your week?</h3>
              </div>
              <button onClick={()=>{ localStorage.setItem("leanplan_last_checkin", (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1); return d.toISOString().split("T")[0]; })()); onDone(); }} style={{ background:"none", border:"none", color:C.muted, fontSize:22, cursor:"pointer", lineHeight:1 }}>×</button>
            </div>

            {/* Weight */}
            <div style={{ marginBottom:20 }}>
              <p style={{ color:C.textSec, fontSize:13, fontWeight:600, margin:"0 0 8px" }}>Current weight (kg)</p>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <TInput value={weight} onChange={e=>setWeight(e.target.value)} placeholder={profile?.startWeightKg ? `Last: ${toKg(profile.startWeightLbs)} kg` : "e.g. 83.5"} type="number" style={{ flex:1 }} />
                <span style={{ color:C.muted, fontSize:14 }}>kg</span>
              </div>
            </div>

            {/* Energy rating */}
            <div style={{ marginBottom:20 }}>
              <p style={{ color:C.textSec, fontSize:13, fontWeight:600, margin:"0 0 8px" }}>Energy levels this week</p>
              <div style={{ display:"flex", gap:8 }}>
                {energyLabels.map((label, i) => (
                  <button key={i} onClick={()=>setEnergy(i+1)} style={{ flex:1, background:energy===i+1?C.accent:`${C.accent}12`, border:`1.5px solid ${energy===i+1?C.accent:`${C.accent}33`}`, borderRadius:10, padding:"8px 4px", cursor:"pointer", fontFamily:FONT }}>
                    <div style={{ fontSize:18, marginBottom:2 }}>{label.split(" ")[0]}</div>
                    <div style={{ color:energy===i+1?"#fff":C.muted, fontSize:10, fontWeight:600 }}>{i+1}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div style={{ marginBottom:20 }}>
              <p style={{ color:C.textSec, fontSize:13, fontWeight:600, margin:"0 0 8px" }}>Anything to note? <span style={{ color:C.muted, fontWeight:400 }}>(optional)</span></p>
              <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Sleep, stress, injuries, wins..." style={{ width:"100%", background:C.sectionBg, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 12px", fontSize:14, fontFamily:FONT, color:C.text, outline:"none", resize:"none", height:72, boxSizing:"border-box" }} />
            </div>

            <Btn onClick={handleSubmit} color={C.accent} style={{ width:"100%", fontSize:16, padding:"14px 0" }}>
              Save check-in
            </Btn>
          </>
        )}
      </div>
    </div>
  );
};
