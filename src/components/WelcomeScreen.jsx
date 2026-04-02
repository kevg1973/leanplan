import React from "react";
import { useTheme } from "../ThemeContext.jsx";
import { FONT } from "../constants.js";
import { Btn } from "./ui.jsx";

export const WelcomeScreen = ({ onNew, onSignIn }) => {
  const C = useTheme();
  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:FONT, display:"flex", flexDirection:"column", justifyContent:"center", padding:"0 20px" }}>
      <div style={{ maxWidth:400, margin:"0 auto", width:"100%", textAlign:"center" }}>
        <img src="/leanplan_app_icon.png" alt="" style={{ height:88, width:88, borderRadius:22, marginBottom:24 }} />
        <h1 style={{ fontSize:32, fontWeight:800, color:C.text, margin:"0 0 10px" }}>
          <span style={{ color:C.text }}>Lean</span><span style={{ color:C.accent }}>Plan</span>
        </h1>
        <p style={{ color:C.muted, fontSize:16, lineHeight:1.7, marginBottom:48 }}>Your personal AI health & fitness coach</p>

        <Btn onClick={onNew} color={C.accent} style={{ width:"100%", fontSize:17, padding:"16px 0", marginBottom:14 }}>
          Get Started →
        </Btn>

        <button onClick={onSignIn} style={{ width:"100%", background:"none", border:`1.5px solid ${C.border}`, borderRadius:14, padding:"15px 0", color:C.text, fontSize:16, fontWeight:600, cursor:"pointer", fontFamily:FONT }}>
          I already have an account
        </button>

        <p style={{ color:C.muted, fontSize:12, marginTop:24, lineHeight:1.6 }}>
          Takes 3 minutes · Fully personalised to you
        </p>
      </div>
    </div>
  );
};
