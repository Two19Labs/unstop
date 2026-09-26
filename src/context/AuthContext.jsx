import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, hasValidCredentials } from '../lib/supabaseClient';
import { normalizeYear } from '../data/colleges';
import { isMockPost, isMockApp, isMockBookmark } from '../data/initialData';
import { identifyUser, setPersonProperties, resetUser, trackEvent } from '../lib/posthog';

const AuthContext = createContext(null);

export const PROFILE_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export function getProfileCooldown(profile, user) {
  const lastUpdated =
    profile?.profile_last_updated_at ||
    user?.user_metadata?.profile_last_updated_at ||
    (user?.id ? localStorage.getItem(`onestop_profile_last_updated_${user.id}`) : null);

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

  // UI / Theme State
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('onestop_theme');
      if (saved) return saved;
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (e) {}
    return 'light';
  });

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

  // 1. Sync Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('onestop_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Column projections to minimize Supabase egress
  const SQUAD_POSTS_SELECT = 'id, user_id, created_by_name, created_by_email, competition_name, organizer, competition_link, phone_number, title, description, skills_have, skills_looking_for, total_members, spots_left, initial_open_spots, is_open, college, course, year, accepted_emails, created_at, updated_at';
  const SQUAD_APPS_SELECT = 'id, post_id, applicant_id, applicant_name, applicant_email, applicant_phone, applicant_college, applicant_course, applicant_year, pitch_note, highlighted_skills, status, lead_phone, created_at, updated_at';
  const PROFILE_SELECT = 'id, email, full_name, college, course, year, phone, bio, education_level, profile_last_updated_at';

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
      const localLastUpdated = localStorage.getItem(`onestop_profile_last_updated_${userId}`);
      const lastUpdatedAt = data?.profile_last_updated_at || meta?.profile_last_updated_at || localLastUpdated || null;
      const educationLevel = data?.education_level || meta?.education_level || 'undergraduate';
      const resolvedProfile = data ? {
        ...data,
        education_level: educationLevel,
        course: data.course || meta.course || '',
        year: data.year || meta.year || 'UG 2nd Year',
        bio: data.bio || meta.bio || '',
        profile_last_updated_at: lastUpdatedAt,
      } : (meta.full_name ? {
        id: userId,
        email: activeUser?.email,
        full_name: meta.full_name,
        education_level: educationLevel,
        college: meta.college || '',
        phone: meta.phone || '',
        course: meta.course || '',
        year: meta.year || 'UG 2nd Year',
        bio: meta.bio || '',
        profile_last_updated_at: lastUpdatedAt,
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

        // Fetch squad posts with column projection and row limit
        const { data: posts, error: postErr } = await supabase
          .from('squad_posts')
          .select(SQUAD_POSTS_SELECT)
          .order('created_at', { ascending: false })
          .limit(60);

        if (!postErr && Array.isArray(posts)) {
          const cleanPosts = posts.filter(p => !isMockPost(p));
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
            .limit(50);

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
                  applicant_year: a.applicant_year || 'UG 2nd Year',
                  applicant_course: a.applicant_course || '',
                  skills: a.highlighted_skills || [],
                  highlighted_skills: a.highlighted_skills || [],
                  pitch: a.pitch_note,
                  pitch_note: a.pitch_note,
                  phone: a.applicant_phone,
                  applicant_phone: a.applicant_phone,
                  leadPhone: a.lead_phone || '',
                  lead_phone: a.lead_phone || ''
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
      }
      setAuthLoading(false);
    }).catch((err) => {
      console.error('Session retrieval error:', err);
      if (isMounted) setAuthLoading(false);
    });

    // Listen for auth state changes (login, logout, oauth callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!isMounted) return;
        setSession(newSession);
        const currentUser = newSession?.user || null;
        setUser(currentUser);
        userRef.current = currentUser;

        if (currentUser) {
          identifyUser(currentUser.id, { email: currentUser.email });
          await fetchUserProfile(currentUser.id, currentUser);
          await fetchUserBookmarks(currentUser.id);
          await fetchNotificationStates(currentUser.id);
          refreshSquadData(currentUser, true);
        } else {
          resetUser();
          setProfile(null);
          setBookmarks([]);
          setSquadApps([]);
          setNotificationStates({});
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

    // Realtime Postgres changes subscription across devices
    const channel = supabase
      .channel('public:app_realtime_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'squad_posts' }, () => {
        scheduleDebouncedSync();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'squad_applications' }, () => {
        scheduleDebouncedSync();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookmarks' }, () => {
        if (userRef.current?.id) fetchUserBookmarks(userRef.current.id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_notification_states' }, () => {
        if (userRef.current?.id) fetchNotificationStates(userRef.current.id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        if (userRef.current?.id) fetchUserProfile(userRef.current.id);
      })
      .subscribe();

    // Visibility-gated polling fallback: 3-minute interval (180,000ms), paused when document is hidden
    const pollInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      refreshSquadData();
      if (userRef.current?.id) {
        fetchUserBookmarks(userRef.current.id);
        fetchNotificationStates(userRef.current.id);
      }
    }, 180000);

    // Tab focus / visibility revalidation: only refresh when returning after > 60s
    let lastVisibilitySync = Date.now();
    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        const now = Date.now();
        if (now - lastVisibilitySync > 60000) {
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
  }, [refreshSquadData, fetchUserBookmarks, fetchNotificationStates, fetchUserProfile]);

  // 6. Local Storage Sync Fallback
  useEffect(() => {
    localStorage.setItem('onestop_bookmarks', JSON.stringify(bookmarks.filter(b => !isMockBookmark(b))));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem('onestop_posts', JSON.stringify(squadPosts.filter(p => !isMockPost(p))));
  }, [squadPosts]);

  useEffect(() => {
    localStorage.setItem('onestop_applications', JSON.stringify(squadApps.filter(a => !isMockApp(a))));
  }, [squadApps]);

  // Modal Open/Close Controls
  const openAuthModal = (options = {}) => {
    setAuthModalConfig({
      title: options.title || 'Sign in to OneStop',
      subtitle: options.subtitle || 'Access teammate matching, squad recruitment, and WhatsApp coordination.',
      initialTab: options.initialTab || 'signin',
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
    userRef.current = null;
    setUser(null);
    setSession(null);
    setProfile(null);
    setBookmarks([]);
    setSquadApps([]);
    try {
      localStorage.removeItem('onestop_applications');
      localStorage.removeItem('onestop_bookmarks');
    } catch (e) {}
  };

  const resetPassword = async (email) => {
    if (!supabase) {
      throw new Error('Supabase credentials missing. Check your .env file or SUPABASE_SETUP.md.');
    }
    trackEvent('auth_password_reset_requested');
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
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
    if (!supabase || !user) {
      throw new Error('You must be signed in to change your password.');
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters.');
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

  const deleteAccount = async () => {
    if (!supabase || !user) {
      throw new Error('You must be signed in to delete your account.');
    }
    trackEvent('auth_account_deletion_attempted');
    const userId = user.id;

    // 1. Try deleting via RPC if available
    let rpcSuccess = false;
    try {
      const { error: rpcErr } = await supabase.rpc('delete_user_account');
      if (!rpcErr) {
        rpcSuccess = true;
      }
    } catch (e) {}

    // 2. Cascade delete from user-owned public tables
    if (!rpcSuccess) {
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
        await supabase.from('profiles').delete().eq('id', userId);
      } catch (e) {}
    }

    trackEvent('auth_account_deletion_success');
    await signOut();
  };

  // Profile Update (Database & Auth Metadata)
  const updateProfile = async ({ fullName, college, course, year, phone, bio, education_level, skills }) => {
    if (!user || !supabase) {
      throw new Error('You must be signed in to update your profile.');
    }

    // 1. Enforce 24-Hour Cooldown
    const cooldown = getProfileCooldown(profile, user);
    if (cooldown.isLocked) {
      throw new Error(`Profile details can only be updated once every 24 hours. Cooldown remaining: ${cooldown.remainingFormatted}.`);
    }

    const cleanPhone = sanitizeIndianPhone(phone);
    const trimmedName = (fullName || '').trim();
    const trimmedCollege = (college || '').trim();
    const trimmedCourse = (course || '').trim();
    const selectedYear = normalizeYear(year);
    const trimmedBio = (bio || '').trim();
    const selectedEducationLevel = selectedYear.startsWith('PG') || (education_level || profile?.education_level || user?.user_metadata?.education_level || 'undergraduate').toLowerCase().includes('post')
      ? 'postgraduate'
      : 'undergraduate';
    const cleanSkills = Array.isArray(skills) ? skills : (profile?.skills || []);

    // Check if any field has actually changed
    const prevName = (profile?.full_name || user?.user_metadata?.full_name || '').trim();
    const prevCollege = (profile?.college || user?.user_metadata?.college || '').trim();
    const prevCourse = (profile?.course || user?.user_metadata?.course || '').trim();
    const prevYear = normalizeYear(profile?.year || user?.user_metadata?.year);
    const prevPhone = sanitizeIndianPhone(profile?.phone || user?.user_metadata?.phone || '');
    const prevBio = (profile?.bio || user?.user_metadata?.bio || '').trim();
    const prevEducationLevel = prevYear.startsWith('PG') || (profile?.education_level || user?.user_metadata?.education_level || 'undergraduate').toLowerCase().includes('post')
      ? 'postgraduate'
      : 'undergraduate';
    const prevSkills = Array.isArray(profile?.skills) ? profile.skills : (Array.isArray(user?.user_metadata?.skills) ? user.user_metadata.skills : []);
    const skillsChanged = JSON.stringify(prevSkills.slice().sort()) !== JSON.stringify(cleanSkills.slice().sort());

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
    if (!hasChanged && (profile?.profile_last_updated_at || user?.user_metadata?.profile_last_updated_at)) {
      return profile;
    }

    const nowIso = new Date().toISOString();

    // 2. Update Supabase Auth user metadata
    const { error: authErr } = await supabase.auth.updateUser({
      data: {
        full_name: trimmedName,
        college: trimmedCollege,
        course: trimmedCourse,
        year: selectedYear,
        education_level: selectedEducationLevel,
        phone: cleanPhone,
        bio: trimmedBio,
        skills: cleanSkills,
        profile_last_updated_at: nowIso,
      },
    });

    if (authErr) throw authErr;

    // 3. Persist timestamp to localStorage for immediate resilience
    try {
      localStorage.setItem(`onestop_profile_last_updated_${user.id}`, nowIso);
    } catch (e) {}

    // 4. Update PostgreSQL profiles table (upsert to create if missing)
    const profileRecord = {
      id: user.id,
      email: user.email,
      full_name: trimmedName,
      college: trimmedCollege,
      course: trimmedCourse,
      year: selectedYear,
      education_level: selectedEducationLevel,
      phone: cleanPhone,
      bio: trimmedBio,
      skills: cleanSkills,
      profile_last_updated_at: nowIso,
      updated_at: nowIso,
    };

    try {
      const { error: upsertErr } = await supabase
        .from('profiles')
        .upsert(profileRecord, { onConflict: 'id' });

      if (upsertErr) {
        console.warn('Full profile upsert error, attempting standard fields:', upsertErr.message);
        // Fallback omitting education_level if the column does not yet exist in PostgreSQL table
        await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            full_name: trimmedName,
            college: trimmedCollege,
            course: trimmedCourse,
            year: selectedYear,
            phone: cleanPhone,
            bio: trimmedBio,
            skills: cleanSkills,
            profile_last_updated_at: nowIso,
            updated_at: nowIso,
          }, { onConflict: 'id' });
      }
    } catch (err) {
      console.warn('Profile DB save caught error:', err.message);
    }

    const merged = {
      ...(profile || {}),
      id: user.id,
      email: user.email,
      full_name: trimmedName,
      college: trimmedCollege,
      course: trimmedCourse,
      year: selectedYear,
      education_level: selectedEducationLevel,
      phone: cleanPhone,
      bio: trimmedBio,
      profile_last_updated_at: nowIso,
      updated_at: nowIso,
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

  // Bookmark Toggle with Live Database Sync (String-Normalized IDs)
  const toggleBookmark = async (compId) => {
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
    if (supabase && user) {
      try {
        if (isCurrentlySaved) {
          await supabase
            .from('bookmarks')
            .delete()
            .eq('user_id', user.id)
            .eq('comp_id', sCompId);
        } else {
          await supabase
            .from('bookmarks')
            .insert([{ user_id: user.id, comp_id: sCompId }]);
        }
      } catch (err) {
        console.warn('Could not sync bookmark to Supabase:', err.message);
      }
    }
  };

  const isBookmarked = (compId) => bookmarks.some(id => String(id) === String(compId));

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
      applicant_year: normalizeYear(appData.applicant_year || profile?.year || profile?.batch || 'UG 2nd Year'),
      pitch_note: appData.pitch_note || '',
      highlighted_skills: appData.highlighted_skills || [],
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
        applicant_year: data.applicant_year || 'UG 2nd Year',
        applicant_course: data.applicant_course || '',
        skills: data.highlighted_skills || [],
        highlighted_skills: data.highlighted_skills || [],
        pitch: data.pitch_note,
        pitch_note: data.pitch_note,
        phone: data.applicant_phone,
        applicant_phone: data.applicant_phone
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
        updateProfile,
        getProfileCooldown,
        PROFILE_COOLDOWN_MS,
        signInWithGoogle,
        signInWithPassword,
        signUpWithPassword,
        signOut,
        resetPassword,
        changePassword,
        deleteAccount,
        theme,
        toggleTheme,
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
