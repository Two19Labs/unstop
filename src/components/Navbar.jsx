// src/components/Navbar.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  TrophyIcon,
  UsersIcon,
  BookmarkIcon,
  SunIcon,
  MoonIcon,
  ExternalLinkIcon,
  UserIcon,
  LogOutIcon,
  ChevronDownIcon,
  SettingsIcon
} from './icons';
import OneStopLogo from './OneStopLogo';
import './Navbar.css';

export default function Navbar({ activeTab, setActiveTab, liveCount, bookmarkedOnly, setBookmarkedOnly }) {
  const {
    user,
    profile,
    signOut,
    openAuthModal,
    openProfileModal,
    theme,
    toggleTheme,
    bookmarks
  } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = useMemo(() => {
    return profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  }, [profile?.full_name, user?.user_metadata?.full_name, user?.email]);

  const displayCollege = profile?.college || user?.user_metadata?.college || '';

  const getInitials = (name, email) => {
    if (name) {
      const parts = name.trim().split(/\s+/).filter(Boolean);
      if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      if (parts.length === 1 && parts[0].length > 0) return parts[0].slice(0, 2).toUpperCase();
    }
    if (email) {
      const cleanEmail = email.trim();
      if (cleanEmail.length > 0) return cleanEmail.slice(0, 2).toUpperCase();
    }
    return 'OS';
  };

  const initials = useMemo(() => {
    return getInitials(displayName, user?.email);
  }, [displayName, user?.email]);

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
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveTab('competitions');
              }
            }}
            role="button"
            tabIndex={0}
            title="OneStop — Undergraduate Opportunities Hub"
          >
            <OneStopLogo height={25} className="t19-navbar-logo" />
            <span className="t19-subdomain-pill">undergrad hub</span>
          </div>

          <div className="t19-live-sync" title="Real-time opportunity ingestion active">
            <span className="t19-sync-dot"></span>
            <span className="t19-sync-label">Live Sync</span>
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

        {/* Right: Actions, Auth & Theme Toggle */}
        <div className="t19-actions">
          {/* Saved Bookmarks Button */}
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

          {/* Theme Toggle Button */}
          <button
            className="t19-theme-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <MoonIcon size={16} /> : <SunIcon size={16} />}
          </button>

          {/* Authentication State Button */}
          {user ? (
            <div className="t19-user-menu-container" ref={menuRef}>
              <button
                className="t19-user-pill"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-expanded={menuOpen}
              >
                <span className="t19-user-avatar">{initials}</span>
                <span className="t19-user-name">{displayName}</span>
                <ChevronDownIcon size={14} className={`t19-chevron ${menuOpen ? 'rotated' : ''}`} />
              </button>

              {menuOpen && (
                <div className="t19-user-dropdown">
                  <div className="t19-dropdown-header">
                    <div className="t19-dropdown-name">{displayName}</div>
                    <div className="t19-dropdown-email">{user.email}</div>
                    {displayCollege && (
                      <span className="t19-dropdown-college">{displayCollege}</span>
                    )}
                  </div>

                  <div className="t19-dropdown-divider"></div>

                  <button
                    className="t19-dropdown-item"
                    onClick={() => {
                      openProfileModal();
                      setMenuOpen(false);
                    }}
                  >
                    <SettingsIcon size={15} />
                    <span>Profile &amp; Account Settings</span>
                  </button>

                  <button
                    className="t19-dropdown-item"
                    onClick={() => {
                      setActiveTab('squad-finder');
                      setMenuOpen(false);
                    }}
                  >
                    <UsersIcon size={15} />
                    <span>My Squads & Applications</span>
                  </button>

                  <div className="t19-dropdown-divider"></div>

                  <button
                    className="t19-dropdown-item t19-dropdown-item-danger"
                    onClick={() => {
                      signOut();
                      setMenuOpen(false);
                    }}
                  >
                    <LogOutIcon size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="t19-auth-btn"
              onClick={() => openAuthModal({ title: 'Sign In to OneStop', initialTab: 'signin' })}
            >
              <UserIcon size={14} />
              <span>Sign In</span>
            </button>
          )}

          {/* Studio Link */}
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
