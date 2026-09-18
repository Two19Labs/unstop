// src/components/ProfileSettingsModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { YEAR_OPTIONS, normalizeYear } from '../data/colleges';
import SearchableCollegeSelect from './SearchableCollegeSelect';
import { CloseIcon, CheckIcon, AlertCircleIcon } from './icons';
import './ProfileSettingsModal.css';

export default function ProfileSettingsModal() {
  const {
    user,
    profile,
    profileModalOpen,
    closeProfileModal,
    updateProfile,
    resetPassword,
    getProfileCooldown,
  } = useAuth();

  const [fullName, setFullName] = useState('');
  const [college, setCollege] = useState('');
  const [year, setYear] = useState('UG 2nd Year');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');

  const [saving, setSaving] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const successTimerRef = useRef(null);

  // Live 24-Hour Profile Cooldown State
  const [cooldown, setCooldown] = useState(() => (getProfileCooldown ? getProfileCooldown(profile, user) : { isLocked: false }));
  const isLocked = Boolean(cooldown?.isLocked);

  useEffect(() => {
    if (!profileModalOpen || !getProfileCooldown) return;
    setCooldown(getProfileCooldown(profile, user));
    const interval = setInterval(() => {
      setCooldown(getProfileCooldown(profile, user));
    }, 1000);
    return () => clearInterval(interval);
  }, [profileModalOpen, profile, user, getProfileCooldown]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!profileModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeProfileModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [profileModalOpen, closeProfileModal]);

  const isInitializedRef = useRef(false);

  // Sync form inputs once when modal opens without wiping user typing
  useEffect(() => {
    if (profileModalOpen && !isInitializedRef.current) {
      setFullName(profile?.full_name || user?.user_metadata?.full_name || '');
      setCollege(profile?.college || user?.user_metadata?.college || '');
      setYear(normalizeYear(profile?.year || user?.user_metadata?.year));
      setPhone(profile?.phone || user?.user_metadata?.phone || '');
      setBio(profile?.bio || user?.user_metadata?.bio || '');
      setErrorMsg(null);
      setSuccessMsg(null);
      isInitializedRef.current = true;
    }
    if (!profileModalOpen) {
      isInitializedRef.current = false;
    }
  }, [profileModalOpen, profile, user]);

  if (!profileModalOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await updateProfile({
        fullName: fullName.trim(),
        college: college.trim(),
        course: '',
        year,
        phone: phone.trim(),
        bio: bio.trim(),
      });
      setSuccessMsg('Profile updated successfully!');
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => {
        setSuccessMsg(null);
        successTimerRef.current = null;
        closeProfileModal();
      }, 1200);
    } catch (err) {
      console.error('Error updating profile:', err);
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setResettingPassword(true);
    setErrorMsg(null);
    try {
      await resetPassword(user.email);
      setSuccessMsg(`Password reset link sent to ${user.email} (via Brevo SMTP). Check your inbox!`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send password reset email.');
    } finally {
      setResettingPassword(false);
    }
  };

  const getInitials = (name, email) => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return 'OS';
  };

  return (
    <div className="arena-profile-backdrop" onClick={closeProfileModal}>
      <div
        className="arena-profile-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
      >
        {/* Top Bar with Brand Pill & Close Button */}
        <div className="arena-profile-top-bar">
          <div className="arena-profile-brand-pill">
            <span className="arena-profile-t19">Two19 Labs</span>
            <span className="arena-profile-divider">/</span>
            <span className="arena-profile-badge">ACCOUNT SETTINGS</span>
          </div>

          <button
            className="arena-profile-close"
            onClick={closeProfileModal}
            aria-label="Close modal"
            type="button"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* User Identity Header Card */}
        <div className="arena-profile-header">
          <div className="arena-profile-avatar-row">
            <div className="arena-profile-avatar-large">
              {getInitials(fullName || profile?.full_name, user.email)}
            </div>
            <div className="arena-profile-id-info">
              <h2 id="profile-modal-title" className="arena-profile-title">
                {fullName || 'Competitor Profile'}
              </h2>
              <div className="arena-profile-email-badge">
                <span>{user.email}</span>
                <span className="arena-profile-status-dot" title="Authenticated"></span>
              </div>
            </div>
          </div>
        </div>

        {/* Error / Success Notifications */}
        {errorMsg && (
          <div className="arena-profile-alert arena-profile-alert-error">
            <AlertCircleIcon size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="arena-profile-alert arena-profile-alert-success">
            <CheckIcon size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 24-Hour Cooldown Banner */}
        {isLocked && (
          <div className="arena-profile-cooldown-banner">
            <div className="arena-profile-cooldown-top">
              <span className="arena-profile-lock-icon">🔒</span>
              <div className="arena-profile-cooldown-text">
                <span className="arena-profile-cooldown-title">Profile Editing Locked (24-Hour Policy)</span>
                <p className="arena-profile-cooldown-desc">
                  To prevent fraudulent college impersonation and maintain fair competition, profile details can only be changed once every 24 hours.
                </p>
              </div>
            </div>
            <div className="arena-profile-cooldown-timer-box">
              <span className="arena-profile-timer-label">Next profile update available in:</span>
              <span className="arena-profile-timer-val">{cooldown.remainingFormatted}</span>
            </div>
          </div>
        )}

        {/* Profile Edit Form */}
        <form onSubmit={handleSubmit} className={`arena-profile-form ${isLocked ? 'is-locked' : ''}`}>
          <div className="arena-profile-field">
            <label htmlFor="prof-fullname">Full Name</label>
            <input
              id="prof-fullname"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Aditya Singhani"
              required
              disabled={isLocked || saving}
            />
          </div>

          <div className="arena-profile-field">
            <label htmlFor="prof-college">College / University</label>
            <SearchableCollegeSelect
              id="prof-college"
              value={college}
              onChange={setCollege}
              placeholder="Search your college or university (e.g. SSCBS, SRCC, IIT Delhi)..."
              required
              disabled={isLocked || saving}
            />
          </div>

          <div className="arena-profile-row">
            <div className="arena-profile-field">
              <label htmlFor="prof-year">Current Standing / Year</label>
              <select
                id="prof-year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                disabled={isLocked || saving}
              >
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="arena-profile-field">
              <label htmlFor="prof-phone">WhatsApp Mobile</label>
              <input
                id="prof-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit phone"
                disabled={isLocked || saving}
              />
              <span className="arena-profile-help">Used for teammate coordination once accepted</span>
            </div>
          </div>

          <div className="arena-profile-field">
            <label htmlFor="prof-bio">Short Bio / Domain Focus</label>
            <textarea
              id="prof-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Finance and strategy enthusiast specializing in DCF valuation, pitch decks, and case competitions."
              rows={3}
              disabled={isLocked || saving}
            />
          </div>

          {!isLocked && (
            <div className="arena-profile-policy-note">
              🛡️ <strong>Integrity Policy:</strong> Saving changes will lock your profile details for <strong>24 hours</strong> to prevent collegiate impersonation.
            </div>
          )}

          <div className="arena-profile-btn-row">
            <button
              type="button"
              className="arena-profile-cancel-btn"
              onClick={closeProfileModal}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`arena-profile-save-btn ${isLocked ? 'btn-locked' : ''}`}
              disabled={isLocked || saving}
            >
              {isLocked
                ? `Locked (${cooldown.hours}h ${cooldown.minutes}m left)`
                : saving
                ? 'Saving changes...'
                : 'Save Profile Changes'}
            </button>
          </div>
        </form>

        {/* Security & Password Section */}
        <div className="arena-profile-security-section">
          <div className="arena-profile-security-header">
            <h4>Security &amp; Password</h4>
            <p>Update your authentication password via secure email link.</p>
          </div>
          <button
            type="button"
            className="arena-profile-reset-btn"
            onClick={handlePasswordReset}
            disabled={resettingPassword}
          >
            {resettingPassword ? 'Sending link...' : 'Send Password Reset Email'}
          </button>
        </div>
      </div>
    </div>
  );
}
