// src/components/WhatsAppNumberPrompt.jsx
// Every account needs a WhatsApp number (strictly 10 digits). Shown right after
// login to anyone without a valid one (e.g. Google sign-ups); it can't be dismissed.
import React, { useState } from 'react';
import { useAuth, cleanPhoneInput, phoneValidationError } from '../context/AuthContext';
import { AlertCircleIcon } from './icons';
import OneStopLogo from './OneStopLogo';
import './AuthModal.css';

export default function WhatsAppNumberPrompt() {
  const { needsWhatsAppNumber, saveWhatsAppNumber, recoveryModalOpen, signOut } = useAuth();
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!needsWhatsAppNumber || recoveryModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = phoneValidationError(phone);
    if (err) {
      setErrorMsg(err);
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await saveWhatsAppNumber(phone);
    } catch (saveErr) {
      setErrorMsg(saveErr.message || 'Could not save your number. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="onestop-auth-backdrop">
      <div
        className="onestop-auth-modal onestop-auth-modal-compact"
        role="dialog"
        aria-modal="true"
        aria-labelledby="whatsapp-prompt-title"
      >
        <div className="onestop-auth-form-pane">
          <div className="onestop-auth-top-row">
            <OneStopLogo height={24} />
          </div>

          <div className="onestop-auth-headings">
            <h2 id="whatsapp-prompt-title" className="onestop-auth-title">
              Add your WhatsApp number
            </h2>
            <p className="onestop-auth-subtitle">
              Every OneStop account needs one. It's only shown to a squad host when you
              request to join their WhatsApp squad, or to people contacting you when you host
              one on WhatsApp.
            </p>
          </div>

          {errorMsg && (
            <div className="onestop-auth-alert onestop-auth-alert-error">
              <AlertCircleIcon size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="onestop-auth-form">
            <div className="onestop-auth-field">
              <label htmlFor="whatsapp-prompt-phone">WhatsApp number</label>
              <input
                id="whatsapp-prompt-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                className="onestop-auth-input"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => {
                  setPhone(cleanPhoneInput(e.target.value));
                  setErrorMsg(null);
                }}
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="onestop-auth-submit-btn"
              disabled={submitting || phone.length !== 10}
            >
              {submitting ? 'Saving...' : 'Save number'}
            </button>
          </form>

          <p className="onestop-auth-terms">
            10-digit number, no country code.{' '}
            <button
              type="button"
              onClick={signOut}
              style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', textDecoration: 'underline', cursor: 'pointer', font: 'inherit' }}
            >
              Sign out
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
