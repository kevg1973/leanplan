import React, { useState } from "react";
import { useTheme } from "../ThemeContext.jsx";
import { FONT } from "../constants.js";
import { toKg, fromKg, todayKey, fmtDate, calcTDEE, calcBMI, bmiCategory, getPace } from "../helpers.js";
import { Card, Section, Row, Btn, TInput, StatBox, ProgressBar } from "./ui.jsx";
import { Icon } from "./Icon.jsx";
import { Chart } from "./Chart.jsx";
import { ProgressPhotos } from "./ProgressPhotos.jsx";

export const TrackTab = ({ profile, entries, setEntries, measurements, setMeasurements, workoutLog={}, user }) => {
  const C = useTheme();
  const [newW, setNewW] = useState("");
  const [activeSection, setActiveSection] = useState("weight");
  const [newMeasure, setNewMeasure] = useState({ waist:"", hips:"", chest:"", leftArm:"", rightArm:"" });

  const cur = entries.length>0?entries[entries.length-1].weight:profile.startWeightLbs;
  const lost = Math.max(0,profile.startWeightLbs-cur);
  const lostKg = parseFloat((lost*0.453592).toFixed(1));
  const pace = getPace(profile.paceId||"normal");
  const eta = Math.ceil((profile.targetLbs-lost)/pace.lbs);
  const target = (profile.startWeightLbs||0)-(profile.targetLbs||0);
  const targetKg = parseFloat((target*0.453592).toFixed(1));
  const curKg = parseFloat((cur*0.453592).toFixed(1));
  const startKg = parseFloat((profile.startWeightLbs*0.453592).toFixed(1));
  const pct = profile.targetLbs>0?Math.min(100,Math.round((lost/profile.targetLbs)*100)):0;
  const tdee = calcTDEE(profile);
  const bmi = calcBMI(profile);
  const bmiCat = bmi?bmiCategory(parseFloat(bmi), C):null;

  const addWeightEntry = () => {
    if (!newW||isNaN(newW)) return;
    const weightLbs = fromKg(parseFloat(newW));
    setEntries(prev=>[...prev,{weight:weightLbs, weightKg:parseFloat(parseFloat(newW).toFixed(1)), label:`W${prev.length+1}`,date:new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short"})}]);
    setNewW("");
  };

  const addMeasurement = () => {
    const hasData = Object.values(newMeasure).some(v=>v!=="");
    if (!hasData) return;
    setMeasurements(m=>[...m,{...newMeasure,date:todayKey(),displayDate:new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}]);
    setNewMeasure({waist:"",hips:"",chest:"",leftArm:"",rightArm:""});
  };

  const lastMeasure = measurements.length>0?measurements[measurements.length-1]:null;
  const prevMeasure = measurements.length>1?measurements[measurements.length-2]:null;
  const measureDiff = (key) => {
    if (!lastMeasure||!prevMeasure||!lastMeasure[key]||!prevMeasure[key]) return null;
    return (parseFloat(lastMeasure[key])-parseFloat(prevMeasure[key])).toFixed(1);
  };

  return (
    <div>
      <div style={{ display:"flex", background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:3, marginBottom:12, gap:2 }}>
        {[["weight","Weight"],["stats","Stats"],["workouts","Workouts"],["photos","Photos"]].map(([k,l])=>(
          <button key={k} onClick={()=>setActiveSection(k)} style={{ flex:1, background:activeSection===k?C.purple:"transparent", color:activeSection===k?"#fff":C.muted, border:"none", borderRadius:10, padding:"8px 0", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:FONT, transition:"all 0.2s" }}>{l}</button>
        ))}
      </div>

      {activeSection==="weight"&&<>
        <div style={{ background:`linear-gradient(145deg, ${C.accent}15, ${C.green}10)`, borderRadius:20, padding:"20px 18px", marginBottom:16, border:`1px solid ${C.accent}22` }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}>
            <div><p style={{ color:C.muted, fontSize:13, margin:0 }}>Progress</p><h2 style={{ color:C.text, fontSize:28, fontWeight:700, margin:"2px 0 0" }}>{pct}%</h2></div>
            <div style={{ textAlign:"right" }}><p style={{ color:C.muted, fontSize:12, margin:0 }}>Lost so far</p><p style={{ color:C.green, fontSize:22, fontWeight:700, margin:0 }}>{lostKg} kg</p></div>
          </div>
          <ProgressBar value={lost} max={profile.targetLbs} color={C.accent} height={10} />
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, fontSize:11, color:C.muted }}>
            <span>{startKg} kg start</span><span>Goal: {(target*0.453592).toFixed(1)} kg</span>
          </div>
        </div>

        <div style={{ display:"flex", gap:8, marginBottom:16 }}>
          <StatBox label="Per week" val={entries.length>0?((lost/entries.length)*0.453592).toFixed(2)+" kg":"—"} color={C.accent} />
          <StatBox label="ETA" val={eta>0?`${eta} wks`:"Done!"} color={C.purple} />
          <StatBox label="To go" val={`${(Math.max(0,profile.targetLbs-lost)*0.453592).toFixed(1)}`} sub="kg" color={C.orange} />
        </div>

        <Card>
          <p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", marginBottom:12 }}>⚖️ LOG WEEKLY WEIGH-IN</p>
          <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:10 }}>
            <TInput value={newW} onChange={e=>setNewW(e.target.value)} placeholder="e.g. 82.5" type="number" style={{ flex:1 }} />
            <Btn onClick={addWeightEntry} disabled={!newW} color={C.accent} style={{ padding:"12px 18px" }}>+ Log</Btn>
          </div>
          <div style={{ display:"flex", gap:16, fontSize:12 }}>
            <span style={{ color:C.muted }}>Start: <strong style={{ color:C.text }}>{toKg(profile.startWeightLbs)} kg</strong></span>
            <span style={{ color:C.muted }}>Target: <strong style={{ color:C.green }}>{(target*0.453592).toFixed(1)} kg</strong></span>
          </div>
        </Card>

        {entries.length>=1&&<Card>
          <p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", marginBottom:12 }}>📈 WEIGHT CHART (kg)</p>
          <Chart entries={entries} startWeight={profile.startWeightLbs} targetWeight={target} />
          {entries.length<2&&<p style={{ color:C.muted, fontSize:12, textAlign:"center", marginTop:8 }}>Log more weeks to see your trend</p>}
        </Card>}

        {entries.length>0&&<Section title="Weekly Log">
          <Row label="Starting weight" value={`${startKg} kg`} color={C.muted} />
          {entries.map((e,i)=>{
            const prev=i===0?profile.startWeightLbs:entries[i-1].weight;
            const diff=e.weight-prev;
            return <Row key={i} label={`${e.label}${e.date?` · ${e.date}`:""}`} value={`${e.weightKg||toKg(e.weight)} kg`} last={i===entries.length-1}
              icon={<span style={{ color:diff<0?C.green:diff>0?C.red:C.muted, fontSize:12, fontWeight:700 }}>{diff<0?"▼":diff>0?"▲":"●"} {Math.abs(diff).toFixed(1)}</span>}
            />;
          })}
        </Section>}
      </>}

      <div style={{ display: activeSection==="photos" ? "block" : "none" }}><ProgressPhotos user={user} entries={entries} profile={profile} /></div>

      {activeSection==="stats"&&<>
        {/* Measurements section merged into Stats */}
        <Card style={{ background:`${C.pink}08`, borderColor:`${C.pink}22` }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}><Icon name="ruler" size={14} color={C.pink} /><p style={{ color:C.pink, fontSize:12, fontWeight:700, margin:0 }}>WHY MEASURE?</p></div>
          <p style={{ color:C.text, fontSize:13, lineHeight:1.6, margin:0 }}>The scale can lie — especially with creatine and muscle gain. Measurements show the real body composition changes that matter.</p>
        </Card>

        <Card>
          <p style={{ color:C.muted, fontSize:12, fontWeight:600, letterSpacing:"0.06em", marginBottom:12 }}>LOG MEASUREMENTS (cm)</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
            {[["waist","Waist"],["hips","Hips"],["chest","Chest"],["leftArm","Left arm"],["rightArm","Right arm"]].map(([k,l])=>(
              <div key={k}>
                <p style={{ color:C.muted, fontSize:12, marginBottom:4 }}>{l}</p>
                <TInput value={newMeasure[k]} onChange={e=>setNewMeasure(m=>({...m,[k]:e.target.value}))} placeholder="cm" type="number" />
              </div>
            ))}
          </div>
          <Btn onClick={addMeasurement} color={C.pink} style={{ width:"100%" }}>Save Measurements</Btn>
        </Card>

        {lastMeasure&&<>
          <Section title="Latest Measurements">
            {[["waist","Waist 🎯"],["hips","Hips"],["chest","Chest"],["leftArm","Left arm"],["rightArm","Right arm"]].map(([k,l],i,arr)=>{
              const diff=measureDiff(k);
              return lastMeasure[k]?<Row key={k} label={l} value={`${lastMeasure[k]} cm`} last={i===arr.length-1}
                icon={diff?<span style={{ color:parseFloat(diff)<0?C.green:C.red, fontSize:12, fontWeight:700 }}>{parseFloat(diff)<0?"▼":"▲"} {Math.abs(parseFloat(diff))} cm</span>:undefined}
              />:null;
            })}
          </Section>
          <p style={{ color:C.muted, fontSize:12, textAlign:"center" }}>Logged {lastMeasure.displayDate}</p>
        </>}

        {measurements.length===0&&<Card><p style={{ color:C.muted, fontSize:14, textAlign:"center", margin:0 }}>No measurements logged yet. Monthly tracking is ideal.</p></Card>}

        <div style={{ height:8 }} />
        {tdee&&<Section title="Calorie Targets">
          <Row label="TDEE (maintenance)" value={`${tdee} cal`} color={C.text} />
          <Row label="Your target (deficit)" value={`${tdee-Math.round(getPace(profile.paceId||"normal").lbs*500)} cal`} color={C.accent} />
          <Row label="Deficit per day" value={`${Math.round(getPace(profile.paceId||"normal").lbs*500)} cal`} color={C.orange} last />
        </Section>}

        {bmi&&<Section title="BMI">
          <Row label="Current BMI" value={bmi} color={bmiCat?.color} />
          <Row label="Category" value={bmiCat?.label} color={bmiCat?.color} last />
        </Section>}

        <Card style={{ background:`${C.orange}08`, borderColor:`${C.orange}22` }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}><Icon name="info" size={14} color={C.orange} /><p style={{ color:C.orange, fontSize:12, fontWeight:700, margin:0 }}>ABOUT BMI</p></div>
          <p style={{ color:C.text, fontSize:13, lineHeight:1.6, margin:0 }}>BMI is a rough guide — it doesn't account for muscle mass. As you build muscle through weight training, your BMI may not fall as fast as your body fat. Waist measurement is often a better indicator of health.</p>
        </Card>

        <Section title="Your Plan">
          <Row label="Starting weight" value={`${toKg(profile.startWeightLbs)} kg`} />
          <Row label="Target weight" value={`${toKg(profile.startWeightLbs-profile.targetLbs)} kg`} />
          <Row label="Pace" value={`${getPace(profile.paceId||"normal").kgPerWk} kg/week`} />
          <Row label="Estimated weeks" value={`${Math.ceil(profile.targetLbs/getPace(profile.paceId||"normal").lbs)} weeks`} last />
        </Section>
      </>}

      {activeSection==="workouts"&&<>
        {(()=>{
          const historyWeeks = Array.from({length:4},(_,i)=>{
            const start=new Date(); start.setDate(start.getDate()-start.getDay()+1-(i*7));
            const count=Array.from({length:7},(__,j)=>{ const d=new Date(start); d.setDate(d.getDate()+j); const k=d.toISOString().split("T")[0]; return workoutLog[k]?1:0; }).reduce((a,b)=>a+b,0);
            return {label:i===0?"This week":i===1?"Last week":`${i+1}w ago`,count};
          }).reverse();
          const target = profile.workoutsPerWeek||3;
          const totalLogged = Object.keys(workoutLog).length;
          const totalWeeks = Math.max(1, Math.ceil(totalLogged/target));
          return <>
            <div style={{ display:"flex", gap:8, marginBottom:16 }}>
              <StatBox label="Total workouts" val={totalLogged} color={C.green} />
              <StatBox label="This week" val={`${historyWeeks[3]?.count||0}/${target}`} color={C.accent} />
              <StatBox label="Last week" val={`${historyWeeks[2]?.count||0}/${target}`} color={C.purple} />
            </div>
            <Section title="Weekly History">
              {historyWeeks.map((w,i)=><Row key={i} label={w.label} value={`${w.count} / ${target}`} color={w.count>=target?C.green:w.count>0?C.accent:C.muted} last={i===historyWeeks.length-1} />)}
            </Section>
            {Object.entries(workoutLog).length>0&&<Section title="Recent Sessions">
              {Object.entries(workoutLog).slice(-8).reverse().map(([date,w],i,arr)=>(
                <Row key={date} label={fmtDate(date)} value={w.type?.replace("-"," ")||"workout"} color={C.accent} last={i===arr.length-1} />
              ))}
            </Section>}
          </>;
        })()}
      </>}
    </div>
  );
};

