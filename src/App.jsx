import React, { useState } from 'react';
import CaseCompsPage from './components/CaseCompsPage';
import TeamFinderPage from './components/TeamFinderPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('radar'); // 'radar' | 'team-finder'
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
      setTeamPrefill(prefill || null);
      setCurrentPage('team-finder');
    } else {
      setCurrentPage(page);
    }
  };

  return (
    <div className="app-root" style={{ minHeight: '100vh', background: 'var(--bg, #f8fafc)' }}>
      {/* Universal Header Navigation */}
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
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              onClick={() => setCurrentPage('radar')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 800,
                fontSize: '1.05rem',
                color: 'var(--ink, #0f172a)',
                cursor: 'pointer',
              }}
            >
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
              <span>Case Comp & Squad Engine</span>
            </div>

            {/* Navigation Tabs */}
            <nav style={{ display: 'flex', gap: '6px', marginLeft: '12px' }}>
              <button
                onClick={() => setCurrentPage('radar')}
                style={{
                  background: currentPage === 'radar' ? 'var(--ink, #0f172a)' : 'transparent',
                  color: currentPage === 'radar' ? 'var(--surface, #ffffff)' : 'var(--ink-dim, #64748b)',
                  border: '1px solid',
                  borderColor: currentPage === 'radar' ? 'var(--ink, #0f172a)' : 'transparent',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                🏆 Competitions
              </button>
              <button
                onClick={() => {
                  setTeamPrefill(null);
                  setCurrentPage('team-finder');
                }}
                style={{
                  background: currentPage === 'team-finder' ? 'var(--ink, #0f172a)' : 'transparent',
                  color: currentPage === 'team-finder' ? 'var(--surface, #ffffff)' : 'var(--ink-dim, #64748b)',
                  border: '1px solid',
                  borderColor: currentPage === 'team-finder' ? 'var(--ink, #0f172a)' : 'transparent',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                👥 Squad Finder
              </button>
            </nav>
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

      {/* Main Page View */}
      <main style={{ paddingTop: '20px' }}>
        {currentPage === 'team-finder' ? (
          <TeamFinderPage
            onBack={() => setCurrentPage('radar')}
            initialPrefill={teamPrefill}
          />
        ) : (
          <CaseCompsPage
            onNavigate={handleNavigate}
          />
        )}
      </main>
    </div>
  );
}
