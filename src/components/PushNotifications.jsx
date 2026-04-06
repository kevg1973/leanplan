import React, { useState } from "react";
import { supabase } from "../supabase.js";
import { FONT } from "../constants.js";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export const PushNotifications = ({ user, onDismiss }) => {
  const [loading, setLoading] = useState(false);

  const dismiss = () => {
    localStorage.setItem("leanplan_push_asked", "true");
    onDismiss();
  };

  const handleEnable = async () => {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
        });
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ subscription: sub }),
          });
          console.log("Push subscription saved");
        }
      }
    } catch (err) {
      console.error("Push setup error:", err);
    }
    setLoading(false);
    dismiss();
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:FONT }}>
      <div style={{ background:"#1c1c1e", borderRadius:24, padding:"36px 28px 28px", maxWidth:380, width:"100%", textAlign:"center", border:"1px solid rgba(255,255,255,0.1)" }}>

        <div style={{ width:56, height:56, borderRadius:14, background:"rgba(10,132,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", fontSize:28 }}>🔔</div>

        <h2 style={{ color:"#fff", fontSize:22, fontWeight:800, margin:"0 0 8px", letterSpacing:"-0.3px" }}>Stay on track with reminders</h2>
        <p style={{ color:"#8e8e93", fontSize:14, lineHeight:1.6, margin:"0 0 28px" }}>Get notified about workouts, meal plan updates, and your weekly progress.</p>

        <button onClick={handleEnable} disabled={loading} style={{ width:"100%", background:"#0a84ff", border:"none", borderRadius:14, padding:"15px 0", color:"#fff", fontSize:17, fontWeight:700, cursor:loading?"default":"pointer", fontFamily:FONT, marginBottom:12, opacity:loading?0.6:1 }}>
          {loading ? "Setting up..." : "Enable reminders"}
        </button>
        <button onClick={dismiss} style={{ background:"none", border:"none", color:"#8e8e93", fontSize:14, cursor:"pointer", fontFamily:FONT, padding:"4px 0" }}>
          No thanks
        </button>
      </div>
    </div>
  );
};
