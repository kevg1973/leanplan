import React, { useState } from "react";
import { useTheme } from "../ThemeContext.jsx";
import { Btn } from "./ui.jsx";
import { Icon } from "./Icon.jsx";

export const PaywallModal = ({ onClose }) => {
  const C = useTheme();
  const [selectedPlan, setSelectedPlan] = useState("annual");
  const [loading, setLoading] = useState(false);

  const checkout = async () => {
    setLoading(true);
    const deviceId = localStorage.getItem("leanplan_device_id") || (() => {
      const id = Math.random().toString(36).slice(2);
      localStorage.setItem("leanplan_device_id", id);
      return id;
    })();
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan, deviceId }),
      });
      if (!res.ok) { alert("Payment setup failed. Please try again."); setLoading(false); return; }
      const data = await res.json();
      if (data.url) { window.location.href = data.url; }
      else { alert("Payment setup failed. Please try again."); setLoading(false); }
    } catch(err) { alert("Could not connect to payment server. Please try again."); setLoading(false); }
  };

  return (
    <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:1000, background:C.bg, overflowY:"auto", WebkitOverflowScrolling:"touch", paddingTop:"env(safe-area-inset-top)", paddingBottom:"env(safe-area-inset-bottom)" }}>
      {/* Close */}
      <button onClick={onClose} style={{ position:"sticky", top:16, float:"right", marginRight:16, background:C.sectionBg, border:"none", borderRadius:99, width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", zIndex:10 }}>
        <Icon name="close" size={16} color={C.muted} />
      </button>

      <div style={{ padding:"16px 20px 48px", maxWidth:480, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:24, paddingTop:8 }}>
          <h2 style={{ color:C.text, fontSize:28, fontWeight:800, margin:"0 0 10px", lineHeight:1.2, letterSpacing:"-0.3px" }}>Keep your<br/>personalised plan</h2>
          <p style={{ color:C.muted, fontSize:15, margin:0, lineHeight:1.5 }}>Your meals, workouts and progress are ready—<br/>keep everything going</p>
        </div>

        {/* Momentum banner */}
        <div style={{ background:`${C.green}12`, border:`1px solid ${C.green}33`, borderRadius:14, padding:"12px 16px", marginBottom:20, display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:22 }}>🏃</span>
          <p style={{ color:C.text, fontSize:14, fontWeight:600, margin:0 }}><strong>You've started your plan</strong> — keep the momentum going</p>
        </div>

        {/* Key features — simple checklist */}
        <div style={{ marginBottom:24 }}>
          {["Daily meals planned for you", "Structured workouts for your goal", "AI coach available 24/7", "Progress photos & measurements", "Automatic shopping lists"].map((f,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 0", borderBottom: i < 4 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ width:22, height:22, borderRadius:99, background:`${C.green}20`, border:`1.5px solid ${C.green}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <span style={{ color:C.green, fontSize:12, fontWeight:700 }}>✓</span>
              </div>
              <span style={{ color:C.text, fontSize:15 }}>{f}</span>
            </div>
          ))}
        </div>

        {/* Plan cards */}
        <div style={{ display:"flex", gap:10, marginBottom:16 }}>
          {/* Monthly */}
          <div onClick={()=>setSelectedPlan("monthly")} style={{ flex:1, border:`2px solid ${selectedPlan==="monthly"?C.accent:C.border}`, borderRadius:16, padding:"16px 12px", cursor:"pointer", background:selectedPlan==="monthly"?`${C.accent}08`:C.card, textAlign:"center", position:"relative" }}>
            <p style={{ color:C.muted, fontSize:13, fontWeight:600, margin:"0 0 6px" }}>Monthly</p>
            <p style={{ color:C.text, fontSize:26, fontWeight:800, margin:"0 0 2px", letterSpacing:"-0.5px" }}>£9.99<span style={{ fontSize:14, fontWeight:500 }}>/month</span></p>
            <div style={{ height:26, marginBottom:8 }} />
            <div style={{ borderTop:`1px solid ${C.border}`, marginBottom:10 }} />
            <div style={{ border:`1.5px solid ${selectedPlan==="monthly"?C.accent:C.border}`, borderRadius:99, padding:"6px 0", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              <div style={{ width:16, height:16, borderRadius:99, border:`2px solid ${selectedPlan==="monthly"?C.accent:C.border}`, background: selectedPlan==="monthly"?C.accent:"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                {selectedPlan==="monthly" && <span style={{ color:"#fff", fontSize:9, fontWeight:700 }}>✓</span>}
              </div>
              <span style={{ color:C.text, fontSize:13, fontWeight:600 }}>£9.99/month</span>
            </div>
          </div>

          {/* Annual */}
          <div onClick={()=>setSelectedPlan("annual")} style={{ flex:1, border:`2px solid ${selectedPlan==="annual"?C.green:C.border}`, borderRadius:16, padding:"16px 12px", cursor:"pointer", background:selectedPlan==="annual"?`${C.green}08`:C.card, textAlign:"center", position:"relative" }}>
            <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", background:"#f59e0b", color:"#fff", borderRadius:99, padding:"3px 12px", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>⭐ Most popular</div>
            <p style={{ color:C.muted, fontSize:13, fontWeight:600, margin:"0 0 6px" }}>Annual</p>
            <p style={{ color:C.text, fontSize:26, fontWeight:800, margin:"0 0 2px", letterSpacing:"-0.5px" }}>£99<span style={{ fontSize:14, fontWeight:500 }}>/year</span></p>
            <div style={{ display:"inline-block", background:`${C.accent}15`, borderRadius:99, padding:"2px 10px", marginBottom:8 }}>
              <span style={{ color:C.accent, fontSize:12, fontWeight:700 }}>Save £20</span>
            </div>
            <div style={{ borderTop:`1px solid ${C.border}`, marginBottom:10 }} />
            <div style={{ border:`1.5px solid ${selectedPlan==="annual"?C.green:C.border}`, borderRadius:99, padding:"6px 0", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              <div style={{ width:16, height:16, borderRadius:99, border:`2px solid ${selectedPlan==="annual"?C.green:C.border}`, background: selectedPlan==="annual"?C.green:"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                {selectedPlan==="annual" && <span style={{ color:"#fff", fontSize:9, fontWeight:700 }}>✓</span>}
              </div>
              <span style={{ color:C.text, fontSize:13, fontWeight:600 }}>£99/year</span>
            </div>
          </div>
        </div>

        <p style={{ color:C.muted, fontSize:12, textAlign:"center", margin:"0 0 16px" }}>Cancel anytime. No commitment.</p>

        {/* CTA */}
        <Btn onClick={checkout} disabled={loading} color={C.accent} style={{ width:"100%", fontSize:17, padding:"16px 0", marginBottom:10, borderRadius:14 }}>
          {loading ? "Loading..." : "Continue my fitness journey →"}
        </Btn>

        <p style={{ color:C.muted, fontSize:12, textAlign:"center", lineHeight:1.6, margin:0 }}>
          Secure payment by Stripe
        </p>
      </div>
    </div>
  );
};
