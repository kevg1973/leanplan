import React, { createContext, useContext } from "react";

const LIGHT = {
  bg:"#f2f2f7", surface:"#ffffff", card:"#ffffff",
  accent:"#007aff", green:"#34c759", red:"#ff3b30",
  orange:"#ff9500", purple:"#af52de", teal:"#5ac8fa",
  pink:"#ff2d55", yellow:"#ffcc00", indigo:"#5856d6",
  text:"#000000", textSec:"#3c3c43", muted:"#8e8e93",
  border:"#e5e5ea", divider:"#c6c6c8", sectionBg:"#f2f2f7",
};

const DARK = {
  bg:"#000000", surface:"#1c1c1e", card:"#2c2c2e",
  accent:"#0a84ff", green:"#30d158", red:"#ff453a",
  orange:"#ff9f0a", purple:"#bf5af2", teal:"#5ac8fa",
  pink:"#ff375f", yellow:"#ffd60a", indigo:"#5e5ce6",
  text:"#ffffff", textSec:"#ebebf5", muted:"#8e8e93",
  border:"#3a3a3c", divider:"#48484a", sectionBg:"#1c1c1e",
};

const ThemeContext = createContext(DARK);

export function ThemeProvider({ isDark, children }) {
  const theme = isDark ? DARK : LIGHT;
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export { LIGHT, DARK };
