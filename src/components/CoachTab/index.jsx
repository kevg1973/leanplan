import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { FONT } from "../../constants/theme.js";
import { todayKey, toKg } from "../../utils/index.js";
import { Card, Icon, Btn } from "../shared/index.jsx";

// ── COACH TAB ─────────────────────────────────────────────────────────────────
export const CoachTab = ({ profile, setProfile, mealPlan, mealLog, workoutLog, entries, isAdmin=false }) => {
  const { C } = useTheme();
  const COACH_DAILY_LIMIT = 20;
  const getCoachUsage = () => {
    try {
      const raw = localStorage.getItem("leanplan_coach_count");
      if (!raw) return { count:0, date:todayKey() };
      const parsed = JSON.parse(raw);
      if (parsed.date !== todayKey()) return { count:0, date:todayKey() };
      return parsed;
    } catch { return { count:0, date:todayKey() }; }
  };
  const incrementCoachUsage = () => {
    const usage = getCoachUsage();
    const updated = { count: usage.count + 1, date: todayKey() };
    localStorage.setItem("leanplan_coach_count", JSON.stringify(updated));
    return updated.count;
  };

  // Build live context for the AI
  const buildContext = () => {
    const today = todayKey();
    const todayLog = mealLog?.[today] || [];
    const todayCaloriesLogged = todayLog.reduce((a,m)=>a+m.cals, 0);
    const todayProteinLogged = todayLog.reduce((a,m)=>a+m.protein, 0);

    // Workouts this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const weekDays = Array.from({length:7},(_,i)=>{ const d=new Date(weekStart); d.setDate(d.getDate()+i); return d.toISOString().split("T")[0]; });
    const workoutsThisWeek = weekDays.filter(d => workoutLog?.[d]).length;

    // Last workout
    const allWorkoutDates = Object.keys(workoutLog||{}).sort().reverse();
    const lastWorkoutDate = allWorkoutDates[0] || null;
    const daysSinceLastWorkout = lastWorkoutDate
      ? Math.floor((new Date(today) - new Date(lastWorkoutDate)) / (1000*60*60*24))
      : null;

    // Weight progress
    const startWeightKg = profile?.startWeightLbs ? parseFloat((profile.startWeightLbs * 0.453592).toFixed(1)) : null;
    const latestEntry = entries?.length > 0 ? entries[entries.length-1] : null;
    const currentWeightKg = latestEntry ? parseFloat((latestEntry.weight * 0.453592).toFixed(1)) : startWeightKg;
    const weightLostKg = startWeightKg && currentWeightKg ? parseFloat((startWeightKg - currentWeightKg).toFixed(1)) : null;

    // Programme progress
    const weeksIntoProgramme = profile?.trainingStartDate
      ? Math.floor((Date.now() - new Date(profile.trainingStartDate)) / (7*24*60*60*1000))
      : 0;

    // Today's training
    const dayOfWeek = new Date().getDay();
    const dayMap = { Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6, Sun:0 };
    const weekPlan = (() => {
      const days = profile?.workoutsPerWeek || 3;
      const goal = profile?.goal || "lose_weight";
      const daySuggestions = { 2:["Mon","Thu"], 3:["Mon","Wed","Fri"], 4:["Mon","Tue","Thu","Fri"], 5:["Mon","Tue","Wed","Thu","Sat"] };
      const suggestedDays = daySuggestions[Math.min(days,5)] || daySuggestions[3];
      const sessionIndex = suggestedDays.findIndex(d => dayMap[d] === dayOfWeek);
      return sessionIndex !== -1 ? { isTrainingDay:true, sessionIndex } : { isTrainingDay:false };
    })();

    // Today's planned meals
    const todayMealPlanDay = mealPlan?.days?.find(d => d.date === today);
    const todayMealNames = todayMealPlanDay?.meals?.map(m=>m.name) || [];

    const calTarget = mealPlan?.dailyCalTarget || (profile?.heightCm && profile?.startWeightLbs && profile?.age ? null : null);
    const protTarget = mealPlan?.dailyProteinTarget || null;

    return {
      todayDate: today,
      todayDayName: new Date().toLocaleDateString("en-GB", {weekday:"long"}),
      isTrainingDay: weekPlan.isTrainingDay,
      todaySessionType: null, // could extend later
      todayCaloriesLogged,
      todayProteinLogged,
      dailyCalTarget: calTarget || 1800,
      dailyProteinTarget: protTarget || 150,
      workoutsThisWeek,
      workoutsPerWeekTarget: profile?.workoutsPerWeek || 3,
      lastWorkoutDate,
      daysSinceLastWorkout,
      currentWeightKg,
      startWeightKg,
      weightLostKg,
      weeksIntoProgramme,
      hasMealPlan: !!mealPlan,
      mealPlanDays: mealPlan?.days?.length || 0,
      mealPlanDate: mealPlan?.generatedDate || null,
      todayMealNames,
      coreProteins: mealPlan?.coreProteins || [],
    };
  };

  const context = buildContext();

  const [messages, setMessages] = useState([
    { role:"assistant", content:`Hi ${profile.name||"there"}! 👋 I'm your personal coach. Ask me anything about your diet, workouts, or how you're feeling.

For example:
• "I don't like broccoli"
• "My lower back is aching after rows"
• "What should I eat before a workout?"
• "How am I doing this week?"` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [coachUsage, setCoachUsage] = useState(() => getCoachUsage());
  const bottomRef = useState(null);
  const messagesEndRef = { current: null };

  const showNotification = (msg, color=C.green) => {
    setNotification({ msg, color });
    setTimeout(() => setNotification(null), 3000);
  };

  const applyAction = (action) => {
    if (!action) return;
    const { type, value } = action;

    if (type === "add_dislike") {
      const v = value.trim();
      if (!profile.dislikes?.includes(v)) {
        setProfile(p => ({ ...p, dislikes: [...(p.dislikes||[]), v] }));
        showNotification(`✓ Added "${v}" to your food dislikes`, C.orange);
      }
    } else if (type === "remove_dislike") {
      const v = value.trim();
      setProfile(p => ({ ...p, dislikes: (p.dislikes||[]).filter(d => d.toLowerCase() !== v.toLowerCase()) }));
      showNotification(`✓ Removed "${v}" from your dislikes`, C.green);
    } else if (type === "add_allergy") {
      const v = value.trim();
      if (!profile.allergies?.includes(v)) {
        setProfile(p => ({ ...p, allergies: [...(p.allergies||[]), v] }));
        showNotification(`✓ Added "${v}" as an allergy — meals updated`, C.red);
      }
    } else if (type === "add_pain") {
      const existing = profile.pains || [];
      const entry = { desc: value, date: todayKey() };
      setProfile(p => ({ ...p, pains: [...existing, entry] }));
      showNotification(`✓ Pain noted — exercise suggestions adjusted`, C.pink);
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    if (!isAdmin && coachUsage.count >= COACH_DAILY_LIMIT) {
      setMessages(m => [...m, { role:"assistant", content:"You've reached your 20 message limit for today. Your allowance resets at midnight — I'll be here when you're back! 💪" }]);
      return;
    }
    setInput("");

    const newMessages = [...messages, { role:"user", content:text }];
    setMessages(newMessages);
    setLoading(true);
    if (!isAdmin) setCoachUsage({ count: incrementCoachUsage(), date: todayKey() });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.filter(m => m.role !== "system").slice(-15),
          profile,
          context,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages(m => [...m, { role:"assistant", content:data.text }]);
      if (data.action) applyAction(data.action);
    } catch (err) {
      setMessages(m => [...m, { role:"assistant", content:"Sorry, I couldn't connect right now. Please try again in a moment." }]);
    }
    setLoading(false);
  };

  const handleKey = e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  const SUGGESTIONS = [
    "I don't like cauliflower",
    "My lower back is aching",
    "What should I eat before a workout?",
    "I'm feeling really tired this week",
    "Can I eat more on training days?",
    "I'm bored of chicken",
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 180px)" }}>
      {/* Notification toast */}
      {notification && (
        <div style={{ position:"fixed", top:80, left:"50%", transform:"translateX(-50%)", background:notification.color, color:"#fff", borderRadius:12, padding:"10px 18px", fontSize:14, fontWeight:600, zIndex:100, boxShadow:"0 4px 16px rgba(0,0,0,0.15)", whiteSpace:"nowrap" }}>
          {notification.msg}
        </div>
      )}

      {/* Live context summary */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"10px 14px", marginBottom:12 }}>
        <p style={{ color:C.muted, fontSize:11, fontWeight:700, letterSpacing:"0.06em", margin:"0 0 8px" }}>RIGHT NOW</p>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {/* Training day / rest day */}
          <div style={{ background:context.isTrainingDay?`${C.accent}12`:`${C.green}12`, borderRadius:8, padding:"4px 10px" }}>
            <span style={{ color:context.isTrainingDay?C.accent:C.green, fontSize:12, fontWeight:600 }}>{context.isTrainingDay?"🏋️ Training day":"💚 Rest day"}</span>
          </div>
          {/* Calories */}
          {context.dailyCalTarget && (
            <div style={{ background:C.sectionBg, borderRadius:8, padding:"4px 10px" }}>
              <span style={{ color:C.text, fontSize:12 }}>
                <span style={{ fontWeight:700, color:C.accent }}>{context.todayCaloriesLogged}</span>
                <span style={{ color:C.muted }}> / {context.dailyCalTarget} cal</span>
              </span>
            </div>
          )}
          {/* Protein */}
          {context.dailyProteinTarget && (
            <div style={{ background:C.sectionBg, borderRadius:8, padding:"4px 10px" }}>
              <span style={{ color:C.text, fontSize:12 }}>
                <span style={{ fontWeight:700, color:C.green }}>{context.todayProteinLogged}g</span>
                <span style={{ color:C.muted }}> / {context.dailyProteinTarget}g protein</span>
              </span>
            </div>
          )}
          {/* Workouts */}
          <div style={{ background:C.sectionBg, borderRadius:8, padding:"4px 10px" }}>
            <span style={{ color:C.text, fontSize:12 }}>
              <span style={{ fontWeight:700, color:context.workoutsThisWeek>=context.workoutsPerWeekTarget?C.green:C.orange }}>{context.workoutsThisWeek}</span>
              <span style={{ color:C.muted }}> / {context.workoutsPerWeekTarget} workouts</span>
            </span>
          </div>
          {/* Weight lost */}
          {context.weightLostKg !== null && context.weightLostKg > 0 && (
            <div style={{ background:`${C.green}12`, borderRadius:8, padding:"4px 10px" }}>
              <span style={{ color:C.green, fontSize:12, fontWeight:600 }}>▼ {context.weightLostKg}kg lost</span>
            </div>
          )}
        </div>
      </div>

      {/* Pain log if any */}
      {(profile.pains||[]).length > 0 && (
        <div style={{ background:`${C.red}08`, border:`1px solid ${C.red}22`, borderRadius:12, padding:"10px 14px", marginBottom:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
            <Icon name="warning" size={13} color={C.red} />
            <p style={{ color:C.red, fontSize:12, fontWeight:700, margin:0 }}>LOGGED PAIN / INJURIES</p>
          </div>
          {(profile.pains||[]).map((p,i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:C.textSec, padding:"2px 0" }}>
              <span>{p.desc}</span>
              <span style={{ color:C.muted, fontSize:11 }}>{fmtDate(p.date)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", marginBottom:12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start", marginBottom:10 }}>
            {m.role==="assistant" && (
              <div style={{ width:30, height:30, borderRadius:99, background:`linear-gradient(135deg, ${C.pink}, ${C.purple})`, display:"flex", alignItems:"center", justifyContent:"center", marginRight:8, flexShrink:0, marginTop:2 }}>
                <Icon name="tip" size={15} color="#fff" />
              </div>
            )}
            <div style={{
              maxWidth:"78%",
              background: m.role==="user" ? C.accent : C.card,
              color: m.role==="user" ? "#fff" : C.text,
              borderRadius: m.role==="user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              padding:"11px 14px",
              fontSize:14,
              lineHeight:1.65,
              boxShadow:"0 1px 3px rgba(0,0,0,0.08)",
              border: m.role==="assistant" ? `1px solid ${C.border}` : "none",
              whiteSpace:"pre-wrap",
            }}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:30, height:30, borderRadius:99, background:`linear-gradient(135deg, ${C.pink}, ${C.purple})`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Icon name="tip" size={15} color="#fff" />
            </div>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:"18px 18px 18px 4px", padding:"12px 16px" }}>
              <div style={{ display:"flex", gap:4 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width:7, height:7, borderRadius:99, background:C.muted, animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={el => { messagesEndRef.current = el; if(el) el.scrollIntoView({behavior:"smooth"}); }} />
      </div>

      {/* Quick suggestions (only if no user messages yet) */}
      {messages.filter(m=>m.role==="user").length === 0 && (
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
          {SUGGESTIONS.map((s,i) => (
            <span key={i} onClick={() => { setInput(s); }} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:99, padding:"6px 12px", fontSize:12, color:C.textSec, cursor:"pointer", boxShadow:"0 1px 2px rgba(0,0,0,0.05)" }}>{s}</span>
          ))}
        </div>
      )}

      {/* Input */}
      {!isAdmin && (
        <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:4 }}>
          <span style={{ fontSize:11, color: coachUsage.count >= COACH_DAILY_LIMIT ? C.red : coachUsage.count >= 15 ? C.orange : C.muted, fontWeight: coachUsage.count >= 15 ? 600 : 400 }}>
            {coachUsage.count} / {COACH_DAILY_LIMIT} messages today
          </span>
        </div>
      )}
      <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask your coach anything..."
          rows={1}
          style={{ flex:1, background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"12px 14px", fontSize:15, fontFamily:FONT, color:C.text, outline:"none", resize:"none", lineHeight:1.5, maxHeight:100, overflowY:"auto", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}
          onInput={e => { e.target.style.height="auto"; e.target.style.height=Math.min(e.target.scrollHeight,100)+"px"; }}
        />
        <button onClick={send} disabled={!input.trim()||loading} style={{ width:44, height:44, borderRadius:99, background:input.trim()&&!loading?C.pink:C.border, border:`1.5px solid ${input.trim()&&!loading?C.pink:C.divider}`, cursor:input.trim()&&!loading?"pointer":"default", display:"flex", alignItems:"center", justifyContent:"center", transition:"background 0.2s", flexShrink:0 }}>
          <Icon name="arrow" size={20} color={input.trim()&&!loading?"#fff":C.muted} />
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
};


