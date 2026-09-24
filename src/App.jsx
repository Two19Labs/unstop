// src/App.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AuthProvider, useAuth, formatWhatsAppUrl, sanitizeIndianPhone } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import HomeScreen from './components/HomeScreen';
import CompetitionsPage from './components/CompetitionsPage';
import NotificationCenter from './components/NotificationCenter';
import DetailDrawer from './components/DetailDrawer';
import TeamFinderScreen from './components/TeamFinderScreen';
import PostSquadModal from './components/PostSquadModal';
import ApplyModal from './components/ApplyModal';
import RequestsScreen from './components/RequestsScreen';
import ProfileScreen from './components/ProfileScreen';
import Toast from './components/Toast';
import AuthModal from './components/AuthModal';
import ThemeToggle from './components/ThemeToggle';
import OneStopLogo from './components/OneStopLogo';
import Footer from './components/Footer';

import {
  describeFilter,
  matchListing,
  isMockPost,
  isMockApp,
  isMockAlert,
  isMockBookmark
} from './data/initialData';
import { trackScreenView, trackEvent } from './lib/posthog';

import './App.css';

const EMPTY_PROFILE = {
  name: '',
  college: '',
  batch: '',
  course: '',
  phone: '',
  skills: [],
  education_level: 'undergraduate'
};

const DEFAULT_FILTERS = {
  disc: [],
  circ: [],
  team: 'any',
  fee: 'any',
  q: '',
  sort: 'deadline'
};

const VALID_SCREENS = ['home', 'browse', 'saved', 'teams', 'requests', 'profile'];

function getInitialScreen() {
  try {
    if (typeof window !== 'undefined') {
      // 1. Check URL hash (e.g. #browse, #/browse, #teams, #/teams, #saved, #requests, #profile)
      if (window.location.hash) {
        const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0].toLowerCase();
        if (VALID_SCREENS.includes(hash)) {
          return hash;
        }
      }

      // 2. Check URL pathname (e.g. /browse, /teams)
      if (window.location.pathname) {
        const path = window.location.pathname.replace(/^\//, '').split('/')[0].toLowerCase();
        if (VALID_SCREENS.includes(path)) {
          return path;
        }
      }

      // 3. Check sessionStorage (preserved on page refresh in the current tab)
      const sessionSaved = sessionStorage.getItem('onestop_current_screen');
      if (sessionSaved && VALID_SCREENS.includes(sessionSaved)) {
        return sessionSaved;
      }

      // 4. Check localStorage (persisted across sessions)
      const localSaved = localStorage.getItem('onestop_current_screen');
      if (localSaved && VALID_SCREENS.includes(localSaved)) {
        return localSaved;
      }
    }
  } catch (e) {
    console.warn('Error reading initial screen:', e);
  }
  return 'home';
}

function OneStopInner() {
  const {
    user,
    profile: authProfile,
    bookmarks: authBookmarks,
    toggleBookmark: authToggleBookmark,
    squadPosts: authSquadPosts,
    squadApps: authSquadApps,
    createSquadPost: authCreatePost,
    editSquadPost: authEditPost,
    togglePostOpen: authTogglePostOpen,
    deleteSquadPost: authDeletePost,
    applyToSquad: authApplySquad,
    updateApplicationStatus: authUpdateAppStatus,
    withdrawApplication: authWithdrawApp,
    updateProfile: authUpdateProfile,
    refreshSquadData,
    openAuthModal,
    signOut
  } = useAuth();

  // Screen State: 'home' | 'browse' | 'saved' | 'teams' | 'requests' | 'profile'
  // Initialized from URL hash / pathname / sessionStorage / localStorage so refresh stays on current page
  const [screen, setScreen] = useState(getInitialScreen);

  // Synchronize screen state to sessionStorage, localStorage, and URL hash
  useEffect(() => {
    try {
      sessionStorage.setItem('onestop_current_screen', screen);
      localStorage.setItem('onestop_current_screen', screen);
    } catch (e) {}

    const targetHash = screen === 'home' ? '' : `#${screen}`;
    const currentHash = window.location.hash.replace(/^#\/?/, '').split('?')[0].toLowerCase();

    if (screen === 'home') {
      if (window.location.hash && window.location.hash !== '#') {
        window.history.replaceState({ screen: 'home' }, '', window.location.pathname + window.location.search);
      }
    } else if (currentHash !== screen) {
      window.history.replaceState({ screen }, '', targetHash);
    }
  }, [screen]);

  // Synchronize browser history navigation (Back/Forward)
  useEffect(() => {
    const handleLocationChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0].toLowerCase();
      if (VALID_SCREENS.includes(hash)) {
        setScreen(hash);
      } else if (!window.location.hash || window.location.hash === '#') {
        const path = window.location.pathname.replace(/^\//, '').split('/')[0].toLowerCase();
        if (VALID_SCREENS.includes(path)) {
          setScreen(path);
        } else {
          setScreen('home');
        }
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Track virtual pageviews / screen transitions in PostHog
  useEffect(() => {
    trackScreenView(screen);
  }, [screen]);

  // Toast System (Declared early so all callbacks can access flash safely)
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimeoutRef = useRef(null);

  const flash = useCallback((msg) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 2800);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Competitions State (100% real data fetched from Unstop crawler)
  const [competitions, setCompetitions] = useState([]);
  const [competitionsLoading, setCompetitionsLoading] = useState(true);

  // Bookmarks State (String-normalized, zero mock IDs)
  const [localBookmarks, setLocalBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem('onestop_bookmarks');
      return saved ? JSON.parse(saved).filter(b => !isMockBookmark(b)).map(String) : [];
    } catch {
      return [];
    }
  });

  const bookmarks = (user ? (authBookmarks || []) : localBookmarks).filter(b => !isMockBookmark(b)).map(String);

  const handleToggleBookmark = useCallback((compId) => {
    const sCompId = String(compId);
    if (authToggleBookmark) {
      authToggleBookmark(sCompId);
    }
    setLocalBookmarks(prev => {
      const cleanPrev = prev.filter(b => !isMockBookmark(b)).map(String);
      const next = cleanPrev.includes(sCompId) ? cleanPrev.filter(id => id !== sCompId) : [...cleanPrev, sCompId];
      localStorage.setItem('onestop_bookmarks', JSON.stringify(next));
      return next;
    });
  }, [authToggleBookmark]);

  // Squad Posts State (100% real Supabase squad posts)
  const [localPosts, setLocalPosts] = useState(() => {
    try {
      const saved = localStorage.getItem('onestop_posts');
      return saved ? JSON.parse(saved).filter(p => !isMockPost(p)) : [];
    } catch {
      return [];
    }
  });

  const posts = (authSquadPosts && authSquadPosts.length > 0 ? authSquadPosts : localPosts).filter(p => !isMockPost(p));

  useEffect(() => {
    try {
      localStorage.setItem('onestop_posts', JSON.stringify(posts.filter(p => !isMockPost(p))));
    } catch (e) {}
  }, [posts]);

  // Squad Applications State (100% real Supabase squad applications)
  const [localApplications, setLocalApplications] = useState(() => {
    try {
      const saved = localStorage.getItem('onestop_applications');
      return saved ? JSON.parse(saved).filter(a => !isMockApp(a)) : [];
    } catch {
      return [];
    }
  });

  const applications = (user ? (authSquadApps || []) : localApplications).filter(a => !isMockApp(a));

  useEffect(() => {
    try {
      localStorage.setItem('onestop_applications', JSON.stringify(applications.filter(a => !isMockApp(a))));
    } catch (e) {}
  }, [applications]);

  // Profile State (zero mock data)
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('onestop_user_profile');
      return saved ? JSON.parse(saved) : EMPTY_PROFILE;
    } catch {
      return EMPTY_PROFILE;
    }
  });

  // Sync profile when Supabase profile loads
  useEffect(() => {
    if (authProfile && (authProfile.full_name || authProfile.name)) {
      setProfile(prev => {
        const yr = authProfile.year || prev.year || prev.batch || 'UG 2nd Year';
        const isPg = yr.startsWith('PG') || (authProfile.education_level || '').toLowerCase().includes('post');
        return {
          ...prev,
          name: authProfile.full_name || authProfile.name || '',
          college: authProfile.college || prev.college || '',
          course: '',
          year: yr,
          batch: yr,
          phone: authProfile.phone || prev.phone || '',
          skills: authProfile.skills || prev.skills || [],
          education_level: isPg ? 'postgraduate' : 'undergraduate',
        };
      });
    } else if (user && user.email && !profile.name) {
      setProfile(prev => ({
        ...prev,
        name: user.email.split('@')[0],
        education_level: prev.education_level || 'undergraduate',
      }));
    }
  }, [authProfile, user]);

  const handleSaveProfile = useCallback(async (updatedData) => {
    setProfile(updatedData);
    localStorage.setItem('onestop_user_profile', JSON.stringify(updatedData));

    if (user && authUpdateProfile) {
      try {
        const yr = updatedData.year || updatedData.batch || 'UG 2nd Year';
        const isPg = yr.startsWith('PG') || (updatedData.education_level || '').toLowerCase().includes('post');
        await authUpdateProfile({
          fullName: updatedData.name,
          college: updatedData.college,
          course: '',
          year: yr,
          phone: updatedData.phone,
          education_level: isPg ? 'postgraduate' : 'undergraduate',
        });
        flash('Profile updated');
      } catch (err) {
        console.warn('Supabase profile sync error:', err.message);
        flash(err.message || 'Could not update profile');
        return;
      }
    } else {
      flash('Profile updated');
    }
  }, [user, authUpdateProfile, flash]);

  // Browse Filters State (Synchronized with CompetitionsPage / onestop_user_filter_prefs)
  const [browseFilters, setBrowseFilters] = useState(() => {
    try {
      const userKey = user?.email ? `onestop_user_filter_prefs_${user.email.toLowerCase()}` : null;
      const raw = (userKey && localStorage.getItem(userKey)) || localStorage.getItem('onestop_user_filter_prefs');
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {}
    try {
      const saved = localStorage.getItem('onestop_browse_filters');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          selectedCircuits: Array.isArray(parsed.circ) ? parsed.circ : [],
          selectedTracks: Array.isArray(parsed.disc) ? parsed.disc : [],
          teamFilter: parsed.team || 'all',
          feeFilter: parsed.fee || 'all',
          sortBy: parsed.sort || 'closing-soonest'
        };
      }
    } catch (e) {}
    return {
      selectedCircuits: [],
      selectedTracks: [],
      teamFilter: 'all',
      feeFilter: 'all',
      sortBy: 'closing-soonest'
    };
  });

  // Browse Sort State (Synchronized between Browse and Home rails)
  const [browseSort, setBrowseSort] = useState(() => {
    if (browseFilters && typeof browseFilters.sortBy === 'string') {
      return browseFilters.sortBy;
    }
    try {
      const userKey = user?.email ? `onestop_user_filter_prefs_${user.email.toLowerCase()}` : null;
      const raw = (userKey && localStorage.getItem(userKey)) || localStorage.getItem('onestop_user_filter_prefs');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.sortBy === 'string') return parsed.sortBy;
      }
    } catch (e) {}
    return 'closing-soonest';
  });

  // Sync saved filter preferences when user changes
  useEffect(() => {
    try {
      const userKey = user?.email ? `onestop_user_filter_prefs_${user.email.toLowerCase()}` : null;
      const raw = (userKey && localStorage.getItem(userKey)) || localStorage.getItem('onestop_user_filter_prefs');
      if (raw) {
        const parsed = JSON.parse(raw);
        setBrowseFilters(parsed);
        if (parsed.sortBy) setBrowseSort(parsed.sortBy);
      }
    } catch (e) {}
  }, [user]);

  const handleFilterPrefsChange = useCallback((prefs) => {
    setBrowseFilters(prefs);
    if (prefs?.sortBy) {
      setBrowseSort(prefs.sortBy);
    }
  }, []);

  const handleUpdateSort = useCallback((newSort) => {
    setBrowseSort(newSort);
    setBrowseFilters(prev => {
      const next = { ...prev, sortBy: newSort };
      try {
        const userKey = user?.email ? `onestop_user_filter_prefs_${user.email.toLowerCase()}` : null;
        if (userKey) localStorage.setItem(userKey, JSON.stringify(next));
        localStorage.setItem('onestop_user_filter_prefs', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, [user]);

  const handleResetFilters = useCallback(() => {
    const cleanPrefs = {
      selectedCircuits: [],
      selectedTracks: [],
      teamFilter: 'all',
      feeFilter: 'all',
      sortBy: 'closing-soonest'
    };
    setBrowseFilters(cleanPrefs);
    setBrowseSort('closing-soonest');
    try {
      const userKey = user?.email ? `onestop_user_filter_prefs_${user.email.toLowerCase()}` : null;
      if (userKey) localStorage.setItem(userKey, JSON.stringify(cleanPrefs));
      localStorage.setItem('onestop_user_filter_prefs', JSON.stringify(cleanPrefs));
      localStorage.setItem('onestop_browse_filters', JSON.stringify(DEFAULT_FILTERS));
    } catch (e) {}
  }, [user]);

  // Drawer and Modal States
  const [detailCompId, setDetailCompId] = useState(null);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [postModalCompId, setPostModalCompId] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyTargetPost, setApplyTargetPost] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Track competition detail drawer views
  useEffect(() => {
    if (detailCompId && competitions.length > 0) {
      const comp = competitions.find(c => String(c.id) === String(detailCompId));
      if (comp) {
        trackEvent('competition_detail_opened', {
          competition_id: comp.id,
          title: comp.title,
          host: comp.host || comp.orgName,
          circuit: comp.circuit,
          discipline: comp.discipline,
          fee: comp.fee,
          prize: comp.prize,
        });
      }
    }
  }, [detailCompId, competitions]);

  // Fetch Live Competitions strictly from /api/competitions (Unstop ingestion)
  useEffect(() => {
    let isMounted = true;
    async function loadCompetitions() {
      setCompetitionsLoading(true);
      try {
        const res = await fetch(`/api/competitions?t=${Date.now()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (isMounted && json.success && Array.isArray(json.data)) {
          const mapped = json.data.map(c => {
            let circuitVal = 'DU Circuit';
            if (c.isDU) circuitVal = 'DU Circuit';
            else if (c.isIIMorIIT || c.isPremier) circuitVal = 'IIM / IIT';
            else circuitVal = 'Corporate';

            let disciplineVal = c.categoryLabel || 'Case';
            if (disciplineVal.includes('Hackathon') || disciplineVal.includes('Tech')) disciplineVal = 'Hackathon';
            else if (disciplineVal.includes('Quiz')) disciplineVal = 'Quiz';
            else if (disciplineVal.includes('Simul')) disciplineVal = 'Simulation';
            else if (disciplineVal.includes('Writ') || disciplineVal.includes('Paper')) disciplineVal = 'Writing';
            else if (disciplineVal.includes('Debate') || disciplineVal.includes('MUN')) disciplineVal = 'Debate & MUN';
            else disciplineVal = 'Case';

            return {
              ...c,
              id: c.id,
              title: c.title,
              host: c.orgName || c.host || 'Host Institution',
              orgName: c.orgName || c.host || 'Host Institution',
              circuit: circuitVal,
              discipline: disciplineVal,
              days: c.daysRemainingNum !== undefined ? c.daysRemainingNum : 7,
              deadline: c.deadline,
              remainDaysText: c.remainDaysText,
              prize: c.prizes || 'Recognition',
              team: c.teamSizeDisplay || `${c.minTeam || 1}-${c.maxTeam || 4}`,
              mode: c.mode || 'Online',
              fee: c.isFree ? 'Free' : (c.fee || 'Free'),
              desc: c.description || c.title,
              tags: [disciplineVal, circuitVal],
              regs: c.registeredCount || 0,
              logo: c.orgLogo || c.logo || c.bannerUrl || null,
              orgLogo: c.orgLogo || c.logo || null,
              bannerUrl: c.bannerUrl || null,
              unstopUrl: c.unstopUrl || 'https://unstop.com',
              isUndergradEligible: c.isUndergradEligible !== false,
              isPGOnly: Boolean(c.isPGOnly),
              isMBAorPG: Boolean(c.isMBAorPG),
              targetLevel: c.targetLevel || (c.isPGOnly ? 'pg' : 'ug')
            };
          });

          setCompetitions(mapped);
        }
      } catch (e) {
        console.warn('Could not fetch real-time Unstop competitions:', e.message);
      } finally {
        if (isMounted) setCompetitionsLoading(false);
      }
    }
    loadCompetitions();
    return () => {
      isMounted = false;
    };
  }, []);

  const isPostgraduate =
    (profile?.education_level || '').toLowerCase() === 'postgraduate' ||
    (profile?.year || '').toUpperCase().startsWith('PG') ||
    (profile?.batch || '').toUpperCase().startsWith('PG');

  // Dynamic eligibility filtering based on profile education level
  const visibleCompetitions = useMemo(() => {
    if (isPostgraduate) {
      return competitions;
    }
    return competitions.filter(c => c.isUndergradEligible !== false && !c.isPGOnly);
  }, [competitions, isPostgraduate]);

  // Navigation Handler
  const handleNavigate = (newScreen) => {
    if (VALID_SCREENS.includes(newScreen)) {
      if (newScreen !== screen) {
        const targetHash = newScreen === 'home' ? window.location.pathname + window.location.search : `#${newScreen}`;
        window.history.pushState({ screen: newScreen }, '', targetHash);
      }
      setScreen(newScreen);
      try {
        sessionStorage.setItem('onestop_current_screen', newScreen);
        localStorage.setItem('onestop_current_screen', newScreen);
      } catch (e) {}
    }
    setDetailCompId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Find Teammates Button from Competition Card
  const handleFindTeammates = (comp) => {
    trackEvent('find_teammates_clicked', {
      competition_id: comp?.id,
      competition_title: comp?.title,
    });
    if (!user) {
      openAuthModal({
        title: 'Sign In to Post a Squad',
        subtitle: 'You must be signed in with your collegiate account to recruit teammates.',
        initialTab: 'signin',
      });
      return;
    }
    setEditingPost(null);
    setPostModalCompId(comp.id);
    setScreen('teams');
    setPostModalOpen(true);
  };

  // Open Create Squad Modal
  const handleOpenCreateSquad = (comp = null) => {
    trackEvent('create_squad_modal_opened', {
      competition_id: comp?.id,
      competition_title: comp?.title,
    });
    if (!user) {
      openAuthModal({
        title: 'Sign In to Post a Squad',
        subtitle: 'You must be signed in with your collegiate account to recruit teammates.',
        initialTab: 'signin',
      });
      return;
    }
    setEditingPost(null);
    setPostModalCompId(comp ? comp.id : null);
    setPostModalOpen(true);
  };

  // Open Edit Squad Modal
  const handleOpenEditSquad = (post) => {
    if (!user) return;
    setEditingPost(post);
    setPostModalCompId(post.compId || null);
    setPostModalOpen(true);
  };

  // Post or Edit a Squad Submission
  const handleSubmitPost = async (draft) => {
    if (!user) {
      openAuthModal({
        title: 'Sign In to Post a Squad',
        subtitle: 'You must be signed in with your collegiate account to recruit teammates.',
        initialTab: 'signin',
      });
      return;
    }

    if (draft.isEdit && draft.postId) {
      // Edit existing post
      try {
        if (authEditPost) {
          await authEditPost(draft.postId, draft);
        }
        setLocalPosts(prev => prev.map(p => p.id === draft.postId ? { ...p, ...draft } : p));
        setPostModalOpen(false);
        setEditingPost(null);
        flash('Squad listing updated successfully!');
        if (refreshSquadData) refreshSquadData();
      } catch (err) {
        console.warn('Post update error:', err);
        flash(err.message || 'Could not update squad');
      }
      return;
    }

    // Create new post
    const creatorName = profile.name || user?.email?.split('@')[0] || 'You';
    const comp = competitions.find(c => String(c.id) === String(draft.compId));
    const compTitle = draft.competition_name || comp?.title || 'Competition';
    const compHost = draft.organizer || comp?.host || comp?.orgName || '';
    const compLink = draft.competition_link || comp?.unstopUrl || '';

    const newPost = {
      id: `post_${Date.now()}`,
      compId: draft.compId,
      competition_name: compTitle,
      organizer: compHost,
      competition_link: compLink,
      title: `Squad for ${compTitle}`,
      spots: draft.spots,
      spots_left: draft.spots,
      filled: 1,
      total_members: draft.total_members || Math.max(2, draft.spots + 1),
      size: draft.total_members || Math.max(2, draft.spots + 1),
      posted: 'just now',
      desc: draft.desc,
      description: draft.desc,
      want: draft.skills_looking_for || draft.skills,
      skills_looking_for: draft.skills_looking_for || draft.skills,
      skills_have: draft.skills_have || [],
      lead: creatorName,
      created_by_name: creatorName,
      leadPhone: draft.phone_number || profile.phone || '',
      phone_number: draft.phone_number || profile.phone || '',
      college: draft.college || profile.college || '',
      year: draft.year || profile.batch || 'UG 2nd Year',
      mine: true,
      is_open: true,
      state: 'own'
    };

    setLocalPosts(prev => [newPost, ...prev].filter(p => !isMockPost(p)));
    setPostModalOpen(false);
    setEditingPost(null);
    setScreen('teams');
    flash('Squad posted successfully!');

    if (user && authCreatePost) {
      try {
        await authCreatePost({
          competition_name: compTitle,
          organizer: compHost,
          competition_link: compLink,
          title: `Squad for ${compTitle}`,
          description: draft.desc,
          skills_looking_for: draft.skills_looking_for || draft.skills,
          skills_have: draft.skills_have || [],
          spots_left: draft.spots,
          total_members: draft.total_members || Math.max(2, draft.spots + 1),
          phone_number: draft.phone_number || profile.phone || '',
          college: draft.college || profile.college || '',
          year: draft.year || profile.batch || 'UG 2nd Year'
        });
        if (refreshSquadData) refreshSquadData();
      } catch (err) {
        console.warn('Supabase post creation error:', err.message);
      }
    }
  };

  // Toggle Post Open / Closed
  const handleTogglePostOpen = async (postId, currentIsOpen) => {
    setLocalPosts(prev => prev.map(p => p.id === postId ? { ...p, is_open: !currentIsOpen } : p));
    flash(currentIsOpen ? 'Squad closed to new applicants' : 'Squad re-opened');
    if (authTogglePostOpen) {
      try {
        await authTogglePostOpen(postId, currentIsOpen);
        if (refreshSquadData) refreshSquadData();
      } catch (e) {
        console.warn('Toggle open error:', e);
      }
    }
  };

  // Delete Squad Post
  const handleDeleteSquadPost = async (postId) => {
    setLocalPosts(prev => prev.filter(p => p.id !== postId));
    setLocalApplications(prev => prev.filter(a => a.postId !== postId && a.post_id !== postId));
    flash('Squad listing deleted');
    if (authDeletePost) {
      try {
        await authDeletePost(postId);
        if (refreshSquadData) refreshSquadData();
      } catch (e) {
        console.warn('Delete post error:', e);
      }
    }
  };

  // Request to Join Application
  const handleOpenApply = (post) => {
    trackEvent('apply_modal_opened', {
      post_id: post?.id,
      competition_name: post?.competition_name,
    });
    if (!user) {
      openAuthModal({
        title: 'Sign In to Apply',
        subtitle: 'You must be signed in with your collegiate account to apply to join a squad.',
        initialTab: 'signin',
      });
      return;
    }
    setApplyTargetPost(post);
    setApplyModalOpen(true);
  };

  const handleSubmitApply = async (targetPost, pitchText, highlightedSkills = [], phone = '') => {
    const comp = competitions.find(c => String(c.id) === String(targetPost.compId) || (targetPost.competition_name && c.title === targetPost.competition_name));
    const compTitle = comp ? comp.title : (targetPost.competition_name || 'Competition');
    const applicantName = profile.name || user?.email?.split('@')[0] || 'You';
    const applicantPhone = phone || profile.phone || '';

    // If phone was just entered, update local profile immediately
    if (phone && !profile.phone) {
      handleSaveProfile({ ...profile, phone });
    }

    const newApp = {
      id: `app_${Date.now()}`,
      postId: targetPost.id,
      post_id: targetPost.id,
      who: applicantName,
      applicant_name: applicantName,
      meta: compTitle,
      phone: applicantPhone,
      applicant_phone: applicantPhone,
      applicant_college: profile.college || '',
      applicant_year: profile.batch || 'UG 2nd Year',
      skills: highlightedSkills.length > 0 ? highlightedSkills : (profile.skills || []),
      highlighted_skills: highlightedSkills.length > 0 ? highlightedSkills : (profile.skills || []),
      pitch: pitchText,
      pitch_note: pitchText,
      status: 'pending',
      dir: 'out'
    };

    setLocalApplications(prev => [...prev, newApp].filter(a => !isMockApp(a)));
    setLocalPosts(prev => prev.map(p => p.id === targetPost.id ? { ...p, state: 'requested' } : p));
    setApplyModalOpen(false);
    setApplyTargetPost(null);

    const leadFirst = (targetPost.created_by_name || targetPost.lead || 'lead').split(' ')[0];
    flash(`Request sent to ${leadFirst}`);

    if (user && authApplySquad) {
      try {
        await authApplySquad({
          post_id: targetPost.id,
          applicant_name: applicantName,
          applicant_phone: applicantPhone,
          applicant_college: profile.college || '',
          applicant_year: profile.batch || 'UG 2nd Year',
          pitch_note: pitchText,
          highlighted_skills: highlightedSkills.length > 0 ? highlightedSkills : profile.skills
        });
        if (refreshSquadData) refreshSquadData();
      } catch (err) {
        console.warn('Supabase apply error:', err.message);
      }
    }
  };

  // Applications Actions
  const handleAcceptApp = async (appId) => {
    const targetApp = applications.find(a => a.id === appId);
    setLocalApplications(prev => prev.map(a => a.id === appId ? { ...a, status: 'accepted' } : a));

    if (targetApp) {
      const targetPostId = targetApp.postId || targetApp.post_id;
      setLocalPosts(prev => prev.map(p => {
        if (p.id === targetPostId) {
          const nextFilled = (p.filled || 1) + 1;
          const curSpots = p.spots_left !== undefined ? p.spots_left : (p.spots !== undefined ? p.spots : (p.size || p.total_members || 4) - (p.filled || 1));
          const nextSpots = Math.max(0, curSpots - 1);
          return { ...p, filled: nextFilled, spots: nextSpots, spots_left: nextSpots, is_open: nextSpots > 0 };
        }
        return p;
      }));
    }

    flash('Accepted  -  WhatsApp chat ready');

    if (user && authUpdateAppStatus) {
      try {
        await authUpdateAppStatus(appId, 'accepted');
        if (refreshSquadData) refreshSquadData();
      } catch (err) {
        console.warn('Supabase accept error:', err.message);
        flash(err.message || 'Could not accept application');
        if (refreshSquadData) refreshSquadData();
      }
    }
  };

  const handleDeclineApp = async (appId) => {
    setLocalApplications(prev => prev.map(a => a.id === appId ? { ...a, status: 'rejected' } : a));
    flash('Application declined');
    if (user && authUpdateAppStatus) {
      try {
        await authUpdateAppStatus(appId, 'rejected');
        if (refreshSquadData) refreshSquadData();
      } catch (err) {
        console.warn('Supabase decline error:', err.message);
      }
    }
  };

  const handleRemoveApp = async (appId) => {
    setLocalApplications(prev => prev.map(a => a.id === appId ? { ...a, status: 'removed' } : a));
    const targetApp = applications.find(a => a.id === appId);
    if (targetApp) {
      const targetPostId = targetApp.postId || targetApp.post_id;
      setLocalPosts(prev => prev.map(p => {
        if (p.id === targetPostId) {
          const curSpots = p.spots_left !== undefined ? p.spots_left : (p.spots !== undefined ? p.spots : 1);
          const nextSpots = Math.min(p.total_members || 4, curSpots + 1);
          return { ...p, spots: nextSpots, spots_left: nextSpots, is_open: true };
        }
        return p;
      }));
    }

    flash('Member removed - spot re-opened');
    if (user && authUpdateAppStatus) {
      try {
        await authUpdateAppStatus(appId, 'removed');
        if (refreshSquadData) refreshSquadData();
      } catch (err) {
        console.warn('Remove member error:', err.message);
      }
    }
  };

  const handleWithdrawApp = async (appId) => {
    setLocalApplications(prev => prev.filter(a => a.id !== appId));
    if (authWithdrawApp) {
      try {
        await authWithdrawApp(appId);
        if (refreshSquadData) refreshSquadData();
      } catch (e) {
        console.warn('Supabase withdraw error:', e.message);
      }
    }
    flash('Request withdrawn');
  };

  // WhatsApp Handshake Launcher (strictly real phone numbers with prefilled message)
  const handleOpenWhatsApp = (appOrPost) => {
    const rawPhone =
      appOrPost?.lead_phone ||
      appOrPost?.leadPhone ||
      appOrPost?.myApp?.lead_phone ||
      appOrPost?.myApp?.leadPhone ||
      appOrPost?.phone ||
      appOrPost?.phone_number ||
      appOrPost?.applicant_phone ||
      '';
    const name = appOrPost?.created_by_name || appOrPost?.lead || appOrPost?.applicant_name || appOrPost?.who || '';
    const comp = appOrPost?.competition_name || appOrPost?.displayTitle || appOrPost?.title || 'Competition';
    const message = `Hey ${name ? name.split(' ')[0] : ''}! Connecting regarding our squad for "${comp}".`;
    const waUrl = formatWhatsAppUrl(rawPhone, message);

    trackEvent('whatsapp_chat_opened', {
      competition_name: comp,
      has_phone: Boolean(rawPhone),
      is_applicant: Boolean(appOrPost?.applicant_name),
    });

    if (!waUrl || waUrl === '#') {
      flash('No phone number shared for this squad.');
      return;
    }

    flash('Opening WhatsApp…');
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // Derived Counts for Sidebar Badges
  const totalNewAlerts = useMemo(() => {
    try {
      const stored = localStorage.getItem('onestop_saved_alerts');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.reduce((acc, a) => acc + (a.fresh || 0), 0);
        }
      }
    } catch (e) {}
    return 0;
  }, []);
  const pendingInboxCount = applications.filter(a => a.dir === 'in' && a.status === 'pending').length;

  // Detail Drawer Target Competition
  const selectedDetailComp = detailCompId ? (visibleCompetitions.find(c => c.id === detailCompId) || competitions.find(c => c.id === detailCompId)) : null;
  const detailSquadCount = detailCompId ? posts.filter(p => p.compId === detailCompId).length : 0;

  const isBrowseMode = screen === 'browse' || screen === 'saved';

  return (
    <div className={isBrowseMode ? "onestop-app onestop-app-browse-mode" : "onestop-app"}>
      {/* Mobile Topbar */}
      {!isBrowseMode && (
        <div className="mobile-topbar">
          <button
            className="mobile-hamburger-btn"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <OneStopLogo height={22} style={{ cursor: 'pointer' }} onClick={() => handleNavigate('home')} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ThemeToggle variant="compact" />
            <NotificationCenter
              applications={applications}
              competitions={competitions}
              bookmarks={bookmarks}
              posts={posts}
              profile={profile}
              onOpenWhatsApp={handleOpenWhatsApp}
              onOpenDetail={(id) => setDetailCompId(id)}
              onNavigate={handleNavigate}
              onToggleBookmark={handleToggleBookmark}
            />
          </div>
        </div>
      )}

      {/* Sidebar */}
      {!isBrowseMode && (
        <Sidebar
          screen={screen}
          onNavigate={handleNavigate}
          totalNewAlerts={totalNewAlerts}
          bookmarksCount={bookmarks.length}
          pendingInboxCount={pendingInboxCount}
          profile={profile}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Main Screen Content */}
      {isBrowseMode ? (
        <CompetitionsPage
          key={screen}
          onBack={() => handleNavigate('home')}
          onNavigate={handleNavigate}
          onFindTeammates={handleFindTeammates}
          onOpenDetail={(id) => setDetailCompId(id)}
          showToast={flash}
          bookmarks={bookmarks}
          onToggleBookmark={handleToggleBookmark}
          bookmarkedOnly={screen === 'saved'}
          isPostgraduate={isPostgraduate}
          initialCompetitions={competitions}
          externalSortBy={browseSort}
          onSortChange={handleUpdateSort}
          onFilterPrefsChange={handleFilterPrefsChange}
          headerAction={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ThemeToggle variant="compact" />
              <NotificationCenter
                applications={applications}
                competitions={competitions}
                bookmarks={bookmarks}
                posts={posts}
                profile={profile}
                onOpenWhatsApp={handleOpenWhatsApp}
                onOpenDetail={(id) => setDetailCompId(id)}
                onNavigate={handleNavigate}
                onToggleBookmark={handleToggleBookmark}
              />
            </div>
          }
        />
      ) : (
        <main className={screen === 'home' ? "onestop-main onestop-main-home" : "onestop-main"}>
          {/* Top-Right Theme Toggle & Notification Center */}
          <div className="onestop-top-actions">
            <ThemeToggle variant="compact" />
            <NotificationCenter
              applications={applications}
              competitions={competitions}
              bookmarks={bookmarks}
              posts={posts}
              profile={profile}
              onOpenWhatsApp={handleOpenWhatsApp}
              onOpenDetail={(id) => setDetailCompId(id)}
              onNavigate={handleNavigate}
              onToggleBookmark={handleToggleBookmark}
            />
          </div>
          <div className="onestop-screen-content">
            {screen === 'home' && (
              <HomeScreen
                profile={profile}
                competitions={visibleCompetitions}
                competitionsLoading={competitionsLoading}
                savedFilter={browseFilters}
                browseSort={browseSort}
                onUpdateSort={handleUpdateSort}
                onResetFilter={handleResetFilters}
                applications={applications}
                posts={posts}
                onGoBrowse={() => handleNavigate('browse')}
                onOpenDetail={(id) => setDetailCompId(id)}
                onFindTeammates={handleFindTeammates}
                onSquadUp={handleFindTeammates}
                bookmarks={bookmarks}
                onToggleBookmark={handleToggleBookmark}
                user={user}
                onNavigate={handleNavigate}
                onRequestJoin={(post) => handleOpenApply(post)}
                onOpenWhatsApp={handleOpenWhatsApp}
              />
            )}

            {screen === 'teams' && (
              <TeamFinderScreen
                key="teams"
                posts={posts}
                competitions={visibleCompetitions}
                profile={profile}
                applications={applications}
                user={user}
                onOpenPostSquad={handleOpenCreateSquad}
                onOpenEditSquad={handleOpenEditSquad}
                onOpenApply={handleOpenApply}
                onOpenWhatsApp={handleOpenWhatsApp}
                onGoRequests={() => handleNavigate('requests')}
                onTogglePostOpen={handleTogglePostOpen}
                onDeleteSquadPost={handleDeleteSquadPost}
                onAcceptApp={handleAcceptApp}
                onDeclineApp={handleDeclineApp}
                onRemoveApp={handleRemoveApp}
              />
            )}

            {screen === 'requests' && (
              <RequestsScreen
                applications={applications}
                posts={posts}
                competitions={visibleCompetitions}
                onAccept={handleAcceptApp}
                onDecline={handleDeclineApp}
                onRemove={handleRemoveApp}
                onWithdraw={handleWithdrawApp}
                onOpenWhatsApp={handleOpenWhatsApp}
              />
            )}

            {screen === 'profile' && (
              <ProfileScreen
                profile={profile}
                onSaveProfile={handleSaveProfile}
                user={user}
                onOpenAuthModal={() => openAuthModal && openAuthModal()}
                onSignOut={signOut}
              />
            )}
          </div>

          <Footer />
        </main>
      )}

      {/* Competition Detail Drawer */}
      <DetailDrawer
        item={selectedDetailComp}
        onClose={() => setDetailCompId(null)}
        isBookmarked={detailCompId ? bookmarks.includes(String(detailCompId)) : false}
        onToggleBookmark={handleToggleBookmark}
        onOpenPostSquad={(comp) => {
          setDetailCompId(null);
          handleOpenCreateSquad(comp);
        }}
        squadsCount={detailSquadCount}
      />

      {/* Post or Edit a Squad Modal */}
      <PostSquadModal
        isOpen={postModalOpen}
        onClose={() => {
          setPostModalOpen(false);
          setPostModalCompId(null);
          setEditingPost(null);
        }}
        competitions={competitions}
        initialCompId={postModalCompId}
        editingPost={editingPost}
        profile={profile}
        onSubmitPost={handleSubmitPost}
      />

      {/* Request to Join Modal */}
      <ApplyModal
        isOpen={applyModalOpen}
        onClose={() => {
          setApplyModalOpen(false);
          setApplyTargetPost(null);
        }}
        post={applyTargetPost}
        competition={applyTargetPost ? competitions.find(c => c.id === applyTargetPost.compId) : null}
        profile={profile}
        onSubmitApply={handleSubmitApply}
      />

      {/* Global Toast */}
      <Toast message={toastMessage} />

      {/* Supabase Auth Modal */}
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <OneStopInner />
    </AuthProvider>
  );
}
