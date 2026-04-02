import { EXERCISE_DB } from "./exercises.js";
import { getPace } from "../helpers.js";

// ── Periodisation Blocks ───────────────────────────────────────────────────────
// 4-week blocks rotating through different training focuses
export const PERIODISATION_BLOCKS = [
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
export const getProgrammeLengthWeeks = (profile) => {
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
export const getCurrentBlock = (profile) => {
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
export const buildWorkout = (type, profile, block) => {
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
export const WORKOUTS = {
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

export const SHOPPING = {
  3:{ cost:"~£35–45", cats:[{name:"🥩 Meat & Protein",items:[{i:"Chicken breast",q:"600g",n:""},{i:"Lean beef mince 5%",q:"400g",n:""},{i:"Free range eggs",q:"12",n:""},{i:"Plant protein powder",q:"check",n:"pea/soya GF"}]},{name:"🥛 Dairy-Free",items:[{i:"Soya milk (unsweetened)",q:"1 litre",n:""},{i:"Coconut yoghurt",q:"400g",n:""}]},{name:"🥦 Vegetables",items:[{i:"Broccoli",q:"1 head",n:""},{i:"Spinach",q:"200g",n:""},{i:"Mixed peppers",q:"3",n:""},{i:"Cherry tomatoes",q:"250g",n:""},{i:"Sweet potatoes",q:"3",n:""}]},{name:"🍚 Carbs (GF)",items:[{i:"Brown rice",q:"500g",n:""},{i:"Quinoa",q:"500g",n:""},{i:"Corn tortillas",q:"1 pack",n:"GF"},{i:"Rice cakes",q:"1 pack",n:""}]},{name:"🫙 Cupboard",items:[{i:"Chopped tomatoes",q:"2 tins",n:""},{i:"Kidney beans",q:"1 tin",n:""},{i:"Tamari sauce",q:"1 bottle",n:"GF soy"},{i:"Olive oil",q:"check",n:""}]},{name:"💊 Supplements",items:[{i:"Creatine monohydrate",q:"check",n:"5g/day"},{i:"Vitamin D3+K2",q:"check",n:""},{i:"Algae omega-3",q:"check",n:""}]}], tip:"Tamari = GF soy sauce. Quinoa is a complete protein. Coconut yoghurt is perfect for creatine." },
  5:{ cost:"~£55–70", cats:[{name:"🥩 Meat & Protein",items:[{i:"Chicken breast",q:"1kg",n:""},{i:"Turkey mince",q:"400g",n:""},{i:"Lean beef mince 5%",q:"500g",n:""},{i:"Free range eggs",q:"18",n:""},{i:"Plant protein powder",q:"check",n:""}]},{name:"🥛 Dairy-Free",items:[{i:"Soya milk",q:"2 litres",n:""},{i:"Coconut yoghurt",q:"500g",n:""},{i:"Dairy-free feta",q:"150g",n:""}]},{name:"🥦 Vegetables",items:[{i:"Broccoli",q:"2 heads",n:""},{i:"Spinach",q:"400g",n:""},{i:"Mixed peppers",q:"6",n:""},{i:"Courgettes",q:"3",n:""},{i:"Asparagus",q:"1 bunch",n:""},{i:"Frozen mixed veg",q:"1kg",n:""}]},{name:"🍚 Carbs (GF)",items:[{i:"Brown rice",q:"1kg",n:""},{i:"Quinoa",q:"500g",n:""},{i:"Sweet potatoes",q:"5",n:""},{i:"Rice crackers",q:"2 packs",n:""},{i:"Corn tortillas",q:"2 packs",n:""}]},{name:"🫙 Cupboard",items:[{i:"Chopped tomatoes",q:"3 tins",n:""},{i:"Kidney beans",q:"2 tins",n:""},{i:"Chickpeas",q:"2 tins",n:""},{i:"Tamari",q:"1 bottle",n:""},{i:"Olive oil",q:"500ml",n:""},{i:"Almond butter",q:"1 jar",n:""}]},{name:"🥜 Snacks",items:[{i:"Mixed nuts",q:"200g",n:""},{i:"Hummus",q:"200g",n:""},{i:"Bananas",q:"5",n:""}]},{name:"💊 Supplements",items:[{i:"Creatine monohydrate",q:"check",n:"5g/day"},{i:"Vitamin D3+K2",q:"check",n:""},{i:"Algae omega-3",q:"check",n:""},{i:"Magnesium glycinate",q:"check",n:"before bed"}]}], tip:"Batch cook rice and quinoa on day 1 — keeps 4 days in the fridge." },
  7:{ cost:"~£75–95", cats:[{name:"🥩 Meat & Protein",items:[{i:"Chicken breast",q:"1.5kg",n:""},{i:"Lean beef mince 5%",q:"750g",n:""},{i:"Turkey mince",q:"500g",n:""},{i:"Lamb mince",q:"400g",n:"koftas"},{i:"Free range eggs",q:"24",n:""},{i:"Plant protein powder",q:"1kg bag",n:""}]},{name:"🥛 Dairy-Free",items:[{i:"Soya milk",q:"3 litres",n:""},{i:"Coconut yoghurt",q:"1kg",n:""},{i:"Dairy-free feta",q:"200g",n:""}]},{name:"🥦 Vegetables",items:[{i:"Broccoli",q:"3 heads",n:""},{i:"Spinach",q:"600g",n:""},{i:"Mixed peppers",q:"8",n:""},{i:"Courgettes",q:"4",n:""},{i:"Cauliflower",q:"2 heads",n:""},{i:"Asparagus",q:"2 bunches",n:""},{i:"Avocados",q:"4",n:""},{i:"Frozen mixed veg",q:"2kg",n:""}]},{name:"🍚 Carbs (GF)",items:[{i:"Brown rice",q:"2kg",n:""},{i:"Quinoa",q:"1kg",n:""},{i:"Sweet potatoes",q:"7",n:""},{i:"Rice cakes",q:"3 packs",n:""},{i:"Corn tortillas",q:"2 packs",n:""},{i:"GF pasta",q:"500g",n:"rice-based"}]},{name:"🫙 Cupboard",items:[{i:"Chopped tomatoes",q:"5 tins",n:""},{i:"Kidney beans",q:"3 tins",n:""},{i:"Chickpeas",q:"3 tins",n:""},{i:"Tamari",q:"2 bottles",n:""},{i:"Olive oil",q:"500ml",n:""},{i:"Cumin, paprika, oregano",q:"check",n:""}]},{name:"🥜 Snacks",items:[{i:"Mixed nuts",q:"400g",n:""},{i:"Hummus",q:"400g",n:""},{i:"Bananas",q:"7",n:""},{i:"Blueberries",q:"400g",n:""},{i:"Almond butter",q:"1 jar",n:""}]},{name:"💊 Supplements",items:[{i:"Creatine monohydrate",q:"250g tub",n:"5g/day"},{i:"Vitamin D3+K2",q:"90 caps",n:""},{i:"Algae omega-3",q:"60 caps",n:""},{i:"Magnesium glycinate",q:"check",n:"before bed"}]}], tip:"Batch cook a big chilli on Sunday — freezes perfectly into 4+ meals." },
};

export const SUPPS = [
  { name:"Creatine Monohydrate", dose:"5g daily", timing:"Any time", color:"#007aff", icon:"⚡", why:"Preserves muscle during weight loss — critical at 53. Tasteless — stir into coconut yoghurt.", note:"5g/day, no loading phase. Expect 1–2 lbs water weight in muscles initially." },
  { name:"Pea / Soya Protein", dose:"25–40g per serving", timing:"Post-workout or between meals", color:"#34c759", icon:"💪", why:"Plant protein is dairy-free, GF, and near-identical to whey for muscle retention.", note:"Look for 20–25g protein per scoop, under 5g sugar." },
  { name:"Vitamin D3 + K2", dose:"2000–4000 IU D3, 100mcg K2", timing:"With a fatty meal", color:"#ff9500", icon:"☀️", why:"Most over-50s in the UK are deficient. Supports muscle, mood and bone density.", note:"Buy as a combined D3+K2 capsule. Ask GP to test your levels." },
  { name:"Algae Omega-3", dose:"2–3g EPA+DHA daily", timing:"With meals", color:"#af52de", icon:"🧠", why:"Reduces inflammation — great for back and knees. Zero fishy taste.", note:"Algae-based = same source as fish oil. Vegan and GF." },
  { name:"Magnesium Glycinate", dose:"300–400mg", timing:"Before bed", color:"#5ac8fa", icon:"🌙", why:"Supports sleep quality, muscle recovery, regulates cortisol.", note:"Glycinate form is best absorbed. Most notice deeper sleep within a week." },
  { name:"Caffeine (optional)", dose:"100–200mg", timing:"30 min before cardio", color:"#ff9f0a", icon:"☕", why:"Boosts fat burning during cardio, reduces perceived effort.", note:"A strong black coffee works perfectly. Avoid after 2pm." },
];

export const DAILY_TIPS = [
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

// ── Weekly Plan Generator ────────────────────────────────────────────────────
export const getWeeklyPlan = (profile) => {
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
