// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, hasValidCredentials } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function sanitizeIndianPhone(raw) {
  if (!raw) return '';
  let digits = String(raw).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
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

  // 2. Fetch Profile from Supabase
  const fetchUserProfile = useCallback(async (userId) => {
    if (!supabase || !userId) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        setProfile(data);
      }
    } catch (err) {
      console.warn('Profile fetch warning:', err.message);
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

      if (!postErr && Array.isArray(posts) && posts.length > 0) {
        setSquadPosts(posts);
        localStorage.setItem('arena_squad_posts', JSON.stringify(posts));
      }
    } catch (e) {
      console.warn('Could not sync squad posts from Supabase:', e.message);
    }

    // Fetch applications if user is signed in
    if (user) {
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
  }, [user]);

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
  }, [fetchUserProfile, refreshSquadData]);

  // 5. Initial Squad Data Fetch
  useEffect(() => {
    refreshSquadData();
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

  // Bookmark Toggle
  const toggleBookmark = (compId) => {
    setBookmarks(prev => {
      if (prev.includes(compId)) {
        return prev.filter(id => id !== compId);
      } else {
        return [...prev, compId];
      }
    });
  };

  const isBookmarked = (compId) => bookmarks.includes(compId);

  // Squad Post Creator
  const createSquadPost = async (postData) => {
    const creatorName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'OneStop Competitor';
    const creatorEmail = user?.email || 'competitor@two19labs.in';
    const userId = user?.id || `anon-${Date.now()}`;

    const newPost = {
      id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
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
      college: postData.college || '',
      course: postData.course || '',
      year: postData.year || '2nd Year',
      accepted_emails: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Optimistically add to local state
    setSquadPosts(prev => [newPost, ...prev]);

    // Save to Supabase if connected
    if (supabase && user) {
      try {
        const { data, error } = await supabase.from('squad_posts').insert([{
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
          college: postData.college || '',
          course: postData.course || '',
          year: postData.year || '2nd Year',
        }]).select().single();

        if (!error && data) {
          // Replace optimistic ID with DB record
          setSquadPosts(prev => prev.map(p => p.id === newPost.id ? data : p));
          return data;
        }
      } catch (err) {
        console.warn('Could not persist squad post to Supabase:', err.message);
      }
    }

    return newPost;
  };

  // Submit Application
  const applyToSquad = async (appData) => {
    const applicantId = user?.id || `anon-${Date.now()}`;
    const applicantEmail = user?.email || 'applicant@two19labs.in';

    const newApp = {
      id: `app-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      post_id: appData.post_id,
      applicant_id: applicantId,
      applicant_email: applicantEmail,
      applicant_name: appData.applicant_name,
      applicant_phone: appData.applicant_phone || '',
      applicant_college: appData.applicant_college || '',
      pitch_note: appData.pitch_note || '',
      highlighted_skills: appData.highlighted_skills || [],
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    setSquadApps(prev => [newApp, ...prev]);

    // Persist to Supabase if connected
    if (supabase && user) {
      try {
        const { data, error } = await supabase.from('squad_applications').insert([{
          post_id: appData.post_id,
          applicant_id: user.id,
          applicant_name: appData.applicant_name,
          applicant_email: applicantEmail,
          applicant_phone: appData.applicant_phone || '',
          applicant_college: appData.applicant_college || '',
          pitch_note: appData.pitch_note || '',
          highlighted_skills: appData.highlighted_skills || [],
          status: 'pending',
        }]).select().single();

        if (!error && data) {
          setSquadApps(prev => prev.map(a => a.id === newApp.id ? data : a));
          return data;
        }
      } catch (err) {
        console.warn('Could not persist squad app to Supabase:', err.message);
      }
    }

    return newApp;
  };

  // Review Application (Accept / Reject)
  const updateApplicationStatus = async (appId, newStatus) => {
    let targetApp = null;
    setSquadApps(prev =>
      prev.map(app => {
        if (app.id === appId) {
          targetApp = { ...app, status: newStatus };
          return targetApp;
        }
        return app;
      })
    );

    if (newStatus === 'accepted' && targetApp) {
      setSquadPosts(prevPosts =>
        prevPosts.map(post => {
          if (post.id === targetApp.post_id) {
            const nextSpots = Math.max(0, post.spots_left - 1);
            return {
              ...post,
              spots_left: nextSpots,
              is_open: nextSpots > 0,
              accepted_emails: [...(post.accepted_emails || []), targetApp.applicant_email],
            };
          }
          return post;
        })
      );
    }

    if (supabase && user) {
      try {
        await supabase
          .from('squad_applications')
          .update({ status: newStatus })
          .eq('id', appId);

        if (newStatus === 'accepted' && targetApp) {
          const post = squadPosts.find(p => p.id === targetApp.post_id);
          if (post) {
            const nextSpots = Math.max(0, post.spots_left - 1);
            await supabase
              .from('squad_posts')
              .update({
                spots_left: nextSpots,
                is_open: nextSpots > 0,
                accepted_emails: [...(post.accepted_emails || []), targetApp.applicant_email],
              })
              .eq('id', targetApp.post_id);
          }
        }
      } catch (err) {
        console.warn('Could not update status in Supabase:', err.message);
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
