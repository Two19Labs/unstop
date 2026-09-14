import React, { useState } from 'react';
import CaseCompsPage from './components/CaseCompsPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('radar');
  const [teamPrefill, setTeamPrefill] = useState(null);
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

  const handleNavigate = (page, prefill) => {
    if (page === 'team-finder') {
      setTeamPrefill(prefill);
      setCurrentPage('team-finder');
    } else {
      setCurrentPage(page);
    }
  };

  return (
    <div className="app-root" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Global minimal navbar with theme toggle */}
      <nav
        style={{
          maxWidth: '1160px',
          margin: '0 auto',
          padding: '16px 16px 8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '1rem', color: 'var(--ink)' }}>
          <span style={{ background: '#1c4980', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>
            RADAR
          </span>
          <span>Unstop Circuit Aggregator</span>
        </div>
        <button
          onClick={toggleTheme}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--ink)',
            borderRadius: '8px',
            padding: '6px 12px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </nav>

      <main style={{ paddingTop: '8px' }}>
        {currentPage === 'team-finder' ? (
          <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 16px' }}>
            <button
              onClick={() => setCurrentPage('radar')}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--ink)',
                borderRadius: '8px',
                padding: '8px 16px',
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: '20px',
              }}
            >
              ← Back to Radar
            </button>
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '24px',
              }}
            >
              <h2 style={{ margin: '0 0 12px', color: 'var(--ink)' }}>Teammate Finder Bridge</h2>
              <p style={{ color: 'var(--ink-dim)', marginBottom: '20px' }}>
                Prefill payload received for squad formation:
              </p>
              <pre
                style={{
                  background: 'var(--bg)',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  overflowX: 'auto',
                  fontSize: '0.85rem',
                  color: 'var(--ink)',
                }}
              >
                {JSON.stringify(teamPrefill, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <CaseCompsPage
            onNavigate={handleNavigate}
          />
        )}
      </main>
    </div>
  );
}
