import React from "react";

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
