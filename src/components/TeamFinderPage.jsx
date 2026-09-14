import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './TeamFinderPage.css';

// Universal taxonomy for case competitions & hackathons
const DEFAULT_SKILLS = [
  'Financial Modeling & Valuation',
  'Pitch Deck & Slide Design',
  'Market Sizing & GTM Strategy',
  'Public Speaking & Pitching',
  'Python / Data Analytics',
  'Fullstack Web Dev',
  'AI / Machine Learning',
  'UI/UX Design (Figma)',
  'Economics & Policy Research'
];

const PRESET_COLLEGES = [
  'Shaheed Sukhdev College (SSCBS)',
  'Shri Ram College of Commerce (SRCC)',
  'St. Stephen\'s College',
  'Hindu College',
  'Lady Shri Ram (LSR)',
  'IIT Delhi',
  'IIT Bombay',
  'BITS Pilani',
  'IIM Indore (IPM)',
  'NMIMS Mumbai',
  'Christ University',
  'Delhi Technological University (DTU)',
  'Netaji Subhas Univ of Tech (NSUT)'
];

// Self-contained SVGs
const BackIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);

const SearchIcon = ({ size = 18, className = '' }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" />
  </svg>
);

const UsersIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const TrophyIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
  </svg>
);

const WhatsAppIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const ExternalLinkIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const CheckIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

function sanitizeIndianPhone(raw) {
  if (!raw) return '';
  let digits = String(raw).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, 10);
}

function formatWhatsAppUrl(phone, textMessage = '') {
  const clean = sanitizeIndianPhone(phone);
  if (!clean || clean.length !== 10) return '#';
  return `https://wa.me/91${clean}${textMessage ? `?text=${encodeURIComponent(textMessage)}` : ''}`;
}

export default function TeamFinderPage({ onBack, initialPrefill, user = null, supabase = null }) {
  // Fallback currentUser mock if auth is not initialized
  const currentUser = useMemo(() => {
    return user || {
      id: 'guest-user-1',
      name: 'Aditya Sharma',
      email: 'aditya@example.com',
      college: 'Shaheed Sukhdev College (SSCBS)',
      major: 'BMS (Finance)',
      year: '2nd Year',
    };
  }, [user]);

  const [posts, setPosts] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'my' | 'applied'
  const [filterOpenOnly, setFilterOpenOnly] = useState(false);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPostForApply, setSelectedPostForApply] = useState(null);
  const [selectedPostForReview, setSelectedPostForReview] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    competition_name: '',
    organizer: '',
    competition_link: '',
    phone_number: '',
    title: '',
    description: '',
    skills_have: [],
    skills_looking_for: [],
    custom_skill_have: '',
    custom_skill_looking: '',
    total_members: 3,
    spots_left: 2,
    college: currentUser.college || 'University of Delhi',
    major: currentUser.major || 'Business / Economics',
    year: currentUser.year || '2nd Year',
  });

  // Application Form State
  const [applyData, setApplyData] = useState({
    pitch_note: '',
    phone_number: '',
    college: currentUser.college || '',
    major: currentUser.major || '',
    year: currentUser.year || '2nd Year',
    highlighted_skills: [],
    custom_skill: '',
  });

  // Ingest Competition Finder Prefill on mount
  useEffect(() => {
    let prefill = initialPrefill;
    if (!prefill && typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('team_finder_prefill');
        if (cached) prefill = JSON.parse(cached);
      } catch (e) {}
    }

    if (prefill && prefill.competition_name) {
      setFormData((prev) => ({
        ...prev,
        competition_name: prefill.competition_name || '',
        organizer: prefill.organizer || '',
        competition_link: prefill.competition_link || '',
        title: prefill.title || `Squad for ${prefill.competition_name}`,
        description: prefill.description || `Building a squad for ${prefill.competition_name}`,
        total_members: prefill.total_members || 3,
        spots_left: prefill.spots_left || 2,
      }));
      setIsCreateModalOpen(true);
      try { sessionStorage.removeItem('team_finder_prefill'); } catch (e) {}
    }
  }, [initialPrefill]);

  // Load from Supabase or localStorage fallback
  const fetchPostsAndApps = useCallback(async () => {
    setLoading(true);
    let loadedPosts = [];
    let loadedApps = [];

    if (supabase) {
      try {
        const { data: postsData } = await supabase
          .from('squad_posts')
          .select('*')
          .order('created_at', { ascending: false });
        if (postsData) loadedPosts = postsData;

        const { data: appsData } = await supabase
          .from('squad_applications')
          .select('*')
          .order('created_at', { ascending: false });
        if (appsData) loadedApps = appsData;
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to local cache', err);
      }
    }

    if (loadedPosts.length === 0) {
      try {
        const local = localStorage.getItem('universal_squad_posts');
        if (local) loadedPosts = JSON.parse(local);
      } catch (e) {}
    }

    if (loadedApps.length === 0) {
      try {
        const local = localStorage.getItem('universal_squad_apps');
        if (local) loadedApps = JSON.parse(local);
      } catch (e) {}
    }

    setPosts(loadedPosts);
    setApplications(loadedApps);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchPostsAndApps();
  }, [fetchPostsAndApps]);

  // Save to LocalStorage helper
  const persistState = (newPosts, newApps) => {
    setPosts(newPosts);
    try { localStorage.setItem('universal_squad_posts', JSON.stringify(newPosts)); } catch (e) {}
    if (newApps) {
      setApplications(newApps);
      try { localStorage.setItem('universal_squad_apps', JSON.stringify(newApps)); } catch (e) {}
    }
  };

  // Submit Squad Creation
  const handleCreateSquad = async (e) => {
    e.preventDefault();
    if (!formData.competition_name || !formData.title || !formData.phone_number) {
      alert('Please fill in the competition name, headline, and WhatsApp number.');
      return;
    }

    const newPost = {
      id: crypto.randomUUID ? crypto.randomUUID() : `post_${Date.now()}`,
      user_id: currentUser.id,
      competition_name: formData.competition_name.trim(),
      organizer: formData.organizer.trim(),
      competition_link: formData.competition_link.trim(),
      phone_number: formData.phone_number.trim(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      skills_have: formData.skills_have,
      skills_looking_for: formData.skills_looking_for,
      total_members: Number(formData.total_members) || 3,
      initial_open_spots: Number(formData.spots_left) || 2,
      spots_left: Number(formData.spots_left) || 2,
      accepted_emails: [],
      college: formData.college || currentUser.college,
      major: formData.major || currentUser.major,
      year: formData.year || currentUser.year,
      is_open: true,
      created_by_email: currentUser.email,
      created_by_name: currentUser.name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (supabase) {
      try { await supabase.from('squad_posts').insert([newPost]); } catch (err) {}
    }

    persistState([newPost, ...posts]);
    setIsCreateModalOpen(false);
  };

  // Submit Squad Join Application
  const handleApplyToSquad = async (e) => {
    e.preventDefault();
    if (!selectedPostForApply || !applyData.pitch_note) {
      alert('Please write a brief pitch on why you are a good fit.');
      return;
    }

    const newApp = {
      id: crypto.randomUUID ? crypto.randomUUID() : `app_${Date.now()}`,
      post_id: selectedPostForApply.id,
      applicant_id: currentUser.id,
      applicant_name: currentUser.name,
      applicant_email: currentUser.email,
      applicant_phone: applyData.phone_number || currentUser.phone || '',
      applicant_college: applyData.college || currentUser.college,
      applicant_major: applyData.major || currentUser.major,
      applicant_year: applyData.year || currentUser.year,
      pitch_note: applyData.pitch_note.trim(),
      highlighted_skills: applyData.highlighted_skills,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (supabase) {
      try { await supabase.from('squad_applications').insert([newApp]); } catch (err) {}
    }

    persistState(posts, [newApp, ...applications]);
    setSelectedPostForApply(null);
    alert('🎉 Application submitted to the squad host!');
  };

  // Host Decision Handler
  const handleUpdateApplicationStatus = async (appId, newStatus) => {
    const targetApp = applications.find((a) => a.id === appId);
    if (!targetApp) return;
    const targetPost = posts.find((p) => p.id === targetApp.post_id);
    if (!targetPost) return;

    let updatedSpots = targetPost.spots_left;
    let acceptedEmails = [...(targetPost.accepted_emails || [])];

    if (newStatus === 'accepted') {
      if (updatedSpots <= 0) {
        alert('Squad is already full!');
        return;
      }
      updatedSpots -= 1;
      if (!acceptedEmails.includes(targetApp.applicant_email)) {
        acceptedEmails.push(targetApp.applicant_email);
      }
    } else if (newStatus === 'declined' || newStatus === 'removed') {
      if (targetApp.status === 'accepted') {
        updatedSpots = Math.min(targetPost.total_members, updatedSpots + 1);
        acceptedEmails = acceptedEmails.filter((email) => email !== targetApp.applicant_email);
      }
    }

    const isOpen = updatedSpots > 0;
    const updatedPosts = posts.map((p) =>
      p.id === targetPost.id ? { ...p, spots_left: updatedSpots, accepted_emails: acceptedEmails, is_open: isOpen } : p
    );
    const updatedApps = applications.map((a) => (a.id === appId ? { ...a, status: newStatus } : a));

    if (supabase) {
      try {
        await supabase
          .from('squad_posts')
          .update({ spots_left: updatedSpots, accepted_emails: acceptedEmails, is_open: isOpen })
          .eq('id', targetPost.id);
        await supabase.from('squad_applications').update({ status: newStatus }).eq('id', appId);
      } catch (err) {}
    }

    persistState(updatedPosts, updatedApps);
  };

  // Filtering listings
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (filterOpenOnly && !post.is_open) return false;
      const isMine = post.created_by_email?.toLowerCase() === currentUser.email?.toLowerCase();
      const hasApplied = applications.some(
        (a) => a.post_id === post.id && a.applicant_email?.toLowerCase() === currentUser.email?.toLowerCase()
      );

      if (activeTab === 'my' && !isMine) return false;
      if (activeTab === 'applied' && !hasApplied) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesComp = post.competition_name?.toLowerCase().includes(q);
        const matchesTitle = post.title?.toLowerCase().includes(q);
        const matchesOrg = post.organizer?.toLowerCase().includes(q);
        const matchesCollege = post.college?.toLowerCase().includes(q);
        const matchesSkills = [...(post.skills_looking_for || []), ...(post.skills_have || [])].some((s) =>
          s.toLowerCase().includes(q)
        );
        if (!matchesComp && !matchesTitle && !matchesOrg && !matchesCollege && !matchesSkills) return false;
      }
      return true;
    });
  }, [posts, applications, activeTab, filterOpenOnly, searchQuery, currentUser]);

  return (
    <div className="tf-container">
      {/* Header */}
      <header className="tf-header">
        <div className="tf-header-left">
          {onBack && (
            <button className="tf-back-btn" onClick={onBack} aria-label="Back">
              <BackIcon size={18} />
            </button>
          )}
          <div>
            <h1 className="tf-title">Squad Finder</h1>
            <p className="tf-subtitle">
              Recruit teammates or join squads for Case Competitions & Hackathons across colleges.
            </p>
          </div>
        </div>
        <button className="tf-btn-create" onClick={() => setIsCreateModalOpen(true)}>
          + Create Squad Listing
        </button>
      </header>

      {/* Filter & Tabs Toolbar */}
      <div className="tf-toolbar">
        <div className="tf-search-wrapper">
          <SearchIcon size={16} className="tf-search-icon" />
          <input
            type="text"
            className="tf-search-input"
            placeholder="Search by competition, skill needed (e.g. Valuation, Python, Figma), or college..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && <button className="tf-clear-search" onClick={() => setSearchQuery('')}>✕</button>}
        </div>

        <div className="tf-tabs-row">
          <div className="tf-tabs">
            <button className={`tf-tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
              Explore Squads ({posts.length})
            </button>
            <button className={`tf-tab-btn ${activeTab === 'my' ? 'active' : ''}`} onClick={() => setActiveTab('my')}>
              My Squads ({posts.filter((p) => p.created_by_email === currentUser.email).length})
            </button>
            <button className={`tf-tab-btn ${activeTab === 'applied' ? 'active' : ''}`} onClick={() => setActiveTab('applied')}>
              Applied ({applications.filter((a) => a.applicant_email === currentUser.email).length})
            </button>
          </div>

          <label className="tf-checkbox-label">
            <input
              type="checkbox"
              checked={filterOpenOnly}
              onChange={(e) => setFilterOpenOnly(e.target.checked)}
            />
            <span>Open Spots Only</span>
          </label>
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="tf-empty-state">
          <div className="tf-spinner"></div>
          <p>Loading squad listings...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="tf-empty-state">
          <UsersIcon size={40} />
          <h3>No squad listings found</h3>
          <p>Be the first to post a team requirement for your target competition!</p>
          <button className="tf-btn-create" onClick={() => setIsCreateModalOpen(true)}>
            + Create a Squad Post
          </button>
        </div>
      ) : (
        <div className="tf-grid">
          {filteredPosts.map((post) => {
            const isMine = post.created_by_email?.toLowerCase() === currentUser.email?.toLowerCase();
            const myApplication = applications.find(
              (a) => a.post_id === post.id && a.applicant_email?.toLowerCase() === currentUser.email?.toLowerCase()
            );
            const pendingAppsCount = applications.filter((a) => a.post_id === post.id && a.status === 'pending').length;
            const filledCount = post.total_members - post.spots_left;

            return (
              <article key={post.id} className={`tf-card ${!post.is_open ? 'is-full' : ''}`}>
                <div className="tf-card-inner">
                  {/* Competition Header */}
                  <div className="tf-card-top">
                    <div className="tf-card-host">
                      <div className="tf-host-avatar">{(post.created_by_name || 'U').charAt(0).toUpperCase()}</div>
                      <div>
                        <span className="tf-host-name">{post.created_by_name}</span>
                        <span className="tf-host-college">{post.college} · {post.year}</span>
                      </div>
                    </div>
                    <span className={`tf-spot-pill ${post.spots_left > 0 ? 'open' : 'full'}`}>
                      {post.spots_left > 0 ? `${post.spots_left} spots left` : 'Squad Full'}
                    </span>
                  </div>

                  <div className="tf-comp-badge">
                    <TrophyIcon size={13} />
                    <span>{post.competition_name}</span>
                    {post.organizer && <span className="tf-comp-org">({post.organizer})</span>}
                  </div>

                  <h2 className="tf-card-title">{post.title}</h2>
                  {post.description && <p className="tf-card-desc">{post.description}</p>}

                  {/* Skills Looking For */}
                  <div className="tf-skills-section">
                    <span className="tf-skills-heading">LOOKING FOR:</span>
                    <div className="tf-skill-tags">
                      {(post.skills_looking_for || []).map((sk, idx) => (
                        <span key={idx} className="tf-skill-pill target">{sk}</span>
                      ))}
                    </div>
                  </div>

                  {/* Skills Already Have */}
                  {(post.skills_have || []).length > 0 && (
                    <div className="tf-skills-section">
                      <span className="tf-skills-heading">HOST OFFERS:</span>
                      <div className="tf-skill-tags">
                        {post.skills_have.map((sk, idx) => (
                          <span key={idx} className="tf-skill-pill have">{sk}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Spots Progress Bar */}
                  <div className="tf-progress-bar-wrap">
                    <div className="tf-progress-label">
                      <span>Squad Composition</span>
                      <span>{filledCount} of {post.total_members} Filled</span>
                    </div>
                    <div className="tf-progress-track">
                      <div
                        className="tf-progress-fill"
                        style={{ width: `${Math.min(100, (filledCount / post.total_members) * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="tf-card-actions">
                    {isMine ? (
                      <button
                        className="tf-btn-manage"
                        onClick={() => setSelectedPostForReview(post)}
                      >
                        Review Applications {pendingAppsCount > 0 && `(${pendingAppsCount})`}
                      </button>
                    ) : myApplication ? (
                      <div className={`tf-app-status-badge ${myApplication.status}`}>
                        {myApplication.status === 'accepted' ? (
                          <>
                            <CheckIcon size={14} />
                            <span>Accepted!</span>
                            <a
                              href={formatWhatsAppUrl(post.phone_number, `Hi! I was accepted into your squad for ${post.competition_name}!`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="tf-btn-wa"
                              title="Chat on WhatsApp"
                            >
                              <WhatsAppIcon size={14} />
                            </a>
                          </>
                        ) : myApplication.status === 'declined' ? (
                          <span>Application Declined</span>
                        ) : (
                          <span>Application Pending</span>
                        )}
                      </div>
                    ) : (
                      <button
                        className="tf-btn-apply"
                        disabled={!post.is_open}
                        onClick={() => setSelectedPostForApply(post)}
                      >
                        {post.is_open ? 'Request to Join Squad' : 'Squad Full'}
                      </button>
                    )}

                    {post.competition_link && (
                      <a
                        href={post.competition_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tf-icon-btn"
                        title="View Competition Details"
                      >
                        <ExternalLinkIcon size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal: Create Squad */}
      {isCreateModalOpen && (
        <div className="tf-modal-backdrop" onClick={() => setIsCreateModalOpen(false)}>
          <div className="tf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tf-modal-header">
              <h2>Post a Squad Requirement</h2>
              <button className="tf-close-btn" onClick={() => setIsCreateModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateSquad} className="tf-form">
              <div className="tf-form-group">
                <label>Target Competition *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. L'Oréal Brandstorm, Tata Crucible, Bain Case Comp"
                  value={formData.competition_name}
                  onChange={(e) => setFormData({ ...formData, competition_name: e.target.value })}
                />
              </div>

              <div className="tf-form-row">
                <div className="tf-form-group">
                  <label>Host / Organizer</label>
                  <input
                    type="text"
                    placeholder="e.g. Bain, IIM Ahmedabad, SRCC"
                    value={formData.organizer}
                    onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                  />
                </div>
                <div className="tf-form-group">
                  <label>Competition Link</label>
                  <input
                    type="url"
                    placeholder="https://unstop.com/..."
                    value={formData.competition_link}
                    onChange={(e) => setFormData({ ...formData, competition_link: e.target.value })}
                  />
                </div>
              </div>

              <div className="tf-form-row">
                <div className="tf-form-group">
                  <label>Total Squad Size</label>
                  <input
                    type="number"
                    min="2"
                    max="6"
                    value={formData.total_members}
                    onChange={(e) => setFormData({ ...formData, total_members: Number(e.target.value) })}
                  />
                </div>
                <div className="tf-form-group">
                  <label>Open Spots to Fill</label>
                  <input
                    type="number"
                    min="1"
                    max={formData.total_members - 1}
                    value={formData.spots_left}
                    onChange={(e) => setFormData({ ...formData, spots_left: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="tf-form-row">
                <div className="tf-form-group">
                  <label>Your College / Institution *</label>
                  <input
                    type="text"
                    list="college-presets"
                    required
                    placeholder="e.g. SRCC, IIT Delhi, SSCBS"
                    value={formData.college}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                  />
                  <datalist id="college-presets">
                    {PRESET_COLLEGES.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <div className="tf-form-group">
                  <label>Academic Year</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Postgraduate / Masters">Postgraduate / Masters</option>
                  </select>
                </div>
              </div>

              <div className="tf-form-group">
                <label>Headline *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Need 1 Valuation Pro & 1 Deck Maker to win this!"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="tf-form-group">
                <label>Description / Strategy (Optional)</label>
                <textarea
                  rows="2"
                  placeholder="Share a bit about your plan or what kind of vibe/commitment you expect."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>

              <div className="tf-form-group">
                <label>Skills You Are Looking For</label>
                <div className="tf-pill-selector">
                  {DEFAULT_SKILLS.map((sk) => {
                    const active = formData.skills_looking_for.includes(sk);
                    return (
                      <button
                        type="button"
                        key={sk}
                        className={`tf-select-pill ${active ? 'active' : ''}`}
                        onClick={() => {
                          const next = active
                            ? formData.skills_looking_for.filter((s) => s !== sk)
                            : [...formData.skills_looking_for, sk];
                          setFormData({ ...formData, skills_looking_for: next });
                        }}
                      >
                        {sk}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="tf-form-group">
                <label>Skills You / Existing Members Bring</label>
                <div className="tf-pill-selector">
                  {DEFAULT_SKILLS.map((sk) => {
                    const active = formData.skills_have.includes(sk);
                    return (
                      <button
                        type="button"
                        key={sk}
                        className={`tf-select-pill ${active ? 'active' : ''}`}
                        onClick={() => {
                          const next = active
                            ? formData.skills_have.filter((s) => s !== sk)
                            : [...formData.skills_have, sk];
                          setFormData({ ...formData, skills_have: next });
                        }}
                      >
                        {sk}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="tf-form-group">
                <label>WhatsApp Phone Number * (10 Digits - unlocked only upon accepting teammates)</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                />
              </div>

              <div className="tf-modal-footer">
                <button type="button" className="tf-btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="tf-btn-create">Publish Squad</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Apply to Squad */}
      {selectedPostForApply && (
        <div className="tf-modal-backdrop" onClick={() => setSelectedPostForApply(null)}>
          <div className="tf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tf-modal-header">
              <h2>Request to Join {selectedPostForApply.competition_name}</h2>
              <button className="tf-close-btn" onClick={() => setSelectedPostForApply(null)}>✕</button>
            </div>
            <form onSubmit={handleApplyToSquad} className="tf-form">
              <div className="tf-form-group">
                <label>Why are you a great addition to this squad? *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Share your past case/hackathon experience, specific strengths, or what you bring to the table."
                  value={applyData.pitch_note}
                  onChange={(e) => setApplyData({ ...applyData, pitch_note: e.target.value })}
                ></textarea>
              </div>

              <div className="tf-form-row">
                <div className="tf-form-group">
                  <label>Your College / Institution</label>
                  <input
                    type="text"
                    placeholder="e.g. SRCC, BITS Pilani"
                    value={applyData.college}
                    onChange={(e) => setApplyData({ ...applyData, college: e.target.value })}
                  />
                </div>
                <div className="tf-form-group">
                  <label>Your WhatsApp Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={applyData.phone_number}
                    onChange={(e) => setApplyData({ ...applyData, phone_number: e.target.value })}
                  />
                </div>
              </div>

              <div className="tf-modal-footer">
                <button type="button" className="tf-btn-secondary" onClick={() => setSelectedPostForApply(null)}>
                  Cancel
                </button>
                <button type="submit" className="tf-btn-create">Send Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Host Review Applications */}
      {selectedPostForReview && (
        <div className="tf-modal-backdrop" onClick={() => setSelectedPostForReview(null)}>
          <div className="tf-modal wide" onClick={(e) => e.stopPropagation()}>
            <div className="tf-modal-header">
              <h2>Applications for: {selectedPostForReview.title}</h2>
              <button className="tf-close-btn" onClick={() => setSelectedPostForReview(null)}>✕</button>
            </div>
            <div className="tf-apps-list">
              {applications.filter((a) => a.post_id === selectedPostForReview.id).length === 0 ? (
                <p className="tf-empty-notice">No applicants yet. Share your listing link with peers!</p>
              ) : (
                applications
                  .filter((a) => a.post_id === selectedPostForReview.id)
                  .map((app) => (
                    <div key={app.id} className={`tf-app-card ${app.status}`}>
                      <div className="tf-app-meta">
                        <strong>{app.applicant_name}</strong>
                        <span>{app.applicant_college} · {app.applicant_year}</span>
                      </div>
                      <p className="tf-app-pitch">"{app.pitch_note}"</p>
                      <div className="tf-app-actions">
                        {app.status === 'pending' ? (
                          <>
                            <button
                              className="tf-btn-accept"
                              onClick={() => handleUpdateApplicationStatus(app.id, 'accepted')}
                            >
                              ✓ Accept
                            </button>
                            <button
                              className="tf-btn-decline"
                              onClick={() => handleUpdateApplicationStatus(app.id, 'declined')}
                            >
                              ✕ Decline
                            </button>
                          </>
                        ) : app.status === 'accepted' ? (
                          <>
                            <span className="tf-accepted-pill">Accepted Member</span>
                            <a
                              href={formatWhatsAppUrl(app.applicant_phone, `Hi ${app.applicant_name}, I accepted your request for ${selectedPostForReview.competition_name}!`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="tf-btn-wa-direct"
                            >
                              <WhatsAppIcon size={14} /> Chat on WhatsApp
                            </a>
                            <button
                              className="tf-btn-remove"
                              onClick={() => handleUpdateApplicationStatus(app.id, 'removed')}
                            >
                              Remove
                            </button>
                          </>
                        ) : (
                          <span className="tf-declined-pill">Declined</span>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
