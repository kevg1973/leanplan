import React from "react";
import { useTheme } from "../ThemeContext.jsx";
import { fmtDate } from "../helpers.js";
import { Card } from "./ui.jsx";
import { Icon } from "./Icon.jsx";

export const LiftTracker = ({ lifts={}, setLifts, workoutLog }) => {
  const C = useTheme();
  return (
    <div>
      <Card style={{ background:`${C.indigo}08`, borderColor:`${C.indigo}22` }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}><Icon name="barbell" size={14} color={C.indigo} /><p style={{ color:C.indigo, fontSize:12, fontWeight:700, margin:0 }}>PROGRESS</p></div>
        <p style={{ color:C.text, fontSize:13, lineHeight:1.6, margin:0 }}>Log weights on each exercise during your workout — your progress appears here automatically.</p>
      </Card>

      {Object.keys(lifts).length===0&&<Card><p style={{ color:C.muted, fontSize:14, textAlign:"center", margin:0 }}>No lifts logged yet. Start a workout and log your weights on each exercise!</p></Card>}

      {Object.entries(lifts).map(([name,entries])=>{
        const latest=entries[entries.length-1];
        const prev=entries.length>1?entries[entries.length-2]:null;
        const improved=prev&&latest.weight>prev.weight;
        const same=prev&&latest.weight===prev.weight;
        return <Card key={name} style={{ borderLeft:`3px solid ${improved?C.green:same?C.accent:C.muted}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
            <div><p style={{ color:C.text, fontWeight:700, fontSize:15, margin:0 }}>{name}</p><p style={{ color:C.muted, fontSize:12, margin:"2px 0 0" }}>{entries.length} sessions logged</p></div>
            <div style={{ textAlign:"right" }}>
              <div style={{ color:improved?C.green:C.text, fontSize:18, fontWeight:700 }}>{latest.weight}kg</div>
              <div style={{ color:C.muted, fontSize:12 }}>{latest.sets}×{latest.reps} · {fmtDate(latest.date)}</div>
              {improved&&<div style={{ color:C.green, fontSize:11, fontWeight:600 }}>▲ +{(latest.weight-prev.weight).toFixed(1)}kg</div>}
            </div>
          </div>
          {entries.length>1&&<div style={{ display:"flex", gap:4, alignItems:"flex-end", height:40 }}>
            {entries.slice(-8).map((e,i,arr)=>{
              const maxW=Math.max(...arr.map(x=>x.weight));
              const h=Math.max(20,(e.weight/maxW)*36);
              return <div key={i} style={{ flex:1, background:i===arr.length-1?C.indigo:`${C.indigo}44`, borderRadius:"3px 3px 0 0", height:h, transition:"height 0.3s" }} title={`${e.weight}kg`} />;
            })}
          </div>}
        </Card>;
      })}
    </div>
  );
};
