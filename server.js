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

const PRICES = {
  monthly: "price_1TDtInPfNxGIwDvC72uuu6ZE",
  annual:  "price_1TDtJPPfNxGIwDvCffCwzs3j",
};

const APP_URL = process.env.APP_URL || "https://www.leanplan.uk";

// ── Stripe webhook needs raw body ─────────────────────────────────────────────
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
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
      customer_creation: "always",
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

// ── Chat endpoint ─────────────────────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  const { messages, profile } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "Invalid request" });

  const systemPrompt = `You are a friendly, knowledgeable personal health coach built into LeanPlan, a fitness and nutrition app.

The user's profile:
- Name: ${profile?.name || "Friend"}
- Age: ${profile?.age || 53}
- Goal: ${profile?.goal?.replace("_", " ") || "lose weight"}
- Target: Lose ${profile?.targetLbs || 14} lbs at ${profile?.paceId || "moderate"} pace
- Workouts/week: ${profile?.workoutsPerWeek || 3}
- Allergies: ${profile?.allergies?.join(", ") || "none declared"}
- Dislikes: ${profile?.dislikes?.join(", ") || "none declared"}
- Equipment: rowing machine, cross trainer, dumbbells, cable machines
- Constraints: back problems, soft knees — no HIIT, no running, no jumping
- Diet: gluten-free, dairy-free, no fish, no oats, no cow's milk

Your role:
1. Answer health, fitness, nutrition and wellbeing questions helpfully and specifically to this person
2. When the user mentions a NEW food dislike, include: ACTION:{"type":"add_dislike","value":"food name"}
3. When they mention a NEW pain or injury, include: ACTION:{"type":"add_pain","value":"description"}
4. When they mention an allergy, include: ACTION:{"type":"add_allergy","value":"allergen name"}
5. When they want to remove a dislike, include: ACTION:{"type":"remove_dislike","value":"food name"}

Keep responses warm, concise and practical. Only include an ACTION line if there's a genuine profile update to make.`;

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
