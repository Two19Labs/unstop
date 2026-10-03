import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, hasValidCredentials, openedFromRecoveryLink } from '../lib/supabaseClient';
import { normalizeYear } from '../data/colleges';
import { isMockPost, isMockApp, isMockBookmark } from '../data/initialData';
import { identifyUser, setPersonProperties, resetUser, trackEvent } from '../lib/posthog';
import { purgeUserStorage } from '../lib/storage';

const AuthContext = createContext(null);

export const PROFILE_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

// The database owns profile_last_updated_at (see PROFILE_COOLDOWN_AND_PRIVACY_MIGRATION.sql).
export function getProfileCooldown(profile, user) {
  const lastUpdated = profile?.profile_last_updated_at || null;

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

// WhatsApp numbers are strictly 10 digits starting with 6-9 (same rule as the database)
export function isValidIndianPhone(raw) {
  return /^[6-9]\d{9}$/.test(String(raw || ''));
}

// Input handler for every WhatsApp number box: digits only, max 10. A pasted
// "+91 98765 43210" or "098765..." is trimmed to the 10-digit number.
export function cleanPhoneInput(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length > 10) return sanitizeIndianPhone(digits);
  return digits;
}

export function phoneValidationError(raw) {
  const digits = String(raw || '');
  if (!digits) return 'Please enter your 10-digit WhatsApp number.';
  if (digits.length !== 10) return 'WhatsApp number must be exactly 10 digits.';
  if (!isValidIndianPhone(digits)) return 'Enter a valid mobile number (starts with 6, 7, 8 or 9).';
  return '';
}

export function formatWhatsAppUrl(phone, textMessage = '') {
  const cleanPhone = sanitizeIndianPhone(phone);
  if (!isValidIndianPhone(cleanPhone)) return '#';
  return `https://wa.me/91${cleanPhone}${textMessage ? `?text=${encodeURIComponent(textMessage)}` : ''}`;
}

// Active squads shown on the board (expired ones are kept in the DB but hidden)
const SQUAD_POSTS_LIMIT = 500;
const SQUAD_APPS_LIMIT = 1000;

// applicantPhones: numbers the host may see (WhatsApp-mode squads only), looked up
// live from profiles by get_my_applicants_whatsapp(). Never stored on the row.
export function normalizeSquadApp(a, userId, applicantPhones = null) {
  const isApplicant = a.applicant_id === userId;
  const applicantPhone = (!isApplicant && applicantPhones?.get(String(a.id))) || '';
  return {
    ...a,
    dir: isApplicant ? 'out' : 'in',
    postId: a.post_id,
    who: a.applicant_name,
    meta: a.applicant_college,
    applicant_name: a.applicant_name,
    applicant_college: a.applicant_college,
    applicant_year: a.applicant_year || '',
    skills: a.highlighted_skills || [],
    highlighted_skills: a.highlighted_skills || [],
    pitch: a.pitch_note,
    pitch_note: a.pitch_note,
    phone: applicantPhone,
    applicant_phone: applicantPhone,
    comm_method: a.comm_method || 'whatsapp'
  };
}

// Squads never carry a phone number: the host's WhatsApp number is fetched on tap
// with getHostWhatsApp() (WhatsApp-mode squads, signed-in users only).
function normalizeSquadPost(p, contacts) {
  const contact = contacts.get(String(p.id));
  const acceptedCount = p.accepted_count ?? (Array.isArray(p.accepted_emails) ? p.accepted_emails.length : 0);
  return {
    ...p,
    compId: p.competition_id || p.compId,
    comm_method: p.comm_method === 'chat' ? 'chat' : 'whatsapp',
    accepted_count: Number(acceptedCount) || 0,
    phone_number: '',
    created_by_email: contact ? (contact.created_by_email || '') : (p.created_by_email || ''),
  };
}

export function normalizeConversation(c, userId) {
  const isHost = c.host_id === userId;
  return {
    ...c,
    post_id: String(c.post_id),
    role: isHost ? 'host' : 'member',
    otherName: isHost ? (c.member_name || 'Student') : (c.host_name || 'Squad host'),
  };
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
  // Set when an emailed auth link is expired/already used; the recovery modal
  // then explains it and offers to send a fresh link.
  const [recoveryLinkError, setRecoveryLinkError] = useState(null);
  const openRecoveryModal = () => setRecoveryModalOpen(true);
  const closeRecoveryModal = () => {
    setRecoveryModalOpen(false);
    setRecoveryLinkError(null);
  };

  // Bookmarks State (100% real, zero mock data)
  const [bookmarks, setBookmarks] = useState([]);

  // Squad Posts State (100% real, zero mock data)
  const [squadPosts, setSquadPosts] = useState([]);

  // Squad Applications State (100% real, zero mock data)
  const [squadApps, setSquadApps] = useState([]);

  // Chat-mode conversations the user is part of (as host or as the person asking)
  const [squadConversations, setSquadConversations] = useState([]);

  // Notification States (Cloud-synced across devices via Supabase user_notification_states)
  const [notificationStates, setNotificationStates] = useState({});

  // Chat message notifications created by the database (user_notifications)
  const [messageNotifications, setMessageNotifications] = useState([]);

  // Admin access is decided by the database (app_admins / is_admin())
  const [isAdmin, setIsAdmin] = useState(false);

  // Enforce Light Theme & purge legacy dark mode state
  useEffect(() => {
    try {
      localStorage.removeItem('onestop_theme');
      document.documentElement.setAttribute('data-theme', 'light');
    } catch (e) {}
  }, []);

  // Column projections to minimize Supabase egress
  // Private squad details used to merge realtime post updates
  const postContactsRef = useRef(new Map());
  const SQUAD_APPS_SELECT = 'id, post_id, applicant_id, applicant_name, applicant_email, applicant_college, applicant_year, pitch_note, highlighted_skills, status, comm_method, created_at, updated_at';
  const PROFILE_SELECT = 'id, email, full_name, college, year, phone, bio, education_level, skills, profile_last_updated_at';

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
      const resolvedProfile = data ? {
        ...data,
        full_name: data.full_name || '',
        education_level: data.education_level || '',
        college: data.college || '',
        phone: data.phone || '',
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
      }
    } catch (err) {
      console.warn('Notification states fetch error:', err.message);
    }
  }, []);

  const fetchMessageNotifications = useCallback(async (userId) => {
    if (!supabase || !userId) return;
    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('id, type, title, message, link, data, created_at')
        .eq('type', 'new_message')
        .order('created_at', { ascending: false })
        .limit(30);
      if (!error && Array.isArray(data)) setMessageNotifications(data);
    } catch (err) {
      console.warn('Message notifications fetch error:', err.message);
    }
  }, []);

  const fetchIsAdmin = useCallback(async (userId) => {
    if (!supabase || !userId) {
      setIsAdmin(false);
      return;
    }
    try {
      const { data, error } = await supabase.rpc('is_admin');
      setIsAdmin(!error && data === true);
    } catch (e) {
      setIsAdmin(false);
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
        const activeUser = targetUser || userRef.current;
        const userId = activeUser?.id || null;

        const [publicRes, mineRes, contactsRes, appsRes, phonesRes, convRes] = await Promise.all([
          supabase
            .from('squad_posts')
            .select('*')
            .or(`expires_at.is.null,expires_at.gt."${new Date().toISOString()}"`)
            .order('created_at', { ascending: false })
            .limit(SQUAD_POSTS_LIMIT),
          userId ? supabase.from('squad_posts').select('*').eq('user_id', userId) : null,
          userId ? supabase.from('squad_post_contacts').select('post_id, phone_number, created_by_email').eq('user_id', userId) : null,
          userId
            ? supabase.from('squad_applications').select(SQUAD_APPS_SELECT).order('created_at', { ascending: false }).limit(SQUAD_APPS_LIMIT)
            : null,
          userId ? supabase.rpc('get_my_applicants_whatsapp') : null,
          userId
            ? supabase.from('squad_conversations').select('*').order('updated_at', { ascending: false }).limit(SQUAD_APPS_LIMIT)
            : null,
        ]);

        if (publicRes.error) throw publicRes.error;

        const applicantPhones = new Map(
          (!phonesRes?.error && Array.isArray(phonesRes?.data) ? phonesRes.data : [])
            .map(row => [String(row.application_id), row.phone || ''])
        );
        const apps = userId && !appsRes?.error && Array.isArray(appsRes?.data)
          ? appsRes.data.filter(a => !isMockApp(a)).map(a => normalizeSquadApp(a, userId, applicantPhones))
          : [];

        const contacts = new Map((contactsRes?.data || []).map(c => [String(c.post_id), c]));
        postContactsRef.current = contacts;

        if (userId && !convRes?.error && Array.isArray(convRes?.data)) {
          setSquadConversations(convRes.data.map(c => normalizeConversation(c, userId)));
        } else if (!userId) {
          setSquadConversations([]);
        }

        const byId = new Map();
        [...(publicRes.data || []), ...(mineRes?.data || [])].forEach(post => byId.set(post.id, post));

        // Squads the user applied to stay visible to them even after they expire
        const missingIds = [...new Set(apps.map(a => a.post_id))].filter(id => id && !byId.has(id));
        if (missingIds.length > 0) {
          const { data: extra } = await supabase.from('squad_posts').select('*').in('id', missingIds);
          (extra || []).forEach(post => byId.set(post.id, post));
        }

        const cleanPosts = [...byId.values()]
          .filter(post => !isMockPost(post))
          .sort((x, y) => new Date(y.created_at) - new Date(x.created_at))
          .map(post => normalizeSquadPost(post, contacts));

        setSquadPosts(cleanPosts);
        setSquadApps(userId ? apps : []);
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

    // Emailed auth links. Recovery emails link to ?token_hash=...&type=recovery
    // and are verified here in the browser, so email security scanners that
    // pre-open links can't use up the one-time token before the user clicks.
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get('token_hash');
      const linkType = params.get('type');
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const linkErrorCode = hashParams.get('error_code') || params.get('error_code');

      if (tokenHash && linkType === 'recovery') {
        window.history.replaceState(null, '', window.location.pathname);
        supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' }).then(({ error }) => {
          // No isMounted guard: the URL is cleared above, so a StrictMode re-run
          // can't verify again and this first result must still be shown.
          if (error) {
            trackEvent('auth_recovery_link_failed', { error: error.message });
            setRecoveryLinkError('This password link has expired or was already used.');
          }
          setRecoveryModalOpen(true);
        });
      } else if (linkErrorCode) {
        trackEvent('auth_email_link_error', { error_code: linkErrorCode });
        window.history.replaceState(null, '', window.location.pathname);
        setRecoveryLinkError(
          linkErrorCode === 'otp_expired'
            ? 'This email link has expired or was already used.'
            : hashParams.get('error_description') || 'This email link is not valid.'
        );
        setRecoveryModalOpen(true);
      }
    }

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
        fetchMessageNotifications(currentUser.id);
        fetchIsAdmin(currentUser.id);
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
      }
      if (openedFromRecoveryLink && currentSession) {
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
          fetchMessageNotifications(currentUser.id);
          fetchIsAdmin(currentUser.id);
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
          setSquadConversations([]);
          setNotificationStates({});
          setMessageNotifications([]);
          setIsAdmin(false);
          if (event === 'SIGNED_OUT') purgeUserStorage();
        }
        setAuthLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchUserProfile, fetchUserBookmarks, fetchNotificationStates, fetchMessageNotifications, fetchIsAdmin, refreshSquadData]);

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

    // All clients listen to squad_posts changes and patch the one row that changed
    realtimeBuilder = realtimeBuilder.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'squad_posts' },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          const deletedId = payload.old?.id;
          if (deletedId) setSquadPosts(prev => prev.filter(p => p.id !== deletedId));
          return;
        }
        const row = payload.new;
        if (!row?.id || isMockPost(row)) return;
        const next = normalizeSquadPost(row, postContactsRef.current);
        setSquadPosts(prev => {
          const idx = prev.findIndex(p => p.id === row.id);
          if (idx === -1) return [next, ...prev];
          const copy = [...prev];
          copy[idx] = {
            ...prev[idx],
            ...next,
            created_by_email: next.created_by_email || prev[idx].created_by_email || '',
          };
          return copy;
        });
        // The host's own squad changed (e.g. WhatsApp <-> chat): re-check which
        // applicant numbers they may see
        if (activeUserId && row.user_id === activeUserId) {
          scheduleDebouncedSync();
        }
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
          { event: '*', schema: 'public', table: 'squad_conversations' },
          (payload) => {
            const row = payload.new;
            if (payload.eventType === 'DELETE' || !row?.id) {
              const goneId = payload.old?.id;
              if (goneId) setSquadConversations(prev => prev.filter(c => c.id !== goneId));
              return;
            }
            if (row.host_id !== activeUserId && row.member_id !== activeUserId) return;
            const next = normalizeConversation(row, activeUserId);
            setSquadConversations(prev => [next, ...prev.filter(c => c.id !== next.id)]);
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
            table: 'user_notifications',
            filter: `user_id=eq.${activeUserId}`
          },
          () => {
            fetchMessageNotifications(activeUserId);
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
  }, [user, refreshSquadData, fetchUserBookmarks, fetchNotificationStates, fetchMessageNotifications, fetchUserProfile]);

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

  // Google Identity Services flow: exchange the ID token from Google's own
  // button for a Supabase session (keeps the Google popup on our domain).
  const signInWithGoogleIdToken = async (idToken, nonce) => {
    if (!supabase) {
      throw new Error('Supabase credentials missing. Check your .env file or SUPABASE_SETUP.md.');
    }
    trackEvent('auth_google_initiated', { method: 'id_token' });
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
      nonce,
    });
    if (error) {
      trackEvent('auth_google_failed', { method: 'id_token', error: error.message });
      throw error;
    }
    trackEvent('auth_sign_in_success', { method: 'google_id_token' });
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
    const cleanPhone = sanitizeIndianPhone(phone);
    const phoneError = phoneValidationError(cleanPhone);
    if (phoneError) throw new Error(phoneError);
    trackEvent('auth_sign_up_attempted', { college });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
          college: college || '',
          phone: cleanPhone,
        },
      },
    });
    if (error) {
      trackEvent('auth_sign_up_failed', { error: error.message });
      throw error;
    }
    trackEvent('auth_sign_up_success', { college, hasPhone: true });
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
    setSquadConversations([]);
    setNotificationStates({});
    setMessageNotifications([]);
    setIsAdmin(false);
    purgeUserStorage();
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

    // 2. Perform account deletion via RPC
    const { error: rpcErr } = await supabase.rpc('delete_user_account');
    if (rpcErr) {
      // Never report success unless the login itself was deleted server-side
      console.warn('Account deletion RPC issue:', rpcErr);
      trackEvent('auth_account_deletion_failed', { error: rpcErr.message });
      throw new Error('We could not delete your account right now. Nothing was removed. Please try again later.');
    }

    trackEvent('auth_account_deletion_success');
    await signOut();
  };

  // Profile Update (Database & Auth Metadata)
  const updateProfile = async ({ fullName, college, year, phone, bio, education_level, skills }) => {
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
    const phoneError = phoneValidationError(cleanPhone);
    if (phoneError) throw new Error(phoneError);
    const trimmedName = (fullName || '').trim();
    const trimmedCollege = (college || '').trim();
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
      if (saveErr.hint === 'INVALID_PHONE') {
        throw new Error('Please enter a valid 10-digit WhatsApp number.');
      }
      if (saveErr.hint === 'PROFILE_COOLDOWN') {
        // Another tab/device saved first: adopt the server's timestamp so the lock UI shows
        const serverLastUpdated = saveErr.details || new Date().toISOString();
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
    return merged;
  };

  // Adds a missing WhatsApp number (the required-number prompt). The database lets
  // this through without starting the 24-hour profile cooldown.
  const saveWhatsAppNumber = async (rawPhone) => {
    if (!user || !supabase) throw new Error('You must be signed in.');
    const cleanPhone = sanitizeIndianPhone(rawPhone);
    const phoneError = phoneValidationError(cleanPhone);
    if (phoneError) throw new Error(phoneError);

    let { data: saved, error } = await supabase
      .from('profiles')
      .update({ phone: cleanPhone })
      .eq('id', user.id)
      .select(PROFILE_SELECT)
      .maybeSingle();

    if (!error && !saved) {
      ({ data: saved, error } = await supabase
        .from('profiles')
        .insert({ id: user.id, email: user.email, phone: cleanPhone })
        .select(PROFILE_SELECT)
        .single());
    }

    if (error) {
      if (error.hint === 'PROFILE_COOLDOWN') {
        throw new Error('Your profile was edited in the last 24 hours. Please try again later.');
      }
      throw new Error(error.hint === 'INVALID_PHONE'
        ? 'Please enter a valid 10-digit WhatsApp number.'
        : (error.message || 'Could not save your number. Please try again.'));
    }

    setProfile(prev => ({ ...(prev || {}), ...(saved || {}), phone: cleanPhone }));
    trackEvent('profile_phone_added');
    return cleanPhone;
  };

  // Host's WhatsApp number for a WhatsApp-mode squad (signed-in users only)
  const getHostWhatsApp = async (postId) => {
    if (!supabase || !user) throw new Error('Please sign in to contact the squad host.');
    const { data, error } = await supabase.rpc('get_squad_host_whatsapp', { p_post_id: postId });
    if (error) throw new Error(error.message || 'Could not get the host’s number.');
    return data || '';
  };

  // ── Chat-mode conversations ──────────────────────────────────────────────
  const upsertConversation = (row) => {
    if (!row?.id) return null;
    const next = normalizeConversation(row, user?.id);
    setSquadConversations(prev => [next, ...prev.filter(c => c.id !== next.id)]);
    return next;
  };

  const requestSquadChat = async (postId, intro) => {
    if (!user) throw new Error('Please sign in to chat with the squad host.');
    const { data, error } = await supabase.rpc('request_squad_chat', { p_post_id: postId, p_intro: intro });
    if (error) throw new Error(error.message || 'Could not send your chat request.');
    trackEvent('squad_chat_requested', { post_id: postId });
    return upsertConversation(data);
  };

  const respondToChatRequest = async (conversationId, accept) => {
    if (!user) throw new Error('Please sign in.');
    const { data, error } = await supabase.rpc('respond_to_chat_request', {
      p_conversation_id: conversationId,
      p_accept: Boolean(accept),
    });
    if (error) throw new Error(error.message || 'Could not update the chat request.');
    trackEvent('squad_chat_request_answered', { conversation_id: conversationId, accepted: Boolean(accept) });
    return upsertConversation(data);
  };

  const cancelChatRequest = async (conversationId) => {
    if (!user) throw new Error('Please sign in.');
    const { data, error } = await supabase.rpc('cancel_chat_request', { p_conversation_id: conversationId });
    if (error) throw new Error(error.message || 'Could not cancel the chat request.');
    trackEvent('squad_chat_request_cancelled', { conversation_id: conversationId });
    return upsertConversation(data);
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
      phone_number: '',
      comm_method: postData.comm_method === 'chat' ? 'chat' : 'whatsapp',
      title: postData.title,
      description: postData.description || '',
      skills_have: postData.skills_have || [],
      skills_looking_for: postData.skills_looking_for || [],
      total_members: Number(postData.total_members || 4),
      spots_left: Number(postData.spots_left || 1),
      initial_open_spots: Number(postData.spots_left || 1),
      is_open: true,
      college: (profile?.college || user?.user_metadata?.college || postData.college || '').trim(),
      year: normalizeYear(profile?.year || user?.user_metadata?.year || postData.year),
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

      postContactsRef.current.set(String(data.id), { created_by_email: creatorEmail });
      const created = normalizeSquadPost(data, postContactsRef.current);
      setSquadPosts(prev => [created, ...prev.filter(p => p.id !== created.id)].filter(p => !isMockPost(p)));
      trackEvent('squad_post_created', {
        post_id: data.id,
        competition_name: postData.competition_name,
        spots: postData.spots_left,
        total_members: payload.total_members,
        skills_looking_for: postData.skills_looking_for || [],
        college: payload.college,
      });
      return created;
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

    const acceptedCount = Number(currentPost.accepted_count) || 0;
    const spotsLeft = Number(updatedData.spots_left !== undefined ? updatedData.spots_left : (currentPost.spots_left || 1));
    const totalMembers = Number(updatedData.total_members !== undefined ? updatedData.total_members : (currentPost.total_members || 4));

    const updatePayload = {
      competition_name: updatedData.competition_name || currentPost.competition_name,
      competition_id: updatedData.competition_id !== undefined ? updatedData.competition_id : currentPost.competition_id,
      is_custom: updatedData.is_custom !== undefined ? Boolean(updatedData.is_custom) : currentPost.is_custom,
      expires_at: updatedData.expires_at !== undefined ? updatedData.expires_at : currentPost.expires_at,
      organizer: updatedData.organizer !== undefined ? updatedData.organizer : currentPost.organizer,
      competition_link: updatedData.competition_link !== undefined ? updatedData.competition_link : currentPost.competition_link,
      phone_number: '',
      comm_method: (updatedData.comm_method !== undefined ? updatedData.comm_method : currentPost.comm_method) === 'chat' ? 'chat' : 'whatsapp',
      title: updatedData.title || currentPost.title,
      description: updatedData.description !== undefined ? updatedData.description : currentPost.description,
      skills_have: updatedData.skills_have !== undefined ? updatedData.skills_have : (currentPost.skills_have || []),
      skills_looking_for: updatedData.skills_looking_for !== undefined ? updatedData.skills_looking_for : (currentPost.skills_looking_for || []),
      total_members: totalMembers,
      spots_left: spotsLeft,
      initial_open_spots: spotsLeft + acceptedCount,
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

      const edited = normalizeSquadPost(data, postContactsRef.current);
      setSquadPosts(prev => prev.map(p => p.id === postId ? edited : p));
      // Switching WhatsApp <-> chat changes which applicant numbers the host may see
      if (currentPost.comm_method !== edited.comm_method) refreshSquadData(null, true);
      return edited;
    }

    throw new Error('Backend database not connected.');
  };

  // Submit Application (Strict Authentication Required)
  const applyToSquad = async (appData) => {
    if (!user) {
      openAuthModal({
        title: 'Sign Up to Join this Squad',
        subtitle: 'Create your collegiate account to request to join squads and contact hosts.',
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
      applicant_college: appData.applicant_college || profile?.college || '',
      applicant_year: normalizeYear(appData.applicant_year || profile?.year || profile?.batch || ''),
      pitch_note: appData.pitch_note || '',
      highlighted_skills: appData.highlighted_skills || [],
      comm_method: appData.comm_method || 'whatsapp',
      status: 'pending',
    };

    // One application per squad: a declined/removed one is re-opened instead of duplicated
    const existingApp = squadApps.find(a => a.post_id === appData.post_id && a.applicant_id === user.id);
    if (existingApp) {
      if (existingApp.status === 'pending' || existingApp.status === 'accepted') {
        throw new Error("You've already applied to this squad.");
      }
      const lockedFields = ['post_id', 'applicant_id', 'applicant_email', 'status'];
      const editable = Object.fromEntries(Object.entries(payload).filter(([k]) => !lockedFields.includes(k)));
      await reapplyToSquad(existingApp.id, editable);
      return { ...existingApp, ...normalizeSquadApp({ ...existingApp, ...editable, status: 'pending' }, user.id) };
    }

    if (supabase) {
      const { data, error } = await supabase
        .from('squad_applications')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error('Error submitting application to Supabase:', error);
        if (error.code === '23505') throw new Error("You've already applied to this squad.");
        throw new Error(error.message || 'Could not submit your application.');
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
        skills: data.highlighted_skills || [],
        highlighted_skills: data.highlighted_skills || [],
        pitch: data.pitch_note,
        pitch_note: data.pitch_note,
        phone: '',
        applicant_phone: '',
        comm_method: data.comm_method || payload.comm_method || 'whatsapp'
      };

      setSquadApps(prev => [normalizedApp, ...prev].filter(a => !isMockApp(a)));
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

    const targetPostId = targetApp?.post_id;
    const targetPost = squadPosts.find(p => p.id === targetPostId);

    // Optimistically update applications
    setSquadApps(prev =>
      prev.map(app => (app.id === appId ? { ...app, status: newStatus } : app))
    );

    // Optimistically update the squad's spots / member count
    const wasAccepted = targetApp?.status === 'accepted';
    if (newStatus === 'accepted' && targetPost && !wasAccepted) {
      setSquadPosts(prev =>
        prev.map(post => {
          if (post.id !== targetPostId) return post;
          const nextSpots = Math.max(0, (post.spots_left !== undefined ? post.spots_left : 1) - 1);
          return {
            ...post,
            spots_left: nextSpots,
            is_open: nextSpots > 0,
            accepted_count: (Number(post.accepted_count) || 0) + 1,
          };
        })
      );
    } else if (newStatus !== 'accepted' && targetPost && wasAccepted) {
      setSquadPosts(prev =>
        prev.map(post => {
          if (post.id !== targetPostId) return post;
          return {
            ...post,
            spots_left: Math.min(post.total_members || 4, (post.spots_left || 0) + 1),
            is_open: true,
            accepted_count: Math.max(0, (Number(post.accepted_count) || 0) - 1),
          };
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
        recoveryLinkError,
        openRecoveryModal,
        closeRecoveryModal,
        updateProfile,
        getProfileCooldown,
        PROFILE_COOLDOWN_MS,
        signInWithGoogle,
        signInWithGoogleIdToken,
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
        squadConversations,
        requestSquadChat,
        respondToChatRequest,
        cancelChatRequest,
        getHostWhatsApp,
        saveWhatsAppNumber,
        needsWhatsAppNumber: Boolean(user && profile && !isValidIndianPhone(profile.phone)),
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
        messageNotifications,
        isAdmin,
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
