// src/components/ProfileAuthGate.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckIcon, AlertCircleIcon } from './icons';
import SearchableCollegeSelect from './SearchableCollegeSelect';
import OneStopLogo from './OneStopLogo';
import { trackEvent } from '../lib/posthog';
import './ProfileAuthGate.css';

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

export default function ProfileAuthGate({ initialMode = 'signup' }) {
  const {
    signInWithGoogle,
    signInWithPassword,
    signUpWithPassword,
    resetPassword
  } = useAuth();

  const [mode, setMode] = useState(initialMode); // 'signup' | 'signin' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [college, setCollege] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const timerRef = useRef(null);

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
      setErrorMsg(err.message || 'Failed to initiate Google sign in.');
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
        const res = await signUpWithPassword({
          email,
          password,
          fullName,
          college,
          phone,
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
      }
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="profile-auth-gate-container">
      <div className="profile-auth-gate-card">
        {/* Top Brand Pill */}
        <div className="profile-auth-top-bar">
          <div className="profile-auth-brand-pill">
            <span className="profile-auth-t19">Two19 Labs</span>
            <span className="profile-auth-divider">/</span>
            <span className="profile-auth-badge">ONESTOP AUTH</span>
          </div>
        </div>

        {/* Brand Header */}
        <div className="profile-auth-header">
          <div className="profile-auth-logo-wrap">
            <OneStopLogo height={26} />
          </div>
          <h1 className="profile-auth-title">
            {mode === 'forgot'
              ? 'Reset Password'
              : mode === 'signup'
              ? 'Create Your OneStop Profile'
              : 'Sign In to OneStop'}
          </h1>
          <p className="profile-auth-subtitle">
            {mode === 'forgot'
              ? 'Enter your email address to receive a secure recovery link.'
              : mode === 'signup'
              ? 'Create your account to unlock your collegiate profile, join squads, and recruit teammates.'
              : 'Sign in with your credentials to access your profile, applications, and saved competitions.'}
          </p>
        </div>

        {/* Error / Success Notifications */}
        {errorMsg && (
          <div className="profile-auth-alert profile-auth-alert-error" role="alert">
            <AlertCircleIcon size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="profile-auth-alert profile-auth-alert-success" role="status">
            <CheckIcon size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Mode Switcher Tabs (Sign Up vs Sign In) */}
        {mode !== 'forgot' && (
          <div className="profile-auth-tabs">
            <button
              type="button"
              className={`profile-auth-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
            >
              Sign Up
            </button>
            <button
              type="button"
              className={`profile-auth-tab ${mode === 'signin' ? 'active' : ''}`}
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
            >
              Sign In
            </button>
          </div>
        )}

        {/* 1-Click Google OAuth */}
        {mode !== 'forgot' && (
          <div className="profile-auth-social">
            <button
              type="button"
              className="profile-auth-google-btn"
              onClick={handleGoogleSignIn}
              disabled={submitting}
            >
              <GoogleIcon size={18} />
              <span>Continue with Google</span>
            </button>

            <div className="profile-auth-divider-line">
              <span>{mode === 'signup' ? 'or sign up with email and password' : 'or sign in with email and password'}</span>
            </div>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="profile-auth-form">
          {mode === 'signup' && (
            <>
              <div className="profile-auth-field">
                <label htmlFor="gate-fullname">Full Name</label>
                <input
                  id="gate-fullname"
                  type="text"
                  placeholder="e.g. Aditya Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="profile-auth-field">
                <label htmlFor="gate-college">College / University</label>
                <SearchableCollegeSelect
                  id="gate-college"
                  value={college}
                  onChange={(val) => setCollege(val)}
                  placeholder="Search college (e.g. SRCC, SSCBS, IIT)..."
                />
              </div>

              <div className="profile-auth-field">
                <label htmlFor="gate-phone">WhatsApp Number</label>
                <input
                  id="gate-phone"
                  type="tel"
                  placeholder="+91 98••• ••210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <span className="profile-auth-field-hint">
                  Used by squad leads to coordinate with you on WhatsApp after accepting your application.
                </span>
              </div>
            </>
          )}

          <div className="profile-auth-field">
            <label htmlFor="gate-email">Collegiate / Personal Email</label>
            <input
              id="gate-email"
              type="email"
              placeholder="e.g. aditya@collegename.edu.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="profile-auth-field">
            <div className="profile-auth-field-header">
              <label htmlFor="gate-password">Password</label>
              {mode === 'signin' && (
                <button
                  type="button"
                  className="profile-auth-link"
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
            <input
              id="gate-password"
              type="password"
              placeholder={mode === 'signup' ? 'Min 6 characters' : 'Enter your password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="profile-auth-submit-btn"
            disabled={submitting}
          >
            {submitting ? (
              <span className="profile-auth-spinner" />
            ) : mode === 'signup' ? (
              'Create Account & Profile'
            ) : mode === 'signin' ? (
              'Sign In'
            ) : (
              'Send Recovery Link'
            )}
          </button>
        </form>

        {/* Footer Mode Switcher / Links */}
        <div className="profile-auth-footer">
          {mode === 'signup' && (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                className="profile-auth-link"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
              >
                Sign in
              </button>
            </p>
          )}

          {mode === 'signin' && (
            <p>
              Don't have an account yet?{' '}
              <button
                type="button"
                className="profile-auth-link"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
              >
                Create one now
              </button>
            </p>
          )}

          {mode === 'forgot' && (
            <p>
              Remembered your password?{' '}
              <button
                type="button"
                className="profile-auth-link"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
              >
                Back to sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
