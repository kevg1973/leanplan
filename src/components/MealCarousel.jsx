import React, { useState } from "react";
import { useTheme } from "../ThemeContext.jsx";
import { FONT } from "../constants.js";

export const MealCarousel = ({ meals, favourites, likedMeals, mealLog, today, onLike, onDislike, onLog, onRemoveLog, targetCals, isGuided, onSwap, swappingId }) => {
  const C = useTheme();
  const [activeIdx, setActiveIdx] = useState(0);
  const [showMethod, setShowMethod] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragDelta, setDragDelta] = useState(0);
  const [animDir, setAnimDir] = useState(null); // 'left' | 'right' | null
  const containerRef = React.useRef(null);

  const m = meals[activeIdx];
  const isFav = favourites.includes(m?.id);
  const isLogged = (mealLog[today]||[]).some(l=>l.id===m?.id);
  const isLiked = likedMeals.find(l=>l.name===m?.name);

  const goTo = (idx, dir) => {
    if (idx < 0 || idx >= meals.length) return;
    setAnimDir(dir);
    setTimeout(() => { setActiveIdx(idx); setShowMethod(false); setAnimDir(null); }, 180);
  };

  const handleTouchStart = e => {
    setDragStart(e.touches[0].clientX);
    setDragDelta(0);
  };
  const handleTouchMove = e => {
    if (dragStart === null) return;
    setDragDelta(e.touches[0].clientX - dragStart);
  };
  const handleTouchEnd = () => {
    if (Math.abs(dragDelta) > 50) {
      if (dragDelta < 0 && activeIdx < meals.length - 1) goTo(activeIdx + 1, 'left');
      else if (dragDelta > 0 && activeIdx > 0) goTo(activeIdx - 1, 'right');
    }
    setDragStart(null);
    setDragDelta(0);
  };

  const MEAL_COLORS = {
    breakfast: { grad: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", accent: "#f59e0b", label: "☀️ Breakfast" },
    snack:     { grad: "linear-gradient(135deg, #0f2027 0%, #203a43 100%)", accent: "#34d399", label: "🍎 Snack" },
    lunch:     { grad: "linear-gradient(135deg, #1a1a2e 0%, #2d1b69 100%)", accent: "#818cf8", label: "🥗 Lunch" },
    dinner:    { grad: "linear-gradient(135deg, #0f0c29 0%, #302b63 100%)", accent: "#f472b6", label: "🌙 Dinner" },
  };

  const mealType = m?.type || m?.tags?.find(t=>["breakfast","lunch","dinner","snack"].includes(t)) || "snack";
  const mc = MEAL_COLORS[mealType] || MEAL_COLORS.snack;

  const cardStyle = {
    background: mc.grad,
    borderRadius: 24,
    padding: "16px 16px 14px",
    marginBottom: 10,
    position: "relative",
    overflow: "hidden",
    transform: `translateX(${Math.max(-30, Math.min(30, dragDelta * 0.15))}px)`,
    transition: animDir ? "transform 0.18s ease, opacity 0.18s ease" : "transform 0.05s ease",
    opacity: animDir ? 0 : 1,
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    border: `1px solid rgba(255,255,255,0.08)`,
  };

  return (
    <div>
      {/* Dot nav + counter */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, padding:"0 2px" }}>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          {meals.map((_,i) => (
            <div key={i} onClick={()=>goTo(i, i>activeIdx?'left':'right')} style={{ width: i===activeIdx?20:7, height:7, borderRadius:99, background: i===activeIdx?C.accent:C.border, transition:"all 0.25s ease", cursor:"pointer" }} />
          ))}
        </div>
        <span style={{ color:C.muted, fontSize:12, fontWeight:600 }}>{activeIdx+1} / {meals.length}</span>
      </div>

      {/* Card */}
      <div
        ref={containerRef}
        style={cardStyle}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Decorative circle */}
        <div style={{ position:"absolute", top:-40, right:-40, width:160, height:160, borderRadius:"50%", background:`${mc.accent}15`, pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-20, left:-20, width:100, height:100, borderRadius:"50%", background:`${mc.accent}08`, pointerEvents:"none" }} />

        {/* Meal image */}
        {m.imageUrl && (
          <img src={m.imageUrl} alt={m.name} style={{ width:"calc(100% + 32px)", margin:"-16px -16px 12px", height:160, objectFit:"cover", borderRadius:"24px 24px 0 0", display:"block" }} />
        )}

        {/* Meal type label */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <span style={{ color:mc.accent, fontSize:11, fontWeight:700, letterSpacing:"0.08em", background:`${mc.accent}18`, padding:"3px 9px", borderRadius:99 }}>{mc.label.toUpperCase()}</span>
          <span style={{ color:"rgba(255,255,255,0.5)", fontSize:11 }}>{m.time}</span>
        </div>

        {/* Meal name */}
        <h3 style={{ color:"#fff", fontSize:18, fontWeight:800, margin:"0 0 8px", lineHeight:1.2, letterSpacing:"-0.01em" }}>{m.name}</h3>

        {/* Macros row */}
        <div style={{ display:"flex", gap:5, marginBottom:10 }}>
          <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:10, padding:"5px 6px", flex:1, textAlign:"center" }}>
            <div style={{ color:mc.accent, fontSize:14, fontWeight:800 }}>{m.cals}</div>
            <div style={{ color:"rgba(255,255,255,0.5)", fontSize:9, fontWeight:600, letterSpacing:"0.04em" }}>KCAL</div>
          </div>
          <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:10, padding:"5px 6px", flex:1, textAlign:"center" }}>
            <div style={{ color:"#34d399", fontSize:14, fontWeight:800 }}>{m.protein}g</div>
            <div style={{ color:"rgba(255,255,255,0.5)", fontSize:9, fontWeight:600, letterSpacing:"0.04em" }}>PROTEIN</div>
          </div>
          <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:10, padding:"5px 6px", flex:1, textAlign:"center" }}>
            <div style={{ color:"#818cf8", fontSize:14, fontWeight:800 }}>{m.carbs}g</div>
            <div style={{ color:"rgba(255,255,255,0.5)", fontSize:9, fontWeight:600, letterSpacing:"0.04em" }}>CARBS</div>
          </div>
          <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:10, padding:"5px 6px", flex:1, textAlign:"center" }}>
            <div style={{ color:"#fb923c", fontSize:14, fontWeight:800 }}>{m.fat}g</div>
            <div style={{ color:"rgba(255,255,255,0.5)", fontSize:9, fontWeight:600, letterSpacing:"0.04em" }}>FAT</div>
          </div>
        </div>

        {/* Ingredients + method — scrollable internally */}
        <div style={{ overflowY:"auto", maxHeight:140, marginBottom:8, WebkitOverflowScrolling:"touch" }}>
          {!showMethod && m.items.map((item,j) => (
            <div key={j} style={{ display:"flex", alignItems:"center", gap:8, padding:"3px 0", borderBottom: j < m.items.length-1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <div style={{ width:4, height:4, borderRadius:"50%", background:mc.accent, flexShrink:0 }} />
              <span style={{ color:"rgba(255,255,255,0.8)", fontSize:12 }}>{item}</span>
            </div>
          ))}
          {showMethod && m.method.split("\n").map((step,i) => (
            <p key={i} style={{ color:"rgba(255,255,255,0.8)", fontSize:12, lineHeight:1.6, margin:"0 0 4px" }}>{step}</p>
          ))}
        </div>

        {/* Method toggle */}
        <button
          onClick={()=>setShowMethod(v=>!v)}
          style={{ background:"rgba(255,255,255,0.08)", border:"none", borderRadius:10, padding:"7px 12px", color:mc.accent, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:FONT, width:"100%", textAlign:"left", display:"flex", justifyContent:"space-between", alignItems:"center" }}
        >
          <span>{showMethod ? "🥗 Show ingredients" : "📋 How to make this"}</span>
          <span style={{ opacity:0.6 }}>{showMethod?"▲":"▼"}</span>
        </button>
      </div>

      {/* Action buttons */}
      {isGuided ? (
        <div style={{ display:"flex", gap:8, marginBottom:8 }}>
          <button
            onClick={()=>onSwap(m)}
            disabled={swappingId === m.id}
            style={{ background:swappingId===m.id?C.sectionBg:`${C.accent}12`, border:`1.5px solid ${C.accent}`, borderRadius:12, padding:"8px 14px", color:C.accent, fontSize:12, fontWeight:700, cursor:swappingId===m.id?"default":"pointer", fontFamily:FONT, flexShrink:0 }}
          >{swappingId===m.id ? "⏳ Swapping..." : "⇄ Swap"}</button>
          <button
            onClick={()=>onDislike(m)}
            style={{ width:40, height:40, background:"none", border:`1.5px solid ${C.border}`, borderRadius:12, color:C.red, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}
            title="Never show this meal again"
          >👎</button>
          <button
            onClick={()=>{
              if(isLogged) {
                const idx = (mealLog[today]||[]).findIndex(l=>l.id===m?.id);
                if(idx !== -1) onRemoveLog(idx);
              } else {
                onLog(m);
              }
            }}
            style={{ flex:1, background:isLogged?`${C.green}15`:"none", border:`1.5px solid ${isLogged?C.green:C.border}`, borderRadius:12, padding:"8px 0", color:isLogged?C.green:C.text, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:FONT, transition:"all 0.2s" }}
          >{isLogged ? "✓ Undo" : "+ Log meal"}</button>
        </div>
      ) : (
        <div style={{ display:"flex", gap:8, marginBottom:8 }}>
          <button onClick={()=>onLike(m)} style={{ width:44, height:44, background:isLiked?`${C.green}20`:"none", border:`1.5px solid ${isLiked?C.green:C.border}`, borderRadius:12, color:C.green, fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }} title="Like this meal">👍</button>
          <button onClick={()=>onDislike(m)} style={{ width:44, height:44, background:"none", border:`1.5px solid ${C.border}`, borderRadius:12, color:C.red, fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }} title="Never show again">👎</button>
          <button onClick={()=>{
            if(isLogged) {
              const idx = (mealLog[today]||[]).findIndex(l=>l.id===m?.id);
              if(idx !== -1) onRemoveLog(idx);
            } else {
              onLog(m);
            }
          }} style={{ flex:1, background:isLogged?`${C.green}15`:"none", border:`1.5px solid ${isLogged?C.green:C.border}`, borderRadius:12, padding:"10px 0", color:isLogged?C.green:C.text, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:FONT, transition:"all 0.2s" }}>{isLogged ? "✓ Logged — tap to undo" : "+ Log Meal"}</button>
        </div>
      )}

      {/* Swipe hint — only on first card first visit */}
      {activeIdx === 0 && meals.length > 1 && (
        <p style={{ color:C.muted, fontSize:11, textAlign:"center", marginTop:4 }}>← Swipe to see all {meals.length} meals →</p>
      )}
    </div>
  );
};
