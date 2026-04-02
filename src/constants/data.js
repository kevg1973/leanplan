import { getPace } from "../utils/index.js";

// ── All Meals ─────────────────────────────────────────────────────────────────
export const ALL_MEALS = [
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
export const EXERCISE_DB = [
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

// ── TRAIN TAB ─────────────────────────────────────────────────────────────────
