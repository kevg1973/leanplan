import React, { useState, useEffect } from "react";
import { FONT, ALLERGENS, DISLIKES_LIST } from "../constants.js";

const TOTAL_STEPS = 17;

// ── Building Plan Screen ──────────────────────────────────────────────────────
const BuildingPlanScreen = ({ onDone }) => {
  const [progress, setProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);

  const steps = [
    "Calculating your calorie targets",
    "Personalising your meal plan",
    "Building your workout programme",
    "Setting up your training blocks",
    "Configuring your AI coach",
    "Finalising your health plan",
  ];

  useEffect(() => {
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const newProgress = Math.round((currentStep / steps.length) * 100);
      setProgress(newProgress);
      setCompletedSteps(prev => [...prev, currentStep - 1]);
      if (currentStep >= steps.length) {
        clearInterval(interval);
        setTimeout(onDone, 800);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = circumference - (progress / 100) * circumference;

  return (
    <div style={{ minHeight:"100vh", background:"#000", fontFamily:FONT, display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", padding:"0 32px" }}>
      <h1 style={{ color:"#fff", fontSize:32, fontWeight:800, textAlign:"center", margin:"0 0 12px", lineHeight:1.2 }}>Building your<br/>personal plan</h1>
      <p style={{ color:"rgba(255,255,255,0.5)", fontSize:15, textAlign:"center", marginBottom:48 }}>Tailoring everything to you — just a moment</p>

      <div style={{ position:"relative", width:200, height:200, marginBottom:48 }}>
        <svg width="200" height="200" style={{ transform:"rotate(-90deg)" }}>
          <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
          <circle cx="100" cy="100" r={radius} fill="none" stroke="#007aff" strokeWidth="8"
            strokeDasharray={circumference} strokeDashoffset={strokeDash}
            strokeLinecap="round" style={{ transition:"stroke-dashoffset 0.5s ease" }} />
        </svg>
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <span style={{ color:"#fff", fontSize:36, fontWeight:800 }}>{progress}%</span>
        </div>
      </div>

      <div style={{ width:"100%", maxWidth:320 }}>
        {steps.map((step, i) => {
          const done = completedSteps.includes(i);
          const active = completedSteps.length === i;
          return (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16, opacity:done||active?1:0.3, transition:"opacity 0.3s" }}>
              <div style={{ width:28, height:28, borderRadius:99, background:done?"#007aff":"rgba(255,255,255,0.1)", border:"none", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"background 0.3s" }}>
                {done ? <span style={{ color:"#fff", fontSize:14, fontWeight:700 }}>✓</span>
                : active ? <div style={{ width:10, height:10, borderRadius:99, background:"#007aff", animation:"pulse 0.8s ease-in-out infinite alternate" }} />
                : null}
              </div>
              <p style={{ color:"#fff", fontSize:15, margin:0, fontWeight:done?500:400 }}>{step}</p>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes pulse { from { opacity:0.4; transform:scale(0.8); } to { opacity:1; transform:scale(1.2); } }`}</style>
    </div>
  );
};

const ScrollPicker = ({ values, selected, onSelect, unit="" }) => {
  const ref = React.useRef(null);
  const itemH = 52;

  useEffect(() => {
    const idx = values.indexOf(selected);
    if (ref.current && idx >= 0) {
      ref.current.scrollTop = idx * itemH;
    }
  }, []);

  const lastIdx = React.useRef(-1);
  const handleScroll = () => {
    if (!ref.current) return;
    const idx = Math.round(ref.current.scrollTop / itemH);
    if (values[idx] !== undefined && idx !== lastIdx.current) {
      lastIdx.current = idx;
      onSelect(values[idx]);
      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(10);
    }
  };

  return (
    <div style={{ position:"relative", height:260, overflow:"hidden" }}>
      <div style={{ position:"absolute", top:"50%", left:0, right:0, height:itemH, transform:"translateY(-50%)", background:"rgba(255,255,255,0.08)", borderRadius:12, pointerEvents:"none", zIndex:1 }} />
      <div style={{ position:"absolute", top:0, left:0, right:0, height:104, background:"linear-gradient(to bottom, #000, transparent)", pointerEvents:"none", zIndex:1 }} />
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:104, background:"linear-gradient(to top, #000, transparent)", pointerEvents:"none", zIndex:1 }} />
      <div ref={ref} onScroll={handleScroll} style={{ height:"100%", overflowY:"scroll", scrollSnapType:"y mandatory", paddingTop:104, paddingBottom:104, scrollbarWidth:"none" }}>
        <style>{`.scroll-picker::-webkit-scrollbar{display:none}`}</style>
        {values.map((v,i) => (
          <div key={i} onClick={()=>onSelect(v)} style={{ height:itemH, display:"flex", alignItems:"center", justifyContent:"center", scrollSnapAlign:"center", cursor:"pointer" }}>
            <span style={{ fontSize:v===selected?32:22, fontWeight:v===selected?700:400, color:v===selected?"#fff":"rgba(255,255,255,0.3)", transition:"all 0.2s", fontFamily:FONT }}>
              {v}{unit&&v===selected?` ${unit}`:""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const OOption = ({ label, desc, selected, onClick }) => (
  <div onClick={onClick} style={{ border:`1.5px solid ${selected?"#fff":"rgba(255,255,255,0.15)"}`, borderRadius:14, padding:"14px 18px", marginBottom:10, cursor:"pointer", background:selected?"rgba(255,255,255,0.08)":"transparent" }}>
    <p style={{ color:"#fff", fontSize:16, fontWeight:600, margin:0 }}>{label}</p>
    {desc&&<p style={{ color:"rgba(255,255,255,0.5)", fontSize:12, margin:"3px 0 0" }}>{desc}</p>}
  </div>
);

const OChip = ({ label, selected, onClick, color="#fff" }) => (
  <div onClick={onClick} style={{ border:`1.5px solid ${selected?"#fff":"rgba(255,255,255,0.2)"}`, borderRadius:99, padding:"10px 18px", cursor:"pointer", background:selected?"rgba(255,255,255,0.15)":"transparent", display:"inline-flex", alignItems:"center", margin:"0 8px 8px 0", position:"relative" }}>
    <span style={{ color:"#fff", fontSize:14, fontWeight:600, visibility:"hidden", pointerEvents:"none" }}>{label}</span>
    <span style={{ color:"#fff", fontSize:14, fontWeight:selected?600:400, position:"absolute", left:"18px" }}>{label}</span>
  </div>
);

const OBtn = ({ children, onClick, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{ width:"100%", background:disabled?"rgba(255,255,255,0.2)":"#fff", border:"none", borderRadius:99, padding:"18px 0", color:disabled?"rgba(255,255,255,0.4)":"#000", fontSize:17, fontWeight:700, cursor:disabled?"default":"pointer", fontFamily:FONT, transition:"all 0.2s" }}>{children}</button>
);

export const Onboarding = ({ onDone }) => {
  const [step, setStep] = useState(1);
  const [building, setBuilding] = useState(false);
  const [data, setData] = useState({
    name:"", goal:"lose_weight",
    startWeightKg:83, targetWeightKg:73,
    heightCm:175, age:35, sex:"male",
    fitnessLevel:"beginner",
    injuries:[], equipment:[], workoutStyle:"mixed",
    workoutsPerWeek:3, paceId:"normal",
    dietType:"omnivore", dairyPref:"dairy_free",
    glutenPref:"gluten_free", milkAlt:"soya",
    allergies:[], dislikes:[],
    cookingTime:"moderate", sleepQuality:"average", mealPlanDays:5, appMode:"guided",
    activityLevel:"moderate",
    supplementsOpen:"maybe", supplementsInterested:[],
  });

  const update = (k,v) => setData(d=>({...d,[k]:v}));
  const toggleArr = (k,v) => setData(d=>({...d,[k]:d[k].includes(v)?d[k].filter(x=>x!==v):[...d[k],v]}));

  const finish = () => setBuilding(true);

  const complete = () => {
    const targetLbs = parseFloat(((data.startWeightKg - data.targetWeightKg) * 2.20462).toFixed(1));
    const startWeightLbs = parseFloat((data.startWeightKg * 2.20462).toFixed(1));
    onDone({
      ...data, startWeightLbs, targetLbs,
      startWeight: String(data.startWeightKg), unit:"kg",
      targetRaw: String(data.targetWeightKg),
    });
  };

  if (building) return <BuildingPlanScreen onDone={complete} />;

  const pct = Math.round((step / TOTAL_STEPS) * 100);
  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  const S = { minHeight:"100vh", background:"#000", fontFamily:FONT, display:"flex", flexDirection:"column" };
  const Header = ({ step }) => (
    <div style={{ padding:"56px 24px 0" }}>
      <div style={{ height:3, background:"rgba(255,255,255,0.15)", borderRadius:99, marginBottom:32 }}>
        <div style={{ height:"100%", width:`${pct}%`, background:"#fff", borderRadius:99, transition:"width 0.4s" }} />
      </div>
      {step > 1 && <button onClick={back} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.6)", fontSize:22, cursor:"pointer", padding:0, marginBottom:8 }}>‹</button>}
    </div>
  );

  const weights = Array.from({length:151}, (_,i) => 40+i);
  const heights = Array.from({length:121}, (_,i) => 140+i);
  const ages = Array.from({length:83}, (_,i) => 18+i);

  return (
    <div style={S}>
      {/* Step 1 — Name */}
      {step===1&&<div style={{ flex:1, display:"flex", flexDirection:"column", padding:"0 24px 48px" }}>
        <Header step={step} />
        <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center" }}>
          <h2 style={{ color:"#fff", fontSize:32, fontWeight:800, margin:"0 0 8px", lineHeight:1.2 }}>What should we call you?</h2>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:16, marginBottom:40 }}>Completely optional</p>
          <input value={data.name} onChange={e=>update("name",e.target.value)} placeholder="Your first name" style={{ background:"rgba(255,255,255,0.08)", border:"1.5px solid rgba(255,255,255,0.15)", borderRadius:16, color:"#fff", padding:"18px 20px", fontSize:20, fontFamily:FONT, outline:"none", width:"100%", boxSizing:"border-box" }} />
        </div>
        <OBtn onClick={next}>{data.name ? `Continue, ${data.name} →` : "Continue →"}</OBtn>
      </div>}

      {/* Step 2 — Goal */}
      {step===2&&<div style={{ flex:1, display:"flex", flexDirection:"column", padding:"0 24px 48px" }}>
        <Header step={step} />
        <div style={{ flex:1, paddingTop:8 }}>
          <h2 style={{ color:"#fff", fontSize:32, fontWeight:800, margin:"0 0 8px", lineHeight:1.2 }}>What's your main goal?</h2>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:16, marginBottom:32 }}>We'll build everything around this</p>
          <OOption label="Lose weight" desc="Reduce body fat through diet and exercise" selected={data.goal==="lose_weight"} onClick={()=>{ update("goal","lose_weight"); setTimeout(next,300); }} />
          <OOption label="Build muscle" desc="Gain strength while managing weight" selected={data.goal==="build_muscle"} onClick={()=>{ update("goal","build_muscle"); setTimeout(next,300); }} />
          <OOption label="Get fitter" desc="Improve cardio and general fitness" selected={data.goal==="get_fitter"} onClick={()=>{ update("goal","get_fitter"); setTimeout(next,300); }} />
          <OOption label="All of the above" desc="Lose fat, build muscle, get fitter" selected={data.goal==="all"} onClick={()=>{ update("goal","all"); setTimeout(next,300); }} />
        </div>
      </div>}

      {/* Step 3 — Sex */}
      {step===3&&<div style={{ flex:1, display:"flex", flexDirection:"column", padding:"0 24px 48px" }}>
        <Header step={step} />
        <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center" }}>
          <h2 style={{ color:"#fff", fontSize:32, fontWeight:800, margin:"0 0 8px" }}>Biological sex</h2>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:16, marginBottom:40 }}>Used to calculate your calorie targets accurately</p>
          <OOption label="Male" selected={data.sex==="male"} onClick={()=>{ update("sex","male"); setTimeout(next,300); }} />
          <OOption label="Female" selected={data.sex==="female"} onClick={()=>{ update("sex","female"); setTimeout(next,300); }} />
        </div>
      </div>}

      {/* Step 4 — Age */}
      {step===4&&<div style={{ flex:1, display:"flex", flexDirection:"column", padding:"0 24px 48px" }}>
        <Header step={step} />
        <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center" }}>
          <h2 style={{ color:"#fff", fontSize:32, fontWeight:800, margin:"0 0 8px" }}>How old are you?</h2>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:16, marginBottom:24 }}>Helps us calculate your metabolism accurately</p>
          <ScrollPicker values={ages} selected={data.age} onSelect={v=>update("age",v)} unit="years" />
        </div>
        <OBtn onClick={next}>Continue →</OBtn>
      </div>}

      {/* Step 5 — Height */}
      {step===5&&<div style={{ flex:1, display:"flex", flexDirection:"column", padding:"0 24px 48px" }}>
        <Header step={step} />
        <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center" }}>
          <h2 style={{ color:"#fff", fontSize:32, fontWeight:800, margin:"0 0 8px" }}>What's your height?</h2>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:16, marginBottom:24 }}>Used to calculate your BMI and calorie targets</p>
          <ScrollPicker values={heights} selected={data.heightCm} onSelect={v=>update("heightCm",v)} unit="cm" />
        </div>
        <OBtn onClick={next}>Continue →</OBtn>
      </div>}

      {/* Step 6 — Weight */}
      {step===6&&<div style={{ flex:1, display:"flex", flexDirection:"column", padding:"0 24px 48px" }}>
        <Header step={step} />
        <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center" }}>
          <h2 style={{ color:"#fff", fontSize:32, fontWeight:800, margin:"0 0 8px" }}>Current weight</h2>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:16, marginBottom:24 }}>In kilograms</p>
          <ScrollPicker values={weights} selected={data.startWeightKg} onSelect={v=>update("startWeightKg",v)} unit="kg" />
        </div>
        <OBtn onClick={next}>Continue →</OBtn>
      </div>}

      {/* Step 7 — Target weight (only for weight loss goals) */}
      {step===7&&<div style={{ flex:1, display:"flex", flexDirection:"column", padding:"0 24px 48px" }}>
        <Header step={step} />
        <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center" }}>
          {(data.goal==="lose_weight"||data.goal==="all") ? <>
            <h2 style={{ color:"#fff", fontSize:32, fontWeight:800, margin:"0 0 8px" }}>Target weight</h2>
            <p style={{ color:"rgba(255,255,255,0.5)", fontSize:16, marginBottom:8 }}>What's your goal weight in kg?</p>
            {data.targetWeightKg >= data.startWeightKg && <p style={{ color:"#ff453a", fontSize:13, marginBottom:16 }}>Target must be less than your current weight</p>}
            {data.targetWeightKg < data.startWeightKg && <p style={{ color:"#30d158", fontSize:13, marginBottom:16 }}>That's {(data.startWeightKg - data.targetWeightKg).toFixed(1)} kg to lose 💪</p>}
            <ScrollPicker values={weights} selected={data.targetWeightKg} onSelect={v=>update("targetWeightKg",v)} unit="kg" />
          </> : <>
            <h2 style={{ color:"#fff", fontSize:32, fontWeight:800, margin:"0 0 16px" }}>How many workouts per week?</h2>
            {[2,3,4,5].map(n=><OOption key={n} label={`${n} workouts per week`} selected={data.workoutsPerWeek===n} onClick={()=>{ update("workoutsPerWeek",n); setTimeout(next,300); }} />)}
          </>}
        </div>
        {(data.goal==="lose_weight"||data.goal==="all") && <OBtn onClick={next} disabled={data.targetWeightKg>=data.startWeightKg}>Continue →</OBtn>}
      </div>}

      {/* Step 8 — Fitness level */}
            {/* Step 8 — Pace (weight loss only) */}
      {step===8&&<div style={{ flex:1, display:"flex", flexDirection:"column", padding:"0 24px 48px" }}>
        <Header step={step} />
        <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center" }}>
          {(data.goal==="lose_weight"||data.goal==="all") ? <>
            <h2 style={{ color:"#fff", fontSize:26, fontWeight:800, margin:"0 0 6px" }}>How fast do you want to lose weight?</h2>
            <p style={{ color:"rgba(255,255,255,0.5)", fontSize:14, marginBottom:20 }}>Slower is more sustainable — we recommend Moderate</p>
            <OOption label="Steady — 0.25 kg/week" desc="Gentle and sustainable. Best for long term." selected={data.paceId==="slow"} onClick={()=>{ update("paceId","slow"); setTimeout(next,300); }} />
            <OOption label="Moderate — 0.5 kg/week" desc="Recommended. Steady progress without sacrifice." selected={data.paceId==="normal"} onClick={()=>{ update("paceId","normal"); setTimeout(next,300); }} />
            <OOption label="Active — 0.75 kg/week" desc="Faster results. Requires stricter diet." selected={data.paceId==="fast"} onClick={()=>{ update("paceId","fast"); update("paceConfirmed",false); }} />
            <OOption label="Aggressive — 1 kg/week" desc="Maximum speed. Not recommended long term." selected={data.paceId==="vfast"} onClick={()=>{ update("paceId","vfast"); update("paceConfirmed",false); }} />
            {(data.paceId==="fast"||data.paceId==="vfast")&&<div style={{ background:data.paceId==="vfast"?"rgba(255,69,58,0.15)":"rgba(255,149,0,0.15)", border:`1px solid ${data.paceId==="vfast"?"rgba(255,69,58,0.4)":"rgba(255,149,0,0.4)"}`, borderRadius:12, padding:"14px 16px", marginTop:8 }}>
              <p style={{ color:data.paceId==="vfast"?"#ff453a":"#ff9500", fontSize:13, lineHeight:1.6, margin:"0 0 12px" }}>
                {data.paceId==="fast" ? "⚠️ Requires a 375 cal/day deficit. Keep protein at 120g+ to protect muscle." : "🚨 Requires a strict 500 cal/day deficit. Only recommended if you have significant weight to lose. High protein essential."}
              </p>
              <div onClick={()=>update("paceConfirmed",!data.paceConfirmed)} style={{ display:"flex", alignItems:"center", gap:12, cursor:"pointer" }}>
                <div style={{ width:24, height:24, borderRadius:6, border:`2px solid ${data.paceConfirmed?"#fff":"rgba(255,255,255,0.4)"}`, background:data.paceConfirmed?"#fff":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {data.paceConfirmed&&<span style={{ color:"#000", fontSize:14, fontWeight:700 }}>✓</span>}
                </div>
                <p style={{ color:"rgba(255,255,255,0.8)", fontSize:13, margin:0, lineHeight:1.5 }}>I understand the requirements and want to proceed at this pace</p>
              </div>
            </div>}
          </> : <>
            <h2 style={{ color:"#fff", fontSize:32, fontWeight:800, margin:"0 0 16px" }}>How many workouts per week?</h2>
            {[2,3,4,5].map(n=><OOption key={n} label={`${n} workouts per week`} selected={data.workoutsPerWeek===n} onClick={()=>{ update("workoutsPerWeek",n); setTimeout(next,300); }} />)}
          </>}
        </div>
        {(data.goal==="lose_weight"||data.goal==="all") && (data.paceId==="fast"||data.paceId==="vfast") && (
          <OBtn onClick={next} disabled={!data.paceConfirmed}>Continue →</OBtn>
        )}
      </div>}

      {/* Step 9 — Fitness level */}
      {step===9&&<div style={{ flex:1, display:"flex", flexDirection:"column", padding:"0 24px 48px" }}>
        <Header step={step} />
        <div style={{ flex:1, paddingTop:8 }}>
          <h2 style={{ color:"#fff", fontSize:32, fontWeight:800, margin:"0 0 8px" }}>Your fitness level</h2>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:16, marginBottom:32 }}>Be honest — we'll match the intensity to suit you</p>
          <OOption label="Beginner" desc="New to exercise or returning after a break" selected={data.fitnessLevel==="beginner"} onClick={()=>{ update("fitnessLevel","beginner"); setTimeout(next,300); }} />
          <OOption label="Intermediate" desc="Exercise 1-3x per week, some experience" selected={data.fitnessLevel==="intermediate"} onClick={()=>{ update("fitnessLevel","intermediate"); setTimeout(next,300); }} />
          <OOption label="Active" desc="Regular training 3-5x per week" selected={data.fitnessLevel==="active"} onClick={()=>{ update("fitnessLevel","active"); setTimeout(next,300); }} />
          <OOption label="Athlete" desc="Advanced training 5+ times per week" selected={data.fitnessLevel==="athlete"} onClick={()=>{ update("fitnessLevel","athlete"); setTimeout(next,300); }} />
        </div>
      </div>}

      {/* Step 10 — Injuries */}
      {step===10&&<div style={{ flex:1, display:"flex", flexDirection:"column", padding:"0 24px 48px" }}>
        <Header step={step} />
        <div style={{ flex:1, paddingTop:8 }}>
          <h2 style={{ color:"#fff", fontSize:26, fontWeight:800, margin:"0 0 8px" }}>Any injuries or limitations?</h2>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:14, marginBottom:24 }}>We'll avoid exercises that could cause problems. Select all that apply.</p>
          <OOption label="No limitations" desc="I'm good to do any exercises" selected={data.injuries.includes("none")} onClick={()=>update("injuries",["none"])} />
          {[["back","Lower back problems"],["knees","Knee problems"],["hips","Hip problems"],["shoulders","Shoulder problems"],["wrists","Wrist problems"],["ankles","Ankle problems"]].map(([v,l])=>(
            <OOption key={v} label={l} selected={data.injuries.includes(v)} onClick={()=>{
              const without = data.injuries.filter(x=>x!=="none");
              if (without.includes(v)) update("injuries", without.filter(x=>x!==v));
              else update("injuries", [...without, v]);
            }} />
          ))}
        </div>
        <OBtn onClick={next}>Continue →</OBtn>
      </div>}

      {/* Step 11 — Diet type */}
      {step===11&&<div style={{ flex:1, display:"flex", flexDirection:"column", padding:"0 24px 48px" }}>
        <Header step={step} />
        <div style={{ flex:1, paddingTop:8 }}>
          <h2 style={{ color:"#fff", fontSize:32, fontWeight:800, margin:"0 0 8px" }}>Your diet</h2>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:16, marginBottom:32 }}>We'll generate meals that work for you</p>
          <OOption label="Omnivore" desc="Eat everything" selected={data.dietType==="omnivore"} onClick={()=>{ update("dietType","omnivore"); setTimeout(next,300); }} />
          <OOption label="Pescatarian" desc="Fish and seafood, no meat" selected={data.dietType==="pescatarian"} onClick={()=>{ update("dietType","pescatarian"); setTimeout(next,300); }} />
          <OOption label="Vegetarian" desc="No meat or fish" selected={data.dietType==="vegetarian"} onClick={()=>{ update("dietType","vegetarian"); setTimeout(next,300); }} />
          <OOption label="Vegan" desc="No animal products" selected={data.dietType==="vegan"} onClick={()=>{ update("dietType","vegan"); setTimeout(next,300); }} />
        </div>
      </div>}

      {/* Step 12 — Dietary preferences */}
      {step===12&&<div style={{ flex:1, display:"flex", flexDirection:"column", padding:"0 24px 48px", overflowY:"auto" }}>
        <Header step={step} />
        <div style={{ flex:1, paddingTop:8 }}>
          <h2 style={{ color:"#fff", fontSize:32, fontWeight:800, margin:"0 0 8px" }}>Dietary preferences</h2>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:15, marginBottom:20 }}>We'll make sure your meals avoid anything that doesn't work for you</p>
          <div style={{ marginBottom:18 }}>
            <p style={{ color:"rgba(255,255,255,0.6)", fontSize:12, fontWeight:600, letterSpacing:"0.06em", marginBottom:10 }}>DAIRY</p>
            <div style={{ display:"flex", flexWrap:"wrap" }}>
              {[["full_dairy","Full dairy"],["lactose_free","Lactose-free"],["dairy_free","Dairy-free"]].map(([v,l])=><OChip key={v} label={l} selected={data.dairyPref===v} onClick={()=>update("dairyPref",v)} />)}
            </div>
          </div>
          {(data.dairyPref==="dairy_free"||data.dairyPref==="lactose_free")&&<div style={{ marginBottom:18 }}>
            <p style={{ color:"rgba(255,255,255,0.6)", fontSize:12, fontWeight:600, letterSpacing:"0.06em", marginBottom:10 }}>MILK ALTERNATIVE</p>
            <div style={{ display:"flex", flexWrap:"wrap" }}>
              {[["soya","Soya"],["oat","Oat"],["almond","Almond"],["coconut","Coconut"],["rice","Rice"]].map(([v,l])=><OChip key={v} label={l} selected={data.milkAlt===v} onClick={()=>update("milkAlt",v)} />)}
            </div>
          </div>}
          <div style={{ marginBottom:18 }}>
            <p style={{ color:"rgba(255,255,255,0.6)", fontSize:12, fontWeight:600, letterSpacing:"0.06em", marginBottom:10 }}>GLUTEN</p>
            <div style={{ display:"flex", flexWrap:"wrap" }}>
              {[["regular","Regular"],["gluten_free","Gluten-free"]].map(([v,l])=><OChip key={v} label={l} selected={data.glutenPref===v} onClick={()=>update("glutenPref",v)} />)}
            </div>
          </div>
          <div style={{ marginBottom:18 }}>
            <p style={{ color:"rgba(255,255,255,0.6)", fontSize:12, fontWeight:600, letterSpacing:"0.06em", marginBottom:10 }}>ALLERGIES</p>
            <div style={{ display:"flex", flexWrap:"wrap" }}>
              {ALLERGENS.map(a=><OChip key={a} label={a} selected={data.allergies.includes(a)} onClick={()=>toggleArr("allergies",a)} />)}
            </div>
          </div>
          <div style={{ marginBottom:18 }}>
            <p style={{ color:"rgba(255,255,255,0.6)", fontSize:12, fontWeight:600, letterSpacing:"0.06em", marginBottom:10 }}>FOODS I DON'T LIKE</p>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:12, marginBottom:10 }}>These will never appear in your meal plan</p>
            <div style={{ display:"flex", flexWrap:"wrap" }}>
              {DISLIKES_LIST.map(d=><OChip key={d} label={d} selected={data.dislikes.includes(d)} onClick={()=>toggleArr("dislikes",d)} />)}
            </div>
          </div>
        </div>
        <OBtn onClick={next}>Continue →</OBtn>
      </div>}

      {/* Step 13 — Cooking time */}
      {step===13&&<div style={{ flex:1, display:"flex", flexDirection:"column", padding:"0 24px 48px" }}>
        <Header step={step} />
        <div style={{ flex:1, paddingTop:8 }}>
          <h2 style={{ color:"#fff", fontSize:28, fontWeight:800, margin:"0 0 8px" }}>How long do you want to spend cooking?</h2>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:14, marginBottom:24 }}>We'll generate recipes that fit your schedule</p>
          <OOption label="Quick — 15 minutes" desc="Minimal prep, simple assembly. Ideal for busy days." selected={data.cookingTime==="quick"} onClick={()=>{ update("cookingTime","quick"); setTimeout(next,300); }} />
          <OOption label="Moderate — 30 minutes" desc="Proper cooking without anything too complex." selected={data.cookingTime==="moderate"} onClick={()=>{ update("cookingTime","moderate"); setTimeout(next,300); }} />
          <OOption label="I enjoy cooking — up to 1 hour" desc="Happy to try more involved recipes." selected={data.cookingTime==="enjoy"} onClick={()=>{ update("cookingTime","enjoy"); setTimeout(next,300); }} />
        </div>
      </div>}

      {/* Step 14 — Meal planning frequency */}
      {step===14&&<div style={{ flex:1, display:"flex", flexDirection:"column", padding:"0 24px 48px" }}>
        <Header step={step} />
        <div style={{ flex:1, paddingTop:8 }}>
          <h2 style={{ color:"#fff", fontSize:28, fontWeight:800, margin:"0 0 8px", lineHeight:1.2 }}>How would you like your meal planning to work?</h2>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:14, marginBottom:8, lineHeight:1.6 }}>LeanPlan will generate a complete meal plan for your chosen period, then automatically build your shopping list from it — so you know exactly what to buy before you start.</p>
          <div style={{ background:"rgba(0,122,255,0.12)", border:"1px solid rgba(0,122,255,0.3)", borderRadius:12, padding:"12px 14px", marginBottom:24 }}>
            <p style={{ color:"#0a84ff", fontSize:12, fontWeight:700, margin:"0 0 4px" }}>💡 HOW IT WORKS</p>
            <p style={{ color:"rgba(255,255,255,0.7)", fontSize:12, lineHeight:1.6, margin:0 }}>Generate your plan → get your shopping list → go shopping → follow your meals. Simple.</p>
          </div>
          <OOption label="Every day" desc="I'll plan one day at a time, or I already have food in" selected={data.mealPlanDays===1} onClick={()=>{ update("mealPlanDays",1); setTimeout(next,300); }} />
          <OOption label="3 days" desc="I shop a couple of times a week" selected={data.mealPlanDays===3} onClick={()=>{ update("mealPlanDays",3); setTimeout(next,300); }} />
          <OOption label="5 days" desc="I do one big weekday shop" selected={data.mealPlanDays===5} onClick={()=>{ update("mealPlanDays",5); setTimeout(next,300); }} />
          <OOption label="7 days" desc="I do one big weekly shop" selected={data.mealPlanDays===7} onClick={()=>{ update("mealPlanDays",7); setTimeout(next,300); }} />
        </div>
      </div>}

      {/* Step 14 — Supplements */}
      {step===15&&<div style={{ flex:1, display:"flex", flexDirection:"column", padding:"0 24px 48px", overflowY:"auto" }}>
        <Header step={step} />
        <h2 style={{ color:"#fff", fontSize:26, fontWeight:800, margin:"0 0 8px" }}>Are you open to supplements?</h2>
        <p style={{ color:"rgba(255,255,255,0.5)", fontSize:14, marginBottom:20 }}>Especially useful if you're over 40. We'll only recommend what's relevant to you.</p>
        <OOption label="Yes — I'm open to them" desc="Show me what's relevant to my goals" selected={data.supplementsOpen==="yes"} onClick={()=>update("supplementsOpen","yes")} />
        <OOption label="Maybe — tell me more" desc="I'd like to learn before deciding" selected={data.supplementsOpen==="maybe"} onClick={()=>update("supplementsOpen","maybe")} />
        <OOption label="No thanks — food only" desc="I prefer to get everything from diet" selected={data.supplementsOpen==="no"} onClick={()=>update("supplementsOpen","no")} />
        {(data.supplementsOpen==="yes"||data.supplementsOpen==="maybe")&&<div style={{ marginTop:16 }}>
          <p style={{ color:"rgba(255,255,255,0.6)", fontSize:12, fontWeight:600, letterSpacing:"0.06em", marginBottom:12 }}>INTERESTED IN:</p>
          <div style={{ display:"flex", flexWrap:"wrap" }}>
            {[["creatine","Creatine"],["protein","Protein powder"],["vitd","Vitamin D3+K2"],["omega3","Omega-3"],["magnesium","Magnesium"],["multivitamin","Multivitamin"],["collagen","Collagen"],["probiotics","Probiotics"]].map(([v,l])=>(
              <OChip key={v} label={l} selected={data.supplementsInterested.includes(v)} onClick={()=>toggleArr("supplementsInterested",v)} />
            ))}
          </div>
          {parseInt(data.age)>=40&&<div style={{ background:"rgba(0,122,255,0.15)", border:"1px solid rgba(0,122,255,0.3)", borderRadius:12, padding:"12px 14px", marginTop:12 }}>
            <p style={{ color:"#0a84ff", fontSize:12, fontWeight:700, margin:"0 0 4px" }}>💡 RECOMMENDED FOR YOUR AGE</p>
            <p style={{ color:"rgba(255,255,255,0.7)", fontSize:12, lineHeight:1.6, margin:0 }}>Creatine preserves muscle, Vitamin D3 supports mood and bones, Magnesium improves sleep — all highly effective over 40.</p>
          </div>}
        </div>}
        <div style={{ marginTop:"auto", paddingTop:16 }}>
          <OBtn onClick={next}>Continue →</OBtn>
        </div>
      </div>}

      {/* Step 16 — Equipment & building plan */}
      {step===16&&<div style={{ flex:1, display:"flex", flexDirection:"column", padding:"0 24px 48px" }}>
        <Header step={step} />
        <div style={{ flex:1, paddingTop:8 }}>
          <h2 style={{ color:"#fff", fontSize:32, fontWeight:800, margin:"0 0 8px" }}>What equipment do you have?</h2>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:16, marginBottom:24 }}>Your workouts will be built around this</p>
          <div style={{ display:"flex", flexWrap:"wrap" }}>
            {[["gym_machines","Gym machines"],["dumbbells","Dumbbells"],["barbell","Barbell"],["cables","Cable machine"],["rowing","Rowing machine"],["crosstrainer","Cross trainer"],["treadmill","Treadmill"],["bike","Exercise bike"],["resistance_bands","Resistance bands"],["bodyweight","Bodyweight only"]].map(([v,l])=>(
              <OChip key={v} label={l} selected={data.equipment.includes(v)} onClick={()=>toggleArr("equipment",v)} />
            ))}
          </div>
          <div style={{ marginTop:24 }}>
            <p style={{ color:"rgba(255,255,255,0.6)", fontSize:13, fontWeight:600, letterSpacing:"0.06em", marginBottom:12 }}>WORKOUTS PER WEEK</p>
            <div style={{ display:"flex", gap:10 }}>
              {[2,3,4,5].map(n=>(
                <div key={n} onClick={()=>update("workoutsPerWeek",n)} style={{ flex:1, textAlign:"center", padding:"14px 0", border:`1.5px solid ${data.workoutsPerWeek===n?"#fff":"rgba(255,255,255,0.2)"}`, borderRadius:14, cursor:"pointer", background:data.workoutsPerWeek===n?"rgba(255,255,255,0.1)":"transparent" }}>
                  <span style={{ color:"#fff", fontSize:20, fontWeight:data.workoutsPerWeek===n?700:400 }}>{n}x</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <OBtn onClick={next} disabled={data.equipment.length===0}>Continue →</OBtn>
      </div>}
      {/* Step 17 — App mode selection */}
      {step===17&&<div style={{ flex:1, display:"flex", flexDirection:"column", padding:"0 24px 48px" }}>
        <Header step={step} />
        <div style={{ flex:1, paddingTop:8 }}>
          <h2 style={{ color:"#fff", fontSize:28, fontWeight:800, margin:"0 0 8px", lineHeight:1.2 }}>How would you like LeanPlan to work?</h2>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:15, marginBottom:28, lineHeight:1.6 }}>Choose how you want to use the app. You can change this later in your profile.</p>

          {/* Guided */}
          <div onClick={()=>update("appMode","guided")} style={{ background:data.appMode==="guided"?"rgba(0,122,255,0.15)":"rgba(255,255,255,0.05)", border:`2px solid ${data.appMode==="guided"?"#007aff":"rgba(255,255,255,0.15)"}`, borderRadius:20, padding:"20px", marginBottom:14, cursor:"pointer", transition:"all 0.2s" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:data.appMode==="guided"?"#007aff":"rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>🎯</div>
              <div>
                <p style={{ color:"#fff", fontWeight:800, fontSize:18, margin:0 }}>Guided</p>
                <p style={{ color:"rgba(255,255,255,0.5)", fontSize:13, margin:0 }}>Recommended</p>
              </div>
              {data.appMode==="guided" && <span style={{ marginLeft:"auto", color:"#007aff", fontSize:22 }}>✓</span>}
            </div>
            <p style={{ color:"rgba(255,255,255,0.75)", fontSize:14, lineHeight:1.7, margin:"0 0 12px" }}>LeanPlan builds your complete programme — personalised meal plans, a structured workout schedule, and shopping lists. You follow the plan, we handle the thinking.</p>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {["✦ Personalised meal plan built around your calorie targets","✦ Structured weekly workout schedule based on your goal","✦ Shopping list built from your meal plan","✦ AI coach to keep you on track"].map((f,i)=>(
                <p key={i} style={{ color:"rgba(255,255,255,0.6)", fontSize:13, margin:0 }}>{f}</p>
              ))}
            </div>
          </div>

          {/* Custom */}
          <div onClick={()=>update("appMode","custom")} style={{ background:data.appMode==="custom"?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.03)", border:`2px solid ${data.appMode==="custom"?"rgba(255,255,255,0.4)":"rgba(255,255,255,0.1)"}`, borderRadius:20, padding:"20px", cursor:"pointer", transition:"all 0.2s", position:"relative" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:"rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>⚙️</div>
              <div>
                <p style={{ color:"rgba(255,255,255,0.6)", fontWeight:800, fontSize:18, margin:0 }}>Custom</p>
                <p style={{ color:"rgba(255,255,255,0.3)", fontSize:13, margin:0 }}>Coming soon</p>
              </div>
              {data.appMode==="custom" && <span style={{ marginLeft:"auto", color:"rgba(255,255,255,0.4)", fontSize:22 }}>✓</span>}
            </div>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:14, lineHeight:1.7, margin:"0 0 12px" }}>Log your own meals and workouts. Use LeanPlan as a flexible tracking tool with AI coaching support.</p>
            <div style={{ background:"rgba(255,149,0,0.12)", border:"1px solid rgba(255,149,0,0.3)", borderRadius:10, padding:"8px 12px" }}>
              <p style={{ color:"#ff9500", fontSize:12, margin:0, fontWeight:600 }}>🚧 Custom mode is coming soon — select Guided for now to get the full LeanPlan experience.</p>
            </div>
          </div>
        </div>
        <OBtn onClick={finish} disabled={!data.appMode}>Build My Plan →</OBtn>
      </div>}
    </div>
  );
};
