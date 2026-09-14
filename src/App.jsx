import React, { useState } from 'react';
import CaseCompsPage from './components/CaseCompsPage';

export default function App() {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  return (
    <div className="app-root" style={{ minHeight: '100vh', background: 'var(--bg, #f8fafc)' }}>
      {/* Sleek Top Navigation Bar */}
      <header
        style={{
          borderBottom: '1px solid var(--border, #e2e8f0)',
          background: 'var(--surface, #ffffff)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: '1160px',
            margin: '0 auto',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '1.05rem', color: 'var(--ink, #0f172a)' }}>
            <span
              style={{
                background: '#1c4980',
                color: '#ffffff',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                letterSpacing: '0.5px',
              }}
            >
              RADAR
            </span>
            <span>Case Competitions Radar</span>
          </div>

          <button
            onClick={toggleTheme}
            style={{
              background: 'var(--bg, #f8fafc)',
              border: '1px solid var(--border, #e2e8f0)',
              color: 'var(--ink, #0f172a)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </header>

      {/* Main Opportunities Feed */}
      <main style={{ paddingTop: '20px' }}>
        <CaseCompsPage />
      </main>
    </div>
  );
}
