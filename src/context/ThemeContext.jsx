import React, { createContext, useContext, useState, useEffect } from "react";
import { LIGHT, DARK } from "../constants/theme.js";

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const getSystemDark = () => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;

  const [darkOverride, setDarkOverride] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("leanplan_v4") || "{}");
      return saved.darkOverride ?? null;
    } catch { return null; }
  });

  const [systemDark, setSystemDark] = useState(getSystemDark);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = e => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const isDark = darkOverride !== null ? darkOverride : systemDark;
  const C = isDark ? DARK : LIGHT;

  return (
    <ThemeContext.Provider value={{ C, isDark, darkOverride, setDarkOverride }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { C: LIGHT, isDark: false, darkOverride: null, setDarkOverride: () => {} };
  return ctx;
};
