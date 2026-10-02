import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, hasValidCredentials } from '../lib/supabaseClient';
import { normalizeYear } from '../data/colleges';
import { isMockPost, isMockApp, isMockBookmark } from '../data/initialData';
import { identifyUser, setPersonProperties, resetUser, trackEvent } from '../lib/posthog';

const AuthContext = createContext(null);

export const PROFILE_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

const profileCooldownKey = (userId) => `onestop_profile_last_updated_${userId}`;

// The database owns profile_last_updated_at (see PROFILE_COOLDOWN_AND_PRIVACY_MIGRATION.sql).
// localStorage is only a hint used before the profile has loaded from the server.
export function getProfileCooldown(profile, user) {
  let lastUpdated = null;
  if (profile && Object.prototype.hasOwnProperty.call(profile, 'profile_last_updated_at')) {
    lastUpdated = profile.profile_last_updated_at;
  } else if (user?.id) {
    try {
      lastUpdated = localStorage.getItem(profileCooldownKey(user.id));
    } catch (e) {}
  }

  if (!lastUpdated) {
    return { isLocked: false, remainingMs: 0, hours: 0, minutes: 0, seconds: 0, remainingFormatted: '' };
  }

  const lastTime = new Date(lastUpdated).getTime();
  if (isNaN(lastTime)) {
    return { isLocked: false, remainingMs: 0, hours: 0, minutes: 0, seconds: 0, remainingFormatted: '' };
  }

  const now = Date.now();
  const elapsed = now - lastTime;
  if (elapsed >= PROFILE_COOLDOWN_MS) {
    return { isLocked: false, remainingMs: 0, hours: 0, minutes: 0, seconds: 0, remainingFormatted: '' };
  }

  const remainingMs = PROFILE_COOLDOWN_MS - elapsed;
  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
  const remainingFormatted = `${hours}h ${minutes}m ${seconds}s`;

  return {
    isLocked: true,
    remainingMs,
    hours,
    minutes,
    seconds,
    remainingFormatted,
    unlockDate: new Date(lastTime + PROFILE_COOLDOWN_MS),
  };
}

function rememberProfileCooldown(userId, lastUpdatedAt) {
  if (!userId) return;
  try {
    if (lastUpdatedAt) {
      localStorage.setItem(profileCooldownKey(userId), lastUpdatedAt);
    } else {
      localStorage.removeItem(profileCooldownKey(userId));
    }
  } catch (e) {}
}

export function isProfileCooldownError(err) {
  return err?.code === 'PROFILE_COOLDOWN';
}

export function sanitizeIndianPhone(raw) {
  if (!raw) return '';
  let digits = String(raw).trim().replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  else if (digits.length > 10 && digits.startsWith('91')) digits = digits.slice(-10);
  return digits.slice(0, 10);
}

export function formatWhatsAppUrl(phone, textMessage = '') {
  const cleanPhone = sanitizeIndianPhone(phone);
  if (!cleanPhone || cleanPhone.length !== 10) return '#';
  return `https://wa.me/91${cleanPhone}${textMessage ? `?text=${encodeURIComponent(textMessage)}` : ''}`;
}

export function AuthProvider({ children }) {
  // Authentication State
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const userRef = useRef(null);
  userRef.current = user;
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Global Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalConfig, setAuthModalConfig] = useState({
    title: 'Sign in to OneStop',
    subtitle: 'Access teammate matching, squad recruitment, and WhatsApp coordination.',
    initialTab: 'signin', // 'signin' | 'signup'
    postLoginAction: null,
  });

  // Profile Settings Modal State
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const openProfileModal = () => setProfileModalOpen(true);
  const closeProfileModal = () => setProfileModalOpen(false);

  // Password Recovery Modal State (triggered on PASSWORD_RECOVERY event)
  const [recoveryModalOpen, setRecoveryModalOpen] = useState(false);
  const openRecoveryModal = () => setRecoveryModalOpen(true);
  const closeRecoveryModal = () => setRecoveryModalOpen(false);

  // Bookmarks State (100% real, zero mock data)
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem('onestop_bookmarks');
      return saved ? JSON.parse(saved).filter(b => !isMockBookmark(b)) : [];
    } catch {
      return [];
    }
  });

  // Squad Posts State (100% real, zero mock data)
  const [squadPosts, setSquadPosts] = useState(() => {
    try {
      const saved = localStorage.getItem('onestop_posts');
      return saved ? JSON.parse(saved).filter(p => !isMockPost(p)) : [];
    } catch {
      return [];
    }
  });

  // Squad Applications State (100% real, zero mock data)
  const [squadApps, setSquadApps] = useState(() => {
    try {
      const saved = localStorage.getItem('onestop_applications');
      return saved ? JSON.parse(saved).filter(a => !isMockApp(a)) : [];
    } catch {
      return [];
    }
  });

  // Notification States (Cloud-synced across devices via Supabase user_notification_states)
  const [notificationStates, setNotificationStates] = useState(() => {
    try {
      const saved = localStorage.getItem('onestop_user_notification_states');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Enforce Light Theme & purge legacy dark mode state
  useEffect(() => {
    try {
      localStorage.removeItem('onestop_theme');
      document.documentElement.setAttribute('data-theme', 'light');
    } catch (e) {}
  }, []);

  // Column projections to minimize Supabase egress
  const SQUAD_POSTS_SELECT = 'id, user_id, created_by_name, created_by_email, competition_name, competition_id, is_custom, expires_at, organizer, competition_link, phone_number, comm_method, title, description, skills_have, skills_looking_for, total_members, spots_left, initial_open_spots, is_open, college, course, year, accepted_emails, created_at, updated_at';
  const SQUAD_APPS_SELECT = 'id, post_id, applicant_id, applicant_name, applicant_email, applicant_phone, applicant_college, applicant_course, applicant_year, pitch_note, highlighted_skills, status, lead_phone, comm_method, created_at, updated_at';
  const PROFILE_SELECT = 'id, email, full_name, college, course, year, phone, bio, education_level, skills, profile_last_updated_at';

  // In-flight request caching & deduplication to eliminate duplicate parallel calls
  const squadDataInFlightRef = useRef(null);
  const lastSquadDataFetchRef = useRef(0);

  // 2. Fetch Profile and Bookmarks from Supabase (Strict column selection & zero extra roundtrips)
  const fetchUserProfile = useCallback(async (userId, passedUser = null) => {
    if (!supabase || !userId) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(PROFILE_SELECT)
        .eq('id', userId)
        .maybeSingle();

      const activeUser = passedUser || userRef.current;
      const meta = activeUser?.user_metadata || {};
      if (error) throw error;

      // Once a profiles row exists it is the single source of truth (auth metadata is
      // user-writable and not covered by the 24-hour cooldown).
      if (data) rememberProfileCooldown(userId, data.profile_last_updated_at);
      const resolvedProfile = data ? {
        ...data,
        full_name: data.full_name || '',
        education_level: data.education_level || '',
        college: data.college || '',
        phone: data.phone || '',
        course: data.course || '',
        year: data.year || '',
        bio: data.bio || '',
        skills: Array.isArray(data.skills) ? data.skills : [],
        profile_last_updated_at: data.profile_last_updated_at || null,
      } : (meta.full_name || activeUser?.email ? {
        id: userId,
        email: activeUser?.email,
        full_name: meta.full_name || (activeUser?.email ? activeUser.email.split('@')[0] : ''),
        education_level: meta.education_level || '',
        college: meta.college || '',
        phone: meta.phone || '',
        course: meta.course || '',
        year: meta.year || '',
        bio: meta.bio || '',
        skills: Array.isArray(meta.skills) ? meta.skills : [],
      } : null);

      if (resolvedProfile) {
        setProfile(resolvedProfile);
        setPersonProperties({
          name: resolvedProfile.full_name,
          email: resolvedProfile.email || activeUser?.email,
          college: resolvedProfile.college,
          year: resolvedProfile.year,
          course: resolvedProfile.course,
          education_level: resolvedProfile.education_level,
        });
      }
    } catch (err) {
      console.warn('Profile fetch warning:', err.message);
    }
  }, []);

  const fetchUserBookmarks = useCallback(async (userId) => {
    if (!supabase || !userId) return;
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('comp_id')
        .eq('user_id', userId);

      if (!error && Array.isArray(data)) {
        const ids = data.map(b => String(b.comp_id)).filter(id => !isMockBookmark(id));
        setBookmarks(ids);
        try {
          localStorage.setItem('onestop_bookmarks', JSON.stringify(ids));
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Bookmarks fetch warning:', err.message);
    }
  }, []);

  const fetchNotificationStates = useCallback(async (userId) => {
    if (!supabase || !userId) return;
    try {
      const { data, error } = await supabase
        .from('user_notification_states')
        .select('notification_id, is_read, is_dismissed')
        .eq('user_id', userId);

      if (!error && Array.isArray(data)) {
        const map = {};
        data.forEach(row => {
          map[row.notification_id] = {
            is_read: Boolean(row.is_read),
            is_dismissed: Boolean(row.is_dismissed),
          };
        });
        setNotificationStates(map);
        try {
          localStorage.setItem(`onestop_user_notification_states_${userId}`, JSON.stringify(map));
          localStorage.setItem('onestop_user_notification_states', JSON.stringify(map));
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Notification states fetch error:', err.message);
    }
  }, []);

  // 3. Sync Squad Data from Supabase with Lean Field Projections & Request Deduplication
  const refreshSquadData = useCallback(async (targetUser = null, force = false) => {
    if (!supabase) return;

    const now = Date.now();
    if (!force && squadDataInFlightRef.current) {
      return squadDataInFlightRef.current;
    }
    if (!force && (now - lastSquadDataFetchRef.current < 4000)) {
      return;
    }

    const fetchPromise = (async () => {
      try {
        lastSquadDataFetchRef.current = Date.now();

        // Fetch squad posts with column projection and row limit (optimized to 40 rows for low egress)
        const { data: posts, error: postErr } = await supabase
          .from('squad_posts')
          .select(SQUAD_POSTS_SELECT)
          .order('created_at', { ascending: false })
          .limit(40);

        if (!postErr && Array.isArray(posts)) {
          const cleanPosts = posts.filter(p => !isMockPost(p)).map(p => ({
            ...p,
            compId: p.competition_id || p.compId,
          }));
          setSquadPosts(cleanPosts);
          try {
            localStorage.setItem('onestop_posts', JSON.stringify(cleanPosts));
          } catch (e) {}
        }

        // Fetch applications if user is signed in
        const activeUser = targetUser || userRef.current;
        if (activeUser?.id) {
          const { data: apps, error: appErr } = await supabase
            .from('squad_applications')
            .select(SQUAD_APPS_SELECT)
            .order('created_at', { ascending: false })
            .limit(30);

          if (!appErr && Array.isArray(apps)) {
            const cleanApps = apps
              .filter(a => !isMockApp(a))
              .map(a => {
                const isApplicant = a.applicant_id === activeUser.id;
                return {
                  ...a,
                  dir: isApplicant ? 'out' : 'in',
                  postId: a.post_id,
                  who: a.applicant_name,
                  meta: a.applicant_college,
                  applicant_name: a.applicant_name,
                  applicant_college: a.applicant_college,
                  applicant_year: a.applicant_year || '',
                  applicant_course: a.applicant_course || '',
                  skills: a.highlighted_skills || [],
                  highlighted_skills: a.highlighted_skills || [],
                  pitch: a.pitch_note,
                  pitch_note: a.pitch_note,
                  phone: a.applicant_phone,
                  applicant_phone: a.applicant_phone,
                  leadPhone: a.lead_phone || '',
                  lead_phone: a.lead_phone || '',
                  comm_method: a.comm_method || 'whatsapp'
                };
              });
            setSquadApps(cleanApps);
            try {
              localStorage.setItem('onestop_applications', JSON.stringify(cleanApps));
            } catch (e) {}
          }
        } else {
          setSquadApps([]);
        }
      } catch (e) {
        console.warn('Could not sync squad data from Supabase:', e.message);
      } finally {
        squadDataInFlightRef.current = null;
      }
    })();

    squadDataInFlightRef.current = fetchPromise;
    return fetchPromise;
  }, []);

  // 4. Initialize Supabase Auth Listener
  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    let isMounted = true;

    // Get current active session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!isMounted) return;
      setSession(currentSession);
      const currentUser = currentSession?.user || null;
      setUser(currentUser);
      userRef.current = currentUser;
      if (currentUser) {
        identifyUser(currentUser.id, { email: currentUser.email });
        fetchUserProfile(currentUser.id, currentUser);
        fetchUserBookmarks(currentUser.id);
        fetchNotificationStates(currentUser.id);
        refreshSquadData(currentUser);
        try {
          const pendingId = sessionStorage.getItem('onestop_pending_bookmark_after_auth');
          if (pendingId) {
            sessionStorage.removeItem('onestop_pending_bookmark_after_auth');
            toggleBookmark(pendingId);
          }
        } catch (e) {}
      } else {
        setBookmarks([]);
        try {
          localStorage.removeItem('onestop_bookmarks');
        } catch (e) {}
      }
      if (
        typeof window !== 'undefined' &&
        (window.location.hash.includes('type=recovery') ||
          window.location.search.includes('type=recovery') ||
          (window.location.hash.includes('access_token') && window.location.hash.includes('recovery')))
      ) {
        setRecoveryModalOpen(true);
      }
      setAuthLoading(false);
    }).catch((err) => {
      console.error('Session retrieval error:', err);
      if (isMounted) {
        setBookmarks([]);
        setAuthLoading(false);
      }
    });

    // Listen for auth state changes (login, logout, oauth callback, password recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return;
        setSession(newSession);
        const currentUser = newSession?.user || null;
        setUser(currentUser);
        userRef.current = currentUser;

        if (event === 'PASSWORD_RECOVERY') {
          setRecoveryModalOpen(true);
        }

        if (currentUser) {
          identifyUser(currentUser.id, { email: currentUser.email });
          await fetchUserProfile(currentUser.id, currentUser);
          await fetchUserBookmarks(currentUser.id);
          await fetchNotificationStates(currentUser.id);
          refreshSquadData(currentUser, true);
          try {
            const pendingId = sessionStorage.getItem('onestop_pending_bookmark_after_auth');
            if (pendingId) {
              sessionStorage.removeItem('onestop_pending_bookmark_after_auth');
              toggleBookmark(pendingId);
            }
          } catch (e) {}
        } else {
          resetUser();
          setProfile(null);
          setBookmarks([]);
          setSquadApps([]);
          setNotificationStates({});
          try {
            localStorage.removeItem('onestop_bookmarks');
          } catch (e) {}
        }
        setAuthLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchUserProfile, fetchUserBookmarks, fetchNotificationStates, refreshSquadData]);

  // 5. Initial Squad Data Fetch + Realtime Subscription & Background Sync Across Devices
  useEffect(() => {
    refreshSquadData();

    if (!supabase) return;

    let debounceTimer = null;
    const scheduleDebouncedSync = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        refreshSquadData(null, true);
      }, 350);
    };

    const activeUserId = userRef.current?.id || user?.id;
    let isRealtimeConnected = false;

    // Realtime Postgres changes subscription across devices with user-scoped filters to prevent cross-user egress amplification
    let realtimeBuilder = supabase.channel(`public:app_realtime_sync_${activeUserId || 'guest'}`);

    // All clients listen to squad_posts changes
    realtimeBuilder = realtimeBuilder.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'squad_posts' },
      () => {
        scheduleDebouncedSync();
      }
    );

    // If authenticated, scope user-specific table changes strictly to current user's ID
    if (activeUserId) {
      realtimeBuilder = realtimeBuilder
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'squad_applications' },
          () => {
            scheduleDebouncedSync();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookmarks',
            filter: `user_id=eq.${activeUserId}`
          },
          () => {
            fetchUserBookmarks(activeUserId);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_notification_states',
            filter: `user_id=eq.${activeUserId}`
          },
          () => {
            fetchNotificationStates(activeUserId);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${activeUserId}`
          },
          () => {
            fetchUserProfile(activeUserId);
          }
        );
    }

    const channel = realtimeBuilder.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        isRealtimeConnected = true;
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        isRealtimeConnected = false;
      }
    });

    // Visibility-gated polling fallback: 10-minute interval (600,000ms), only active if Realtime is disconnected
    const pollInterval = setInterval(() => {
      if (isRealtimeConnected) return; // Skip polling when WebSocket is healthy
      if (typeof document !== 'undefined' && document.hidden) return;
      refreshSquadData();
      if (userRef.current?.id) {
        fetchUserBookmarks(userRef.current.id);
        fetchNotificationStates(userRef.current.id);
      }
    }, 600000);

    // Tab focus / visibility revalidation: only refresh when returning after > 5 minutes (300,000ms) or if disconnected
    let lastVisibilitySync = Date.now();
    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        const now = Date.now();
        if (!isRealtimeConnected || (now - lastVisibilitySync > 300000)) {
          lastVisibilitySync = now;
          refreshSquadData();
          if (userRef.current?.id) {
            fetchUserBookmarks(userRef.current.id);
            fetchNotificationStates(userRef.current.id);
          }
        }
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleVisibilityOrFocus);
    }

    return () => {
      clearInterval(pollInterval);
      if (debounceTimer) clearTimeout(debounceTimer);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleVisibilityOrFocus);
      }
      supabase.removeChannel(channel);
    };
  }, [user, refreshSquadData, fetchUserBookmarks, fetchNotificationStates, fetchUserProfile]);

  // 6. Local Storage Sync Fallback
  useEffect(() => {
    if (user || userRef.current) {
      localStorage.setItem('onestop_bookmarks', JSON.stringify(bookmarks.filter(b => !isMockBookmark(b))));
    } else {
      localStorage.removeItem('onestop_bookmarks');
    }
  }, [bookmarks, user]);

  useEffect(() => {
    localStorage.setItem('onestop_posts', JSON.stringify(squadPosts.filter(p => !isMockPost(p))));
  }, [squadPosts]);

  useEffect(() => {
    localStorage.setItem('onestop_applications', JSON.stringify(squadApps.filter(a => !isMockApp(a))));
  }, [squadApps]);

  // Modal Open/Close Controls
  const openAuthModal = (options = {}) => {
    setAuthModalConfig({
      title: options.title || 'Create your account',
      subtitle: options.subtitle || 'Bookmark competitions, track every round, and find a squad.',
      initialTab: options.initialTab || 'signup',
      postLoginAction: options.postLoginAction || null,
    });
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  // Auth Operations
  const signInWithGoogle = async () => {
    if (!supabase) {
      throw new Error('Supabase credentials missing. Check your .env file or SUPABASE_SETUP.md.');
    }
    trackEvent('auth_google_initiated');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      trackEvent('auth_google_failed', { error: error.message });
      throw error;
    }
    return data;
  };

  const signInWithPassword = async ({ email, password }) => {
    if (!supabase) {
      throw new Error('Supabase credentials missing. Check your .env file or SUPABASE_SETUP.md.');
    }
    trackEvent('auth_sign_in_attempted', { method: 'password' });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      trackEvent('auth_sign_in_failed', { method: 'password', error: error.message });
      throw error;
    }
    trackEvent('auth_sign_in_success', { method: 'password' });
    return data;
  };

  const signUpWithPassword = async ({ email, password, fullName, college, phone }) => {
    if (!supabase) {
      throw new Error('Supabase credentials missing. Check your .env file or SUPABASE_SETUP.md.');
    }
    trackEvent('auth_sign_up_attempted', { college });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
          college: college || '',
          phone: phone || '',
        },
      },
    });
    if (error) {
      trackEvent('auth_sign_up_failed', { error: error.message });
      throw error;
    }
    trackEvent('auth_sign_up_success', { college, hasPhone: Boolean(phone) });
    return data;
  };

  const signOut = async () => {
    trackEvent('auth_sign_out');
    resetUser();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Sign out error:', err);
      }
    }
    const oldUserId = userRef.current?.id || user?.id;
    userRef.current = null;
    setUser(null);
    setSession(null);
    setProfile(null);
    setBookmarks([]);
    setSquadApps([]);
    try {
      localStorage.removeItem('onestop_applications');
      localStorage.removeItem('onestop_bookmarks');
      localStorage.removeItem('onestop_user_profile');
      if (oldUserId) {
        localStorage.removeItem(`onestop_profile_last_updated_${oldUserId}`);
        localStorage.removeItem(`onestop_user_notification_states_${oldUserId}`);
      }
      localStorage.removeItem('onestop_user_notification_states');
    } catch (e) {}
  };

  const resetPassword = async (email) => {
    if (!supabase) {
      throw new Error('Supabase credentials missing. Check your .env file or SUPABASE_SETUP.md.');
    }
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    trackEvent('auth_password_reset_requested');
    const { data, error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}`,
    });
    if (error) {
      trackEvent('auth_password_reset_failed', { error: error.message });
      throw error;
    }
    trackEvent('auth_password_reset_success');
    return data;
  };

  const changePassword = async (newPassword) => {
    if (!supabase) {
      throw new Error('Supabase credentials missing.');
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser && !user) {
      throw new Error('You must be signed in or follow a valid password reset link to change your password.');
    }
    trackEvent('auth_password_change_attempted');
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) {
      trackEvent('auth_password_change_failed', { error: error.message });
      throw error;
    }
    trackEvent('auth_password_change_success');
    return data;
  };

  const resendVerificationEmail = async (email) => {
    if (!supabase) {
      throw new Error('Supabase credentials missing. Check your .env file or SUPABASE_SETUP.md.');
    }
    const cleanEmail = (email || '').trim();
    if (!cleanEmail) {
      throw new Error('Please enter your email to resend the verification link.');
    }
    trackEvent('auth_resend_verification_attempted');
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      trackEvent('auth_resend_verification_failed', { error: error.message });
      throw error;
    }
    trackEvent('auth_resend_verification_success');
    return data;
  };

  const deleteAccount = async (currentPassword) => {
    if (!supabase || !user) {
      throw new Error('You must be signed in to delete your account.');
    }

    const cleanPassword = (currentPassword || '').trim();
    if (!cleanPassword) {
      throw new Error('Please enter your current password to confirm account deletion.');
    }

    trackEvent('auth_account_deletion_attempted');

    // 1. Verify current password with Supabase Auth
    const { error: authErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: cleanPassword,
    });

    if (authErr) {
      console.warn('Password verification failed during account deletion:', authErr.message);
      if (
        authErr.message?.toLowerCase().includes('invalid login credentials') ||
        authErr.message?.toLowerCase().includes('invalid credentials')
      ) {
        throw new Error('Incorrect password. Please enter your valid current password to confirm account deletion.');
      }
      throw new Error(authErr.message || 'Incorrect password. Verification failed.');
    }

    const userId = user.id;

    // 2. Perform account deletion via RPC
    const { error: rpcErr } = await supabase.rpc('delete_user_account');
    if (rpcErr) {
      console.warn('Account deletion RPC issue:', rpcErr);
      // If RPC is missing or fails due to missing function, attempt best-effort fallback on public tables
      if (rpcErr.code === 'PGRST202' || rpcErr.message?.includes('does not exist')) {
        try {
          await supabase.from('bookmarks').delete().eq('user_id', userId);
        } catch (e) {}
        try {
          await supabase.from('squad_applications').delete().eq('applicant_id', userId);
        } catch (e) {}
        try {
          await supabase.from('squad_posts').delete().eq('user_id', userId);
        } catch (e) {}
        try {
          await supabase.from('user_notification_states').delete().eq('user_id', userId);
        } catch (e) {}
        try {
          await supabase.from('user_notifications').delete().eq('user_id', userId);
        } catch (e) {}
        try {
          await supabase.from('squad_messages').delete().eq('sender_id', userId);
        } catch (e) {}
        try {
          await supabase.from('profiles').delete().eq('id', userId);
        } catch (e) {}
      } else {
        throw new Error(rpcErr.message || 'Failed to delete account. Please try again.');
      }
    }

    trackEvent('auth_account_deletion_success');
    await signOut();
  };

  // Profile Update (Database & Auth Metadata)
  const updateProfile = async ({ fullName, college, course, year, phone, bio, education_level, skills }) => {
    if (!user || !supabase) {
      throw new Error('You must be signed in to update your profile.');
    }

    // 1. Fast client-side check (the database trigger is the real enforcement)
    const cooldown = getProfileCooldown(profile, user);
    if (cooldown.isLocked) {
      const err = new Error(`Profile details can only be updated once every 24 hours. Cooldown remaining: ${cooldown.remainingFormatted}.`);
      err.code = 'PROFILE_COOLDOWN';
      throw err;
    }

    const cleanPhone = sanitizeIndianPhone(phone);
    const trimmedName = (fullName || '').trim();
    const trimmedCollege = (college || '').trim();
    const trimmedCourse = (course || '').trim();
    const selectedYear = normalizeYear(year);
    // The profile screen doesn't edit bio: keep the stored one instead of wiping it
    const trimmedBio = (bio === undefined ? (profile?.bio || '') : (bio || '')).trim();
    const selectedEducationLevel = selectedYear.startsWith('PG') || (education_level || profile?.education_level || 'undergraduate').toLowerCase().includes('post')
      ? 'postgraduate'
      : 'undergraduate';
    // Sorted so a reorder alone never counts as a change (and never burns the cooldown)
    const cleanSkills = (Array.isArray(skills) ? skills : (profile?.skills || [])).slice().sort();

    // Check if any field has actually changed
    const prevName = (profile?.full_name || '').trim();
    const prevCollege = (profile?.college || '').trim();
    const prevCourse = (profile?.course || '').trim();
    const prevYear = normalizeYear(profile?.year);
    const prevPhone = sanitizeIndianPhone(profile?.phone || '');
    const prevBio = (profile?.bio || '').trim();
    const prevEducationLevel = prevYear.startsWith('PG') || (profile?.education_level || 'undergraduate').toLowerCase().includes('post')
      ? 'postgraduate'
      : 'undergraduate';
    const prevSkills = Array.isArray(profile?.skills) ? profile.skills : [];
    const skillsChanged = JSON.stringify(prevSkills.slice().sort()) !== JSON.stringify(cleanSkills);

    const hasChanged =
      trimmedName !== prevName ||
      trimmedCollege !== prevCollege ||
      trimmedCourse !== prevCourse ||
      selectedYear !== prevYear ||
      cleanPhone !== prevPhone ||
      trimmedBio !== prevBio ||
      selectedEducationLevel !== prevEducationLevel ||
      skillsChanged;

    // If nothing has changed, do not start/reset cooldown
    if (!hasChanged && profile) {
      return profile;
    }

    // 2. Persist to PostgreSQL first. The cooldown trigger sets profile_last_updated_at
    //    server-side and rejects edits inside the 24-hour window.
    const fields = {
      full_name: trimmedName,
      college: trimmedCollege,
      course: trimmedCourse,
      year: selectedYear,
      education_level: selectedEducationLevel,
      phone: cleanPhone,
      bio: trimmedBio,
      skills: cleanSkills,
    };

    let { data: saved, error: saveErr } = await supabase
      .from('profiles')
      .update(fields)
      .eq('id', user.id)
      .select(PROFILE_SELECT)
      .maybeSingle();

    if (!saveErr && !saved) {
      // No row yet (signup trigger missed it): create it
      ({ data: saved, error: saveErr } = await supabase
        .from('profiles')
        .insert({ id: user.id, email: user.email, ...fields })
        .select(PROFILE_SELECT)
        .single());
    }

    if (saveErr) {
      if (saveErr.hint === 'PROFILE_COOLDOWN') {
        // Another tab/device saved first: adopt the server's timestamp so the lock UI shows
        const serverLastUpdated = saveErr.details || new Date().toISOString();
        rememberProfileCooldown(user.id, serverLastUpdated);
        setProfile((prev) => (prev ? { ...prev, profile_last_updated_at: serverLastUpdated } : prev));
        const cd = getProfileCooldown({ profile_last_updated_at: serverLastUpdated }, user);
        const err = new Error(`Profile details can only be updated once every 24 hours. Cooldown remaining: ${cd.remainingFormatted}.`);
        err.code = 'PROFILE_COOLDOWN';
        err.lastUpdatedAt = serverLastUpdated;
        throw err;
      }
      throw new Error(saveErr.message || 'Could not save your profile. Please try again.');
    }

    const serverLastUpdated = saved?.profile_last_updated_at || null;
    rememberProfileCooldown(user.id, serverLastUpdated);

    // 3. Mirror display fields into auth metadata (best effort, never authoritative)
    supabase.auth.updateUser({ data: { full_name: trimmedName, college: trimmedCollege } })
      .catch((e) => console.warn('Auth metadata mirror failed:', e.message));

    const merged = {
      ...(profile || {}),
      ...(saved || {}),
      id: user.id,
      email: saved?.email || user.email,
      ...fields,
      profile_last_updated_at: serverLastUpdated,
    };
    setProfile(merged);
    setPersonProperties({
      name: trimmedName,
      college: trimmedCollege,
      course: trimmedCourse,
      year: selectedYear,
      education_level: selectedEducationLevel,
    });
    trackEvent('profile_updated', {
      college: trimmedCollege,
      year: selectedYear,
      education_level: selectedEducationLevel,
      hasBio: Boolean(trimmedBio),
      hasPhone: Boolean(cleanPhone),
    });
    try {
      localStorage.setItem('onestop_user_profile', JSON.stringify(merged));
    } catch (e) {}
    return merged;
  };

  // Bookmark Toggle with Live Database Sync (Strict Authentication Required)
  const toggleBookmark = async (compId) => {
    const activeUser = user || userRef.current;
    if (!activeUser) {
      try {
        sessionStorage.setItem('onestop_pending_bookmark_after_auth', String(compId));
      } catch (e) {}
      openAuthModal({
        title: 'Sign Up to Bookmark Competitions',
        subtitle: 'Create your collegiate account to bookmark competitions, track round deadlines, and sync across devices.',
        initialTab: 'signup',
        postLoginAction: () => {
          toggleBookmark(compId);
        },
      });
      return false;
    }

    const sCompId = String(compId);
    const isCurrentlySaved = bookmarks.some(id => String(id) === sCompId);
    const nextBookmarks = isCurrentlySaved
      ? bookmarks.filter(id => String(id) !== sCompId)
      : [...bookmarks, sCompId];

    trackEvent(isCurrentlySaved ? 'competition_unbookmarked' : 'competition_bookmarked', {
      competition_id: sCompId,
    });

    // Optimistic UI update
    setBookmarks(nextBookmarks);
    localStorage.setItem('onestop_bookmarks', JSON.stringify(nextBookmarks));

    // Persist to Supabase if authenticated
    if (supabase && activeUser) {
      try {
        if (isCurrentlySaved) {
          await supabase
            .from('bookmarks')
            .delete()
            .eq('user_id', activeUser.id)
            .eq('comp_id', sCompId);
        } else {
          await supabase
            .from('bookmarks')
            .insert([{ user_id: activeUser.id, comp_id: sCompId }]);
        }
      } catch (err) {
        console.warn('Could not sync bookmark to Supabase:', err.message);
      }
    }
    return true;
  };

  const isBookmarked = (compId) => {
    if (!user && !userRef.current) return false;
    return bookmarks.some(id => String(id) === String(compId));
  };

  // Squad Post Creator (Strict Authentication Required)
  const createSquadPost = async (postData) => {
    if (!user) {
      openAuthModal({
        title: 'Sign Up to Post a Squad',
        subtitle: 'Create your collegiate account to recruit teammates and coordinate over WhatsApp.',
        initialTab: 'signup',
      });
      throw new Error('Please sign in to post a squad opening.');
    }

    const creatorName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Competitor';
    const creatorEmail = user.email;

    const payload = {
      user_id: user.id,
      created_by_email: creatorEmail,
      created_by_name: creatorName,
      competition_name: postData.competition_name,
      competition_id: postData.competition_id || postData.compId || null,
      is_custom: Boolean(postData.is_custom),
      expires_at: postData.expires_at || null,
      organizer: postData.organizer || '',
      competition_link: postData.competition_link || '',
      phone_number: postData.phone_number || '',
      comm_method: postData.comm_method || 'whatsapp',
      title: postData.title,
      description: postData.description || '',
      skills_have: postData.skills_have || [],
      skills_looking_for: postData.skills_looking_for || [],
      total_members: Number(postData.total_members || 4),
      spots_left: Number(postData.spots_left || 1),
      initial_open_spots: Number(postData.spots_left || 1),
      is_open: true,
      college: (profile?.college || user?.user_metadata?.college || postData.college || '').trim(),
      course: postData.course || profile?.course || user?.user_metadata?.course || '',
      year: normalizeYear(profile?.year || user?.user_metadata?.year || postData.year),
      accepted_emails: [],
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('squad_posts')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error('Error inserting squad post to Supabase:', error);
        throw error;
      }

      setSquadPosts(prev => [data, ...prev].filter(p => !isMockPost(p)));
      localStorage.setItem('onestop_posts', JSON.stringify([data, ...squadPosts].filter(p => !isMockPost(p))));
      trackEvent('squad_post_created', {
        post_id: data.id,
        competition_name: postData.competition_name,
        spots: postData.spots_left,
        total_members: payload.total_members,
        skills_looking_for: postData.skills_looking_for || [],
        college: payload.college,
      });
      return data;
    }

    throw new Error('Backend database not connected.');
  };

  // Squad Post Editor (Strict Authentication & Ownership Required)
  const editSquadPost = async (postId, updatedData) => {
    if (!user) {
      throw new Error('Please sign in to edit your squad opening.');
    }

    const currentPost = squadPosts.find(p => p.id === postId);
    if (!currentPost) throw new Error('Squad post not found.');

    const acceptedEmails = Array.isArray(currentPost.accepted_emails) ? currentPost.accepted_emails : [];
    const spotsLeft = Number(updatedData.spots_left !== undefined ? updatedData.spots_left : (currentPost.spots_left || 1));
    const totalMembers = Number(updatedData.total_members !== undefined ? updatedData.total_members : (currentPost.total_members || 4));

    const updatePayload = {
      competition_name: updatedData.competition_name || currentPost.competition_name,
      competition_id: updatedData.competition_id !== undefined ? updatedData.competition_id : currentPost.competition_id,
      is_custom: updatedData.is_custom !== undefined ? Boolean(updatedData.is_custom) : currentPost.is_custom,
      expires_at: updatedData.expires_at !== undefined ? updatedData.expires_at : currentPost.expires_at,
      organizer: updatedData.organizer !== undefined ? updatedData.organizer : currentPost.organizer,
      competition_link: updatedData.competition_link !== undefined ? updatedData.competition_link : currentPost.competition_link,
      phone_number: updatedData.phone_number !== undefined ? updatedData.phone_number : currentPost.phone_number,
      comm_method: updatedData.comm_method !== undefined ? updatedData.comm_method : (currentPost.comm_method || 'whatsapp'),
      title: updatedData.title || currentPost.title,
      description: updatedData.description !== undefined ? updatedData.description : currentPost.description,
      skills_have: updatedData.skills_have !== undefined ? updatedData.skills_have : (currentPost.skills_have || []),
      skills_looking_for: updatedData.skills_looking_for !== undefined ? updatedData.skills_looking_for : (currentPost.skills_looking_for || []),
      total_members: totalMembers,
      spots_left: spotsLeft,
      initial_open_spots: spotsLeft + acceptedEmails.length,
      is_open: spotsLeft > 0,
      updated_at: new Date().toISOString()
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('squad_posts')
        .update(updatePayload)
        .eq('id', postId)
        .select()
        .single();

      if (error) {
        console.error('Error updating squad post in Supabase:', error);
        throw error;
      }

      trackEvent('squad_post_edited', {
        post_id: postId,
        competition_name: updatePayload.competition_name,
        spots_left: updatePayload.spots_left,
        total_members: updatePayload.total_members,
      });

      setSquadPosts(prev => prev.map(p => p.id === postId ? data : p));
      return data;
    }

    throw new Error('Backend database not connected.');
  };

  // Submit Application (Strict Authentication Required)
  const applyToSquad = async (appData) => {
    if (!user) {
      openAuthModal({
        title: 'Sign Up to Join this Squad',
        subtitle: 'Create your collegiate account to apply to join a squad and connect on WhatsApp.',
        initialTab: 'signup',
      });
      throw new Error('Please sign in to apply to this squad.');
    }

    const applicantName = appData.applicant_name || profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0];
    const applicantEmail = user.email;

    const payload = {
      post_id: appData.post_id,
      applicant_id: user.id,
      applicant_name: applicantName,
      applicant_email: applicantEmail,
      applicant_phone: appData.applicant_phone || profile?.phone || '',
      applicant_college: appData.applicant_college || profile?.college || '',
      applicant_course: appData.applicant_course || profile?.course || 'General',
      applicant_year: normalizeYear(appData.applicant_year || profile?.year || profile?.batch || ''),
      pitch_note: appData.pitch_note || '',
      highlighted_skills: appData.highlighted_skills || [],
      comm_method: appData.comm_method || 'whatsapp',
      status: 'pending',
    };

    if (supabase) {
      const { data, error } = await supabase
        .from('squad_applications')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error('Error submitting application to Supabase:', error);
        throw error;
      }

      const normalizedApp = {
        ...data,
        dir: 'out',
        postId: data.post_id,
        who: data.applicant_name,
        meta: data.applicant_college,
        applicant_name: data.applicant_name,
        applicant_college: data.applicant_college,
        applicant_year: data.applicant_year || '',
        applicant_course: data.applicant_course || '',
        skills: data.highlighted_skills || [],
        highlighted_skills: data.highlighted_skills || [],
        pitch: data.pitch_note,
        pitch_note: data.pitch_note,
        phone: data.applicant_phone,
        applicant_phone: data.applicant_phone,
        comm_method: data.comm_method || payload.comm_method || 'whatsapp'
      };

      setSquadApps(prev => [normalizedApp, ...prev].filter(a => !isMockApp(a)));
      localStorage.setItem('onestop_applications', JSON.stringify([normalizedApp, ...squadApps].filter(a => !isMockApp(a))));
      trackEvent('squad_apply_submitted', {
        post_id: appData.post_id,
        applicant_name: applicantName,
        skills_count: (appData.highlighted_skills || []).length,
      });
      return normalizedApp;
    }

    throw new Error('Backend database not connected.');
  };

  // Review Application (Accept / Decline / Remove / Re-apply)
  const updateApplicationStatus = async (appId, newStatus) => {
    let targetApp = squadApps.find(a => a.id === appId) || null;
    const prevApps = squadApps;
    const prevPosts = squadPosts;

    const applicantEmail = targetApp?.applicant_email;
    const targetPostId = targetApp?.post_id;
    const targetPost = squadPosts.find(p => p.id === targetPostId);

    // Optimistically update applications
    setSquadApps(prev =>
      prev.map(app => (app.id === appId ? { ...app, status: newStatus } : app))
    );

    // Optimistically update squad_posts if accepting or removing a member
    if (newStatus === 'accepted' && targetPost && applicantEmail) {
      setSquadPosts(prev =>
        prev.map(post => {
          if (post.id === targetPostId) {
            const currentAccepted = Array.isArray(post.accepted_emails) ? post.accepted_emails : [];
            const nextAccepted = currentAccepted.includes(applicantEmail) ? currentAccepted : [...currentAccepted, applicantEmail];
            const nextSpots = Math.max(0, (post.spots_left !== undefined ? post.spots_left : 1) - 1);
            return {
              ...post,
              spots_left: nextSpots,
              is_open: nextSpots > 0,
              accepted_emails: nextAccepted,
            };
          }
          return post;
        })
      );
    } else if (newStatus === 'removed' && targetPost && applicantEmail) {
      setSquadPosts(prev =>
        prev.map(post => {
          if (post.id === targetPostId) {
            const currentAccepted = Array.isArray(post.accepted_emails) ? post.accepted_emails : [];
            const nextAccepted = currentAccepted.filter(e => e !== applicantEmail);
            const nextSpots = Math.min(post.total_members || 4, (post.spots_left || 0) + 1);
            return {
              ...post,
              spots_left: nextSpots,
              is_open: true,
              accepted_emails: nextAccepted,
            };
          }
          return post;
        })
      );
    }

    trackEvent('squad_application_status_updated', {
      app_id: appId,
      status: newStatus,
      post_id: targetPostId,
    });

    if (supabase && user) {
      try {
        const { data: updatedApp, error: rpcErr } = await supabase.rpc('respond_to_application', {
          p_app_id: appId,
          p_status: newStatus,
        });

        if (rpcErr) throw rpcErr;

        if (updatedApp) {
          setSquadApps(prev =>
            prev.map(app =>
              app.id === appId
                ? {
                    ...app,
                    status: updatedApp.status,
                    lead_phone: updatedApp.lead_phone || '',
                    leadPhone: updatedApp.lead_phone || '',
                    updated_at: updatedApp.updated_at
                  }
                : app
            )
          );
        }
        await refreshSquadData();
      } catch (err) {
        console.error('Could not update status in Supabase, rolling back optimistic state:', err.message);
        setSquadApps(prevApps);
        setSquadPosts(prevPosts);
        throw err;
      }
    }
  };

  // Re-apply to a squad (resets status to pending)
  const reapplyToSquad = async (appId, updatePayload = {}) => {
    if (!user) throw new Error('Please sign in to re-apply.');
    const prevApps = squadApps;

    trackEvent('squad_application_reapplied', { app_id: appId });

    setSquadApps(prev =>
      prev.map(app =>
        app.id === appId
          ? { ...app, status: 'pending', ...updatePayload }
          : app
      )
    );

    if (supabase) {
      try {
        const { error } = await supabase
          .from('squad_applications')
          .update({
            status: 'pending',
            ...updatePayload,
          })
          .eq('id', appId);

        if (error) throw error;
      } catch (err) {
        setSquadApps(prevApps);
        throw err;
      }
    }
  };

  // Toggle open/closed status of a squad post
  const togglePostOpen = async (postId, currentIsOpen) => {
    const nextIsOpen = !currentIsOpen;
    trackEvent('squad_post_visibility_toggled', { post_id: postId, is_open: nextIsOpen });
    setSquadPosts(prev =>
      prev.map(post => (post.id === postId ? { ...post, is_open: nextIsOpen } : post))
    );

    if (supabase && user) {
      try {
        const { error } = await supabase
          .from('squad_posts')
          .update({ is_open: nextIsOpen })
          .eq('id', postId);
        if (error) throw error;
      } catch (err) {
        console.error('Could not toggle post open status:', err);
        refreshSquadData();
      }
    }
  };

  // Delete a squad post
  const deleteSquadPost = async (postId) => {
    trackEvent('squad_post_deleted', { post_id: postId });
    setSquadPosts(prev => prev.filter(p => p.id !== postId));
    setSquadApps(prev => prev.filter(a => a.post_id !== postId));

    if (supabase && user) {
      try {
        const { error } = await supabase
          .from('squad_posts')
          .delete()
          .eq('id', postId);
        if (error) throw error;
      } catch (err) {
        console.error('Could not delete squad post:', err);
        refreshSquadData();
      }
    }
  };

  // Withdraw / Delete an application from Supabase
  const withdrawApplication = async (appId) => {
    trackEvent('squad_application_withdrawn', { app_id: appId });
    setSquadApps(prev => prev.filter(a => a.id !== appId));
    if (supabase && user) {
      try {
        const { error } = await supabase
          .from('squad_applications')
          .delete()
          .eq('id', appId);
        if (error) throw error;
      } catch (err) {
        console.error('Could not withdraw application from Supabase:', err);
        refreshSquadData();
      }
    }
  };

  // Cross-device Notification States Actions (Read & Dismissed)
  const markNotificationRead = useCallback(async (notifId) => {
    const sId = String(notifId);
    setNotificationStates(prev => {
      const next = { ...prev, [sId]: { ...(prev[sId] || {}), is_read: true } };
      localStorage.setItem('onestop_user_notification_states', JSON.stringify(next));
      return next;
    });

    const activeUser = userRef.current;
    if (supabase && activeUser?.id) {
      try {
        await supabase
          .from('user_notification_states')
          .upsert({
            user_id: activeUser.id,
            notification_id: sId,
            is_read: true,
            is_dismissed: false,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,notification_id' });
      } catch (err) {
        console.warn('Sync notification read error:', err.message);
      }
    }
  }, []);

  const markAllNotificationsRead = useCallback(async (notifIds = []) => {
    if (!notifIds || !notifIds.length) return;
    setNotificationStates(prev => {
      const next = { ...prev };
      notifIds.forEach(id => {
        const sId = String(id);
        next[sId] = { ...(next[sId] || {}), is_read: true };
      });
      localStorage.setItem('onestop_user_notification_states', JSON.stringify(next));
      return next;
    });

    const activeUser = userRef.current;
    if (supabase && activeUser?.id) {
      try {
        const rows = notifIds.map(id => ({
          user_id: activeUser.id,
          notification_id: String(id),
          is_read: true,
          is_dismissed: false,
          updated_at: new Date().toISOString()
        }));
        await supabase
          .from('user_notification_states')
          .upsert(rows, { onConflict: 'user_id,notification_id' });
      } catch (err) {
        console.warn('Sync all notifications read error:', err.message);
      }
    }
  }, []);

  const dismissNotification = useCallback(async (notifId) => {
    const sId = String(notifId);
    setNotificationStates(prev => {
      const next = { ...prev, [sId]: { ...(prev[sId] || {}), is_dismissed: true, is_read: true } };
      localStorage.setItem('onestop_user_notification_states', JSON.stringify(next));
      return next;
    });

    const activeUser = userRef.current;
    if (supabase && activeUser?.id) {
      try {
        await supabase
          .from('user_notification_states')
          .upsert({
            user_id: activeUser.id,
            notification_id: sId,
            is_read: true,
            is_dismissed: true,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,notification_id' });
      } catch (err) {
        console.warn('Sync notification dismiss error:', err.message);
      }
    }
  }, []);

  const dismissAllNotifications = useCallback(async (notifIds = []) => {
    if (!Array.isArray(notifIds) || notifIds.length === 0) return;
    setNotificationStates(prev => {
      const next = { ...prev };
      notifIds.forEach(id => {
        const sId = String(id);
        next[sId] = { ...(next[sId] || {}), is_dismissed: true, is_read: true };
      });
      localStorage.setItem('onestop_user_notification_states', JSON.stringify(next));
      return next;
    });

    const activeUser = userRef.current;
    if (supabase && activeUser?.id) {
      try {
        const rows = notifIds.map(id => ({
          user_id: activeUser.id,
          notification_id: String(id),
          is_read: true,
          is_dismissed: true,
          updated_at: new Date().toISOString()
        }));
        await supabase
          .from('user_notification_states')
          .upsert(rows, { onConflict: 'user_id,notification_id' });
      } catch (err) {
        console.warn('Sync all notifications dismiss error:', err.message);
      }
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        authLoading,
        authModalOpen,
        authModalConfig,
        openAuthModal,
        closeAuthModal,
        profileModalOpen,
        openProfileModal,
        closeProfileModal,
        recoveryModalOpen,
        openRecoveryModal,
        closeRecoveryModal,
        updateProfile,
        getProfileCooldown,
        PROFILE_COOLDOWN_MS,
        signInWithGoogle,
        signInWithPassword,
        signUpWithPassword,
        signOut,
        resetPassword,
        resendVerificationEmail,
        changePassword,
        deleteAccount,
        theme: 'light',
        toggleTheme: () => {},
        bookmarks,
        toggleBookmark,
        isBookmarked,
        squadPosts,
        squadApps,
        createSquadPost,
        editSquadPost,
        applyToSquad,
        updateApplicationStatus,
        withdrawApplication,
        reapplyToSquad,
        togglePostOpen,
        deleteSquadPost,
        refreshSquadData,
        notificationStates,
        markNotificationRead,
        markAllNotificationsRead,
        dismissNotification,
        dismissAllNotifications,
        hasSupabase: hasValidCredentials,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
