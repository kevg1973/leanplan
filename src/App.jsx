import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase.js";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif";
const toKg = lbs => (lbs * 0.453592).toFixed(1);
const fromKg = kg => parseFloat((kg * 2.20462).toFixed(1));

// ── Trial system ──────────────────────────────────────────────────────────────
const TRIAL_DAYS = 7;
const getTrialStart = () => localStorage.getItem("leanplan_trial_start");
const setTrialStart = () => { if (!getTrialStart()) localStorage.setItem("leanplan_trial_start", new Date().toISOString()); };
const getTrialDaysLeft = () => {
  const start = getTrialStart();
  if (!start) return TRIAL_DAYS;
  const days = Math.floor((Date.now() - new Date(start)) / (1000 * 60 * 60 * 24));
  return Math.max(0, TRIAL_DAYS - days);
};
const isTrialActive = () => getTrialDaysLeft() > 0;
const isTrialExpired = () => getTrialStart() && getTrialDaysLeft() === 0;

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
  { id:"slow",   label:"Steady",     lbs:0.5512, kgPerWk:0.25, color:C.green,  desc:"0.25 kg/week — very sustainable, minimal hunger.", warning:null },
  { id:"normal", label:"Moderate",   lbs:1.1023, kgPerWk:0.5,  color:C.accent, desc:"0.5 kg/week — the gold standard for sustainable fat loss.", warning:null },
  { id:"fast",   label:"Active",     lbs:1.6535, kgPerWk:0.75, color:C.orange, desc:"0.75 kg/week — achievable with consistent training.", warning:"⚠️ Requires a strict 375 cal/day deficit. Keep protein at 120g+ to protect muscle." },
  { id:"vfast",  label:"Aggressive", lbs:2.2046, kgPerWk:1.0,  color:C.red,    desc:"1 kg/week — maximum recommended rate.", warning:"🚨 Upper safe limit. Risks muscle loss and fatigue. Requires 500 cal/day deficit. Consult your GP if you have health concerns." },
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

// ── Exercise Database ─────────────────────────────────────────────────────────
const EXERCISE_DB = [
  // CHEST
  {name:"Dumbbell Bench Press",muscle:"chest",equip:["dumbbells"],avoid:[],tip:"Lower slowly over 3 seconds. Full range of motion.",
   steps:["Lie flat on a bench holding dumbbells at chest height, palms facing forward","Plant feet flat on the floor, arch your lower back slightly","Press the dumbbells up and slightly inward until arms are fully extended","Lower slowly over 3 seconds back to chest height","Keep shoulder blades squeezed together throughout"],
   mistakes:["Flaring elbows out too wide — keep at 45-75°","Bouncing the weight off your chest","Not lowering to full depth"],
   muscles:"Pectorals (primary) · Triceps · Front deltoids"},
  {name:"Dumbbell Incline Press",muscle:"chest",equip:["dumbbells"],avoid:["shoulders"],tip:"30-45° incline. Targets upper chest.",
   steps:["Set bench to 30-45° incline — higher angle shifts work to shoulders","Sit back with dumbbells resting on thighs, kick up to starting position","Press up and slightly inward, keeping wrists straight","Lower slowly with control, feeling a stretch in the upper chest","Don't let dumbbells drift too wide at the bottom"],
   mistakes:["Setting bench too steep (turns it into a shoulder press)","Losing the arch in your back","Rushing the descent"],
   muscles:"Upper pectorals (primary) · Triceps · Front deltoids"},
  {name:"Dumbbell Flyes",muscle:"chest",equip:["dumbbells"],avoid:["shoulders"],tip:"Slight bend in elbow. Feel the stretch at the bottom.",
   steps:["Lie flat, hold dumbbells above chest with a slight bend in elbows","Open arms wide in a wide arc, like hugging a barrel","Feel a deep stretch in the chest at the bottom","Squeeze chest to bring dumbbells back together at the top","Keep the same elbow angle throughout — don't let it change"],
   mistakes:["Straightening arms completely (stresses elbow joints)","Going too heavy — this is an isolation move","Not feeling the stretch at the bottom"],
   muscles:"Pectorals (primary) · Front deltoids"},
  {name:"Cable Chest Flye",muscle:"chest",equip:["cables"],avoid:[],tip:"Keep chest up. Squeeze hard at the top.",
   steps:["Set pulleys to chest height, stand in the middle","Hold handles with arms wide, slight bend in elbows","Step forward slightly to feel tension at the start","Bring handles together in front of chest in a wide arc","Squeeze chest hard for 1 second at the top, return with control"],
   mistakes:["Letting the cables pull you back too fast","Standing too upright — lean forward slightly","Using too much arm instead of chest"],
   muscles:"Pectorals (primary) · Front deltoids"},
  {name:"Push Up",muscle:"chest",equip:["bodyweight"],avoid:["wrists"],tip:"Body straight as a plank. Go to the floor.",
   steps:["Start in plank position, hands slightly wider than shoulder-width","Keep body in a straight line from head to heels","Lower chest to the floor, keeping elbows at 45-75°","Push through palms to return to start","Squeeze glutes and core throughout"],
   mistakes:["Hips sagging or piking up","Head dropping forward","Not going to full depth"],
   muscles:"Pectorals (primary) · Triceps · Core"},
  {name:"Close-Grip Push Up",muscle:"chest",equip:["bodyweight"],avoid:["wrists","shoulders"],tip:"Hands shoulder-width. Works triceps hard too.",
   steps:["Set up in push up position with hands directly under shoulders","Keep elbows tucked close to your body as you lower","Lower chest between your hands to the floor","Push back up explosively","Keep body rigid throughout"],
   mistakes:["Letting elbows flare outward","Losing core tension","Partial range of motion"],
   muscles:"Triceps (primary) · Inner pectorals · Shoulders"},
  // BACK
  {name:"Seated Cable Row",muscle:"back",equip:["cables"],avoid:[],tip:"Drive elbows back. Squeeze shoulder blades together.",
   steps:["Sit at the cable row station with feet on pads, knees slightly bent","Hold the handle with both hands, sit upright with chest up","Pull the handle to your lower abdomen, driving elbows back","Squeeze shoulder blades together hard at the end","Return slowly, allowing shoulders to protract forward slightly"],
   mistakes:["Rounding the lower back","Using momentum to jerk the weight","Not squeezing at the end of the movement"],
   muscles:"Latissimus dorsi · Rhomboids · Rear deltoids · Biceps"},
  {name:"Lat Pulldown",muscle:"back",equip:["cables"],avoid:[],tip:"Pull to upper chest. Lean back slightly.",
   steps:["Sit at lat pulldown station, secure thighs under pads","Grip bar wider than shoulder-width, lean back 10-15°","Pull bar down to upper chest, driving elbows down and back","Squeeze lats hard at the bottom position","Return slowly over 2-3 seconds, feeling the stretch overhead"],
   mistakes:["Pulling bar behind the neck (neck injury risk)","Using too much momentum","Not leaning back enough to clear the bar"],
   muscles:"Latissimus dorsi (primary) · Biceps · Rear deltoids"},
  {name:"Single-Arm Dumbbell Row",muscle:"back",equip:["dumbbells"],avoid:["back"],tip:"Support on bench. Elbow close to body.",
   steps:["Place one knee and hand on a bench for support","Hold dumbbell in opposite hand, let it hang straight down","Pull dumbbell up to hip height, keeping elbow close to body","Squeeze the lat hard at the top, hold 1 second","Lower with full control, getting a stretch at the bottom"],
   mistakes:["Rotating the torso to get the weight up","Pulling with the bicep rather than the back","Not getting a full stretch at the bottom"],
   muscles:"Latissimus dorsi · Rhomboids · Rear deltoids · Biceps"},
  {name:"Dumbbell Bent-Over Row",muscle:"back",equip:["dumbbells"],avoid:["back"],tip:"Hinge at hips, back flat. Pull to hip.",
   steps:["Stand with feet hip-width, hinge forward at hips to 45°","Keep back flat, core braced, slight bend in knees","Hold dumbbells hanging straight down","Pull both dumbbells to hip height simultaneously","Lower with control, maintaining the hip hinge position"],
   mistakes:["Rounding the lower back — always keep it neutral","Using momentum to swing the weight up","Standing too upright"],
   muscles:"Latissimus dorsi · Rhomboids · Rear deltoids · Biceps"},
  {name:"Face Pulls",muscle:"back",equip:["cables"],avoid:[],tip:"Elbows high and wide. Essential for shoulder health.",
   steps:["Set cable pulley to face height, attach rope handle","Stand back, hold rope with overhand grip, thumbs facing you","Pull rope to face level, keeping elbows high and out to the sides","At the end position, externally rotate — hands go back past ears","Return with control, keeping tension on the cable"],
   mistakes:["Dropping elbows — they must stay high throughout","Going too heavy — this is a corrective exercise","Pulling to the neck rather than face level"],
   muscles:"Rear deltoids · Rotator cuff · Rhomboids"},
  {name:"Straight-Arm Pulldown",muscle:"back",equip:["cables"],avoid:[],tip:"Arms straight, pull to hips. Great lat isolation.",
   steps:["Stand at high cable pulley, hold bar with arms extended overhead","Keep arms straight with a very slight elbow bend","Pull bar down in a wide arc to your thighs","Feel lats contracting hard at the bottom","Return slowly, feeling a stretch in the lats overhead"],
   mistakes:["Bending elbows — turns it into a pulldown","Leaning back excessively","Not getting a full stretch at the top"],
   muscles:"Latissimus dorsi (primary) · Triceps (long head)"},
  {name:"Pull Up",muscle:"back",equip:["bodyweight"],avoid:["shoulders"],tip:"Full hang to chin over bar. Control the descent.",
   steps:["Hang from bar with hands slightly wider than shoulders, overhand grip","Depress shoulder blades (pull shoulders away from ears) before pulling","Drive elbows down toward hips as you pull up","Get chin above the bar — don't strain neck forward","Lower with full control over 3 seconds to a dead hang"],
   mistakes:["Kipping or swinging — use strict form","Not going to a full dead hang between reps","Crossing feet — keep body straight"],
   muscles:"Latissimus dorsi (primary) · Biceps · Rear deltoids"},
  {name:"Inverted Row",muscle:"back",equip:["bodyweight"],avoid:[],tip:"Body rigid. Pull chest to bar.",
   steps:["Set bar at waist height in a rack or use a sturdy table","Hang underneath with straight body, heels on floor","Keep body rigid like a plank throughout","Pull chest to bar, squeezing shoulder blades together","Lower with full control"],
   mistakes:["Letting hips sag to make it easier","Not pulling all the way to the bar","Too easy? Elevate feet to increase difficulty"],
   muscles:"Rhomboids · Rear deltoids · Biceps · Core"},
  // LEGS
  {name:"Goblet Squat",muscle:"legs",equip:["dumbbells"],avoid:[],tip:"Sit back into heels. Knees track over toes.",
   steps:["Hold one dumbbell vertically at chest height with both hands","Stand with feet shoulder-width, toes turned out slightly","Push hips back and down, keeping chest upright","Lower until thighs are parallel or below — sit into it","Drive through heels to stand, squeezing glutes at the top"],
   mistakes:["Heels lifting off the floor — work on ankle mobility","Chest falling forward","Knees caving inward — push them out over toes"],
   muscles:"Quadriceps · Glutes · Hamstrings · Core"},
  {name:"Dumbbell Squat",muscle:"legs",equip:["dumbbells"],avoid:[],tip:"Feet shoulder-width. Chest up throughout.",
   steps:["Hold dumbbells at sides, stand with feet shoulder-width","Brace core, keep chest tall throughout","Push hips back as you lower, knees tracking over toes","Descend to parallel or just below","Drive through the whole foot to return to standing"],
   mistakes:["Leaning too far forward","Knees caving inward","Partial range of motion"],
   muscles:"Quadriceps · Glutes · Hamstrings"},
  {name:"Leg Press",muscle:"legs",equip:["gym_machines"],avoid:[],tip:"Feet high on plate reduces knee stress.",
   steps:["Sit in the machine with back and head against the pad","Place feet high on the platform, shoulder-width apart","Release the safety handles and lower the platform","Lower until knees reach 90° or slightly below","Press through the whole foot back to start — don't lock knees out"],
   mistakes:["Feet too low — increases knee strain significantly","Letting knees cave inward","Locking knees out at the top"],
   muscles:"Quadriceps (primary) · Glutes · Hamstrings"},
  {name:"Romanian Deadlift",muscle:"legs",equip:["dumbbells"],avoid:["back"],tip:"Hinge at hips, soft knees, back flat.",
   steps:["Stand holding dumbbells in front of thighs","Soft bend in knees — this stays constant throughout","Push hips back as you lower the dumbbells down your legs","Lower until you feel a strong hamstring stretch (usually mid-shin)","Drive hips forward to return to standing, squeezing glutes"],
   mistakes:["Rounding the lower back — fatal error on this exercise","Bending knees like a regular squat","Not feeling it in the hamstrings"],
   muscles:"Hamstrings (primary) · Glutes · Lower back"},
  {name:"Dumbbell Lunge",muscle:"legs",equip:["dumbbells"],avoid:["knees"],tip:"Long stride. Front knee stays over ankle.",
   steps:["Stand holding dumbbells at your sides","Take a long stride forward with one foot","Lower back knee toward the floor, keeping front shin vertical","Push through front heel to return to standing","Alternate legs or complete all reps on one side"],
   mistakes:["Front knee shooting forward past the toes","Short stride — makes it much harder on knees","Leaning trunk forward"],
   muscles:"Quadriceps · Glutes · Hamstrings · Core"},
  {name:"Bulgarian Split Squat",muscle:"legs",equip:["dumbbells"],avoid:["knees"],tip:"Rear foot elevated. Most knee-friendly split squat.",
   steps:["Stand 2 feet in front of a bench, rest rear foot on it","Hold dumbbells at sides, keep torso upright","Lower straight down until front thigh is parallel to floor","Drive through front heel to return to start","Keep front shin as vertical as possible"],
   mistakes:["Standing too close to the bench — causes knee stress","Leaning forward excessively","Moving front knee inward"],
   muscles:"Quadriceps · Glutes · Hamstrings"},
  {name:"Seated Leg Curl",muscle:"legs",equip:["gym_machines"],avoid:[],tip:"Curl slowly, control the return.",
   steps:["Sit in the machine with the pad resting on your lower shins","Adjust so knees align with the machine's pivot point","Curl legs downward, squeezing hamstrings hard","Hold the contracted position for 1 second","Return slowly over 3 seconds — don't let the weight crash"],
   mistakes:["Lifting hips off the seat to use momentum","Too fast on the return — the eccentric is where growth happens","Incomplete range of motion"],
   muscles:"Hamstrings (primary) · Calves"},
  {name:"Leg Extension",muscle:"legs",equip:["gym_machines"],avoid:["knees"],tip:"Full extension. Pause at top.",
   steps:["Sit in machine with the pad on your lower shins, just above the ankle","Adjust back pad so knees align with the pivot point","Extend legs to full lockout, squeezing quads hard","Hold for 1 second at the top","Lower slowly over 3 seconds"],
   mistakes:["Using momentum to swing the weight up","Not reaching full extension","Going too heavy — this is an isolation exercise"],
   muscles:"Quadriceps (primary)"},
  {name:"Hip Thrust",muscle:"legs",equip:["dumbbells","barbell"],avoid:["back"],tip:"Drive through heels. Hard squeeze at the top.",
   steps:["Sit with upper back against a bench, weight resting on hips","Plant feet flat on the floor, hip-width apart","Drive hips upward by squeezing glutes hard","At the top, body should be parallel to the floor","Lower with control and repeat — don't let hips touch the floor"],
   mistakes:["Pushing through toes instead of heels","Not reaching full hip extension","Hyperextending the lower back at the top"],
   muscles:"Glutes (primary) · Hamstrings"},
  {name:"Weighted Glute Bridge",muscle:"legs",equip:["dumbbells","bodyweight"],avoid:[],tip:"Weight on hips. Squeeze glutes hard at top.",
   steps:["Lie on your back, knees bent, feet flat on floor","Place dumbbell or weight on your hips, hold it in place","Drive hips up by squeezing glutes — not pushing with lower back","At the top, thighs and torso should form a straight line","Lower slowly and repeat"],
   mistakes:["Using lower back instead of glutes to push up","Feet too far or too close to body","Not fully squeezing at the top"],
   muscles:"Glutes (primary) · Hamstrings · Core"},
  {name:"Standing Calf Raise",muscle:"legs",equip:["bodyweight","dumbbells"],avoid:[],tip:"Full range. Pause at top and bottom.",
   steps:["Stand on the edge of a step or flat floor, holding dumbbells","Rise up onto the balls of your feet as high as possible","Pause for 1 second at the top — really squeeze the calves","Lower slowly below the starting point for a full stretch","Pause at the bottom before the next rep"],
   mistakes:["Partial range of motion — calves respond to full stretch","Going too fast — slow controlled reps work best","Not pausing at top or bottom"],
   muscles:"Gastrocnemius · Soleus"},
  {name:"Seated Calf Raise",muscle:"legs",equip:["gym_machines","dumbbells"],avoid:[],tip:"Slow and controlled. Full range.",
   steps:["Sit with knees at 90°, place weight or machine pad on thighs","Place balls of feet on a step or platform","Drive up onto the balls of feet as high as possible","Pause and squeeze at the top","Lower slowly for a full stretch"],
   mistakes:["Bouncing at the bottom","Not getting a full stretch","Too heavy — reduces range of motion"],
   muscles:"Soleus (primary) · Gastrocnemius"},
  {name:"Wall Sit",muscle:"legs",equip:["bodyweight"],avoid:["knees"],tip:"90 degrees. Hold as long as possible.",
   steps:["Stand with back against a smooth wall","Slide down until thighs are parallel to the floor","Feet should be directly below knees — not in front","Keep back flat against the wall throughout","Arms can rest on thighs or extended forward — don't use them to push"],
   mistakes:["Thighs not reaching parallel","Feet too far forward — reduces muscle work","Using hands to push off thighs"],
   muscles:"Quadriceps (primary) · Glutes"},
  {name:"Step Up",muscle:"legs",equip:["bodyweight","dumbbells"],avoid:["knees"],tip:"Drive through the heel. Full extension at top.",
   steps:["Stand in front of a sturdy box or bench","Step up with one foot, placing the whole foot on the surface","Drive through that heel to lift your body up","Bring the trailing leg up to stand fully on the box","Step back down with control and repeat"],
   mistakes:["Pushing off the back foot — defeats the purpose","Leaning forward excessively","Box too high for current strength level"],
   muscles:"Quadriceps · Glutes · Hamstrings"},
  // SHOULDERS
  {name:"Seated Dumbbell Shoulder Press",muscle:"shoulders",equip:["dumbbells"],avoid:["shoulders"],tip:"Seated protects the back. Full range overhead.",
   steps:["Sit on a bench with back support, hold dumbbells at shoulder height","Palms facing forward, elbows at 90° to start","Press dumbbells directly overhead until arms are almost fully extended","Lower with control back to shoulder height","Keep core braced and back against the pad"],
   mistakes:["Arching lower back excessively","Not reaching full extension overhead","Elbows flaring too far forward"],
   muscles:"Deltoids (primary) · Triceps · Upper trapezius"},
  {name:"Standing Dumbbell Shoulder Press",muscle:"shoulders",equip:["dumbbells"],avoid:["shoulders","back"],tip:"Core tight. Don't arch back.",
   steps:["Stand with feet shoulder-width, core braced throughout","Hold dumbbells at shoulder height, palms facing forward","Press overhead until arms are almost fully extended","Lower with control — don't let dumbbells drift forward","Squeeze core to prevent lower back arching"],
   mistakes:["Leaning back to press — lower back injury risk","Using leg drive to push the weight up","Dropping elbows too low between reps"],
   muscles:"Deltoids (primary) · Triceps · Core"},
  {name:"Lateral Raise",muscle:"shoulders",equip:["dumbbells"],avoid:["shoulders"],tip:"Slight bend in elbow. Lead with the elbow.",
   steps:["Stand holding light dumbbells at sides, slight bend in elbows","Raise arms out to the sides, leading with the elbows not the hands","Stop when arms reach shoulder height — parallel to floor","Pause briefly, then lower slowly over 3 seconds","Keep a slight forward lean to better target the middle delt"],
   mistakes:["Going too heavy — ruins form completely","Raising arms above shoulder height","Shrugging shoulders up as you raise"],
   muscles:"Medial deltoids (primary) · Supraspinatus"},
  {name:"Cable Lateral Raise",muscle:"shoulders",equip:["cables"],avoid:["shoulders"],tip:"Slow and controlled. Constant tension.",
   steps:["Stand sideways to a low cable pulley","Hold the handle with the far hand across your body","Raise arm out to the side up to shoulder height","Keep a slight bend in the elbow throughout","Lower slowly — the cable keeps tension even at the bottom"],
   mistakes:["Swinging the cable up with momentum","Letting the cable crash back down","Standing too far from the machine"],
   muscles:"Medial deltoids (primary)"},
  {name:"Front Raise",muscle:"shoulders",equip:["dumbbells"],avoid:["shoulders"],tip:"Alternate arms. No swinging.",
   steps:["Stand holding dumbbells in front of thighs, palms facing back","Raise one arm straight forward to shoulder height","Pause briefly at the top, then lower slowly","Alternate arms with each rep","Keep a very slight bend in the elbow"],
   mistakes:["Swinging the body to generate momentum","Going above shoulder height","Using too much weight"],
   muscles:"Front deltoids (primary) · Upper pectorals"},
  {name:"Reverse Fly",muscle:"shoulders",equip:["dumbbells"],avoid:[],tip:"Hinge forward. Arms out to sides.",
   steps:["Hold dumbbells, hinge forward at hips to roughly parallel to floor","Let dumbbells hang beneath you, palms facing each other","Raise arms out to the sides in a wide arc","Squeeze rear deltoids hard at the top","Lower slowly — don't let the weight pull you down"],
   mistakes:["Standing too upright — reduces rear delt activation","Going too heavy","Bending elbows to compensate for weight"],
   muscles:"Rear deltoids (primary) · Rhomboids · Trapezius"},
  {name:"Upright Row",muscle:"shoulders",equip:["dumbbells","cables"],avoid:["shoulders"],tip:"Elbows high. Pull to chin level.",
   steps:["Hold dumbbells in front of thighs, overhand grip","Pull straight up, leading with elbows — they go high and wide","Raise until dumbbells reach chin height","Elbows should be above wrist level at the top","Lower slowly back to starting position"],
   mistakes:["Pulling too narrow — stresses shoulder joint","Pulling above chin height","Going too heavy"],
   muscles:"Medial deltoids · Upper trapezius · Biceps"},
  {name:"Arnold Press",muscle:"shoulders",equip:["dumbbells"],avoid:["shoulders"],tip:"Rotate palms as you press. Great range of motion.",
   steps:["Sit holding dumbbells in front of face, palms facing you (like a curl finish)","As you press up, rotate palms to face forward","Finish with arms extended overhead, palms facing away","Reverse the rotation as you lower","This rotation hits all three heads of the deltoid"],
   mistakes:["Doing it too fast — the rotation is the point","Not sitting supported — use a bench with back rest","Going too heavy"],
   muscles:"All three deltoid heads · Triceps"},
  // ARMS
  {name:"Dumbbell Bicep Curl",muscle:"arms",equip:["dumbbells"],avoid:[],tip:"Elbows pinned to sides. Squeeze at top.",
   steps:["Stand holding dumbbells at sides, palms facing forward","Keep upper arms completely still throughout","Curl the weight up toward your shoulders","Squeeze biceps hard at the top for 1 second","Lower slowly over 3 seconds — this is where growth happens"],
   mistakes:["Elbows swinging forward — massively reduces effectiveness","Using momentum to swing the weight up","Dropping the weight on the way down"],
   muscles:"Biceps brachii (primary) · Brachialis"},
  {name:"Hammer Curl",muscle:"arms",equip:["dumbbells"],avoid:[],tip:"Neutral grip. Works brachialis too.",
   steps:["Hold dumbbells at sides with palms facing your body (neutral grip)","Keep upper arms still, curl weights up","The neutral grip targets the brachialis and brachioradialis too","Squeeze at the top, lower slowly","Can be done alternating or both arms simultaneously"],
   mistakes:["Rotating to a supinated grip midway through","Elbows drifting forward","Rushing through reps"],
   muscles:"Brachialis · Biceps brachii · Brachioradialis"},
  {name:"Cable Bicep Curl",muscle:"arms",equip:["cables"],avoid:[],tip:"Constant tension. Keep elbows still.",
   steps:["Stand at a low cable pulley, hold the bar with underhand grip","Keep elbows pinned at sides throughout","Curl the bar up toward your chin","Squeeze hard at the top — cables keep tension here unlike dumbbells","Lower slowly, the cable provides resistance all the way down"],
   mistakes:["Stepping too close so cable goes slack at top","Swinging elbows forward","Not going to full extension at the bottom"],
   muscles:"Biceps brachii (primary) · Brachialis"},
  {name:"Incline Dumbbell Curl",muscle:"arms",equip:["dumbbells"],avoid:[],tip:"Full stretch. Great for peak contraction.",
   steps:["Set bench to 45-60° incline, sit back with arms hanging","The incline puts biceps in a fully stretched position","Curl both dumbbells up, keeping upper arms vertical","Squeeze hard at the top","Lower very slowly — this stretched position is where it's most effective"],
   mistakes:["Not letting arms hang fully at the bottom","Going too heavy — ruins the stretch","Sitting the bench too upright"],
   muscles:"Biceps brachii (primary — long head emphasis)"},
  {name:"Tricep Rope Pushdown",muscle:"arms",equip:["cables"],avoid:[],tip:"Flare the rope at the bottom. Full extension.",
   steps:["Stand at high cable, hold rope with palms facing each other","Tuck elbows at sides — they don't move at all during the exercise","Push rope down until arms are fully extended","At the bottom, flare rope ends out to the sides","Squeeze triceps hard, return slowly"],
   mistakes:["Elbows drifting away from the body","Leaning forward too much","Not reaching full extension"],
   muscles:"Triceps brachii (all three heads)"},
  {name:"Overhead Tricep Extension",muscle:"arms",equip:["dumbbells","cables"],avoid:["shoulders","elbows"],tip:"Keep elbows close to head.",
   steps:["Hold one dumbbell with both hands overhead, arms extended","Lower the dumbbell behind your head by bending elbows","Keep elbows pointing straight up — don't let them flare","Feel a deep stretch in the triceps at the bottom","Press back up to full extension"],
   mistakes:["Elbows flaring out to the sides","Not getting a full stretch","Using too much weight — elbows won't stay up"],
   muscles:"Triceps brachii (long head primary)"},
  {name:"Tricep Dip",muscle:"arms",equip:["bodyweight"],avoid:["shoulders","wrists"],tip:"Body close to bench. Go until upper arms are parallel.",
   steps:["Sit on edge of a bench, hands gripping the edge beside hips","Slide off the bench, supporting weight on hands","Lower by bending elbows, keeping body close to the bench","Lower until upper arms are parallel to floor","Press back up to start"],
   mistakes:["Dipping too deep — stresses shoulder joint","Body drifting away from the bench","Partial range of motion"],
   muscles:"Triceps brachii (primary) · Front deltoids"},
  {name:"Skull Crusher",muscle:"arms",equip:["dumbbells","barbell"],avoid:["elbows"],tip:"Lower slowly to forehead. Elbows stay fixed.",
   steps:["Lie flat on bench holding dumbbells or barbell above chest","Upper arms should be perpendicular to the floor throughout","Lower the weight toward your forehead by bending elbows only","Stop just above your forehead — don't actually hit it","Extend arms back to the starting position"],
   mistakes:["Elbows flaring outward","Moving upper arms — turns it into a press","Going too heavy"],
   muscles:"Triceps brachii (primary)"},
  {name:"Close-Grip Bench Press",muscle:"arms",equip:["dumbbells","barbell"],avoid:[],tip:"Shoulder-width grip. Tuck elbows.",
   steps:["Lie on bench, grip bar just inside shoulder-width","Unrack the bar, lower to lower chest area","Keep elbows tucked at about 45° — don't flare","Press back up, squeezing triceps at the top","The closer grip shifts emphasis from chest to triceps"],
   mistakes:["Grip too narrow — stresses wrists","Elbows flaring like a regular bench press","Touching bar too high on chest"],
   muscles:"Triceps brachii (primary) · Inner pectorals"},
  // CORE
  {name:"Dead Bug",muscle:"core",equip:["bodyweight"],avoid:[],tip:"Press lower back into floor. Move slowly.",
   steps:["Lie on back with arms pointing straight up toward ceiling","Bring knees up to 90°, shins parallel to floor","Press lower back firmly into the floor — maintain this throughout","Slowly lower opposite arm and leg toward the floor","Return to start and repeat on the other side"],
   mistakes:["Lower back arching off the floor — the whole point is preventing this","Moving too fast","Holding your breath — breathe throughout"],
   muscles:"Transverse abdominis · Rectus abdominis · Hip flexors"},
  {name:"Plank",muscle:"core",equip:["bodyweight"],avoid:["wrists","shoulders"],tip:"Body rigid. Breathe steadily.",
   steps:["Start in push up position or on forearms","Keep body in a perfectly straight line from head to heels","Squeeze glutes, brace abs, don't let hips sag or pike","Look at the floor, keeping neck neutral","Breathe steadily — don't hold your breath"],
   mistakes:["Hips sagging — most common error","Hips too high (piking)","Holding breath"],
   muscles:"Transverse abdominis · Rectus abdominis · Glutes · Shoulders"},
  {name:"Side Plank",muscle:"core",equip:["bodyweight"],avoid:["wrists","shoulders"],tip:"Stack feet. Hold or add hip dips.",
   steps:["Lie on your side, prop yourself on one forearm","Stack feet on top of each other","Lift hips until body is in a straight line from head to feet","Hold the position, breathing steadily","For more difficulty: add hip dips or raise the top leg"],
   mistakes:["Hips sagging toward the floor","Top hip rotating forward or backward","Neck straining"],
   muscles:"Obliques (primary) · Core · Glutes"},
  {name:"Pallof Press",muscle:"core",equip:["cables","resistance_bands"],avoid:[],tip:"Anti-rotation. Brace hard. Don't let band pull you.",
   steps:["Stand sideways to a cable or band anchored at chest height","Hold the handle at your chest with both hands","Brace your core hard — this is an anti-rotation exercise","Press hands straight out in front, resisting the rotation","Hold for 2 seconds extended, then return to chest"],
   mistakes:["Rotating toward the cable — you're supposed to resist this","Standing too close — reduces the challenge","Going too heavy"],
   muscles:"Obliques (primary) · Transverse abdominis"},
  {name:"Cable Crunch",muscle:"core",equip:["cables"],avoid:["back"],tip:"Round the spine. Pull with abs not arms.",
   steps:["Kneel at a high cable pulley holding a rope behind your head","Hinge at the hips slightly, then crunch down by rounding the spine","Pull elbows toward knees — the movement comes from the abs","Squeeze hard at the bottom position","Return slowly, maintaining tension"],
   mistakes:["Pulling with your arms instead of contracting abs","Not rounding the spine — defeats the purpose","Going too heavy"],
   muscles:"Rectus abdominis (primary) · Obliques"},
  {name:"Hanging Knee Raise",muscle:"core",equip:["bodyweight"],avoid:["shoulders"],tip:"Control the swing. Pull knees to chest.",
   steps:["Hang from a pull up bar with both hands, shoulder-width","Let legs hang fully, then pull knees up toward chest","Round your lower back as you pull up — this targets abs properly","Lower with full control — don't swing","For more difficulty: raise straight legs instead"],
   mistakes:["Swinging with momentum","Not rounding the lower back — reduces ab activation","Partial range of motion"],
   muscles:"Rectus abdominis · Hip flexors"},
  {name:"Ab Wheel Rollout",muscle:"core",equip:["bodyweight"],avoid:["back","shoulders"],tip:"Start small. Engage core before rolling.",
   steps:["Kneel on the floor holding an ab wheel or barbell with plates","Start with the wheel directly under your shoulders","Brace core hard, then roll forward slowly","Go only as far as you can control — don't let hips sag","Pull back to starting position using your abs"],
   mistakes:["Going too far too soon — lower back injury risk","Not bracing core before starting","Hips sinking during the movement"],
   muscles:"Transverse abdominis (primary) · Rectus abdominis · Lats"},
  {name:"Mountain Climber",muscle:"core",equip:["bodyweight"],avoid:["wrists","shoulders"],tip:"Hips level. Drive knees fast for cardio effect.",
   steps:["Start in a push up position, body in a straight line","Drive one knee toward the chest while keeping hips level","Quickly switch legs — like running in place in a plank","Keep hips from bouncing up and down","The faster you go, the more cardiovascular it becomes"],
   mistakes:["Hips bouncing up with each knee drive","Hands too close to feet","Looking up instead of down"],
   muscles:"Core · Hip flexors · Shoulders · Cardiovascular"},
  {name:"Bird Dog",muscle:"core",equip:["bodyweight"],avoid:[],tip:"Opposite arm and leg. Keep hips level.",
   steps:["Start on hands and knees — hands under shoulders, knees under hips","Brace core and keep back flat — don't let it sag","Extend one arm forward and opposite leg back simultaneously","Hold for 2-3 seconds, focusing on keeping hips level","Return to start and repeat on the other side"],
   mistakes:["Hips rotating — the goal is preventing this","Raising leg too high — causes lower back arch","Moving too fast"],
   muscles:"Erector spinae · Glutes · Transverse abdominis"},
  {name:"Russian Twist",muscle:"core",equip:["bodyweight","dumbbells"],avoid:["back"],tip:"Lean back slightly. Rotate with control.",
   steps:["Sit on floor with knees bent, feet either on floor or elevated","Lean back slightly to about 45°, keeping back straight","Hold a dumbbell or clasp hands in front of you","Rotate torso to one side, touching weight to the floor","Rotate to the other side — keep the movement controlled"],
   mistakes:["Rounding the back","Moving arms instead of rotating the torso","Going too fast — control is everything here"],
   muscles:"Obliques (primary) · Rectus abdominis"},
  // CARDIO
  {name:"Rowing Machine — Steady",muscle:"cardio",equip:["rowing"],avoid:[],tip:"60% legs, 20% core, 20% arms. 22-24 strokes/min.",
   steps:["Strap feet in, grip handle with overhand grip","Start with legs bent, arms extended, leaning forward slightly","Drive legs first — push through the whole foot","As legs straighten, lean back slightly and pull handle to lower chest","Return in reverse order: arms forward, lean forward, bend legs"],
   mistakes:["Pulling with arms before legs are extended","Rounding the back — keep chest tall","Stroke rate too high — slow down and add power"],
   muscles:"Legs · Core · Back · Arms — Full body"},
  {name:"Rowing Machine — Intervals",muscle:"cardio",equip:["rowing"],avoid:[],tip:"2 min moderate, 1 min hard. Repeat 5-6 times.",
   steps:["Warm up for 3-5 minutes at easy pace","Settle into moderate pace for 2 minutes (rate 22-24)","Increase power and rate for 1 minute push (rate 26-28)","Return to moderate for recovery","Repeat the 2:1 cycle 5-6 times, then cool down"],
   mistakes:["Going too hard on the easy intervals","Poor technique when tired — it'll break down, watch it","Starting too fast on the first interval"],
   muscles:"Full body cardiovascular"},
  {name:"Cross Trainer — Steady",muscle:"cardio",equip:["crosstrainer"],avoid:[],tip:"Stand upright. Don't lean on handles — use your core.",
   steps:["Set resistance to a moderate level","Stand tall, don't lean on the handles — use them lightly for balance only","Maintain a smooth, consistent cadence — aim for 60-80 RPM","Engage your core, keep shoulders relaxed","Breathe rhythmically — in through nose, out through mouth"],
   mistakes:["Leaning on the handles — reduces calorie burn significantly","Stride too short — use the full range of motion","Hunching forward"],
   muscles:"Legs · Glutes · Cardiovascular"},
  {name:"Cross Trainer — Intervals",muscle:"cardio",equip:["crosstrainer"],avoid:[],tip:"2 min easy, 1 min resistance up. Repeat 5 times.",
   steps:["Warm up for 3 minutes at easy resistance","Maintain easy pace for 2 minutes","Increase resistance by 3-4 levels for 1 minute of hard effort","Drop back to easy resistance for recovery","Repeat 5 times, cool down for 3-5 minutes"],
   mistakes:["Not increasing resistance enough on hard intervals","Leaning on handles during the hard sections","Cadence dropping too much on higher resistance"],
   muscles:"Legs · Glutes · Cardiovascular"},
  {name:"Treadmill Walk — Incline",muscle:"cardio",equip:["treadmill"],avoid:[],tip:"10-15% incline, 3-4 mph. Burns as many calories as running.",
   steps:["Set incline to 10-15% and speed to 3-4 mph","Walk naturally — don't hold the handrails","Keep posture upright, lean slightly into the incline","Swing arms naturally to engage upper body","Maintain pace for 20-45 minutes"],
   mistakes:["Holding handrails — eliminates most of the benefit","Incline too low — won't get the calorie burn effect","Speed too fast — this is a walking exercise"],
   muscles:"Glutes · Hamstrings · Calves · Cardiovascular"},
  {name:"Treadmill Jog",muscle:"cardio",equip:["treadmill"],avoid:["knees","hips","ankles"],tip:"Easy conversational pace. Land midfoot.",
   steps:["Start at a walking pace and gradually increase speed","Aim for a pace where you can hold a conversation","Land on midfoot, not heel — reduces impact","Keep arms at 90° and relaxed","Breathe through your nose if possible — controls pace naturally"],
   mistakes:["Starting too fast","Heel striking — increases joint stress","Holding the handrails"],
   muscles:"Legs · Cardiovascular"},
  {name:"Exercise Bike — Steady",muscle:"cardio",equip:["bike"],avoid:[],tip:"RPM 80-90. Resistance moderate. Joint-friendly.",
   steps:["Adjust seat so leg has slight bend at bottom of pedal stroke","Set resistance to a level where you can maintain 80-90 RPM","Sit tall, hands light on bars","Maintain steady cadence for 20-45 minutes","Increase resistance to make it harder rather than pedalling faster"],
   mistakes:["Seat too low — causes knee strain","Bouncing on the saddle — resistance too high","Hunching forward over the bars"],
   muscles:"Quadriceps · Hamstrings · Glutes · Cardiovascular"},
  {name:"Exercise Bike — Intervals",muscle:"cardio",equip:["bike"],avoid:[],tip:"20 sec sprint, 40 sec easy. 10 rounds.",
   steps:["Warm up for 3-5 minutes at easy pace","Sprint at maximum effort for 20 seconds — really push","Recover at easy pace for 40 seconds","Repeat for 10 rounds (10 minutes total)","Cool down for 3-5 minutes"],
   mistakes:["Not going hard enough on the sprint intervals","Resistance too low — you need to feel it","Starting too fast and fading"],
   muscles:"Full cardiovascular · Legs"},
  {name:"Bodyweight Circuit",muscle:"cardio",equip:["bodyweight"],avoid:[],tip:"Squats, push ups, lunges, plank. 40 sec on, 20 sec rest.",
   steps:["Perform each exercise for 40 seconds with 20 seconds rest","Exercise 1: Squats — full range, controlled pace","Exercise 2: Push ups — to the floor if possible","Exercise 3: Alternating lunges — long stride","Exercise 4: Plank — hold rigid","Repeat the circuit 3-4 times"],
   mistakes:["Rushing through exercises with poor form","Not resting enough between circuits","Skipping the plank — it's essential for core"],
   muscles:"Full body · Cardiovascular"},
];


// ── Periodisation Blocks ───────────────────────────────────────────────────────
// 4-week blocks rotating through different training focuses
const PERIODISATION_BLOCKS = [
  {
    id: 1,
    name: "Foundation",
    subtitle: "Week 1-4 · Build the base",
    color: "#34c759",
    focus: "Learning movements, building work capacity",
    reps: "12-15",
    rest: "60 sec",
    sets: 3,
    intensity: "60-65% effort",
    note: "Focus on form over weight. These weeks build the foundation for everything that follows. By week 4 you should feel the exercises becoming natural.",
    weeklyNote: ["Focus on perfect form — weight doesn't matter yet.", "Add a little weight if the last 2 reps feel easy.", "You should be feeling stronger. Push the weight slightly.", "Deload week — use 60% of your usual weight. Let your body recover."],
  },
  {
    id: 2,
    name: "Hypertrophy",
    subtitle: "Week 5-8 · Build muscle",
    color: "#007aff",
    focus: "Muscle growth, higher volume",
    reps: "8-12",
    rest: "75 sec",
    sets: 4,
    intensity: "70-75% effort",
    note: "This is where muscle is built. The extra set and heavier weight creates the stimulus your body needs to grow. Track your weights — beat last week every session.",
    weeklyNote: ["Heavier than Foundation block. Should be challenging by rep 10.", "Add weight if you completed all reps last week.", "Last 2 reps should be a real struggle.", "Deload — 60% weight. This week makes next week's gains happen."],
  },
  {
    id: 3,
    name: "Strength",
    subtitle: "Week 9-12 · Get stronger",
    color: "#ff9500",
    focus: "Maximum strength, low reps heavy weight",
    reps: "5-8",
    rest: "90 sec",
    sets: 4,
    intensity: "80-85% effort",
    note: "Heavy work. Fewer reps, more weight, longer rest. This block drives strength gains that carry into all future blocks. Don't rush the rest periods.",
    weeklyNote: ["Heavy. Rep 6-7 should feel very hard.", "Add small increments — even 1kg matters at this intensity.", "Push for new personal bests this week.", "Deload — 50% weight. Full recovery before the next cycle."],
  },
  {
    id: 4,
    name: "Power & Conditioning",
    subtitle: "Week 13-16 · Peak performance",
    color: "#ff2d55",
    focus: "Explosive power, fitness and fat burn",
    reps: "Mixed",
    rest: "45-60 sec",
    sets: 4,
    intensity: "75-80% effort",
    note: "Combines strength and cardio. Shorter rest periods keep heart rate elevated. This block burns the most calories and brings everything together.",
    weeklyNote: ["Mix of strength and cardio. Keep rest short.", "Increase either weight or cardio intensity.", "Push harder on conditioning pieces.", "Final deload. You've completed a full cycle — reset and start stronger."],
  },
];

// Get current training block based on start date
const getCurrentBlock = (profile) => {
  if (!profile?.trainingStartDate) return PERIODISATION_BLOCKS[0];
  const weeksSinceStart = Math.floor((Date.now() - new Date(profile.trainingStartDate)) / (7 * 24 * 60 * 60 * 1000));
  const blockIndex = Math.floor(weeksSinceStart / 4) % PERIODISATION_BLOCKS.length;
  const weekInBlock = (weeksSinceStart % 4); // 0-3
  return { ...PERIODISATION_BLOCKS[blockIndex], weekInBlock };
};

// Build a workout from the exercise database filtered by user profile
const buildWorkout = (type, profile, block) => {
  const userEquip = profile?.equipment || ["dumbbells","bodyweight"];
  const userInjuries = profile?.injuries?.filter(i=>i!=="none") || [];
  const fitnessLevel = profile?.fitnessLevel || "beginner";
  const workoutStyle = profile?.workoutStyle || "mixed";

  // Filter exercises by available equipment and injuries
  const available = EXERCISE_DB.filter(ex => {
    if (ex.equip.length > 0 && !ex.equip.some(e => userEquip.includes(e))) return false;
    if (ex.avoid.some(a => userInjuries.includes(a))) return false;
    return true;
  });

  const byMuscle = (muscle) => available.filter(ex => ex.muscle === muscle);

  // Adjust sets/reps based on block
  const blockSets = block?.sets || 3;
  const blockReps = block?.reps || "12-15";
  const blockRest = block?.rest || "60 sec";

  // Adjust sets for beginners
  const sets = fitnessLevel === "beginner" ? Math.max(2, blockSets - 1) : blockSets;

  const pick = (arr, n=1) => [...arr].sort(()=>Math.random()-0.5).slice(0,n);

  let exercises = [];

  if (type === "full-body") {
    exercises = [
      ...pick(byMuscle("chest"), 1),
      ...pick(byMuscle("back"), 2),
      ...pick(byMuscle("legs"), 2),
      ...pick(byMuscle("shoulders"), 1),
      ...pick(byMuscle("core"), 1),
    ];
    if (userEquip.some(e=>["rowing","crosstrainer","treadmill","bike"].includes(e))) {
      exercises.push(...pick(byMuscle("cardio").filter(ex=>ex.equip.some(e=>userEquip.includes(e))), 1));
    }
  } else if (type === "upper-body") {
    exercises = [
      ...pick(byMuscle("chest"), 2),
      ...pick(byMuscle("back"), 2),
      ...pick(byMuscle("shoulders"), 1),
      ...pick(byMuscle("arms"), 2),
    ];
  } else if (type === "lower-body") {
    exercises = [
      ...pick(byMuscle("legs"), 4),
      ...pick(byMuscle("core"), 2),
    ];
  } else if (type === "cardio") {
    const cardioExercises = byMuscle("cardio").filter(ex=>ex.equip.some(e=>userEquip.includes(e)));
    exercises = pick(cardioExercises.length > 0 ? cardioExercises : byMuscle("cardio"), 3);
  } else if (type === "strength") {
    exercises = [
      ...pick(byMuscle("chest"), 1),
      ...pick(byMuscle("back"), 2),
      ...pick(byMuscle("legs"), 2),
      ...pick(byMuscle("shoulders"), 1),
    ];
  }

  return exercises.filter(Boolean).map(ex => ({
    name: ex.name,
    sets,
    reps: blockReps,
    rest: blockRest,
    equipment: ex.equip.join("/"),
    tip: ex.tip,
    muscle: ex.muscle,
  }));
};

// Legacy WORKOUTS kept for structure/colors/warmups/cooldowns
const WORKOUTS = {
  "full-body":   { title:"Full Body Strength & Cardio", duration:55, color:"#007aff",
    warmup:["5 min light cardio","Arm circles x10","Hip circles x10","Bodyweight squats x10","Shoulder rotations x10"],
    cooldown:["5 min easy cardio","Hamstring stretch x30 sec each","Hip flexor stretch x30 sec","Chest stretch x30 sec","Cat-cow x10"],
    note:"Hits every major muscle group. Most efficient workout for fat loss and muscle maintenance." },
  "upper-body":  { title:"Upper Body Strength", duration:50, color:"#af52de",
    warmup:["5 min light cardio","Arm circles x15","Wall slides x10","Band pull-aparts x15"],
    cooldown:["Shoulder stretch x30 sec each","Chest stretch x30 sec","Tricep stretch x30 sec","Neck rolls x5"],
    note:"Upper body days produce the most visible change. Focus on the mind-muscle connection." },
  "lower-body":  { title:"Lower Body & Core", duration:50, color:"#34c759",
    warmup:["5 min light cardio","Clamshells x15 each","Glute bridges x15","Ankle circles x10","Leg swings x10"],
    cooldown:["Figure-4 stretch x40 sec each","Hamstring stretch x30 sec each","Calf stretch x30 sec","Child's pose x30 sec"],
    note:"Strong legs and glutes protect your back and burn the most calories at rest." },
  "cardio":      { title:"Low-Impact Cardio", duration:45, color:"#ff9500",
    warmup:["3 min very easy pace","Dynamic stretches","Hip circles x10"],
    cooldown:["5 min easy pace","Full body stretch","Breathing: 4 in, 6 out x8"],
    note:"Low-impact cardio burns serious calories with zero joint stress. Consistency beats intensity." },
  "strength":    { title:"Progressive Strength", duration:60, color:"#ff2d55",
    warmup:["5 min light cardio","Shoulder rotations x10","Hip hinges x10","Activation sets x10"],
    cooldown:["10 min easy cardio","Full stretch routine","Foam roller if available"],
    note:"Heavy compound movements elevate metabolism for 24-48 hours after training." },
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

const Chip = ({ children, color=C.accent, active, onClick }) => {
  // In light mode, inactive chips need darker text for readability
  const inactiveTextColor = (() => {
    // Convert hex to RGB to check if colour is too light
    const hex = color.replace("#","");
    const r = parseInt(hex.slice(0,2),16);
    const g = parseInt(hex.slice(2,4),16);
    const b = parseInt(hex.slice(4,6),16);
    const luminance = (0.299*r + 0.587*g + 0.114*b)/255;
    // If colour is very light, darken it for inactive state
    return luminance > 0.6 ? "#555" : color;
  })();
  return (
    <span onClick={onClick} style={{ background:active?color:`${color}12`, color:active?"#fff":inactiveTextColor, border:`1.5px solid ${active?color:`${color}55`}`, borderRadius:99, padding:"5px 12px", fontSize:12, fontWeight:600, cursor:onClick?"pointer":"default", transition:"all 0.2s", display:"inline-block", whiteSpace:"nowrap", flexShrink:0 }}>{children}</span>
  );
};

const Toggle = ({ value, onChange }) => (
  <div onClick={()=>onChange(!value)} style={{ width:51, height:31, borderRadius:99, background:value?C.accent:"#e5e5ea", cursor:"pointer", position:"relative", transition:"background 0.2s", flexShrink:0 }}>
    <div style={{ position:"absolute", top:2, left:value?22:2, width:27, height:27, borderRadius:99, background:"#fff", boxShadow:"0 2px 4px rgba(0,0,0,0.2)", transition:"left 0.2s" }} />
  </div>
);

const TInput = ({ value, onChange, placeholder, type="text", style={} }) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{ background:C.card, border:`1.5px solid ${C.divider}`, borderRadius:10, color:C.text, padding:"12px 14px", fontSize:15, fontFamily:FONT, outline:"none", width:"100%", ...style }} />
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
              <span style={{ color:p.color, fontSize:12, fontWeight:700 }}>{p.kgPerWk} kg/wk</span>
            </div>
            <div style={{ color:C.muted, fontSize:11 }}>{Math.round((targetLbs*0.453592)/p.kgPerWk)} wks</div>
          </div>
        ))}
      </div>
      <div style={{ background:`${selected.color}10`, border:`1px solid ${selected.color}33`, borderRadius:12, padding:"12px 14px", marginBottom:selected.warning?10:0 }}>
        <p style={{ color:C.text, fontSize:14, margin:0 }}>📅 <strong style={{ color:selected.color }}>{etaWeeks} weeks</strong> to reach your goal</p>
        <p style={{ color:C.textSec, fontSize:12, margin:"4px 0 0" }}>{selected.desc}</p>
      </div>
      {selected.warning&&<div style={{ background:"#ff3b3010", border:"1px solid #ff3b3033", borderRadius:12, padding:"10px 14px" }}><p style={{ color:C.red, fontSize:13, margin:0, lineHeight:1.6 }}>{selected.warning}</p></div>}
    </div>
  );
};

// ── Onboarding ────────────────────────────────────────────────────────────────
const TOTAL_STEPS = 14;

// Scroll picker component

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

const Onboarding = ({ onDone }) => {
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
    cookingTime:"moderate", sleepQuality:"average",
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
      {step===12&&<div style={{ flex:1, display:"flex", flexDirection:"column", padding:"0 24px 48px" }}>
        <Header step={step} />
        <div style={{ flex:1, paddingTop:8 }}>
          <h2 style={{ color:"#fff", fontSize:32, fontWeight:800, margin:"0 0 8px" }}>Dietary preferences</h2>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:16, marginBottom:24 }}>We'll make sure your meals avoid anything that doesn't work for you</p>
          <div style={{ marginBottom:20 }}>
            <p style={{ color:"rgba(255,255,255,0.6)", fontSize:13, fontWeight:600, letterSpacing:"0.06em", marginBottom:12 }}>DAIRY</p>
            <div style={{ display:"flex", flexWrap:"wrap" }}>
              {[["full_dairy","Full dairy"],["lactose_free","Lactose-free"],["dairy_free","Dairy-free"]].map(([v,l])=><OChip key={v} label={l} selected={data.dairyPref===v} onClick={()=>update("dairyPref",v)} />)}
            </div>
          </div>
          <div style={{ marginBottom:20 }}>
            <p style={{ color:"rgba(255,255,255,0.6)", fontSize:13, fontWeight:600, letterSpacing:"0.06em", marginBottom:12 }}>GLUTEN</p>
            <div style={{ display:"flex", flexWrap:"wrap" }}>
              {[["regular","Regular"],["gluten_free","Gluten-free"]].map(([v,l])=><OChip key={v} label={l} selected={data.glutenPref===v} onClick={()=>update("glutenPref",v)} />)}
            </div>
          </div>
          <div style={{ marginBottom:24 }}>
            <p style={{ color:"rgba(255,255,255,0.6)", fontSize:13, fontWeight:600, letterSpacing:"0.06em", marginBottom:12 }}>ALLERGIES</p>
            <div style={{ display:"flex", flexWrap:"wrap" }}>
              {ALLERGENS.map(a=><OChip key={a} label={a} selected={data.allergies.includes(a)} onClick={()=>toggleArr("allergies",a)} />)}
            </div>
          </div>
        </div>
        <OBtn onClick={next}>Continue →</OBtn>
      </div>}

      {/* Step 13 — Supplements */}
      {step===13&&<div style={{ flex:1, display:"flex", flexDirection:"column", padding:"0 24px 48px", overflowY:"auto" }}>
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

      {/* Step 14 — Equipment & building plan */}
      {step===14&&<div style={{ flex:1, display:"flex", flexDirection:"column", padding:"0 24px 48px" }}>
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
        <OBtn onClick={finish} disabled={data.equipment.length===0}>Build My Plan →</OBtn>
      </div>}
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

// ── Daily Tip Splash Screen ───────────────────────────────────────────────────
const TipSplashScreen = ({ tip, onDismiss }) => {
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
        <img src="/leanplan_splash_logo.png" alt="LeanPlan" style={{ height:42, objectFit:"contain" }} />
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

const TodayTab = ({ profile, entries, mealLog, workoutLog, water, setWater, journal, setJournal, measurements }) => {
  const [tipIdx, setTipIdx] = useState(()=>Math.floor(Math.random()*DAILY_TIPS.length));
  const [showJournal, setShowJournal] = useState(false);
  const today = todayKey();
  const cur = entries.length>0?entries[entries.length-1].weight:profile.startWeightLbs;
  const lost = Math.max(0,profile.startWeightLbs-cur);
  const lostKg = parseFloat((lost*0.453592).toFixed(1));
  const pace = getPace(profile.paceId||"normal");
  const pct = profile.targetLbs>0?Math.min(100,Math.round((lost/profile.targetLbs)*100)):0;
  const eta = profile.targetLbs>0?Math.ceil((profile.targetLbs-lost)/pace.lbs):0;
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

  const [showCalories, setShowCalories] = useState(true);

  return (
    <div>
      {/* Hero — compact */}
      <div style={{ background:`linear-gradient(145deg, ${C.accent}, #5ac8fa)`, borderRadius:16, padding:"14px 16px", marginBottom:12, color:"#fff" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <div>
            <p style={{ opacity:0.85, fontSize:12, margin:"0 0 1px" }}>Hello{profile.name?`, ${profile.name}`:""}  👋</p>
            <h2 style={{ fontSize:18, fontWeight:700, margin:0 }}>{profile.targetLbs>0?`Lose ${toKg(profile.targetLbs)} kg`:profile.goal?.replace(/_/g," ")||"Get Healthy"}</h2>
          </div>
          <div style={{ textAlign:"right" }}>
            <p style={{ opacity:0.9, fontSize:16, fontWeight:700, margin:"0 0 1px" }}>{pct}%</p>
            <p style={{ opacity:0.7, fontSize:11, margin:0 }}>{lostKg}kg lost</p>
          </div>
        </div>
        <div style={{ background:"rgba(255,255,255,0.25)", borderRadius:99, height:5, overflow:"hidden" }}>
          <div style={{ width:`${pct}%`, height:"100%", background:"rgba(255,255,255,0.9)", borderRadius:99, transition:"width 0.6s" }} />
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:4, opacity:0.7, fontSize:10 }}>
          <span>{profile.startWeightLbs?toKg(profile.startWeightLbs):"—"} kg start</span>
          <span>~{eta>0?eta:0} wks to go</span>
          <span>{toKg(cur)} kg now</span>
        </div>
      </div>

      {/* Weekly summary on Mondays */}
      {isMonday&&lastWeekWorkouts>0&&<Card style={{ background:`${C.green}08`, borderColor:`${C.green}33`, marginBottom:12 }}>
        <p style={{ color:C.green, fontSize:13, margin:0 }}>🎯 Last week: <strong>{lastWeekWorkouts} workout{lastWeekWorkouts!==1?"s":""}</strong> — {lastWeekWorkouts>=profile.workoutsPerWeek?"Goal hit!":"keep pushing!"}</p>
      </Card>}

      {/* Quick stats row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, marginBottom:14 }}>
        <StatBox label="Calories" val={todayCalories||"—"} sub={targetCals?`/ ${targetCals}`:""} color={targetCals&&todayCalories>targetCals?C.red:C.accent} />
        <StatBox label="Protein" val={todayProtein>0?`${todayProtein}g`:"—"} sub="120g+" color={todayProtein>=120?C.green:C.orange} />
        <StatBox label="Water" val={`${(todayWater*0.25).toFixed(1)}L`} sub="/ 2.0L" color={C.teal} />
        <StatBox label="Streak" val={`${streak}d`} color={streak>=7?C.orange:C.purple} />
      </div>

      {/* Today's actions - compact row */}
      <div style={{ display:"flex", gap:8, marginBottom:14 }}>
        <div style={{ flex:1, background:C.card, borderRadius:14, padding:"12px 10px", border:`1px solid ${C.border}`, textAlign:"center" }}>
          <div style={{ fontSize:20, marginBottom:2 }}>{todayWorked?"✅":"🏋️"}</div>
          <div style={{ color:C.text, fontSize:11, fontWeight:600, lineHeight:1.3 }}>{todayWorked?todayWorked.type.split("-").join(" "):"No workout"}</div>
        </div>
        <div style={{ flex:1, background:C.card, borderRadius:14, padding:"12px 10px", border:`1px solid ${C.border}`, textAlign:"center" }}>
          <div style={{ fontSize:20, marginBottom:2 }}>🍽️</div>
          <div style={{ color:C.text, fontSize:11, fontWeight:600 }}>{todayMeals.length} meals logged</div>
        </div>
        <div style={{ flex:1, background:C.card, borderRadius:14, padding:"12px 10px", border:`1px solid ${C.border}`, textAlign:"center" }}>
          <div style={{ fontSize:20, marginBottom:2 }}>⚖️</div>
          <div style={{ color:C.text, fontSize:11, fontWeight:600 }}>{toKg(cur)} kg</div>
        </div>
      </div>

      {/* Water tracker */}
      <Card style={{ marginBottom:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}><Icon name="water" size={14} color={C.teal} /><p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", margin:0 }}>WATER</p></div>
          <span style={{ color:C.teal, fontWeight:700, fontSize:13 }}>{(todayWater*0.25).toFixed(2)}L / 2.0L</span>
        </div>
        <ProgressBar value={todayWater} max={8} color={C.teal} height={8} />
        <div style={{ display:"flex", gap:8, marginTop:10 }}>
          <Btn onClick={()=>setWater(w=>({...w,[today]:Math.max(0,(w[today]||0)-1)}))} color={C.teal} outline small style={{ flex:1 }}>− 250ml</Btn>
          <Btn onClick={()=>setWater(w=>({...w,[today]:Math.min(16,(w[today]||0)+1)}))} color={C.teal} small style={{ flex:2 }}>+ 250ml</Btn>
        </div>
      </Card>

      {/* Calorie targets — collapsible */}
      {tdee&&<Card style={{ marginBottom:14, cursor:"pointer" }} onClick={()=>setShowCalories(s=>!s)}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <Icon name="flame" size={14} color={C.orange} />
            <p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", margin:0 }}>CALORIE TARGETS</p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ color:C.accent, fontWeight:700, fontSize:14 }}>{targetCals} cal</span>
            <span style={{ color:C.muted, fontSize:12 }}>{showCalories?"▲":"▼"}</span>
          </div>
        </div>
        {showCalories&&<div style={{ display:"flex", gap:8, marginTop:12 }}>
          <div style={{ flex:1, textAlign:"center", padding:"8px 0" }}><div style={{ color:C.text, fontSize:17, fontWeight:700 }}>{tdee}</div><div style={{ color:C.muted, fontSize:11 }}>maintenance</div></div>
          <div style={{ width:1, background:C.border }} />
          <div style={{ flex:1, textAlign:"center", padding:"8px 0" }}><div style={{ color:C.accent, fontSize:17, fontWeight:700 }}>{targetCals}</div><div style={{ color:C.muted, fontSize:11 }}>target (deficit)</div></div>
          <div style={{ width:1, background:C.border }} />
          <div style={{ flex:1, textAlign:"center", padding:"8px 0" }}><div style={{ color:C.orange, fontSize:17, fontWeight:700 }}>{pace.kgPerWk}kg</div><div style={{ color:C.muted, fontSize:11 }}>per week</div></div>
        </div>}
      </Card>}

      {/* Journal */}
      <Card>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:showJournal?12:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}><Icon name="note" size={14} color={C.muted} /><p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", margin:0 }}>DAILY JOURNAL</p></div>
          <button onClick={()=>setShowJournal(s=>!s)} style={{ background:"none", border:"none", color:C.accent, fontSize:13, cursor:"pointer", fontFamily:FONT, fontWeight:600 }}>{showJournal?"Done":"Write"}</button>
        </div>
        {showJournal&&<textarea value={journal[today]||""} onChange={e=>setJournal(j=>({...j,[today]:e.target.value}))} placeholder="How are you feeling today? Energy levels, sleep, anything notable..." style={{ width:"100%", minHeight:80, background:C.sectionBg, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 12px", fontSize:14, fontFamily:FONT, color:C.text, outline:"none", resize:"vertical" }} />}
        {!showJournal&&journal[today]&&<p style={{ color:C.textSec, fontSize:14, margin:0, marginTop:8, lineHeight:1.6 }}>{journal[today]}</p>}
      </Card>
    </div>
  );
};

// ── MEALS TAB ─────────────────────────────────────────────────────────────────
// ── Meal Loading Indicator ────────────────────────────────────────────────────
const MEAL_LOADING_MESSAGES = [
  "Checking your dietary preferences...",
  "Selecting fresh ingredients...",
  "Balancing your macros...",
  "Building your breakfast...",
  "Planning your snacks...",
  "Crafting your lunch...",
  "Finalising your dinner...",
  "Almost ready...",
];

const MealLoadingIndicator = () => {
  const [msgIndex, setMsgIndex] = useState(0);
  const [dots, setDots] = useState(1);

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMsgIndex(i => (i + 1) % MEAL_LOADING_MESSAGES.length);
    }, 1800);
    const dotTimer = setInterval(() => {
      setDots(d => d === 3 ? 1 : d + 1);
    }, 400);
    return () => { clearInterval(msgTimer); clearInterval(dotTimer); };
  }, []);

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"center", gap:6, marginBottom:14 }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{
            width:8, height:8, borderRadius:99, background:C.accent,
            opacity: 0.3,
            animation: `pulse ${0.8}s ease-in-out ${i * 0.15}s infinite alternate`,
          }} />
        ))}
      </div>
      <style>{`
        @keyframes pulse {
          from { opacity: 0.2; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
      <p style={{ color:C.text, fontSize:14, fontWeight:600, margin:"0 0 4px" }}>
        {MEAL_LOADING_MESSAGES[msgIndex]}{"·".repeat(dots)}
      </p>
      <p style={{ color:C.muted, fontSize:12, margin:0 }}>
        AI is building your personalised meal plan
      </p>
    </div>
  );
};

// ── Meal Carousel ─────────────────────────────────────────────────────────────
const MealCarousel = ({ meals, favourites, likedMeals, mealLog, today, onLike, onDislike, onLog, onRemoveLog, targetCals }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [showMethod, setShowMethod] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragDelta, setDragDelta] = useState(0);
  const [animDir, setAnimDir] = useState(null); // 'left' | 'right' | null
  const containerRef = React.useRef(null);

  const m = meals[activeIdx];
  const isFav = favourites.includes(m?.id);
  const isLogged = (mealLog[today]||[]).some(l=>l.id===m?.id);
  const isLiked = likedMeals.find(l=>l.name===m?.name);

  const goTo = (idx, dir) => {
    if (idx < 0 || idx >= meals.length) return;
    setAnimDir(dir);
    setTimeout(() => { setActiveIdx(idx); setShowMethod(false); setAnimDir(null); }, 180);
  };

  const handleTouchStart = e => {
    setDragStart(e.touches[0].clientX);
    setDragDelta(0);
  };
  const handleTouchMove = e => {
    if (dragStart === null) return;
    setDragDelta(e.touches[0].clientX - dragStart);
  };
  const handleTouchEnd = () => {
    if (Math.abs(dragDelta) > 50) {
      if (dragDelta < 0 && activeIdx < meals.length - 1) goTo(activeIdx + 1, 'left');
      else if (dragDelta > 0 && activeIdx > 0) goTo(activeIdx - 1, 'right');
    }
    setDragStart(null);
    setDragDelta(0);
  };

  const MEAL_COLORS = {
    breakfast: { grad: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", accent: "#f59e0b", label: "☀️ Breakfast" },
    snack:     { grad: "linear-gradient(135deg, #0f2027 0%, #203a43 100%)", accent: "#34d399", label: "🍎 Snack" },
    lunch:     { grad: "linear-gradient(135deg, #1a1a2e 0%, #2d1b69 100%)", accent: "#818cf8", label: "🥗 Lunch" },
    dinner:    { grad: "linear-gradient(135deg, #0f0c29 0%, #302b63 100%)", accent: "#f472b6", label: "🌙 Dinner" },
  };

  const mealType = m?.type || m?.tags?.find(t=>["breakfast","lunch","dinner","snack"].includes(t)) || "snack";
  const mc = MEAL_COLORS[mealType] || MEAL_COLORS.snack;

  const cardStyle = {
    background: mc.grad,
    borderRadius: 24,
    padding: "16px 16px 14px",
    marginBottom: 10,
    position: "relative",
    overflow: "hidden",
    transform: `translateX(${Math.max(-30, Math.min(30, dragDelta * 0.15))}px)`,
    transition: animDir ? "transform 0.18s ease, opacity 0.18s ease" : "transform 0.05s ease",
    opacity: animDir ? 0 : 1,
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    border: `1px solid rgba(255,255,255,0.08)`,
  };

  return (
    <div>
      {/* Dot nav + counter */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, padding:"0 2px" }}>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          {meals.map((_,i) => (
            <div key={i} onClick={()=>goTo(i, i>activeIdx?'left':'right')} style={{ width: i===activeIdx?20:7, height:7, borderRadius:99, background: i===activeIdx?C.accent:C.border, transition:"all 0.25s ease", cursor:"pointer" }} />
          ))}
        </div>
        <span style={{ color:C.muted, fontSize:12, fontWeight:600 }}>{activeIdx+1} / {meals.length}</span>
      </div>

      {/* Card */}
      <div
        ref={containerRef}
        style={cardStyle}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Decorative circle */}
        <div style={{ position:"absolute", top:-40, right:-40, width:160, height:160, borderRadius:"50%", background:`${mc.accent}15`, pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-20, left:-20, width:100, height:100, borderRadius:"50%", background:`${mc.accent}08`, pointerEvents:"none" }} />

        {/* Meal type label */}
        {/* Meal type label */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <span style={{ color:mc.accent, fontSize:11, fontWeight:700, letterSpacing:"0.08em", background:`${mc.accent}18`, padding:"3px 9px", borderRadius:99 }}>{mc.label.toUpperCase()}</span>
          <span style={{ color:"rgba(255,255,255,0.5)", fontSize:11 }}>{m.time}</span>
        </div>

        {/* Meal name */}
        <h3 style={{ color:"#fff", fontSize:18, fontWeight:800, margin:"0 0 8px", lineHeight:1.2, letterSpacing:"-0.01em" }}>{m.name}</h3>

        {/* Macros row */}
        <div style={{ display:"flex", gap:5, marginBottom:10 }}>
          <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:10, padding:"5px 6px", flex:1, textAlign:"center" }}>
            <div style={{ color:mc.accent, fontSize:14, fontWeight:800 }}>{m.cals}</div>
            <div style={{ color:"rgba(255,255,255,0.5)", fontSize:9, fontWeight:600, letterSpacing:"0.04em" }}>KCAL</div>
          </div>
          <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:10, padding:"5px 6px", flex:1, textAlign:"center" }}>
            <div style={{ color:"#34d399", fontSize:14, fontWeight:800 }}>{m.protein}g</div>
            <div style={{ color:"rgba(255,255,255,0.5)", fontSize:9, fontWeight:600, letterSpacing:"0.04em" }}>PROTEIN</div>
          </div>
          <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:10, padding:"5px 6px", flex:1, textAlign:"center" }}>
            <div style={{ color:"#818cf8", fontSize:14, fontWeight:800 }}>{m.carbs}g</div>
            <div style={{ color:"rgba(255,255,255,0.5)", fontSize:9, fontWeight:600, letterSpacing:"0.04em" }}>CARBS</div>
          </div>
          <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:10, padding:"5px 6px", flex:1, textAlign:"center" }}>
            <div style={{ color:"#fb923c", fontSize:14, fontWeight:800 }}>{m.fat}g</div>
            <div style={{ color:"rgba(255,255,255,0.5)", fontSize:9, fontWeight:600, letterSpacing:"0.04em" }}>FAT</div>
          </div>
        </div>

        {/* Ingredients + method — scrollable internally */}
        <div style={{ overflowY:"auto", maxHeight:140, marginBottom:8, WebkitOverflowScrolling:"touch" }}>
          {!showMethod && m.items.map((item,j) => (
            <div key={j} style={{ display:"flex", alignItems:"center", gap:8, padding:"3px 0", borderBottom: j < m.items.length-1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <div style={{ width:4, height:4, borderRadius:"50%", background:mc.accent, flexShrink:0 }} />
              <span style={{ color:"rgba(255,255,255,0.8)", fontSize:12 }}>{item}</span>
            </div>
          ))}
          {showMethod && m.method.split("\n").map((step,i) => (
            <p key={i} style={{ color:"rgba(255,255,255,0.8)", fontSize:12, lineHeight:1.6, margin:"0 0 4px" }}>{step}</p>
          ))}
        </div>

        {/* Method toggle */}
        <button
          onClick={()=>setShowMethod(v=>!v)}
          style={{ background:"rgba(255,255,255,0.08)", border:"none", borderRadius:10, padding:"7px 12px", color:mc.accent, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:FONT, width:"100%", textAlign:"left", display:"flex", justifyContent:"space-between", alignItems:"center" }}
        >
          <span>{showMethod ? "🥗 Show ingredients" : "📋 How to make this"}</span>
          <span style={{ opacity:0.6 }}>{showMethod?"▲":"▼"}</span>
        </button>
      </div>

      {/* Action buttons */}
      <div style={{ display:"flex", gap:8, marginBottom:8 }}>
        <button
          onClick={()=>onLike(m)}
          style={{ width:44, height:44, background:isLiked?`${C.green}20`:"none", border:`1.5px solid ${isLiked?C.green:C.border}`, borderRadius:12, color:C.green, fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}
          title="Like this meal"
        >👍</button>
        <button
          onClick={()=>onDislike(m)}
          style={{ width:44, height:44, background:"none", border:`1.5px solid ${C.border}`, borderRadius:12, color:C.red, fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}
          title="Never show again"
        >👎</button>
        <button
          onClick={()=>{ if(!isLogged) onLog(m); }}
          style={{ flex:1, background:isLogged?`${C.green}15`:"none", border:`1.5px solid ${isLogged?C.green:C.border}`, borderRadius:12, padding:"10px 0", color:isLogged?C.green:C.text, fontSize:14, fontWeight:700, cursor:isLogged?"default":"pointer", fontFamily:FONT, transition:"all 0.2s" }}
        >
          {isLogged ? "✓ Logged" : "+ Log Meal"}
        </button>
      </div>

      {/* Swipe hint — only on first card first visit */}
      {activeIdx === 0 && meals.length > 1 && (
        <p style={{ color:C.muted, fontSize:11, textAlign:"center", marginTop:4 }}>← Swipe to see all {meals.length} meals →</p>
      )}
    </div>
  );
};

const MealsTab =({ profile, favourites, setFavourites, removed, setRemoved, mealLog, setMealLog, isPro, isTrial, onUpgrade, shownMeals, setShownMeals }) => {
  const [style, setStyle] = useState("all");
  const shown = shownMeals;
  const setShown = setShownMeals;
  const [expanded, setExpanded] = useState(null);
  const [viewFavs, setViewFavs] = useState(false);
  const [shoppingDays, setShoppingDays] = useState(7);
  const [shoppingList, setShoppingList] = useState(null);
  const [checked, setChecked] = useState({});
  const [section, setSection] = useState("meals");
  const [suppOpen, setSuppOpen] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const MAX_GENERATIONS = 999;
  const [genCount, setGenCount] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("leanplan_gen_count") || "{}");
      if (saved.date !== todayKey()) return 0;
      if (saved.count <= 3) return 0;
      return saved.count || 0;
    } catch { return 0; }
  });

  const incrementGenCount = () => {
    const newCount = genCount + 1;
    setGenCount(newCount);
    localStorage.setItem("leanplan_gen_count", JSON.stringify({ date: todayKey(), count: newCount }));
  };
  const [dislikedMeals, setDislikedMeals] = useState(() => {
    try { return JSON.parse(localStorage.getItem("leanplan_disliked_meals") || "[]"); } catch { return []; }
  });
  const [likedMeals, setLikedMeals] = useState(() => {
    try { return JSON.parse(localStorage.getItem("leanplan_liked_meals") || "[]"); } catch { return []; }
  });

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

  const getMealType = m => m.type || m.tags?.find(t=>["breakfast","lunch","dinner","snack"].includes(t)) || "snack";

  const saveLikedMeals = (meals) => {
    setLikedMeals(meals);
    localStorage.setItem("leanplan_liked_meals", JSON.stringify(meals));
  };
  const saveDislikedMeals = (meals) => {
    setDislikedMeals(meals);
    localStorage.setItem("leanplan_disliked_meals", JSON.stringify(meals));
  };

  const likeMeal = (m) => {
    if (!likedMeals.find(l=>l.name===m.name)) {
      saveLikedMeals([...likedMeals, {name:m.name, id:m.id}]);
    }
    setFavourites(f=>f.includes(m.id)?f:[...f,m.id]);
  };

  const [showRegenerateNudge, setShowRegenerateNudge] = useState(false);

  const dislikeMeal = (m) => {
    saveDislikedMeals([...dislikedMeals.filter(d=>d!==m.name), m.name]);
    setShown(s=>s?s.filter(x=>x.id!==m.id):s);
    setShowRegenerateNudge(true);
  };

  // AI generation for Pro users
  const generateAI = async () => {
    if (genCount >= MAX_GENERATIONS) return;
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch("/api/generate-meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          dislikedMealNames: dislikedMeals,
          style,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setShown(data.meals);
      setExpanded(null);
      incrementGenCount();
      setShowRegenerateNudge(false);
    } catch(err) {
      setGenerateError("Could not generate meals. Please try again.");
      console.error(err);
    }
    setGenerating(false);
  };

  // Fallback generation for free users (from hardcoded library)
  const generateLocal = () => {
    if (genCount >= MAX_GENERATIONS) return;
    incrementGenCount();
    setShowRegenerateNudge(false);
    const pool=filtered.length>0?filtered:available;
    const byType = {
      breakfast: [...pool].filter(m=>getMealType(m)==="breakfast").sort(()=>Math.random()-0.5),
      snack:     [...pool].filter(m=>getMealType(m)==="snack").sort(()=>Math.random()-0.5),
      lunch:     [...pool].filter(m=>getMealType(m)==="lunch").sort(()=>Math.random()-0.5),
      dinner:    [...pool].filter(m=>getMealType(m)==="dinner").sort(()=>Math.random()-0.5),
    };
    const ordered = [byType.breakfast[0],byType.snack[0],byType.lunch[0],byType.snack[1]||byType.snack[0],byType.dinner[0]].filter(Boolean);
    setShown(ordered.length>=3?ordered:[...pool].sort(()=>Math.random()-0.5).slice(0,4));
    setExpanded(null);
  };

  const generate = isPro ? generateAI : generateLocal;

  const toggleFav = id => setFavourites(f=>f.includes(id)?f.filter(x=>x!==id):[...f,id]);
  const removeM = id => { setRemoved(r=>[...r,id]); setShown(s=>s?s.filter(m=>m.id!==id):s); };
  const logMeal = m => {
    const currentCals = (mealLog[today]||[]).reduce((a,x)=>a+x.cals,0);
    const newTotal = currentCals + m.cals;
    const tdee = calcTDEE(profile);
    const pace = getPace(profile.paceId||"normal");
    const target = tdee ? tdee - Math.round(pace.lbs*500) : 1800;
    if (tdee && newTotal > target * 1.1) {
      const ok = window.confirm(`⚠️ Calorie Warning\n\nLogging this meal will bring your total to ${newTotal} calories — ${Math.round(((newTotal/target)-1)*100)}% over your daily target of ${target}.\n\nLog it anyway?`);
      if (!ok) return;
    }
    setMealLog(ml=>({...ml,[today]:[...(ml[today]||[]),{id:m.id,name:m.name,cals:m.cals,protein:m.protein,carbs:m.carbs,fat:m.fat,time:new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}]}));
  };
  const removeMealLog = (i) => setMealLog(ml=>({...ml,[today]:(ml[today]||[]).filter((_,idx)=>idx!==i)}));

  return (
    <div>
      <div style={{ display:"flex", background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:3, marginBottom:12, gap:2 }}>
        {[["meals","Meals"],["shopping","Shopping"],["supps","Supplements"]].map(([k,l])=>(
          <button key={k} onClick={()=>setSection(k)} style={{ flex:1, background:section===k?C.accent:"transparent", color:section===k?"#fff":C.muted, border:"none", borderRadius:10, padding:"8px 0", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:FONT, transition:"all 0.2s" }}>{l}</button>
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
        {syncing && <div style={{ width:8, height:8, borderRadius:99, background:C.green, animation:"pulse 1s ease-in-out infinite" }} title="Syncing..." />}
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

        {/* Compact meal style + generate row */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"12px 14px", marginBottom:12 }}>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
            {["all","balanced","high-protein","mediterranean","budget-friendly"].map(s=><Chip key={s} color={C.accent} active={style===s} onClick={()=>setStyle(s)}>{s}</Chip>)}
          </div>
          {isPro ? (
            <div>
              <Btn onClick={generate} disabled={generating} style={{ width:"100%", padding:"11px 0", fontSize:15, marginBottom:4 }}>
                {generating ? "✦ Generating..." : "✦ Generate Today's Meals with AI"}
              </Btn>
              <p style={{ color:C.muted, fontSize:11, textAlign:"center", margin:0 }}>{MAX_GENERATIONS - genCount} generation{MAX_GENERATIONS - genCount !== 1 ? "s" : ""} remaining today</p>
              {generating && (
                <div style={{ background:C.sectionBg, borderRadius:14, padding:"12px", marginTop:8, textAlign:"center" }}>
                  <MealLoadingIndicator />
                </div>
              )}
              {generateError && <p style={{ color:C.red, fontSize:13, textAlign:"center", marginTop:6 }}>{generateError}</p>}
              {dislikedMeals.length>0&&<p style={{ color:C.muted, fontSize:11, textAlign:"center", marginTop:4 }}>Avoiding {dislikedMeals.length} disliked meal{dislikedMeals.length!==1?"s":""} · <span onClick={()=>saveDislikedMeals([])} style={{ color:C.accent, cursor:"pointer" }}>Reset</span></p>}
            </div>
          ) : (
            <div>
              <Btn onClick={generate} style={{ width:"100%", padding:"11px 0", marginBottom:6 }}>✦ Generate from our meal library</Btn>
              <Btn onClick={onUpgrade} color="#5856d6" style={{ width:"100%", padding:"11px 0" }}>✦ Unlock AI Meal Generation — Pro</Btn>
            </div>
          )}
        </div>

        {shown&&<>
          {/* Totals + regen combined row */}
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8, background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"8px 12px" }}>
            <span style={{ color:C.accent, fontWeight:700, fontSize:13 }}>{shown.reduce((a,m)=>a+m.cals,0)} kcal</span>
            <span style={{ color:C.muted, fontSize:12 }}>·</span>
            <span style={{ color:C.green, fontWeight:600, fontSize:13 }}>{shown.reduce((a,m)=>a+m.protein,0)}g protein</span>
            <span style={{ color:C.muted, fontSize:12 }}>·</span>
            <span style={{ color:C.orange, fontWeight:600, fontSize:13 }}>{shown.reduce((a,m)=>a+m.carbs,0)}g carbs</span>
            <div style={{ flex:1 }} />
            <button onClick={generate} disabled={generating||genCount>=MAX_GENERATIONS} style={{ background:"none", border:"none", color:(generating||genCount>=MAX_GENERATIONS)?C.muted:C.accent, fontSize:12, fontWeight:700, cursor:(generating||genCount>=MAX_GENERATIONS)?"default":"pointer", fontFamily:FONT, padding:"2px 6px" }}>↻</button>
            <button onClick={()=>setShown(null)} style={{ background:"none", border:"none", color:C.muted, fontSize:12, cursor:"pointer", fontFamily:FONT, padding:"2px 6px" }}>✕</button>
          </div>

          {/* Swipeable meal carousel */}
          <MealCarousel
            meals={shown}
            favourites={favourites}
            likedMeals={likedMeals}
            mealLog={mealLog}
            today={today}
            onLike={likeMeal}
            onDislike={dislikeMeal}
            onLog={logMeal}
            onRemoveLog={removeMealLog}
            targetCals={targetCals}
          />

          {removed.length>0&&<div style={{ textAlign:"center", marginTop:8 }}><span onClick={()=>setRemoved([])} style={{ color:C.muted, fontSize:12, cursor:"pointer", textDecoration:"underline" }}>Restore {removed.length} removed meal{removed.length!==1?"s":""}</span></div>}
          {showRegenerateNudge&&<div style={{ background:`${C.accent}10`, border:`1px solid ${C.accent}33`, borderRadius:14, padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8 }}>
            <p style={{ color:C.text, fontSize:13, margin:0 }}>Want a fresh meal plan?</p>
            <button onClick={()=>{ setShowRegenerateNudge(false); generate(); }} disabled={generating||genCount>=MAX_GENERATIONS} style={{ background:genCount>=MAX_GENERATIONS?C.muted:C.accent, border:"none", borderRadius:99, padding:"6px 14px", color:"#fff", fontSize:13, fontWeight:700, cursor:(generating||genCount>=MAX_GENERATIONS)?"default":"pointer", fontFamily:FONT }}>
              {genCount>=MAX_GENERATIONS ? "Limit reached" : "↻ Regenerate"}
            </button>
          </div>}
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
            : <Btn onClick={onUpgrade} color="#5856d6" style={{ width:"100%" }}>✦ Unlock Shopping Lists — Pro</Btn>
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
const TrainTab = ({ profile, workoutLog, setWorkoutLog, setProfile, savedWorkout, setSavedWorkout }) => {
  const [selectedType, setSelectedType] = useState("full-body");
  const activeWorkout = savedWorkout?.workout || null;
  const activeExercises = savedWorkout?.exercises || [];
  const setActiveWorkout = (w) => setSavedWorkout(w ? { workout:w, exercises:savedWorkout?.exercises||[] } : null);
  const setActiveExercises = (e) => setSavedWorkout(prev => prev ? { ...prev, exercises:e } : null);
  const [view, setView] = useState("calendar");
  const [expandedEx, setExpandedEx] = useState(null);
  const today = todayKey();

  const days = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-d.getDay()+1+i); return d; });
  const dayKey = d => d.toISOString().split("T")[0];
  const weekWorkouts = days.filter(d=>workoutLog[dayKey(d)]).length;

  // Get current training block
  const block = getCurrentBlock(profile);
  const weekInBlock = block.weekInBlock || 0;
  const isDeload = weekInBlock === 3;

  // Set training start date if not set
  useEffect(() => {
    if (!profile?.trainingStartDate) {
      setProfile(p => ({...p, trainingStartDate: new Date().toISOString()}));
    }
  }, []);

  const buildAndShowWorkout = (type) => {
    const w = WORKOUTS[type];
    const exercises = buildWorkout(type, profile, isDeload ? {...block, sets: Math.max(2, block.sets-1), reps:"12-15", rest:"60 sec"} : block);
    setSavedWorkout({ workout:w, exercises });
    setView("workout");
  };

  const logWorkout = (type) => {
    setWorkoutLog(wl=>({...wl,[today]:{type,date:today,time:new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}}));
    buildAndShowWorkout(type);
  };

  const historyWeeks = Array.from({length:4},(_,i)=>{
    const start=new Date(); start.setDate(start.getDate()-start.getDay()+1-(i*7));
    const count=Array.from({length:7},(__,j)=>{ const d=new Date(start); d.setDate(d.getDate()+j); return workoutLog[dayKey(d)]?1:0; }).reduce((a,b)=>a+b,0);
    return {label:i===0?"This week":i===1?"Last week":`${i+1}w ago`,count};
  }).reverse();

  const trainDays = profile.workoutsPerWeek||3;
  const restDays = 7 - trainDays;
  const suggestion = trainDays<=3 ? "Mon · Wed · Fri" : trainDays===4 ? "Mon · Tue · Thu · Fri" : "Mon · Tue · Thu · Fri · Sat";

  return (
    <div>
      <div style={{ display:"flex", background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:3, marginBottom:12, gap:2 }}>
        {[["calendar","Calendar"],["workout","Workout"],["lifts","Lifts"]].map(([k,l])=>(
          <button key={k} onClick={()=>setView(k)} style={{ flex:1, background:view===k?C.accent:"transparent", color:view===k?"#fff":C.muted, border:"none", borderRadius:10, padding:"8px 0", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:FONT, transition:"all 0.2s" }}>{l}</button>
        ))}
      </div>

      {view==="calendar"&&<>
        {/* Training Block Card */}
        <div style={{ background:`linear-gradient(135deg, ${block.color}, ${block.color}aa)`, borderRadius:16, padding:"16px 18px", marginBottom:14, color:"#fff" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <p style={{ opacity:0.85, fontSize:11, fontWeight:700, letterSpacing:"0.08em", margin:"0 0 4px" }}>TRAINING BLOCK {block.id} OF 4</p>
              <h3 style={{ margin:0, fontSize:20, fontWeight:800 }}>{block.name}</h3>
              <p style={{ opacity:0.8, fontSize:12, margin:"3px 0 0" }}>{block.subtitle}</p>
            </div>
            <div style={{ background:"rgba(255,255,255,0.2)", borderRadius:12, padding:"8px 12px", textAlign:"center" }}>
              <div style={{ fontSize:18, fontWeight:800 }}>W{weekInBlock+1}</div>
              <div style={{ fontSize:10, opacity:0.85 }}>of 4</div>
            </div>
          </div>
          {isDeload&&<div style={{ background:"rgba(255,255,255,0.2)", borderRadius:10, padding:"8px 12px", marginTop:10 }}>
            <p style={{ fontSize:12, fontWeight:700, margin:"0 0 2px" }}>🔄 DELOAD WEEK</p>
            <p style={{ fontSize:12, opacity:0.9, margin:0 }}>Reduced volume — let your body recover and grow stronger.</p>
          </div>}
          {!isDeload&&<p style={{ opacity:0.8, fontSize:12, margin:"8px 0 0" }}>{block.weeklyNote?.[weekInBlock]}</p>}
          <div style={{ display:"flex", gap:12, marginTop:12 }}>
            <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:8, padding:"6px 10px", fontSize:12 }}>
              <span style={{ opacity:0.8 }}>Reps: </span><strong>{isDeload?"12-15":block.reps}</strong>
            </div>
            <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:8, padding:"6px 10px", fontSize:12 }}>
              <span style={{ opacity:0.8 }}>Sets: </span><strong>{isDeload?Math.max(2,block.sets-1):block.sets}</strong>
            </div>
            <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:8, padding:"6px 10px", fontSize:12 }}>
              <span style={{ opacity:0.8 }}>Rest: </span><strong>{isDeload?"60s":block.rest}</strong>
            </div>
          </div>
        </div>

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

        <Card style={{ background:`${C.green}08`, borderColor:`${C.green}22` }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}><Icon name="calendar" size={14} color={C.green} /><p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", margin:0 }}>REST DAY PLANNER</p></div>
          <p style={{ color:C.text, fontSize:14, marginBottom:6 }}>Training <strong style={{ color:C.accent }}>{trainDays}x</strong> per week · <strong style={{ color:C.green }}>{restDays} rest days</strong></p>
          <p style={{ color:C.muted, fontSize:13, marginBottom:10 }}>Suggested: <strong style={{ color:C.text }}>{suggestion}</strong></p>
          <div style={{ background:C.sectionBg, borderRadius:10, padding:"10px 12px" }}>
            <p style={{ color:C.muted, fontSize:12, fontWeight:600, marginBottom:4 }}>💚 ON REST DAYS</p>
            <p style={{ color:C.textSec, fontSize:13, lineHeight:1.6, margin:0 }}>15–20 min gentle walk · Stretching · Foam rolling · Extra sleep</p>
          </div>
        </Card>

        <Card style={{ background:`linear-gradient(145deg, ${C.accent}08, ${C.purple}08)` }}>
          <p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", marginBottom:12 }}>LOG TODAY'S WORKOUT</p>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
            {Object.entries(WORKOUTS).map(([key,val])=><Chip key={key} color={val.color} active={selectedType===key} onClick={()=>setSelectedType(key)}>{key.replace("-"," ")}</Chip>)}
          </div>
          <Btn onClick={()=>logWorkout(selectedType)} color={WORKOUTS[selectedType].color} style={{ width:"100%" }}>
            {workoutLog[today]?"↻ Update Today":"✦ Start Today's Workout"}
          </Btn>
        </Card>
      </>}

      {view==="workout"&&<>
        {!activeWorkout&&<Card>
          <p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", marginBottom:12 }}>CHOOSE WORKOUT</p>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
            {Object.entries(WORKOUTS).map(([key,val])=><Chip key={key} color={val.color} active={selectedType===key} onClick={()=>setSelectedType(key)}>{key.replace("-"," ")}</Chip>)}
          </div>
          <Btn onClick={()=>buildAndShowWorkout(selectedType)} color={WORKOUTS[selectedType].color} style={{ width:"100%" }}>✦ Build My Workout</Btn>
        </Card>}

        {activeWorkout&&<>
          <div style={{ background:`linear-gradient(135deg, ${activeWorkout.color}, ${activeWorkout.color}88)`, borderRadius:16, padding:"16px 18px", marginBottom:14, color:"#fff" }}>
            <h3 style={{ margin:0, fontSize:20, fontWeight:700 }}>{activeWorkout.title}</h3>
            <p style={{ opacity:0.85, fontSize:13, margin:"4px 0 0" }}>{block.name} Block · Week {weekInBlock+1} · {isDeload?"Deload":block.reps+" reps"}</p>
          </div>
          <Section title={<div style={{display:"flex",alignItems:"center",gap:6}}><Icon name="flame" size={13} color={C.orange} /><span>Warm Up</span></div>}>
            {activeWorkout.warmup.map((x,i)=><Row key={i} label={x} last={i===activeWorkout.warmup.length-1} />)}
          </Section>
          {activeExercises.map((ex,i)=>{
            const isExp = expandedEx === i;
            const fullEx = EXERCISE_DB.find(e=>e.name===ex.name);
            return <Card key={i} style={{ borderLeft:`3px solid ${activeWorkout.color}` }}>
              <div onClick={()=>setExpandedEx(isExp?null:i)} style={{ cursor:"pointer" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div style={{ flex:1 }}>
                    <p style={{ color:activeWorkout.color, fontWeight:700, fontSize:16, margin:0 }}>{i+1}. {ex.name}</p>
                    <span style={{ color:C.muted, fontSize:12 }}>{ex.equipment} · {ex.muscle}</span>
                    {fullEx?.muscles&&<p style={{ color:C.muted, fontSize:11, margin:"2px 0 0" }}>🎯 {fullEx.muscles}</p>}
                  </div>
                  <div style={{ background:`${activeWorkout.color}15`, borderRadius:10, padding:"8px 12px", textAlign:"right", flexShrink:0 }}>
                    <div style={{ color:C.text, fontSize:16, fontWeight:700 }}>{ex.sets} × {ex.reps}</div>
                    <div style={{ color:C.muted, fontSize:11 }}>Rest: {ex.rest}</div>
                  </div>
                </div>
                {ex.tip&&<div style={{ background:C.sectionBg, borderRadius:8, padding:"8px 12px", fontSize:12, color:C.textSec, borderLeft:`3px solid ${C.yellow}`, marginBottom:6 }}>💬 {ex.tip}</div>}
                <p style={{ color:C.accent, fontSize:12, fontWeight:600, margin:0 }}>{isExp?"▲ Hide instructions":"▼ How to do this exercise"}</p>
              </div>
              {isExp&&fullEx&&<div style={{ marginTop:12 }}>
                <div style={{ background:C.sectionBg, borderRadius:10, padding:"12px 14px", marginBottom:8 }}>
                  <p style={{ color:C.muted, fontSize:11, fontWeight:700, letterSpacing:"0.06em", marginBottom:8 }}>STEP-BY-STEP</p>
                  {fullEx.steps.map((s,j)=><div key={j} style={{ display:"flex", gap:10, marginBottom:6 }}>
                    <div style={{ width:20, height:20, borderRadius:99, background:activeWorkout.color, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                      <span style={{ color:"#fff", fontSize:10, fontWeight:700 }}>{j+1}</span>
                    </div>
                    <p style={{ color:C.text, fontSize:13, lineHeight:1.6, margin:0 }}>{s}</p>
                  </div>)}
                </div>
                {fullEx.mistakes&&<div style={{ background:`${C.red}08`, border:`1px solid ${C.red}22`, borderRadius:10, padding:"12px 14px", marginBottom:8 }}>
                  <p style={{ color:C.red, fontSize:11, fontWeight:700, letterSpacing:"0.06em", marginBottom:6 }}>⚠️ COMMON MISTAKES</p>
                  {fullEx.mistakes.map((m,j)=><p key={j} style={{ color:C.textSec, fontSize:13, lineHeight:1.5, margin:"0 0 4px" }}>· {m}</p>)}
                </div>}
                <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name+" exercise technique")}`} target="_blank" rel="noopener noreferrer" style={{ display:"block", background:C.sectionBg, borderRadius:10, padding:"10px 14px", textDecoration:"none", textAlign:"center" }}>
                  <span style={{ color:C.accent, fontSize:13, fontWeight:600 }}>▶ Watch technique on YouTube</span>
                </a>
              </div>}
            </Card>;
          })}
          {activeExercises.length===0&&<Card><p style={{ color:C.muted, textAlign:"center", fontSize:14 }}>No exercises match your equipment. Try selecting more equipment in Profile → Fitness.</p></Card>}
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
const TrackTab = ({ profile, entries, setEntries, measurements, setMeasurements, workoutLog={} }) => {
  const [newW, setNewW] = useState("");
  const [activeSection, setActiveSection] = useState("weight");
  const [newMeasure, setNewMeasure] = useState({ waist:"", hips:"", chest:"", leftArm:"", rightArm:"" });

  const cur = entries.length>0?entries[entries.length-1].weight:profile.startWeightLbs;
  const lost = Math.max(0,profile.startWeightLbs-cur);
  const lostKg = parseFloat((lost*0.453592).toFixed(1));
  const pace = getPace(profile.paceId||"normal");
  const eta = Math.ceil((profile.targetLbs-lost)/pace.lbs);
  const target = (profile.startWeightLbs||0)-(profile.targetLbs||0);
  const targetKg = parseFloat((target*0.453592).toFixed(1));
  const curKg = parseFloat((cur*0.453592).toFixed(1));
  const startKg = parseFloat((profile.startWeightLbs*0.453592).toFixed(1));
  const pct = profile.targetLbs>0?Math.min(100,Math.round((lost/profile.targetLbs)*100)):0;
  const tdee = calcTDEE(profile);
  const bmi = calcBMI(profile);
  const bmiCat = bmi?bmiCategory(parseFloat(bmi)):null;

  const addWeightEntry = () => {
    if (!newW||isNaN(newW)) return;
    const weightLbs = fromKg(parseFloat(newW));
    setEntries(prev=>[...prev,{weight:weightLbs, weightKg:parseFloat(parseFloat(newW).toFixed(1)), label:`W${prev.length+1}`,date:new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short"})}]);
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
      <div style={{ display:"flex", background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:3, marginBottom:12, gap:2 }}>
        {[["weight","Weight"],["measurements","Measurements"],["stats","Stats"],["workouts","Workouts"]].map(([k,l])=>(
          <button key={k} onClick={()=>setActiveSection(k)} style={{ flex:1, background:activeSection===k?C.purple:"transparent", color:activeSection===k?"#fff":C.muted, border:"none", borderRadius:10, padding:"8px 0", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:FONT, transition:"all 0.2s" }}>{l}</button>
        ))}
      </div>

      {activeSection==="weight"&&<>
        <div style={{ background:`linear-gradient(145deg, ${C.accent}15, ${C.green}10)`, borderRadius:20, padding:"20px 18px", marginBottom:16, border:`1px solid ${C.accent}22` }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
            <div><p style={{ color:C.muted, fontSize:13, margin:0 }}>Progress</p><h2 style={{ color:C.text, fontSize:28, fontWeight:700, margin:"2px 0 0" }}>{pct}%</h2></div>
            <div style={{ textAlign:"right" }}><p style={{ color:C.muted, fontSize:12, margin:0 }}>Lost so far</p><p style={{ color:C.green, fontSize:22, fontWeight:700, margin:0 }}>{lostKg} kg</p></div>
          </div>
          <ProgressBar value={lost} max={profile.targetLbs} color={C.accent} height={10} />
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, fontSize:11, color:C.muted }}>
            <span>{startKg} kg start</span><span>Goal: {(target*0.453592).toFixed(1)} kg</span>
          </div>
        </div>

        <div style={{ display:"flex", gap:8, marginBottom:16 }}>
          <StatBox label="Per week" val={entries.length>0?((lost/entries.length)*0.453592).toFixed(2)+" kg":"—"} color={C.accent} />
          <StatBox label="ETA" val={eta>0?`${eta} wks`:"Done!"} color={C.purple} />
          <StatBox label="To go" val={`${(Math.max(0,profile.targetLbs-lost)*0.453592).toFixed(1)}`} sub="kg" color={C.orange} />
        </div>

        <Card>
          <p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", marginBottom:12 }}>⚖️ LOG WEEKLY WEIGH-IN</p>
          <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:10 }}>
            <TInput value={newW} onChange={e=>setNewW(e.target.value)} placeholder="e.g. 82.5" type="number" style={{ flex:1 }} />
            <Btn onClick={addWeightEntry} disabled={!newW} color={C.accent} style={{ padding:"12px 18px" }}>+ Log</Btn>
          </div>
          <div style={{ display:"flex", gap:16, fontSize:12 }}>
            <span style={{ color:C.muted }}>Start: <strong style={{ color:C.text }}>{toKg(profile.startWeightLbs)} kg</strong></span>
            <span style={{ color:C.muted }}>Target: <strong style={{ color:C.green }}>{(target*0.453592).toFixed(1)} kg</strong></span>
          </div>
        </Card>

        {entries.length>=1&&<Card>
          <p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", marginBottom:12 }}>📈 WEIGHT CHART (kg)</p>
          <Chart entries={entries} startWeight={profile.startWeightLbs} targetWeight={target} />
          {entries.length<2&&<p style={{ color:C.muted, fontSize:12, textAlign:"center", marginTop:8 }}>Log more weeks to see your trend</p>}
        </Card>}

        {entries.length>0&&<Section title="Weekly Log">
          <Row label="Starting weight" value={`${startKg} kg`} color={C.muted} />
          {entries.map((e,i)=>{
            const prev=i===0?profile.startWeightLbs:entries[i-1].weight;
            const diff=e.weight-prev;
            return <Row key={i} label={`${e.label}${e.date?` · ${e.date}`:""}`} value={`${e.weightKg||toKg(e.weight)} kg`} last={i===entries.length-1}
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
          <Row label="Starting weight" value={`${toKg(profile.startWeightLbs)} kg`} />
          <Row label="Target weight" value={`${toKg(profile.startWeightLbs-profile.targetLbs)} kg`} />
          <Row label="Pace" value={`${getPace(profile.paceId||"normal").kgPerWk} kg/week`} />
          <Row label="Estimated weeks" value={`${Math.ceil(profile.targetLbs/getPace(profile.paceId||"normal").lbs)} weeks`} last />
        </Section>
      </>}

      {activeSection==="workouts"&&<>
        {(()=>{
          const historyWeeks = Array.from({length:4},(_,i)=>{
            const start=new Date(); start.setDate(start.getDate()-start.getDay()+1-(i*7));
            const count=Array.from({length:7},(__,j)=>{ const d=new Date(start); d.setDate(d.getDate()+j); const k=d.toISOString().split("T")[0]; return workoutLog[k]?1:0; }).reduce((a,b)=>a+b,0);
            return {label:i===0?"This week":i===1?"Last week":`${i+1}w ago`,count};
          }).reverse();
          const target = profile.workoutsPerWeek||3;
          const totalLogged = Object.keys(workoutLog).length;
          const totalWeeks = Math.max(1, Math.ceil(totalLogged/target));
          return <>
            <div style={{ display:"flex", gap:8, marginBottom:16 }}>
              <StatBox label="Total workouts" val={totalLogged} color={C.green} />
              <StatBox label="This week" val={`${historyWeeks[3]?.count||0}/${target}`} color={C.accent} />
              <StatBox label="Last week" val={`${historyWeeks[2]?.count||0}/${target}`} color={C.purple} />
            </div>
            <Section title="Weekly History">
              {historyWeeks.map((w,i)=><Row key={i} label={w.label} value={`${w.count} / ${target}`} color={w.count>=target?C.green:w.count>0?C.accent:C.muted} last={i===historyWeeks.length-1} />)}
            </Section>
            {Object.entries(workoutLog).length>0&&<Section title="Recent Sessions">
              {Object.entries(workoutLog).slice(-8).reverse().map(([date,w],i,arr)=>(
                <Row key={date} label={fmtDate(date)} value={w.type?.replace("-"," ")||"workout"} color={C.accent} last={i===arr.length-1} />
              ))}
            </Section>}
          </>;
        })()}
      </>}
    </div>
  );
};

// ── PROFILE TAB ───────────────────────────────────────────────────────────────
const ProfileTab = ({ profile, setProfile, onReset, isDark, darkOverride, setDarkOverride, isPro, proData, onUpgrade, user, onShowAuth }) => {
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
            {[3,5,7,10,15,20].map(kg=>{ const lbs=parseFloat((kg*2.20462).toFixed(1)); return <Chip key={kg} color={C.accent} active={Math.abs((tempData.targetLbs||0)-lbs)<0.6} onClick={()=>setTempData(d=>({...d,targetLbs:lbs}))}>{kg} kg</Chip>; })}
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
        <p style={{ color:C.muted, fontSize:14, margin:"4px 0 0" }}>Age {profile.age||"—"} · LeanPlan</p>
        {tdee&&<p style={{ color:C.accent, fontSize:14, margin:"4px 0 0", fontWeight:600 }}>TDEE: {tdee} cal · BMI: {bmi}</p>}
      </div>

      <Section title="Goals">
        <Row label="Main goal" value={profile.goal?.replace("_"," ")} onClick={()=>startEdit("goal")} />
        <Row label="Weight target" value={`${toKg(profile.startWeightLbs - profile.targetLbs)} kg target`} onClick={()=>startEdit("weight")} />
        <Row label="Weekly pace" value={`${getPace(profile.paceId||"normal").kgPerWk} kg/wk — ${getPace(profile.paceId||"normal").label}`} onClick={()=>startEdit("weight")} last />
      </Section>

      <Section title="My Details">
        <Row label="Height" value={profile.heightCm?`${profile.heightCm} cm`:"Not set"} onClick={()=>startEdit("details")} />
        <Row label="Age" value={profile.age||"Not set"} onClick={()=>startEdit("details")} />
        <Row label="Workouts/week" value={`${profile.workoutsPerWeek}x`} onClick={()=>startEdit("details")} last />
      </Section>

      <Section title="Fitness">
        <Row label="Fitness level" value={profile.fitnessLevel||"Not set"} onClick={()=>startEdit("fitness")} />
        <Row label="Injuries / limitations" value={profile.injuries?.length>0?profile.injuries.join(", "):"None"} onClick={()=>startEdit("fitness")} />
        <Row label="Equipment" value={profile.equipment?.length>0?`${profile.equipment.length} items`:"Not set"} onClick={()=>startEdit("fitness")} last />
      </Section>

      <Section title="Diet">
        <Row label="Diet type" value={profile.dietType||"omnivore"} onClick={()=>startEdit("diet")} />
        <Row label="Dairy" value={profile.dairyPref?.replace("_"," ")||"Not set"} onClick={()=>startEdit("diet")} />
        <Row label="Gluten" value={profile.glutenPref?.replace("_"," ")||"Not set"} onClick={()=>startEdit("diet")} />
        <Row label="Allergies" value={profile.allergies?.length>0?`${profile.allergies.length} selected`:"None"} onClick={()=>startEdit("allergies")} />
        <Row label="Dislikes" value={profile.dislikes?.length>0?`${profile.dislikes.length} foods`:"None"} onClick={()=>startEdit("dislikes")} last />
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
            <Row label="Data sync" value="✓ Synced to cloud" color={C.green} last />
            <div style={{ padding:"12px 16px" }}>
              <Btn outline color={C.red} onClick={async()=>{ await supabase.auth.signOut(); }} style={{ width:"100%" }}>Sign Out</Btn>
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
      ) : proData?.customerId === "bypass" ? null : (
        <Btn onClick={onUpgrade} color="#5856d6" style={{ width:"100%", marginBottom:16 }}>✦ Upgrade to Pro from £4.99/mo</Btn>
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
  <div onClick={onUpgrade} style={{ background:"linear-gradient(135deg, #1c1c2e, #2d2b55)", borderRadius:14, padding:"12px 16px", marginBottom:14, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:"0 4px 16px rgba(88,86,214,0.3)", border:"1px solid rgba(88,86,214,0.4)" }}>
    <div style={{ flex:1, marginRight:10 }}>
      <p style={{ color:"#fff", fontWeight:700, fontSize:14, margin:0 }}>✦ Unlock LeanPlan Pro</p>
      <p style={{ color:"rgba(255,255,255,0.6)", fontSize:12, margin:"2px 0 0" }}>From £4.99/mo — AI coach, workouts & more</p>
    </div>
    <div style={{ background:"#5856d6", borderRadius:99, padding:"7px 14px", flexShrink:0 }}>
      <span style={{ color:"#fff", fontWeight:700, fontSize:13, whiteSpace:"nowrap" }}>Upgrade →</span>
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
    <Btn onClick={onUpgrade} color="#5856d6" style={{ width:"100%", maxWidth:280 }}>✦ Unlock Pro from £4.99/mo</Btn>
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
      if (!res.ok) {
        const err = await res.text();
        console.error("Checkout error:", err);
        alert("Payment setup failed. Please try again.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No URL in response:", data);
        alert("Payment setup failed. Please try again.");
        setLoading(false);
      }
    } catch(err) {
      console.error("Checkout fetch error:", err);
      alert("Could not connect to payment server. Please try again.");
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
          Cancel anytime. Secure payment by Stripe.
        </p>
      </div>
    </div>
  );
};


// ── Error Boundary ────────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error: error.message }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding:40, fontFamily:"monospace", background:"#fff", minHeight:"100vh" }}>
          <h2 style={{ color:"red", marginBottom:16 }}>App Error</h2>
          <pre style={{ background:"#f5f5f5", padding:16, borderRadius:8, fontSize:12, whiteSpace:"pre-wrap", wordBreak:"break-all" }}>
            {this.state.error}
          </pre>
          <button onClick={()=>this.setState({error:null})} style={{ marginTop:16, padding:"8px 16px" }}>
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}



// ── Welcome Screen ────────────────────────────────────────────────────────────
const WelcomeScreen = ({ onNew, onSignIn }) => (
  <div style={{ minHeight:"100vh", background:C.bg, fontFamily:FONT, display:"flex", flexDirection:"column", justifyContent:"center", padding:"0 20px" }}>
    <div style={{ maxWidth:400, margin:"0 auto", width:"100%", textAlign:"center" }}>
      <img src="/leanplan_app_icon.png" alt="" style={{ height:88, width:88, borderRadius:22, marginBottom:24 }} />
      <h1 style={{ fontSize:32, fontWeight:800, color:C.text, margin:"0 0 10px" }}>
        <span style={{ color:C.text }}>Lean</span><span style={{ color:C.accent }}>Plan</span>
      </h1>
      <p style={{ color:C.muted, fontSize:16, lineHeight:1.7, marginBottom:48 }}>Your personal AI health & fitness coach</p>

      <Btn onClick={onNew} color={C.accent} style={{ width:"100%", fontSize:17, padding:"16px 0", marginBottom:14 }}>
        Get Started →
      </Btn>

      <button onClick={onSignIn} style={{ width:"100%", background:"none", border:`1.5px solid ${C.border}`, borderRadius:14, padding:"15px 0", color:C.text, fontSize:16, fontWeight:600, cursor:"pointer", fontFamily:FONT }}>
        I already have an account
      </button>

      <p style={{ color:C.muted, fontSize:12, marginTop:24, lineHeight:1.6 }}>
        Takes 3 minutes · Fully personalised to you
      </p>
    </div>
  </div>
);


// ── Trial Expired Screen ──────────────────────────────────────────────────────
const TrialExpiredScreen = ({ onSubscribe }) => (
  <div style={{ minHeight:"100vh", background:C.bg, fontFamily:FONT, display:"flex", flexDirection:"column", justifyContent:"center", padding:"0 20px" }}>
    <div style={{ maxWidth:400, margin:"0 auto", width:"100%", textAlign:"center" }}>
      <img src="/leanplan_app_icon.png" alt="" style={{ height:80, width:80, borderRadius:20, marginBottom:24 }} />
      <h1 style={{ fontSize:28, fontWeight:800, color:C.text, margin:"0 0 12px" }}>Your 7-day trial has ended</h1>
      <p style={{ color:C.muted, fontSize:15, lineHeight:1.7, marginBottom:24 }}>
        You've had full access to AI meal generation, personalised workouts and your AI health coach. Subscribe to keep it all going.
      </p>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"16px", marginBottom:24, textAlign:"left" }}>
        {[
          "✦ AI meal plans tailored to your diet",
          "✦ Personalised workout programmes",
          "✦ Unlimited AI health coach",
          "✦ Progress tracking & measurements",
          "✦ Shopping lists & supplement guide",
          "✦ Data synced across all devices",
        ].map((f,i)=><p key={i} style={{ color:C.text, fontSize:14, margin:"6px 0" }}>{f}</p>)}
      </div>
      <Btn onClick={onSubscribe} color={C.accent} style={{ width:"100%", fontSize:17, padding:"16px 0", marginBottom:12 }}>
        Subscribe from £4.99/month
      </Btn>
      <p style={{ color:C.muted, fontSize:12, lineHeight:1.6 }}>
        Cancel anytime · Secure payment by Stripe
      </p>
    </div>
  </div>
);

// ── Auth Screen ───────────────────────────────────────────────────────────────
const AuthScreen = ({ onAuth, onSkip }) => {
  const [mode, setMode] = useState("login"); // login, signup, forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleAuth = async () => {
    if (!email || !password) { setError("Please enter your email and password"); return; }
    setLoading(true); setError(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { emailRedirectTo: "https://www.leanplan.uk" }
        });
        if (error) throw error;
        setMessage("Account created! Please check your email to verify, then log in.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuth();
      }
    } catch(err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleForgot = async () => {
    if (!email) { setError("Enter your email address first"); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    if (error) setError(error.message);
    else setMessage("Password reset email sent! Check your inbox.");
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:FONT, display:"flex", flexDirection:"column", justifyContent:"center", padding:"0 20px" }}>
      <div style={{ maxWidth:400, margin:"0 auto", width:"100%" }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <img src="/leanplan_app_icon.png" alt="" style={{ height:72, width:72, borderRadius:18, marginBottom:16 }} />
          <h1 style={{ fontSize:32, fontWeight:800, color:C.text, margin:"0 0 8px" }}>
            <span style={{ color:C.text }}>Lean</span><span style={{ color:C.accent }}>Plan</span>
          </h1>
          <p style={{ color:C.muted, fontSize:15 }}>{onSkip ? 'Sign in to your account' : 'Create a free account to save your plan'}</p>
        </div>

        {/* Mode tabs */}
        {mode !== "forgot" && <div style={{ marginBottom:24 }}>
          <h2 style={{ color:C.text, fontSize:22, fontWeight:700, margin:0 }}>Sign in to your account</h2>
          <p style={{ color:C.muted, fontSize:14, margin:"6px 0 0" }}>Your plan and data will sync to this device</p>
        </div>}

        {mode === "forgot" && <div style={{ marginBottom:24 }}>
          <h2 style={{ color:C.text, fontSize:22, fontWeight:700, marginBottom:6 }}>Reset Password</h2>
          <p style={{ color:C.muted, fontSize:14 }}>Enter your email and we'll send you a reset link.</p>
        </div>}

        {/* Form */}
        <div style={{ marginBottom:14 }}>
          <p style={{ color:C.textSec, fontSize:13, fontWeight:500, marginBottom:6 }}>Email</p>
          <TInput value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" type="email" />
        </div>
        {mode !== "forgot" && <div style={{ marginBottom:20 }}>
          <p style={{ color:C.textSec, fontSize:13, fontWeight:500, marginBottom:6 }}>Password</p>
          <TInput value={password} onChange={e=>setPassword(e.target.value)} placeholder={mode==="signup"?"Min 6 characters":"Password"} type="password" />
        </div>}

        {error && <div style={{ background:`${C.red}10`, border:`1px solid ${C.red}33`, borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
          <p style={{ color:C.red, fontSize:13, margin:0 }}>{error}</p>
        </div>}
        {message && <div style={{ background:`${C.green}10`, border:`1px solid ${C.green}33`, borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
          <p style={{ color:C.green, fontSize:13, margin:0 }}>{message}</p>
        </div>}

        {mode !== "forgot"
          ? <Btn onClick={handleAuth} disabled={loading} color={C.accent} style={{ width:"100%", marginBottom:12 }}>
              {loading ? "Please wait..." : mode==="signup" ? "Create Account" : "Sign In"}
            </Btn>
          : <Btn onClick={handleForgot} disabled={loading} color={C.accent} style={{ width:"100%", marginBottom:12 }}>
              {loading ? "Sending..." : "Send Reset Email"}
            </Btn>
        }

        {mode === "login" && <p onClick={()=>{setMode("forgot");setError(null);}} style={{ color:C.accent, fontSize:13, textAlign:"center", cursor:"pointer", marginBottom:16 }}>Forgot password?</p>}
        {mode === "forgot" && <p onClick={()=>{setMode("login");setError(null);}} style={{ color:C.accent, fontSize:13, textAlign:"center", cursor:"pointer", marginBottom:16 }}>← Back to sign in</p>}
        {mode === "login" && onSkip && <p onClick={onSkip} style={{ color:C.muted, fontSize:13, textAlign:"center", cursor:"pointer", marginBottom:16 }}>← Back</p>}

        {onSkip && <>
          <div style={{ display:"flex", alignItems:"center", gap:12, margin:"16px 0" }}>
            <div style={{ flex:1, height:1, background:C.border }} />
            <span style={{ color:C.muted, fontSize:13 }}>or</span>
            <div style={{ flex:1, height:1, background:C.border }} />
          </div>
          <button onClick={onSkip} style={{ width:"100%", background:"none", border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 0", color:C.muted, fontSize:15, cursor:"pointer", fontFamily:FONT }}>
            Maybe later
          </button>
          <p style={{ color:C.muted, fontSize:11, textAlign:"center", marginTop:10, lineHeight:1.6 }}>
            Without an account your data is only saved on this device.
          </p>
        </>}
        {!onSkip && <p style={{ color:C.muted, fontSize:11, textAlign:"center", marginTop:16, lineHeight:1.6 }}>
          An account is required to save your plan and take out a subscription.
        </p>}
      </div>
    </div>
  );
};

// ── MAIN ──────────────────────────────────────────────────────────────────────
function AppInner() {
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("Today");
  const [isPro, setIsPro] = useState(false);
  // Trial users get full Pro access
  const effectiveIsPro = isPro || isTrialActive();
  const [proData, setProData] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [todaysMeals, setTodaysMeals] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("leanplan_todays_meals") || "null");
      if (saved?.date === new Date().toISOString().split("T")[0]) return saved.meals;
    } catch(e){}
    return null;
  });
  const [todaysWorkout, setTodaysWorkout] = useState(null);
  const [entries, setEntries] = useState([]);
  const [favourites, setFavourites] = useState([]);
  const [removed, setRemoved] = useState([]);
  const [mealLog, setMealLog] = useState({});
  const [workoutLog, setWorkoutLog] = useState({});
  const [water, setWater] = useState({});
  const [journal, setJournal] = useState({});
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkOverride, setDarkOverride] = useState(null);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  // Auth state
  const [user, setUser] = useState(null); // Supabase user
  const [authChecked, setAuthChecked] = useState(false); // has auth been checked
  const [showAuth, setShowAuth] = useState(false); // show auth screen
  const [showTipSplash, setShowTipSplash] = useState(true);
  const [splashTipIdx] = useState(()=>Math.floor(Math.random()*DAILY_TIPS.length)); // show tip on open
  const [showWelcome, setShowWelcome] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [authLoading, setAuthLoading] = useState(true); // true until auth check completes
  const [syncing, setSyncing] = useState(false);

  // Listen to system dark mode changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = e => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Check for dev bypass and Stripe return
  // Reset daily state at midnight
  useEffect(()=>{
    const msUntilMidnight = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24,0,0,0);
      return midnight - now;
    };
    const timer = setTimeout(()=>{
      setTodaysMeals(null);
      setTodaysWorkout(null);
      localStorage.removeItem("leanplan_todays_meals");
    }, msUntilMidnight());
    return () => clearTimeout(timer);
  }, []);

  useEffect(()=>{
    // Check server-side bypass flag
    fetch("/api/pro-status")
      .then(r => r.json())
      .then(data => {
        if (data.bypass) {
          setIsPro(true);
          setProData({ plan:"annual", customerId:"bypass", subscriptionId:"bypass" });
        }
      })
      .catch(()=>{});

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

  // Load data from localStorage first (fast), then sync from Supabase if logged in
  const loadFromLocal = () => {
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
  };

  const loadFromSupabase = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (error || !data) return;
      if (data.profile_data && Object.keys(data.profile_data).length > 0) setProfile(data.profile_data);
      if (data.entries?.length) setEntries(data.entries);
      if (data.favourites?.length) setFavourites(data.favourites);
      if (data.removed?.length) setRemoved(data.removed);
      if (data.meal_log && Object.keys(data.meal_log).length) setMealLog(data.meal_log);
      if (data.workout_log && Object.keys(data.workout_log).length) setWorkoutLog(data.workout_log);
      if (data.water && Object.keys(data.water).length) setWater(data.water);
      if (data.journal && Object.keys(data.journal).length) setJournal(data.journal);
      if (data.measurements?.length) setMeasurements(data.measurements);
      if (data.dark_override !== null && data.dark_override !== undefined) setDarkOverride(data.dark_override);
      if (data.is_pro) { setIsPro(true); setProData({ customerId: data.stripe_customer_id, subscriptionId: data.stripe_subscription_id, plan: data.stripe_plan }); }
    } catch(e){ console.error("Supabase load error:", e); }
  };

  const saveToSupabase = async (userId, data) => {
    try {
      await supabase.from("profiles").upsert({
        id: userId,
        profile_data: data.profile || {},
        entries: data.entries || [],
        favourites: data.favourites || [],
        removed: data.removed || [],
        meal_log: data.mealLog || {},
        workout_log: data.workoutLog || {},
        water: data.water || {},
        journal: data.journal || {},
        measurements: data.measurements || [],
        dark_override: data.darkOverride,
        updated_at: new Date().toISOString(),
      });
    } catch(e){ console.error("Supabase save error:", e); }
  };

  // Check auth on mount
  useEffect(()=>{
    let loadingDone = false;

    // Load from localStorage IMMEDIATELY — don't wait for Supabase
    loadFromLocal();
    setLoading(false); // Show the app straight away from cache

    const finishLoading = () => {
      if (!loadingDone) {
        loadingDone = true;
        if (window.location.hash?.includes("access_token")) {
          window.history.replaceState({}, "", "/");
        }
        setAuthChecked(true);
        setAuthLoading(false);
      }
    };

    // Safety timeout
    const safetyTimer = setTimeout(() => {
      finishLoading();
    }, 5000);

    // onAuthStateChange catches ALL auth events including email confirmation
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        if (session?.user) {
          setUser(session.user);
          loadFromLocal();
          try {
            // Check if Supabase has profile data
            const { data } = await supabase.from("profiles").select("profile_data").eq("id", session.user.id).single();
            if (!data?.profile_data || Object.keys(data.profile_data).length === 0) {
              // Profile is empty — push local data up immediately
              const local = JSON.parse(localStorage.getItem("leanplan_v4") || "{}");
              if (local.profile) {
                console.log("Pushing local profile to Supabase...");
                await saveToSupabase(session.user.id, local);
                setProfile(local.profile);
              }
            } else {
              await loadFromSupabase(session.user.id);
            }
          } catch(e){ console.error("Supabase sync failed:", e); }
          clearTimeout(safetyTimer);
          finishLoading();
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      } else if (event === "INITIAL_SESSION") {
        if (!session?.user) {
          loadFromLocal();
          clearTimeout(safetyTimer);
          finishLoading();
        }
      }
    });

    return () => { subscription.unsubscribe(); clearTimeout(safetyTimer); };
  }, []);

  // Save to both localStorage and Supabase when data changes
  useEffect(()=>{
    if (loading) return;
    const data = {profile,entries,favourites,removed,mealLog,workoutLog,water,journal,measurements,darkOverride};
    try { localStorage.setItem("leanplan_v4", JSON.stringify(data)); } catch(e){}
    if (user) {
      // Debounce Supabase saves to avoid too many writes
      const timer = setTimeout(() => saveToSupabase(user.id, data), 2000);
      return () => clearTimeout(timer);
    }
  },[profile,entries,favourites,removed,mealLog,workoutLog,water,journal,measurements,darkOverride,loading,user]);

  const loadBg = systemDark ? "#000" : "#f2f2f7";
  const loadText = systemDark ? "#8e8e93" : "#8e8e93";
  if (loading) return <div style={{ minHeight:"100vh", background:loadBg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:FONT }}><div style={{ textAlign:"center" }}><div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
        <img src="/leanplan_app_icon.png" alt="" style={{ height:52, width:52, objectFit:"contain", borderRadius:12 }} />
        <span style={{ fontSize:28, fontWeight:800, letterSpacing:"-0.02em", fontFamily:FONT }}>
          <span style={{ color:loadBg==="#000"?"#fff":"#000" }}>Lean</span><span style={{ color:"#0a84ff" }}>Plan</span>
        </span>
      </div>
      <p style={{ color:loadText }}>Loading...</p></div></div>;





  // Show tip splash on every open (after profile is loaded)
  if (showTipSplash && profile && !showAuth && !showWelcome && !showOnboarding) {
    return <TipSplashScreen tip={DAILY_TIPS[splashTipIdx]} onDismiss={()=>setShowTipSplash(false)} />;
  }

  // Apply theme first — needed by all render paths
  const isDark = darkOverride !== null ? darkOverride : systemDark;
  C = isDark ? DARK : LIGHT;

  // ── Render sequence ──────────────────────────────────────────────────────────

  // 1. Auth screen — shown when explicitly requested
  if (showAuth) return <AuthScreen
    onAuth={async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setShowAuth(false);
        setSyncing(true);
        try {
          await loadFromSupabase(session.user.id);
          // Push any local data up if Supabase is empty
          const { data } = await supabase.from("profiles").select("profile_data").eq("id", session.user.id).single();
          if (!data?.profile_data || Object.keys(data.profile_data).length === 0) {
            const local = JSON.parse(localStorage.getItem("leanplan_v4") || "{}");
            if (local.profile) await saveToSupabase(session.user.id, local);
          }
        } catch(e){}
        setSyncing(false);
      }
    }}
    onSkip={()=>setShowAuth(false)}
  />;

  // 2. Loading screen — only while auth check runs with no cached data
  if (authLoading && !profile) return <div style={{ minHeight:"100vh", background:loadBg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:FONT }}><div style={{ textAlign:"center" }}><div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}><img src="/leanplan_app_icon.png" alt="" style={{ height:52, width:52, objectFit:"contain", borderRadius:12 }} /><span style={{ fontSize:28, fontWeight:800, letterSpacing:"-0.02em", fontFamily:FONT }}><span style={{ color:loadBg==="#000"?"#fff":"#000" }}>Lean</span><span style={{ color:"#0a84ff" }}>Plan</span></span></div><p style={{ color:loadText }}>Loading...</p></div></div>;

  // 3. Welcome screen — first time, no profile, no user
  if (!profile && !user && !showOnboarding) return <WelcomeScreen
    onNew={()=>{ setTrialStart(); setShowOnboarding(true); }}
    onSignIn={()=>setShowAuth(true)}
  />;

  // 4. Onboarding — after Get Started
  if (!profile) return <Onboarding onDone={p=>{ 
    setProfile(p);
    setTrialStart();
    try {
      localStorage.setItem("leanplan_v4", JSON.stringify({profile:p, entries:[], favourites:[], removed:[], mealLog:{}, workoutLog:{}, water:{}, journal:{}, measurements:[], darkOverride:null}));
    } catch(e){}
    // If logged in, save to Supabase too
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) saveToSupabase(session.user.id, { profile:p, entries:[], favourites:[], removed:[], mealLog:{}, workoutLog:{}, water:{}, journal:{}, measurements:[], darkOverride:null });
    });
  }} />;

  // 5. Trial expired — show subscribe screen
  if (isTrialExpired() && !isPro) return <TrialExpiredScreen onSubscribe={()=>setShowPaywall(true)} />;

  const cur = entries.length>0?entries[entries.length-1].weight:profile.startWeightLbs;
  const lost = Math.max(0,profile.startWeightLbs-cur);
  const pct = Math.min(100,Math.round((lost/profile.targetLbs)*100));
  const TAB_COLORS = {Today:"#007aff",Meals:"#34c759",Train:"#5ac8fa",Track:"#af52de",Coach:"#ff2d55",Profile:"#ff9500"};

  const handleReset = () => {
    const savedPro = localStorage.getItem("leanplan_pro");
    const hasRealSub = savedPro && JSON.parse(savedPro)?.customerId && JSON.parse(savedPro)?.customerId !== "bypass";

    if (hasRealSub) {
      const choice = window.confirm(
        "Reset your fitness data and start fresh?\n\n✓ Your Pro subscription will be kept\n✓ All workout, meal and progress data will be cleared\n✓ You can set up a new goal in onboarding\n\nTap OK to reset your data."
      );
      if (!choice) return;
      // Clear fitness data but keep Pro status
      localStorage.removeItem("leanplan_v4");
      localStorage.removeItem("leanplan_lifts");
      localStorage.removeItem("leanplan_trial_start");
      localStorage.removeItem("leanplan_pro");
      localStorage.removeItem("leanplan_gen_count");
      localStorage.removeItem("leanplan_disliked_meals");
      localStorage.removeItem("leanplan_liked_meals");
      setProfile(null); setEntries([]); setFavourites([]); setRemoved([]);
      setMealLog({}); setWorkoutLog({}); setWater({}); setJournal({}); setMeasurements([]);
      setIsPro(false); setProData(null);
    } else {
      if (!window.confirm("Reset all data? This cannot be undone.")) return;
      localStorage.removeItem("leanplan_v4");
      localStorage.removeItem("leanplan_lifts");
      localStorage.removeItem("leanplan_pro");
      localStorage.removeItem("leanplan_device_id");
      setProfile(null); setEntries([]); setFavourites([]); setRemoved([]);
      setMealLog({}); setWorkoutLog({}); setWater({}); setJournal({}); setMeasurements([]);
      setIsPro(false); setProData(null);
    }
  };

  return (
    <div style={{ background:C.bg, minHeight:"100vh", fontFamily:FONT, color:C.text, width:"100%", overflowX:"hidden" }}>
      <style>{`* { box-sizing:border-box; margin:0; padding:0; } input,select,textarea { outline:none; } html,body { width:100%; overflow-x:hidden; background:${C.bg}; font-family:${FONT}; color-scheme:${isDark?"dark":"light"}; } #root { width:100%; } ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-thumb { background:${C.divider}; border-radius:4px; } ::placeholder { color:${C.muted}; }`}</style>

      <div style={{ padding:"44px 18px 10px", background:isDark?"rgba(0,0,0,0.85)":"rgba(242,242,247,0.95)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, zIndex:10, width:"100%" }}>
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
            <div><span style={{ color:C.green, fontWeight:700, fontSize:16 }}>{toKg(lost)}</span><span style={{ color:C.muted, fontSize:13 }}> / {(profile.targetLbs*0.453592).toFixed(1)} kg</span></div>
            <div style={{ background:C.border, borderRadius:99, height:3, marginTop:4, overflow:"hidden", width:80 }}>
              <div style={{ width:`${pct}%`, height:"100%", background:`linear-gradient(90deg, ${C.accent}, ${C.green})`, borderRadius:99 }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding:"8px 14px 100px" }}>
        {/* Trial banner or Pro upgrade banner */}
        {!isPro && isTrialActive() && (
          <div style={{ background:`linear-gradient(135deg, #1c1c2e, #2d2b55)`, border:`1px solid rgba(88,86,214,0.4)`, borderRadius:14, padding:"12px 16px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:"0 4px 16px rgba(88,86,214,0.2)" }}>
            <div>
              <p style={{ color:"#fff", fontWeight:700, fontSize:13, margin:0 }}>✦ Full access — {getTrialDaysLeft()} day{getTrialDaysLeft()!==1?"s":""} left</p>
              <p style={{ color:"rgba(255,255,255,0.6)", fontSize:11, margin:"2px 0 0" }}>Subscribe before your trial ends to keep everything</p>
            </div>
            <button onClick={()=>setShowPaywall(true)} style={{ background:"#5856d6", border:"none", borderRadius:99, padding:"7px 14px", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:FONT, whiteSpace:"nowrap" }}>Subscribe →</button>
          </div>
        )}
        {!effectiveIsPro && <ProBanner onUpgrade={()=>setShowPaywall(true)} />}

        {tab==="Today"&&<TodayTab profile={profile} entries={entries} mealLog={mealLog} workoutLog={workoutLog} water={water} setWater={setWater} journal={journal} setJournal={setJournal} measurements={measurements} />}
        {tab==="Meals"&&<MealsTab profile={profile} favourites={favourites} setFavourites={setFavourites} removed={removed} setRemoved={setRemoved} mealLog={mealLog} setMealLog={setMealLog} isPro={effectiveIsPro} onUpgrade={()=>setShowPaywall(true)} shownMeals={todaysMeals} setShownMeals={(meals)=>{
          setTodaysMeals(meals);
          try {
            if (meals) localStorage.setItem("leanplan_todays_meals", JSON.stringify({ date: new Date().toISOString().split("T")[0], meals }));
            else localStorage.removeItem("leanplan_todays_meals");
          } catch(e){}
        }} />}
        {tab==="Train"&&(effectiveIsPro ? <TrainTab profile={profile} workoutLog={workoutLog} setWorkoutLog={setWorkoutLog} setProfile={setProfile} savedWorkout={todaysWorkout} setSavedWorkout={setTodaysWorkout} /> : <LockedTab feature="Workout tracking, lift tracker and rest day planner" onUpgrade={()=>setShowPaywall(true)} />)}
        {tab==="Track"&&(effectiveIsPro ? <TrackTab profile={profile} entries={entries} setEntries={fn=>setEntries(typeof fn==="function"?fn(entries):fn)} measurements={measurements} setMeasurements={setMeasurements} workoutLog={workoutLog} /> : <LockedTab feature="Progress tracking, measurements and body stats" onUpgrade={()=>setShowPaywall(true)} />)}
        {tab==="Coach"&&(effectiveIsPro ? <CoachTab profile={profile} setProfile={setProfile} /> : <LockedTab feature="AI personal coach" onUpgrade={()=>setShowPaywall(true)} />)}
        {tab==="Profile"&&<ProfileTab profile={profile} setProfile={setProfile} onReset={handleReset} isDark={isDark} darkOverride={darkOverride} setDarkOverride={setDarkOverride} isPro={effectiveIsPro} proData={proData} onUpgrade={()=>setShowPaywall(true)} user={user} onShowAuth={()=>setShowAuth(true)} />}

      </div>

      {/* Paywall modal — outside scroll container */}
      {showPaywall && <PaywallModal onClose={()=>setShowPaywall(false)} />}

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

export default function App() {
  return <ErrorBoundary><AppInner /></ErrorBoundary>;
}