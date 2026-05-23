import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check local storage first
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    // No auto-detection as per MD rules: "NOT system-preference auto-detection"
    return false;
  });

  const [forceLight, setForceLight] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (forceLight) {
      root.classList.remove('dark');
      return;
    }

    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode, forceLight]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, setForceLight }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
