// src/components/Sidebar.jsx
import React from 'react';
import OneStopLogo from './OneStopLogo';
import ThemeToggle from './ThemeToggle';

export default function Sidebar({
  screen,
  onNavigate,
  totalNewAlerts = 0,
  bookmarksCount = 0,
  pendingInboxCount = 0,
  profile,
  user = null,
  mobileOpen = false,
  onCloseMobile = () => {}
}) {
  const navItems = [
    {
      id: 'home',
      label: 'Home',
      badge: totalNewAlerts > 0 ? String(totalNewAlerts) : null,
      accentBadge: true
    },
    {
      id: 'browse',
      label: 'Browse',
      badge: null
    },
    {
      id: 'saved',
      label: 'Bookmarked',
      badge: bookmarksCount > 0 ? String(bookmarksCount) : null,
      accentBadge: false
    },
    {
      id: 'teams',
      label: 'Team finder',
      badge: null
    },
    {
      id: 'requests',
      label: 'Requests',
      badge: pendingInboxCount > 0 ? String(pendingInboxCount) : null,
      accentBadge: true
    }
  ];

  const initials = typeof profile?.name === 'string' && profile.name.trim()
    ? profile.name.trim().split(/\s+/).filter(Boolean).map(w => w.charAt(0)).join('').slice(0, 2).toUpperCase() || 'UG'
    : 'UG';

  const profileName = user
    ? (profile?.name || user?.email?.split('@')[0] || 'Your Profile')
    : 'Log In / Sign Up';

  const profileMeta = user
    ? (profile?.college
        ? `${profile.college}${profile.batch ? ` · ${profile.batch}` : ''}`
        : 'View & edit details')
    : 'Sign in to access profile';

  const handleNav = (id) => {
    onNavigate(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--scrim)',
            zIndex: 45
          }}
        />
      )}

      <aside
        style={{
          background: 'var(--surface)',
          borderRight: '1px solid var(--line)',
          padding: 'max(20px, var(--sat, 20px)) 14px max(20px, var(--sab, 20px))',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          width: '236px',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 46
        }}
        className={`sidebar-root ${mobileOpen ? 'sidebar-mobile-open' : ''}`}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
          <OneStopLogo
            height={26}
            style={{ cursor: 'pointer', margin: '2px 4px 0' }}
            onClick={() => handleNav('home')}
          />
          {mobileOpen && (
            <button
              type="button"
              onClick={onCloseMobile}
              style={{
                background: 'var(--surface-sunken)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ink-secondary)',
                cursor: 'pointer',
                fontSize: '14px',
                flexShrink: 0
              }}
              aria-label="Close sidebar"
            >
              ✕
            </button>
          )}
        </div>


        <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {navItems.map((item) => {
            const isActive = screen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  width: '100%',
                  textAlign: 'left',
                  border: 0,
                  borderRadius: '9px',
                  background: isActive ? 'var(--surface-muted)' : 'transparent',
                  color: isActive ? 'var(--ink)' : 'var(--ink-secondary)',
                  padding: '9px 12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'background-color 120ms ease, color 120ms ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'var(--surface-muted)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    style={{
                      background: item.accentBadge ? 'var(--primary)' : 'var(--surface-muted)',
                      color: item.accentBadge ? '#FFFFFF' : 'var(--ink-secondary)',
                      borderRadius: '20px',
                      padding: '1px 7px',
                      fontSize: '11px',
                      fontWeight: 700,
                      lineHeight: '1.4'
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Quick Theme Toggle in Sidebar */}
          <ThemeToggle variant="sidebar" />

          {/* User Profile Tile */}
          <button
            onClick={() => handleNav('profile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              textAlign: 'left',
              border: '1px solid var(--line)',
              borderRadius: '9px',
              background: screen === 'profile' ? 'var(--surface-muted)' : 'var(--surface-sunken)',
              padding: '9px 10px',
              cursor: 'pointer',
              transition: 'background-color 120ms ease, border-color 120ms ease'
            }}
            onMouseEnter={(e) => {
              if (screen !== 'profile') e.currentTarget.style.background = 'var(--surface-muted)';
            }}
            onMouseLeave={(e) => {
              if (screen !== 'profile') e.currentTarget.style.background = 'var(--surface-sunken)';
            }}
          >
            <span
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: user ? 'var(--surface-muted)' : 'var(--primary-tint-8, rgba(15, 63, 254, 0.08))',
                color: user ? 'var(--ink-secondary)' : 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 'none',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              {user ? (
                initials
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3, minWidth: 0 }}>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {profileName}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--ink-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {profileMeta}
              </span>
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
