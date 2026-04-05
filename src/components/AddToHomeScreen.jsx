import React from "react";
import { FONT } from "../constants.js";

export const AddToHomeScreen = ({ onDismiss }) => {
  const dismiss = () => {
    localStorage.setItem("leanplan_hs_prompt_seen", "true");
    onDismiss();
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:FONT }}>
      <div style={{ background:"#1c1c1e", borderRadius:24, padding:"36px 28px 28px", maxWidth:380, width:"100%", textAlign:"center", border:"1px solid rgba(255,255,255,0.1)" }}>

        {/* Logo */}
        <img src="/leanplan_app_icon.png" alt="LeanPlan" style={{ width:64, height:64, borderRadius:16, margin:"0 auto 20px", display:"block" }} />

        {/* Heading */}
        <h2 style={{ color:"#fff", fontSize:22, fontWeight:800, margin:"0 0 8px", letterSpacing:"-0.3px" }}>Add LeanPlan to your Home Screen</h2>
        <p style={{ color:"#8e8e93", fontSize:14, lineHeight:1.6, margin:"0 0 28px" }}>For the best experience — and to receive workout and meal reminders — add LeanPlan to your Home Screen.</p>

        {/* Steps */}
        <div style={{ textAlign:"left", marginBottom:28 }}>
          {/* Step 1 */}
          <div style={{ display:"flex", alignItems:"flex-start", gap:14, marginBottom:18 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"rgba(10,132,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <span style={{ fontSize:13, fontWeight:800, color:"#0a84ff" }}>1</span>
            </div>
            <div style={{ paddingTop:2 }}>
              <p style={{ color:"#fff", fontSize:15, fontWeight:700, margin:"0 0 4px" }}>
                Tap the Share button
                <span style={{ marginLeft:6, display:"inline-flex", alignItems:"center", verticalAlign:"middle" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a84ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                </span>
              </p>
              <p style={{ color:"#8e8e93", fontSize:13, margin:0, lineHeight:1.5 }}>At the bottom of Safari's toolbar</p>
            </div>
          </div>

          {/* Step 2 */}
          <div style={{ display:"flex", alignItems:"flex-start", gap:14 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"rgba(10,132,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <span style={{ fontSize:13, fontWeight:800, color:"#0a84ff" }}>2</span>
            </div>
            <div style={{ paddingTop:2 }}>
              <p style={{ color:"#fff", fontSize:15, fontWeight:700, margin:"0 0 4px" }}>
                Tap "Add to Home Screen"
                <span style={{ marginLeft:6, display:"inline-flex", alignItems:"center", verticalAlign:"middle" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a84ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="4" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </span>
              </p>
              <p style={{ color:"#8e8e93", fontSize:13, margin:0, lineHeight:1.5 }}>Scroll down in the share menu to find it</p>
            </div>
          </div>
        </div>

        {/* Safari share bar illustration */}
        <div style={{ background:"#2c2c2e", borderRadius:14, padding:"12px 16px", marginBottom:24, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", gap:20, alignItems:"center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
          </div>
          <div style={{ position:"relative" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0a84ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            <div style={{ position:"absolute", top:-6, right:-6, width:10, height:10, borderRadius:99, background:"#ff3b30", border:"2px solid #2c2c2e" }} />
          </div>
          <div style={{ display:"flex", gap:20, alignItems:"center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" /></svg>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
          </div>
        </div>

        {/* Buttons */}
        <button onClick={dismiss} style={{ width:"100%", background:"#0a84ff", border:"none", borderRadius:14, padding:"15px 0", color:"#fff", fontSize:17, fontWeight:700, cursor:"pointer", fontFamily:FONT, marginBottom:12 }}>
          Got it
        </button>
        <button onClick={dismiss} style={{ background:"none", border:"none", color:"#8e8e93", fontSize:14, cursor:"pointer", fontFamily:FONT, padding:"4px 0" }}>
          Maybe later
        </button>
      </div>
    </div>
  );
};
