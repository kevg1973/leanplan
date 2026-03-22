import { useState, useEffect, useCallback } from "react";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif";

const LIGHT = {
  bg:"#f2f2f7", surface:"#ffffff", card:"#ffffff",
  accent:"#007aff", green:"#34c759", red:"#ff3b30",
  orange:"#ff9500", purple:"#af52de", teal:"#5ac8fa",
  pink:"#ff2d55", yellow:"#ffcc00", indigo:"#5856d6",
  text:"#000000", textSec:"#3c3c43", muted:"#8e8e93",
  border:"#e5e5ea", divider:"#c6c6c8", sectionBg:"#f2f2f7",
};

const DARK = {
  bg:"#000000", surface:"#1c1c1e", card:"#2c2c2e",
  accent:"#0a84ff", green:"#30d158", red:"#ff453a",
  orange:"#ff9f0a", purple:"#bf5af2", teal:"#5ac8fa",
  pink:"#ff375f", yellow:"#ffd60a", indigo:"#5e5ce6",
  text:"#ffffff", textSec:"#ebebf5", muted:"#8e8e93",
  border:"#3a3a3c", divider:"#48484a", sectionBg:"#1c1c1e",
};

// C is set dynamically in the App — components read it via the global
let C = LIGHT;

const TABS = ["Today","Meals","Train","Track","Coach","Profile"];

// ── SVG Icon system ───────────────────────────────────────────────────────────
const Icon = ({ name, size=22, color="currentColor", style={} }) => {
  const paths = {
    home:      <><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/><path d="M9 21V12h6v9" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>,
    meals:     <><circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth="1.8"/><path d="M12 7v5l3 3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>,
    train:     <><path d="M6 4v16M18 4v16M6 12h12" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><circle cx="6" cy="4" r="2" fill={color}/><circle cx="6" cy="20" r="2" fill={color}/><circle cx="18" cy="4" r="2" fill={color}/><circle cx="18" cy="20" r="2" fill={color}/></>,
    track:     <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>,
    profile:   <><circle cx="12" cy="8" r="4" fill="none" stroke={color} strokeWidth="1.8"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>,
    water:     <><path d="M12 2C12 2 5 10 5 15a7 7 0 0014 0c0-5-7-13-7-13z" fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/></>,
    fire:      <><path d="M12 2c0 0-5 5-5 10a5 5 0 0010 0C17 7 12 2 12 2z" fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/><path d="M12 12c0 0-2 2-2 4a2 2 0 004 0c0-2-2-4-2-4z" fill={color}/></>,
    tip:       <><circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="1.8"/><path d="M12 8v4M12 16h.01" stroke={color} strokeWidth="2" strokeLinecap="round"/></>,
    check:     <><polyline points="20 6 9 17 4 12" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></>,
    star:      <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/></>,
    starFill:  <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill={color} stroke={color} strokeWidth="1.8" strokeLinejoin="round"/></>,
    heart:     <><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/></>,
    calendar:  <><rect x="3" y="4" width="18" height="18" rx="2" fill="none" stroke={color} strokeWidth="1.8"/><line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.8"/></>,
    weight:    <><circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth="1.8"/><path d="M8 12h8M12 8v8" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>,
    ruler:     <><path d="M2 12h20M2 12l4-4M2 12l4 4M6 8v8M10 10v4M14 10v4M18 8v8" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>,
    chart:     <><polyline points="4 20 4 4" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><polyline points="4 20 20 20" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><polyline points="4 16 8 10 12 13 16 7 20 4" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>,
    barbell:   <><line x1="2" y1="12" x2="22" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><rect x="2" y="9" width="3" height="6" rx="1" fill={color}/><rect x="19" y="9" width="3" height="6" rx="1" fill={color}/><rect x="6" y="7" width="3" height="10" rx="1" fill={color}/><rect x="15" y="7" width="3" height="10" rx="1" fill={color}/></>,
    run:       <><circle cx="16" cy="4" r="2" fill={color}/><path d="M8 21l4-8 4 4 2-6" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 13l2-2 4 1" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>,
    settings:  <><circle cx="12" cy="12" r="3" fill="none" stroke={color} strokeWidth="1.8"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>,
    arrow:     <><line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><polyline points="12 5 19 12 12 19" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>,
    plus:      <><line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>,
    minus:     <><line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>,
    close:     <><line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>,
    chevron:   <><polyline points="9 18 15 12 9 6" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>,
    chevronD:  <><polyline points="6 9 12 15 18 9" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>,
    chevronU:  <><polyline points="18 15 12 9 6 15" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>,
    snowflake: <><line x1="12" y1="2" x2="12" y2="22" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><line x1="2" y1="12" x2="22" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><line x1="19.07" y1="4.93" x2="4.93" y2="19.07" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>,
    flame:     <><path d="M12 2c0 0-4 6-4 10a4 4 0 008 0C16 8 12 2 12 2z" fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/></>,
    note:      <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="none" stroke={color} strokeWidth="1.8"/><polyline points="14 2 14 8 20 8" fill="none" stroke={color} strokeWidth="1.8"/><line x1="8" y1="13" x2="16" y2="13" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><line x1="8" y1="17" x2="12" y2="17" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>,
    medal:     <><circle cx="12" cy="14" r="7" fill="none" stroke={color} strokeWidth="1.8"/><path d="M8.21 3.06L7 7h10l-1.21-3.94A1 1 0 0014.83 2H9.17a1 1 0 00-.96.06z" fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/><line x1="12" y1="11" x2="12" y2="17" stroke={color} strokeWidth="1.6" strokeLinecap="round"/></>,
    bag:       <><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/><line x1="3" y1="6" x2="21" y2="6" stroke={color} strokeWidth="1.8"/><path d="M16 10a4 4 0 01-8 0" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>,
    pill:      <><path d="M10.5 20.5L3.5 13.5a5 5 0 017-7l7 7a5 5 0 01-7 7z" fill="none" stroke={color} strokeWidth="1.8"/><line x1="8.5" y1="8.5" x2="15.5" y2="15.5" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>,
    info:      <><circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="1.8"/><line x1="12" y1="8" x2="12" y2="8.01" stroke={color} strokeWidth="2.5" strokeLinecap="round"/><line x1="12" y1="12" x2="12" y2="16" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>,
    target:    <><circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="1.8"/><circle cx="12" cy="12" r="6" fill="none" stroke={color} strokeWidth="1.8"/><circle cx="12" cy="12" r="2" fill={color}/></>,
    pencil:    <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>,
    restore:   <><polyline points="1 4 1 10 7 10" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>,
    warning:   <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke={color} strokeWidth="2.5" strokeLinecap="round"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display:"inline-block", flexShrink:0, ...style }}>
      {paths[name]||paths.info}
    </svg>
  );
};

const TAB_ICON_MAP = { Today:"home", Meals:"meals", Train:"train", Track:"track", Coach:"tip", Profile:"profile" };
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const todayKey = () => new Date().toISOString().split("T")[0];
const fmtDate = d => new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short"});
const DAY_NAMES = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const PACE_OPTIONS = [
  { id:"slow",   label:"Steady",     lbs:0.5, color:C.green,  desc:"0.5 lbs/week — very sustainable, minimal hunger.", warning:null },
  { id:"normal", label:"Moderate",   lbs:1,   color:C.accent, desc:"1 lb/week — the gold standard for sustainable fat loss.", warning:null },
  { id:"fast",   label:"Active",     lbs:1.5, color:C.orange, desc:"1.5 lbs/week — achievable with consistent training.", warning:"⚠️ Requires a strict 750 cal/day deficit. Keep protein at 120g+ to protect muscle." },
  { id:"vfast",  label:"Aggressive", lbs:2,   color:C.red,    desc:"2 lbs/week — maximum recommended rate.", warning:"🚨 Upper safe limit. Risks muscle loss and fatigue. Requires 1000 cal/day deficit. Consult your GP if you have health concerns." },
];
const getPace = id => PACE_OPTIONS.find(p=>p.id===id)||PACE_OPTIONS[1];

const ALLERGENS = ["Gluten","Dairy","Eggs","Nuts","Peanuts","Soya","Shellfish","Fish","Sesame","Celery","Mustard","Sulphites"];
const DISLIKES_LIST = ["Fish","Oily fish","Shellfish","Lamb","Pork","Red meat","Mushrooms","Aubergine","Courgette","Brussels sprouts","Cauliflower","Broccoli","Olives","Avocado","Spicy food","Garlic","Onion","Cottage cheese","Tofu"];

// ── TDEE Calculator ──────────────────────────────────────────────────────────
const calcTDEE = (profile) => {
  if (!profile.heightCm || !profile.startWeightLbs || !profile.age) return null;
  const weightKg = profile.startWeightLbs * 0.453592;
  const heightCm = parseFloat(profile.heightCm);
  const age = parseFloat(profile.age);
  // Mifflin-St Jeor BMR (male default, adjust if profile has sex)
  const bmr = profile.sex === "female"
    ? (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161
    : (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
  const activityMult = { 2:1.375, 3:1.55, 4:1.725, 5:1.9 }[profile.workoutsPerWeek] || 1.55;
  return Math.round(bmr * activityMult);
};

const calcBMI = (profile) => {
  if (!profile.heightCm || !profile.startWeightLbs) return null;
  const weightKg = profile.startWeightLbs * 0.453592;
  const heightM = parseFloat(profile.heightCm) / 100;
  return (weightKg / (heightM * heightM)).toFixed(1);
};

const bmiCategory = bmi => {
  if (bmi < 18.5) return { label:"Underweight", color:C.teal };
  if (bmi < 25)   return { label:"Healthy weight", color:C.green };
  if (bmi < 30)   return { label:"Overweight", color:C.orange };
  return { label:"Obese", color:C.red };
};

// ── All Meals ────────────────────────────────────────────────────────────────
const ALL_MEALS = [
  { id:"m1", tags:["balanced","breakfast","gf","df"], name:"Scrambled Eggs & Roasted Veg", time:"7:30 AM", cals:370, protein:30, carbs:28, fat:14, allergens:[], items:["3 large eggs","Cherry tomatoes (100g)","Spinach (60g)","2 corn tortillas (GF)","Soya milk splash for coffee"], method:"1. Preheat oven to 200°C. Halve tomatoes, toss with olive oil and roast 15 min.\n2. Whisk eggs with a pinch of salt. Heat a non-stick pan on medium-low.\n3. Add eggs, stir slowly — take off heat while slightly wet.\n4. Wilt spinach in the same pan for 30 sec.\n5. Warm tortillas in a dry pan 30 sec each side.\n6. Serve eggs on tortillas with roasted tomatoes and spinach." },
  { id:"m2", tags:["balanced","lunch","gf","df"], name:"Chicken & Quinoa Bowl", time:"1:00 PM", cals:490, protein:44, carbs:42, fat:12, allergens:[], items:["Chicken breast (180g)","Quinoa (70g dry)","Mixed peppers (1)","Courgette (half)","Olive oil, lemon, herbs"], method:"1. Cook quinoa: rinse, simmer in 150ml water 12 min, rest 5 min.\n2. Season chicken with salt, pepper, paprika. Grill 6-7 min each side.\n3. Dice peppers and courgette, roast at 200°C for 20 min.\n4. Dressing: 2 tbsp olive oil, juice of half a lemon, pinch of herbs.\n5. Slice chicken, assemble over quinoa with veg and dressing." },
  { id:"m3", tags:["balanced","dinner","gf","df"], name:"Beef Stir-Fry with Rice", time:"7:00 PM", cals:520, protein:42, carbs:48, fat:14, allergens:["soya"], items:["Sirloin strips (150g)","Brown rice (80g dry)","Broccoli, snap peas, peppers","Tamari sauce (GF)","Fresh ginger, garlic"], method:"1. Cook brown rice: 1 part rice to 2 parts water, cover and simmer 25 min.\n2. Mix 2 tbsp tamari, 1 tsp sesame oil, 1 tsp honey, grated ginger and garlic.\n3. Get a wok very hot. Sear beef strips 2 min.\n4. Remove beef, stir-fry veg 3-4 min.\n5. Return beef, pour over sauce, toss 1 min. Serve over rice." },
  { id:"m4", tags:["balanced","snack","gf","df"], name:"Coconut Yoghurt & Berries", time:"10:30 AM", cals:160, protein:8, carbs:18, fat:6, allergens:[], items:["Coconut yoghurt (200g)","Mixed berries (100g)","Pumpkin seeds (15g)","5g creatine (stir in)"], method:"1. Spoon coconut yoghurt into a bowl.\n2. Top with mixed berries and pumpkin seeds.\n3. Stir in creatine — completely tasteless." },
  { id:"m5", tags:["high-protein","breakfast","gf","df"], name:"Egg White & Sweet Potato Hash", time:"7:00 AM", cals:400, protein:38, carbs:34, fat:8, allergens:[], items:["4 egg whites + 1 whole egg","Sweet potato (200g)","Spinach (60g)","Cherry tomatoes (80g)","Smoked paprika"], method:"1. Dice sweet potato, toss in olive oil and paprika, roast at 200°C for 25 min.\n2. Whisk 4 egg whites + 1 whole egg.\n3. Wilt spinach and tomatoes in a pan, 2 min.\n4. Pour egg mixture over, stir on medium heat until just set.\n5. Serve over crispy sweet potato hash." },
  { id:"m6", tags:["high-protein","lunch","gf","df"], name:"Turkey Mince Bowl", time:"12:30 PM", cals:490, protein:52, carbs:36, fat:10, allergens:[], items:["Turkey mince (200g)","Sweet potato (medium)","Green beans (100g)","Avocado (half)","Cumin, paprika, garlic"], method:"1. Bake sweet potato at 200°C for 45 min.\n2. Brown turkey mince, season with cumin, paprika, garlic, salt and pepper.\n3. Steam green beans 4 min.\n4. Serve mince over sweet potato with beans and sliced avocado." },
  { id:"m7", tags:["high-protein","dinner","gf","df"], name:"Pork Tenderloin & Cauli Mash", time:"7:00 PM", cals:500, protein:48, carbs:22, fat:16, allergens:[], items:["Pork tenderloin (180g)","Cauliflower (half head)","Asparagus (6 spears)","Courgette (1)","Garlic, olive oil, lemon"], method:"1. Season pork with salt, pepper, rosemary. Sear 2 min each side, finish in oven at 180°C for 12 min. Rest 5 min.\n2. Boil cauliflower until tender (10 min), drain, blend with olive oil, garlic and salt.\n3. Griddle asparagus and courgette 10 min.\n4. Plate: mash first, sliced pork on top, veg on the side." },
  { id:"m8", tags:["high-protein","snack","gf"], name:"Rice Cakes & Cottage Cheese", time:"4:00 PM", cals:130, protein:16, carbs:14, fat:2, allergens:["dairy"], items:["3 rice cakes (GF)","Cottage cheese (120g)","Cucumber and cherry tomatoes"], method:"1. Spoon cottage cheese onto rice cakes.\n2. Top with sliced cucumber and halved cherry tomatoes.\n3. Season with black pepper." },
  { id:"m9", tags:["mediterranean","breakfast","gf","df"], name:"Avocado Poached Eggs", time:"8:00 AM", cals:360, protein:24, carbs:20, fat:22, allergens:[], items:["2 eggs","Avocado (1)","GF toast or corn cakes","Handful of olives","Lemon, chilli flakes"], method:"1. Bring water to gentle simmer, add splash of vinegar.\n2. Crack eggs into cups, slide into swirling water. Cook 3 min.\n3. Mash avocado with lemon juice, salt, chilli flakes.\n4. Spread avocado on toast, top with poached eggs and olives." },
  { id:"m10", tags:["mediterranean","lunch","gf","df"], name:"Greek Chicken Salad", time:"1:00 PM", cals:510, protein:44, carbs:24, fat:18, allergens:[], items:["Chicken breast (180g)","Mixed leaves (80g)","Cucumber, olives, red onion","Chickpeas (100g)","Dairy-free feta (30g)"], method:"1. Season chicken with oregano, lemon zest, salt. Grill 6-7 min each side.\n2. Slice cucumber, thinly slice red onion, halve olives.\n3. Dressing: 3 tbsp olive oil, juice of 1 lemon, 1 tsp oregano.\n4. Assemble salad, slice chicken on top, crumble feta, drizzle dressing." },
  { id:"m11", tags:["mediterranean","dinner","gf","df"], name:"Lamb Koftas & Cauliflower Rice", time:"7:00 PM", cals:530, protein:44, carbs:20, fat:24, allergens:[], items:["Lamb mince (150g)","Cauliflower (half head)","Coconut yoghurt, cucumber, mint","Cumin, coriander, garlic"], method:"1. Mix lamb with cumin, coriander, garlic powder, salt. Shape into koftas.\n2. Grill 8-10 min turning regularly.\n3. Blitz cauliflower to rice-sized pieces, stir-fry in dry pan 5 min.\n4. Tzatziki: grated cucumber, coconut yoghurt, mint, garlic, lemon.\n5. Serve koftas over cauliflower rice with tzatziki." },
  { id:"m12", tags:["mediterranean","snack","gf","df"], name:"Hummus & Crudités", time:"4:30 PM", cals:180, protein:10, carbs:16, fat:8, allergens:["sesame"], items:["Hummus (4 tbsp)","Carrot, celery, cucumber","Rice crackers (GF)","Mixed nuts (20g)"], method:"1. Slice carrots, celery into sticks, cucumber into rounds.\n2. Arrange veg and crackers around hummus.\n3. Scatter nuts on the side." },
  { id:"m13", tags:["budget","breakfast","gf","df"], name:"Egg Fried Rice", time:"7:30 AM", cals:340, protein:26, carbs:44, fat:8, allergens:["soya"], items:["3 eggs","Leftover brown rice (150g cooked)","Frozen peas and sweetcorn (80g)","Tamari sauce (GF)","Spring onion"], method:"1. Use day-old cold rice.\n2. Beat eggs. Get a wok very hot with a little oil.\n3. Stir-fry rice 2 min, push to edges, pour eggs into centre, scramble then mix.\n4. Add frozen veg, 2 min. Splash of tamari, top with spring onion." },
  { id:"m14", tags:["budget","lunch","gf","df"], name:"Roast Chicken Thighs & Sweet Potato", time:"1:00 PM", cals:490, protein:46, carbs:38, fat:14, allergens:[], items:["Chicken thighs x2 skin-off","Sweet potato (large)","Frozen broccoli (150g)","GF stock cube","Olive oil, garlic, herbs"], method:"1. Rub chicken with olive oil, garlic, herbs. Roast at 200°C for 35-40 min.\n2. Cut sweet potato into wedges, roast alongside for 30 min.\n3. Steam broccoli from frozen 5 min.\n4. Gravy: dissolve stock cube in 150ml hot water." },
  { id:"m15", tags:["budget","dinner","gf","df"], name:"Beef & Bean Chilli", time:"7:00 PM", cals:560, protein:46, carbs:52, fat:12, allergens:[], items:["Beef mince 5% fat (150g)","Kidney beans (tin)","Chopped tomatoes (tin)","Brown rice (80g dry)","Cumin, paprika, chilli, garlic"], method:"1. Cook rice: simmer covered 25 min.\n2. Brown mince on high heat.\n3. Add cumin, paprika, chilli, garlic. Stir 1 min.\n4. Add tomatoes and kidney beans. Simmer 20 min.\n5. Season, serve over rice." },
  { id:"m16", tags:["budget","snack","gf","df"], name:"Banana & Almond Butter", time:"10:30 AM", cals:200, protein:6, carbs:28, fat:8, allergens:["nuts"], items:["1 banana","Almond butter (2 tbsp)","5g creatine in water"], method:"1. Peel and slice banana.\n2. Serve with almond butter for dipping.\n3. Take creatine in a small glass of water." },
  { id:"m17", tags:["balanced","snack","gf","df"], name:"Plant Protein Shake", time:"4:00 PM", cals:180, protein:25, carbs:18, fat:3, allergens:["soya"], items:["Pea/soya protein (1 scoop)","Soya milk (200ml)","1 banana","Ice cubes"], method:"1. Add soya milk to blender.\n2. Add protein powder, banana and ice.\n3. Blend 30 seconds until smooth." },
  { id:"m18", tags:["high-protein","dinner","gf","df"], name:"Lemon Herb Chicken & Rice", time:"7:00 PM", cals:510, protein:46, carbs:44, fat:10, allergens:[], items:["Chicken breast (180g)","Brown rice (80g dry)","Courgette and cherry tomatoes","Olive oil, lemon, garlic, oregano"], method:"1. Marinate chicken in olive oil, lemon, garlic, oregano.\n2. Cook rice (25 min).\n3. Bake chicken at 190°C for 25-30 min.\n4. Roast courgette and tomatoes at 200°C for 15 min.\n5. Serve with extra squeeze of lemon." },
  { id:"m19", tags:["balanced","breakfast","gf","df"], name:"Chia Pudding", time:"7:30 AM", cals:310, protein:18, carbs:26, fat:14, allergens:["nuts"], items:["Chia seeds (4 tbsp)","Soya milk (250ml)","Mixed berries (100g)","Almond butter (1 tbsp)","Pumpkin seeds"], method:"1. Night before: mix chia seeds and soya milk in a jar, refrigerate overnight.\n2. Morning: stir well — should be thick and pudding-like.\n3. Top with berries, almond butter drizzle, pumpkin seeds." },
  { id:"m20", tags:["mediterranean","dinner","gf","df"], name:"Spiced Lamb & Quinoa", time:"7:00 PM", cals:530, protein:44, carbs:38, fat:18, allergens:[], items:["Lamb leg steak (180g)","Quinoa (70g dry)","Spinach (80g)","Cherry tomatoes (100g)","Cumin, coriander, lemon"], method:"1. Cook quinoa: rinse, simmer 12 min, rest 5 min.\n2. Rub lamb with cumin, coriander, olive oil. Grill 3-4 min each side.\n3. Rest lamb 3 min then slice.\n4. Wilt spinach in pan juices, 1 min.\n5. Serve sliced lamb over quinoa with spinach, tomatoes and lemon." },
];

const WORKOUTS = {
  "full-body":   { title:"Full Body Strength & Cardio", duration:55, color:"#007aff", warmup:["5 min easy row","Arm circles x10","Hip circles x10","Slow squats x10"], exercises:[{name:"Seated Cable Row",sets:3,reps:"12–15",rest:"60 sec",equipment:"Cable machine",tip:"Drive elbows back, squeeze shoulder blades."},{name:"Goblet Squat",sets:3,reps:"12",rest:"60 sec",equipment:"Dumbbell",tip:"Sit back into heels. Supportive on knees."},{name:"Dumbbell Chest Press",sets:3,reps:"10–12",rest:"60 sec",equipment:"Dumbbells + bench",tip:"Lower slowly over 3 seconds."},{name:"Cross Trainer Intervals",sets:1,reps:"12 min",rest:"—",equipment:"Cross trainer",tip:"2 min moderate, 1 min push — repeat 4 times."},{name:"Lat Pulldown",sets:3,reps:"12",rest:"60 sec",equipment:"Cable machine",tip:"Pull to upper chest, lean back slightly."},{name:"Seated Shoulder Press",sets:3,reps:"10–12",rest:"60 sec",equipment:"Dumbbells",tip:"Seated removes lower back strain."}], cooldown:["5 min easy cross trainer","Hamstring stretch x30 sec each","Cat-cow x10","Chest stretch x30 sec"], note:"Hits push, pull, legs and cardio in under an hour." },
  "upper-body":  { title:"Upper Body Strength", duration:50, color:"#af52de", warmup:["5 min cross trainer","Arm circles x15","Wall slides x10"], exercises:[{name:"Dumbbell Bench Press",sets:4,reps:"10",rest:"75 sec",equipment:"Dumbbells + bench",tip:"Last 2 reps should be hard."},{name:"Single-Arm Dumbbell Row",sets:3,reps:"12 each",rest:"60 sec",equipment:"Dumbbell + bench",tip:"Support on bench removes back pressure."},{name:"Seated Overhead Press",sets:3,reps:"10–12",rest:"60 sec",equipment:"Dumbbells",tip:"Seated protects the back."},{name:"Face Pulls",sets:3,reps:"15",rest:"45 sec",equipment:"Cable machine",tip:"Elbows high and wide. Essential for shoulder health."},{name:"Bicep Curls",sets:3,reps:"12",rest:"45 sec",equipment:"Dumbbells",tip:"Elbows pinned. Slow is better."},{name:"Tricep Rope Pushdown",sets:3,reps:"12–15",rest:"45 sec",equipment:"Cable machine",tip:"Flare rope at the bottom."}], cooldown:["Shoulder stretch x30 sec each","Chest stretch x30 sec","Neck rolls x5"], note:"Upper body days produce the most visible change." },
  "lower-body":  { title:"Lower Body & Core", duration:50, color:"#34c759", warmup:["5 min easy row","Clamshells x15 each","Glute bridges x15","Ankle circles x10"], exercises:[{name:"Leg Press",sets:4,reps:"12–15",rest:"75 sec",equipment:"Leg press machine",tip:"Feet high reduces knee stress."},{name:"Romanian Deadlift",sets:3,reps:"10–12",rest:"75 sec",equipment:"Dumbbells",tip:"Hinge at hips, soft knee, flat back."},{name:"Seated Leg Curl",sets:3,reps:"12–15",rest:"60 sec",equipment:"Machine",tip:"Curl slowly, control the return."},{name:"Standing Calf Raise",sets:3,reps:"15–20",rest:"45 sec",equipment:"Bodyweight/dumbbells",tip:"Pause at the top."},{name:"Dead Bug",sets:3,reps:"10 each side",rest:"45 sec",equipment:"Bodyweight",tip:"Press lower back to floor. Brilliant core work."},{name:"Weighted Glute Bridge",sets:3,reps:"15",rest:"45 sec",equipment:"Barbell/dumbbell",tip:"Hard squeeze at top protects lower back."}], cooldown:["Figure-4 stretch x40 sec each","Hamstring stretch x30 sec each","Child's pose x30 sec"], note:"Strong legs and glutes are your best defence against back pain." },
  "cardio":      { title:"Low-Impact Cardio Burn", duration:45, color:"#ff9500", warmup:["3 min easy row","Hip swings x10","Arm swings x10"], exercises:[{name:"Rowing — Steady State",sets:1,reps:"15 min",rest:"2 min",equipment:"Rowing machine",tip:"22–24 strokes/min. Just hold a conversation."},{name:"Cross Trainer Intervals",sets:1,reps:"15 min",rest:"2 min",equipment:"Cross trainer",tip:"2 min easy / 1 min harder x5."},{name:"Rowing — Push Finish",sets:1,reps:"10 min",rest:"—",equipment:"Rowing machine",tip:"Push above comfort for final 5 min."}], cooldown:["5 min easy cross trainer","Full body stretch","Breathing: 4 in, 6 out x8"], note:"Burns 350–450 calories with zero joint impact." },
  "strength":    { title:"Progressive Strength", duration:60, color:"#ff2d55", warmup:["5 min easy row","Shoulder rotations x10","Squats x10","Hip hinges x10"], exercises:[{name:"Dumbbell Bench Press — Heavy",sets:4,reps:"6–8",rest:"90 sec",equipment:"Dumbbells + bench",tip:"Lower over 3 seconds. Elevates metabolism 24–48 hrs."},{name:"Lat Pulldown — Heavy",sets:4,reps:"6–8",rest:"90 sec",equipment:"Cable machine",tip:"Struggle on rep 7–8."},{name:"Leg Press — Heavy",sets:4,reps:"8–10",rest:"90 sec",equipment:"Leg press machine",tip:"Heavy leg pressing burns enormously."},{name:"Seated Cable Row — Heavy",sets:3,reps:"8",rest:"75 sec",equipment:"Cable machine",tip:"Hold contracted position 1 second."},{name:"Seated Overhead Press — Heavy",sets:3,reps:"8–10",rest:"75 sec",equipment:"Dumbbells",tip:"Seated keeps spine safe."}], cooldown:["10 min easy cross trainer","Full stretch","Foam roller on back and glutes"], note:"Muscle burns calories at rest 24 hours a day. Don't fear heavy weights." },
};

const SHOPPING = {
  3:{ cost:"~£35–45", cats:[{name:"🥩 Meat & Protein",items:[{i:"Chicken breast",q:"600g",n:""},{i:"Lean beef mince 5%",q:"400g",n:""},{i:"Free range eggs",q:"12",n:""},{i:"Plant protein powder",q:"check",n:"pea/soya GF"}]},{name:"🥛 Dairy-Free",items:[{i:"Soya milk (unsweetened)",q:"1 litre",n:""},{i:"Coconut yoghurt",q:"400g",n:""}]},{name:"🥦 Vegetables",items:[{i:"Broccoli",q:"1 head",n:""},{i:"Spinach",q:"200g",n:""},{i:"Mixed peppers",q:"3",n:""},{i:"Cherry tomatoes",q:"250g",n:""},{i:"Sweet potatoes",q:"3",n:""}]},{name:"🍚 Carbs (GF)",items:[{i:"Brown rice",q:"500g",n:""},{i:"Quinoa",q:"500g",n:""},{i:"Corn tortillas",q:"1 pack",n:"GF"},{i:"Rice cakes",q:"1 pack",n:""}]},{name:"🫙 Cupboard",items:[{i:"Chopped tomatoes",q:"2 tins",n:""},{i:"Kidney beans",q:"1 tin",n:""},{i:"Tamari sauce",q:"1 bottle",n:"GF soy"},{i:"Olive oil",q:"check",n:""}]},{name:"💊 Supplements",items:[{i:"Creatine monohydrate",q:"check",n:"5g/day"},{i:"Vitamin D3+K2",q:"check",n:""},{i:"Algae omega-3",q:"check",n:""}]}], tip:"Tamari = GF soy sauce. Quinoa is a complete protein. Coconut yoghurt is perfect for creatine." },
  5:{ cost:"~£55–70", cats:[{name:"🥩 Meat & Protein",items:[{i:"Chicken breast",q:"1kg",n:""},{i:"Turkey mince",q:"400g",n:""},{i:"Lean beef mince 5%",q:"500g",n:""},{i:"Free range eggs",q:"18",n:""},{i:"Plant protein powder",q:"check",n:""}]},{name:"🥛 Dairy-Free",items:[{i:"Soya milk",q:"2 litres",n:""},{i:"Coconut yoghurt",q:"500g",n:""},{i:"Dairy-free feta",q:"150g",n:""}]},{name:"🥦 Vegetables",items:[{i:"Broccoli",q:"2 heads",n:""},{i:"Spinach",q:"400g",n:""},{i:"Mixed peppers",q:"6",n:""},{i:"Courgettes",q:"3",n:""},{i:"Asparagus",q:"1 bunch",n:""},{i:"Frozen mixed veg",q:"1kg",n:""}]},{name:"🍚 Carbs (GF)",items:[{i:"Brown rice",q:"1kg",n:""},{i:"Quinoa",q:"500g",n:""},{i:"Sweet potatoes",q:"5",n:""},{i:"Rice crackers",q:"2 packs",n:""},{i:"Corn tortillas",q:"2 packs",n:""}]},{name:"🫙 Cupboard",items:[{i:"Chopped tomatoes",q:"3 tins",n:""},{i:"Kidney beans",q:"2 tins",n:""},{i:"Chickpeas",q:"2 tins",n:""},{i:"Tamari",q:"1 bottle",n:""},{i:"Olive oil",q:"500ml",n:""},{i:"Almond butter",q:"1 jar",n:""}]},{name:"🥜 Snacks",items:[{i:"Mixed nuts",q:"200g",n:""},{i:"Hummus",q:"200g",n:""},{i:"Bananas",q:"5",n:""}]},{name:"💊 Supplements",items:[{i:"Creatine monohydrate",q:"check",n:"5g/day"},{i:"Vitamin D3+K2",q:"check",n:""},{i:"Algae omega-3",q:"check",n:""},{i:"Magnesium glycinate",q:"check",n:"before bed"}]}], tip:"Batch cook rice and quinoa on day 1 — keeps 4 days in the fridge." },
  7:{ cost:"~£75–95", cats:[{name:"🥩 Meat & Protein",items:[{i:"Chicken breast",q:"1.5kg",n:""},{i:"Lean beef mince 5%",q:"750g",n:""},{i:"Turkey mince",q:"500g",n:""},{i:"Lamb mince",q:"400g",n:"koftas"},{i:"Free range eggs",q:"24",n:""},{i:"Plant protein powder",q:"1kg bag",n:""}]},{name:"🥛 Dairy-Free",items:[{i:"Soya milk",q:"3 litres",n:""},{i:"Coconut yoghurt",q:"1kg",n:""},{i:"Dairy-free feta",q:"200g",n:""}]},{name:"🥦 Vegetables",items:[{i:"Broccoli",q:"3 heads",n:""},{i:"Spinach",q:"600g",n:""},{i:"Mixed peppers",q:"8",n:""},{i:"Courgettes",q:"4",n:""},{i:"Cauliflower",q:"2 heads",n:""},{i:"Asparagus",q:"2 bunches",n:""},{i:"Avocados",q:"4",n:""},{i:"Frozen mixed veg",q:"2kg",n:""}]},{name:"🍚 Carbs (GF)",items:[{i:"Brown rice",q:"2kg",n:""},{i:"Quinoa",q:"1kg",n:""},{i:"Sweet potatoes",q:"7",n:""},{i:"Rice cakes",q:"3 packs",n:""},{i:"Corn tortillas",q:"2 packs",n:""},{i:"GF pasta",q:"500g",n:"rice-based"}]},{name:"🫙 Cupboard",items:[{i:"Chopped tomatoes",q:"5 tins",n:""},{i:"Kidney beans",q:"3 tins",n:""},{i:"Chickpeas",q:"3 tins",n:""},{i:"Tamari",q:"2 bottles",n:""},{i:"Olive oil",q:"500ml",n:""},{i:"Cumin, paprika, oregano",q:"check",n:""}]},{name:"🥜 Snacks",items:[{i:"Mixed nuts",q:"400g",n:""},{i:"Hummus",q:"400g",n:""},{i:"Bananas",q:"7",n:""},{i:"Blueberries",q:"400g",n:""},{i:"Almond butter",q:"1 jar",n:""}]},{name:"💊 Supplements",items:[{i:"Creatine monohydrate",q:"250g tub",n:"5g/day"},{i:"Vitamin D3+K2",q:"90 caps",n:""},{i:"Algae omega-3",q:"60 caps",n:""},{i:"Magnesium glycinate",q:"check",n:"before bed"}]}], tip:"Batch cook a big chilli on Sunday — freezes perfectly into 4+ meals." },
};

const SUPPS = [
  { name:"Creatine Monohydrate", dose:"5g daily", timing:"Any time", color:"#007aff", icon:"⚡", why:"Preserves muscle during weight loss — critical at 53. Tasteless — stir into coconut yoghurt.", note:"5g/day, no loading phase. Expect 1–2 lbs water weight in muscles initially." },
  { name:"Pea / Soya Protein", dose:"25–40g per serving", timing:"Post-workout or between meals", color:"#34c759", icon:"💪", why:"Plant protein is dairy-free, GF, and near-identical to whey for muscle retention.", note:"Look for 20–25g protein per scoop, under 5g sugar." },
  { name:"Vitamin D3 + K2", dose:"2000–4000 IU D3, 100mcg K2", timing:"With a fatty meal", color:"#ff9500", icon:"☀️", why:"Most over-50s in the UK are deficient. Supports muscle, mood and bone density.", note:"Buy as a combined D3+K2 capsule. Ask GP to test your levels." },
  { name:"Algae Omega-3", dose:"2–3g EPA+DHA daily", timing:"With meals", color:"#af52de", icon:"🧠", why:"Reduces inflammation — great for back and knees. Zero fishy taste.", note:"Algae-based = same source as fish oil. Vegan and GF." },
  { name:"Magnesium Glycinate", dose:"300–400mg", timing:"Before bed", color:"#5ac8fa", icon:"🌙", why:"Supports sleep quality, muscle recovery, regulates cortisol.", note:"Glycinate form is best absorbed. Most notice deeper sleep within a week." },
  { name:"Caffeine (optional)", dose:"100–200mg", timing:"30 min before cardio", color:"#ff9f0a", icon:"☕", why:"Boosts fat burning during cardio, reduces perceived effort.", note:"A strong black coffee works perfectly. Avoid after 2pm." },
];

const DAILY_TIPS = [
  "Start with a large glass of water before breakfast — hydration alone can reduce hunger by up to 20%.",
  "Focus on protein at every meal. At 53 your body needs more than ever to hold onto muscle while losing fat.",
  "Spend 5 minutes on gentle hip and thoracic mobility before your next workout — it makes every exercise more comfortable.",
  "Don't skip rest days — they're when fat loss actually happens. Your body repairs hormones during recovery.",
  "If you feel like snacking, try a 10-minute walk first. Cravings peak and pass within 15 minutes.",
  "Sleep is your secret weapon. Poor sleep raises ghrelin (hunger hormone) and lowers willpower.",
  "Creatine works best taken every day, even rest days. Stir into coconut yoghurt — completely tasteless.",
  "Try eating your largest meal at lunch. Insulin sensitivity is higher earlier in the day.",
  "On the rowing machine: 60% legs, 20% core, 20% arms. Lead with legs — protects your back.",
  "Track your waist measurement as well as weight. Creatine can add water weight, so the scale can mislead.",
  "Add leafy greens to two meals today — almost calorie-free and they bulk out meals to keep you full.",
  "On the cross trainer, stand upright and don't lean on the handles — engages your core and burns more.",
];

// ── Primitives ────────────────────────────────────────────────────────────────
const Card = ({ children, style={}, onClick }) => (
  <div onClick={onClick} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:16, marginBottom:12, cursor:onClick?"pointer":"default", boxShadow:"0 1px 3px rgba(0,0,0,0.06)", transition:"transform 0.15s", ...style }}
    onMouseEnter={e=>onClick&&(e.currentTarget.style.transform="scale(0.99)")}
    onMouseLeave={e=>onClick&&(e.currentTarget.style.transform="scale(1)")}
  >{children}</div>
);

const Section = ({ title, children }) => (
  <div style={{ marginBottom:20 }}>
    {title&&<p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:8, paddingLeft:4 }}>{title}</p>}
    <div style={{ background:C.card, borderRadius:16, overflow:"hidden", border:`1px solid ${C.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>{children}</div>
  </div>
);

const Row = ({ label, value, color, last=false, onClick, icon, sub }) => (
  <div onClick={onClick} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"13px 16px", borderBottom:last?"none":`1px solid ${C.border}`, cursor:onClick?"pointer":"default" }}>
    <div>
      {icon&&<span style={{ marginRight:8 }}>{icon}</span>}
      <span style={{ color:C.text, fontSize:15 }}>{label}</span>
      {sub&&<div style={{ color:C.muted, fontSize:12, marginTop:1 }}>{sub}</div>}
    </div>
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      {value&&<span style={{ color:color||C.muted, fontSize:15 }}>{value}</span>}
      {onClick&&<span style={{ color:C.muted }}>›</span>}
    </div>
  </div>
);

const Btn = ({ children, onClick, color=C.accent, style={}, disabled, small, outline }) => (
  <button onClick={onClick} disabled={disabled} style={{ background:outline?"transparent":color, color:outline?color:"#fff", border:outline?`1.5px solid ${color}`:"none", borderRadius:12, padding:small?"8px 16px":"12px 22px", fontFamily:FONT, fontWeight:600, fontSize:small?13:15, cursor:disabled?"not-allowed":"pointer", opacity:disabled?0.4:1, transition:"all 0.15s", boxShadow:outline?"none":`0 2px 8px ${color}44`, ...style }}>{children}</button>
);

const Chip = ({ children, color=C.accent, active, onClick }) => (
  <span onClick={onClick} style={{ background:active?color:`${color}15`, color:active?"#fff":color, border:`1px solid ${color}33`, borderRadius:99, padding:"6px 14px", fontSize:13, fontWeight:600, cursor:onClick?"pointer":"default", transition:"all 0.2s", display:"inline-block" }}>{children}</span>
);

const Toggle = ({ value, onChange }) => (
  <div onClick={()=>onChange(!value)} style={{ width:51, height:31, borderRadius:99, background:value?C.accent:"#e5e5ea", cursor:"pointer", position:"relative", transition:"background 0.2s", flexShrink:0 }}>
    <div style={{ position:"absolute", top:2, left:value?22:2, width:27, height:27, borderRadius:99, background:"#fff", boxShadow:"0 2px 4px rgba(0,0,0,0.2)", transition:"left 0.2s" }} />
  </div>
);

const TInput = ({ value, onChange, placeholder, type="text", style={} }) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{ background:C.sectionBg, border:`1px solid ${C.border}`, borderRadius:10, color:C.text, padding:"12px 14px", fontSize:15, fontFamily:FONT, outline:"none", width:"100%", ...style }} />
);

const StatBox = ({ label, val, color, sub }) => (
  <div style={{ flex:1, background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 10px", textAlign:"center", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
    <div style={{ color, fontSize:19, fontWeight:700 }}>{val}</div>
    {sub&&<div style={{ color:C.muted, fontSize:11, marginTop:1 }}>{sub}</div>}
    <div style={{ color:C.muted, fontSize:10, marginTop:3, textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</div>
  </div>
);

const ProgressBar = ({ value, max, color=C.accent, height=8 }) => (
  <div style={{ background:C.sectionBg, borderRadius:99, height, overflow:"hidden" }}>
    <div style={{ width:`${Math.min(100,(value/max)*100)}%`, height:"100%", background:color, borderRadius:99, transition:"width 0.4s" }} />
  </div>
);

// ── PacePicker ────────────────────────────────────────────────────────────────
const PacePicker = ({ value, onChange, targetLbs }) => {
  const selected = getPace(value);
  const etaWeeks = Math.ceil(targetLbs/selected.lbs);
  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
        {PACE_OPTIONS.map(p=>(
          <div key={p.id} onClick={()=>onChange(p.id)} style={{ flex:"1 1 calc(50% - 4px)", background:value===p.id?`${p.color}15`:C.card, border:`2px solid ${value===p.id?p.color:C.border}`, borderRadius:12, padding:"10px 12px", cursor:"pointer", transition:"all 0.2s" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
              <span style={{ color:value===p.id?p.color:C.text, fontWeight:700, fontSize:14 }}>{p.label}</span>
              <span style={{ color:p.color, fontSize:12, fontWeight:700 }}>{p.lbs} lb/wk</span>
            </div>
            <div style={{ color:C.muted, fontSize:11 }}>{p.lbs===1?14:Math.round(targetLbs/p.lbs)} wks / {targetLbs/14} stone</div>
          </div>
        ))}
      </div>
      <div style={{ background:`${selected.color}10`, border:`1px solid ${selected.color}33`, borderRadius:12, padding:"12px 14px", marginBottom:selected.warning?10:0 }}>
        <p style={{ color:C.text, fontSize:14, margin:0 }}>📅 <strong style={{ color:selected.color }}>{etaWeeks} weeks</strong> to reach your goal</p>
        <p style={{ color:C.muted, fontSize:12, margin:"4px 0 0" }}>{selected.desc}</p>
      </div>
      {selected.warning&&<div style={{ background:"#ff3b3010", border:"1px solid #ff3b3033", borderRadius:12, padding:"10px 14px" }}><p style={{ color:C.red, fontSize:13, margin:0, lineHeight:1.6 }}>{selected.warning}</p></div>}
    </div>
  );
};

// ── Onboarding ────────────────────────────────────────────────────────────────
const Onboarding = ({ onDone }) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ name:"", goal:"lose_weight", targetLbs:14, startWeight:"", unit:"lbs", allergies:[], dislikes:[], workoutsPerWeek:3, paceId:"normal", heightCm:"", age:"53", sex:"male", darkMode:false });
  const update = (k,v) => setData(d=>({...d,[k]:v}));
  const toggleArr = (k,v) => setData(d=>({...d,[k]:d[k].includes(v)?d[k].filter(x=>x!==v):[...d[k],v]}));

  const startWeightLbs = () => {
    let sw = parseFloat(data.startWeight);
    if (!sw) return null;
    if (data.unit==="kg") sw*=2.20462;
    if (data.unit==="stone") sw*=14;
    return sw;
  };

  const finish = () => {
    const sw = startWeightLbs();
    if (!sw) return;
    onDone({...data, startWeightLbs:parseFloat(sw.toFixed(1))});
  };

  const pct = Math.round((step/5)*100);

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:FONT, paddingBottom:40 }}>
      <div style={{ height:4, background:C.border }}><div style={{ height:"100%", width:`${pct}%`, background:C.accent, transition:"width 0.4s", borderRadius:"0 2px 2px 0" }} /></div>
      <div style={{ maxWidth:420, margin:"0 auto", padding:"32px 20px 0" }}>

        {step===0&&<div style={{ textAlign:"center", paddingTop:40 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, justifyContent:"center" }}>
          <img src="/leanplan_app_icon.png" alt="" style={{ height:64, width:64, objectFit:"contain", borderRadius:16 }} />
          <span style={{ fontSize:36, fontWeight:800, letterSpacing:"-0.02em", fontFamily:FONT }}>
            <span style={{ color:C.text }}>Lean</span><span style={{ color:C.accent }}>Plan</span>
          </span>
        </div>
          <h1 style={{ fontSize:32, fontWeight:700, color:C.text, margin:"0 0 12px" }}>Welcome to LeanPlan</h1>
          <p style={{ color:C.muted, fontSize:16, lineHeight:1.6, marginBottom:32 }}>Let's set up your personal health plan. About 2 minutes — we'll tailor everything to you.</p>
          <div style={{ marginBottom:20 }}><TInput value={data.name} onChange={e=>update("name",e.target.value)} placeholder="Your name (optional)" /></div>
          <Btn onClick={()=>setStep(1)} style={{ width:"100%" }}>Get Started →</Btn>
        </div>}

        {step===1&&<div>
          <h2 style={{ fontSize:26, fontWeight:700, color:C.text, marginBottom:8 }}>What's your main goal?</h2>
          <p style={{ color:C.muted, fontSize:15, marginBottom:24 }}>We'll tailor your meals and workouts to this.</p>
          {[["lose_weight","🎯","Lose weight","Reduce body fat through diet and exercise"],["build_muscle","💪","Build muscle","Gain strength while staying lean"],["get_fitter","🏃","Get fitter","Improve cardio and general fitness"],["all","⭐","All of the above","Lose fat, build muscle, get fitter"]].map(([val,ico,title,desc])=>(
            <Card key={val} onClick={()=>update("goal",val)} style={{ borderColor:data.goal===val?C.accent:C.border, borderWidth:data.goal===val?2:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <span style={{ fontSize:28 }}>{ico}</span>
                <div><p style={{ color:C.text, fontWeight:600, fontSize:16, margin:0 }}>{title}</p><p style={{ color:C.muted, fontSize:13, margin:"2px 0 0" }}>{desc}</p></div>
                {data.goal===val&&<span style={{ marginLeft:"auto", color:C.accent, fontSize:20 }}>✓</span>}
              </div>
            </Card>
          ))}
          <Btn onClick={()=>setStep(2)} style={{ width:"100%", marginTop:8 }}>Next →</Btn>
        </div>}

        {step===2&&<div>
          <h2 style={{ fontSize:26, fontWeight:700, color:C.text, marginBottom:8 }}>Your details</h2>
          <p style={{ color:C.muted, fontSize:15, marginBottom:20 }}>Used to calculate your personalised calorie target (TDEE).</p>
          <div style={{ marginBottom:14 }}>
            <p style={{ color:C.muted, fontSize:13, marginBottom:6 }}>Starting weight</p>
            <div style={{ display:"flex", gap:8 }}>
              <TInput value={data.startWeight} onChange={e=>update("startWeight",e.target.value)} placeholder="Weight" type="number" style={{ flex:1 }} />
              <select value={data.unit} onChange={e=>update("unit",e.target.value)} style={{ background:C.sectionBg, border:`1px solid ${C.border}`, borderRadius:10, color:C.text, padding:"12px 10px", fontFamily:FONT, fontSize:15, cursor:"pointer", outline:"none" }}>
                <option value="lbs">lbs</option><option value="kg">kg</option><option value="stone">stone</option>
              </select>
            </div>
          </div>
          <div style={{ display:"flex", gap:10, marginBottom:14 }}>
            <div style={{ flex:1 }}><p style={{ color:C.muted, fontSize:13, marginBottom:6 }}>Height (cm)</p><TInput value={data.heightCm} onChange={e=>update("heightCm",e.target.value)} placeholder="e.g. 178" type="number" /></div>
            <div style={{ flex:1 }}><p style={{ color:C.muted, fontSize:13, marginBottom:6 }}>Age</p><TInput value={data.age} onChange={e=>update("age",e.target.value)} placeholder="e.g. 53" type="number" /></div>
          </div>
          <div style={{ marginBottom:14 }}>
            <p style={{ color:C.muted, fontSize:13, marginBottom:6 }}>Biological sex (for calorie calculation)</p>
            <div style={{ display:"flex", gap:8 }}>
              {[["male","Male"],["female","Female"]].map(([v,l])=><Chip key={v} color={C.accent} active={data.sex===v} onClick={()=>update("sex",v)}>{l}</Chip>)}
            </div>
          </div>
          <div style={{ marginBottom:14 }}>
            <p style={{ color:C.muted, fontSize:13, marginBottom:6 }}>Weight loss target</p>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {[7,14,21,28].map(lbs=><Chip key={lbs} color={C.accent} active={data.targetLbs===lbs} onClick={()=>update("targetLbs",lbs)}>{lbs/14} stone ({lbs} lbs)</Chip>)}
            </div>
          </div>
          <div style={{ marginBottom:14 }}>
            <p style={{ color:C.muted, fontSize:13, marginBottom:6 }}>Workouts per week</p>
            <div style={{ display:"flex", gap:8 }}>
              {[2,3,4,5].map(n=><Chip key={n} color={C.purple} active={data.workoutsPerWeek===n} onClick={()=>update("workoutsPerWeek",n)}>{n}x</Chip>)}
            </div>
          </div>
          <div style={{ marginBottom:20 }}>
            <p style={{ color:C.muted, fontSize:13, marginBottom:8 }}>How fast do you want to lose weight?</p>
            <PacePicker value={data.paceId} onChange={v=>update("paceId",v)} targetLbs={data.targetLbs} />
          </div>
          <Btn onClick={()=>setStep(3)} disabled={!data.startWeight} style={{ width:"100%" }}>Next →</Btn>
        </div>}

        {step===3&&<div>
          <h2 style={{ fontSize:26, fontWeight:700, color:C.text, marginBottom:8 }}>Allergies & intolerances</h2>
          <p style={{ color:C.muted, fontSize:15, marginBottom:20 }}>These will be excluded from all meal plans.</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20 }}>
            {ALLERGENS.map(a=><Chip key={a} color={C.red} active={data.allergies.includes(a)} onClick={()=>toggleArr("allergies",a)}>{a}</Chip>)}
          </div>
          <p style={{ color:C.muted, fontSize:13, marginBottom:16 }}>Fish, oats and cow's milk are always excluded by default.</p>
          <Btn onClick={()=>setStep(4)} style={{ width:"100%" }}>Next →</Btn>
        </div>}

        {step===4&&<div>
          <h2 style={{ fontSize:26, fontWeight:700, color:C.text, marginBottom:8 }}>Foods you dislike</h2>
          <p style={{ color:C.muted, fontSize:15, marginBottom:20 }}>These won't appear in your meal suggestions.</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:20 }}>
            {DISLIKES_LIST.map(d=><Chip key={d} color={C.orange} active={data.dislikes.includes(d)} onClick={()=>toggleArr("dislikes",d)}>{d}</Chip>)}
          </div>
          <Btn onClick={()=>setStep(5)} style={{ width:"100%" }}>Next →</Btn>
        </div>}

        {step===5&&<div style={{ textAlign:"center", paddingTop:40 }}>
          <div style={{ marginBottom:16, display:"flex", justifyContent:"center" }}><div style={{ width:80, height:80, borderRadius:99, background:`${C.green}18`, border:`2px solid ${C.green}44`, display:"flex", alignItems:"center", justifyContent:"center" }}><Icon name="check" size={40} color={C.green} /></div></div>
          <h2 style={{ fontSize:28, fontWeight:700, color:C.text, marginBottom:12 }}>All set{data.name?`, ${data.name}`:""}!</h2>
          <p style={{ color:C.muted, fontSize:15, lineHeight:1.6, marginBottom:28 }}>Your plan is ready — fully personalised to you.</p>
          <Card style={{ textAlign:"left", marginBottom:24 }}>
            {[["🎯","Goal",data.goal.replace("_"," ")],["⚖️","Target",`Lose ${data.targetLbs} lbs`],["📅","Pace",`${getPace(data.paceId).lbs} lbs/week`],["🏋️","Workouts",`${data.workoutsPerWeek}x/week`],["🚫","Allergies",data.allergies.length>0?data.allergies.join(", "):"None"],["😐","Dislikes",data.dislikes.length>0?`${data.dislikes.length} foods`:"None"]].map(([ico,k,v])=>(
              <div key={k} style={{ display:"flex", gap:12, padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
                <span>{ico}</span><span style={{ color:C.muted, fontSize:14, minWidth:70 }}>{k}</span><span style={{ color:C.text, fontSize:14, textTransform:"capitalize" }}>{v}</span>
              </div>
            ))}
          </Card>
          <Btn onClick={finish} style={{ width:"100%" }}>Start My Journey 🚀</Btn>
        </div>}

        {step>0&&step<5&&<button onClick={()=>setStep(s=>s-1)} style={{ background:"none", border:"none", color:C.muted, fontSize:15, cursor:"pointer", marginTop:16, fontFamily:FONT }}>← Back</button>}
      </div>
    </div>
  );
};

// ── Meal filter ───────────────────────────────────────────────────────────────
const filterMeals = (profile, removed=[]) => ALL_MEALS.filter(m => {
  if (removed.includes(m.id)) return false;
  for (const a of (profile.allergies||[])) if (m.allergens.includes(a.toLowerCase())) return false;
  for (const d of (profile.dislikes||[])) {
    const dl=d.toLowerCase();
    if (m.name.toLowerCase().includes(dl)||m.items.some(i=>i.toLowerCase().includes(dl))) return false;
  }
  return true;
});

// ── Chart ─────────────────────────────────────────────────────────────────────
const Chart = ({ entries, startWeight, targetWeight, color=C.accent }) => {
  const pts=[{label:"Start",weight:startWeight},...entries];
  if (pts.length<2) return null;
  const ws=pts.map(p=>p.weight).concat(targetWeight);
  const minW=Math.min(...ws)-2, maxW=Math.max(...ws)+2, range=maxW-minW;
  const W=340,H=150,P={t:14,r:14,b:32,l:44};
  const cW=W-P.l-P.r,cH=H-P.t-P.b;
  const tx=i=>P.l+(i/(pts.length-1))*cW;
  const ty=w=>P.t+cH-((w-minW)/range)*cH;
  const line=pts.map((p,i)=>`${i===0?"M":"L"}${tx(i).toFixed(1)},${ty(p.weight).toFixed(1)}`).join(" ");
  const area=line+` L${tx(pts.length-1).toFixed(1)},${H-P.b} L${P.l},${H-P.b} Z`;
  const ticks=[Math.ceil(minW+1),Math.round((minW+maxW)/2),Math.floor(maxW-1)];
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:"block"}}>
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.2"/><stop offset="100%" stopColor={color} stopOpacity="0.02"/></linearGradient>
      </defs>
      {ticks.map(w=><line key={w} x1={P.l} y1={ty(w)} x2={W-P.r} y2={ty(w)} stroke={C.border} strokeWidth="1"/>)}
      <line x1={P.l} y1={ty(targetWeight)} x2={W-P.r} y2={ty(targetWeight)} stroke={C.green} strokeWidth="1.5" strokeDasharray="5,4" opacity="0.8"/>
      <text x={W-P.r-2} y={ty(targetWeight)-5} fill={C.green} fontSize="9" textAnchor="end" fontWeight="600">target</text>
      <path d={area} fill="url(#cg)"/>
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p,i)=><circle key={i} cx={tx(i)} cy={ty(p.weight)} r={i===pts.length-1?5.5:3.5} fill={i===pts.length-1?color:"#fff"} stroke={color} strokeWidth="2"/>)}
      {ticks.map(w=><text key={w} x={P.l-5} y={ty(w)+4} fill={C.muted} fontSize="9" textAnchor="end">{Math.round(w)}</text>)}
      {pts.map((p,i)=><text key={i} x={tx(i)} y={H-P.b+14} fill={C.muted} fontSize="8.5" textAnchor="middle">{p.label}</text>)}
    </svg>
  );
};

// ── TODAY TAB ─────────────────────────────────────────────────────────────────
const TodayTab = ({ profile, entries, mealLog, workoutLog, water, setWater, journal, setJournal, measurements }) => {
  const [tipIdx, setTipIdx] = useState(()=>Math.floor(Math.random()*DAILY_TIPS.length));
  const [showJournal, setShowJournal] = useState(false);
  const today = todayKey();
  const cur = entries.length>0?entries[entries.length-1].weight:profile.startWeightLbs;
  const lost = Math.max(0,profile.startWeightLbs-cur);
  const pace = getPace(profile.paceId||"normal");
  const pct = Math.min(100,Math.round((lost/profile.targetLbs)*100));
  const eta = Math.ceil((profile.targetLbs-lost)/pace.lbs);
  const tdee = calcTDEE(profile);
  const targetCals = tdee ? tdee - Math.round(pace.lbs*500) : null;
  const todayMeals = mealLog[today]||[];
  const todayCalories = todayMeals.reduce((a,m)=>a+m.cals,0);
  const todayProtein = todayMeals.reduce((a,m)=>a+m.protein,0);
  const todayWater = water[today]||0;
  const todayWorked = workoutLog[today];

  // Weekly summary (Sunday trigger)
  const isMonday = new Date().getDay()===1;
  const lastWeekWorkouts = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-i-1); return workoutLog[d.toISOString().split("T")[0]]?1:0; }).reduce((a,b)=>a+b,0);

  // Streak
  let streak=0;
  for (let i=0;;i++) {
    const d=new Date(); d.setDate(d.getDate()-i);
    const k=d.toISOString().split("T")[0];
    if ((mealLog[k]||[]).length>0||(workoutLog[k])||((water[k]||0)>0)) streak++;
    else break;
  }

  return (
    <div>
      {/* Hero */}
      <div style={{ background:`linear-gradient(145deg, ${C.accent}, #5ac8fa)`, borderRadius:20, padding:"20px 18px", marginBottom:16, color:"#fff" }}>
        <p style={{ opacity:0.85, fontSize:14, margin:"0 0 4px" }}>Hello{profile.name?`, ${profile.name}`:""}  👋</p>
        <h2 style={{ fontSize:26, fontWeight:700, margin:"0 0 4px" }}>Lose {profile.targetLbs/14} Stone</h2>
        <p style={{ opacity:0.8, fontSize:13, margin:"0 0 14px" }}>{lost.toFixed(1)} lbs lost · {Math.max(0,profile.targetLbs-lost).toFixed(1)} to go · {pct}% · ~{eta>0?eta:0} wks · {pace.lbs} lb/wk</p>
        <div style={{ background:"rgba(255,255,255,0.25)", borderRadius:99, height:8, overflow:"hidden" }}>
          <div style={{ width:`${pct}%`, height:"100%", background:"rgba(255,255,255,0.9)", borderRadius:99, transition:"width 0.6s" }} />
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, opacity:0.75, fontSize:11 }}>
          <span>{profile.startWeightLbs} lbs start</span><span>{cur.toFixed(1)} lbs now</span>
        </div>
      </div>

      {/* Weekly summary on Mondays */}
      {isMonday&&lastWeekWorkouts>0&&<Card style={{ background:`${C.green}08`, borderColor:`${C.green}33`, marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}><Icon name="calendar" size={14} color={C.green} /><p style={{ color:C.green, fontSize:12, fontWeight:700, margin:0 }}>LAST WEEK'S SUMMARY</p></div>
        <p style={{ color:C.text, fontSize:14, margin:0 }}>You completed <strong style={{ color:C.green }}>{lastWeekWorkouts} workout{lastWeekWorkouts!==1?"s":""}</strong> last week. {lastWeekWorkouts>=profile.workoutsPerWeek?"🎯 Goal hit!":"Keep pushing this week!"}</p>
      </Card>}

      {/* Quick stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:16 }}>
        <StatBox label="Calories" val={todayCalories||"—"} sub={targetCals?`/ ${targetCals}`:undefined} color={targetCals&&todayCalories>targetCals?C.red:C.accent} />
        <StatBox label="Protein" val={todayProtein>0?`${todayProtein}g`:"—"} sub="target 120g+" color={todayProtein>=120?C.green:C.orange} />
        <StatBox label="Streak" val={`${streak}d`} color={streak>=7?C.orange:C.purple} />
      </div>

      {/* Water tracker */}
      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}><Icon name="water" size={16} color={C.teal} /><p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", margin:0 }}>WATER TODAY</p></div>
          <span style={{ color:C.teal, fontWeight:700, fontSize:15 }}>{(todayWater*0.25).toFixed(2)}L / 2.0L</span>
        </div>
        <ProgressBar value={todayWater} max={8} color={C.teal} height={10} />
        <div style={{ display:"flex", gap:8, marginTop:12 }}>
          <Btn onClick={()=>setWater(w=>({...w,[today]:Math.max(0,(w[today]||0)-1)})) } color={C.teal} outline small style={{ flex:1 }}>− 250ml</Btn>
          <Btn onClick={()=>setWater(w=>({...w,[today]:Math.min(16,(w[today]||0)+1)}))} color={C.teal} small style={{ flex:2 }}>+ 250ml</Btn>
        </div>
      </Card>

      {/* Today status */}
      <div style={{ display:"flex", gap:10, marginBottom:16 }}>
        <div style={{ flex:1, background:C.card, borderRadius:14, padding:14, border:`1px solid ${C.border}`, textAlign:"center" }}>
          <div style={{ marginBottom:4, display:"flex", justifyContent:"center" }}><Icon name={todayWorked?"check":"barbell"} size={24} color={todayWorked?C.green:C.muted} /></div>
          <div style={{ color:C.text, fontSize:13, fontWeight:600 }}>{todayWorked?todayWorked.type.split("-").join(" "):"Rest day"}</div>
          <div style={{ color:C.muted, fontSize:11 }}>workout</div>
        </div>
        <div style={{ flex:1, background:C.card, borderRadius:14, padding:14, border:`1px solid ${C.border}`, textAlign:"center" }}>
          <div style={{ marginBottom:4, display:"flex", justifyContent:"center" }}><Icon name="meals" size={24} color={C.orange} /></div>
          <div style={{ color:C.text, fontSize:13, fontWeight:600 }}>{todayMeals.length} meals</div>
          <div style={{ color:C.muted, fontSize:11 }}>logged today</div>
        </div>
        <div style={{ flex:1, background:C.card, borderRadius:14, padding:14, border:`1px solid ${C.border}`, textAlign:"center" }}>
          <div style={{ marginBottom:4, display:"flex", justifyContent:"center" }}><Icon name="weight" size={24} color={C.accent} /></div>
          <div style={{ color:C.text, fontSize:13, fontWeight:600 }}>{cur.toFixed(1)}</div>
          <div style={{ color:C.muted, fontSize:11 }}>lbs current</div>
        </div>
      </div>

      {/* TDEE info */}
      {tdee&&<Card style={{ borderLeft:`3px solid ${C.green}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}><Icon name="flame" size={15} color={C.orange} /><p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", margin:0 }}>YOUR CALORIE TARGETS</p></div>
        <div style={{ display:"flex", gap:8 }}>
          <div style={{ flex:1, textAlign:"center", padding:"8px 0" }}><div style={{ color:C.text, fontSize:17, fontWeight:700 }}>{tdee}</div><div style={{ color:C.muted, fontSize:11 }}>TDEE (maintenance)</div></div>
          <div style={{ width:1, background:C.border }} />
          <div style={{ flex:1, textAlign:"center", padding:"8px 0" }}><div style={{ color:C.accent, fontSize:17, fontWeight:700 }}>{targetCals}</div><div style={{ color:C.muted, fontSize:11 }}>Target (deficit)</div></div>
        </div>
      </Card>}

      {/* Journal */}
      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:showJournal?12:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}><Icon name="note" size={15} color={C.muted} /><p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", margin:0 }}>DAILY JOURNAL</p></div>
          <button onClick={()=>setShowJournal(s=>!s)} style={{ background:"none", border:"none", color:C.accent, fontSize:13, cursor:"pointer", fontFamily:FONT, fontWeight:600 }}>{showJournal?"Done":"Write"}</button>
        </div>
        {showJournal&&<textarea value={journal[today]||""} onChange={e=>setJournal(j=>({...j,[today]:e.target.value}))} placeholder="How are you feeling today? Energy levels, sleep, anything notable..." style={{ width:"100%", minHeight:80, background:C.sectionBg, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 12px", fontSize:14, fontFamily:FONT, color:C.text, outline:"none", resize:"vertical" }} />}
        {!showJournal&&journal[today]&&<p style={{ color:C.textSec, fontSize:14, margin:0, marginTop:8, lineHeight:1.6 }}>{journal[today]}</p>}
      </Card>

      {/* Tip */}
      <Card style={{ borderLeft:`3px solid ${C.accent}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}><Icon name="tip" size={15} color={C.accent} /><p style={{ color:C.accent, fontSize:11, fontWeight:700, letterSpacing:"0.08em", margin:0 }}>TODAY'S TIP</p></div>
        <p style={{ color:C.text, fontSize:14, lineHeight:1.75, margin:0 }}>{DAILY_TIPS[tipIdx]}</p>
        <button onClick={()=>setTipIdx(i=>(i+1)%DAILY_TIPS.length)} style={{ background:"none", border:"none", color:C.accent, fontSize:13, cursor:"pointer", marginTop:10, fontFamily:FONT, fontWeight:600 }}>↻ Next tip</button>
      </Card>
    </div>
  );
};

// ── MEALS TAB ─────────────────────────────────────────────────────────────────
const MealsTab = ({ profile, favourites, setFavourites, removed, setRemoved, mealLog, setMealLog, isPro, onUpgrade }) => {
  const [style, setStyle] = useState("all");
  const [shown, setShown] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [viewFavs, setViewFavs] = useState(false);
  const [shoppingDays, setShoppingDays] = useState(7);
  const [shoppingList, setShoppingList] = useState(null);
  const [checked, setChecked] = useState({});
  const [section, setSection] = useState("meals");
  const [suppOpen, setSuppOpen] = useState(null);
  const today = todayKey();
  const tdee = calcTDEE(profile);
  const pace = getPace(profile.paceId||"normal");
  const targetCals = tdee ? tdee - Math.round(pace.lbs*500) : 1700;

  const available = filterMeals(profile, removed);
  const filtered = style==="all"?available:available.filter(m=>m.tags.includes(style));
  const favMeals = ALL_MEALS.filter(m=>favourites.includes(m.id));
  const todayLogged = mealLog[today]||[];
  const todayCals = todayLogged.reduce((a,m)=>a+m.cals,0);
  const todayProt = todayLogged.reduce((a,m)=>a+m.protein,0);

  const generate = () => {
    const pool=filtered.length>0?filtered:available;
    const favPool=pool.filter(m=>favourites.includes(m.id));
    const usePool=favPool.length>=3?favPool:pool;
    setShown([...usePool].sort(()=>Math.random()-0.5).slice(0,4));
    setExpanded(null);
  };

  const toggleFav = id => setFavourites(f=>f.includes(id)?f.filter(x=>x!==id):[...f,id]);
  const removeM = id => { setRemoved(r=>[...r,id]); setShown(s=>s?s.filter(m=>m.id!==id):s); };
  const logMeal = m => setMealLog(ml=>({...ml,[today]:[...(ml[today]||[]),{id:m.id,name:m.name,cals:m.cals,protein:m.protein,carbs:m.carbs,fat:m.fat,time:new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}]}));
  const removeMealLog = (i) => setMealLog(ml=>({...ml,[today]:(ml[today]||[]).filter((_,idx)=>idx!==i)}));

  return (
    <div>
      <div style={{ display:"flex", gap:6, marginBottom:16, overflowX:"auto", paddingBottom:2 }}>
        {[["meals","Meals"],["shopping","Shopping"],["supps","Supplements"]].map(([k,l])=>(
          <Chip key={k} color={C.accent} active={section===k} onClick={()=>setSection(k)}>{l}</Chip>
        ))}
      </div>

      {section==="meals"&&<>
        {/* Daily log summary */}
        {todayLogged.length>0&&<Card style={{ background:`${C.green}08`, borderColor:`${C.green}33` }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}><Icon name="check" size={14} color={C.green} /><p style={{ color:C.green, fontSize:12, fontWeight:700, letterSpacing:"0.06em", margin:0 }}>TODAY'S LOG</p></div>
            <span style={{ color:C.muted, fontSize:12 }}>{todayCals} cal · {todayProt}g protein</span>
          </div>
          {tdee&&<div style={{ marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}><span style={{ color:C.muted, fontSize:12 }}>Calories</span><span style={{ color:todayCals>targetCals?C.red:C.green, fontSize:12, fontWeight:600 }}>{todayCals} / {targetCals}</span></div>
            <ProgressBar value={todayCals} max={targetCals} color={todayCals>targetCals?C.red:C.green} />
          </div>}
          {todayLogged.map((m,i)=>(
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 0", borderBottom:i<todayLogged.length-1?`1px solid ${C.border}`:"none" }}>
              <div><span style={{ color:C.text, fontSize:13 }}>{m.name}</span><span style={{ color:C.muted, fontSize:11, marginLeft:8 }}>{m.time}</span></div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ color:C.muted, fontSize:12 }}>{m.cals}cal</span>
                <button onClick={()=>removeMealLog(i)} style={{ background:"none", border:"none", color:C.red, cursor:"pointer", fontSize:14 }}>×</button>
              </div>
            </div>
          ))}
        </Card>}

        {/* Favourites */}
        {favMeals.length>0&&<div onClick={()=>setViewFavs(v=>!v)} style={{ background:`${C.yellow}15`, border:`1px solid ${C.yellow}33`, borderRadius:12, padding:"10px 14px", marginBottom:12, cursor:"pointer", display:"flex", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}><Icon name="starFill" size={15} color={C.orange} /><span style={{ color:C.orange, fontWeight:600, fontSize:14 }}>{favMeals.length} favourite{favMeals.length!==1?"s":""}</span></div>
          <span style={{ color:C.muted, fontSize:13 }}>{viewFavs?"▲":"▼"}</span>
        </div>}
        {viewFavs&&favMeals.map(m=><Card key={m.id} style={{ borderColor:`${C.yellow}44` }}>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <p style={{ color:C.text, fontWeight:600, margin:0 }}>{m.name}</p>
            <button onClick={()=>toggleFav(m.id)} style={{ background:"none", border:"none", color:C.orange, cursor:"pointer", fontSize:13, fontFamily:FONT }}>★ Unfav</button>
          </div>
        </Card>)}

        <Card>
          <p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", marginBottom:10 }}>MEAL STYLE</p>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
            {["all","balanced","high-protein","mediterranean","budget-friendly"].map(s=><Chip key={s} color={C.accent} active={style===s} onClick={()=>setStyle(s)}>{s}</Chip>)}
          </div>
          {isPro
            ? <Btn onClick={generate} style={{ width:"100%" }}>✦ Generate Today's Meals</Btn>
            : <Btn onClick={onUpgrade} color={C.indigo} style={{ width:"100%" }}>🔒 Unlock Meal Generation — Pro</Btn>
          }
        </Card>

        {shown&&<>
          <div style={{ display:"flex", gap:8, marginBottom:12 }}>
            <StatBox label="Calories" val={shown.reduce((a,m)=>a+m.cals,0)} color={C.accent} />
            <StatBox label="Protein" val={`${shown.reduce((a,m)=>a+m.protein,0)}g`} color={C.green} />
            <StatBox label="Carbs" val={`${shown.reduce((a,m)=>a+m.carbs,0)}g`} color={C.orange} />
          </div>
          {shown.map(m=>{
            const isFav=favourites.includes(m.id);
            const isLogged=(mealLog[today]||[]).some(l=>l.id===m.id);
            const isExp=expanded===m.id;
            return <Card key={m.id} style={{ borderColor:isFav?`${C.yellow}55`:C.border }}>
              <div onClick={()=>setExpanded(isExp?null:m.id)} style={{ cursor:"pointer" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div style={{ flex:1 }}>
                    <span style={{ color:C.muted, fontSize:11, fontWeight:600 }}>{m.tags.find(t=>["breakfast","lunch","dinner","snack"].includes(t))?.toUpperCase()}</span>
                    <p style={{ color:C.text, fontWeight:600, fontSize:16, margin:"2px 0 0" }}>{m.name}</p>
                  </div>
                  <div style={{ textAlign:"right", marginLeft:10 }}>
                    <div style={{ color:C.accent, fontSize:14, fontWeight:700 }}>{m.cals} cal</div>
                    <div style={{ color:C.green, fontSize:12 }}>{m.protein}g pro · {m.carbs}g carbs · {m.fat}g fat</div>
                  </div>
                </div>
                {m.items.map((item,j)=><div key={j} style={{ padding:"3px 10px", background:C.sectionBg, borderRadius:8, fontSize:13, color:C.textSec, marginBottom:3 }}>· {item}</div>)}
                <p style={{ color:C.accent, fontSize:12, fontWeight:600, marginTop:8, marginBottom:0 }}>{isExp?"▲ Hide method":"▼ How to prepare this"}</p>
              </div>
              {isExp&&<div style={{ marginTop:12, padding:"12px 14px", background:C.sectionBg, borderRadius:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}><Icon name="note" size={13} color={C.muted} /><p style={{ color:C.muted, fontSize:11, fontWeight:700, letterSpacing:"0.06em", margin:0 }}>METHOD</p></div>
                {m.method.split("\n").map((step,i)=><p key={i} style={{ color:C.text, fontSize:13, lineHeight:1.7, margin:"0 0 6px" }}>{step}</p>)}
              </div>}
              <div style={{ display:"flex", gap:8, marginTop:12 }}>
                <button onClick={()=>toggleFav(m.id)} style={{ flex:1, background:isFav?`${C.yellow}20`:"none", border:`1px solid ${isFav?C.yellow:C.border}`, borderRadius:10, padding:"7px 0", color:isFav?C.orange:C.muted, fontSize:13, cursor:"pointer", fontFamily:FONT, fontWeight:600 }}>{isFav?"★ Saved":"☆ Fav"}</button>
                <button onClick={()=>{if(!isLogged)logMeal(m);}} style={{ flex:2, background:isLogged?`${C.green}15`:"none", border:`1px solid ${isLogged?C.green:C.border}`, borderRadius:10, padding:"7px 0", color:isLogged?C.green:C.muted, fontSize:13, cursor:isLogged?"default":"pointer", fontFamily:FONT, fontWeight:600 }}>{isLogged?"✓ Logged":"+ Log meal"}</button>
                <button onClick={()=>removeM(m.id)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:10, padding:"7px 12px", color:C.red, fontSize:13, cursor:"pointer", fontFamily:FONT }}>✕</button>
              </div>
            </Card>;
          })}
          {removed.length>0&&<div style={{ textAlign:"center" }}><span onClick={()=>setRemoved([])} style={{ color:C.muted, fontSize:12, cursor:"pointer", textDecoration:"underline" }}>Restore {removed.length} removed meal{removed.length!==1?"s":""}</span></div>}
        </>}
      </>}

      {section==="shopping"&&<>
        <Card>
          <p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", marginBottom:10 }}>SHOPPING LIST — GF &amp; DAIRY-FREE</p>
          <div style={{ display:"flex", gap:8, marginBottom:14, alignItems:"center" }}>
            <span style={{ color:C.muted }}>For</span>
            {[3,5,7].map(d=><Chip key={d} color={C.green} active={shoppingDays===d} onClick={()=>setShoppingDays(d)}>{d} days</Chip>)}
          </div>
          {isPro
            ? <Btn onClick={()=>{setShoppingList(SHOPPING[shoppingDays]);setChecked({});}} color={C.green} style={{ width:"100%" }}>✦ Generate List</Btn>
            : <Btn onClick={onUpgrade} color={C.indigo} style={{ width:"100%" }}>🔒 Unlock Shopping Lists — Pro</Btn>
          }
        </Card>
        {shoppingList&&<>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, padding:"0 4px" }}>
            <span style={{ color:C.text, fontWeight:600 }}>{shoppingDays}-day list</span>
            <Chip color={C.green}>{shoppingList.cost}</Chip>
          </div>
          {shoppingList.cats.map((cat,ci)=><Section key={ci} title={cat.name}>
            {cat.items.map((item,ii)=>{
              const k=`${ci}-${ii}`;
              return <div key={ii} onClick={()=>setChecked(c=>({...c,[k]:!c[k]}))} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderBottom:ii<cat.items.length-1?`1px solid ${C.border}`:"none", cursor:"pointer", opacity:checked[k]?0.35:1 }}>
                <div style={{ width:22, height:22, borderRadius:99, flexShrink:0, background:checked[k]?C.green:"transparent", border:`2px solid ${checked[k]?C.green:C.divider}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {checked[k]&&<span style={{ color:"#fff", fontSize:12, fontWeight:700 }}>✓</span>}
                </div>
                <div style={{ flex:1 }}>
                  <span style={{ color:C.text, fontSize:15, textDecoration:checked[k]?"line-through":"none" }}>{item.i}</span>
                  {item.n&&<span style={{ color:C.muted, fontSize:12, marginLeft:6 }}>({item.n})</span>}
                </div>
                <span style={{ color:C.muted, fontSize:13 }}>{item.q}</span>
              </div>;
            })}
          </Section>)}
          <Card style={{ background:`${C.green}08`, borderColor:`${C.green}22` }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}><Icon name="tip" size={14} color={C.green} /><p style={{ color:C.green, fontSize:12, fontWeight:700, margin:0 }}>SMART SHOPPING</p></div>
            <p style={{ color:C.text, fontSize:13, lineHeight:1.7, margin:0 }}>{shoppingList.tip}</p>
          </Card>
        </>}
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

// ── TRAIN TAB ─────────────────────────────────────────────────────────────────
const TrainTab = ({ profile, workoutLog, setWorkoutLog }) => {
  const [selectedType, setSelectedType] = useState("full-body");
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [view, setView] = useState("calendar");
  const [liftLog, setLiftLog] = useState({});
  const today = todayKey();

  const days = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-d.getDay()+1+i); return d; });
  const dayKey = d => d.toISOString().split("T")[0];
  const weekWorkouts = days.filter(d=>workoutLog[dayKey(d)]).length;

  const logWorkout = (type) => {
    setWorkoutLog(wl=>({...wl,[today]:{type,date:today,time:new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}}));
    setActiveWorkout(WORKOUTS[type]);
    setView("workout");
  };

  const historyWeeks = Array.from({length:4},(_,i)=>{
    const start=new Date(); start.setDate(start.getDate()-start.getDay()+1-(i*7));
    const count=Array.from({length:7},(__,j)=>{ const d=new Date(start); d.setDate(d.getDate()+j); return workoutLog[dayKey(d)]?1:0; }).reduce((a,b)=>a+b,0);
    return {label:i===0?"This week":i===1?"Last week":`${i+1}w ago`,count};
  }).reverse();

  // Suggest rest days based on workouts per week
  const trainDays = profile.workoutsPerWeek||3;
  const restDays = 7 - trainDays;
  const suggestion = trainDays<=3 ? "Mon · Wed · Fri" : trainDays===4 ? "Mon · Tue · Thu · Fri" : "Mon · Tue · Thu · Fri · Sat";

  return (
    <div>
      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {[["calendar","Calendar"],["workout","Workout"],["lifts","Lifts"]].map(([k,l])=>(
          <Chip key={k} color={C.accent} active={view===k} onClick={()=>setView(k)}>{l}</Chip>
        ))}
      </div>

      {view==="calendar"&&<>
        <Card>
          <p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", marginBottom:12 }}>THIS WEEK — {weekWorkouts}/{profile.workoutsPerWeek} WORKOUTS</p>
          <ProgressBar value={weekWorkouts} max={profile.workoutsPerWeek||3} color={weekWorkouts>=(profile.workoutsPerWeek||3)?C.green:C.accent} height={6} />
          <div style={{ display:"flex", gap:6, marginTop:14 }}>
            {days.map((d,i)=>{
              const k=dayKey(d); const logged=workoutLog[k]; const isToday=k===today;
              return <div key={i} style={{ flex:1, textAlign:"center" }}>
                <div style={{ fontSize:10, color:isToday?C.accent:C.muted, fontWeight:isToday?700:400, marginBottom:4 }}>{DAY_NAMES[i]}</div>
                <div style={{ width:"100%", aspectRatio:"1", borderRadius:10, background:logged?C.accent:isToday?`${C.accent}15`:C.sectionBg, border:`1.5px solid ${logged?C.accent:isToday?C.accent:C.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {logged?<span style={{ color:"#fff", fontSize:11 }}>✓</span>:<span style={{ color:C.muted, fontSize:10 }}>{d.getDate()}</span>}
                </div>
                {logged&&<div style={{ fontSize:9, color:C.accent, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{logged.type.split("-")[0]}</div>}
              </div>;
            })}
          </div>
        </Card>

        {/* Rest day planner */}
        <Card style={{ background:`${C.green}08`, borderColor:`${C.green}22` }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}><Icon name="calendar" size={14} color={C.green} /><p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", margin:0 }}>REST DAY PLANNER</p></div>
          <p style={{ color:C.text, fontSize:14, marginBottom:6 }}>Training <strong style={{ color:C.accent }}>{trainDays}x</strong> per week · <strong style={{ color:C.green }}>{restDays} rest days</strong></p>
          <p style={{ color:C.muted, fontSize:13, marginBottom:10 }}>Suggested schedule: <strong style={{ color:C.text }}>{suggestion}</strong></p>
          <div style={{ background:C.sectionBg, borderRadius:10, padding:"10px 12px" }}>
            <p style={{ color:C.muted, fontSize:12, fontWeight:600, marginBottom:4 }}>💚 ON REST DAYS</p>
            <p style={{ color:C.textSec, fontSize:13, lineHeight:1.6, margin:0 }}>15–20 min gentle walk · Stretching or yoga · Foam rolling · Extra sleep or nap</p>
          </div>
        </Card>

        <Section title="Workout History">
          {historyWeeks.map((w,i)=><Row key={i} label={w.label} value={`${w.count} / ${profile.workoutsPerWeek||3}`} color={w.count>=(profile.workoutsPerWeek||3)?C.green:w.count>0?C.accent:C.muted} last={i===historyWeeks.length-1} />)}
        </Section>

        <Card style={{ background:`linear-gradient(145deg, ${C.accent}08, ${C.purple}08)` }}>
          <p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", marginBottom:12 }}>LOG TODAY'S WORKOUT</p>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
            {Object.entries(WORKOUTS).map(([key,val])=><Chip key={key} color={val.color} active={selectedType===key} onClick={()=>setSelectedType(key)}>{key}</Chip>)}
          </div>
          <Btn onClick={()=>logWorkout(selectedType)} color={WORKOUTS[selectedType].color} style={{ width:"100%" }}>
            {workoutLog[today]?"↻ Update Today":"✦ Log & View Workout"}
          </Btn>
        </Card>
      </>}

      {view==="workout"&&<>
        {!activeWorkout&&<Card>
          <p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", marginBottom:12 }}>CHOOSE WORKOUT</p>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
            {Object.entries(WORKOUTS).map(([key,val])=><Chip key={key} color={val.color} active={selectedType===key} onClick={()=>setSelectedType(key)}>{key}</Chip>)}
          </div>
          <Btn onClick={()=>setActiveWorkout(WORKOUTS[selectedType])} color={WORKOUTS[selectedType].color} style={{ width:"100%" }}>✦ View Workout</Btn>
        </Card>}

        {activeWorkout&&<>
          <div style={{ background:`linear-gradient(135deg, ${activeWorkout.color}, ${activeWorkout.color}88)`, borderRadius:16, padding:"16px 18px", marginBottom:14, color:"#fff" }}>
            <h3 style={{ margin:0, fontSize:20, fontWeight:700 }}>{activeWorkout.title}</h3>
            <p style={{ opacity:0.85, fontSize:13, margin:"4px 0 0" }}>{activeWorkout.duration} min · Low impact · Joint safe</p>
          </div>
          <Section title={<div style={{display:"flex",alignItems:"center",gap:6}}><Icon name="flame" size={13} color={C.orange} /><span>Warm Up</span></div>}>
            {activeWorkout.warmup.map((x,i)=><Row key={i} label={x} last={i===activeWorkout.warmup.length-1} />)}
          </Section>
          {activeWorkout.exercises.map((ex,i)=><Card key={i} style={{ borderLeft:`3px solid ${activeWorkout.color}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <div><p style={{ color:activeWorkout.color, fontWeight:700, fontSize:16, margin:0 }}>{i+1}. {ex.name}</p><span style={{ color:C.muted, fontSize:12 }}>{ex.equipment}</span></div>
              <div style={{ background:`${activeWorkout.color}15`, borderRadius:10, padding:"8px 12px", textAlign:"right" }}>
                <div style={{ color:C.text, fontSize:16, fontWeight:700 }}>{ex.sets} × {ex.reps}</div>
                <div style={{ color:C.muted, fontSize:11 }}>Rest: {ex.rest}</div>
              </div>
            </div>
            {ex.tip&&<div style={{ background:C.sectionBg, borderRadius:8, padding:"8px 12px", fontSize:12, color:C.textSec, borderLeft:`3px solid ${C.yellow}` }}>💬 {ex.tip}</div>}
          </Card>)}
          <Section title={<div style={{display:"flex",alignItems:"center",gap:6}}><Icon name="snowflake" size={13} color={C.teal} /><span>Cool Down</span></div>}>
            {activeWorkout.cooldown.map((x,i)=><Row key={i} label={x} last={i===activeWorkout.cooldown.length-1} />)}
          </Section>
          <Card style={{ background:`${activeWorkout.color}08`, borderColor:`${activeWorkout.color}33` }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}><Icon name="medal" size={14} color={activeWorkout.color} /><p style={{ color:activeWorkout.color, fontSize:12, fontWeight:700, margin:0 }}>COACH NOTES</p></div>
            <p style={{ color:C.text, fontSize:13, lineHeight:1.75, margin:0 }}>{activeWorkout.note}</p>
          </Card>
          <div style={{ display:"flex", gap:8 }}>
            <Btn onClick={()=>setActiveWorkout(null)} outline color={C.accent} style={{ flex:1 }}>← Back</Btn>
            {!workoutLog[today]&&<Btn onClick={()=>logWorkout(selectedType)} color={C.green} style={{ flex:2 }}>✓ Log This Workout</Btn>}
          </div>
        </>}
      </>}

      {view==="lifts"&&<LiftTracker workoutLog={workoutLog} />}
    </div>
  );
};

// ── LIFT TRACKER ──────────────────────────────────────────────────────────────
const LiftTracker = ({ workoutLog }) => {
  const [lifts, setLifts] = useState(() => {
    try { return JSON.parse(localStorage.getItem("leanplan_lifts")||"{}"); } catch { return {}; }
  });
  const [addingLift, setAddingLift] = useState(false);
  const [liftName, setLiftName] = useState("");
  const [liftWeight, setLiftWeight] = useState("");
  const [liftReps, setLiftReps] = useState("");
  const [liftSets, setLiftSets] = useState("3");

  useEffect(()=>{
    localStorage.setItem("leanplan_lifts", JSON.stringify(lifts));
  },[lifts]);

  const addEntry = () => {
    if (!liftName||!liftWeight) return;
    const entry = { date:todayKey(), weight:parseFloat(liftWeight), reps:parseInt(liftReps)||0, sets:parseInt(liftSets)||3, timestamp:Date.now() };
    setLifts(l=>({...l,[liftName]:[...(l[liftName]||[]),entry].slice(-20)}));
    setLiftWeight(""); setLiftReps(""); setAddingLift(false);
  };

  const commonLifts = ["Dumbbell Bench Press","Lat Pulldown","Leg Press","Seated Cable Row","Dumbbell Shoulder Press","Romanian Deadlift","Goblet Squat","Bicep Curl"];

  return (
    <div>
      <Card style={{ background:`${C.indigo}08`, borderColor:`${C.indigo}22` }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}><Icon name="barbell" size={14} color={C.indigo} /><p style={{ color:C.indigo, fontSize:12, fontWeight:700, margin:0 }}>LIFT TRACKER</p></div>
        <p style={{ color:C.text, fontSize:13, lineHeight:1.6, margin:0 }}>Log your weights to track progressive overload — the key to getting stronger over time.</p>
      </Card>

      {!addingLift&&<Btn onClick={()=>setAddingLift(true)} color={C.indigo} style={{ width:"100%", marginBottom:16 }}>+ Log Today's Lifts</Btn>}

      {addingLift&&<Card>
        <p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", marginBottom:12 }}>LOG A LIFT</p>
        <div style={{ marginBottom:10 }}>
          <p style={{ color:C.muted, fontSize:13, marginBottom:6 }}>Exercise</p>
          <select value={liftName} onChange={e=>setLiftName(e.target.value)} style={{ background:C.sectionBg, border:`1px solid ${C.border}`, borderRadius:10, color:liftName?C.text:C.muted, padding:"12px 14px", fontFamily:FONT, fontSize:15, outline:"none", width:"100%" }}>
            <option value="">Select exercise...</option>
            {commonLifts.map(l=><option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div style={{ display:"flex", gap:8, marginBottom:14 }}>
          <div style={{ flex:1 }}><p style={{ color:C.muted, fontSize:13, marginBottom:6 }}>Weight (kg)</p><TInput value={liftWeight} onChange={e=>setLiftWeight(e.target.value)} placeholder="e.g. 20" type="number" /></div>
          <div style={{ flex:1 }}><p style={{ color:C.muted, fontSize:13, marginBottom:6 }}>Reps</p><TInput value={liftReps} onChange={e=>setLiftReps(e.target.value)} placeholder="e.g. 10" type="number" /></div>
          <div style={{ flex:1 }}><p style={{ color:C.muted, fontSize:13, marginBottom:6 }}>Sets</p><TInput value={liftSets} onChange={e=>setLiftSets(e.target.value)} placeholder="e.g. 3" type="number" /></div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <Btn onClick={()=>setAddingLift(false)} outline color={C.muted} small style={{ flex:1 }}>Cancel</Btn>
          <Btn onClick={addEntry} disabled={!liftName||!liftWeight} color={C.indigo} style={{ flex:2 }}>Save Lift</Btn>
        </div>
      </Card>}

      {Object.keys(lifts).length===0&&!addingLift&&<Card><p style={{ color:C.muted, fontSize:14, textAlign:"center", margin:0 }}>No lifts logged yet. Start tracking to see your progress!</p></Card>}

      {Object.entries(lifts).map(([name,entries])=>{
        const latest=entries[entries.length-1];
        const prev=entries.length>1?entries[entries.length-2]:null;
        const improved=prev&&latest.weight>prev.weight;
        const same=prev&&latest.weight===prev.weight;
        return <Card key={name} style={{ borderLeft:`3px solid ${improved?C.green:same?C.accent:C.muted}` }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
            <div><p style={{ color:C.text, fontWeight:700, fontSize:15, margin:0 }}>{name}</p><p style={{ color:C.muted, fontSize:12, margin:"2px 0 0" }}>{entries.length} sessions logged</p></div>
            <div style={{ textAlign:"right" }}>
              <div style={{ color:improved?C.green:C.text, fontSize:18, fontWeight:700 }}>{latest.weight}kg</div>
              <div style={{ color:C.muted, fontSize:12 }}>{latest.sets}×{latest.reps} · {fmtDate(latest.date)}</div>
              {improved&&<div style={{ color:C.green, fontSize:11, fontWeight:600 }}>▲ +{(latest.weight-prev.weight).toFixed(1)}kg</div>}
            </div>
          </div>
          {entries.length>1&&<div style={{ display:"flex", gap:4, alignItems:"flex-end", height:40 }}>
            {entries.slice(-8).map((e,i,arr)=>{
              const maxW=Math.max(...arr.map(x=>x.weight));
              const h=Math.max(20,(e.weight/maxW)*36);
              return <div key={i} style={{ flex:1, background:i===arr.length-1?C.indigo:`${C.indigo}44`, borderRadius:"3px 3px 0 0", height:h, transition:"height 0.3s" }} title={`${e.weight}kg`} />;
            })}
          </div>}
        </Card>;
      })}
    </div>
  );
};

// ── TRACK TAB ─────────────────────────────────────────────────────────────────
const TrackTab = ({ profile, entries, setEntries, measurements, setMeasurements }) => {
  const [newW, setNewW] = useState("");
  const [activeSection, setActiveSection] = useState("weight");
  const [newMeasure, setNewMeasure] = useState({ waist:"", hips:"", chest:"", leftArm:"", rightArm:"" });

  const cur = entries.length>0?entries[entries.length-1].weight:profile.startWeightLbs;
  const lost = Math.max(0,profile.startWeightLbs-cur);
  const pace = getPace(profile.paceId||"normal");
  const eta = Math.ceil((profile.targetLbs-lost)/pace.lbs);
  const target = profile.startWeightLbs-profile.targetLbs;
  const pct = Math.min(100,Math.round((lost/profile.targetLbs)*100));
  const tdee = calcTDEE(profile);
  const bmi = calcBMI(profile);
  const bmiCat = bmi?bmiCategory(parseFloat(bmi)):null;

  const addWeightEntry = () => {
    if (!newW||isNaN(newW)) return;
    setEntries(prev=>[...prev,{weight:parseFloat(parseFloat(newW).toFixed(1)),label:`W${prev.length+1}`,date:new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short"})}]);
    setNewW("");
  };

  const addMeasurement = () => {
    const hasData = Object.values(newMeasure).some(v=>v!=="");
    if (!hasData) return;
    setMeasurements(m=>[...m,{...newMeasure,date:todayKey(),displayDate:new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}]);
    setNewMeasure({waist:"",hips:"",chest:"",leftArm:"",rightArm:""});
  };

  const lastMeasure = measurements.length>0?measurements[measurements.length-1]:null;
  const prevMeasure = measurements.length>1?measurements[measurements.length-2]:null;
  const measureDiff = (key) => {
    if (!lastMeasure||!prevMeasure||!lastMeasure[key]||!prevMeasure[key]) return null;
    return (parseFloat(lastMeasure[key])-parseFloat(prevMeasure[key])).toFixed(1);
  };

  return (
    <div>
      <div style={{ display:"flex", gap:6, marginBottom:16, overflowX:"auto" }}>
        {[["weight","Weight"],["measurements","Measurements"],["stats","Stats"]].map(([k,l])=>(
          <Chip key={k} color={C.purple} active={activeSection===k} onClick={()=>setActiveSection(k)}>{l}</Chip>
        ))}
      </div>

      {activeSection==="weight"&&<>
        <div style={{ background:`linear-gradient(145deg, ${C.accent}15, ${C.green}10)`, borderRadius:20, padding:"20px 18px", marginBottom:16, border:`1px solid ${C.accent}22` }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
            <div><p style={{ color:C.muted, fontSize:13, margin:0 }}>Progress</p><h2 style={{ color:C.text, fontSize:28, fontWeight:700, margin:"2px 0 0" }}>{pct}%</h2></div>
            <div style={{ textAlign:"right" }}><p style={{ color:C.muted, fontSize:12, margin:0 }}>Lost so far</p><p style={{ color:C.green, fontSize:22, fontWeight:700, margin:0 }}>{lost.toFixed(1)} lbs</p></div>
          </div>
          <ProgressBar value={lost} max={profile.targetLbs} color={C.accent} height={10} />
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, fontSize:11, color:C.muted }}>
            <span>{profile.startWeightLbs} lbs</span><span>Goal: {target.toFixed(1)} lbs</span>
          </div>
        </div>

        <div style={{ display:"flex", gap:8, marginBottom:16 }}>
          <StatBox label="Per week" val={entries.length>0?(lost/entries.length).toFixed(1)+" lbs":"—"} color={C.accent} />
          <StatBox label="ETA" val={eta>0?`${eta} wks`:"Done!"} color={C.purple} />
          <StatBox label="To go" val={`${Math.max(0,profile.targetLbs-lost).toFixed(1)}`} sub="lbs" color={C.orange} />
        </div>

        <Card>
          <p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", marginBottom:12 }}>⚖️ LOG WEEKLY WEIGH-IN</p>
          <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:10 }}>
            <TInput value={newW} onChange={e=>setNewW(e.target.value)} placeholder="Current weight in lbs" type="number" style={{ flex:1 }} />
            <Btn onClick={addWeightEntry} disabled={!newW} color={C.accent} style={{ padding:"12px 18px" }}>+ Log</Btn>
          </div>
          <div style={{ display:"flex", gap:16, fontSize:12 }}>
            <span style={{ color:C.muted }}>Start: <strong style={{ color:C.text }}>{profile.startWeightLbs} lbs</strong></span>
            <span style={{ color:C.muted }}>Target: <strong style={{ color:C.green }}>{target.toFixed(1)} lbs</strong></span>
          </div>
        </Card>

        {entries.length>=1&&<Card>
          <p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", marginBottom:12 }}>📈 WEIGHT CHART (lbs)</p>
          <Chart entries={entries} startWeight={profile.startWeightLbs} targetWeight={target} />
          {entries.length<2&&<p style={{ color:C.muted, fontSize:12, textAlign:"center", marginTop:8 }}>Log more weeks to see your trend</p>}
        </Card>}

        {entries.length>0&&<Section title="Weekly Log">
          <Row label="Starting weight" value={`${profile.startWeightLbs} lbs`} color={C.muted} />
          {entries.map((e,i)=>{
            const prev=i===0?profile.startWeightLbs:entries[i-1].weight;
            const diff=e.weight-prev;
            return <Row key={i} label={`${e.label}${e.date?` · ${e.date}`:""}`} value={`${e.weight} lbs`} last={i===entries.length-1}
              icon={<span style={{ color:diff<0?C.green:diff>0?C.red:C.muted, fontSize:12, fontWeight:700 }}>{diff<0?"▼":diff>0?"▲":"●"} {Math.abs(diff).toFixed(1)}</span>}
            />;
          })}
        </Section>}
      </>}

      {activeSection==="measurements"&&<>
        <Card style={{ background:`${C.pink}08`, borderColor:`${C.pink}22` }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}><Icon name="ruler" size={14} color={C.pink} /><p style={{ color:C.pink, fontSize:12, fontWeight:700, margin:0 }}>WHY MEASURE?</p></div>
          <p style={{ color:C.text, fontSize:13, lineHeight:1.6, margin:0 }}>The scale can lie — especially with creatine and muscle gain. Measurements show the real body composition changes that matter.</p>
        </Card>

        <Card>
          <p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", marginBottom:12 }}>LOG MEASUREMENTS (cm)</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
            {[["waist","Waist"],["hips","Hips"],["chest","Chest"],["leftArm","Left arm"],["rightArm","Right arm"]].map(([k,l])=>(
              <div key={k}>
                <p style={{ color:C.muted, fontSize:12, marginBottom:4 }}>{l}</p>
                <TInput value={newMeasure[k]} onChange={e=>setNewMeasure(m=>({...m,[k]:e.target.value}))} placeholder="cm" type="number" />
              </div>
            ))}
          </div>
          <Btn onClick={addMeasurement} color={C.pink} style={{ width:"100%" }}>Save Measurements</Btn>
        </Card>

        {lastMeasure&&<>
          <Section title="Latest Measurements">
            {[["waist","Waist 🎯"],["hips","Hips"],["chest","Chest"],["leftArm","Left arm"],["rightArm","Right arm"]].map(([k,l],i,arr)=>{
              const diff=measureDiff(k);
              return lastMeasure[k]?<Row key={k} label={l} value={`${lastMeasure[k]} cm`} last={i===arr.length-1}
                icon={diff?<span style={{ color:parseFloat(diff)<0?C.green:C.red, fontSize:12, fontWeight:700 }}>{parseFloat(diff)<0?"▼":"▲"} {Math.abs(parseFloat(diff))} cm</span>:undefined}
              />:null;
            })}
          </Section>
          <p style={{ color:C.muted, fontSize:12, textAlign:"center" }}>Logged {lastMeasure.displayDate}</p>
        </>}

        {measurements.length===0&&<Card><p style={{ color:C.muted, fontSize:14, textAlign:"center", margin:0 }}>No measurements logged yet. Monthly tracking is ideal.</p></Card>}
      </>}

      {activeSection==="stats"&&<>
        {tdee&&<Section title="Calorie Targets">
          <Row label="TDEE (maintenance)" value={`${tdee} cal`} color={C.text} />
          <Row label="Your target (deficit)" value={`${tdee-Math.round(getPace(profile.paceId||"normal").lbs*500)} cal`} color={C.accent} />
          <Row label="Deficit per day" value={`${Math.round(getPace(profile.paceId||"normal").lbs*500)} cal`} color={C.orange} last />
        </Section>}

        {bmi&&<Section title="BMI">
          <Row label="Current BMI" value={bmi} color={bmiCat?.color} />
          <Row label="Category" value={bmiCat?.label} color={bmiCat?.color} last />
        </Section>}

        <Card style={{ background:`${C.orange}08`, borderColor:`${C.orange}22` }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}><Icon name="info" size={14} color={C.orange} /><p style={{ color:C.orange, fontSize:12, fontWeight:700, margin:0 }}>ABOUT BMI</p></div>
          <p style={{ color:C.text, fontSize:13, lineHeight:1.6, margin:0 }}>BMI is a rough guide — it doesn't account for muscle mass. As you build muscle through weight training, your BMI may not fall as fast as your body fat. Waist measurement is often a better indicator of health.</p>
        </Card>

        <Section title="Your Plan">
          <Row label="Starting weight" value={`${profile.startWeightLbs} lbs`} />
          <Row label="Target weight" value={`${(profile.startWeightLbs-profile.targetLbs).toFixed(1)} lbs`} />
          <Row label="Pace" value={`${getPace(profile.paceId||"normal").lbs} lbs/week`} />
          <Row label="Estimated weeks" value={`${Math.ceil(profile.targetLbs/getPace(profile.paceId||"normal").lbs)} weeks`} last />
        </Section>
      </>}
    </div>
  );
};

// ── PROFILE TAB ───────────────────────────────────────────────────────────────
const ProfileTab = ({ profile, setProfile, onReset, isDark, darkOverride, setDarkOverride, isPro, proData, onUpgrade }) => {
  const [editing, setEditing] = useState(null);
  const [tempData, setTempData] = useState({});
  const toggleArr = (k,v) => setTempData(d=>({...d,[k]:d[k].includes(v)?d[k].filter(x=>x!==v):[...d[k],v]}));
  const startEdit = (s) => { setTempData({...profile}); setEditing(s); };
  const save = () => { setProfile({...profile,...tempData}); setEditing(null); };

  if (editing) return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
        <button onClick={()=>setEditing(null)} style={{ background:"none", border:"none", color:C.accent, fontSize:16, cursor:"pointer", fontFamily:FONT }}>←</button>
        <h2 style={{ color:C.text, fontSize:20, fontWeight:700, margin:0, flex:1 }}>Edit {editing}</h2>
        <Btn onClick={save} small color={C.accent}>Save</Btn>
      </div>

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
            {[7,14,21,28].map(lbs=><Chip key={lbs} color={C.accent} active={tempData.targetLbs===lbs} onClick={()=>setTempData(d=>({...d,targetLbs:lbs}))}>{lbs/14} stone</Chip>)}
          </div>
        </div>
        <div>
          <p style={{ color:C.muted, fontSize:13, marginBottom:8 }}>Weekly pace</p>
          <PacePicker value={tempData.paceId||"normal"} onChange={v=>setTempData(d=>({...d,paceId:v}))} targetLbs={tempData.targetLbs||14} />
        </div>
      </>}

      {editing==="details"&&<>
        <div style={{ display:"flex", gap:10, marginBottom:14 }}>
          <div style={{ flex:1 }}><p style={{ color:C.muted, fontSize:13, marginBottom:6 }}>Height (cm)</p><TInput value={tempData.heightCm||""} onChange={e=>setTempData(d=>({...d,heightCm:e.target.value}))} placeholder="e.g. 178" type="number" /></div>
          <div style={{ flex:1 }}><p style={{ color:C.muted, fontSize:13, marginBottom:6 }}>Age</p><TInput value={tempData.age||""} onChange={e=>setTempData(d=>({...d,age:e.target.value}))} placeholder="e.g. 53" type="number" /></div>
        </div>
        <div style={{ marginBottom:14 }}>
          <p style={{ color:C.muted, fontSize:13, marginBottom:6 }}>Biological sex</p>
          <div style={{ display:"flex", gap:8 }}>
            {[["male","Male"],["female","Female"]].map(([v,l])=><Chip key={v} color={C.accent} active={tempData.sex===v} onClick={()=>setTempData(d=>({...d,sex:v}))}>{l}</Chip>)}
          </div>
        </div>
        <div>
          <p style={{ color:C.muted, fontSize:13, marginBottom:6 }}>Workouts per week</p>
          <div style={{ display:"flex", gap:8 }}>
            {[2,3,4,5].map(n=><Chip key={n} color={C.purple} active={tempData.workoutsPerWeek===n} onClick={()=>setTempData(d=>({...d,workoutsPerWeek:n}))}>{n}x</Chip>)}
          </div>
        </div>
      </>}

      {editing==="allergies"&&<>
        <p style={{ color:C.muted, fontSize:14, marginBottom:16 }}>Select all that apply</p>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {ALLERGENS.map(a=><Chip key={a} color={C.red} active={tempData.allergies.includes(a)} onClick={()=>toggleArr("allergies",a)}>{a}</Chip>)}
        </div>
      </>}

      {editing==="dislikes"&&<>
        <p style={{ color:C.muted, fontSize:14, marginBottom:16 }}>Foods to exclude from meal plans</p>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
          {DISLIKES_LIST.map(d=><Chip key={d} color={C.orange} active={tempData.dislikes.includes(d)} onClick={()=>toggleArr("dislikes",d)}>{d}</Chip>)}
        </div>
      </>}
    </div>
  );

  const tdee = calcTDEE(profile);
  const bmi = calcBMI(profile);

  return (
    <div>
      <div style={{ textAlign:"center", padding:"24px 0 20px" }}>
        <div style={{ width:80, height:80, borderRadius:99, background:`linear-gradient(135deg, ${C.accent}, ${C.green})`, margin:"0 auto 12px", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}><img src="/leanplan_app_icon.png" alt="LeanPlan" style={{ width:"100%", height:"100%", objectFit:"cover" }} /></div>
        <h2 style={{ color:C.text, fontSize:22, fontWeight:700, margin:0 }}>{profile.name||"Your Profile"}</h2>
        <p style={{ color:C.muted, fontSize:14, margin:"4px 0 0" }}>Age {profile.age||53} · LeanPlan</p>
        {tdee&&<p style={{ color:C.accent, fontSize:14, margin:"4px 0 0", fontWeight:600 }}>TDEE: {tdee} cal · BMI: {bmi}</p>}
      </div>

      <Section title="Goals">
        <Row label="Main goal" value={profile.goal?.replace("_"," ")} onClick={()=>startEdit("goal")} />
        <Row label="Weight target" value={`${profile.targetLbs/14} stone (${profile.targetLbs} lbs)`} onClick={()=>startEdit("weight")} />
        <Row label="Weekly pace" value={`${getPace(profile.paceId||"normal").lbs} lbs/wk — ${getPace(profile.paceId||"normal").label}`} onClick={()=>startEdit("weight")} last />
      </Section>

      <Section title="My Details">
        <Row label="Height" value={profile.heightCm?`${profile.heightCm} cm`:"Not set"} onClick={()=>startEdit("details")} />
        <Row label="Age" value={profile.age||"Not set"} onClick={()=>startEdit("details")} />
        <Row label="Workouts/week" value={`${profile.workoutsPerWeek}x`} onClick={()=>startEdit("details")} last />
      </Section>

      <Section title="Diet">
        <Row label="Allergies / intolerances" value={profile.allergies?.length>0?`${profile.allergies.length} selected`:"None"} onClick={()=>startEdit("allergies")} />
        <Row label="Foods I dislike" value={profile.dislikes?.length>0?`${profile.dislikes.length} selected`:"None"} onClick={()=>startEdit("dislikes")} />
        <Row label="Always excluded" value="Fish · Oats · Cow's milk" last />
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

      {/* Pro status */}
      {isPro ? (
        <div style={{ background:`${C.green}10`, border:`1px solid ${C.green}33`, borderRadius:14, padding:"14px 16px", marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <p style={{ color:C.green, fontWeight:700, fontSize:15, margin:0 }}>✓ LeanPlan Pro</p>
              <p style={{ color:C.muted, fontSize:12, margin:"2px 0 0" }}>{proData?.plan === "annual" ? "Annual plan" : "Monthly plan"}</p>
            </div>
            <Btn small outline color={C.green} onClick={async()=>{
              if (!proData?.customerId) return;
              const res = await fetch("/api/stripe/portal",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({customerId:proData.customerId})});
              const data = await res.json();
              if (data.url) window.location.href = data.url;
            }}>Manage</Btn>
          </div>
        </div>
      ) : (
        <Btn onClick={onUpgrade} color={C.accent} style={{ width:"100%", marginBottom:16 }}>✦ Upgrade to Pro from £4.99/mo</Btn>
      )}

      <div style={{ marginTop:8 }}>
        <Btn onClick={onReset} outline color={C.red} style={{ width:"100%" }}>Reset All Data</Btn>
      </div>
      <p style={{ color:C.muted, fontSize:12, textAlign:"center", marginTop:16, lineHeight:1.6 }}>General guidance only. Consult your GP before making significant diet or exercise changes.</p>
    </div>
  );
};


// ── COACH TAB ─────────────────────────────────────────────────────────────────
const CoachTab = ({ profile, setProfile }) => {
  const [messages, setMessages] = useState([
    { role:"assistant", content:`Hi ${profile.name||"there"}! 👋 I'm your personal coach. You can ask me anything about your diet, workouts, or wellbeing — or just tell me if something isn't working for you.

For example:
• "I don't like broccoli"
• "My lower back is aching after rows"
• "What should I eat before a workout?"
• "I'm really tired this week"` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const bottomRef = useState(null);
  const messagesEndRef = { current: null };

  const showNotification = (msg, color=C.green) => {
    setNotification({ msg, color });
    setTimeout(() => setNotification(null), 3000);
  };

  const applyAction = (action) => {
    if (!action) return;
    const { type, value } = action;

    if (type === "add_dislike") {
      const v = value.trim();
      if (!profile.dislikes?.includes(v)) {
        setProfile(p => ({ ...p, dislikes: [...(p.dislikes||[]), v] }));
        showNotification(`✓ Added "${v}" to your food dislikes`, C.orange);
      }
    } else if (type === "remove_dislike") {
      const v = value.trim();
      setProfile(p => ({ ...p, dislikes: (p.dislikes||[]).filter(d => d.toLowerCase() !== v.toLowerCase()) }));
      showNotification(`✓ Removed "${v}" from your dislikes`, C.green);
    } else if (type === "add_allergy") {
      const v = value.trim();
      if (!profile.allergies?.includes(v)) {
        setProfile(p => ({ ...p, allergies: [...(p.allergies||[]), v] }));
        showNotification(`✓ Added "${v}" as an allergy — meals updated`, C.red);
      }
    } else if (type === "add_pain") {
      const existing = profile.pains || [];
      const entry = { desc: value, date: todayKey() };
      setProfile(p => ({ ...p, pains: [...existing, entry] }));
      showNotification(`✓ Pain noted — exercise suggestions adjusted`, C.pink);
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const newMessages = [...messages, { role:"user", content:text }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.filter(m => m.role !== "system"),
          profile,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages(m => [...m, { role:"assistant", content:data.text }]);
      if (data.action) applyAction(data.action);
    } catch (err) {
      setMessages(m => [...m, { role:"assistant", content:"Sorry, I couldn't connect right now. Please try again in a moment." }]);
    }
    setLoading(false);
  };

  const handleKey = e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  const SUGGESTIONS = [
    "I don't like cauliflower",
    "My lower back is aching",
    "What should I eat before a workout?",
    "I'm feeling really tired this week",
    "Can I eat more on training days?",
    "I'm bored of chicken",
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 180px)" }}>
      {/* Notification toast */}
      {notification && (
        <div style={{ position:"fixed", top:80, left:"50%", transform:"translateX(-50%)", background:notification.color, color:"#fff", borderRadius:12, padding:"10px 18px", fontSize:14, fontWeight:600, zIndex:100, boxShadow:"0 4px 16px rgba(0,0,0,0.15)", whiteSpace:"nowrap" }}>
          {notification.msg}
        </div>
      )}

      {/* Pain log if any */}
      {(profile.pains||[]).length > 0 && (
        <div style={{ background:`${C.red}08`, border:`1px solid ${C.red}22`, borderRadius:12, padding:"10px 14px", marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
            <Icon name="warning" size={13} color={C.red} />
            <p style={{ color:C.red, fontSize:12, fontWeight:700, margin:0 }}>LOGGED PAIN / INJURIES</p>
          </div>
          {(profile.pains||[]).map((p,i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:C.textSec, padding:"2px 0" }}>
              <span>{p.desc}</span>
              <span style={{ color:C.muted, fontSize:11 }}>{fmtDate(p.date)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", marginBottom:12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start", marginBottom:10 }}>
            {m.role==="assistant" && (
              <div style={{ width:30, height:30, borderRadius:99, background:`linear-gradient(135deg, ${C.pink}, ${C.purple})`, display:"flex", alignItems:"center", justifyContent:"center", marginRight:8, flexShrink:0, marginTop:2 }}>
                <Icon name="tip" size={15} color="#fff" />
              </div>
            )}
            <div style={{
              maxWidth:"78%",
              background: m.role==="user" ? C.accent : C.card,
              color: m.role==="user" ? "#fff" : C.text,
              borderRadius: m.role==="user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              padding:"11px 14px",
              fontSize:14,
              lineHeight:1.65,
              boxShadow:"0 1px 3px rgba(0,0,0,0.08)",
              border: m.role==="assistant" ? `1px solid ${C.border}` : "none",
              whiteSpace:"pre-wrap",
            }}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:30, height:30, borderRadius:99, background:`linear-gradient(135deg, ${C.pink}, ${C.purple})`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Icon name="tip" size={15} color="#fff" />
            </div>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:"18px 18px 18px 4px", padding:"12px 16px" }}>
              <div style={{ display:"flex", gap:4 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width:7, height:7, borderRadius:99, background:C.muted, animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={el => { messagesEndRef.current = el; if(el) el.scrollIntoView({behavior:"smooth"}); }} />
      </div>

      {/* Quick suggestions (only if no user messages yet) */}
      {messages.filter(m=>m.role==="user").length === 0 && (
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
          {SUGGESTIONS.map((s,i) => (
            <span key={i} onClick={() => { setInput(s); }} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:99, padding:"6px 12px", fontSize:12, color:C.textSec, cursor:"pointer", boxShadow:"0 1px 2px rgba(0,0,0,0.05)" }}>{s}</span>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask your coach anything..."
          rows={1}
          style={{ flex:1, background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"12px 14px", fontSize:15, fontFamily:FONT, color:C.text, outline:"none", resize:"none", lineHeight:1.5, maxHeight:100, overflowY:"auto", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}
          onInput={e => { e.target.style.height="auto"; e.target.style.height=Math.min(e.target.scrollHeight,100)+"px"; }}
        />
        <button onClick={send} disabled={!input.trim()||loading} style={{ width:44, height:44, borderRadius:99, background:input.trim()&&!loading?C.pink:"#e5e5ea", border:"none", cursor:input.trim()&&!loading?"pointer":"default", display:"flex", alignItems:"center", justifyContent:"center", transition:"background 0.2s", flexShrink:0 }}>
          <Icon name="arrow" size={20} color="#fff" />
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
};


// ── PRO BANNER ────────────────────────────────────────────────────────────────
const ProBanner = ({ onUpgrade }) => (
  <div onClick={onUpgrade} style={{ background:"linear-gradient(135deg, #b8860b, #ffd700, #f4a800)", borderRadius:14, padding:"12px 16px", marginBottom:14, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:"0 4px 16px rgba(212,160,23,0.35)" }}>
    <div>
      <p style={{ color:"#1a1000", fontWeight:800, fontSize:14, margin:0 }}>✦ Unlock LeanPlan Pro</p>
      <p style={{ color:"rgba(0,0,0,0.6)", fontSize:12, margin:"2px 0 0" }}>AI coach, workouts, tracking & more from £4.99/mo</p>
    </div>
    <div style={{ background:"rgba(0,0,0,0.15)", borderRadius:99, padding:"6px 14px" }}>
      <span style={{ color:"#1a1000", fontWeight:800, fontSize:13 }}>Upgrade →</span>
    </div>
  </div>
);

// ── LOCKED TAB ────────────────────────────────────────────────────────────────
const LockedTab = ({ feature, onUpgrade }) => (
  <div style={{ textAlign:"center", padding:"60px 20px" }}>
    <div style={{ width:72, height:72, borderRadius:99, background:`${C.accent}15`, border:`2px solid ${C.accent}33`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
      <Icon name="target" size={32} color={C.accent} />
    </div>
    <h2 style={{ color:C.text, fontSize:22, fontWeight:700, marginBottom:10 }}>Pro Feature</h2>
    <p style={{ color:C.muted, fontSize:15, lineHeight:1.7, marginBottom:28, maxWidth:280, margin:"0 auto 28px" }}>{feature} is available on LeanPlan Pro.</p>
    <Btn onClick={onUpgrade} color={C.accent} style={{ width:"100%", maxWidth:280 }}>✦ Unlock Pro from £4.99/mo</Btn>
    <p style={{ color:C.muted, fontSize:12, marginTop:14 }}>Cancel anytime. No commitment.</p>
  </div>
);

// ── PAYWALL MODAL ─────────────────────────────────────────────────────────────
const PaywallModal = ({ onClose }) => {
  const [selectedPlan, setSelectedPlan] = useState("annual");
  const [loading, setLoading] = useState(false);

  const plans = [
    {
      id: "annual",
      label: "Annual",
      price: "£39.99",
      per: "/ year",
      monthly: "£3.33/mo",
      badge: "SAVE 33%",
      badgeColor: C.green,
      desc: "Best value"
    },
    {
      id: "monthly",
      label: "Monthly",
      price: "£4.99",
      per: "/ month",
      monthly: null,
      badge: null,
      desc: "Flexible"
    }
  ];

  const proFeatures = [
    { icon:"meals", text:"AI meal plan generation — tailored to your diet" },
    { icon:"tip", text:"Personal AI health coach — available 24/7" },
    { icon:"train", text:"Full workout tracking & lift progression" },
    { icon:"track", text:"Body measurements, BMI & progress charts" },
    { icon:"bag", text:"Smart shopping lists with supermarket links" },
    { icon:"water", text:"Water tracker, journal & daily streaks" },
  ];

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
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setLoading(false);
    } catch(err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)" }} />

      {/* Sheet */}
      <div style={{ position:"relative", background:C.bg, borderRadius:"24px 24px 0 0", padding:"24px 20px 40px", maxHeight:"90vh", overflowY:"auto" }}>
        {/* Handle */}
        <div style={{ width:36, height:4, background:C.divider, borderRadius:99, margin:"0 auto 20px" }} />

        {/* Close */}
        <button onClick={onClose} style={{ position:"absolute", top:20, right:20, background:C.sectionBg, border:"none", borderRadius:99, width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Icon name="close" size={16} color={C.muted} />
        </button>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ fontSize:40, marginBottom:8 }}>💪</div>
          <h2 style={{ color:C.text, fontSize:24, fontWeight:800, margin:"0 0 6px" }}>LeanPlan <span style={{ color:C.accent }}>Pro</span></h2>
          <p style={{ color:C.muted, fontSize:14, margin:0 }}>Everything you need to reach your goal</p>
        </div>

        {/* Features */}
        <div style={{ marginBottom:24 }}>
          {proFeatures.map((f,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 0", borderBottom:i<proFeatures.length-1?`1px solid ${C.border}`:"none" }}>
              <div style={{ width:32, height:32, borderRadius:10, background:`${C.accent}15`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Icon name={f.icon} size={16} color={C.accent} />
              </div>
              <span style={{ color:C.text, fontSize:14 }}>{f.text}</span>
            </div>
          ))}
        </div>

        {/* Plan picker */}
        <div style={{ display:"flex", gap:10, marginBottom:20 }}>
          {plans.map(p => (
            <div key={p.id} onClick={()=>setSelectedPlan(p.id)} style={{ flex:1, border:`2px solid ${selectedPlan===p.id?C.accent:C.border}`, borderRadius:16, padding:"14px 12px", cursor:"pointer", background:selectedPlan===p.id?`${C.accent}08`:C.card, transition:"all 0.2s", position:"relative", textAlign:"center" }}>
              {p.badge && <div style={{ position:"absolute", top:-10, left:"50%", transform:"translateX(-50%)", background:p.badgeColor, color:"#fff", borderRadius:99, padding:"2px 10px", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>{p.badge}</div>}
              <div style={{ color:selectedPlan===p.id?C.accent:C.muted, fontSize:12, fontWeight:600, marginBottom:4 }}>{p.label}</div>
              <div style={{ color:C.text, fontSize:22, fontWeight:800 }}>{p.price}</div>
              <div style={{ color:C.muted, fontSize:12 }}>{p.per}</div>
              {p.monthly && <div style={{ color:C.green, fontSize:11, fontWeight:600, marginTop:4 }}>{p.monthly}</div>}
            </div>
          ))}
        </div>

        {/* CTA */}
        <Btn onClick={checkout} disabled={loading} color={C.accent} style={{ width:"100%", fontSize:17, padding:"16px 0", marginBottom:12 }}>
          {loading ? "Loading..." : `Start Pro — ${selectedPlan==="annual"?"£39.99/year":"£4.99/month"}`}
        </Btn>

        <p style={{ color:C.muted, fontSize:12, textAlign:"center", lineHeight:1.6 }}>
          Cancel anytime in your account settings. Secure payment by Stripe. By subscribing you agree to our terms.
        </p>
      </div>
    </div>
  );
};

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("Today");
  const [isPro, setIsPro] = useState(false);
  const [proData, setProData] = useState(null); // {customerId, subscriptionId, plan}
  const [showPaywall, setShowPaywall] = useState(false);
  const [entries, setEntries] = useState([]);
  const [favourites, setFavourites] = useState([]);
  const [removed, setRemoved] = useState([]);
  const [mealLog, setMealLog] = useState({});
  const [workoutLog, setWorkoutLog] = useState({});
  const [water, setWater] = useState({});
  const [journal, setJournal] = useState({});
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkOverride, setDarkOverride] = useState(null); // null=system, true=force dark, false=force light
  const [systemDark, setSystemDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Listen to system dark mode changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = e => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Check for Stripe return
  useEffect(()=>{
    const params = new URLSearchParams(window.location.search);
    const proStatus = params.get("pro");
    const sessionId = params.get("session_id");
    if (proStatus === "success" && sessionId) {
      fetch(`/api/stripe/verify?session_id=${sessionId}`)
        .then(r => r.json())
        .then(data => {
          if (data.pro) {
            setIsPro(true);
            setProData({ customerId: data.customerId, subscriptionId: data.subscriptionId, plan: data.plan });
            localStorage.setItem("leanplan_pro", JSON.stringify({ isPro: true, customerId: data.customerId, subscriptionId: data.subscriptionId, plan: data.plan }));
          }
        })
        .catch(()=>{});
      window.history.replaceState({}, "", "/");
    }
    // Load saved pro status
    try {
      const savedPro = localStorage.getItem("leanplan_pro");
      if (savedPro) {
        const pd = JSON.parse(savedPro);
        if (pd.isPro) { setIsPro(true); setProData(pd); }
      }
    } catch(e){}
  }, []);

  useEffect(()=>{
    try {
      const raw = localStorage.getItem("leanplan_v4");
      if (raw) {
        const d = JSON.parse(raw);
        if (d.profile) setProfile(d.profile);
        if (d.entries) setEntries(d.entries);
        if (d.favourites) setFavourites(d.favourites);
        if (d.removed) setRemoved(d.removed);
        if (d.mealLog) setMealLog(d.mealLog);
        if (d.workoutLog) setWorkoutLog(d.workoutLog);
        if (d.water) setWater(d.water);
        if (d.journal) setJournal(d.journal);
        if (d.measurements) setMeasurements(d.measurements);
        if (d.darkOverride !== undefined) setDarkOverride(d.darkOverride);
      }
    } catch(e){}
    setLoading(false);
  },[]);

  useEffect(()=>{
    if (loading) return;
    try { localStorage.setItem("leanplan_v4", JSON.stringify({profile,entries,favourites,removed,mealLog,workoutLog,water,journal,measurements,darkOverride})); } catch(e){}
  },[profile,entries,favourites,removed,mealLog,workoutLog,water,journal,measurements,darkOverride,loading]);

  const loadBg = systemDark ? "#000" : "#f2f2f7";
  const loadText = systemDark ? "#8e8e93" : "#8e8e93";
  if (loading) return <div style={{ minHeight:"100vh", background:loadBg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:FONT }}><div style={{ textAlign:"center" }}><div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
        <img src="/leanplan_app_icon.png" alt="" style={{ height:52, width:52, objectFit:"contain", borderRadius:12 }} />
        <span style={{ fontSize:28, fontWeight:800, letterSpacing:"-0.02em", fontFamily:FONT }}>
          <span style={{ color:loadBg==="#000"?"#fff":"#000" }}>Lean</span><span style={{ color:"#0a84ff" }}>Plan</span>
        </span>
      </div>
      <p style={{ color:loadText }}>Loading...</p></div></div>;

  if (!profile) return <Onboarding onDone={p=>setProfile(p)} />;

  // Apply theme
  const isDark = darkOverride !== null ? darkOverride : systemDark;
  C = isDark ? DARK : LIGHT;

  const cur = entries.length>0?entries[entries.length-1].weight:profile.startWeightLbs;
  const lost = Math.max(0,profile.startWeightLbs-cur);
  const pct = Math.min(100,Math.round((lost/profile.targetLbs)*100));
  const TAB_COLORS = {Today:"#007aff",Meals:"#34c759",Train:"#5ac8fa",Track:"#af52de",Coach:"#ff2d55",Profile:"#ff9500"};

  const handleReset = () => {
    if (window.confirm("Reset all data?")) {
      localStorage.removeItem("leanplan_v4");
      localStorage.removeItem("leanplan_lifts");
      setProfile(null); setEntries([]); setFavourites([]); setRemoved([]);
      setMealLog({}); setWorkoutLog({}); setWater({}); setJournal({}); setMeasurements([]);
    }
  };

  return (
    <div style={{ background:C.bg, minHeight:"100vh", fontFamily:FONT, color:C.text, width:"100%", overflowX:"hidden" }}>
      <style>{`* { box-sizing:border-box; margin:0; padding:0; } input,select,textarea { outline:none; } html,body { width:100%; overflow-x:hidden; background:${C.bg}; font-family:${FONT}; color-scheme:${isDark?"dark":"light"}; } #root { width:100%; } ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-thumb { background:${C.divider}; border-radius:4px; } ::placeholder { color:${C.muted}; }`}</style>

      <div style={{ padding:"52px 18px 12px", background:isDark?"rgba(0,0,0,0.85)":"rgba(242,242,247,0.95)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, zIndex:10, width:"100%" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center" }}>
              <span style={{ fontSize:22, fontWeight:800, letterSpacing:"-0.02em", fontFamily:FONT }}>
                <span style={{ color:isDark?"#ffffff":"#3d3d3d" }}>Lean</span><span style={{ color:"#3d8ef0" }}>Plan</span>
              </span>
            </div>
            <p style={{ fontSize:11, color:C.muted, margin:0 }}>{profile.name?.toUpperCase()||"YOUR PLAN"}</p>
          </div>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"6px 14px", textAlign:"right", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
            <div><span style={{ color:C.green, fontWeight:700, fontSize:16 }}>{lost.toFixed(1)}</span><span style={{ color:C.muted, fontSize:13 }}> / {profile.targetLbs} lbs</span></div>
            <div style={{ background:C.border, borderRadius:99, height:3, marginTop:4, overflow:"hidden", width:80 }}>
              <div style={{ width:`${pct}%`, height:"100%", background:`linear-gradient(90deg, ${C.accent}, ${C.green})`, borderRadius:99 }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding:"16px 14px 100px" }}>
        {/* Pro upgrade banner for free users */}
        {!isPro && <ProBanner onUpgrade={()=>setShowPaywall(true)} />}

        {tab==="Today"&&<TodayTab profile={profile} entries={entries} mealLog={mealLog} workoutLog={workoutLog} water={water} setWater={setWater} journal={journal} setJournal={setJournal} measurements={measurements} />}
        {tab==="Meals"&&<MealsTab profile={profile} favourites={favourites} setFavourites={setFavourites} removed={removed} setRemoved={setRemoved} mealLog={mealLog} setMealLog={setMealLog} isPro={isPro} onUpgrade={()=>setShowPaywall(true)} />}
        {tab==="Train"&&(isPro ? <TrainTab profile={profile} workoutLog={workoutLog} setWorkoutLog={setWorkoutLog} /> : <LockedTab feature="Workout tracking, lift tracker and rest day planner" onUpgrade={()=>setShowPaywall(true)} />)}
        {tab==="Track"&&(isPro ? <TrackTab profile={profile} entries={entries} setEntries={fn=>setEntries(typeof fn==="function"?fn(entries):fn)} measurements={measurements} setMeasurements={setMeasurements} /> : <LockedTab feature="Progress tracking, measurements and body stats" onUpgrade={()=>setShowPaywall(true)} />)}
        {tab==="Coach"&&(isPro ? <CoachTab profile={profile} setProfile={setProfile} /> : <LockedTab feature="AI personal coach" onUpgrade={()=>setShowPaywall(true)} />)}
        {tab==="Profile"&&<ProfileTab profile={profile} setProfile={setProfile} onReset={handleReset} isDark={isDark} darkOverride={darkOverride} setDarkOverride={setDarkOverride} isPro={isPro} proData={proData} onUpgrade={()=>setShowPaywall(true)} />}

        {/* Paywall modal */}
        {showPaywall && <PaywallModal onClose={()=>setShowPaywall(false)} />}
      </div>

      <div style={{ position:"fixed", bottom:0, left:0, right:0, width:"100%", background:isDark?"rgba(0,0,0,0.85)":"rgba(242,242,247,0.95)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderTop:`1px solid ${C.border}`, display:"flex", padding:"8px 0 20px" }}>
        {TABS.map(t=>{
          const col=TAB_COLORS[t]; const active=tab===t;
          return <div key={t} onClick={()=>setTab(t)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", cursor:"pointer", gap:3 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:active?col:"transparent", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s" }}>
              <Icon name={TAB_ICON_MAP[t]} size={20} color={active?"#fff":C.muted} />
            </div>
            <span style={{ fontSize:10, fontWeight:active?700:600, color:active?col:"#555" }}>{t}</span>
          </div>;
        })}
      </div>
    </div>
  );
}
