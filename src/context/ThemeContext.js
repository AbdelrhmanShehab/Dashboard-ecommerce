// context/ThemeContext.jsx
"use client";
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [togglemode, setToggleMode] = useState(false);

  // On load, get from localStorage
  useEffect(() => {
    const storedMode = localStorage.getItem("darkMode");
    const isDark = storedMode === "true";
    setToggleMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  // On change, update localStorage and <html> class
  useEffect(() => {
    localStorage.setItem("darkMode", togglemode.toString());
    document.documentElement.classList.toggle("dark", togglemode);
  }, [togglemode]);

  return (
    <ThemeContext.Provider value={{ togglemode, setToggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default function useTheme() {
  return useContext(ThemeContext);
}
