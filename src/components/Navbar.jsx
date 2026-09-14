// src/components/Navbar.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  TrophyIcon,
  UsersIcon,
  BookmarkIcon,
  SunIcon,
  MoonIcon,
  ExternalLinkIcon
} from './icons';
import './Navbar.css';

export default function Navbar({ activeTab, setActiveTab, liveCount, bookmarkedOnly, setBookmarkedOnly }) {
  const { theme, toggleTheme, bookmarks } = useAuth();

  return (
    <header className="t19-navbar">
      <div className="t19-navbar-inner">
        {/* Left: Two19 Labs Parent Branding + Product Name */}
        <div className="t19-brand-block">
          <a
            href="https://two19labs.in"
            target="_blank"
            rel="noopener noreferrer"
            className="t19-logo-badge"
            title="Visit Two19 Labs (two19labs.in)"
          >
            <span className="t19-logo-text">Two19 Labs<span className="blue-dot">.</span></span>
          </a>

          <span className="t19-brand-divider">/</span>

          <div
            className="t19-product-tag"
            onClick={() => setActiveTab('competitions')}
            role="button"
            tabIndex={0}
          >
            <span className="t19-product-name">ARENA</span>
            <span className="t19-subdomain-pill">undergrad hub</span>
          </div>

          <div className="t19-live-sync" title="Real-time ingestion active from unstop.com">
            <span className="t19-sync-dot"></span>
            <span className="t19-sync-label">Unstop Live</span>
          </div>
        </div>

        {/* Center: Primary Navigation Tabs */}
        <nav className="t19-nav">
          <button
            className={`t19-nav-tab ${activeTab === 'competitions' ? 'active' : ''}`}
            onClick={() => setActiveTab('competitions')}
          >
            <TrophyIcon size={15} />
            <span>Discover</span>
            {liveCount > 0 && <span className="t19-tab-badge">{liveCount}</span>}
          </button>

          <button
            className={`t19-nav-tab ${activeTab === 'squad-finder' ? 'active' : ''}`}
            onClick={() => setActiveTab('squad-finder')}
          >
            <UsersIcon size={15} />
            <span>Squad Finder</span>
            <span className="t19-tab-pill">Recruit</span>
          </button>
        </nav>

        {/* Right: Actions, Saved & Theme Toggle */}
        <div className="t19-actions">
          <button
            className={`t19-saved-btn ${bookmarkedOnly ? 'active' : ''}`}
            onClick={() => {
              if (activeTab !== 'competitions') setActiveTab('competitions');
              setBookmarkedOnly(!bookmarkedOnly);
            }}
            title="View saved opportunities"
          >
            <BookmarkIcon size={15} filled={bookmarks.length > 0} color={bookmarks.length > 0 ? "var(--color-lab-blue)" : "currentColor"} />
            <span className="t19-action-text">Saved</span>
            {bookmarks.length > 0 && <span className="t19-saved-count">{bookmarks.length}</span>}
          </button>

          <button
            className="t19-theme-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <MoonIcon size={16} /> : <SunIcon size={16} />}
          </button>

          <a
            href="https://two19labs.in"
            target="_blank"
            rel="noopener noreferrer"
            className="t19-studio-link"
            title="two19labs.in studio"
          >
            <span>two19labs.in</span>
            <ExternalLinkIcon size={12} />
          </a>
        </div>
      </div>
    </header>
  );
}
