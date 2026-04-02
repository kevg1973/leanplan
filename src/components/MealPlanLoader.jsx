import React, { useState, useEffect } from "react";

const MEAL_LOADING_STEPS = [
  { icon:"🧮", msg:"Calculating your calorie targets..." },
  { icon:"🥗", msg:"Selecting your core ingredients..." },
  { icon:"☀️", msg:"Building your breakfasts..." },
  { icon:"🍎", msg:"Planning your snacks..." },
  { icon:"🥗", msg:"Crafting your lunches..." },
  { icon:"🌙", msg:"Creating your dinners..." },
  { icon:"🛒", msg:"Preparing your shopping list..." },
  { icon:"✦",  msg:"Putting it all together..." },
];

export const MealPlanLoader = ({ progress }) => {
  const [step, setStep] = useState(0);
  const [pct, setPct] = useState(4);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStep(s => (s + 1) % MEAL_LOADING_STEPS.length);
      setPct(p => Math.min(94, p + Math.random() * 14 + 6));
    }, 2400);
    return () => clearInterval(stepTimer);
  }, []);

  const current = MEAL_LOADING_STEPS[step];

  return (
    <div style={{ background:`linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)`, borderRadius:20, padding:"28px 20px", marginTop:8, textAlign:"center", overflow:"hidden", position:"relative" }}>
      <style>{`
        @keyframes mealSpin { 0%{transform:rotate(0deg) scale(1)} 50%{transform:rotate(180deg) scale(1.15)} 100%{transform:rotate(360deg) scale(1)} }
        @keyframes mealFade { 0%{opacity:0;transform:translateY(8px)} 30%{opacity:1;transform:translateY(0)} 70%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-8px)} }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        @keyframes orbFloat { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-12px)} }
      `}</style>

      {/* Background orbs */}
      <div style={{ position:"absolute", top:-30, right:-30, width:120, height:120, borderRadius:"50%", background:"rgba(0,122,255,0.12)", animation:"orbFloat 3s ease-in-out infinite", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:-20, left:-20, width:80, height:80, borderRadius:"50%", background:"rgba(52,199,89,0.1)", animation:"orbFloat 4s ease-in-out 1s infinite", pointerEvents:"none" }} />

      {/* Spinning icon */}
      <div style={{ width:72, height:72, borderRadius:"50%", background:"rgba(255,255,255,0.08)", border:"2px solid rgba(255,255,255,0.12)", margin:"0 auto 16px", display:"flex", alignItems:"center", justifyContent:"center", animation:"mealSpin 3s linear infinite", fontSize:32 }}>
        {current.icon}
      </div>

      {/* Message */}
      <div style={{ height:28, overflow:"hidden", marginBottom:6 }}>
        <p key={step} style={{ color:"#fff", fontSize:15, fontWeight:700, margin:0, animation:"mealFade 2.4s ease-in-out" }}>
          {current.msg}
        </p>
      </div>
      <p style={{ color:"rgba(255,255,255,0.45)", fontSize:12, margin:"0 0 20px" }}>
        {progress || "This takes 20–30 seconds"}
      </p>

      {/* Progress bar */}
      <div style={{ background:"rgba(255,255,255,0.1)", borderRadius:99, height:6, overflow:"hidden", position:"relative" }}>
        <div style={{ height:"100%", borderRadius:99, background:"linear-gradient(90deg, #007aff, #34c759)", width:`${pct}%`, transition:"width 0.8s ease", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)", animation:"shimmer 1.5s ease-in-out infinite" }} />
        </div>
      </div>
      <p style={{ color:"rgba(255,255,255,0.3)", fontSize:11, margin:"8px 0 0" }}>AI is personalising your plan</p>
    </div>
  );
};
