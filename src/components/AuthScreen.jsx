import React, { useState } from "react";
import { supabase } from "../supabase.js";
import { useTheme } from "../ThemeContext.jsx";
import { FONT } from "../constants.js";
import { Btn, TInput } from "./ui.jsx";

export const AuthScreen = ({ onAuth, onSkip, onStartFresh }) => {
  const C = useTheme();
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

        {/* Google Sign In */}
        {mode !== "forgot" && <>
          <button
            onClick={async () => {
              const { error: oauthError } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo: "https://www.leanplan.uk" },
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
        </>}

        {/* Email form */}
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
