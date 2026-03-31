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

const ALLERGENS = ["Eggs","Nuts","Peanuts","Soya","Shellfish","Fish","Sesame","Celery","Mustard","Sulphites"];
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

// Calculate programme length in weeks based on goal, target weight, and pace
const getProgrammeLengthWeeks = (profile) => {
  const goal = profile?.goal || "lose_weight";
  if (goal === "lose_weight" || goal === "all") {
    const startKg = parseFloat(profile?.startWeight || profile?.startWeightKg || 80);
    const targetKg = parseFloat(profile?.targetRaw || profile?.targetWeightKg || 70);
    const kgToLose = Math.max(0, startKg - targetKg);
    const pace = getPace(profile?.paceId || "normal");
    if (kgToLose > 0 && pace.kgPerWk > 0) {
      const rawWeeks = Math.ceil(kgToLose / pace.kgPerWk);
      return Math.min(52, Math.max(4, rawWeeks));
    }
  }
  return 16;
};

// Get current training block based on start date
const getCurrentBlock = (profile) => {
  if (!profile?.trainingStartDate) return { ...PERIODISATION_BLOCKS[0], weekInBlock: 0, weeksSinceStart: 0, isProgrammeComplete: false };
  const weeksSinceStart = Math.floor((Date.now() - new Date(profile.trainingStartDate)) / (7 * 24 * 60 * 60 * 1000));
  const programmeLengthWeeks = getProgrammeLengthWeeks(profile);
  const isProgrammeComplete = weeksSinceStart >= programmeLengthWeeks;
  const clampedWeeks = Math.min(weeksSinceStart, programmeLengthWeeks - 1);
  const blockIndex = Math.min(Math.floor(clampedWeeks / 4), PERIODISATION_BLOCKS.length - 1);
  const weekInBlock = clampedWeeks % 4;
  return { ...PERIODISATION_BLOCKS[blockIndex], weekInBlock, weeksSinceStart, isProgrammeComplete, programmeLengthWeeks };
};

// Build a workout from the exercise database filtered by user profile
const buildWorkout = (type, profile, block) => {
  const userEquip = profile?.equipment || ["dumbbells","bodyweight"];
  const userInjuries = profile?.injuries?.filter(i=>i!=="none") || [];
  const fitnessLevel = profile?.fitnessLevel || "beginner";
  const workoutStyle = profile?.workoutStyle || "mixed";

  // Exercises too complex for beginners
  const advancedExercises = ["Skull Crusher","Ab Wheel Rollout","Romanian Deadlift","Nordic Curl",
    "Close-Grip Bench Press","Bulgarian Split Squat","Pull Up","Pallof Press","Hanging Knee Raise"];
  const intermediateExercises = [...advancedExercises,"Dumbbell Bent-Over Row","Upright Row",
    "Arnold Press","Cable Crunch","Hip Thrust","Straight-Arm Pulldown"];

  // Filter exercises by available equipment, injuries, and fitness level
  const available = EXERCISE_DB.filter(ex => {
    if (ex.equip.length > 0 && !ex.equip.some(e => userEquip.includes(e))) return false;
    if (ex.avoid.some(a => userInjuries.includes(a))) return false;
    if (fitnessLevel === "beginner" && advancedExercises.includes(ex.name)) return false;
    if (fitnessLevel === "beginner" && intermediateExercises.includes(ex.name)) return false;
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

const BigChip = ({ children, color=C.accent, active, onClick }) => (
  <span onClick={onClick} style={{ background:active?color:`${color}12`, color:active?"#fff":color, border:`1.5px solid ${active?color:`${color}55`}`, borderRadius:99, padding:"13px 24px", fontSize:16, fontWeight:600, cursor:onClick?"pointer":"default", transition:"all 0.2s", display:"inline-block", whiteSpace:"nowrap" }}>{children}</span>
);

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
const TOTAL_STEPS = 17;

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

const JournalCard = ({ journal, setJournal, today }) => {
  const [showJournal, setShowJournal] = useState(false);
  return (
    <Card>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:showJournal?12:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}><Icon name="note" size={14} color={C.muted} /><p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", margin:0 }}>DAILY JOURNAL</p></div>
        <button onClick={()=>setShowJournal(s=>!s)} style={{ background:"none", border:"none", color:C.accent, fontSize:13, cursor:"pointer", fontFamily:FONT, fontWeight:600 }}>{showJournal?"Done":"Write"}</button>
      </div>
      {showJournal&&<textarea value={journal[today]||""} onChange={e=>setJournal(j=>({...j,[today]:e.target.value}))} placeholder="How are you feeling today? Energy levels, sleep, anything notable..." style={{ width:"100%", minHeight:80, background:C.sectionBg, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 12px", fontSize:14, fontFamily:FONT, color:C.text, outline:"none", resize:"vertical" }} />}
      {!showJournal&&journal[today]&&<p style={{ color:C.textSec, fontSize:14, margin:0, marginTop:8, lineHeight:1.6 }}>{journal[today]}</p>}
    </Card>
  );
};

const TodayTab = ({ profile, entries, mealLog, setMealLog, workoutLog, water, setWater, journal, setJournal, measurements, mealPlan, setTab }) => {
  const today = todayKey();
  const cur = entries.length>0?entries[entries.length-1].weight:profile.startWeightLbs;
  const lost = Math.max(0,profile.startWeightLbs-cur);
  const lostKg = parseFloat((lost*0.453592).toFixed(1));
  const pace = getPace(profile.paceId||"normal");
  const tdee = calcTDEE(profile);
  const targetCals = tdee ? tdee - Math.round(pace.lbs*500) : 2000;
  const targetProtein = profile.age>=50 ? Math.round((profile.startWeightLbs*0.453592)*2.4) : Math.round((profile.startWeightLbs*0.453592)*2.2);
  const targetCarbs = Math.round((targetCals * 0.4) / 4);
  const targetFat = Math.round((targetCals * 0.3) / 9);
  const todayMeals = mealLog[today]||[];
  const todayCalories = todayMeals.reduce((a,m)=>a+m.cals,0);
  const todayProtein = todayMeals.reduce((a,m)=>a+m.protein,0);
  const todayCarbs = todayMeals.reduce((a,m)=>a+(m.carbs||0),0);
  const todayFat = todayMeals.reduce((a,m)=>a+(m.fat||0),0);
  const todayWater = water[today]||0;
  const todayWorked = workoutLog[today];

  // Planned meals count
  const todayPlan = mealPlan?.days?.find(d => d.date === today);
  const plannedCount = todayPlan?.meals?.length || 5;

  // Streak
  let streak=0;
  for (let i=0;;i++) {
    const d=new Date(); d.setDate(d.getDate()-i);
    const k=d.toISOString().split("T")[0];
    if ((mealLog[k]||[]).length>0||(workoutLog[k])||((water[k]||0)>0)) streak++;
    else break;
  }

  // Today's workout
  const weekPlan = getWeeklyPlan(profile);
  const dayMap = { Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6, Sun:0 };
  const todayDayOfWeek = new Date().getDay();
  const sessionIdx = weekPlan.days.findIndex(d => dayMap[d] === todayDayOfWeek);
  const todaySession = sessionIdx !== -1 ? weekPlan.sessions[sessionIdx] : null;
  const block = getCurrentBlock(profile);

  // Calorie ring
  const circumference = 2 * Math.PI * 34;
  const calOffset = circumference - (circumference * Math.min(1, todayCalories / targetCals));

  // Personalised insights — pick the most relevant one for today
  const insights = (() => {
    const msgs = [];
    const hour = new Date().getHours();

    // Workout insights
    const weekWorkouts = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-d.getDay()+1+i); return workoutLog[d.toISOString().split("T")[0]]?1:0; }).reduce((a,b)=>a+b,0);
    if (todayWorked) msgs.push({ text:`Workout done ✓ — ${weekWorkouts} of ${profile.workoutsPerWeek||3} this week`, priority:2 });
    if (!todayWorked && todaySession && hour >= 16) msgs.push({ text:`Still time for your ${todaySession.label} today 💪`, priority:3 });

    // Protein insights
    const proteinDaysHit = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-i); const k=d.toISOString().split("T")[0]; return (mealLog[k]||[]).reduce((a,m)=>a+m.protein,0) >= targetProtein ? 1 : 0; }).reduce((a,b)=>a+b,0);
    if (proteinDaysHit >= 4) msgs.push({ text:`Protein target hit ${proteinDaysHit} days this week 💪`, priority:2 });
    if (todayProtein >= targetProtein) msgs.push({ text:`Protein target hit today — great work!`, priority:1 });
    if (todayProtein > 0 && todayProtein < targetProtein * 0.5 && hour >= 18) msgs.push({ text:`You're low on protein today — add a shake or snack`, priority:4 });

    // Calorie insights
    if (todayCalories > 0 && todayCalories < targetCals * 0.6 && hour >= 19) msgs.push({ text:`You're ${targetCals - todayCalories} calories under today — consider a snack`, priority:3 });
    if (todayCalories > targetCals * 1.1) msgs.push({ text:`Over your calorie target today — balance it out tomorrow`, priority:3 });

    // Streak insights
    if (streak >= 7) msgs.push({ text:`${streak} day streak — you're on fire! 🔥`, priority:1 });
    if (streak >= 3 && streak < 7) msgs.push({ text:`${streak} day streak — keep it going! 🔥`, priority:2 });

    // Water insights
    if (todayWater >= 8) msgs.push({ text:`Hydration goal hit today — well done 💧`, priority:1 });
    if (todayWater === 0 && hour >= 12) msgs.push({ text:`Don't forget to drink water today 💧`, priority:3 });

    // Weight progress
    if (lostKg >= 1) msgs.push({ text:`${lostKg}kg lost so far — you're making real progress`, priority:2 });

    // Weekly workout goal hit
    if (weekWorkouts >= (profile.workoutsPerWeek||3)) msgs.push({ text:`Weekly workout goal hit! 🎯 Rest up or go for a bonus session`, priority:1 });

    // Sort by priority (lower = more important) and return top one
    if (msgs.length === 0) return { text:`Log your meals and workouts to get personalised insights`, priority:5 };
    return msgs.sort((a,b) => a.priority - b.priority)[0];
  })();

  // Date + greeting
  const dayName = new Date().toLocaleDateString("en-GB", { weekday:"long", day:"numeric", month:"long" });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom:12 }}>
        <p style={{ color:C.muted, fontSize:13, margin:"0 0 2px" }}>{dayName}</p>
        <h2 style={{ color:C.text, fontSize:22, fontWeight:700, margin:"0 0 8px" }}>{greeting}{profile.name?`, ${profile.name}`:""} 👋</h2>
        <div style={{ background:`${C.accent}18`, border:`1px solid ${C.accent}44`, borderRadius:12, padding:"10px 14px" }}>
          <p style={{ color:C.accent, fontSize:14, fontWeight:600, margin:0 }}>{insights.text}</p>
        </div>
      </div>

      {/* Calorie ring + macros */}
      <div style={{ background:C.card, borderRadius:16, padding:"14px 16px", marginBottom:10, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:16 }}>
        <div style={{ position:"relative", width:80, height:80, flexShrink:0 }}>
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke={C.sectionBg} strokeWidth="8"/>
            <circle cx="40" cy="40" r="34" fill="none" stroke={C.accent} strokeWidth="8"
              strokeDasharray={circumference} strokeDashoffset={calOffset}
              strokeLinecap="round" transform="rotate(-90 40 40)"
              style={{ transition:"stroke-dashoffset 0.6s ease" }}/>
          </svg>
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
            <span style={{ color:C.text, fontSize:16, fontWeight:700, lineHeight:1 }}>{todayCalories}</span>
            <span style={{ color:C.muted, fontSize:10 }}>/ {targetCals}</span>
          </div>
        </div>
        <div style={{ flex:1 }}>
          <p style={{ color:C.muted, fontSize:11, fontWeight:600, letterSpacing:"0.06em", margin:"0 0 8px" }}>CALORIES TODAY</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
            {[
              { label:"protein", val:todayProtein, target:targetProtein, color:C.green },
              { label:"carbs", val:todayCarbs, target:targetCarbs, color:C.orange },
              { label:"fat", val:todayFat, target:targetFat, color:C.red },
            ].map(m=>(
              <div key={m.label}>
                <p style={{ color:C.text, fontSize:14, fontWeight:700, margin:0 }}>{m.val}g</p>
                <p style={{ color:C.muted, fontSize:11, margin:0 }}>{m.label}</p>
                <div style={{ height:3, background:C.sectionBg, borderRadius:99, marginTop:4 }}>
                  <div style={{ width:`${Math.min(100, Math.round((m.val/m.target)*100))}%`, height:"100%", background:m.color, borderRadius:99 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Meals + Workout summary */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
        <div style={{ background:C.card, borderRadius:16, padding:14, border:`1px solid ${C.border}` }}>
          <p style={{ color:C.muted, fontSize:11, fontWeight:600, letterSpacing:"0.06em", margin:"0 0 6px" }}>MEALS</p>
          <p style={{ color:C.text, fontSize:22, fontWeight:700, margin:"0 0 2px" }}>{todayMeals.length}<span style={{ color:C.muted, fontSize:14, fontWeight:400 }}> / {plannedCount}</span></p>
          <p style={{ color:C.muted, fontSize:12, margin:"0 0 10px" }}>logged today</p>
          <button onClick={()=>setTab("Meals")} style={{ width:"100%", background:C.accent, border:"none", borderRadius:10, padding:"7px 0", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:FONT }}>View meals →</button>
        </div>
        <div style={{ background:C.card, borderRadius:16, padding:14, border:`1px solid ${C.border}` }}>
          <p style={{ color:C.muted, fontSize:11, fontWeight:600, letterSpacing:"0.06em", margin:"0 0 6px" }}>WORKOUT</p>
          {todayWorked ? (
            <>
              <p style={{ color:C.green, fontSize:15, fontWeight:700, margin:"0 0 2px" }}>Done ✓</p>
              <p style={{ color:C.muted, fontSize:12, margin:"0 0 10px" }}>{todayWorked.type.split("-").join(" ")}</p>
            </>
          ) : todaySession ? (
            <>
              <p style={{ color:C.text, fontSize:15, fontWeight:700, margin:"0 0 2px" }}>{todaySession.label}</p>
              <p style={{ color:C.muted, fontSize:12, margin:"0 0 10px" }}>Week {block.week} · {block.sets} sets</p>
            </>
          ) : (
            <>
              <p style={{ color:C.text, fontSize:15, fontWeight:700, margin:"0 0 2px" }}>Rest day</p>
              <p style={{ color:C.muted, fontSize:12, margin:"0 0 10px" }}>Recover well</p>
            </>
          )}
          {!todayWorked && todaySession ? (
            <button onClick={()=>setTab("Train")} style={{ width:"100%", background:C.accent, border:"none", borderRadius:10, padding:"7px 0", color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:FONT }}>Start →</button>
          ) : (
            <button onClick={()=>setTab("Train")} style={{ width:"100%", background:"none", border:`1px solid ${C.border}`, borderRadius:10, padding:"7px 0", color:C.muted, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:FONT }}>View plan →</button>
          )}
        </div>
      </div>

      {/* Water + Progress */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
        <div style={{ background:C.card, borderRadius:16, padding:14, border:`1px solid ${C.border}` }}>
          <p style={{ color:C.muted, fontSize:11, fontWeight:600, letterSpacing:"0.06em", margin:"0 0 6px" }}>WATER</p>
          <p style={{ color:C.teal, fontSize:22, fontWeight:700, margin:"0 0 4px" }}>{(todayWater*0.25).toFixed(2)}L</p>
          <div style={{ height:4, background:C.sectionBg, borderRadius:99, marginBottom:8 }}>
            <div style={{ width:`${Math.min(100, Math.round((todayWater/8)*100))}%`, height:"100%", background:C.teal, borderRadius:99 }} />
          </div>
          <div style={{ display:"flex", gap:6 }}>
            <button onClick={()=>setWater(w=>({...w,[today]:Math.max(0,(w[today]||0)-1)}))} style={{ flex:1, background:C.sectionBg, border:"none", borderRadius:8, padding:"6px 0", color:C.teal, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:FONT }}>−</button>
            <button onClick={()=>setWater(w=>({...w,[today]:Math.min(16,(w[today]||0)+1)}))} style={{ flex:2, background:`${C.teal}18`, border:`1px solid ${C.teal}44`, borderRadius:8, padding:"6px 0", color:C.teal, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:FONT }}>+250ml</button>
          </div>
        </div>
        <div style={{ background:C.card, borderRadius:16, padding:14, border:`1px solid ${C.border}` }}>
          <p style={{ color:C.muted, fontSize:11, fontWeight:600, letterSpacing:"0.06em", margin:"0 0 6px" }}>PROGRESS</p>
          <p style={{ color:C.text, fontSize:22, fontWeight:700, margin:"0 0 2px" }}>{toKg(cur)}<span style={{ fontSize:14, color:C.muted }}> kg</span></p>
          <p style={{ color:lostKg>0?C.green:C.muted, fontSize:12, fontWeight:600, margin:"0 0 6px" }}>{lostKg>0?`${lostKg} kg lost`:"Starting weight"}</p>
          <p style={{ color:C.muted, fontSize:11, margin:0 }}>🔥 {streak} day streak</p>
        </div>
      </div>

      {/* Journal */}
      <JournalCard journal={journal} setJournal={setJournal} today={today} />
    </div>
  );
};


// ── MEALS TAB ─────────────────────────────────────────────────────────────────
// ── Meal Loading Indicator ────────────────────────────────────────────────────
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

const MealPlanLoader = ({ progress }) => {
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

// ── Meal Carousel ─────────────────────────────────────────────────────────────
const MealCarousel = ({ meals, favourites, likedMeals, mealLog, today, onLike, onDislike, onLog, onRemoveLog, targetCals, isGuided, onSwap, swappingId }) => {
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
      {isGuided ? (
        <div style={{ display:"flex", gap:8, marginBottom:8 }}>
          <button
            onClick={()=>onSwap(m)}
            disabled={swappingId === m.id}
            style={{ background:swappingId===m.id?C.sectionBg:`${C.accent}12`, border:`1.5px solid ${C.accent}`, borderRadius:12, padding:"8px 14px", color:C.accent, fontSize:12, fontWeight:700, cursor:swappingId===m.id?"default":"pointer", fontFamily:FONT, flexShrink:0 }}
          >{swappingId===m.id ? "⏳ Swapping..." : "⇄ Swap"}</button>
          <button
            onClick={()=>onDislike(m)}
            style={{ width:40, height:40, background:"none", border:`1.5px solid ${C.border}`, borderRadius:12, color:C.red, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}
            title="Never show this meal again"
          >👎</button>
          <button
            onClick={()=>{ 
              if(isLogged) {
                const idx = (mealLog[today]||[]).findIndex(l=>l.id===m?.id);
                if(idx !== -1) onRemoveLog(idx);
              } else {
                onLog(m);
              }
            }}
            style={{ flex:1, background:isLogged?`${C.green}15`:"none", border:`1.5px solid ${isLogged?C.green:C.border}`, borderRadius:12, padding:"8px 0", color:isLogged?C.green:C.text, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:FONT, transition:"all 0.2s" }}
          >{isLogged ? "✓ Undo" : "+ Log meal"}</button>
        </div>
      ) : (
        <div style={{ display:"flex", gap:8, marginBottom:8 }}>
          <button onClick={()=>onLike(m)} style={{ width:44, height:44, background:isLiked?`${C.green}20`:"none", border:`1.5px solid ${isLiked?C.green:C.border}`, borderRadius:12, color:C.green, fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }} title="Like this meal">👍</button>
          <button onClick={()=>onDislike(m)} style={{ width:44, height:44, background:"none", border:`1.5px solid ${C.border}`, borderRadius:12, color:C.red, fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }} title="Never show again">👎</button>
          <button onClick={()=>{ 
            if(isLogged) {
              const idx = (mealLog[today]||[]).findIndex(l=>l.id===m?.id);
              if(idx !== -1) onRemoveLog(idx);
            } else {
              onLog(m);
            }
          }} style={{ flex:1, background:isLogged?`${C.green}15`:"none", border:`1.5px solid ${isLogged?C.green:C.border}`, borderRadius:12, padding:"10px 0", color:isLogged?C.green:C.text, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:FONT, transition:"all 0.2s" }}>{isLogged ? "✓ Logged — tap to undo" : "+ Log Meal"}</button>
        </div>
      )}

      {/* Swipe hint — only on first card first visit */}
      {activeIdx === 0 && meals.length > 1 && (
        <p style={{ color:C.muted, fontSize:11, textAlign:"center", marginTop:4 }}>← Swipe to see all {meals.length} meals →</p>
      )}
    </div>
  );
};

const MealsTab = ({ profile, favourites, setFavourites, removed, setRemoved, mealLog, setMealLog, isPro, onUpgrade, mealPlan, onSaveMealPlan, generating, setGenerating, generateProgress, setGenerateProgress, generateError, setGenerateError }) => {
  const isGuided = profile?.appMode !== "custom";
  const [section, setSection] = useState("meals");
  const [suppOpen, setSuppOpen] = useState(null);
  // generating/generateProgress/generateError lifted to App level (survives tab switches)
  const [swapConfirm, setSwapConfirm] = useState(null); // { meal, slotIndex }
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

            <div style={{ display:"flex", gap:8, marginTop:12 }}>
              <button onClick={()=>setChecked({})} style={{ flex:1, background:"none", border:`1px solid ${C.border}`, borderRadius:10, padding:"8px 0", color:C.muted, fontSize:13, cursor:"pointer", fontFamily:FONT }}>Reset ticks</button>
              <button onClick={()=>savePantry([])} style={{ flex:1, background:"none", border:`1px solid ${C.border}`, borderRadius:10, padding:"8px 0", color:C.muted, fontSize:13, cursor:"pointer", fontFamily:FONT }}>Clear pantry</button>
              <button onClick={()=>setSection("meals")} style={{ flex:1, background:"none", border:`1px solid ${C.accent}`, borderRadius:10, padding:"8px 0", color:C.accent, fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:FONT }}>↻ New plan</button>
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

// ── Weekly Plan Generator ────────────────────────────────────────────────────
const getWeeklyPlan = (profile) => {
  const days = profile?.workoutsPerWeek || 3;
  const goal = profile?.goal || "lose_weight";
  const hasCardio = (profile?.equipment || []).some(e => ["rowing","crosstrainer","treadmill","bike"].includes(e));

  // Session type definitions
  const FB = { type:"full-body", label:"Full Body", color:"#007aff", desc:"Strength + cardio finisher" };
  const FBS = { type:"full-body", label:"Full Body", color:"#007aff", desc:"Strength focus" };
  const UB = { type:"upper-body", label:"Upper Body", color:"#af52de", desc:"Push & pull" };
  const LB = { type:"lower-body", label:"Lower Body", color:"#34c759", desc:"Legs & core" };
  const CD = { type:"cardio", label:"Cardio", color:"#ff9500", desc:"Steady state or intervals" };
  const ST = { type:"strength", label:"Strength", color:"#ff2d55", desc:"Heavy compound lifts" };

  // Plans by goal and days
  const plans = {
    lose_weight: {
      2: { sessions:[FB,CD], note:"Full body strength preserves muscle while cardio burns calories. Best combo for fat loss." },
      3: { sessions:[FB,FB,CD], note:"Two full-body sessions build strength, one cardio session maximises calorie burn." },
      4: { sessions:[UB,LB,CD,FB], note:"Upper/lower split with a dedicated cardio day and a full-body finisher." },
      5: { sessions:[UB,LB,CD,UB,LB], note:"Full upper/lower split. Add cardio finishers to strength days if time allows." },
    },
    build_muscle: {
      2: { sessions:[UB,LB], note:"Upper/lower split. Hit every muscle group twice per week for maximum growth." },
      3: { sessions:[FB,FBS,FB], note:"Full body 3× per week is optimal for muscle growth with limited training days." },
      4: { sessions:[UB,LB,UB,LB], note:"Upper/lower split hits each muscle group twice. The gold standard for hypertrophy." },
      5: { sessions:[UB,LB,UB,LB,FB], note:"Push volume with an upper/lower split plus a full-body day for extra frequency." },
    },
    get_fitter: {
      2: { sessions:[FB,CD], note:"One full-body session builds a strength base, one cardio session builds endurance." },
      3: { sessions:[FB,CD,FB], note:"Alternating strength and cardio builds all-round fitness efficiently." },
      4: { sessions:[FB,CD,FB,CD], note:"Equal strength and cardio work. Best approach for general fitness." },
      5: { sessions:[FB,CD,UB,CD,LB], note:"High frequency. Variety keeps it interesting and builds fitness fast." },
    },
    all: {
      2: { sessions:[FB,CD], note:"Full body strength + cardio covers all goals. Efficient and effective." },
      3: { sessions:[FB,FB,CD], note:"Two full-body sessions for muscle + fat loss, one cardio day for fitness." },
      4: { sessions:[UB,LB,CD,FB], note:"Balanced split covering strength, muscle, fat loss and cardiovascular fitness." },
      5: { sessions:[UB,LB,CD,UB,LB], note:"Full programme hitting all goals. Add cardio finishers to strength days." },
    },
  };

  const goalPlan = plans[goal] || plans.all;
  const plan = goalPlan[Math.min(days, 5)] || goalPlan[3];

  // Suggested days based on frequency
  const daySuggestions = {
    2: ["Mon","Thu"],
    3: ["Mon","Wed","Fri"],
    4: ["Mon","Tue","Thu","Fri"],
    5: ["Mon","Tue","Wed","Thu","Sat"],
  };

  return {
    sessions: plan.sessions,
    note: plan.note,
    days: daySuggestions[Math.min(days, 5)] || daySuggestions[3],
  };
};

// ── TRAIN TAB ─────────────────────────────────────────────────────────────────
const TrainTab = ({ profile, workoutLog, setWorkoutLog, setProfile, savedWorkout, setSavedWorkout, entries=[] }) => {
  const [selectedType, setSelectedType] = useState("full-body");
  const activeWorkout = savedWorkout?.workout || null;
  const activeExercises = savedWorkout?.exercises || [];
  const setActiveWorkout = (w) => setSavedWorkout(w ? { workout:w, exercises:savedWorkout?.exercises||[] } : null);
  const setActiveExercises = (e) => setSavedWorkout(prev => prev ? { ...prev, exercises:e } : null);
  const isGuided = profile?.appMode !== "custom";
  const [view, setView] = useState(isGuided ? "calendar" : "workout");
  const [expandedEx, setExpandedEx] = useState(null);
  const [loggedWeights, setLoggedWeights] = useState({});
  const [liftInputs, setLiftInputs] = useState({});
  const [lifts, setLifts] = useState(() => {
    try { return JSON.parse(localStorage.getItem("leanplan_lifts")||"{}" ); } catch { return {}; }
  });
  const [prToast, setPrToast] = useState(null);

  const showPrToast = (msg) => {
    setPrToast(msg);
    setTimeout(() => setPrToast(null), 3000);
  };

  const saveLift = (exName, weight, reps, sets) => {
    if (!weight) return;
    const newWeight = parseFloat(weight);
    const entry = { date:todayKey(), weight:newWeight, reps:parseInt(reps)||0, sets:parseInt(sets)||3, timestamp:Date.now() };
    const previous = lifts[exName] || [];
    const updated = {...lifts, [exName]: [...previous, entry].slice(-20)};
    setLifts(updated);
    localStorage.setItem("leanplan_lifts", JSON.stringify(updated));
    setLoggedWeights(lw => ({...lw, [exName]: true}));

    // Check for personal best
    const prevBest = previous.length > 0 ? Math.max(...previous.map(e => e.weight)) : 0;
    if (newWeight > prevBest && previous.length > 0) {
      showPrToast(`🏆 New PB! ${exName} — ${newWeight}kg`);
    }

    // Auto-log the workout on first exercise saved
    if (!workoutLog[todayKey()] && activeWorkout) {
      setWorkoutLog(wl=>({...wl,[todayKey()]:{type:selectedType,date:todayKey(),time:new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}}));
    }
  };
  const getLastLift = (exName) => {
    const entries = lifts[exName];
    if (!entries || entries.length === 0) return null;
    return entries[entries.length - 1];
  };
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

  // Determine today's prescribed session from weekly plan
  const getTodaySession = () => {
    const weekPlan = getWeeklyPlan(profile);
    const dayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon...
    // Map day names to day-of-week indices
    const dayMap = { Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6, Sun:0 };
    const sessionIndex = weekPlan.days.findIndex(d => dayMap[d] === dayOfWeek);
    if (sessionIndex === -1) return null; // rest day
    return { ...weekPlan.sessions[sessionIndex], dayName: weekPlan.days[sessionIndex] };
  };
  const todaySession = getTodaySession();
  const todayDayName = new Date().toLocaleDateString("en-GB", { weekday:"long" });

  return (
    <div>
      {/* PR Toast */}
      {prToast && (
        <div style={{ position:"fixed", top:80, left:"50%", transform:"translateX(-50%)", background:"linear-gradient(135deg, #f5a623, #f76b1c)", color:"#fff", borderRadius:14, padding:"12px 20px", fontSize:14, fontWeight:700, zIndex:999, boxShadow:"0 4px 20px rgba(0,0,0,0.25)", whiteSpace:"nowrap" }}>
          {prToast}
        </div>
      )}
      <div style={{ display:"flex", background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:3, marginBottom:12, gap:2 }}>
        {[["workout", isGuided?"Custom":"Workout"],["calendar","Programme"],["lifts","Progress"]].map(([k,l])=>(
          <button key={k} onClick={()=>setView(k)} style={{ flex:1, background:view===k?C.accent:"transparent", color:view===k?"#fff":C.muted, border:"none", borderRadius:10, padding:"8px 0", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:FONT, transition:"all 0.2s" }}>{l}</button>
        ))}
      </div>

      {view==="calendar"&&<>

        {/* End of programme celebration screen */}
        {isGuided && block.isProgrammeComplete && (() => {
          const goal = profile?.goal || "lose_weight";
          const isWeightGoal = goal === "lose_weight" || goal === "all";
          const startKg = parseFloat(profile?.startWeight || profile?.startWeightKg || 0);
          const targetKg = parseFloat(profile?.targetRaw || profile?.targetWeightKg || 0);
          const currentKg = entries?.length > 0 ? entries[entries.length-1].weight : startKg;
          const lostKg = startKg > 0 ? parseFloat((startKg - currentKg).toFixed(1)) : 0;
          const toGoKg = isWeightGoal ? parseFloat(Math.max(0, currentKg - targetKg).toFixed(1)) : 0;
          const targetHit = isWeightGoal && toGoKg === 0;
          const weeksCompleted = block.programmeLengthWeeks || 16;
          const startDate = profile?.trainingStartDate ? new Date(profile.trainingStartDate).toISOString().split("T")[0] : null;
          const totalWorkouts = startDate ? Object.keys(workoutLog).filter(d => d >= startDate).length : Object.keys(workoutLog).length;

          const motivationalLine = targetHit
            ? "You set a goal and you crushed it. Time to set a new one."
            : goal === "build_muscle"
            ? "Sixteen weeks of consistent training. Your body is stronger than when you started."
            : goal === "get_fitter"
            ? "Sixteen weeks of showing up. Your fitness foundation is built — now build higher."
            : `You've made real progress. ${toGoKg}kg to go — you know exactly what to do.`;

          const handleContinueToTarget = () => {
            setProfile({ ...profile, trainingStartDate: new Date().toISOString() });
          };
          const handleStartFresh = () => {
            setProfile({ ...profile, trainingStartDate: new Date().toISOString(), startWeight: String(currentKg), startWeightKg: currentKg });
          };

          return (
            <div style={{ marginBottom: 16 }}>
              <div style={{ background: `linear-gradient(135deg, ${C.yellow}22, ${C.orange}18)`, border: `1.5px solid ${C.yellow}55`, borderRadius: 20, padding: "22px 20px 18px", marginBottom: 12, textAlign: "center" }}>
                <div style={{ fontSize: 52, marginBottom: 8 }}>🏆</div>
                <h2 style={{ color: C.text, fontSize: 24, fontWeight: 800, margin: "0 0 6px" }}>Programme Complete!</h2>
                <p style={{ color: C.muted, fontSize: 14, margin: "0 0 16px" }}>{weeksCompleted} weeks. You did it.</p>
                <p style={{ color: C.textSec, fontSize: 13, lineHeight: 1.6, margin: "0 0 18px", fontStyle: "italic" }}>{motivationalLine}</p>
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  <div style={{ background: C.card, borderRadius: 12, padding: "10px 14px", flex: 1 }}>
                    <div style={{ color: C.accent, fontSize: 20, fontWeight: 800 }}>{totalWorkouts}</div>
                    <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>workouts</div>
                  </div>
                  {isWeightGoal && lostKg > 0 && (
                    <div style={{ background: C.card, borderRadius: 12, padding: "10px 14px", flex: 1 }}>
                      <div style={{ color: C.green, fontSize: 20, fontWeight: 800 }}>▼{lostKg}kg</div>
                      <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>lost</div>
                    </div>
                  )}
                  {isWeightGoal && !targetHit && toGoKg > 0 && (
                    <div style={{ background: C.card, borderRadius: 12, padding: "10px 14px", flex: 1 }}>
                      <div style={{ color: C.orange, fontSize: 20, fontWeight: 800 }}>{toGoKg}kg</div>
                      <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>to go</div>
                    </div>
                  )}
                  <div style={{ background: C.card, borderRadius: 12, padding: "10px 14px", flex: 1 }}>
                    <div style={{ color: C.purple, fontSize: 20, fontWeight: 800 }}>{weeksCompleted}</div>
                    <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>weeks</div>
                  </div>
                </div>
              </div>
              {targetHit ? (
                <button onClick={handleStartFresh} style={{ width: "100%", background: C.accent, border: "none", borderRadius: 14, padding: "14px 0", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>Start a new programme →</button>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {isWeightGoal && toGoKg > 0 && (
                    <button onClick={handleContinueToTarget} style={{ width: "100%", background: C.accent, border: "none", borderRadius: 14, padding: "14px 0", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>Continue to my target ({toGoKg}kg to go) →</button>
                  )}
                  <button onClick={handleStartFresh} style={{ width: "100%", background: "none", border: `1.5px solid ${C.border}`, borderRadius: 14, padding: "13px 0", color: C.textSec, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>{isWeightGoal ? "Change my goal and start fresh" : "Start a new programme"}</button>
                </div>
              )}
            </div>
          );
        })()}

        {/* Today's session card */}
        {isGuided && !block.isProgrammeComplete && (
          <div style={{ marginBottom:14 }}>
            {todaySession ? (
              <div style={{ background:`linear-gradient(135deg, ${todaySession.color}22, ${todaySession.color}08)`, border:`1.5px solid ${todaySession.color}44`, borderRadius:20, padding:"16px 18px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                  <div>
                    <p style={{ color:C.muted, fontSize:11, fontWeight:700, letterSpacing:"0.08em", margin:"0 0 4px" }}>TODAY — {todayDayName.toUpperCase()}</p>
                    <h3 style={{ color:C.text, fontSize:20, fontWeight:800, margin:"0 0 4px" }}>🏋️ {todaySession.label}</h3>
                    <p style={{ color:C.muted, fontSize:13, margin:0 }}>{block.name} Block · Week {weekInBlock+1} · {isDeload?"Deload":block.reps+" reps · "+block.sets+" sets"}</p>
                  </div>
                  {workoutLog[today] ? (
                    <div style={{ background:`${C.green}20`, border:`1px solid ${C.green}44`, borderRadius:12, padding:"8px 12px", textAlign:"center" }}>
                      <div style={{ fontSize:20 }}>✓</div>
                      <div style={{ color:C.green, fontSize:10, fontWeight:700 }}>DONE</div>
                    </div>
                  ) : (
                    <div style={{ background:`${todaySession.color}20`, borderRadius:12, padding:"8px 12px", textAlign:"center" }}>
                      <div style={{ color:todaySession.color, fontSize:18, fontWeight:800 }}>{todaySession.desc.split(" ")[0]}</div>
                      <div style={{ color:todaySession.color, fontSize:10, fontWeight:700, opacity:0.8 }}>TODAY</div>
                    </div>
                  )}
                </div>
                <p style={{ color:C.muted, fontSize:13, margin:"0 0 14px" }}>{todaySession.desc}</p>
                {!workoutLog[today] ? (
                  <div>
                    <button
                      onClick={()=>{ buildAndShowWorkout(todaySession.type); setView("workout"); }}
                      style={{ width:"100%", background:todaySession.color, border:"none", borderRadius:14, padding:"13px 0", color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:FONT, marginBottom:8 }}
                    >Start Today's Workout →</button>
                    <button
                      onClick={()=>setView("workout")}
                      style={{ width:"100%", background:"none", border:"none", padding:"4px 0", color:C.muted, fontSize:12, cursor:"pointer", fontFamily:FONT }}
                    >Choose a different workout instead</button>
                  </div>
                ) : (
                  <button
                    onClick={()=>{ buildAndShowWorkout(todaySession.type); setView("workout"); }}
                    style={{ width:"100%", background:"none", border:`1.5px solid ${C.green}`, borderRadius:14, padding:"12px 0", color:C.green, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:FONT }}
                  >↻ Do it again</button>
                )}
              </div>
            ) : (
              <div style={{ background:`${C.green}08`, border:`1px solid ${C.green}22`, borderRadius:20, padding:"16px 18px" }}>
                <p style={{ color:C.muted, fontSize:11, fontWeight:700, letterSpacing:"0.08em", margin:"0 0 4px" }}>TODAY — {todayDayName.toUpperCase()}</p>
                <h3 style={{ color:C.text, fontSize:20, fontWeight:800, margin:"0 0 6px" }}>💚 Rest Day</h3>
                <p style={{ color:C.muted, fontSize:13, margin:"0 0 14px", lineHeight:1.6 }}>Recovery is where the gains happen. A short walk, stretching, or foam rolling will help you come back stronger tomorrow.</p>
                <div style={{ display:"flex", gap:8 }}>
                  {["🚶 Walk","🧘 Stretch","🫁 Breathe"].map(a=>(
                    <div key={a} style={{ flex:1, background:C.sectionBg, borderRadius:12, padding:"10px 8px", textAlign:"center" }}>
                      <p style={{ color:C.text, fontSize:13, margin:0 }}>{a}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!block.isProgrammeComplete && <>

        {/* Training Block Card */}
        <div style={{ background:`linear-gradient(135deg, ${block.color}, ${block.color}aa)`, borderRadius:16, padding:"16px 18px", marginBottom:14, color:"#fff" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <p style={{ opacity:0.85, fontSize:11, fontWeight:700, letterSpacing:"0.08em", margin:"0 0 4px" }}>TRAINING BLOCK {block.id} OF 4</p>
              <h3 style={{ margin:0, fontSize:20, fontWeight:800 }}>{block.name}</h3>
              <p style={{ opacity:0.8, fontSize:12, margin:"3px 0 0" }}>{block.subtitle}</p>
              <p style={{ opacity:0.7, fontSize:11, margin:"4px 0 0" }}>Week {(block.weeksSinceStart||0)+1} of {block.programmeLengthWeeks||16} · {Math.max(0,(block.programmeLengthWeeks||16)-((block.weeksSinceStart||0)+1))} weeks remaining</p>
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

        {(()=>{
          const weekPlan = getWeeklyPlan(profile);
          return (
            <Card>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
                <Icon name="calendar" size={14} color={C.accent} />
                <p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", margin:0 }}>YOUR WEEKLY PLAN</p>
              </div>
              <p style={{ color:C.muted, fontSize:12, lineHeight:1.6, margin:"0 0 14px" }}>{weekPlan.note}</p>

              {/* Session cards */}
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
                {weekPlan.sessions.map((session, i) => {
                  const dayMap = { Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6, Sun:0 };
                  const sessionDayIndex = dayMap[weekPlan.days[i]];
                  const todayDayIndex = new Date().getDay();
                  const isSessionToday = sessionDayIndex === todayDayIndex;
                  return (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:12, background:isSessionToday?`${session.color}12`:C.sectionBg, borderRadius:12, padding:"10px 14px", borderLeft:`3px solid ${isSessionToday?session.color:C.border}`, opacity: isSessionToday?1:0.75 }}>
                      <div style={{ width:28, height:28, borderRadius:99, background:`${session.color}20`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <span style={{ color:session.color, fontSize:12, fontWeight:800 }}>{weekPlan.days[i]?.slice(0,1) || i+1}</span>
                      </div>
                      <div style={{ flex:1 }}>
                        <p style={{ color:C.text, fontWeight:isSessionToday?800:600, fontSize:14, margin:0 }}>
                          {weekPlan.days[i] || `Session ${i+1}`} — {session.label}
                          {isSessionToday && <span style={{ color:session.color, fontSize:11, fontWeight:700, marginLeft:8 }}>TODAY</span>}
                        </p>
                        <p style={{ color:C.muted, fontSize:12, margin:"2px 0 0" }}>{session.desc}</p>
                      </div>
                      <button onClick={()=>{ setSelectedType(session.type); buildAndShowWorkout(session.type); setView("workout"); }} style={{ background:isSessionToday?session.color:"none", border:`1px solid ${isSessionToday?session.color:C.border}`, borderRadius:8, padding:"6px 12px", color:isSessionToday?"#fff":C.muted, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:FONT, flexShrink:0 }}>Start</button>
                    </div>
                  );
                })}
              </div>

              {/* Rest days */}
              <div style={{ background:C.sectionBg, borderRadius:10, padding:"10px 12px", marginBottom:10 }}>
                <p style={{ color:C.muted, fontSize:12, fontWeight:600, marginBottom:4 }}>💚 REST DAYS ({restDays} per week)</p>
                <p style={{ color:C.textSec, fontSize:12, lineHeight:1.6, margin:0 }}>15–20 min gentle walk · Stretching · Foam rolling · Extra sleep</p>
              </div>

              <p style={{ color:C.muted, fontSize:11, margin:0 }}>Tap Start on any session to build your workout, or choose your own type in the Workout tab.</p>
            </Card>
          );
        })()}


        </>}

      </>}

      {view==="workout"&&<>
        {!activeWorkout&&<>
          {isGuided && (
            <div style={{ background:todaySession?`${todaySession.color}10`:`${C.green}10`, border:`1px solid ${todaySession?`${todaySession.color}30`:`${C.green}30`}`, borderRadius:14, padding:"10px 14px", marginBottom:12, display:"flex", gap:10, alignItems:"center" }}>
              <span style={{ fontSize:18, flexShrink:0 }}>{todaySession ? "💡" : "💚"}</span>
              <p style={{ color:C.text, fontSize:13, margin:0, lineHeight:1.5 }}>
                {todaySession
                  ? <>Your programme has <strong>{todaySession.label}</strong> scheduled today. Choosing a custom workout won't affect your targets.</>
                  : <>Today is a <strong>rest day</strong> in your programme. Training is fine — just make sure to recover well tomorrow.</>
                }
              </p>
            </div>
          )}
          <Card>
            <p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", marginBottom:12 }}>{isGuided ? "CUSTOM WORKOUT" : "CHOOSE WORKOUT"}</p>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
              {Object.entries(WORKOUTS).map(([key,val])=><BigChip key={key} color={val.color} active={selectedType===key} onClick={()=>setSelectedType(key)}>{key.replace(/-/g," ")}</BigChip>)}
            </div>
            <Btn onClick={()=>buildAndShowWorkout(selectedType)} color={WORKOUTS[selectedType].color} style={{ width:"100%" }}>✦ Build My Workout</Btn>
          </Card>
        </>}

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
            const lastLift = getLastLift(ex.name);
            const allLifts = lifts[ex.name] || [];
            const personalBest = allLifts.length > 0 ? Math.max(...allLifts.map(e => e.weight)) : null;
            const isLogged = loggedWeights[ex.name];
            const loggedEntry = allLifts.length > 0 ? allLifts[allLifts.length - 1] : null;
            const isNewPB = isLogged && loggedEntry && personalBest && loggedEntry.weight >= personalBest;
            const inputs = liftInputs[ex.name] || { weight:"", reps: String(ex.reps?.split("-")?.[0]||"10"), sets: String(ex.sets||"3") };
            const setInput = (field, val) => setLiftInputs(li => ({...li, [ex.name]: {...(li[ex.name]||{weight:"",reps:String(ex.reps?.split("-")?.[0]||"10"),sets:String(ex.sets||"3")}), [field]: val}}));
            return <Card key={i} style={{ borderLeft:`3px solid ${isLogged ? C.green : activeWorkout.color}` }}>
              <div onClick={()=>setExpandedEx(isExp?null:i)} style={{ cursor:"pointer" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <p style={{ color:isLogged?C.green:activeWorkout.color, fontWeight:700, fontSize:16, margin:0 }}>{i+1}. {ex.name}</p>
                      {isLogged&&<span style={{ color:C.green, fontSize:13 }}>✓</span>}
                    </div>
                    <span style={{ color:C.muted, fontSize:12 }}>{ex.equipment} · {ex.muscle}</span>
                    {fullEx?.muscles&&<p style={{ color:C.muted, fontSize:11, margin:"2px 0 0" }}>🎯 {fullEx.muscles}</p>}
                  </div>
                  <div style={{ background:`${isLogged?C.green:activeWorkout.color}15`, borderRadius:10, padding:"8px 12px", textAlign:"right", flexShrink:0 }}>
                    <div style={{ color:C.text, fontSize:16, fontWeight:700 }}>{ex.sets} × {ex.reps}</div>
                    <div style={{ color:C.muted, fontSize:11 }}>Rest: {ex.rest}</div>
                  </div>
                </div>
                {ex.tip&&<div style={{ background:C.sectionBg, borderRadius:8, padding:"8px 12px", fontSize:12, color:C.textSec, borderLeft:`3px solid ${C.yellow}`, marginBottom:6 }}>💬 {ex.tip}</div>}
                <p style={{ color:C.accent, fontSize:12, fontWeight:600, margin:0 }}>{isExp?"▲ Hide instructions":"▼ How to do this exercise"}</p>
              </div>

              {/* Inline weight logger — always visible */}
              <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${C.border}` }}>
                {lastLift&&!isLogged&&<p style={{ color:C.muted, fontSize:11, margin:"0 0 8px" }}>Last time: <span style={{ color:C.accent, fontWeight:600 }}>{lastLift.weight}kg × {lastLift.reps} reps</span></p>}
                {isLogged ? (
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ flex:1, background:`${C.green}10`, border:`1px solid ${C.green}33`, borderRadius:10, padding:"8px 12px" }}>
                      <span style={{ color:C.green, fontSize:13, fontWeight:600 }}>✓ Logged: {inputs.weight}kg × {inputs.reps} reps × {inputs.sets} sets</span>
                      {isNewPB && <p style={{ color:"#f5a623", fontSize:11, fontWeight:600, margin:"4px 0 0" }}>🏆 New personal best!</p>}
                    </div>
                    <button onClick={()=>setLoggedWeights(lw=>({...lw,[ex.name]:false}))} style={{ background:"none", border:"none", color:C.muted, fontSize:12, cursor:"pointer", fontFamily:FONT, padding:"4px 6px" }}>Edit</button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display:"flex", gap:6, marginBottom:8 }}>
                      <div style={{ flex:1 }}>
                        <p style={{ color:C.muted, fontSize:11, margin:"0 0 4px", fontWeight:600 }}>KG</p>
                        <input type="number" value={inputs.weight} onChange={e=>setInput("weight",e.target.value)} placeholder={lastLift?`${lastLift.weight}`:"0"} style={{ width:"100%", background:C.sectionBg, border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 10px", fontSize:14, fontFamily:FONT, color:C.text, outline:"none" }} />
                      </div>
                      <div style={{ flex:1 }}>
                        <p style={{ color:C.muted, fontSize:11, margin:"0 0 4px", fontWeight:600 }}>REPS</p>
                        <input type="number" value={inputs.reps} onChange={e=>setInput("reps",e.target.value)} placeholder="10" style={{ width:"100%", background:C.sectionBg, border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 10px", fontSize:14, fontFamily:FONT, color:C.text, outline:"none" }} />
                      </div>
                      <div style={{ flex:1 }}>
                        <p style={{ color:C.muted, fontSize:11, margin:"0 0 4px", fontWeight:600 }}>SETS</p>
                        <input type="number" value={inputs.sets} onChange={e=>setInput("sets",e.target.value)} placeholder="3" style={{ width:"100%", background:C.sectionBg, border:`1px solid ${C.border}`, borderRadius:8, padding:"8px 10px", fontSize:14, fontFamily:FONT, color:C.text, outline:"none" }} />
                      </div>
                    </div>
                    <button onClick={()=>saveLift(ex.name, inputs.weight, inputs.reps, inputs.sets)} disabled={!inputs.weight} style={{ width:"100%", background:inputs.weight?C.green:C.sectionBg, border:"none", borderRadius:10, padding:"9px 0", color:inputs.weight?"#fff":C.muted, fontSize:13, fontWeight:700, cursor:inputs.weight?"pointer":"default", fontFamily:FONT, transition:"all 0.2s" }}>
                      Log Weight
                    </button>
                  </div>
                )}
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
            <Btn onClick={()=>setActiveWorkout(null)} outline color={C.accent} style={{ width:"100%" }}>← Back to workout selection</Btn>
          </div>
        </>}
      </>}

      {view==="lifts"&&<LiftTracker lifts={lifts} setLifts={setLifts} workoutLog={workoutLog} />}
    </div>
  );
};

// ── LIFT TRACKER ──────────────────────────────────────────────────────────────
const LiftTracker = ({ lifts={}, setLifts, workoutLog }) => {
  return (
    <div>
      <Card style={{ background:`${C.indigo}08`, borderColor:`${C.indigo}22` }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}><Icon name="barbell" size={14} color={C.indigo} /><p style={{ color:C.indigo, fontSize:12, fontWeight:700, margin:0 }}>PROGRESS</p></div>
        <p style={{ color:C.text, fontSize:13, lineHeight:1.6, margin:0 }}>Log weights on each exercise during your workout — your progress appears here automatically.</p>
      </Card>

      {Object.keys(lifts).length===0&&<Card><p style={{ color:C.muted, fontSize:14, textAlign:"center", margin:0 }}>No lifts logged yet. Start a workout and log your weights on each exercise!</p></Card>}

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


// ── PROGRESS PHOTOS ───────────────────────────────────────────────────────────
const ProgressPhotos = ({ user, entries, profile }) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [viewPhoto, setViewPhoto] = useState(null);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    loadPhotos();
  }, [user?.id]);

  const loadPhotos = async () => {
    try {
      const { data, error } = await supabase.from("profiles").select("progress_photos").eq("id", user.id).single();
      if (!error && data?.progress_photos) setPhotos(data.progress_photos);
    } catch(e) { console.error("Load photos error:", e); }
    setLoading(false);
  };

  const savePhotos = async (updated) => {
    setPhotos(updated);
    if (!user?.id) return;
    try { await supabase.from("profiles").upsert({ id: user.id, progress_photos: updated }); }
    catch(e) { console.error("Save photos error:", e); }
  };

  const compressImage = (file) => new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const maxDim = 1200;
      let w = img.width, h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
        else { w = Math.round(w * maxDim / h); h = maxDim; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Compression failed")), "image/jpeg", 0.82);
    };
    img.onerror = reject;
    img.src = url;
  });

  const handleFileSelect = async (e, pose) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    if (!file.type.startsWith("image/")) { setUploadError("Please select an image file"); return; }
    if (file.size > 10 * 1024 * 1024) { setUploadError("File too large — max 10MB"); return; }
    setUploading(true); setUploadError(null);
    try {
      const compressed = await compressImage(file);
      const dateKey = todayKey();
      const filename = `${user.id}/${dateKey}_${pose}_${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage.from("progress-photos").upload(filename, compressed, { contentType: "image/jpeg", upsert: false });
      if (upErr) throw upErr;
      const { data: signedData } = await supabase.storage.from("progress-photos").createSignedUrl(filename, 60 * 60 * 24 * 365);
      const currentWeightKg = entries?.length > 0 ? parseFloat((entries[entries.length-1].weight * 0.453592).toFixed(1)) : parseFloat(profile?.startWeight || 0);
      const updated = [...photos];
      const existingIdx = updated.findIndex(p => p.date === dateKey);
      if (existingIdx >= 0) {
        updated[existingIdx] = { ...updated[existingIdx], [pose]: { path: filename, url: signedData?.signedUrl || "" } };
      } else {
        updated.unshift({ date: dateKey, weightKg: currentWeightKg, [pose]: { path: filename, url: signedData?.signedUrl || "" } });
      }
      await savePhotos(updated);
    } catch(err) { console.error("Upload error:", err); setUploadError("Upload failed — please try again"); }
    setUploading(false);
    e.target.value = "";
  };

  const deletePhoto = async (dateKey, pose) => {
    if (!window.confirm("Delete this photo?")) return;
    const entry = photos.find(p => p.date === dateKey);
    if (!entry?.[pose]?.path) return;
    try {
      await supabase.storage.from("progress-photos").remove([entry[pose].path]);
      const updated = photos.map(p => {
        if (p.date !== dateKey) return p;
        const copy = { ...p };
        delete copy[pose];
        return copy;
      }).filter(p => p.front || p.side);
      await savePhotos(updated);
    } catch(e) { console.error("Delete error:", e); }
  };

  const toggleCompare = (photo, pose) => {
    const key = `${photo.date}_${pose}`;
    const existing = selectedForCompare.find(s => s.key === key);
    if (existing) {
      setSelectedForCompare(s => s.filter(x => x.key !== key));
    } else {
      if (selectedForCompare.length >= 2) {
        setSelectedForCompare(s => [...s.slice(1), { key, photo, pose }]);
      } else {
        setSelectedForCompare(s => [...s, { key, photo, pose }]);
      }
    }
  };

  const fmtPhotoDate = (dateKey) => new Date(dateKey).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" });

  if (loading) return <Card><p style={{ color:C.muted, textAlign:"center", fontSize:14, padding:"12px 0" }}>Loading photos...</p></Card>;

  if (!user?.id) return (
    <Card style={{ textAlign:"center", padding:"28px 16px" }}>
      <div style={{ fontSize:36, marginBottom:12 }}>📸</div>
      <p style={{ color:C.text, fontWeight:700, fontSize:16, margin:"0 0 6px" }}>Progress Photos</p>
      <p style={{ color:C.muted, fontSize:13, lineHeight:1.6 }}>Sign in to save your progress photos across devices.</p>
    </Card>
  );

  return (
    <div>
      {/* Header */}
      <Card style={{ marginBottom:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <p style={{ color:C.text, fontWeight:700, fontSize:15, margin:"0 0 2px" }}>📸 Progress Photos</p>
            <p style={{ color:C.muted, fontSize:12, margin:0 }}>🔒 Private — only you can see these</p>
          </div>
          {photos.length >= 2 && (
            <button onClick={()=>{ setCompareMode(!compareMode); setSelectedForCompare([]); }}
              style={{ background:compareMode?C.accent:"none", border:`1.5px solid ${compareMode?C.accent:C.border}`, borderRadius:10, padding:"6px 12px", color:compareMode?"#fff":C.muted, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:FONT }}>
              {compareMode ? "Done" : "Compare"}
            </button>
          )}
        </div>
        {compareMode && (
          <p style={{ color:C.accent, fontSize:12, margin:"8px 0 0" }}>
            {selectedForCompare.length === 0 ? "Tap any photo to select it" :
             selectedForCompare.length === 1 ? "Now tap a second photo to compare" :
             "Showing comparison below"}
          </p>
        )}
      </Card>

      {/* Compare panel */}
      {compareMode && selectedForCompare.length === 2 && (
        <Card style={{ marginBottom:12 }}>
          <p style={{ color:C.muted, fontSize:11, fontWeight:700, letterSpacing:"0.06em", marginBottom:10 }}>COMPARISON</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
            {selectedForCompare.map((s, i) => (
              <div key={i}>
                <img src={s.photo[s.pose]?.url} alt="" style={{ width:"100%", aspectRatio:"3/4", objectFit:"cover", borderRadius:10, border:`2px solid ${C.accent}` }} />
                <p style={{ color:C.muted, fontSize:11, textAlign:"center", margin:"4px 0 0" }}>{fmtPhotoDate(s.photo.date)}</p>
                <p style={{ color:C.accent, fontSize:12, textAlign:"center", fontWeight:700, margin:"2px 0 0" }}>{s.photo.weightKg}kg · {s.pose}</p>
              </div>
            ))}
          </div>
          {(() => {
            const w1 = selectedForCompare[0].photo.weightKg;
            const w2 = selectedForCompare[1].photo.weightKg;
            const diff = parseFloat((w1 - w2).toFixed(1));
            if (!diff) return null;
            return (
              <div style={{ background:`${C.green}12`, border:`1px solid ${C.green}33`, borderRadius:10, padding:"8px 12px", textAlign:"center" }}>
                <p style={{ color:C.green, fontSize:14, fontWeight:700, margin:0 }}>▼ {Math.abs(diff)}kg lost between these photos</p>
              </div>
            );
          })()}
        </Card>
      )}

      {/* Upload new */}
      <Card style={{ marginBottom:12 }}>
        <p style={{ color:C.muted, fontSize:11, fontWeight:700, letterSpacing:"0.06em", marginBottom:10 }}>ADD TODAY'S PHOTOS</p>
        <div style={{ background:`${C.accent}08`, border:`1px solid ${C.accent}20`, borderRadius:10, padding:"8px 12px", marginBottom:12, display:"flex", gap:8, alignItems:"flex-start" }}>
          <span style={{ fontSize:14, flexShrink:0 }}>💡</span>
          <p style={{ color:C.textSec, fontSize:12, lineHeight:1.5, margin:0 }}>For best comparisons: stand 2 metres from the camera, good lighting, same spot each week. Arms slightly away from body.</p>
        </div>
        {uploadError && <p style={{ color:C.red, fontSize:13, marginBottom:8 }}>{uploadError}</p>}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          {["front","side"].map(pose => (
            <div key={pose}>
              <input type="file" accept="image/*" style={{ display:"none" }} id={`photo-upload-${pose}`} onChange={e => handleFileSelect(e, pose)} />
              <label htmlFor={`photo-upload-${pose}`}
                style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6, aspectRatio:"3/4", background:C.sectionBg, border:`1.5px dashed ${C.border}`, borderRadius:12, cursor:"pointer" }}>
                {uploading ? <p style={{ color:C.muted, fontSize:12 }}>Uploading...</p> : (
                  <>
                    <span style={{ fontSize:24 }}>📷</span>
                    <span style={{ color:C.accent, fontSize:13, fontWeight:600 }}>{pose.charAt(0).toUpperCase() + pose.slice(1)}</span>
                    <span style={{ color:C.muted, fontSize:11 }}>Tap to add</span>
                  </>
                )}
              </label>
            </div>
          ))}
        </div>
      </Card>

      {/* Timeline */}
      {photos.length === 0 ? (
        <Card style={{ textAlign:"center", padding:"28px 16px" }}>
          <div style={{ fontSize:36, marginBottom:10 }}>🗓️</div>
          <p style={{ color:C.text, fontWeight:700, fontSize:15, margin:"0 0 6px" }}>No photos yet</p>
          <p style={{ color:C.muted, fontSize:13, lineHeight:1.6, margin:0 }}>Add your first photos above to start your visual progress timeline.</p>
        </Card>
      ) : photos.map((entry, idx) => (
        <Card key={entry.date} style={{ marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div>
              <p style={{ color:C.muted, fontSize:11, fontWeight:700, letterSpacing:"0.06em", margin:"0 0 2px" }}>
                {idx === 0 ? "MOST RECENT" : idx === photos.length-1 ? "START" : `WEEK ${photos.length - idx}`}
              </p>
              <p style={{ color:C.text, fontSize:13, fontWeight:600, margin:0 }}>{fmtPhotoDate(entry.date)}</p>
            </div>
            <span style={{ color:C.accent, fontSize:14, fontWeight:700 }}>{entry.weightKg}kg</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {["front","side"].map(pose => (
              <div key={pose} style={{ position:"relative" }}>
                {entry[pose] ? (
                  <>
                    <div
                      onClick={() => compareMode ? toggleCompare(entry, pose) : setViewPhoto({ url:entry[pose].url, date:entry.date, weightKg:entry.weightKg, pose })}
                      style={{ position:"relative", cursor:"pointer" }}
                    >
                      <img src={entry[pose].url} alt={pose}
                        style={{ width:"100%", aspectRatio:"3/4", objectFit:"cover", borderRadius:10, display:"block",
                          border: compareMode && selectedForCompare.find(s=>s.key===`${entry.date}_${pose}`) ? `3px solid ${C.accent}` : `1px solid ${C.border}`,
                          opacity: compareMode && !selectedForCompare.find(s=>s.key===`${entry.date}_${pose}`) ? 0.6 : 1 }}
                      />
                      {compareMode && (
                        <div style={{ position:"absolute", inset:0, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", background: selectedForCompare.find(s=>s.key===`${entry.date}_${pose}`) ? "rgba(10,132,255,0.25)" : "transparent" }}>
                          {selectedForCompare.find(s=>s.key===`${entry.date}_${pose}`) && (
                            <div style={{ width:32, height:32, borderRadius:99, background:C.accent, display:"flex", alignItems:"center", justifyContent:"center" }}>
                              <span style={{ color:"#fff", fontSize:16, fontWeight:700 }}>✓</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {!compareMode && (
                      <button onClick={() => deletePhoto(entry.date, pose)}
                        style={{ position:"absolute", top:6, right:6, background:"rgba(0,0,0,0.55)", border:"none", borderRadius:99, width:22, height:22, color:"#fff", fontSize:14, cursor:"pointer", lineHeight:"22px", textAlign:"center", padding:0 }}>×</button>
                    )}

                  </>
                ) : (
                  <div style={{ aspectRatio:"3/4", background:C.sectionBg, borderRadius:10, border:`1px dashed ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <span style={{ color:C.muted, fontSize:11 }}>No {pose}</span>
                  </div>
                )}
                <p style={{ color:C.muted, fontSize:11, textAlign:"center", margin:"4px 0 0" }}>{pose.charAt(0).toUpperCase() + pose.slice(1)}</p>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {/* Full screen view */}
      {viewPhoto && (
        <div onClick={() => setViewPhoto(null)}
          style={{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.92)", zIndex:9999, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:20 }}>
          <img src={viewPhoto.url} alt="" style={{ maxWidth:"100%", maxHeight:"80vh", objectFit:"contain", borderRadius:12 }} />
          <p style={{ color:"rgba(255,255,255,0.7)", fontSize:13, marginTop:12 }}>{fmtPhotoDate(viewPhoto.date)} · {viewPhoto.weightKg}kg · {viewPhoto.pose}</p>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:12, marginTop:4 }}>Tap anywhere to close</p>
        </div>
      )}
    </div>
  );
};

// ── TRACK TAB ─────────────────────────────────────────────────────────────────
const TrackTab = ({ profile, entries, setEntries, measurements, setMeasurements, workoutLog={}, user }) => {
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
        {[["weight","Weight"],["measurements","Measurements"],["stats","Stats"],["workouts","Workouts"],["photos","Photos"]].map(([k,l])=>(
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

      {activeSection==="photos"&&<ProgressPhotos user={user} entries={entries} profile={profile} />}

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
const ProfileTab = ({ profile, setProfile, onReset, isDark, darkOverride, setDarkOverride, isPro, proData, onUpgrade, user, onShowAuth, onClearMealPlan }) => {
  const [editing, setEditing] = useState(null);
  const [tempData, setTempData] = useState({});
  const [showChangePw, setShowChangePw] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const toggleArr = (k,v) => setTempData(d=>({...d,[k]:d[k].includes(v)?d[k].filter(x=>x!==v):[...d[k],v]}));
  const startEdit = (s) => { setTempData({...profile}); setEditing(s); };
  const save = () => {
    // If meal plan length changed, clear the existing plan so user regenerates
    if (tempData.mealPlanDays && tempData.mealPlanDays !== profile.mealPlanDays) {
      onClearMealPlan?.();
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
        <div style={{ width:80, height:80, borderRadius:99, background:`linear-gradient(135deg, ${C.accent}, ${C.green})`, margin:"0 auto 12px", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}><img src="/leanplan_app_icon.png" alt="LeanPlan" style={{ width:"100%", height:"100%", objectFit:"cover" }} /></div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          <h2 style={{ color:C.text, fontSize:22, fontWeight:700, margin:0 }}>{profile.name||"Your Profile"}</h2>
          <button onClick={()=>startEdit("name")} style={{ background:"none", border:"none", color:C.accent, fontSize:13, cursor:"pointer", fontFamily:FONT, padding:"2px 6px" }}>Edit</button>
        </div>
        <p style={{ color:C.muted, fontSize:14, margin:"4px 0 0" }}>Age {profile.age||"—"} · {profile.sex||""}</p>
        {tdee&&<p style={{ color:C.accent, fontSize:14, margin:"4px 0 0", fontWeight:600 }}>TDEE: {tdee} cal · BMI: {bmi}</p>}
      </div>

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
              <p onClick={async()=>{ await supabase.auth.signOut(); setUser(null); }}
                style={{ color:C.red, fontSize:14, fontWeight:500, textAlign:"center", cursor:"pointer", padding:"8px 0" }}>
                Sign Out
              </p>
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
        <div style={{ background:`${C.yellow}12`, border:`1px solid ${C.yellow}44`, borderRadius:14, padding:"14px 16px", marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <p style={{ color:C.yellow, fontWeight:700, fontSize:15, margin:0 }}>⭐ Lifetime Pro</p>
              <p style={{ color:C.muted, fontSize:12, margin:"2px 0 0" }}>Admin access — all features unlocked</p>
            </div>
          </div>
        </div>
      ) : (
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
const CoachTab = ({ profile, setProfile, mealPlan, mealLog, workoutLog, entries, isAdmin=false }) => {
  const COACH_DAILY_LIMIT = 20;
  const getCoachUsage = () => {
    try {
      const raw = localStorage.getItem("leanplan_coach_count");
      if (!raw) return { count:0, date:todayKey() };
      const parsed = JSON.parse(raw);
      if (parsed.date !== todayKey()) return { count:0, date:todayKey() };
      return parsed;
    } catch { return { count:0, date:todayKey() }; }
  };
  const incrementCoachUsage = () => {
    const usage = getCoachUsage();
    const updated = { count: usage.count + 1, date: todayKey() };
    localStorage.setItem("leanplan_coach_count", JSON.stringify(updated));
    return updated.count;
  };

  // Build live context for the AI
  const buildContext = () => {
    const today = todayKey();
    const todayLog = mealLog?.[today] || [];
    const todayCaloriesLogged = todayLog.reduce((a,m)=>a+m.cals, 0);
    const todayProteinLogged = todayLog.reduce((a,m)=>a+m.protein, 0);

    // Workouts this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const weekDays = Array.from({length:7},(_,i)=>{ const d=new Date(weekStart); d.setDate(d.getDate()+i); return d.toISOString().split("T")[0]; });
    const workoutsThisWeek = weekDays.filter(d => workoutLog?.[d]).length;

    // Last workout
    const allWorkoutDates = Object.keys(workoutLog||{}).sort().reverse();
    const lastWorkoutDate = allWorkoutDates[0] || null;
    const daysSinceLastWorkout = lastWorkoutDate
      ? Math.floor((new Date(today) - new Date(lastWorkoutDate)) / (1000*60*60*24))
      : null;

    // Weight progress
    const startWeightKg = profile?.startWeightLbs ? parseFloat((profile.startWeightLbs * 0.453592).toFixed(1)) : null;
    const latestEntry = entries?.length > 0 ? entries[entries.length-1] : null;
    const currentWeightKg = latestEntry ? parseFloat((latestEntry.weight * 0.453592).toFixed(1)) : startWeightKg;
    const weightLostKg = startWeightKg && currentWeightKg ? parseFloat((startWeightKg - currentWeightKg).toFixed(1)) : null;

    // Programme progress
    const weeksIntoProgramme = profile?.trainingStartDate
      ? Math.floor((Date.now() - new Date(profile.trainingStartDate)) / (7*24*60*60*1000))
      : 0;

    // Today's training
    const dayOfWeek = new Date().getDay();
    const dayMap = { Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6, Sun:0 };
    const weekPlan = (() => {
      const days = profile?.workoutsPerWeek || 3;
      const goal = profile?.goal || "lose_weight";
      const daySuggestions = { 2:["Mon","Thu"], 3:["Mon","Wed","Fri"], 4:["Mon","Tue","Thu","Fri"], 5:["Mon","Tue","Wed","Thu","Sat"] };
      const suggestedDays = daySuggestions[Math.min(days,5)] || daySuggestions[3];
      const sessionIndex = suggestedDays.findIndex(d => dayMap[d] === dayOfWeek);
      return sessionIndex !== -1 ? { isTrainingDay:true, sessionIndex } : { isTrainingDay:false };
    })();

    // Today's planned meals
    const todayMealPlanDay = mealPlan?.days?.find(d => d.date === today);
    const todayMealNames = todayMealPlanDay?.meals?.map(m=>m.name) || [];

    const calTarget = mealPlan?.dailyCalTarget || (profile?.heightCm && profile?.startWeightLbs && profile?.age ? null : null);
    const protTarget = mealPlan?.dailyProteinTarget || null;

    return {
      todayDate: today,
      todayDayName: new Date().toLocaleDateString("en-GB", {weekday:"long"}),
      isTrainingDay: weekPlan.isTrainingDay,
      todaySessionType: null, // could extend later
      todayCaloriesLogged,
      todayProteinLogged,
      dailyCalTarget: calTarget || 1800,
      dailyProteinTarget: protTarget || 150,
      workoutsThisWeek,
      workoutsPerWeekTarget: profile?.workoutsPerWeek || 3,
      lastWorkoutDate,
      daysSinceLastWorkout,
      currentWeightKg,
      startWeightKg,
      weightLostKg,
      weeksIntoProgramme,
      hasMealPlan: !!mealPlan,
      mealPlanDays: mealPlan?.days?.length || 0,
      mealPlanDate: mealPlan?.generatedDate || null,
      todayMealNames,
      coreProteins: mealPlan?.coreProteins || [],
    };
  };

  const context = buildContext();

  const [messages, setMessages] = useState([
    { role:"assistant", content:`Hi ${profile.name||"there"}! 👋 I'm your personal coach. Ask me anything about your diet, workouts, or how you're feeling.

For example:
• "I don't like broccoli"
• "My lower back is aching after rows"
• "What should I eat before a workout?"
• "How am I doing this week?"` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [coachUsage, setCoachUsage] = useState(() => getCoachUsage());
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
    if (!isAdmin && coachUsage.count >= COACH_DAILY_LIMIT) {
      setMessages(m => [...m, { role:"assistant", content:"You've reached your 20 message limit for today. Your allowance resets at midnight — I'll be here when you're back! 💪" }]);
      return;
    }
    setInput("");

    const newMessages = [...messages, { role:"user", content:text }];
    setMessages(newMessages);
    setLoading(true);
    if (!isAdmin) setCoachUsage({ count: incrementCoachUsage(), date: todayKey() });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.filter(m => m.role !== "system").slice(-15),
          profile,
          context,
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

      {/* Live context summary */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"10px 14px", marginBottom:12 }}>
        <p style={{ color:C.muted, fontSize:11, fontWeight:700, letterSpacing:"0.06em", margin:"0 0 8px" }}>RIGHT NOW</p>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {/* Training day / rest day */}
          <div style={{ background:context.isTrainingDay?`${C.accent}12`:`${C.green}12`, borderRadius:8, padding:"4px 10px" }}>
            <span style={{ color:context.isTrainingDay?C.accent:C.green, fontSize:12, fontWeight:600 }}>{context.isTrainingDay?"🏋️ Training day":"💚 Rest day"}</span>
          </div>
          {/* Calories */}
          {context.dailyCalTarget && (
            <div style={{ background:C.sectionBg, borderRadius:8, padding:"4px 10px" }}>
              <span style={{ color:C.text, fontSize:12 }}>
                <span style={{ fontWeight:700, color:C.accent }}>{context.todayCaloriesLogged}</span>
                <span style={{ color:C.muted }}> / {context.dailyCalTarget} cal</span>
              </span>
            </div>
          )}
          {/* Protein */}
          {context.dailyProteinTarget && (
            <div style={{ background:C.sectionBg, borderRadius:8, padding:"4px 10px" }}>
              <span style={{ color:C.text, fontSize:12 }}>
                <span style={{ fontWeight:700, color:C.green }}>{context.todayProteinLogged}g</span>
                <span style={{ color:C.muted }}> / {context.dailyProteinTarget}g protein</span>
              </span>
            </div>
          )}
          {/* Workouts */}
          <div style={{ background:C.sectionBg, borderRadius:8, padding:"4px 10px" }}>
            <span style={{ color:C.text, fontSize:12 }}>
              <span style={{ fontWeight:700, color:context.workoutsThisWeek>=context.workoutsPerWeekTarget?C.green:C.orange }}>{context.workoutsThisWeek}</span>
              <span style={{ color:C.muted }}> / {context.workoutsPerWeekTarget} workouts</span>
            </span>
          </div>
          {/* Weight lost */}
          {context.weightLostKg !== null && context.weightLostKg > 0 && (
            <div style={{ background:`${C.green}12`, borderRadius:8, padding:"4px 10px" }}>
              <span style={{ color:C.green, fontSize:12, fontWeight:600 }}>▼ {context.weightLostKg}kg lost</span>
            </div>
          )}
        </div>
      </div>

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
      {!isAdmin && (
        <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:4 }}>
          <span style={{ fontSize:11, color: coachUsage.count >= COACH_DAILY_LIMIT ? C.red : coachUsage.count >= 15 ? C.orange : C.muted, fontWeight: coachUsage.count >= 15 ? 600 : 400 }}>
            {coachUsage.count} / {COACH_DAILY_LIMIT} messages today
          </span>
        </div>
      )}
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
        <button onClick={send} disabled={!input.trim()||loading} style={{ width:44, height:44, borderRadius:99, background:input.trim()&&!loading?C.pink:C.border, border:`1.5px solid ${input.trim()&&!loading?C.pink:C.divider}`, cursor:input.trim()&&!loading?"pointer":"default", display:"flex", alignItems:"center", justifyContent:"center", transition:"background 0.2s", flexShrink:0 }}>
          <Icon name="arrow" size={20} color={input.trim()&&!loading?"#fff":C.muted} />
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



// ── Create Account Screen (shown after onboarding) ───────────────────────────
const CreateAccountScreen = ({ profileData, onDone }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("create"); // "create" | "signin"

  const saveProfileToSupabase = async (userId, trialStart) => {
    await supabase.from("profiles").upsert({
      id: userId,
      email,
      profile_data: profileData,
      trial_start: trialStart,
      reminder_sent: false,
      entries: [],
      favourites: [],
      removed: [],
      meal_log: {},
      workout_log: {},
      water: {},
      journal: {},
      measurements: [],
    });
  };

  const handleCreate = async () => {
    if (!email) { setError("Please enter your email address"); return; }
    if (!password || password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true); setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) { setError(signUpError.message); setLoading(false); return; }

    const userId = data.user?.id;
    if (!userId) { setError("Something went wrong — please try again"); setLoading(false); return; }

    const trialStart = new Date().toISOString();
    try { await saveProfileToSupabase(userId, trialStart); } catch(e) { console.error("Profile save error:", e); }

    setLoading(false);
    onDone(data.user, email);
  };

  const handleSignIn = async () => {
    if (!email) { setError("Please enter your email address"); return; }
    if (!password) { setError("Please enter your password"); return; }
    setLoading(true); setError(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) { setError("Incorrect email or password — please try again"); setLoading(false); return; }

    const userId = data.user?.id;
    if (!userId) { setError("Something went wrong — please try again"); setLoading(false); return; }

    // Save new onboarding profile over the existing (wiped) account
    const trialStart = new Date().toISOString();
    try { await saveProfileToSupabase(userId, trialStart); } catch(e) { console.error("Profile save error:", e); }

    setLoading(false);
    onDone(data.user, email);
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:FONT, display:"flex", flexDirection:"column", justifyContent:"center", padding:"0 20px" }}>
      <div style={{ maxWidth:400, margin:"0 auto", width:"100%" }}>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ fontSize:48, marginBottom:12 }}>{mode === "create" ? "🎉" : "👋"}</div>
          <h1 style={{ fontSize:26, fontWeight:800, color:C.text, margin:"0 0 10px" }}>
            {mode === "create" ? "Your personal plan is ready" : "Welcome back"}
          </h1>
          <p style={{ color:C.muted, fontSize:15, lineHeight:1.6, margin:0 }}>
            {mode === "create"
              ? "Create your account to save it. You'll have 7 days free to explore the app."
              : "Sign in to save your new plan to your existing account."}
          </p>
        </div>

        {/* Form */}
        <div style={{ marginBottom:14 }}>
          <p style={{ color:C.textSec, fontSize:13, fontWeight:500, marginBottom:6 }}>Email address</p>
          <TInput value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" type="email" autoComplete="email" />
        </div>
        <div style={{ marginBottom:20 }}>
          <p style={{ color:C.textSec, fontSize:13, fontWeight:500, marginBottom:6 }}>Password</p>
          <TInput value={password} onChange={e=>setPassword(e.target.value)} placeholder={mode === "create" ? "Min 6 characters" : "Your password"} type="password" autoComplete={mode === "create" ? "new-password" : "current-password"} />
        </div>

        {error && <div style={{ background:`${C.red}10`, border:`1px solid ${C.red}33`, borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
          <p style={{ color:C.red, fontSize:13, margin:0 }}>{error}</p>
        </div>}

        <Btn onClick={mode === "create" ? handleCreate : handleSignIn} disabled={loading} color={C.accent} style={{ width:"100%", fontSize:17, padding:"16px 0", marginBottom:16 }}>
          {loading ? (mode === "create" ? "Creating your account..." : "Signing in...") : (mode === "create" ? "Save My Plan" : "Sign In & Save My Plan")}
        </Btn>

        <p style={{ color:C.muted, fontSize:13, textAlign:"center", margin:"0 0 12px" }}>
          {mode === "create" ? "Already have an account?" : "Need a new account?"}
          {" "}
          <span onClick={()=>{ setMode(mode === "create" ? "signin" : "create"); setError(null); }} style={{ color:C.accent, fontWeight:600, cursor:"pointer" }}>
            {mode === "create" ? "Sign in instead" : "Create one instead"}
          </span>
        </p>

        {mode === "create" && <p style={{ color:C.muted, fontSize:12, textAlign:"center", lineHeight:1.6, margin:0 }}>
          By continuing you agree to our terms. Your 7-day free trial starts now. Cancel anytime.
        </p>}
      </div>
    </div>
  );
};

// ── Weekly Check-in Modal ─────────────────────────────────────────────────────
const WeeklyCheckIn = ({ profile, onDone, onAddEntry }) => {
  const [weight, setWeight] = useState("");
  const [energy, setEnergy] = useState(null);
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);

  const energyLabels = ["😴 Drained", "😕 Low", "😐 OK", "😊 Good", "🔥 Great"];

  const handleSubmit = () => {
    // Save weight entry if provided
    if (weight) {
      const weightKg = parseFloat(weight);
      const weightLbs = weightKg / 0.453592;
      onAddEntry({ weight: weightLbs, weightKg, label: `W`, date: new Date().toLocaleDateString("en-GB", { day:"numeric", month:"short" }) });
    }
    // Record check-in date
    const thisWeekMonday = (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1); return d.toISOString().split("T")[0]; })();
    localStorage.setItem("leanplan_last_checkin", thisWeekMonday);
    setDone(true);
    setTimeout(() => onDone(), 1500);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:200, fontFamily:FONT }}>
      <div style={{ background:C.bg, borderRadius:"20px 20px 0 0", padding:"24px 20px 40px", width:"100%", maxWidth:480 }}>
        {done ? (
          <div style={{ textAlign:"center", padding:"20px 0" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🎯</div>
            <h3 style={{ color:C.text, fontSize:20, fontWeight:700, margin:"0 0 8px" }}>Check-in saved!</h3>
            <p style={{ color:C.muted, fontSize:14, margin:0 }}>Have a great week.</p>
          </div>
        ) : (
          <>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div>
                <p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", margin:"0 0 2px" }}>WEEKLY CHECK-IN</p>
                <h3 style={{ color:C.text, fontSize:20, fontWeight:700, margin:0 }}>How was your week?</h3>
              </div>
              <button onClick={()=>{ localStorage.setItem("leanplan_last_checkin", (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1); return d.toISOString().split("T")[0]; })()); onDone(); }} style={{ background:"none", border:"none", color:C.muted, fontSize:22, cursor:"pointer", lineHeight:1 }}>×</button>
            </div>

            {/* Weight */}
            <div style={{ marginBottom:20 }}>
              <p style={{ color:C.textSec, fontSize:13, fontWeight:600, margin:"0 0 8px" }}>Current weight (kg)</p>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <TInput value={weight} onChange={e=>setWeight(e.target.value)} placeholder={profile?.startWeightKg ? `Last: ${toKg(profile.startWeightLbs)} kg` : "e.g. 83.5"} type="number" style={{ flex:1 }} />
                <span style={{ color:C.muted, fontSize:14 }}>kg</span>
              </div>
            </div>

            {/* Energy rating */}
            <div style={{ marginBottom:20 }}>
              <p style={{ color:C.textSec, fontSize:13, fontWeight:600, margin:"0 0 8px" }}>Energy levels this week</p>
              <div style={{ display:"flex", gap:8 }}>
                {energyLabels.map((label, i) => (
                  <button key={i} onClick={()=>setEnergy(i+1)} style={{ flex:1, background:energy===i+1?C.accent:`${C.accent}12`, border:`1.5px solid ${energy===i+1?C.accent:`${C.accent}33`}`, borderRadius:10, padding:"8px 4px", cursor:"pointer", fontFamily:FONT }}>
                    <div style={{ fontSize:18, marginBottom:2 }}>{label.split(" ")[0]}</div>
                    <div style={{ color:energy===i+1?"#fff":C.muted, fontSize:10, fontWeight:600 }}>{i+1}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div style={{ marginBottom:20 }}>
              <p style={{ color:C.textSec, fontSize:13, fontWeight:600, margin:"0 0 8px" }}>Anything to note? <span style={{ color:C.muted, fontWeight:400 }}>(optional)</span></p>
              <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Sleep, stress, injuries, wins..." style={{ width:"100%", background:C.sectionBg, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 12px", fontSize:14, fontFamily:FONT, color:C.text, outline:"none", resize:"none", height:72, boxSizing:"border-box" }} />
            </div>

            <Btn onClick={handleSubmit} color={C.accent} style={{ width:"100%", fontSize:16, padding:"14px 0" }}>
              Save check-in
            </Btn>
          </>
        )}
      </div>
    </div>
  );
};

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
const AuthScreen = ({ onAuth, onSkip, onStartFresh }) => {
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
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reset email");
      setMessage("Check your inbox — we've sent you a temporary password.");
    } catch(err) {
      setError(err.message);
    }
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

        {onStartFresh && mode === "login" && <>
          <div style={{ display:"flex", alignItems:"center", gap:12, margin:"16px 0" }}>
            <div style={{ flex:1, height:1, background:C.border }} />
            <span style={{ color:C.muted, fontSize:13 }}>or</span>
            <div style={{ flex:1, height:1, background:C.border }} />
          </div>
          <p onClick={onStartFresh} style={{ color:C.muted, fontSize:13, textAlign:"center", cursor:"pointer" }}>
            Start fresh with a new account
          </p>
        </>}

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
  const RESET_KEYS = [
    "leanplan_v4", "leanplan_lifts", "leanplan_pro", "leanplan_device_id",
    "leanplan_trial_start", "leanplan_gen_count", "leanplan_disliked_meals",
    "leanplan_liked_meals", "leanplan_meal_plan", "leanplan_todays_meals",
    "leanplan_pantry",
  ];
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("Today");
  const [isPro, setIsPro] = useState(false);
  // Trial users get full Pro access
  const effectiveIsPro = isPro || isTrialActive();
  const [proData, setProData] = useState(null);
  const [proLoading, setProLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [mealPlan, setMealPlan] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("leanplan_meal_plan") || "null");
      if (saved?.generatedDate) {
        // Check plan still has future/today dates
        const today = new Date().toISOString().split("T")[0];
        const hasFuture = saved.days?.some(d => d.date >= today);
        if (hasFuture) return saved;
      }
    } catch(e){}
    return null;
  });
  const saveMealPlan = (plan) => {
    setMealPlan(plan);
    try {
      if (plan) localStorage.setItem("leanplan_meal_plan", JSON.stringify(plan));
      else localStorage.removeItem("leanplan_meal_plan");
    } catch(e){}
  };
  // Meal generation state — lives at App level so it survives tab switches
  const [generating, setGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(null);
  const [generateError, setGenerateError] = useState(null);

  // todaysMeals derived from mealPlan for backward compat
  const todayKey2 = new Date().toISOString().split("T")[0];
  const todaysMeals = mealPlan?.days?.find(d => d.date === todayKey2)?.meals || null;
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
  const [showCreateAccount, setShowCreateAccount] = useState(false); // show create account after onboarding
  const [pendingProfile, setPendingProfile] = useState(null); // profile data waiting for account creation
  const [showTipSplash, setShowTipSplash] = useState(true);
  const [showWeeklyCheckIn, setShowWeeklyCheckIn] = useState(false);
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
      setTodaysWorkout(null);
      // Don't clear mealPlan at midnight - it spans multiple days
    }, msUntilMidnight());
    return () => clearTimeout(timer);
  }, []);

  useEffect(()=>{
    // Check server-side bypass flag — pass email for admin override
    const emailParam = user?.email ? `?email=${encodeURIComponent(user.email)}` : "";
    fetch(`/api/pro-status${emailParam}`)
      .then(r => r.json())
      .then(data => {
        if (data.bypass) {
          setIsPro(true);
          setProData({ plan:"annual", customerId:"bypass", subscriptionId:"bypass" });
        }
      })
      .catch(()=>{})
      .finally(()=>{ setProLoading(false); });

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
  }, [user]);

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
      if (data.is_pro) { setIsPro(true); setProData({ customerId: data.stripe_customer_id, subscriptionId: data.stripe_subscription_id, plan: data.stripe_plan, cancelAt: data.cancel_at || null }); }
      // Sync trial_start from Supabase — ensures consistent trial across devices
      if (data.trial_start && !localStorage.getItem("leanplan_trial_start")) {
        localStorage.setItem("leanplan_trial_start", data.trial_start);
      }
      if (data.meal_plan && data.meal_plan.days) {
        // Only load if plan has future/today dates
        const today = new Date().toISOString().split("T")[0];
        const hasFuture = data.meal_plan.days.some(d => d.date >= today);
        if (hasFuture) {
          setMealPlan(data.meal_plan);
          localStorage.setItem("leanplan_meal_plan", JSON.stringify(data.meal_plan));
        }
      }
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
        meal_plan: data.mealPlan || null,
        trial_start: localStorage.getItem("leanplan_trial_start") || null,
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

    // Clear any leftover recovery flags from previous attempts
    localStorage.removeItem("leanplan_recovery");
    localStorage.removeItem("leanplan_recovery_token");
    localStorage.removeItem("leanplan_recovery_refresh");

    // Show weekly check-in on Monday mornings (once per week)
    const isMonday = new Date().getDay() === 1;
    const lastCheckIn = localStorage.getItem("leanplan_last_checkin");
    const thisWeekMonday = (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1); return d.toISOString().split("T")[0]; })();
    if (isMonday && lastCheckIn !== thisWeekMonday) {
      setTimeout(() => setShowWeeklyCheckIn(true), 1500);
    }

    const finishLoading = () => {
      if (!loadingDone) {
        loadingDone = true;
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
        clearTimeout(safetyTimer);
        finishLoading();
      } else if (event === "INITIAL_SESSION") {
        if (session?.user) {
          // Valid session exists — set user immediately, don't wait for SIGNED_IN
          setUser(session.user);
          loadFromLocal();
          try {
            await loadFromSupabase(session.user.id);
          } catch(e){ console.error("Supabase sync failed:", e); }
          clearTimeout(safetyTimer);
          finishLoading();
        } else {
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
    const data = {profile,entries,favourites,removed,mealLog,workoutLog,water,journal,measurements,darkOverride,mealPlan};
    try { localStorage.setItem("leanplan_v4", JSON.stringify(data)); } catch(e){}
    if (user) {
      // Debounce Supabase saves to avoid too many writes
      const timer = setTimeout(() => saveToSupabase(user.id, data), 2000);
      return () => clearTimeout(timer);
    }
  },[profile,entries,favourites,removed,mealLog,workoutLog,water,journal,measurements,darkOverride,mealPlan,loading,user]);

  const loadBg = systemDark ? "#000" : "#f2f2f7";
  const loadText = systemDark ? "#8e8e93" : "#8e8e93";
  if (loading) return <div style={{ minHeight:"100vh", background:loadBg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:FONT }}><div style={{ textAlign:"center" }}><div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
        <img src="/leanplan_app_icon.png" alt="" style={{ height:52, width:52, objectFit:"contain", borderRadius:12 }} />
        <span style={{ fontSize:28, fontWeight:800, letterSpacing:"-0.02em", fontFamily:FONT }}>
          <span style={{ color:loadBg==="#000"?"#fff":"#000" }}>Lean</span><span style={{ color:"#0a84ff" }}>Plan</span>
        </span>
      </div>
      <p style={{ color:loadText }}>Loading...</p></div></div>;





  // Apply theme first — needed by all render paths
  const isDark = darkOverride !== null ? darkOverride : systemDark;
  C = isDark ? DARK : LIGHT;

  // ── Render sequence ──────────────────────────────────────────────────────────

  // Show tip splash on every open (after profile is loaded)
  if (showTipSplash && profile && !showAuth && !showWelcome && !showOnboarding) {
    return <TipSplashScreen tip={DAILY_TIPS[splashTipIdx]} onDismiss={()=>setShowTipSplash(false)} />;
  }

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
    onNew={()=>{ setShowOnboarding(true); }}
    onSignIn={()=>setShowAuth(true)}
  />;

  // 3b. Signed out but have local data — show sign in screen (only after auth check completes)
  if (profile && !user && !authLoading) return <AuthScreen
    onAuth={async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setSyncing(true);
        try {
          await loadFromSupabase(session.user.id);
          const { data } = await supabase.from("profiles").select("profile_data").eq("id", session.user.id).single();
          if (!data?.profile_data || Object.keys(data.profile_data).length === 0) {
            const local = JSON.parse(localStorage.getItem("leanplan_v4") || "{}");
            if (local.profile) await saveToSupabase(session.user.id, local);
          }
        } catch(e){}
        setSyncing(false);
      }
    }}
    onSkip={null}
    onStartFresh={() => {
      if (!window.confirm("Start fresh? This will clear all your current data and cannot be undone.")) return;
      RESET_KEYS.forEach(k => localStorage.removeItem(k));
      setProfile(null); setEntries([]); setFavourites([]); setRemoved([]);
      setMealLog({}); setWorkoutLog({}); setWater({}); setJournal({}); setMeasurements([]);
      setIsPro(false); setProData(null); setMealPlan(null);
    }}
  />;

  // 4. Onboarding — after Get Started
  if (!profile && !showCreateAccount) return <Onboarding onDone={p=>{ 
    setPendingProfile(p);
    setShowCreateAccount(true);
    try {
      localStorage.setItem("leanplan_v4", JSON.stringify({profile:p, entries:[], favourites:[], removed:[], mealLog:{}, workoutLog:{}, water:{}, journal:{}, measurements:[], darkOverride:null}));
    } catch(e){}
  }} />;

  // 4b. Create account — mandatory after onboarding (skip if already signed in)
  if (showCreateAccount && pendingProfile) {
    if (user) {
      // Already signed in (e.g. after reset) — just save profile and continue
      setProfile(pendingProfile);
      setShowCreateAccount(false);
      setPendingProfile(null);
      setTrialStart();
      saveToSupabase(user.id, { profile: pendingProfile, entries:[], favourites:[], removed:[], mealLog:{}, workoutLog:{}, water:{}, journal:{}, measurements:[], darkOverride:null });
      return null;
    }
    return <CreateAccountScreen
      profileData={pendingProfile}
      onDone={async (supabaseUser, email) => {
        setUser(supabaseUser);
        setProfile(pendingProfile);
        setShowCreateAccount(false);
        setPendingProfile(null);
        setTrialStart();
      }}
    />;
  }

  // 5. Trial expired — show subscribe screen
  if (!proLoading && isTrialExpired() && !isPro && proData?.customerId !== 'bypass') return <TrialExpiredScreen onSubscribe={()=>setShowPaywall(true)} />;

  const cur = entries.length>0?entries[entries.length-1].weight:profile.startWeightLbs;
  const lost = Math.max(0,profile.startWeightLbs-cur);
  const pct = Math.min(100,Math.round((lost/profile.targetLbs)*100));
  const TAB_COLORS = {Today:"#007aff",Meals:"#34c759",Train:"#5ac8fa",Track:"#af52de",Coach:"#ff2d55",Profile:"#ff9500"};

  const handleReset = async () => {
    const savedPro = localStorage.getItem("leanplan_pro");
    const hasRealSub = savedPro && JSON.parse(savedPro)?.customerId && JSON.parse(savedPro)?.customerId !== "bypass";

    const confirmMsg = hasRealSub
      ? "Reset your fitness data and start fresh?\n\n✓ Your Pro subscription will be kept\n✓ All workout, meal and progress data will be cleared\n✓ You can set up a new goal in onboarding\n\nTap OK to reset your data."
      : "Reset all data? This cannot be undone.";

    if (!window.confirm(confirmMsg)) return;

    // Wipe Supabase row BEFORE signing out so the same email starts clean next time
    if (user?.id) {
      try {
        await supabase.from("profiles").upsert({
          id: user.id,
          profile_data: {}, entries: [], favourites: [], removed: [],
          meal_log: {}, workout_log: {}, water: {}, journal: {},
          measurements: [], dark_override: null, meal_plan: null,
          trial_start: null, reminder_sent: false,
          is_pro: hasRealSub ? true : false,
          updated_at: new Date().toISOString(),
        });
      } catch(e){ console.error("Supabase wipe error:", e); }
    }

    RESET_KEYS.forEach(k => localStorage.removeItem(k));
    setProfile(null); setEntries([]); setFavourites([]); setRemoved([]);
    setMealLog({}); setWorkoutLog({}); setWater({}); setJournal({}); setMeasurements([]);
    setIsPro(false); setProData(null); setMealPlan(null);
    setUser(null); supabase.auth.signOut();
  };

  return (
    <div style={{ background:C.bg, minHeight:"100vh", fontFamily:FONT, color:C.text, width:"100%", overflowX:"hidden" }}>
      <style>{`* { box-sizing:border-box; margin:0; padding:0; } input,select,textarea { outline:none; } html,body { width:100%; overflow-x:hidden; background:${C.bg}; font-family:${FONT}; color-scheme:${isDark?"dark":"light"}; } #root { width:100%; } ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-thumb { background:${C.divider}; border-radius:4px; } ::placeholder { color:${C.muted}; }`}</style>

      <div style={{ paddingTop:"max(12px, env(safe-area-inset-top))", paddingLeft:18, paddingRight:18, paddingBottom:10, background:isDark?"rgba(0,0,0,0.85)":"rgba(242,242,247,0.95)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, zIndex:10, width:"100%" }}>
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
        {/* Cancellation notice */}
        {isPro && proData?.cancelAt && (
          <div style={{ background:`linear-gradient(135deg, #2d1f00, #3d2a00)`, border:`1px solid rgba(255,159,10,0.4)`, borderRadius:14, padding:"12px 16px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <p style={{ color:"#ff9f0a", fontWeight:700, fontSize:13, margin:0 }}>⚠️ Subscription cancelled</p>
              <p style={{ color:"rgba(255,255,255,0.6)", fontSize:11, margin:"2px 0 0" }}>
                Access continues until {new Date(proData.cancelAt).toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" })}
              </p>
            </div>
            <button onClick={()=>setShowPaywall(true)} style={{ background:"#ff9f0a", border:"none", borderRadius:99, padding:"7px 14px", color:"#000", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:FONT, whiteSpace:"nowrap" }}>Resubscribe</button>
          </div>
        )}

        {/* Trial banner */}
        {!isPro && isTrialActive() && (
          <div style={{ background:`linear-gradient(135deg, #0a2a1f, #0d3d2a)`, border:`1px solid rgba(52,199,89,0.5)`, borderRadius:14, padding:"12px 16px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:"0 4px 16px rgba(52,199,89,0.15)" }}>
            <div>
              <p style={{ color:"#34c759", fontWeight:700, fontSize:13, margin:0 }}>✦ Free trial — {getTrialDaysLeft()} day{getTrialDaysLeft()!==1?"s":""} left</p>
              <p style={{ color:"rgba(255,255,255,0.6)", fontSize:11, margin:"2px 0 0" }}>Subscribe before your trial ends to keep everything</p>
            </div>
            <button onClick={()=>setShowPaywall(true)} style={{ background:"#34c759", border:"none", borderRadius:99, padding:"7px 14px", color:"#000", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:FONT, whiteSpace:"nowrap" }}>Subscribe →</button>
          </div>
        )}
        {!effectiveIsPro && <ProBanner onUpgrade={()=>setShowPaywall(true)} />}
        {generating && tab !== "Meals" && (
          <div onClick={()=>setTab("Meals")} style={{ background:`${C.accent}15`, border:`1px solid ${C.accent}33`, borderRadius:10, padding:"10px 14px", marginBottom:10, display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:C.accent, flexShrink:0, animation:"pulse 1.2s ease-in-out infinite" }} />
            <p style={{ color:C.accent, fontSize:13, fontWeight:600, margin:0, flex:1 }}>Generating your meal plan...</p>
            <span style={{ color:C.accent, fontSize:12 }}>View →</span>
          </div>
        )}

        {tab==="Today"&&<TodayTab profile={profile} entries={entries} mealLog={mealLog} setMealLog={setMealLog} workoutLog={workoutLog} water={water} setWater={setWater} journal={journal} setJournal={setJournal} measurements={measurements} mealPlan={mealPlan} setTab={setTab} />}
        <div style={{ display: tab==="Meals" ? "block" : "none" }}><MealsTab profile={profile} favourites={favourites} setFavourites={setFavourites} removed={removed} setRemoved={setRemoved} mealLog={mealLog} setMealLog={setMealLog} isPro={effectiveIsPro} onUpgrade={()=>setShowPaywall(true)} mealPlan={mealPlan} onSaveMealPlan={saveMealPlan} generating={generating} setGenerating={setGenerating} generateProgress={generateProgress} setGenerateProgress={setGenerateProgress} generateError={generateError} setGenerateError={setGenerateError} /></div>
        {tab==="Train"&&(effectiveIsPro ? <TrainTab profile={profile} workoutLog={workoutLog} setWorkoutLog={setWorkoutLog} setProfile={setProfile} savedWorkout={todaysWorkout} setSavedWorkout={setTodaysWorkout} /> : <LockedTab feature="Workout tracking, lift tracker and rest day planner" onUpgrade={()=>setShowPaywall(true)} />)}
        {tab==="Track"&&(effectiveIsPro ? <TrackTab profile={profile} entries={entries} setEntries={fn=>setEntries(typeof fn==="function"?fn(entries):fn)} measurements={measurements} setMeasurements={setMeasurements} workoutLog={workoutLog} user={user} /> : <LockedTab feature="Progress tracking, measurements and body stats" onUpgrade={()=>setShowPaywall(true)} />)}
        {tab==="Coach"&&(effectiveIsPro ? <CoachTab profile={profile} setProfile={setProfile} mealPlan={mealPlan} mealLog={mealLog} workoutLog={workoutLog} entries={entries} isAdmin={proData?.customerId === "bypass"} /> : <LockedTab feature="AI personal coach" onUpgrade={()=>setShowPaywall(true)} />)}
        {tab==="Profile"&&<ProfileTab profile={profile} setProfile={setProfile} onReset={handleReset} isDark={isDark} darkOverride={darkOverride} setDarkOverride={setDarkOverride} isPro={effectiveIsPro} proData={proData} onUpgrade={()=>setShowPaywall(true)} user={user} onShowAuth={()=>setShowAuth(true)} onClearMealPlan={()=>saveMealPlan(null)} />}

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

      {/* Weekly check-in modal */}
      {showWeeklyCheckIn && profile && (
        <WeeklyCheckIn
          profile={profile}
          onDone={() => setShowWeeklyCheckIn(false)}
          onAddEntry={(entry) => setEntries(prev => [...prev, entry])}
        />
      )}
    </div>
  );
}

export default function App() {
  return <ErrorBoundary><AppInner /></ErrorBoundary>;
}