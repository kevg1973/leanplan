import React from "react";
import { useTheme } from "../ThemeContext.jsx";
import { FONT } from "../constants.js";

export const Card = ({ children, style={}, onClick }) => {
  const C = useTheme();
  return (
    <div onClick={onClick} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:16, marginBottom:12, cursor:onClick?"pointer":"default", boxShadow:"0 1px 3px rgba(0,0,0,0.06)", transition:"transform 0.15s", ...style }}
      onMouseEnter={e=>onClick&&(e.currentTarget.style.transform="scale(0.99)")}
      onMouseLeave={e=>onClick&&(e.currentTarget.style.transform="scale(1)")}
    >{children}</div>
  );
};

export const Section = ({ title, children }) => {
  const C = useTheme();
  return (
    <div style={{ marginBottom:20 }}>
      {title&&<p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:8, paddingLeft:4 }}>{title}</p>}
      <div style={{ background:C.card, borderRadius:16, overflow:"hidden", border:`1px solid ${C.border}`, boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>{children}</div>
    </div>
  );
};

export const Row = ({ label, value, color, last=false, onClick, icon, sub }) => {
  const C = useTheme();
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
  const C = useTheme();
  const c = color || C.accent;
  return (
    <button onClick={onClick} disabled={disabled} style={{ background:outline?"transparent":c, color:outline?c:"#fff", border:outline?`1.5px solid ${c}`:"none", borderRadius:12, padding:small?"8px 16px":"12px 22px", fontFamily:FONT, fontWeight:600, fontSize:small?13:15, cursor:disabled?"not-allowed":"pointer", opacity:disabled?0.4:1, transition:"all 0.15s", boxShadow:outline?"none":`0 2px 8px ${c}44`, ...style }}>{children}</button>
  );
};

export const Chip = ({ children, color, active, onClick }) => {
  const C = useTheme();
  const c = color || C.accent;
  // In light mode, inactive chips need darker text for readability
  const inactiveTextColor = (() => {
    const hex = c.replace("#","");
    const r = parseInt(hex.slice(0,2),16);
    const g = parseInt(hex.slice(2,4),16);
    const b = parseInt(hex.slice(4,6),16);
    const luminance = (0.299*r + 0.587*g + 0.114*b)/255;
    return luminance > 0.6 ? "#555" : c;
  })();
  return (
    <span onClick={onClick} style={{ background:active?c:`${c}12`, color:active?"#fff":inactiveTextColor, border:`1.5px solid ${active?c:`${c}55`}`, borderRadius:99, padding:"5px 12px", fontSize:12, fontWeight:600, cursor:onClick?"pointer":"default", transition:"all 0.2s", display:"inline-block", whiteSpace:"nowrap", flexShrink:0 }}>{children}</span>
  );
};

export const BigChip = ({ children, color, active, onClick }) => {
  const C = useTheme();
  const c = color || C.accent;
  return (
    <span onClick={onClick} style={{ background:active?c:`${c}12`, color:active?"#fff":c, border:`1.5px solid ${active?c:`${c}55`}`, borderRadius:99, padding:"13px 24px", fontSize:16, fontWeight:600, cursor:onClick?"pointer":"default", transition:"all 0.2s", display:"inline-block", whiteSpace:"nowrap" }}>{children}</span>
  );
};

export const Toggle = ({ value, onChange }) => {
  const C = useTheme();
  return (
    <div onClick={()=>onChange(!value)} style={{ width:51, height:31, borderRadius:99, background:value?C.accent:"#e5e5ea", cursor:"pointer", position:"relative", transition:"background 0.2s", flexShrink:0 }}>
      <div style={{ position:"absolute", top:2, left:value?22:2, width:27, height:27, borderRadius:99, background:"#fff", boxShadow:"0 2px 4px rgba(0,0,0,0.2)", transition:"left 0.2s" }} />
    </div>
  );
};

export const TInput = ({ value, onChange, placeholder, type="text", style={} }) => {
  const C = useTheme();
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{ background:C.card, border:`1.5px solid ${C.divider}`, borderRadius:10, color:C.text, padding:"12px 14px", fontSize:15, fontFamily:FONT, outline:"none", width:"100%", ...style }} />
  );
};

export const StatBox = ({ label, val, color, sub }) => {
  const C = useTheme();
  return (
    <div style={{ flex:1, background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 10px", textAlign:"center", boxShadow:"0 1px 3px rgba(0,0,0,0.06)" }}>
      <div style={{ color, fontSize:19, fontWeight:700 }}>{val}</div>
      {sub&&<div style={{ color:C.muted, fontSize:11, marginTop:1 }}>{sub}</div>}
      <div style={{ color:C.muted, fontSize:10, marginTop:3, textTransform:"uppercase", letterSpacing:"0.06em" }}>{label}</div>
    </div>
  );
};

export const ProgressBar = ({ value, max, color, height=8 }) => {
  const C = useTheme();
  const c = color || C.accent;
  return (
    <div style={{ background:C.sectionBg, borderRadius:99, height, overflow:"hidden" }}>
      <div style={{ width:`${Math.min(100,(value/max)*100)}%`, height:"100%", background:c, borderRadius:99, transition:"width 0.4s" }} />
    </div>
  );
};
