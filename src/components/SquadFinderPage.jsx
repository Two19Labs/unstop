// src/components/SquadFinderPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth, formatWhatsAppUrl, sanitizeIndianPhone } from '../context/AuthContext';
import {
  UsersIcon,
  PlusIcon,
  SearchIcon,
  FilterIcon,
  WhatsAppIcon,
  CheckIcon,
  ClockIcon,
  CalendarIcon,
  TrophyIcon,
  ExternalLinkIcon,
  LockIcon,
  ShieldCheckIcon,
  SettingsIcon
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
  'Fullstack Dev / Tech'
];

export default function SquadFinderPage({ prefillData, onClearPrefill, showToast }) {
  const {
    user,
    profile,
    squadPosts,
    squadApps,
    createSquadPost,
    applyToSquad,
    updateApplicationStatus,
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
  const [targetPostForApply, setTargetPostForApply] = useState(null);

  // Create Post Form State
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

  // Apply Form State
  const [applyForm, setApplyForm] = useState({
    applicant_name: '',
    applicant_phone: '',
    applicant_college: '',
    pitch_note: '',
    highlighted_skills: []
  });

  // Check for prefill on mount or prop change
  useEffect(() => {
    const rawSaved = sessionStorage.getItem('comp_team_prefill');
    let data = prefillData;
    if (!data && rawSaved) {
      try {
        data = JSON.parse(rawSaved);
      } catch (e) {}
    }

    if (data && data.competition_name) {
      setFormData(prev => ({
        ...prev,
        competition_name: data.competition_name || '',
        organizer: data.organizer || '',
        competition_link: data.competition_link || '',
        total_members: data.total_members || 4,
        spots_left: Math.max(1, (data.total_members || 4) - 1),
        title: `Building winning squad for ${data.competition_name.slice(0, 45)}...`
      }));
      setShowCreateModal(true);
      sessionStorage.removeItem('comp_team_prefill');
      if (onClearPrefill) onClearPrefill();
    }
  }, [prefillData]);

  // Handle skill toggle in Create modal
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

  // Handle skill toggle in Apply modal
  const toggleApplicantSkill = (skill) => {
    setApplyForm(prev => ({
      ...prev,
      highlighted_skills: prev.highlighted_skills.includes(skill)
        ? prev.highlighted_skills.filter(s => s !== skill)
        : [...prev.highlighted_skills, skill]
    }));
  };

  // Submit Post
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!formData.competition_name.trim() || !formData.title.trim() || !formData.description.trim()) {
      alert('Please provide competition name, title, and team pitch description.');
      return;
    }

    createSquadPost(formData);
    setShowCreateModal(false);
    if (showToast) showToast('Squad opening posted successfully!');
    setActiveSubTab('explore');

    // Reset
    setFormData({
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
  };

  // Open Apply Modal
  const openApplyModal = (post) => {
    setTargetPostForApply(post);
    setApplyForm({
      applicant_name: profile?.full_name || user?.user_metadata?.full_name || '',
      applicant_phone: profile?.phone || user?.user_metadata?.phone || '',
      applicant_college: profile?.college || user?.user_metadata?.college || '',
      pitch_note: '',
      highlighted_skills: []
    });
    setShowApplyModal(true);
  };

  // Submit Application
  const handleApplySubmit = (e) => {
    e.preventDefault();
    if (!applyForm.applicant_name.trim() || !applyForm.pitch_note.trim() || !applyForm.applicant_phone.trim()) {
      alert('Please fill in your name, contact phone, and pitch note.');
      return;
    }

    const clean = sanitizeIndianPhone(applyForm.applicant_phone);
    if (!clean || clean.length !== 10) {
      alert('Please provide a valid 10-digit Indian phone number for WhatsApp verification.');
      return;
    }

    applyToSquad({
      post_id: targetPostForApply.id,
      competition_name: targetPostForApply.competition_name,
      ...applyForm,
      applicant_phone: clean
    });

    setShowApplyModal(false);
    if (showToast) showToast('Application submitted to team lead!');
    setActiveSubTab('my-squads');
  };

  // Filter squad posts
  const filteredPosts = squadPosts.filter(post => {
    if (selectedSkillFilter !== 'all' && !post.skills_looking_for?.includes(selectedSkillFilter)) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const compMatch = (post.competition_name || '').toLowerCase().includes(q);
      const titleMatch = (post.title || '').toLowerCase().includes(q);
      const descMatch = (post.description || '').toLowerCase().includes(q);
      const orgMatch = (post.organizer || '').toLowerCase().includes(q);
      const collegeMatch = (post.college || '').toLowerCase().includes(q);
      if (!compMatch && !titleMatch && !descMatch && !orgMatch && !collegeMatch) return false;
    }

    return true;
  });

  // User's own posts and applications
  const myPosts = squadPosts.filter(p => p.created_by_email === user?.email || p.user_id === user?.id);
  const myApps = squadApps.filter(a => a.applicant_email === user?.email || a.applicant_id === user?.id);

  // If user is not authenticated, show locked Teammate Match Gate
  if (!user) {
    return (
      <div className="squad-finder-view squad-finder-gated">
        <section className="squad-gate-hero">
          <div className="squad-gate-card">
            <div className="squad-gate-top">
              <div className="squad-gate-lock-badge">
                <LockIcon size={16} color="var(--color-lab-blue)" />
                <span>MEMBERSHIP REQUIRED</span>
              </div>
              <span className="squad-gate-brand">TWO19 LABS / SQUAD GATEWAY</span>
            </div>

            <h1 className="squad-gate-title">
              Sign in to unlock Squad Finder & teammate matching
            </h1>

            <p className="squad-gate-sub">
              Looking up and filtering competitions is 100% free for all. But recruiting teammates, viewing verified collegiate profiles, and coordinating over WhatsApp requires a OneStop account.
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
                <span>Verified student network (DU, IITs, IIMs, Premier colleges)</span>
              </div>
              <div className="squad-gate-feature-item">
                <WhatsAppIcon size={16} />
                <span>1-Click WhatsApp direct chat with squad leaders</span>
              </div>
              <div className="squad-gate-feature-item">
                <CheckIcon size={16} color="var(--color-lab-blue)" />
                <span>Skill matching (DCF, Valuation, UI/Pitch, Python)</span>
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
              Sign in or create an account to view contact details, message leads on WhatsApp, or post your own opening.
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
                      <span>{item.competition_name || item.comp}</span>
                    </div>
                    <h4 className="squad-gate-card-title">{item.title}</h4>
                    <div className="squad-gate-card-meta">
                      <span>{item.college || 'Collegiate Circuit'}</span>
                      <span>·</span>
                      <span>{item.spots_left || 1} spots open</span>
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
            <div className="squad-gate-empty-state" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
              <p style={{ fontSize: '15px', fontWeight: 500, marginBottom: '16px' }}>No squad openings have been posted yet in the database.</p>
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
      {/* Squad Header */}
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

      {/* Tabs Switcher */}
      <div className="squad-tab-controls">
        <div className="squad-subtabs">
          <button
            className={`subtab-btn ${activeSubTab === 'explore' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('explore')}
          >
            <span>Explore Squads</span>
            <span className="subtab-count">{squadPosts.length}</span>
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
          {/* Search & Skill Chips */}
          <div className="squad-filter-bar">
            <div className="squad-search-wrap">
              <SearchIcon size={17} className="squad-search-icon" />
              <input
                type="text"
                className="squad-search-input"
                placeholder="Search squads by competition, college (SRCC, IIT, DTU), or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
                <h3>No open squads match your search</h3>
                <p>Be the first one to create a squad opening for your target competition!</p>
                <button className="btn-create-squad" onClick={() => setShowCreateModal(true)}>
                  Post Opening Now
                </button>
              </div>
            ) : (
              filteredPosts.map(post => {
                const isUserPost = post.created_by_email === user?.email || post.user_id === user?.id;
                const hasApplied = squadApps.some(a => a.post_id === post.id && (a.applicant_email === user?.email || a.applicant_id === user?.id));

                return (
                  <article key={post.id} className="squad-card">
                    <div className="squad-card-header">
                      <div className="squad-comp-meta">
                        <div className="squad-comp-name" title={post.competition_name}>
                          <TrophyIcon size={14} color="var(--primary)" />
                          <span>{post.competition_name}</span>
                        </div>
                        {post.organizer && <span className="squad-org-name">{post.organizer}</span>}
                      </div>

                      <div className="squad-spots-badge">
                        <span className="spots-num">{post.spots_left}</span>
                        <span className="spots-text">spot{post.spots_left === 1 ? '' : 's'} open</span>
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

                    {/* Author & College Meta */}
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

                      <div className="squad-card-actions">
                        {isUserPost ? (
                          <span className="badge-my-post">Your Opening</span>
                        ) : hasApplied ? (
                          <span className="badge-applied">
                            <CheckIcon size={13} /> Applied
                          </span>
                        ) : post.spots_left <= 0 ? (
                          <span className="badge-filled">Squad Full</span>
                        ) : (
                          <button className="btn-apply-squad" onClick={() => openApplyModal(post)}>
                            Apply to Squad
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* My Squads & Applications Management SubTab */
        <div className="my-squads-view">
          <div className="management-grid">
            {/* Column 1: Squad Openings I Posted */}
            <div className="management-col">
              <div className="col-header">
                <h2>My Squad Postings ({myPosts.length})</h2>
                <span className="col-sub">Manage applicants and unlock WhatsApp handshakes</span>
              </div>

              {myPosts.length === 0 ? (
                <div className="empty-sub-card">
                  <p>You haven't posted any squad openings yet.</p>
                  <button className="btn-create-squad-small" onClick={() => setShowCreateModal(true)}>
                    + Create Opening
                  </button>
                </div>
              ) : (
                myPosts.map(post => {
                  const applicantsForThisPost = squadApps.filter(a => a.post_id === post.id);

                  return (
                    <div key={post.id} className="management-post-card">
                      <div className="m-post-header">
                        <div>
                          <div className="m-post-comp">{post.competition_name}</div>
                          <h4 className="m-post-title">{post.title}</h4>
                        </div>
                        <span className={`status-pill ${post.spots_left > 0 ? 'open' : 'filled'}`}>
                          {post.spots_left > 0 ? `${post.spots_left} spots left` : 'Filled'}
                        </span>
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
                                      <button
                                        className="btn-action-accept"
                                        onClick={() => updateApplicationStatus(app.id, 'accepted')}
                                      >
                                        Accept Teammate
                                      </button>
                                      <button
                                        className="btn-action-reject"
                                        onClick={() => updateApplicationStatus(app.id, 'rejected')}
                                      >
                                        Decline
                                      </button>
                                    </>
                                  ) : app.status === 'accepted' ? (
                                    <a
                                      href={formatWhatsAppUrl(
                                        app.applicant_phone,
                                        `Hi ${app.applicant_name}! I accepted your application for our squad in ${post.competition_name}. Let's coordinate our strategy!`
                                      )}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="btn-whatsapp-connect"
                                    >
                                      <WhatsAppIcon size={16} />
                                      <span>Connect on WhatsApp</span>
                                    </a>
                                  ) : (
                                    <span className="declined-note">Application declined</span>
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
                    placeholder="e.g. Shaheed Sukhdev College / Bain"
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
                    placeholder="https://..."
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
                  <label>Open Spots Left</label>
                  <input
                    type="number"
                    min={1}
                    max={formData.total_members - 1}
                    value={formData.spots_left}
                    onChange={(e) => setFormData({ ...formData, spots_left: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label>College / University</label>
                  <input
                    type="text"
                    placeholder="e.g. SRCC / IIT Delhi"
                    value={formData.college}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Publish Opening
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
                <UsersIcon size={20} color="var(--primary)" />
                <h2>Apply to Squad</h2>
              </div>
              <button className="modal-close-btn" onClick={() => setShowApplyModal(false)}>✕</button>
            </div>

            <div className="modal-post-summary">
              <strong>{targetPostForApply.title}</strong>
              <span>{targetPostForApply.competition_name}</span>
            </div>

            <form onSubmit={handleApplySubmit} className="modal-form">
              <div className="form-grid-2">
                <div className="form-group">
                  <label>Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={applyForm.applicant_name}
                    onChange={(e) => setApplyForm({ ...applyForm, applicant_name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Your WhatsApp Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile (e.g. 9876543210)"
                    value={applyForm.applicant_phone}
                    onChange={(e) => setApplyForm({ ...applyForm, applicant_phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>College & Degree *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hindu College, B.A. Economics (Hons), 2nd Year"
                  value={applyForm.applicant_college}
                  onChange={(e) => setApplyForm({ ...applyForm, applicant_college: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Your Pitch Note (Why choose you?) *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain your past competition experience, specific deliverables you can build, and why you are a great teammate..."
                  value={applyForm.pitch_note}
                  onChange={(e) => setApplyForm({ ...applyForm, pitch_note: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Your Core Skills (Select relevant)</label>
                <div className="skills-selector-wrap">
                  {PRESET_SKILLS.map(skill => (
                    <button
                      type="button"
                      key={skill}
                      className={`skill-choice-btn ${applyForm.highlighted_skills.includes(skill) ? 'selected' : ''}`}
                      onClick={() => toggleApplicantSkill(skill)}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-footer">
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
    </div>
  );
}
