import React, { useState, useEffect } from "react";
import { supabase } from "../supabase.js";
import { useTheme } from "../ThemeContext.jsx";
import { FONT } from "../constants.js";
import { todayKey } from "../helpers.js";
import { Card } from "./ui.jsx";

export const ProgressPhotos = ({ user, entries, profile }) => {
  const C = useTheme();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [viewPhoto, setViewPhoto] = useState(null);
  const [flippedPhotos, setFlippedPhotos] = useState({}); // key: "date_pose"
  const toggleFlip = (date, pose) => {
    const key = `${date}_${pose}`;
    setFlippedPhotos(f => ({ ...f, [key]: !f[key] }));
  };

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    loadPhotos();
  }, [user?.id]);

  const getPublicUrl = (path) => {
    const { data } = supabase.storage.from("progress-photos").getPublicUrl(path);
    return data?.publicUrl || "";
  };

  const loadPhotos = async () => {
    try {
      const { data, error } = await supabase.from("profiles").select("progress_photos").eq("id", user.id).single();
      if (!error && data?.progress_photos && data.progress_photos.length > 0) {
        // Public bucket — no signing needed, URLs never expire
        const refreshed = data.progress_photos.map(entry => ({
          ...entry,
          ...(entry.front?.path ? { front: { path: entry.front.path, url: getPublicUrl(entry.front.path) } } : {}),
          ...(entry.side?.path  ? { side:  { path: entry.side.path,  url: getPublicUrl(entry.side.path)  } } : {}),
        }));
        setPhotos(refreshed);
      } else if (!error) {
        setPhotos([]);
      }
    } catch(e) { console.error("Load photos error:", e); }
    setLoading(false);
  };

  const savePhotos = async (updated) => {
    setPhotos(updated);
    if (!user?.id) return;
    // Strip signed URLs before saving — they expire, only paths are persistent
    const toSave = updated.map(entry => ({
      ...entry,
      ...(entry.front ? { front: { path: entry.front.path } } : {}),
      ...(entry.side  ? { side:  { path: entry.side.path  } } : {}),
    }));
    try { await supabase.from("profiles").upsert({ id: user.id, progress_photos: toSave }); }
    catch(e) { console.error("Save photos error:", e); }
  };

  const compressImage = async (file) => {
    // Use createImageBitmap with imageOrientation — correctly handles EXIF on iOS Safari 16+
    // Falls back to basic canvas if not supported
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      const maxDim = 1200;
      let w = bitmap.width, h = bitmap.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
        else { w = Math.round(w * maxDim / h); h = maxDim; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
      bitmap.close();
      return new Promise((resolve, reject) => {
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Compression failed")), "image/jpeg", 0.82);
      });
    } catch(e) {
      // Fallback for older browsers
      return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          const maxDim = 1200;
          let w = img.width, h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) { h = Math.round(h * maxDim / w); w = maxDim; }
            else { w = Math.round(w * maxDim / h); h = maxDim; }
          }
          const canvas = document.createElement("canvas");
          canvas.width = w; canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);
          URL.revokeObjectURL(url);
          canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Compression failed")), "image/jpeg", 0.82);
        };
        img.onerror = reject;
        img.src = url;
      });
    }
  };

  const handleFileSelect = async (e, pose) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    if (!file.type.startsWith("image/")) { setUploadError("Please select an image file"); return; }
    if (file.size > 10 * 1024 * 1024) { setUploadError("File too large — max 10MB"); return; }
    setUploading(true); setUploadError(null);
    try {
      const dateKey = todayKey();
      const ext = file.type === "image/png" ? "png" : "jpg";
      const filename = `${user.id}/${dateKey}_${pose}_${Date.now()}.${ext}`;
      // Upload file
      const { error: upErr } = await supabase.storage.from("progress-photos").upload(filename, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      // Public bucket — get permanent public URL immediately
      const { data: pubData } = supabase.storage.from("progress-photos").getPublicUrl(filename);
      const url = pubData?.publicUrl || "";
      const currentWeightKg = entries?.length > 0 ? parseFloat((entries[entries.length-1].weight * 0.453592).toFixed(1)) : parseFloat(profile?.startWeight || 0);
      const updated = [...photos];
      const existingIdx = updated.findIndex(p => p.date === dateKey);
      if (existingIdx >= 0) {
        updated[existingIdx] = { ...updated[existingIdx], [pose]: { path: filename, url } };
      } else {
        updated.unshift({ date: dateKey, weightKg: currentWeightKg, [pose]: { path: filename, url } });
      }
      await savePhotos(updated);
    } catch(err) { console.error("Upload error:", err); setUploadError("Upload failed — please try again"); }
    setUploading(false);
    e.target.value = "";
  };

  const deletePhoto = async (dateKey, pose) => {
    if (!window.confirm("Delete this photo?")) return;
    const entry = photos.find(p => p.date === dateKey);
    if (!entry?.[pose]?.path) return;
    try {
      await supabase.storage.from("progress-photos").remove([entry[pose].path]);
      const updated = photos.map(p => {
        if (p.date !== dateKey) return p;
        const copy = { ...p };
        delete copy[pose];
        return copy;
      }).filter(p => p.front || p.side);
      await savePhotos(updated);
    } catch(e) { console.error("Delete error:", e); }
  };

  const toggleCompare = (photo, pose) => {
    const key = `${photo.date}_${pose}`;
    const existing = selectedForCompare.find(s => s.key === key);
    if (existing) {
      setSelectedForCompare(s => s.filter(x => x.key !== key));
    } else {
      if (selectedForCompare.length >= 2) {
        setSelectedForCompare(s => [...s.slice(1), { key, photo, pose }]);
      } else {
        setSelectedForCompare(s => [...s, { key, photo, pose }]);
      }
    }
  };

  const fmtPhotoDate = (dateKey) => new Date(dateKey).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" });

  if (loading) return <Card><p style={{ color:C.muted, textAlign:"center", fontSize:14, padding:"12px 0" }}>Loading photos...</p></Card>;

  if (!user?.id) return (
    <Card style={{ textAlign:"center", padding:"28px 16px" }}>
      <div style={{ fontSize:36, marginBottom:12 }}>📸</div>
      <p style={{ color:C.text, fontWeight:700, fontSize:16, margin:"0 0 6px" }}>Progress Photos</p>
      <p style={{ color:C.muted, fontSize:13, lineHeight:1.6 }}>Sign in to save your progress photos across devices.</p>
    </Card>
  );

  const todayEntry = photos.find(p => p.date === todayKey());
  const todayComplete = todayEntry?.front && todayEntry?.side;

  return (
    <div>

      {/* Upload section — hidden if today already has both photos */}
      {!compareMode && (
        <Card style={{ marginBottom:12 }}>
          {todayComplete ? (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                <p style={{ color:C.green, fontWeight:700, fontSize:14, margin:0 }}>✓ Today's photos added</p>
                <button onClick={()=>{ const el = document.getElementById("photo-upload-front"); el && el.click(); }}
                  style={{ background:"none", border:"none", color:C.muted, fontSize:12, cursor:"pointer", fontFamily:FONT }}>Replace</button>
              </div>
              <p style={{ color:C.muted, fontSize:12, margin:0 }}>Come back next week to track your progress</p>
              <input type="file" accept="image/*" style={{ display:"none" }} id="photo-upload-front" onChange={e => handleFileSelect(e, "front")} />
            </div>
          ) : (
            <div>
              <p style={{ color:C.muted, fontSize:11, fontWeight:700, letterSpacing:"0.06em", marginBottom:10 }}>
                {photos.length === 0 ? "ADD YOUR FIRST PHOTOS" : "ADD THIS WEEK'S PHOTOS"}
              </p>
              <div style={{ background:`${C.accent}08`, border:`1px solid ${C.accent}20`, borderRadius:10, padding:"8px 12px", marginBottom:12, display:"flex", gap:8, alignItems:"flex-start" }}>
                <span style={{ fontSize:14, flexShrink:0 }}>💡</span>
                <p style={{ color:C.textSec, fontSize:12, lineHeight:1.5, margin:0 }}>Same spot each week, 2 metres from camera, arms slightly away from body. Good lighting makes a big difference.</p>
              </div>
              {uploadError && <p style={{ color:C.red, fontSize:13, marginBottom:8 }}>{uploadError}</p>}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {["front","side"].map(pose => (
                  <div key={pose}>
                    <input type="file" accept="image/*" style={{ display:"none" }} id={`photo-upload-${pose}`} onChange={e => handleFileSelect(e, pose)} />
                    <label htmlFor={`photo-upload-${pose}`}
                      style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6, aspectRatio:"3/4", background: todayEntry?.[pose] ? `${C.green}10` : C.sectionBg, border:`1.5px ${todayEntry?.[pose] ? "solid" : "dashed"} ${todayEntry?.[pose] ? C.green : C.border}`, borderRadius:12, cursor:"pointer" }}>
                      {uploading ? <p style={{ color:C.muted, fontSize:12 }}>Uploading...</p> : todayEntry?.[pose] ? (
                        <>
                          <span style={{ fontSize:20 }}>✓</span>
                          <span style={{ color:C.green, fontSize:13, fontWeight:600 }}>{pose.charAt(0).toUpperCase() + pose.slice(1)}</span>
                          <span style={{ color:C.muted, fontSize:11 }}>Tap to replace</span>
                        </>
                      ) : (
                        <>
                          <span style={{ fontSize:24 }}>📷</span>
                          <span style={{ color:C.accent, fontSize:13, fontWeight:600 }}>{pose.charAt(0).toUpperCase() + pose.slice(1)}</span>
                          <span style={{ color:C.muted, fontSize:11 }}>Tap to add</span>
                        </>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Timeline header + compare button */}
      {photos.length > 0 && (
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8, paddingLeft:4 }}>
          <p style={{ color:C.muted, fontSize:11, fontWeight:700, letterSpacing:"0.06em", margin:0 }}>PHOTO TIMELINE — {photos.length} {photos.length === 1 ? "ENTRY" : "ENTRIES"}</p>
          {photos.length >= 2 && (
            <button onClick={()=>{ setCompareMode(!compareMode); setSelectedForCompare([]); }}
              style={{ background:compareMode?C.accent:"none", border:`1.5px solid ${compareMode?C.accent:C.border}`, borderRadius:10, padding:"5px 12px", color:compareMode?"#fff":C.muted, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:FONT }}>
              {compareMode ? "✕ Cancel" : "Compare"}
            </button>
          )}
        </div>
      )}

      {/* Compare instructions */}
      {compareMode && (
        <Card style={{ marginBottom:10, background:`${C.accent}08`, borderColor:`${C.accent}33` }}>
          <p style={{ color:C.accent, fontSize:13, fontWeight:600, margin:"0 0 4px" }}>
            {selectedForCompare.length === 0 ? "Select two photos to compare" :
             selectedForCompare.length === 1 ? "Now select a second photo" :
             "✓ Ready to compare — see results above"}
          </p>
          <p style={{ color:C.muted, fontSize:12, margin:0 }}>Use the Select buttons under each photo</p>
        </Card>
      )}

      {/* Compare result panel */}
      {compareMode && selectedForCompare.length === 2 && (
        <Card style={{ marginBottom:12 }}>
          <p style={{ color:C.muted, fontSize:11, fontWeight:700, letterSpacing:"0.06em", marginBottom:10 }}>COMPARISON</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
            {selectedForCompare.map((s, i) => (
              <div key={i}>
                <img src={s.photo[s.pose]?.url} alt="" style={{ width:"100%", aspectRatio:"3/4", objectFit:"cover", borderRadius:10, border:`2px solid ${C.accent}`, imageOrientation:"from-image" }} />
                <p style={{ color:C.muted, fontSize:11, textAlign:"center", margin:"4px 0 0" }}>{fmtPhotoDate(s.photo.date)}</p>
                <p style={{ color:C.accent, fontSize:12, textAlign:"center", fontWeight:700, margin:"2px 0 0" }}>{s.photo.weightKg}kg · {s.pose}</p>
              </div>
            ))}
          </div>
          {(() => {
            const w1 = selectedForCompare[0].photo.weightKg;
            const w2 = selectedForCompare[1].photo.weightKg;
            const diff = parseFloat((w1 - w2).toFixed(1));
            if (!diff) return null;
            return (
              <div style={{ background:`${C.green}12`, border:`1px solid ${C.green}33`, borderRadius:10, padding:"8px 12px", textAlign:"center" }}>
                <p style={{ color:C.green, fontSize:14, fontWeight:700, margin:0 }}>▼ {Math.abs(diff)}kg lost between these photos</p>
              </div>
            );
          })()}
        </Card>
      )}

      {/* Timeline */}
      {photos.length === 0 ? (
        <Card style={{ textAlign:"center", padding:"28px 16px" }}>
          <div style={{ fontSize:36, marginBottom:10 }}>🗓️</div>
          <p style={{ color:C.text, fontWeight:700, fontSize:15, margin:"0 0 6px" }}>No photos yet</p>
          <p style={{ color:C.muted, fontSize:13, lineHeight:1.6, margin:0 }}>Add your first photos above to start your visual progress timeline.</p>
        </Card>
      ) : photos.map((entry, idx) => (
        <Card key={entry.date} style={{ marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div>
              <p style={{ color:C.muted, fontSize:11, fontWeight:700, letterSpacing:"0.06em", margin:"0 0 2px" }}>
                {idx === 0 ? "MOST RECENT" : idx === photos.length-1 ? "START" : `WEEK ${photos.length - idx}`}
              </p>
              <p style={{ color:C.text, fontSize:13, fontWeight:600, margin:0 }}>{fmtPhotoDate(entry.date)}</p>
            </div>
            <span style={{ color:C.accent, fontSize:14, fontWeight:700 }}>{entry.weightKg}kg</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {["front","side"].map(pose => (
              <div key={pose} style={{ position:"relative" }}>
                {entry[pose] ? (
                  <>
                    <div style={{ position:"relative" }}>
                      <img src={entry[pose].url} alt={pose}
                        onClick={() => !compareMode && setViewPhoto({ url:entry[pose].url, date:entry.date, weightKg:entry.weightKg, pose, flipped: !!flippedPhotos[`${entry.date}_${pose}`] })}
                        style={{ width:"100%", aspectRatio:"3/4", objectFit:"cover", borderRadius:10, display:"block", cursor:compareMode?"default":"pointer",
                          transform: flippedPhotos[`${entry.date}_${pose}`] ? "scaleX(-1)" : "none",
                          border: compareMode && selectedForCompare.find(s=>s.key===`${entry.date}_${pose}`) ? `3px solid ${C.accent}` : `1px solid ${C.border}` }}
                      />
                      {compareMode && (
                        <button
                          onClick={() => toggleCompare(entry, pose)}
                          style={{ width:"100%", marginTop:4, background: selectedForCompare.find(s=>s.key===`${entry.date}_${pose}`) ? C.accent : C.sectionBg, border:`1.5px solid ${selectedForCompare.find(s=>s.key===`${entry.date}_${pose}`) ? C.accent : C.border}`, borderRadius:8, padding:"5px 0", color: selectedForCompare.find(s=>s.key===`${entry.date}_${pose}`) ? "#fff" : C.muted, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:FONT }}
                        >{selectedForCompare.find(s=>s.key===`${entry.date}_${pose}`) ? "✓ Selected" : "Select"}</button>
                      )}
                    </div>
                    {!compareMode && (
                      <button onClick={() => deletePhoto(entry.date, pose)}
                        style={{ position:"absolute", top:6, right:6, background:"rgba(0,0,0,0.55)", border:"none", borderRadius:99, width:22, height:22, color:"#fff", fontSize:14, cursor:"pointer", lineHeight:"22px", textAlign:"center", padding:0 }}>×</button>
                    )}
                    {!compareMode && (
                      <button onClick={() => toggleFlip(entry.date, pose)}
                        style={{ width:"100%", marginTop:4, background: flippedPhotos[`${entry.date}_${pose}`] ? `${C.accent}20` : C.sectionBg, border:`1.5px solid ${flippedPhotos[`${entry.date}_${pose}`] ? C.accent : C.border}`, borderRadius:8, padding:"6px 0", color: flippedPhotos[`${entry.date}_${pose}`] ? C.accent : C.text, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:FONT }}>
                        ⇄ {flippedPhotos[`${entry.date}_${pose}`] ? "Flipped" : "Flip"}
                      </button>
                    )}

                  </>
                ) : (
                  <div style={{ aspectRatio:"3/4", background:C.sectionBg, borderRadius:10, border:`1px dashed ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <span style={{ color:C.muted, fontSize:11 }}>No {pose}</span>
                  </div>
                )}
                <p style={{ color:C.muted, fontSize:11, textAlign:"center", margin:"4px 0 0" }}>{pose.charAt(0).toUpperCase() + pose.slice(1)}</p>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {/* Full screen view */}
      {viewPhoto && (
        <div onClick={() => setViewPhoto(null)}
          style={{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.92)", zIndex:9999, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:20 }}>
          <img src={viewPhoto.url} alt="" style={{ maxWidth:"100%", maxHeight:"80vh", objectFit:"contain", borderRadius:12, transform: viewPhoto.flipped ? "scaleX(-1)" : "none" }} />
          <p style={{ color:"rgba(255,255,255,0.7)", fontSize:13, marginTop:12 }}>{fmtPhotoDate(viewPhoto.date)} · {viewPhoto.weightKg}kg · {viewPhoto.pose}</p>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:12, marginTop:4 }}>Tap anywhere to close</p>
        </div>
      )}
    </div>
  );
};

