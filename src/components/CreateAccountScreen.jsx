import React, { useState } from "react";
import { supabase } from "../supabase.js";
import { useTheme } from "../ThemeContext.jsx";
import { FONT } from "../constants.js";
import { Btn, TInput } from "./ui.jsx";

export const CreateAccountScreen = ({ profileData, onDone }) => {
  const C = useTheme();
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

    // Send welcome email — fire and forget, don't block account creation
    try { fetch("/api/send-welcome", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ email, name: profileData?.name || "" }) }); } catch(e) {}

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

        {/* Google Sign In */}
        <button
          onClick={async () => {
            // Persist pending profile before redirect — state is lost on page reload
            try { localStorage.setItem("leanplan_pending_google_profile", JSON.stringify(profileData)); } catch(e){}
            const { error: oauthError } = await supabase.auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo: "https://app.leanplan.uk" },
            });
            if (oauthError) setError(oauthError.message);
          }}
          style={{ width:"100%", background:"#ffffff", border:"1px solid #dadce0", borderRadius:14, padding:"14px 0", display:"flex", alignItems:"center", justifyContent:"center", gap:10, cursor:"pointer", fontFamily:FONT, fontSize:16, fontWeight:600, color:"#3c4043", marginBottom:16 }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Continue with Google
        </button>

        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
          <div style={{ flex:1, height:1, background:C.border }} />
          <span style={{ color:C.muted, fontSize:13 }}>or</span>
          <div style={{ flex:1, height:1, background:C.border }} />
        </div>

        {/* Email form */}
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
