import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Anthropic from "@anthropic-ai/sdk";
import Stripe from "stripe";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Auto detect test/live from secret key ────────────────────────────────────
const IS_TEST = process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_");

const PRICES = IS_TEST ? {
  monthly: process.env.STRIPE_PRICE_MONTHLY_TEST || "price_1TDuIWBlEueyqAyRLgOGydQV",
  annual:  process.env.STRIPE_PRICE_ANNUAL_TEST  || "price_1TDuItBlEueyqAyRcwY269HK",
} : {
  monthly: process.env.STRIPE_PRICE_MONTHLY_LIVE || "price_1TDtInPfNxGIwDvC72uuu6ZE",
  annual:  process.env.STRIPE_PRICE_ANNUAL_LIVE  || "price_1TDtJPPfNxGIwDvCffCwzs3j",
};

console.log("Stripe mode:", IS_TEST ? "TEST 🧪" : "LIVE 💳");

const APP_URL = process.env.APP_URL || "https://www.leanplan.uk";

// ── Stripe webhook needs raw body ─────────────────────────────────────────────
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));
app.use(express.json());

// CORS headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});
// Serve sw.js with required Service-Worker-Allowed header
app.get("/sw.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Service-Worker-Allowed", "/");
  res.sendFile(join(__dirname, "dist", "sw.js"), err => {
    if (err) res.status(404).send("sw.js not found");
  });
});

app.use(express.static(join(__dirname, "dist")));

// ── Create Stripe checkout session ───────────────────────────────────────────
app.post("/api/stripe/checkout", async (req, res) => {
  const { plan, deviceId } = req.body;
  if (!plan || !PRICES[plan]) return res.status(400).json({ error: "Invalid plan" });

  try {
    console.log("Creating checkout session for plan:", plan, "price:", PRICES[plan]);
    console.log("APP_URL:", APP_URL);
    console.log("Stripe key starts with:", process.env.STRIPE_SECRET_KEY?.slice(0,12));
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: PRICES[plan], quantity: 1 }],
      success_url: `${APP_URL}?pro=success&session_id={CHECKOUT_SESSION_ID}&deviceId=${deviceId}`,
      cancel_url: `${APP_URL}?pro=cancelled`,
      metadata: { deviceId, plan },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    });
    console.log("Checkout session created:", session.id);
    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err.message);
    console.error("Stripe error type:", err.type);
    console.error("Stripe error code:", err.code);
    res.status(500).json({ error: err.message });
  }
});

// ── Verify session after return from Stripe ───────────────────────────────────
app.get("/api/stripe/verify", async (req, res) => {
  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ error: "No session ID" });

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status === "paid") {
      res.json({
        pro: true,
        plan: session.metadata?.plan || "monthly",
        customerId: session.customer,
        subscriptionId: session.subscription,
      });
    } else {
      res.json({ pro: false });
    }
  } catch (err) {
    console.error("Stripe verify error:", err.message);
    res.status(500).json({ error: "Failed to verify session" });
  }
});

// ── Stripe webhook ─────────────────────────────────────────────────────────────
app.post("/api/stripe/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle subscription cancellation / expiry
  if (event.type === "customer.subscription.deleted" ||
      event.type === "customer.subscription.paused") {
    console.log("Subscription ended:", event.data.object.id);
    // In a full system you'd update a DB here — for now just log it
  }

  res.json({ received: true });
});

// ── Manage subscription portal ────────────────────────────────────────────────
app.post("/api/stripe/portal", async (req, res) => {
  const { customerId } = req.body;
  if (!customerId) return res.status(400).json({ error: "No customer ID" });

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: APP_URL,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error("Portal error:", err.message);
    res.status(500).json({ error: "Failed to create portal session" });
  }
});

// ── Pro bypass check ─────────────────────────────────────────────────────────
app.get("/api/pro-status", (req, res) => {
  const bypass = process.env.BYPASS_PRO === "true";
  res.json({ bypass });
});

// ── AI Recipe Generation ─────────────────────────────────────────────────────
app.post("/api/generate-meals", async (req, res) => {
  const { profile, dislikedMealNames = [], style = "all" } = req.body;

  const dietNotes = [
    profile?.dietType || "omnivore",
    profile?.dairyPref === "dairy_free" ? "strictly dairy-free (use coconut yoghurt, soya milk, dairy-free alternatives)" : 
    profile?.dairyPref === "lactose_free" ? "lactose-free dairy only" : "dairy ok",
    profile?.glutenPref === "gluten_free" ? "STRICTLY GLUTEN-FREE — absolutely no wheat, barley, rye, or regular oats. Use rice, quinoa, buckwheat, certified GF oats only if explicitly labelled gluten-free, corn/maize, potatoes. Use tamari instead of soy sauce." : "gluten ok",
  ].filter(Boolean).join(", ");

  const isGlutenFree = profile?.glutenPref === "gluten_free";
  const isDairyFree = profile?.dairyPref === "dairy_free";

  // Conditional safe staples based on dietary needs
  const safeCarbs = isGlutenFree
    ? "rice, quinoa, buckwheat, sweet potato, potatoes, rice cakes, corn tortillas (certified GF)"
    : "oats, rice, quinoa, sweet potato, wholegrain bread, pasta";
  const safeDairy = isDairyFree
    ? "coconut yoghurt, soya milk, oat milk (check GF if needed), dairy-free alternatives"
    : "yoghurt, milk, cheese";
  const budgetStaples = isGlutenFree
    ? "eggs, rice, quinoa, chicken breast, tinned tomatoes, tinned beans, frozen veg, sweet potato, spinach, broccoli, rice cakes"
    : "oats, eggs, rice, chicken breast, tinned tomatoes, tinned beans, frozen veg, sweet potato, spinach, broccoli";

  console.log(`Meal plan targets — TDEE:${tdee} Target:${dailyCalTarget}cal Protein:${dailyProteinTarget}g Goal:${goal} Pace:${profile?.paceId}`);

  // Supplement notes — incorporate into meals if relevant
  const usesProteinPowder = profile?.supplementsInterested?.includes("protein") || false;
  const usesCreatine = profile?.supplementsInterested?.includes("creatine") || false;
  const supplementMealNote = (() => {
    const notes = [];
    if (usesProteinPowder) notes.push("Include at least one protein shake or smoothie per day using pea/soya protein powder (the user has this and wants to use it). Good for morning snack or post-workout.");
    if (usesCreatine) notes.push("User takes creatine — one meal or snack can include a note to stir 5g creatine into it (e.g. coconut yoghurt, smoothie).");
    return notes.length > 0 ? notes.join(" ") : null;
  })();

  const cookTime = { quick:"15 minutes max", moderate:"30 minutes", enjoy:"up to 60 minutes" }[profile?.cookingTime] || "30 minutes";
  const styleFilter = style !== "all" ? `Meal style: ${style}.` : "";

  const prompt = `Generate exactly 5 meals for one day for this person. Return ONLY valid JSON, no other text.

User profile:
- Diet: ${dietNotes}
- Allergies: ${profile?.allergies?.join(", ") || "none"}
- Dislikes: ${profile?.dislikes?.join(", ") || "none"}
- Cooking time: ${cookTime} per meal
- Goal: ${profile?.goal?.replace(/_/g," ") || "lose weight"}
- Age: ${profile?.age || "adult"}
${styleFilter}

CRITICAL RULES:
1. ALL ingredients must be available in standard UK supermarkets (Tesco, Sainsbury's, Asda, Ocado)
2. No exotic or hard-to-find ingredients
3. No ingredients the user dislikes or is allergic to
4. Meals must be in order: breakfast, morning snack, lunch, afternoon snack, dinner
5. Do NOT generate any of these meals (user has disliked them): ${dislikedMealNames.length > 0 ? dislikedMealNames.join(", ") : "none"}
6. Each meal should be high protein (20g+ for main meals, 10g+ for snacks)
7. Use simple whole foods — chicken, eggs, ${safeCarbs}, vegetables, legumes, fruit etc
8. Snacks MUST include fruit — bananas, berries, apples, oranges are all perfect. Every snack should have a fruit component unless it's a protein shake.

Return this exact JSON structure:
{
  "meals": [
    {
      "id": "ai_[unique_6_char_id]",
      "name": "Meal Name",
      "type": "breakfast|snack|lunch|dinner",
      "time": "8:00 AM",
      "cals": 400,
      "protein": 30,
      "carbs": 35,
      "fat": 12,
      "items": ["ingredient 1 (amount)", "ingredient 2 (amount)"],
      "method": "Step by step cooking instructions",
      "tags": ["balanced", "gf", "df"]
    }
  ]
}`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0]?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    if (!parsed.meals || !Array.isArray(parsed.meals)) {
      throw new Error("Invalid meal structure returned");
    }

    res.json({ meals: parsed.meals });
  } catch (err) {
    console.error("Recipe generation error:", err.message);
    res.status(500).json({ error: "Failed to generate meals" });
  }
});

// ── AI Multi-day Meal Plan Generation ────────────────────────────────────────
app.post("/api/generate-meal-plan", async (req, res) => {
  const { profile, dislikedMealNames = [], style = "all", days = 5 } = req.body;

  // ── Calculate TDEE ─────────────────────────────────────────────────────────
  const calcTDEE = (p) => {
    if (!p?.heightCm || !p?.startWeightLbs || !p?.age) return null;
    const weightKg = p.startWeightLbs * 0.453592;
    const heightCm = parseFloat(p.heightCm);
    const age = parseFloat(p.age);
    const bmr = p.sex === "female"
      ? (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161
      : (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
    const activityMult = { 2:1.375, 3:1.55, 4:1.725, 5:1.9 }[p.workoutsPerWeek] || 1.55;
    return Math.round(bmr * activityMult);
  };

  // ── Calculate targets ──────────────────────────────────────────────────────
  const tdee = calcTDEE(profile);
  const goal = profile?.goal || "lose_weight";
  const weightKg = profile?.startWeightLbs ? profile.startWeightLbs * 0.453592 : null;

  // Calorie target based on goal + pace
  const paceDeficits = { slow: 275, normal: 500, fast: 750, vfast: 1000 };
  const deficit = paceDeficits[profile?.paceId] || 500;

  // Has the user set a weight loss target? Use pace as primary driver if so
  const hasWeightTarget = profile?.targetLbs > 0;

  let dailyCalTarget = null;
  if (tdee) {
    if (goal === "lose_weight") {
      dailyCalTarget = Math.max(1200, tdee - deficit);
    } else if (goal === "build_muscle") {
      dailyCalTarget = tdee + 300;
    } else if (goal === "get_fitter") {
      dailyCalTarget = tdee - 150;
    } else {
      // "all of the above" — if they have a weight target and pace, honour the deficit
      // You can lose fat AND build muscle in a modest deficit with high protein + strength training
      if (hasWeightTarget && profile?.paceId) {
        dailyCalTarget = Math.max(1400, tdee - deficit);
      } else {
        dailyCalTarget = tdee - 200;
      }
    }
  }

  // Protein target based on goal and bodyweight
  // Higher protein is essential when in a deficit to preserve/build muscle
  let dailyProteinTarget = null;
  if (weightKg) {
    if (goal === "lose_weight" || goal === "all") {
      dailyProteinTarget = Math.round(weightKg * 2.2); // high protein preserves muscle in deficit
    } else if (goal === "build_muscle") {
      dailyProteinTarget = Math.round(weightKg * 2.0);
    } else {
      dailyProteinTarget = Math.round(weightKg * 1.8);
    }
  }

  // Macro split guidance
  const macroGuidance = (() => {
    if (goal === "build_muscle") return "Higher carbs (40%), high protein (35%), moderate fat (25%). Calorie surplus.";
    if (goal === "lose_weight") return "Moderate carbs (35%), high protein (40%), moderate fat (25%). Calorie deficit.";
    if (goal === "get_fitter") return "Balanced carbs (40%), protein (30%), fat (30%). Slight deficit.";
    // all of the above — body recomposition approach
    return "High protein (40%), moderate carbs (35%), moderate fat (25%). Modest calorie deficit — enough to lose fat while supporting muscle retention with strength training.";
  })();

  // Meal calorie distribution (5 meals)
  const mealDistribution = (() => {
    if (!dailyCalTarget) return "breakfast ~25%, snacks ~10% each, lunch ~25%, dinner ~30%";
    const b = Math.round(dailyCalTarget * 0.25);
    const s = Math.round(dailyCalTarget * 0.10);
    const l = Math.round(dailyCalTarget * 0.25);
    const d = Math.round(dailyCalTarget * 0.30);
    return `breakfast ~${b} cal, morning snack ~${s} cal, lunch ~${l} cal, afternoon snack ~${s} cal, dinner ~${d} cal`;
  })();

  const milkNote = profile?.milkAlt
    ? `preferred milk alternative: ${profile.milkAlt} milk (use this in all recipes, smoothies, porridge, coffee)`
    : profile?.dairyPref === "dairy_free" ? "dairy-free milk (soya or oat)" : null;

  const dietNotes = [
    profile?.dietType || "omnivore",
    profile?.dairyPref === "dairy_free" ? "strictly dairy-free (use coconut yoghurt, dairy-free alternatives)" :
    profile?.dairyPref === "lactose_free" ? "lactose-free dairy only" : "dairy ok",
    milkNote,
    profile?.glutenPref === "gluten_free" ? "STRICTLY GLUTEN-FREE — absolutely no wheat, barley, rye, or regular oats. Use rice, quinoa, buckwheat, certified GF oats only if explicitly labelled gluten-free, corn/maize, potatoes. Use tamari instead of soy sauce." : "gluten ok",
  ].filter(Boolean).join(", ");

  const isGlutenFree = profile?.glutenPref === "gluten_free";
  const isDairyFree = profile?.dairyPref === "dairy_free";

  // Conditional safe staples based on dietary needs
  const safeCarbs = isGlutenFree
    ? "rice, quinoa, buckwheat, sweet potato, potatoes, rice cakes, corn tortillas (certified GF)"
    : "oats, rice, quinoa, sweet potato, wholegrain bread, pasta";
  const safeDairy = isDairyFree
    ? "coconut yoghurt, soya milk, oat milk (check GF if needed), dairy-free alternatives"
    : "yoghurt, milk, cheese";
  const budgetStaples = isGlutenFree
    ? "eggs, rice, quinoa, chicken breast, tinned tomatoes, tinned beans, frozen veg, sweet potato, spinach, broccoli, rice cakes"
    : "oats, eggs, rice, chicken breast, tinned tomatoes, tinned beans, frozen veg, sweet potato, spinach, broccoli";

  console.log(`Meal plan targets — TDEE:${tdee} Target:${dailyCalTarget}cal Protein:${dailyProteinTarget}g Goal:${goal} Pace:${profile?.paceId}`);

  // Supplement notes — incorporate into meals if relevant
  const usesProteinPowder = profile?.supplementsInterested?.includes("protein") || false;
  const usesCreatine = profile?.supplementsInterested?.includes("creatine") || false;
  const supplementMealNote = (() => {
    const notes = [];
    if (usesProteinPowder) notes.push("Include at least one protein shake or smoothie per day using pea/soya protein powder (the user has this and wants to use it). Good for morning snack or post-workout.");
    if (usesCreatine) notes.push("User takes creatine — one meal or snack can include a note to stir 5g creatine into it (e.g. coconut yoghurt, smoothie).");
    return notes.length > 0 ? notes.join(" ") : null;
  })();

  const cookTime = { quick:"15 minutes max", moderate:"30 minutes", enjoy:"up to 60 minutes" }[profile?.cookingTime] || "30 minutes";
  const styleFilter = style !== "all" ? `Meal style: ${style}.` : "";

  // Generate date keys for the plan
  const dateKeys = Array.from({length: days}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  // Build batch-cook instruction based on days
  const batchCookNote = days >= 3
    ? `BATCH COOKING: On day 1, cook double portions of the main protein (e.g. chicken breast) so it can be used cold/reheated in day 2 lunch. On day 3, batch cook a base (e.g. rice or quinoa) for days 3-4. Note which meals use leftovers by adding "(using leftover X from day Y)" to the meal name.`
    : `Cook enough protein at dinner for next day's lunch where possible.`;

  const prompt = `Generate a ${days}-day meal plan for this person. Return ONLY valid JSON, no other text.

PERSONAL PROFILE:
- Sex: ${profile?.sex || "not specified"}
- Age: ${profile?.age || "adult"}
- Weight: ${weightKg ? weightKg.toFixed(1) + "kg" : "not specified"}
- Height: ${profile?.heightCm ? profile.heightCm + "cm" : "not specified"}
- Goal: ${goal.replace(/_/g," ")}
- Diet: ${dietNotes}
- Allergies: ${profile?.allergies?.join(", ") || "none"}
- Dislikes: ${profile?.dislikes?.join(", ") || "none"}
- Cooking time per meal: ${cookTime}
- Workouts per week: ${profile?.workoutsPerWeek || 3}
${styleFilter}

${supplementMealNote ? `SUPPLEMENTS TO INCORPORATE:
${supplementMealNote}

` : ""}CALORIE & MACRO TARGETS (MUST HIT THESE — this is the most important part):
- Daily calorie target: ${dailyCalTarget ? dailyCalTarget + " calories" : "approximately 1700 calories"}
- Daily protein target: ${dailyProteinTarget ? dailyProteinTarget + "g minimum" : "at least 130g"}
- Macro split: ${macroGuidance}
- Meal distribution: ${mealDistribution}
- Each meal's cals, protein, carbs and fat fields MUST reflect real nutritional values that add up to the daily target

ALLERGY & DIETARY HARD RULES (NEVER BREAK THESE):
${isGlutenFree ? "⛔ GLUTEN-FREE: Do NOT use wheat, barley, rye, regular oats, bread, pasta, flour, couscous, bulgur, soy sauce, most cereals. Use rice, quinoa, buckwheat, certified GF oats, potatoes, tamari." : ""}
${isDairyFree ? "⛔ DAIRY-FREE: Do NOT use milk, cheese, butter, cream, yoghurt, whey. Use coconut yoghurt, soya milk, oat milk, dairy-free alternatives." : ""}
${(profile?.allergies?.length > 0) ? "⛔ ALLERGIES — absolutely exclude: " + profile.allergies.join(", ") : ""}

CRITICAL RULES:
1. ALL ingredients must be available in standard UK supermarkets (Tesco, Sainsbury's, Asda, Ocado) at reasonable prices
2. No exotic or hard-to-find ingredients
3. No ingredients the user dislikes or is allergic to
4. Each day must have exactly 5 meals in order: breakfast, morning snack, lunch, afternoon snack, dinner
5. Do NOT repeat meals across days — every meal must be unique
6. Do NOT generate any of these meals (user has disliked them): ${dislikedMealNames.length > 0 ? dislikedMealNames.join(", ") : "none"}
7. Use simple whole foods — chicken, eggs, ${safeCarbs}, vegetables, legumes, fruit etc
8. Snacks MUST include fruit — bananas, berries, apples, oranges are all perfect. Every snack should have a fruit component unless it's a protein shake.

INGREDIENT EFFICIENCY (keeps shopping cost down):
9. Use a MAXIMUM of 2-3 different meat/fish proteins across the ENTIRE plan (e.g. chicken breast + eggs + tinned tuna). Do NOT use a different protein every meal.
10. Build around a core set of 15-20 base ingredients that repeat across days. Variety comes from preparation and seasoning, not new ingredients every day.
11. Total unique ingredients across the whole plan: 30 or fewer.
12. Use budget staples: ${budgetStaples}. Also include seasonal fruit: bananas, apples, berries, oranges.

BATCH COOKING:
13. ${batchCookNote}

Return this exact JSON structure:
{
  "days": [
    {
      "date": "${dateKeys[0]}",
      "meals": [
        {
          "id": "ai_[unique_6_char_id]",
          "name": "Meal Name",
          "type": "breakfast|snack|lunch|dinner",
          "time": "8:00 AM",
          "cals": 400,
          "protein": 30,
          "carbs": 35,
          "fat": 12,
          "items": ["ingredient 1 (amount)", "ingredient 2 (amount)"],
          "method": "Step by step cooking instructions",
          "tags": ["balanced", "gf", "df"]
        }
      ]
    }
  ]
}

Generate ${days} days with dates: ${dateKeys.join(", ")}`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0]?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    if (!parsed.days || !Array.isArray(parsed.days)) {
      throw new Error("Invalid meal plan structure returned");
    }

    res.json({ days: parsed.days });
  } catch (err) {
    console.error("Meal plan generation error:", err.message);
    res.status(500).json({ error: "Failed to generate meal plan" });
  }
});

// ── Chat endpoint ─────────────────────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  const { messages, profile } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "Invalid request" });

  const injuries = profile?.injuries?.filter(i=>i!=="none")?.join(", ") || "none";
  const suppNote = profile?.supplementsOpen === "no"
    ? "User prefers food only — do NOT suggest supplements"
    : profile?.supplementsInterested?.length > 0
    ? `Open to supplements. Interested in: ${profile.supplementsInterested.join(", ")}`
    : "Open to supplements — suggest relevant ones";
  const equipment = profile?.equipment?.join(", ") || "not specified";
  const dietNotes = [
    profile?.dietType || "omnivore",
    profile?.dairyPref === "dairy_free" ? "dairy-free" : profile?.dairyPref === "lactose_free" ? "lactose-free" : "full dairy ok",
    profile?.glutenPref === "gluten_free" ? "gluten-free" : "gluten ok",
    profile?.milkAlt ? `prefers ${profile.milkAlt} milk` : "",
  ].filter(Boolean).join(", ");

  const systemPrompt = `You are a friendly, knowledgeable personal health coach built into LeanPlan, a fitness and nutrition app.

The user's profile:
- Name: ${profile?.name || "there"}
- Age: ${profile?.age || "unknown"}
- Sex: ${profile?.sex || "not specified"}
- Goal: ${profile?.goal?.replace(/_/g, " ") || "lose weight"}
- Target: Lose ${profile?.targetLbs || 14} lbs at ${profile?.paceId || "moderate"} pace
- Fitness level: ${profile?.fitnessLevel || "beginner"}
- Workouts/week: ${profile?.workoutsPerWeek || 3}
- Workout style: ${profile?.workoutStyle || "mixed"}
- Equipment available: ${equipment}
- Injuries/limitations: ${injuries}
- Diet: ${dietNotes}
- Allergies: ${profile?.allergies?.join(", ") || "none"}
- Dislikes: ${profile?.dislikes?.join(", ") || "none"}
- Sleep: ${profile?.sleepQuality || "not specified"}
- Activity level: ${profile?.activityLevel || "moderate"}
- Cooking time: ${profile?.cookingTime || "moderate"}
- Known pains: ${profile?.pains?.map(p=>p.desc).join(", ") || "none logged"}
- Supplements: ${suppNote}
- TDEE: ${profile?.heightCm && profile?.age ? "calculable from profile" : "unknown"}

Your role:
1. Answer health, fitness, nutrition and wellbeing questions helpfully and specifically to this person
2. Tailor advice to their equipment, injuries, diet type and fitness level
3. When the user mentions a NEW food dislike, include: ACTION:{"type":"add_dislike","value":"food name"}
4. When they mention a NEW pain or injury, include: ACTION:{"type":"add_pain","value":"description"}
5. When they mention an allergy, include: ACTION:{"type":"add_allergy","value":"allergen name"}
6. When they want to remove a dislike, include: ACTION:{"type":"remove_dislike","value":"food name"}

Keep responses warm, concise and practical — 2-4 sentences. Only include an ACTION line if there's a genuine profile update to make.`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });

    const text = response.content[0]?.text || "";
    const actionMatch = text.match(/^ACTION:(.+)$/m);
    let action = null;
    let cleanText = text;

    if (actionMatch) {
      try {
        action = JSON.parse(actionMatch[1]);
        cleanText = text.replace(/^ACTION:.+$/m, "").trim();
      } catch (e) {}
    }

    res.json({ text: cleanText, action });
  } catch (err) {
    console.error("Anthropic error:", err.message);
    res.status(500).json({ error: "Failed to get response from AI" });
  }
});

app.get("*", (req, res) => {
  res.sendFile(join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`LeanPlan server running on port ${PORT}`);
});
