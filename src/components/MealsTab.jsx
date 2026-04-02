import React, { useState } from "react";
import { useTheme } from "../ThemeContext.jsx";
import { FONT } from "../constants.js";
import { todayKey, fmtDate, calcTDEE, getPace } from "../helpers.js";
import { SUPPS, SHOPPING } from "../data/workouts.js";
import { Icon } from "./Icon.jsx";
import { Card, Btn, Chip, ProgressBar } from "./ui.jsx";
import { MealPlanLoader } from "./MealPlanLoader.jsx";
import { MealCarousel } from "./MealCarousel.jsx";

export const MealsTab = ({ profile, favourites, setFavourites, removed, setRemoved, mealLog, setMealLog, isPro, onUpgrade, mealPlan, onSaveMealPlan, generating, setGenerating, generateProgress, setGenerateProgress, generateError, setGenerateError, user }) => {
  const C = useTheme();
  const isGuided = profile?.appMode !== "custom";
  const [section, setSection] = useState("meals");
  const [suppOpen, setSuppOpen] = useState(null);
  // generating/generateProgress/generateError lifted to App level (survives tab switches)
  const [swapConfirm, setSwapConfirm] = useState(null); // { meal, slotIndex }
  const [listEmailSent, setListEmailSent] = useState(false);
  const [listEmailSending, setListEmailSending] = useState(false);
  const [swappingId, setSwappingId] = useState(null);
  const [style, setStyle] = useState("all"); // kept for non-guided
  const [checked, setChecked] = useState({});
  const [pantry, setPantry] = useState(() => {
    try { return JSON.parse(localStorage.getItem("leanplan_pantry") || "[]"); } catch { return []; }
  });
  const savePantry = (items) => {
    setPantry(items);
    localStorage.setItem("leanplan_pantry", JSON.stringify(items));
  };
  const togglePantry = (itemName) => {
    const key = itemName.toLowerCase().trim();
    const updated = pantry.includes(key) ? pantry.filter(p=>p!==key) : [...pantry, key];
    savePantry(updated);
  };
  const isInPantry = (itemName) => pantry.includes(itemName.toLowerCase().trim());
  const [dislikedMeals, setDislikedMeals] = useState(() => {
    try { return JSON.parse(localStorage.getItem("leanplan_disliked_meals") || "[]"); } catch { return []; }
  });
  const [likedMeals, setLikedMeals] = useState(() => {
    try { return JSON.parse(localStorage.getItem("leanplan_liked_meals") || "[]"); } catch { return []; }
  });

  const planDays = profile?.mealPlanDays || 5;
  const today = todayKey();
  const tdee = calcTDEE(profile);
  const pace = getPace(profile.paceId||"normal");
  const targetCals = tdee ? tdee - Math.round(pace.lbs*500) : 1700;

  // Derived targets for display
  const weightKg = profile?.startWeightLbs ? profile.startWeightLbs * 0.453592 : null;
  const ageNum = parseFloat(profile?.age) || 0;
  const proteinMult = ageNum >= 50 ? 2.4 : 2.2;
  const displayProteinTarget = weightKg ? Math.round(weightKg * proteinMult) : null;
  const profileComplete = !!(profile?.heightCm && profile?.startWeightLbs && profile?.age);

  const getSlotName = (type) => {
    const map = { breakfast:"breakfast", snack:"morningSnack", lunch:"lunch", dinner:"dinner" };
    return map[type] || "morningSnack";
  };

  const requestSwap = (meal) => {
    setSwapConfirm(meal);
  };

  const confirmSwap = async (meal) => {
    setSwapConfirm(null);
    setSwappingId(meal.id);
    try {
      const slot = getSlotName(meal.type);
      const prevDinner = selectedDay?.meals?.find(m => m.type === "dinner" && m.id !== meal.id);
      const res = await fetch("/api/swap-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          slot,
          targets: { cal: meal.cals, protein: meal.protein, carbs: meal.carbs, fat: meal.fat, type: meal.type, time: meal.time },
          prevDinnerName: meal.type === "lunch" ? prevDinner?.name : null,
          dislikedMealNames: dislikedMeals,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      // Replace meal in plan
      if (mealPlan?.days) {
        const updatedDays = mealPlan.days.map(day => ({
          ...day,
          meals: day.meals.map(m => m.id === meal.id ? data.meal : m)
        }));
        onSaveMealPlan({ ...mealPlan, days: updatedDays });
      }
    } catch(err) {
      console.error("Swap error:", err);
    }
    setSwappingId(null);
  };

  // Which day are we viewing — default to today
  const [selectedDate, setSelectedDate] = useState(today);
  const planDayDates = mealPlan?.days?.map(d=>d.date) || [];
  const selectedDay = mealPlan?.days?.find(d=>d.date===selectedDate) || mealPlan?.days?.[0] || null;
  const shownMeals = selectedDay?.meals || null;

  const todayLogged = mealLog[today]||[];
  const todayCals = todayLogged.reduce((a,m)=>a+m.cals,0);
  const todayProt = todayLogged.reduce((a,m)=>a+m.protein,0);

  const saveLikedMeals = (meals) => { setLikedMeals(meals); localStorage.setItem("leanplan_liked_meals", JSON.stringify(meals)); };
  const saveDislikedMeals = (meals) => { setDislikedMeals(meals); localStorage.setItem("leanplan_disliked_meals", JSON.stringify(meals)); };
  const likeMeal = (m) => {
    if (!likedMeals.find(l=>l.name===m.name)) saveLikedMeals([...likedMeals, {name:m.name, id:m.id}]);
    setFavourites(f=>f.includes(m.id)?f:[...f,m.id]);
  };
  const [showDislikeNudge, setShowDislikeNudge] = useState(false);

  const dislikeMeal = (m) => {
    saveDislikedMeals([...dislikedMeals.filter(d=>d!==m.name), m.name]);
    // Remove meal from the plan visually
    if (mealPlan?.days) {
      const updatedDays = mealPlan.days.map(day => ({
        ...day,
        meals: day.meals.filter(meal => meal.id !== m.id)
      }));
      onSaveMealPlan({ ...mealPlan, days: updatedDays });
    }
    setShowDislikeNudge(true);
  };

  const generatePlan = async () => {
    if (isGuided && !profileComplete) {
      setGenerateError("Please complete your profile (height, weight, age) before generating a plan.");
      return;
    }
    setGenerating(true);
    setGenerateError(null);
    setGenerateProgress("Calculating your targets...");
    try {
      await new Promise(r => setTimeout(r, 400));
      setGenerateProgress(`Building your ${planDays}-day plan...`);

      const endpoint = isGuided ? "/api/generate-meal-plan-v3" : "/api/generate-meal-plan-v2";
      const body = isGuided
        ? { profile, days: planDays }
        : { profile, dislikedMealNames: dislikedMeals, style, days: planDays };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      setGenerateProgress("Finalising your meals...");
      const data = await res.json();
      if (data.error === "incomplete_profile") {
        setGenerateError("Please complete your profile (height, weight, age) to generate a personalised plan.");
        setGenerating(false); setGenerateProgress(null); return;
      }
      if (data.error) throw new Error(data.error);

      const plan = {
        days: data.days,
        generatedDate: today,
        coreProteins: data.coreProteins,
        dailyCalTarget: data.dailyCalTarget,
        dailyProteinTarget: data.dailyProteinTarget,
        tdee: data.tdee,
        ingredients: data.ingredients,
        isGuided,
      };
      onSaveMealPlan(plan);
      setSelectedDate(today);
    } catch(err) {
      setGenerateError("Could not generate meal plan. Please try again.");
      console.error(err);
    }
    setGenerating(false);
    setGenerateProgress(null);
  };

  const logMeal = m => {
    const currentCals = (mealLog[today]||[]).reduce((a,x)=>a+x.cals,0);
    const newTotal = currentCals + m.cals;
    const target = tdee ? tdee - Math.round(pace.lbs*500) : 1800;
    if (tdee && newTotal > target * 1.1) {
      const ok = window.confirm(`⚠️ Calorie Warning\n\nLogging this meal will bring your total to ${newTotal} calories — ${Math.round(((newTotal/target)-1)*100)}% over your daily target of ${target}.\n\nLog it anyway?`);
      if (!ok) return;
    }
    setMealLog(ml=>({...ml,[today]:[...(ml[today]||[]),{id:m.id,name:m.name,cals:m.cals,protein:m.protein,carbs:m.carbs,fat:m.fat,time:new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}]}));
  };
  const removeMealLog = (i) => setMealLog(ml=>({...ml,[today]:(ml[today]||[]).filter((_,idx)=>idx!==i)}));

  // Build shopping list from all plan days
  const AISLE_RULES = [
    { name:"🥩 Meat & Fish",    color:"#ff453a", keywords:["chicken","turkey","beef","lamb","pork","mince","steak","salmon","tuna","cod","haddock","prawn","shrimp","bacon","sausage","fish fillet","tilapia","mackerel"] },
    { name:"🥚 Eggs & Dairy",   color:"#ff9f0a", keywords:["egg","milk","yoghurt","yogurt","cheese","butter","cream","kefir","quark","soya milk","oat milk","almond milk","coconut milk","coconut yoghurt","dairy-free"] },
    { name:"🥦 Vegetables",     color:"#30d158", keywords:["broccoli","spinach","kale","lettuce","pepper","courgette","carrot","onion","garlic","tomato","cucumber","celery","leek","cabbage","cauliflower","asparagus","mushroom","aubergine","sweet potato","potato","pea","corn","sweetcorn","bean sprout","spring onion","chilli","ginger","beetroot","parsnip","squash","avocado","edamame","pak choi"] },
    { name:"🍎 Fruit",          color:"#ff375f", keywords:["banana","apple","berry","blueberry","strawberry","raspberry","mango","orange","lemon","lime","grape","melon","peach","plum","pear","pineapple","kiwi","date","dried fruit","raisin"] },
    { name:"🍚 Carbs & Grains", color:"#818cf8", keywords:["rice","pasta","quinoa","oat","bread","tortilla","wrap","noodle","couscous","bulgur","barley","rye","cracker","rice cake","cereal","granola","flour","gf oat","porridge"] },
    { name:"🥫 Tins & Jars",    color:"#f59e0b", keywords:["tin","tinned","canned","chopped tomato","kidney bean","chickpea","lentil","black bean","cannellini","coconut cream","stock","broth","passata","tomato puree","pesto","curry paste","tahini","almond butter","peanut butter","jam","honey"] },
    { name:"🫙 Cupboard",       color:"#5ac8fa", keywords:["olive oil","coconut oil","tamari","soy sauce","vinegar","worcester","mustard","mayo","ketchup","hot sauce","seasoning","herb","spice","cumin","paprika","turmeric","oregano","basil","cinnamon","salt","pepper","bay leaf","chilli flake","nutritional yeast","baking"] },
    { name:"🥜 Snacks & Nuts",  color:"#bf5af2", keywords:["nut","almond","cashew","walnut","pecan","pistachio","seed","sunflower","pumpkin seed","hummus","protein bar","protein powder","snack","popcorn","dark chocolate","rice cake"] },
    { name:"💊 Supplements",    color:"#0a84ff", keywords:["creatine","vitamin","supplement","omega","magnesium","protein powder","whey","pea protein"] },
  ];

  const categoriseItem = (name) => {
    const lower = name.toLowerCase();
    for (const aisle of AISLE_RULES) {
      if (aisle.keywords.some(k => lower.includes(k))) return aisle.name;
    }
    return "🛍️ Other";
  };

  const buildShoppingList = () => {
    if (!mealPlan?.days) return [];
    const allItems = {};
    mealPlan.days.forEach(day => {
      day.meals.forEach(meal => {
        // Skip leftover meals — their ingredients are already counted from the original dinner
        const isLeftover = meal.name?.toLowerCase().includes("leftover") ||
                           meal.method?.toLowerCase().includes("leftover") ||
                           meal.name?.toLowerCase().includes("using leftover");
        if (isLeftover) return;

        meal.items.forEach(item => {
          const stripped = item.replace(/\s*\([^)]*\)/g, "").trim();
          const key = stripped.toLowerCase();
          const amountMatch = item.match(/\(([^)]+)\)/);
          const amount = amountMatch ? amountMatch[1] : "";
          if (!allItems[key]) allItems[key] = { display: stripped, amounts: [], category: categoriseItem(stripped) };
          if (amount && !allItems[key].amounts.includes(amount)) allItems[key].amounts.push(amount);
        });
      });
    });
    // Group by category
    const grouped = {};
    Object.values(allItems).forEach(item => {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    });
    // Sort categories by aisle order
    const order = [...AISLE_RULES.map(a=>a.name), "🛍️ Other"];
    return order.filter(cat => grouped[cat]).map(cat => ({
      name: cat,
      color: AISLE_RULES.find(a=>a.name===cat)?.color || C.muted,
      items: grouped[cat]
    }));
  };

  const shoppingCategories = buildShoppingList();
  const totalItems = shoppingCategories.reduce((a,c)=>a+c.items.length, 0);

  // Format date for display
  const fmtPlanDate = (dateStr) => {
    const d = new Date(dateStr + "T12:00:00");
    const todayD = new Date(today + "T12:00:00");
    const diff = Math.round((d - todayD) / (1000*60*60*24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    return d.toLocaleDateString("en-GB", {weekday:"short", day:"numeric", month:"short"});
  };

  return (
    <div>
      <div style={{ display:"flex", background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:3, marginBottom:12, gap:2 }}>
        {[["meals","Meals"],["shopping","Shopping"],["supps","Supplements"]].map(([k,l])=>(
          <button key={k} onClick={()=>setSection(k)} style={{ flex:1, background:section===k?C.accent:"transparent", color:section===k?"#fff":C.muted, border:"none", borderRadius:10, padding:"8px 0", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:FONT, transition:"all 0.2s" }}>{l}</button>
        ))}
      </div>

      {section==="meals"&&<>
        {/* Daily log summary */}
        {/* Smart nutrition bar + generate controls */}
        {generating ? (
          <MealPlanLoader progress={generateProgress} />
        ) : mealPlan && isPro ? (
          // Plan exists — compact single-line bar
          <div style={{ marginBottom:12 }}>
            {/* Expiry nudge — shown when all plan days are in the past */}
            {mealPlan.days && !mealPlan.days.some(d => d.date > today) && (
              <div style={{ background:`${C.orange}12`, border:`1px solid ${C.orange}44`, borderRadius:14, padding:"12px 14px", marginBottom:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <p style={{ color:C.orange, fontWeight:700, fontSize:13, margin:0 }}>Your meal plan has ended</p>
                  <p style={{ color:C.muted, fontSize:12, margin:"2px 0 0" }}>Ready for a fresh plan?</p>
                </div>
                <button onClick={generatePlan} disabled={generating} style={{ background:C.orange, border:"none", borderRadius:99, padding:"8px 14px", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:FONT, flexShrink:0, marginLeft:12 }}>
                  Generate →
                </button>
              </div>
            )}
            {/* Smart nutrition bar */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"10px 14px", marginBottom:8 }}>
              {isGuided && (() => {
                const dayTarget = mealPlan.dailyCalTarget || targetCals;
                const protTarget = mealPlan.dailyProteinTarget || displayProteinTarget;
                const isToday = selectedDate === today;
                const loggedCal = isToday ? todayCals : 0;
                const loggedProt = isToday ? todayProt : 0;
                const dayMealCal = shownMeals?.reduce((a,m)=>a+m.cals,0) || 0;
                const dayMealProt = shownMeals?.reduce((a,m)=>a+m.protein,0) || 0;
                const onTrack = dayMealCal >= dayTarget * 0.9 && dayMealCal <= dayTarget * 1.1;
                return (
                  <div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:isToday&&loggedCal>0?8:0 }}>
                      <div style={{ display:"flex", gap:14, alignItems:"center" }}>
                        <span style={{ color:C.accent, fontWeight:700, fontSize:14 }}>{dayMealCal} <span style={{ color:C.muted, fontWeight:400, fontSize:12 }}>/ {dayTarget} cal</span></span>
                        <span style={{ color:C.green, fontWeight:700, fontSize:14 }}>{dayMealProt}g <span style={{ color:C.muted, fontWeight:400, fontSize:12 }}>/ {protTarget}g protein</span></span>
                      </div>
                      <span style={{ fontSize:14 }}>{onTrack ? "✓" : "~"}</span>
                    </div>
                    {isToday && loggedCal > 0 && (
                      <div>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <span style={{ color:C.muted, fontSize:11 }}>Logged today</span>
                          <span style={{ color:loggedCal>dayTarget?C.red:C.green, fontSize:11, fontWeight:600 }}>{loggedCal} / {dayTarget} cal</span>
                        </div>
                        <ProgressBar value={loggedCal} max={dayTarget} color={loggedCal>dayTarget?C.red:C.green} height={4} />
                      </div>
                    )}
                  </div>
                );
              })()}
              {!isGuided && shownMeals && (
                <div style={{ display:"flex", gap:14 }}>
                  <span style={{ color:C.accent, fontWeight:700, fontSize:14 }}>{shownMeals.reduce((a,m)=>a+m.cals,0)} kcal</span>
                  <span style={{ color:C.green, fontWeight:600, fontSize:14 }}>{shownMeals.reduce((a,m)=>a+m.protein,0)}g protein</span>
                  <span style={{ color:C.orange, fontWeight:600, fontSize:14 }}>{shownMeals.reduce((a,m)=>a+m.carbs,0)}g carbs</span>
                </div>
              )}
            </div>
            {/* Compact regenerate row */}
            {!isGuided && (
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:6 }}>
                {["all","balanced","high-protein","mediterranean","budget-friendly"].map(s=><Chip key={s} color={C.accent} active={style===s} onClick={()=>setStyle(s)}>{s}</Chip>)}
              </div>
            )}
            <button onClick={generatePlan} disabled={generating} style={{ width:"100%", background:"none", border:`1px solid ${C.border}`, borderRadius:12, padding:"8px 0", color:C.muted, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:FONT }}>
              ↻ Regenerate plan · {fmtDate(mealPlan.generatedDate)}
            </button>
            {generateError && <p style={{ color:C.red, fontSize:13, textAlign:"center", marginTop:6 }}>{generateError}</p>}
          </div>
        ) : (
          // No plan yet — full generate card
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"14px", marginBottom:12 }}>
            {isGuided && profileComplete && (
              <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                <div style={{ flex:1, background:C.sectionBg, borderRadius:12, padding:"10px 12px", textAlign:"center" }}>
                  <p style={{ color:C.accent, fontWeight:800, fontSize:18, margin:0 }}>{targetCals}</p>
                  <p style={{ color:C.muted, fontSize:11, margin:"2px 0 0" }}>cal / day</p>
                </div>
                <div style={{ flex:1, background:C.sectionBg, borderRadius:12, padding:"10px 12px", textAlign:"center" }}>
                  <p style={{ color:C.green, fontWeight:800, fontSize:18, margin:0 }}>{displayProteinTarget || "—"}g</p>
                  <p style={{ color:C.muted, fontSize:11, margin:"2px 0 0" }}>protein / day</p>
                </div>
                <div style={{ flex:1, background:C.sectionBg, borderRadius:12, padding:"10px 12px", textAlign:"center" }}>
                  <p style={{ color:C.orange, fontWeight:800, fontSize:18, margin:0 }}>{planDays}d</p>
                  <p style={{ color:C.muted, fontSize:11, margin:"2px 0 0" }}>plan length</p>
                </div>
              </div>
            )}
            {isGuided && !profileComplete && (
              <div style={{ background:`${C.orange}12`, border:`1px solid ${C.orange}33`, borderRadius:12, padding:"10px 14px", marginBottom:12 }}>
                <p style={{ color:C.orange, fontSize:13, fontWeight:700, margin:"0 0 4px" }}>⚠️ Profile incomplete</p>
                <p style={{ color:C.muted, fontSize:12, margin:0 }}>Add your height, weight and age in Profile settings to get a personalised plan with accurate calorie targets.</p>
              </div>
            )}
            {!isGuided && (
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
                {["all","balanced","high-protein","mediterranean","budget-friendly"].map(s=><Chip key={s} color={C.accent} active={style===s} onClick={()=>setStyle(s)}>{s}</Chip>)}
              </div>
            )}
            {isPro ? (
              <div>
                <Btn onClick={generatePlan} disabled={generating || (isGuided && !profileComplete)} style={{ width:"100%", padding:"11px 0", fontSize:15 }}>
                  ✦ Generate my {planDays}-day plan
                </Btn>
                {generateError && <p style={{ color:C.red, fontSize:13, textAlign:"center", marginTop:6 }}>{generateError}</p>}
              </div>
            ) : (
              <div>
                <Btn onClick={onUpgrade} color="#5856d6" style={{ width:"100%", padding:"11px 0" }}>✦ Unlock AI Meal Planning — Pro</Btn>
                <p style={{ color:C.muted, fontSize:12, textAlign:"center", marginTop:6 }}>Generate a full {planDays}-day personalised meal plan</p>
              </div>
            )}
          </div>
        )}

        {/* Day picker */}
        {mealPlan?.days && mealPlan.days.length > 1 && (
          <div style={{ display:"flex", gap:6, overflowX:"auto", marginBottom:12, paddingBottom:2, scrollbarWidth:"none" }}>
            {mealPlan.days.map(d => (
              <button key={d.date} onClick={()=>setSelectedDate(d.date)} style={{ flexShrink:0, background:selectedDate===d.date?C.accent:C.card, border:`1px solid ${selectedDate===d.date?C.accent:C.border}`, borderRadius:10, padding:"6px 12px", color:selectedDate===d.date?"#fff":d.date===today?C.accent:C.text, fontSize:12, fontWeight:selectedDate===d.date||d.date===today?700:400, cursor:"pointer", fontFamily:FONT, whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:4 }}>
                {fmtPlanDate(d.date)}
                {isGuided && d.isTrainingDay && <span style={{ fontSize:10 }}>🏋️</span>}
              </button>
            ))}
          </div>
        )}

        {/* Meals for selected day */}
        {shownMeals&&<>
          <MealCarousel
            meals={shownMeals}
            favourites={favourites}
            likedMeals={likedMeals}
            mealLog={mealLog}
            today={today}
            onLike={likeMeal}
            onDislike={dislikeMeal}
            onLog={logMeal}
            onRemoveLog={removeMealLog}
            targetCals={targetCals}
            isGuided={isGuided}
            onSwap={requestSwap}
            swappingId={swappingId}
          />
        </>}

        {/* Swap confirmation modal */}
        {swapConfirm && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:1000, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
            <div style={{ background:C.card, borderRadius:"20px 20px 0 0", padding:"24px 20px 40px", width:"100%", maxWidth:480 }}>
              <p style={{ color:C.text, fontWeight:800, fontSize:18, margin:"0 0 8px" }}>Swap this meal?</p>
              <p style={{ color:C.muted, fontSize:14, lineHeight:1.6, margin:"0 0 6px" }}>We'll find a different <strong style={{ color:C.text }}>{swapConfirm.type}</strong> with the same calories and protein so your daily targets stay on track.</p>
              <div style={{ background:C.sectionBg, borderRadius:12, padding:"10px 14px", marginBottom:20 }}>
                <div style={{ display:"flex", gap:16 }}>
                  <span style={{ color:C.accent, fontWeight:700, fontSize:14 }}>{swapConfirm.cals} cal</span>
                  <span style={{ color:C.green, fontWeight:700, fontSize:14 }}>{swapConfirm.protein}g protein</span>
                  <span style={{ color:C.orange, fontWeight:700, fontSize:14 }}>{swapConfirm.carbs}g carbs</span>
                </div>
                <p style={{ color:C.muted, fontSize:12, margin:"4px 0 0" }}>The replacement will match these targets</p>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={()=>setSwapConfirm(null)} style={{ flex:1, background:"none", border:`1.5px solid ${C.border}`, borderRadius:12, padding:"12px 0", color:C.text, fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:FONT }}>Cancel</button>
                <button onClick={()=>confirmSwap(swapConfirm)} style={{ flex:2, background:C.accent, border:"none", borderRadius:12, padding:"12px 0", color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:FONT }}>⇄ Find me a swap</button>
              </div>
            </div>
          </div>
        )}

        {showDislikeNudge && mealPlan && (
          <div style={{ background:`${C.orange}10`, border:`1px solid ${C.orange}33`, borderRadius:14, padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <p style={{ color:C.text, fontSize:13, margin:0 }}>👎 Meal removed — regenerate for a fresh plan</p>
            <button onClick={()=>{ setShowDislikeNudge(false); generatePlan(); }} disabled={generating} style={{ background:C.orange, border:"none", borderRadius:99, padding:"6px 14px", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:FONT, flexShrink:0 }}>↻ Regenerate</button>
          </div>
        )}

        {!mealPlan && !generating && isPro && (
          <div style={{ textAlign:"center", padding:"32px 20px", background:C.card, border:`1px solid ${C.border}`, borderRadius:16 }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🍽️</div>
            <p style={{ color:C.text, fontWeight:700, fontSize:16, margin:"0 0 6px" }}>No meal plan yet</p>
            <p style={{ color:C.muted, fontSize:13, lineHeight:1.6, margin:"0 0 16px" }}>Generate your {planDays}-day plan above, then head to Shopping for your ingredients list.</p>
          </div>
        )}
      </>}

      {section==="shopping"&&<>
        {!mealPlan ? (
          <div style={{ textAlign:"center", padding:"40px 20px", background:C.card, border:`1px solid ${C.border}`, borderRadius:16 }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🛒</div>
            <p style={{ color:C.text, fontWeight:700, fontSize:16, margin:"0 0 8px" }}>Generate your meal plan first</p>
            <p style={{ color:C.muted, fontSize:13, lineHeight:1.6, margin:"0 0 20px" }}>Your shopping list is built automatically from your meal plan. Head to Meals and generate your {planDays}-day plan, then come back here.</p>
            <Btn onClick={()=>setSection("meals")} color={C.accent} style={{ padding:"10px 24px" }}>← Go to Meals</Btn>
          </div>
        ) : (
          <>
            <Card style={{ background:`${C.green}08`, borderColor:`${C.green}33` }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                <Icon name="bag" size={14} color={C.green} />
                <p style={{ color:C.green, fontSize:12, fontWeight:700, margin:0 }}>SHOPPING LIST — {mealPlan.days.length}-DAY PLAN</p>
              </div>
              <p style={{ color:C.text, fontSize:13, lineHeight:1.6, margin:"0 0 4px" }}>Based on your meal plan from {fmtDate(mealPlan.generatedDate)}.</p>
              {(()=>{
                const inPantryCount = shoppingCategories.reduce((a,cat)=>a+cat.items.filter(item=>isInPantry(item.display)).length, 0);
                const toBuyCount = totalItems - inPantryCount;
                const boughtCount = Object.values(checked).filter(Boolean).length;
                return (
                  <div style={{ display:"flex", gap:12, marginTop:2 }}>
                    <span style={{ color:C.accent, fontSize:12, fontWeight:600 }}>🛒 {toBuyCount - boughtCount} to buy</span>
                    <span style={{ color:C.green, fontSize:12 }}>✓ {boughtCount} bought</span>
                    <span style={{ color:C.muted, fontSize:12 }}>🏠 {inPantryCount} in pantry</span>
                  </div>
                );
              })()}
            </Card>

            {/* Pantry info tip */}
            <div style={{ background:`${C.accent}10`, border:`1px solid ${C.accent}22`, borderRadius:12, padding:"10px 14px", marginBottom:12 }}>
              <p style={{ color:C.accent, fontSize:12, fontWeight:700, margin:"0 0 2px" }}>🏠 Pantry items</p>
              <p style={{ color:C.muted, fontSize:12, margin:0 }}>Tap 🏠 to mark items already in your cupboard — they'll be remembered next time you generate a plan.</p>
            </div>

            {shoppingCategories.length > 0 && shoppingCategories.map((cat, ci) => {
              const visibleItems = cat.items;
              if (visibleItems.length === 0) return null;
              const catInPantry = visibleItems.filter(item=>isInPantry(item.display)).length;
              return (
                <div key={ci} style={{ marginBottom:12 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, paddingLeft:2 }}>
                    <div style={{ width:8, height:8, borderRadius:99, background:cat.color, flexShrink:0 }} />
                    <span style={{ color:C.muted, fontSize:11, fontWeight:700, letterSpacing:"0.06em" }}>{cat.name.toUpperCase()}</span>
                    <span style={{ color:C.muted, fontSize:11 }}>· {visibleItems.length - catInPantry} to buy{catInPantry>0?`, ${catInPantry} in pantry`:""}</span>
                  </div>
                  <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
                    {visibleItems.map((item, ii) => {
                      const k = `${ci}-${ii}`;
                      const inPantry = isInPantry(item.display);
                      const bought = checked[k];
                      return (
                        <div key={ii} style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 14px", borderBottom:ii<visibleItems.length-1?`1px solid ${C.border}`:"none", opacity:inPantry?0.45:1, background:inPantry?`${C.green}06`:"transparent" }}>
                          {/* Pantry toggle */}
                          <button
                            onClick={()=>togglePantry(item.display)}
                            title={inPantry?"Remove from pantry":"Mark as in pantry"}
                            style={{ width:30, height:30, borderRadius:8, background:inPantry?`${C.green}20`:"transparent", border:`1.5px solid ${inPantry?C.green:C.border}`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0, transition:"all 0.15s" }}
                          >🏠</button>
                          {/* Item name + amount */}
                          <div style={{ flex:1 }} onClick={()=>!inPantry&&setChecked(c=>({...c,[k]:!c[k]}))}>
                            <span style={{ color:inPantry?C.muted:C.text, fontSize:14, textDecoration:bought||inPantry?"line-through":"none", cursor:inPantry?"default":"pointer" }}>{item.display}</span>
                            {item.amounts.length > 0 && <span style={{ color:C.muted, fontSize:12, marginLeft:6 }}>({item.amounts[0]})</span>}
                            {inPantry && <span style={{ color:C.green, fontSize:11, marginLeft:8, fontWeight:600 }}>in pantry</span>}
                          </div>
                          {/* Bought tick — only shown if not in pantry */}
                          {!inPantry && (
                            <button
                              onClick={()=>setChecked(c=>({...c,[k]:!c[k]}))}
                              style={{ width:26, height:26, borderRadius:99, flexShrink:0, background:bought?cat.color:"transparent", border:`2px solid ${bought?cat.color:C.divider}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"all 0.15s" }}
                            >
                              {bought&&<span style={{ color:"#fff", fontSize:11, fontWeight:700 }}>✓</span>}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Share shopping list */}
            <div style={{ display:"flex", gap:8, marginTop:12, marginBottom:8 }}>
              <button
                onClick={()=>{
                  const text = shoppingCategories.map((cat, ci) =>
                    cat.name + "\n" + cat.items.filter((item, ii) => checked[`${ci}-${ii}`]).map(item => `• ${item.display}${item.amounts?.[0] ? " ("+item.amounts[0]+")" : ""}`).join("\n")
                  ).filter(s => s.includes("•")).join("\n\n");
                  if (!text.trim()) { alert("Tick the items you need first, then copy."); return; }
                  navigator.clipboard.writeText(text).then(()=>{ alert("Ticked items copied to clipboard!"); });
                }}
                style={{ flex:1, background:C.accent, border:`1px solid ${C.accent}`, borderRadius:10, padding:"10px 0", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:FONT }}
              >📋 Copy list</button>
              <button
                onClick={async ()=>{
                  if (!user?.email) { alert("Sign in to email your shopping list"); return; }
                  setListEmailSending(true);
                  const toBuy = shoppingCategories.map((cat, ci) => ({
                    ...cat,
                    items: cat.items.filter((item, ii) => checked[`${ci}-${ii}`])
                  })).filter(cat => cat.items.length > 0);
                  if (toBuy.length === 0) { alert("Tick the items you need first, then email."); setListEmailSending(false); return; }
                  try {
                    const res = await fetch("/api/send-shopping-list", {
                      method:"POST", headers:{"Content-Type":"application/json"},
                      body: JSON.stringify({ email: user.email, name: profile.name, categories: toBuy, planDays: mealPlan?.days?.length || planDays })
                    });
                    const data = await res.json();
                    if (data.success) { setListEmailSent(true); setTimeout(() => setListEmailSent(false), 3000); }
                    else alert("Could not send email. Please try again.");
                  } catch(e) { alert("Could not send email. Please try again."); }
                  setListEmailSending(false);
                }}
                style={{ flex:1, background: listEmailSent ? C.green : C.purple, border:`1px solid ${listEmailSent ? C.green : C.purple}`, borderRadius:10, padding:"10px 0", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:FONT }}
              >{listEmailSending ? "Sending..." : listEmailSent ? "✓ Sent!" : "📧 Email list"}</button>
            </div>

            <div style={{ display:"flex", gap:8, marginTop:4 }}>
              <button onClick={()=>setChecked({})} style={{ flex:1, background:`${C.orange}15`, border:`1px solid ${C.orange}44`, borderRadius:10, padding:"8px 0", color:C.orange, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:FONT }}>Reset ticks</button>
              <button onClick={()=>savePantry([])} style={{ flex:1, background:`${C.red}12`, border:`1px solid ${C.red}44`, borderRadius:10, padding:"8px 0", color:C.red, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:FONT }}>Clear pantry</button>
              <button onClick={()=>setSection("meals")} style={{ flex:1, background:`${C.green}15`, border:`1px solid ${C.green}44`, borderRadius:10, padding:"8px 0", color:C.green, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:FONT }}>↻ New plan</button>
            </div>
          </>
        )}
      </>}

      {section==="supps"&&<>
        <Card style={{ background:`${C.purple}08`, borderColor:`${C.purple}22` }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}><Icon name="pill" size={14} color={C.purple} /><p style={{ color:C.purple, fontSize:12, fontWeight:700, margin:0 }}>SUPPLEMENT GUIDE</p></div>
          <p style={{ color:C.text, fontSize:13, lineHeight:1.7, margin:0 }}>All dairy-free and GF. Tap for details.</p>
        </Card>
        {SUPPS.map((s,i)=><Card key={i} onClick={()=>setSuppOpen(suppOpen===i?null:i)} style={{ borderLeft:`3px solid ${s.color}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:42, height:42, borderRadius:12, background:`${s.color}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{s.icon}</div>
            <div style={{ flex:1 }}><p style={{ color:C.text, fontWeight:600, fontSize:15, margin:0 }}>{s.name}</p><p style={{ color:C.muted, fontSize:12, margin:"2px 0 0" }}>{s.dose}</p></div>
            <span style={{ color:C.muted }}>{suppOpen===i?"▲":"▼"}</span>
          </div>
          {suppOpen===i&&<div style={{ marginTop:14, paddingTop:14, borderTop:`1px solid ${C.border}` }}>
            <Chip color={s.color}>⏰ {s.timing}</Chip>
            <div style={{ display:"flex", alignItems:"center", gap:5, margin:"12px 0 4px" }}><Icon name="tip" size={12} color={C.muted} /><p style={{ color:C.muted, fontSize:11, fontWeight:700, letterSpacing:"0.06em", margin:0 }}>WHY IT HELPS</p></div>
            <p style={{ color:C.text, fontSize:13, lineHeight:1.75, marginBottom:10 }}>{s.why}</p>
            <div style={{ background:`${s.color}10`, borderRadius:10, padding:"10px 12px", borderLeft:`3px solid ${s.color}` }}>
              <p style={{ color:s.color, fontSize:11, fontWeight:700, marginBottom:4 }}>💡 NOTES</p>
              <p style={{ color:C.text, fontSize:12, lineHeight:1.65, margin:0 }}>{s.note}</p>
            </div>
          </div>}
        </Card>)}
      </>}
    </div>
  );
};

