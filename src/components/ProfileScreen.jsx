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
  BellIcon,
  MailIcon,
  EyeIcon,
  EyeOffIcon
} from './icons';
import {
  getPushPermission,
  isPushEnabled,
  setPushEnabled,
  requestPushPermission
} from '../lib/browserPushService';
import { getProfileCooldown, isProfileCooldownError } from '../context/AuthContext';
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

  const simpleMatch = candidate.match(/^(\d+(?:st|nd|rd|th))\s+Year$/i);
  if (simpleMatch) {
    const yr = simpleMatch[1];
    const isPost = (profile?.education_level || '').toLowerCase().includes('post');
    const lvl = isPost ? 'PG' : 'UG';
    if (YEARS[lvl]?.includes(yr)) {
      return { level: lvl, yearNum: yr };
    }
  }

  if (!candidate) {
    return { level: '', yearNum: '' };
  }

  const isPost = (profile?.education_level || '').toLowerCase().includes('post') || candidate.startsWith('PG');
  if (isPost) {
    return { level: 'PG', yearNum: '' };
  }
  return { level: 'UG', yearNum: '' };
}

function ProfileScreenContent({
  profile,
  onSaveProfile,
  user,
  onOpenAuthModal,
  onSignOut,
  onChangePassword,
  onDeleteAccount,
  onResetPassword,
  flashToast,
  onNavigate,
  onOpenWalkthrough,
  isFromWalkthrough = false
}) {
  // 1. Initial snapshot resolution
  const initialAcademic = useMemo(() => parseAcademicStanding(profile), [profile]);

  const [name, setName] = useState(profile?.name || '');
  const [college, setCollege] = useState(profile?.college || '');
  const [course, setCourse] = useState(profile?.course || '');
  const [level, setLevel] = useState(initialAcademic.level || '');
  const [yearNum, setYearNum] = useState(initialAcademic.yearNum || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [skills, setSkills] = useState(Array.isArray(profile?.skills) ? profile.skills : []);


  // Snapshot of last saved values to determine dirty state and allow Discard
  const [savedSnapshot, setSavedSnapshot] = useState({
    name: profile?.name || '',
    college: profile?.college || '',
    course: profile?.course || '',
    level: initialAcademic.level || '',
    yearNum: initialAcademic.yearNum || '',
    phone: profile?.phone || '',
    skills: Array.isArray(profile?.skills) ? profile.skills : []
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const successTimerRef = useRef(null);

  // 24-Hour Cooldown State: Only displayed when the user attempts to save changes within 24 hours
  const [cooldown, setCooldown] = useState(null);
  const [showCooldownNotice, setShowCooldownNotice] = useState(false);
  const cooldownIntervalRef = useRef(null);
  // Server-reported last edit time (e.g. another tab/device saved first); wins until it expires
  const [serverLockedAt, setServerLockedAt] = useState(null);
  const currentCooldownSource = serverLockedAt ? { profile_last_updated_at: serverLockedAt } : profile;

  // Modals for Account features
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);

  // Desktop Push Notifications State
  const [pushPermission, setPushPermission] = useState(getPushPermission);
  const [pushEnabled, setPushEnabledState] = useState(isPushEnabled);

  useEffect(() => {
    const handlePushSync = () => {
      setPushPermission(getPushPermission());
      setPushEnabledState(isPushEnabled());
    };
    window.addEventListener('onestop:push-enabled-changed', handlePushSync);
    window.addEventListener('storage', handlePushSync);
    return () => {
      window.removeEventListener('onestop:push-enabled-changed', handlePushSync);
      window.removeEventListener('storage', handlePushSync);
    };
  }, []);

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

  // Sync state if profile prop changes externally (e.g. initial cloud sync load)
  useEffect(() => {
    if (profile) {
      const parsed = parseAcademicStanding(profile);
      const nextSaved = {
        name: profile.name || '',
        college: profile.college || '',
        course: profile.course || '',
        level: parsed.level || '',
        yearNum: parsed.yearNum || '',
        phone: profile.phone || '',
        skills: Array.isArray(profile.skills) ? profile.skills : []
      };
      setName(nextSaved.name);
      setCollege(nextSaved.college);
      setCourse(nextSaved.course);
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
        const cd = getProfileCooldown(currentCooldownSource, user);
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
  }, [showCooldownNotice, profile, serverLockedAt, user]);

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
    if (course !== savedSnapshot.course) return true;
    if (level !== savedSnapshot.level) return true;
    if (yearNum !== savedSnapshot.yearNum) return true;
    if (phone !== savedSnapshot.phone) return true;
    const currentSkillsStr = [...skills].sort().join('|');
    const savedSkillsStr = [...savedSnapshot.skills].sort().join('|');
    return currentSkillsStr !== savedSkillsStr;
  }, [name, college, course, level, yearNum, phone, skills, savedSnapshot]);

  // Level switch: validate yearNum against valid options for new level
  const handleLevelChange = (valOrEvent) => {
    const newLevel = typeof valOrEvent === 'string' ? valOrEvent : valOrEvent?.target?.value;
    if (!newLevel || !YEARS[newLevel]) return;
    setLevel(newLevel);
    if (yearNum && !YEARS[newLevel].includes(yearNum)) {
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
    setCourse(savedSnapshot.course);
    setLevel(savedSnapshot.level);
    setYearNum(savedSnapshot.yearNum);
    setPhone(savedSnapshot.phone);
    setSkills(savedSnapshot.skills);
    setShowCooldownNotice(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 24-hour edit cooldown check: only displayed when someone attempts to update within 24 hours
    const currentCooldown = getProfileCooldown(currentCooldownSource, user);
    if (currentCooldown.isLocked) {
      setCooldown(currentCooldown);
      setShowCooldownNotice(true);
      if (flashToast) {
        flashToast(`Profile edit locked (${currentCooldown.remainingFormatted} remaining)`);
      }
      return;
    }

    const isPost = level === 'PG';
    const computedYear = level && yearNum ? `${level} ${yearNum} Year` : (yearNum ? `${yearNum} Year` : '');

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      if (flashToast) {
        flashToast('Please enter a valid 10-digit WhatsApp number.');
      }
      return;
    }

    const updatedData = {
      name: name.trim() || 'Student',
      college: college.trim() || '',
      course: course.trim(),
      year: computedYear,
      batch: computedYear,
      education_level: isPost ? 'postgraduate' : (level === 'UG' ? 'undergraduate' : ''),
      phone: phone.trim(),
      skills
    };

    try {
      if (onSaveProfile) {
        await onSaveProfile(updatedData);
      }

      setSavedSnapshot({
        name: updatedData.name,
        college: updatedData.college,
        course: updatedData.course,
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
    } catch (err) {
      console.warn('Profile save rejected:', err.message);
      if (isProfileCooldownError(err) && err.lastUpdatedAt) {
        setServerLockedAt(err.lastUpdatedAt);
      }
      const cd = getProfileCooldown(err.lastUpdatedAt ? { profile_last_updated_at: err.lastUpdatedAt } : profile, user);
      if (cd.isLocked) {
        setCooldown(cd);
        setShowCooldownNotice(true);
      }
    }
  };

  // Preview derivations
  const previewInitials = initialsOf(name.trim() || (user?.email ? user.email.split('@')[0] : 'Student'));
  const isPostgraduate = level === 'PG';
  const computedYear = level && yearNum ? `${level} ${yearNum} Year` : (yearNum ? `${yearNum} Year` : '');
  const standingText = computedYear ? `${computedYear} ${isPostgraduate ? '· MBA / PG' : '· Undergraduate'}` : '';
  const isPhoneMissing = !phone.trim();

  return (
    <div className="profile-screen-container">
      {/* 1. Header */}
      <header className="profile-header">
        <div className="profile-header-titles">
          <h1>Profile</h1>
          <p>visible to squad leads · powers catered recommendations</p>
        </div>
        {typeof onOpenWalkthrough === 'function' && (
          <button
            type="button"
            className="profile-tour-action-btn"
            onClick={onOpenWalkthrough}
            title="What is OneStop?"
          >
            <span>What is OneStop?</span>
          </button>
        )}
      </header>


      {/* 2. Main Grid: Left sticky rail + Right form */}
      <div className="profile-main-grid">
        {/* Left Rail (<aside>) */}
        <aside className="profile-left-rail">
          {/* Card A: Squad Lead Live Preview Card */}
          <div className="profile-preview-card">
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
                {standingText && (
                  <span className={`profile-preview-standing-pill ${isPostgraduate ? 'pg' : 'ug'}`}>
                    {standingText}
                  </span>
                )}
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
                your student identity across applications and invites
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

            <div className="profile-fields-row">
              <div className="profile-field-group">
                <label className="profile-field-label" htmlFor="profile-course-input">Course</label>
                <input
                  id="profile-course-input"
                  type="text"
                  className="profile-input"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="e.g. B.Com (Hons), BMS, B.Tech CSE"
                  maxLength={80}
                />
              </div>
            </div>

            <div className="profile-fields-row">
              <div className="profile-field-group">
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
                  shared with your squad only if you opt-in
                </span>
              </div>

              <div className="profile-field-group">
                <div className="profile-academic-compact-labels">
                  <label className="profile-field-label">UG / PG</label>
                  <label className="profile-field-label" htmlFor="profile-year-select">Year</label>
                </div>
                <div className="profile-academic-compact-controls">
                  <div className="profile-seg-toggle" role="radiogroup" aria-label="Education level">
                    <button
                      type="button"
                      className={`profile-seg-btn ${level === 'UG' ? 'active' : ''}`}
                      onClick={() => handleLevelChange('UG')}
                      aria-checked={level === 'UG'}
                      role="radio"
                    >
                      UG
                    </button>
                    <button
                      type="button"
                      className={`profile-seg-btn ${level === 'PG' ? 'active' : ''}`}
                      onClick={() => handleLevelChange('PG')}
                      aria-checked={level === 'PG'}
                      role="radio"
                    >
                      PG
                    </button>
                  </div>

                  <div className="profile-select-wrapper">
                    <select
                      id="profile-year-select"
                      className="profile-select profile-select-compact"
                      value={yearNum}
                      onChange={(e) => {
                        const val = e.target.value;
                        setYearNum(val);
                        if (val && !level) {
                          setLevel('UG');
                        }
                      }}
                    >
                      <option value="">
                        Select Year
                      </option>
                      {(YEARS[level] || YEARS.UG).map((y) => (
                        <option key={y} value={y}>
                          {y} Year
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon size={15} className="profile-select-icon" color="var(--ink-muted)" />
                  </div>
                </div>
                <span className="profile-field-help">
                  {level === 'PG' ? (
                    <span>shows mba, pg, and open challenges</span>
                  ) : level === 'UG' ? (
                    <span>shows undergrad tracks only · mba challenges hidden</span>
                  ) : (
                    <span>select degree level and year to personalize competition feed</span>
                  )}
                </span>
              </div>
            </div>
          </section>

          {/* Section 3: Skills & Capabilities */}
          <section className="profile-section-card">
            <div className="profile-skills-header-row">
              <div className="profile-section-header">
                <h2 className="profile-section-title">Skills &amp; Capabilities</h2>
                <p className="profile-section-subtitle">
                  used by squad leads to filter and recruit teammates
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
          user={user}
          onClose={() => setIsChangePasswordOpen(false)}
          onResetPassword={onResetPassword}
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

function ChangePasswordModal({ user, onClose, onResetPassword, flashToast }) {
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successEmail, setSuccessEmail] = useState(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const targetEmail = (email || '').trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (user?.email && targetEmail !== user.email.toLowerCase()) {
      setErrorMsg(`Please enter your registered OneStop account email (${user.email}).`);
      return;
    }

    setLoading(true);
    try {
      if (onResetPassword) {
        await onResetPassword(targetEmail);
      }
      setSuccessEmail(targetEmail);
      setCooldown(60);
      if (flashToast) {
        flashToast('Confirmation email sent! Check your inbox.');
      }
    } catch (err) {
      console.error('Password reset request error:', err);
      let msg = err.message || 'Failed to send confirmation email. Please try again.';
      if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('over_email_send_rate_limit')) {
        msg = 'Email rate limit reached. Please wait a few minutes before trying again.';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || loading || !successEmail) return;
    setLoading(true);
    setErrorMsg('');
    try {
      if (onResetPassword) {
        await onResetPassword(successEmail);
      }
      setCooldown(60);
      if (flashToast) {
        flashToast('Reset link resent to ' + successEmail);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to resend confirmation email.');
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
            <p className="profile-modal-subtitle">
              Verify your email to securely set a new password for your account.
            </p>
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

        {successEmail ? (
          <div className="profile-modal-form">
            <div className="profile-modal-success-box">
              <div className="profile-modal-success-icon-wrap">
                <CheckIcon size={20} color="#10B981" />
              </div>
              <div className="profile-modal-success-content">
                <strong>Confirmation email sent!</strong>
                <p>
                  We have sent a secure password reset link to <strong>{successEmail}</strong> via Supabase.
                </p>
                <p className="profile-modal-hint-text">
                  Please click the link in that email. Once you click it, you will be redirected here to set your new password.
                </p>
              </div>
            </div>

            <div className="profile-modal-resend-row">
              <span className="profile-modal-resend-label">Didn't receive the email?</span>
              <button
                type="button"
                className="profile-modal-link-btn"
                onClick={handleResend}
                disabled={cooldown > 0 || loading}
              >
                {loading ? 'Resending...' : cooldown > 0 ? `Resend email in ${cooldown}s` : 'Resend confirmation email'}
              </button>
            </div>

            <div className="profile-modal-actions">
              <button
                type="button"
                className="profile-modal-primary-btn"
                onClick={onClose}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="profile-modal-form">
            {errorMsg && (
              <div className="profile-modal-error-box">
                <AlertCircleIcon size={15} color="var(--urgency-red)" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="profile-modal-info-box">
              <MailIcon size={16} color="var(--primary)" />
              <span>
                To change your password, enter your account email below. We'll send you a confirmation email with a link to choose a new password.
              </span>
            </div>

            <div className="profile-field-group">
              <label className="profile-field-label" htmlFor="change-password-email">
                Account Email Address
              </label>
              <input
                id="change-password-email"
                type="email"
                required
                autoFocus
                className="profile-input"
                placeholder="you@college.edu or gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                disabled={loading || !email.trim()}
              >
                {loading ? 'Sending link...' : 'Send Confirmation Email'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function DeleteAccountModal({ user, onClose, onDeleteAccount, flashToast }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const targetEmail = user?.email || '';

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setErrorMsg('Please enter your current password (min 6 characters).');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      if (onDeleteAccount) {
        await onDeleteAccount(password);
      }
      if (flashToast) {
        flashToast('Your account has been deleted');
      }
      onClose();
    } catch (err) {
      console.error('Account deletion error:', err);
      let msg = err.message || 'Failed to delete account. Please verify your password.';
      if (
        msg.toLowerCase().includes('invalid login credentials') ||
        msg.toLowerCase().includes('invalid credentials') ||
        msg.toLowerCase().includes('incorrect password')
      ) {
        msg = 'Incorrect password. Please enter your valid current password to confirm account deletion.';
      }
      setErrorMsg(msg);
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

          <div className="profile-modal-account-pill">
            <span className="profile-modal-account-label">Deleting account:</span>
            <strong className="profile-modal-account-value">{targetEmail}</strong>
          </div>

          <div className="profile-field-group">
            <label className="profile-field-label" htmlFor="delete-confirm-password">
              Current Password <span style={{ color: 'var(--urgency-red)' }}>*</span>
            </label>
            <div className="profile-password-input-wrap">
              <input
                id="delete-confirm-password"
                type={showPassword ? 'text' : 'password'}
                autoFocus
                required
                minLength={6}
                className="profile-input profile-password-input"
                placeholder="Enter your current password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="profile-password-toggle-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
              </button>
            </div>
            <span className="profile-field-help">
              You must enter your current password to authorize permanent deletion.
            </span>
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
              disabled={!password || password.length < 6 || loading}
            >
              {loading ? 'Verifying & deleting...' : 'Permanently Delete Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProfileScreen(props) {
  if (!props.user) {
    return <ProfileAuthGate initialMode="signup" isFromWalkthrough={props.isFromWalkthrough} />;
  }
  return <ProfileScreenContent {...props} />;
}


