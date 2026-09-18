// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, hasValidCredentials } from '../lib/supabaseClient';

const AuthContext = createContext(null);

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
    return localStorage.getItem('arena_theme') || 'light';
  });

  // Bookmarks State
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem('arena_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Squad Posts State
  const [squadPosts, setSquadPosts] = useState(() => {
    try {
      const saved = localStorage.getItem('arena_squad_posts');
      if (saved) return JSON.parse(saved);
      return [];
    } catch {
      return [];
    }
  });

  // Squad Applications State
  const [squadApps, setSquadApps] = useState(() => {
    try {
      const saved = localStorage.getItem('arena_squad_apps');
      if (saved) return JSON.parse(saved);
      return [];
    } catch {
      return [];
    }
  });

  // 1. Sync Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('arena_theme', theme);
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

      if (!error && data) {
        setProfile({
          ...data,
          course: data.course || meta.course || '',
          year: data.year || meta.year || '2nd Year',
          bio: data.bio || meta.bio || '',
        });
      } else if (meta.full_name) {
        setProfile({
          id: userId,
          email: authData?.user?.email,
          full_name: meta.full_name,
          college: meta.college || '',
          phone: meta.phone || '',
          course: meta.course || '',
          year: meta.year || '2nd Year',
          bio: meta.bio || '',
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
        const ids = data.map(b => b.comp_id);
        setBookmarks(ids);
        localStorage.setItem('arena_bookmarks', JSON.stringify(ids));
      }
    } catch (err) {
      console.warn('Bookmarks fetch warning:', err.message);
    }
  }, []);

  // 3. Sync Squad Data from Supabase
  const refreshSquadData = useCallback(async () => {
    if (!supabase) return;

    // Fetch squad posts
    try {
      const { data: posts, error: postErr } = await supabase
        .from('squad_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!postErr && Array.isArray(posts)) {
        setSquadPosts(posts);
        localStorage.setItem('arena_squad_posts', JSON.stringify(posts));
      }
    } catch (e) {
      console.warn('Could not sync squad posts from Supabase:', e.message);
    }

    // Fetch applications if user is signed in
    const activeUser = userRef.current;
    if (activeUser) {
      try {
        const { data: apps, error: appErr } = await supabase
          .from('squad_applications')
          .select('*')
          .order('created_at', { ascending: false });

        if (!appErr && Array.isArray(apps)) {
          setSquadApps(apps);
          localStorage.setItem('arena_squad_apps', JSON.stringify(apps));
        }
      } catch (e) {
        console.warn('Could not sync squad apps from Supabase:', e.message);
      }
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
      if (currentUser) {
        fetchUserProfile(currentUser.id);
        fetchUserBookmarks(currentUser.id);
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

        if (currentUser) {
          await fetchUserProfile(currentUser.id);
          await fetchUserBookmarks(currentUser.id);
          refreshSquadData();
        } else {
          setProfile(null);
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
    localStorage.setItem('arena_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem('arena_squad_posts', JSON.stringify(squadPosts));
  }, [squadPosts]);

  useEffect(() => {
    localStorage.setItem('arena_squad_apps', JSON.stringify(squadApps));
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
    setUser(null);
    setSession(null);
    setProfile(null);
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

  // Profile Update (Database & Auth Metadata)
  const updateProfile = async ({ fullName, college, course, year, phone, bio }) => {
    if (!user || !supabase) {
      throw new Error('You must be signed in to update your profile.');
    }

    const cleanPhone = sanitizeIndianPhone(phone);

    // 1. Update Supabase Auth user metadata
    const { error: authErr } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        college: college || '',
        course: course || '',
        year: year || '2nd Year',
        phone: cleanPhone || '',
        bio: bio || '',
      },
    });

    if (authErr) throw authErr;

    // 2. Update PostgreSQL profiles table (upsert to create if missing)
    const profileRecord = {
      id: user.id,
      email: user.email,
      full_name: fullName,
      college: college || '',
      course: course || '',
      year: year || '2nd Year',
      phone: cleanPhone || '',
      bio: bio || '',
      updated_at: new Date().toISOString(),
    };

    try {
      const { error: upsertErr } = await supabase
        .from('profiles')
        .upsert(profileRecord, { onConflict: 'id' });

      if (upsertErr) {
        console.warn('Full profile upsert error, attempting basic fields:', upsertErr.message);
        await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            full_name: fullName,
            college: college || '',
            phone: cleanPhone || '',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });
      }
    } catch (err) {
      console.warn('Profile DB save caught error:', err.message);
    }

    const merged = {
      ...(profile || {}),
      id: user.id,
      email: user.email,
      full_name: fullName,
      college: college || '',
      course: course || '',
      year: year || '2nd Year',
      phone: cleanPhone || '',
      bio: bio || '',
    };
    setProfile(merged);
    return merged;
  };

  // Bookmark Toggle with Live Database Sync
  const toggleBookmark = async (compId) => {
    const isCurrentlySaved = bookmarks.includes(compId);
    const nextBookmarks = isCurrentlySaved
      ? bookmarks.filter(id => id !== compId)
      : [...bookmarks, compId];

    // Optimistic UI update
    setBookmarks(nextBookmarks);
    localStorage.setItem('arena_bookmarks', JSON.stringify(nextBookmarks));

    // Persist to Supabase if authenticated
    if (supabase && user) {
      try {
        if (isCurrentlySaved) {
          await supabase
            .from('bookmarks')
            .delete()
            .eq('user_id', user.id)
            .eq('comp_id', compId);
        } else {
          await supabase
            .from('bookmarks')
            .insert([{ user_id: user.id, comp_id: compId }]);
        }
      } catch (err) {
        console.warn('Could not sync bookmark to Supabase:', err.message);
      }
    }
  };

  const isBookmarked = (compId) => bookmarks.includes(compId);

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
      college: postData.college || profile?.college || '',
      course: postData.course || '',
      year: postData.year || '2nd Year',
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

      setSquadPosts(prev => [data, ...prev]);
      localStorage.setItem('arena_squad_posts', JSON.stringify([data, ...squadPosts]));
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

      setSquadApps(prev => [data, ...prev]);
      localStorage.setItem('arena_squad_apps', JSON.stringify([data, ...squadApps]));
      return data;
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
        applyToSquad,
        updateApplicationStatus,
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
