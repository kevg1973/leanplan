# LeanPlan — Claude Development Context

## Project Overview
LeanPlan is a React PWA fitness and nutrition app. Built by Kevin Grey (solo developer, Manchester UK), with Claude as primary development partner.

- **App:** https://app.leanplan.uk (React PWA)
- **Landing page:** https://www.leanplan.uk (standalone HTML)

**Current update number: 238**

---

## Tech Stack
| Service | Role |
|---|---|
| React + Vite | Frontend (component-split — see file structure below) |
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
- `APP_URL=https://app.leanplan.uk`
- `BYPASS_PRO` — set to `true` to bypass Pro for all users
- `ADMIN_EMAILS` — comma-separated emails with permanent Pro access (e.g. `kevg1973@gmail.com`)
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `CRON_SECRET` — secret header for cron-job.org trial reminder endpoint

---

## Stripe Details
- **Live:** monthly `price_1TDtInPfNxGIwDvC72uuu6ZE`, annual `price_1TDtJPPfNxGIwDvCffCwzs3j`
- **Test:** monthly `price_1TDuIWBlEueyqAyRLgOGydQV`, annual `price_1TDuItBlEueyqAyRcwY269HK`
- **Webhook:** `https://app.leanplan.uk/api/stripe/webhook`
- Webhook listens to: `checkout.session.completed`, `customer.subscription.deleted`, `customer.subscription.paused`, `customer.subscription.updated`

---

## Supabase Schema — `profiles` table
Columns: `id`, `email`, `profile_data` (jsonb), `entries`, `favourites`, `removed`, `meal_log`, `workout_log`, `water`, `journal`, `measurements`, `dark_override`, `is_pro`, `stripe_customer_id`, `stripe_subscription_id`, `stripe_plan`, `liked_meals`, `disliked_meals`, `meal_plan` (jsonb), `trial_start`, `reminder_sent`, `cancel_at`, `progress_photos` (jsonb)

---

## Business Model
- 7-day free trial → paid only (no free tier)
- **£9.99/month or £99/year**
- `effectiveIsPro = isPro || isTrialActive()`
- Account creation is **mandatory** after onboarding — no skip option
- Stripe webhook marks existing accounts as `is_pro: true` on payment
- Influencer affiliate programme planned (Rewardful integration)
- Admin emails (set via `ADMIN_EMAILS` env var) get permanent Pro access — shown as "⭐ Lifetime Pro" in Profile

---

## App Architecture

### Frontend File Structure
```
src/
  App.jsx              (597 lines — state management, auth, Supabase sync, routing shell)
  main.jsx             (React root)
  supabase.js          (Supabase client)
  constants.js         (FONT, TABS, TAB_ICON_MAP, DAY_NAMES, ALLERGENS, DISLIKES_LIST, TRIAL_DAYS)
  helpers.js           (toKg, fromKg, todayKey, fmtDate, calcTDEE, calcBMI, bmiCategory, PACE_OPTIONS, getPace, trial helpers)
  ThemeContext.jsx      (LIGHT/DARK themes, ThemeProvider, useTheme hook)
  components/
    ui.jsx             (Card, Section, Row, Btn, Chip, BigChip, Toggle, TInput, StatBox, ProgressBar)
    Icon.jsx           (SVG icon system)
    ErrorBoundary.jsx  (React error boundary)
    Onboarding.jsx     (17-step onboarding + BuildingPlanScreen, ScrollPicker, OOption, OChip, OBtn)
    TodayTab.jsx       (Today dashboard — calorie ring, macros, workout/meal summaries)
    MealsTab.jsx       (Meal plans, shopping list, supplements)
    TrainTab.jsx       (Workout programme, exercise tracker, weekly calendar)
    TrackTab.jsx       (Weight tracking, measurements, stats, workout history)
    CoachTab.jsx       (AI coach chat interface)
    ProfileTab.jsx     (Profile editing, settings, account management)
    MealCarousel.jsx   (Swipeable meal card carousel)
    MealPlanLoader.jsx (Animated meal plan generation screen)
    Chart.jsx          (SVG weight progress chart)
    JournalCard.jsx    (Daily journal entry card)
    LiftTracker.jsx    (Exercise weight progress tracker)
    ProgressPhotos.jsx (Progress photo upload, timeline, comparison)
    PacePicker.jsx     (Weight loss pace selector)
    PaywallModal.jsx   (Subscription paywall with Stripe checkout)
    CreateAccountScreen.jsx (Post-onboarding account creation)
    AuthScreen.jsx     (Sign in / forgot password)
    WelcomeScreen.jsx  (First-time landing screen)
    TrialExpiredScreen.jsx (Trial ended — subscribe prompt)
    WeeklyCheckIn.jsx  (Monday morning check-in modal)
    ProBanner.jsx      (Pro upgrade banner)
    LockedTab.jsx      (Locked feature placeholder)
    TipSplashScreen.jsx (Daily tip splash on app open)
    AvatarCropModal.jsx (Profile photo crop modal)
  data/
    exercises.js       (EXERCISE_DB — full exercise database with steps, tips, muscles)
    workouts.js        (PERIODISATION_BLOCKS, buildWorkout, getCurrentBlock, getWeeklyPlan, WORKOUTS, SUPPS, DAILY_TIPS)
    meals.js           (ALL_MEALS, filterMeals)
```

Theme is managed via `ThemeContext.jsx` — extracted components use `useTheme()` hook. `App.jsx` still uses a mutable `let C` for the main shell; all other components are fully context-driven.

### Landing Page & Static Pages
```
public/
  landing.html         (Marketing landing page — standalone HTML, see structure below)
  privacy.html         (Privacy policy)
  terms.html           (Terms of service)
```

**Landing page design:** DM Sans font (Google Fonts), dark background `#050914`, blue accent `#4A9EF8`, CSS custom properties. Standalone HTML — no React, no build step.

**Landing page sections (top to bottom):**
1. Hero — `deadlift-hero.png` background with gradient overlay, nav bar, headline, two CTA buttons
2. Sticky nav — appears on scroll via IntersectionObserver, duplicates main nav
3. Social proof — 3 testimonial cards with star ratings
4. How it works — 3 numbered steps + `plan-builder.png` screenshot (2-column grid)
5. Features — 2x2 card grid: workouts (`section-3a.png`), progress (`progress-tracking.webp`), meals (`section-3c.webp`), shopping (`section-3d.webp`)
6. Compare — "Most apps" vs "LeanPlan" side-by-side with x/check icons
7. CTA box — blue gradient border, "Build my plan" button
8. FAQ — 6 questions in 2-column grid
9. Footer — logo, privacy/terms/support links, copyright

**All CTAs link to `https://app.leanplan.uk`.** Responsive at 900px and 680px breakpoints. Support email is CloudFlare-protected.

### Domain Routing (`server.js`)
| Hostname | Route | Serves |
|----------|-------|--------|
| `www.leanplan.uk` / `leanplan.uk` | `/` | `landing.html` |
| `app.leanplan.uk` | `/` | `index.html` (React app) |
| Any | `/privacy` | `privacy.html` |
| Any | `/terms` | `terms.html` |
| Any | `/api/*` | Express API endpoints |
| Any | `*` (catch-all) | `index.html` (React SPA) |

Routing uses `req.hostname` to distinguish app vs marketing domains. All static files served from `dist/` (Vite copies `public/` into `dist/` at build time).

### Guided Mode (default)
LeanPlan prescribes everything — meal plans, workout schedule, shopping list.

### Custom Mode
Deferred — UI stub exists, shows "coming soon".

### User Flow
1. Onboarding (17 steps)
2. **Mandatory account creation** — "Your personal plan is ready — create your account to save it"
   - Email/password signup OR Google OAuth (`signInWithOAuth`)
   - Google OAuth persists pending profile to `leanplan_pending_google_profile` in localStorage before redirect (state is lost on page reload)
   - On OAuth return, `onAuthStateChange` `SIGNED_IN` handler recovers the pending profile and saves it to Supabase
   - Google profile picture is used as avatar if no custom avatar exists
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
| `POST /api/send-shopping-list` | Email shopping list to user |
| `GET /` | Landing page (www) or React app (app subdomain) |
| `GET /privacy` | Privacy policy page |
| `GET /terms` | Terms of service page |

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
- ✅ Google Sign In (OAuth via Supabase, both CreateAccount and Auth screens)
- ✅ Google avatar auto-set on sign in
- ✅ Cancellation email via Resend (triggered on `subscription.updated` with `cancel_at_period_end`)
- ✅ AI coach rate limiting (20 messages/day)
- ✅ Progress photos (upload, timeline, compare, flip)
- ✅ Marketing landing page (`public/landing.html`)
- ✅ Privacy and Terms pages
- ✅ Domain split — `app.leanplan.uk` (PWA) / `www.leanplan.uk` (landing)

---

## Known Patterns & Gotchas
- `App.jsx` is 597 lines (split complete) — components are in `src/components/`, data in `src/data/`
- `proData.customerId === "bypass"` means admin/bypass Pro user
- `proData.customerId === null` means trial user
- Trial is stored in `leanplan_trial_start` localStorage AND Supabase `trial_start` column
- Meal plan stored in `leanplan_meal_plan` localStorage AND Supabase `meal_plan` jsonb column
- PWA on iOS terminates fully on swipe — auth must be restored from Supabase session on every open
- `INITIAL_SESSION` Supabase event must be handled to restore session on app reopen
- Supabase RLS is enabled — server-side operations use `SUPABASE_SERVICE_ROLE_KEY`
- Resend sends from `hello@leanplan.uk` — domain verified
- cron-job.org hits `/api/send-trial-reminders` daily at 9am Europe/London with `x-cron-secret` header
- Google OAuth redirect uses `https://app.leanplan.uk` — hardcoded in `CreateAccountScreen.jsx` and `AuthScreen.jsx`
- `leanplan_pending_google_profile` localStorage key bridges OAuth redirect for post-onboarding Google signup
- Cancellation email fires on `customer.subscription.updated` (when `cancel_at_period_end === true`), NOT on `customer.subscription.deleted`
- `landing.html` is standalone HTML (no React, no build step) — uses Inter font from Google Fonts
- `server.js` routes by `req.hostname` — `app.leanplan.uk` gets React app, everything else gets landing page

---

## Roadmap (priority order)
### Immediate
1. End of programme handling (celebration screen)
2. `.gitignore` — add `.DS_Store`

### Product
3. Body composition estimator
4. Sleep + energy correlation tracking
5. Meal variety scoring

### Business
6. Influencer affiliate programme (Rewardful integration)
7. Marketing promo pack (Instagram, TikTok, YouTube)

### Technical Debt
8. Error monitoring (Sentry)
9. API cost monitoring

### Future
10. Push notifications
11. Custom mode
12. CGM integration (Dexcom)
13. Apple Watch / Apple Health
14. Native iOS app (App Store)
15. PT dashboard
16. White label

### Done
- ~~App.jsx split into component files~~ ✅ (5,692 → 597 lines, 27 extracted files)
- ~~AI coach rate limiting~~ ✅ (20 messages/day)
- ~~Progress photos~~ ✅ (upload, timeline, compare, flip)
- ~~Google Sign In~~ ✅ (OAuth via Supabase)
- ~~Marketing website~~ ✅ (`landing.html`)
- ~~Cancellation email~~ ✅ (Resend, triggered on subscription update)
- ~~Domain split~~ ✅ (`app.leanplan.uk` / `www.leanplan.uk`)

---

## Kevin's Test Profile
Age 53, male, Manchester UK, 170cm, 83kg, gluten-free + dairy-free, back/knee injuries, goal: lose ~10kg, equipment: rowing machine, cross trainer, dumbbells, cables, 3x/week training, protein powder + creatine.  
Email: kevg1973@gmail.com (admin — permanent Pro access)
