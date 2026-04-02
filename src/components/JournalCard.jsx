import React, { useState } from "react";
import { useTheme } from "../ThemeContext.jsx";
import { FONT } from "../constants.js";
import { Card } from "./ui.jsx";
import { Icon } from "./Icon.jsx";

export const JournalCard = ({ journal, setJournal, today }) => {
  const C = useTheme();
  const [showJournal, setShowJournal] = useState(false);
  return (
    <Card>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:showJournal?12:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}><Icon name="note" size={14} color={C.muted} /><p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", margin:0 }}>DAILY JOURNAL</p></div>
        <button onClick={()=>setShowJournal(s=>!s)} style={{ background:"none", border:"none", color:C.accent, fontSize:13, cursor:"pointer", fontFamily:FONT, fontWeight:600 }}>{showJournal?"Done":"Write"}</button>
      </div>
      {showJournal&&<textarea value={journal[today]||""} onChange={e=>setJournal(j=>({...j,[today]:e.target.value}))} placeholder="How are you feeling today? Energy levels, sleep, anything notable..." style={{ width:"100%", minHeight:80, background:C.sectionBg, border:`1px solid ${C.border}`, borderRadius:10, padding:"10px 12px", fontSize:14, fontFamily:FONT, color:C.text, outline:"none", resize:"vertical" }} />}
      {!showJournal&&journal[today]&&<p style={{ color:C.textSec, fontSize:14, margin:0, marginTop:8, lineHeight:1.6 }}>{journal[today]}</p>}
    </Card>
  );
};
