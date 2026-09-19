// src/components/Sidebar.jsx
import React from 'react';

export default function Sidebar({
  screen,
  onNavigate,
  totalNewAlerts = 0,
  bookmarksCount = 0,
  pendingInboxCount = 0,
  profile,
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
      label: 'Bookmarks',
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

  const initials = profile?.name
    ? profile.name.split(' ').filter(Boolean).map(w => w.charAt(0)).join('').slice(0, 2).toUpperCase() || 'UG'
    : 'UG';

  const profileName = profile?.name || 'Your Profile';
  const profileMeta = profile?.college
    ? `${profile.college}${profile.batch ? ` · ${profile.batch}` : ''}`
    : 'Click to edit details';

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
            background: 'rgba(26,26,25,0.35)',
            zIndex: 45
          }}
        />
      )}

      <aside
        style={{
          background: '#FFFFFF',
          borderRight: '1px solid #E7E6E2',
          padding: '20px 14px',
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img
            src="/logo-onestop.png"
            alt="OneStop"
            style={{
              height: '26px',
              width: 'auto',
              alignSelf: 'flex-start',
              margin: '2px 8px 0',
              display: 'block',
              cursor: 'pointer'
            }}
            onClick={() => handleNav('home')}
          />
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
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
                  background: isActive ? '#F2F1ED' : 'transparent',
                  color: isActive ? '#1A1A19' : '#55534D',
                  padding: '9px 12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'background 120ms ease, color 120ms ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = '#F2F1ED';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    style={{
                      background: item.accentBadge ? '#0F3FFE' : '#E7E6E2',
                      color: item.accentBadge ? '#FFFFFF' : '#55534D',
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
          <button
            onClick={() => handleNav('profile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              textAlign: 'left',
              border: 0,
              borderRadius: '9px',
              background: screen === 'profile' ? '#F2F1ED' : 'transparent',
              padding: '9px 8px',
              cursor: 'pointer',
              transition: 'background 120ms ease'
            }}
            onMouseEnter={(e) => {
              if (screen !== 'profile') e.currentTarget.style.background = '#F2F1ED';
            }}
            onMouseLeave={(e) => {
              if (screen !== 'profile') e.currentTarget.style.background = 'transparent';
            }}
          >
            <span
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: '#E7E6E2',
                color: '#55534D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 'none',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              {initials}
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3, minWidth: 0 }}>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#1A1A19',
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
                  color: '#75736C',
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
