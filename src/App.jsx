// src/App.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import HomeScreen from './components/HomeScreen';
import BrowseScreen from './components/BrowseScreen';
import DetailDrawer from './components/DetailDrawer';
import TeamFinderScreen from './components/TeamFinderScreen';
import PostSquadModal from './components/PostSquadModal';
import ApplyModal from './components/ApplyModal';
import RequestsScreen from './components/RequestsScreen';
import ProfileScreen from './components/ProfileScreen';
import Toast from './components/Toast';
import AuthModal from './components/AuthModal';

import {
  INITIAL_COMPETITIONS,
  INITIAL_POSTS,
  INITIAL_APPLICATIONS,
  INITIAL_ALERTS,
  describeFilter,
  matchListing
} from './data/initialData';

import './App.css';

const DEFAULT_PROFILE = {
  name: 'Arjun R.',
  college: 'SSCBS',
  batch: '2027',
  course: 'B.Com (H)',
  phone: '+91 98111 00210',
  skills: ['Finance modelling', 'Deck design']
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
    applyToSquad: authApplySquad,
    updateApplicationStatus: authUpdateAppStatus,
    updateProfile: authUpdateProfile,
    openAuthModal,
    signOut
  } = useAuth();

  // Screen State: 'home' | 'browse' | 'saved' | 'teams' | 'requests' | 'profile'
  const [screen, setScreen] = useState('home');

  // Competitions State
  const [competitions, setCompetitions] = useState(INITIAL_COMPETITIONS);

  // Bookmarks State (with default fallback to [1, 6])
  const [localBookmarks, setLocalBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem('onestop_bookmarks');
      return saved ? JSON.parse(saved) : [1, 6];
    } catch {
      return [1, 6];
    }
  });

  const bookmarks = authBookmarks && authBookmarks.length > 0 ? authBookmarks : localBookmarks;

  const handleToggleBookmark = useCallback((compId) => {
    if (authToggleBookmark) {
      authToggleBookmark(compId);
    }
    setLocalBookmarks(prev => {
      const next = prev.includes(compId) ? prev.filter(id => id !== compId) : [...prev, compId];
      localStorage.setItem('onestop_bookmarks', JSON.stringify(next));
      return next;
    });
  }, [authToggleBookmark]);

  // Saved Filter Alerts State
  const [alerts, setAlerts] = useState(() => {
    try {
      const saved = localStorage.getItem('onestop_saved_alerts');
      return saved ? JSON.parse(saved) : INITIAL_ALERTS;
    } catch {
      return INITIAL_ALERTS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('onestop_saved_alerts', JSON.stringify(alerts));
    } catch (e) {
      console.warn('Failed to save alerts to local storage:', e);
    }
  }, [alerts]);

  // Squad Posts State
  const [posts, setPosts] = useState(() => {
    try {
      const saved = localStorage.getItem('onestop_posts');
      return saved ? JSON.parse(saved) : INITIAL_POSTS;
    } catch {
      return INITIAL_POSTS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('onestop_posts', JSON.stringify(posts));
    } catch (e) {}
  }, [posts]);

  // Squad Applications State
  const [applications, setApplications] = useState(() => {
    try {
      const saved = localStorage.getItem('onestop_applications');
      return saved ? JSON.parse(saved) : INITIAL_APPLICATIONS;
    } catch {
      return INITIAL_APPLICATIONS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('onestop_applications', JSON.stringify(applications));
    } catch (e) {}
  }, [applications]);

  // Profile State
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('onestop_user_profile');
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  // Sync profile when Supabase profile loads
  useEffect(() => {
    if (authProfile && authProfile.full_name) {
      setProfile(prev => ({
        ...prev,
        name: authProfile.full_name,
        college: authProfile.college || prev.college,
        course: authProfile.course || prev.course,
        batch: authProfile.year || prev.batch,
        phone: authProfile.phone || prev.phone,
        skills: authProfile.skills || prev.skills || DEFAULT_PROFILE.skills
      }));
    }
  }, [authProfile]);

  const handleSaveProfile = useCallback(async (updatedData) => {
    setProfile(updatedData);
    localStorage.setItem('onestop_user_profile', JSON.stringify(updatedData));

    if (user && authUpdateProfile) {
      try {
        await authUpdateProfile({
          fullName: updatedData.name,
          college: updatedData.college,
          course: updatedData.course,
          year: updatedData.batch,
          phone: updatedData.phone
        });
      } catch (err) {
        console.warn('Supabase profile sync warning:', err.message);
      }
    }
    flash('Profile updated');
  }, [user, authUpdateProfile]);

  // Browse Filters State
  const [browseFilters, setBrowseFilters] = useState({
    disc: [],
    circ: [],
    team: 'any',
    fee: 'any',
    q: '',
    sort: 'deadline'
  });

  // Drawer and Modal States
  const [detailCompId, setDetailCompId] = useState(null);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [postModalCompId, setPostModalCompId] = useState(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyTargetPost, setApplyTargetPost] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Toast System
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
    }, 2600);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Fetch Live Competitions from /api/competitions with graceful fallback
  useEffect(() => {
    let isMounted = true;
    async function loadCompetitions() {
      try {
        const res = await fetch(`/api/competitions?t=${Date.now()}`);
        if (!res.ok) return;
        const json = await res.json();
        if (isMounted && json.success && Array.isArray(json.data) && json.data.length > 0) {
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
              unstopUrl: c.unstopUrl || 'https://unstop.com'
            };
          });

          // Merge with starter items so all 12 key competitions exist
          const existingIds = new Set(mapped.map(m => m.id));
          const combined = [...mapped, ...INITIAL_COMPETITIONS.filter(i => !existingIds.has(i.id))];
          setCompetitions(combined);
        }
      } catch (e) {
        console.info('Using high-fidelity reference competitions dataset.');
      }
    }
    loadCompetitions();
    return () => {
      isMounted = false;
    };
  }, []);

  // Navigation Handler
  const handleNavigate = (newScreen) => {
    setScreen(newScreen);
    setDetailCompId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Saved Filter Alert Actions
  const currentFilterDesc = describeFilter(browseFilters);
  const alreadySaved = alerts.some(a => describeFilter(a) === currentFilterDesc);

  const handleSaveFilter = () => {
    if (alreadySaved) {
      flash('Already saved');
      return;
    }
    const newAlert = {
      id: `a${Date.now()}`,
      disc: browseFilters.disc,
      circ: browseFilters.circ,
      team: browseFilters.team,
      fee: browseFilters.fee,
      win: 'any',
      fresh: 0
    };
    setAlerts(prev => [...prev, newAlert]);
    flash('Saved — you will be alerted on new matches');
  };

  const handleDeleteAlert = (alertId) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
    flash('Alert removed');
  };

  const handleOpenAlert = (alertItem) => {
    setBrowseFilters({
      disc: alertItem.disc || [],
      circ: alertItem.circ || [],
      team: alertItem.team || 'any',
      fee: alertItem.fee || 'any',
      q: '',
      sort: 'deadline'
    });
    setScreen('browse');
  };

  // Find Teammates Button from Competition Card
  const handleFindTeammates = (comp) => {
    setPostModalCompId(comp.id);
    setScreen('teams');
    setPostModalOpen(true);
  };

  // Post a Squad Submission
  const handleSubmitPost = (draft) => {
    const newPost = {
      id: `p${Date.now()}`,
      compId: draft.compId,
      spots: draft.spots,
      filled: 1,
      size: Math.max(2, draft.spots + 1),
      posted: 'just now',
      desc: draft.desc,
      want: draft.skills,
      lead: 'You',
      leadPhone: profile.phone || '+91 98111 00210',
      mine: true,
      state: 'own'
    };

    setPosts(prev => [newPost, ...prev]);
    setPostModalOpen(false);
    setScreen('teams');
    flash('Squad posted');

    if (user && authCreatePost) {
      const comp = competitions.find(c => c.id === draft.compId);
      authCreatePost({
        competition_name: comp?.title || 'Competition',
        organizer: comp?.host || '',
        competition_link: comp?.unstopUrl || '',
        title: `Squad for ${comp?.title || 'Competition'}`,
        description: draft.desc,
        skills_looking_for: draft.skills,
        spots_left: draft.spots,
        total_members: Math.max(2, draft.spots + 1),
        phone_number: profile.phone || ''
      }).catch(err => console.warn('Supabase post creation error:', err.message));
    }
  };

  // Request to Join Application
  const handleOpenApply = (post) => {
    setApplyTargetPost(post);
    setApplyModalOpen(true);
  };

  const handleSubmitApply = (targetPost, pitchText) => {
    const comp = competitions.find(c => c.id === targetPost.compId);
    const newApp = {
      id: `ap${Date.now()}`,
      postId: targetPost.id,
      who: 'You',
      meta: comp ? comp.title : 'Competition',
      phone: profile.phone || '+91 98111 00210',
      skills: profile.skills || [],
      pitch: pitchText,
      status: 'pending',
      dir: 'out'
    };

    setApplications(prev => [...prev, newApp]);
    setPosts(prev => prev.map(p => p.id === targetPost.id ? { ...p, state: 'requested' } : p));
    setApplyModalOpen(false);
    setApplyTargetPost(null);

    const leadFirst = targetPost.lead ? targetPost.lead.split(' ')[0] : 'lead';
    flash(`Request sent to ${leadFirst}`);

    if (user && authApplySquad) {
      authApplySquad({
        post_id: targetPost.id,
        applicant_name: profile.name,
        applicant_phone: profile.phone,
        pitch_note: pitchText,
        highlighted_skills: profile.skills
      }).catch(err => console.warn('Supabase apply error:', err.message));
    }
  };

  // Applications Actions
  const handleAcceptApp = (appId) => {
    const targetApp = applications.find(a => a.id === appId);
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: 'accepted' } : a));

    if (targetApp) {
      setPosts(prev => prev.map(p => {
        if (p.id === targetApp.postId) {
          const nextFilled = (p.filled || 1) + 1;
          const nextSpots = Math.max(0, (p.size || 4) - nextFilled);
          return { ...p, filled: nextFilled, spots: nextSpots };
        }
        return p;
      }));
    }

    flash('Accepted — WhatsApp number shared');

    if (user && authUpdateAppStatus) {
      authUpdateAppStatus(appId, 'accepted').catch(err => console.warn('Supabase accept error:', err.message));
    }
  };

  const handleDeclineApp = (appId) => {
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: 'rejected' } : a));
    if (user && authUpdateAppStatus) {
      authUpdateAppStatus(appId, 'rejected').catch(err => console.warn('Supabase decline error:', err.message));
    }
  };

  const handleWithdrawApp = (appId) => {
    setApplications(prev => prev.filter(a => a.id !== appId));
    flash('Request withdrawn');
  };

  // WhatsApp Handshake Launcher
  const handleOpenWhatsApp = (appOrPost) => {
    flash('Opening WhatsApp…');
    let phoneDigits = '9811100210';
    if (appOrPost.phone) {
      phoneDigits = String(appOrPost.phone).replace(/\D/g, '').slice(-10);
    } else if (appOrPost.leadPhone) {
      phoneDigits = String(appOrPost.leadPhone).replace(/\D/g, '').slice(-10);
    }
    const waUrl = `https://wa.me/91${phoneDigits}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // Derived Counts for Sidebar Badges
  const totalNewAlerts = alerts.reduce((acc, a) => acc + (a.fresh || 0), 0);
  const pendingInboxCount = applications.filter(a => a.dir === 'in' && a.status === 'pending').length;

  // Detail Drawer Target Competition
  const selectedDetailComp = detailCompId ? competitions.find(c => c.id === detailCompId) : null;
  const detailSquadCount = detailCompId ? posts.filter(p => p.compId === detailCompId).length : 0;

  return (
    <div className="onestop-app">
      {/* Mobile Topbar */}
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

      {/* Sidebar */}
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

      {/* Main Screen Content */}
      <main className="onestop-main">
        {screen === 'home' && (
          <HomeScreen
            profile={profile}
            competitions={competitions}
            alerts={alerts}
            onOpenAlert={handleOpenAlert}
            onDeleteAlert={handleDeleteAlert}
            onAddAlert={() => {
              setScreen('browse');
              setBrowseFilters({ disc: [], circ: [], team: 'any', fee: 'any', q: '', sort: 'deadline' });
            }}
            applications={applications}
            posts={posts}
            onAcceptApp={handleAcceptApp}
            onRejectApp={handleDeclineApp}
            onGoRequests={() => handleNavigate('requests')}
            onGoBrowse={() => handleNavigate('browse')}
          />
        )}

        {(screen === 'browse' || screen === 'saved') && (
          <BrowseScreen
            isBookmarks={screen === 'saved'}
            competitions={competitions}
            bookmarks={bookmarks}
            onToggleBookmark={handleToggleBookmark}
            filters={browseFilters}
            onUpdateFilters={(changes) => setBrowseFilters(prev => ({ ...prev, ...changes }))}
            onResetFilters={() => setBrowseFilters({ disc: [], circ: [], team: 'any', fee: 'any', q: '', sort: 'deadline' })}
            onOpenDetail={(id) => setDetailCompId(id)}
            onFindTeammates={handleFindTeammates}
            onSaveFilter={handleSaveFilter}
            alreadySaved={alreadySaved}
            onSwitchScope={(targetScope) => setScreen(targetScope)}
          />
        )}

        {screen === 'teams' && (
          <TeamFinderScreen
            posts={posts}
            competitions={competitions}
            profile={profile}
            onOpenPostSquad={(comp) => {
              setPostModalCompId(comp ? comp.id : null);
              setPostModalOpen(true);
            }}
            onOpenApply={handleOpenApply}
            onOpenWhatsApp={handleOpenWhatsApp}
            onGoRequests={() => handleNavigate('requests')}
          />
        )}

        {screen === 'requests' && (
          <RequestsScreen
            applications={applications}
            posts={posts}
            competitions={competitions}
            onAccept={handleAcceptApp}
            onDecline={handleDeclineApp}
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

      {/* Competition Detail Drawer */}
      <DetailDrawer
        item={selectedDetailComp}
        onClose={() => setDetailCompId(null)}
        isBookmarked={detailCompId ? bookmarks.includes(detailCompId) : false}
        onToggleBookmark={handleToggleBookmark}
        onOpenPostSquad={(comp) => {
          setDetailCompId(null);
          setPostModalCompId(comp.id);
          setPostModalOpen(true);
        }}
        squadsCount={detailSquadCount}
      />

      {/* Post a Squad Modal */}
      <PostSquadModal
        isOpen={postModalOpen}
        onClose={() => {
          setPostModalOpen(false);
          setPostModalCompId(null);
        }}
        competitions={competitions}
        initialCompId={postModalCompId}
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
