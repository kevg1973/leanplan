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
