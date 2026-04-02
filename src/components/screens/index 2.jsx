im;
}port React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { FONT } from "../../constants/theme.js";
import { getTrialDaysLeft, isTrialExpired, isTrialActive, toKg, getPace } from "../../utils/index.js";
import { TRIAL_DAYS } from "../../constants/config.js";
import { Card, Icon, Btn, TInput } from "../shared/index.jsx";
import { supabase } from "../../supabase.js";

// ── PRO BANNER ────────────────────────────────────────────────────────────────
export const ProBanner = ({ onUpgrade }) => {
  const { C } = useTheme();
  return (
  <div onClick={onUpgrade} style={{ background:"linear-gradient(135deg, #1c1c2e, #2d2b55)", borderRadius:14, padding:"12px 16px", marginBottom:14, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", boxShadow:"0 4px 16px rgba(88,86,214,0.3)", border:"1px solid rgba(88,86,214,0.4)" }}>
    <div style={{ flex:1, marginRight:10 }}>
      <p style={{ color:"#fff", fontWeight:700, fontSize:14, margin:0 }}>✦ Unlock LeanPlan Pro</p>
      <p style={{ color:"rgba(255,255,255,0.6)", fontSize:12, margin:"2px 0 0" }}>From £9.99/mo — AI coach, workouts & more</p>
    </div>
    <div style={{ background:"#5856d6", borderRadius:99, padding:"7px 14px", flexShrink:0 }}>
      <span style={{ color:"#fff", fontWeight:700, fontSize:13, whiteSpace:"nowrap" }}>Upgrade →</span>
    </div>
  </div>
  );
};

// ── LOCKED TAB ────────────────────────────────────────────────────────────────
export const LockedTab = ({ feature, onUpgrade }) => {
  const { C } = useTheme();
  return (
  <div style={{ textAlign:"center", padding:"60px 20px" }}>
    <div style={{ width:72, height:72, borderRadius:99, background:`${C.accent}15`, border:`2px solid ${C.accent}33`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
      <Icon name="target" size={32} color={C.accent} />
    </div>
    <h2 style={{ color:C.text, fontSize:22, fontWeight:700, marginBottom:10 }}>Pro Feature</h2>
    <p style={{ color:C.muted, fontSize:15, lineHeight:1.7, marginBottom:28, maxWidth:280, margin:"0 auto 28px" }}>{feature} is available on LeanPlan Pro.</p>
    <Btn onClick={onUpgrade} color="#5856d6" style={{ width:"100%", maxWidth:280 }}>✦ Unlock Pro from £9.99/mo</Btn>
    <p style={{ color:C.muted, fontSize:12, marginTop:14 }}>Cancel anytime. No commitment.</p>
  </div>
  );
};

// ── PAYWALL MODAL ─────────────────────────────────────────────────────────────
export const PaywallModal = ({ onClose }) => {
  const { C } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState("annual");
  const [loading, setLoading] = useState(false);

  const checkout = async () => {
    setLoading(true);
    const deviceId = localStorage.getItem("leanplan_device_id") || (() => {
      const id = Math.random().toString(36).slice(2);
      localStorage.setItem("leanplan_device_id", id);
      return id;
    })();
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan, deviceId }),
      });
      if (!res.ok) { alert("Payment setup failed. Please try again."); setLoading(false); return; }
      const data = await res.json();
      if (data.url) { window.location.href = data.url; }
      else { alert("Payment setup failed. Please try again."); setLoading(false); }
    } catch(err) { alert("Could not connect to payment server. Please try again."); setLoading(false); }
  };

  return (
    <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:1000, background:C.bg, overflowY:"auto", WebkitOverflowScrolling:"touch", paddingTop:"env(safe-area-inset-top)", paddingBottom:"env(safe-area-inset-bottom)" }}>
      {/* Close */}
      <button onClick={onClose} style={{ position:"sticky", top:16, float:"right", marginRight:16, background:C.sectionBg, border:"none", borderRadius:99, width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", zIndex:10 }}>
        <Icon name="close" size={16} color={C.muted} />
      </button>

      <div style={{ padding:"16px 20px 48px", maxWidth:480, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:24, paddingTop:8 }}>
          <h2 style={{ color:C.text, fontSize:28, fontWeight:800, margin:"0 0 10px", lineHeight:1.2, letterSpacing:"-0.3px" }}>Keep your<br/>personalised plan</h2>
          <p style={{ color:C.muted, fontSize:15, margin:0, lineHeight:1.5 }}>Your meals, workouts and progress are ready—<br/>keep everything going</p>
        </div>

        {/* Momentum banner */}
        <div style={{ background:`${C.green}12`, border:`1px solid ${C.green}33`, borderRadius:14, padding:"12px 16px", marginBottom:20, display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:22 }}>🏃</span>
          <p style={{ color:C.text, fontSize:14, fontWeight:600, margin:0 }}><strong>You've started your plan</strong> — keep the momentum going</p>
        </div>

        {/* Key features — simple checklist */}
        <div style={{ marginBottom:24 }}>
          {["Daily meals planned for you", "Structured workouts for your goal", "AI coach available 24/7", "Progress photos & measurements", "Automatic shopping lists"].map((f,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 0", borderBottom: i < 4 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ width:22, height:22, borderRadius:99, background:`${C.green}20`, border:`1.5px solid ${C.green}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <span style={{ color:C.green, fontSize:12, fontWeight:700 }}>✓</span>
              </div>
              <span style={{ color:C.text, fontSize:15 }}>{f}</span>
            </div>
          ))}
        </div>

        {/* Plan cards */}
        <div style={{ display:"flex", gap:10, marginBottom:16 }}>
          {/* Monthly */}
          <div onClick={()=>setSelectedPlan("monthly")} style={{ flex:1, border:`2px solid ${selectedPlan==="monthly"?C.accent:C.border}`, borderRadius:16, padding:"16px 12px", cursor:"pointer", background:selectedPlan==="monthly"?`${C.accent}08`:C.card, textAlign:"center", position:"relative" }}>
            <p style={{ color:C.muted, fontSize:13, fontWeight:600, margin:"0 0 6px" }}>Monthly</p>
            <p style={{ color:C.text, fontSize:26, fontWeight:800, margin:"0 0 2px", letterSpacing:"-0.5px" }}>£9.99<span style={{ fontSize:14, fontWeight:500 }}>/month</span></p>
            <div style={{ height:26, marginBottom:8 }} />
            <div style={{ borderTop:`1px solid ${C.border}`, marginBottom:10 }} />
            <div style={{ border:`1.5px solid ${selectedPlan==="monthly"?C.accent:C.border}`, borderRadius:99, padding:"6px 0", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              <div style={{ width:16, height:16, borderRadius:99, border:`2px solid ${selectedPlan==="monthly"?C.accent:C.border}`, background: selectedPlan==="monthly"?C.accent:"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                {selectedPlan==="monthly" && <span style={{ color:"#fff", fontSize:9, fontWeight:700 }}>✓</span>}
              </div>
              <span style={{ color:C.text, fontSize:13, fontWeight:600 }}>£9.99/month</span>
            </div>
          </div>

          {/* Annual */}
          <div onClick={()=>setSelectedPlan("annual")} style={{ flex:1, border:`2px solid ${selectedPlan==="annual"?C.green:C.border}`, borderRadius:16, padding:"16px 12px", cursor:"pointer", background:selectedPlan==="annual"?`${C.green}08`:C.card, textAlign:"center", position:"relative" }}>
            <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", background:"#f59e0b", color:"#fff", borderRadius:99, padding:"3px 12px", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>⭐ Most popular</div>
            <p style={{ color:C.muted, fontSize:13, fontWeight:600, margin:"0 0 6px" }}>Annual</p>
            <p style={{ color:C.text, fontSize:26, fontWeight:800, margin:"0 0 2px", letterSpacing:"-0.5px" }}>£99<span style={{ fontSize:14, fontWeight:500 }}>/year</span></p>
            <div style={{ display:"inline-block", background:`${C.accent}15`, borderRadius:99, padding:"2px 10px", marginBottom:8 }}>
              <span style={{ color:C.accent, fontSize:12, fontWeight:700 }}>Save £20</span>
            </div>
            <div style={{ borderTop:`1px solid ${C.border}`, marginBottom:10 }} />
            <div style={{ border:`1.5px solid ${selectedPlan==="annual"?C.green:C.border}`, borderRadius:99, padding:"6px 0", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              <div style={{ width:16, height:16, borderRadius:99, border:`2px solid ${selectedPlan==="annual"?C.green:C.border}`, background: selectedPlan==="annual"?C.green:"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                {selectedPlan==="annual" && <span style={{ color:"#fff", fontSize:9, fontWeight:700 }}>✓</span>}
              </div>
              <span style={{ color:C.text, fontSize:13, fontWeight:600 }}>£99/year</span>
            </div>
          </div>
        </div>

        <p style={{ color:C.muted, fontSize:12, textAlign:"center", margin:"0 0 16px" }}>Cancel anytime. No commitment.</p>

        {/* CTA */}
        <Btn onClick={checkout} disabled={loading} color={C.accent} style={{ width:"100%", fontSize:17, padding:"16px 0", marginBottom:10, borderRadius:14 }}>
          {loading ? "Loading..." : "Continue my fitness journey →"}
        </Btn>

        <p style={{ color:C.muted, fontSize:12, textAlign:"center", lineHeight:1.6, margin:0 }}>
          Secure payment by Stripe
        </p>
      </div>
    </div>
  );
};


// ── Error Boundary ────────────────────────────────────────────────────────────
export class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error: error.message }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding:40, fontFamily:"monospace", background:"#fff", minHeight:"100vh" }}>
          <h2 style={{ color:"red", marginBottom:16 }}>App Error</h2>
          <pre style={{ background:"#f5f5f5", padding:16, borderRadius:8, fontSize:12, whiteSpace:"pre-wrap", wordBreak:"break-all" }}>
            {this.state.error}
          </pre>
          <button onClick={()=>this.setState({error:null})} style={{ marginTop:16, padding:"8px 16px" }}>
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}



// ── Create Account Screen (shown after onboarding) ───────────────────────────
export const CreateAccountScreen = ({ profileData, onDone }) => {
  const { C } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("create"); // "create" | "signin"

  const saveProfileToSupabase = async (userId, trialStart) => {
    await supabase.from("profiles").upsert({
      id: userId,
      email,
      profile_data: profileData,
      trial_start: trialStart,
      reminder_sent: false,
      entries: [],
      favourites: [],
      removed: [],
      meal_log: {},
      workout_log: {},
      water: {},
      journal: {},
      measurements: [],
    });
  };

  const handleCreate = async () => {
    if (!email) { setError("Please enter your email address"); return; }
    if (!password || password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true); setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) { setError(signUpError.message); setLoading(false); return; }

    const userId = data.user?.id;
    if (!userId) { setError("Something went wrong — please try again"); setLoading(false); return; }

    const trialStart = new Date().toISOString();
    try { await saveProfileToSupabase(userId, trialStart); } catch(e) { console.error("Profile save error:", e); }

    setLoading(false);
    onDone(data.user, email);
  };

  const handleSignIn = async () => {
    if (!email) { setError("Please enter your email address"); return; }
    if (!password) { setError("Please enter your password"); return; }
    setLoading(true); setError(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) { setError("Incorrect email or password — please try again"); setLoading(false); return; }

    const userId = data.user?.id;
    if (!userId) { setError("Something went wrong — please try again"); setLoading(false); return; }

    // Save new onboarding profile over the existing (wiped) account
    const trialStart = new Date().toISOString();
    try { await saveProfileToSupabase(userId, trialStart); } catch(e) { console.error("Profile save error:", e); }

    setLoading(false);
    onDone(data.user, email);
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:FONT, display:"flex", flexDirection:"column", justifyContent:"center", padding:"0 20px" }}>
      <div style={{ maxWidth:400, margin:"0 auto", width:"100%" }}>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ fontSize:48, marginBottom:12 }}>{mode === "create" ? "🎉" : "👋"}</div>
          <h1 style={{ fontSize:26, fontWeight:800, color:C.text, margin:"0 0 10px" }}>
            {mode === "create" ? "Your personal plan is ready" : "Welcome back"}
          </h1>
          <p style={{ color:C.muted, fontSize:15, lineHeight:1.6, margin:0 }}>
            {mode === "create"
              ? "Create your account to save it. You'll have 7 days free to explore the app."
              : "Sign in to save your new plan to your existing account."}
          </p>
        </div>

        {/* Form */}
        <div style={{ marginBottom:14 }}>
          <p style={{ color:C.textSec, fontSize:13, fontWeight:500, marginBottom:6 }}>Email address</p>
          <TInput value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" type="email" autoComplete="email" />
        </div>
        <div style={{ marginBottom:20 }}>
          <p style={{ color:C.textSec, fontSize:13, fontWeight:500, marginBottom:6 }}>Password</p>
          <TInput value={password} onChange={e=>setPassword(e.target.value)} placeholder={mode === "create" ? "Min 6 characters" : "Your password"} type="password" autoComplete={mode === "create" ? "new-password" : "current-password"} />
        </div>

        {error && <div style={{ background:`${C.red}10`, border:`1px solid ${C.red}33`, borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
          <p style={{ color:C.red, fontSize:13, margin:0 }}>{error}</p>
        </div>}

        <Btn onClick={mode === "create" ? handleCreate : handleSignIn} disabled={loading} color={C.accent} style={{ width:"100%", fontSize:17, padding:"16px 0", marginBottom:16 }}>
          {loading ? (mode === "create" ? "Creating your account..." : "Signing in...") : (mode === "create" ? "Save My Plan" : "Sign In & Save My Plan")}
        </Btn>

        <p style={{ color:C.muted, fontSize:13, textAlign:"center", margin:"0 0 12px" }}>
          {mode === "create" ? "Already have an account?" : "Need a new account?"}
          {" "}
          <span onClick={()=>{ setMode(mode === "create" ? "signin" : "create"); setError(null); }} style={{ color:C.accent, fontWeight:600, cursor:"pointer" }}>
            {mode === "create" ? "Sign in instead" : "Create one instead"}
          </span>
        </p>

        {mode === "create" && <p style={{ color:C.muted, fontSize:12, textAlign:"center", lineHeight:1.6, margin:0 }}>
          By continuing you agree to our terms. Your 7-day free trial starts now. Cancel anytime.
        </p>}
      </div>
    </div>
  );
};

// ── Weekly Check-in Modal ─────────────────────────────────────────────────────
export const WeeklyCheckIn = ({ profile, onDone, onAddEntry }) => {
  const { C } = useTheme();
  const [weight, setWeight] = useState("");
  const [energy, setEnergy] = useState(null);
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);

  const energyLabels = ["😴 Drained", "😕 Low", "😐 OK", "😊 Good", "🔥 Great"];

  const handleSubmit = () => {
    // Save weight entry if provided
    if (weight) {
      const weightKg = parseFloat(weight);
      const weightLbs = weightKg / 0.453592;
      onAddEntry({ weight: weightLbs, weightKg, label: `W`, date: new Date().toLocaleDateString("en-GB", { day:"numeric", month:"short" }) });
    }
    // Record check-in date
    const thisWeekMonday = (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1); return d.toISOString().split("T")[0]; })();
    localStorage.setItem("leanplan_last_checkin", thisWeekMonday);
    setDone(true);
    setTimeout(() => onDone(), 1500);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:200, fontFamily:FONT }}>
      <div style={{ background:C.bg, borderRadius:"20px 20px 0 0", padding:"24px 20px 40px", width:"100%", maxWidth:480 }}>
        {done ? (
          <div style={{ textAlign:"center", padding:"20px 0" }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🎯</div>
            <h3 style={{ color:C.text, fontSize:20, fontWeight:700, margin:"0 0 8px" }}>Check-in saved!</h3>
            <p style={{ color:C.muted, fontSize:14, margin:0 }}>Have a great week.</p>
          </div>
        ) : (
          <>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div>
                <p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", margin:"0 0 2px" }}>WEEKLY CHECK-IN</p>
                <h3 style={{ color:C.text, fontSize:20, fontWeight:700, margin:0 }}>How was your week?</h3>
              </div>
              <button onClick={()=>{ localStorage.setItem("leanplan_last_checkin", (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1); return d.toISOString().split("T")[0]; })()); onDone(); }} style={{ background:"none", border:"none", color:C.muted, fontSize:22, cursor:"pointer", lineHeight:1 }}>×</button>
            </div>

            {/* Weight */}
            <div style={{ marginBottom:20 }}>
              <p style={{ color:C.textSec, fontSize:13, fontWeight:600, margin:"0 0 8px" }}>Current weight (kg)</p>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <TInput value={weight} onChange={e=>setWeight(e.target.value)} placeholder={profile?.startWeightKg ? `Last: ${toKg(profile.startWeightLbs)} kg` : "e.g. 83.5"} type="number" style={{ flex:1 }} />
                <span style={{ color:C.muted, fontSize:14 }}>kg</span>
              </div>
            </div>

            {/* Energy rating */}
            <div style={{ marginBottom:20 }}>
              <p style={{ color:C.textSec, fontSize:13, fontWeight:600, margin:"0 0 8px" }}>Energy levels this week</p>
              <div style={{ display:"flex", gap:8 }}>
                {energyLabels.map((label, i) => (
                  <button key={i} onClick={()=>setEnergy(i+1)} style={{ flex:1, background:energy===i+1?C.accent:`${C.accent}12`, border:`1.5px solid ${energy===i+1?C.accent:`${C.accent}33`}`, borderRadius:10, padding:"8px 4px", cursor:"pointer", fontFamily:FONT }}>
                    <div style={{ fontSize:18, marginBottom:2 }}>{label.split(" ")[0]}</div>
                    <div style={{ color:energy===i+1?"#fff":C.muted, fontSize:10, fontWeight:600 }}>{i+1}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div style={{ marginBottom:20 }}>
              <p style={{ color:C.textSec, fontSize:13, fontWeight:600, margin:"0 0 8px" }}>Anything to note? <span style={{ color:C.muted, fontWeight:400 }}>(optional)</span></p>
              <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Sleep, stress, injuries, wins..." style={{ width:"100%", background:C.sectionBg, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 12px", fontSize:14, fontFamily:FONT, color:C.text, outline:"none", resize:"none", height:72, boxSizing:"border-box" }} />
            </div>

            <Btn onClick={handleSubmit} color={C.accent} style={{ width:"100%", fontSize:16, padding:"14px 0" }}>
              Save check-in
            </Btn>
          </>
        )}
      </div>
    </div>
  );
};

// ── Welcome Screen ────────────────────────────────────────────────────────────
export const WelcomeScreen = ({ onNew, onSignIn }) => {
  const { C } = useTheme();
  return (
  <div style={{ minHeight:"100vh", background:C.bg, fontFamily:FONT, display:"flex", flexDirection:"column", justifyContent:"center", padding:"0 20px" }}>
    <div style={{ maxWidth:400, margin:"0 auto", width:"100%", textAlign:"center" }}>
      <img src="/leanplan_app_icon.png" alt="" style={{ height:88, width:88, borderRadius:22, marginBottom:24 }} />
      <h1 style={{ fontSize:32, fontWeight:800, color:C.text, margin:"0 0 10px" }}>
        <span style={{ color:C.text }}>Lean</span><span style={{ color:C.accent }}>Plan</span>
      </h1>
      <p style={{ color:C.muted, fontSize:16, lineHeight:1.7, marginBottom:48 }}>Your personal AI health & fitness coach</p>

      <Btn onClick={onNew} color={C.accent} style={{ width:"100%", fontSize:17, padding:"16px 0", marginBottom:14 }}>
        Get Started →
      </Btn>

      <button onClick={onSignIn} style={{ width:"100%", background:"none", border:`1.5px solid ${C.border}`, borderRadius:14, padding:"15px 0", color:C.text, fontSize:16, fontWeight:600, cursor:"pointer", fontFamily:FONT }}>
        I already have an account
      </button>

      <p style={{ color:C.muted, fontSize:12, marginTop:24, lineHeight:1.6 }}>
        Takes 3 minutes · Fully personalised to you
      </p>
    </div>
  </div>
  );
};


// ── Trial Expired Screen ──────────────────────────────────────────────────────
export const TrialExpiredScreen = ({ onSubscribe }) => {
  const { C } = useTheme();
  return (
  <div style={{ minHeight:"100vh", background:C.bg, fontFamily:FONT, display:"flex", flexDirection:"column", justifyContent:"center", padding:"0 20px" }}>
    <div style={{ maxWidth:400, margin:"0 auto", width:"100%", textAlign:"center" }}>
      <img src="/leanplan_app_icon.png" alt="" style={{ height:80, width:80, borderRadius:20, marginBottom:24 }} />
      <h1 style={{ fontSize:28, fontWeight:800, color:C.text, margin:"0 0 12px" }}>Your 7-day trial has ended</h1>
      <p style={{ color:C.muted, fontSize:15, lineHeight:1.7, marginBottom:24 }}>
        You've had full access to AI meal generation, personalised workouts and your AI health coach. Subscribe to keep it all going.
      </p>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"16px", marginBottom:24, textAlign:"left" }}>
        {[
          "✦ AI meal plans tailored to your diet",
          "✦ Personalised workout programmes",
          "✦ Unlimited AI health coach",
          "✦ Progress tracking & measurements",
          "✦ Shopping lists & supplement guide",
          "✦ Data synced across all devices",
        ].map((f,i)=><p key={i} style={{ color:C.text, fontSize:14, margin:"6px 0" }}>{f}</p>)}
      </div>
      <Btn onClick={onSubscribe} color={C.accent} style={{ width:"100%", fontSize:17, padding:"16px 0", marginBottom:12 }}>
        Continue my fitness journey →
      </Btn>
      <p style={{ color:C.muted, fontSize:12, lineHeight:1.6 }}>
        Cancel anytime · Secure payment by Stripe
      </p>
    </div>
  </div>
);

// ── Auth Screen ───────────────────────────────────────────────────────────────
export const AuthScreen = ({ onAuth, onSkip, onStartFresh }) => {
  const { C } = useTheme();
  const [mode, setMode] = useState("login"); // login, signup, forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleAuth = async () => {
    if (!email || !password) { setError("Please enter your email and password"); return; }
    setLoading(true); setError(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { emailRedirectTo: "https://www.leanplan.uk" }
        });
        if (error) throw error;
        setMessage("Account created! Please check your email to verify, then log in.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuth();
      }
    } catch(err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleForgot = async () => {
    if (!email) { setError("Enter your email address first"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reset email");
      setMessage("Check your inbox — we've sent you a temporary password.");
    } catch(err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:FONT, display:"flex", flexDirection:"column", justifyContent:"center", padding:"0 20px" }}>
      <div style={{ maxWidth:400, margin:"0 auto", width:"100%" }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <img src="/leanplan_app_icon.png" alt="" style={{ height:72, width:72, borderRadius:18, marginBottom:16 }} />
          <h1 style={{ fontSize:32, fontWeight:800, color:C.text, margin:"0 0 8px" }}>
            <span style={{ color:C.text }}>Lean</span><span style={{ color:C.accent }}>Plan</span>
          </h1>
          <p style={{ color:C.muted, fontSize:15 }}>{onSkip ? 'Sign in to your account' : 'Create a free account to save your plan'}</p>
        </div>

        {/* Mode tabs */}
        {mode !== "forgot" && <div style={{ marginBottom:24 }}>
          <h2 style={{ color:C.text, fontSize:22, fontWeight:700, margin:0 }}>Sign in to your account</h2>
          <p style={{ color:C.muted, fontSize:14, margin:"6px 0 0" }}>Your plan and data will sync to this device</p>
        </div>}

        {mode === "forgot" && <div style={{ marginBottom:24 }}>
          <h2 style={{ color:C.text, fontSize:22, fontWeight:700, marginBottom:6 }}>Reset Password</h2>
          <p style={{ color:C.muted, fontSize:14 }}>Enter your email and we'll send you a reset link.</p>
        </div>}

        {/* Form */}
        <div style={{ marginBottom:14 }}>
          <p style={{ color:C.textSec, fontSize:13, fontWeight:500, marginBottom:6 }}>Email</p>
          <TInput value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" type="email" />
        </div>
        {mode !== "forgot" && <div style={{ marginBottom:20 }}>
          <p style={{ color:C.textSec, fontSize:13, fontWeight:500, marginBottom:6 }}>Password</p>
          <TInput value={password} onChange={e=>setPassword(e.target.value)} placeholder={mode==="signup"?"Min 6 characters":"Password"} type="password" />
        </div>}

        {error && <div style={{ background:`${C.red}10`, border:`1px solid ${C.red}33`, borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
          <p style={{ color:C.red, fontSize:13, margin:0 }}>{error}</p>
        </div>}
        {message && <div style={{ background:`${C.green}10`, border:`1px solid ${C.green}33`, borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
          <p style={{ color:C.green, fontSize:13, margin:0 }}>{message}</p>
        </div>}

        {mode !== "forgot"
          ? <Btn onClick={handleAuth} disabled={loading} color={C.accent} style={{ width:"100%", marginBottom:12 }}>
              {loading ? "Please wait..." : mode==="signup" ? "Create Account" : "Sign In"}
            </Btn>
          : <Btn onClick={handleForgot} disabled={loading} color={C.accent} style={{ width:"100%", marginBottom:12 }}>
              {loading ? "Sending..." : "Send Reset Email"}
            </Btn>
        }

        {mode === "login" && <p onClick={()=>{setMode("forgot");setError(null);}} style={{ color:C.accent, fontSize:13, textAlign:"center", cursor:"pointer", marginBottom:16 }}>Forgot password?</p>}
        {mode === "forgot" && <p onClick={()=>{setMode("login");setError(null);}} style={{ color:C.accent, fontSize:13, textAlign:"center", cursor:"pointer", marginBottom:16 }}>← Back to sign in</p>}
        {mode === "login" && onSkip && <p onClick={onSkip} style={{ color:C.muted, fontSize:13, textAlign:"center", cursor:"pointer", marginBottom:16 }}>← Back</p>}

        {onStartFresh && mode === "login" && <>
          <div style={{ display:"flex", alignItems:"center", gap:12, margin:"16px 0" }}>
            <div style={{ flex:1, height:1, background:C.border }} />
            <span style={{ color:C.muted, fontSize:13 }}>or</span>
            <div style={{ flex:1, height:1, background:C.border }} />
          </div>
          <p onClick={onStartFresh} style={{ color:C.muted, fontSize:13, textAlign:"center", cursor:"pointer" }}>
            Start fresh with a new account
          </p>
        </>}

        {onSkip && <>
          <div style={{ display:"flex", alignItems:"center", gap:12, margin:"16px 0" }}>
            <div style={{ flex:1, height:1, background:C.border }} />
            <span style={{ color:C.muted, fontSize:13 }}>or</span>
            <div style={{ flex:1, height:1, background:C.border }} />
          </div>
          <button onClick={onSkip} style={{ width:"100%", background:"none", border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 0", color:C.muted, fontSize:15, cursor:"pointer", fontFamily:FONT }}>
            Maybe later
          </button>
          <p style={{ color:C.muted, fontSize:11, textAlign:"center", marginTop:10, lineHeight:1.6 }}>
            Without an account your data is only saved on this device.
          </p>
        </>}
        {!onSkip && <p style={{ color:C.muted, fontSize:11, textAlign:"center", marginTop:16, lineHeight:1.6 }}>
          An account is required to save your plan and take out a subscription.
        </p>}
      </div>
    </div>
  );
};

