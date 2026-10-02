// src/components/SetNewPasswordModal.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CloseIcon, CheckIcon, AlertCircleIcon, LockIcon } from './icons';
import OneStopLogo from './OneStopLogo';
import { trackEvent } from '../lib/posthog';
import './AuthModal.css';

export default function SetNewPasswordModal() {
  const { recoveryModalOpen, closeRecoveryModal, changePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (recoveryModalOpen) {
      trackEvent('auth_password_recovery_modal_opened');
      setErrorMsg(null);
      setSuccessMsg(null);
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [recoveryModalOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!recoveryModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeRecoveryModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recoveryModalOpen, closeRecoveryModal]);

  if (!recoveryModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(newPassword);
      setSuccessMsg('Your password has been successfully updated! Welcome back.');
      trackEvent('auth_password_recovery_success');
      setTimeout(() => {
        closeRecoveryModal();
        // Clean up recovery hash from URL if still present
        if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }, 1500);
    } catch (err) {
      console.error('Password recovery error:', err);
      setErrorMsg(err.message || 'Failed to update password. The reset link may have expired.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="arena-auth-backdrop" onClick={closeRecoveryModal}>
      <div
        className="arena-auth-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="recovery-modal-title"
      >
        {/* Top Bar with Brand Pill & Close Button */}
        <div className="arena-auth-top-bar">
          <div className="arena-auth-brand-pill">
            <span className="arena-auth-t19">Two19 Labs</span>
            <span className="arena-auth-divider">/</span>
            <span className="arena-auth-badge">PASSWORD RECOVERY</span>
          </div>

          <button
            className="arena-auth-close"
            onClick={closeRecoveryModal}
            aria-label="Close modal"
            type="button"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Brand Header */}
        <div className="arena-auth-header">
          <div className="arena-auth-logo-wrap">
            <OneStopLogo height={28} />
          </div>
          <h2 id="recovery-modal-title" className="arena-auth-title">
            Set New Password
          </h2>
          <p className="arena-auth-subtitle">
            Enter your new password below to secure your OneStop account.
          </p>
        </div>

        {/* Error / Success Notifications */}
        {errorMsg && (
          <div className="arena-auth-alert arena-auth-alert-error">
            <AlertCircleIcon size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="arena-auth-alert arena-auth-alert-success">
            <CheckIcon size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="arena-auth-form">
          <div className="arena-auth-field">
            <label htmlFor="recovery-new-password">New Password</label>
            <input
              id="recovery-new-password"
              type="password"
              placeholder="Min 6 characters"
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="arena-auth-field">
            <label htmlFor="recovery-confirm-password">Confirm New Password</label>
            <input
              id="recovery-confirm-password"
              type="password"
              placeholder="Re-enter new password"
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="arena-auth-submit-btn"
            disabled={submitting}
          >
            {submitting ? (
              <span className="arena-auth-spinner">Updating Password...</span>
            ) : (
              'Save New Password'
            )}
          </button>
        </form>

        <div className="arena-auth-footer">
          <p className="arena-auth-terms">
            Your password is encrypted with end-to-end security. Once saved, you can log in with your email on any device.
          </p>
        </div>
      </div>
    </div>
  );
}
