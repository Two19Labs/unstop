// src/components/ProfileScreen.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { SKILLS, initialsOf } from '../data/initialData';
import { YEAR_OPTIONS } from '../data/colleges';
import { useAuth } from '../context/AuthContext';
import SearchableCollegeSelect from './SearchableCollegeSelect';
import { WhatsAppIcon, SparklesIcon, CheckIcon } from './icons';
import './ProfileScreen.css';

export default function ProfileScreen({
  profile,
  onSaveProfile,
  user,
  onOpenAuthModal,
  onSignOut
}) {
  const { getProfileCooldown } = useAuth();
  const [name, setName] = useState(profile?.name || '');
  const [college, setCollege] = useState(profile?.college || '');
  const [year, setYear] = useState(() => {
    if (profile?.year && YEAR_OPTIONS.includes(profile.year)) return profile.year;
    if (profile?.batch && YEAR_OPTIONS.includes(profile.batch)) return profile.batch;
    if ((profile?.education_level || '').toLowerCase().includes('post')) return 'PG 1st Year';
    return 'UG 2nd Year';
  });
  const [phone, setPhone] = useState(profile?.phone || '');
  const [skills, setSkills] = useState(profile?.skills || []);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Live 24-Hour Cooldown
  const [cooldown, setCooldown] = useState(() => (getProfileCooldown ? getProfileCooldown(profile, user) : { isLocked: false }));

  useEffect(() => {
    if (!getProfileCooldown) return;
    setCooldown(getProfileCooldown(profile, user));
    const interval = setInterval(() => {
      setCooldown(getProfileCooldown(profile, user));
    }, 1000);
    return () => clearInterval(interval);
  }, [profile, user, getProfileCooldown]);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setCollege(profile.college || '');
      setPhone(profile.phone || '');
      setSkills(profile.skills || []);
      if (profile.year && YEAR_OPTIONS.includes(profile.year)) {
        setYear(profile.year);
      } else if (profile.batch && YEAR_OPTIONS.includes(profile.batch)) {
        setYear(profile.batch);
      } else if ((profile.education_level || '').toLowerCase().includes('post')) {
        setYear('PG 1st Year');
      } else {
        setYear('UG 2nd Year');
      }
    }
  }, [profile]);

  const toggleSkill = (skill) => {
    if (cooldown.isLocked) return;
    setSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const isPostgraduate = year.startsWith('PG');

  const handleSave = (e) => {
    e.preventDefault();
    if (cooldown.isLocked) return;
    onSaveProfile({
      name: name.trim() || 'Student',
      college: college.trim() || 'College',
      course: '', // removed per user request
      year: year,
      batch: year,
      education_level: isPostgraduate ? 'postgraduate' : 'undergraduate',
      phone: phone.trim(),
      skills
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2400);
  };

  // Profile readiness checklist calculations
  const readiness = useMemo(() => {
    const checks = [
      { id: 'name', label: 'Full name', done: Boolean(name.trim()) },
      { id: 'college', label: 'College / University', done: Boolean(college.trim()) },
      { id: 'year', label: 'Academic standing', done: Boolean(year) },
      { id: 'skills', label: 'At least 1 skill', done: skills.length > 0 },
      { id: 'phone', label: 'WhatsApp contact', done: Boolean(phone.trim()) }
    ];
    const completedCount = checks.filter(c => c.done).length;
    const percentage = Math.round((completedCount / checks.length) * 100);
    return { checks, percentage };
  }, [name, college, year, skills, phone]);

  const previewInitials = initialsOf(name || (user?.email ? user.email.split('@')[0] : 'Student'));

  return (
    <div className="profile-screen-container">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-header-titles">
          <h1>Profile</h1>
          <p>Squad leads see this when you apply. Skills drive what gets recommended to you.</p>
        </div>

        <div className="profile-header-badges">
          {user ? (
            <span className="profile-status-pill synced">
              <span className="profile-status-dot" />
              Cloud Synced · {user.email ? user.email.split('@')[0] : 'User'}
            </span>
          ) : (
            <span className="profile-status-pill guest">
              <span className="profile-status-dot" />
              Guest Mode
            </span>
          )}
        </div>
      </div>

      {/* 24-Hour Cooldown Notice */}
      {cooldown.isLocked && (
        <div className="profile-cooldown-banner">
          <span style={{ fontSize: '18px' }} role="img" aria-label="Locked">🔒</span>
          <div>
            <strong>Profile edit locked:</strong> Details can only be updated once every 24 hours. Cooldown remaining:{' '}
            <span className="profile-cooldown-timer">{cooldown.remainingFormatted}</span>
          </div>
        </div>
      )}

      {/* Responsive 2-Column Grid (Uses full width of page) */}
      <div className="profile-screen-grid">
        {/* Left Column: Interactive Form */}
        <form onSubmit={handleSave} className="profile-form-column">
          {/* 1. Academic Standing Card */}
          <div className="profile-card">
            <div className="profile-card-header">
              <h2 className="profile-card-title">
                Academic Standing
              </h2>
              <span className={`profile-card-badge ${isPostgraduate ? 'mba' : 'ug'}`}>
                {isPostgraduate ? '✨ MBA & PG challenges unlocked' : '🛡️ Undergraduate competitions only'}
              </span>
            </div>

            <p className="profile-card-subtitle">
              Configures competition eligibility across all national case challenges, hackathons, and corporate summits.
            </p>

            <div className="profile-year-grid">
              {YEAR_OPTIONS.map((y) => {
                const isSelected = year === y;
                const isPgOption = y.startsWith('PG');
                return (
                  <button
                    key={y}
                    type="button"
                    disabled={cooldown.isLocked}
                    onClick={() => setYear(y)}
                    className={`profile-year-btn ${isSelected ? 'selected' : ''}`}
                  >
                    <div className="profile-year-btn-left">
                      <div className="profile-year-radio">
                        {isSelected && <div className="profile-year-radio-dot" />}
                      </div>
                      <span className="profile-year-label">{y}</span>
                    </div>
                    {isPgOption && (
                      <span className={`profile-year-tag ${isSelected ? 'selected' : 'unselected'}`}>
                        MBA/PG
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="profile-eligibility-callout">
              {isPostgraduate ? (
                <span>
                  ✨ <strong>Postgraduate active:</strong> Showing MBA & postgraduate flagship challenges (IIMs, corporate summits) <em>as well as</em> all open collegiate competitions.
                </span>
              ) : (
                <span>
                  🛡️ <strong>Undergraduate active:</strong> Showing curated undergraduate-eligible competitions. MBA-only and PG-exclusive listings are strictly hidden.
                </span>
              )}
            </div>
          </div>

          {/* 2. Personal & Campus Information Card */}
          <div className="profile-card">
            <div className="profile-card-header">
              <h2 className="profile-card-title">
                Personal & Campus Information
              </h2>
            </div>
            <p className="profile-card-subtitle">
              Your collegiate identity displayed on squad applications and team invitations.
            </p>

            <div className="profile-fields-grid">
              <div className="profile-input-group">
                <label className="profile-label" htmlFor="profile-name-input">Full Name</label>
                <input
                  id="profile-name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  disabled={cooldown.isLocked}
                  className="profile-input"
                />
              </div>

              <div className="profile-input-group">
                <label className="profile-label">College / University</label>
                <SearchableCollegeSelect
                  value={college}
                  onChange={(val) => setCollege(val)}
                  placeholder="Search college (e.g. SRCC, SSCBS, IIT)..."
                  disabled={cooldown.isLocked}
                />
              </div>
            </div>

            <div className="profile-input-group" style={{ marginTop: '2px' }}>
              <label className="profile-label" htmlFor="profile-phone-input" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <WhatsAppIcon size={15} /> WhatsApp Number
              </label>
              <input
                id="profile-phone-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98••• ••210"
                disabled={cooldown.isLocked}
                className="profile-input"
              />
              <span className="profile-input-help">
                Shared only after a squad lead accepts your application for the instant 1-click WhatsApp squad handshake.
              </span>
            </div>
          </div>

          {/* 3. Skills & Capabilities Card */}
          <div className="profile-card">
            <div className="profile-card-header">
              <h2 className="profile-card-title">
                Skills & Capabilities
              </h2>
              <span className="profile-card-badge ug">
                {skills.length} selected
              </span>
            </div>
            <p className="profile-card-subtitle">
              Choose skills that match your experience. Squad leads filter and recruit based on these tags.
            </p>

            <div className="profile-skills-wrap">
              {SKILLS.map((skill) => {
                const isSelected = skills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    disabled={cooldown.isLocked}
                    onClick={() => toggleSkill(skill)}
                    className={`profile-skill-chip ${isSelected ? 'selected' : ''}`}
                  >
                    {isSelected && <span style={{ marginRight: '4px' }}>✓</span>}
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Action Bar */}
          <div className="profile-action-bar">
            <button
              type="submit"
              disabled={cooldown.isLocked}
              className="profile-save-btn"
            >
              {cooldown.isLocked ? 'Edit Locked (24h Cooldown)' : 'Save changes'}
            </button>

            {savedSuccess && (
              <span className="profile-save-feedback">
                <CheckIcon size={16} color="#15803D" /> Profile saved successfully
              </span>
            )}
          </div>
        </form>

        {/* Right Column: Live Squad Preview, Cloud Sync & Readiness Rail */}
        <aside className="profile-rail-column">
          {/* Live Squad Card Preview */}
          <div className="profile-preview-card">
            <div className="profile-preview-top-badge">
              <span className="profile-preview-lead-tag">
                Squad Lead View
              </span>
              <span className="profile-preview-live-indicator">
                <span className="profile-preview-live-dot" />
                Live Preview
              </span>
            </div>

            <div className="profile-preview-user-row">
              <div className="profile-preview-avatar">
                {previewInitials}
              </div>
              <div className="profile-preview-user-info">
                <div className="profile-preview-name" title={name || 'Student'}>
                  {name.trim() || 'Your Name'}
                </div>
                <div className="profile-preview-college" title={college || 'College'}>
                  🏛️ {college.trim() || 'Select your college'}
                </div>
              </div>
            </div>

            <div className={`profile-preview-standing-badge ${isPostgraduate ? 'pg' : ''}`}>
              🎓 {year} {isPostgraduate ? '· MBA / PG' : '· Undergraduate'}
            </div>

            <div className="profile-preview-contact-box">
              <div className={`profile-preview-contact-status ${phone.trim() ? 'ready' : 'missing'}`}>
                {phone.trim() ? (
                  <>
                    <span>🟢</span> WhatsApp Handshake Ready
                  </>
                ) : (
                  <>
                    <span>⚠️</span> WhatsApp number missing
                  </>
                )}
              </div>
              <div className="profile-preview-contact-desc">
                {phone.trim()
                  ? `${phone.trim()} · 1-click squad chat unlocked upon acceptance`
                  : 'Add your WhatsApp number so squad leads can immediately message you.'}
              </div>
            </div>

            <div className="profile-preview-skills-section">
              <div className="profile-preview-skills-label">
                Highlighted Skills ({skills.length})
              </div>
              {skills.length > 0 ? (
                <div className="profile-preview-skills-tags">
                  {skills.map((s) => (
                    <span key={s} className="profile-preview-skill-tag">
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="profile-preview-empty-skills">
                  No skills selected yet  -  select skills on the left to stand out in squad searches.
                </span>
              )}
            </div>

            <div className="profile-preview-footer-note">
              💡 Squad leads in Team Finder and Requests review this exact card when deciding whether to accept you into their squad.
            </div>
          </div>

          {/* Account & Cloud Sync Card */}
          <div className="profile-sync-card">
            <div className="profile-sync-header">
              <div className="profile-sync-title">
                <span>☁️</span> Cloud Sync & Account
              </div>
              {user && (
                <span style={{ fontSize: '11px', color: '#15803D', fontWeight: 600 }}>
                  Active
                </span>
              )}
            </div>

            <p className="profile-sync-desc">
              {user
                ? `Signed in as ${user.email} · Bookmarks, squad posts, and applications are synced to Supabase cloud.`
                : 'Sign in to sync your bookmarks, squad applications, and collegiate profile across all devices.'}
            </p>

            <div>
              {user ? (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="profile-sync-btn-outline"
                >
                  Sign out
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAuthModal}
                  className="profile-sync-btn-primary"
                >
                  Sign in to Cloud Sync
                </button>
              )}
            </div>
          </div>

          {/* Collegiate Profile Readiness Checklist */}
          <div className="profile-readiness-card">
            <div className="profile-readiness-header">
              <span className="profile-readiness-title">Profile Readiness</span>
              <span className="profile-readiness-score">{readiness.percentage}%</span>
            </div>

            <div className="profile-readiness-bar-track">
              <div
                className="profile-readiness-bar-fill"
                style={{ width: `${readiness.percentage}%` }}
              />
            </div>

            <div className="profile-readiness-checklist">
              {readiness.checks.map((check) => (
                <div
                  key={check.id}
                  className={`profile-readiness-item ${check.done ? 'done' : ''}`}
                >
                  <span className={`profile-readiness-check ${check.done ? 'done' : 'missing'}`}>
                    {check.done ? '✓' : '○'}
                  </span>
                  <span>{check.label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
