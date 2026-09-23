// src/components/ThemeToggle.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { SunIcon, MoonIcon } from './icons';
import './ThemeToggle.css';

export default function ThemeToggle({
  variant = 'compact', // 'compact' | 'pill' | 'sidebar'
  className = '',
  style = {}
}) {
  const { theme, toggleTheme } = useAuth();
  const isDark = theme === 'dark';

  const titleText = isDark ? 'Switch to Day mode (Light)' : 'Switch to Night mode (Dark)';
  const labelText = isDark ? 'Night' : 'Day';

  if (variant === 'sidebar') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`theme-toggle-sidebar-row ${className}`}
        style={style}
        title={titleText}
        aria-label={titleText}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="theme-toggle-icon">
            {isDark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
          </span>
          <span>Theme</span>
        </div>
        <span className="theme-toggle-sidebar-status">
          {labelText}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle-btn ${variant === 'compact' ? 'compact' : ''} ${className}`}
      style={style}
      title={titleText}
      aria-label={titleText}
    >
      <span className="theme-toggle-icon">
        {isDark ? <SunIcon size={17} /> : <MoonIcon size={17} />}
      </span>
      {variant === 'pill' && (
        <span className="theme-toggle-label">
          {labelText}
        </span>
      )}
    </button>
  );
}
