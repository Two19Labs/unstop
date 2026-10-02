// src/components/AuthModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { CloseIcon, CheckIcon, AlertCircleIcon } from './icons';
import OneStopLogo from './OneStopLogo';
import WhatIsOneStopTour from './WhatIsOneStopTour';
import { trackEvent } from '../lib/posthog';
import './AuthModal.css';

// Official Google "G" SVG Icon
function GoogleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
        fill="#4285F4"
      />
      <path
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.27v3.15C3.25 21.27 7.31 24 12 24z"
        fill="#34A853"
      />
      <path
        d="M5.28 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26V6.59H1.27C.46 8.21 0 10.05 0 12s.46 3.79 1.27 5.41l4.01-3.15z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.73 1.27 6.59l4.01 3.15c.95-2.84 3.6-4.99 6.72-4.99z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function AuthModal() {
  const {
    authModalOpen,
    authModalConfig,
    closeAuthModal,
    signInWithGoogle,
    signInWithPassword,
    signUpWithPassword,
    resetPassword,
    resendVerificationEmail
  } = useAuth();

  const [mode, setMode] = useState('signup'); // Default to 'signup' matching redesign
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [college, setCollege] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const timerRef = useRef(null);

  // Sync mode with modal config when opened
  useEffect(() => {
    if (authModalConfig?.initialTab) {
      setMode(authModalConfig.initialTab);
    } else {
      setMode('signup');
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    if (authModalOpen) {
      trackEvent('auth_modal_opened', {
        title: authModalConfig?.title || 'Create Account',
        initialTab: authModalConfig?.initialTab || 'signup'
      });
    }
  }, [authModalConfig, authModalOpen]);

  // Cooldown countdown for resending verification email
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Close on Escape key
  useEffect(() => {
    if (!authModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [authModalOpen, closeAuthModal]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!authModalOpen) return null;

  const handleResendVerification = async () => {
    if (!email || resendCooldown > 0 || resending) return;
    setResending(true);
    try {
      await resendVerificationEmail(email);
      setSuccessMsg(`Verification email resent to ${email}! Please check your inbox and spam folder.`);
      setErrorMsg(null);
      setResendCooldown(60);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to resend verification email.');
    } finally {
      setResending(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Google Auth Error:', err);
      let gMsg = err.message || 'Failed to initiate Google sign in.';
      if (gMsg.toLowerCase().includes('provider is not enabled') || gMsg.toLowerCase().includes('unsupported provider')) {
        gMsg = 'Google sign-in is currently being configured in Supabase. Please sign in or register with email and password below.';
      }
      setErrorMsg(gMsg);
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      if (mode === 'signin') {
        await signInWithPassword({ email, password });
        setSuccessMsg('Successfully signed in!');
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          closeAuthModal();
          if (authModalConfig?.postLoginAction) {
            authModalConfig.postLoginAction();
          }
        }, 500);
      } else if (mode === 'signup') {
        const cleanPhone = (phone || '').replace(/\D/g, '');
        if (cleanPhone.length < 10) {
          throw new Error('Please enter a valid 10-digit WhatsApp number to create your account.');
        }

        const res = await signUpWithPassword({
          email,
          password,
          fullName,
          college,
          phone
        });

        if (res?.user && res?.session) {
          setSuccessMsg('Account created successfully!');
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            closeAuthModal();
            if (authModalConfig?.postLoginAction) {
              authModalConfig.postLoginAction();
            }
          }, 500);
        } else {
          setSuccessMsg(`Verification link sent to ${email}! Please check your inbox to confirm your account.`);
        }
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setSuccessMsg('Password reset link sent to your email! (via Brevo SMTP)');
      }
    } catch (err) {
      console.error('Auth submit error:', err);
      let msg = err.message || 'Authentication failed. Please check your credentials.';
      if (msg.toLowerCase().includes('email not confirmed')) {
        msg = 'Your email is not confirmed yet. Please check your inbox (and spam folder) for the verification link.';
      } else if (msg.toLowerCase().includes('invalid login credentials')) {
        msg = 'Invalid email or password. Please try again or click "Forgot password?".';
      } else if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('rate_limit') || msg.toLowerCase().includes('over_email_send_rate_limit')) {
        msg = 'Email rate limit reached for signup verification. Please wait a few minutes or sign in with Google.';
      }
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="onestop-auth-backdrop" onClick={closeAuthModal}>
      <div
        className="onestop-auth-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        {/* Left Column: Product Tour Self-Playing */}
        <div className="onestop-auth-tour-pane">
          <WhatIsOneStopTour initialStep={6} />
        </div>

        {/* Right Column: Sign In / Create Account Form */}
        <div className="onestop-auth-form-pane">
          {/* Top Bar: Brand Logo & Close Button */}
          <div className="onestop-auth-top-row">
            <OneStopLogo height={24} />
            <button
              type="button"
              className="onestop-auth-close-btn"
              onClick={closeAuthModal}
              aria-label="Close modal"
              title="Close modal"
            >
              <CloseIcon size={16} />
            </button>
          </div>

          {/* Heading & Subtitle */}
          <div className="onestop-auth-headings">
            <h2 id="auth-modal-title" className="onestop-auth-title">
              {mode === 'forgot'
                ? 'Reset your password'
                : mode === 'signup'
                ? (authModalConfig?.title || 'Create your account')
                : (authModalConfig?.title
                    ? authModalConfig.title.replace(/^Sign Up to\s+/i, 'Sign in to ')
                    : 'Sign in to your account')}
            </h2>
            <p className="onestop-auth-subtitle">
              {mode === 'forgot'
                ? 'Enter your collegiate or personal email to receive a recovery link.'
                : (authModalConfig?.subtitle || 'Bookmark competitions, track every round, and find a squad.')}
            </p>
          </div>

          {/* Segmented Control (Sign in vs Create account) */}
          {mode !== 'forgot' && (
            <div className="onestop-auth-segmented">
              <button
                type="button"
                className={`onestop-auth-seg-btn ${mode === 'signin' ? 'active' : ''}`}
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
              >
                Sign in
              </button>
              <button
                type="button"
                className={`onestop-auth-seg-btn ${mode === 'signup' ? 'active' : ''}`}
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
              >
                Create account
              </button>
            </div>
          )}

          {/* 1-Click Google OAuth */}
          {mode !== 'forgot' && (
            <div>
              <button
                type="button"
                className="onestop-auth-google-btn"
                onClick={handleGoogleSignIn}
                disabled={submitting}
              >
                <GoogleIcon size={18} />
                <span>Continue with Google</span>
              </button>

              <div className="onestop-auth-divider">
                <span>or with email</span>
              </div>
            </div>
          )}

          {/* Error / Success Notifications */}
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

          {/* Resend verification button when email confirmation is pending or required */}
          {((errorMsg && errorMsg.toLowerCase().includes('not confirmed')) || (successMsg && successMsg.toLowerCase().includes('verification link'))) && email && (
            <div style={{ textAlign: 'center', marginTop: '-0.2rem', marginBottom: '0.6rem' }}>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resending || resendCooldown > 0}
                className="onestop-auth-forgot-link"
                style={{ fontSize: '0.8rem' }}
              >
                {resending ? 'Resending verification...' : resendCooldown > 0 ? `Resend email in ${resendCooldown}s` : 'Resend verification email'}
              </button>
            </div>
          )}

          {/* Email & Password Form */}
          <form onSubmit={handleSubmit} className="onestop-auth-form">
            {mode === 'signup' && (
              <>
                <div className="onestop-auth-field">
                  <label htmlFor="auth-fullname">Full name</label>
                  <input
                    id="auth-fullname"
                    type="text"
                    className="onestop-auth-input"
                    placeholder="e.g. Aditya Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="onestop-auth-grid-2">
                  <div className="onestop-auth-field">
                    <label htmlFor="auth-college">College</label>
                    <input
                      id="auth-college"
                      type="text"
                      className="onestop-auth-input"
                      placeholder="SRCC, IIT Delhi..."
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                    />
                  </div>

                  <div className="onestop-auth-field">
                    <label htmlFor="auth-phone">WhatsApp number</label>
                    <input
                      id="auth-phone"
                      type="tel"
                      className="onestop-auth-input"
                      placeholder="10-digit mobile"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div className="onestop-auth-field">
              <label htmlFor="auth-email">Email</label>
              <input
                id="auth-email"
                type="email"
                className="onestop-auth-input"
                placeholder="you@college.edu or gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {mode !== 'forgot' && (
              <div className="onestop-auth-field">
                <div className="onestop-auth-field-header">
                  <label htmlFor="auth-password">Password</label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      className="onestop-auth-forgot-link"
                      onClick={() => {
                        setMode('forgot');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                <div className="onestop-auth-password-wrap">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    className="onestop-auth-input"
                    placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="onestop-auth-show-btn"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="onestop-auth-submit-btn"
              disabled={submitting}
            >
              {submitting ? (
                'Processing...'
              ) : mode === 'signin' ? (
                'Sign in'
              ) : mode === 'signup' ? (
                'Create account'
              ) : (
                'Send reset link'
              )}
            </button>
          </form>

          {/* Footer note & back button */}
          {mode === 'forgot' ? (
            <button
              type="button"
              className="onestop-auth-back-btn"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
            >
              ← Back to Sign in
            </button>
          ) : (
            <p className="onestop-auth-terms">
              By continuing, you agree to Two19 Labs' platform terms. WhatsApp numbers are shared only with teammates you accept.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
