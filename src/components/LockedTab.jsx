import React from "react";
import { useTheme } from "../ThemeContext.jsx";
import { isNativeIOS } from "../helpers.js";
import { Btn } from "./ui.jsx";
import { Icon } from "./Icon.jsx";

export const LockedTab = ({ feature, onUpgrade, onSignIn }) => {
  const C = useTheme();

  // ── Native iOS variant ─────────────────────────────────────────────────────
  // No upgrade CTA, no price, no link out (App Store guideline 3.1.1).
  // Offers sign-in for users who may already have an account.
  if (isNativeIOS()) {
    return (
      <div style={{ textAlign:"center", padding:"60px 20px" }}>
        <div style={{ width:72, height:72, borderRadius:99, background:`${C.accent}15`, border:`2px solid ${C.accent}33`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
          <Icon name="target" size={32} color={C.accent} />
        </div>
        <h2 style={{ color:C.text, fontSize:22, fontWeight:700, marginBottom:10 }}>Sign in to access</h2>
        <p style={{ color:C.muted, fontSize:15, lineHeight:1.7, marginBottom:28, maxWidth:280, margin:"0 auto 28px" }}>{feature} requires an active LeanPlan account.</p>
        {onSignIn && (
          <Btn onClick={onSignIn} color={C.accent} style={{ width:"100%", maxWidth:280 }}>Sign In</Btn>
        )}
      </div>
    );
  }

  // ── Web variant (unchanged) ────────────────────────────────────────────────
  return (
    <div style={{ textAlign:"center", padding:"60px 20px" }}>
      <div style={{ width:72, height:72, borderRadius:99, background:`${C.accent}15`, border:`2px solid ${C.accent}33`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
        <Icon name="target" size={32} color={C.accent} />
      </div>
      <h2 style={{ color:C.text, fontSize:22, fontWeight:700, marginBottom:10 }}>Pro Feature</h2>
      <p style={{ color:C.muted, fontSize:15, lineHeight:1.7, marginBottom:28, maxWidth:280, margin:"0 auto 28px" }}>{feature} is available on LeanPlan Pro.</p>
      <Btn onClick={onUpgrade} color="#5856d6" style={{ width:"100%", maxWidth:280 }}>✦ Unlock Pro from £14.99/mo</Btn>
      <p style={{ color:C.muted, fontSize:12, marginTop:14 }}>Cancel anytime. No commitment.</p>
    </div>
  );
};
