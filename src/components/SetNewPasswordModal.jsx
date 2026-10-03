// src/components/SetNewPasswordModal.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CloseIcon, CheckIcon, AlertCircleIcon } from './icons';
import OneStopLogo from './OneStopLogo';
import { trackEvent } from '../lib/posthog';
import './AuthModal.css';

export default function SetNewPasswordModal() {
  const { recoveryModalOpen, recoveryLinkError, closeRecoveryModal, changePassword, resetPassword, user } = useAuth();
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

  const handleSendNewLink = async () => {
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await resetPassword(user.email);
      setSuccessMsg(`New link sent to ${user.email}. Open the newest email and click its link.`);
    } catch (err) {
      setErrorMsg(err.message || 'Could not send a new link. Please try again in a minute.');
    } finally {
      setSubmitting(false);
    }
  };

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
        // Clean up recovery hash and params from URL if still present
        if (typeof window !== 'undefined' && (
          window.location.hash.includes('type=recovery') ||
          window.location.hash.includes('access_token') ||
          window.location.search.includes('type=recovery') ||
          window.location.search.includes('code=')
        )) {
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
    <div className="onestop-auth-backdrop" onClick={closeRecoveryModal}>
      <div
        className="onestop-auth-modal onestop-auth-modal-compact"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="recovery-modal-title"
      >
        <div className="onestop-auth-form-pane">
          <div className="onestop-auth-top-row">
            <OneStopLogo height={24} />
            <button
              type="button"
              className="onestop-auth-close-btn"
              onClick={closeRecoveryModal}
              aria-label="Close"
            >
              <CloseIcon size={16} />
            </button>
          </div>

          <div className="onestop-auth-headings">
            <h2 id="recovery-modal-title" className="onestop-auth-title">
              {recoveryLinkError ? 'Link expired' : 'Set a new password'}
            </h2>
            <p className="onestop-auth-subtitle">
              {recoveryLinkError
                ? `${recoveryLinkError} Links work once and only the newest email is valid.`
                : 'Choose a new password for your OneStop account.'}
            </p>
          </div>

          {errorMsg && (
            <div className="onestop-auth-alert onestop-auth-alert-error">
              <AlertCircleIcon size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="onestop-auth-alert onestop-auth-alert-success">
              <CheckIcon size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {recoveryLinkError ? (
            user?.email ? (
              <button
                type="button"
                className="onestop-auth-submit-btn"
                onClick={handleSendNewLink}
                disabled={submitting || Boolean(successMsg)}
              >
                {submitting ? 'Sending...' : 'Email me a new link'}
              </button>
            ) : (
              <p className="onestop-auth-terms">
                Open Sign in and use <strong>Forgot password?</strong> to get a new link.
              </p>
            )
          ) : (
            <form onSubmit={handleSubmit} className="onestop-auth-form">
              <div className="onestop-auth-field">
                <label htmlFor="recovery-new-password">New password</label>
                <input
                  id="recovery-new-password"
                  type="password"
                  className="onestop-auth-input"
                  placeholder="At least 6 characters"
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  autoFocus
                />
              </div>

              <div className="onestop-auth-field">
                <label htmlFor="recovery-confirm-password">Confirm new password</label>
                <input
                  id="recovery-confirm-password"
                  type="password"
                  className="onestop-auth-input"
                  placeholder="Re-enter new password"
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              <button
                type="submit"
                className="onestop-auth-submit-btn"
                disabled={submitting || Boolean(successMsg)}
              >
                {submitting ? 'Saving...' : 'Save new password'}
              </button>
            </form>
          )}

          {!recoveryLinkError && (
            <p className="onestop-auth-terms">
              Once saved, you can sign in with your email and this password on any device.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
