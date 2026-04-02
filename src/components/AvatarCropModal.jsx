import React, { useEffect } from "react";
import { FONT } from "../constants.js";

export const AvatarCropModal = ({ url, onSave, onCancel, saving, croppieRef }) => {
  useEffect(() => {
    if (!window.Croppie) return;
    const el = document.getElementById("croppie-mount");
    if (!el || croppieRef.current) return;
    croppieRef.current = new window.Croppie(el, {
      viewport: { width: 260, height: 260, type: "circle" },
      boundary: { width: 310, height: 310 },
      showZoomer: true,
      enableOrientation: true,
    });
    croppieRef.current.bind({ url });
    return () => {
      if (croppieRef.current) { croppieRef.current.destroy(); croppieRef.current = null; }
    };
  }, []);

  return (
    <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, zIndex:9999, background:"#000", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"20px 0" }}>
      <p style={{ color:"#fff", fontSize:16, fontWeight:700, marginBottom:20, fontFamily:FONT }}>Drag & pinch to adjust</p>
      <div id="croppie-mount" />
      <div style={{ display:"flex", gap:12, marginTop:28 }}>
        <button onClick={onCancel} style={{ background:"none", border:"1.5px solid rgba(255,255,255,0.3)", borderRadius:12, padding:"13px 32px", color:"#fff", fontSize:15, cursor:"pointer", fontFamily:FONT }}>Cancel</button>
        <button onClick={onSave} disabled={saving} style={{ background:"#0a84ff", border:"none", borderRadius:12, padding:"13px 32px", color:"#fff", fontSize:15, fontWeight:700, cursor:saving?"not-allowed":"pointer", fontFamily:FONT, opacity:saving?0.6:1 }}>
          {saving ? "Saving..." : "Save Photo"}
        </button>
      </div>
    </div>
  );
};
