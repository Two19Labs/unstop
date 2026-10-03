// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://ncnkzlugelkhafjtupbf.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jbmt6bHVnZWxraGFmanR1cGJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzOTcxNDYsImV4cCI6MjEwNDk3MzE0Nn0.DERn_Nf62VX0ScFXF9Jyokm9cLJZsdr_RcttHsoi8lU';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const hasValidCredentials = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('your-project')
);

if (hasValidCredentials) {
  console.log('✅ Supabase initialized successfully:', supabaseUrl);
} else {
  console.warn('⚠️ Supabase credentials not detected yet. If you just created .env, restart Vite with: npm run dev');
}

// Captured before createClient(): with detectSessionInUrl, Supabase consumes
// and clears a recovery link's URL hash and emits PASSWORD_RECOVERY before the
// app's auth listener is attached, so the app checks this flag instead.
export const openedFromRecoveryLink =
  typeof window !== 'undefined' && /(^|[#&?])type=recovery(&|$)/.test(window.location.hash);

export const supabase = hasValidCredentials
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
