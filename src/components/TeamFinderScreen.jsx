// src/components/TeamFinderScreen.jsx
// OneStop Team Finder Standalone Page - Full High-Fidelity Implementation
import React, { useState, useEffect, useMemo } from 'react';
import { SKILLS, initialsOf, isMockPost } from '../data/initialData';
import { formatWhatsAppUrl, sanitizeIndianPhone } from '../context/AuthContext';
import { normalizeYear } from '../data/colleges';
import PostSquadModal from './PostSquadModal';
import ApplyModal from './ApplyModal';
import SectionLoadingWidget from './SectionLoadingWidget';
import InstitutionLogo from './InstitutionLogo';
import CompetitionChatModal from './CompetitionChatModal';
import { SQUAD_PUNS } from './FunLoadingScreen';
import './TeamFinderScreen.css';

const CATS = ['Case Comps', 'Hackathons', 'Writing & Research', 'Quizzes', 'Simulations', 'Debates'];
const CIRCUITS = ['DU Circuit', 'IIMs, IITs & Premier', 'Corporate & Global', 'Others'];

const CAT_COLORS = {
  'Case Comps': '#0F3FFE',
  'Hackathons': '#7C3AED',
  'Writing & Research': '#D97706',
  'Quizzes': '#DB2777',
  'Simulations': '#0891B2',
  'Debates': '#17A34A'
};

function formatDue(daysOrDeadline) {
  let h = 24;
  if (typeof daysOrDeadline === 'string' && daysOrDeadline.includes('-')) {
    const diff = new Date(daysOrDeadline).getTime() - Date.now();
    if (!isNaN(diff)) h = Math.max(1, Math.round(diff / 3600000));
  } else if (daysOrDeadline !== undefined && daysOrDeadline !== null) {
    h = Math.max(1, Math.round(Number(daysOrDeadline) * 24));
  }

  let text = '';
  let color = '';
  let bg = '';
  let border = '';

  if (h < 24) {
    text = `${h}h left`;
    color = '#DC2626';
    bg = 'rgba(220, 38, 38, 0.08)';
    border = '1px solid rgba(220, 38, 38, 0.25)';
  } else {
    const d = Math.round(h / 24);
    text = `${d}d left`;
    if (d < 7) {
      color = '#B45309';
      bg = 'rgba(217, 119, 6, 0.08)';
      border = '1px solid rgba(217, 119, 6, 0.25)';
    } else {
      color = '#15803D';
      bg = 'rgba(23, 163, 74, 0.08)';
      border = '1px solid rgba(23, 163, 74, 0.25)';
    }
  }
  return { text, color, bg, border, hours: h, days: h / 24 };
}

const ChevronIcon = ({ open = false, className = '' }) => (
  <svg
    className={className}
    width={12}
    height={12}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
      transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
      display: 'inline-block',
      flex: 'none'
    }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const CheckIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ArrowUpDownIcon = ({ size = 13, className = '' }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d="m21 16-4 4-4-4" />
    <path d="M17 20V4" />
    <path d="m3 8 4-4 4 4" />
    <path d="M7 4v16" />
  </svg>
);

const ChatBubbleIcon = ({ size = 15, color = "#0F3FFE" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

const WhatsAppIcon = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#25D366" style={{ flex: 'none' }}>
    <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.276-.101-.477-.15-.678.15-.201.3-.778.978-.954 1.179-.176.2-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.896-.799-1.501-1.786-1.677-2.087-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.201-.3.301-.501.101-.2.05-.376-.025-.526-.075-.15-.678-1.635-.929-2.239-.245-.588-.493-.508-.678-.518l-.578-.01c-.2 0-.527.075-.803.376-.276.301-1.054 1.03-1.054 2.512s1.079 2.913 1.23 3.114c.15.201 2.124 3.243 5.145 4.549.719.31 1.281.496 1.719.635.722.23 1.379.197 1.9.12.58-.087 1.78-.727 2.03-1.43.251-.703.251-1.305.176-1.43-.075-.126-.276-.201-.577-.352z"></path>
    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.982-1.396A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.167c-1.614 0-3.12-.486-4.383-1.323l-.314-.207-2.955.828.84-2.88-.204-.325A8.134 8.134 0 0 1 3.833 12c0-4.503 3.664-8.167 8.167-8.167s8.167 3.664 8.167 8.167-3.664 8.167-8.167 8.167z"></path>
  </svg>
);

// High-fidelity fallback squad data matching designer screenshot
const SAMPLE_COMPS = [
  {
    id: 'c1',
    title: 'Envision 2026 — National Case Challenge',
    host: 'Shaheed Sukhdev College of Business Studies',
    logo: 'https://upload.wikimedia.org/wikipedia/en/2/29/Shaheed_Sukhdev_College_of_Business_Studies_logo.png',
    days: 5 / 24,
    team: '2–4 members',
    cat: 'Case Comps',
    circuit: 'DU Circuit',
    url: 'https://unstop.com'
  },
  {
    id: 'c9',
    title: 'Revive the Failed — Business Case Competition',
    host: 'Lady Shri Ram College for Women',
    logo: 'https://upload.wikimedia.org/wikipedia/en/3/30/Lady_Shri_Ram_College_logo.png',
    days: 6,
    team: '2–3 members',
    cat: 'Case Comps',
    circuit: 'DU Circuit',
    url: 'https://unstop.com'
  },
  {
    id: 'c5',
    title: 'Business & Economics Quiz',
    host: 'Shri Ram College of Commerce',
    logo: 'https://upload.wikimedia.org/wikipedia/en/8/87/Shri_Ram_College_of_Commerce_logo.png',
    days: 4,
    team: '2 members',
    cat: 'Quizzes',
    circuit: 'DU Circuit',
    url: 'https://unstop.com'
  },
  {
    id: 'c6',
    title: 'Bain Business Bowl',
    host: 'Bain & Company',
    logo: 'https://logo.clearbit.com/bain.com',
    days: 17,
    team: '3–4 members',
    cat: 'Case Comps',
    circuit: 'Corporate & Global',
    url: 'https://unstop.com'
  },
  {
    id: 'c7',
    title: 'Market Mayhem — Trading Simulation',
    host: 'IIM Ahmedabad',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/90/IIM_Ahmedabad_Logo.svg/512px-IIM_Ahmedabad_Logo.svg.png',
    days: 8,
    team: '2–3 members',
    cat: 'Simulations',
    circuit: 'IIMs, IITs & Premier',
    url: 'https://unstop.com'
  },
  {
    id: 'c8',
    title: 'Consult-a-thon',
    host: 'Kirori Mal College',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/9/92/Kirori_Mal_College_logo.png/220px-Kirori_Mal_College_logo.png',
    days: 15,
    team: '3–4 members',
    cat: 'Case Comps',
    circuit: 'DU Circuit',
    url: 'https://unstop.com'
  },
  {
    id: 'c2',
    title: 'Prayaas Case Challenge',
    host: 'Shri Ram College of Commerce',
    logo: 'https://upload.wikimedia.org/wikipedia/en/8/87/Shri_Ram_College_of_Commerce_logo.png',
    days: 20 / 24,
    team: '3–4 members',
    cat: 'Case Comps',
    circuit: 'DU Circuit',
    url: 'https://unstop.com'
  },
  {
    id: 'c3',
    title: "L'Oréal Brandstorm 2026",
    host: "L'Oréal",
    logo: 'https://logo.clearbit.com/loreal.com',
    days: 11,
    team: '3 members',
    cat: 'Case Comps',
    circuit: 'Corporate & Global',
    url: 'https://unstop.com'
  },
  {
    id: 'c4',
    title: 'Smart India Hackathon — Campus Round',
    host: 'Ministry of Education',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/41/Smart_India_Hackathon_Logo.png/250px-Smart_India_Hackathon_Logo.png',
    days: 23,
    team: '6 members',
    cat: 'Hackathons',
    circuit: 'Others',
    url: 'https://unstop.com'
  }
];

const SAMPLE_POSTS = [
  {
    id: 'demo_p1',
    compId: 'c1',
    lead: 'Ananya Rao',
    college: 'LSR',
    year: '3rd year',
    posted: '4h ago',
    total: 4,
    members: [{ name: 'Riya Kapoor', college: 'LSR', year: '3rd year' }],
    state: 'open',
    want: ['Market research', 'Deck design'],
    have: ['Finance modelling', 'Public speaking'],
    desc: 'We made the semis last year and want to go further. Looking for one person who can dig up market data fast and one who can make a deck look sharp. We meet on Meet most evenings after 8.',
    comm_method: 'whatsapp',
    phone: '9811042278'
  },
  {
    id: 'demo_p8',
    compId: 'c9',
    lead: 'Riddhi Sharma',
    college: 'LSR',
    year: 'BMS, 1st year',
    posted: '6h ago',
    total: 3,
    members: [],
    state: 'open',
    want: [],
    have: ['Market research'],
    desc: 'First case comp for me. All skills and backgrounds welcome, just be ready to put in a few evenings.',
    comm_method: 'chat',
    phone: '9811042278'
  },
  {
    id: 'demo_p4',
    compId: 'c5',
    lead: 'Meher Gill',
    college: 'SSCBS',
    year: '1st year',
    posted: '2 days ago',
    total: 2,
    members: [{ name: 'Arjun Nair', college: 'SSCBS', year: '1st year' }],
    state: 'full',
    want: ['Public speaking'],
    have: ['Copywriting'],
    desc: 'Quiz pair. Full for now.',
    comm_method: 'none',
    phone: '9811042278'
  },
  {
    id: 'demo_p5',
    compId: 'c6',
    lead: 'Devansh Iyer',
    college: 'SRCC',
    year: '2nd year',
    posted: '2 days ago',
    total: 4,
    members: [],
    state: 'open',
    want: ['Finance modelling', 'Valuation', 'Public speaking'],
    have: ['Market research'],
    desc: 'First Bain Bowl for all of us. Serious about prep: two mock cases a week before the deadline.',
    comm_method: 'chat',
    phone: '9811042278'
  },
  {
    id: 'demo_p6',
    compId: 'c7',
    lead: 'Sara Thomas',
    college: 'IIM Ahmedabad',
    year: 'PGP, 1st year',
    posted: '3 days ago',
    total: 3,
    members: [{ name: 'Kunal Jain', college: 'IIT Delhi', year: '3rd year' }],
    state: 'open',
    want: ['Finance modelling', 'ML / Data'],
    have: ['Valuation'],
    desc: 'Trading sim with a quant bent. Comfort with Excel or Python matters more than finance theory.',
    comm_method: 'whatsapp',
    phone: '9811042278'
  },
  {
    id: 'demo_p7',
    compId: 'c1',
    lead: 'Rohan Das',
    college: 'SRCC',
    year: '2nd year',
    posted: '4 days ago',
    total: 3,
    members: [],
    state: 'open',
    want: ['Deck design', 'Copywriting'],
    have: ['Finance modelling'],
    desc: 'Second SRCC team for Envision. Need a storyteller and a slide person.',
    comm_method: 'chat',
    phone: '9811042278'
  }
];

const SAMPLE_OWN = [
  {
    id: 'demo_o1',
    compId: 'c2',
    posted: '2 days ago',
    total: 4,
    closed: false,
    want: ['Finance modelling', 'Valuation'],
    have: ['Deck design', 'Public speaking'],
    desc: 'Two-person SRCC team so far. Need someone who can own the financials and one more analyst.',
    phone: '9811042278',
    apps: [
      { id: 'demo_a1', name: 'Priya Menon', college: 'SSCBS', year: '2nd year', status: 'pending', skills: ['Finance modelling', 'Valuation', 'Market research'], pitch: 'Built three LBO models for my finance society this year. Happy to own the numbers end to end.', phone: '9876543210' },
      { id: 'demo_a2', name: 'Aditya Rao', college: 'Hansraj College', year: '3rd year', status: 'pending', skills: ['Public speaking', 'Market research'], pitch: 'Finalist at two case comps last semester. Strong on the pitch, can help with research.', phone: '9876543211' },
      { id: 'demo_a3', name: 'Neha Bansal', college: 'SRCC', year: '2nd year', status: 'accepted', skills: ['Valuation', 'Deck design'], pitch: 'Classmate from B.Com (H). I can do valuation and help with slides.', phone: '9876543212' }
    ]
  },
  {
    id: 'demo_o2',
    compId: 'c8',
    posted: '5 days ago',
    total: 3,
    closed: false,
    want: ['Market research'],
    have: ['Deck design'],
    desc: 'Looking for a researcher who enjoys digging into industry reports.',
    phone: '9811042278',
    apps: []
  }
];

export default function TeamFinderScreen({
  posts = [],
  competitions = [],
  profile = null,
  applications = [],
  user = null,
  onOpenPostSquad,
  onOpenEditSquad,
  onOpenApply,
  onOpenWhatsApp,
  onGoRequests,
  onTogglePostOpen,
  onDeleteSquadPost,
  onAcceptApp,
  onDeclineApp,
  onRemoveApp,
  onWithdrawApp,
  onBack,
  onNavigate,
  showToast,
  headerAction,
  onSubmitPost
}) {
  const [tab, setTab] = useState('other'); // 'other' | 'mine'
  const [showSquadLoader, setShowSquadLoader] = useState(false);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('newest'); // 'newest' | 'closing' | 'spots'
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Filters State
  const [fMatch, setFMatch] = useState(false);
  const [fMyCollege, setFMyCollege] = useState(false);
  const [fCats, setFCats] = useState([]);
  const [fCircuits, setFCircuits] = useState([]);
  const [fSkills, setFSkills] = useState([]);
  const [fSpots, setFSpots] = useState('any'); // 'any' | '1' | '2'
  const [fCloses, setFCloses] = useState('any'); // 'any' | 'week' | 'month'

  const [openSections, setOpenSections] = useState({
    categories: true,
    circuits: true,
    skills: false,
  });

  const toggleSection = (sectionKey) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const handleToggleAllCats = () => {
    if (fCats.length > 0) {
      setFCats([]);
    } else {
      setFCats([...CATS]);
    }
  };

  const handleToggleAllCircuits = () => {
    if (fCircuits.length > 0) {
      setFCircuits([]);
    } else {
      setFCircuits([...CIRCUITS]);
    }
  };

  const handleToggleAllSkills = () => {
    if (fSkills.length > 0) {
      setFSkills([]);
    } else {
      setFSkills([...SKILLS]);
    }
  };

  // Modals & Sheets State
  const [detailPostId, setDetailPostId] = useState(null);
  const [reviewPostId, setReviewPostId] = useState(null);
  const [reviewTab, setReviewTab] = useState('pending'); // 'pending' | 'accepted' | 'declined'
  const [chatModalPost, setChatModalPost] = useState(null);

  // Post / Edit Squad Modal State
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [editingPostData, setEditingPostData] = useState(null);

  // Apply Modal State
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyTargetPost, setApplyTargetPost] = useState(null);

  // Local state mutations for demo / live reactivity
  const [localPostsState, setLocalPostsState] = useState(() => {
    return SAMPLE_POSTS.map(p => ({ ...p }));
  });
  const [localOwnState, setLocalOwnState] = useState(() => {
    return SAMPLE_OWN.map(o => ({ ...o, apps: o.apps.map(a => ({ ...a })) }));
  });

  const profileSkills = useMemo(() => (profile?.skills?.length ? profile.skills : ['Market research', 'Deck design', 'Copywriting']), [profile]);
  const userCollege = (profile?.college || user?.user_metadata?.college || 'SRCC').trim();
  const userName = profile?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';
  const userYear = normalizeYear(profile?.year || profile?.batch || 'UG 2nd Year');

  const activeChatApp = useMemo(() => {
    if (!chatModalPost) return null;
    const existing = applications.find(a => String(a.postId || a.post_id) === String(chatModalPost.id));
    if (existing) return existing;
    return {
      id: `chat_app_${chatModalPost.id}`,
      post_id: chatModalPost.id,
      applicant_name: userName || 'You',
      applicant_college: userCollege,
      applicant_year: userYear,
      status: 'pending',
      dir: 'out'
    };
  }, [chatModalPost, applications, userName, userCollege, userYear]);

  // Helper to find competition metadata
  const getCompMeta = (compId, fallbackTitle, fallbackHost) => {
    const live = competitions.find(c => String(c.id) === String(compId) || (c.title && c.title.toLowerCase() === (fallbackTitle || '').toLowerCase()));
    if (live) {
      let cat = 'Case Comps';
      const catKey = (live.category || live.discipline || '').toLowerCase();
      if (catKey.includes('hack') || catKey.includes('code')) cat = 'Hackathons';
      else if (catKey.includes('writ') || catKey.includes('research')) cat = 'Writing & Research';
      else if (catKey.includes('quiz')) cat = 'Quizzes';
      else if (catKey.includes('simul')) cat = 'Simulations';
      else if (catKey.includes('debat')) cat = 'Debates';

      let circ = 'Others';
      if (live.isDU || /sscbs|srcc|hindu|hansraj|lsr|kmc|ramjas|du/i.test(live.host || '')) circ = 'DU Circuit';
      else if (live.isPremier || live.isIIMorIIT || /iim|iit|bits|fms|xlri/i.test(live.host || '')) circ = 'IIMs, IITs & Premier';
      else if (live.isCorporate || /bain|l'oreal|mckinsey|tata|google/i.test(live.host || '')) circ = 'Corporate & Global';

      const dueInfo = formatDue(live.deadline || live.days || 10);
      return {
        id: live.id,
        title: live.title,
        host: live.host || live.orgName || 'Organizer',
        logo: live.orgLogo || live.logo || live.bannerUrl || null,
        cat,
        circuit: circ,
        url: live.unstopUrl || 'https://unstop.com',
        dueText: dueInfo.text,
        dueColor: dueInfo.color,
        dueBg: dueInfo.bg,
        dueBorder: dueInfo.border,
        days: dueInfo.days
      };
    }

    const sample = SAMPLE_COMPS.find(c => c.id === compId);
    if (sample) {
      const dueInfo = formatDue(sample.days);
      return {
        ...sample,
        dueText: dueInfo.text,
        dueColor: dueInfo.color,
        dueBg: dueInfo.bg,
        dueBorder: dueInfo.border,
        days: dueInfo.days
      };
    }

    const dueInfo = formatDue(7);
    return {
      id: compId || 'custom',
      title: fallbackTitle || 'Collegiate Challenge',
      host: fallbackHost || 'University Host',
      logo: null,
      cat: 'Case Comps',
      circuit: 'DU Circuit',
      url: 'https://unstop.com',
      dueText: dueInfo.text,
      dueColor: dueInfo.color,
      dueBg: dueInfo.bg,
      dueBorder: dueInfo.border,
      days: 7
    };
  };

  // Build unified normalized posts
  const realCleanPosts = useMemo(() => (Array.isArray(posts) ? posts.filter(p => !isMockPost(p)) : []), [posts]);

  const allPosts = useMemo(() => {
    // If realCleanPosts exist, map real posts
    const mappedReal = realCleanPosts.map((p, i) => {
      const comp = getCompMeta(p.compId, p.competition_name || p.title, p.organizer || p.host);
      const isMine = Boolean(
        p.mine ||
        (user && p.user_id && p.user_id === user.id) ||
        (user && p.created_by_email && p.created_by_email.toLowerCase() === (user.email || '').toLowerCase()) ||
        (userName && (p.created_by_name || p.lead || '').toLowerCase() === userName.toLowerCase())
      );

      const want = Array.isArray(p.skills_looking_for) ? p.skills_looking_for : (Array.isArray(p.want) ? p.want : []);
      const have = Array.isArray(p.skills_have) ? p.skills_have : (Array.isArray(p.have) ? p.have : []);
      const total = Number(p.total_members || p.size || 4);

      // Connected applications
      const postApps = applications.filter(a => String(a.postId || a.post_id) === String(p.id));
      const acceptedApps = postApps.filter(a => a.status === 'accepted');
      const pendingApps = postApps.filter(a => a.status === 'pending');
      const declinedApps = postApps.filter(a => a.status === 'declined' || a.status === 'rejected');

      const filled = 1 + acceptedApps.length;
      const openN = Math.max(0, total - filled);

      const myApp = applications.find(a =>
        String(a.postId || a.post_id) === String(p.id) &&
        (a.dir === 'out' || (user && a.applicant_id === user.id) || (user && a.applicant_email === user.email))
      );

      let state = 'open';
      if (isMine) {
        state = p.is_open === false ? 'closed' : 'own';
      } else if (myApp) {
        state = myApp.status === 'accepted' ? 'accepted' : (myApp.status === 'rejected' || myApp.status === 'declined' ? 'open' : 'requested');
      } else if (openN <= 0 || p.is_open === false) {
        state = 'full';
      }

      const match = want.filter(w => profileSkills.includes(w)).length;

      return {
        id: p.id,
        rawPost: p,
        comp,
        lead: isMine ? 'You' : (p.created_by_name || p.lead || 'Student Lead'),
        college: p.college || userCollege,
        year: p.year || '2nd year',
        posted: p.posted || 'recently',
        total,
        filled,
        openN,
        want,
        have,
        desc: p.description || p.desc || '',
        phone: p.phone_number || p.phone || p.leadPhone || '',
        comm_method: p.comm_method || p.commMethod || (p.phone || p.phone_number || p.leadPhone ? 'whatsapp' : 'chat'),
        state,
        isOwn: isMine,
        apps: postApps.map(a => ({
          id: a.id,
          name: a.applicant_name || a.who || 'Applicant',
          college: a.applicant_college || a.meta || 'Collegiate',
          year: a.applicant_year || 'UG',
          status: a.status || 'pending',
          skills: a.highlighted_skills || a.skills || [],
          pitch: a.pitch_note || a.pitch || '',
          phone: a.applicant_phone || a.phone || ''
        })),
        members: acceptedApps.map(a => ({
          name: a.applicant_name || a.who || 'Member',
          college: a.applicant_college || 'Collegiate',
          year: a.applicant_year || 'UG'
        })),
        match,
        idx: i
      };
    });

    if (mappedReal.length > 0) {
      return mappedReal;
    }

    // Otherwise use design demo state
    const others = localPostsState.map((p, i) => {
      const comp = getCompMeta(p.compId);
      const filled = 1 + (p.members?.length || 0);
      const openN = Math.max(0, p.total - filled);
      const match = p.want.filter(w => profileSkills.includes(w)).length;
      return {
        id: p.id,
        comp,
        lead: p.lead,
        college: p.college,
        year: p.year,
        posted: p.posted,
        total: p.total,
        filled,
        openN,
        want: p.want,
        have: p.have,
        desc: p.desc,
        phone: p.phone,
        comm_method: p.comm_method || 'chat',
        state: p.state,
        isOwn: false,
        apps: [],
        members: p.members || [],
        match,
        idx: i
      };
    });

    const mine = localOwnState.map((o, i) => {
      const comp = getCompMeta(o.compId);
      const acc = o.apps.filter(a => a.status === 'accepted');
      const filled = 1 + acc.length;
      const openN = Math.max(0, o.total - filled);
      return {
        id: o.id,
        comp,
        lead: 'You',
        college: userCollege,
        year: userYear,
        posted: o.posted,
        total: o.total,
        filled,
        openN,
        want: o.want,
        have: o.have,
        desc: o.desc,
        phone: o.phone,
        state: o.closed ? 'closed' : 'own',
        isOwn: true,
        apps: o.apps,
        members: acc.map(a => ({ name: a.name, college: a.college, year: a.year })),
        match: 0,
        closed: o.closed,
        idx: -100 + i
      };
    });

    return [...others, ...mine];
  }, [realCleanPosts, competitions, applications, user, userName, userCollege, userYear, profileSkills, localPostsState, localOwnState]);

  // Pools
  const otherPool = useMemo(() => allPosts.filter(p => !p.isOwn && (p.state === 'open' || p.state === 'full')), [allPosts]);
  const appliedPool = useMemo(() => allPosts.filter(p => !p.isOwn && (p.state === 'requested' || p.state === 'accepted')), [allPosts]);
  const ownPool = useMemo(() => allPosts.filter(p => p.isOwn), [allPosts]);
  const myTotalPool = useMemo(() => [...ownPool, ...appliedPool], [ownPool, appliedPool]);

  const activePool = tab === 'other' ? otherPool : myTotalPool;

  const collegeMatches = (postCollege, myCollege) => {
    if (!postCollege || !myCollege) return false;
    const p = postCollege.toLowerCase().trim();
    const m = myCollege.toLowerCase().trim();
    return p === m || p.includes(m) || m.includes(p);
  };

  // Filter testing predicate
  const passFilter = (p, skip = null) => {
    if (skip !== 'match' && fMatch && p.match === 0) return false;
    if (skip !== 'myCollege' && fMyCollege && !collegeMatches(p.college, userCollege)) return false;
    if (skip !== 'cats' && fCats.length > 0 && !fCats.includes(p.comp.cat)) return false;
    if (skip !== 'circuits' && fCircuits.length > 0 && !fCircuits.includes(p.comp.circuit)) return false;
    if (skip !== 'skills' && fSkills.length > 0 && !p.want.some(w => fSkills.includes(w))) return false;
    if (fSpots === '1' && p.openN !== 1) return false;
    if (fSpots === '2' && p.openN < 2) return false;
    if (fCloses === 'week' && p.comp.days > 7) return false;
    if (fCloses === 'month' && p.comp.days > 30) return false;

    if (q.trim()) {
      const hay = `${p.comp.title} ${p.comp.host} ${p.lead} ${p.college} ${p.want.join(' ')}`.toLowerCase();
      if (!hay.includes(q.trim().toLowerCase())) return false;
    }
    return true;
  };

  // Faceted count calculation helper
  const countIn = (pred, skip) => {
    return activePool.filter(p => passFilter(p, skip) && pred(p)).length;
  };

  // Sort function
  const sortComparator = (a, b) => {
    switch (sort) {
      case 'closing':
        return (a.comp.days || 99) - (b.comp.days || 99);
      case 'closing-latest':
        return (b.comp.days || 0) - (a.comp.days || 0);
      case 'match':
        if (b.match !== a.match) return b.match - a.match;
        return a.idx - b.idx;
      case 'spots':
        if (b.openN !== a.openN) return b.openN - a.openN;
        return a.idx - b.idx;
      case 'almost-full':
        if (a.openN !== b.openN) return a.openN - b.openN;
        return (a.comp.days || 99) - (b.comp.days || 99);
      case 'title-asc':
        return (a.comp.title || '').localeCompare(b.comp.title || '');
      case 'newest':
      default:
        return a.idx - b.idx;
    }
  };

  // Clear all filters
  const handleClearAll = () => {
    setFMatch(false);
    setFMyCollege(false);
    setFCats([]);
    setFCircuits([]);
    setFSkills([]);
    setFSpots('any');
    setFCloses('any');
    setQ('');
  };

  // Active filter chips
  const activeChips = useMemo(() => {
    const chips = [];
    if (fMatch) chips.push({ label: 'Matches my skills', remove: () => setFMatch(false) });
    if (fMyCollege) chips.push({ label: 'Teams From My College', remove: () => setFMyCollege(false) });
    fCats.forEach(c => chips.push({ label: c, remove: () => setFCats(fCats.filter(x => x !== c)) }));
    fCircuits.forEach(c => chips.push({ label: c, remove: () => setFCircuits(fCircuits.filter(x => x !== c)) }));
    fSkills.forEach(s => chips.push({ label: s, remove: () => setFSkills(fSkills.filter(x => x !== s)) }));
    if (fSpots !== 'any') chips.push({ label: fSpots === '1' ? '1 spot left' : '2+ spots', remove: () => setFSpots('any') });
    if (fCloses !== 'any') chips.push({ label: fCloses === 'week' ? 'Closes this week' : 'Closes this month', remove: () => setFCloses('any') });
    return chips;
  }, [fMatch, fMyCollege, userCollege, fCats, fCircuits, fSkills, fSpots, fCloses]);

  const filterCount = activeChips.length;

  // Filtered & Sorted Listings
  const displayedSections = useMemo(() => {
    if (tab === 'other') {
      const list = otherPool.filter(p => passFilter(p)).sort(sortComparator);
      return list.length ? [{ hasTitle: false, cards: list }] : [];
    } else {
      const leadList = ownPool.filter(p => passFilter(p)).sort(sortComparator);
      const appliedList = appliedPool.filter(p => passFilter(p)).sort(sortComparator);
      const secs = [];
      if (leadList.length > 0) secs.push({ hasTitle: true, title: 'Posted by you', count: leadList.length, cards: leadList });
      if (appliedList.length > 0) secs.push({ hasTitle: true, title: 'Squads you applied to', count: appliedList.length, cards: appliedList });
      return secs;
    }
  }, [tab, otherPool, ownPool, appliedPool, fMatch, fMyCollege, fCats, fCircuits, fSkills, fSpots, fCloses, q, sort]);

  const totalCardsShown = displayedSections.reduce((acc, s) => acc + s.cards.length, 0);

  // Card interaction handlers
  const handleOpenWhatsAppPost = (e, post) => {
    e.stopPropagation();
    if (onOpenWhatsApp) {
      onOpenWhatsApp(post.rawPost || post);
    } else {
      const phone = post.phone || '9811042278';
      const leadName = post.lead.split(' ')[0];
      const msg = `Hey ${leadName}! Reaching out regarding your squad for "${post.comp.title}". Wanted to connect!`;
      const url = formatWhatsAppUrl(phone, msg);
      if (url && url !== '#') window.open(url, '_blank', 'noopener,noreferrer');
      else alert('No WhatsApp number provided.');
    }
  };

  const handleRequestJoin = (e, post) => {
    e.stopPropagation();
    if (onOpenApply) {
      onOpenApply(post.rawPost || post);
    } else {
      // Local optimistic update
      setLocalPostsState(prev => prev.map(p => p.id === post.id ? { ...p, state: 'requested' } : p));
      if (showToast) showToast(`Request sent to ${post.lead.split(' ')[0]}`);
    }
  };

  const handleWithdraw = (e, post) => {
    e.stopPropagation();
    if (onWithdrawApp && post.rawPost) {
      const myApp = applications.find(a => String(a.postId || a.post_id) === String(post.id));
      if (myApp) onWithdrawApp(myApp.id);
    } else {
      setLocalPostsState(prev => prev.map(p => p.id === post.id ? { ...p, state: 'open' } : p));
      if (showToast) showToast('Request withdrawn');
    }
  };

  const handleToggleClosed = (e, post) => {
    e.stopPropagation();
    if (onTogglePostOpen) {
      onTogglePostOpen(post.id, post.state !== 'closed');
    } else {
      setLocalOwnState(prev => prev.map(o => o.id === post.id ? { ...o, closed: !o.closed } : o));
    }
  };

  const handleOpenEdit = (e, post) => {
    e.stopPropagation();
    if (onOpenEditSquad) {
      onOpenEditSquad(post.rawPost || post);
    } else {
      setEditingPostData(post);
      setPostModalOpen(true);
    }
  };

  // Review modal target
  const reviewTarget = useMemo(() => {
    if (!reviewPostId) return null;
    return allPosts.find(p => p.id === reviewPostId) || null;
  }, [reviewPostId, allPosts]);

  // Detail sheet target
  const detailTarget = useMemo(() => {
    if (!detailPostId) return null;
    return allPosts.find(p => p.id === detailPostId) || null;
  }, [detailPostId, allPosts]);

  // Review actions
  const handleAcceptApplicant = (appId) => {
    if (onAcceptApp) {
      onAcceptApp(appId);
    } else {
      setLocalOwnState(prev => prev.map(o => {
        if (o.id !== reviewPostId) return o;
        return {
          ...o,
          apps: o.apps.map(a => a.id === appId ? { ...a, status: 'accepted' } : a)
        };
      }));
    }
  };

  const handleDeclineApplicant = (appId) => {
    if (onDeclineApp) {
      onDeclineApp(appId);
    } else {
      setLocalOwnState(prev => prev.map(o => {
        if (o.id !== reviewPostId) return o;
        return {
          ...o,
          apps: o.apps.map(a => a.id === appId ? { ...a, status: 'declined' } : a)
        };
      }));
    }
  };

  const handleRemoveApplicant = (appId) => {
    if (onRemoveApp) {
      onRemoveApp(appId);
    } else {
      setLocalOwnState(prev => prev.map(o => {
        if (o.id !== reviewPostId) return o;
        return {
          ...o,
          apps: o.apps.map(a => a.id === appId ? { ...a, status: 'pending' } : a)
        };
      }));
    }
  };

  const handleUndoDecline = (appId) => {
    setLocalOwnState(prev => prev.map(o => {
      if (o.id !== reviewPostId) return o;
      return {
        ...o,
        apps: o.apps.map(a => a.id === appId ? { ...a, status: 'pending' } : a)
      };
    }));
  };

  const handlePostSuccess = () => {
    setTab('mine');
    if (showToast) showToast('Squad posted! Switched to My listings.');
  };

  return (
    <div className="tf-page">
      <div className="tf-container">

        {/* ── Top Header ── */}
        <header className="tf-header">
          <div className="tf-header-left">
            <button
              type="button"
              onClick={onBack || (() => window.history.back())}
              aria-label="Go back"
              className="tf-back-btn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
            <div className="tf-title-block">
              <h1 className="tf-title">Team finder</h1>
              <p className="tf-subtitle">
                Find a squad for any competition, or post your own. Message the lead on WhatsApp before or after you request.
              </p>
            </div>
          </div>

          <div className="tf-header-right">
            <button
              type="button"
              onClick={() => {
                if (onOpenPostSquad) onOpenPostSquad(null);
                else {
                  setEditingPostData(null);
                  setPostModalOpen(true);
                }
              }}
              className="tf-post-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg>
              Post a squad
            </button>
            {headerAction}
          </div>
        </header>

        {/* ── Two-Column Main Layout ── */}
        <div className="tf-body-grid">

          {/* ── Filter Sidebar (Left) ── */}
          <aside className={`tf-sidebar cc-filter-sidebar ${isMobileFiltersOpen ? 'mobile-open' : ''}`}>
            {/* Mobile Drawer Header */}
            <div className="cc-mobile-filter-header">
              <div className="cc-mobile-filter-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
                <span>Filters {filterCount > 0 && `(${filterCount})`}</span>
              </div>
              <div className="cc-mobile-filter-actions">
                {filterCount > 0 && (
                  <button type="button" className="cc-filter-reset-link" onClick={handleClearAll}>
                    Reset All
                  </button>
                )}
                <button
                  type="button"
                  className="cc-mobile-filter-close"
                  onClick={() => setIsMobileFiltersOpen(false)}
                  aria-label="Close filters"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="cc-filter-card cc-unified-filter-card">


              {/* Header: Title & Reset All */}
              <div className="cc-filter-card-header">
                <div className="cc-card-heading-group">
                  <span className="cc-card-heading">Filters</span>
                  {filterCount > 0 && (
                    <span className="cc-active-count-badge">{filterCount}</span>
                  )}
                </div>
                {filterCount > 0 && (
                  <button
                    type="button"
                    className="cc-filter-reset-link"
                    onClick={handleClearAll}
                    title="Reset all filters"
                  >
                    Reset All
                  </button>
                )}
              </div>

              {/* Subgroup 1: Quick Preferences (Matches skills, College lead) */}
              <div className="cc-filter-subgroup" style={{ borderTop: 'none', paddingTop: 2 }}>
                <div className="cc-checkbox-list">
                  <label className="cc-filter-checkbox-row">
                    <input
                      type="checkbox"
                      className="cc-filter-checkbox-input"
                      checked={fMatch}
                      onChange={() => setFMatch(!fMatch)}
                    />
                    <span className="cc-custom-checkbox">
                      {fMatch && <CheckIcon size={10} />}
                    </span>
                    <span className="cc-checkbox-label-text">Matches my skills</span>
                    <span className="cc-filter-num">({countIn(p => p.match > 0, 'match')})</span>
                  </label>

                  <label className="cc-filter-checkbox-row">
                    <input
                      type="checkbox"
                      className="cc-filter-checkbox-input"
                      checked={fMyCollege}
                      onChange={() => setFMyCollege(!fMyCollege)}
                    />
                    <span className="cc-custom-checkbox">
                      {fMyCollege && <CheckIcon size={10} />}
                    </span>
                    <span className="cc-checkbox-label-text">Teams From My College</span>
                    <span className="cc-filter-num">({countIn(p => collegeMatches(p.college, userCollege), 'myCollege')})</span>
                  </label>
                </div>
              </div>

              {/* Subgroup 2: Categories */}
              <div className="cc-filter-subgroup">
                <div className="cc-subgroup-header-row">
                  <button
                    type="button"
                    className={`cc-accordion-header ${openSections.categories ? 'open' : ''}`}
                    onClick={() => toggleSection('categories')}
                    aria-expanded={openSections.categories}
                  >
                    <div className="cc-accordion-header-left">
                      <ChevronIcon open={openSections.categories} size={13} className="cc-accordion-chevron" />
                      <span className="cc-accordion-title">Categories</span>
                    </div>
                    {fCats.length > 0 && (
                      <span className="cc-active-count-badge">{fCats.length}</span>
                    )}
                  </button>
                  <button
                    type="button"
                    className="cc-mini-select-all"
                    onClick={handleToggleAllCats}
                    title={fCats.length > 0 ? "Clear categories" : "Select all categories"}
                  >
                    {fCats.length > 0 ? "Clear" : "All"}
                  </button>
                </div>

                {openSections.categories && (
                  <div className="cc-accordion-content">
                    <div className="cc-checkbox-list">
                      {CATS.map((c) => {
                        const isChecked = fCats.includes(c);
                        const count = countIn(p => p.comp.cat === c, 'cats');
                        return (
                          <label key={c} className="cc-filter-checkbox-row">
                            <input
                              type="checkbox"
                              className="cc-filter-checkbox-input"
                              checked={isChecked}
                              onChange={() => setFCats(isChecked ? fCats.filter(x => x !== c) : [...fCats, c])}
                            />
                            <span className="cc-custom-checkbox">
                              {isChecked && <CheckIcon size={10} />}
                            </span>
                            <span className="cc-checkbox-label-text">{c}</span>
                            <span className="cc-filter-num">({count})</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Subgroup 3: Circuits */}
              <div className="cc-filter-subgroup">
                <div className="cc-subgroup-header-row">
                  <button
                    type="button"
                    className={`cc-accordion-header ${openSections.circuits ? 'open' : ''}`}
                    onClick={() => toggleSection('circuits')}
                    aria-expanded={openSections.circuits}
                  >
                    <div className="cc-accordion-header-left">
                      <ChevronIcon open={openSections.circuits} size={13} className="cc-accordion-chevron" />
                      <span className="cc-accordion-title">Circuits</span>
                    </div>
                    {fCircuits.length > 0 && (
                      <span className="cc-active-count-badge">{fCircuits.length}</span>
                    )}
                  </button>
                  <button
                    type="button"
                    className="cc-mini-select-all"
                    onClick={handleToggleAllCircuits}
                    title={fCircuits.length > 0 ? "Clear circuits" : "Select all circuits"}
                  >
                    {fCircuits.length > 0 ? "Clear" : "All"}
                  </button>
                </div>

                {openSections.circuits && (
                  <div className="cc-accordion-content">
                    <div className="cc-checkbox-list">
                      {CIRCUITS.map((circ) => {
                        const isChecked = fCircuits.includes(circ);
                        const count = countIn(p => p.comp.circuit === circ, 'circuits');
                        return (
                          <label key={circ} className="cc-filter-checkbox-row">
                            <input
                              type="checkbox"
                              className="cc-filter-checkbox-input"
                              checked={isChecked}
                              onChange={() => setFCircuits(isChecked ? fCircuits.filter(x => x !== circ) : [...fCircuits, circ])}
                            />
                            <span className="cc-custom-checkbox">
                              {isChecked && <CheckIcon size={10} />}
                            </span>
                            <span className="cc-checkbox-label-text">{circ}</span>
                            <span className="cc-filter-num">({count})</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Subgroup 4: Skills Needed */}
              <div className="cc-filter-subgroup">
                <div className="cc-subgroup-header-row">
                  <button
                    type="button"
                    className={`cc-accordion-header ${openSections.skills ? 'open' : ''}`}
                    onClick={() => toggleSection('skills')}
                    aria-expanded={openSections.skills}
                  >
                    <div className="cc-accordion-header-left">
                      <ChevronIcon open={openSections.skills} size={13} className="cc-accordion-chevron" />
                      <span className="cc-accordion-title">Skills needed</span>
                    </div>
                    {fSkills.length > 0 && (
                      <span className="cc-active-count-badge">{fSkills.length}</span>
                    )}
                  </button>
                  <button
                    type="button"
                    className="cc-mini-select-all"
                    onClick={handleToggleAllSkills}
                    title={fSkills.length > 0 ? "Clear skills" : "Select all skills"}
                  >
                    {fSkills.length > 0 ? "Clear" : "All"}
                  </button>
                </div>

                {openSections.skills && (
                  <div className="cc-accordion-content">
                    <div className="cc-checkbox-list">
                      {(skillsOpen ? SKILLS : SKILLS.slice(0, 5)).map((sk) => {
                        const isChecked = fSkills.includes(sk);
                        const count = countIn(p => p.want.includes(sk), 'skills');
                        return (
                          <label key={sk} className="cc-filter-checkbox-row">
                            <input
                              type="checkbox"
                              className="cc-filter-checkbox-input"
                              checked={isChecked}
                              onChange={() => setFSkills(isChecked ? fSkills.filter(x => x !== sk) : [...fSkills, sk])}
                            />
                            <span className="cc-custom-checkbox">
                              {isChecked && <CheckIcon size={10} />}
                            </span>
                            <span className="cc-checkbox-label-text">{sk}</span>
                            <span className="cc-filter-num">({count})</span>
                          </label>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setSkillsOpen(!skillsOpen)}
                        className="cc-mini-select-all"
                        style={{ alignSelf: 'flex-start', marginTop: 2, padding: '2px 4px', fontSize: '0.72rem', color: 'var(--primary, #0F3FFE)' }}
                      >
                        {skillsOpen ? 'Show fewer' : `+ Show ${SKILLS.length - 5} more`}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Subgroup 5: Open spots */}
              <div className="cc-filter-subgroup cc-segmented-subgroup">
                <span className="cc-subgroup-label">OPEN SPOTS</span>
                <div className="cc-segmented-bar">
                  {[
                    ['any', 'Any'],
                    ['1', '1 left'],
                    ['2', '2+']
                  ].map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      className={`cc-seg-btn ${fSpots === val ? 'active' : ''}`}
                      onClick={() => setFSpots(val)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subgroup 6: Competition Closes */}
              <div className="cc-filter-subgroup cc-segmented-subgroup">
                <span className="cc-subgroup-label">COMPETITION CLOSES</span>
                <div className="cc-segmented-bar">
                  {[
                    ['any', 'Any'],
                    ['week', 'This week'],
                    ['month', 'This month']
                  ].map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      className={`cc-seg-btn ${fCloses === val ? 'active' : ''}`}
                      onClick={() => setFCloses(val)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sidebar bottom indicator */}
              <div className="tf-sidebar-footer-count">
                Show {totalCardsShown} Squad{totalCardsShown === 1 ? '' : 's'}
              </div>

            </div>

            {/* Mobile Drawer Bottom Apply CTA */}
            <div className="tf-mobile-filter-footer">
              <button
                type="button"
                className="tf-mobile-filter-apply-btn"
                onClick={() => setIsMobileFiltersOpen(false)}
              >
                Show {totalCardsShown} Squad{totalCardsShown === 1 ? '' : 's'}
              </button>
            </div>
          </aside>

          {/* Backdrop for mobile drawer */}
          {isMobileFiltersOpen && (
            <div
              className="cc-filter-backdrop"
              onClick={() => setIsMobileFiltersOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* ── Results Column (Right) ── */}
          <main className="tf-results-col">

            {/* Toolbar */}
            <div className="tf-toolbar">
              {/* Segmented Tabs */}
              <div className="tf-tabs-segmented">
                <button
                  type="button"
                  onClick={() => setTab('other')}
                  className={`tf-tab-btn ${tab === 'other' ? 'active' : ''}`}
                >
                  <span>Other listings</span>
                  <span className="tf-tab-pill">{otherPool.length}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab('mine')}
                  className={`tf-tab-btn ${tab === 'mine' ? 'active' : ''}`}
                >
                  <span>My listings</span>
                  <span className="tf-tab-pill">{myTotalPool.length}</span>
                </button>
              </div>

              {/* Search Bar */}
              <label className="tf-search-wrapper">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search competitions, leads or skills"
                  className="tf-search-input"
                />
              </label>

              {/* Mobile Filter Trigger Button */}
              <button
                type="button"
                className={`tf-mobile-filter-trigger ${filterCount > 0 ? 'active' : ''}`}
                onClick={() => setIsMobileFiltersOpen(true)}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
                <span>Filters</span>
                {filterCount > 0 && (
                  <span className="tf-filter-badge-count">{filterCount}</span>
                )}
              </button>

              {/* Sort Selector */}
              <div className="tf-sort-box">
                <ArrowUpDownIcon size={13} className="tf-sort-icon" />
                <label htmlFor="tf-sort-select" className="tf-sort-label">Sort:</label>
                <div className="tf-sort-select-wrapper">
                  <select
                    id="tf-sort-select"
                    className="tf-sort-select"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option value="newest">Newest</option>
                    <option value="match">Best skill match</option>
                    <option value="closing">Closing soonest</option>
                    <option value="closing-latest">Closing latest</option>
                    <option value="spots">Most spots open</option>
                    <option value="almost-full">Almost full (1 left)</option>
                    <option value="title-asc">Competition: A → Z</option>
                  </select>
                  <ChevronDownIcon size={11} className="tf-sort-chevron" />
                </div>
              </div>
            </div>


            {/* Status Row + Removable Active Chips */}
            <div className="tf-status-row">
              <span className="tf-status-dot"></span>
              <span className="tf-status-text">
                {tab === 'other'
                  ? `Showing ${totalCardsShown} squad${totalCardsShown === 1 ? '' : 's'} looking for teammates`
                  : `${totalCardsShown} listing${totalCardsShown === 1 ? '' : 's'} you lead or applied to`}
              </span>
              {activeChips.map((c, idx) => (
                <button key={idx} type="button" onClick={c.remove} className="tf-filter-chip">
                  <span>{c.label}</span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              ))}
            </div>

            {/* Squads Loading Screen */}
            {showSquadLoader ? (
              <SectionLoadingWidget
                headline="Scouting collegiate squads across campuses..."
                subtitle="Matching complementary skillsets and zero-ghosting teammates"
                customPuns={SQUAD_PUNS}
                minDurationMs={1500}
                maxDurationMs={1500}
                isReady={true}
                onComplete={() => setShowSquadLoader(false)}
              />
            ) : (
              <>
                {/* Empty State */}
                {displayedSections.length === 0 && (
                  <div className="tf-empty-state">
                <h3 className="tf-empty-title">
                  {tab === 'mine' && filterCount === 0 ? 'Nothing here yet' : 'No squads match these filters'}
                </h3>
                <p className="tf-empty-text">
                  {tab === 'mine' && filterCount === 0
                    ? 'Squads you post, and squads you request to join, show up here.'
                    : 'Clear a filter, or post your own squad and let applicants come to you.'}
                </p>
                <div className="tf-empty-actions">
                  {filterCount > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="tf-btn-secondary"
                    >
                      Clear filters
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenPostSquad) onOpenPostSquad(null);
                      else {
                        setEditingPostData(null);
                        setPostModalOpen(true);
                      }
                    }}
                    className="tf-post-btn"
                  >
                    Post a squad
                  </button>
                </div>
              </div>
            )}

            {/* Squads Grid by Sections */}
            {displayedSections.map((sec, secIdx) => (
              <section key={secIdx} className="tf-section">
                {sec.hasTitle && (
                  <div className="tf-section-header">
                    <h2 className="tf-section-title">{sec.title}</h2>
                    <span className="tf-section-count-pill">{sec.count}</span>
                  </div>
                )}

                <div className="tf-grid">
                  {sec.cards.map((post) => {
                    const isOwn = post.isOwn;
                    const catColor = CAT_COLORS[post.comp.cat] || '#75736C';
                    const hasFit = !isOwn && post.match > 0;
                    const pendingAppsCount = post.apps.filter(a => a.status === 'pending').length;

                    return (
                      <article
                        key={post.id}
                        onClick={() => {
                          if (isOwn) {
                            setReviewPostId(post.id);
                            setReviewTab(pendingAppsCount > 0 ? 'pending' : 'accepted');
                          } else {
                            setDetailPostId(post.id);
                          }
                        }}
                        className="tf-card"
                      >
                        {/* 1. Meta Row */}
                        <div className="tf-card-meta-row">
                          <div className="tf-card-tags-left">
                            <span className="tf-cat-tag">
                              <span className="tf-cat-square" style={{ background: catColor }}></span>
                              {post.comp.cat}
                            </span>
                            <span className="tf-circuit-tag">{post.comp.circuit}</span>
                          </div>

                          <span
                            className="tf-deadline-badge"
                            style={{
                              color: post.comp.dueColor,
                              backgroundColor: post.comp.dueBg,
                              borderColor: post.comp.dueBorder
                            }}
                          >
                            <span className="tf-deadline-dot" style={{ backgroundColor: post.comp.dueColor }} />
                            {post.comp.dueText}
                          </span>
                        </div>

                        {/* 2. Logo, Title & Host */}
                        <div className="tf-card-header-inner">
                          <div className="tf-comp-logo-wrap">
                            <InstitutionLogo
                              organizer={post.comp.host}
                              title={post.comp.title}
                              logoUrl={post.comp.logo}
                              size={40}
                            />
                          </div>
                          <div className="tf-card-title-meta">
                            <h3 className="tf-card-title" title={post.comp.title}>{post.comp.title}</h3>
                            <div className="tf-card-host-name" title={post.comp.host}>{post.comp.host}</div>
                          </div>
                        </div>

                        {/* 3. Lead's Note */}
                        {post.desc && (
                          <p className="tf-card-note">{post.desc}</p>
                        )}

                        {/* 4. Skills Needed row (ABOVE spots) */}
                        <div className="tf-card-skills-row">
                          <div className="tf-skills-wrap">
                            {post.want && post.want.length > 0 ? (
                              <>
                                {post.want.slice(0, 2).map((w, idx) => {
                                  const isUserSkill = profileSkills.includes(w);
                                  return isUserSkill ? (
                                    <span key={idx} className="tf-skill-pill tf-skill-pill-fit">
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                      </svg>
                                      {w}
                                    </span>
                                  ) : (
                                    <span key={idx} className="tf-skill-pill tf-skill-pill-needed">
                                      {w}
                                    </span>
                                  );
                                })}
                                {post.want.length > 2 && (
                                  <span className="tf-skill-pill-more">
                                    +{post.want.length - 2}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="tf-skill-pill-welcome">
                                All skills welcome
                              </span>
                            )}
                          </div>

                          {hasFit && (
                            <span className="tf-fit-hint">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                              You fit
                            </span>
                          )}
                        </div>

                        {/* 5. Spots row (BELOW skills) */}
                        <div className="tf-card-spots-row">
                          <div className="tf-card-spots-indicator">
                            <div className="tf-dots-cluster">
                              {Array.from({ length: post.total }, (_, i) => (
                                <span
                                  key={i}
                                  className={`tf-dot ${i < post.filled ? 'filled' : 'hollow'}`}
                                />
                              ))}
                            </div>
                            <span
                              className="tf-spots-text"
                              style={{ color: post.openN > 0 ? 'var(--ink, #1A1A19)' : 'var(--ink-muted, #75736C)' }}
                            >
                              {post.openN > 0 ? `${post.openN} of ${post.total} open` : (post.total ? `${post.total} of ${post.total} filled` : 'Full')}
                            </span>
                          </div>
                        </div>

                        {/* 6. Footer */}
                        <div className="tf-card-footer">
                          {/* Lead info row with avatar, name, and Chat button */}
                          <div className="tf-lead-info-row">
                            <div className="tf-lead-left">
                              <span className={`tf-lead-avatar ${isOwn ? 'own' : 'other'}`}>
                                {isOwn ? 'You' : initialsOf(post.lead)}
                              </span>
                              <div className="tf-lead-details">
                                <div className="tf-lead-name">{isOwn ? 'You' : post.lead}</div>
                                <div className="tf-lead-meta">{post.college} · {post.year}</div>
                              </div>
                            </div>

                            {/* Right side of lead row */}
                            {isOwn ? (
                              pendingAppsCount > 0 ? (
                                <span className="tf-badge tf-badge-pending-count">{pendingAppsCount} new</span>
                              ) : (
                                <span className="tf-posted-time">{post.posted}</span>
                              )
                            ) : post.state === 'requested' ? (
                              <span className="tf-badge tf-badge-requested">Requested</span>
                            ) : post.state === 'accepted' ? (
                              <span className="tf-badge tf-badge-accepted">You're in</span>
                            ) : post.state === 'full' || post.openN === 0 ? (
                              <span className="tf-badge tf-badge-full">Full</span>
                            ) : post.state === 'closed' ? (
                              <span className="tf-badge tf-badge-closed">Closed</span>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (post.comm_method === 'whatsapp') {
                                    handleOpenWhatsAppPost(e, post);
                                  } else {
                                    setChatModalPost(post);
                                  }
                                }}
                                className={`tf-chat-btn ${post.comm_method === 'whatsapp' ? 'tf-chat-wa' : 'tf-chat-inapp'}`}
                                title={post.comm_method === 'whatsapp' ? "Chat on WhatsApp" : "In-app Chat"}
                              >
                                {post.comm_method === 'whatsapp' ? (
                                  <WhatsAppIcon size={14} />
                                ) : (
                                  <ChatBubbleIcon size={14} />
                                )}
                                <span>Chat</span>
                              </button>
                            )}
                          </div>

                          {/* 7. Full-width Action CTA */}
                          <div className="tf-actions-row">
                            {isOwn ? (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setReviewPostId(post.id);
                                    setReviewTab(pendingAppsCount > 0 ? 'pending' : 'accepted');
                                  }}
                                  className="tf-join-btn"
                                  style={{
                                    border: pendingAppsCount > 0 ? '1px solid var(--primary, #0F3FFE)' : '1px solid var(--line, #E7E6E2)',
                                    background: pendingAppsCount > 0 ? 'var(--primary, #0F3FFE)' : 'var(--surface, #FFFFFF)',
                                    color: pendingAppsCount > 0 ? '#FFFFFF' : 'var(--ink, #1A1A19)'
                                  }}
                                >
                                  {pendingAppsCount > 0 ? `Review ${pendingAppsCount} request${pendingAppsCount > 1 ? 's' : ''}` : 'Manage team'}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenEdit(e, post)}
                                  className="tf-btn-secondary"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleClosed(e, post)}
                                  className="tf-btn-secondary"
                                  style={{ color: 'var(--ink-secondary, #55534D)' }}
                                >
                                  {post.state === 'closed' || post.closed ? 'Reopen' : 'Close'}
                                </button>
                              </>
                            ) : post.state === 'full' || post.openN === 0 ? (
                              <button type="button" disabled className="tf-full-btn">
                                Squad full
                              </button>
                            ) : post.state === 'requested' ? (
                              <button
                                type="button"
                                onClick={(e) => handleWithdraw(e, post)}
                                className="tf-withdraw-btn"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                Requested · Withdraw
                              </button>
                            ) : post.state === 'accepted' ? (
                              <button
                                type="button"
                                onClick={(e) => handleOpenWhatsAppPost(e, post)}
                                className="tf-wa-accepted-btn"
                              >
                                Message {post.lead.split(' ')[0]} on WhatsApp
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => handleRequestJoin(e, post)}
                                className="tf-join-btn"
                              >
                                Request to join
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
              </>
            )}

          </main>
        </div>

        {/* Floating Post a squad button (Mobile) */}
        <button
          type="button"
          className="tf-floating-post-btn"
          onClick={() => {
            if (onOpenPostSquad) onOpenPostSquad(null);
            else {
              setEditingPostData(null);
              setPostModalOpen(true);
            }
          }}
          aria-label="Post a squad"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"></path>
            <path d="M12 5v14"></path>
          </svg>
          Post a squad
        </button>

      </div>

      {/* ── Slide-Over Squad Detail Sheet (Right Side) ── */}
      {detailTarget && (
        <div className="tf-detail-sheet-wrap">
          <div className="tf-backdrop" onClick={() => setDetailPostId(null)} />
          <div className="tf-detail-sheet">
            <div className="tf-sheet-header">
              <span className="tf-sheet-posted">Squad · posted {detailTarget.posted}</span>
              <button
                type="button"
                onClick={() => setDetailPostId(null)}
                aria-label="Close"
                className="tf-sheet-close-btn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="tf-sheet-body">
              {/* Competition header */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '44px minmax(0, 1fr)', gap: '12px', alignItems: 'start' }}>
                  <InstitutionLogo
                    organizer={detailTarget.comp.host}
                    title={detailTarget.comp.title}
                    logoUrl={detailTarget.comp.logo}
                    size={44}
                  />
                  <div style={{ minWidth: 0 }}>
                    <h2 style={{ margin: 0, fontSize: '19px', fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.015em', textWrap: 'pretty', color: 'var(--ink, #1A1A19)' }}>
                      {detailTarget.comp.title}
                    </h2>
                    <div style={{ marginTop: '3px', fontSize: '13px', color: 'var(--ink-secondary, #55534D)' }}>
                      {detailTarget.comp.host}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--ink-secondary, #55534D)' }}>
                  <span>{detailTarget.comp.cat}</span>
                  <span style={{ color: 'var(--divider-dot, #C9C7C1)' }}>·</span>
                  <span>Teams of {detailTarget.total}</span>
                  <span style={{ color: 'var(--divider-dot, #C9C7C1)' }}>·</span>
                  <span style={{ fontWeight: 600, color: detailTarget.comp.dueColor }}>{detailTarget.comp.dueText}</span>
                  <a
                    href={detailTarget.comp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: 'var(--primary, #0F3FFE)', textDecoration: 'none' }}
                  >
                    View on Unstop
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                  </a>
                </div>
              </div>

              {/* From the lead */}
              {detailTarget.desc && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span className="tf-section-label-caps">From the lead</span>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.55, color: 'var(--ink, #1A1A19)', textWrap: 'pretty' }}>
                    {detailTarget.desc}
                  </p>
                </div>
              )}

              {/* Team roster */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span className="tf-section-label-caps">Team</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink, #1A1A19)' }}>
                    {detailTarget.openN > 0 ? `${detailTarget.openN} of ${detailTarget.total} open` : 'Full'}
                  </span>
                </div>

                <div className="tf-roster-list">
                  {/* Lead Row */}
                  <div className="tf-roster-row" style={{ background: 'var(--surface, #FFFFFF)' }}>
                    <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary, #0F3FFE)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flex: 'none' }}>
                      {initialsOf(detailTarget.lead)}
                    </span>
                    <div style={{ minWidth: 0, flex: 1, lineHeight: 1.3 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink, #1A1A19)' }}>
                        {detailTarget.lead}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--ink-muted, #75736C)' }}>
                        {detailTarget.college} · {detailTarget.year}
                      </div>
                    </div>
                    <span style={{ background: 'var(--surface-muted, #F2F1ED)', color: 'var(--ink-secondary, #55534D)', borderRadius: '6px', padding: '2px 7px', fontSize: '11px', fontWeight: 600 }}>
                      Lead
                    </span>
                  </div>

                  {/* Accepted Members */}
                  {detailTarget.members.map((m, idx) => (
                    <div key={idx} className="tf-roster-row" style={{ borderTop: '1px solid var(--line-light, #F0EFEB)', background: 'var(--surface, #FFFFFF)' }}>
                      <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: m.name === userName ? 'var(--success, #17A34A)' : 'var(--line, #E7E6E2)', color: m.name === userName ? '#FFFFFF' : 'var(--ink-secondary, #55534D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flex: 'none' }}>
                        {initialsOf(m.name)}
                      </span>
                      <div style={{ minWidth: 0, flex: 1, lineHeight: 1.3 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink, #1A1A19)' }}>
                          {m.name === userName ? 'You' : m.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--ink-muted, #75736C)' }}>
                          {m.college} · {m.year}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Open Slots */}
                  {Array.from({ length: detailTarget.openN }).map((_, idx) => (
                    <div key={idx} className="tf-roster-row" style={{ borderTop: '1px solid var(--line-light, #F0EFEB)', background: 'var(--surface-sunken, #F9F9F7)' }}>
                      <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface, #FFFFFF)', color: 'var(--ink-muted, #75736C)', border: '1.5px dashed var(--checkbox-border, #CFCDC7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flex: 'none' }} />
                      <div style={{ minWidth: 0, flex: 1, lineHeight: 1.3 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-muted, #75736C)' }}>
                          Open spot
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--ink-muted, #75736C)' }}>
                          Could be you
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Looking for */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span className="tf-section-label-caps">Looking for</span>
                  {detailTarget.match > 0 && (
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--success-text, #15803D)' }}>
                      {detailTarget.match === detailTarget.want.length ? 'You have all of these' : `You have ${detailTarget.match} of ${detailTarget.want.length}`}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {detailTarget.want.length > 0 ? (
                    detailTarget.want.map((w, idx) => (
                      <span key={idx} className="tf-skill-pill-needed" style={{ padding: '4px 9px' }}>
                        {w}
                      </span>
                    ))
                  ) : (
                    <span className="tf-skill-pill-welcome" style={{ padding: '4px 9px' }}>
                      All skills welcome
                    </span>
                  )}
                </div>
              </div>

              {/* Lead brings */}
              {detailTarget.have && detailTarget.have.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span className="tf-section-label-caps">{detailTarget.lead.split(' ')[0]} brings</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {detailTarget.have.map((h, idx) => (
                      <span key={idx} style={{ background: 'var(--surface, #FFFFFF)', color: 'var(--ink-secondary, #55534D)', border: '1px solid var(--line, #E7E6E2)', borderRadius: '6px', padding: '4px 9px', fontSize: '12px', fontWeight: 500 }}>
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom sticky action bar */}
            <div className="tf-sheet-footer">
              {detailTarget.state === 'open' && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      handleRequestJoin(e, detailTarget);
                      setDetailPostId(null);
                    }}
                    className="tf-join-btn"
                    style={{ width: '100%', padding: '11px 14px', fontSize: '14px' }}
                  >
                    Request to join
                  </button>
                  <span style={{ fontSize: '12px', color: 'var(--ink-muted, #75736C)', textAlign: 'center' }}>
                    {detailTarget.lead.split(' ')[0]} sees your profile and a short note. Your number is shared only if you're accepted.
                  </span>
                </>
              )}

              {detailTarget.state === 'requested' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', background: 'var(--surface-sunken, #F9F9F7)', border: '1px solid var(--line, #E7E6E2)', borderRadius: '9px', padding: '10px 12px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: 'var(--ink-secondary, #55534D)' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    Request sent. Waiting on {detailTarget.lead.split(' ')[0]}.
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      handleWithdraw(e, detailTarget);
                      setDetailPostId(null);
                    }}
                    style={{ color: 'var(--ink-muted, #75736C)', fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Withdraw
                  </button>
                </div>
              )}

              {detailTarget.state === 'accepted' && (
                <>
                  <button
                    type="button"
                    onClick={(e) => handleOpenWhatsAppPost(e, detailTarget)}
                    className="tf-wa-accepted-btn"
                    style={{ width: '100%', padding: '11px 14px', fontSize: '14px' }}
                  >
                    Message {detailTarget.lead.split(' ')[0]} on WhatsApp
                  </button>
                  <span style={{ fontSize: '12px', color: 'var(--ink-muted, #75736C)', textAlign: 'center' }}>
                    You're on the team. The rest of the squad can see your number.
                  </span>
                </>
              )}

              {detailTarget.state === 'full' && (
                <div className="tf-full-block">
                  This squad is full. Look for another team or post your own.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Review Requests Modal (Own Listing) ── */}
      {reviewTarget && (
        <div className="tf-modal-center-wrap">
          <div className="tf-backdrop" onClick={() => setReviewPostId(null)} />
          <div className="tf-modal-card">
            {/* Header */}
            <div className="tf-review-header">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ minWidth: 0 }}>
                  <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--ink, #1A1A19)' }}>
                    {reviewTarget.comp.title}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                    {/* Overlapping member circles */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--primary, #0F3FFE)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, boxShadow: '0 0 0 2px var(--surface, #FFFFFF)', flex: 'none' }}>
                        {initialsOf(userName)}
                      </span>
                      {reviewTarget.members.map((m, i) => (
                        <span key={i} style={{ width: '22px', height: '22px', borderRadius: '50%', marginLeft: '-5px', background: 'var(--line, #E7E6E2)', color: 'var(--ink-secondary, #55534D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, boxShadow: '0 0 0 2px var(--surface, #FFFFFF)', flex: 'none' }}>
                          {initialsOf(m.name)}
                        </span>
                      ))}
                      {Array.from({ length: reviewTarget.openN }).map((_, i) => (
                        <span key={i} style={{ width: '22px', height: '22px', borderRadius: '50%', marginLeft: '-5px', background: 'var(--surface, #FFFFFF)', border: '1.5px dashed var(--checkbox-border, #CFCDC7)', boxShadow: '0 0 0 2px var(--surface, #FFFFFF)', flex: 'none' }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--ink-secondary, #55534D)' }}>
                      {reviewTarget.openN} of {reviewTarget.total} spots open
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setReviewPostId(null)}
                  className="tf-sheet-close-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* Underline Tabs */}
              <div className="tf-underline-tabs">
                {[
                  ['pending', 'Pending'],
                  ['accepted', 'Accepted'],
                  ['declined', 'Declined']
                ].map(([id, label]) => {
                  const count = reviewTarget.apps.filter(a => a.status === id).length;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setReviewTab(id)}
                      className={`tf-underline-tab-btn ${reviewTab === id ? 'active' : ''}`}
                    >
                      <span>{label}</span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-muted, #75736C)' }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Body */}
            <div className="tf-review-body">
              {reviewTarget.apps.filter(a => a.status === reviewTab).length === 0 ? (
                <div style={{ padding: '36px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--ink, #1A1A19)' }}>
                    {reviewTab === 'pending'
                      ? 'No pending requests'
                      : reviewTab === 'accepted'
                      ? 'Nobody accepted yet'
                      : 'Nothing declined'}
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink-muted, #75736C)' }}>
                    {reviewTab === 'pending'
                      ? 'New requests show up here.'
                      : reviewTab === 'accepted'
                      ? 'Accept a request to add them to the team.'
                      : 'Requests you decline stay here in case you change your mind.'}
                  </p>
                </div>
              ) : (
                reviewTarget.apps
                  .filter(a => a.status === reviewTab)
                  .map((app) => {
                    const matchCount = app.skills.filter(s => reviewTarget.want.includes(s)).length;
                    return (
                      <div key={app.id} className="tf-applicant-card">
                        {/* Info row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                          <span style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--surface-muted, #F2F1ED)', color: 'var(--ink-secondary, #55534D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flex: 'none' }}>
                            {initialsOf(app.name)}
                          </span>
                          <div style={{ minWidth: 0, flex: 1, lineHeight: 1.3 }}>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink, #1A1A19)' }}>
                              {app.name}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--ink-muted, #75736C)' }}>
                              {app.college} · {app.year}
                            </div>
                          </div>
                          {matchCount > 0 && (
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--success-text, #15803D)', whiteSpace: 'nowrap' }}>
                              Has {matchCount} of {reviewTarget.want.length} you need
                            </span>
                          )}
                        </div>

                        {/* Pitch box */}
                        {app.pitch && (
                          <p className="tf-pitch-box">"{app.pitch}"</p>
                        )}

                        {/* Skills chips */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                          {app.skills.map((sk, idx) => {
                            const isHit = reviewTarget.want.includes(sk);
                            return (
                              <span
                                key={idx}
                                style={{
                                  background: isHit ? 'var(--success-tint, rgba(23,163,74,0.08))' : 'var(--surface-muted, #F2F1ED)',
                                  color: isHit ? 'var(--success-text, #15803D)' : 'var(--ink-secondary, #55534D)',
                                  border: isHit ? '1px solid var(--success-border, rgba(23,163,74,0.30))' : '1px solid var(--surface-muted, #F2F1ED)',
                                  borderRadius: '6px',
                                  padding: '3px 8px',
                                  fontSize: '12px',
                                  fontWeight: 500
                                }}
                              >
                                {sk}
                              </span>
                            );
                          })}
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {app.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleAcceptApplicant(app.id)}
                                style={{
                                  border: '1px solid var(--primary, #0F3FFE)',
                                  borderRadius: '9px',
                                  background: 'var(--primary, #0F3FFE)',
                                  color: '#FFFFFF',
                                  padding: '8px 16px',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeclineApplicant(app.id)}
                                className="tf-btn-secondary"
                                style={{ padding: '8px 14px' }}
                              >
                                Decline
                              </button>
                            </>
                          )}

                          {app.status === 'accepted' && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  const leadFirst = userName.split(' ')[0];
                                  const msg = `Hey ${app.name.split(' ')[0]}! Welcoming you to our squad for "${reviewTarget.comp.title}". Connecting!`;
                                  const url = formatWhatsAppUrl(app.phone || '9876543210', msg);
                                  if (url && url !== '#') window.open(url, '_blank', 'noopener,noreferrer');
                                  else alert('No WhatsApp number available for this applicant.');
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  border: '1px solid var(--success-border, rgba(23, 163, 74, 0.30))',
                                  borderRadius: '9px',
                                  background: 'var(--success-tint, rgba(23, 163, 74, 0.08))',
                                  color: 'var(--success-text, #15803D)',
                                  padding: '7px 12px',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="#25D366">
                                  <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.276-.101-.477-.15-.678.15-.201.3-.778.978-.954 1.179-.176.2-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.896-.799-1.501-1.786-1.677-2.087-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.201-.3.301-.501.101-.2.05-.376-.025-.526-.075-.15-.678-1.635-.929-2.239-.245-.588-.493-.508-.678-.518l-.578-.01c-.2 0-.527.075-.803.376-.276.301-1.054 1.03-1.054 2.512s1.079 2.913 1.23 3.114c.15.201 2.124 3.243 5.145 4.549.719.31 1.281.496 1.719.635.722.23 1.379.197 1.9.12.58-.087 1.78-.727 2.03-1.43.251-.703.251-1.305.176-1.43-.075-.126-.276-.201-.577-.352z"></path>
                                  <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.982-1.396A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.167c-1.614 0-3.12-.486-4.383-1.323l-.314-.207-2.955.828.84-2.88-.204-.325A8.134 8.134 0 0 1 3.833 12c0-4.503 3.664-8.167 8.167-8.167s8.167 3.664 8.167 8.167-3.664 8.167-8.167 8.167z"></path>
                                </svg>
                                WhatsApp
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveApplicant(app.id)}
                                style={{ marginLeft: 'auto', color: 'var(--ink-muted, #75736C)', fontSize: '13px', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
                              >
                                Remove from squad
                              </button>
                            </>
                          )}

                          {app.status === 'declined' && (
                            <button
                              type="button"
                              onClick={() => handleUndoDecline(app.id)}
                              style={{ color: 'var(--ink-muted, #75736C)', fontSize: '13px', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                              Move back to pending
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Post Squad / Edit Squad Modal ── */}
      <PostSquadModal
        isOpen={postModalOpen}
        onClose={() => {
          setPostModalOpen(false);
          setEditingPostData(null);
        }}
        competitions={competitions.length > 0 ? competitions : SAMPLE_COMPS}
        editingPost={editingPostData}
        profile={profile}
        onSubmitPost={(draft) => {
          if (onSubmitPost) {
            onSubmitPost(draft);
          } else {
            // Local fallback
            if (draft.isEdit && draft.postId) {
              setLocalOwnState(prev => prev.map(o => o.id === draft.postId ? { ...o, compId: draft.compId, total: draft.total_members, want: draft.skills_looking_for, have: draft.skills_have, desc: draft.desc } : o));
            } else {
              const newOwn = {
                id: 'own_' + Date.now(),
                compId: draft.compId,
                posted: 'just now',
                total: draft.total_members,
                closed: false,
                want: draft.skills_looking_for || [],
                have: draft.skills_have || [],
                desc: draft.desc,
                phone: draft.phone_number,
                apps: []
              };
              setLocalOwnState(prev => [newOwn, ...prev]);
            }
          }
          handlePostSuccess();
        }}
        onSuccess={handlePostSuccess}
      />

      {/* ── Request to Join Modal (ApplyModal) ── */}
      <ApplyModal
        isOpen={applyModalOpen}
        onClose={() => {
          setApplyModalOpen(false);
          setApplyTargetPost(null);
        }}
        post={applyTargetPost}
        competition={applyTargetPost?.comp || (applyTargetPost ? competitions.find(c => String(c.id) === String(applyTargetPost.compId)) : null)}
        profile={profile}
        onSubmitApply={(targetPost, pitch, highlightedSkills, applicantPhone) => {
          setLocalPostsState(prev => prev.map(p => p.id === targetPost.id ? { ...p, state: 'requested' } : p));
          setApplyModalOpen(false);
          setApplyTargetPost(null);
          if (showToast) showToast(`Request sent to ${targetPost.lead.split(' ')[0]}`);
        }}
      />

      {/* ── In-App Chat Modal ── */}
      {chatModalPost && (
        <CompetitionChatModal
          isOpen={Boolean(chatModalPost)}
          onClose={() => setChatModalPost(null)}
          application={activeChatApp}
          post={chatModalPost.rawPost || chatModalPost}
          competition={chatModalPost.comp}
          currentUser={user}
          profile={profile}
        />
      )}

    </div>
  );
}
