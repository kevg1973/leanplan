import React, { useState, useEffect } from "react";
import { supabase } from "./supabase.js";
import { ThemeProvider, LIGHT, DARK } from "./ThemeContext.jsx";
import { FONT, TABS, TAB_ICON_MAP } from "./constants.js";
import { toKg, todayKey, setTrialStart, getTrialDaysLeft, isTrialActive, isTrialExpired } from "./helpers.js";
import { Icon } from "./components/Icon.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { Onboarding } from "./components/Onboarding.jsx";
import { TipSplashScreen } from "./components/TipSplashScreen.jsx";
import { ProBanner } from "./components/ProBanner.jsx";
import { LockedTab } from "./components/LockedTab.jsx";
import { WelcomeScreen } from "./components/WelcomeScreen.jsx";
import { TrialExpiredScreen } from "./components/TrialExpiredScreen.jsx";
import { WeeklyCheckIn } from "./components/WeeklyCheckIn.jsx";
import { PaywallModal } from "./components/PaywallModal.jsx";
import { CreateAccountScreen } from "./components/CreateAccountScreen.jsx";
import { AuthScreen } from "./components/AuthScreen.jsx";
import { CoachTab } from "./components/CoachTab.jsx";
import { TodayTab } from "./components/TodayTab.jsx";
import { TrackTab } from "./components/TrackTab.jsx";
import { MealsTab } from "./components/MealsTab.jsx";
import { TrainTab } from "./components/TrainTab.jsx";
import { ProfileTab } from "./components/ProfileTab.jsx";
import { DAILY_TIPS } from "./data/workouts.js";

let C = LIGHT;

// ── MAIN ──────────────────────────────────────────────────────────────────────
function AppInner() {
  const RESET_KEYS = [
    "leanplan_v4", "leanplan_lifts", "leanplan_pro", "leanplan_device_id",
    "leanplan_trial_start", "leanplan_gen_count", "leanplan_disliked_meals",
    "leanplan_liked_meals", "leanplan_meal_plan", "leanplan_todays_meals",
    "leanplan_pantry",
  ];
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("Today");
  const [isPro, setIsPro] = useState(false);
  // Trial users get full Pro access
  const effectiveIsPro = isPro || isTrialActive();
  const [proData, setProData] = useState(null);
  const [proLoading, setProLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [mealPlan, setMealPlan] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("leanplan_meal_plan") || "null");
      if (saved?.generatedDate) {
        // Check plan still has future/today dates
        const today = new Date().toISOString().split("T")[0];
        const hasFuture = saved.days?.some(d => d.date >= today);
        if (hasFuture) return saved;
      }
    } catch(e){}
    return null;
  });
  const saveMealPlan = (plan) => {
    setMealPlan(plan);
    try {
      if (plan) localStorage.setItem("leanplan_meal_plan", JSON.stringify(plan));
      else localStorage.removeItem("leanplan_meal_plan");
    } catch(e){}
  };
  // Meal generation state — lives at App level so it survives tab switches
  const [generating, setGenerating] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [generateProgress, setGenerateProgress] = useState(null);
  const [generateError, setGenerateError] = useState(null);

  // todaysMeals derived from mealPlan for backward compat
  const todayKey2 = new Date().toISOString().split("T")[0];
  const todaysMeals = mealPlan?.days?.find(d => d.date === todayKey2)?.meals || null;
  const [todaysWorkout, setTodaysWorkout] = useState(null);
  const [entries, setEntries] = useState([]);
  const [favourites, setFavourites] = useState([]);
  const [removed, setRemoved] = useState([]);
  const [mealLog, setMealLog] = useState({});
  const [workoutLog, setWorkoutLog] = useState({});
  const [water, setWater] = useState({});
  const [journal, setJournal] = useState({});
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkOverride, setDarkOverride] = useState(null);
  const [systemDark, setSystemDark] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches);
  // Auth state
  const [user, setUser] = useState(null); // Supabase user
  const [authChecked, setAuthChecked] = useState(false); // has auth been checked
  const [showAuth, setShowAuth] = useState(false); // show auth screen
  const [showCreateAccount, setShowCreateAccount] = useState(false); // show create account after onboarding
  const [pendingProfile, setPendingProfile] = useState(null); // profile data waiting for account creation
  const [showTipSplash, setShowTipSplash] = useState(true);
  const [showWeeklyCheckIn, setShowWeeklyCheckIn] = useState(false);
  const [splashTipIdx] = useState(()=>Math.floor(Math.random()*DAILY_TIPS.length)); // show tip on open
  const [showWelcome, setShowWelcome] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [authLoading, setAuthLoading] = useState(true); // true until auth check completes
  const [syncing, setSyncing] = useState(false);

  // Listen to system dark mode changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = e => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Check for dev bypass and Stripe return
  // Reset daily state at midnight
  useEffect(()=>{
    const msUntilMidnight = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24,0,0,0);
      return midnight - now;
    };
    const timer = setTimeout(()=>{
      setTodaysWorkout(null);
      // Don't clear mealPlan at midnight - it spans multiple days
    }, msUntilMidnight());
    return () => clearTimeout(timer);
  }, []);

  useEffect(()=>{
    // Check server-side bypass flag — pass email for admin override
    const emailParam = user?.email ? `?email=${encodeURIComponent(user.email)}` : "";
    fetch(`/api/pro-status${emailParam}`)
      .then(r => r.json())
      .then(data => {
        if (data.bypass) {
          setIsPro(true);
          setProData({ plan:"annual", customerId:"bypass", subscriptionId:"bypass" });
        }
      })
      .catch(()=>{})
      .finally(()=>{ setProLoading(false); });

    const params = new URLSearchParams(window.location.search);
    const proStatus = params.get("pro");
    const sessionId = params.get("session_id");
    if (proStatus === "success" && sessionId) {
      fetch(`/api/stripe/verify?session_id=${sessionId}`)
        .then(r => r.json())
        .then(data => {
          if (data.pro) {
            setIsPro(true);
            setProData({ customerId: data.customerId, subscriptionId: data.subscriptionId, plan: data.plan });
            localStorage.setItem("leanplan_pro", JSON.stringify({ isPro: true, customerId: data.customerId, subscriptionId: data.subscriptionId, plan: data.plan }));
          }
        })
        .catch(()=>{});
      window.history.replaceState({}, "", "/");
    }
    // Load saved pro status
    try {
      const savedPro = localStorage.getItem("leanplan_pro");
      if (savedPro) {
        const pd = JSON.parse(savedPro);
        if (pd.isPro) { setIsPro(true); setProData(pd); }
      }
    } catch(e){}
  }, [user]);

  // Load data from localStorage first (fast), then sync from Supabase if logged in
  const loadFromLocal = () => {
    try {
      const raw = localStorage.getItem("leanplan_v4");
      if (raw) {
        const d = JSON.parse(raw);
        if (d.profile) setProfile(d.profile);
        if (d.entries) setEntries(d.entries);
        if (d.favourites) setFavourites(d.favourites);
        if (d.removed) setRemoved(d.removed);
        if (d.mealLog) setMealLog(d.mealLog);
        if (d.workoutLog) setWorkoutLog(d.workoutLog);
        if (d.water) setWater(d.water);
        if (d.journal) setJournal(d.journal);
        if (d.measurements) setMeasurements(d.measurements);
        if (d.darkOverride !== undefined) setDarkOverride(d.darkOverride);
      }
    } catch(e){}
  };

  const loadFromSupabase = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (error || !data) return;
      if (data.profile_data && Object.keys(data.profile_data).length > 0) setProfile(data.profile_data);
      if (data.entries?.length) setEntries(data.entries);
      if (data.favourites?.length) setFavourites(data.favourites);
      if (data.removed?.length) setRemoved(data.removed);
      if (data.meal_log && Object.keys(data.meal_log).length) setMealLog(data.meal_log);
      if (data.workout_log && Object.keys(data.workout_log).length) setWorkoutLog(data.workout_log);
      if (data.water && Object.keys(data.water).length) setWater(data.water);
      if (data.journal && Object.keys(data.journal).length) setJournal(data.journal);
      if (data.measurements?.length) setMeasurements(data.measurements);
      if (data.dark_override !== null && data.dark_override !== undefined) setDarkOverride(data.dark_override);
      if (data.is_pro) { setIsPro(true); setProData({ customerId: data.stripe_customer_id, subscriptionId: data.stripe_subscription_id, plan: data.stripe_plan, cancelAt: data.cancel_at || null }); }
      // Sync trial_start from Supabase — ensures consistent trial across devices
      if (data.trial_start && !localStorage.getItem("leanplan_trial_start")) {
        localStorage.setItem("leanplan_trial_start", data.trial_start);
      }
      if (data.meal_plan && data.meal_plan.days) {
        // Only load if plan has future/today dates
        const today = new Date().toISOString().split("T")[0];
        const hasFuture = data.meal_plan.days.some(d => d.date >= today);
        if (hasFuture) {
          setMealPlan(data.meal_plan);
          localStorage.setItem("leanplan_meal_plan", JSON.stringify(data.meal_plan));
        }
      }
    } catch(e){ console.error("Supabase load error:", e); }
  };

  const saveToSupabase = async (userId, data) => {
    try {
      await supabase.from("profiles").upsert({
        id: userId,
        profile_data: data.profile || {},
        entries: data.entries || [],
        favourites: data.favourites || [],
        removed: data.removed || [],
        meal_log: data.mealLog || {},
        workout_log: data.workoutLog || {},
        water: data.water || {},
        journal: data.journal || {},
        measurements: data.measurements || [],
        dark_override: data.darkOverride,
        meal_plan: data.mealPlan || null,
        trial_start: localStorage.getItem("leanplan_trial_start") || null,
        updated_at: new Date().toISOString(),
      });
    } catch(e){ console.error("Supabase save error:", e); }
  };

  // Check auth on mount
  useEffect(()=>{
    let loadingDone = false;

    // Load from localStorage IMMEDIATELY — don't wait for Supabase
    loadFromLocal();
    setLoading(false); // Show the app straight away from cache

    // Clear any leftover recovery flags from previous attempts
    localStorage.removeItem("leanplan_recovery");
    localStorage.removeItem("leanplan_recovery_token");
    localStorage.removeItem("leanplan_recovery_refresh");

    // Show weekly check-in on Monday mornings (once per week)
    const isMonday = new Date().getDay() === 1;
    const lastCheckIn = localStorage.getItem("leanplan_last_checkin");
    const thisWeekMonday = (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1); return d.toISOString().split("T")[0]; })();
    if (isMonday && lastCheckIn !== thisWeekMonday) {
      setTimeout(() => setShowWeeklyCheckIn(true), 1500);
    }

    const finishLoading = () => {
      if (!loadingDone) {
        loadingDone = true;
        setAuthChecked(true);
        setAuthLoading(false);
      }
    };

    // Safety timeout
    const safetyTimer = setTimeout(() => {
      finishLoading();
    }, 5000);

    // onAuthStateChange catches ALL auth events including email confirmation
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        if (session?.user) {
          setUser(session.user);
          loadFromLocal();

          // Google OAuth return from CreateAccountScreen — recover pending profile
          const pendingGoogleProfile = localStorage.getItem("leanplan_pending_google_profile");
          if (pendingGoogleProfile && event === "SIGNED_IN") {
            try {
              const googleProfile = JSON.parse(pendingGoogleProfile);
              localStorage.removeItem("leanplan_pending_google_profile");
              setProfile(googleProfile);
              setShowCreateAccount(false);
              setPendingProfile(null);
              setTrialStart();
              const trialStart = localStorage.getItem("leanplan_trial_start");
              await supabase.from("profiles").upsert({
                id: session.user.id,
                email: session.user.email,
                profile_data: googleProfile,
                trial_start: trialStart,
                reminder_sent: false,
                entries: [], favourites: [], removed: [],
                meal_log: {}, workout_log: {}, water: {}, journal: {},
                measurements: [],
              });
              try { localStorage.setItem("leanplan_v4", JSON.stringify({ profile: googleProfile, entries:[], favourites:[], removed:[], mealLog:{}, workoutLog:{}, water:{}, journal:{}, measurements:[], darkOverride:null })); } catch(e){}
              console.log("Google OAuth: saved pending profile for", session.user.email);
            } catch(e) { console.error("Google OAuth profile save failed:", e); }
          } else {
            try {
              // Check if Supabase has profile data
              const { data } = await supabase.from("profiles").select("profile_data").eq("id", session.user.id).single();
              if (!data?.profile_data || Object.keys(data.profile_data).length === 0) {
                // Profile is empty — push local data up immediately
                const local = JSON.parse(localStorage.getItem("leanplan_v4") || "{}");
                if (local.profile) {
                  console.log("Pushing local profile to Supabase...");
                  await saveToSupabase(session.user.id, local);
                  setProfile(local.profile);
                }
              } else {
                await loadFromSupabase(session.user.id);
              }
            } catch(e){ console.error("Supabase sync failed:", e); }
          }

          // Set Google avatar if user has one and no custom avatar exists
          const googleAvatar = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture;
          if (googleAvatar && !avatarUrl) {
            setAvatarUrl(googleAvatar);
          }
          clearTimeout(safetyTimer);
          finishLoading();
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        clearTimeout(safetyTimer);
        finishLoading();
      } else if (event === "INITIAL_SESSION") {
        if (session?.user) {
          // Valid session exists — set user immediately, don't wait for SIGNED_IN
          setUser(session.user);
          loadFromLocal();
          try {
            await loadFromSupabase(session.user.id);
          } catch(e){ console.error("Supabase sync failed:", e); }
          // Set Google avatar on session restore if no custom avatar
          const gAvatar = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture;
          if (gAvatar && !avatarUrl) setAvatarUrl(gAvatar);
          clearTimeout(safetyTimer);
          finishLoading();
        } else {
          loadFromLocal();
          clearTimeout(safetyTimer);
          finishLoading();
        }
      }
    });

    return () => { subscription.unsubscribe(); clearTimeout(safetyTimer); };
  }, []);

  // Save to both localStorage and Supabase when data changes
  useEffect(()=>{
    if (loading) return;
    const data = {profile,entries,favourites,removed,mealLog,workoutLog,water,journal,measurements,darkOverride,mealPlan};
    try { localStorage.setItem("leanplan_v4", JSON.stringify(data)); } catch(e){}
    if (user) {
      // Debounce Supabase saves to avoid too many writes
      const timer = setTimeout(() => saveToSupabase(user.id, data), 2000);
      return () => clearTimeout(timer);
    }
  },[profile,entries,favourites,removed,mealLog,workoutLog,water,journal,measurements,darkOverride,mealPlan,loading,user]);

  const loadBg = systemDark ? "#000" : "#f2f2f7";
  const loadText = systemDark ? "#8e8e93" : "#8e8e93";
  if (loading) return <div style={{ minHeight:"100vh", background:loadBg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:FONT }}><div style={{ textAlign:"center" }}><div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
        <img src="/leanplan_app_icon.png" alt="" style={{ height:52, width:52, objectFit:"contain", borderRadius:12 }} />
        <span style={{ fontSize:28, fontWeight:800, letterSpacing:"-0.02em", fontFamily:FONT }}>
          <span style={{ color:loadBg==="#000"?"#fff":"#000" }}>Lean</span><span style={{ color:"#0a84ff" }}>Plan</span>
        </span>
      </div>
      <p style={{ color:loadText }}>Loading...</p></div></div>;

  // Apply theme first — needed by all render paths
  const isDark = darkOverride !== null ? darkOverride : systemDark;
  C = isDark ? DARK : LIGHT;

  // ── Render sequence ──────────────────────────────────────────────────────────

  // Show tip splash on every open (after profile is loaded)
  if (showTipSplash && profile && !showAuth && !showWelcome && !showOnboarding) {
    return <TipSplashScreen tip={DAILY_TIPS[splashTipIdx]} onDismiss={()=>setShowTipSplash(false)} />;
  }

  // 1. Auth screen — shown when explicitly requested
  if (showAuth) return <AuthScreen
    onAuth={async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setShowAuth(false);
        setSyncing(true);
        try {
          await loadFromSupabase(session.user.id);
          // Push any local data up if Supabase is empty
          const { data } = await supabase.from("profiles").select("profile_data").eq("id", session.user.id).single();
          if (!data?.profile_data || Object.keys(data.profile_data).length === 0) {
            const local = JSON.parse(localStorage.getItem("leanplan_v4") || "{}");
            if (local.profile) await saveToSupabase(session.user.id, local);
          }
        } catch(e){}
        setSyncing(false);
      }
    }}
    onSkip={()=>setShowAuth(false)}
  />;

  // 2. Loading screen — only while auth check runs with no cached data
  if (authLoading && !profile) return <div style={{ minHeight:"100vh", background:loadBg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:FONT }}><div style={{ textAlign:"center" }}><div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}><img src="/leanplan_app_icon.png" alt="" style={{ height:52, width:52, objectFit:"contain", borderRadius:12 }} /><span style={{ fontSize:28, fontWeight:800, letterSpacing:"-0.02em", fontFamily:FONT }}><span style={{ color:loadBg==="#000"?"#fff":"#000" }}>Lean</span><span style={{ color:"#0a84ff" }}>Plan</span></span></div><p style={{ color:loadText }}>Loading...</p></div></div>;

  // 3. Welcome screen — first time, no profile, no user
  if (!profile && !user && !showOnboarding) return <WelcomeScreen
    onNew={()=>{ setShowOnboarding(true); }}
    onSignIn={()=>setShowAuth(true)}
  />;

  // 3b. Signed out but have local data — show sign in screen (only after auth check completes)
  if (profile && !user && !authLoading) return <AuthScreen
    onAuth={async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setSyncing(true);
        try {
          await loadFromSupabase(session.user.id);
          const { data } = await supabase.from("profiles").select("profile_data").eq("id", session.user.id).single();
          if (!data?.profile_data || Object.keys(data.profile_data).length === 0) {
            const local = JSON.parse(localStorage.getItem("leanplan_v4") || "{}");
            if (local.profile) await saveToSupabase(session.user.id, local);
          }
        } catch(e){}
        setSyncing(false);
      }
    }}
    onSkip={null}
    onStartFresh={() => {
      if (!window.confirm("Start fresh? This will clear all your current data and cannot be undone.")) return;
      RESET_KEYS.forEach(k => localStorage.removeItem(k));
      setProfile(null); setEntries([]); setFavourites([]); setRemoved([]);
      setMealLog({}); setWorkoutLog({}); setWater({}); setJournal({}); setMeasurements([]);
      setIsPro(false); setProData(null); setMealPlan(null);
    }}
  />;

  // 4. Onboarding — after Get Started
  if (!profile && !showCreateAccount) return <Onboarding onDone={p=>{ 
    setPendingProfile(p);
    setShowCreateAccount(true);
    try {
      localStorage.setItem("leanplan_v4", JSON.stringify({profile:p, entries:[], favourites:[], removed:[], mealLog:{}, workoutLog:{}, water:{}, journal:{}, measurements:[], darkOverride:null}));
    } catch(e){}
  }} />;

  // 4b. Create account — mandatory after onboarding (skip if already signed in)
  if (showCreateAccount && pendingProfile) {
    if (user) {
      // Already signed in (e.g. after reset) — just save profile and continue
      setProfile(pendingProfile);
      setShowCreateAccount(false);
      setPendingProfile(null);
      setTrialStart();
      saveToSupabase(user.id, { profile: pendingProfile, entries:[], favourites:[], removed:[], mealLog:{}, workoutLog:{}, water:{}, journal:{}, measurements:[], darkOverride:null });
      return null;
    }
    return <CreateAccountScreen
      profileData={pendingProfile}
      onDone={async (supabaseUser, email) => {
        setUser(supabaseUser);
        setProfile(pendingProfile);
        setShowCreateAccount(false);
        setPendingProfile(null);
        setTrialStart();
      }}
    />;
  }

  // 5. Trial expired — show subscribe screen
  if (!proLoading && isTrialExpired() && !isPro && proData?.customerId !== 'bypass') return <TrialExpiredScreen onSubscribe={()=>setShowPaywall(true)} />;

  const cur = entries.length>0?entries[entries.length-1].weight:profile.startWeightLbs;
  const lost = Math.max(0,profile.startWeightLbs-cur);
  const pct = Math.min(100,Math.round((lost/profile.targetLbs)*100));
  const TAB_COLORS = {Today:"#007aff",Meals:"#34c759",Train:"#5ac8fa",Track:"#af52de",Coach:"#ff2d55",Profile:"#ff9500"};

  const handleReset = async () => {
    const savedPro = localStorage.getItem("leanplan_pro");
    const hasRealSub = savedPro && JSON.parse(savedPro)?.customerId && JSON.parse(savedPro)?.customerId !== "bypass";

    const confirmMsg = hasRealSub
      ? "Reset your fitness data and start fresh?\n\n✓ Your Pro subscription will be kept\n✓ All workout, meal and progress data will be cleared\n✓ You can set up a new goal in onboarding\n\nTap OK to reset your data."
      : "Reset all data? This cannot be undone.";

    if (!window.confirm(confirmMsg)) return;

    // Wipe Supabase row BEFORE signing out so the same email starts clean next time
    if (user?.id) {
      try {
        await supabase.from("profiles").upsert({
          id: user.id,
          profile_data: {}, entries: [], favourites: [], removed: [],
          meal_log: {}, workout_log: {}, water: {}, journal: {},
          measurements: [], dark_override: null, meal_plan: null,
          trial_start: null, reminder_sent: false,
          is_pro: hasRealSub ? true : false,
          updated_at: new Date().toISOString(),
        });
      } catch(e){ console.error("Supabase wipe error:", e); }
    }

    RESET_KEYS.forEach(k => localStorage.removeItem(k));
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <ThemeProvider isDark={isDark}>
    <div style={{ background:C.bg, minHeight:"100vh", fontFamily:FONT, color:C.text, width:"100%", overflowX:"hidden" }}>
      <style>{`* { box-sizing:border-box; margin:0; padding:0; } input,select,textarea { outline:none; } html,body { width:100%; overflow-x:hidden; background:${C.bg}; font-family:${FONT}; color-scheme:${isDark?"dark":"light"}; } #root { width:100%; } ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-thumb { background:${C.divider}; border-radius:4px; } ::placeholder { color:${C.muted}; }`}</style>

      <div style={{ paddingTop:"max(12px, env(safe-area-inset-top))", paddingLeft:18, paddingRight:18, paddingBottom:10, background:isDark?"rgba(0,0,0,0.85)":"rgba(242,242,247,0.95)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, zIndex:10, width:"100%" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center" }}>
              <span style={{ fontSize:22, fontWeight:800, letterSpacing:"-0.02em", fontFamily:FONT }}>
                <span style={{ color:isDark?"#ffffff":"#3d3d3d" }}>Lean</span><span style={{ color:"#3d8ef0" }}>Plan</span>
              </span>
            </div>
            <p style={{ fontSize:11, color:C.muted, margin:0 }}>{profile.name?.toUpperCase()||"YOUR PLAN"}</p>
          </div>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"6px 14px", textAlign:"right", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
            <div><span style={{ color:C.green, fontWeight:700, fontSize:16 }}>{toKg(lost)}</span><span style={{ color:C.muted, fontSize:13 }}> / {(profile.targetLbs*0.453592).toFixed(1)} kg</span></div>
            <div style={{ background:C.border, borderRadius:99, height:3, marginTop:4, overflow:"hidden", width:80 }}>
              <div style={{ width:`${pct}%`, height:"100%", background:`linear-gradient(90deg, ${C.accent}, ${C.green})`, borderRadius:99 }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding:"8px 14px 100px" }}>
        {/* Cancellation notice */}
        {isPro && proData?.cancelAt && (
          <div style={{ background:`linear-gradient(135deg, #2d1f00, #3d2a00)`, border:`1px solid rgba(255,159,10,0.4)`, borderRadius:14, padding:"12px 16px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <p style={{ color:"#ff9f0a", fontWeight:700, fontSize:13, margin:0 }}>⚠️ Subscription cancelled</p>
              <p style={{ color:"rgba(255,255,255,0.6)", fontSize:11, margin:"2px 0 0" }}>
                Access continues until {new Date(proData.cancelAt).toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" })}
              </p>
            </div>
            <button onClick={()=>setShowPaywall(true)} style={{ background:"#ff9f0a", border:"none", borderRadius:99, padding:"7px 14px", color:"#000", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:FONT, whiteSpace:"nowrap" }}>Resubscribe</button>
          </div>
        )}

        {/* Trial banner */}
        {!isPro && isTrialActive() && (()=>{
          const daysLeft = getTrialDaysLeft();
          const trialMsg = daysLeft >= 7
            ? { icon:"🎯", text:"Your personalised plan is ready", sub:"Everything is set up, just follow today's plan", color:"#34c759", bg:"linear-gradient(135deg,#0a2a1f,#0d3d2a)", border:"rgba(52,199,89,0.5)" }
            : daysLeft === 6
            ? { icon:"💪", text:"Day 2 — let's keep this going", sub:"Small wins today = big results later", color:"#34c759", bg:"linear-gradient(135deg,#0a2a1f,#0d3d2a)", border:"rgba(52,199,89,0.5)" }
            : daysLeft === 5
            ? { icon:"📈", text:"You're on track", sub:"Keep building the momentum", color:"#34c759", bg:"linear-gradient(135deg,#0a2a1f,#0d3d2a)", border:"rgba(52,199,89,0.5)" }
            : daysLeft === 4
            ? { icon:"🔒", text:"Your plan is working well", sub:"Keep everything moving in the right direction", color:"#0a84ff", bg:"linear-gradient(135deg,#0a1a2a,#0d2a3d)", border:"rgba(10,132,255,0.5)" }
            : daysLeft === 3
            ? { icon:"⏳", text:"Your trial is ending soon", sub:"Keep your plan going without interruption", color:"#ff9f0a", bg:"linear-gradient(135deg,#1a1200,#2a1e00)", border:"rgba(255,159,10,0.5)" }
            : daysLeft === 2
            ? { icon:"⚠️", text:"Nearly there — choose a plan to keep your progress going", sub:"", color:"#ff9f0a", bg:"linear-gradient(135deg,#1a1200,#2a1e00)", border:"rgba(255,159,10,0.6)" }
            : daysLeft === 1
            ? { icon:"🚨", text:"Last day of your trial", sub:"Continue your plan and keep your progress", color:"#ff453a", bg:"linear-gradient(135deg,#1a0a0a,#2a0d0d)", border:"rgba(255,69,58,0.6)" }
            : { icon:"🔒", text:"Your plan is paused", sub:"Unlock it to continue where you left off", color:"#ff453a", bg:"linear-gradient(135deg,#1a0a0a,#2a0d0d)", border:"rgba(255,69,58,0.6)" };
          return (
            <div style={{ background:trialMsg.bg, border:`1px solid ${trialMsg.border}`, borderRadius:14, padding:"12px 16px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ flex:1, marginRight:12 }}>
                <p style={{ color:trialMsg.color, fontWeight:700, fontSize:13, margin:0 }}>{trialMsg.icon} {trialMsg.text}</p>
                <p style={{ color:"rgba(255,255,255,0.6)", fontSize:11, margin:"2px 0 0" }}>{trialMsg.sub}</p>
              </div>
              <button onClick={()=>setShowPaywall(true)} style={{ background:trialMsg.color, border:"none", borderRadius:99, padding:"7px 14px", color: daysLeft <= 3 ? "#fff" : "#000", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:FONT, whiteSpace:"nowrap", flexShrink:0 }}>Subscribe →</button>
            </div>
          );
        })()}
        {!effectiveIsPro && <ProBanner onUpgrade={()=>setShowPaywall(true)} />}
        {generating && tab !== "Meals" && (
          <div onClick={()=>setTab("Meals")} style={{ background:`${C.accent}15`, border:`1px solid ${C.accent}33`, borderRadius:10, padding:"10px 14px", marginBottom:10, display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:C.accent, flexShrink:0, animation:"pulse 1.2s ease-in-out infinite" }} />
            <p style={{ color:C.accent, fontSize:13, fontWeight:600, margin:0, flex:1 }}>Generating your meal plan...</p>
            <span style={{ color:C.accent, fontSize:12 }}>View →</span>
          </div>
        )}

        {tab==="Today"&&<TodayTab profile={profile} entries={entries} mealLog={mealLog} setMealLog={setMealLog} workoutLog={workoutLog} water={water} setWater={setWater} journal={journal} setJournal={setJournal} measurements={measurements} mealPlan={mealPlan} setTab={setTab} />}
        <div style={{ display: tab==="Meals" ? "block" : "none" }}><MealsTab profile={profile} favourites={favourites} setFavourites={setFavourites} removed={removed} setRemoved={setRemoved} mealLog={mealLog} setMealLog={setMealLog} isPro={effectiveIsPro} onUpgrade={()=>setShowPaywall(true)} mealPlan={mealPlan} onSaveMealPlan={saveMealPlan} generating={generating} setGenerating={setGenerating} generateProgress={generateProgress} setGenerateProgress={setGenerateProgress} generateError={generateError} setGenerateError={setGenerateError} user={user} /></div>
        {tab==="Train"&&(effectiveIsPro ? <TrainTab profile={profile} workoutLog={workoutLog} setWorkoutLog={setWorkoutLog} setProfile={setProfile} savedWorkout={todaysWorkout} setSavedWorkout={setTodaysWorkout} /> : <LockedTab feature="Workout tracking, lift tracker and rest day planner" onUpgrade={()=>setShowPaywall(true)} />)}
        <div style={{ display: tab==="Track" ? "block" : "none" }}>{effectiveIsPro ? <TrackTab profile={profile} entries={entries} setEntries={fn=>setEntries(typeof fn==="function"?fn(entries):fn)} measurements={measurements} setMeasurements={setMeasurements} workoutLog={workoutLog} user={user} /> : <LockedTab feature="Progress tracking, measurements and body stats" onUpgrade={()=>setShowPaywall(true)} />}</div>
        {tab==="Coach"&&(effectiveIsPro ? <CoachTab profile={profile} setProfile={setProfile} mealPlan={mealPlan} mealLog={mealLog} workoutLog={workoutLog} entries={entries} isAdmin={proData?.customerId === "bypass"} /> : <LockedTab feature="AI personal coach" onUpgrade={()=>setShowPaywall(true)} />)}
        <div style={{ display: tab==="Profile" ? "block" : "none" }}><ProfileTab profile={profile} setProfile={setProfile} onReset={handleReset} isDark={isDark} darkOverride={darkOverride} setDarkOverride={setDarkOverride} isPro={effectiveIsPro} proData={proData} onUpgrade={()=>setShowPaywall(true)} user={user} onShowAuth={()=>setShowAuth(true)} onClearMealPlan={()=>saveMealPlan(null)} avatarUrl={avatarUrl} setAvatarUrl={setAvatarUrl} /></div>

      </div>

      {/* Paywall modal — outside scroll container */}
      {showPaywall && <PaywallModal onClose={()=>setShowPaywall(false)} />}

      <div style={{ position:"fixed", bottom:0, left:0, right:0, width:"100%", background:isDark?"rgba(0,0,0,0.85)":"rgba(242,242,247,0.95)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderTop:`1px solid ${C.border}`, display:"flex", padding:"8px 0 20px" }}>
        {TABS.map(t=>{
          const col=TAB_COLORS[t]; const active=tab===t;
          return <div key={t} onClick={()=>setTab(t)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", cursor:"pointer", gap:3 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:active?col:"transparent", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s" }}>
              <Icon name={TAB_ICON_MAP[t]} size={20} color={active?"#fff":C.muted} />
            </div>
            <span style={{ fontSize:10, fontWeight:active?700:600, color:active?col:"#555" }}>{t}</span>
          </div>;
        })}
      </div>

      {/* Weekly check-in modal */}
      {showWeeklyCheckIn && profile && (
        <WeeklyCheckIn
          profile={profile}
          onDone={() => setShowWeeklyCheckIn(false)}
          onAddEntry={(entry) => setEntries(prev => [...prev, entry])}
        />
      )}
    </div>
    </ThemeProvider>
  );
}

export default function App() {
  return <ErrorBoundary><AppInner /></ErrorBoundary>;
}