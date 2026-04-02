import React from "react";
import { useTheme } from "../ThemeContext.jsx";
import { PACE_OPTIONS, getPace } from "../helpers.js";

export const PacePicker = ({ value, onChange, targetLbs }) => {
  const C = useTheme();
  const selected = getPace(value);
  const etaWeeks = Math.ceil(targetLbs/selected.lbs);
  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
        {PACE_OPTIONS.map(p=>(
          <div key={p.id} onClick={()=>onChange(p.id)} style={{ flex:"1 1 calc(50% - 4px)", background:value===p.id?`${p.color}15`:C.card, border:`2px solid ${value===p.id?p.color:C.border}`, borderRadius:12, padding:"10px 12px", cursor:"pointer", transition:"all 0.2s" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
              <span style={{ color:value===p.id?p.color:C.text, fontWeight:700, fontSize:14 }}>{p.label}</span>
              <span style={{ color:p.color, fontSize:12, fontWeight:700 }}>{p.kgPerWk} kg/wk</span>
            </div>
            <div style={{ color:C.muted, fontSize:11 }}>{Math.round((targetLbs*0.453592)/p.kgPerWk)} wks</div>
          </div>
        ))}
      </div>
      <div style={{ background:`${selected.color}10`, border:`1px solid ${selected.color}33`, borderRadius:12, padding:"12px 14px", marginBottom:selected.warning?10:0 }}>
        <p style={{ color:C.text, fontSize:14, margin:0 }}>📅 <strong style={{ color:selected.color }}>{etaWeeks} weeks</strong> to reach your goal</p>
        <p style={{ color:C.textSec, fontSize:12, margin:"4px 0 0" }}>{selected.desc}</p>
      </div>
      {selected.warning&&<div style={{ background:"#ff3b3010", border:"1px solid #ff3b3033", borderRadius:12, padding:"10px 14px" }}><p style={{ color:C.red, fontSize:13, margin:0, lineHeight:1.6 }}>{selected.warning}</p></div>}
    </div>
  );
};
