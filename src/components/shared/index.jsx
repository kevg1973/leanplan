import React from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import { FONT } from "../../constants/theme.js";
import { PACE_OPTIONS } from "../../constants/config.js";

export const TAB_ICON_MAP = { Today:"home", Meals:"meals", Train:"train", Track:"track", Coach:"tip", Profile:"profile" };

// ── SVG Icon system ───────────────────────────────────────────────────────────
export const Icon = ({ name, size=22, color="currentColor", style={} }) => {
  const paths = {
    home:      <><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/><path d="M9 21V12h6v9" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>,
    meals:     <><circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth="1.8"/><path d="M12 7v5l3 3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>,
    train:     <><path d="M6 4v16M18 4v16M6 12h12" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><circle cx="6" cy="4" r="2" fill={color}/><circle cx="6" cy="20" r="2" fill={color}/><circle cx="18" cy="4" r="2" fill={color}/><circle cx="18" cy="20" r="2" fill={color}/></>,
    track:     <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>,
    profile:   <><circle cx="12" cy="8" r="4" fill="none" stroke={color} strokeWidth="1.8"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>,
    water:     <><path d="M12 2C12 2 5 10 5 15a7 7 0 0014 0c0-5-7-13-7-13z" fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/></>,
    fire:      <><path d="M12 2c0 0-5 5-5 10a5 5 0 0010 0C17 7 12 2 12 2z" fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/><path d="M12 12c0 0-2 2-2 4a2 2 0 004 0c0-2-2-4-2-4z" fill={color}/></>,
    tip:       <><circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="1.8"/><path d="M12 8v4M12 16h.01" stroke={color} strokeWidth="2" strokeLinecap="round"/></>,
    check:     <><polyline points="20 6 9 17 4 12" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></>,
    star:      <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/></>,
    starFill:  <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill={color} stroke={color} strokeWidth="1.8" strokeLinejoin="round"/></>,
    heart:     <><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/></>,
    calendar:  <><rect x="3" y="4" width="18" height="18" rx="2" fill="none" stroke={color} strokeWidth="1.8"/><line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.8"/></>,
    weight:    <><circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth="1.8"/><path d="M8 12h8M12 8v8" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>,
    ruler:     <><path d="M2 12h20M2 12l4-4M2 12l4 4M6 8v8M10 10v4M14 10v4M18 8v8" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>,
    chart:     <><polyline points="4 20 4 4" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><polyline points="4 20 20 20" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><polyline points="4 16 8 10 12 13 16 7 20 4" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>,
    barbell:   <><line x1="2" y1="12" x2="22" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><rect x="2" y="9" width="3" height="6" rx="1" fill={color}/><rect x="19" y="9" width="3" height="6" rx="1" fill={color}/><rect x="6" y="7" width="3" height="10" rx="1" fill={color}/><rect x="15" y="7" width="3" height="10" rx="1" fill={color}/></>,
    run:       <><circle cx="16" cy="4" r="2" fill={color}/><path d="M8 21l4-8 4 4 2-6" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 13l2-2 4 1" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>,
    settings:  <><circle cx="12" cy="12" r="3" fill="none" stroke={color} strokeWidth="1.8"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>,
    arrow:     <><line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><polyline points="12 5 19 12 12 19" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>,
    plus:      <><line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>,
    minus:     <><line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>,
    close:     <><line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>,
    chevron:   <><polyline points="9 18 15 12 9 6" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>,
    chevronD:  <><polyline points="6 9 12 15 18 9" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>,
    chevronU:  <><polyline points="18 15 12 9 6 15" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>,
    snowflake: <><line x1="12" y1="2" x2="12" y2="22" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><line x1="2" y1="12" x2="22" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><line x1="19.07" y1="4.93" x2="4.93" y2="19.07" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>,
    flame:     <><path d="M12 2c0 0-4 6-4 10a4 4 0 008 0C16 8 12 2 12 2z" fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/></>,
    note:      <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="none" stroke={color} strokeWidth="1.8"/><polyline points="14 2 14 8 20 8" fill="none" stroke={color} strokeWidth="1.8"/><line x1="8" y1="13" x2="16" y2="13" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><line x1="8" y1="17" x2="12" y2="17" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>,
    medal:     <><circle cx="12" cy="14" r="7" fill="none" stroke={color} strokeWidth="1.8"/><path d="M8.21 3.06L7 7h10l-1.21-3.94A1 1 0 0014.83 2H9.17a1 1 0 00-.96.06z" fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/><line x1="12" y1="11" x2="12" y2="17" stroke={color} strokeWidth="1.6" strokeLinecap="round"/></>,
    bag:       <><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/><line x1="3" y1="6" x2="21" y2="6" stroke={color} strokeWidth="1.8"/><path d="M16 10a4 4 0 01-8 0" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>,
    pill:      <><path d="M10.5 20.5L3.5 13.5a5 5 0 017-7l7 7a5 5 0 01-7 7z" fill="none" stroke={color} strokeWidth="1.8"/><line x1="8.5" y1="8.5" x2="15.5" y2="15.5" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>,
    info:      <><circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="1.8"/><line x1="12" y1="8" x2="12" y2="8.01" stroke={color} strokeWidth="2.5" strokeLinecap="round"/><line x1="12" y1="12" x2="12" y2="16" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>,
    target:    <><circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="1.8"/><circle cx="12" cy="12" r="6" fill="none" stroke={color} strokeWidth="1.8"/><circle cx="12" cy="12" r="2" fill={color}/></>,
    pencil:    <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>,
    restore:   <><polyline points="1 4 1 10 7 10" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></>,
    warning:   <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke={color} strokeWidth="2.5" strokeLinecap="round"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display:"inline-block", flexShrink:0, ...style }}>
      {paths[name]||paths.info}
    </svg>
  );
};

export const Card = ({ children, style={}, onClick }) => {
  const { C } = useTheme();
  return (
    <div onClick={onClick} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:16, marginBottom:12, cursor:onClick?"pointer":"default", boxShadow:"0 1px 3px rgba(0,0,0,0.06)", transition:"transform 0.15s", ...style }}
      onMouseEnter={e=>onClick&&(e.currentTarget.style.transform="scale(0.99)")}
      onMouseLeave={e=>onClick&&(e.currentTarget.style.transform="scale(1)")}
    >{children}</div>
  );
};

export const Section = ({ title, children }) => {
  const { C } = useTheme();
  return (
    <div style={{ marginBottom:20 }}>
      {title&&<p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:8, paddingLeft:4 }}>{title}</p>}
      <div style={{ background:C.card, borderRadius:16, overflow:"hidden", border:`1px solid ${C.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>{children}</div>
    </div>
  );
};

export const Row = ({ label, value, color, last=false, onClick, icon, sub }) => {
  const { C } = useTheme();
  return (
    <div onClick={onClick} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"13px 16px", borderBottom:last?"none":`1px solid ${C.border}`, cursor:onClick?"pointer":"default" }}>
      <div>
        {icon&&<span style={{ marginRight:8 }}>{icon}</span>}
        <span style={{ color:C.text, fontSize:15 }}>{label}</span>
        {sub&&<div style={{ color:C.muted, fontSize:12, marginTop:1 }}>{sub}</div>}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        {value&&<span style={{ color:color||C.muted, fontSize:15 }}>{value}</span>}
        {onClick&&<span style={{ color:C.muted }}>›</span>}
      </div>
    </div>
  );
};

export const Btn = ({ children, onClick, color, style={}, disabled, small, outline }) => {
  const { C } = useTheme();
  const btnColor = color || C.accent;
  return (
    <button onClick={onClick} disabled={disabled} style={{ background:outline?"transparent":btnColor, color:outline?btnColor:"#fff", border:outline?`1.5px solid ${btnColor}`:"none", borderRadius:12, padding:small?"8px 16px":"12px 22px", fontFamily:FONT, fontWeight:600, fontSize:small?13:15, cursor:disabled?"not-allowed":"pointer", opacity:disabled?0.4:1, transition:"all 0.15s", boxShadow:outline?"none":`0 2px 8px ${btnColor}44`, ...style }}>{children}</button>
  );
};

export const Chip = ({ children, color, active, onClick }) => {
  const { C } = useTheme();
  const chipColor = color || C.accent;
  const inactiveTextColor = (() => {
    const hex = chipColor.replace("#","");
    const r = parseInt(hex.slice(0,2),16);
    const g = parseInt(hex.slice(2,4),16);
    const b = parseInt(hex.slice(4,6),16);
    const luminance = (0.299*r + 0.587*g + 0.114*b)/255;
    return luminance > 0.6 ? "#555" : chipColor;
  })();
  return (
    <span onClick={onClick} style={{ background:active?chipColor:`${chipColor}12`, color:active?"#fff":inactiveTextColor, border:`1.5px solid ${active?chipColor:`${chipColor}55`}`, borderRadius:99, padding:"5px 12px", fontSize:12, fontWeight:600, cursor:onClick?"pointer":"default", transition:"all 0.2s", display:"inline-block", whiteSpace:"nowrap", flexShrink:0 }}>{children}</span>
  );
};

export const BigChip = ({ children, color, active, onClick }) => {
  const { C } = useTheme();
  const chipColor = color || C.accent;
  return (
    <span onClick={onClick} style={{ background:active?chipColor:`${chipColor}12`, color:active?"#fff":chipColor, border:`1.5px solid ${active?chipColor:`${chipColor}55`}`, borderRadius:99, padding:"13px 24px", fontSize:16, fontWeight:600, cursor:onClick?"pointer":"default", transition:"all 0.2s", display:"inline-block", whiteSpace:"nowrap" }}>{children}</span>
  );
};

export const Toggle = ({ value, onChange }) => {
  const { C } = useTheme();
  return (
    <div onClick={()=>onChange(!value)} style={{ width:51, height:31, borderRadius:99, background:value?C.accent:"#e5e5ea", cursor:"pointer", position:"relative", transition:"background 0.2s", flexShrink:0 }}>
      <div style={{ position:"absolute", top:2, left:value?22:2, width:27, height:27, borderRadius:99, background:"#fff", boxShadow:"0 2px 4px rgba(0,0,0,0.2)", transition:"left 0.2s" }} />
    </div>
  );
};

export const TInput = ({ value, onChange, placeholder, type="text", style={} }) => {
  const { C } = useTheme();
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{ background:C.card, border:`1.5px solid ${C.divider}`, borderRadius:10, color:C.text, padding:"12px 14px", fontSize:15, fontFamily:FONT, outline:"none", width:"100%", ...style }} />
  );
};

export const StatBox = ({ label, val, color, sub }) => {
  const { C } = useTheme();
  return (
    <div style={{ flex:1, background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 10px", textAlign:"center", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
      <div style={{ color, fontSize:19, fontWeight:700 }}>{val}</div>
      {sub&&<div style={{ color:C.muted, fontSize:11, marginTop:1 }}>{sub}</div>}
      <div style={{ color:C.muted, fontSize:10, marginTop:3, textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</div>
    </div>
  );
};

export const ProgressBar = ({ value, max, color, height=8 }) => {
  const { C } = useTheme();
  const barColor = color || C.accent;
  return (
    <div style={{ background:C.sectionBg, borderRadius:99, height, overflow:"hidden" }}>
      <div style={{ width:`${Math.min(100,(value/max)*100)}%`, height:"100%", background:barColor, borderRadius:99, transition:"width 0.4s" }} />
    </div>
  );
};

export const PacePicker = ({ value, onChange, targetLbs }) => {
  const { C } = useTheme();
  const getPace = id => PACE_OPTIONS.find(p => p.id === id) || PACE_OPTIONS[1];
  const selected = getPace(value);
  return (
    <div>
      <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
        {PACE_OPTIONS.map(p=>(
          <div key={p.id} onClick={()=>onChange(p.id)} style={{ flex:"1 1 calc(50% - 4px)", background:value===p.id?`${p.color}15`:C.card, border:`2px solid ${value===p.id?p.color:C.border}`, borderRadius:12, padding:"10px 12px", cursor:"pointer", transition:"all 0.2s" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
              <span style={{ color:value===p.id?p.color:C.text, fontWeight:700, fontSize:14 }}>{p.label}</span>
              <span style={{ color:p.color, fontSize:12, fontWeight:700 }}>{p.kgPerWk} kg/wk</span>
            </div>
            <div style={{ color:C.muted, fontSize:11 }}>{Math.round((targetLbs*0.453592)/p.kgPerWk)} wks</div>
          </div>
        ))}
      </div>
      <div style={{ background:`${selected.color}10`, border:`1px solid ${selected.color}33`, borderRadius:12, padding:"12px 14px", marginBottom:selected.warning?10:0 }}>
        <p style={{ color:C.text, fontSize:14, margin:0 }}>📅 <strong style={{ color:selected.color }}>{Math.ceil(targetLbs/selected.lbs)} weeks</strong> to reach your goal</p>
        <p style={{ color:C.textSec, fontSize:12, margin:"4px 0 0" }}>{selected.desc}</p>
      </div>
      {selected.warning&&<div style={{ background:"#ff3b3010", border:"1px solid #ff3b3033", borderRadius:12, padding:"10px 14px" }}><p style={{ color:C.red, fontSize:13, margin:0, lineHeight:1.6 }}>{selected.warning}</p></div>}
    </div>
  );
};


// ── Chart ─────────────────────────────────────────────────────────────────────
export const Chart = ({ entries, startWeight, targetWeight, color }) => {
  const { C } = useTheme();
  const chartColor = color || C.accent;
  const pts=[{label:"Start",weight:startWeight},...entries];
  if (pts.length<2) return null;
  const ws=pts.map(p=>p.weight).concat(targetWeight);
  const minW=Math.min(...ws)-2, maxW=Math.max(...ws)+2, range=maxW-minW;
  const W=340,H=150,P={t:14,r:14,b:32,l:44};
  const cW=W-P.l-P.r,cH=H-P.t-P.b;
  const tx=i=>P.l+(i/(pts.length-1))*cW;
  const ty=w=>P.t+cH-((w-minW)/range)*cH;
  const line=pts.map((p,i)=>`${i===0?"M":"L"}${tx(i).toFixed(1)},${ty(p.weight).toFixed(1)}`).join(" ");
  const area=line+` L${tx(pts.length-1).toFixed(1)},${H-P.b} L${P.l},${H-P.b} Z`;
  const ticks=[Math.ceil(minW+1),Math.round((minW+maxW)/2),Math.floor(maxW-1)];
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:"block"}}>
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.2"/><stop offset="100%" stopColor={color} stopOpacity="0.02"/></linearGradient>
      </defs>
      {ticks.map(w=><line key={w} x1={P.l} y1={ty(w)} x2={W-P.r} y2={ty(w)} stroke={C.border} strokeWidth="1"/>)}
      <line x1={P.l} y1={ty(targetWeight)} x2={W-P.r} y2={ty(targetWeight)} stroke={C.green} strokeWidth="1.5" strokeDasharray="5,4" opacity="0.8"/>
      <text x={W-P.r-2} y={ty(targetWeight)-5} fill={C.green} fontSize="9" textAnchor="end" fontWeight="600">target</text>
      <path d={area} fill="url(#cg)"/>
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p,i)=><circle key={i} cx={tx(i)} cy={ty(p.weight)} r={i===pts.length-1?5.5:3.5} fill={i===pts.length-1?color:"#fff"} stroke={color} strokeWidth="2"/>)}
      {ticks.map(w=><text key={w} x={P.l-5} y={ty(w)+4} fill={C.muted} fontSize="9" textAnchor="end">{Math.round(w)}</text>)}
      {pts.map((p,i)=><text key={i} x={tx(i)} y={H-P.b+14} fill={C.muted} fontSize="8.5" textAnchor="middle">{p.label}</text>)}
    </svg>
  );
};
