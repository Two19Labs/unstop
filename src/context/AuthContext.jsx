import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, hasValidCredentials } from '../lib/supabaseClient';
import { normalizeYear } from '../data/colleges';
import { isMockPost, isMockApp, isMockBookmark } from '../data/initialData';

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
    return localStorage.getItem('onestop_theme') || 'light';
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

  // 1. Sync Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('onestop_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // 2. Fetch Profile and Bookmarks from Supabase
  const fetchUserProfile = useCallback(async (userId) => {
    if (!supabase || !userId) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const { data: authData } = await supabase.auth.getUser();
      const meta = authData?.user?.user_metadata || {};
      const localLastUpdated = localStorage.getItem(`onestop_profile_last_updated_${userId}`);
      const lastUpdatedAt = data?.profile_last_updated_at || meta?.profile_last_updated_at || localLastUpdated || null;
      const educationLevel = data?.education_level || meta?.education_level || 'undergraduate';

      if (!error && data) {
        setProfile({
          ...data,
          education_level: educationLevel,
          course: data.course || meta.course || '',
          year: data.year || meta.year || 'UG 2nd Year',
          bio: data.bio || meta.bio || '',
          profile_last_updated_at: lastUpdatedAt,
        });
      } else if (meta.full_name) {
        setProfile({
          id: userId,
          email: authData?.user?.email,
          full_name: meta.full_name,
          education_level: educationLevel,
          college: meta.college || '',
          phone: meta.phone || '',
          course: meta.course || '',
          year: meta.year || 'UG 2nd Year',
          bio: meta.bio || '',
          profile_last_updated_at: lastUpdatedAt,
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
        localStorage.setItem('onestop_bookmarks', JSON.stringify(ids));
      }
    } catch (err) {
      console.warn('Bookmarks fetch warning:', err.message);
    }
  }, []);

  // 3. Sync Squad Data from Supabase with Normalized Application Fields
  const refreshSquadData = useCallback(async (targetUser = null) => {
    if (!supabase) return;

    // Fetch squad posts
    try {
      const { data: posts, error: postErr } = await supabase
        .from('squad_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!postErr && Array.isArray(posts)) {
        const cleanPosts = posts.filter(p => !isMockPost(p));
        setSquadPosts(cleanPosts);
        localStorage.setItem('onestop_posts', JSON.stringify(cleanPosts));
      }
    } catch (e) {
      console.warn('Could not sync squad posts from Supabase:', e.message);
    }

    // Fetch applications if user is signed in
    const activeUser = targetUser || userRef.current;
    if (activeUser) {
      try {
        const { data: apps, error: appErr } = await supabase
          .from('squad_applications')
          .select('*')
          .order('created_at', { ascending: false });

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
                skills: a.highlighted_skills || [],
                pitch: a.pitch_note,
                phone: a.applicant_phone
              };
            });
          setSquadApps(cleanApps);
          localStorage.setItem('onestop_applications', JSON.stringify(cleanApps));
        }
      } catch (e) {
        console.warn('Could not sync squad apps from Supabase:', e.message);
      }
    } else {
      setSquadApps([]);
    }
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
        fetchUserProfile(currentUser.id);
        fetchUserBookmarks(currentUser.id);
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
          await fetchUserProfile(currentUser.id);
          await fetchUserBookmarks(currentUser.id);
          refreshSquadData(currentUser);
        } else {
          setProfile(null);
          setBookmarks([]);
          setSquadApps([]);
        }
        setAuthLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchUserProfile, fetchUserBookmarks, refreshSquadData]);

  // 5. Initial Squad Data Fetch + Realtime Subscription & Polling Fallback
  useEffect(() => {
    refreshSquadData();

    if (!supabase) return;

    // Realtime Postgres changes subscription
    const channel = supabase
      .channel('public:squad_realtime_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'squad_posts' }, () => {
        refreshSquadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'squad_applications' }, () => {
        refreshSquadData();
      })
      .subscribe();

    // 30-second interval polling fallback
    const pollInterval = setInterval(() => {
      refreshSquadData();
    }, 30000);

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [refreshSquadData]);

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
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    return data;
  };

  const signInWithPassword = async ({ email, password }) => {
    if (!supabase) {
      throw new Error('Supabase credentials missing. Check your .env file or SUPABASE_SETUP.md.');
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signUpWithPassword = async ({ email, password, fullName, college, phone }) => {
    if (!supabase) {
      throw new Error('Supabase credentials missing. Check your .env file or SUPABASE_SETUP.md.');
    }
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
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
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
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}`,
    });
    if (error) throw error;
    return data;
  };

  // Profile Update (Database & Auth Metadata with 24-Hour Cooldown)
  const updateProfile = async ({ fullName, college, course, year, phone, bio, education_level }) => {
    if (!user || !supabase) {
      throw new Error('You must be signed in to update your profile.');
    }

    // 1. Enforce 24-Hour Cooldown
    const cooldown = getProfileCooldown(profile, user);
    if (cooldown.isLocked) {
      throw new Error(`Profile details cannot be modified for 24 hours after an update. Cooldown remaining: ${cooldown.remainingFormatted}.`);
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

    const hasChanged =
      trimmedName !== prevName ||
      trimmedCollege !== prevCollege ||
      trimmedCourse !== prevCourse ||
      selectedYear !== prevYear ||
      cleanPhone !== prevPhone ||
      trimmedBio !== prevBio ||
      selectedEducationLevel !== prevEducationLevel;

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
        title: 'Sign In to Post a Squad',
        subtitle: 'You must be signed in with your collegiate account to recruit teammates.',
        initialTab: 'signin',
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

      setSquadPosts(prev => prev.map(p => p.id === postId ? data : p));
      return data;
    }

    throw new Error('Backend database not connected.');
  };

  // Submit Application (Strict Authentication Required)
  const applyToSquad = async (appData) => {
    if (!user) {
      openAuthModal({
        title: 'Sign In to Apply',
        subtitle: 'You must be signed in to apply to join a squad.',
        initialTab: 'signin',
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
        skills: data.highlighted_skills || [],
        pitch: data.pitch_note,
        phone: data.applicant_phone
      };

      setSquadApps(prev => [normalizedApp, ...prev].filter(a => !isMockApp(a)));
      localStorage.setItem('onestop_applications', JSON.stringify([normalizedApp, ...squadApps].filter(a => !isMockApp(a))));
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

    if (supabase && user) {
      try {
        const { error: appErr } = await supabase
          .from('squad_applications')
          .update({ status: newStatus })
          .eq('id', appId);

        if (appErr) throw appErr;

        if (newStatus === 'accepted' && targetPost && applicantEmail) {
          const currentAccepted = Array.isArray(targetPost.accepted_emails) ? targetPost.accepted_emails : [];
          const nextAccepted = currentAccepted.includes(applicantEmail) ? currentAccepted : [...currentAccepted, applicantEmail];
          const nextSpots = Math.max(0, (targetPost.spots_left || 1) - 1);
          await supabase
            .from('squad_posts')
            .update({
              spots_left: nextSpots,
              is_open: nextSpots > 0,
              accepted_emails: nextAccepted,
            })
            .eq('id', targetPostId);
        } else if (newStatus === 'removed' && targetPost && applicantEmail) {
          const currentAccepted = Array.isArray(targetPost.accepted_emails) ? targetPost.accepted_emails : [];
          const nextAccepted = currentAccepted.filter(e => e !== applicantEmail);
          const nextSpots = Math.min(targetPost.total_members || 4, (targetPost.spots_left || 0) + 1);
          await supabase
            .from('squad_posts')
            .update({
              spots_left: nextSpots,
              is_open: true,
              accepted_emails: nextAccepted,
            })
            .eq('id', targetPostId);
        }
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
