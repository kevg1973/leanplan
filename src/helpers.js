import { TRIAL_DAYS } from "./constants.js";

export const toKg = lbs => (lbs * 0.453592).toFixed(1);
export const fromKg = kg => parseFloat((kg * 2.20462).toFixed(1));

export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
export const todayKey = () => new Date().toISOString().split("T")[0];
export const fmtDate = d => new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short"});

// ── Trial system ──────────────────────────────────────────────────────────────
export const getTrialStart = () => localStorage.getItem("leanplan_trial_start");
export const setTrialStart = () => { if (!getTrialStart()) localStorage.setItem("leanplan_trial_start", new Date().toISOString()); };
export const getTrialDaysLeft = () => {
  const start = getTrialStart();
  if (!start) return TRIAL_DAYS;
  const days = Math.floor((Date.now() - new Date(start)) / (1000 * 60 * 60 * 24));
  return Math.max(0, TRIAL_DAYS - days);
};
export const isTrialActive = () => getTrialDaysLeft() > 0;
export const isTrialExpired = () => getTrialStart() && getTrialDaysLeft() === 0;

// ── TDEE Calculator ──────────────────────────────────────────────────────────
export const calcTDEE = (profile) => {
  if (!profile.heightCm || !profile.startWeightLbs || !profile.age) return null;
  const weightKg = profile.startWeightLbs * 0.453592;
  const heightCm = parseFloat(profile.heightCm);
  const age = parseFloat(profile.age);
  const bmr = profile.sex === "female"
    ? (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161
    : (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
  const activityMult = { 2:1.375, 3:1.55, 4:1.725, 5:1.9 }[profile.workoutsPerWeek] || 1.55;
  return Math.round(bmr * activityMult);
};

// ── Pace options ─────────────────────────────────────────────────────────────
// Colors are set at module init — always use LIGHT theme values (existing behaviour)
export const PACE_OPTIONS = [
  { id:"slow",   label:"Steady",     lbs:0.5512, kgPerWk:0.25, color:"#34c759",  desc:"0.25 kg/week — very sustainable, minimal hunger.", warning:null },
  { id:"normal", label:"Moderate",   lbs:1.1023, kgPerWk:0.5,  color:"#007aff", desc:"0.5 kg/week — the gold standard for sustainable fat loss.", warning:null },
  { id:"fast",   label:"Active",     lbs:1.6535, kgPerWk:0.75, color:"#ff9500", desc:"0.75 kg/week — achievable with consistent training.", warning:"⚠️ Requires a strict 375 cal/day deficit. Keep protein at 120g+ to protect muscle." },
  { id:"vfast",  label:"Aggressive", lbs:2.2046, kgPerWk:1.0,  color:"#ff3b30",    desc:"1 kg/week — maximum recommended rate.", warning:"🚨 Upper safe limit. Risks muscle loss and fatigue. Requires 500 cal/day deficit. Consult your GP if you have health concerns." },
];
export const getPace = id => PACE_OPTIONS.find(p=>p.id===id)||PACE_OPTIONS[1];

export const calcBMI = (profile) => {
  if (!profile.heightCm || !profile.startWeightLbs) return null;
  const weightKg = profile.startWeightLbs * 0.453592;
  const heightM = parseFloat(profile.heightCm) / 100;
  return (weightKg / (heightM * heightM)).toFixed(1);
};

export const bmiCategory = (bmi, C) => {
  if (bmi < 18.5) return { label:"Underweight", color:C.teal };
  if (bmi < 25)   return { label:"Healthy weight", color:C.green };
  if (bmi < 30)   return { label:"Overweight", color:C.orange };
  return { label:"Obese", color:C.red };
};
