import React, { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { useTheme } from "../ThemeContext.jsx";
import { FONT, ALLERGENS, DISLIKES_LIST } from "../constants.js";
import { toKg, calcTDEE, calcBMI, getPace } from "../helpers.js";
import { Card, Section, Row, Btn, BigChip, Toggle, TInput } from "./ui.jsx";
import { PacePicker } from "./PacePicker.jsx";
import { AvatarCropModal } from "./AvatarCropModal.jsx";

export const ProfileTab = ({ profile, setProfile, onReset, isDark, darkOverride, setDarkOverride, isPro, proData, onUpgrade, user, onShowAuth, onClearMealPlan, avatarUrl, setAvatarUrl }) => {
  const C = useTheme();
  const [editing, setEditing] = useState(null);
  const [tempData, setTempData] = useState({});
  const [showChangePw, setShowChangePw] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [showMealPlanNudge, setShowMealPlanNudge] = useState(false);
  // avatarUrl/setAvatarUrl lifted to App level (persists across tab switches)
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showCropModal, setShowCropModal] = useState(null);
  const croppieRef = React.useRef(null);

  // Load avatar on mount
  useEffect(() => {
    if (!user?.id) return;
    const loadAvatar = async () => {
      // Public bucket — just check if file exists by trying to fetch the public URL
      const { data } = supabase.storage.from("progress-photos").getPublicUrl(`${user.id}/avatar.jpg`);
      if (data?.publicUrl) {
        // Verify file actually exists with a HEAD request
        try {
          const res = await fetch(data.publicUrl, { method: "HEAD" });
          if (res.ok) setAvatarUrl(data.publicUrl);
        } catch(e) {}
      }
    };
    loadAvatar();
  }, [user?.id]);

  // Load croppie dynamically
  const loadCroppie = () => new Promise((resolve) => {
    if (window.Croppie) return resolve();
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://cdnjs.cloudflare.com/ajax/libs/croppie/2.6.5/croppie.min.css";
    document.head.appendChild(css);
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/croppie/2.6.5/croppie.min.js";
    script.onload = resolve;
    document.head.appendChild(script);
  });

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    e.target.value = "";
    await loadCroppie();
    const objectUrl = URL.createObjectURL(file);
    setShowCropModal({ url: objectUrl });
  };

  const handleCropSave = async () => {
    if (!showCropModal || !croppieRef.current) return;
    setAvatarUploading(true);
    try {
      // Get blob BEFORE closing modal (closing destroys croppie instance)
      const blob = await croppieRef.current.result({ type: "blob", size: { width: 400, height: 400 }, format: "jpeg", quality: 0.9 });
      setShowCropModal(null); // close modal after getting result
      const path = `${user.id}/avatar.jpg`;
      const { error } = await supabase.storage.from("progress-photos").upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (!error) {
        const { data } = supabase.storage.from("progress-photos").getPublicUrl(path);
        if (data?.publicUrl) setAvatarUrl(data.publicUrl);
      } else {
        console.error("Avatar upload error:", error);
      }
    } catch(e) { console.error("Avatar crop/upload error:", e); }
    setAvatarUploading(false);
  };

  const handleCropCancel = () => {
    if (croppieRef.current) { croppieRef.current.destroy(); croppieRef.current = null; }
    setShowCropModal(null);
  };

  const initials = (profile.name || "?").split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase();
  const toggleArr = (k,v) => setTempData(d=>({...d,[k]:d[k].includes(v)?d[k].filter(x=>x!==v):[...d[k],v]}));
  const startEdit = (s) => { setTempData({...profile}); setEditing(s); };
  const save = () => {
    // If meal plan length changed, clear the existing plan so user regenerates
    if (tempData.mealPlanDays && tempData.mealPlanDays !== profile.mealPlanDays) {
      onClearMealPlan?.();
    }
    // If workout frequency, diet, goal or pace changed, nudge user to regenerate meal plan
    const mealRelevantChanged = (
      tempData.workoutsPerWeek !== profile.workoutsPerWeek ||
      tempData.goal !== profile.goal ||
      tempData.paceId !== profile.paceId ||
      tempData.dietType !== profile.dietType ||
      tempData.dairyPref !== profile.dairyPref ||
      tempData.glutenPref !== profile.glutenPref
    );
    if (mealRelevantChanged) {
      setShowMealPlanNudge(true);
    }
    setProfile({...profile,...tempData});
    setEditing(null);
  };

  if (showChangePw) return (
    <div style={{ padding:"0 20px", maxWidth:480, margin:"0 auto" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:28, paddingTop:8 }}>
        <button onClick={()=>{ setShowChangePw(false); setNewPw(""); setConfirmPw(""); setPwError(null); setPwSuccess(false); }} style={{ background:"none", border:"none", color:C.accent, fontSize:16, cursor:"pointer", fontFamily:FONT }}>←</button>
        <h2 style={{ color:C.text, fontSize:20, fontWeight:700, margin:0 }}>Change Password</h2>
      </div>

      {pwSuccess ? (
        <div style={{ textAlign:"center", padding:"40px 0" }}>
          <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
          <h3 style={{ color:C.text, fontSize:20, fontWeight:700, marginBottom:8 }}>Password updated!</h3>
          <p style={{ color:C.muted, fontSize:15 }}>Your new password is saved.</p>
          <Btn color={C.accent} onClick={()=>{ setShowChangePw(false); setNewPw(""); setConfirmPw(""); setPwSuccess(false); }} style={{ marginTop:24 }}>Done</Btn>
        </div>
      ) : (
        <>
          <div style={{ marginBottom:14 }}>
            <p style={{ color:C.textSec, fontSize:13, fontWeight:500, marginBottom:6 }}>New password</p>
            <TInput
              value={newPw}
              onChange={e=>setNewPw(e.target.value)}
              placeholder="Min 6 characters"
              type="password"
              autoComplete="new-password"
            />
          </div>
          <div style={{ marginBottom:20 }}>
            <p style={{ color:C.textSec, fontSize:13, fontWeight:500, marginBottom:6 }}>Confirm password</p>
            <TInput
              value={confirmPw}
              onChange={e=>setConfirmPw(e.target.value)}
              placeholder="Repeat new password"
              type="password"
              autoComplete="new-password"
            />
          </div>
          {pwError && <div style={{ background:`${C.red}10`, border:`1px solid ${C.red}33`, borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
            <p style={{ color:C.red, fontSize:13, margin:0 }}>{pwError}</p>
          </div>}
          <Btn color={C.accent} disabled={pwLoading} onClick={async()=>{
            if (!newPw || newPw.length < 6) { setPwError("Password must be at least 6 characters"); return; }
            if (newPw !== confirmPw) { setPwError("Passwords don't match"); return; }
            setPwLoading(true); setPwError(null);
            const { error } = await supabase.auth.updateUser({ password: newPw });
            if (error) { setPwError(error.message); setPwLoading(false); return; }
            setPwSuccess(true); setPwLoading(false);
          }} style={{ width:"100%" }}>
            {pwLoading ? "Updating..." : "Update Password"}
          </Btn>
        </>
      )}
    </div>
  );

  if (editing) return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
        <button onClick={()=>setEditing(null)} style={{ background:"none", border:"none", color:C.accent, fontSize:16, cursor:"pointer", fontFamily:FONT }}>←</button>
        <h2 style={{ color:C.text, fontSize:20, fontWeight:700, margin:0, flex:1 }}>Edit {editing}</h2>
        <Btn onClick={save} small color={C.accent}>Save</Btn>
      </div>

      {editing==="fitness"&&<>
        <div style={{ marginBottom:20 }}>
          <p style={{ color:C.muted, fontSize:13, fontWeight:600, marginBottom:10 }}>FITNESS LEVEL</p>
          {[["beginner","Beginner","New to exercise or returning after a break"],["intermediate","Intermediate","Exercise 1-3x per week, some experience"],["active","Active","Regular training 3-5x per week"],["athlete","Athlete","Advanced training 5+ times per week"]].map(([val,label,desc])=>(
            <div key={val} onClick={()=>setTempData(d=>({...d,fitnessLevel:val}))} style={{ background:tempData.fitnessLevel===val?`${C.accent}12`:C.card, border:`1.5px solid ${tempData.fitnessLevel===val?C.accent:C.border}`, borderRadius:14, padding:"12px 16px", marginBottom:8, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <p style={{ color:C.text, fontWeight:600, fontSize:15, margin:0 }}>{label}</p>
                <p style={{ color:C.muted, fontSize:13, margin:"2px 0 0" }}>{desc}</p>
              </div>
              {tempData.fitnessLevel===val && <span style={{ color:C.accent, fontSize:18 }}>✓</span>}
            </div>
          ))}
        </div>
        <div style={{ marginBottom:20 }}>
          <p style={{ color:C.muted, fontSize:13, fontWeight:600, marginBottom:10 }}>INJURIES / LIMITATIONS</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
            {[["none","No limitations"],["back","Lower back"],["knees","Knees"],["hips","Hips"],["shoulders","Shoulders"],["wrists","Wrists"],["ankles","Ankles"]].map(([val,label])=>(
              <BigChip key={val} color={C.orange} active={tempData.injuries?.includes(val)} onClick={()=>{
                const without = (tempData.injuries||[]).filter(x=>x!=="none");
                if (val==="none") setTempData(d=>({...d,injuries:["none"]}));
                else if (without.includes(val)) setTempData(d=>({...d,injuries:without.filter(x=>x!==val)}));
                else setTempData(d=>({...d,injuries:[...without,val]}));
              }}>{label}</BigChip>
            ))}
          </div>
        </div>
        <div>
          <p style={{ color:C.muted, fontSize:13, fontWeight:600, marginBottom:10 }}>EQUIPMENT</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
            {[["gym_machines","Gym machines"],["dumbbells","Dumbbells"],["barbell","Barbell"],["cables","Cable machine"],["rowing","Rowing machine"],["crosstrainer","Cross trainer"],["treadmill","Treadmill"],["bike","Exercise bike"],["resistance_bands","Resistance bands"],["bodyweight","Bodyweight only"]].map(([val,label])=>(
              <BigChip key={val} color={C.green} active={tempData.equipment?.includes(val)} onClick={()=>{
                const eq = tempData.equipment||[];
                setTempData(d=>({...d,equipment:eq.includes(val)?eq.filter(x=>x!==val):[...eq,val]}));
              }}>{label}</BigChip>
            ))}
          </div>
        </div>
      </>}

      {editing==="goal"&&<>
        {[["lose_weight","🎯","Lose weight"],["build_muscle","💪","Build muscle"],["get_fitter","🏃","Get fitter"],["all","⭐","All of the above"]].map(([val,ico,title])=>(
          <Card key={val} onClick={()=>setTempData(d=>({...d,goal:val}))} style={{ borderColor:tempData.goal===val?C.accent:C.border, borderWidth:tempData.goal===val?2:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontSize:24 }}>{ico}</span><span style={{ color:C.text, fontWeight:600 }}>{title}</span>
              {tempData.goal===val&&<span style={{ marginLeft:"auto", color:C.accent }}>✓</span>}
            </div>
          </Card>
        ))}
      </>}

      {editing==="weight"&&<>
        <p style={{ color:C.muted, fontSize:14, marginBottom:16 }}>Update your weight target and pace</p>
        <div style={{ marginBottom:14 }}>
          <p style={{ color:C.muted, fontSize:13, marginBottom:8 }}>Weight loss target</p>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {[3,5,7,10,15,20].map(kg=>{ const lbs=parseFloat((kg*2.20462).toFixed(1)); return <BigChip key={kg} color={C.accent} active={Math.abs((tempData.targetLbs||0)-lbs)<0.6} onClick={()=>setTempData(d=>({...d,targetLbs:lbs}))}>{kg} kg</BigChip>; })}
          </div>
        </div>
        <div>
          <p style={{ color:C.textSec, fontSize:13, fontWeight:500, marginBottom:8 }}>Weekly pace</p>
          <PacePicker value={tempData.paceId||"normal"} onChange={v=>setTempData(d=>({...d,paceId:v}))} targetLbs={tempData.targetLbs||14} />
        </div>
      </>}

      {editing==="details"&&<>
        <div style={{ display:"flex", gap:10, marginBottom:14 }}>
          <div style={{ flex:1 }}><p style={{ color:C.textSec, fontSize:13, fontWeight:500, marginBottom:6 }}>Height (cm)</p><TInput value={tempData.heightCm||""} onChange={e=>setTempData(d=>({...d,heightCm:e.target.value}))} placeholder="e.g. 178" type="number" /></div>
          <div style={{ flex:1 }}><p style={{ color:C.textSec, fontSize:13, fontWeight:500, marginBottom:6 }}>Age</p><TInput value={tempData.age||""} onChange={e=>setTempData(d=>({...d,age:e.target.value}))} placeholder="e.g. 53" type="number" /></div>
        </div>
        <div style={{ marginBottom:14 }}>
          <p style={{ color:C.muted, fontSize:13, marginBottom:10 }}>Biological sex</p>
          <div style={{ display:"flex", gap:10 }}>
            {[["male","Male"],["female","Female"]].map(([v,l])=><BigChip key={v} color={C.accent} active={tempData.sex===v} onClick={()=>setTempData(d=>({...d,sex:v}))}>{l}</BigChip>)}
          </div>
        </div>
        <div>
          <p style={{ color:C.muted, fontSize:13, marginBottom:10 }}>Workouts per week</p>
          <div style={{ display:"flex", gap:10 }}>
            {[2,3,4,5].map(n=><BigChip key={n} color={C.purple} active={tempData.workoutsPerWeek===n} onClick={()=>setTempData(d=>({...d,workoutsPerWeek:n}))}>{n}x</BigChip>)}
          </div>
        </div>
      </>}

      {editing==="allergies"&&<>
        <p style={{ color:C.muted, fontSize:14, marginBottom:16 }}>Select all that apply</p>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {ALLERGENS.map(a=><BigChip key={a} color={C.red} active={tempData.allergies.includes(a)} onClick={()=>toggleArr("allergies",a)}>{a}</BigChip>)}
        </div>
      </>}

      {editing==="dislikes"&&<>
        <p style={{ color:C.muted, fontSize:14, marginBottom:16 }}>Foods to exclude from meal plans</p>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {DISLIKES_LIST.map(d=><BigChip key={d} color={C.orange} active={tempData.dislikes.includes(d)} onClick={()=>toggleArr("dislikes",d)}>{d}</BigChip>)}
        </div>
      </>}

      {editing==="milkalt"&&<>
        <p style={{ color:C.muted, fontSize:14, marginBottom:20 }}>Which milk alternative do you prefer? This will be used in recipes, smoothies and cereals.</p>
        {[["soya","Soya milk","High protein, neutral taste"],["oat","Oat milk","Creamy, naturally sweet — check GF if needed"],["almond","Almond milk","Light, mild nutty flavour"],["coconut","Coconut milk","Rich and creamy, great for cooking"],["rice","Rice milk","Mild and slightly sweet, thinner texture"]].map(([val,label,desc])=>(
          <div key={val} onClick={()=>setTempData(d=>({...d,milkAlt:val}))} style={{ background:tempData.milkAlt===val?`${C.accent}12`:C.card, border:`1.5px solid ${tempData.milkAlt===val?C.accent:C.border}`, borderRadius:14, padding:"12px 16px", marginBottom:10, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <p style={{ color:C.text, fontWeight:600, fontSize:15, margin:0 }}>{label}</p>
              <p style={{ color:C.muted, fontSize:13, margin:"2px 0 0" }}>{desc}</p>
            </div>
            {tempData.milkAlt===val && <span style={{ color:C.accent, fontSize:18 }}>✓</span>}
          </div>
        ))}
      </>}

      {editing==="cookingtime"&&<>
        <p style={{ color:C.muted, fontSize:14, marginBottom:20 }}>How long are you happy to spend preparing a meal? This affects the recipes we generate for you.</p>
        {[
          ["quick",   "Quick",           "15 minutes max — minimal prep, simple assembly"],
          ["moderate","Moderate",        "Around 30 minutes — proper cooking but nothing complex"],
          ["enjoy",   "I enjoy cooking", "Up to an hour — happy to try more involved recipes"],
        ].map(([val, label, desc]) => (
          <div key={val} onClick={()=>setTempData(d=>({...d, cookingTime:val}))} style={{ background:tempData.cookingTime===val?`${C.accent}12`:C.card, border:`1.5px solid ${tempData.cookingTime===val?C.accent:C.border}`, borderRadius:14, padding:"14px 16px", marginBottom:10, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <p style={{ color:C.text, fontWeight:600, fontSize:15, margin:0 }}>{label}</p>
              <p style={{ color:C.muted, fontSize:13, margin:"2px 0 0" }}>{desc}</p>
            </div>
            {tempData.cookingTime===val && <span style={{ color:C.accent, fontSize:18 }}>✓</span>}
          </div>
        ))}
        <div style={{ background:`${C.accent}10`, border:`1px solid ${C.accent}22`, borderRadius:12, padding:"10px 14px", marginTop:4 }}>
          <p style={{ color:C.accent, fontSize:13, margin:0 }}>💡 Regenerate your meal plan after saving to apply the new cooking time.</p>
        </div>
      </>}

      {editing==="mealplan"&&<>
        <p style={{ color:C.muted, fontSize:14, marginBottom:20 }}>How many days would you like your meal plan to cover? Your shopping list is built from the full plan.</p>
        {[
          [1, "Every day", "Plan one day at a time"],
          [3, "3 days", "Shop a couple of times a week"],
          [5, "5 days", "One big weekday shop"],
          [7, "7 days", "One big weekly shop"],
        ].map(([days, label, desc]) => (
          <div key={days} onClick={()=>setTempData(d=>({...d, mealPlanDays:days}))} style={{ background:tempData.mealPlanDays===days?`${C.accent}12`:C.card, border:`1.5px solid ${tempData.mealPlanDays===days?C.accent:C.border}`, borderRadius:14, padding:"14px 16px", marginBottom:10, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <p style={{ color:C.text, fontWeight:600, fontSize:15, margin:0 }}>{label}</p>
              <p style={{ color:C.muted, fontSize:13, margin:"2px 0 0" }}>{desc}</p>
            </div>
            {tempData.mealPlanDays===days && <span style={{ color:C.accent, fontSize:18 }}>✓</span>}
          </div>
        ))}
        {tempData.mealPlanDays !== (profile.mealPlanDays||5) && (
          <div style={{ background:`${C.green}12`, border:`1px solid ${C.green}33`, borderRadius:12, padding:"10px 14px", marginTop:4 }}>
            <p style={{ color:C.green, fontSize:13, margin:0 }}>✓ Saving will clear your current plan — a new {tempData.mealPlanDays}-day plan will be ready to generate.</p>
          </div>
        )}
      </>}

      {editing==="name"&&<>
        <p style={{ color:C.muted, fontSize:14, marginBottom:16 }}>What should we call you?</p>
        <TInput value={tempData.name||""} onChange={e=>setTempData(d=>({...d,name:e.target.value}))} placeholder="Your first name" />
      </>}

      {editing==="diet"&&<>
        <div style={{ marginBottom:20 }}>
          <p style={{ color:C.muted, fontSize:13, fontWeight:600, marginBottom:10 }}>DIET TYPE</p>
          {[["omnivore","Omnivore","Eat everything"],["pescatarian","Pescatarian","Fish and seafood, no meat"],["vegetarian","Vegetarian","No meat or fish"],["vegan","Vegan","No animal products"]].map(([val,label,desc])=>(
            <div key={val} onClick={()=>setTempData(d=>({...d,dietType:val}))} style={{ background:tempData.dietType===val?`${C.accent}12`:C.card, border:`1.5px solid ${tempData.dietType===val?C.accent:C.border}`, borderRadius:14, padding:"12px 16px", marginBottom:8, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div><p style={{ color:C.text, fontWeight:600, fontSize:15, margin:0 }}>{label}</p><p style={{ color:C.muted, fontSize:13, margin:"2px 0 0" }}>{desc}</p></div>
              {tempData.dietType===val && <span style={{ color:C.accent, fontSize:18 }}>✓</span>}
            </div>
          ))}
        </div>
        <div style={{ marginBottom:20 }}>
          <p style={{ color:C.muted, fontSize:13, fontWeight:600, marginBottom:10 }}>DAIRY</p>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {[["full_dairy","Full dairy"],["lactose_free","Lactose-free"],["dairy_free","Dairy-free"]].map(([val,label])=>(
              <BigChip key={val} color={C.accent} active={tempData.dairyPref===val} onClick={()=>setTempData(d=>({...d,dairyPref:val}))}>{label}</BigChip>
            ))}
          </div>
        </div>
        <div>
          <p style={{ color:C.muted, fontSize:13, fontWeight:600, marginBottom:10 }}>GLUTEN</p>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {[["regular","Regular"],["gluten_free","Gluten-free"]].map(([val,label])=>(
              <BigChip key={val} color={C.accent} active={tempData.glutenPref===val} onClick={()=>setTempData(d=>({...d,glutenPref:val}))}>{label}</BigChip>
            ))}
          </div>
        </div>
        <div style={{ background:`${C.orange}12`, border:`1px solid ${C.orange}33`, borderRadius:12, padding:"10px 14px", marginTop:14 }}>
          <p style={{ color:C.orange, fontSize:13, margin:0 }}>⚠️ Regenerate your meal plan after saving to apply changes.</p>
        </div>
      </>}

      {editing==="supplements"&&<>
        <div style={{ marginBottom:20 }}>
          <p style={{ color:C.muted, fontSize:13, fontWeight:600, marginBottom:10 }}>SUPPLEMENT PREFERENCE</p>
          {[["yes","Yes — I'm open to them","Show me what's relevant to my goals"],["maybe","Maybe — tell me more","I'd like to learn before deciding"],["no","No thanks — food only","I prefer to get everything from diet"]].map(([val,label,desc])=>(
            <div key={val} onClick={()=>setTempData(d=>({...d,supplementsOpen:val}))} style={{ background:tempData.supplementsOpen===val?`${C.accent}12`:C.card, border:`1.5px solid ${tempData.supplementsOpen===val?C.accent:C.border}`, borderRadius:14, padding:"12px 16px", marginBottom:8, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div><p style={{ color:C.text, fontWeight:600, fontSize:15, margin:0 }}>{label}</p><p style={{ color:C.muted, fontSize:13, margin:"2px 0 0" }}>{desc}</p></div>
              {tempData.supplementsOpen===val && <span style={{ color:C.accent, fontSize:18 }}>✓</span>}
            </div>
          ))}
        </div>
        {(tempData.supplementsOpen==="yes"||tempData.supplementsOpen==="maybe")&&<div>
          <p style={{ color:C.muted, fontSize:13, fontWeight:600, marginBottom:10 }}>INTERESTED IN</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
            {[["creatine","Creatine"],["protein","Protein powder"],["vitd","Vitamin D3+K2"],["omega3","Omega-3"],["magnesium","Magnesium"],["multivitamin","Multivitamin"],["collagen","Collagen"],["probiotics","Probiotics"]].map(([val,label])=>(
              <BigChip key={val} color={C.purple} active={tempData.supplementsInterested?.includes(val)} onClick={()=>{
                const curr = tempData.supplementsInterested||[];
                setTempData(d=>({...d,supplementsInterested:curr.includes(val)?curr.filter(x=>x!==val):[...curr,val]}));
              }}>{label}</BigChip>
            ))}
          </div>
        </div>}
      </>}

      {editing==="appmode"&&<>
        <p style={{ color:C.muted, fontSize:14, marginBottom:20 }}>Choose how you want LeanPlan to work for you.</p>
        <div onClick={()=>setTempData(d=>({...d,appMode:"guided"}))} style={{ background:tempData.appMode==="guided"?`${C.accent}12`:C.card, border:`1.5px solid ${tempData.appMode==="guided"?C.accent:C.border}`, borderRadius:16, padding:"16px", marginBottom:12, cursor:"pointer" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
            <p style={{ color:C.text, fontWeight:700, fontSize:16, margin:0 }}>🎯 Guided</p>
            {tempData.appMode==="guided" && <span style={{ color:C.accent, fontSize:18 }}>✓</span>}
          </div>
          <p style={{ color:C.muted, fontSize:13, margin:0, lineHeight:1.6 }}>LeanPlan builds your complete programme — personalised meal plans, structured workouts and shopping lists.</p>
        </div>
        <div style={{ background:C.card, border:`1.5px solid ${C.border}`, borderRadius:16, padding:"16px", opacity:0.5 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
            <p style={{ color:C.text, fontWeight:700, fontSize:16, margin:0 }}>⚙️ Custom</p>
            <span style={{ color:C.orange, fontSize:12, fontWeight:600 }}>Coming soon</span>
          </div>
          <p style={{ color:C.muted, fontSize:13, margin:0, lineHeight:1.6 }}>Log your own meals and workouts. Use LeanPlan as a flexible tracking tool.</p>
        </div>
      </>}

      {editing==="lifestyle"&&<>
        <div style={{ marginBottom:20 }}>
          <p style={{ color:C.muted, fontSize:13, fontWeight:600, marginBottom:10 }}>ACTIVITY LEVEL (outside workouts)</p>
          {[["sedentary","Sedentary","Desk job, mostly sitting"],["light","Lightly active","Some walking, light activity"],["moderate","Moderately active","On feet a lot, active job"],["very","Very active","Physical job or very active lifestyle"]].map(([val,label,desc])=>(
            <div key={val} onClick={()=>setTempData(d=>({...d,activityLevel:val}))} style={{ background:tempData.activityLevel===val?`${C.accent}12`:C.card, border:`1.5px solid ${tempData.activityLevel===val?C.accent:C.border}`, borderRadius:14, padding:"12px 16px", marginBottom:8, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div><p style={{ color:C.text, fontWeight:600, fontSize:15, margin:0 }}>{label}</p><p style={{ color:C.muted, fontSize:13, margin:"2px 0 0" }}>{desc}</p></div>
              {tempData.activityLevel===val && <span style={{ color:C.accent, fontSize:18 }}>✓</span>}
            </div>
          ))}
        </div>
        <div>
          <p style={{ color:C.muted, fontSize:13, fontWeight:600, marginBottom:10 }}>WORKOUT STYLE</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
            {[["mixed","Mixed"],["weights","Weights"],["cardio","Cardio"],["home","Home workouts"],["classes","Classes"]].map(([val,label])=>(
              <span key={val} onClick={()=>setTempData(d=>({...d,workoutStyle:val}))} style={{ background:tempData.workoutStyle===val?C.accent:`${C.accent}12`, color:tempData.workoutStyle===val?"#fff":C.accent, border:`1.5px solid ${tempData.workoutStyle===val?C.accent:`${C.accent}55`}`, borderRadius:99, padding:"10px 20px", fontSize:15, fontWeight:600, cursor:"pointer", transition:"all 0.2s", display:"inline-block" }}>{label}</span>
            ))}
          </div>
        </div>
      </>}

    </div>
  );

  const tdee = calcTDEE(profile);
  const bmi = calcBMI(profile);

  return (
    <div>
      <div style={{ textAlign:"center", padding:"24px 0 20px" }}>
        <div style={{ position:"relative", width:88, height:88, margin:"0 auto 12px" }}>
          <label htmlFor="avatar-upload" style={{ cursor:"pointer", display:"block" }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" style={{ width:88, height:88, borderRadius:99, objectFit:"cover", border:`3px solid ${C.accent}`, display:"block" }} />
            ) : (
              <div style={{ width:88, height:88, borderRadius:99, background:`linear-gradient(135deg, ${C.accent}, ${C.purple})`, display:"flex", alignItems:"center", justifyContent:"center", border:`3px solid ${C.accent}` }}>
                <span style={{ color:"#fff", fontSize:28, fontWeight:700 }}>{initials}</span>
              </div>
            )}
          </label>
          <label htmlFor="avatar-upload" style={{ position:"absolute", bottom:0, right:0, width:26, height:26, borderRadius:99, background:C.accent, border:`2px solid ${C.bg}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
            {avatarUploading ? <span style={{ fontSize:10, color:"#fff" }}>...</span> : <span style={{ fontSize:13 }}>📷</span>}
          </label>
          <input id="avatar-upload" type="file" accept="image/*" style={{ display:"none" }} onChange={handleAvatarUpload} />
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          <h2 style={{ color:C.text, fontSize:22, fontWeight:700, margin:0 }}>{profile.name||"Your Profile"}</h2>
          <button onClick={()=>startEdit("name")} style={{ background:"none", border:"none", color:C.accent, fontSize:13, cursor:"pointer", fontFamily:FONT, padding:"2px 6px" }}>Edit</button>
        </div>
        <p style={{ color:C.muted, fontSize:14, margin:"4px 0 0" }}>Age {profile.age||"—"} · {profile.sex||""}</p>
        {tdee&&<p style={{ color:C.accent, fontSize:14, margin:"4px 0 0", fontWeight:600 }}>TDEE: {tdee} cal · BMI: {bmi}</p>}
      </div>

      {showMealPlanNudge && (
        <div style={{ background:`${C.orange}12`, border:`1px solid ${C.orange}33`, borderRadius:12, padding:"12px 14px", marginBottom:14, display:"flex", gap:10, alignItems:"flex-start" }}>
          <span style={{ fontSize:16, flexShrink:0 }}>🍽️</span>
          <div style={{ flex:1 }}>
            <p style={{ color:C.text, fontWeight:600, fontSize:13, margin:"0 0 2px" }}>Regenerate your meal plan</p>
            <p style={{ color:C.muted, fontSize:12, margin:"0 0 8px", lineHeight:1.5 }}>Your changes affect calorie targets and training days. Regenerate for an updated plan.</p>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>{ onClearMealPlan?.(); setShowMealPlanNudge(false); }} style={{ background:C.orange, border:"none", borderRadius:8, padding:"6px 14px", color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:FONT }}>Regenerate now</button>
              <button onClick={()=>setShowMealPlanNudge(false)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 14px", color:C.muted, fontSize:12, cursor:"pointer", fontFamily:FONT }}>Later</button>
            </div>
          </div>
        </div>
      )}

      <Section title="Goals">
        <Row label="Main goal" value={profile.goal?.replace("_"," ")} onClick={()=>startEdit("goal")} />
        <Row label="Weight target" value={`${toKg(profile.startWeightLbs - profile.targetLbs)} kg target`} onClick={()=>startEdit("weight")} />
        <Row label="Weekly pace" value={`${getPace(profile.paceId||"normal").kgPerWk} kg/wk — ${getPace(profile.paceId||"normal").label}`} onClick={()=>startEdit("weight")} last />
      </Section>

      <Section title="My Details">
        <Row label="Name" value={profile.name||"Not set"} onClick={()=>startEdit("name")} />
        <Row label="Age" value={profile.age||"Not set"} onClick={()=>startEdit("details")} />
        <Row label="Sex" value={profile.sex||"Not set"} onClick={()=>startEdit("details")} />
        <Row label="Height" value={profile.heightCm?`${profile.heightCm} cm`:"Not set"} onClick={()=>startEdit("details")} />
        <Row label="Workouts/week" value={`${profile.workoutsPerWeek}x`} onClick={()=>startEdit("details")} last />
      </Section>

      <Section title="Fitness">
        <Row label="Fitness level" value={profile.fitnessLevel||"Not set"} onClick={()=>startEdit("fitness")} />
        <Row label="Injuries / limitations" value={profile.injuries?.length>0?profile.injuries.join(", "):"None"} onClick={()=>startEdit("fitness")} />
        <Row label="Equipment" value={profile.equipment?.length>0?`${profile.equipment.length} items`:"Not set"} onClick={()=>startEdit("fitness")} last />
      </Section>

      <Section title="Diet & Meals">
        <Row label="Diet type" value={profile.dietType||"omnivore"} onClick={()=>startEdit("diet")} />
        <Row label="Dairy" value={profile.dairyPref?.replace(/_/g," ")||"Not set"} onClick={()=>startEdit("diet")} />
        {(profile.dairyPref==="dairy_free"||profile.dairyPref==="lactose_free")&&<Row label="Milk alternative" value={profile.milkAlt||"Not set"} onClick={()=>startEdit("milkalt")} />}
        <Row label="Gluten" value={profile.glutenPref?.replace(/_/g," ")||"Not set"} onClick={()=>startEdit("diet")} />
        <Row label="Allergies" value={profile.allergies?.length>0?`${profile.allergies.length} selected`:"None"} onClick={()=>startEdit("allergies")} />
        <Row label="Dislikes" value={profile.dislikes?.length>0?`${profile.dislikes.length} foods`:"None"} onClick={()=>startEdit("dislikes")} />
        <Row label="Cooking time" value={{"quick":"Quick (15 min)","moderate":"Moderate (30 min)","enjoy":"I enjoy cooking (1hr)"}[profile.cookingTime||"moderate"]} onClick={()=>startEdit("cookingtime")} />
        <Row label="Meal plan length" value={`${profile.mealPlanDays||5} days`} onClick={()=>startEdit("mealplan")} last />
      </Section>

      <Section title="Supplements">
        <Row label="Supplement preference" value={{"yes":"Open to supplements","maybe":"Maybe","no":"Food only"}[profile.supplementsOpen||"maybe"]} onClick={()=>startEdit("supplements")} />
        <Row label="Interested in" value={profile.supplementsInterested?.length>0?profile.supplementsInterested.join(", "):"None selected"} onClick={()=>startEdit("supplements")} last />
      </Section>

      <Section title="Lifestyle">
        <Row label="Activity level" value={{"sedentary":"Sedentary","light":"Lightly active","moderate":"Moderately active","very":"Very active"}[profile.activityLevel||"moderate"]} onClick={()=>startEdit("lifestyle")} />
        <Row label="Workout style" value={profile.workoutStyle||"mixed"} onClick={()=>startEdit("lifestyle")} last />
      </Section>

      <Section title="App Mode">
        <Row label="Mode" value={profile.appMode==="custom"?"Custom (coming soon)":"Guided"} onClick={()=>startEdit("appmode")} />
        <Row label="About" value={profile.appMode==="guided"?"LeanPlan plans everything for you":"Log your own meals and workouts"} color={C.muted} last />
      </Section>

      <Section title="Appearance">
        <div style={{ padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:20 }}>{isDark ? "🌙" : "☀️"}</span>
            <div>
              <p style={{ color:C.text, fontSize:15, margin:0 }}>Dark Mode</p>
              <p style={{ color:C.muted, fontSize:12, margin:"2px 0 0" }}>{darkOverride===null?"Following system":darkOverride?"Always on":"Always off"}</p>
            </div>
          </div>
          <Toggle value={isDark} onChange={v => setDarkOverride(v)} />
        </div>
        <div style={{ padding:"0 16px 14px", display:"flex", gap:8 }}>
          {[["📱","Auto",null],["☀️","Light",false],["🌙","Dark",true]].map(([ico, label, val]) => {
            const isActive = darkOverride === val;
            return (
              <div key={label} onClick={() => setDarkOverride(val)}
                style={{ flex:1, textAlign:"center", padding:"10px 4px", borderRadius:12,
                  background: isActive ? C.accent : C.sectionBg,
                  border: `1.5px solid ${isActive ? C.accent : C.border}`,
                  cursor:"pointer", transition:"all 0.2s" }}>
                <div style={{ fontSize:16, marginBottom:4 }}>{ico}</div>
                <div style={{ color: isActive ? "#fff" : C.text, fontSize:12, fontWeight: isActive ? 700 : 400 }}>{label}</div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Account section */}
      <Section title="Account">
        {user ? (
          <div>
            <Row label="Signed in as" value={user.email} />
            <Row label="Data sync" value="✓ Synced to cloud" color={C.green} />
            <Row label="Change password" value="••••••••" onClick={()=>setShowChangePw(true)} last />
            <div style={{ padding:"8px 16px 4px" }}>
              <button onClick={async()=>{ await supabase.auth.signOut(); localStorage.removeItem("leanplan_v4"); window.location.reload(); }}
                style={{ width:"100%", background:"none", border:`1px solid ${C.red}44`, borderRadius:10, color:C.red, fontSize:14, fontWeight:600, textAlign:"center", cursor:"pointer", padding:"10px 0", fontFamily:FONT }}>
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div>
            <Row label="Account" value="Not signed in" color={C.muted} last />
            <div style={{ padding:"12px 16px" }}>
              <Btn color={C.accent} onClick={onShowAuth} style={{ width:"100%", marginBottom:8 }}>Sign In to Existing Account</Btn>
              <p style={{ color:C.muted, fontSize:12, textAlign:"center", margin:0 }}>Have an account? Sign in to sync your data across devices</p>
            </div>
          </div>
        )}
      </Section>

      {/* Pro status */}
      {isPro && proData?.customerId && proData?.customerId !== 'bypass' && proData?.subscriptionId !== 'bypass' ? (
        <div style={{ background:`${C.green}10`, border:`1px solid ${C.green}33`, borderRadius:14, padding:"14px 16px", marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <p style={{ color:C.green, fontWeight:700, fontSize:15, margin:0 }}>✓ LeanPlan Pro</p>
              <p style={{ color:C.muted, fontSize:12, margin:"2px 0 0" }}>{proData?.plan === "annual" ? "Annual plan" : "Monthly plan"}</p>
            </div>
            {proData?.customerId && proData.customerId !== "bypass" && (
              <Btn small outline color={C.green} onClick={async()=>{
                try {
                  const res = await fetch("/api/stripe/portal",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({customerId:proData.customerId})});
                  const data = await res.json();
                  if (data.url) window.location.href = data.url;
                  else alert("Could not open billing portal. Please contact support.");
                } catch(e){ alert("Could not connect. Please try again."); }
              }}>Manage</Btn>
            )}
          </div>
        </div>
      ) : proData?.customerId === "bypass" ? (
        <div style={{ background:"linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:14, padding:"14px 16px", marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <p style={{ color:"#f59e0b", fontWeight:700, fontSize:15, margin:0 }}>⭐ Lifetime Pro</p>
              <p style={{ color:"rgba(255,255,255,0.5)", fontSize:12, margin:"2px 0 0" }}>Admin access — all features unlocked</p>
            </div>
          </div>
        </div>
      ) : (
        <Btn onClick={onUpgrade} color="#5856d6" style={{ width:"100%", marginBottom:16 }}>✦ Upgrade to Pro from £14.99/mo</Btn>
      )}

      <div style={{ marginTop:8 }}>
        <Btn onClick={onReset} outline color={C.red} style={{ width:"100%" }}>Reset All Data</Btn>
      </div>
      <p style={{ color:C.muted, fontSize:12, textAlign:"center", marginTop:16, lineHeight:1.6 }}>General guidance only. Consult your GP before making significant diet or exercise changes.</p>

      {/* Avatar crop modal — rendered as portal-style fixed overlay */}
      {showCropModal && <AvatarCropModal
        url={showCropModal.url}
        onSave={handleCropSave}
        onCancel={handleCropCancel}
        saving={avatarUploading}
        croppieRef={croppieRef}
      />}
    </div>
  );
};


