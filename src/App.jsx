import { useState, useEffect } from "react";

// ── Colour palette — vibrant & bold ──────────────────────────────────────────
const C = {
  bg: "#0d0d1a",
  surface: "#13132b",
  card: "#1a1a35",
  accent: "#ff6b6b",
  accentB: "#ffd93d",
  accentC: "#6bcb77",
  accentD: "#4d96ff",
  purple: "#c77dff",
  orange: "#ff9f1c",
  text: "#f0f0ff",
  muted: "#8888aa",
  border: "#2a2a50",
  green: "#6bcb77",
  red: "#ff6b6b",
  blue: "#4d96ff",
  yellow: "#ffd93d",
};

const GRAD = {
  header: "linear-gradient(135deg, #ff6b6b22, #4d96ff22)",
  card1: "linear-gradient(135deg, #ff6b6b15, #ffd93d10)",
  card2: "linear-gradient(135deg, #4d96ff15, #c77dff10)",
  card3: "linear-gradient(135deg, #6bcb7715, #4d96ff10)",
};

const TABS = ["Today", "Meals", "Workout", "Shopping", "Progress", "Supps"];
const ICONS = { Today: "🏠", Meals: "🍽️", Workout: "💪", Shopping: "🛒", Progress: "📈", Supps: "💊" };
const TARGET_LBS = 14;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

// ── All meals gluten-free, no cow's milk, no oats ────────────────────────────
const ALL_MEALS = [
  {
    id: "m1", style: "balanced", name: "Eggs & Roasted Veg Breakfast",
    time: "7:30 AM", cals: 370, protein: 30,
    items: ["3 scrambled eggs with roasted cherry tomatoes and spinach", "Corn tortilla (2 small, GF)", "Black coffee with soya milk"],
    tag: "🌅 Breakfast",
  },
  {
    id: "m2", style: "balanced", name: "Chicken & Quinoa Bowl",
    time: "1:00 PM", cals: 490, protein: 44,
    items: ["Grilled chicken breast (180g)", "Quinoa (150g cooked)", "Roasted peppers and courgette", "Olive oil and lemon dressing"],
    tag: "☀️ Lunch",
  },
  {
    id: "m3", style: "balanced", name: "Beef Stir-Fry with Rice",
    time: "7:00 PM", cals: 520, protein: 42,
    items: ["Lean sirloin strips (150g)", "Brown rice (150g cooked)", "Broccoli, snap peas, peppers", "Tamari sauce (GF soy) and ginger"],
    tag: "🌙 Dinner",
  },
  {
    id: "m4", style: "balanced", name: "Coconut Yoghurt & Berries",
    time: "10:30 AM", cals: 160, protein: 8,
    items: ["Coconut yoghurt (200g, unsweetened)", "Handful of blueberries and raspberries", "Creatine 5g stirred in — tasteless", "Handful of pumpkin seeds"],
    tag: "🍎 Snack",
  },
  {
    id: "m5", style: "high-protein", name: "Egg White & Sweet Potato Hash",
    time: "7:00 AM", cals: 400, protein: 38,
    items: ["4 egg whites + 1 whole egg, scrambled", "Sweet potato hash (diced, roasted)", "Wilted spinach and cherry tomatoes", "Black coffee with soya milk"],
    tag: "🌅 Breakfast",
  },
  {
    id: "m6", style: "high-protein", name: "Turkey Mince Bowl",
    time: "12:30 PM", cals: 490, protein: 52,
    items: ["Turkey mince (200g, cumin + paprika + garlic)", "Roasted sweet potato (medium)", "Steamed green beans", "Sliced avocado"],
    tag: "☀️ Lunch",
  },
  {
    id: "m7", style: "high-protein", name: "Pork Tenderloin & Cauli Mash",
    time: "7:00 PM", cals: 500, protein: 48,
    items: ["Pork tenderloin (180g, grilled)", "Cauliflower mash with garlic and olive oil", "Roasted asparagus and courgette", "Lemon and herb dressing"],
    tag: "🌙 Dinner",
  },
  {
    id: "m8", style: "high-protein", name: "Rice Cake & Cottage Cheese",
    time: "4:00 PM", cals: 130, protein: 16,
    items: ["3 rice cakes (GF)", "Cottage cheese (120g)", "Sliced cucumber and cherry tomatoes"],
    tag: "🍎 Snack",
  },
  {
    id: "m9", style: "mediterranean", name: "Avocado Eggs",
    time: "8:00 AM", cals: 360, protein: 24,
    items: ["2 poached eggs on GF toast or corn cakes", "Half avocado, sliced", "Handful of olives", "Coffee with soya milk or herbal tea"],
    tag: "🌅 Breakfast",
  },
  {
    id: "m10", style: "mediterranean", name: "Greek Chicken Salad",
    time: "1:00 PM", cals: 510, protein: 44,
    items: ["Grilled chicken breast (180g)", "Mixed leaves, cucumber, olives, red onion", "Dairy-free feta alternative (30g)", "Chickpeas (100g)", "Lemon, olive oil, oregano dressing"],
    tag: "☀️ Lunch",
  },
  {
    id: "m11", style: "mediterranean", name: "Lamb Koftas & Cauliflower Rice",
    time: "7:00 PM", cals: 530, protein: 44,
    items: ["Lamb koftas (150g mince, homemade, GF spices)", "Cauliflower rice (steamed)", "Dairy-free tzatziki (coconut yoghurt + cucumber + mint)", "Roasted red peppers"],
    tag: "🌙 Dinner",
  },
  {
    id: "m12", style: "mediterranean", name: "Hummus & Crudités",
    time: "4:30 PM", cals: 180, protein: 10,
    items: ["Hummus (4 tbsp)", "Carrot, celery, cucumber sticks", "Rice crackers (GF)", "Handful of mixed nuts"],
    tag: "🍎 Snack",
  },
  {
    id: "m13", style: "budget-friendly", name: "Egg Fried Rice",
    time: "7:30 AM", cals: 340, protein: 26,
    items: ["3 eggs scrambled with leftover brown rice", "Frozen peas and sweetcorn", "Tamari sauce (GF)", "Black coffee with soya milk"],
    tag: "🌅 Breakfast",
  },
  {
    id: "m14", style: "budget-friendly", name: "Roast Chicken Thighs & Sweet Potato",
    time: "1:00 PM", cals: 490, protein: 46,
    items: ["Chicken thighs x2, skin-off, roasted (cheaper than breast)", "Baked sweet potato", "Frozen broccoli, steamed", "GF gravy from stock cube"],
    tag: "☀️ Lunch",
  },
  {
    id: "m15", style: "budget-friendly", name: "Beef & Bean Chilli",
    time: "7:00 PM", cals: 560, protein: 46,
    items: ["Beef mince (150g, 5% fat)", "Kidney beans (tin)", "Chopped tomatoes (tin)", "Brown rice (150g cooked)", "Cumin, paprika, chilli flakes"],
    tag: "🌙 Dinner",
  },
  {
    id: "m16", style: "budget-friendly", name: "Banana & Nut Butter",
    time: "10:30 AM", cals: 200, protein: 6,
    items: ["1 banana", "Almond butter (2 tbsp)", "Creatine 5g in water on the side"],
    tag: "🍎 Snack",
  },
  {
    id: "m17", style: "balanced", name: "Soya Protein Shake",
    time: "4:00 PM", cals: 180, protein: 25,
    items: ["Plant protein shake (pea or soya, 1 scoop)", "Soya milk (200ml)", "Banana blended in", "Ice"],
    tag: "🍎 Snack",
  },
  {
    id: "m18", style: "high-protein", name: "Salmon-Free Prawn Stir-Fry",
    time: "7:00 PM", cals: 460, protein: 42,
    items: ["King prawns (200g) — if you eat shellfish, otherwise chicken", "Brown rice noodles (GF)", "Bok choy, edamame, spring onion", "Tamari, sesame oil, ginger"],
    tag: "🌙 Dinner",
  },
  {
    id: "m19", style: "balanced", name: "Overnight Chia Pudding",
    time: "7:30 AM", cals: 310, protein: 18,
    items: ["Chia seeds (4 tbsp) soaked overnight in soya milk", "Mixed berries (100g)", "Almond butter drizzle (1 tbsp)", "Pumpkin seeds on top"],
    tag: "🌅 Breakfast",
  },
  {
    id: "m20", style: "mediterranean", name: "Lemon Chicken & Rice",
    time: "7:00 PM", cals: 510, protein: 46,
    items: ["Chicken breast (180g, baked with lemon and oregano)", "Brown rice (150g)", "Roasted courgette and cherry tomatoes", "Olive oil and garlic dressing"],
    tag: "🌙 Dinner",
  },
];

const WORKOUTS = {
  "full-body": {
    title: "Full Body Strength & Cardio", duration: 55, color: C.accent,
    warmup: ["5 min easy row — low resistance, focus on form", "Arm circles x10 each direction", "Hip circles x10", "Slow bodyweight squats x10"],
    exercises: [
      { name: "Seated Cable Row", sets: 3, reps: "12–15", rest: "60 sec", equipment: "Cable machine", tip: "Drive elbows back, squeeze shoulder blades. Zero spinal flexion needed." },
      { name: "Goblet Squat", sets: 3, reps: "12", rest: "60 sec", equipment: "Dumbbell", tip: "Hold at chest, sit back into heels. Supportive on knees when done slowly." },
      { name: "Dumbbell Chest Press", sets: 3, reps: "10–12", rest: "60 sec", equipment: "Dumbbells + bench", tip: "Lower slowly over 3 seconds — more stimulus, less weight needed." },
      { name: "Cross Trainer Intervals", sets: 1, reps: "12 min", rest: "—", equipment: "Cross trainer", tip: "2 min moderate, 1 min push — repeat 4 times. Zero impact on joints." },
      { name: "Lat Pulldown", sets: 3, reps: "12", rest: "60 sec", equipment: "Cable machine", tip: "Pull to upper chest, lean back slightly. Great back work with no spinal loading." },
      { name: "Seated Shoulder Press", sets: 3, reps: "10–12", rest: "60 sec", equipment: "Dumbbells", tip: "Seated removes all lower back strain. Don't arch at the top." },
    ],
    cooldown: ["5 min easy cross trainer", "Seated hamstring stretch x30 sec each", "Cat-cow x10", "Chest doorway stretch x30 sec"],
    note: "Hits push, pull, legs and cardio in under an hour. Rowing and cross trainer keep heart rate up with zero joint impact.",
  },
  "upper-body": {
    title: "Upper Body Strength", duration: 50, color: C.accentD,
    warmup: ["5 min easy cross trainer", "Arm circles x15 each direction", "Wall slides x10"],
    exercises: [
      { name: "Dumbbell Bench Press", sets: 4, reps: "10", rest: "75 sec", equipment: "Dumbbells + bench", tip: "Last 2 reps should be genuinely hard. Progress by 1–2kg when all reps are clean." },
      { name: "Single-Arm Dumbbell Row", sets: 3, reps: "12 each side", rest: "60 sec", equipment: "Dumbbell + bench", tip: "Support on bench — takes all pressure off your lower back." },
      { name: "Seated Overhead Press", sets: 3, reps: "10–12", rest: "60 sec", equipment: "Dumbbells", tip: "Seated protects the back. Press to just above head — no aggressive lockout." },
      { name: "Face Pulls", sets: 3, reps: "15", rest: "45 sec", equipment: "Cable machine", tip: "Elbows high and wide, pull to face. Essential for shoulder health and posture." },
      { name: "Bicep Curls", sets: 3, reps: "12", rest: "45 sec", equipment: "Dumbbells", tip: "Elbows pinned to sides. Slow is better — no swinging." },
      { name: "Tricep Rope Pushdown", sets: 3, reps: "12–15", rest: "45 sec", equipment: "Cable machine", tip: "Flare the rope at the bottom. Triceps are two-thirds of your upper arm." },
    ],
    cooldown: ["Cross-body shoulder stretch x30 sec each", "Chest doorway stretch x30 sec", "Slow neck rolls x5 each direction"],
    note: "Upper body days produce the most visible change. Shoulders and arms respond very well at any age — form over weight.",
  },
  "lower-body": {
    title: "Lower Body & Core", duration: 50, color: C.accentC,
    warmup: ["5 min easy row — focus on leg drive", "Clamshells x15 each side", "Glute bridges x15", "Ankle circles x10 each"],
    exercises: [
      { name: "Leg Press", sets: 4, reps: "12–15", rest: "75 sec", equipment: "Leg press machine", tip: "Feet high on platform reduces knee stress. Don't lock out at the top." },
      { name: "Romanian Deadlift", sets: 3, reps: "10–12", rest: "75 sec", equipment: "Dumbbells", tip: "Hinge at hips, soft knee, flat back. Lower until you feel hamstring stretch." },
      { name: "Seated Leg Curl", sets: 3, reps: "12–15", rest: "60 sec", equipment: "Machine", tip: "Seated keeps the back safe. Curl slowly and control the return." },
      { name: "Standing Calf Raise", sets: 3, reps: "15–20", rest: "45 sec", equipment: "Bodyweight / dumbbells", tip: "Pause at the top. Calves respond well to higher reps." },
      { name: "Dead Bug", sets: 3, reps: "10 each side", rest: "45 sec", equipment: "Bodyweight", tip: "Extend opposite arm and leg, press lower back to floor. Brilliant core with zero back strain." },
      { name: "Weighted Glute Bridge", sets: 3, reps: "15", rest: "45 sec", equipment: "Barbell / dumbbell", tip: "Drive through heels, hard squeeze at top. Strong glutes protect your lower back." },
    ],
    cooldown: ["Figure-4 hip stretch x40 sec each side", "Supine hamstring stretch x30 sec each", "Child's pose x30 sec if comfortable"],
    note: "Strong legs and glutes are your best long-term defence against back pain. Trains legs hard with zero spinal compression.",
  },
  "cardio-focused": {
    title: "Low-Impact Cardio Burn", duration: 45, color: C.accentB,
    warmup: ["3 min very easy row", "Hip swings x10 each leg", "Arm swings x10"],
    exercises: [
      { name: "Rowing — Steady State", sets: 1, reps: "15 min", rest: "2 min", equipment: "Rowing machine", tip: "22–24 strokes/min. You should just about hold a conversation. This is your fat-burning zone." },
      { name: "Cross Trainer Intervals", sets: 1, reps: "15 min", rest: "2 min", equipment: "Cross trainer", tip: "2 min easy / 1 min harder x5. Goal is sustained heart rate, not exhaustion." },
      { name: "Rowing — Push Finish", sets: 1, reps: "10 min", rest: "—", equipment: "Rowing machine", tip: "Push pace above comfort for the final 5 min. This is where extra calories burn." },
    ],
    cooldown: ["5 min easy cross trainer", "Full body stretch", "Breathing: 4 in, 6 out x8 rounds"],
    note: "Burns 350–450 calories protecting your joints completely. The rowing machine is one of your best fat-loss tools.",
  },
  strength: {
    title: "Progressive Strength", duration: 60, color: C.purple,
    warmup: ["5 min easy row", "Shoulder rotations x10", "Bodyweight squats x10", "Hip hinges x10"],
    exercises: [
      { name: "Dumbbell Bench Press — Heavy", sets: 4, reps: "6–8", rest: "90 sec", equipment: "Dumbbells + bench", tip: "Lower over 3 seconds. Heavy work elevates metabolism for 24–48 hours after." },
      { name: "Lat Pulldown — Heavy", sets: 4, reps: "6–8", rest: "90 sec", equipment: "Cable machine", tip: "Struggle on rep 7–8. A strong back protects your spine every day." },
      { name: "Leg Press — Heavy", sets: 4, reps: "8–10", rest: "90 sec", equipment: "Leg press machine", tip: "Load it up. Heavy leg pressing burns enormously and triggers growth hormone." },
      { name: "Seated Cable Row — Heavy", sets: 3, reps: "8", rest: "75 sec", equipment: "Cable machine", tip: "Hold contracted position 1 second each rep." },
      { name: "Seated Overhead Press — Heavy", sets: 3, reps: "8–10", rest: "75 sec", equipment: "Dumbbells", tip: "Seated keeps spine safe while you push hard." },
    ],
    cooldown: ["10 min easy cross trainer", "Full stretch routine", "Foam roller on upper back and glutes"],
    note: "Muscle burns calories at rest 24 hours a day. Don't fear heavy weights — they make the real difference to body composition.",
  },
};

const SHOPPING = {
  3: {
    cost: "~£35–45",
    cats: [
      { name: "🥩 Meat & Protein", items: [{ i: "Chicken breast", q: "600g", n: "" }, { i: "Lean beef mince 5% fat", q: "400g", n: "" }, { i: "Free range eggs", q: "12", n: "" }, { i: "Plant protein powder (pea/soya)", q: "check stock", n: "GF, dairy-free" }] },
      { name: "🥛 Dairy-Free Alternatives", items: [{ i: "Soya milk (unsweetened)", q: "1 litre", n: "" }, { i: "Coconut yoghurt (unsweetened)", q: "400g", n: "" }, { i: "Cottage cheese", q: "300g", n: "if tolerating dairy OK" }] },
      { name: "🥦 Vegetables", items: [{ i: "Broccoli", q: "1 head", n: "" }, { i: "Spinach", q: "200g", n: "" }, { i: "Mixed peppers", q: "3", n: "" }, { i: "Cherry tomatoes", q: "250g", n: "" }, { i: "Cauliflower", q: "1 head", n: "for rice or mash" }] },
      { name: "🍚 Carbs (GF)", items: [{ i: "Brown rice", q: "500g", n: "GF" }, { i: "Quinoa", q: "500g", n: "GF" }, { i: "Sweet potatoes", q: "4", n: "" }, { i: "Corn tortillas (GF)", q: "1 pack", n: "" }, { i: "Rice cakes", q: "1 pack", n: "GF" }] },
      { name: "🫙 Cupboard", items: [{ i: "Tinned chopped tomatoes", q: "2 tins", n: "" }, { i: "Kidney beans", q: "1 tin", n: "" }, { i: "Tamari sauce", q: "1 bottle", n: "GF soy sauce" }, { i: "Olive oil", q: "check stock", n: "" }] },
      { name: "💊 Supplements", items: [{ i: "Creatine monohydrate", q: "check stock", n: "5g/day, any unflavoured brand" }, { i: "Vitamin D3+K2", q: "check stock", n: "2000–4000 IU" }, { i: "Algae omega-3", q: "check stock", n: "dairy & fish free" }] },
    ],
    tip: "Tamari is your GF replacement for soy sauce — same flavour, no gluten. Quinoa is a complete protein grain and totally GF. Coconut yoghurt is excellent for your creatine.",
  },
  5: {
    cost: "~£55–70",
    cats: [
      { name: "🥩 Meat & Protein", items: [{ i: "Chicken breast", q: "1kg", n: "" }, { i: "Turkey mince", q: "400g", n: "" }, { i: "Lean beef mince 5% fat", q: "500g", n: "" }, { i: "Free range eggs", q: "18", n: "" }, { i: "Plant protein powder", q: "check stock", n: "pea or soya, GF" }] },
      { name: "🥛 Dairy-Free", items: [{ i: "Soya milk (unsweetened)", q: "2 litres", n: "" }, { i: "Oat milk (GF certified)", q: "1 litre", n: "only if not reacting to oats" }, { i: "Coconut yoghurt", q: "500g", n: "" }, { i: "Dairy-free feta", q: "150g", n: "" }] },
      { name: "🥦 Vegetables", items: [{ i: "Broccoli", q: "2 heads", n: "" }, { i: "Spinach", q: "400g", n: "" }, { i: "Mixed peppers", q: "6", n: "" }, { i: "Courgettes", q: "3", n: "" }, { i: "Asparagus", q: "1 bunch", n: "" }, { i: "Frozen mixed veg", q: "1kg", n: "great value" }] },
      { name: "🍚 Carbs (GF)", items: [{ i: "Brown rice", q: "1kg", n: "" }, { i: "Quinoa", q: "500g", n: "" }, { i: "Sweet potatoes", q: "5", n: "" }, { i: "Rice crackers", q: "2 packs", n: "" }, { i: "Corn tortillas", q: "2 packs", n: "" }] },
      { name: "🫙 Cupboard", items: [{ i: "Chopped tomatoes", q: "3 tins", n: "" }, { i: "Kidney beans", q: "2 tins", n: "" }, { i: "Chickpeas", q: "2 tins", n: "" }, { i: "Tamari sauce", q: "1 bottle", n: "GF" }, { i: "Olive oil", q: "500ml", n: "" }, { i: "Almond butter", q: "1 jar", n: "" }] },
      { name: "🥜 Snacks", items: [{ i: "Mixed nuts", q: "200g", n: "30g portions" }, { i: "Hummus", q: "200g", n: "" }, { i: "Bananas", q: "5", n: "" }] },
      { name: "💊 Supplements", items: [{ i: "Creatine monohydrate", q: "check stock", n: "5g/day" }, { i: "Vitamin D3+K2", q: "check stock", n: "" }, { i: "Algae omega-3", q: "check stock", n: "" }, { i: "Magnesium glycinate", q: "check stock", n: "before bed" }] },
    ],
    tip: "Batch cook rice and quinoa on day 1 — keeps 4 days in the fridge. If oats give you symptoms, stick to soya milk and coconut yoghurt as your dairy alternatives.",
  },
  7: {
    cost: "~£75–95",
    cats: [
      { name: "🥩 Meat & Protein", items: [{ i: "Chicken breast", q: "1.5kg", n: "" }, { i: "Lean beef mince 5% fat", q: "750g", n: "" }, { i: "Turkey mince", q: "500g", n: "" }, { i: "Lamb mince", q: "400g", n: "for koftas" }, { i: "Free range eggs", q: "24", n: "" }, { i: "Plant protein powder", q: "1kg bag", n: "pea/soya, GF" }] },
      { name: "🥛 Dairy-Free", items: [{ i: "Soya milk (unsweetened)", q: "3 litres", n: "" }, { i: "Coconut yoghurt", q: "1kg", n: "" }, { i: "Almond cream (for cooking)", q: "2 cartons", n: "" }, { i: "Dairy-free feta", q: "200g", n: "" }] },
      { name: "🥦 Vegetables", items: [{ i: "Broccoli", q: "3 heads", n: "" }, { i: "Spinach", q: "600g", n: "" }, { i: "Mixed peppers", q: "8", n: "" }, { i: "Courgettes", q: "4", n: "" }, { i: "Cauliflower", q: "2 heads", n: "rice + mash" }, { i: "Asparagus", q: "2 bunches", n: "" }, { i: "Avocados", q: "4", n: "" }, { i: "Frozen mixed veg", q: "2kg", n: "" }] },
      { name: "🍚 Carbs (GF)", items: [{ i: "Brown rice", q: "2kg", n: "" }, { i: "Quinoa", q: "1kg", n: "" }, { i: "Sweet potatoes", q: "7", n: "" }, { i: "Rice cakes / crackers", q: "3 packs", n: "" }, { i: "Corn tortillas", q: "2 packs", n: "" }, { i: "GF pasta (rice-based)", q: "500g", n: "" }] },
      { name: "🫙 Cupboard", items: [{ i: "Chopped tomatoes", q: "5 tins", n: "" }, { i: "Kidney beans", q: "3 tins", n: "" }, { i: "Chickpeas", q: "3 tins", n: "" }, { i: "Tamari sauce", q: "2 bottles", n: "GF soy" }, { i: "Extra virgin olive oil", q: "500ml", n: "" }, { i: "Cumin, paprika, oregano, turmeric", q: "check stock", n: "" }] },
      { name: "🥜 Snacks", items: [{ i: "Mixed nuts", q: "400g", n: "30g portions" }, { i: "Hummus", q: "400g", n: "" }, { i: "Bananas", q: "7", n: "" }, { i: "Blueberries", q: "400g", n: "" }, { i: "Almond butter", q: "1 jar", n: "" }] },
      { name: "💊 Supplements", items: [{ i: "Creatine monohydrate", q: "250g tub", n: "5g/day = 50 days" }, { i: "Vitamin D3+K2", q: "90 caps", n: "2000–4000 IU" }, { i: "Algae omega-3", q: "60 caps", n: "no fish" }, { i: "Magnesium glycinate", q: "check stock", n: "300–400mg bed" }] },
    ],
    tip: "Buy a big bag of quinoa — it's a complete protein (all amino acids) and cooks like rice. Batch-cook a large chilli or mince dish on Sunday. Freeze half for later in the week.",
  },
};

const DAILY_TIPS = [
  "Start today with a large glass of water before breakfast — hydration alone can reduce hunger by up to 20%. Mild dehydration makes workouts feel harder than they are.",
  "Focus on protein at every meal. At 53, your body needs more protein than ever to hold onto muscle while losing fat — aim for a palm-sized portion at each meal.",
  "Before your next workout, spend 5 minutes on gentle hip and thoracic mobility. It warms up the areas around your back safely and makes every exercise more comfortable.",
  "Don't skip rest days — they're when fat loss actually happens. Your body repairs and rebalances hormones during recovery, especially important as you get older.",
  "If you feel like snacking, try a 10-minute walk first. Cravings typically peak and pass within 15 minutes, and light movement is a powerful appetite suppressant.",
  "Sleep is your secret weapon. Poor sleep raises ghrelin (hunger hormone) and lowers willpower. Protect 7–8 hours tonight — it's as important as your diet.",
  "Creatine works best taken consistently every day, even rest days. Stir it into coconut yoghurt or water — completely tasteless.",
  "Try eating your largest meal at lunch rather than dinner. Insulin sensitivity is higher earlier in the day, so calories are used more efficiently.",
  "On the rowing machine: 60% legs, 20% core, 20% arms. Lead with the legs — this protects your back and generates the most power.",
  "Track your waist measurement as well as weight. Creatine can add 1–2 lbs of water weight in your muscles, so the scale can be misleading — tape never lies.",
  "Add leafy greens to two meals today. Almost calorie-free, high in magnesium, and they bulk out meals so you feel full on fewer calories.",
  "On the cross trainer, stand upright and don't lean on the handles. This engages your core, burns more calories, and builds better posture.",
];

const SUPPS = [
  { name: "Creatine Monohydrate", dose: "5g daily", timing: "Any time — consistency is key", color: C.accent, icon: "⚡",
    why: "Preserves and builds muscle during weight loss — critical at 53. Also boosts strength in weight sessions. Completely tasteless — stir into coconut yoghurt or water.",
    note: "No loading phase needed — just 5g/day from day one. Expect 1–2 lbs of water weight in your muscles initially (not fat). This is normal and a sign it's working." },
  { name: "Pea / Soya Protein", dose: "25–40g per serving", timing: "Post-workout or between meals", color: C.accentC, icon: "💪",
    why: "Hitting 120g+ protein daily from food alone is hard. Plant protein (pea or soya) is dairy-free, gluten-free, and performs almost identically to whey for muscle retention.",
    note: "Look for brands with 20–25g protein per scoop and under 5g sugar. Unflavoured pea protein mixes into smoothies invisibly. Soya protein has a complete amino acid profile." },
  { name: "Vitamin D3 + K2", dose: "2000–4000 IU D3, 100mcg K2", timing: "With a fatty meal", color: C.accentD, icon: "☀️",
    why: "Most people over 50 in the UK are deficient year-round. D3 supports muscle function, mood, bone density and immune health — all important when weight training.",
    note: "K2 directs calcium to bones rather than arteries — pair it with D3. Buy as a combined capsule. Ask your GP to test your vitamin D levels — deficiency is very common." },
  { name: "Algae Omega-3", dose: "2–3g EPA+DHA daily", timing: "With meals to avoid repeat", color: C.purple, icon: "🧠",
    why: "Reduces inflammation — great for your back and knees. Supports joint lubrication, heart health and recovery. Since you avoid fish, algae-based is the ideal source.",
    note: "Algae is where fish get their omega-3 from — so you're getting the same thing at the source, with zero fishy taste or smell. Completely vegan and GF." },
  { name: "Magnesium Glycinate", dose: "300–400mg elemental magnesium", timing: "30–60 min before bed", color: C.orange, icon: "🌙",
    why: "Supports sleep quality, muscle recovery, reduces cramping, and helps regulate cortisol. High cortisol from poor sleep directly stalls fat loss and increases cravings.",
    note: "Glycinate form is best absorbed and easiest on the stomach. Most people notice deeper sleep within a week. Avoid magnesium oxide — poor absorption." },
  { name: "Caffeine (optional)", dose: "100–200mg", timing: "30–45 min before cardio", color: C.accentB, icon: "☕",
    why: "Boosts fat burning during cardio, improves endurance on the rower and cross trainer, and reduces perceived effort — so harder sessions feel easier.",
    note: "A strong black coffee with soya milk works perfectly — no supplements needed. Avoid after 2pm to protect sleep. Skip on rest days." },
];

const REVIEWS = [
  (n, lost, wks, avg) => `Great work ${n}! Losing ${lost.toFixed(1)} lbs in ${wks} week${wks !== 1 ? "s" : ""} is exactly the pace that leads to lasting results. At ${avg} lbs per week, keep prioritising protein and your resistance sessions — they protect your muscle while the fat comes off.`,
  (n, lost, wks, avg) => `You're doing really well — ${lost.toFixed(1)} lbs gone in ${wks} week${wks !== 1 ? "s" : ""}. At ${avg} lbs/week you'll hit your stone in around ${Math.ceil((14 - lost) / parseFloat(avg))} more weeks. Consistency with creatine is key now — it becomes more effective the longer you take it daily.`,
  (n, lost, wks, avg) => `${lost.toFixed(1)} lbs lost — excellent ${n}. If progress stalls, check: are you hitting 120g protein daily, and how is your sleep? Both have a huge impact at 53. Your rowing machine is one of the best calorie burners available — add 15 easy minutes on rest days when in doubt.`,
];

// ── Primitives ────────────────────────────────────────────────────────────────

const Card = ({ children, style = {}, onClick }) => (
  <div onClick={onClick} style={{
    background: C.card, border: `1px solid ${C.border}`, borderRadius: 18,
    padding: 18, marginBottom: 14, cursor: onClick ? "pointer" : "default",
    transition: "transform 0.15s, border-color 0.2s", ...style,
  }}
    onMouseEnter={e => onClick && (e.currentTarget.style.transform = "translateY(-2px)")}
    onMouseLeave={e => onClick && (e.currentTarget.style.transform = "translateY(0)")}
  >{children}</div>
);

const Pill = ({ children, color = C.accent, onClick, active }) => (
  <span onClick={onClick} style={{
    background: active ? color : color + "22",
    color: active ? (color === C.accentB ? "#111" : "#fff") : color,
    border: `1px solid ${color}66`,
    borderRadius: 99, padding: "5px 13px", fontSize: 12,
    fontWeight: 700, cursor: onClick ? "pointer" : "default",
    transition: "all 0.2s", display: "inline-block",
  }}>{children}</span>
);

const Btn = ({ children, onClick, color = C.accent, style = {}, disabled, small }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: `linear-gradient(135deg, ${color}, ${color}cc)`,
    color: color === C.accentB || color === C.accentC ? "#111" : "#fff",
    border: "none", borderRadius: 12,
    padding: small ? "7px 14px" : "11px 22px",
    fontFamily: "inherit", fontWeight: 700,
    fontSize: small ? 12 : 13, cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1, transition: "all 0.15s",
    boxShadow: `0 4px 15px ${color}44`, ...style,
  }}>{children}</button>
);

const TInput = ({ value, onChange, placeholder, type = "number", style = {} }) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{
    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
    color: C.text, padding: "10px 14px", fontSize: 15,
    fontFamily: "inherit", outline: "none", ...style,
  }} />
);

const StatBox = ({ label, val, color }) => (
  <div style={{ flex: 1, background: `${color}15`, border: `1px solid ${color}33`, borderRadius: 14, padding: "12px 8px", textAlign: "center" }}>
    <div style={{ color, fontSize: 17, fontWeight: 800 }}>{val}</div>
    <div style={{ color: C.muted, fontSize: 9, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
  </div>
);

// ── Setup ─────────────────────────────────────────────────────────────────────

const Setup = ({ onDone }) => {
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState("lbs");

  const go = () => {
    if (!weight || isNaN(weight)) return;
    let lbs = parseFloat(weight);
    if (unit === "kg") lbs *= 2.20462;
    if (unit === "stone") lbs *= 14;
    onDone({ name: name.trim() || "Friend", startWeight: parseFloat(lbs.toFixed(1)) });
  };

  const targetLbs = weight && !isNaN(weight) ? (() => {
    let l = parseFloat(weight);
    if (unit === "kg") l *= 2.20462;
    if (unit === "stone") l *= 14;
    return (l - 14).toFixed(1);
  })() : null;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", fontFamily: "Georgia, serif" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>🏃</div>
        <h1 style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.accentB})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: 34, margin: 0, fontWeight: 800 }}>LeanPlan</h1>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 8 }}>Your personal weight loss coach · Gluten-free · Dairy-free friendly</p>
      </div>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <Card style={{ background: GRAD.card1 }}>
          <p style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 20 }}>LET'S GET STARTED</p>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: C.muted, fontSize: 12, display: "block", marginBottom: 6 }}>Your name (optional)</label>
            <TInput type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Alex" style={{ width: "100%" }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: C.muted, fontSize: 12, display: "block", marginBottom: 6 }}>Starting weight</label>
            <div style={{ display: "flex", gap: 8 }}>
              <TInput value={weight} onChange={e => setWeight(e.target.value)} placeholder="Enter weight" style={{ flex: 1 }} />
              <select value={unit} onChange={e => setUnit(e.target.value)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, padding: "10px", fontFamily: "inherit", fontSize: 13, cursor: "pointer", outline: "none" }}>
                <option value="lbs">lbs</option>
                <option value="kg">kg</option>
                <option value="stone">stone</option>
              </select>
            </div>
          </div>
          {targetLbs && (
            <div style={{ background: `${C.accentC}15`, border: `1px solid ${C.accentC}33`, borderRadius: 12, padding: "12px 14px", marginBottom: 18 }}>
              <p style={{ color: C.text, fontSize: 13, margin: 0, lineHeight: 2 }}>
                🎯 Goal weight: <strong style={{ color: C.accent }}>{targetLbs} lbs</strong><br />
                ⏱ Estimated: <strong style={{ color: C.accentC }}>10–14 weeks</strong><br />
                📅 Rate: <strong style={{ color: C.accentB }}>1–1.5 lbs / week</strong>
              </p>
            </div>
          )}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
            {["✅ No fish", "✅ Gluten-free", "✅ Dairy-free", "✅ No oats"].map(t => (
              <span key={t} style={{ background: `${C.accentC}22`, color: C.accentC, border: `1px solid ${C.accentC}44`, borderRadius: 99, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{t}</span>
            ))}
          </div>
          <Btn onClick={go} disabled={!weight} style={{ width: "100%" }} color={C.accent}>✦ Start My Journey</Btn>
        </Card>
      </div>
    </div>
  );
};

// ── Chart ─────────────────────────────────────────────────────────────────────

const Chart = ({ entries, startWeight, targetWeight }) => {
  const pts = [{ label: "Start", weight: startWeight }, ...entries];
  if (pts.length < 2) return null;
  const ws = pts.map(p => p.weight).concat(targetWeight);
  const minW = Math.min(...ws) - 2, maxW = Math.max(...ws) + 2, range = maxW - minW;
  const W = 340, H = 150, P = { t: 14, r: 14, b: 32, l: 44 };
  const cW = W - P.l - P.r, cH = H - P.t - P.b;
  const tx = i => P.l + (i / (pts.length - 1)) * cW;
  const ty = w => P.t + cH - ((w - minW) / range) * cH;
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${tx(i).toFixed(1)},${ty(p.weight).toFixed(1)}`).join(" ");
  const area = line + ` L${tx(pts.length - 1).toFixed(1)},${H - P.b} L${P.l},${H - P.b} Z`;
  const ticks = [Math.ceil(minW + 1), Math.round((minW + maxW) / 2), Math.floor(maxW - 1)];
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.accent} stopOpacity="0.4" />
          <stop offset="100%" stopColor={C.accentD} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {ticks.map(w => <line key={w} x1={P.l} y1={ty(w)} x2={W - P.r} y2={ty(w)} stroke={C.border} strokeWidth="1" />)}
      <line x1={P.l} y1={ty(targetWeight)} x2={W - P.r} y2={ty(targetWeight)} stroke={C.accentC} strokeWidth="2" strokeDasharray="5,4" opacity="0.9" />
      <text x={W - P.r - 2} y={ty(targetWeight) - 6} fill={C.accentC} fontSize="9" textAnchor="end" fontWeight="700">target</text>
      <path d={area} fill="url(#g1)" />
      <path d={line} fill="none" stroke={`url(#stroke1)`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <defs><linearGradient id="stroke1" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={C.accent} /><stop offset="100%" stopColor={C.accentD} /></linearGradient></defs>
      {pts.map((p, i) => <circle key={i} cx={tx(i)} cy={ty(p.weight)} r={i === pts.length - 1 ? 6 : 4} fill={i === pts.length - 1 ? C.accent : C.bg} stroke={i === pts.length - 1 ? C.accent : C.accentD} strokeWidth="2.5" />)}
      {ticks.map(w => <text key={w} x={P.l - 6} y={ty(w) + 4} fill={C.muted} fontSize="9" textAnchor="end">{Math.round(w)}</text>)}
      {pts.map((p, i) => <text key={i} x={tx(i)} y={H - P.b + 16} fill={C.muted} fontSize="8.5" textAnchor="middle">{p.label}</text>)}
    </svg>
  );
};

// ── TODAY TAB ─────────────────────────────────────────────────────────────────

const TodayTab = ({ profile, entries }) => {
  const [tipIdx, setTipIdx] = useState(() => Math.floor(Math.random() * DAILY_TIPS.length));
  const cur = entries.length > 0 ? entries[entries.length - 1].weight : profile.startWeight;
  const lost = Math.max(0, profile.startWeight - cur);
  const pct = Math.min(100, Math.round((lost / TARGET_LBS) * 100));
  return (
    <div>
      <div style={{ marginBottom: 20, background: GRAD.header, borderRadius: 20, padding: "20px 18px", border: `1px solid ${C.border}` }}>
        <p style={{ color: C.muted, fontSize: 13, marginBottom: 4 }}>Hello, <strong style={{ color: C.accentB }}>{profile.name}</strong> 👋</p>
        <h2 style={{ color: C.text, fontSize: 28, margin: "0 0 4px", fontWeight: 800 }}>Lose 1 Stone</h2>
        <p style={{ color: C.muted, fontSize: 13, margin: "0 0 14px" }}>{lost.toFixed(1)} lbs lost · {Math.max(0, TARGET_LBS - lost).toFixed(1)} to go · {pct}%</p>
        <div style={{ background: `${C.border}88`, borderRadius: 99, height: 10, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${C.accent}, ${C.accentB})`, borderRadius: 99, transition: "width 0.6s", boxShadow: `0 0 12px ${C.accent}88` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ color: C.muted, fontSize: 11 }}>Start: {profile.startWeight} lbs</span>
          <span style={{ color: C.accentC, fontSize: 11, fontWeight: 700 }}>Now: {cur.toFixed(1)} lbs</span>
        </div>
      </div>

      <Card style={{ background: GRAD.card1, borderColor: `${C.accent}33` }}>
        <p style={{ color: C.accent, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>📅 TODAY'S TIP</p>
        <p style={{ color: C.text, fontSize: 14, lineHeight: 1.8, margin: 0 }}>{DAILY_TIPS[tipIdx]}</p>
        <Btn onClick={() => setTipIdx(i => (i + 1) % DAILY_TIPS.length)} color={C.accent} small style={{ marginTop: 12 }}>↻ Next tip</Btn>
      </Card>

      <Card style={{ background: GRAD.card2 }}>
        <p style={{ color: C.accentD, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 12 }}>🎯 YOUR PLAN</p>
        {[
          ["Target", "500 cal/day deficit ≈ 1 lb/week", C.accent],
          ["Equipment", "Rowing · Cross trainer · Weights", C.accentD],
          ["Diet", "No fish · No oats · GF · Dairy-free", C.accentC],
          ["Exercise", "Low-impact · Joint-friendly", C.accentB],
          ["Supplements", "Creatine · Plant protein · D3+K2", C.purple],
        ].map(([k, v, col]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ color: col, fontSize: 12, fontWeight: 700, minWidth: 80 }}>{k}</span>
            <span style={{ color: C.text, fontSize: 13, textAlign: "right", maxWidth: "62%" }}>{v}</span>
          </div>
        ))}
      </Card>
    </div>
  );
};

// ── MEALS TAB ─────────────────────────────────────────────────────────────────

const MealsTab = ({ favourites, setFavourites, removed, setRemoved }) => {
  const [style, setStyle] = useState("all");
  const [shown, setShown] = useState(null);
  const [viewFavs, setViewFavs] = useState(false);

  const styles = ["all", "balanced", "high-protein", "mediterranean", "budget-friendly"];

  const available = ALL_MEALS.filter(m => !removed.includes(m.id));
  const filtered = style === "all" ? available : available.filter(m => m.style === style);
  const favMeals = ALL_MEALS.filter(m => favourites.includes(m.id));

  const generate = () => {
    const pool = filtered.length > 0 ? filtered : available;
    // try to prefer favourites if any exist in pool
    const favPool = pool.filter(m => favourites.includes(m.id));
    const usePool = favPool.length >= 3 ? favPool : pool;
    // pick 4 unique meals
    const shuffled = [...usePool].sort(() => Math.random() - 0.5).slice(0, 4);
    setShown(shuffled);
  };

  const toggleFav = (id) => setFavourites(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);
  const removeM = (id) => { setRemoved(r => [...r, id]); setShown(s => s ? s.filter(m => m.id !== id) : s); };

  const totalCals = shown ? shown.reduce((a, m) => a + m.cals, 0) : 0;
  const totalProt = shown ? shown.reduce((a, m) => a + m.protein, 0) : 0;

  return (
    <div>
      {/* Favourites banner */}
      {favMeals.length > 0 && (
        <div onClick={() => setViewFavs(v => !v)} style={{ background: `${C.accentB}15`, border: `1px solid ${C.accentB}44`, borderRadius: 14, padding: "10px 16px", marginBottom: 14, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: C.accentB, fontWeight: 700, fontSize: 13 }}>⭐ {favMeals.length} favourite meal{favMeals.length !== 1 ? "s" : ""}</span>
          <span style={{ color: C.muted, fontSize: 12 }}>{viewFavs ? "▲ hide" : "▼ view"}</span>
        </div>
      )}
      {viewFavs && favMeals.map(m => (
        <Card key={m.id} style={{ borderColor: `${C.accentB}55`, background: `${C.accentB}08` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ color: C.accentB, fontSize: 10, fontWeight: 700 }}>⭐ FAVOURITE · {m.tag}</span>
              <p style={{ color: C.text, fontWeight: 700, fontSize: 15, margin: "4px 0 0" }}>{m.name}</p>
            </div>
            <Btn onClick={() => toggleFav(m.id)} color={C.accentB} small>★ Unfav</Btn>
          </div>
        </Card>
      ))}

      <Card style={{ background: GRAD.card1 }}>
        <p style={{ color: C.accent, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 12 }}>🍽️ GENERATE MEAL PLAN</p>
        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          {styles.map(s => (
            <Pill key={s} color={C.accent} active={style === s} onClick={() => setStyle(s)}>{s}</Pill>
          ))}
        </div>
        <Btn onClick={generate} color={C.accent}>✦ Generate Today's Meals</Btn>
      </Card>

      {shown && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <StatBox label="Calories" val={totalCals} color={C.accent} />
            <StatBox label="Protein" val={`${totalProt}g`} color={C.accentC} />
          </div>

          {shown.map((m) => {
            const isFav = favourites.includes(m.id);
            return (
              <Card key={m.id} style={{ borderColor: isFav ? `${C.accentB}66` : C.border, background: isFav ? `${C.accentB}08` : C.card }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ color: C.muted, fontSize: 10, fontWeight: 700 }}>{m.tag}</span>
                    <p style={{ color: C.text, fontWeight: 700, fontSize: 15, margin: "3px 0 0" }}>{m.name}</p>
                  </div>
                  <div style={{ textAlign: "right", marginLeft: 10 }}>
                    <div style={{ color: C.accent, fontSize: 13, fontWeight: 700 }}>{m.cals} cal</div>
                    <div style={{ color: C.accentC, fontSize: 12 }}>{m.protein}g protein</div>
                  </div>
                </div>
                {m.items.map((item, j) => (
                  <div key={j} style={{ padding: "4px 10px", background: C.surface, borderRadius: 8, fontSize: 13, color: C.text, marginBottom: 4 }}>· {item}</div>
                ))}
                {/* Action buttons */}
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <Btn onClick={() => toggleFav(m.id)} color={isFav ? C.accentB : C.muted} small style={{ boxShadow: "none" }}>
                    {isFav ? "⭐ Saved" : "☆ Favourite"}
                  </Btn>
                  <Btn onClick={() => removeM(m.id)} color={C.red} small style={{ boxShadow: "none" }}>
                    ✕ Remove
                  </Btn>
                </div>
              </Card>
            );
          })}

          {removed.length > 0 && (
            <div style={{ textAlign: "center", marginTop: 4 }}>
              <span onClick={() => setRemoved([])} style={{ color: C.muted, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
                Restore {removed.length} removed meal{removed.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── WORKOUT TAB ───────────────────────────────────────────────────────────────

const WorkoutTab = () => {
  const [day, setDay] = useState("full-body");
  const [w, setW] = useState(null);
  const wk = WORKOUTS[day];
  return (
    <div>
      <Card style={{ background: GRAD.card2 }}>
        <p style={{ color: C.accentD, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 12 }}>💪 WORKOUT</p>
        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          {Object.entries(WORKOUTS).map(([key, val]) => (
            <Pill key={key} color={val.color} active={day === key} onClick={() => setDay(key)}>{key}</Pill>
          ))}
        </div>
        <Btn onClick={() => setW(WORKOUTS[day])} color={WORKOUTS[day].color}>✦ Generate Workout</Btn>
      </Card>

      {w && (
        <>
          <div style={{ background: `${w.color}15`, border: `2px solid ${w.color}44`, borderRadius: 18, padding: "16px 18px", marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ color: C.text, margin: 0, fontSize: 18, fontWeight: 800 }}>{w.title}</h3>
                <p style={{ color: C.muted, fontSize: 13, margin: "4px 0 0" }}>{w.duration} min · Low impact · Joint safe</p>
              </div>
              <Pill color={w.color}>🦺 Safe</Pill>
            </div>
          </div>

          <Card>
            <p style={{ color: C.accentC, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>🔥 WARM UP</p>
            {w.warmup.map((x, i) => <div key={i} style={{ padding: "5px 10px", background: `${C.accentC}15`, borderRadius: 8, fontSize: 13, color: C.text, marginBottom: 4 }}>· {x}</div>)}
          </Card>

          {w.exercises.map((ex, i) => (
            <Card key={i} style={{ borderLeft: `3px solid ${w.color}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <p style={{ color: w.color, fontWeight: 800, fontSize: 15, margin: 0 }}>{i + 1}. {ex.name}</p>
                  <span style={{ color: C.muted, fontSize: 11, fontWeight: 700 }}>{ex.equipment}</span>
                </div>
                <div style={{ textAlign: "right", background: `${w.color}15`, borderRadius: 10, padding: "6px 12px" }}>
                  <div style={{ color: C.text, fontSize: 15, fontWeight: 800 }}>{ex.sets} × {ex.reps}</div>
                  <div style={{ color: C.muted, fontSize: 11 }}>Rest: {ex.rest}</div>
                </div>
              </div>
              {ex.tip && <div style={{ background: C.surface, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: C.muted, borderLeft: `3px solid ${C.accentB}` }}>💬 {ex.tip}</div>}
            </Card>
          ))}

          <Card>
            <p style={{ color: C.accentD, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>❄️ COOL DOWN</p>
            {w.cooldown.map((x, i) => <div key={i} style={{ padding: "5px 10px", background: `${C.accentD}15`, borderRadius: 8, fontSize: 13, color: C.text, marginBottom: 4 }}>· {x}</div>)}
          </Card>

          <Card style={{ background: `${w.color}10`, borderColor: `${w.color}44` }}>
            <p style={{ color: w.color, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 6 }}>🏅 COACH NOTES</p>
            <p style={{ color: C.text, fontSize: 13, lineHeight: 1.75, margin: 0 }}>{w.note}</p>
          </Card>
        </>
      )}
    </div>
  );
};

// ── SHOPPING TAB ──────────────────────────────────────────────────────────────

const ShoppingTab = () => {
  const [days, setDays] = useState(7);
  const [list, setList] = useState(null);
  const [checked, setChecked] = useState({});
  const toggle = k => setChecked(c => ({ ...c, [k]: !c[k] }));
  return (
    <div>
      <Card style={{ background: GRAD.card3 }}>
        <p style={{ color: C.accentC, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 12 }}>🛒 SHOPPING LIST <span style={{ color: C.muted, fontSize: 10, fontWeight: 400 }}>— all GF &amp; dairy-free friendly</span></p>
        <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center" }}>
          <span style={{ color: C.muted, fontSize: 13 }}>For</span>
          {[3, 5, 7].map(d => <Pill key={d} color={C.accentC} active={days === d} onClick={() => setDays(d)}>{d} days</Pill>)}
        </div>
        <Btn onClick={() => { setList(SHOPPING[days]); setChecked({}); }} color={C.accentC}>✦ Generate List</Btn>
      </Card>

      {list && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, padding: "0 4px" }}>
            <span style={{ color: C.text, fontWeight: 700 }}>{days}-day list</span>
            <Pill color={C.accentC}>{list.cost}</Pill>
          </div>
          {list.cats.map((cat, ci) => (
            <Card key={ci}>
              <p style={{ color: C.accentC, fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", marginBottom: 10 }}>{cat.name}</p>
              {cat.items.map((item, ii) => {
                const k = `${ci}-${ii}`;
                return (
                  <div key={ii} onClick={() => toggle(k)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: `1px solid ${C.border}`, cursor: "pointer", opacity: checked[k] ? 0.3 : 1, transition: "opacity 0.2s" }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, background: checked[k] ? C.accentC : "transparent", border: `2px solid ${checked[k] ? C.accentC : C.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {checked[k] && <span style={{ color: "#111", fontSize: 12, fontWeight: 800 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ color: C.text, fontSize: 14, textDecoration: checked[k] ? "line-through" : "none" }}>{item.i}</span>
                      {item.n && <span style={{ color: C.muted, fontSize: 11, marginLeft: 6 }}>({item.n})</span>}
                    </div>
                    <span style={{ color: C.muted, fontSize: 12 }}>{item.q}</span>
                  </div>
                );
              })}
            </Card>
          ))}
          <Card style={{ background: `${C.accentC}10`, borderColor: `${C.accentC}33` }}>
            <p style={{ color: C.accentC, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 6 }}>💡 SMART SHOPPING</p>
            <p style={{ color: C.text, fontSize: 13, lineHeight: 1.7, margin: 0 }}>{list.tip}</p>
          </Card>
        </>
      )}
    </div>
  );
};

// ── PROGRESS TAB ──────────────────────────────────────────────────────────────

const ProgressTab = ({ profile, entries, setEntries }) => {
  const [newW, setNewW] = useState("");
  const [review, setReview] = useState("");
  const cur = entries.length > 0 ? entries[entries.length - 1].weight : profile.startWeight;
  const lost = Math.max(0, profile.startWeight - cur);
  const wks = entries.length;
  const avg = wks > 0 ? (lost / wks).toFixed(1) : null;
  const eta = lost < TARGET_LBS && avg && parseFloat(avg) > 0 ? Math.ceil((TARGET_LBS - lost) / parseFloat(avg)) : null;
  const target = profile.startWeight - TARGET_LBS;

  const addEntry = () => {
    if (!newW || isNaN(newW)) return;
    setEntries(prev => [...prev, { weight: parseFloat(parseFloat(newW).toFixed(1)), label: `W${prev.length + 1}`, date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" }) }]);
    setNewW("");
  };

  return (
    <div>
      <Card style={{ background: GRAD.card2 }}>
        <p style={{ color: C.accentD, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 14 }}>⚖️ WEEKLY WEIGH-IN</p>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <TInput value={newW} onChange={e => setNewW(e.target.value)} placeholder="Current weight in lbs" style={{ flex: 1 }} />
          <Btn onClick={addEntry} disabled={!newW} color={C.accentD} style={{ padding: "10px 16px" }}>+ Log</Btn>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
          <span style={{ color: C.muted }}>Start: <strong style={{ color: C.text }}>{profile.startWeight} lbs</strong></span>
          <span style={{ color: C.muted }}>Target: <strong style={{ color: C.accentC }}>{target.toFixed(1)} lbs</strong></span>
        </div>
      </Card>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <StatBox label="Lost" val={`${lost.toFixed(1)} lbs`} color={C.accentC} />
        <StatBox label="Per week" val={avg ? `${avg} lbs` : "—"} color={C.accent} />
        <StatBox label="ETA" val={eta ? `${eta} wks` : "—"} color={C.accentD} />
      </div>

      {entries.length >= 1 && (
        <Card>
          <p style={{ color: C.accentD, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 12 }}>📈 WEIGHT CHART (lbs)</p>
          <Chart entries={entries} startWeight={profile.startWeight} targetWeight={target} />
          {entries.length < 2 && <p style={{ color: C.muted, fontSize: 12, textAlign: "center", marginTop: 8 }}>Log more weeks to see your trend</p>}
        </Card>
      )}

      {entries.length > 0 && (
        <Card>
          <p style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 12 }}>📋 WEEKLY LOG</p>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0 8px", borderBottom: `1px solid ${C.border}` }}>
            <span style={{ color: C.muted, fontSize: 12 }}>Starting weight</span>
            <span style={{ color: C.text, fontWeight: 700 }}>{profile.startWeight} lbs</span>
            <span style={{ color: C.muted, fontSize: 11 }}>baseline</span>
          </div>
          {entries.map((e, i) => {
            const prev = i === 0 ? profile.startWeight : entries[i - 1].weight;
            const diff = e.weight - prev;
            return (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
                <div><span style={{ color: C.muted, fontSize: 12 }}>{e.label}</span>{e.date && <span style={{ color: C.muted, fontSize: 11, marginLeft: 6 }}>· {e.date}</span>}</div>
                <span style={{ color: C.text, fontSize: 14, fontWeight: 700 }}>{e.weight} lbs</span>
                <span style={{ color: diff < 0 ? C.accentC : diff > 0 ? C.red : C.muted, fontSize: 12, fontWeight: 700, background: diff < 0 ? `${C.accentC}15` : diff > 0 ? `${C.red}15` : "transparent", padding: "2px 8px", borderRadius: 99 }}>
                  {diff < 0 ? "▼" : diff > 0 ? "▲" : "●"} {Math.abs(diff).toFixed(1)}
                </span>
              </div>
            );
          })}
        </Card>
      )}

      <Card style={{ background: GRAD.card1 }}>
        <p style={{ color: C.accent, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>🏅 PROGRESS REVIEW</p>
        {review ? <p style={{ color: C.text, fontSize: 14, lineHeight: 1.8, margin: 0 }}>{review}</p> : <p style={{ color: C.muted, fontSize: 13 }}>Log at least one week then get your personalised review.</p>}
        <Btn onClick={() => { if (wks === 0) return; setReview(pick(REVIEWS)(profile.name, lost, wks, avg)); }} disabled={wks === 0} color={C.accent} style={{ marginTop: 12 }}>✦ Get My Review</Btn>
      </Card>
    </div>
  );
};

// ── SUPPS TAB ─────────────────────────────────────────────────────────────────

const SuppsTab = () => {
  const [open, setOpen] = useState(null);
  return (
    <div>
      <Card style={{ background: GRAD.card2, borderColor: `${C.purple}44` }}>
        <p style={{ color: C.purple, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8 }}>💊 SUPPLEMENT GUIDE</p>
        <p style={{ color: C.text, fontSize: 13, lineHeight: 1.7, margin: 0 }}>Evidence-backed supplements for fat loss, muscle preservation and joint health — all dairy-free and gluten-free. Tap each card for full details.</p>
      </Card>
      {SUPPS.map((s, i) => (
        <Card key={i} onClick={() => setOpen(open === i ? null : i)} style={{ borderLeft: `3px solid ${s.color}`, borderColor: open === i ? `${s.color}66` : C.border }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{s.icon}</div>
              <div>
                <p style={{ color: C.text, fontWeight: 700, fontSize: 14, margin: 0 }}>{s.name}</p>
                <p style={{ color: C.muted, fontSize: 11, margin: "2px 0 0" }}>{s.dose}</p>
              </div>
            </div>
            <span style={{ color: C.muted, fontSize: 12 }}>{open === i ? "▲" : "▼"}</span>
          </div>
          {open === i && (
            <div style={{ marginTop: 16, borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
              <div style={{ marginBottom: 12 }}><Pill color={s.color}>⏰ {s.timing}</Pill></div>
              <p style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", margin: "0 0 4px" }}>WHY IT HELPS YOU</p>
              <p style={{ color: C.text, fontSize: 13, lineHeight: 1.75, marginBottom: 12 }}>{s.why}</p>
              <div style={{ background: `${s.color}12`, borderRadius: 10, padding: "10px 14px", borderLeft: `3px solid ${s.color}` }}>
                <p style={{ color: s.color, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>💡 NOTES</p>
                <p style={{ color: C.text, fontSize: 12, lineHeight: 1.65, margin: 0 }}>{s.note}</p>
              </div>
            </div>
          )}
        </Card>
      ))}
      <Card style={{ background: C.surface }}>
        <p style={{ color: C.muted, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 6 }}>⚠️ DISCLAIMER</p>
        <p style={{ color: C.muted, fontSize: 12, lineHeight: 1.6, margin: 0 }}>General guidance only. Consult your GP before starting supplements, especially if you take medications or have existing health conditions.</p>
      </Card>
    </div>
  );
};

// ── MAIN ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("Today");
  const [entries, setEntries] = useState([]);
  const [favourites, setFavourites] = useState([]);
  const [removed, setRemoved] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("leanplan_v2");
      if (raw) {
        const d = JSON.parse(raw);
        if (d.profile) setProfile(d.profile);
        if (d.entries) setEntries(d.entries);
        if (d.favourites) setFavourites(d.favourites);
        if (d.removed) setRemoved(d.removed);
      }
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading) return;
    try {
      localStorage.setItem("leanplan_v2", JSON.stringify({ profile, entries, favourites, removed }));
    } catch (e) {}
  }, [profile, entries, favourites, removed, loading]);

  if (loading) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia, serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏃</div>
        <p style={{ color: C.muted, fontSize: 14 }}>Loading your plan...</p>
      </div>
    </div>
  );

  if (!profile) return <Setup onDone={p => setProfile(p)} />;

  const cur = entries.length > 0 ? entries[entries.length - 1].weight : profile.startWeight;
  const lost = Math.max(0, profile.startWeight - cur);
  const pct = Math.min(100, Math.round((lost / TARGET_LBS) * 100));

  const handleReset = () => {
    if (window.confirm("Reset all data and start fresh?")) {
      localStorage.removeItem("leanplan_v2");
      setProfile(null); setEntries([]); setFavourites([]); setRemoved([]);
    }
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Georgia, serif", color: C.text, maxWidth: 430, margin: "0 auto" }}>
      <style>{`* { box-sizing: border-box; } input, select { outline: none; } ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #2a2a50; border-radius: 4px; }`}</style>

      {/* Header */}
      <div style={{ padding: "14px 18px 12px", background: `linear-gradient(180deg, ${C.surface} 0%, ${C.bg} 100%)`, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 19, fontWeight: 800, background: `linear-gradient(90deg, ${C.accent}, ${C.accentB})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>🏃 LeanPlan</h1>
            <p style={{ margin: 0, fontSize: 10, color: C.muted, letterSpacing: "0.06em", cursor: "pointer" }} onClick={handleReset}>
              {profile.name.toUpperCase()} · <span style={{ color: C.border }}>reset</span>
            </p>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "6px 14px", fontSize: 12, textAlign: "right" }}>
            <div><span style={{ color: C.accentC, fontWeight: 800, fontSize: 15 }}>{lost.toFixed(1)}</span><span style={{ color: C.muted }}> / 14 lbs</span></div>
            <div style={{ background: `${C.border}88`, borderRadius: 99, height: 4, marginTop: 4, overflow: "hidden", width: 80 }}>
              <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${C.accent}, ${C.accentC})`, borderRadius: 99 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "18px 14px 110px" }}>
        {tab === "Today" && <TodayTab profile={profile} entries={entries} />}
        {tab === "Meals" && <MealsTab favourites={favourites} setFavourites={setFavourites} removed={removed} setRemoved={setRemoved} />}
        {tab === "Workout" && <WorkoutTab />}
        {tab === "Shopping" && <ShoppingTab />}
        {tab === "Progress" && <ProgressTab profile={profile} entries={entries} setEntries={fn => setEntries(typeof fn === "function" ? fn(entries) : fn)} />}
        {tab === "Supps" && <SuppsTab />}
      </div>

      {/* Tab bar */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: C.surface, borderTop: `1px solid ${C.border}`, display: "flex", padding: "6px 0 14px" }}>
        {TABS.map((t, i) => {
          const colors = [C.accent, C.accentB, C.accentD, C.accentC, C.purple, C.orange];
          const col = colors[i];
          return (
            <div key={t} onClick={() => setTab(t)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", gap: 3, padding: "5px 0" }}>
              <span style={{ fontSize: 16, filter: tab === t ? "none" : "grayscale(0.7) opacity(0.5)", transform: tab === t ? "scale(1.2)" : "scale(1)", transition: "all 0.2s" }}>{ICONS[t]}</span>
              <span style={{ fontSize: 8, fontWeight: 800, color: tab === t ? col : C.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>{t}</span>
              {tab === t && <div style={{ width: 18, height: 2, background: col, borderRadius: 99, marginTop: 1 }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
