// src/components/SquadFinderPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, formatWhatsAppUrl, sanitizeIndianPhone } from '../context/AuthContext';
import {
  UsersIcon,
  PlusIcon,
  SearchIcon,
  WhatsAppIcon,
  CheckIcon,
  ClockIcon,
  CalendarIcon,
  TrophyIcon,
  ExternalLinkIcon,
  LockIcon,
  ShieldCheckIcon,
  SettingsIcon,
  RotateCcwIcon,
  CloseIcon,
  AlertCircleIcon,
  UserIcon
} from './icons';
import './SquadFinderPage.css';

function GoogleIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
        fill="#4285F4"
      />
      <path
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.27v3.15C3.25 21.27 7.31 24 12 24z"
        fill="#34A853"
      />
      <path
        d="M5.28 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26V6.59H1.27C.46 8.21 0 10.05 0 12s.46 3.79 1.27 5.41l4.01-3.15z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.73 1.27 6.59l4.01 3.15c.95-2.84 3.6-4.99 6.72-4.99z"
        fill="#EA4335"
      />
    </svg>
  );
}

const PRESET_SKILLS = [
  'Financial Modeling',
  'Valuation & DCF',
  'Slide Deck & UI Design',
  'Public Speaking & Pitching',
  'Market Research & Strategy',
  'Python & Data Analytics',
  'Fullstack Dev / Tech',
  'Economics & Policy'
];

const POST_EXPIRATION_MS = 168 * 60 * 60 * 1000; // 7 days (168 hours)

export default function SquadFinderPage({ prefillData, onClearPrefill, showToast }) {
  const {
    user,
    profile,
    squadPosts,
    squadApps,
    createSquadPost,
    applyToSquad,
    updateApplicationStatus,
    reapplyToSquad,
    togglePostOpen,
    deleteSquadPost,
    refreshSquadData,
    openAuthModal,
    openProfileModal,
    signInWithGoogle
  } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState('explore'); // 'explore' | 'my-squads'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkillFilter, setSelectedSkillFilter] = useState('all');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showReapplyModal, setShowReapplyModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [targetPostForApply, setTargetPostForApply] = useState(null);
  const [targetPostForReview, setTargetPostForReview] = useState(null);
  const [targetPostForDetail, setTargetPostForDetail] = useState(null);
  const [targetAppForReapply, setTargetAppForReapply] = useState(null);

  // Form States
  const [formData, setFormData] = useState({
    competition_name: '',
    organizer: '',
    competition_link: '',
    phone_number: '',
    title: '',
    description: '',
    skills_have: [],
    skills_looking_for: [],
    total_members: 4,
    spots_left: 1,
    college: '',
    course: '',
    year: '2nd Year',
  });

  const [applyForm, setApplyForm] = useState({
    applicant_name: '',
    applicant_phone: '',
    applicant_college: '',
    applicant_course: '',
    applicant_year: '2nd Year',
    pitch_note: '',
    highlighted_skills: []
  });

  const [reapplyForm, setReapplyForm] = useState({
    applicant_phone: '',
    pitch_note: '',
    highlighted_skills: []
  });

  // Check for prefill from Competitions Page ("Find Teammates" click)
  useEffect(() => {
    let data = prefillData;
    if (!data) {
      const rawSaved = sessionStorage.getItem('comp_team_prefill');
      if (rawSaved) {
        try {
          data = JSON.parse(rawSaved);
        } catch (e) {
          sessionStorage.removeItem('comp_team_prefill');
        }
      }
    }

    if (data && data.competition_name) {
      setFormData(prev => ({
        ...prev,
        competition_name: data.competition_name || '',
        organizer: data.organizer || '',
        competition_link: data.competition_link || '',
        total_members: data.total_members || 4,
        spots_left: Math.max(1, (data.total_members || 4) - 1),
        title: `Building winning squad for ${data.competition_name.slice(0, 45)}...`,
        college: profile?.college || '',
        phone_number: profile?.phone || '',
      }));
      setShowCreateModal(true);
      sessionStorage.removeItem('comp_team_prefill');
      if (onClearPrefill) onClearPrefill();
    }
  }, [prefillData, onClearPrefill, profile]);

  // Sync profile defaults into forms when profile loads
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        college: prev.college || profile.college || '',
        phone_number: prev.phone_number || profile.phone || '',
      }));
    }
  }, [profile]);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowCreateModal(false);
        setShowApplyModal(false);
        setShowReapplyModal(false);
        setShowReviewModal(false);
        setShowDetailModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Spot Accounting Helper (100% SSCBS OS calculation logic)
  const getPostOpenSpots = (post) => {
    if (!post) return 0;
    const acceptedList = Array.isArray(post.accepted_emails) ? post.accepted_emails : [];
    const initialOpen = post.initial_open_spots !== undefined && post.initial_open_spots !== null
      ? post.initial_open_spots
      : Math.max(1, (post.spots_left || 0) + acceptedList.length);
    return Math.max(0, initialOpen - acceptedList.length);
  };

  // Get current user's latest application status for a post
  const getUserAppForPost = (postId) => {
    if (!user) return null;
    const userApps = squadApps.filter(
      a => a.post_id === postId && (a.applicant_email === user.email || a.applicant_id === user.id)
    );
    if (userApps.length === 0) return null;
    // Priority: accepted > pending > declined > removed
    const accepted = userApps.find(a => a.status === 'accepted');
    if (accepted) return accepted;
    const pending = userApps.find(a => a.status === 'pending');
    if (pending) return pending;
    const declined = userApps.find(a => a.status === 'declined' || a.status === 'rejected');
    if (declined) return declined;
    return userApps[0];
  };

  // Filter squad posts (7-day freshness check + search + skills filter)
  const filteredPosts = useMemo(() => {
    const now = Date.now();
    return squadPosts.filter(post => {
      // 7-day expiration check
      if (post.created_at) {
        const postTime = new Date(post.created_at).getTime();
        if (!isNaN(postTime) && (now - postTime) > POST_EXPIRATION_MS) {
          return false;
        }
      }

      // Skill filter
      if (selectedSkillFilter !== 'all' && !post.skills_looking_for?.includes(selectedSkillFilter)) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const compMatch = (post.competition_name || '').toLowerCase().includes(q);
        const titleMatch = (post.title || '').toLowerCase().includes(q);
        const descMatch = (post.description || '').toLowerCase().includes(q);
        const orgMatch = (post.organizer || '').toLowerCase().includes(q);
        const collegeMatch = (post.college || '').toLowerCase().includes(q);
        const creatorMatch = (post.created_by_name || '').toLowerCase().includes(q);
        const skillsMatch = (post.skills_looking_for || []).some(s => s.toLowerCase().includes(q));
        if (!compMatch && !titleMatch && !descMatch && !orgMatch && !collegeMatch && !creatorMatch && !skillsMatch) {
          return false;
        }
      }

      return true;
    });
  }, [squadPosts, selectedSkillFilter, searchQuery]);

  // User's own postings and applications
  const myPosts = useMemo(() => {
    if (!user) return [];
    return squadPosts.filter(p => p.created_by_email === user.email || p.user_id === user.id);
  }, [squadPosts, user]);

  const myApps = useMemo(() => {
    if (!user) return [];
    return squadApps.filter(a => a.applicant_email === user.email || a.applicant_id === user.id);
  }, [squadApps, user]);

  // Create Post Submit Handler
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.competition_name.trim() || !formData.title.trim() || !formData.description.trim()) {
      alert('Please provide competition name, title, and team pitch description.');
      return;
    }

    const cleanPhone = sanitizeIndianPhone(formData.phone_number);
    if (!cleanPhone || cleanPhone.length !== 10) {
      alert('Please enter a valid 10-digit Indian WhatsApp number for squad coordination.');
      return;
    }

    try {
      await createSquadPost({
        ...formData,
        phone_number: cleanPhone
      });
      setShowCreateModal(false);
      if (showToast) showToast('Squad opening posted successfully!');
      setActiveSubTab('explore');
      // Reset form
      setFormData({
        competition_name: '',
        organizer: '',
        competition_link: '',
        phone_number: profile?.phone || '',
        title: '',
        description: '',
        skills_have: [],
        skills_looking_for: [],
        total_members: 4,
        spots_left: 1,
        college: profile?.college || '',
        course: '',
        year: '2nd Year',
      });
    } catch (err) {
      alert(err.message || 'Failed to create squad opening.');
    }
  };

  // Open Apply Modal
  const openApplyModal = (post, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!user) {
      openAuthModal({
        title: 'Sign In to Apply',
        subtitle: `Join or sign in to OneStop to apply for "${post.competition_name}".`,
        initialTab: 'signin',
      });
      return;
    }

    setTargetPostForApply(post);
    setApplyForm({
      applicant_name: profile?.full_name || user?.user_metadata?.full_name || '',
      applicant_phone: profile?.phone || user?.user_metadata?.phone || '',
      applicant_college: profile?.college || user?.user_metadata?.college || '',
      applicant_course: profile?.course || '',
      applicant_year: profile?.year || '2nd Year',
      pitch_note: '',
      highlighted_skills: []
    });
    setShowApplyModal(true);
  };

  // Submit Join Application
  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!applyForm.applicant_name.trim() || !applyForm.pitch_note.trim()) {
      alert('Please fill in your name and pitch note.');
      return;
    }

    const cleanPhone = sanitizeIndianPhone(applyForm.applicant_phone);
    if (!cleanPhone || cleanPhone.length !== 10) {
      alert('Please enter a valid 10-digit Indian WhatsApp phone number so the host can contact you.');
      return;
    }

    try {
      await applyToSquad({
        post_id: targetPostForApply.id,
        competition_name: targetPostForApply.competition_name,
        ...applyForm,
        applicant_phone: cleanPhone,
      });
      setShowApplyModal(false);
      if (showToast) showToast('Application submitted to squad lead!');
      setActiveSubTab('my-squads');
    } catch (err) {
      alert(err.message || 'Failed to submit squad application.');
    }
  };

  // Open Re-apply Modal
  const openReapplyModal = (app, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setTargetAppForReapply(app);
    setReapplyForm({
      applicant_phone: app.applicant_phone || profile?.phone || '',
      pitch_note: app.pitch_note || '',
      highlighted_skills: app.highlighted_skills || []
    });
    setShowReapplyModal(true);
  };

  // Submit Re-apply
  const handleReapplySubmit = async (e) => {
    e.preventDefault();
    if (!reapplyForm.pitch_note.trim()) {
      alert('Please provide an updated pitch note.');
      return;
    }

    const cleanPhone = sanitizeIndianPhone(reapplyForm.applicant_phone);
    if (!cleanPhone || cleanPhone.length !== 10) {
      alert('Please enter a valid 10-digit Indian WhatsApp number.');
      return;
    }

    try {
      await reapplyToSquad(targetAppForReapply.id, {
        pitch_note: reapplyForm.pitch_note,
        applicant_phone: cleanPhone,
        highlighted_skills: reapplyForm.highlighted_skills
      });
      setShowReapplyModal(false);
      if (showToast) showToast('Application re-submitted for review!');
    } catch (err) {
      alert(err.message || 'Failed to re-apply.');
    }
  };

  // Open Host Review Modal
  const openReviewModal = (post, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setTargetPostForReview(post);
    setShowReviewModal(true);
  };

  // Open Full Detail Modal
  const openDetailModal = (post) => {
    setTargetPostForDetail(post);
    setShowDetailModal(true);
  };

  // Accept Teammate Action
  const handleAcceptTeammate = async (appId) => {
    try {
      await updateApplicationStatus(appId, 'accepted');
      if (showToast) showToast('Teammate accepted! Seat filled.');
    } catch (err) {
      alert('Failed to accept teammate: ' + err.message);
    }
  };

  // Decline Teammate Action
  const handleDeclineTeammate = async (appId) => {
    try {
      await updateApplicationStatus(appId, 'declined');
      if (showToast) showToast('Application declined.');
    } catch (err) {
      alert('Failed to decline application: ' + err.message);
    }
  };

  // Remove Accepted Teammate (Reopens Spot!)
  const handleRemoveTeammate = async (appId) => {
    if (!window.confirm('Remove this teammate from your squad? Their spot will be reopened for new applicants.')) {
      return;
    }
    try {
      await updateApplicationStatus(appId, 'removed');
      if (showToast) showToast('Teammate removed. Spot reopened!');
    } catch (err) {
      alert('Failed to remove teammate: ' + err.message);
    }
  };

  // Toggles for Skill Checkboxes
  const toggleSkillHave = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills_have: prev.skills_have.includes(skill)
        ? prev.skills_have.filter(s => s !== skill)
        : [...prev.skills_have, skill]
    }));
  };

  const toggleSkillLookingFor = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills_looking_for: prev.skills_looking_for.includes(skill)
        ? prev.skills_looking_for.filter(s => s !== skill)
        : [...prev.skills_looking_for, skill]
    }));
  };

  const toggleApplicantSkill = (skill) => {
    setApplyForm(prev => ({
      ...prev,
      highlighted_skills: prev.highlighted_skills.includes(skill)
        ? prev.highlighted_skills.filter(s => s !== skill)
        : [...prev.highlighted_skills, skill]
    }));
  };

  const toggleReapplySkill = (skill) => {
    setReapplyForm(prev => ({
      ...prev,
      highlighted_skills: prev.highlighted_skills.includes(skill)
        ? prev.highlighted_skills.filter(s => s !== skill)
        : [...prev.highlighted_skills, skill]
    }));
  };

  // If user is unauthenticated, show membership gate preview
  if (!user) {
    return (
      <div className="squad-finder-view squad-finder-gated">
        <section className="squad-gate-hero">
          <div className="squad-gate-card">
            <div className="squad-gate-top">
              <div className="squad-gate-lock-badge">
                <LockIcon size={16} color="var(--color-lab-blue)" />
                <span>STUDENT NETWORK</span>
              </div>
              <span className="squad-gate-brand">TWO19 LABS / SQUAD FINDER</span>
            </div>

            <h1 className="squad-gate-title">
              Sign in to unlock Squad Finder & teammate recruitment
            </h1>

            <p className="squad-gate-sub">
              Finding competitions is free for everyone. But recruiting teammates, viewing verified collegiate profiles, and coordinating over WhatsApp requires a OneStop student account.
            </p>

            {prefillData && prefillData.competition_name && (
              <div className="squad-gate-comp-banner">
                <TrophyIcon size={16} color="var(--color-lab-blue)" />
                <span>
                  Ready to recruit a squad for: <strong>{prefillData.competition_name}</strong>
                </span>
              </div>
            )}

            <div className="squad-gate-cta-group">
              <button
                className="squad-gate-google-btn"
                onClick={() => signInWithGoogle().catch(err => alert(err.message))}
              >
                <GoogleIcon size={18} />
                <span>Continue with Google</span>
              </button>

              <button
                className="squad-gate-email-btn"
                onClick={() => openAuthModal({
                  title: 'Sign In to Squad Finder',
                  initialTab: 'signin',
                  postLoginAction: prefillData ? () => setShowCreateModal(true) : null
                })}
              >
                Sign in with Email
              </button>

              <button
                className="squad-gate-signup-btn"
                onClick={() => openAuthModal({
                  title: 'Join OneStop Squad Network',
                  initialTab: 'signup',
                  postLoginAction: prefillData ? () => setShowCreateModal(true) : null
                })}
              >
                Create Free Account
              </button>
            </div>

            <div className="squad-gate-features">
              <div className="squad-gate-feature-item">
                <ShieldCheckIcon size={16} color="var(--color-lab-blue)" />
                <span>Verified student network across DU, IITs, IIMs, BITS & Premier Colleges</span>
              </div>
              <div className="squad-gate-feature-item">
                <WhatsAppIcon size={16} />
                <span>1-Click WhatsApp direct chat with squad leaders</span>
              </div>
              <div className="squad-gate-feature-item">
                <CheckIcon size={16} color="var(--color-lab-blue)" />
                <span>Skill matching (DCF, Valuation, Slide Design, Python, Tech)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Locked Preview / Teaser Feed */}
        <section className="squad-gate-teaser-section">
          <div className="squad-gate-teaser-header">
            <div className="squad-gate-teaser-title-row">
              <h2 className="squad-gate-teaser-title">Active Collegiate Squad Openings</h2>
              <span className="squad-gate-teaser-pill">LOCKED PREVIEW</span>
            </div>
            <p className="squad-gate-teaser-subtitle">
              Sign in to view contact details, message squad leads on WhatsApp, or post your own opening.
            </p>
          </div>

          {squadPosts.length > 0 ? (
            <div className="squad-gate-teaser-grid">
              {squadPosts.slice(0, 3).map((item, idx) => (
                <div key={item.id || idx} className="squad-gate-teaser-card">
                  <div className="squad-gate-card-overlay">
                    <button
                      className="squad-gate-overlay-badge"
                      onClick={() => openAuthModal({ title: 'Sign In to Connect', initialTab: 'signin' })}
                    >
                      <LockIcon size={14} />
                      <span>Sign In to Unlock & Contact</span>
                    </button>
                  </div>

                  <div className="squad-gate-card-content">
                    <div className="squad-gate-card-comp">
                      <TrophyIcon size={14} color="var(--color-lab-blue)" />
                      <span>{item.competition_name}</span>
                    </div>
                    <h4 className="squad-gate-card-title">{item.title}</h4>
                    <div className="squad-gate-card-meta">
                      <span>{item.college || 'Collegiate Network'}</span>
                      <span>·</span>
                      <span>{getPostOpenSpots(item)} spots open</span>
                    </div>
                    <div className="squad-gate-card-skills">
                      {(item.skills_looking_for || []).slice(0, 3).map((s, i) => (
                        <span key={i} className="squad-gate-skill-tag">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="squad-gate-empty-state">
              <p>No squad openings have been posted yet.</p>
              <button
                type="button"
                className="btn-create-squad"
                onClick={() => openAuthModal({ title: 'Sign In to Post a Squad', initialTab: 'signin' })}
              >
                <PlusIcon size={16} />
                <span>Sign In &amp; Post the First Opening</span>
              </button>
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="squad-finder-view">
      {/* Squad Hero Banner */}
      <section className="squad-hero">
        <div className="squad-hero-content">
          <div className="squad-badge">
            <UsersIcon size={15} color="var(--primary)" />
            <span>Collegiate Peer Recruitment</span>
          </div>
          <h1 className="squad-title">Find teammates with complementary skills & win together.</h1>
          <p className="squad-sub">
            Form high-synergy squads for Case Competitions, Hackathons, and Mock Stocks. Connect directly via WhatsApp once accepted.
          </p>
        </div>

        <div className="squad-header-actions">
          <button
            type="button"
            className="btn-refresh-action"
            onClick={refreshSquadData}
            title="Refresh listings"
          >
            <RotateCcwIcon size={14} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn-profile-settings-action"
            onClick={openProfileModal}
            title="Update your collegiate profile details"
          >
            <SettingsIcon size={16} />
            <span>Profile Settings</span>
          </button>

          <button className="btn-create-squad" onClick={() => setShowCreateModal(true)}>
            <PlusIcon size={18} />
            <span>Post Squad Opening</span>
          </button>
        </div>
      </section>

      {/* Subtabs Switcher: Explore vs My Postings & Applications */}
      <div className="squad-tab-controls">
        <div className="squad-subtabs">
          <button
            className={`subtab-btn ${activeSubTab === 'explore' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('explore')}
          >
            <span>Explore Squads</span>
            <span className="subtab-count">{filteredPosts.length}</span>
          </button>

          <button
            className={`subtab-btn ${activeSubTab === 'my-squads' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('my-squads')}
          >
            <span>My Postings & Applications</span>
            {(myPosts.length > 0 || myApps.length > 0) && (
              <span className="subtab-count highlight">{myPosts.length + myApps.length}</span>
            )}
          </button>
        </div>
      </div>

      {activeSubTab === 'explore' ? (
        <>
          {/* Search & Skill Chips Bar */}
          <div className="squad-filter-bar">
            <div className="squad-search-wrap">
              <SearchIcon size={17} className="squad-search-icon" />
              <input
                type="text"
                className="squad-search-input"
                placeholder="Search squads by competition, college, role, or skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="squad-clear-search-btn"
                  onClick={() => setSearchQuery('')}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="squad-skills-scroll">
              <button
                className={`skill-pill ${selectedSkillFilter === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedSkillFilter('all')}
              >
                All Skills
              </button>
              {PRESET_SKILLS.map(skill => (
                <button
                  key={skill}
                  className={`skill-pill ${selectedSkillFilter === skill ? 'active' : ''}`}
                  onClick={() => setSelectedSkillFilter(skill)}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Squad Posts Grid */}
          <div className="squad-posts-grid">
            {filteredPosts.length === 0 ? (
              <div className="squad-empty-state">
                <div className="empty-icon">🤝</div>
                <h3>No open squads match your filter</h3>
                <p>Be the first one to create a squad opening for your target competition!</p>
                <button className="btn-create-squad" onClick={() => setShowCreateModal(true)}>
                  Post Opening Now
                </button>
              </div>
            ) : (
              filteredPosts.map(post => {
                const isUserPost = post.created_by_email === user?.email || post.user_id === user?.id;
                const openSpots = getPostOpenSpots(post);
                const totalMembers = post.total_members || 4;
                const filledCount = Math.min(totalMembers, Math.max(0, totalMembers - openSpots));
                const userApp = getUserAppForPost(post.id);
                const isSquadFull = openSpots === 0 || !post.is_open;
                const pendingApplicantsCount = squadApps.filter(a => a.post_id === post.id && a.status === 'pending').length;

                return (
                  <article
                    key={post.id}
                    className={`squad-card ${isUserPost ? 'is-owner' : ''}`}
                    onClick={() => openDetailModal(post)}
                  >
                    {/* Header Row: Competition & Spots Badge */}
                    <div className="squad-card-header">
                      <div className="squad-comp-meta">
                        <div className="squad-comp-name" title={post.competition_name}>
                          <TrophyIcon size={14} color="var(--primary)" />
                          <span>{post.competition_name}</span>
                        </div>
                        {post.organizer && <span className="squad-org-name">{post.organizer}</span>}
                      </div>

                      {/* Squad Spots & Visual Seat Dots */}
                      <div className="squad-spots-meta">
                        <div className={`squad-spots-badge ${isSquadFull ? 'full' : 'open'}`}>
                          <span className="spots-num">{openSpots}</span>
                          <span className="spots-text">{openSpots === 1 ? 'spot left' : 'spots left'}</span>
                        </div>
                        {/* Visual Squad Dots Indicator */}
                        <div className="squad-dots-container" title={`${filledCount} of ${totalMembers} seats filled`}>
                          {Array.from({ length: totalMembers }).map((_, idx) => (
                            <span
                              key={idx}
                              className={`squad-dot ${idx < filledCount ? 'filled' : 'empty'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <h3 className="squad-post-title">{post.title}</h3>
                    <p className="squad-post-desc">{post.description}</p>

                    {/* Skills Looking For */}
                    <div className="squad-skills-section">
                      <span className="skills-heading">Looking for:</span>
                      <div className="skills-tags-wrap">
                        {post.skills_looking_for && post.skills_looking_for.length > 0 ? (
                          post.skills_looking_for.map(skill => (
                            <span key={skill} className="skill-tag looking">
                              🎯 {skill}
                            </span>
                          ))
                        ) : (
                          <span className="skill-tag general">All undergraduate skills welcome</span>
                        )}
                      </div>
                    </div>

                    {/* Skills We Have */}
                    {post.skills_have && post.skills_have.length > 0 && (
                      <div className="squad-skills-section">
                        <span className="skills-heading">Team brings:</span>
                        <div className="skills-tags-wrap">
                          {post.skills_have.map(skill => (
                            <span key={skill} className="skill-tag have">
                              ✓ {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Author Row & Actions */}
                    <div className="squad-author-row">
                      <div className="author-info">
                        <div className="author-avatar">
                          {(post.created_by_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="author-meta">
                          <span className="author-name">{post.created_by_name}</span>
                          <span className="author-college">
                            {[post.college, post.course, post.year].filter(Boolean).join(' · ')}
                          </span>
                        </div>
                      </div>

                      {/* Direct WhatsApp Outreach Button */}
                      {post.phone_number && (
                        <a
                          href={formatWhatsAppUrl(
                            post.phone_number,
                            `Hi ${post.created_by_name}! Saw your squad opening for "${post.competition_name}" on OneStop.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-whatsapp-outreach"
                          title="Message team host directly on WhatsApp"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <WhatsAppIcon size={14} />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>

                    {/* Dynamic Status Callout & Action Bar */}
                    <div className="squad-action-bar" onClick={(e) => e.stopPropagation()}>
                      {isUserPost ? (
                        <div className="owner-action-group">
                          <button
                            type="button"
                            className="btn-manage-squad"
                            onClick={(e) => openReviewModal(post, e)}
                          >
                            <span>Manage Applicants</span>
                            {pendingApplicantsCount > 0 && (
                              <span className="pending-badge">{pendingApplicantsCount}</span>
                            )}
                          </button>
                        </div>
                      ) : userApp ? (
                        /* In-Card Application State Banners matching SSCBS OS */
                        <div className="user-app-status-box">
                          {userApp.status === 'accepted' ? (
                            <div className="status-banner accepted">
                              <span className="status-label">🎉 Accepted into Squad!</span>
                              {post.phone_number && (
                                <a
                                  href={formatWhatsAppUrl(
                                    post.phone_number,
                                    `Hi ${post.created_by_name}! Excited to join our squad for ${post.competition_name}!`
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-whatsapp-inline"
                                >
                                  <WhatsAppIcon size={13} />
                                  <span>Chat with Lead</span>
                                </a>
                              )}
                            </div>
                          ) : userApp.status === 'pending' ? (
                            <div className="status-banner pending">
                              <span>⏳ Request Pending Review</span>
                            </div>
                          ) : userApp.status === 'declined' || userApp.status === 'rejected' ? (
                            <div className="status-banner declined">
                              <span>❌ Application Declined</span>
                              <button
                                type="button"
                                className="btn-reapply-link"
                                onClick={(e) => openReapplyModal(userApp, e)}
                              >
                                Re-apply
                              </button>
                            </div>
                          ) : (
                            <div className="status-banner removed">
                              <span>⚠️ Removed from Squad</span>
                              <button
                                type="button"
                                className="btn-reapply-link"
                                onClick={(e) => openReapplyModal(userApp, e)}
                              >
                                Re-apply
                              </button>
                            </div>
                          )}
                        </div>
                      ) : isSquadFull ? (
                        <span className="badge-filled">Squad Full</span>
                      ) : (
                        <button
                          type="button"
                          className="btn-apply-squad"
                          onClick={(e) => openApplyModal(post, e)}
                        >
                          Request to Join
                        </button>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* My Postings & Applications Management SubTab */
        <div className="my-squads-view">
          <div className="management-grid">
            {/* Column 1: Squad Openings I Posted */}
            <div className="management-col">
              <div className="col-header">
                <h2>My Squad Postings ({myPosts.length})</h2>
                <span className="col-sub">Manage applicants, fill spots, and coordinate over WhatsApp</span>
              </div>

              {myPosts.length === 0 ? (
                <div className="empty-sub-card">
                  <p>You haven't posted any squad openings yet.</p>
                  <button className="btn-create-squad-small" onClick={() => setShowCreateModal(true)}>
                    + Post Opening
                  </button>
                </div>
              ) : (
                myPosts.map(post => {
                  const applicantsForThisPost = squadApps.filter(a => a.post_id === post.id);
                  const openSpots = getPostOpenSpots(post);

                  return (
                    <div key={post.id} className="management-post-card">
                      <div className="m-post-header">
                        <div>
                          <div className="m-post-comp">{post.competition_name}</div>
                          <h4 className="m-post-title">{post.title}</h4>
                        </div>
                        <div className="m-post-controls">
                          <span className={`status-pill ${openSpots > 0 ? 'open' : 'filled'}`}>
                            {openSpots > 0 ? `${openSpots} spots open` : 'Filled'}
                          </span>
                          <button
                            type="button"
                            className="btn-toggle-open"
                            onClick={() => togglePostOpen(post.id, post.is_open)}
                            title={post.is_open ? 'Close listing' : 'Reopen listing'}
                          >
                            {post.is_open ? 'Close' : 'Reopen'}
                          </button>
                          <button
                            type="button"
                            className="btn-delete-post"
                            onClick={() => {
                              if (window.confirm('Delete this squad opening? All associated applications will also be removed.')) {
                                deleteSquadPost(post.id);
                              }
                            }}
                            title="Delete opening"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Applicants List */}
                      <div className="applicants-section">
                        <div className="applicants-header">
                          <span>Applicants ({applicantsForThisPost.length})</span>
                        </div>

                        {applicantsForThisPost.length === 0 ? (
                          <p className="no-applicants-note">No applications received yet. Your opening is live in the public board.</p>
                        ) : (
                          <div className="applicants-list">
                            {applicantsForThisPost.map(app => (
                              <div key={app.id} className="applicant-item-card">
                                <div className="applicant-top">
                                  <div>
                                    <strong className="app-name">{app.applicant_name}</strong>
                                    {app.applicant_college && (
                                      <span className="app-college"> · {app.applicant_college}</span>
                                    )}
                                  </div>
                                  <span className={`app-status-badge ${app.status}`}>
                                    {app.status.toUpperCase()}
                                  </span>
                                </div>

                                <p className="app-pitch">"{app.pitch_note}"</p>

                                {app.highlighted_skills && app.highlighted_skills.length > 0 && (
                                  <div className="app-skills-row">
                                    {app.highlighted_skills.map(s => (
                                      <span key={s} className="app-skill-badge">{s}</span>
                                    ))}
                                  </div>
                                )}

                                <div className="applicant-actions">
                                  {app.status === 'pending' ? (
                                    <>
                                      {/* Host 1-Click WhatsApp to Screen Before Accepting */}
                                      {app.applicant_phone && (
                                        <a
                                          href={formatWhatsAppUrl(
                                            app.applicant_phone,
                                            `Hi ${app.applicant_name}! Saw your application for our squad in ${post.competition_name} on OneStop. Wanted to connect!`
                                          )}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="btn-action-chat"
                                        >
                                          <WhatsAppIcon size={14} />
                                          <span>Chat</span>
                                        </a>
                                      )}

                                      <button
                                        className="btn-action-accept"
                                        onClick={() => handleAcceptTeammate(app.id)}
                                      >
                                        Accept &amp; Fill Spot
                                      </button>
                                      <button
                                        className="btn-action-reject"
                                        onClick={() => handleDeclineTeammate(app.id)}
                                      >
                                        Decline
                                      </button>
                                    </>
                                  ) : app.status === 'accepted' ? (
                                    <>
                                      {app.applicant_phone && (
                                        <a
                                          href={formatWhatsAppUrl(
                                            app.applicant_phone,
                                            `Hi ${app.applicant_name}! Welcome to the squad for ${post.competition_name}. Let's coordinate!`
                                          )}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="btn-whatsapp-connect"
                                        >
                                          <WhatsAppIcon size={14} />
                                          <span>WhatsApp Chat</span>
                                        </a>
                                      )}

                                      {/* Member Removal Button (reopens spot!) */}
                                      <button
                                        className="btn-action-remove"
                                        onClick={() => handleRemoveTeammate(app.id)}
                                        title="Remove member and reopen spot"
                                      >
                                        Remove Member
                                      </button>
                                    </>
                                  ) : (
                                    <span className="declined-note">
                                      {app.status === 'removed' ? 'Removed from Squad' : 'Application Declined'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Column 2: Applications I Sent */}
            <div className="management-col">
              <div className="col-header">
                <h2>Applications I've Sent ({myApps.length})</h2>
                <span className="col-sub">Track team decisions and connect on WhatsApp</span>
              </div>

              {myApps.length === 0 ? (
                <div className="empty-sub-card">
                  <p>You haven't applied to any squads yet.</p>
                  <button className="btn-create-squad-small" onClick={() => setActiveSubTab('explore')}>
                    Browse Squads
                  </button>
                </div>
              ) : (
                myApps.map(app => {
                  const targetPost = squadPosts.find(p => p.id === app.post_id);
                  const isAccepted = app.status === 'accepted';
                  const isDeclined = app.status === 'declined' || app.status === 'rejected';
                  const isRemoved = app.status === 'removed';

                  return (
                    <div key={app.id} className="management-post-card">
                      <div className="m-post-header">
                        <div>
                          <div className="m-post-comp">{app.competition_name || targetPost?.competition_name}</div>
                          <h4 className="m-post-title">{targetPost?.title || 'Squad Application'}</h4>
                        </div>
                        <span className={`app-status-badge ${app.status}`}>
                          {app.status.toUpperCase()}
                        </span>
                      </div>

                      <p className="app-pitch">Your pitch: "{app.pitch_note}"</p>

                      {isAccepted && targetPost?.phone_number && (
                        <div className="accepted-banner">
                          <p className="accepted-headline">🎉 You were accepted into this squad!</p>
                          <a
                            href={formatWhatsAppUrl(
                              targetPost.phone_number,
                              `Hi ${targetPost.created_by_name}! Thanks for accepting my application for ${targetPost.competition_name}. Excited to collaborate!`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-whatsapp-connect full"
                          >
                            <WhatsAppIcon size={18} />
                            <span>Chat with Team Lead on WhatsApp</span>
                          </a>
                        </div>
                      )}

                      {(isDeclined || isRemoved) && (
                        <div className="declined-box">
                          <p className="declined-text">
                            {isRemoved ? 'You were removed from this squad.' : 'Your application was not selected for this opening.'}
                          </p>
                          <button
                            type="button"
                            className="btn-reapply-action"
                            onClick={(e) => openReapplyModal(app, e)}
                          >
                            Re-apply with Updated Pitch
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Create Squad Post */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <UsersIcon size={20} color="var(--primary)" />
                <h2>Post a Squad Opening</h2>
              </div>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="modal-form">
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Competition Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bain Strategy Challenge 2026"
                    value={formData.competition_name}
                    onChange={(e) => setFormData({ ...formData, competition_name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Host / Organizer</label>
                  <input
                    type="text"
                    placeholder="e.g. Bain & Company / IIM Ahmedabad"
                    value={formData.organizer}
                    onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Registration Link (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://unstop.com/o/..."
                    value={formData.competition_link}
                    onChange={(e) => setFormData({ ...formData, competition_link: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Your WhatsApp Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile (e.g. 9876543210)"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Opening Headline *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Looking for 1 DCF valuation lead for 4-member squad"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Pitch & What You're Looking For *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe your current team composition, background, past track record, and exactly what profile you need..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Skills looking for */}
              <div className="form-group">
                <label>Skills You're Looking For</label>
                <div className="skills-selector-wrap">
                  {PRESET_SKILLS.map(skill => (
                    <button
                      type="button"
                      key={skill}
                      className={`skill-choice-btn ${formData.skills_looking_for.includes(skill) ? 'selected' : ''}`}
                      onClick={() => toggleSkillLookingFor(skill)}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Skills we have */}
              <div className="form-group">
                <label>Skills Your Team Already Has</label>
                <div className="skills-selector-wrap">
                  {PRESET_SKILLS.map(skill => (
                    <button
                      type="button"
                      key={skill}
                      className={`skill-choice-btn have ${formData.skills_have.includes(skill) ? 'selected' : ''}`}
                      onClick={() => toggleSkillHave(skill)}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label>Total Team Size</label>
                  <input
                    type="number"
                    min={2}
                    max={6}
                    value={formData.total_members}
                    onChange={(e) => setFormData({ ...formData, total_members: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label>Spots Open Now</label>
                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, (formData.total_members || 4) - 1)}
                    value={formData.spots_left}
                    onChange={(e) => setFormData({ ...formData, spots_left: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label>Your College</label>
                  <input
                    type="text"
                    placeholder="e.g. SRCC, IIT Bombay, DTU"
                    value={formData.college}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Post Squad Opening
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Apply to Squad */}
      {showApplyModal && targetPostForApply && (
        <div className="modal-backdrop" onClick={() => setShowApplyModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <TrophyIcon size={20} color="var(--primary)" />
                <h2>Apply to Join Squad</h2>
              </div>
              <button className="modal-close-btn" onClick={() => setShowApplyModal(false)}>✕</button>
            </div>

            <div className="apply-post-summary">
              <span className="apply-comp-name">{targetPostForApply.competition_name}</span>
              <h3 className="apply-comp-title">{targetPostForApply.title}</h3>
              <span className="apply-host-meta">Lead: {targetPostForApply.created_by_name} ({targetPostForApply.college || 'Collegiate'})</span>
            </div>

            <form onSubmit={handleApplySubmit} className="modal-form">
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={applyForm.applicant_name}
                    onChange={(e) => setApplyForm({ ...applyForm, applicant_name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Your WhatsApp Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    value={applyForm.applicant_phone}
                    onChange={(e) => setApplyForm({ ...applyForm, applicant_phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label>Your College</label>
                  <input
                    type="text"
                    placeholder="e.g. SRCC, SSCBS, IIT, BITS"
                    value={applyForm.applicant_college}
                    onChange={(e) => setApplyForm({ ...applyForm, applicant_college: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Course / Degree</label>
                  <input
                    type="text"
                    placeholder="e.g. B.Com (Hons) / B.Tech / BBA"
                    value={applyForm.applicant_course}
                    onChange={(e) => setApplyForm({ ...applyForm, applicant_course: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Pitch Note (Why are you a good fit?) *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Mention your relevant experience, past wins, technical strengths, or how you can contribute..."
                  value={applyForm.pitch_note}
                  onChange={(e) => setApplyForm({ ...applyForm, pitch_note: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Highlight Skills You Bring</label>
                <div className="skills-selector-wrap">
                  {PRESET_SKILLS.map(skill => (
                    <button
                      type="button"
                      key={skill}
                      className={`skill-choice-btn have ${applyForm.highlighted_skills.includes(skill) ? 'selected' : ''}`}
                      onClick={() => toggleApplicantSkill(skill)}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowApplyModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Re-apply to Squad */}
      {showReapplyModal && targetAppForReapply && (
        <div className="modal-backdrop" onClick={() => setShowReapplyModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <RotateCcwIcon size={20} color="var(--primary)" />
                <h2>Re-apply to Squad</h2>
              </div>
              <button className="modal-close-btn" onClick={() => setShowReapplyModal(false)}>✕</button>
            </div>

            <form onSubmit={handleReapplySubmit} className="modal-form">
              <div className="form-group">
                <label>Your WhatsApp Number *</label>
                <input
                  type="tel"
                  required
                  value={reapplyForm.applicant_phone}
                  onChange={(e) => setReapplyForm({ ...reapplyForm, applicant_phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Updated Pitch Note *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain how you can strengthen this squad..."
                  value={reapplyForm.pitch_note}
                  onChange={(e) => setReapplyForm({ ...reapplyForm, pitch_note: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Skills You Offer</label>
                <div className="skills-selector-wrap">
                  {PRESET_SKILLS.map(skill => (
                    <button
                      type="button"
                      key={skill}
                      className={`skill-choice-btn have ${reapplyForm.highlighted_skills.includes(skill) ? 'selected' : ''}`}
                      onClick={() => toggleReapplySkill(skill)}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowReapplyModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Re-submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Host Review Modal (Drawer / Dialog) */}
      {showReviewModal && targetPostForReview && (
        <div className="modal-backdrop" onClick={() => setShowReviewModal(false)}>
          <div className="modal-dialog review-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <UsersIcon size={20} color="var(--primary)" />
                <h2>Review Applicants</h2>
              </div>
              <button className="modal-close-btn" onClick={() => setShowReviewModal(false)}>✕</button>
            </div>

            <div className="review-post-banner">
              <div>
                <span className="review-comp-name">{targetPostForReview.competition_name}</span>
                <h3 className="review-post-title">{targetPostForReview.title}</h3>
              </div>
              <div className="review-post-spots">
                <span className="spots-num">{getPostOpenSpots(targetPostForReview)}</span>
                <span className="spots-text">open spot{getPostOpenSpots(targetPostForReview) === 1 ? '' : 's'}</span>
              </div>
            </div>

            <div className="review-applicants-container">
              {(() => {
                const postApps = squadApps.filter(a => a.post_id === targetPostForReview.id);
                if (postApps.length === 0) {
                  return (
                    <div className="empty-review-note">
                      <p>No applications received yet for this squad opening.</p>
                    </div>
                  );
                }

                return postApps.map(app => (
                  <div key={app.id} className="review-applicant-card">
                    <div className="review-app-top">
                      <div>
                        <strong className="review-app-name">{app.applicant_name}</strong>
                        <span className="review-app-meta"> · {[app.applicant_college, app.applicant_course].filter(Boolean).join(' · ')}</span>
                      </div>
                      <span className={`review-app-status ${app.status}`}>{app.status.toUpperCase()}</span>
                    </div>

                    <p className="review-app-pitch">"{app.pitch_note}"</p>

                    {app.highlighted_skills && app.highlighted_skills.length > 0 && (
                      <div className="review-skills-row">
                        {app.highlighted_skills.map(s => (
                          <span key={s} className="skill-pill-small">{s}</span>
                        ))}
                      </div>
                    )}

                    <div className="review-app-actions">
                      {/* 1-Click WhatsApp to Screen Before Decision */}
                      {app.applicant_phone && (
                        <a
                          href={formatWhatsAppUrl(
                            app.applicant_phone,
                            `Hi ${app.applicant_name}! Saw your application for our squad in ${targetPostForReview.competition_name} on OneStop.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-action-chat"
                        >
                          <WhatsAppIcon size={14} />
                          <span>Chat on WhatsApp</span>
                        </a>
                      )}

                      {app.status === 'pending' ? (
                        <>
                          <button
                            type="button"
                            className="btn-action-accept"
                            onClick={() => handleAcceptTeammate(app.id)}
                          >
                            Accept &amp; Fill Spot
                          </button>
                          <button
                            type="button"
                            className="btn-action-reject"
                            onClick={() => handleDeclineTeammate(app.id)}
                          >
                            Decline
                          </button>
                        </>
                      ) : app.status === 'accepted' ? (
                        <button
                          type="button"
                          className="btn-action-remove"
                          onClick={() => handleRemoveTeammate(app.id)}
                        >
                          Remove Member (Reopen Spot)
                        </button>
                      ) : (
                        <span className="declined-note">
                          {app.status === 'removed' ? 'Removed from Squad' : 'Declined'}
                        </span>
                      )}
                    </div>
                  </div>
                ));
              })()}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setShowReviewModal(false)}>
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Full Detail Modal */}
      {showDetailModal && targetPostForDetail && (
        <div className="modal-backdrop" onClick={() => setShowDetailModal(false)}>
          <div className="modal-dialog detail-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <TrophyIcon size={20} color="var(--primary)" />
                <h2>Squad Details</h2>
              </div>
              <button className="modal-close-btn" onClick={() => setShowDetailModal(false)}>✕</button>
            </div>

            <div className="detail-content">
              <span className="detail-comp-tag">{targetPostForDetail.competition_name}</span>
              <h3 className="detail-title">{targetPostForDetail.title}</h3>
              {targetPostForDetail.organizer && (
                <p className="detail-org">Organized by: {targetPostForDetail.organizer}</p>
              )}

              <div className="detail-desc-box">
                <h4>Pitch & Overview</h4>
                <p>{targetPostForDetail.description}</p>
              </div>

              {targetPostForDetail.competition_link && (
                <div className="detail-link-row">
                  <a
                    href={targetPostForDetail.competition_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="detail-ext-link"
                  >
                    <span>View Competition Official Link</span>
                    <ExternalLinkIcon size={14} />
                  </a>
                </div>
              )}

              <div className="detail-skills-grid">
                <div>
                  <h4>Skills Team Brings</h4>
                  <div className="skills-tags-wrap">
                    {targetPostForDetail.skills_have?.length > 0 ? (
                      targetPostForDetail.skills_have.map(s => (
                        <span key={s} className="skill-tag have">✓ {s}</span>
                      ))
                    ) : (
                      <span className="detail-dim">None listed</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4>Skills Looking For</h4>
                  <div className="skills-tags-wrap">
                    {targetPostForDetail.skills_looking_for?.length > 0 ? (
                      targetPostForDetail.skills_looking_for.map(s => (
                        <span key={s} className="skill-tag looking">🎯 {s}</span>
                      ))
                    ) : (
                      <span className="detail-dim">All skills welcome</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="detail-author-section">
                <div className="author-info">
                  <div className="author-avatar large">
                    {(targetPostForDetail.created_by_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <strong className="detail-lead-name">{targetPostForDetail.created_by_name}</strong>
                    <div className="detail-lead-college">
                      {[targetPostForDetail.college, targetPostForDetail.course, targetPostForDetail.year].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>

                {targetPostForDetail.phone_number && (
                  <a
                    href={formatWhatsAppUrl(
                      targetPostForDetail.phone_number,
                      `Hi ${targetPostForDetail.created_by_name}! Saw your opening for ${targetPostForDetail.competition_name} on OneStop.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-whatsapp-outreach full"
                  >
                    <WhatsAppIcon size={16} />
                    <span>WhatsApp Lead</span>
                  </a>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setShowDetailModal(false)}>
                Close
              </button>
              {targetPostForDetail.created_by_email !== user?.email && !getUserAppForPost(targetPostForDetail.id) && getPostOpenSpots(targetPostForDetail) > 0 && (
                <button
                  type="button"
                  className="btn-submit"
                  onClick={() => {
                    setShowDetailModal(false);
                    openApplyModal(targetPostForDetail);
                  }}
                >
                  Apply to Squad
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
