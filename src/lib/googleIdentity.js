// src/lib/googleIdentity.js
// Google Identity Services ("Sign in with Google" button) helpers.
//
// Signing in through Google's own button keeps the Google popup on our domain
// (onestop.two19labs.in) instead of redirecting through the Supabase project
// URL. The ID token Google returns is exchanged for a Supabase session with
// supabase.auth.signInWithIdToken.
//
// Enabled only when VITE_GOOGLE_CLIENT_ID is set; otherwise callers fall back
// to the Supabase OAuth redirect flow.

const GOOGLE_CLIENT_ID = import.meta.env?.VITE_GOOGLE_CLIENT_ID || '';
const GSI_SRC = 'https://accounts.google.com/gsi/client';

export const isGoogleIdentityEnabled = Boolean(GOOGLE_CLIENT_ID);

let scriptPromise = null;

export function loadGoogleIdentity() {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) resolve(window.google.accounts.id);
      else reject(new Error('Google sign-in failed to initialize.'));
    };
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Could not load Google sign-in.'));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

function randomNonce() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Renders Google's "Continue with Google" button into `container`.
 * `onCredential(idToken, rawNonce)` is called after the user picks an account;
 * pass both to supabase.auth.signInWithIdToken.
 */
export async function renderGoogleButton(container, { onCredential, width }) {
  const gid = await loadGoogleIdentity();
  const rawNonce = randomNonce();
  const hashedNonce = await sha256Hex(rawNonce);

  gid.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (response) => onCredential(response.credential, rawNonce),
    nonce: hashedNonce,
    ux_mode: 'popup',
    context: 'signin',
    auto_select: false,
    itp_support: true,
  });

  container.innerHTML = '';
  gid.renderButton(container, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'continue_with',
    shape: 'rectangular',
    logo_alignment: 'center',
    width,
  });
}
