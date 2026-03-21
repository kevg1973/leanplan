import { useState, useEffect } from "react";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif";

const C = {
  bg: "#f2f2f7", surface: "#ffffff", card: "#ffffff",
  accent: "#007aff", accentB: "#34c759", accentC: "#34c759",
  accentD: "#007aff", purple: "#af52de", orange: "#ff9500",
  teal: "#5ac8fa", pink: "#ff2d55", red: "#ff3b30", yellow: "#ffcc00",
  text: "#000000", textSec: "#3c3c43", muted: "#8e8e93",
  border: "#e5e5ea", divider: "#c6c6c8", green: "#34c759",
  cardBg: "#ffffff", sectionBg: "#f2f2f7",
};

const GRAD = {
  hero: "linear-gradient(160deg, #007aff22, #34c75918)",
  card1: "linear-gradient(160deg, #007aff08, #af52de06)",
  card2: "linear-gradient(160deg, #34c75908, #007aff06)",
  card3: "linear-gradient(160deg, #5ac8fa08, #34c75906)",
};

const TABS = ["Today","Meals","Workout","Progress","Profile"];
const ICONS = { Today:"🏠", Meals:"🍽️", Workout:"💪", Progress:"📈", Profile:"⚙️" };
const TARGET_DEFAULT = 14;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const todayKey = () => new Date().toISOString().split("T")[0];

// ── Pace options ─────────────────────────────────────────────────────────────
const PACE_OPTIONS = [
  { id:"slow",   label:"Steady",   lbs:0.5, weeks_per_stone:28, color:"#34c759", desc:"0.5 lbs/week — very sustainable, minimal hunger, ideal for long-term habit building.", warning:null },
  { id:"normal", label:"Moderate", lbs:1,   weeks_per_stone:14, color:"#007aff", desc:"1 lb/week — the gold standard. Sustainable fat loss with good energy levels.", warning:null },
  { id:"fast",   label:"Active",   lbs:1.5, weeks_per_stone:10, color:"#ff9500", desc:"1.5 lbs/week — achievable with consistent training and a tighter calorie deficit.", warning:"⚠️ Requires a strict 750 cal/day deficit. Make sure protein intake stays high (120g+) to protect muscle." },
  { id:"vfast",  label:"Aggressive",lbs:2,  weeks_per_stone:7,  color:"#ff3b30", desc:"2 lbs/week — maximum recommended rate. Only sustainable short-term.", warning:"🚨 2 lbs/week is the upper safe limit. Below this risks muscle loss, fatigue and nutrient deficiency. Requires 1000 cal/day deficit — consult your GP if you have any health concerns." },
];
const getPace = id => PACE_OPTIONS.find(p => p.id === id) || PACE_OPTIONS[1];
const weekStart = () => { const d=new Date(); d.setDate(d.getDate()-d.getDay()+1); return d; };

// ── Allergens & dislikes ─────────────────────────────────────────────────────
const ALLERGENS = ["Gluten","Dairy","Eggs","Nuts","Peanuts","Soya","Shellfish","Fish","Sesame","Celery","Mustard","Sulphites"];
const DISLIKES_LIST = ["Fish","Oily fish","Shellfish","Lamb","Pork","Red meat","Mushrooms","Aubergine","Courgette","Brussels sprouts","Cauliflower","Broccoli","Olives","Avocado","Spicy food","Garlic","Onion","Cottage cheese","Tofu"];

// ── All meals ────────────────────────────────────────────────────────────────
const ALL_MEALS = [
  { id:"m1", tags:["balanced","breakfast","gf","df"], name:"Scrambled Eggs & Roasted Veg",
    time:"7:30 AM", cals:370, protein:30, allergens:[],
    items:["3 large eggs","Cherry tomatoes (100g)","Spinach (60g)","2 corn tortillas (GF)","Soya milk splash for coffee"],
    method:"1. Preheat oven to 200°C. Halve tomatoes, toss with olive oil and roast 15 min.\n2. Whisk eggs with a pinch of salt. Heat a non-stick pan on medium-low.\n3. Add eggs, stir slowly with a spatula — take off heat while still slightly wet.\n4. Wilt spinach in the same pan for 30 sec.\n5. Warm tortillas in a dry pan for 30 sec each side.\n6. Serve eggs on tortillas with roasted tomatoes and spinach on the side." },
  { id:"m2", tags:["balanced","lunch","gf","df"], name:"Chicken & Quinoa Bowl",
    time:"1:00 PM", cals:490, protein:44, allergens:[],
    items:["Chicken breast (180g)","Quinoa (70g dry)","Mixed peppers (1)","Courgette (half)","Olive oil, lemon, herbs"],
    method:"1. Cook quinoa: rinse, simmer in 150ml water for 12 min, then rest 5 min covered.\n2. Season chicken with salt, pepper, smoked paprika. Grill or pan-fry 6-7 min each side until cooked through.\n3. Dice peppers and courgette, toss in olive oil and roast at 200°C for 20 min.\n4. Make dressing: 2 tbsp olive oil, juice of half a lemon, pinch of herbs.\n5. Slice chicken, assemble over quinoa with veg and dressing." },
  { id:"m3", tags:["balanced","dinner","gf","df"], name:"Beef Stir-Fry with Rice",
    time:"7:00 PM", cals:520, protein:42, allergens:["soya"],
    items:["Sirloin strips (150g)","Brown rice (80g dry)","Broccoli, snap peas, peppers","Tamari sauce (GF)","Fresh ginger, garlic"],
    method:"1. Cook brown rice: 1 part rice to 2 parts water, bring to boil, cover and simmer 25 min.\n2. Mix 2 tbsp tamari, 1 tsp sesame oil, 1 tsp honey, grate in ginger and garlic.\n3. Get a wok or large pan very hot. Sear beef strips 2 min — don't stir too much.\n4. Remove beef, add veg to hot pan, stir-fry 3-4 min.\n5. Return beef, pour over sauce, toss everything together for 1 min.\n6. Serve over rice." },
  { id:"m4", tags:["balanced","snack","gf","df"], name:"Coconut Yoghurt & Berries",
    time:"10:30 AM", cals:160, protein:8, allergens:[],
    items:["Coconut yoghurt (200g)","Blueberries and raspberries (100g)","Pumpkin seeds (15g)","5g creatine (stir in)"],
    method:"1. Spoon coconut yoghurt into a bowl.\n2. Top with mixed berries.\n3. Scatter pumpkin seeds on top.\n4. Stir in your creatine — it's completely tasteless in yoghurt.\n5. That's it — no cooking needed." },
  { id:"m5", tags:["high-protein","breakfast","gf","df"], name:"Egg White & Sweet Potato Hash",
    time:"7:00 AM", cals:400, protein:38, allergens:[],
    items:["4 egg whites + 1 whole egg","Sweet potato (200g)","Spinach (60g)","Cherry tomatoes (80g)","Olive oil, smoked paprika"],
    method:"1. Dice sweet potato into 1cm cubes. Toss in olive oil and paprika, roast at 200°C for 25 min until crispy.\n2. Separate eggs — 4 whites into a bowl, add 1 whole egg, whisk together.\n3. Wilt spinach and tomatoes in a pan, 2 min.\n4. Pour egg mixture over, stir gently on medium heat until just set.\n5. Serve eggs over the crispy sweet potato hash." },
  { id:"m6", tags:["high-protein","lunch","gf","df"], name:"Turkey Mince Bowl",
    time:"12:30 PM", cals:490, protein:52, allergens:[],
    items:["Turkey mince (200g)","Sweet potato (medium)","Green beans (100g)","Avocado (half)","Cumin, paprika, garlic"],
    method:"1. Bake sweet potato whole at 200°C for 45 min (or microwave 8 min).\n2. Brown turkey mince in a pan on high heat, breaking it up. Season generously with cumin, paprika, garlic powder, salt and pepper.\n3. Steam or boil green beans for 4 min.\n4. Slice avocado.\n5. Serve mince over sweet potato with beans and avocado on the side." },
  { id:"m7", tags:["high-protein","dinner","gf","df"], name:"Pork Tenderloin & Cauliflower Mash",
    time:"7:00 PM", cals:500, protein:48, allergens:[],
    items:["Pork tenderloin (180g)","Cauliflower (half head)","Asparagus (6 spears)","Courgette (1)","Garlic, olive oil, lemon"],
    method:"1. Season pork with salt, pepper, rosemary. Pan-sear on high heat 2 min each side, then finish in oven at 180°C for 12 min. Rest 5 min before slicing.\n2. Boil cauliflower florets until tender (10 min). Drain, add olive oil, garlic, salt, then mash or blend until smooth.\n3. Toss asparagus and courgette in olive oil, griddle or roast at 200°C for 10 min.\n4. Plate: mash first, pork slices on top, veg on the side, squeeze of lemon." },
  { id:"m8", tags:["high-protein","snack","gf"], name:"Rice Cakes & Cottage Cheese",
    time:"4:00 PM", cals:130, protein:16, allergens:["dairy"],
    items:["3 rice cakes (GF)","Cottage cheese (120g)","Cucumber (half)","Cherry tomatoes (6)"],
    method:"1. Slice cucumber into rounds.\n2. Spoon cottage cheese onto rice cakes.\n3. Top with cucumber and halved cherry tomatoes.\n4. Season with black pepper." },
  { id:"m9", tags:["mediterranean","breakfast","gf","df"], name:"Avocado Poached Eggs",
    time:"8:00 AM", cals:360, protein:24, allergens:[],
    items:["2 eggs","Avocado (1)","GF toast or corn cakes","Handful of olives","Lemon, chilli flakes"],
    method:"1. Bring a pan of water to a gentle simmer. Add a splash of vinegar.\n2. Crack each egg into a cup. Create a gentle swirl in the water, slide egg in. Cook 3 min for runny yolk.\n3. Toast your GF bread or warm corn cakes.\n4. Mash avocado with lemon juice, salt, and chilli flakes.\n5. Spread avocado on toast, top with poached eggs and olives." },
  { id:"m10", tags:["mediterranean","lunch","gf","df"], name:"Greek Chicken Salad",
    time:"1:00 PM", cals:510, protein:44, allergens:[],
    items:["Chicken breast (180g)","Mixed leaves (80g)","Cucumber, olives, red onion","Chickpeas (100g)","Dairy-free feta (30g)","Lemon, olive oil, oregano"],
    method:"1. Season chicken with oregano, lemon zest, salt, pepper. Grill or pan-fry until cooked through (6-7 min each side).\n2. Slice cucumber, thinly slice red onion, halve olives.\n3. Make dressing: 3 tbsp olive oil, juice of 1 lemon, 1 tsp oregano, salt.\n4. Assemble salad: leaves, veg, chickpeas. Slice chicken on top. Crumble feta. Drizzle dressing." },
  { id:"m11", tags:["mediterranean","dinner","gf","df"], name:"Lamb Koftas & Cauliflower Rice",
    time:"7:00 PM", cals:530, protein:44, allergens:[],
    items:["Lamb mince (150g)","Cauliflower (half head)","Coconut yoghurt, cucumber, mint","Roasted red peppers (2)","Cumin, coriander, garlic"],
    method:"1. Mix lamb mince with 1 tsp each cumin, coriander, garlic powder, salt. Shape into 6 small koftas around skewers or just as patties.\n2. Grill or pan-fry koftas 8-10 min, turning regularly.\n3. Blitz cauliflower in food processor to rice-sized pieces. Stir-fry in a dry pan 5 min.\n4. Make tzatziki: grate cucumber, squeeze out water, mix with coconut yoghurt, mint, garlic, lemon.\n5. Serve koftas over cauliflower rice with tzatziki and roasted peppers." },
  { id:"m12", tags:["mediterranean","snack","gf","df"], name:"Hummus & Crudités",
    time:"4:30 PM", cals:180, protein:10, allergens:["sesame"],
    items:["Hummus (4 tbsp)","Carrot, celery, cucumber","Rice crackers (GF)","Mixed nuts (20g)"],
    method:"1. Slice carrots and celery into sticks.\n2. Slice cucumber into rounds or batons.\n3. Arrange veg and crackers on a plate around hummus.\n4. Scatter nuts on the side." },
  { id:"m13", tags:["budget","breakfast","gf","df"], name:"Egg Fried Rice",
    time:"7:30 AM", cals:340, protein:26, allergens:["soya"],
    items:["3 eggs","Leftover brown rice (150g cooked)","Frozen peas and sweetcorn (80g)","Tamari sauce (GF)","Spring onion"],
    method:"1. This works best with day-old cold rice.\n2. Beat eggs in a bowl.\n3. Get a wok or pan very hot with a little oil. Add rice, stir-fry 2 min.\n4. Push rice to edges, pour eggs into centre, scramble quickly then mix through.\n5. Add frozen veg — they'll defrost in the heat in 2 min.\n6. Splash of tamari, top with sliced spring onion." },
  { id:"m14", tags:["budget","lunch","gf","df"], name:"Roast Chicken Thighs & Sweet Potato",
    time:"1:00 PM", cals:490, protein:46, allergens:[],
    items:["Chicken thighs x2 skin-off","Sweet potato (large)","Frozen broccoli (150g)","GF stock cube for gravy","Olive oil, garlic, herbs"],
    method:"1. Preheat oven to 200°C. Rub chicken with olive oil, garlic, mixed herbs, salt and pepper.\n2. Roast chicken 35-40 min until golden and juices run clear.\n3. Cut sweet potato into wedges, toss in oil, roast alongside for 30 min.\n4. Steam or boil broccoli from frozen 5 min.\n5. Make quick gravy: dissolve stock cube in 150ml hot water, thicken with 1 tsp cornflour if needed." },
  { id:"m15", tags:["budget","dinner","gf","df"], name:"Beef & Bean Chilli",
    time:"7:00 PM", cals:560, protein:46, allergens:[],
    items:["Beef mince 5% fat (150g)","Kidney beans (tin)","Chopped tomatoes (tin)","Brown rice (80g dry)","Cumin, paprika, chilli, garlic"],
    method:"1. Cook rice: bring to boil, cover and simmer 25 min.\n2. Brown mince in a large pan on high heat until no pink remains.\n3. Add 1 tsp each cumin, smoked paprika, chilli powder, 2 crushed garlic cloves. Stir 1 min.\n4. Add chopped tomatoes and drained kidney beans. Simmer 20 min.\n5. Season to taste. Serve over rice." },
  { id:"m16", tags:["budget","snack","gf","df"], name:"Banana & Almond Butter",
    time:"10:30 AM", cals:200, protein:6, allergens:["nuts"],
    items:["1 banana","Almond butter (2 tbsp)","5g creatine in water"],
    method:"1. Peel and slice banana.\n2. Serve with almond butter for dipping.\n3. Take your creatine in a small glass of water alongside." },
  { id:"m17", tags:["balanced","snack","gf","df"], name:"Plant Protein Shake",
    time:"4:00 PM", cals:180, protein:25, allergens:["soya"],
    items:["Pea/soya protein (1 scoop)","Soya milk (200ml)","1 banana","Ice cubes"],
    method:"1. Add soya milk to blender.\n2. Add protein powder, banana and ice.\n3. Blend 30 seconds until smooth.\n4. Drink immediately for best texture." },
  { id:"m18", tags:["high-protein","dinner","gf","df"], name:"Lemon Herb Chicken & Rice",
    time:"7:00 PM", cals:510, protein:46, allergens:[],
    items:["Chicken breast (180g)","Brown rice (80g dry)","Courgette and cherry tomatoes","Olive oil, lemon, garlic, oregano"],
    method:"1. Marinate chicken in olive oil, lemon juice, garlic, oregano for 30 min if possible (or cook straight away).\n2. Cook rice as normal (25 min).\n3. Bake chicken at 190°C for 25-30 min or pan-fry 7 min each side.\n4. Halve tomatoes and dice courgette, roast at 200°C for 15 min.\n5. Serve everything together with an extra squeeze of lemon." },
  { id:"m19", tags:["balanced","breakfast","gf","df"], name:"Chia Pudding",
    time:"7:30 AM", cals:310, protein:18, allergens:["nuts"],
    items:["Chia seeds (4 tbsp)","Soya milk (250ml)","Mixed berries (100g)","Almond butter (1 tbsp)","Pumpkin seeds"],
    method:"1. The night before: mix chia seeds and soya milk in a jar. Stir well, cover, refrigerate overnight.\n2. In the morning, give it a good stir — it should be thick and pudding-like.\n3. Top with mixed berries, drizzle almond butter, scatter pumpkin seeds.\n4. Add a little more soya milk if too thick." },
  { id:"m20", tags:["mediterranean","dinner","gf","df"], name:"Spiced Lamb & Quinoa",
    time:"7:00 PM", cals:530, protein:44, allergens:[],
    items:["Lamb leg steak (180g)","Quinoa (70g dry)","Spinach (80g)","Cherry tomatoes (100g)","Cumin, coriander, lemon"],
    method:"1. Cook quinoa: rinse, simmer 12 min, rest 5 min.\n2. Rub lamb with cumin, coriander, olive oil, salt. Grill or pan-fry 3-4 min each side for medium.\n3. Rest lamb 3 min then slice.\n4. Wilt spinach in the pan juices, 1 min.\n5. Halve tomatoes.\n6. Serve sliced lamb over quinoa with spinach and tomatoes. Squeeze lemon over everything." },
];

const WORKOUTS = {
  "full-body": { title:"Full Body Strength & Cardio", duration:55, color:"#007aff",
    warmup:["5 min easy row — low resistance, focus on form","Arm circles x10 each direction","Hip circles x10","Slow bodyweight squats x10"],
    exercises:[
      { name:"Seated Cable Row", sets:3, reps:"12–15", rest:"60 sec", equipment:"Cable machine", tip:"Drive elbows back, squeeze shoulder blades. Zero spinal flexion needed." },
      { name:"Goblet Squat", sets:3, reps:"12", rest:"60 sec", equipment:"Dumbbell", tip:"Hold at chest, sit back into heels. Supportive on knees when done slowly." },
      { name:"Dumbbell Chest Press", sets:3, reps:"10–12", rest:"60 sec", equipment:"Dumbbells + bench", tip:"Lower slowly over 3 seconds — more stimulus, less weight needed." },
      { name:"Cross Trainer Intervals", sets:1, reps:"12 min", rest:"—", equipment:"Cross trainer", tip:"2 min moderate, 1 min push — repeat 4 times. Zero impact on joints." },
      { name:"Lat Pulldown", sets:3, reps:"12", rest:"60 sec", equipment:"Cable machine", tip:"Pull to upper chest, lean back slightly. Great back work with no spinal loading." },
      { name:"Seated Shoulder Press", sets:3, reps:"10–12", rest:"60 sec", equipment:"Dumbbells", tip:"Seated removes all lower back strain. Don't arch at the top." },
    ],
    cooldown:["5 min easy cross trainer","Seated hamstring stretch x30 sec each","Cat-cow x10","Chest doorway stretch x30 sec"],
    note:"Hits push, pull, legs and cardio in under an hour. Rowing and cross trainer keep heart rate up with zero joint impact." },
  "upper-body": { title:"Upper Body Strength", duration:50, color:"#af52de",
    warmup:["5 min easy cross trainer","Arm circles x15 each direction","Wall slides x10"],
    exercises:[
      { name:"Dumbbell Bench Press", sets:4, reps:"10", rest:"75 sec", equipment:"Dumbbells + bench", tip:"Last 2 reps should be genuinely hard. Progress by 1–2kg when all reps are clean." },
      { name:"Single-Arm Dumbbell Row", sets:3, reps:"12 each side", rest:"60 sec", equipment:"Dumbbell + bench", tip:"Support on bench — takes all pressure off your lower back." },
      { name:"Seated Overhead Press", sets:3, reps:"10–12", rest:"60 sec", equipment:"Dumbbells", tip:"Seated protects the back. Press to just above head — no aggressive lockout." },
      { name:"Face Pulls", sets:3, reps:"15", rest:"45 sec", equipment:"Cable machine", tip:"Elbows high and wide, pull to face. Essential for shoulder health and posture." },
      { name:"Bicep Curls", sets:3, reps:"12", rest:"45 sec", equipment:"Dumbbells", tip:"Elbows pinned to sides. Slow is better — no swinging." },
      { name:"Tricep Rope Pushdown", sets:3, reps:"12–15", rest:"45 sec", equipment:"Cable machine", tip:"Flare the rope at the bottom. Triceps are two-thirds of your upper arm." },
    ],
    cooldown:["Cross-body shoulder stretch x30 sec each","Chest doorway stretch x30 sec","Slow neck rolls x5 each direction"],
    note:"Upper body days produce the most visible change. Form over weight every time." },
  "lower-body": { title:"Lower Body & Core", duration:50, color:"#34c759",
    warmup:["5 min easy row — focus on leg drive","Clamshells x15 each side","Glute bridges x15","Ankle circles x10 each"],
    exercises:[
      { name:"Leg Press", sets:4, reps:"12–15", rest:"75 sec", equipment:"Leg press machine", tip:"Feet high on platform reduces knee stress. Don't lock out at the top." },
      { name:"Romanian Deadlift", sets:3, reps:"10–12", rest:"75 sec", equipment:"Dumbbells", tip:"Hinge at hips, soft knee, flat back. Lower until you feel hamstring stretch." },
      { name:"Seated Leg Curl", sets:3, reps:"12–15", rest:"60 sec", equipment:"Machine", tip:"Seated keeps the back safe. Curl slowly and control the return." },
      { name:"Standing Calf Raise", sets:3, reps:"15–20", rest:"45 sec", equipment:"Bodyweight / dumbbells", tip:"Pause at the top. Calves respond well to higher reps." },
      { name:"Dead Bug", sets:3, reps:"10 each side", rest:"45 sec", equipment:"Bodyweight", tip:"Extend opposite arm and leg, press lower back to floor. Brilliant core with zero back strain." },
      { name:"Weighted Glute Bridge", sets:3, reps:"15", rest:"45 sec", equipment:"Barbell / dumbbell", tip:"Drive through heels, hard squeeze at top. Strong glutes protect your lower back." },
    ],
    cooldown:["Figure-4 hip stretch x40 sec each side","Supine hamstring stretch x30 sec each","Child's pose x30 sec if comfortable"],
    note:"Strong legs and glutes are your best long-term defence against back pain." },
  "cardio": { title:"Low-Impact Cardio Burn", duration:45, color:"#ff9500",
    warmup:["3 min very easy row","Hip swings x10 each leg","Arm swings x10"],
    exercises:[
      { name:"Rowing — Steady State", sets:1, reps:"15 min", rest:"2 min", equipment:"Rowing machine", tip:"22–24 strokes/min. Just about hold a conversation. Fat-burning zone." },
      { name:"Cross Trainer Intervals", sets:1, reps:"15 min", rest:"2 min", equipment:"Cross trainer", tip:"2 min easy / 1 min harder x5. Sustained heart rate, not exhaustion." },
      { name:"Rowing — Push Finish", sets:1, reps:"10 min", rest:"—", equipment:"Rowing machine", tip:"Push pace above comfort for the final 5 min." },
    ],
    cooldown:["5 min easy cross trainer","Full body stretch","Breathing: 4 in, 6 out x8 rounds"],
    note:"Burns 350–450 calories with zero joint impact. One of your best fat-loss tools." },
  "strength": { title:"Progressive Strength", duration:60, color:"#ff2d55",
    warmup:["5 min easy row","Shoulder rotations x10","Bodyweight squats x10","Hip hinges x10"],
    exercises:[
      { name:"Dumbbell Bench Press — Heavy", sets:4, reps:"6–8", rest:"90 sec", equipment:"Dumbbells + bench", tip:"Lower over 3 seconds. Heavy work elevates metabolism for 24–48 hours after." },
      { name:"Lat Pulldown — Heavy", sets:4, reps:"6–8", rest:"90 sec", equipment:"Cable machine", tip:"Struggle on rep 7–8. A strong back protects your spine every day." },
      { name:"Leg Press — Heavy", sets:4, reps:"8–10", rest:"90 sec", equipment:"Leg press machine", tip:"Load it up. Heavy leg pressing burns enormously and triggers growth hormone." },
      { name:"Seated Cable Row — Heavy", sets:3, reps:"8", rest:"75 sec", equipment:"Cable machine", tip:"Hold contracted position 1 second each rep." },
      { name:"Seated Overhead Press — Heavy", sets:3, reps:"8–10", rest:"75 sec", equipment:"Dumbbells", tip:"Seated keeps spine safe while you push hard." },
    ],
    cooldown:["10 min easy cross trainer","Full stretch routine","Foam roller on upper back and glutes"],
    note:"Muscle burns calories at rest 24 hours a day. Don't fear heavy weights." },
};

const SHOPPING = {
  3:{ cost:"~£35–45", cats:[
    { name:"🥩 Meat & Protein", items:[{i:"Chicken breast",q:"600g",n:""},{i:"Lean beef mince 5%",q:"400g",n:""},{i:"Free range eggs",q:"12",n:""},{i:"Plant protein powder",q:"check stock",n:"pea/soya, GF"}]},
    { name:"🥛 Dairy-Free", items:[{i:"Soya milk (unsweetened)",q:"1 litre",n:""},{i:"Coconut yoghurt",q:"400g",n:""},{i:"Coconut cream",q:"1 tin",n:"for cooking"}]},
    { name:"🥦 Vegetables", items:[{i:"Broccoli",q:"1 head",n:""},{i:"Spinach",q:"200g",n:""},{i:"Mixed peppers",q:"3",n:""},{i:"Cherry tomatoes",q:"250g",n:""},{i:"Sweet potatoes",q:"3",n:""}]},
    { name:"🍚 Carbs (GF)", items:[{i:"Brown rice",q:"500g",n:""},{i:"Quinoa",q:"500g",n:""},{i:"Corn tortillas",q:"1 pack",n:"GF"},{i:"Rice cakes",q:"1 pack",n:""}]},
    { name:"🫙 Cupboard", items:[{i:"Chopped tomatoes",q:"2 tins",n:""},{i:"Kidney beans",q:"1 tin",n:""},{i:"Tamari sauce",q:"1 bottle",n:"GF soy"},{i:"Olive oil",q:"check",n:""}]},
    { name:"💊 Supplements", items:[{i:"Creatine monohydrate",q:"check",n:"5g/day"},{i:"Vitamin D3+K2",q:"check",n:"2000–4000 IU"},{i:"Algae omega-3",q:"check",n:""}]},
  ], tip:"Tamari is your GF soy sauce replacement — same flavour, no gluten. Quinoa is a complete protein and totally GF." },
  5:{ cost:"~£55–70", cats:[
    { name:"🥩 Meat & Protein", items:[{i:"Chicken breast",q:"1kg",n:""},{i:"Turkey mince",q:"400g",n:""},{i:"Lean beef mince 5%",q:"500g",n:""},{i:"Free range eggs",q:"18",n:""},{i:"Plant protein powder",q:"check",n:""}]},
    { name:"🥛 Dairy-Free", items:[{i:"Soya milk (unsweetened)",q:"2 litres",n:""},{i:"Coconut yoghurt",q:"500g",n:""},{i:"Dairy-free feta",q:"150g",n:""}]},
    { name:"🥦 Vegetables", items:[{i:"Broccoli",q:"2 heads",n:""},{i:"Spinach",q:"400g",n:""},{i:"Mixed peppers",q:"6",n:""},{i:"Courgettes",q:"3",n:""},{i:"Asparagus",q:"1 bunch",n:""},{i:"Frozen mixed veg",q:"1kg",n:""}]},
    { name:"🍚 Carbs (GF)", items:[{i:"Brown rice",q:"1kg",n:""},{i:"Quinoa",q:"500g",n:""},{i:"Sweet potatoes",q:"5",n:""},{i:"Rice crackers",q:"2 packs",n:""},{i:"Corn tortillas",q:"2 packs",n:""}]},
    { name:"🫙 Cupboard", items:[{i:"Chopped tomatoes",q:"3 tins",n:""},{i:"Kidney beans",q:"2 tins",n:""},{i:"Chickpeas",q:"2 tins",n:""},{i:"Tamari",q:"1 bottle",n:""},{i:"Olive oil",q:"500ml",n:""},{i:"Almond butter",q:"1 jar",n:""}]},
    { name:"🥜 Snacks", items:[{i:"Mixed nuts",q:"200g",n:"30g portions"},{i:"Hummus",q:"200g",n:""},{i:"Bananas",q:"5",n:""}]},
    { name:"💊 Supplements", items:[{i:"Creatine monohydrate",q:"check",n:"5g/day"},{i:"Vitamin D3+K2",q:"check",n:""},{i:"Algae omega-3",q:"check",n:""},{i:"Magnesium glycinate",q:"check",n:"before bed"}]},
  ], tip:"Batch cook rice and quinoa on day 1 — keeps 4 days in the fridge. Removes the temptation to order takeaway when tired." },
  7:{ cost:"~£75–95", cats:[
    { name:"🥩 Meat & Protein", items:[{i:"Chicken breast",q:"1.5kg",n:""},{i:"Lean beef mince 5%",q:"750g",n:""},{i:"Turkey mince",q:"500g",n:""},{i:"Lamb mince",q:"400g",n:"for koftas"},{i:"Free range eggs",q:"24",n:""},{i:"Plant protein powder",q:"1kg bag",n:""}]},
    { name:"🥛 Dairy-Free", items:[{i:"Soya milk (unsweetened)",q:"3 litres",n:""},{i:"Coconut yoghurt",q:"1kg",n:""},{i:"Dairy-free feta",q:"200g",n:""},{i:"Coconut cream",q:"2 tins",n:""}]},
    { name:"🥦 Vegetables", items:[{i:"Broccoli",q:"3 heads",n:""},{i:"Spinach",q:"600g",n:""},{i:"Mixed peppers",q:"8",n:""},{i:"Courgettes",q:"4",n:""},{i:"Cauliflower",q:"2 heads",n:""},{i:"Asparagus",q:"2 bunches",n:""},{i:"Avocados",q:"4",n:""},{i:"Frozen mixed veg",q:"2kg",n:""}]},
    { name:"🍚 Carbs (GF)", items:[{i:"Brown rice",q:"2kg",n:""},{i:"Quinoa",q:"1kg",n:""},{i:"Sweet potatoes",q:"7",n:""},{i:"Rice cakes",q:"3 packs",n:""},{i:"Corn tortillas",q:"2 packs",n:""},{i:"GF pasta (rice-based)",q:"500g",n:""}]},
    { name:"🫙 Cupboard", items:[{i:"Chopped tomatoes",q:"5 tins",n:""},{i:"Kidney beans",q:"3 tins",n:""},{i:"Chickpeas",q:"3 tins",n:""},{i:"Tamari",q:"2 bottles",n:""},{i:"Extra virgin olive oil",q:"500ml",n:""},{i:"Cumin, paprika, oregano",q:"check",n:""}]},
    { name:"🥜 Snacks", items:[{i:"Mixed nuts",q:"400g",n:""},{i:"Hummus",q:"400g",n:""},{i:"Bananas",q:"7",n:""},{i:"Blueberries",q:"400g",n:""},{i:"Almond butter",q:"1 jar",n:""}]},
    { name:"💊 Supplements", items:[{i:"Creatine monohydrate",q:"250g tub",n:"5g/day = 50 days"},{i:"Vitamin D3+K2",q:"90 caps",n:""},{i:"Algae omega-3",q:"60 caps",n:""},{i:"Magnesium glycinate",q:"check",n:"300–400mg bed"}]},
  ], tip:"Batch cook a big chilli or mince dish on Sunday — portions into 4+ meals and freezes perfectly." },
};

const SUPPS = [
  { name:"Creatine Monohydrate", dose:"5g daily", timing:"Any time — consistency is key", color:"#007aff", icon:"⚡", why:"Preserves and builds muscle during weight loss — critical at 53. Completely tasteless.", note:"No loading phase — just 5g/day. Expect 1–2 lbs water weight in muscles initially. Stir into coconut yoghurt." },
  { name:"Pea / Soya Protein", dose:"25–40g per serving", timing:"Post-workout or between meals", color:"#34c759", icon:"💪", why:"Plant protein (pea or soya) is dairy-free, GF, and performs near-identically to whey for muscle retention.", note:"Look for 20–25g protein per scoop, under 5g sugar. Unflavoured pea protein is invisible in smoothies." },
  { name:"Vitamin D3 + K2", dose:"2000–4000 IU D3, 100mcg K2", timing:"With a fatty meal", color:"#ff9500", icon:"☀️", why:"Most people over 50 in the UK are deficient year-round. D3 supports muscle function, mood, and bone density.", note:"K2 directs calcium to bones. Buy as a combined D3+K2 capsule. Ask GP to test your levels." },
  { name:"Algae Omega-3", dose:"2–3g EPA+DHA daily", timing:"With meals to avoid repeat", color:"#af52de", icon:"🧠", why:"Reduces inflammation — great for back and knees. Algae-based means zero fishy taste. Same source as fish oil.", note:"Completely vegan and GF. Zero fishy smell or taste whatsoever." },
  { name:"Magnesium Glycinate", dose:"300–400mg", timing:"30–60 min before bed", color:"#5ac8fa", icon:"🌙", why:"Supports sleep quality, muscle recovery, and regulates cortisol. High cortisol directly stalls fat loss.", note:"Glycinate form is best absorbed. Most people notice deeper sleep within a week." },
  { name:"Caffeine (optional)", dose:"100–200mg", timing:"30 min before cardio", color:"#ff9f0a", icon:"☕", why:"Boosts fat burning during cardio and reduces perceived effort on the rower and cross trainer.", note:"A strong black coffee with soya milk works perfectly. Avoid after 2pm. Skip on rest days." },
];

const DAILY_TIPS = [
  "Start with a large glass of water before breakfast — hydration alone can reduce hunger by up to 20%. Mild dehydration makes workouts feel harder than they are.",
  "Focus on protein at every meal. At 53, your body needs more protein to hold onto muscle while losing fat — aim for a palm-sized portion each time.",
  "Before your next workout, spend 5 minutes on gentle hip and thoracic mobility. It warms up your back safely and makes every exercise more comfortable.",
  "Don't skip rest days — they're when fat loss actually happens. Your body repairs and rebalances hormones during recovery.",
  "If you feel like snacking, try a 10-minute walk first. Cravings typically peak and pass within 15 minutes.",
  "Sleep is your secret weapon. Poor sleep raises ghrelin (hunger hormone) and lowers willpower. Protect 7–8 hours tonight.",
  "Creatine works best taken consistently every day, even rest days. Stir it into coconut yoghurt — completely tasteless.",
  "Try eating your largest meal at lunch. Insulin sensitivity is higher earlier in the day, so calories are used more efficiently.",
  "On the rowing machine: 60% legs, 20% core, 20% arms. Lead with the legs — protects your back and generates more power.",
  "Track your waist measurement as well as weight. Creatine can add 1–2 lbs of water weight, so the scale can mislead.",
  "Add leafy greens to two meals today — almost calorie-free, high in magnesium, and they bulk out meals so you feel full.",
  "On the cross trainer, stand upright and don't lean on the handles. Engages your core and burns more calories.",
];

// ── Primitives ────────────────────────────────────────────────────────────────
const S = { fontFamily: FONT };

const Card = ({ children, style={}, onClick }) => (
  <div onClick={onClick} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:16, marginBottom:12, cursor:onClick?"pointer":"default", boxShadow:"0 1px 3px rgba(0,0,0,0.06)", transition:"transform 0.15s", ...style }}
    onMouseEnter={e=>onClick&&(e.currentTarget.style.transform="scale(0.99)")}
    onMouseLeave={e=>onClick&&(e.currentTarget.style.transform="scale(1)")}
  >{children}</div>
);

const Section = ({ title, children, color=C.accent }) => (
  <div style={{ marginBottom:24 }}>
    {title && <p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:8, paddingLeft:4 }}>{title}</p>}
    <div style={{ background:C.card, borderRadius:16, overflow:"hidden", border:`1px solid ${C.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>{children}</div>
  </div>
);

const Row = ({ label, value, color=C.text, last=false, onClick, icon }) => (
  <div onClick={onClick} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"13px 16px", borderBottom:last?"none":`1px solid ${C.border}`, cursor:onClick?"pointer":"default" }}>
    <span style={{ color:C.text, fontSize:15 }}>{icon && <span style={{marginRight:8}}>{icon}</span>}{label}</span>
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      {value && <span style={{ color:color||C.muted, fontSize:15 }}>{value}</span>}
      {onClick && <span style={{ color:C.muted, fontSize:14 }}>›</span>}
    </div>
  </div>
);

const Btn = ({ children, onClick, color=C.accent, style={}, disabled, small, outline }) => (
  <button onClick={onClick} disabled={disabled} style={{ background:outline?"transparent":`${color}`, color:outline?color:"#fff", border:outline?`1.5px solid ${color}`:"none", borderRadius:12, padding:small?"8px 16px":"12px 22px", fontFamily:FONT, fontWeight:600, fontSize:small?13:15, cursor:disabled?"not-allowed":"pointer", opacity:disabled?0.4:1, transition:"all 0.15s", boxShadow:outline?"none":`0 2px 8px ${color}44`, ...style }}>{children}</button>
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
    <div style={{ color, fontSize:20, fontWeight:700 }}>{val}</div>
    {sub && <div style={{ color:C.muted, fontSize:11, marginTop:1 }}>{sub}</div>}
    <div style={{ color:C.muted, fontSize:10, marginTop:3, textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</div>
  </div>
);


// ── Pace Picker ───────────────────────────────────────────────────────────────
const PacePicker = ({ value, onChange, targetLbs }) => {
  const selected = getPace(value);
  const etaWeeks = Math.ceil(targetLbs / selected.lbs);
  const etaMonths = (etaWeeks / 4.3).toFixed(1);
  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
        {PACE_OPTIONS.map(p => (
          <div key={p.id} onClick={() => onChange(p.id)} style={{
            flex:"1 1 calc(50% - 4px)", background: value===p.id ? `${p.color}18` : C.card,
            border:`2px solid ${value===p.id ? p.color : C.border}`, borderRadius:12,
            padding:"10px 12px", cursor:"pointer", transition:"all 0.2s",
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:2 }}>
              <span style={{ color: value===p.id ? p.color : C.text, fontWeight:700, fontSize:14 }}>{p.label}</span>
              <span style={{ color: p.color, fontSize:12, fontWeight:700 }}>{p.lbs} lb/wk</span>
            </div>
            <div style={{ color:C.muted, fontSize:11 }}>{p.weeks_per_stone} weeks / stone</div>
          </div>
        ))}
      </div>
      {/* ETA summary */}
      <div style={{ background:`${selected.color}10`, border:`1px solid ${selected.color}33`, borderRadius:12, padding:"12px 14px", marginBottom: selected.warning ? 10 : 0 }}>
        <p style={{ color:C.text, fontSize:14, margin:0 }}>
          📅 At this pace: <strong style={{ color:selected.color }}>{etaWeeks} weeks</strong> (~{etaMonths} months) to lose {targetLbs/14 % 1 === 0 ? targetLbs/14 : (targetLbs/14).toFixed(1)} stone
        </p>
        <p style={{ color:C.muted, fontSize:12, margin:"4px 0 0" }}>{selected.desc}</p>
      </div>
      {/* Warning */}
      {selected.warning && (
        <div style={{ background:"#ff3b3010", border:"1px solid #ff3b3033", borderRadius:12, padding:"10px 14px" }}>
          <p style={{ color:C.red, fontSize:13, margin:0, lineHeight:1.6 }}>{selected.warning}</p>
        </div>
      )}
    </div>
  );
};

// ── Onboarding ────────────────────────────────────────────────────────────────
const STEPS = ["Welcome","Goal","Weight","Allergies","Dislikes","Done"];

const Onboarding = ({ onDone }) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ name:"", goal:"lose_weight", targetLbs:14, startWeight:"", unit:"lbs", allergies:[], dislikes:[], workoutsPerWeek:3, paceId:"normal" });

  const update = (k, v) => setData(d => ({...d, [k]:v}));
  const toggleArr = (k, v) => setData(d => ({...d, [k]: d[k].includes(v) ? d[k].filter(x=>x!==v) : [...d[k], v]}));

  const targetWeightLbs = () => {
    let sw = parseFloat(data.startWeight);
    if (!sw) return null;
    if (data.unit==="kg") sw*=2.20462;
    if (data.unit==="stone") sw*=14;
    return (sw - data.targetLbs).toFixed(1);
  };

  const finish = () => {
    let sw = parseFloat(data.startWeight);
    if (data.unit==="kg") sw*=2.20462;
    if (data.unit==="stone") sw*=14;
    onDone({...data, startWeightLbs: parseFloat(sw.toFixed(1))});
  };

  const pct = Math.round((step/(STEPS.length-1))*100);

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:FONT, padding:"0 0 40px" }}>
      {/* Progress bar */}
      <div style={{ height:4, background:C.border }}>
        <div style={{ height:"100%", width:`${pct}%`, background:C.accent, transition:"width 0.4s", borderRadius:"0 2px 2px 0" }} />
      </div>

      <div style={{ maxWidth:420, margin:"0 auto", padding:"32px 20px 0" }}>

        {step===0 && (
          <div style={{ textAlign:"center", paddingTop:40 }}>
            <div style={{ fontSize:64, marginBottom:16 }}>🏃</div>
            <h1 style={{ fontSize:32, fontWeight:700, color:C.text, margin:"0 0 12px" }}>Welcome to LeanPlan</h1>
            <p style={{ color:C.muted, fontSize:16, lineHeight:1.6, marginBottom:32 }}>Let's set up your personal health plan. It takes about 2 minutes and we'll tailor everything to you.</p>
            <div style={{ marginBottom:20 }}>
              <TInput value={data.name} onChange={e=>update("name",e.target.value)} placeholder="Your name (optional)" />
            </div>
            <Btn onClick={()=>setStep(1)} style={{ width:"100%" }}>Get Started →</Btn>
          </div>
        )}

        {step===1 && (
          <div>
            <h2 style={{ fontSize:26, fontWeight:700, color:C.text, marginBottom:8 }}>What's your main goal?</h2>
            <p style={{ color:C.muted, fontSize:15, marginBottom:24 }}>This helps us tailor your meal plans and workouts.</p>
            {[["lose_weight","🎯","Lose weight","Reduce body fat through diet and exercise"],["build_muscle","💪","Build muscle","Gain strength and muscle while staying lean"],["get_fitter","🏃","Get fitter","Improve cardio and general fitness"],["all","⭐","All of the above","Lose fat, build muscle, and get fitter"]].map(([val,ico,title,desc])=>(
              <Card key={val} onClick={()=>update("goal",val)} style={{ borderColor:data.goal===val?C.accent:C.border, borderWidth:data.goal===val?2:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <span style={{ fontSize:28 }}>{ico}</span>
                  <div>
                    <p style={{ color:C.text, fontWeight:600, fontSize:16, margin:0 }}>{title}</p>
                    <p style={{ color:C.muted, fontSize:13, margin:"2px 0 0" }}>{desc}</p>
                  </div>
                  {data.goal===val && <span style={{ marginLeft:"auto", color:C.accent, fontSize:20 }}>✓</span>}
                </div>
              </Card>
            ))}
            <Btn onClick={()=>setStep(2)} style={{ width:"100%", marginTop:8 }}>Next →</Btn>
          </div>
        )}

        {step===2 && (
          <div>
            <h2 style={{ fontSize:26, fontWeight:700, color:C.text, marginBottom:8 }}>Your weight</h2>
            <p style={{ color:C.muted, fontSize:15, marginBottom:24 }}>We'll track your progress toward your goal.</p>
            <div style={{ marginBottom:16 }}>
              <p style={{ color:C.muted, fontSize:13, marginBottom:8 }}>Starting weight</p>
              <div style={{ display:"flex", gap:8 }}>
                <TInput value={data.startWeight} onChange={e=>update("startWeight",e.target.value)} placeholder="Enter weight" type="number" style={{ flex:1 }} />
                <select value={data.unit} onChange={e=>update("unit",e.target.value)} style={{ background:C.sectionBg, border:`1px solid ${C.border}`, borderRadius:10, color:C.text, padding:"12px 10px", fontFamily:FONT, fontSize:15, cursor:"pointer", outline:"none" }}>
                  <option value="lbs">lbs</option><option value="kg">kg</option><option value="stone">stone</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom:24 }}>
              <p style={{ color:C.muted, fontSize:13, marginBottom:8 }}>Weight loss target</p>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {[7,14,21,28].map(lbs=>(
                  <Chip key={lbs} color={C.accent} active={data.targetLbs===lbs} onClick={()=>update("targetLbs",lbs)}>{lbs/14} stone ({lbs} lbs)</Chip>
                ))}
              </div>
              {targetWeightLbs() && (
                <div style={{ background:`${C.accent}10`, border:`1px solid ${C.accent}22`, borderRadius:12, padding:"12px 14px", marginTop:12 }}>
                  <p style={{ color:C.text, fontSize:14, margin:0 }}>🎯 Goal weight: <strong style={{ color:C.accent }}>{targetWeightLbs()} lbs</strong> · Est. <strong style={{ color:C.green }}>{data.targetLbs} weeks</strong> at 1 lb/week</p>
                </div>
              )}
            </div>
            <div style={{ marginBottom:24 }}>
              <p style={{ color:C.muted, fontSize:13, marginBottom:8 }}>Workouts per week</p>
              <div style={{ display:"flex", gap:8 }}>
                {[2,3,4,5].map(n=>(
                  <Chip key={n} color={C.purple} active={data.workoutsPerWeek===n} onClick={()=>update("workoutsPerWeek",n)}>{n}x</Chip>
                ))}
              </div>
            </div>
            <div style={{ marginBottom:24 }}>
              <p style={{ color:C.muted, fontSize:13, marginBottom:8 }}>How fast do you want to lose weight?</p>
              <PacePicker value={data.paceId} onChange={v=>update("paceId",v)} targetLbs={data.targetLbs} />
            </div>
            <Btn onClick={()=>setStep(3)} disabled={!data.startWeight} style={{ width:"100%" }}>Next →</Btn>
          </div>
        )}

        {step===3 && (
          <div>
            <h2 style={{ fontSize:26, fontWeight:700, color:C.text, marginBottom:8 }}>Allergies & intolerances</h2>
            <p style={{ color:C.muted, fontSize:15, marginBottom:24 }}>Select any that apply. We'll make sure none of these appear in your meal plans.</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:24 }}>
              {ALLERGENS.map(a=>(
                <Chip key={a} color={C.red} active={data.allergies.includes(a)} onClick={()=>toggleArr("allergies",a)}>{a}</Chip>
              ))}
            </div>
            <p style={{ color:C.muted, fontSize:13, marginBottom:16 }}>We've also noted: no fish, no oats, no cow's milk by default.</p>
            <Btn onClick={()=>setStep(4)} style={{ width:"100%" }}>Next →</Btn>
          </div>
        )}

        {step===4 && (
          <div>
            <h2 style={{ fontSize:26, fontWeight:700, color:C.text, marginBottom:8 }}>Foods you dislike</h2>
            <p style={{ color:C.muted, fontSize:15, marginBottom:24 }}>These won't appear in your meal suggestions.</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:24 }}>
              {DISLIKES_LIST.map(d=>(
                <Chip key={d} color={C.orange} active={data.dislikes.includes(d)} onClick={()=>toggleArr("dislikes",d)}>{d}</Chip>
              ))}
            </div>
            <Btn onClick={()=>setStep(5)} style={{ width:"100%" }}>Next →</Btn>
          </div>
        )}

        {step===5 && (
          <div style={{ textAlign:"center", paddingTop:40 }}>
            <div style={{ fontSize:64, marginBottom:16 }}>✅</div>
            <h2 style={{ fontSize:28, fontWeight:700, color:C.text, marginBottom:12 }}>You're all set{data.name ? `, ${data.name}` : ""}!</h2>
            <p style={{ color:C.muted, fontSize:15, lineHeight:1.6, marginBottom:32 }}>Your plan is personalised and ready. All meals are gluten-free, dairy-free, and avoid everything you've flagged.</p>
            <div style={{ background:C.card, borderRadius:16, padding:16, marginBottom:24, textAlign:"left", border:`1px solid ${C.border}` }}>
              {[["🎯","Goal",data.goal.replace("_"," ")],["⚖️","Target",`Lose ${data.targetLbs} lbs`],["📅","Pace",`${getPace(data.paceId).lbs} lbs/week (${getPace(data.paceId).label})`],["🏋️","Workouts",`${data.workoutsPerWeek}x per week`],["🚫","Allergies",data.allergies.length>0?data.allergies.join(", "):"None selected"],["😐","Dislikes",data.dislikes.length>0?data.dislikes.slice(0,3).join(", ")+(data.dislikes.length>3?` +${data.dislikes.length-3} more`:""):"None selected"]].map(([ico,k,v])=>(
                <div key={k} style={{ display:"flex", gap:12, padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
                  <span>{ico}</span>
                  <span style={{ color:C.muted, fontSize:14, minWidth:80 }}>{k}</span>
                  <span style={{ color:C.text, fontSize:14, textTransform:"capitalize" }}>{v}</span>
                </div>
              ))}
            </div>
            <Btn onClick={finish} style={{ width:"100%" }}>Start My Journey 🚀</Btn>
          </div>
        )}

        {step>0 && step<5 && (
          <button onClick={()=>setStep(s=>s-1)} style={{ background:"none", border:"none", color:C.muted, fontSize:15, cursor:"pointer", marginTop:16, fontFamily:FONT }}>← Back</button>
        )}
      </div>
    </div>
  );
};

// ── Meal filter helper ────────────────────────────────────────────────────────
const filterMeals = (profile, removed=[]) => {
  return ALL_MEALS.filter(m => {
    if (removed.includes(m.id)) return false;
    // Check allergens
    for (const a of (profile.allergies||[])) {
      if (m.allergens.includes(a.toLowerCase())) return false;
    }
    // Check dislikes against meal name and items
    for (const d of (profile.dislikes||[])) {
      const dl = d.toLowerCase();
      if (m.name.toLowerCase().includes(dl)) return false;
      if (m.items.some(i=>i.toLowerCase().includes(dl))) return false;
    }
    return true;
  });
};

// ── Chart ─────────────────────────────────────────────────────────────────────
const Chart = ({ entries, startWeight, targetWeight }) => {
  const pts = [{label:"Start",weight:startWeight},...entries];
  if (pts.length<2) return null;
  const ws = pts.map(p=>p.weight).concat(targetWeight);
  const minW=Math.min(...ws)-2, maxW=Math.max(...ws)+2, range=maxW-minW;
  const W=340,H=150,P={t:14,r:14,b:32,l:44};
  const cW=W-P.l-P.r, cH=H-P.t-P.b;
  const tx=i=>P.l+(i/(pts.length-1))*cW;
  const ty=w=>P.t+cH-((w-minW)/range)*cH;
  const line=pts.map((p,i)=>`${i===0?"M":"L"}${tx(i).toFixed(1)},${ty(p.weight).toFixed(1)}`).join(" ");
  const area=line+` L${tx(pts.length-1).toFixed(1)},${H-P.b} L${P.l},${H-P.b} Z`;
  const ticks=[Math.ceil(minW+1),Math.round((minW+maxW)/2),Math.floor(maxW-1)];
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:"block"}}>
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.accent} stopOpacity="0.2"/><stop offset="100%" stopColor={C.accent} stopOpacity="0.02"/></linearGradient>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={C.accent}/><stop offset="100%" stopColor={C.green}/></linearGradient>
      </defs>
      {ticks.map(w=><line key={w} x1={P.l} y1={ty(w)} x2={W-P.r} y2={ty(w)} stroke={C.border} strokeWidth="1"/>)}
      <line x1={P.l} y1={ty(targetWeight)} x2={W-P.r} y2={ty(targetWeight)} stroke={C.green} strokeWidth="1.5" strokeDasharray="5,4" opacity="0.8"/>
      <text x={W-P.r-2} y={ty(targetWeight)-5} fill={C.green} fontSize="9" textAnchor="end" fontWeight="600">target</text>
      <path d={area} fill="url(#cg)"/>
      <path d={line} fill="none" stroke="url(#lg)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p,i)=><circle key={i} cx={tx(i)} cy={ty(p.weight)} r={i===pts.length-1?5.5:3.5} fill={i===pts.length-1?C.accent:"#fff"} stroke={i===pts.length-1?C.accent:C.accentD} strokeWidth="2"/>)}
      {ticks.map(w=><text key={w} x={P.l-5} y={ty(w)+4} fill={C.muted} fontSize="9" textAnchor="end">{Math.round(w)}</text>)}
      {pts.map((p,i)=><text key={i} x={tx(i)} y={H-P.b+14} fill={C.muted} fontSize="8.5" textAnchor="middle">{p.label}</text>)}
    </svg>
  );
};

// ── TODAY TAB ─────────────────────────────────────────────────────────────────
const TodayTab = ({ profile, entries, mealLog, setMealLog, workoutLog }) => {
  const [tipIdx, setTipIdx] = useState(()=>Math.floor(Math.random()*DAILY_TIPS.length));
  const cur = entries.length>0?entries[entries.length-1].weight:profile.startWeightLbs;
  const lost = Math.max(0, profile.startWeightLbs-cur);
  const pct = Math.min(100, Math.round((lost/profile.targetLbs)*100));
  const today = todayKey();
  const todayMeals = mealLog[today]||[];
  const todayWorked = workoutLog[today];
  const weeksIn = entries.length;
  const pace = getPace(profile.paceId||'normal'); const eta = lost<profile.targetLbs ? Math.ceil((profile.targetLbs-lost)/pace.lbs) : null;

  return (
    <div>
      {/* Hero card */}
      <div style={{ background:`linear-gradient(145deg, ${C.accent}, #5ac8fa)`, borderRadius:20, padding:"20px 18px", marginBottom:16, color:"#fff" }}>
        <p style={{ opacity:0.85, fontSize:14, margin:"0 0 4px" }}>Hello{profile.name?`, ${profile.name}`:""}  👋</p>
        <h2 style={{ fontSize:26, fontWeight:700, margin:"0 0 4px" }}>Lose {profile.targetLbs/14} Stone</h2>
        <p style={{ opacity:0.8, fontSize:13, margin:"0 0 14px" }}>{lost.toFixed(1)} lbs lost · {Math.max(0,profile.targetLbs-lost).toFixed(1)} to go · {pct}%{eta?` · ~${eta} wks`:""} · {pace.lbs} lb/wk</p>
        <div style={{ background:"rgba(255,255,255,0.25)", borderRadius:99, height:8, overflow:"hidden" }}>
          <div style={{ width:`${pct}%`, height:"100%", background:"rgba(255,255,255,0.9)", borderRadius:99, transition:"width 0.6s" }} />
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, opacity:0.75, fontSize:11 }}>
          <span>Start: {profile.startWeightLbs} lbs</span>
          <span>Now: {cur.toFixed(1)} lbs</span>
        </div>
      </div>

      {/* Today status */}
      <div style={{ display:"flex", gap:10, marginBottom:16 }}>
        <div style={{ flex:1, background:C.card, borderRadius:14, padding:14, border:`1px solid ${C.border}`, textAlign:"center", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize:22, marginBottom:4 }}>{todayWorked?"✅":"🏋️"}</div>
          <div style={{ color:C.text, fontSize:13, fontWeight:600 }}>{todayWorked?todayWorked.type:"No workout"}</div>
          <div style={{ color:C.muted, fontSize:11 }}>{todayWorked?"logged today":"logged today"}</div>
        </div>
        <div style={{ flex:1, background:C.card, borderRadius:14, padding:14, border:`1px solid ${C.border}`, textAlign:"center", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize:22, marginBottom:4 }}>🍽️</div>
          <div style={{ color:C.text, fontSize:13, fontWeight:600 }}>{todayMeals.length} meals</div>
          <div style={{ color:C.muted, fontSize:11 }}>logged today</div>
        </div>
        <div style={{ flex:1, background:C.card, borderRadius:14, padding:14, border:`1px solid ${C.border}`, textAlign:"center", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize:22, marginBottom:4 }}>⚖️</div>
          <div style={{ color:C.text, fontSize:13, fontWeight:600 }}>{cur.toFixed(1)}</div>
          <div style={{ color:C.muted, fontSize:11 }}>lbs current</div>
        </div>
      </div>

      {/* Daily tip */}
      <Card style={{ borderLeft:`3px solid ${C.accent}` }}>
        <p style={{ color:C.accent, fontSize:11, fontWeight:700, letterSpacing:"0.08em", marginBottom:8 }}>💡 TODAY'S TIP</p>
        <p style={{ color:C.text, fontSize:14, lineHeight:1.75, margin:0 }}>{DAILY_TIPS[tipIdx]}</p>
        <button onClick={()=>setTipIdx(i=>(i+1)%DAILY_TIPS.length)} style={{ background:"none", border:"none", color:C.accent, fontSize:13, cursor:"pointer", marginTop:10, fontFamily:FONT, fontWeight:600 }}>↻ Next tip</button>
      </Card>

      {/* Plan summary */}
      <Section title="Your Plan">
        <Row icon="🎯" label="Goal" value={profile.goal.replace("_"," ")} />
        <Row icon="🏋️" label="Equipment" value="Rowing · Cross trainer · Weights" />
        <Row icon="🥗" label="Diet" value="GF · Dairy-free · No oats" />
        <Row icon="⚡" label="Supplements" value="Creatine · D3+K2 · Omega-3" last />
      </Section>
    </div>
  );
};

// ── MEALS TAB ─────────────────────────────────────────────────────────────────
const MealsTab = ({ profile, favourites, setFavourites, removed, setRemoved, mealLog, setMealLog }) => {
  const [style, setStyle] = useState("all");
  const [shown, setShown] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [viewFavs, setViewFavs] = useState(false);
  const [shoppingDays, setShoppingDays] = useState(7);
  const [shoppingList, setShoppingList] = useState(null);
  const [checked, setChecked] = useState({});
  const [activeSection, setActiveSection] = useState("meals"); // meals | shopping | supps
  const today = todayKey();

  const available = filterMeals(profile, removed);
  const filtered = style==="all"?available:available.filter(m=>m.tags.includes(style));
  const favMeals = ALL_MEALS.filter(m=>favourites.includes(m.id));

  const generate = () => {
    const pool = filtered.length>0?filtered:available;
    const favPool = pool.filter(m=>favourites.includes(m.id));
    const usePool = favPool.length>=3?favPool:pool;
    setShown([...usePool].sort(()=>Math.random()-0.5).slice(0,4));
    setExpanded(null);
  };

  const toggleFav = id => setFavourites(f=>f.includes(id)?f.filter(x=>x!==id):[...f,id]);
  const removeM = id => { setRemoved(r=>[...r,id]); setShown(s=>s?s.filter(m=>m.id!==id):s); };
  const logMeal = m => setMealLog(ml=>({ ...ml, [today]: [...(ml[today]||[]), {id:m.id, name:m.name, cals:m.cals, protein:m.protein, time:new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}] }));

  const totalCals = shown?shown.reduce((a,m)=>a+m.cals,0):0;
  const totalProt = shown?shown.reduce((a,m)=>a+m.protein,0):0;
  const todayLogged = mealLog[today]||[];

  return (
    <div>
      {/* Section switcher */}
      <div style={{ display:"flex", gap:6, marginBottom:16, overflowX:"auto", paddingBottom:2 }}>
        {[["meals","🍽️ Meals"],["shopping","🛒 Shopping"],["supps","💊 Supplements"]].map(([k,l])=>(
          <Chip key={k} color={C.accent} active={activeSection===k} onClick={()=>setActiveSection(k)}>{l}</Chip>
        ))}
      </div>

      {activeSection==="meals" && (
        <>
          {todayLogged.length>0 && (
            <Card style={{ background:`${C.green}10`, borderColor:`${C.green}33` }}>
              <p style={{ color:C.green, fontSize:12, fontWeight:700, letterSpacing:"0.06em", marginBottom:8 }}>✅ TODAY'S LOG — {todayLogged.reduce((a,m)=>a+m.cals,0)} cal · {todayLogged.reduce((a,m)=>a+m.protein,0)}g protein</p>
              {todayLogged.map((m,i)=>(
                <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:i<todayLogged.length-1?`1px solid ${C.border}`:"none" }}>
                  <span style={{ color:C.text, fontSize:13 }}>{m.name}</span>
                  <span style={{ color:C.muted, fontSize:12 }}>{m.cals} cal · {m.time}</span>
                </div>
              ))}
            </Card>
          )}

          {favMeals.length>0 && (
            <div onClick={()=>setViewFavs(v=>!v)} style={{ background:`${C.yellow}15`, border:`1px solid ${C.yellow}33`, borderRadius:12, padding:"10px 14px", marginBottom:12, cursor:"pointer", display:"flex", justifyContent:"space-between" }}>
              <span style={{ color:C.orange, fontWeight:600, fontSize:14 }}>⭐ {favMeals.length} favourite{favMeals.length!==1?"s":""}</span>
              <span style={{ color:C.muted, fontSize:13 }}>{viewFavs?"▲":"▼"}</span>
            </div>
          )}
          {viewFavs && favMeals.map(m=>(
            <Card key={m.id} style={{ borderColor:`${C.yellow}44` }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <p style={{ color:C.text, fontWeight:600, margin:0 }}>{m.name}</p>
                <button onClick={()=>toggleFav(m.id)} style={{ background:"none", border:"none", color:C.orange, cursor:"pointer", fontSize:13, fontFamily:FONT }}>★ Unfav</button>
              </div>
            </Card>
          ))}

          <Card>
            <p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", marginBottom:10 }}>MEAL STYLE</p>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
              {["all","balanced","high-protein","mediterranean","budget-friendly"].map(s=>(
                <Chip key={s} color={C.accent} active={style===s} onClick={()=>setStyle(s)}>{s}</Chip>
              ))}
            </div>
            <Btn onClick={generate} style={{ width:"100%" }}>✦ Generate Today's Meals</Btn>
          </Card>

          {shown && (
            <>
              <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                <StatBox label="Calories" val={totalCals} color={C.accent} />
                <StatBox label="Protein" val={`${totalProt}g`} color={C.green} />
              </div>
              {shown.map(m=>{
                const isFav = favourites.includes(m.id);
                const isLogged = (mealLog[today]||[]).some(l=>l.id===m.id);
                const isExpanded = expanded===m.id;
                return (
                  <Card key={m.id} style={{ borderColor:isFav?`${C.yellow}55`:C.border }}>
                    <div onClick={()=>setExpanded(isExpanded?null:m.id)} style={{ cursor:"pointer" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                        <div style={{ flex:1 }}>
                          <span style={{ color:C.muted, fontSize:11, fontWeight:600 }}>{m.tags.find(t=>["breakfast","lunch","dinner","snack"].includes(t))?.toUpperCase()}</span>
                          <p style={{ color:C.text, fontWeight:600, fontSize:16, margin:"2px 0 0" }}>{m.name}</p>
                        </div>
                        <div style={{ textAlign:"right", marginLeft:10 }}>
                          <div style={{ color:C.accent, fontSize:14, fontWeight:700 }}>{m.cals} cal</div>
                          <div style={{ color:C.green, fontSize:12 }}>{m.protein}g protein</div>
                        </div>
                      </div>
                      {m.items.map((item,j)=>(
                        <div key={j} style={{ padding:"3px 10px", background:C.sectionBg, borderRadius:8, fontSize:13, color:C.textSec, marginBottom:3 }}>· {item}</div>
                      ))}
                      <p style={{ color:C.accent, fontSize:12, fontWeight:600, marginTop:8, marginBottom:0 }}>{isExpanded?"▲ Hide instructions":"▼ How to make this"}</p>
                    </div>

                    {isExpanded && (
                      <div style={{ marginTop:12, padding:"12px 14px", background:C.sectionBg, borderRadius:10 }}>
                        <p style={{ color:C.muted, fontSize:11, fontWeight:700, letterSpacing:"0.06em", marginBottom:8 }}>📋 METHOD</p>
                        {m.method.split("\n").map((step,i)=>(
                          <p key={i} style={{ color:C.text, fontSize:13, lineHeight:1.7, margin:"0 0 6px" }}>{step}</p>
                        ))}
                      </div>
                    )}

                    <div style={{ display:"flex", gap:8, marginTop:12 }}>
                      <button onClick={()=>toggleFav(m.id)} style={{ flex:1, background:isFav?`${C.yellow}20`:"none", border:`1px solid ${isFav?C.yellow:C.border}`, borderRadius:10, padding:"7px 0", color:isFav?C.orange:C.muted, fontSize:13, cursor:"pointer", fontFamily:FONT, fontWeight:600 }}>{isFav?"⭐ Saved":"☆ Favourite"}</button>
                      <button onClick={()=>{if(!isLogged)logMeal(m);}} style={{ flex:1, background:isLogged?`${C.green}15`:"none", border:`1px solid ${isLogged?C.green:C.border}`, borderRadius:10, padding:"7px 0", color:isLogged?C.green:C.muted, fontSize:13, cursor:isLogged?"default":"pointer", fontFamily:FONT, fontWeight:600 }}>{isLogged?"✅ Logged":"+ Log meal"}</button>
                      <button onClick={()=>removeM(m.id)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:10, padding:"7px 12px", color:C.red, fontSize:13, cursor:"pointer", fontFamily:FONT }}>✕</button>
                    </div>
                  </Card>
                );
              })}
              {removed.length>0 && <div style={{ textAlign:"center", marginTop:4 }}><span onClick={()=>setRemoved([])} style={{ color:C.muted, fontSize:12, cursor:"pointer", textDecoration:"underline" }}>Restore {removed.length} removed meal{removed.length!==1?"s":""}</span></div>}
            </>
          )}
        </>
      )}

      {activeSection==="shopping" && (
        <>
          <Card>
            <p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", marginBottom:10 }}>SHOPPING LIST — GF &amp; DAIRY-FREE</p>
            <div style={{ display:"flex", gap:8, marginBottom:14, alignItems:"center" }}>
              <span style={{ color:C.muted, fontSize:14 }}>For</span>
              {[3,5,7].map(d=><Chip key={d} color={C.green} active={shoppingDays===d} onClick={()=>setShoppingDays(d)}>{d} days</Chip>)}
            </div>
            <Btn onClick={()=>{setShoppingList(SHOPPING[shoppingDays]);setChecked({});}} color={C.green} style={{ width:"100%" }}>✦ Generate List</Btn>
          </Card>
          {shoppingList && (
            <>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, padding:"0 4px" }}>
                <span style={{ color:C.text, fontWeight:600 }}>{shoppingDays}-day list</span>
                <Chip color={C.green}>{shoppingList.cost}</Chip>
              </div>
              {shoppingList.cats.map((cat,ci)=>(
                <Section key={ci} title={cat.name}>
                  {cat.items.map((item,ii)=>{
                    const k=`${ci}-${ii}`;
                    return (
                      <div key={ii} onClick={()=>setChecked(c=>({...c,[k]:!c[k]}))} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderBottom:ii<cat.items.length-1?`1px solid ${C.border}`:"none", cursor:"pointer", opacity:checked[k]?0.35:1 }}>
                        <div style={{ width:22, height:22, borderRadius:99, flexShrink:0, background:checked[k]?C.green:"transparent", border:`2px solid ${checked[k]?C.green:C.divider}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                          {checked[k]&&<span style={{ color:"#fff", fontSize:12, fontWeight:700 }}>✓</span>}
                        </div>
                        <div style={{ flex:1 }}>
                          <span style={{ color:C.text, fontSize:15, textDecoration:checked[k]?"line-through":"none" }}>{item.i}</span>
                          {item.n&&<span style={{ color:C.muted, fontSize:12, marginLeft:6 }}>({item.n})</span>}
                        </div>
                        <span style={{ color:C.muted, fontSize:13 }}>{item.q}</span>
                      </div>
                    );
                  })}
                </Section>
              ))}
              <Card style={{ background:`${C.green}08`, borderColor:`${C.green}22` }}>
                <p style={{ color:C.green, fontSize:12, fontWeight:700, marginBottom:6 }}>💡 SMART SHOPPING</p>
                <p style={{ color:C.text, fontSize:13, lineHeight:1.7, margin:0 }}>{shoppingList.tip}</p>
              </Card>
            </>
          )}
        </>
      )}

      {activeSection==="supps" && (
        <>
          <Card style={{ background:`${C.purple}08`, borderColor:`${C.purple}22` }}>
            <p style={{ color:C.purple, fontSize:12, fontWeight:700, marginBottom:6 }}>💊 SUPPLEMENT GUIDE</p>
            <p style={{ color:C.text, fontSize:13, lineHeight:1.7, margin:0 }}>Evidence-backed supplements — all dairy-free and GF. Tap for full details.</p>
          </Card>
          {SUPPS.map((s,i)=>{
            const [open, setOpen] = useState(false);
            return (
              <Card key={i} onClick={()=>setOpen(o=>!o)} style={{ borderLeft:`3px solid ${s.color}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:42, height:42, borderRadius:12, background:`${s.color}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{s.icon}</div>
                  <div style={{ flex:1 }}>
                    <p style={{ color:C.text, fontWeight:600, fontSize:15, margin:0 }}>{s.name}</p>
                    <p style={{ color:C.muted, fontSize:12, margin:"2px 0 0" }}>{s.dose}</p>
                  </div>
                  <span style={{ color:C.muted }}>{open?"▲":"▼"}</span>
                </div>
                {open && (
                  <div style={{ marginTop:14, paddingTop:14, borderTop:`1px solid ${C.border}` }}>
                    <Chip color={s.color}  >⏰ {s.timing}</Chip>
                    <p style={{ color:C.muted, fontSize:11, fontWeight:700, letterSpacing:"0.06em", margin:"12px 0 4px" }}>WHY IT HELPS</p>
                    <p style={{ color:C.text, fontSize:13, lineHeight:1.75, marginBottom:10 }}>{s.why}</p>
                    <div style={{ background:`${s.color}10`, borderRadius:10, padding:"10px 12px", borderLeft:`3px solid ${s.color}` }}>
                      <p style={{ color:s.color, fontSize:11, fontWeight:700, marginBottom:4 }}>💡 NOTES</p>
                      <p style={{ color:C.text, fontSize:12, lineHeight:1.65, margin:0 }}>{s.note}</p>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
};

// ── WORKOUT TAB ───────────────────────────────────────────────────────────────
const WorkoutTab = ({ workoutLog, setWorkoutLog }) => {
  const [selectedType, setSelectedType] = useState("full-body");
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [view, setView] = useState("calendar"); // calendar | workout
  const today = todayKey();

  // Build week days
  const days = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-d.getDay()+1+i); return d; });
  const dayKey = d => d.toISOString().split("T")[0];
  const DAY_NAMES = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  const logWorkout = (type) => {
    setWorkoutLog(wl=>({...wl, [today]:{type, date:today, time:new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}}));
    setActiveWorkout(WORKOUTS[type]);
    setView("workout");
  };

  // Count workouts this week
  const weekWorkouts = days.filter(d=>workoutLog[dayKey(d)]).length;

  // Last 4 weeks workout count
  const historyWeeks = Array.from({length:4},(_,i)=>{
    const start = new Date(); start.setDate(start.getDate()-start.getDay()+1-(i*7));
    const count = Array.from({length:7},(__,j)=>{ const d=new Date(start); d.setDate(d.getDate()+j); return workoutLog[dayKey(d)]?1:0; }).reduce((a,b)=>a+b,0);
    const label = i===0?"This week":i===1?"Last week":`${i+1}w ago`;
    return {label,count};
  }).reverse();

  return (
    <div>
      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {[["calendar","📅 Calendar"],["workout","💪 Workout"]].map(([k,l])=>(
          <Chip key={k} color={C.accent} active={view===k} onClick={()=>setView(k)}>{l}</Chip>
        ))}
      </div>

      {view==="calendar" && (
        <>
          {/* This week */}
          <Card>
            <p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", marginBottom:12 }}>THIS WEEK — {weekWorkouts} WORKOUT{weekWorkouts!==1?"S":""}</p>
            <div style={{ display:"flex", gap:6 }}>
              {days.map((d,i)=>{
                const k=dayKey(d); const logged=workoutLog[k]; const isToday=k===today;
                return (
                  <div key={i} style={{ flex:1, textAlign:"center" }}>
                    <div style={{ fontSize:10, color:isToday?C.accent:C.muted, fontWeight:isToday?700:400, marginBottom:4 }}>{DAY_NAMES[i]}</div>
                    <div style={{ width:"100%", aspectRatio:"1", borderRadius:10, background:logged?C.accent:isToday?`${C.accent}15`:C.sectionBg, border:`1.5px solid ${logged?C.accent:isToday?C.accent:C.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>
                      {logged?<span style={{ color:"#fff", fontSize:11 }}>✓</span>:<span style={{ color:C.muted, fontSize:10 }}>{d.getDate()}</span>}
                    </div>
                    {logged&&<div style={{ fontSize:9, color:C.accent, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{logged.type.split("-")[0]}</div>}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* History */}
          <Section title="Workout History">
            {historyWeeks.map((w,i)=>(
              <Row key={i} label={w.label} value={`${w.count} workout${w.count!==1?"s":""}`} color={w.count>0?C.accent:C.muted} last={i===historyWeeks.length-1} />
            ))}
          </Section>

          {/* Log today's workout */}
          <Card style={{ background:GRAD.card2 }}>
            <p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", marginBottom:12 }}>LOG TODAY'S WORKOUT</p>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
              {Object.entries(WORKOUTS).map(([key,val])=>(
                <Chip key={key} color={val.color} active={selectedType===key} onClick={()=>setSelectedType(key)}>{key}</Chip>
              ))}
            </div>
            <Btn onClick={()=>logWorkout(selectedType)} color={WORKOUTS[selectedType].color} style={{ width:"100%" }}>
              {workoutLog[today]?"↻ Update Today's Workout":"✦ Log & View Workout"}
            </Btn>
          </Card>
        </>
      )}

      {view==="workout" && (
        <>
          {!activeWorkout && (
            <Card>
              <p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", marginBottom:12 }}>CHOOSE WORKOUT</p>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
                {Object.entries(WORKOUTS).map(([key,val])=>(
                  <Chip key={key} color={val.color} active={selectedType===key} onClick={()=>setSelectedType(key)}>{key}</Chip>
                ))}
              </div>
              <Btn onClick={()=>setActiveWorkout(WORKOUTS[selectedType])} color={WORKOUTS[selectedType].color} style={{ width:"100%" }}>✦ View Workout</Btn>
            </Card>
          )}

          {activeWorkout && (
            <>
              <div style={{ background:`linear-gradient(135deg, ${activeWorkout.color}, ${activeWorkout.color}88)`, borderRadius:16, padding:"16px 18px", marginBottom:14, color:"#fff" }}>
                <h3 style={{ margin:0, fontSize:20, fontWeight:700 }}>{activeWorkout.title}</h3>
                <p style={{ opacity:0.85, fontSize:13, margin:"4px 0 0" }}>{activeWorkout.duration} min · Low impact · Joint safe</p>
              </div>
              <Section title="🔥 Warm Up">
                {activeWorkout.warmup.map((x,i)=><Row key={i} label={x} last={i===activeWorkout.warmup.length-1} />)}
              </Section>
              {activeWorkout.exercises.map((ex,i)=>(
                <Card key={i} style={{ borderLeft:`3px solid ${activeWorkout.color}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                    <div>
                      <p style={{ color:activeWorkout.color, fontWeight:700, fontSize:16, margin:0 }}>{i+1}. {ex.name}</p>
                      <span style={{ color:C.muted, fontSize:12 }}>{ex.equipment}</span>
                    </div>
                    <div style={{ background:`${activeWorkout.color}15`, borderRadius:10, padding:"8px 12px", textAlign:"right" }}>
                      <div style={{ color:C.text, fontSize:16, fontWeight:700 }}>{ex.sets} × {ex.reps}</div>
                      <div style={{ color:C.muted, fontSize:11 }}>Rest: {ex.rest}</div>
                    </div>
                  </div>
                  {ex.tip&&<div style={{ background:C.sectionBg, borderRadius:8, padding:"8px 12px", fontSize:12, color:C.textSec, borderLeft:`3px solid ${C.yellow}` }}>💬 {ex.tip}</div>}
                </Card>
              ))}
              <Section title="❄️ Cool Down">
                {activeWorkout.cooldown.map((x,i)=><Row key={i} label={x} last={i===activeWorkout.cooldown.length-1} />)}
              </Section>
              <Card style={{ background:`${activeWorkout.color}08`, borderColor:`${activeWorkout.color}33` }}>
                <p style={{ color:activeWorkout.color, fontSize:12, fontWeight:700, marginBottom:6 }}>🏅 COACH NOTES</p>
                <p style={{ color:C.text, fontSize:13, lineHeight:1.75, margin:0 }}>{activeWorkout.note}</p>
              </Card>
              <Btn onClick={()=>{setActiveWorkout(null);}} outline color={C.accent} style={{ width:"100%", marginBottom:8 }}>← Choose Different Workout</Btn>
              {!workoutLog[today] && <Btn onClick={()=>logWorkout(selectedType)} color={C.green} style={{ width:"100%" }}>✅ Log This Workout</Btn>}
            </>
          )}
        </>
      )}
    </div>
  );
};

// ── PROGRESS TAB ──────────────────────────────────────────────────────────────
const ProgressTab = ({ profile, entries, setEntries }) => {
  const [newW, setNewW] = useState("");
  const cur = entries.length>0?entries[entries.length-1].weight:profile.startWeightLbs;
  const lost = Math.max(0, profile.startWeightLbs-cur);
  const wks = entries.length;
  const avg = wks>0?(lost/wks).toFixed(1):null;
  const pace = getPace(profile.paceId||'normal'); const eta = lost<profile.targetLbs ? Math.ceil((profile.targetLbs-lost)/pace.lbs) : null;
  const target = profile.startWeightLbs-profile.targetLbs;
  const pct = Math.min(100,Math.round((lost/profile.targetLbs)*100));

  const addEntry = () => {
    if (!newW||isNaN(newW)) return;
    setEntries(prev=>[...prev,{weight:parseFloat(parseFloat(newW).toFixed(1)),label:`W${prev.length+1}`,date:new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short"})}]);
    setNewW("");
  };

  return (
    <div>
      {/* Progress ring-style summary */}
      <div style={{ background:`linear-gradient(145deg, ${C.accent}15, ${C.green}10)`, borderRadius:20, padding:"20px 18px", marginBottom:16, border:`1px solid ${C.accent}22` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div>
            <p style={{ color:C.muted, fontSize:13, margin:0 }}>Progress to goal</p>
            <h2 style={{ color:C.text, fontSize:28, fontWeight:700, margin:"2px 0 0" }}>{pct}%</h2>
          </div>
          <div style={{ textAlign:"right" }}>
            <p style={{ color:C.muted, fontSize:12, margin:0 }}>Lost so far</p>
            <p style={{ color:C.green, fontSize:22, fontWeight:700, margin:0 }}>{lost.toFixed(1)} lbs</p>
          </div>
        </div>
        <div style={{ background:`${C.border}`, borderRadius:99, height:10, overflow:"hidden" }}>
          <div style={{ width:`${pct}%`, height:"100%", background:`linear-gradient(90deg, ${C.accent}, ${C.green})`, borderRadius:99, transition:"width 0.6s" }} />
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, fontSize:11, color:C.muted }}>
          <span>{profile.startWeightLbs} lbs start</span>
          <span>{target.toFixed(1)} lbs goal</span>
        </div>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        <StatBox label="Per week" val={avg?`${avg} lbs`:"—"} color={C.accent} />
        <StatBox label="ETA" val={eta?`${eta} wks`:"—"} color={C.purple} />
        <StatBox label="To go" val={`${Math.max(0,profile.targetLbs-lost).toFixed(1)}`} sub="lbs" color={C.orange} />
      </div>

      {/* Weigh in */}
      <Card>
        <p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", marginBottom:12 }}>⚖️ LOG WEEKLY WEIGH-IN</p>
        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:10 }}>
          <TInput value={newW} onChange={e=>setNewW(e.target.value)} placeholder="Current weight in lbs" type="number" style={{ flex:1 }} />
          <Btn onClick={addEntry} disabled={!newW} color={C.accent} style={{ padding:"12px 18px" }}>+ Log</Btn>
        </div>
        <div style={{ display:"flex", gap:16, fontSize:12 }}>
          <span style={{ color:C.muted }}>Start: <strong style={{ color:C.text }}>{profile.startWeightLbs} lbs</strong></span>
          <span style={{ color:C.muted }}>Target: <strong style={{ color:C.green }}>{target.toFixed(1)} lbs</strong></span>
        </div>
      </Card>

      {entries.length>=1 && (
        <Card>
          <p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", marginBottom:12 }}>📈 WEIGHT CHART (lbs)</p>
          <Chart entries={entries} startWeight={profile.startWeightLbs} targetWeight={target} />
          {entries.length<2&&<p style={{ color:C.muted, fontSize:12, textAlign:"center", marginTop:8 }}>Log more weeks to see your trend</p>}
        </Card>
      )}

      {entries.length>0 && (
        <Section title="Weekly Log">
          <Row label="Starting weight" value={`${profile.startWeightLbs} lbs`} color={C.muted} />
          {entries.map((e,i)=>{
            const prev=i===0?profile.startWeightLbs:entries[i-1].weight;
            const diff=e.weight-prev;
            return (
              <Row key={i} label={`${e.label}${e.date?` · ${e.date}`:""}`} value={`${e.weight} lbs`} last={i===entries.length-1}
                icon={<span style={{ color:diff<0?C.green:diff>0?C.red:C.muted, fontSize:12, fontWeight:700 }}>{diff<0?"▼":diff>0?"▲":"●"} {Math.abs(diff).toFixed(1)}</span>}
              />
            );
          })}
        </Section>
      )}
    </div>
  );
};

// ── PROFILE TAB ───────────────────────────────────────────────────────────────
const ProfileTab = ({ profile, setProfile, onReset }) => {
  const [editing, setEditing] = useState(null); // null | "goal" | "weight" | "allergies" | "dislikes" | "workouts"
  const [tempData, setTempData] = useState({});

  const startEdit = (section) => { setTempData({...profile}); setEditing(section); };
  const toggleArr = (k, v) => setTempData(d=>({...d,[k]:d[k].includes(v)?d[k].filter(x=>x!==v):[...d[k],v]}));
  const save = () => { setProfile({...profile,...tempData}); setEditing(null); };

  if (editing) return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
        <button onClick={()=>setEditing(null)} style={{ background:"none", border:"none", color:C.accent, fontSize:16, cursor:"pointer", fontFamily:FONT }}>← Back</button>
        <h2 style={{ color:C.text, fontSize:20, fontWeight:700, margin:0, flex:1 }}>Edit {editing}</h2>
        <Btn onClick={save} small color={C.accent}>Save</Btn>
      </div>

      {editing==="goal" && (
        <>
          <p style={{ color:C.muted, fontSize:14, marginBottom:16 }}>What's your main goal?</p>
          {[["lose_weight","🎯","Lose weight"],["build_muscle","💪","Build muscle"],["get_fitter","🏃","Get fitter"],["all","⭐","All of the above"]].map(([val,ico,title])=>(
            <Card key={val} onClick={()=>setTempData(d=>({...d,goal:val}))} style={{ borderColor:tempData.goal===val?C.accent:C.border, borderWidth:tempData.goal===val?2:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:24 }}>{ico}</span>
                <span style={{ color:C.text, fontWeight:600 }}>{title}</span>
                {tempData.goal===val&&<span style={{ marginLeft:"auto", color:C.accent }}>✓</span>}
              </div>
            </Card>
          ))}
        </>
      )}

      {editing==="weight" && (
        <>
          <p style={{ color:C.muted, fontSize:14, marginBottom:16 }}>Update your weight target and pace</p>
          <div style={{ marginBottom:16 }}>
            <p style={{ color:C.muted, fontSize:13, marginBottom:8 }}>Weight loss target</p>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {[7,14,21,28].map(lbs=>(
                <Chip key={lbs} color={C.accent} active={tempData.targetLbs===lbs} onClick={()=>setTempData(d=>({...d,targetLbs:lbs}))}>{lbs/14} stone ({lbs} lbs)</Chip>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:16 }}>
            <p style={{ color:C.muted, fontSize:13, marginBottom:8 }}>How fast do you want to lose weight?</p>
            <PacePicker value={tempData.paceId||"normal"} onChange={v=>setTempData(d=>({...d,paceId:v}))} targetLbs={tempData.targetLbs||14} />
          </div>
        </>
      )}

      {editing==="allergies" && (
        <>
          <p style={{ color:C.muted, fontSize:14, marginBottom:16 }}>Select all that apply</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {ALLERGENS.map(a=>(
              <Chip key={a} color={C.red} active={tempData.allergies.includes(a)} onClick={()=>toggleArr("allergies",a)}>{a}</Chip>
            ))}
          </div>
        </>
      )}

      {editing==="dislikes" && (
        <>
          <p style={{ color:C.muted, fontSize:14, marginBottom:16 }}>Foods to exclude from meal plans</p>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {DISLIKES_LIST.map(d=>(
              <Chip key={d} color={C.orange} active={tempData.dislikes.includes(d)} onClick={()=>toggleArr("dislikes",d)}>{d}</Chip>
            ))}
          </div>
        </>
      )}

      {editing==="workouts" && (
        <>
          <p style={{ color:C.muted, fontSize:14, marginBottom:16 }}>How many times per week do you train?</p>
          <div style={{ display:"flex", gap:8 }}>
            {[2,3,4,5].map(n=>(
              <Chip key={n} color={C.purple} active={tempData.workoutsPerWeek===n} onClick={()=>setTempData(d=>({...d,workoutsPerWeek:n}))}>{n}x</Chip>
            ))}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div>
      <div style={{ textAlign:"center", padding:"24px 0 20px" }}>
        <div style={{ width:80, height:80, borderRadius:99, background:`linear-gradient(135deg, ${C.accent}, ${C.green})`, margin:"0 auto 12px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32 }}>🏃</div>
        <h2 style={{ color:C.text, fontSize:22, fontWeight:700, margin:0 }}>{profile.name||"Your Profile"}</h2>
        <p style={{ color:C.muted, fontSize:14, margin:"4px 0 0" }}>Age 53 · LeanPlan member</p>
      </div>

      <Section title="Goals">
        <Row label="Main goal" value={profile.goal.replace("_"," ")} onClick={()=>startEdit("goal")} />
        <Row label="Weight target" value={`Lose ${profile.targetLbs/14} stone (${profile.targetLbs} lbs)`} onClick={()=>startEdit("weight")} />
        <Row label="Weekly pace" value={`${getPace(profile.paceId||'normal').lbs} lbs/week — ${getPace(profile.paceId||'normal').label}`} onClick={()=>startEdit("weight")} last />
      </Section>

      <Section title="Training">
        <Row label="Workouts per week" value={`${profile.workoutsPerWeek}x`} onClick={()=>startEdit("workouts")} last />
      </Section>

      <Section title="Diet & Allergies">
        <Row label="Allergies / intolerances" value={profile.allergies.length>0?`${profile.allergies.length} selected`:"None"} onClick={()=>startEdit("allergies")} />
        <Row label="Foods I dislike" value={profile.dislikes.length>0?`${profile.dislikes.length} selected`:"None"} onClick={()=>startEdit("dislikes")} />
        <Row label="Always exclude" value="Fish · Oats · Cow's milk" last />
      </Section>

      <Section title="About">
        <Row label="Version" value="LeanPlan 2.0" last />
      </Section>

      <div style={{ marginTop:8 }}>
        <Btn onClick={onReset} outline color={C.red} style={{ width:"100%" }}>Reset All Data</Btn>
      </div>
      <p style={{ color:C.muted, fontSize:12, textAlign:"center", marginTop:16, lineHeight:1.6 }}>LeanPlan is for general guidance only. Consult your GP before making significant changes to your diet or exercise routine.</p>
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
  const [mealLog, setMealLog] = useState({});
  const [workoutLog, setWorkoutLog] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    try {
      const raw = localStorage.getItem("leanplan_v3");
      if (raw) {
        const d = JSON.parse(raw);
        if (d.profile) setProfile(d.profile);
        if (d.entries) setEntries(d.entries);
        if (d.favourites) setFavourites(d.favourites);
        if (d.removed) setRemoved(d.removed);
        if (d.mealLog) setMealLog(d.mealLog);
        if (d.workoutLog) setWorkoutLog(d.workoutLog);
      }
    } catch(e){}
    setLoading(false);
  },[]);

  useEffect(()=>{
    if (loading) return;
    try { localStorage.setItem("leanplan_v3", JSON.stringify({profile,entries,favourites,removed,mealLog,workoutLog})); } catch(e){}
  },[profile,entries,favourites,removed,mealLog,workoutLog,loading]);

  if (loading) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:FONT }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:12 }}>🏃</div>
        <p style={{ color:C.muted }}>Loading...</p>
      </div>
    </div>
  );

  if (!profile) return <Onboarding onDone={p=>setProfile(p)} />;

  const handleReset = () => {
    if (window.confirm("Reset all data?")) {
      localStorage.removeItem("leanplan_v3");
      setProfile(null); setEntries([]); setFavourites([]); setRemoved([]); setMealLog({}); setWorkoutLog({});
    }
  };

  const cur = entries.length>0?entries[entries.length-1].weight:profile.startWeightLbs;
  const lost = Math.max(0, profile.startWeightLbs-cur);
  const pct = Math.min(100,Math.round((lost/profile.targetLbs)*100));
  const TAB_COLORS = {"Today":"#007aff","Meals":"#34c759","Workout":"#5ac8fa","Progress":"#af52de","Profile":"#ff9500"};

  return (
    <div style={{ background:C.bg, minHeight:"100vh", fontFamily:FONT, color:C.text, maxWidth:430, margin:"0 auto" }}>
      <style>{`* { box-sizing:border-box; margin:0; padding:0; } input,select { outline:none; } body { background:${C.bg}; font-family:${FONT}; } ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-thumb { background:${C.divider}; border-radius:4px; }`}</style>

      {/* Header */}
      <div style={{ padding:"52px 18px 12px", background:"rgba(242,242,247,0.92)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, zIndex:10 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <h1 style={{ fontSize:20, fontWeight:700, color:C.text, margin:0 }}>🏃 LeanPlan</h1>
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

      {/* Content */}
      <div style={{ padding:"16px 14px 100px" }}>
        {tab==="Today"&&<TodayTab profile={profile} entries={entries} mealLog={mealLog} setMealLog={setMealLog} workoutLog={workoutLog} />}
        {tab==="Meals"&&<MealsTab profile={profile} favourites={favourites} setFavourites={setFavourites} removed={removed} setRemoved={setRemoved} mealLog={mealLog} setMealLog={setMealLog} />}
        {tab==="Workout"&&<WorkoutTab workoutLog={workoutLog} setWorkoutLog={setWorkoutLog} />}
        {tab==="Progress"&&<ProgressTab profile={profile} entries={entries} setEntries={fn=>setEntries(typeof fn==="function"?fn(entries):fn)} />}
        {tab==="Profile"&&<ProfileTab profile={profile} setProfile={setProfile} onReset={handleReset} />}
      </div>

      {/* Tab bar */}
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:"rgba(242,242,247,0.92)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderTop:`1px solid ${C.border}`, display:"flex", padding:"8px 0 20px" }}>
        {TABS.map(t=>{
          const col = TAB_COLORS[t];
          const active = tab===t;
          return (
            <div key={t} onClick={()=>setTab(t)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", cursor:"pointer", gap:3 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:active?col:"transparent", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s" }}>
                <span style={{ fontSize:18, filter:active?"none":"grayscale(1) opacity(0.5)" }}>{ICONS[t]}</span>
              </div>
              <span style={{ fontSize:10, fontWeight:active?700:400, color:active?col:C.muted, letterSpacing:"0.02em" }}>{t}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
