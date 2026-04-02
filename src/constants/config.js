export const TRIAL_DAYS = 7;
export const TABS = ["Today","Meals","Train","Track","Coach","Profile"];

export const PACE_OPTIONS = [
  { id:"slow",   label:"Steady",     lbs:0.5512, kgPerWk:0.25, color:"#34c759", desc:"0.25 kg/week — gentle, sustainable pace.", warning:null },
  { id:"normal", label:"Active",     lbs:1.1023, kgPerWk:0.5,  color:"#007aff", desc:"0.5 kg/week — recommended for most people.", warning:null },
  { id:"fast",   label:"Ambitious",  lbs:1.6535, kgPerWk:0.75, color:"#ff9500", desc:"0.75 kg/week — requires consistent effort.", warning:"⚠️ Requires a daily deficit of ~375 calories. Ensure adequate protein." },
  { id:"vfast",  label:"Aggressive", lbs:2.2046, kgPerWk:1.0,  color:"#ff3b30", desc:"1 kg/week — maximum recommended rate.", warning:"🚨 Upper safe limit. Risks muscle loss and fatigue. Requires 500 cal/day deficit. Consult your GP if you have health concerns." },
];

export const ALLERGENS = ["Eggs","Nuts","Peanuts","Soya","Shellfish","Fish","Sesame","Celery","Mustard","Sulphites"];

export const DISLIKES_LIST = ["Fish","Oily fish","Shellfish","Lamb","Pork","Red meat","Mushrooms","Aubergine","Courgette","Brussels sprouts","Cauliflower","Broccoli","Olives","Avocado","Spicy food","Garlic","Onion","Cottage cheese","Tofu"];

export const RESET_KEYS = [
  "leanplan_v4","leanplan_lifts","leanplan_pro","leanplan_trial_start",
  "leanplan_gen_count","leanplan_disliked_meals","leanplan_liked_meals",
  "leanplan_meal_plan","leanplan_todays_meals","leanplan_pantry",
  "leanplan_coach_count","leanplan_last_checkin","leanplan_device_id",
];
