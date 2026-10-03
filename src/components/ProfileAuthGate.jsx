// src/components/ProfileAuthGate.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckIcon, AlertCircleIcon } from './icons';
import OneStopLogo from './OneStopLogo';
import WhatIsOneStopTour from './WhatIsOneStopTour';
import GoogleSignInButton from './GoogleSignInButton';
import SearchableCollegeSelect from './SearchableCollegeSelect';
import { trackEvent } from '../lib/posthog';
import './ProfileAuthGate.css';
import './AuthModal.css';


export default function ProfileAuthGate({ initialMode = 'signup' }) {
  const {
    signInWithGoogle,
    signInWithGoogleIdToken,
    signInWithPassword,
    signUpWithPassword,
    resetPassword,
    resendVerificationEmail
  } = useAuth();

  const [mode, setMode] = useState(initialMode); // 'signup' | 'signin' | 'forgot'
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

  // Cooldown countdown for resending verification email
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

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

  useEffect(() => {
    trackEvent('profile_auth_gate_viewed', { initialMode: mode });
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

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

  const handleGoogleCredential = async (idToken, nonce) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);
    try {
      // On success the user is signed in and this gate unmounts on its own.
      await signInWithGoogleIdToken(idToken, nonce);
    } catch (err) {
      console.error('Google Auth Error:', err);
      setErrorMsg(err.message || 'Google sign in failed. Please try again.');
    } finally {
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
        setSuccessMsg('Successfully signed in! Loading your profile...');
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
          setSuccessMsg('Account created successfully! Loading your profile...');
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
    <div className="profile-auth-gate-container">
      <div className="profile-auth-gate-card">
        {/* Left Column: Product Tour Self-Playing */}
        <div className="profile-auth-tour-pane">
          <WhatIsOneStopTour />
        </div>

        {/* Right Column: Sign In / Create Account Form */}
        <div className="profile-auth-form-pane">
          <div className="onestop-auth-top-row">
            <OneStopLogo height={24} />
          </div>

          <div className="onestop-auth-headings">
            <h2 className="onestop-auth-title">
              {mode === 'forgot'
                ? 'Reset your password'
                : mode === 'signup'
                ? 'Create your account'
                : 'Sign in to your account'}
            </h2>
            <p className="onestop-auth-subtitle">
              {mode === 'forgot'
                ? 'Enter your collegiate or personal email to receive a recovery link.'
                : 'Bookmark competitions, track every round, and find a squad.'}
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
              <GoogleSignInButton
                onCredential={handleGoogleCredential}
                onRedirectSignIn={handleGoogleSignIn}
                disabled={submitting}
              />

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

          {/* Resend verification button */}
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="onestop-auth-form">
            {mode === 'signup' && (
              <>
                <div className="onestop-auth-field">
                  <label htmlFor="gate-fullname">Full name</label>
                  <input
                    id="gate-fullname"
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
                    <label htmlFor="gate-college">College</label>
                    <SearchableCollegeSelect
                      id="gate-college"
                      value={college}
                      onChange={setCollege}
                      placeholder="Search SRCC, IIT Delhi..."
                    />
                  </div>

                  <div className="onestop-auth-field">
                    <label htmlFor="gate-phone">WhatsApp number</label>
                    <input
                      id="gate-phone"
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
              <label htmlFor="gate-email">Email</label>
              <input
                id="gate-email"
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
                  <label htmlFor="gate-password">Password</label>
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
                    id="gate-password"
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
              By continuing, you agree to our{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer">Terms</a> and{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>. WhatsApp numbers are shared only with teammates you accept.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
