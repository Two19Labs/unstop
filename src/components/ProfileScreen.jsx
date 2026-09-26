// src/components/ProfileScreen.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SKILLS, initialsOf } from '../data/initialData';
import SearchableCollegeSelect from './SearchableCollegeSelect';
import {
  WhatsAppIcon,
  CheckIcon,
  ChevronDownIcon,
  LockIcon,
  LogOutIcon,
  AlertCircleIcon,
  CloseIcon,
  BellIcon
} from './icons';
import {
  isPushSupported,
  getPushPermission,
  isPushEnabled,
  setPushEnabled,
  requestPushPermission,
  dispatchBrowserNotification
} from '../lib/browserPushService';
import { getProfileCooldown } from '../context/AuthContext';
import { isAdminEmail } from '../lib/admin';
import ProfileAuthGate from './ProfileAuthGate';
import './ProfileScreen.css';

const YEARS = {
  UG: ['1st', '2nd', '3rd', '4th'],
  PG: ['1st', '2nd']
};

function parseAcademicStanding(profile) {
  const candidate = (profile?.year || profile?.batch || '').trim();
  const match = candidate.match(/^(UG|PG)\s+(\d+(?:st|nd|rd|th))\s+Year$/i);
  if (match) {
    const lvl = match[1].toUpperCase();
    const yr = match[2];
    if (YEARS[lvl]?.includes(yr)) {
      return { level: lvl, yearNum: yr };
    }
  }

  const isPost = (profile?.education_level || '').toLowerCase().includes('post') || candidate.startsWith('PG');
  if (isPost) {
    return { level: 'PG', yearNum: '1st' };
  }
  return { level: 'UG', yearNum: '2nd' };
}

function ProfileScreenContent({
  profile,
  onSaveProfile,
  user,
  onOpenAuthModal,
  onSignOut,
  onChangePassword,
  onDeleteAccount,
  flashToast,
  onNavigate
}) {
  // 1. Initial snapshot resolution
  const initialAcademic = useMemo(() => parseAcademicStanding(profile), [profile]);

  const [name, setName] = useState(profile?.name || '');
  const [college, setCollege] = useState(profile?.college || '');
  const [level, setLevel] = useState(initialAcademic.level);
  const [yearNum, setYearNum] = useState(initialAcademic.yearNum);
  const [phone, setPhone] = useState(profile?.phone || '');
  const [skills, setSkills] = useState(profile?.skills || []);

  // Snapshot of last saved values to determine dirty state and allow Discard
  const [savedSnapshot, setSavedSnapshot] = useState({
    name: profile?.name || '',
    college: profile?.college || '',
    level: initialAcademic.level,
    yearNum: initialAcademic.yearNum,
    phone: profile?.phone || '',
    skills: profile?.skills || []
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const successTimerRef = useRef(null);

  // 24-Hour Cooldown State: Only displayed when the user attempts to save changes within 24 hours
  const [cooldown, setCooldown] = useState(null);
  const [showCooldownNotice, setShowCooldownNotice] = useState(false);
  const cooldownIntervalRef = useRef(null);

  // Modals for Account features
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);

  // Desktop Push Notifications State
  const [pushPermission, setPushPermission] = useState(getPushPermission);
  const [pushEnabled, setPushEnabledState] = useState(isPushEnabled);

  const handleRequestPush = async () => {
    const res = await requestPushPermission();
    setPushPermission(res);
    setPushEnabledState(isPushEnabled());
    if (res === 'granted' && flashToast) {
      flashToast('Desktop notifications enabled!');
    }
  };

  const handleTogglePush = () => {
    if (pushPermission !== 'granted') {
      handleRequestPush();
      return;
    }
    const next = !pushEnabled;
    setPushEnabled(next);
    setPushEnabledState(next);
    if (flashToast) {
      flashToast(next ? 'Desktop alerts enabled' : 'Desktop alerts muted');
    }
  };

  const handleSendTestPush = () => {
    const dispatched = dispatchBrowserNotification({
      title: '🔔 OneStop Notification Radar',
      body: 'Desktop alerts are active! You will be notified 1h before registration cutoffs and 30m before round deadlines.',
      tag: 'test_push_' + Date.now()
    });
    if (dispatched && flashToast) {
      flashToast('Test notification sent!');
    }
  };

  // Sync state if profile prop changes externally (e.g. initial cloud sync load)
  useEffect(() => {
    if (profile) {
      const parsed = parseAcademicStanding(profile);
      const nextSaved = {
        name: profile.name || '',
        college: profile.college || '',
        level: parsed.level,
        yearNum: parsed.yearNum,
        phone: profile.phone || '',
        skills: Array.isArray(profile.skills) ? profile.skills : []
      };
      setName(nextSaved.name);
      setCollege(nextSaved.college);
      setLevel(nextSaved.level);
      setYearNum(nextSaved.yearNum);
      setPhone(nextSaved.phone);
      setSkills(nextSaved.skills);
      setSavedSnapshot(nextSaved);
    }
  }, [profile]);

  // Live timer interval: ticks every second only while cooldown notice is displayed
  useEffect(() => {
    if (showCooldownNotice) {
      const updateTimer = () => {
        const cd = getProfileCooldown(profile, user);
        if (!cd.isLocked) {
          setShowCooldownNotice(false);
          setCooldown(null);
        } else {
          setCooldown(cd);
        }
      };
      updateTimer();
      cooldownIntervalRef.current = setInterval(updateTimer, 1000);
      return () => {
        if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
      };
    } else {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    }
  }, [showCooldownNotice, profile, user]);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, []);

  // 2. Computed Dirty State
  const isDirty = useMemo(() => {
    if (name !== savedSnapshot.name) return true;
    if (college !== savedSnapshot.college) return true;
    if (level !== savedSnapshot.level) return true;
    if (yearNum !== savedSnapshot.yearNum) return true;
    if (phone !== savedSnapshot.phone) return true;
    const currentSkillsStr = [...skills].sort().join('|');
    const savedSkillsStr = [...savedSnapshot.skills].sort().join('|');
    return currentSkillsStr !== savedSkillsStr;
  }, [name, college, level, yearNum, phone, skills, savedSnapshot]);

  // Level switch: validate yearNum against valid options for new level
  const handleLevelChange = (e) => {
    const newLevel = e.target.value;
    setLevel(newLevel);
    if (!YEARS[newLevel].includes(yearNum)) {
      setYearNum('1st');
    }
  };

  const toggleSkill = (skill) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleDiscard = () => {
    setName(savedSnapshot.name);
    setCollege(savedSnapshot.college);
    setLevel(savedSnapshot.level);
    setYearNum(savedSnapshot.yearNum);
    setPhone(savedSnapshot.phone);
    setSkills(savedSnapshot.skills);
    setShowCooldownNotice(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // 24-hour edit cooldown check: only displayed when someone attempts to update within 24 hours
    const currentCooldown = getProfileCooldown(profile, user);
    if (currentCooldown.isLocked) {
      setCooldown(currentCooldown);
      setShowCooldownNotice(true);
      if (flashToast) {
        flashToast(`Profile edit locked (${currentCooldown.remainingFormatted} remaining)`);
      }
      return;
    }

    const isPost = level === 'PG';
    const computedYear = `${level} ${yearNum} Year`;

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      if (flashToast) {
        flashToast('Please enter a valid 10-digit WhatsApp number.');
      }
      return;
    }

    const updatedData = {
      name: name.trim() || 'Student',
      college: college.trim() || 'College',
      course: '',
      year: computedYear,
      batch: computedYear,
      education_level: isPost ? 'postgraduate' : 'undergraduate',
      phone: phone.trim(),
      skills
    };

    onSaveProfile(updatedData);

    setSavedSnapshot({
      name: updatedData.name,
      college: updatedData.college,
      level,
      yearNum,
      phone: updatedData.phone,
      skills: [...skills]
    });

    setSavedSuccess(true);
    setShowCooldownNotice(false);
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
    }
    successTimerRef.current = setTimeout(() => {
      setSavedSuccess(false);
    }, 2400);
  };

  // Preview derivations
  const previewInitials = initialsOf(name.trim() || (user?.email ? user.email.split('@')[0] : 'Student'));
  const isPostgraduate = level === 'PG';
  const computedYear = `${level} ${yearNum} Year`;
  const standingText = `${computedYear} ${isPostgraduate ? '· MBA / PG' : '· Undergraduate'}`;
  const isPhoneMissing = !phone.trim();

  return (
    <div className="profile-screen-container">
      {/* 1. Header */}
      <header className="profile-header">
        <div className="profile-header-titles">
          <h1>Profile</h1>
          <p>Squad leads see this when you apply. Skills drive what gets recommended to you.</p>
        </div>
      </header>

      {/* 2. Main Grid: Left sticky rail + Right form */}
      <div className="profile-main-grid">
        {/* Left Rail (<aside>) */}
        <aside className="profile-left-rail">
          {/* Card A: Squad Lead Live Preview Card */}
          <div className="profile-preview-card">
            <div className="profile-preview-strip">
              <span className="profile-preview-strip-label">Squad Lead View</span>
              <span className="profile-preview-live-badge">
                <span className="profile-pulse-dot" />
                Live Preview
              </span>
            </div>

            <div className="profile-preview-body">
              {/* Identity block */}
              <div className="profile-preview-identity">
                <div className="profile-preview-avatar">
                  {previewInitials}
                </div>
                <div className="profile-preview-names">
                  <div className="profile-preview-fullname">
                    {name.trim() || 'Your Name'}
                  </div>
                  <div className="profile-preview-college-line">
                    {college.trim() || 'Select your college'}
                  </div>
                </div>
                <span className={`profile-preview-standing-pill ${isPostgraduate ? 'pg' : 'ug'}`}>
                  {standingText}
                </span>
              </div>

              {/* Highlighted Skills block */}
              <div className="profile-preview-skills-block">
                <div className="profile-preview-skills-heading">
                  Highlighted Skills ({skills.length})
                </div>
                {skills.length > 0 ? (
                  <div className="profile-preview-skills-list">
                    {skills.map((s) => (
                      <span key={s} className="profile-preview-skill-tag">
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="profile-preview-no-skills">
                    No skills selected yet
                  </span>
                )}
              </div>

              {/* WhatsApp missing notice: ONLY shown when phone is empty */}
              {isPhoneMissing && (
                <div className="profile-preview-whatsapp-alert">
                  <WhatsAppIcon size={16} className="profile-preview-whatsapp-icon" />
                  <div className="profile-preview-whatsapp-content">
                    <span className="profile-preview-whatsapp-title">
                      WhatsApp number missing
                    </span>
                    <span className="profile-preview-whatsapp-desc">
                      Add your WhatsApp number so squad leads can immediately message you.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Admin Portal Card (Strictly for aditya.25015@sscbs.du.ac.in, located above profile settings) */}
          {user && isAdminEmail(user.email) && (
            <div
              className="profile-account-card"
              style={{
                borderColor: 'rgba(220, 38, 38, 0.35)',
                background: 'linear-gradient(180deg, rgba(220, 38, 38, 0.04), var(--surface))',
                marginBottom: '16px'
              }}
            >
              <div className="profile-account-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '15px' }}>🛡️</span>
                  <span className="profile-account-title" style={{ color: '#DC2626', fontWeight: 800 }}>
                    System Admin
                  </span>
                </div>
                <span
                  style={{
                    background: '#DC2626',
                    color: '#FFFFFF',
                    borderRadius: '4px',
                    padding: '2px 7px',
                    fontSize: '9px',
                    fontWeight: 800,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}
                >
                  CONSOLE
                </span>
              </div>
              <div style={{ padding: '0 16px 14px', fontSize: '0.82rem', color: 'var(--ink-secondary)', lineHeight: 1.45 }}>
                Real-time user demographics, live student presence roster, and platform directory.
              </div>
              <div className="profile-account-actions" style={{ paddingTop: 0 }}>
                <button
                  type="button"
                  className="profile-account-action-btn"
                  onClick={() => onNavigate && onNavigate('admin')}
                  style={{
                    background: 'var(--primary)',
                    color: '#FFFFFF',
                    justifyContent: 'center',
                    fontWeight: 700,
                    borderRadius: '8px',
                    padding: '9px 14px'
                  }}
                >
                  <span>Open Admin Console →</span>
                </button>
              </div>
            </div>
          )}

          {/* Card B: Account Card */}
          <div className="profile-account-card">
            <div className="profile-account-header">
              <span className="profile-account-title">Account</span>
              <span className="profile-account-email" title={user.email}>
                Signed in as {user.email}
              </span>
            </div>
            <div className="profile-account-actions">
              <button
                type="button"
                className="profile-account-action-btn"
                onClick={() => setIsChangePasswordOpen(true)}
              >
                <LockIcon size={15} color="var(--ink-muted)" />
                <span>Change password</span>
              </button>
              <button
                type="button"
                className="profile-account-action-btn"
                onClick={handleTogglePush}
              >
                <BellIcon size={15} color={pushEnabled && pushPermission === 'granted' ? "#10B981" : "var(--ink-muted)"} />
                <span>{pushEnabled && pushPermission === 'granted' ? 'Desktop alerts: Active' : 'Enable desktop alerts'}</span>
              </button>
              <button
                type="button"
                className="profile-account-action-btn"
                onClick={onSignOut}
              >
                <LogOutIcon size={15} color="var(--ink-muted)" />
                <span>Sign out</span>
              </button>
              <div className="profile-account-divider" />
              <button
                type="button"
                className="profile-account-action-btn danger"
                onClick={() => setIsDeleteAccountOpen(true)}
              >
                <AlertCircleIcon size={15} color="currentColor" />
                <span>Delete account</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Right Column (<form>) */}
        <form onSubmit={handleSubmit} className="profile-form-column">
          {/* 24-Hour Cooldown Banner: only displayed when user attempts to update within 24 hours */}
          {showCooldownNotice && cooldown?.isLocked && (
            <div className="profile-cooldown-banner" role="alert">
              <div className="profile-cooldown-banner-left">
                <LockIcon size={18} className="profile-cooldown-icon" color="var(--urgency-yellow)" />
                <div className="profile-cooldown-content">
                  <strong>Profile edit locked:</strong> Details can only be updated once every 24 hours. Cooldown remaining:{' '}
                  <span className="profile-cooldown-timer">{cooldown.remainingFormatted}</span>
                </div>
              </div>
              <button
                type="button"
                className="profile-cooldown-close-btn"
                onClick={() => setShowCooldownNotice(false)}
                title="Dismiss notice"
                aria-label="Dismiss notice"
              >
                <CloseIcon size={15} />
              </button>
            </div>
          )}

          {/* Section 1: Personal & Campus Information */}
          <section className="profile-section-card">
            <div className="profile-section-header">
              <h2 className="profile-section-title">Personal &amp; Campus Information</h2>
              <p className="profile-section-subtitle">
                Your collegiate identity displayed on squad applications and team invitations.
              </p>
            </div>

            <div className="profile-fields-row">
              <div className="profile-field-group">
                <label className="profile-field-label" htmlFor="profile-full-name">Full Name</label>
                <input
                  id="profile-full-name"
                  type="text"
                  className="profile-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>

              <div className="profile-field-group">
                <label className="profile-field-label">College / University</label>
                <SearchableCollegeSelect
                  value={college}
                  onChange={(val) => setCollege(val)}
                  placeholder="Search college (e.g. SRCC, SSCBS, IIT)..."
                />
              </div>
            </div>

            <div className="profile-field-group profile-phone-group">
              <label className="profile-field-label" htmlFor="profile-phone-input">
                WhatsApp Number <span style={{ color: 'var(--primary)', fontWeight: 600 }}>*</span>
              </label>
              <input
                id="profile-phone-input"
                type="tel"
                className="profile-input profile-phone-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98••• ••210"
                required
              />
              <span className="profile-field-help">
                Compulsory for profile &amp; squad matching. Kept private; shared only once you are accepted into a squad or choose WhatsApp fast-track.
              </span>
            </div>
          </section>

          {/* Section 2: Academic Standing */}
          <section className="profile-section-card">
            <div className="profile-section-header">
              <h2 className="profile-section-title">Academic Standing</h2>
              <p className="profile-section-subtitle">
                Configures competition eligibility across all national case challenges, hackathons, and corporate summits.
              </p>
            </div>

            <div className="profile-academic-selects-grid">
              <div className="profile-field-group">
                <label className="profile-field-label" htmlFor="profile-level-select">UG or PG</label>
                <div className="profile-select-wrapper">
                  <select
                    id="profile-level-select"
                    className="profile-select"
                    value={level}
                    onChange={handleLevelChange}
                  >
                    <option value="UG">UG · Undergraduate</option>
                    <option value="PG">PG · Postgraduate</option>
                  </select>
                  <ChevronDownIcon size={16} className="profile-select-icon" color="var(--ink-muted)" />
                </div>
              </div>

              <div className="profile-field-group">
                <label className="profile-field-label" htmlFor="profile-year-select">Year</label>
                <div className="profile-select-wrapper">
                  <select
                    id="profile-year-select"
                    className="profile-select"
                    value={yearNum}
                    onChange={(e) => setYearNum(e.target.value)}
                  >
                    {YEARS[level].map((y) => (
                      <option key={y} value={y}>
                        {y} Year
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon size={16} className="profile-select-icon" color="var(--ink-muted)" />
                </div>
              </div>
            </div>

            <div className="profile-eligibility-note">
              {isPostgraduate ? (
                <span>You'll see MBA &amp; PG challenges plus all open competitions.</span>
              ) : (
                <span>You'll see undergrad-eligible competitions only. MBA/PG listings are hidden.</span>
              )}
            </div>
          </section>

          {/* Section 3: Skills & Capabilities */}
          <section className="profile-section-card">
            <div className="profile-skills-header-row">
              <div className="profile-section-header">
                <h2 className="profile-section-title">Skills &amp; Capabilities</h2>
                <p className="profile-section-subtitle">
                  Choose skills that match your experience. Squad leads filter and recruit based on these tags.
                </p>
              </div>
              <span className="profile-skills-count-badge">
                {skills.length} selected
              </span>
            </div>

            <div className="profile-skills-chips-wrapper">
              {SKILLS.map((skill) => {
                const isSelected = skills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`profile-skill-chip ${isSelected ? 'selected' : ''}`}
                    aria-pressed={isSelected}
                  >
                    {isSelected && (
                      <CheckIcon size={13} className="profile-skill-check" color="var(--primary)" />
                    )}
                    <span>{skill}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Section 4: Reminders & Notification Preferences */}
          <section className="profile-section-card">
            <div className="profile-section-header">
              <h2 className="profile-section-title">Reminders &amp; Notification Preferences</h2>
              <p className="profile-section-subtitle">
                Configure browser alerts and radar reminders for deadlines, round cutoffs, and squad activity.
              </p>
            </div>

            <div className="profile-notif-setting-box">
              <div className="profile-notif-setting-info">
                <div className="profile-notif-setting-title-row">
                  <span className="profile-notif-setting-title">Desktop Browser Notifications</span>
                  {pushPermission === 'granted' && (
                    <span className={`profile-notif-status-badge ${pushEnabled ? 'active' : 'disabled'}`}>
                      {pushEnabled ? 'Active' : 'Muted'}
                    </span>
                  )}
                </div>
                <p className="profile-notif-setting-desc">
                  Receive native OS alerts 1 hour before registration deadlines, 30 minutes before round cutoffs, and instantly when deadlines get extended.
                </p>
              </div>

              <div className="profile-notif-setting-control">
                {pushPermission === 'unsupported' ? (
                  <span className="profile-notif-note">Not supported in this browser</span>
                ) : pushPermission === 'denied' ? (
                  <span className="profile-notif-denied-note">
                    Blocked in browser settings. Please allow notifications in your site permissions.
                  </span>
                ) : pushPermission === 'granted' ? (
                  <div className="profile-notif-toggle-row">
                    <button
                      type="button"
                      className={`profile-notif-toggle-switch ${pushEnabled ? 'enabled' : ''}`}
                      onClick={handleTogglePush}
                      role="switch"
                      aria-checked={pushEnabled}
                      aria-label="Toggle desktop notifications"
                    >
                      <span className="profile-notif-toggle-knob" />
                    </button>
                    {pushEnabled && (
                      <button
                        type="button"
                        className="profile-notif-test-btn"
                        onClick={handleSendTestPush}
                        title="Send a sample desktop notification"
                      >
                        Send Test Alert
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    className="profile-notif-enable-btn"
                    onClick={handleRequestPush}
                  >
                    Enable Desktop Alerts
                  </button>
                )}
              </div>
            </div>

            {/* Monitored Radar Channels */}
            <div className="profile-notif-channels-grid">
              <div className="profile-notif-channel-item">
                <div className="profile-notif-channel-icon">⏱️</div>
                <div className="profile-notif-channel-text">
                  <strong>Registration Deadlines</strong>
                  <span>1 hour, 6 hours, and 24 hours prior</span>
                </div>
                <span className="profile-notif-channel-active">Monitored</span>
              </div>

              <div className="profile-notif-channel-item">
                <div className="profile-notif-channel-icon">🎯</div>
                <div className="profile-notif-channel-text">
                  <strong>Multi-Round Timelines</strong>
                  <span>Round start notices &amp; 30m cutoff alerts</span>
                </div>
                <span className="profile-notif-channel-active">Monitored</span>
              </div>

              <div className="profile-notif-channel-item">
                <div className="profile-notif-channel-icon">🎉</div>
                <div className="profile-notif-channel-text">
                  <strong>Deadline Extensions</strong>
                  <span>Automated diff detection for rescheduled dates</span>
                </div>
                <span className="profile-notif-channel-active">Monitored</span>
              </div>

              <div className="profile-notif-channel-item">
                <div className="profile-notif-channel-icon">💬</div>
                <div className="profile-notif-channel-text">
                  <strong>Squad Handshakes</strong>
                  <span>Incoming applicants &amp; WhatsApp connects</span>
                </div>
                <span className="profile-notif-channel-active">Monitored</span>
              </div>
            </div>
          </section>

          {/* Sticky Bottom Save / Unsaved Changes Bar */}
          {(isDirty || savedSuccess || (showCooldownNotice && cooldown?.isLocked)) && (
            <div className={`profile-sticky-save-bar ${showCooldownNotice && cooldown?.isLocked ? 'locked' : ''}`}>
              <div className="profile-sticky-bar-left">
                {savedSuccess ? (
                  <span className="profile-sticky-bar-saved">
                    <CheckIcon size={16} color="#4ADE80" />
                    <span>Profile saved successfully</span>
                  </span>
                ) : showCooldownNotice && cooldown?.isLocked ? (
                  <span className="profile-sticky-bar-locked">
                    <LockIcon size={15} color="#FBBF24" />
                    <span>Profile edit locked ({cooldown.remainingFormatted} remaining)</span>
                  </span>
                ) : (
                  <span className="profile-sticky-bar-dirty-text">
                    You have unsaved changes
                  </span>
                )}
              </div>

              {isDirty && (
                <div className="profile-sticky-bar-actions">
                  <button
                    type="button"
                    className="profile-sticky-discard-btn"
                    onClick={() => {
                      handleDiscard();
                      setShowCooldownNotice(false);
                    }}
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="profile-sticky-save-btn"
                    disabled={showCooldownNotice && cooldown?.isLocked}
                  >
                    {showCooldownNotice && cooldown?.isLocked ? 'Edit Locked' : 'Save changes'}
                  </button>
                </div>
              )}
            </div>
          )}
        </form>
      </div>

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <ChangePasswordModal
          onClose={() => setIsChangePasswordOpen(false)}
          onChangePassword={onChangePassword}
          flashToast={flashToast}
        />
      )}

      {/* Delete Account Modal */}
      {isDeleteAccountOpen && (
        <DeleteAccountModal
          user={user}
          onClose={() => setIsDeleteAccountOpen(false)}
          onDeleteAccount={onDeleteAccount}
          flashToast={flashToast}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Interactive Modals
// ─────────────────────────────────────────────────────────────────────────────

function ChangePasswordModal({ onClose, onChangePassword, flashToast }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      if (onChangePassword) {
        await onChangePassword(newPassword);
      }
      if (flashToast) {
        flashToast('Password updated successfully');
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div
        className="profile-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-pwd-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="profile-modal-header">
          <div>
            <h3 id="change-pwd-title" className="profile-modal-title">Change Password</h3>
            <p className="profile-modal-subtitle">Update your password to keep your OneStop account secure.</p>
          </div>
          <button
            type="button"
            className="profile-modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="profile-modal-form">
          {errorMsg && (
            <div className="profile-modal-error-box">
              <AlertCircleIcon size={15} color="var(--urgency-red)" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="profile-field-group">
            <label className="profile-field-label" htmlFor="new-password">New Password</label>
            <input
              id="new-password"
              type="password"
              required
              minLength={6}
              autoFocus
              className="profile-input"
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="profile-field-group">
            <label className="profile-field-label" htmlFor="confirm-password">Confirm New Password</label>
            <input
              id="confirm-password"
              type="password"
              required
              minLength={6}
              className="profile-input"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <div className="profile-modal-actions">
            <button
              type="button"
              className="profile-modal-ghost-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="profile-modal-primary-btn"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteAccountModal({ user, onClose, onDeleteAccount, flashToast }) {
  const [typedEmail, setTypedEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const targetEmail = user?.email || '';
  const isMatch = typedEmail.trim().toLowerCase() === targetEmail.toLowerCase();

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!isMatch) return;

    setLoading(true);
    setErrorMsg('');
    try {
      if (onDeleteAccount) {
        await onDeleteAccount();
      }
      if (flashToast) {
        flashToast('Your account has been deleted');
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete account. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div
        className="profile-modal-dialog danger"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-acc-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="profile-modal-header">
          <div>
            <h3 id="delete-acc-title" className="profile-modal-title danger">Delete Account</h3>
            <p className="profile-modal-subtitle">This action is permanent and cannot be undone.</p>
          </div>
          <button
            type="button"
            className="profile-modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        <form onSubmit={handleDelete} className="profile-modal-form">
          {errorMsg && (
            <div className="profile-modal-error-box">
              <AlertCircleIcon size={15} color="var(--urgency-red)" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="profile-modal-danger-callout">
            <p>
              Deleting your account will permanently remove your profile, created squad posts, applications, and saved bookmarks from OneStop across all devices.
            </p>
          </div>

          <div className="profile-field-group">
            <label className="profile-field-label" htmlFor="delete-confirm-email">
              To confirm, type your email <strong>{targetEmail}</strong>:
            </label>
            <input
              id="delete-confirm-email"
              type="email"
              autoFocus
              className="profile-input"
              placeholder={targetEmail}
              value={typedEmail}
              onChange={(e) => setTypedEmail(e.target.value)}
            />
          </div>

          <div className="profile-modal-actions">
            <button
              type="button"
              className="profile-modal-ghost-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="profile-modal-danger-btn"
              disabled={!isMatch || loading}
            >
              {loading ? 'Deleting...' : 'Permanently Delete Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProfileScreen(props) {
  if (!props.user) {
    return <ProfileAuthGate initialMode="signup" />;
  }
  return <ProfileScreenContent {...props} />;
}

