// src/components/Navbar.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  TrophyIcon,
  UsersIcon,
  BookmarkIcon,
  SunIcon,
  MoonIcon,
  ShieldCheckIcon
} from './icons';
import './Navbar.css';

export default function Navbar({ activeTab, setActiveTab, liveCount, bookmarkedOnly, setBookmarkedOnly }) {
  const { theme, toggleTheme, bookmarks } = useAuth();

  return (
    <header className="arena-header">
      <div className="arena-header-inner">
        <div className="arena-brand-group">
          <div className="arena-logo" onClick={() => setActiveTab('competitions')} role="button" tabIndex={0}>
            <div className="arena-logo-mark">
              <TrophyIcon size={18} color="#ffffff" />
            </div>
            <div className="arena-brand-text">
              <div className="arena-brand-name">
                ARENA <span className="arena-brand-tag">UG</span>
              </div>
              <div className="arena-brand-sub">Collegiate Competition & Squad Hub</div>
            </div>
          </div>

          <div className="arena-sync-status">
            <span className="arena-live-dot"></span>
            <span className="arena-sync-text">Unstop Ingestion Active</span>
          </div>
        </div>

        <nav className="arena-nav-tabs">
          <button
            className={`arena-tab-btn ${activeTab === 'competitions' ? 'active' : ''}`}
            onClick={() => setActiveTab('competitions')}
          >
            <TrophyIcon size={16} />
            <span>Discover</span>
            {liveCount > 0 && <span className="arena-pill-count">{liveCount}</span>}
          </button>

          <button
            className={`arena-tab-btn ${activeTab === 'squad-finder' ? 'active' : ''}`}
            onClick={() => setActiveTab('squad-finder')}
          >
            <UsersIcon size={16} />
            <span>Squad Finder</span>
            <span className="arena-pill-highlight">Team Up</span>
          </button>
        </nav>

        <div className="arena-actions-group">
          <button
            className={`arena-bookmark-shortcut ${bookmarkedOnly ? 'active' : ''}`}
            onClick={() => {
              if (activeTab !== 'competitions') setActiveTab('competitions');
              setBookmarkedOnly(!bookmarkedOnly);
            }}
            title="Show saved bookmarks"
          >
            <BookmarkIcon size={16} filled={bookmarks.length > 0} color={bookmarks.length > 0 ? "var(--warning)" : "currentColor"} />
            <span className="arena-action-label">Saved</span>
            {bookmarks.length > 0 && <span className="arena-badge-count">{bookmarks.length}</span>}
          </button>

          <button
            className="arena-theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <MoonIcon size={18} /> : <SunIcon size={18} />}
          </button>

          <div className="arena-user-pill" title="Undergraduate Mode Active">
            <ShieldCheckIcon size={14} color="var(--success)" />
            <span>UG Verified</span>
          </div>
        </div>
      </div>
    </header>
  );
}
