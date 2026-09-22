// src/App.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AuthProvider, useAuth, formatWhatsAppUrl, sanitizeIndianPhone } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import HomeScreen from './components/HomeScreen';
import BrowseScreen from './components/BrowseScreen';
import CompetitionsPage from './components/CompetitionsPage';
import { BellIcon } from './components/icons';
import DetailDrawer from './components/DetailDrawer';
import TeamFinderScreen from './components/TeamFinderScreen';
import PostSquadModal from './components/PostSquadModal';
import ApplyModal from './components/ApplyModal';
import RequestsScreen from './components/RequestsScreen';
import ProfileScreen from './components/ProfileScreen';
import Toast from './components/Toast';
import AuthModal from './components/AuthModal';

import {
  describeFilter,
  matchListing,
  isMockPost,
  isMockApp,
  isMockAlert,
  isMockBookmark
} from './data/initialData';

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
  const [screen, setScreen] = useState('home');

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

  // Browse Filters State (Auto-saved automatically on every filter change)
  const [browseFilters, setBrowseFilters] = useState(() => {
    try {
      const saved = localStorage.getItem('onestop_browse_filters');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          disc: Array.isArray(parsed.disc) ? parsed.disc : [],
          circ: Array.isArray(parsed.circ) ? parsed.circ : [],
          team: parsed.team || 'any',
          fee: parsed.fee || 'any',
          q: typeof parsed.q === 'string' ? parsed.q : '',
          sort: parsed.sort || 'deadline'
        };
      }
    } catch (e) {}
    return DEFAULT_FILTERS;
  });

  // Auto-save whenever browseFilters changes
  useEffect(() => {
    try {
      localStorage.setItem('onestop_browse_filters', JSON.stringify(browseFilters));
    } catch (e) {}
  }, [browseFilters]);

  const handleUpdateFilters = useCallback((changes) => {
    setBrowseFilters(prev => {
      const next = { ...prev, ...changes };
      try {
        localStorage.setItem('onestop_browse_filters', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

  const handleResetFilters = useCallback(() => {
    setBrowseFilters(DEFAULT_FILTERS);
    try {
      localStorage.setItem('onestop_browse_filters', JSON.stringify(DEFAULT_FILTERS));
    } catch (e) {}
  }, []);

  // Drawer and Modal States
  const [detailCompId, setDetailCompId] = useState(null);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [postModalCompId, setPostModalCompId] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyTargetPost, setApplyTargetPost] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
              id: c.id,
              title: c.title,
              host: c.orgName || 'Host Institution',
              circuit: circuitVal,
              discipline: disciplineVal,
              days: c.daysRemainingNum !== undefined ? c.daysRemainingNum : 7,
              prize: c.prizes || 'Recognition',
              team: c.teamSizeDisplay || `${c.minTeam || 1}–${c.maxTeam || 4}`,
              mode: c.remainDaysText || 'Online',
              fee: c.isFree ? 'Free' : (c.fee || 'Free'),
              desc: c.description || c.title,
              tags: [disciplineVal, circuitVal],
              regs: c.registeredCount || 0,
              logo: c.orgLogo || null,
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
    setScreen(newScreen);
    setDetailCompId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Find Teammates Button from Competition Card
  const handleFindTeammates = (comp) => {
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

    flash('Accepted — WhatsApp chat ready');

    if (user && authUpdateAppStatus) {
      try {
        await authUpdateAppStatus(appId, 'accepted');
        if (refreshSquadData) refreshSquadData();
      } catch (err) {
        console.warn('Supabase accept error:', err.message);
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

    flash('Member removed — spot re-opened');
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
    const rawPhone = appOrPost?.phone || appOrPost?.phone_number || appOrPost?.leadPhone || appOrPost?.applicant_phone || '';
    const name = appOrPost?.created_by_name || appOrPost?.lead || appOrPost?.applicant_name || appOrPost?.who || '';
    const comp = appOrPost?.competition_name || appOrPost?.displayTitle || appOrPost?.title || 'Competition';
    const message = `Hey ${name ? name.split(' ')[0] : ''}! Connecting regarding our squad for "${comp}".`;
    const waUrl = formatWhatsAppUrl(rawPhone, message);

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
          <img src="/logo-onestop.png" alt="OneStop" style={{ height: '22px', width: 'auto' }} />
          <div style={{ width: '32px' }}></div>
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
          headerAction={
            <button
              className="cc-header-notif-btn"
              onClick={() => handleNavigate('requests')}
              title="View requests and notifications"
              aria-label="Notifications"
            >
              <BellIcon size={18} />
              {pendingInboxCount > 0 ? (
                <span className="cc-header-notif-badge">{pendingInboxCount}</span>
              ) : (
                <span className="cc-header-notif-badge">5</span>
              )}
            </button>
          }
        />
      ) : (
        <main className={screen === 'home' ? "onestop-main onestop-main-home" : "onestop-main"}>
          {screen === 'home' && (
            <HomeScreen
              profile={profile}
              competitions={visibleCompetitions}
              savedFilter={browseFilters}
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
        </main>
      )}

      {/* Competition Detail Drawer */}
      <DetailDrawer
        item={selectedDetailComp}
        onClose={() => setDetailCompId(null)}
        isBookmarked={detailCompId ? bookmarks.includes(detailCompId) : false}
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
