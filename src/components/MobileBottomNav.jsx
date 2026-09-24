// src/components/MobileBottomNav.jsx
import React from 'react';
import './MobileBottomNav.css';

export default function MobileBottomNav({
  screen,
  onNavigate,
  pendingInboxCount = 0,
  bookmarksCount = 0,
  profile
}) {
  const initials = typeof profile?.name === 'string' && profile.name.trim()
    ? profile.name.trim().split(/\s+/).filter(Boolean).map(w => w.charAt(0)).join('').slice(0, 2).toUpperCase() || 'UG'
    : 'UG';

  const isHome = screen === 'home';
  const isBrowse = screen === 'browse' || screen === 'saved';
  const isTeams = screen === 'teams';
  const isRequests = screen === 'requests';
  const isProfile = screen === 'profile';

  return (
    <nav className="onestop-mobile-bottom-nav" aria-label="Mobile Navigation">
      {/* 1. Home */}
      <button
        type="button"
        className={`mobile-nav-item ${isHome ? 'active' : ''}`}
        onClick={() => onNavigate('home')}
        aria-label="Home"
      >
        <div className="mobile-nav-icon-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill={isHome ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={isHome ? 2.2 : 1.75} strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </div>
        <span className="mobile-nav-label">Home</span>
      </button>

      {/* 2. Browse */}
      <button
        type="button"
        className={`mobile-nav-item ${isBrowse ? 'active' : ''}`}
        onClick={() => onNavigate('browse')}
        aria-label="Browse Competitions"
      >
        <div className="mobile-nav-icon-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isBrowse ? 2.2 : 1.75} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill={isBrowse ? 'currentColor' : 'none'}></polygon>
          </svg>
        </div>
        <span className="mobile-nav-label">Browse</span>
      </button>

      {/* 3. Squads */}
      <button
        type="button"
        className={`mobile-nav-item ${isTeams ? 'active' : ''}`}
        onClick={() => onNavigate('teams')}
        aria-label="Team Finder"
      >
        <div className="mobile-nav-icon-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isTeams ? 2.2 : 1.75} strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <span className="mobile-nav-label">Squads</span>
      </button>

      {/* 4. Requests */}
      <button
        type="button"
        className={`mobile-nav-item ${isRequests ? 'active' : ''}`}
        onClick={() => onNavigate('requests')}
        aria-label="Requests and applications"
      >
        <div className="mobile-nav-icon-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isRequests ? 2.2 : 1.75} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline>
            <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
          </svg>
          {pendingInboxCount > 0 && (
            <span className="mobile-nav-badge">{pendingInboxCount}</span>
          )}
        </div>
        <span className="mobile-nav-label">Requests</span>
      </button>

      {/* 5. Profile */}
      <button
        type="button"
        className={`mobile-nav-item ${isProfile ? 'active' : ''}`}
        onClick={() => onNavigate('profile')}
        aria-label="Your Profile"
      >
        <div className="mobile-nav-icon-wrap">
          <span className="mobile-nav-avatar">
            {initials}
          </span>
        </div>
        <span className="mobile-nav-label">Profile</span>
      </button>
    </nav>
  );
}
