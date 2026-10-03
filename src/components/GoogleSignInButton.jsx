// src/components/GoogleSignInButton.jsx
// "Continue with Google" for the auth screens. Uses Google's own button (popup
// on our domain) when VITE_GOOGLE_CLIENT_ID is configured, and falls back to
// the classic Supabase OAuth redirect button otherwise or if Google's script
// can't load.
import React, { useEffect, useRef, useState } from 'react';
import { isGoogleIdentityEnabled, renderGoogleButton } from '../lib/googleIdentity';

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

// Google's rendered button accepts widths between 200 and 400px.
const clampWidth = (w) => Math.max(200, Math.min(400, Math.floor(w)));

export default function GoogleSignInButton({ onCredential, onRedirectSignIn, disabled = false }) {
  const containerRef = useRef(null);
  const callbackRef = useRef(onCredential);
  const [useFallback, setUseFallback] = useState(!isGoogleIdentityEnabled);

  callbackRef.current = onCredential;

  useEffect(() => {
    if (useFallback || !containerRef.current) return;
    let cancelled = false;
    const el = containerRef.current;

    renderGoogleButton(el, {
      width: clampWidth(el.parentElement?.offsetWidth || 400),
      onCredential: (token, nonce) => callbackRef.current?.(token, nonce),
    }).catch((err) => {
      console.warn('[GoogleSignIn] Falling back to redirect sign-in:', err);
      if (!cancelled) setUseFallback(true);
    });

    return () => {
      cancelled = true;
    };
  }, [useFallback]);

  if (useFallback) {
    return (
      <button
        type="button"
        className="onestop-auth-google-btn"
        onClick={onRedirectSignIn}
        disabled={disabled}
      >
        <GoogleIcon size={18} />
        <span>Continue with Google</span>
      </button>
    );
  }

  return (
    <div className={`onestop-auth-gis-wrap ${disabled ? 'is-disabled' : ''}`}>
      <div ref={containerRef} className="onestop-auth-gis-btn" />
    </div>
  );
}
