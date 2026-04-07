import React from "react";

export const ProBanner = ({ onUpgrade }) => (
  <div onClick={onUpgrade} style={{ background:"linear-gradient(135deg, #1c1c2e, #2d2b55)", borderRadius:14, padding:"12px 16px", marginBottom:14, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:"0 4px 16px rgba(88,86,214,0.3)", border:"1px solid rgba(88,86,214,0.4)" }}>
    <div style={{ flex:1, marginRight:10 }}>
      <p style={{ color:"#fff", fontWeight:700, fontSize:14, margin:0 }}>✦ Unlock LeanPlan Pro</p>
      <p style={{ color:"rgba(255,255,255,0.6)", fontSize:12, margin:"2px 0 0" }}>From £14.99/mo — AI coach, workouts & more</p>
    </div>
    <div style={{ background:"#5856d6", borderRadius:99, padding:"7px 14px", flexShrink:0 }}>
      <span style={{ color:"#fff", fontWeight:700, fontSize:13, whiteSpace:"nowrap" }}>Upgrade →</span>
    </div>
  </div>
);
