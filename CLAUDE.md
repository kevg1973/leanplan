# LeanPlan — Claude Development Context

## Project Overview
LeanPlan is a React PWA fitness and nutrition app. Live at https://www.leanplan.uk. Built by Kevin Grey (solo developer, Manchester UK), with Claude as primary development partner.

**Current update number: 200**

---

## Tech Stack
| Service | Role |
|---|---|
| React + Vite | Frontend (`src/App.jsx` — ~5,000 lines) |
| Express | Backend (`server.js`) |
| Railway | Hosting + auto-deploy from GitHub |
| Supabase | Auth + database (RLS enabled, email confirmation OFF) |
| Stripe | Payments (live + test mode) |
| Resend | Transactional email from `hello@leanplan.uk` |
| Anthropic API | AI meal generation + coach |
| GoDaddy | Domains (`leanplan.uk`, `leanplan.co.uk`) |
| cron-job.org | Daily cron for trial reminder emails |

**localStorage key:** `leanplan_v4`  
**Supabase project:** `eztatcluqkdxbfxoikio.supabase.co`

---

## Key Railway Environment Variables
- `ANTHROPIC_API_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_MONTHLY_LIVE`, `STRIPE_PRICE_ANNUAL_LIVE`
- `STRIPE_PRICE_MONTHLY_TEST`, `STRIPE_PRICE_ANNUAL_TEST`
- `APP_URL=https://www.leanplan.uk`
- `BYPASS_PRO` — set to `true` to bypass Pro for all users
- `ADMIN_EMAILS` — comma-separated emails with permanent Pro access (e.g. `kevg1973@gmail.com`)
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `CRON_SECRET` — secret header for cron-job.org trial reminder endpoint

---

## Stripe Details
- **Live:** monthly `price_1TDtInPfNxGIwDvC72uuu6ZE`, annual `price_1TDtJPPfNxGIwDvCffCwzs3j`
- **Test:** monthly `price_1TDuIWBlEueyqAyRLgOGydQV`, annual `price_1TDuItBlEueyqAyRcwY269HK`
- **Webhook:** `https://www.leanplan.uk/api/stripe/webhook`
- Webhook listens to: `checkout.session.completed`, `customer.subscription.deleted`, `customer.subscription.paused`, `customer.subscription.updated`

---

## Supabase Schema — `profiles` table
Columns: `id`, `email`, `profile_data` (jsonb), `entries`, `favourites`, `removed`, `meal_log`, `workout_log`, `water`, `journal`, `measurements`, `dark_override`, `is_pro`, `stripe_customer_id`, `stripe_subscription_id`, `stripe_plan`, `liked_meals`, `disliked_meals`, `meal_plan` (jsonb), `trial_start`, `reminder_sent`, `cancel_at`

---

## Business Model
- 7-day free trial → paid only (no free tier)
- **£9.99/month or £39.99/year** (pricing under review)
- `effectiveIsPro = isPro || isTrialActive()`
- Account creation is **mandatory** after onboarding — no skip option
- Stripe webhook marks existing accounts as `is_pro: true` on payment
- Influencer affiliate programme planned (Rewardful integration)
- Admin emails (set via `ADMIN_EMAILS` env var) get permanent Pro access — shown as "⭐ Lifetime Pro" in Profile

---

## App Architecture

### Guided Mode (default)
LeanPlan prescribes everything — meal plans, workout schedule, shopping list.

### Custom Mode
Deferred — UI stub exists, shows "coming soon".

### User Flow
1. Onboarding (17 steps)
2. **Mandatory account creation** — "Your personal plan is ready — create your account to save it"
3. Trial starts at account creation
4. 7-day trial → subscribe or lose access
5. Stripe webhook → `is_pro: true` on existing account + welcome email via Resend

---

## Key Principles (never violate these)
- **One fix at a time** — no batching changes
- **Never suggest resetting app data** as a debugging step
- **Deterministic over AI** for workout structure — JS logic, not AI
- **Guided-first** — prescriptive beats flexible
- **Ingredient-first meals** — `selectCoreIngredients()` pre-selects before AI call
- **Calorie-neutral swaps** — overrides can't undermine nutritional targets
- **Progressive disclosure** — new features must not clutter existing screens
- **Magic links don't work in PWA** — always use server-side temp passwords via Resend
- **Fix JSX carefully** — mismatched tags and literal newlines break builds

---

## Server Endpoints
| Endpoint | Purpose |
|---|---|
| `POST /api/stripe/checkout` | Create Stripe checkout session |
| `GET /api/stripe/verify` | Verify payment on return |
| `POST /api/stripe/webhook` | Receive Stripe events |
| `POST /api/stripe/portal` | Open billing portal |
| `GET /api/pro-status?email=` | Check BYPASS_PRO + admin email override |
| `POST /api/forgot-password` | Send temp password via Resend |
| `POST /api/generate-meal-plan-v3` | Current guided ingredient-first plan |
| `POST /api/swap-meal` | Calorie-neutral meal swap |
| `POST /api/chat` | AI coach with live context |
| `POST /api/send-trial-reminders` | Daily cron — sends day 5 trial reminder emails |

---

## What's Built and Working
- ✅ 17-step dark onboarding
- ✅ Mandatory account creation after onboarding
- ✅ AI meal plans (v3) — ingredient-first, per-slot macro targets, training day carb cycling
- ✅ Calorie-neutral meal swaps
- ✅ Shopping list with pantry feature
- ✅ Goal-based weekly workout programme (deterministic JS)
- ✅ 4 periodisation blocks (16 weeks), deload weeks
- ✅ Injury + equipment filtering on exercises
- ✅ AI coach with live context
- ✅ Lift tracker with PR celebrations (toast + inline indicator)
- ✅ Progress tracking, measurements, BMI, TDEE
- ✅ Water tracker
- ✅ Today tab — calorie ring, macro bars, workout/meal summaries, insights
- ✅ Personalised daily insights on Today tab
- ✅ Weekly check-in modal (Monday mornings)
- ✅ Stripe subscription (monthly + annual)
- ✅ Stripe webhook → `is_pro: true` on account + welcome email
- ✅ Subscription cancellation banner with `cancel_at` date
- ✅ Trial reminder email (day 5, cron-job.org)
- ✅ Forgot password via server-side temp password (Resend)
- ✅ Change password in Profile
- ✅ Supabase sync — all data including meal plan synced across devices
- ✅ Trial start synced across devices via Supabase
- ✅ Admin email override for permanent Pro access
- ✅ Dark/light mode
- ✅ Meal plan expiry nudge
- ✅ Profile editing (all settings)

---

## Known Patterns & Gotchas
- `App.jsx` is ~5,000 lines — be careful with large edits, use targeted string replacements
- `proData.customerId === "bypass"` means admin/bypass Pro user
- `proData.customerId === null` means trial user
- Trial is stored in `leanplan_trial_start` localStorage AND Supabase `trial_start` column
- Meal plan stored in `leanplan_meal_plan` localStorage AND Supabase `meal_plan` jsonb column
- PWA on iOS terminates fully on swipe — auth must be restored from Supabase session on every open
- `INITIAL_SESSION` Supabase event must be handled to restore session on app reopen
- Supabase RLS is enabled — server-side operations use `SUPABASE_SERVICE_ROLE_KEY`
- Resend sends from `hello@leanplan.uk` — domain verified
- cron-job.org hits `/api/send-trial-reminders` daily at 9am Europe/London with `x-cron-secret` header

---

## Roadmap (priority order)
### Immediate
1. Rate limiting on AI coach (20 messages/day)
2. End of programme handling (16-week celebration screen)
3. `.gitignore` — add `.DS_Store`

### Product
4. Progress photos
5. Body composition estimator
6. Sleep + energy correlation tracking
7. Meal variety scoring
8. Google Sign In

### Business
9. Influencer affiliate programme (Rewardful integration)
10. Marketing website
11. Marketing promo pack (Instagram, TikTok, YouTube)

### Technical Debt
12. App.jsx split into component files
13. Error monitoring (Sentry)
14. API cost monitoring

### Future
15. Push notifications
16. Custom mode
17. CGM integration (Dexcom)
18. Apple Watch / Apple Health
19. Native iOS app (App Store)
20. PT dashboard
21. White label

---

## Kevin's Test Profile
Age 53, male, Manchester UK, 170cm, 83kg, gluten-free + dairy-free, back/knee injuries, goal: lose ~10kg, equipment: rowing machine, cross trainer, dumbbells, cables, 3x/week training, protein powder + creatine.  
Email: kevg1973@gmail.com (admin — permanent Pro access)
