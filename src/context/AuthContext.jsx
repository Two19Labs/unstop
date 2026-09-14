// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const [user, setUser] = useState(() => {
    return {
      id: "arena-local-user-1",
      email: "scholar@university.edu",
      user_metadata: { full_name: "Undergrad Competitor" }
    };
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('arena_theme') || 'light';
  });

  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem('arena_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [squadPosts, setSquadPosts] = useState(() => {
    try {
      const saved = localStorage.getItem('arena_squad_posts');
      if (saved) return JSON.parse(saved);
      return [];
    } catch {
      return [];
    }
  });

  const [squadApps, setSquadApps] = useState(() => {
    try {
      const saved = localStorage.getItem('arena_squad_apps');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('arena_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Sync bookmarks locally
  useEffect(() => {
    localStorage.setItem('arena_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Sync squad posts locally
  useEffect(() => {
    localStorage.setItem('arena_squad_posts', JSON.stringify(squadPosts));
  }, [squadPosts]);

  // Sync squad apps locally
  useEffect(() => {
    localStorage.setItem('arena_squad_apps', JSON.stringify(squadApps));
  }, [squadApps]);

  // Bookmark toggle
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

  // Squad post creator
  const createSquadPost = (postData) => {
    const newPost = {
      id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      user_id: user?.id || 'local-user',
      created_by_email: user?.email || 'scholar@university.edu',
      created_by_name: user?.user_metadata?.full_name || 'Undergrad Competitor',
      accepted_emails: [],
      is_open: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...postData,
      spots_left: Number(postData.spots_left || 1),
      initial_open_spots: Number(postData.spots_left || 1),
      total_members: Number(postData.total_members || 4),
    };

    setSquadPosts(prev => [newPost, ...prev]);
    return newPost;
  };

  // Submit application
  const applyToSquad = (appData) => {
    const newApp = {
      id: `app-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      applicant_id: user?.id || 'local-user',
      applicant_email: user?.email || 'scholar@university.edu',
      status: 'pending',
      created_at: new Date().toISOString(),
      ...appData,
    };

    setSquadApps(prev => [newApp, ...prev]);
    return newApp;
  };

  // Review application (Accept / Reject)
  const updateApplicationStatus = (appId, newStatus) => {
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
              accepted_emails: [...(post.accepted_emails || []), targetApp.applicant_email]
            };
          }
          return post;
        })
      );
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
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
