import React, { createContext, useContext, useEffect, useState } from 'react';

// Light mode parked; Gemini direction is dark-only.
const ThemeContext = createContext({
  theme: 'dark',
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  // Always render dark
  const [theme] = useState('dark');

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', 'dark');
    root.style.colorScheme = 'dark';
  }, []);

  const toggleTheme = () => {
    // No-op: Gemini direction is dark-only
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
