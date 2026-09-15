// src/components/AuthModal.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CloseIcon, UsersIcon, CheckIcon, AlertCircleIcon } from './icons';
import './AuthModal.css';

// Official Google "G" SVG Icon
function GoogleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
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
    hasSupabase
  } = useAuth();

  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [college, setCollege] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Sync mode with modal config when opened
  React.useEffect(() => {
    if (authModalConfig?.initialTab) {
      setMode(authModalConfig.initialTab);
    }
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [authModalConfig, authModalOpen]);

  if (!authModalOpen) return null;

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
      // Google OAuth will redirect the page
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
        setSuccessMsg('Successfully signed in!');
        setTimeout(() => {
          closeAuthModal();
          if (authModalConfig?.postLoginAction) {
            authModalConfig.postLoginAction();
          }
        }, 500);
      } else if (mode === 'signup') {
        const res = await signUpWithPassword({
          email,
          password,
          fullName,
          college,
          phone,
        });

        if (res?.user && res?.session) {
          setSuccessMsg('Account created successfully!');
          setTimeout(() => {
            closeAuthModal();
            if (authModalConfig?.postLoginAction) {
              authModalConfig.postLoginAction();
            }
          }, 500);
        } else {
          setSuccessMsg('Account created! If email confirmation is enabled, check your inbox to confirm your account.');
        }
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setSuccessMsg('Password reset link sent to your email! (via Brevo SMTP)');
      }
    } catch (err) {
      console.error('Auth submit error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="arena-auth-backdrop" onClick={closeAuthModal}>
      <div
        className="arena-auth-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        {/* Top Bar with Brand Pill & Close Button */}
        <div className="arena-auth-top-bar">
          <div className="arena-auth-brand-pill">
            <span className="arena-auth-t19">Two19 Labs</span>
            <span className="arena-auth-divider">/</span>
            <span className="arena-auth-badge">ONESTOP AUTH</span>
          </div>

          <button
            className="arena-auth-close"
            onClick={closeAuthModal}
            aria-label="Close modal"
            type="button"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Brand Header */}
        <div className="arena-auth-header">
          <h2 id="auth-modal-title" className="arena-auth-title">
            {mode === 'forgot'
              ? 'Reset Password'
              : mode === 'signup'
              ? 'Create Account'
              : authModalConfig?.title || 'Sign In to OneStop'}
          </h2>

          <p className="arena-auth-subtitle">
            {mode === 'forgot'
              ? 'Enter your email address to receive a secure recovery link.'
              : authModalConfig?.subtitle || 'Access teammate matching, squad recruitment, and WhatsApp coordination.'}
          </p>
        </div>

        {/* Notice if Supabase not configured */}
        {!hasSupabase && (
          <div className="arena-auth-demo-notice">
            <AlertCircleIcon size={14} color="#B45309" />
            <div>
              <strong>Setup Note:</strong> Add <code>VITE_SUPABASE_URL</code> &amp; <code>VITE_SUPABASE_ANON_KEY</code> to <code>.env</code>.
            </div>
          </div>
        )}

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

        {/* Mode Switcher Tabs (Sign In vs Sign Up) */}
        {mode !== 'forgot' && (
          <div className="arena-auth-tabs">
            <button
              type="button"
              className={`arena-auth-tab ${mode === 'signin' ? 'active' : ''}`}
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`arena-auth-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
            >
              Create Account
            </button>
          </div>
        )}

        {/* 1-Click Google OAuth */}
        {mode !== 'forgot' && (
          <div className="arena-auth-social">
            <button
              type="button"
              className="arena-auth-google-btn"
              onClick={handleGoogleSignIn}
              disabled={submitting}
            >
              <GoogleIcon size={18} />
              <span>Continue with Google</span>
            </button>

            <div className="arena-auth-divider-line">
              <span>or continue with email</span>
            </div>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="arena-auth-form">
          {mode === 'signup' && (
            <>
              <div className="arena-auth-field">
                <label htmlFor="auth-fullname">Full Name</label>
                <input
                  id="auth-fullname"
                  type="text"
                  placeholder="e.g. Aditya Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="arena-auth-row">
                <div className="arena-auth-field">
                  <label htmlFor="auth-college">College / University</label>
                  <input
                    id="auth-college"
                    type="text"
                    placeholder="e.g. SRCC, IIT Delhi, SSCBS"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                  />
                </div>

                <div className="arena-auth-field">
                  <label htmlFor="auth-phone">WhatsApp Number</label>
                  <input
                    id="auth-phone"
                    type="tel"
                    placeholder="10-digit mobile"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <div className="arena-auth-field">
            <label htmlFor="auth-email">Collegiate / Personal Email</label>
            <input
              id="auth-email"
              type="email"
              placeholder="you@college.edu or gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {mode !== 'forgot' && (
            <div className="arena-auth-field">
              <div className="arena-auth-field-header">
                <label htmlFor="auth-password">Password</label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    className="arena-auth-forgot-btn"
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
                id="auth-password"
                type="password"
                placeholder="••••••••"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="arena-auth-submit-btn"
            disabled={submitting}
          >
            {submitting ? (
              <span className="arena-auth-spinner">Processing...</span>
            ) : mode === 'signin' ? (
              'Sign In'
            ) : mode === 'signup' ? (
              'Create Account'
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        {/* Footer info & toggle back */}
        <div className="arena-auth-footer">
          {mode === 'forgot' ? (
            <button
              type="button"
              className="arena-auth-back-btn"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
            >
              ← Back to Sign In
            </button>
          ) : (
            <p className="arena-auth-terms">
              By continuing, you agree to Two19 Labs' platform terms. Teammate WhatsApp links are shared strictly for collegiate collaboration.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
