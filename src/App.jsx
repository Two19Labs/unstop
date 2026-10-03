// src/App.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from 'react';
import { AuthProvider, useAuth, formatWhatsAppUrl, sanitizeIndianPhone } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import HomeScreen from './components/HomeScreen';
import CompetitionsPage from './components/CompetitionsPage';
import NotificationCenter from './components/NotificationCenter';
import DetailDrawer from './components/DetailDrawer';
import PostSquadModal from './components/PostSquadModal';
import ApplyModal from './components/ApplyModal';
import Toast from './components/Toast';
import AuthModal from './components/AuthModal';
import SetNewPasswordModal from './components/SetNewPasswordModal';
import OneStopLogo from './components/OneStopLogo';
import Footer from './components/Footer';
import MobileBottomNav from './components/MobileBottomNav';
import InstallShortcutPopup from './components/InstallShortcutPopup';
import FunLoadingScreen, { GENERAL_PUNS } from './components/FunLoadingScreen';
import { sendPresencePing, initGlobalPresence } from './lib/presenceService';
import { useCompetitionRounds } from './hooks/useCompetitionRounds';
import { isEligibleForUndergrad, checkIsPostgraduate } from './utils/eligibilityUtils';

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

// Heavy screens load on first use to keep the initial bundle small
const AdminConsolePage = lazy(() => import('./components/AdminConsolePage'));
const TeamFinderScreen = lazy(() => import('./components/TeamFinderScreen'));
const RequestsScreen = lazy(() => import('./components/RequestsScreen'));
const ProfileScreen = lazy(() => import('./components/ProfileScreen'));
const WalkthroughModal = lazy(() => import('./components/WalkthroughModal'));

const EMPTY_PROFILE = {
  name: '',
  college: '',
  batch: '',
  year: '',
  phone: '',
  skills: [],
  education_level: ''
};

const DEFAULT_FILTERS = {
  disc: [],
  circ: [],
  team: 'any',
  fee: 'any',
  q: '',
  sort: 'deadline'
};

const VALID_SCREENS = ['home', 'browse', 'teams', 'requests', 'profile', 'admin'];

function getInitialScreen() {
  try {
    if (typeof window !== 'undefined') {
      const rawHash = window.location.hash || '';
      const rawSearch = window.location.search || '';
      // If user arrives via password recovery or auth callback, stay on home screen so modal displays cleanly
      if (
        rawHash.includes('type=recovery') ||
        rawSearch.includes('type=recovery') ||
        rawSearch.includes('code=') ||
        (rawHash.includes('access_token') && rawHash.includes('recovery'))
      ) {
        return 'home';
      }

      // 1. Check URL hash (e.g. #browse, #/browse, #teams, #/teams, #requests, #profile)
      if (window.location.hash) {
        const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0].toLowerCase();
        if (hash === 'saved' || hash === 'bookmarked') return 'home';
        if (VALID_SCREENS.includes(hash)) {
          return hash;
        }
      }

      // 2. Check URL pathname (e.g. /browse, /teams)
      if (window.location.pathname) {
        const path = window.location.pathname.replace(/^\//, '').split('/')[0].toLowerCase();
        if (path === 'saved' || path === 'bookmarked') return 'home';
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

const COMPETITIONS_CACHE_KEY = 'onestop_cached_competitions_v1';
const COMPETITIONS_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes client cache

function getCachedCompetitions() {
  try {
    if (typeof window === 'undefined') return null;
    const raw = sessionStorage.getItem(COMPETITIONS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.data) && parsed.data.length > 0) {
      if (Date.now() - (parsed.timestamp || 0) < COMPETITIONS_CACHE_TTL_MS) {
        return parsed.data;
      }
    }
  } catch (e) {}
  return null;
}

function setCachedCompetitions(data) {
  try {
    if (typeof window !== 'undefined' && Array.isArray(data) && data.length > 0) {
      sessionStorage.setItem(COMPETITIONS_CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        data
      }));
    }
  } catch (e) {}
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
    reapplyToSquad: authReapplySquad,
    updateProfile: authUpdateProfile,
    refreshSquadData,
    openAuthModal,
    signOut,
    changePassword,
    resetPassword,
    deleteAccount
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
        const rawHash = window.location.hash;
        // Do not wipe OAuth callback tokens or password recovery hashes
        if (!rawHash.includes('access_token') && !rawHash.includes('type=') && !rawHash.includes('error=')) {
          window.history.replaceState({ screen: 'home' }, '', window.location.pathname + window.location.search);
        }
      }
    } else if (currentHash !== screen) {
      const rawHash = window.location.hash;
      if (!rawHash.includes('access_token') && !rawHash.includes('type=') && !rawHash.includes('error=')) {
        window.history.replaceState({ screen }, '', targetHash);
      }
    }
  }, [screen]);

  // Synchronize browser history navigation (Back/Forward)
  useEffect(() => {
    const handleLocationChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0].toLowerCase();
      if (hash === 'saved' || hash === 'bookmarked') {
        setScreen('home');
        return;
      }
      if (VALID_SCREENS.includes(hash)) {
        setScreen(hash);
      } else if (!window.location.hash || window.location.hash === '#') {
        const path = window.location.pathname.replace(/^\//, '').split('/')[0].toLowerCase();
        if (path === 'saved' || path === 'bookmarked') {
          setScreen('home');
          return;
        }
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

  // Detect email confirmation callback and flash welcome toast
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('type=signup')) {
      flash('🎉 Email confirmed! Welcome to OneStop.');
      setTimeout(() => {
        if (window.location.hash.includes('type=signup')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }, 1200);
    }
  }, [flash]);

  // Competitions State (Instant Session Cache with background revalidation)
  const [competitions, setCompetitions] = useState(() => {
    const cached = getCachedCompetitions();
    return Array.isArray(cached) && cached.length > 0 ? cached : [];
  });
  const [competitionsLoading, setCompetitionsLoading] = useState(() => {
    const cached = getCachedCompetitions();
    return !(Array.isArray(cached) && cached.length > 0);
  });

  // Boot loading screen: displays for exactly 1.5s on initial boot so users trust live data is real
  const [showBootScreen, setShowBootScreen] = useState(true);

  // First-time walkthrough modal experience
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [fromWalkthrough, setFromWalkthrough] = useState(() => {
    try {
      return sessionStorage.getItem('onestop_from_walkthrough') === 'true';
    } catch (e) {
      return false;
    }
  });

  const handleBootComplete = useCallback(() => {
    setShowBootScreen(false);
    try {
      const seen = localStorage.getItem('onestop_walkthrough_seen');
      if (!seen) {
        setShowWalkthrough(true);
      }
    } catch (e) {}
  }, []);

  // Hard safety watchdog: ensure boot screen is ALWAYS dismissed within 3.5s no matter what
  useEffect(() => {
    const watchdog = setTimeout(() => {
      setShowBootScreen(false);
      try {
        const seen = localStorage.getItem('onestop_walkthrough_seen');
        if (!seen) {
          setShowWalkthrough(true);
        }
      } catch (e) {}
    }, 3500);
    return () => clearTimeout(watchdog);
  }, []);

  // Bookmarks State (Strictly authenticated accounts only, zero mock IDs)
  const bookmarks = useMemo(() => {
    return (user ? (authBookmarks || []) : []).filter(b => !isMockBookmark(b)).map(String);
  }, [user, authBookmarks]);

  // Multi-round competition timelines & snapshot diffing for bookmarked opportunities
  const { roundsMap, refreshRounds } = useCompetitionRounds(bookmarks);

  // Background Revalidation & Tab-Focus Sync for Live Deadlines & Extensions
  useEffect(() => {
    function handleWindowFocus() {
      if (typeof refreshRounds === 'function') {
        refreshRounds();
      }
    }

    const intervalTimer = setInterval(() => {
      if (typeof refreshRounds === 'function') {
        refreshRounds();
      }
    }, 5 * 60 * 1000);

    window.addEventListener('focus', handleWindowFocus);
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      clearInterval(intervalTimer);
    };
  }, [refreshRounds]);

  const handleToggleBookmark = useCallback((compId) => {
    const sCompId = String(compId);
    if (!user) {
      flash('Please sign up to bookmark competitions.');
      try {
        sessionStorage.setItem('onestop_pending_bookmark_after_auth', sCompId);
      } catch (e) {}
      openAuthModal({
        title: 'Sign Up to Bookmark Competitions',
        subtitle: 'Create your collegiate account to bookmark competitions, track round deadlines, and sync across devices.',
        initialTab: 'signup',
        postLoginAction: () => {
          if (authToggleBookmark) {
            authToggleBookmark(sCompId);
          }
        },
      });
      return;
    }

    if (authToggleBookmark) {
      authToggleBookmark(sCompId);
    }
  }, [user, authToggleBookmark, openAuthModal, flash]);

  // Squad Posts State (100% real Supabase squad posts)
  // In-memory only: optimistic copies while a save is in flight (never persisted)
  const [localPosts, setLocalPosts] = useState([]);

  const posts = useMemo(() => {
    const remote = Array.isArray(authSquadPosts) ? authSquadPosts : [];
    const localOnly = localPosts.filter(lp => !remote.some(rp => String(rp.id) === String(lp.id)));
    return [...localOnly, ...remote].filter(p => !isMockPost(p));
  }, [authSquadPosts, localPosts]);

  // Squad Applications State (100% real Supabase squad applications)
  const [localApplications, setLocalApplications] = useState([]);

  const applications = useMemo(() => {
    const remote = Array.isArray(authSquadApps) ? authSquadApps : [];
    const localOnly = localApplications.filter(la => !remote.some(ra => String(ra.id) === String(la.id)));
    return (user ? [...localOnly, ...remote] : localApplications).filter(a => !isMockApp(a));
  }, [user, authSquadApps, localApplications]);

  // Profile State (zero mock data)
  const [profile, setProfile] = useState(EMPTY_PROFILE);

  // Sync profile when Supabase profile loads or when user signs in / out
  useEffect(() => {
    if (!user) {
      setProfile(EMPTY_PROFILE);
      return;
    }

    if (authProfile) {
      const yr = authProfile.year || '';
      const isPg = yr.startsWith('PG') || (authProfile.education_level || '').toLowerCase().includes('post');
      const resolved = {
        id: user.id,
        name: authProfile.full_name || authProfile.name || (user.email ? user.email.split('@')[0] : ''),
        college: authProfile.college || '',
        year: yr,
        batch: yr,
        phone: authProfile.phone || '',
        skills: Array.isArray(authProfile.skills) ? authProfile.skills : [],
        education_level: isPg ? 'postgraduate' : (yr ? 'undergraduate' : ''),
        profile_last_updated_at: authProfile.profile_last_updated_at || null,
      };
      setProfile(resolved);
    } else if (user && user.email) {
      const initial = {
        ...EMPTY_PROFILE,
        id: user.id,
        name: user.email.split('@')[0],
      };
      setProfile(initial);
    }
  }, [authProfile, user]);

  // Live Online Presence tracking for all active sessions & devices
  useEffect(() => {
    initGlobalPresence(user, authProfile || profile, screen);
  }, [user, authProfile, profile, screen]);

  const handleSaveProfile = useCallback(async (updatedData) => {
    if (!user) {
      flash('Please sign in or create an account to save your profile.');
      return false;
    }
    const resolvedUpdated = {
      ...(profile || {}),
      ...updatedData,
    };
    const applyLocally = (next) => setProfile(next);

    if (!authUpdateProfile) {
      applyLocally(resolvedUpdated);
      return true;
    }

    // Only reflect changes after the server accepts them (it may reject inside the 24h cooldown)
    try {
      const yr = updatedData.year || updatedData.batch || '';
      const isPg = yr.startsWith('PG') || (updatedData.education_level || '').toLowerCase().includes('post');
      const saved = await authUpdateProfile({
        fullName: updatedData.name,
        college: updatedData.college,
        year: yr,
        phone: updatedData.phone,
        skills: updatedData.skills || [],
        education_level: isPg ? 'postgraduate' : (yr ? 'undergraduate' : ''),
      });
      applyLocally({
        ...resolvedUpdated,
        ...(saved || {}),
        name: saved?.full_name || saved?.name || updatedData.name,
        profile_last_updated_at: saved?.profile_last_updated_at ?? null,
      });
      flash('Profile updated');
      return true;
    } catch (err) {
      console.warn('Supabase profile sync error:', err.message);
      flash(err.message || 'Could not update profile');
      throw err;
    }
  }, [user, authUpdateProfile, flash, profile]);

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
  const [teamFinderTab, setTeamFinderTab] = useState('other');

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
      const cached = getCachedCompetitions();
      if (!cached || cached.length === 0) {
        setCompetitionsLoading(true);
      }
      try {
        const res = await fetch('/api/competitions');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (isMounted && json.success && Array.isArray(json.data)) {
          const mapped = json.data.map(c => {
            let circuitVal = c.circuit;
            if (!circuitVal) {
              if (c.isDU) circuitVal = 'DU Circuit';
              else if (c.isIIMorIIT || c.isPremier || c.isIIMorIITorPremier) circuitVal = 'IIM / IIT';
              else if (c.isCorporate || c.isCorporateOrGlobal) circuitVal = 'Corporate';
              else circuitVal = 'Others';
            }

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
              startDate: c.startDate || null,
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
              isUndergradEligible: c.isUndergradEligible !== false && isEligibleForUndergrad(c),
              isPGOnly: Boolean(c.isPGOnly) || !isEligibleForUndergrad(c),
              isMBAorPG: Boolean(c.isMBAorPG) || !isEligibleForUndergrad(c),
              targetLevel: (!isEligibleForUndergrad(c) || c.isPGOnly) ? 'pg' : (c.targetLevel || 'ug')
            };
          });

          setCompetitions(mapped);
          setCachedCompetitions(mapped);
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

  const isPostgraduate = checkIsPostgraduate(profile);

  // Dynamic eligibility filtering based on profile education level
  const visibleCompetitions = useMemo(() => {
    if (isPostgraduate) {
      return competitions;
    }
    return competitions.filter(isEligibleForUndergrad);
  }, [competitions, isPostgraduate]);

  // Navigation Handler
  const handleNavigate = (newScreen) => {
    let target = newScreen;
    if (target === 'saved' || target === 'bookmarked') target = 'home';
    if (VALID_SCREENS.includes(target)) {
      if (target !== screen) {
        const targetHash = target === 'home' ? window.location.pathname + window.location.search : `#${target}`;
        window.history.pushState({ screen: target }, '', targetHash);
      }
      setScreen(target);
      try {
        sessionStorage.setItem('onestop_current_screen', target);
        localStorage.setItem('onestop_current_screen', target);
      } catch (e) {}
    }
    setDetailCompId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Walkthrough completion & dismissal handlers
  const handleCompleteWalkthrough = useCallback(() => {
    try {
      localStorage.setItem('onestop_walkthrough_seen', 'true');
    } catch (e) {}
    setShowWalkthrough(false);
    setFromWalkthrough(false);
    handleNavigate('home');
    flash('Welcome to OneStop!');
  }, [flash]);

  const handleCloseWalkthrough = useCallback(() => {
    try {
      localStorage.setItem('onestop_walkthrough_seen', 'true');
    } catch (e) {}
    setShowWalkthrough(false);
    handleNavigate('home');
  }, []);

  // Find Teammates Button from Competition Card
  const handleFindTeammates = (comp) => {
    trackEvent('find_teammates_clicked', {
      competition_id: comp?.id,
      competition_title: comp?.title,
    });
    if (!user) {
      openAuthModal({
        title: 'Sign Up to Recruit Teammates',
        subtitle: 'Create your collegiate account to recruit teammates and coordinate over WhatsApp.',
        initialTab: 'signup',
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
        title: 'Sign Up to Post a Squad',
        subtitle: 'Create your collegiate account to recruit teammates and coordinate over WhatsApp.',
        initialTab: 'signup',
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
        title: 'Sign Up to Post a Squad',
        subtitle: 'Create your collegiate account to recruit teammates and coordinate over WhatsApp.',
        initialTab: 'signup',
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
      leadPhone: (draft.comm_method === 'chat' || draft.commMethod === 'chat') ? '' : (draft.phone_number || profile.phone || ''),
      phone_number: (draft.comm_method === 'chat' || draft.commMethod === 'chat') ? '' : (draft.phone_number || profile.phone || ''),
      comm_method: draft.comm_method || draft.commMethod || 'whatsapp',
      college: draft.college || profile.college || '',
      year: draft.year || profile.batch || profile.year || '',
      mine: true,
      is_open: true,
      state: 'own'
    };

    setLocalPosts(prev => [newPost, ...prev].filter(p => !isMockPost(p)));
    setPostModalOpen(false);
    setEditingPost(null);
    setScreen('teams');
    setTeamFinderTab('mine');
    flash('Squad posted successfully!');

    if (user && authCreatePost) {
      try {
        const commMethod = draft.comm_method || draft.commMethod || 'whatsapp';
        const postPhone = commMethod === 'chat' ? '' : (draft.phone_number || profile.phone || '');
        const createdPost = await authCreatePost({
          competition_name: compTitle,
          competition_id: draft.competition_id || draft.compId || null,
          is_custom: Boolean(draft.is_custom),
          expires_at: draft.expires_at || null,
          organizer: compHost,
          competition_link: compLink,
          title: `Squad for ${compTitle}`,
          description: draft.desc,
          skills_looking_for: draft.skills_looking_for || draft.skills,
          skills_have: draft.skills_have || [],
          spots_left: draft.spots,
          total_members: draft.total_members || Math.max(2, draft.spots + 1),
          phone_number: postPhone,
          comm_method: commMethod,
          college: draft.college || profile.college || '',
          year: draft.year || profile.batch || profile.year || ''
        });
        if (createdPost && createdPost.id) {
          setLocalPosts(prev => prev.map(p => p.id === newPost.id ? createdPost : p));
        }
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
        title: 'Sign Up to Join this Squad',
        subtitle: 'Create your collegiate account to apply and connect directly with squad leads on WhatsApp.',
        initialTab: 'signup',
        postLoginAction: () => {
          setApplyTargetPost(post);
          setApplyModalOpen(true);
        }
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
      applicant_year: profile.batch || profile.year || '',
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
        const createdApp = await authApplySquad({
          post_id: targetPost.id,
          applicant_name: applicantName,
          applicant_phone: applicantPhone,
          applicant_college: profile.college || '',
          applicant_year: profile.batch || profile.year || '',
          pitch_note: pitchText,
          highlighted_skills: highlightedSkills.length > 0 ? highlightedSkills : profile.skills,
          comm_method: targetPost.comm_method || targetPost.commMethod || 'whatsapp'
        });
        if (createdApp && createdApp.id) {
          setLocalApplications(prev => prev.map(a => a.id === newApp.id ? createdApp : a));
        }
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

  const handleUndoDeclineApp = async (appId) => {
    setLocalApplications(prev => prev.map(a => a.id === appId ? { ...a, status: 'pending' } : a));
    flash('Moved back to pending');
    if (user) {
      try {
        if (authUpdateAppStatus) {
          await authUpdateAppStatus(appId, 'pending');
        } else if (authReapplySquad) {
          await authReapplySquad(appId);
        }
        if (refreshSquadData) refreshSquadData();
      } catch (err) {
        console.warn('Supabase reset to pending error:', err.message);
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
  // Legacy saved-alerts badge (feature removed; nothing is stored in the browser anymore)
  const totalNewAlerts = 0;
  const pendingInboxCount = applications.filter(a => a.dir === 'in' && a.status === 'pending').length;

  // Detail Drawer Target Competition
  const selectedDetailComp = detailCompId ? (visibleCompetitions.find(c => c.id === detailCompId) || competitions.find(c => c.id === detailCompId)) : null;
  const detailSquadCount = detailCompId ? posts.filter(p => p.compId === detailCompId).length : 0;

  const isBrowseMode = screen === 'browse';
  const isStandaloneMode = isBrowseMode || screen === 'teams';

  return (
    <div className={isStandaloneMode ? "onestop-app onestop-app-browse-mode" : "onestop-app"}>
      {/* Universal Mobile Topbar (identical on every screen per v3 spec) */}
      <div className="mobile-topbar">
        <OneStopLogo height={24} style={{ cursor: 'pointer' }} onClick={() => handleNavigate('home')} />
        <div className="mobile-topbar-actions">
          <button
            type="button"
            className="mobile-what-is-btn"
            onClick={() => setShowWalkthrough(true)}
            title="What is OneStop?"
            aria-label="What is OneStop?"
          >
            <span>What is OneStop?</span>
          </button>
          <NotificationCenter
            applications={applications}
            competitions={visibleCompetitions}
            bookmarks={bookmarks}
            posts={posts}
            profile={profile}
            roundsMap={roundsMap}
            onOpenWhatsApp={handleOpenWhatsApp}
            onOpenDetail={(id) => setDetailCompId(id)}
            onNavigate={handleNavigate}
            onToggleBookmark={handleToggleBookmark}
          />
        </div>
      </div>

      {/* Sidebar (Desktop only) */}
      {!isStandaloneMode && (
        <Sidebar
          screen={screen}
          onNavigate={handleNavigate}
          totalNewAlerts={totalNewAlerts}
          bookmarksCount={bookmarks.length}
          pendingInboxCount={pendingInboxCount}
          profile={profile}
          user={user}
          mobileOpen={false}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          onOpenWalkthrough={() => setShowWalkthrough(true)}
        />
      )}

      {/* Main Screen Content */}
      {screen === 'admin' ? (
        <Suspense fallback={null}>
          <AdminConsolePage
            onBack={() => handleNavigate('home')}
            user={user}
            profile={authProfile || profile}
          />
        </Suspense>
      ) : isBrowseMode ? (
        <CompetitionsPage
          key={screen}
          onBack={() => handleNavigate('home')}
          onNavigate={handleNavigate}
          onFindTeammates={handleFindTeammates}
          onOpenDetail={(id) => setDetailCompId(id)}
          showToast={flash}
          bookmarks={bookmarks}
          onToggleBookmark={handleToggleBookmark}
          bookmarkedOnly={false}
          isPostgraduate={isPostgraduate}
          initialCompetitions={visibleCompetitions}
          externalSortBy={browseSort}
          onSortChange={handleUpdateSort}
          onFilterPrefsChange={handleFilterPrefsChange}
          headerAction={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <NotificationCenter
                applications={applications}
                competitions={visibleCompetitions}
                bookmarks={bookmarks}
                posts={posts}
                profile={profile}
                roundsMap={roundsMap}
                onOpenWhatsApp={handleOpenWhatsApp}
                onOpenDetail={(id) => setDetailCompId(id)}
                onNavigate={handleNavigate}
                onToggleBookmark={handleToggleBookmark}
              />
            </div>
          }
        />
      ) : screen === 'teams' ? (
        <Suspense fallback={null}>
          <TeamFinderScreen
            key="teams"
            onBack={() => handleNavigate('home')}
            onNavigate={handleNavigate}
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
            onUndoDeclineApp={handleUndoDeclineApp}
            onRemoveApp={handleRemoveApp}
            onWithdrawApp={handleWithdrawApp}
            showToast={flash}
            onSubmitPost={handleSubmitPost}
            tab={teamFinderTab}
            onTabChange={setTeamFinderTab}
            headerAction={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <NotificationCenter
                  applications={applications}
                  competitions={visibleCompetitions}
                  bookmarks={bookmarks}
                  posts={posts}
                  profile={profile}
                  roundsMap={roundsMap}
                  onOpenWhatsApp={handleOpenWhatsApp}
                  onOpenDetail={(id) => setDetailCompId(id)}
                  onNavigate={handleNavigate}
                  onToggleBookmark={handleToggleBookmark}
                />
              </div>
            }
          />
        </Suspense>
      ) : (
        <main className={screen === 'home' ? "onestop-main onestop-main-home" : "onestop-main"}>
          {/* Top-Right Notification Center (for screens that don't embed it in their header) */}
          {screen !== 'teams' && screen !== 'home' && (
            <div className="onestop-top-actions">
              <NotificationCenter
                applications={applications}
                competitions={visibleCompetitions}
                bookmarks={bookmarks}
                posts={posts}
                profile={profile}
                roundsMap={roundsMap}
                onOpenWhatsApp={handleOpenWhatsApp}
                onOpenDetail={(id) => setDetailCompId(id)}
                onNavigate={handleNavigate}
                onToggleBookmark={handleToggleBookmark}
              />
            </div>
          )}
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
                headerAction={
                  <div className="home-header-actions">
                    <NotificationCenter
                      applications={applications}
                      competitions={visibleCompetitions}
                      bookmarks={bookmarks}
                      posts={posts}
                      profile={profile}
                      roundsMap={roundsMap}
                      onOpenWhatsApp={handleOpenWhatsApp}
                      onOpenDetail={(id) => setDetailCompId(id)}
                      onNavigate={handleNavigate}
                      onToggleBookmark={handleToggleBookmark}
                    />
                  </div>
                }
              />
            )}

            {screen === 'requests' && (
              <Suspense fallback={null}>
                <RequestsScreen
                  applications={applications}
                  posts={posts}
                  competitions={visibleCompetitions}
                  user={user}
                  profile={profile}
                  onAccept={handleAcceptApp}
                  onDecline={handleDeclineApp}
                  onRemove={handleRemoveApp}
                  onWithdraw={handleWithdrawApp}
                  onOpenWhatsApp={handleOpenWhatsApp}
                />
              </Suspense>
            )}

            {screen === 'profile' && (
              <Suspense fallback={null}>
                <ProfileScreen
                  profile={profile}
                  onSaveProfile={handleSaveProfile}
                  user={user}
                  onOpenAuthModal={() => openAuthModal && openAuthModal()}
                  onSignOut={signOut}
                  onChangePassword={changePassword}
                  onResetPassword={resetPassword}
                  onDeleteAccount={deleteAccount}
                  flashToast={flash}
                  onNavigate={handleNavigate}
                  isFromWalkthrough={fromWalkthrough}
                  onOpenWalkthrough={() => setShowWalkthrough(true)}
                />
              </Suspense>
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
        competitions={visibleCompetitions}
        initialCompId={postModalCompId}
        editingPost={editingPost}
        profile={profile}
        onSubmitPost={handleSubmitPost}
        onDeletePost={handleDeleteSquadPost}
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

      {/* Universal Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        screen={screen}
        onNavigate={handleNavigate}
        pendingInboxCount={pendingInboxCount}
        bookmarksCount={bookmarks.length}
        profile={profile}
        user={user}
      />

      {/* Mobile Shortcut / PWA Install Popup on Phone */}
      <InstallShortcutPopup
        onInstalled={() => flash('🎉 OneStop shortcut added to home screen! Ready on the go.')}
      />

      {/* Global Toast */}

      <Toast message={toastMessage} />

      {/* Supabase Auth Modal */}
      <AuthModal />

      {/* Set New Password Modal (for password recovery email links) */}
      <SetNewPasswordModal />

      {/* Walkthrough Tour Modal (downloaded only when opened) */}
      {showWalkthrough && (
        <Suspense fallback={null}>
          <WalkthroughModal
            isOpen={showWalkthrough}
            onClose={handleCloseWalkthrough}
            onComplete={handleCompleteWalkthrough}
          />
        </Suspense>
      )}

      {/* Fun Collegiate Boot Screen with Circular Ring Animation & Quotes */}
      {showBootScreen && (
        <FunLoadingScreen
          isReady={!competitionsLoading}
          minDurationMs={1500}
          maxDurationMs={3000}
          headline="Fetching live opportunities..."
          customPuns={GENERAL_PUNS}
          onComplete={handleBootComplete}
        />
      )}
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
