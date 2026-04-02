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

export const calcBMI = (profile) => {
  if (!profile.heightCm || !profile.startWeightLbs) return null;
  const weightKg = profile.startWeightLbs * 0.453592;
  const heightM = parseFloat(profile.heightCm) / 100;
  return (weightKg / (heightM * heightM)).toFixed(1);
};
