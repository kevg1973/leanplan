import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Anthropic from "@anthropic-ai/sdk";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Supabase admin client (service role — server only) ────────────────────────
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Resend email client ───────────────────────────────────────────────────────
const resend = new Resend(process.env.RESEND_API_KEY);

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

// Root route: app.leanplan.uk → React app, www/bare domain → landing page
app.get("/", (req, res) => {
  if (req.hostname === "app.leanplan.uk") {
    res.sendFile(join(__dirname, "dist", "index.html"));
  } else {
    res.sendFile(join(__dirname, "dist", "landing.html"));
  }
});

app.get("/privacy", (req, res) => { res.sendFile(join(__dirname, "dist", "privacy.html")); });
app.get("/terms", (req, res) => { res.sendFile(join(__dirname, "dist", "terms.html")); });

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

  console.log("Webhook event:", event.type);

  // ── New subscription: mark user as pro ───────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    if (session.mode !== "subscription" || session.payment_status !== "paid") {
      return res.json({ received: true });
    }

    try {
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["customer"],
      });

      const email = fullSession.customer_details?.email || fullSession.customer?.email;
      const customerId = typeof fullSession.customer === "string"
        ? fullSession.customer
        : fullSession.customer?.id;
      const subscriptionId = fullSession.subscription;
      const plan = fullSession.metadata?.plan || "monthly";

      if (!email) {
        console.error("Webhook: no email found in session", session.id);
        return res.json({ received: true });
      }

      console.log(`Webhook: new subscriber ${email}, plan=${plan}`);

      // Find existing Supabase user by email and mark as pro
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = users?.find(u => u.email === email);

      if (existingUser) {
        const { error } = await supabaseAdmin
          .from("profiles")
          .upsert({
            id: existingUser.id,
            email,
            is_pro: true,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            stripe_plan: plan,
          }, { onConflict: "id" });

        if (error) console.error("Webhook: failed to update profile:", error.message);
        else console.log(`Webhook: marked ${email} as pro`);
      } else {
        // User hasn't created an account yet — store Stripe details for later
        // When they create their account, is_pro will be set on first sync
        console.log(`Webhook: no account found for ${email} — storing stripe data`);
        await supabaseAdmin.from("profiles").upsert({
          id: fullSession.customer,
          email,
          is_pro: true,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          stripe_plan: plan,
        }, { onConflict: "id" });
      }

      // Send welcome email via Resend
      const planLabel = plan === "annual" ? "Annual" : "Monthly";
      const planPrice = plan === "annual" ? "£99/year" : "£9.99/month";
      const planSub = plan === "annual" ? "That's just £8.25/month — 2 months free." : "Cancel any time from your account settings.";

      await resend.emails.send({
        from: "LeanPlan <hello@leanplan.uk>",
        to: email,
        subject: "Welcome to LeanPlan Pro 💪",
        html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Logo -->
        <tr><td align="center" style="padding-bottom:28px;">
          <img src="https://www.leanplan.uk/transparent-logo.png" alt="LeanPlan" style="height:44px;display:block;" />
        </td></tr>

        <!-- Main card -->
        <tr><td style="background:#1a1a1a;border-radius:20px;padding:36px 32px;border:1px solid #2a2a2a;">

          <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#3b82f6;text-transform:uppercase;letter-spacing:1.5px;">You're in 🎉</p>
          <h1 style="margin:0 0 12px;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Welcome to LeanPlan Pro</h1>
          <p style="margin:0 0 4px;font-size:15px;color:#9ca3af;line-height:1.6;">Your <strong style="color:#ffffff;">${planLabel} plan (${planPrice})</strong> is now active.</p>
          <p style="margin:0 0 28px;font-size:13px;color:#6b7280;">${planSub}</p>

          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td align="center">
              <a href="${APP_URL}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 40px;border-radius:12px;letter-spacing:-0.2px;">Open LeanPlan →</a>
            </td></tr>
          </table>

          <div style="border-top:1px solid #2a2a2a;margin-bottom:24px;"></div>

          <!-- What's included -->
          <p style="margin:0 0 14px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;">What's included</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:7px 0;font-size:14px;color:#d1d5db;border-bottom:1px solid #222;">🍽️ &nbsp;AI-generated personalised meal plans</td></tr>
            <tr><td style="padding:7px 0;font-size:14px;color:#d1d5db;border-bottom:1px solid #222;">🏋️ &nbsp;Structured workout programme, goal-based</td></tr>
            <tr><td style="padding:7px 0;font-size:14px;color:#d1d5db;border-bottom:1px solid #222;">🤖 &nbsp;AI nutrition & fitness coach</td></tr>
            <tr><td style="padding:7px 0;font-size:14px;color:#d1d5db;border-bottom:1px solid #222;">📊 &nbsp;Progress photos, weight & measurements</td></tr>
            <tr><td style="padding:7px 0;font-size:14px;color:#d1d5db;border-bottom:1px solid #222;">🛒 &nbsp;Smart shopping list — copy or email to yourself</td></tr>
            <tr><td style="padding:7px 0;font-size:14px;color:#d1d5db;">💊 &nbsp;Personalised supplement guide</td></tr>
          </table>

          <div style="border-top:1px solid #2a2a2a;margin-top:24px;margin-bottom:20px;"></div>

          <!-- Getting started tip -->
          <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;">Getting started</p>
          <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.7;">Head to <strong style="color:#fff;">Meals</strong> to generate your first meal plan, then <strong style="color:#fff;">Train</strong> to see your workout programme. Your AI coach is on the <strong style="color:#fff;">Coach</strong> tab — ask it anything.</p>

        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-size:12px;color:#4b5563;line-height:1.8;">LeanPlan · Manchester, UK<br>
          Questions? Reply to this email or visit <a href="https://www.leanplan.uk" style="color:#3b82f6;text-decoration:none;">leanplan.uk</a></p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
      });

      console.log(`Webhook: welcome email sent to ${email}`);

    } catch (err) {
      console.error("Webhook checkout.session.completed error:", err.message);
    }
  }

  // ── Subscription updated (e.g. cancelled but still active) ──────────────────
  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object;
    const customerId = subscription.customer;

    try {
      if (subscription.cancel_at_period_end) {
        const cancelAt = new Date(subscription.cancel_at * 1000).toISOString();
        const cancelDate = new Date(subscription.cancel_at * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({ stripe_plan: subscription.items?.data?.[0]?.price?.recurring?.interval === "year" ? "annual" : "monthly", cancel_at: cancelAt })
          .eq("stripe_customer_id", customerId);
        if (error) console.error("Webhook: failed to store cancel_at:", error.message);
        else console.log(`Webhook: subscription cancellation scheduled for ${cancelAt}`);

        // Send cancellation email
        try {
          const customer = await stripe.customers.retrieve(customerId);
          const email = customer.email;
          if (email) {
            await resend.emails.send({
              from: "LeanPlan <hello@leanplan.uk>",
              to: email,
              subject: "Your LeanPlan subscription has been cancelled",
              html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Logo -->
        <tr><td align="center" style="padding-bottom:28px;">
          <img src="https://www.leanplan.uk/transparent-logo.png" alt="LeanPlan" style="height:44px;display:block;" />
        </td></tr>

        <!-- Main card -->
        <tr><td style="background:#1a1a1a;border-radius:20px;padding:36px 32px;border:1px solid #2a2a2a;">

          <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1.5px;">Subscription update</p>
          <h1 style="margin:0 0 16px;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">We're sorry to see you go</h1>

          <p style="margin:0 0 16px;font-size:15px;color:#9ca3af;line-height:1.7;">Your LeanPlan Pro subscription has been cancelled.</p>

          <p style="margin:0 0 16px;font-size:15px;color:#9ca3af;line-height:1.7;">Your plan remains active until <strong style="color:#ffffff;">${cancelDate}</strong>. After that date, your meal plans, workout programme, progress data and photos will no longer be accessible.</p>

          <p style="margin:0 0 28px;font-size:15px;color:#9ca3af;line-height:1.7;">If you change your mind, you can resubscribe at any time — all your data, progress and photos will still be there waiting for you.</p>

          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td align="center">
              <a href="https://www.leanplan.uk" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 40px;border-radius:12px;letter-spacing:-0.2px;">Resubscribe →</a>
            </td></tr>
          </table>

          <div style="border-top:1px solid #2a2a2a;margin-bottom:20px;"></div>

          <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.7;">Thank you for being part of LeanPlan. We hope the work you've put in stays with you — the habits, the strength, the progress. That's yours to keep.</p>

        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-size:12px;color:#4b5563;line-height:1.8;">LeanPlan · Manchester, UK<br>
          Questions? Reply to this email or visit <a href="https://www.leanplan.uk" style="color:#3b82f6;text-decoration:none;">leanplan.uk</a></p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
            });

            console.log(`Webhook: cancellation email sent to ${email}`);
          }
        } catch (emailErr) {
          console.error("Webhook: failed to send cancellation email:", emailErr.message);
        }
      } else {
        // Reactivated — clear cancel_at
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({ cancel_at: null })
          .eq("stripe_customer_id", customerId);
        if (error) console.error("Webhook: failed to clear cancel_at:", error.message);
        else console.log(`Webhook: subscription reactivated for customer ${customerId}`);
      }
    } catch (err) {
      console.error("Webhook subscription.updated error:", err.message);
    }
  }

  // ── Subscription cancelled or expired ────────────────────────────────────────
  if (event.type === "customer.subscription.deleted" ||
      event.type === "customer.subscription.paused") {
    const subscription = event.data.object;
    const customerId = subscription.customer;

    try {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ is_pro: false, cancel_at: null })
        .eq("stripe_customer_id", customerId);

      if (error) {
        console.error("Webhook: failed to revoke pro for customer", customerId, error.message);
      } else {
        console.log(`Webhook: pro revoked for customer ${customerId}`);
      }
    } catch (err) {
      console.error("Webhook subscription.deleted error:", err.message);
    }
  }

  res.json({ received: true });
});

// ── Post-signup welcome email ────────────────────────────────────────────────
app.post("/api/send-welcome", async (req, res) => {
  const { email, name } = req.body;
  if (!email) return res.json({ success: false, error: "No email" });

  const displayName = name || "there";

  try {
    await resend.emails.send({
      from: "LeanPlan <hello@leanplan.uk>",
      to: email,
      subject: "Your LeanPlan plan is ready 💪",
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Logo -->
        <tr><td align="center" style="padding-bottom:28px;">
          <img src="https://www.leanplan.uk/transparent-logo.png" alt="LeanPlan" style="height:44px;display:block;" />
        </td></tr>

        <!-- Main card -->
        <tr><td style="background:#1a1a1a;border-radius:20px;padding:36px 32px;border:1px solid #2a2a2a;">

          <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#3b82f6;text-transform:uppercase;letter-spacing:1.5px;">Welcome 🎉</p>
          <h1 style="margin:0 0 12px;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Welcome to LeanPlan, ${displayName}!</h1>
          <p style="margin:0 0 28px;font-size:15px;color:#9ca3af;line-height:1.6;">Your personalised meal plan and workout programme are ready. You have <strong style="color:#ffffff;">7 days of full access</strong> — no card needed.</p>

          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td align="center">
              <a href="${APP_URL}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 40px;border-radius:12px;letter-spacing:-0.2px;">Open LeanPlan →</a>
            </td></tr>
          </table>

          <div style="border-top:1px solid #2a2a2a;margin-bottom:24px;"></div>

          <!-- Next steps -->
          <p style="margin:0 0 14px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;">Here's what to do next</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:8px 0;font-size:14px;color:#d1d5db;border-bottom:1px solid #222;">
              <strong style="color:#3b82f6;">1.</strong> &nbsp;Check your meal plan and shopping list
            </td></tr>
            <tr><td style="padding:8px 0;font-size:14px;color:#d1d5db;border-bottom:1px solid #222;">
              <strong style="color:#3b82f6;">2.</strong> &nbsp;Start today's workout
            </td></tr>
            <tr><td style="padding:8px 0;font-size:14px;color:#d1d5db;">
              <strong style="color:#3b82f6;">3.</strong> &nbsp;Add LeanPlan to your Home Screen for the best experience
            </td></tr>
          </table>

        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-size:12px;color:#4b5563;line-height:1.8;">Questions? Reply to this email — we're happy to help.<br>
          LeanPlan · Manchester, UK · <a href="https://www.leanplan.uk" style="color:#3b82f6;text-decoration:none;">leanplan.uk</a></p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
    console.log(`Welcome email sent to ${email}`);
    res.json({ success: true });
  } catch (err) {
    console.error("Welcome email error:", err.message);
    res.json({ success: false, error: err.message });
  }
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
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);
  const email = (req.query.email || "").toLowerCase();
  const isAdmin = email && adminEmails.includes(email);
  res.json({ bypass: bypass || isAdmin });
});

// ── Forgot password — sends temp password via Resend ─────────────────────────
app.post("/api/send-shopping-list", async (req, res) => {
  const { email, name, categories, planDays } = req.body;
  if (!email || !categories) return res.status(400).json({ error: "Missing required fields" });

  // Build list in category order matching the app
  const listHtml = categories.map(cat => `
    <tr>
      <td colspan="2" style="padding:14px 0 4px; font-size:11px; font-weight:700; letter-spacing:0.08em; color:#8e8e93; text-transform:uppercase; border-top:1px solid #f0f0f0;">${cat.name}</td>
    </tr>
    ${cat.items.map(item => `
      <tr>
        <td style="padding:8px 0; font-size:14px; color:#1c1c1e; border-bottom:1px solid #f5f5f7;">• ${item.display}</td>
        <td style="padding:8px 0; font-size:13px; color:#8e8e93; text-align:right; border-bottom:1px solid #f5f5f7;">${item.amounts?.[0] || ""}</td>
      </tr>
    `).join("")}
  `).join("");

  const itemCount = categories.reduce((a,c)=>a+c.items.length,0);
  const html = `
    <!DOCTYPE html><html><body style="margin:0;padding:0;background:#f2f2f7;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;padding:24px 16px 0;">

      <!-- Header card with rounded corners -->
      <div style="background:linear-gradient(160deg,#0d1b2a 0%,#1a1a2e 40%,#16213e 70%,#0f3460 100%);padding:32px 32px 28px;border-radius:16px;">
        <img src="https://www.leanplan.uk/transparent-logo.png" alt="LeanPlan" style="height:40px;display:block;margin-bottom:24px;" />
        <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0 0 6px;letter-spacing:-0.3px;">🛒 Your Shopping List</h1>
        <p style="color:rgba(255,255,255,0.6);font-size:14px;margin:0;">${planDays}-day meal plan · ${itemCount} item${itemCount===1?"":"s"} to buy</p>
      </div>

      <!-- List body -->
      <div style="background:#ffffff;padding:24px 32px;border-radius:16px;margin-top:12px;">
        <table style="width:100%;border-collapse:collapse;">
          ${listHtml}
        </table>
      </div>

      <!-- Footer -->
      <div style="padding:20px 32px;text-align:center;">
        <p style="color:#8e8e93;font-size:12px;margin:0;">Generated by LeanPlan · <a href="https://www.leanplan.uk" style="color:#007aff;text-decoration:none;">leanplan.uk</a></p>
      </div>

    </div>
    </body></html>
  `;

  try {
    await resend.emails.send({
      from: "LeanPlan <hello@leanplan.uk>",
      to: email,
      subject: `Your ${planDays}-day shopping list 🛒`,
      html,
    });
    res.json({ success: true });
  } catch(err) {
    console.error("Send shopping list error:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

app.post("/api/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    // Check user exists
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const user = users?.find(u => u.email === email);

    // Always return success — don't reveal whether email exists
    if (!user) {
      console.log(`Forgot password: no account found for ${email}`);
      return res.json({ success: true });
    }

    // Generate a temp password
    const tempPassword = "LP-" + Math.random().toString(36).slice(2, 8).toUpperCase() + Math.floor(Math.random() * 100);

    // Set it on the account
    const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: tempPassword,
    });

    if (pwError) {
      console.error("Forgot password: failed to set temp password:", pwError.message);
      return res.status(500).json({ error: "Failed to reset password" });
    }

    // Send email via Resend
    const { error: emailError } = await resend.emails.send({
      from: "LeanPlan <hello@leanplan.uk>",
      to: email,
      subject: "Your LeanPlan temporary password",
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <tr><td align="center" style="padding-bottom:32px;">
          <span style="font-size:26px;font-weight:700;color:#ffffff;">Lean<span style="color:#3b82f6;">Plan</span></span>
        </td></tr>

        <tr><td style="background:#1a1a1a;border-radius:20px;padding:36px 32px;border:1px solid #2a2a2a;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#3b82f6;text-transform:uppercase;letter-spacing:1px;">Password Reset</p>
          <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#ffffff;line-height:1.3;">Your temporary password</h1>
          <p style="margin:0 0 24px;font-size:15px;color:#9ca3af;line-height:1.6;">
            Use this temporary password to sign in to LeanPlan. Once you're in, go to <strong style="color:#ffffff;">Profile → Change Password</strong> to set a new one.
          </p>

          <div style="background:#0a0a0a;border:1px solid #3b82f6;border-radius:12px;padding:20px 24px;margin-bottom:24px;text-align:center;">
            <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;">Temporary password</p>
            <p style="margin:0;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:3px;">${tempPassword}</p>
          </div>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <tr><td align="center">
              <a href="${APP_URL}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:16px 36px;border-radius:12px;">Open LeanPlan →</a>
            </td></tr>
          </table>

          <p style="margin:0;font-size:13px;color:#6b7280;text-align:center;">If you didn't request this, you can safely ignore this email.</p>
        </td></tr>

        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-size:12px;color:#4b5563;line-height:1.6;">
            LeanPlan · Manchester, UK<br>
            <a href="${APP_URL}" style="color:#3b82f6;text-decoration:none;">leanplan.uk</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });

    if (emailError) {
      console.error("Forgot password: email failed:", emailError.message);
      return res.status(500).json({ error: "Failed to send email" });
    }

    console.log(`Forgot password: temp password sent to ${email}`);
    res.json({ success: true });

  } catch (err) {
    console.error("Forgot password error:", err.message);
    res.status(500).json({ error: "Something went wrong" });
  }
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
  // Expand budget-friendly into concrete rules
  const styleFilter = (() => {
    if (style === "all") return "";
    if (style === "budget-friendly") return `BUDGET-FRIENDLY RULES (strict):
- Proteins: use ONLY eggs, chicken breast, chicken thighs, tinned tuna, tinned salmon, tinned beans, lentils, tofu. Absolutely NO salmon fillets, prawns, beef steak, lamb or any premium fish.
- Veg: prefer frozen veg (peas, mixed veg, spinach, broccoli) over fresh where possible. Fresh veg only if cheap (carrots, cabbage, onion, sweet potato, courgette).
- No premium ingredients: no pine nuts, no specialty cheese, no fresh herbs beyond basics, no pre-made sauces.
- Snacks must be simple and cheap: banana, apple, rice cakes with peanut butter, boiled eggs, tinned tuna.
- Batch cook maximally: every dinner should produce enough for next day's lunch.
- Use tinned tomatoes, tinned beans, dried lentils as base for multiple meals.`;
    return `Meal style: ${style}.`;
  })();

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
6. Do NOT use the same main protein source more than once on the same day. If chicken appears at lunch, dinner must use a different protein (eggs, fish, beans, lentils). Variety within a day is essential.
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

// ── Template Engine Helper ───────────────────────────────────────────────────
const buildMealTemplate = (profile, days, usesProteinPowder) => {
  const goal = profile?.goal || "lose_weight";
  const dietType = profile?.dietType || "omnivore";
  const dislikes = (profile?.dislikes || []).map(d => d.toLowerCase());
  const isGlutenFree = profile?.glutenPref === "gluten_free";
  const isDairyFree = profile?.dairyPref === "dairy_free";

  // Build available protein pool based on diet and dislikes
  const allProteins = {
    omnivore:    ["chicken breast", "eggs", "tinned tuna", "tinned salmon", "turkey mince", "lean beef mince", "cod"],
    pescatarian: ["eggs", "tinned tuna", "tinned salmon", "cod", "haddock", "king prawns"],
    vegetarian:  ["eggs", "halloumi", "cottage cheese", "lentils", "chickpeas", "tofu", "tempeh"],
    vegan:       ["tofu", "tempeh", "lentils", "chickpeas", "black beans", "kidney beans", "edamame"],
  };

  // For vegetarians who aren't dairy-free, add dairy proteins
  const isDairyFreeTemplate = profile?.dairyPref === "dairy_free";
  if (dietType === "vegetarian" && !isDairyFreeTemplate) {
    allProteins.vegetarian = ["eggs", "Greek yoghurt", "cottage cheese", "halloumi", "lentils", "chickpeas", "tofu"];
  }

  let proteins = (allProteins[dietType] || allProteins.omnivore).filter(p => {
    if (dislikes.includes("fish") && ["tinned tuna","tinned salmon","cod","haddock","king prawns","mackerel","salmon"].includes(p)) return false;
    if (dislikes.includes("oily fish") && ["tinned salmon","tinned tuna","mackerel","salmon"].includes(p)) return false;
    if (dislikes.includes("shellfish") && ["king prawns"].includes(p)) return false;
    if (dislikes.includes("pork") && ["pork"].includes(p)) return false;
    if (dislikes.includes("red meat") && ["lean beef mince","turkey mince"].includes(p)) return false;
    if (dislikes.includes("tofu") && p === "tofu") return false;
    if (dislikes.includes("cottage cheese") && p === "cottage cheese") return false;
    return true;
  });

  // Limit to max 3 proteins for ingredient efficiency
  const coreProteins = proteins.slice(0, 3);

  // Breakfast types — alternate to avoid repetition
  const breakfastTypes = isGlutenFree
    ? ["egg-based", "rice/quinoa-based", "egg-based", "smoothie-based", "egg-based", "rice/quinoa-based", "egg-based"]
    : ["egg-based", "oat-based", "egg-based", "oat-based", "egg-based", "oat-based", "egg-based"];

  // Snack types — alternate protein shake with fruit snack
  const morningSnacks = usesProteinPowder
    ? ["protein shake", "fruit + nuts", "protein shake", "fruit + nuts", "protein shake", "fruit + nuts", "protein shake"]
    : ["fruit + nuts", "fruit + yoghurt", "fruit + nuts", "fruit + yoghurt", "fruit + nuts", "fruit + yoghurt", "fruit + nuts"];
  const afternoonSnacks = usesProteinPowder
    ? ["fruit + nuts", "protein shake", "fruit + nuts", "protein shake", "fruit + nuts", "protein shake", "fruit + nuts"]
    : ["fruit + yoghurt", "fruit + nuts", "fruit + yoghurt", "fruit + nuts", "fruit + yoghurt", "fruit + nuts", "fruit + yoghurt"];

  // Build day templates
  const template = [];
  for (let i = 0; i < days; i++) {
    const dinnerProtein = coreProteins[i % coreProteins.length];
    const prevDinnerProtein = i > 0 ? coreProteins[(i-1) % coreProteins.length] : null;

    // Lunch: day 0 uses fresh protein, day 1+ uses leftovers from previous dinner
    const lunchType = i === 0
      ? `fresh meal using ${coreProteins[(i+1) % coreProteins.length]} (different protein to dinner)`
      : `leftover assembly using ${prevDinnerProtein} from previous night's dinner — quick 5-min assembly, no cooking needed`;

    template.push({
      dayIndex: i,
      breakfast: breakfastTypes[i % breakfastTypes.length],
      morningSnack: morningSnacks[i % morningSnacks.length],
      lunch: lunchType,
      afternoonSnack: afternoonSnacks[i % afternoonSnacks.length],
      dinner: `${dinnerProtein} — cook double portion for tomorrow's lunch`,
    });
  }

  return { template, coreProteins };
};

// ── Path B: Template-based multi-day meal plan ────────────────────────────────
app.post("/api/generate-meal-plan-v2", async (req, res) => {
  const { profile, dislikedMealNames = [], style = "all", days = 5 } = req.body;

  // ── Calculate TDEE & targets ───────────────────────────────────────────────
  const calcTDEE = (p) => {
    if (!p?.heightCm || !p?.startWeightLbs || !p?.age) return null;
    const weightKg = p.startWeightLbs * 0.453592;
    const bmr = p.sex === "female"
      ? (10 * weightKg) + (6.25 * parseFloat(p.heightCm)) - (5 * parseFloat(p.age)) - 161
      : (10 * weightKg) + (6.25 * parseFloat(p.heightCm)) - (5 * parseFloat(p.age)) + 5;
    const activityMult = { 2:1.375, 3:1.55, 4:1.725, 5:1.9 }[p.workoutsPerWeek] || 1.55;
    return Math.round(bmr * activityMult);
  };

  const tdee = calcTDEE(profile);
  const goal = profile?.goal || "lose_weight";
  const weightKg = profile?.startWeightLbs ? profile.startWeightLbs * 0.453592 : null;
  const paceDeficits = { slow:275, normal:500, fast:750, vfast:1000 };
  const deficit = paceDeficits[profile?.paceId] || 500;

  let dailyCalTarget = 1700;
  if (tdee) {
    if (goal === "lose_weight") dailyCalTarget = Math.max(1200, tdee - deficit);
    else if (goal === "build_muscle") dailyCalTarget = tdee + 300;
    else if (goal === "get_fitter") dailyCalTarget = tdee - 150;
    else dailyCalTarget = Math.max(1400, tdee - (profile?.paceId ? deficit : 200));
  }

  // Over-50s need more protein to prevent muscle loss (sarcopenia)
  const ageNum = parseFloat(profile?.age) || 0;
  const proteinMultiplier = ageNum >= 50
    ? (goal === "build_muscle" ? 2.2 : 2.4)
    : (goal === "build_muscle" ? 2.0 : 2.2);
  const dailyProteinTarget = weightKg ? Math.round(weightKg * proteinMultiplier) : 130;

  const isGlutenFree = profile?.glutenPref === "gluten_free";
  const isDairyFree = profile?.dairyPref === "dairy_free";
  const usesProteinPowder = profile?.supplementsInterested?.includes("protein") || false;
  const usesCreatine = profile?.supplementsInterested?.includes("creatine") || false;
  const cookTime = { quick:"15 minutes max", moderate:"30 minutes", enjoy:"up to 60 minutes" }[profile?.cookingTime] || "30 minutes";
  const isLactoseFree = profile?.dairyPref === "lactose_free";
  const milkType = profile?.milkAlt
    ? `${profile.milkAlt} milk`
    : isDairyFree ? "soya or oat milk"
    : isLactoseFree ? "lactose-free milk or oat milk"
    : "milk";
  const safeCarbs = isGlutenFree
    ? "rice, quinoa, buckwheat, sweet potato, rice cakes, corn tortillas"
    : "oats, rice, quinoa, sweet potato, wholegrain bread";

  const dietaryHardRules = [
    isGlutenFree ? "⛔ GLUTEN-FREE: No wheat, barley, rye, regular oats, bread, pasta, flour, couscous, soy sauce. Use rice, quinoa, sweet potato, tamari." : "",
    isDairyFree ? `⛔ DAIRY-FREE: No milk, cheese, butter, cream, yoghurt, whey. Use coconut yoghurt, ${milkType}.` : "",
    isLactoseFree ? `⛔ LACTOSE-FREE: No regular milk, soft cheese, cream, ice cream. Use ${milkType}, hard cheese (cheddar, parmesan are naturally low-lactose), lactose-free yoghurt. Butter is generally ok.` : "",
    profile?.allergies?.length > 0 ? `⛔ ALLERGIES — exclude completely: ${profile.allergies.join(", ")}` : "",
    profile?.dislikes?.length > 0 ? `⛔ DISLIKES — never include: ${profile.dislikes.join(", ")}` : "",
  ].filter(Boolean).join("\n");

  // Age-specific guidance
  const age = parseFloat(profile?.age) || 0;
  const ageGuidance = (() => {
    const likesOilyFish = !profile?.dislikes?.some(d => ["oily fish","fish","salmon","tuna"].includes(d.toLowerCase()));
    if (age >= 50) return `AGE-SPECIFIC GUIDANCE (${age} years old):
- Higher protein is critical at this age to prevent muscle loss — prioritise protein at every meal
- Smaller, more frequent meals are better tolerated than large ones
- Include anti-inflammatory foods: ${likesOilyFish ? "oily fish, " : ""}berries, leafy greens, olive oil
- Calcium-rich foods important for bone density: ${likesOilyFish ? "sardines, " : ""}leafy greens, fortified alternatives
- Creatine is especially beneficial over 50 — include a note if creatine is being used
- Avoid very high-fibre meals in one sitting — can cause discomfort`;
    if (age >= 40) return `AGE-SPECIFIC GUIDANCE (${age} years old):
- Protein needs are increasing — aim for protein at every meal
- Include anti-inflammatory foods regularly: berries, ${likesOilyFish ? "oily fish, " : ""}leafy greens
- Metabolism is slowing — calorie targets are more important to stick to`;
    return "";
  })();

  // Budget-friendly style rules
  const budgetRules = style === "budget-friendly" ? `
BUDGET: Use only eggs, chicken breast/thighs, tinned tuna, tinned beans, lentils as proteins.
Prefer frozen veg. No premium ingredients. Simple cheap snacks (banana, apple, rice cakes).` : "";

  // Generate date keys
  const dateKeys = Array.from({length: days}, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  // ── Build template ─────────────────────────────────────────────────────────
  const { template, coreProteins } = buildMealTemplate(profile, days, usesProteinPowder);

  console.log(`Plan v2 — TDEE:${tdee} Target:${dailyCalTarget}cal Protein:${dailyProteinTarget}g Proteins:[${coreProteins.join(", ")}]`);

  // ── Generate each day in parallel ─────────────────────────────────────────
  const generateDay = async (dayTemplate, dateKey, previousMeals) => {
    const calBreakfast = Math.round(dailyCalTarget * 0.25);
    const calSnack = Math.round(dailyCalTarget * 0.10);
    const calLunch = Math.round(dailyCalTarget * 0.25);
    const calDinner = Math.round(dailyCalTarget * 0.30);

    const isLeftoverLunch = dayTemplate.dayIndex > 0;
    const prevDinnerName = previousMeals?.dinner?.name || null;

    const prompt = `Generate exactly 5 meals for ONE day of a meal plan. Return ONLY valid JSON, no other text.

PROFILE:
- Goal: ${goal.replace(/_/g," ")}
- Diet: ${profile?.dietType || "omnivore"}, ${isDairyFree ? `dairy-free (use ${milkType})` : "dairy ok"}, ${isGlutenFree ? "gluten-free" : "gluten ok"}
- Cooking time: ${cookTime}
- Milk: ${milkType}
${dietaryHardRules ? `
HARD DIETARY RULES:
${dietaryHardRules}` : ""}
${ageGuidance ? `
${ageGuidance}
` : ""}${budgetRules}

TODAY'S MEAL TEMPLATE (follow this exactly):
1. BREAKFAST (~${calBreakfast} cal): ${dayTemplate.breakfast}
2. MORNING SNACK (~${calSnack} cal): ${dayTemplate.morningSnack}${usesProteinPowder && dayTemplate.morningSnack.includes("protein shake") ? ` — use pea/soya protein powder with ${milkType}` : ""}
3. LUNCH (~${calLunch} cal): ${isLeftoverLunch ? `LEFTOVER ASSEMBLY — use leftover ${dayTemplate.lunch.split("using ")[1]?.split(" from")[0] || "protein"} from yesterday's dinner${prevDinnerName ? ` (the dinner was: ${prevDinnerName})` : ""}. Quick 5-minute assembly, no cooking. Name the meal something like "Leftover [X] [preparation style]".` : dayTemplate.lunch}
4. AFTERNOON SNACK (~${calSnack} cal): ${dayTemplate.afternoonSnack}${usesProteinPowder && dayTemplate.afternoonSnack.includes("protein shake") ? ` — use pea/soya protein powder with ${milkType}` : ""}
5. DINNER (~${calDinner} cal): ${dayTemplate.dinner}${usesCreatine ? " — add a note in method to stir 5g creatine into this meal or a yoghurt afterwards" : ""}

DAILY TARGETS:
- Total calories: ${dailyCalTarget} (meals should sum to this ±5%)
- Total protein: ${dailyProteinTarget}g minimum
- Carbs: ${safeCarbs}

RULES:
- ALL ingredients from UK supermarkets (Tesco, Sainsbury's, Asda)
- Do NOT use: ${dislikedMealNames.length > 0 ? dislikedMealNames.join(", ") : "none"}
- Snacks MUST contain fruit (banana, berries, apple, orange) unless it's a protein shake
- Use simple whole foods — no exotic ingredients
- The dinner protein (${dayTemplate.dinner.split(" —")[0]}) must NOT appear in breakfast or lunch

Return this JSON:
{
  "meals": [
    {
      "id": "ai_${dateKey.replace(/-/g,"")}_[slot]",
      "name": "Meal Name",
      "type": "breakfast|snack|lunch|dinner",
      "time": "8:00 AM",
      "cals": 400,
      "protein": 30,
      "carbs": 35,
      "fat": 12,
      "items": ["ingredient (amount)"],
      "method": "Instructions",
      "tags": ["gf", "df"]
    }
  ]
}`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0]?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    if (!parsed.meals || parsed.meals.length !== 5) throw new Error(`Day ${dateKey}: invalid meal count`);
    return { date: dateKey, meals: parsed.meals };
  };

  try {
    // Generate all days in parallel
    const dayPromises = template.map((dayTemplate, i) => {
      return generateDay(dayTemplate, dateKeys[i], i > 0 ? null : null);
    });

    const results = await Promise.all(dayPromises);

    // Now fix leftover lunches — pass actual previous dinner name
    const finalDays = [];
    for (let i = 0; i < results.length; i++) {
      if (i === 0) {
        finalDays.push(results[i]);
      } else {
        const prevDinner = finalDays[i-1]?.meals?.find(m => m.type === "dinner");
        if (prevDinner && template[i].dayIndex > 0) {
          // Regenerate just this day with the actual previous dinner name
          const fixed = await generateDay(template[i], dateKeys[i], { dinner: prevDinner });
          finalDays.push(fixed);
        } else {
          finalDays.push(results[i]);
        }
      }
    }

    res.json({ days: finalDays, coreProteins, dailyCalTarget, dailyProteinTarget });

  } catch (err) {
    console.error("Meal plan v2 error:", err.message);
    res.status(500).json({ error: "Failed to generate meal plan: " + err.message });
  }
});

// ── Chat endpoint ─────────────────────────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  const { messages, profile, context } = req.body;
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

  // Build live context section
  const contextSection = context ? `
LIVE CONTEXT (use this to give specific, timely advice):
- Today: ${context.todayDate} (${context.todayDayName})
- Today is a: ${context.isTrainingDay ? "TRAINING DAY" : "REST DAY"}${context.todaySessionType ? ` — ${context.todaySessionType} scheduled` : ""}
- Calories today: ${context.todayCaloriesLogged} logged / ${context.dailyCalTarget} target${context.todayCaloriesLogged > 0 ? ` (${context.dailyCalTarget - context.todayCaloriesLogged > 0 ? context.dailyCalTarget - context.todayCaloriesLogged + " remaining" : "over target by " + (context.todayCaloriesLogged - context.dailyCalTarget)})` : " — nothing logged yet"}
- Protein today: ${context.todayProteinLogged}g logged / ${context.dailyProteinTarget}g target
- Workouts this week: ${context.workoutsThisWeek} done / ${context.workoutsPerWeekTarget} target
- Last workout: ${context.lastWorkoutDate || "none recorded"}
- Days since last workout: ${context.daysSinceLastWorkout !== null ? context.daysSinceLastWorkout : "unknown"}
- Current weight: ${context.currentWeightKg ? context.currentWeightKg + "kg" : "not logged"}
- Start weight: ${context.startWeightKg ? context.startWeightKg + "kg" : "unknown"}
- Weight lost so far: ${context.weightLostKg !== null ? context.weightLostKg + "kg" : "unknown"}
- Weeks into programme: ${context.weeksIntoProgramme || 0}
- Meal plan: ${context.hasMealPlan ? `${context.mealPlanDays}-day plan generated on ${context.mealPlanDate}` : "no plan generated yet"}
- Today's planned meals: ${context.todayMealNames?.length > 0 ? context.todayMealNames.join(", ") : "no meals planned for today"}
- Core proteins in plan: ${context.coreProteins?.join(", ") || "not available"}` : "";

  const systemPrompt = `You are a friendly, knowledgeable personal health coach built into LeanPlan, a fitness and nutrition app.

The user's profile:
- Name: ${profile?.name || "there"}
- Age: ${profile?.age || "unknown"}
- Sex: ${profile?.sex || "not specified"}
- Goal: ${profile?.goal?.replace(/_/g, " ") || "lose weight"}
- Target: Lose ${profile?.targetLbs ? (profile.targetLbs * 0.453592).toFixed(1) : "?"} kg at ${profile?.paceId || "moderate"} pace
- Fitness level: ${profile?.fitnessLevel || "beginner"}
- Workouts/week: ${profile?.workoutsPerWeek || 3}
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
${contextSection}

Your role:
1. Answer health, fitness, nutrition and wellbeing questions helpfully and specifically to this person
2. Use the LIVE CONTEXT to give timely, specific advice — reference what they've eaten today, how many workouts they've done, their progress
3. If they're behind on workouts, gently encourage them. If they're under calories, flag it. If they've made great progress, acknowledge it.
4. Tailor advice to their equipment, injuries, diet type and fitness level
5. When the user mentions a NEW food dislike, include: ACTION:{"type":"add_dislike","value":"food name"}
6. When they mention a NEW pain or injury, include: ACTION:{"type":"add_pain","value":"description"}
7. When they mention an allergy, include: ACTION:{"type":"add_allergy","value":"allergen name"}
8. When they want to remove a dislike, include: ACTION:{"type":"remove_dislike","value":"food name"}

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

// ── Trial reminder cron endpoint ─────────────────────────────────────────────
// Called daily by Railway cron job
app.post("/api/send-trial-reminders", async (req, res) => {
  // Simple security check — Railway cron sends a secret header
  const secret = req.headers["x-cron-secret"];
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorised" });
  }

  try {
    // Find all users who:
    // - Started trial 5 days ago (between 5.0 and 5.99 days ago)
    // - Are not pro
    // - Haven't been sent a reminder yet
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();

    const { data: users, error } = await supabaseAdmin
      .from("profiles")
      .select("id, email, trial_start, is_pro, reminder_sent")
      .eq("is_pro", false)
      .eq("reminder_sent", false)
      .gte("trial_start", sixDaysAgo)
      .lte("trial_start", fiveDaysAgo);

    if (error) {
      console.error("Trial reminder query error:", error.message);
      return res.status(500).json({ error: "Database query failed" });
    }

    console.log(`Trial reminders: found ${users?.length || 0} users to remind`);

    let sent = 0;
    for (const user of (users || [])) {
      if (!user.email) continue;

      // Send reminder email
      const { error: emailError } = await resend.emails.send({
        from: "LeanPlan <hello@leanplan.uk>",
        to: user.email,
        subject: "Your LeanPlan trial ends in 2 days 🏃",
        html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Header image -->
        <tr><td style="border-radius:20px 20px 0 0;overflow:hidden;position:relative;">
          <div style="position:relative;">
            <img src="https://www.leanplan.uk/email-header.png" alt="LeanPlan" width="560" style="width:100%;display:block;height:260px;object-fit:cover;object-position:center top;" />
            <div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,0.3),rgba(10,10,10,0.85));"></div>
            <div style="position:absolute;top:0;left:0;right:0;bottom:0;padding:24px 32px;display:flex;flex-direction:column;justify-content:space-between;">
              <div>
                <span style="font-size:20px;font-weight:700;color:#ffffff;">Lean<span style="color:#3b82f6;">Plan</span></span>
              </div>
              <div>
                <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#ff9f0a;text-transform:uppercase;letter-spacing:1.5px;">2 days left</p>
                <h1 style="margin:0 0 6px;font-size:26px;font-weight:800;color:#ffffff;line-height:1.2;">Don't lose your plan</h1>
                <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.75);">Your body. Your plan. Your results.</p>
              </div>
            </div>
          </div>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#1a1a1a;padding:36px 32px;border:1px solid #2a2a2a;border-top:none;border-radius:0 0 20px 20px;">

          <p style="margin:0 0 24px;font-size:15px;color:#9ca3af;line-height:1.7;">
            You've already done the hard part — you've set your goal, built your plan and started your journey. <strong style="color:#ffffff;">LeanPlan Pro keeps everything working for you:</strong> AI-generated meals tailored to your diet, a 16-week progressive workout programme that adapts to your equipment and injuries, calorie and macro tracking, smart shopping lists, and an AI coach available whenever you need a nudge. Cancel anytime — but most people find they don't want to.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
            <tr><td align="center">
              <a href="${APP_URL}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 40px;border-radius:12px;">Subscribe Now — from £4.99/mo →</a>
            </td></tr>
          </table>

          <div style="border-top:1px solid #2a2a2a;margin-bottom:28px;"></div>

          <p style="margin:0 0 16px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Everything you'll keep</p>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:8px 8px 8px 0;width:50%;vertical-align:top;">
                <p style="margin:0;font-size:14px;font-weight:600;color:#ffffff;">✅ &nbsp;Personalised meal plans</p>
                <p style="margin:2px 0 0 24px;font-size:12px;color:#6b7280;">GF, dairy-free &amp; allergy aware</p>
              </td>
              <td style="padding:8px 0 8px 8px;width:50%;vertical-align:top;">
                <p style="margin:0;font-size:14px;font-weight:600;color:#ffffff;">✅ &nbsp;16-week programme</p>
                <p style="margin:2px 0 0 24px;font-size:12px;color:#6b7280;">Injury &amp; equipment aware</p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 8px 8px 0;vertical-align:top;">
                <p style="margin:0;font-size:14px;font-weight:600;color:#ffffff;">✅ &nbsp;AI nutrition coach</p>
                <p style="margin:2px 0 0 24px;font-size:12px;color:#6b7280;">Available 24/7</p>
              </td>
              <td style="padding:8px 0 8px 8px;vertical-align:top;">
                <p style="margin:0;font-size:14px;font-weight:600;color:#ffffff;">✅ &nbsp;Calorie &amp; macro tracking</p>
                <p style="margin:2px 0 0 24px;font-size:12px;color:#6b7280;">Daily progress at a glance</p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 8px 8px 0;vertical-align:top;">
                <p style="margin:0;font-size:14px;font-weight:600;color:#ffffff;">✅ &nbsp;Smart shopping list</p>
                <p style="margin:2px 0 0 24px;font-size:12px;color:#6b7280;">With pantry tracking</p>
              </td>
              <td style="padding:8px 0 8px 8px;vertical-align:top;">
                <p style="margin:0;font-size:14px;font-weight:600;color:#ffffff;">✅ &nbsp;Training day carb cycling</p>
                <p style="margin:2px 0 0 24px;font-size:12px;color:#6b7280;">Optimised for your goal</p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 8px 8px 0;vertical-align:top;">
                <p style="margin:0;font-size:14px;font-weight:600;color:#ffffff;">✅ &nbsp;Progress tracking</p>
                <p style="margin:2px 0 0 24px;font-size:12px;color:#6b7280;">Weight, measurements &amp; lifts</p>
              </td>
              <td style="padding:8px 0 8px 8px;vertical-align:top;">
                <p style="margin:0;font-size:14px;font-weight:600;color:#ffffff;">✅ &nbsp;Calorie-neutral meal swaps</p>
                <p style="margin:2px 0 0 24px;font-size:12px;color:#6b7280;">Same calories, different meal</p>
              </td>
            </tr>
          </table>

        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-size:12px;color:#4b5563;line-height:1.6;">
            LeanPlan · Manchester, UK<br>
            <a href="${APP_URL}" style="color:#3b82f6;text-decoration:none;">leanplan.uk</a> · Cancel anytime
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
      });

      if (emailError) {
        console.error(`Trial reminder: failed to send to ${user.email}:`, emailError.message);
      } else {
        // Mark reminder as sent
        await supabaseAdmin
          .from("profiles")
          .update({ reminder_sent: true })
          .eq("id", user.id);
        sent++;
        console.log(`Trial reminder sent to ${user.email}`);
      }
    }

    res.json({ success: true, sent, total: users?.length || 0 });
  } catch (err) {
    console.error("Trial reminder error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`LeanPlan server running on port ${PORT}`);
});

// ── Core ingredient selector ──────────────────────────────────────────────────
const selectCoreIngredients = (profile) => {
  const dietType = profile?.dietType || "omnivore";
  const isGF = profile?.glutenPref === "gluten_free";
  const isDF = profile?.dairyPref === "dairy_free";
  const isLF = profile?.dairyPref === "lactose_free";
  const dislikes = (profile?.dislikes || []).map(d => d.toLowerCase());
  const age = parseFloat(profile?.age) || 0;
  const style = profile?.mealStyle || "all";
  const usesProtein = profile?.supplementsInterested?.includes("protein") || false;

  // Proteins by diet type
  const proteinPools = {
    omnivore:    ["chicken breast", "eggs", "tinned tuna", "lean beef mince", "tinned salmon"],
    pescatarian: ["eggs", "tinned tuna", "tinned salmon", "cod fillet"],
    vegetarian:  ["eggs", "Greek yoghurt", "cottage cheese", "halloumi", "lentils", "chickpeas"],
    vegan:       ["tofu", "lentils", "chickpeas", "black beans", "edamame", "tempeh"],
  };

  // Filter proteins by dislikes
  let proteins = (proteinPools[dietType] || proteinPools.omnivore).filter(p => {
    if (dislikes.some(d => p.includes(d))) return false;
    if (dislikes.includes("fish") && ["tinned tuna","tinned salmon","cod fillet"].includes(p)) return false;
    if (dislikes.includes("oily fish") && ["tinned tuna","tinned salmon"].includes(p)) return false;
    if (dislikes.includes("red meat") && p === "lean beef mince") return false;
    return true;
  }).slice(0, 3);

  // Carbs
  const carbs = isGF
    ? ["brown rice", "sweet potato", "quinoa", "rice cakes"]
    : ["brown rice", "sweet potato", "oats", "wholegrain bread", "quinoa"];

  // Veg — age 50+ includes anti-inflammatory options
  const veg = age >= 50
    ? ["broccoli", "spinach", "frozen peas", "courgette", "kale", "sweet pepper"]
    : ["broccoli", "spinach", "frozen peas", "courgette", "sweet pepper", "carrot"];

  // Fruit
  const fruit = ["banana", "berries", "apple", "orange"];

  // Dairy/alternatives
  const dairy = isDF
    ? ["coconut yoghurt"]
    : isLF
    ? ["lactose-free yoghurt", "hard cheese"]
    : ["Greek yoghurt"];

  // Base pantry
  const base = isGF
    ? ["tinned tomatoes", "tinned chickpeas", "olive oil", "tamari", "garlic", "onion"]
    : ["tinned tomatoes", "tinned chickpeas", "olive oil", "tamari", "garlic", "onion"];

  // Supplements
  const extras = usesProtein ? ["pea protein powder"] : [];

  return { proteins, carbs, veg, fruit, dairy, base, extras };
};

// ── Calculate per-slot targets ────────────────────────────────────────────────
const calcSlotTargets = (dailyCal, dailyProtein, isTrainingDay) => {
  // Add 40g carbs on training days (replace some fat)
  const carbBoost = isTrainingDay ? 40 : 0;

  const cal = {
    breakfast:      Math.round(dailyCal * 0.25),
    morningSnack:   Math.round(dailyCal * 0.10),
    lunch:          Math.round(dailyCal * 0.25),
    afternoonSnack: Math.round(dailyCal * 0.10),
    dinner:         Math.round(dailyCal * 0.30),
  };
  const protein = {
    breakfast:      Math.round(dailyProtein * 0.25),
    morningSnack:   Math.round(dailyProtein * 0.12),
    lunch:          Math.round(dailyProtein * 0.25),
    afternoonSnack: Math.round(dailyProtein * 0.13),
    dinner:         Math.round(dailyProtein * 0.25),
  };
  const carbs = {
    breakfast:      45 + (isTrainingDay ? 15 : 0),
    morningSnack:   15,
    lunch:          40 + (isTrainingDay ? 15 : 0),
    afternoonSnack: 15,
    dinner:         35 + (isTrainingDay ? 10 : 0),
  };
  return { cal, protein, carbs, isTrainingDay };
};

// ── Meal image fetcher (Pexels API + Supabase cache) ────────────────────────
const fetchMealImage = async (mealName) => {
  try {
    const { data } = await supabaseAdmin
      .from("meal_images")
      .select("image_url")
      .eq("meal_name", mealName.toLowerCase().trim())
      .single();
    if (data?.image_url) return data.image_url;

    const query = encodeURIComponent(mealName);
    const r = await fetch(`https://api.pexels.com/v1/search?query=${query}&per_page=1&orientation=landscape`, {
      headers: { Authorization: process.env.PEXELS_API_KEY }
    });
    const json = await r.json();
    const url = json.photos?.[0]?.src?.medium || null;

    if (url) {
      await supabaseAdmin.from("meal_images").upsert({
        meal_name: mealName.toLowerCase().trim(),
        image_url: url,
      });
    }
    return url;
  } catch (err) {
    console.error("fetchMealImage error:", err.message);
    return null;
  }
};

// ── Path C: Guided ingredient-first meal plan ─────────────────────────────────
app.post("/api/generate-meal-plan-v3", async (req, res) => {
  const { profile, days = 5 } = req.body;

  // ── TDEE & targets ────────────────────────────────────────────────────────
  const calcTDEE = (p) => {
    if (!p?.heightCm || !p?.startWeightLbs || !p?.age) return null;
    const weightKg = p.startWeightLbs * 0.453592;
    const bmr = p.sex === "female"
      ? (10 * weightKg) + (6.25 * parseFloat(p.heightCm)) - (5 * parseFloat(p.age)) - 161
      : (10 * weightKg) + (6.25 * parseFloat(p.heightCm)) - (5 * parseFloat(p.age)) + 5;
    // Combined activity multiplier: workouts + lifestyle
    const workoutMult = { 2:1.2, 3:1.375, 4:1.55, 5:1.725 }[p.workoutsPerWeek] || 1.375;
    const lifestyleMult = { sedentary:0, light:0.05, moderate:0.1, very:0.175 }[p.activityLevel||"moderate"] || 0.1;
    return Math.round(bmr * (workoutMult + lifestyleMult));
  };

  const tdee = calcTDEE(profile);
  if (!tdee) return res.status(400).json({ error: "incomplete_profile", message: "Please complete your profile (height, weight, age) before generating a meal plan." });

  const goal = profile?.goal || "lose_weight";
  const weightKg = profile.startWeightLbs * 0.453592;
  const ageNum = parseFloat(profile?.age) || 0;
  const paceDeficits = { slow:275, normal:500, fast:750, vfast:1000 };
  const deficit = paceDeficits[profile?.paceId] || 500;

  let dailyCalTarget;
  if (goal === "lose_weight") dailyCalTarget = Math.max(1200, tdee - deficit);
  else if (goal === "build_muscle") dailyCalTarget = tdee + 300;
  else if (goal === "get_fitter") dailyCalTarget = tdee - 150;
  else dailyCalTarget = Math.max(1400, tdee - deficit);

  const proteinMult = ageNum >= 50 ? 2.4 : 2.2;
  const dailyProteinTarget = Math.round(weightKg * proteinMult);

  // Dietary flags
  const isGF = profile?.glutenPref === "gluten_free";
  const isDF = profile?.dairyPref === "dairy_free";
  const isLF = profile?.dairyPref === "lactose_free";
  const milkType = profile?.milkAlt ? `${profile.milkAlt} milk` : isDF ? "oat milk" : isLF ? "lactose-free milk" : "milk";
  const cookTime = { quick:"15 minutes max", moderate:"30 minutes", enjoy:"up to 60 minutes" }[profile?.cookingTime] || "30 minutes";
  const usesCreatine = profile?.supplementsInterested?.includes("creatine") || false;
  const usesProteinPowder = profile?.supplementsInterested?.includes("protein") || false;

  // Hard dietary rules
  const hardRules = [
    isGF ? "⛔ GLUTEN-FREE: No wheat, barley, rye, regular oats, bread, pasta, flour, soy sauce. Use tamari." : "",
    isDF ? `⛔ DAIRY-FREE: No milk, cheese, butter, cream, yoghurt. Use coconut yoghurt, ${milkType}.` : "",
    isLF ? `⛔ LACTOSE-FREE: Use ${milkType}, hard cheese ok, lactose-free yoghurt.` : "",
    (profile?.allergies?.length > 0) ? `⛔ ALLERGIES — never include: ${profile.allergies.join(", ")}` : "",
    (profile?.dislikes?.length > 0) ? `⛔ DISLIKES — never include: ${profile.dislikes.join(", ")}` : "",
  ].filter(Boolean).join("\n");

  // Age guidance
  const ageGuidance = ageNum >= 50
    ? `AGE ${ageNum}: Higher protein every meal. Anti-inflammatory foods (oily fish, berries, leafy greens). Calcium-rich foods. Avoid very high-fibre meals in one sitting.`
    : ageNum >= 40 ? `AGE ${ageNum}: Protein every meal. Include anti-inflammatory foods regularly.` : "";

  // Select core ingredients
  const ingredients = selectCoreIngredients(profile);
  const ingredientList = [
    ...ingredients.proteins,
    ...ingredients.carbs,
    ...ingredients.veg,
    ...ingredients.fruit,
    ...ingredients.dairy,
    ...ingredients.base,
    ...ingredients.extras,
  ].join(", ");

  // Training day detection — distribute evenly across plan
  const trainDays = profile?.workoutsPerWeek || 3;
  const trainingDayIndices = (() => {
    if (trainDays >= days) return new Set(Array.from({length:days},(_,i)=>i));
    const indices = new Set();
    for (let i = 0; i < trainDays; i++) {
      indices.add(Math.min(Math.round(i * days / trainDays), days - 1));
    }
    return indices;
  })();
  const isTrainingDay = (dayIndex) => trainingDayIndices.has(dayIndex);

  // Generate date keys
  const dateKeys = Array.from({length: days}, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  // Build template (same as v2 but with ingredient awareness)
  const { template, coreProteins } = (() => {
    const proteins = ingredients.proteins;
    const breakfastTypes = isGF
      ? ["egg-based", "rice/quinoa-based", "egg-based", "smoothie-based", "egg-based", "rice/quinoa-based", "egg-based"]
      : ["egg-based", "oat-based", "egg-based", "oat-based", "egg-based", "oat-based", "egg-based"];
    const morningSnacks = usesProteinPowder
      ? ["protein shake", "fruit + nuts", "protein shake", "fruit + nuts", "protein shake", "fruit + nuts", "protein shake"]
      : ["fruit + yoghurt", "fruit + nuts", "fruit + yoghurt", "fruit + nuts", "fruit + yoghurt", "fruit + nuts", "fruit + yoghurt"];
    const afternoonSnacks = usesProteinPowder
      ? ["fruit + nuts", "protein shake", "fruit + nuts", "protein shake", "fruit + nuts", "protein shake", "fruit + nuts"]
      : ["fruit + nuts", "fruit + yoghurt", "fruit + nuts", "fruit + yoghurt", "fruit + nuts", "fruit + yoghurt", "fruit + nuts"];
    const tmpl = [];
    for (let i = 0; i < days; i++) {
      const dinnerProtein = proteins[i % proteins.length];
      const prevDinnerProtein = i > 0 ? proteins[(i-1) % proteins.length] : null;
      const lunchType = i === 0
        ? `fresh meal using ${proteins[(i+1) % proteins.length]}`
        : `leftover assembly using ${prevDinnerProtein} from yesterday's dinner — quick 5-min, no cooking`;
      tmpl.push({ dayIndex: i, breakfast: breakfastTypes[i % breakfastTypes.length], morningSnack: morningSnacks[i % morningSnacks.length], lunch: lunchType, afternoonSnack: afternoonSnacks[i % afternoonSnacks.length], dinner: `${dinnerProtein} — cook double portion for tomorrow's lunch` });
    }
    return { template: tmpl, coreProteins: proteins };
  })();

  console.log(`Plan v3 — TDEE:${tdee} Cal:${dailyCalTarget} Protein:${dailyProteinTarget}g Goal:${goal} Ingredients:[${ingredientList.slice(0,60)}...]`);

  // Generate each day
  const generateDay = async (dayTemplate, dateKey, prevDinner) => {
    const training = isTrainingDay(dayTemplate.dayIndex);
    const targets = calcSlotTargets(dailyCalTarget, dailyProteinTarget, training);
    const isLeftover = dayTemplate.dayIndex > 0;

    const prompt = `Generate exactly 5 meals for ONE day. Return ONLY valid JSON.

PERSON: ${ageNum}yo ${profile?.sex||"adult"}, goal: ${goal.replace(/_/g," ")}, ${isDF?"dairy-free":isLF?"lactose-free":"dairy ok"}, ${isGF?"gluten-free":"gluten ok"}
TODAY: ${training ? "TRAINING DAY — slightly higher carbs" : "REST DAY — standard targets"}
COOKING TIME: ${cookTime}
MILK: ${milkType}

${hardRules ? `HARD RULES (never break):\n${hardRules}\n` : ""}${ageGuidance ? `${ageGuidance}\n` : ""}
CORE INGREDIENTS (build meals from these — use all of them across the day, do not add exotic ingredients):
${ingredientList}

MEAL SLOTS — hit these targets precisely:
1. BREAKFAST (~${targets.cal.breakfast}cal, ~${targets.protein.breakfast}g protein, ~${targets.carbs.breakfast}g carbs): ${dayTemplate.breakfast}
2. MORNING SNACK (~${targets.cal.morningSnack}cal, ~${targets.protein.morningSnack}g protein): ${dayTemplate.morningSnack}${usesProteinPowder && dayTemplate.morningSnack.includes("shake") ? ` — pea protein powder with ${milkType}` : ""}
3. LUNCH (~${targets.cal.lunch}cal, ~${targets.protein.lunch}g protein, ~${targets.carbs.lunch}g carbs): ${isLeftover ? `LEFTOVER ASSEMBLY — use leftover ${dayTemplate.lunch.split("using ")[1]?.split(" from")[0]||"protein"} from yesterday${prevDinner ? ` (last night: ${prevDinner})` : ""}. Quick 5-min, no cooking. Name it "Leftover [X] [style]".` : dayTemplate.lunch}
4. AFTERNOON SNACK (~${targets.cal.afternoonSnack}cal, ~${targets.protein.afternoonSnack}g protein): ${dayTemplate.afternoonSnack}${usesProteinPowder && dayTemplate.afternoonSnack.includes("shake") ? ` — pea protein powder with ${milkType}` : ""}
5. DINNER (~${targets.cal.dinner}cal, ~${targets.protein.dinner}g protein, ~${targets.carbs.dinner}g carbs): ${dayTemplate.dinner}${usesCreatine ? " — note in method: stir 5g creatine into yoghurt or shake after this meal" : ""}

DAILY TOTALS: ~${dailyCalTarget} cal total, ~${dailyProteinTarget}g protein minimum
RULES: UK supermarket ingredients only. Snacks must contain fruit unless protein shake. Dinner protein must NOT appear in breakfast or lunch.

Return JSON:
{
  "isTrainingDay": ${training},
  "meals": [
    { "id": "v3_${dateKey.replace(/-/g,"")}_[slot]", "name": "Name", "type": "breakfast|snack|lunch|dinner", "time": "8:00 AM", "cals": 400, "protein": 30, "carbs": 35, "fat": 12, "items": ["ingredient (amount)"], "method": "Instructions", "tags": ["gf","df"] }
  ]
}`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });
    const text = response.content[0]?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    if (!parsed.meals || parsed.meals.length !== 5) throw new Error(`Day ${dateKey}: invalid meal count`);
    const mealsWithImages = await Promise.all(
      parsed.meals.map(async (meal) => {
        const imageUrl = await fetchMealImage(meal.name);
        return { ...meal, imageUrl };
      })
    );
    return { date: dateKey, meals: mealsWithImages, isTrainingDay: training };
  };

  try {
    // Generate day 1 first, then remaining days sequentially for leftover accuracy
    const firstDay = await generateDay(template[0], dateKeys[0], null);
    const finalDays = [firstDay];
    for (let i = 1; i < days; i++) {
      const prevDinner = finalDays[i-1]?.meals?.find(m => m.type === "dinner");
      const day = await generateDay(template[i], dateKeys[i], prevDinner?.name || null);
      finalDays.push(day);
    }

    res.json({
      days: finalDays,
      coreProteins,
      dailyCalTarget,
      dailyProteinTarget,
      tdee,
      ingredients,
    });
  } catch(err) {
    console.error("Plan v3 error:", err.message);
    res.status(500).json({ error: "Failed to generate meal plan: " + err.message });
  }
});

// ── Calorie-neutral meal swap ─────────────────────────────────────────────────
app.post("/api/swap-meal", async (req, res) => {
  const { profile, slot, targets, prevDinnerName, dislikedMealNames = [] } = req.body;
  // slot: "breakfast"|"morningSnack"|"lunch"|"afternoonSnack"|"dinner"
  // targets: { cal, protein, carbs, fat, type }

  const isGF = profile?.glutenPref === "gluten_free";
  const isDF = profile?.dairyPref === "dairy_free";
  const isLF = profile?.dairyPref === "lactose_free";
  const milkType = profile?.milkAlt ? `${profile.milkAlt} milk` : isDF ? "oat milk" : isLF ? "lactose-free milk" : "milk";
  const cookTime = { quick:"15 minutes max", moderate:"30 minutes", enjoy:"up to 60 minutes" }[profile?.cookingTime] || "30 minutes";

  const hardRules = [
    isGF ? "⛔ GLUTEN-FREE: No wheat, barley, rye, regular oats, bread, pasta, flour, soy sauce. Use tamari." : "",
    isDF ? `⛔ DAIRY-FREE: No milk, cheese, butter, cream, yoghurt. Use coconut yoghurt, ${milkType}.` : "",
    isLF ? `⛔ LACTOSE-FREE: Use ${milkType}, hard cheese ok.` : "",
    (profile?.allergies?.length > 0) ? `⛔ ALLERGIES: ${profile.allergies.join(", ")}` : "",
    (profile?.dislikes?.length > 0) ? `⛔ DISLIKES: ${profile.dislikes.join(", ")}` : "",
  ].filter(Boolean).join("\n");

  const ingredients = selectCoreIngredients(profile);
  const ingredientList = [...ingredients.proteins, ...ingredients.carbs, ...ingredients.veg, ...ingredients.fruit, ...ingredients.dairy, ...ingredients.base, ...ingredients.extras].join(", ");

  const isLeftover = slot === "lunch" && prevDinnerName;
  const slotLabels = { breakfast:"Breakfast", morningSnack:"Morning snack", lunch:"Lunch", afternoonSnack:"Afternoon snack", dinner:"Dinner" };

  const prompt = `Generate ONE replacement ${slotLabels[slot]||slot} meal. Return ONLY valid JSON.

MUST HIT THESE EXACT TARGETS (this is a calorie-neutral swap):
- Calories: ${targets.cal} ± 30
- Protein: ${targets.protein}g ± 5
- Carbs: ${targets.carbs}g ± 5
- Fat: ${targets.fat}g ± 3

CORE INGREDIENTS: ${ingredientList}
COOKING TIME: ${cookTime}
MILK: ${milkType}
${hardRules ? `\nHARD RULES:\n${hardRules}` : ""}
${isLeftover ? `This is a leftover lunch using ${prevDinnerName} — quick 5-min assembly, no cooking.` : ""}
Do NOT use any of these (user disliked): ${dislikedMealNames.join(", ") || "none"}
Must be completely different from the meal being replaced.

Return JSON:
{ "id": "swap_${Date.now()}", "name": "Meal Name", "type": "${targets.type||slot}", "time": "${targets.time||"12:00 PM"}", "cals": ${targets.cal}, "protein": ${targets.protein}, "carbs": ${targets.carbs}, "fat": ${targets.fat}, "items": ["ingredient (amount)"], "method": "Instructions", "tags": [] }`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });
    const text = response.content[0]?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const meal = JSON.parse(clean);
    res.json({ meal });
  } catch(err) {
    console.error("Swap meal error:", err.message);
    res.status(500).json({ error: "Failed to swap meal" });
  }
});
