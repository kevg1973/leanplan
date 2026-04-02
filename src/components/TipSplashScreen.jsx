import React from "react";
import { FONT } from "../constants.js";

export const TipSplashScreen = ({ tip, onDismiss }) => {
  const startY = React.useRef(null);
  const [offsetY, setOffsetY] = React.useState(0);
  const [dismissed, setDismissed] = React.useState(false);

  const dismiss = () => {
    setDismissed(true);
    setTimeout(onDismiss, 300);
  };

  const handleTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (startY.current === null) return;
    const dy = startY.current - e.touches[0].clientY;
    if (dy > 0) setOffsetY(dy);
  };

  const handleTouchEnd = () => {
    if (offsetY > 60) {
      dismiss();
    } else {
      setOffsetY(0);
    }
    startY.current = null;
  };

  const [visible, setVisible] = React.useState(false);
  React.useEffect(()=>{ setTimeout(()=>setVisible(true), 150); }, []);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        position:"fixed", inset:0, zIndex:9999,
        background:"#000",
        display:"flex", flexDirection:"column",
        justifyContent:"space-between",
        padding:"48px 32px 40px",
        transform:`translateY(${dismissed ? "-100%" : `-${offsetY}px`})`,
        transition:dismissed ? "transform 0.3s ease-in" : offsetY > 0 ? "none" : "transform 0.1s ease-out",
        opacity: visible ? 1 : 0,
        userSelect:"none",
        fontFamily:FONT,
        overflow:"hidden",
      }}
    >
      {/* Background image */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none", zIndex:0 }}>
        <img src="/splash_bg.png" alt="" style={{ width:"100%", height:"100%", objectFit:"cover", opacity:0.6 }} />
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.8) 100%)" }} />
      </div>

      {/* Top — branding */}
      <div style={{ position:"relative", zIndex:1,
        opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(10px)",
        transition:"opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s"
      }}>
        <img src="/transparent-logo.png" alt="LeanPlan" style={{ height:42, objectFit:"contain" }} />
      </div>

      {/* Middle — tip */}
      <div style={{ position:"relative", zIndex:1, marginTop:"-40px",
        opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)",
        transition:"opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s"
      }}>
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:11, fontWeight:700, letterSpacing:"0.14em", marginBottom:16, textTransform:"uppercase" }}>Today's tip</p>
        <p style={{ color:"#fff", fontSize:34, fontWeight:800, lineHeight:1.25, margin:0, fontFamily:FONT }}>{tip}</p>
      </div>

      {/* Bottom — swipe indicator */}
      <div onClick={dismiss} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, cursor:"pointer", position:"relative", zIndex:1,
        opacity: visible ? 1 : 0, transition:"opacity 0.6s ease 0.2s"
      }}>
        <div style={{ width:36, height:4, background:"rgba(255,255,255,0.2)", borderRadius:99 }} />
        <p style={{ color:"rgba(255,255,255,0.3)", fontSize:12, margin:0, letterSpacing:"0.04em" }}>Swipe up or tap to continue</p>
      </div>
    </div>
  );
};
