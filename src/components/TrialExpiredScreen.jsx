import React from "react";
import { useTheme } from "../ThemeContext.jsx";
import { FONT } from "../constants.js";
import { Btn } from "./ui.jsx";

export const TrialExpiredScreen = ({ onSubscribe }) => {
  const C = useTheme();
  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:FONT, display:"flex", flexDirection:"column", justifyContent:"center", padding:"0 20px" }}>
      <div style={{ maxWidth:400, margin:"0 auto", width:"100%", textAlign:"center" }}>
        <img src="/leanplan_app_icon.png" alt="" style={{ height:80, width:80, borderRadius:20, marginBottom:24 }} />
        <h1 style={{ fontSize:28, fontWeight:800, color:C.text, margin:"0 0 12px" }}>Your 7-day trial has ended</h1>
        <p style={{ color:C.muted, fontSize:15, lineHeight:1.7, marginBottom:24 }}>
          You've had full access to AI meal generation, personalised workouts and your AI health coach. Subscribe to keep it all going.
        </p>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"16px", marginBottom:24, textAlign:"left" }}>
          {[
            "✦ AI meal plans tailored to your diet",
            "✦ Personalised workout programmes",
            "✦ Unlimited AI health coach",
            "✦ Progress tracking & measurements",
            "✦ Shopping lists & supplement guide",
            "✦ Data synced across all devices",
          ].map((f,i)=><p key={i} style={{ color:C.text, fontSize:14, margin:"6px 0" }}>{f}</p>)}
        </div>
        <Btn onClick={onSubscribe} color={C.accent} style={{ width:"100%", fontSize:17, padding:"16px 0", marginBottom:12 }}>
          Continue my fitness journey →
        </Btn>
        <p style={{ color:C.muted, fontSize:12, lineHeight:1.6 }}>
          Cancel anytime · Secure payment by Stripe
        </p>
      </div>
    </div>
  );
};
