import React from 'react';
import { useTheme } from './ThemeProvider';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-full cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 ${className}`}
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border-strong)',
        color: 'var(--text-primary)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
      }}
    >
      <span className="text-sm font-semibold select-none leading-none">
        ◐
      </span>
    </button>
  );
}
