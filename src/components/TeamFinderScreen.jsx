// src/components/TeamFinderScreen.jsx
// Complete SSCBS OS Team Finder Engine — Generalized for ALL Colleges & Universities
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SKILLS, DISCIPLINES, initialsOf, isMockPost } from '../data/initialData';
import { formatWhatsAppUrl, sanitizeIndianPhone } from '../context/AuthContext';
import { normalizeYear } from '../data/colleges';

const POPULAR_COLLEGE_FILTERS = [
  'SSCBS',
  'SRCC',
  'IIT Delhi',
  'BITS Pilani',
  'IIM',
  'DTU',
  'Hindu College',
  'St. Stephen’s',
  'LSR',
  'Hansraj',
  'Christ University',
  'NMIMS'
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
  onRemoveApp
}) {
  const [tq, setTq] = useState('');
  const [tScope, setTScope] = useState('all'); // 'all' | 'open' | 'mine' | 'match'
  const [tSkills, setTSkills] = useState([]);
  const [tDisc, setTDisc] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState('all'); // 'all' | 'my' | specific name

  // Active review modal & admin dropdown
  const [reviewModalPostId, setReviewModalPostId] = useState(null);
  const [activeMenuPostId, setActiveMenuPostId] = useState(null);
  const [deleteConfirmPostId, setDeleteConfirmPostId] = useState(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuPostId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const profileSkills = profile?.skills || [];
  const userCollege = (profile?.college || user?.user_metadata?.college || '').trim();

  // Normalize squad posts
  const cleanPosts = posts.filter(p => !isMockPost(p));

  const normalizedPosts = useMemo(() => {
    return cleanPosts.map((p) => {
      const comp = competitions.find(
        c => String(c.id) === String(p.compId) ||
        (p.competition_name && c.title && c.title.toLowerCase() === p.competition_name.toLowerCase())
      ) || null;

      const title = p.competition_name || comp?.title || p.title || 'Competition';
      const host = p.organizer || comp?.host || comp?.orgName || 'Host Institution';
      const logo = comp?.logo || comp?.orgLogo || null;
      const desc = p.description || p.desc || '';
      const want = Array.isArray(p.skills_looking_for) ? p.skills_looking_for : (Array.isArray(p.want) ? p.want : []);
      const have = Array.isArray(p.skills_have) ? p.skills_have : [];

      const acceptedList = Array.isArray(p.accepted_emails) ? p.accepted_emails : [];
      const spotsLeft = p.spots_left !== undefined ? Number(p.spots_left) : Math.max(0, (p.total_members || p.size || 4) - 1);
      const totalMembers = Number(p.total_members || p.size || (spotsLeft + 1));
      const filledCount = Math.max(1, totalMembers - spotsLeft);

      const lead = p.created_by_name || p.lead || 'Student Lead';
      const postCollege = (p.college || '').trim();
      const postYear = normalizeYear(p.year);

      const isMine = Boolean(
        p.mine ||
        (user && p.user_id && p.user_id === user.id) ||
        (user && p.created_by_email && p.created_by_email.toLowerCase() === (user.email || '').toLowerCase()) ||
        (profile?.name && lead.toLowerCase() === profile.name.toLowerCase())
      );

      const discipline = comp?.discipline || 'Case';
      const isOpen = p.is_open !== false && spotsLeft > 0;

      // Applications linked to this post
      const postApps = applications.filter(a => String(a.postId || a.post_id) === String(p.id));
      const pendingAppsCount = postApps.filter(a => a.status === 'pending').length;

      // Current user's application
      const myApp = applications.find(a =>
        String(a.postId || a.post_id) === String(p.id) &&
        (a.dir === 'out' || (user && a.applicant_id === user.id) || (user && a.applicant_email === user.email))
      );

      let postState = 'open';
      if (isMine) {
        postState = 'own';
      } else if (myApp) {
        postState = myApp.status === 'accepted' ? 'accepted' : (myApp.status === 'declined' || myApp.status === 'rejected' ? 'declined' : 'requested');
      } else if (!isOpen || spotsLeft <= 0) {
        postState = 'full';
      }

      return {
        ...p,
        displayTitle: title,
        displayHost: host,
        displayLogo: logo,
        displayDesc: desc,
        displaySkills: want,
        displaySkillsHave: have,
        displaySpotsLeft: spotsLeft,
        displayTotalMembers: totalMembers,
        displayFilledCount: filledCount,
        displayLead: lead,
        displayCollege: postCollege,
        displayYear: postYear,
        isMine,
        isOpen,
        state: postState,
        discipline,
        rawComp: comp,
        postApps,
        pendingAppsCount,
        myApp
      };
    });
  }, [cleanPosts, competitions, applications, user, profile]);

  // Filtering
  const visiblePosts = useMemo(() => {
    return normalizedPosts.filter((p) => {
      // Scope filter
      if (tScope === 'mine' && !p.isMine) return false;
      if (tScope === 'open' && (p.isMine || !p.isOpen || p.displaySpotsLeft <= 0)) return false;
      if (tScope === 'match' && !p.displaySkills.some(w => profileSkills.includes(w))) return false;

      // College filter
      if (selectedCollege === 'my') {
        if (!userCollege || !p.displayCollege.toLowerCase().includes(userCollege.toLowerCase())) return false;
      } else if (selectedCollege !== 'all') {
        const target = selectedCollege.toLowerCase();
        const postCol = p.displayCollege.toLowerCase();
        if (!postCol.includes(target)) return false;
      }

      // Skills & Discipline
      if (tSkills.length > 0 && !p.displaySkills.some(w => tSkills.includes(w))) return false;
      if (tDisc.length > 0 && !tDisc.includes(p.discipline)) return false;

      // Free text search
      if (tq.trim()) {
        const hay = `${p.displayTitle} ${p.displayHost} ${p.displayLead} ${p.displayCollege} ${p.displaySkills.join(' ')} ${p.displayDesc}`.toLowerCase();
        if (!hay.includes(tq.trim().toLowerCase())) return false;
      }

      return true;
    });
  }, [normalizedPosts, tScope, selectedCollege, userCollege, tSkills, tDisc, tq, profileSkills]);

  const toggleSkill = (skill) => {
    setTSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  const toggleDisc = (disc) => {
    setTDisc(prev => prev.includes(disc) ? prev.filter(d => d !== disc) : [...prev, disc]);
  };

  const handleReset = () => {
    setTq('');
    setTScope('all');
    setSelectedCollege('all');
    setTSkills([]);
    setTDisc([]);
  };

  // Active review target post
  const reviewTargetPost = normalizedPosts.find(p => p.id === reviewModalPostId) || null;

  const countAll = normalizedPosts.length;
  const countOpen = normalizedPosts.filter(p => !p.isMine && p.isOpen && p.displaySpotsLeft > 0).length;
  const countMine = normalizedPosts.filter(p => p.isMine).length;
  const countMatch = normalizedPosts.filter(p => p.displaySkills.some(w => profileSkills.includes(w))).length;

  const activeSkills = SKILLS.filter(k => normalizedPosts.some(p => p.displaySkills.includes(k)));
  const activeDisciplines = DISCIPLINES.filter(d => normalizedPosts.some(p => p.discipline === d));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ margin: 0, fontSize: '25px', fontWeight: 700, letterSpacing: '-0.02em', color: '#1A1A19' }}>
              Team finder
            </h1>
            <span
              style={{
                background: '#EEF2FF',
                color: '#4338CA',
                border: '1px solid #C7D2FE',
                borderRadius: '6px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.03em'
              }}
            >
              ALL COLLEGES & UNIVERSITIES
            </span>
          </div>
          <p style={{ margin: '7px 0 0', fontSize: '14px', color: '#75736C' }}>
            SSCBS OS Architecture · Recruit teammates for any competition or apply to open squads. Instant WhatsApp handshake upon acceptance.
          </p>
        </div>

        <button
          onClick={() => onOpenPostSquad(null)}
          style={{
            border: '1px solid #0F3FFE',
            borderRadius: '9px',
            background: '#0F3FFE',
            color: '#FFFFFF',
            padding: '11px 18px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            fontSize: '14px',
            fontWeight: 600,
            transition: 'background 120ms ease',
            boxShadow: '0 2px 4px rgba(15,63,254,0.18)'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#0C33CC')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#0F3FFE')}
        >
          + Post a squad
        </button>
      </div>

      {/* Main Filter Suite */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E7E6E2',
          borderRadius: '14px',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        {/* Search & Scope Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <input
            value={tq}
            onChange={(e) => setTq(e.target.value)}
            placeholder="Search by competition name, college, skill, or lead..."
            style={{
              flex: 1,
              minWidth: '220px',
              border: '1px solid #E7E6E2',
              borderRadius: '9px',
              background: '#FFFFFF',
              padding: '10px 14px',
              fontSize: '14px',
              color: '#1A1A19'
            }}
          />

          <div
            style={{
              display: 'flex',
              background: '#F6F6F4',
              border: '1px solid #EFEEEA',
              borderRadius: '9px',
              padding: '3px',
              gap: '3px',
              overflowX: 'auto'
            }}
          >
            {[
              { id: 'all', label: 'All squads', count: countAll },
              { id: 'open', label: 'Open spots', count: countOpen },
              { id: 'match', label: 'Matching my skills', count: countMatch },
              { id: 'mine', label: 'My posts', count: countMine }
            ].map((t) => {
              const on = tScope === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTScope(t.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    border: 0,
                    borderRadius: '7px',
                    background: on ? '#FFFFFF' : 'transparent',
                    color: on ? '#1A1A19' : '#55534D',
                    padding: '8px 13px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontSize: '13px',
                    fontWeight: on ? 600 : 500,
                    boxShadow: on ? '0 1px 2px rgba(26,26,25,0.10)' : 'none'
                  }}
                >
                  <span>{t.label}</span>
                  <span
                    style={{
                      background: on ? '#0F3FFE' : '#E7E6E2',
                      color: on ? '#FFFFFF' : '#55534D',
                      borderRadius: '20px',
                      padding: '1px 7px',
                      fontSize: '11px',
                      fontWeight: 700
                    }}
                  >
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* College Filter Rail (Built for ALL Colleges) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', paddingTop: '10px', borderTop: '1px solid #F0EFEB' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#1A1A19' }}>
              Filter by College / University
            </span>
            {userCollege && (
              <span style={{ fontSize: '11px', color: '#75736C' }}>
                Your campus: <strong>{userCollege}</strong>
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <button
              onClick={() => setSelectedCollege('all')}
              style={{
                border: `1px solid ${selectedCollege === 'all' ? '#0F3FFE' : '#E7E6E2'}`,
                borderRadius: '20px',
                background: selectedCollege === 'all' ? '#0F3FFE' : '#FFFFFF',
                color: selectedCollege === 'all' ? '#FFFFFF' : '#1A1A19',
                padding: '5px 12px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500
              }}
            >
              All Colleges
            </button>

            {userCollege && (
              <button
                onClick={() => setSelectedCollege('my')}
                style={{
                  border: `1px solid ${selectedCollege === 'my' ? '#0F3FFE' : '#C7D2FE'}`,
                  borderRadius: '20px',
                  background: selectedCollege === 'my' ? '#0F3FFE' : '#EEF2FF',
                  color: selectedCollege === 'my' ? '#FFFFFF' : '#4338CA',
                  padding: '5px 12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                🏫 My College ({userCollege.split(' ')[0]})
              </button>
            )}

            {POPULAR_COLLEGE_FILTERS.map((col) => {
              const on = selectedCollege.toLowerCase() === col.toLowerCase();
              return (
                <button
                  key={col}
                  onClick={() => setSelectedCollege(on ? 'all' : col)}
                  style={{
                    border: `1px solid ${on ? '#0F3FFE' : '#E7E6E2'}`,
                    borderRadius: '20px',
                    background: on ? '#0F3FFE' : '#FFFFFF',
                    color: on ? '#FFFFFF' : '#1A1A19',
                    padding: '5px 12px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 500
                  }}
                >
                  {col}
                </button>
              );
            })}
          </div>
        </div>

        {/* Skills Needed Chips */}
        {activeSkills.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '8px', borderTop: '1px solid #F0EFEB' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#1A1A19' }}>
              Skill needed
            </span>
            {activeSkills.map((skill) => {
              const on = tSkills.includes(skill);
              return (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  style={{
                    border: `1px solid ${on ? '#0F3FFE' : '#E7E6E2'}`,
                    borderRadius: '20px',
                    background: on ? '#0F3FFE' : '#FFFFFF',
                    color: on ? '#FFFFFF' : '#1A1A19',
                    padding: '4px 11px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 500,
                    transition: 'all 120ms ease'
                  }}
                >
                  {skill}
                </button>
              );
            })}
          </div>
        )}

        {/* Categories / Disciplines */}
        {activeDisciplines.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#1A1A19' }}>
              Category
            </span>
            {activeDisciplines.map((d) => {
              const on = tDisc.includes(d);
              return (
                <button
                  key={d}
                  onClick={() => toggleDisc(d)}
                  style={{
                    border: `1px solid ${on ? '#0F3FFE' : '#E7E6E2'}`,
                    borderRadius: '20px',
                    background: on ? '#0F3FFE' : '#FFFFFF',
                    color: on ? '#FFFFFF' : '#1A1A19',
                    padding: '4px 11px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 500
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>
        )}

        {/* Reset Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #F0EFEB' }}>
          <span style={{ fontSize: '13px', color: '#55534D' }}>
            Showing <strong>{visiblePosts.length}</strong> {visiblePosts.length === 1 ? 'squad' : 'squads'}
          </span>
          <button
            onClick={handleReset}
            style={{
              border: 0,
              background: 'none',
              color: '#75736C',
              padding: 0,
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#0F3FFE')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#75736C')}
          >
            Clear all filters
          </button>
        </div>
      </div>

      {/* Squad Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '14px'
        }}
      >
        {visiblePosts.map((post) => {
          const left = post.displaySpotsLeft;
          const isFull = !post.isOpen || left <= 0;
          const spotsText = isFull ? 'Full · Closed' : `${left} ${left === 1 ? 'spot left' : 'spots left'}`;
          const isUrgent = !isFull && left <= 1;
          const initials = initialsOf(post.displayHost || 'Host');

          return (
            <div
              key={post.id}
              style={{
                background: '#FFFFFF',
                border: post.isMine ? '1px solid #C7D2FE' : '1px solid #E7E6E2',
                borderRadius: '13px',
                padding: '17px 19px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                position: 'relative',
                boxShadow: post.isMine ? '0 2px 8px rgba(79,70,229,0.08)' : '0 1px 3px rgba(0,0,0,0.03)'
              }}
            >
              {/* Row 1: Spots Left Badge + Admin 3-Dots Menu */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span
                  style={{
                    background: isFull ? '#F2F1ED' : (isUrgent ? '#FEF2F2' : 'rgba(15,63,254,0.07)'),
                    color: isFull ? '#75736C' : (isUrgent ? '#B91C1C' : '#0F3FFE'),
                    border: `1px solid ${isFull ? '#E7E6E2' : (isUrgent ? '#FCA5A5' : 'rgba(15,63,254,0.20)')}`,
                    borderRadius: '20px',
                    padding: '2px 9px',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {spotsText}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {post.isMine && (
                    <span
                      style={{
                        background: '#4338CA',
                        color: '#FFFFFF',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.04em'
                      }}
                    >
                      HOST
                    </span>
                  )}

                  {/* 3-Dots Menu for Host */}
                  {post.isMine && (
                    <div style={{ position: 'relative' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id);
                        }}
                        style={{
                          border: '1px solid #E7E6E2',
                          borderRadius: '6px',
                          background: '#FFFFFF',
                          color: '#55534D',
                          width: '28px',
                          height: '28px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          lineHeight: 1
                        }}
                        title="Squad options"
                      >
                        ⋮
                      </button>

                      {activeMenuPostId === post.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: '32px',
                            background: '#FFFFFF',
                            border: '1px solid #E7E6E2',
                            borderRadius: '9px',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
                            zIndex: 20,
                            minWidth: '160px',
                            overflow: 'hidden'
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuPostId(null);
                              onOpenEditSquad(post);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '9px 13px',
                              border: 0,
                              background: 'transparent',
                              color: '#1A1A19',
                              fontSize: '13px',
                              fontWeight: 500,
                              cursor: 'pointer',
                              borderBottom: '1px solid #F0EFEB'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#F6F6F4')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            ✏️ Edit listing
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuPostId(null);
                              onTogglePostOpen(post.id, post.is_open !== false);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '9px 13px',
                              border: 0,
                              background: 'transparent',
                              color: '#1A1A19',
                              fontSize: '13px',
                              fontWeight: 500,
                              cursor: 'pointer',
                              borderBottom: '1px solid #F0EFEB'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#F6F6F4')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            {post.is_open !== false ? '🔒 Close listing' : '🔓 Re-open listing'}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuPostId(null);
                              setDeleteConfirmPostId(post.id);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '9px 13px',
                              border: 0,
                              background: 'transparent',
                              color: '#DC2626',
                              fontSize: '13px',
                              fontWeight: 500,
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#FEF2F2')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            🗑️ Delete squad
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Row 2: Host Lockup (SSCBS OS Standard) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: '#0F3FFE',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 700,
                    flex: 'none'
                  }}
                >
                  {(post.displayLead || 'C').charAt(0).toUpperCase()}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A19' }}>
                      {post.displayLead}
                    </span>
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#16A34A',
                        display: 'inline-block'
                      }}
                      title="Verified student lead"
                    />
                  </div>
                  <div style={{ fontSize: '12px', color: '#75736C', marginTop: '1px' }}>
                    <strong>{post.displayCollege || 'Collegiate'}</strong> · {post.displayYear || 'UG 2nd Year'}
                  </div>
                </div>
              </div>

              {/* Row 3: Competition & Organizer */}
              <div style={{ borderTop: '1px solid #F0EFEB', paddingTop: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#75736C', textTransform: 'uppercase' }}>
                  Competing in:
                </span>
                <h3
                  style={{
                    margin: '3px 0 0',
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#1A1A19',
                    lineHeight: 1.35
                  }}
                >
                  {post.displayTitle}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#55534D' }}>
                    {post.displayHost}
                  </span>
                  {post.competition_link && (
                    <a
                      href={post.competition_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '11px', color: '#0F3FFE', textDecoration: 'none', fontWeight: 600 }}
                    >
                      View link ↗
                    </a>
                  )}
                </div>
              </div>

              {/* Description */}
              {post.displayDesc && (
                <p style={{ margin: 0, fontSize: '13px', color: '#55534D', lineHeight: 1.5 }}>
                  {post.displayDesc}
                </p>
              )}

              {/* Skills Looking For */}
              {post.displaySkills && post.displaySkills.length > 0 && (
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#75736C' }}>
                    Teammates needed with:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
                    {post.displaySkills.map((s, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: 'rgba(15,63,254,0.08)',
                          color: '#0F3FFE',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills Host Brings */}
              {post.displaySkillsHave && post.displaySkillsHave.length > 0 && (
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#15803D' }}>
                    Host brings:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '4px' }}>
                    {post.displaySkillsHave.map((s, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: 'rgba(21,128,61,0.08)',
                          color: '#15803D',
                          borderRadius: '6px',
                          padding: '2px 7px',
                          fontSize: '11px',
                          fontWeight: 500,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #F0EFEB' }}>
                {post.isMine ? (
                  <button
                    type="button"
                    onClick={() => setReviewModalPostId(post.id)}
                    style={{
                      width: '100%',
                      border: '1px solid #0F3FFE',
                      borderRadius: '8px',
                      background: post.pendingAppsCount > 0 ? '#0F3FFE' : '#EEF2FF',
                      color: post.pendingAppsCount > 0 ? '#FFFFFF' : '#4338CA',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>👥 Review Applicants</span>
                    {post.pendingAppsCount > 0 && (
                      <span
                        style={{
                          background: '#FFFFFF',
                          color: '#0F3FFE',
                          borderRadius: '12px',
                          padding: '1px 7px',
                          fontSize: '11px',
                          fontWeight: 800
                        }}
                      >
                        {post.pendingAppsCount} pending
                      </span>
                    )}
                  </button>
                ) : post.state === 'accepted' ? (
                  <button
                    type="button"
                    onClick={() => onOpenWhatsApp(post)}
                    style={{
                      width: '100%',
                      border: '1px solid #16A34A',
                      borderRadius: '8px',
                      background: '#16A34A',
                      color: '#FFFFFF',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>💬 Open WhatsApp Chat</span>
                  </button>
                ) : post.state === 'requested' ? (
                  <button
                    type="button"
                    disabled
                    style={{
                      width: '100%',
                      border: '1px solid #E7E6E2',
                      borderRadius: '8px',
                      background: '#F6F6F4',
                      color: '#75736C',
                      padding: '10px 14px',
                      cursor: 'default',
                      fontSize: '13px',
                      fontWeight: 600
                    }}
                  >
                    ⏳ Request Pending Lead Review
                  </button>
                ) : isFull ? (
                  <button
                    type="button"
                    disabled
                    style={{
                      width: '100%',
                      border: '1px solid #E7E6E2',
                      borderRadius: '8px',
                      background: '#F6F6F4',
                      color: '#9CA3AF',
                      padding: '10px 14px',
                      cursor: 'not-allowed',
                      fontSize: '13px',
                      fontWeight: 600
                    }}
                  >
                    Squad Full
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onOpenApply(post)}
                    style={{
                      width: '100%',
                      border: '1px solid #0F3FFE',
                      borderRadius: '8px',
                      background: '#0F3FFE',
                      color: '#FFFFFF',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 700,
                      transition: 'background 120ms ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#0C33CC')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#0F3FFE')}
                  >
                    Request to Join Squad
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {visiblePosts.length === 0 && (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E7E6E2',
            borderRadius: '14px',
            padding: '48px 24px',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔎</div>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#1A1A19' }}>
            No squads match your filters
          </h3>
          <p style={{ margin: '6px auto 0', fontSize: '14px', color: '#75736C', maxWidth: '420px' }}>
            {tScope === 'mine'
              ? 'You have not posted any squad recruitment listings yet. Post one to build a winning team!'
              : 'Try clearing your college or skill filters, or post a squad for this competition yourself.'}
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '16px' }}>
            <button
              onClick={handleReset}
              style={{
                border: '1px solid #E7E6E2',
                borderRadius: '8px',
                background: '#FFFFFF',
                color: '#1A1A19',
                padding: '9px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Clear filters
            </button>
            <button
              onClick={() => onOpenPostSquad(null)}
              style={{
                border: '1px solid #0F3FFE',
                borderRadius: '8px',
                background: '#0F3FFE',
                color: '#FFFFFF',
                padding: '9px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              + Post a squad
            </button>
          </div>
        </div>
      )}

      {/* IN-CARD APPLICANT REVIEW MODAL (SSCBS OS Core Parity) */}
      {reviewTargetPost && (
        <div
          onClick={() => setReviewModalPostId(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(26,26,25,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 65
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(580px, 100%)',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#FFFFFF',
              border: '1px solid #E7E6E2',
              borderRadius: '14px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.18)'
            }}
          >
            {/* Review Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid #E7E6E2',
                position: 'sticky',
                top: 0,
                background: '#FFFFFF',
                zIndex: 2
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1A1A19' }}>
                  Review Applicants
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#75736C' }}>
                  {reviewTargetPost.displayTitle} · {reviewTargetPost.displaySpotsLeft} open spots
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalPostId(null)}
                style={{
                  border: '1px solid #E7E6E2',
                  borderRadius: '8px',
                  background: '#FFFFFF',
                  color: '#75736C',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            {/* Applicants List */}
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {reviewTargetPost.postApps.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', marginBottom: '6px' }}>📭</div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1A1A19' }}>
                    No applications yet
                  </h4>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#75736C' }}>
                    When competitors apply to your squad, their profile, pitch, and contact will appear here.
                  </p>
                </div>
              ) : (
                reviewTargetPost.postApps.map((app) => {
                  const applicantName = app.applicant_name || app.who || 'Competitor';
                  const applicantCollege = app.applicant_college || app.meta || 'Collegiate';
                  const applicantYear = app.applicant_year || 'UG';
                  const pitch = app.pitch_note || app.pitch;
                  const skills = app.highlighted_skills || app.skills || [];
                  const isAccepted = app.status === 'accepted';
                  const isDeclined = app.status === 'declined' || app.status === 'rejected';
                  const isRemoved = app.status === 'removed';

                  return (
                    <div
                      key={app.id}
                      style={{
                        background: '#FAFAF9',
                        border: isAccepted ? '1px solid #86EFAC' : '1px solid #E7E6E2',
                        borderRadius: '11px',
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      {/* Applicant Info Row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <strong style={{ fontSize: '14px', color: '#1A1A19' }}>
                              {applicantName}
                            </strong>
                            {isAccepted && (
                              <span
                                style={{
                                  background: '#DCFCE7',
                                  color: '#15803D',
                                  border: '1px solid #86EFAC',
                                  borderRadius: '4px',
                                  padding: '1px 6px',
                                  fontSize: '10px',
                                  fontWeight: 700
                                }}
                              >
                                SQUAD MEMBER
                              </span>
                            )}
                            {isDeclined && (
                              <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Declined</span>
                            )}
                            {isRemoved && (
                              <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Removed</span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: '#75736C', marginTop: '2px' }}>
                            {applicantCollege} · {applicantYear}
                          </div>
                        </div>

                        {/* WhatsApp launcher if accepted or for interview */}
                        <button
                          type="button"
                          onClick={() => {
                            const prefillMsg = `Hey ${applicantName.split(' ')[0]}! Saw your application for our squad for "${reviewTargetPost.displayTitle}". Wanted to connect!`;
                            const waUrl = formatWhatsAppUrl(app.applicant_phone || app.phone, prefillMsg);
                            if (waUrl && waUrl !== '#') {
                              window.open(waUrl, '_blank', 'noopener,noreferrer');
                            } else {
                              alert('No phone number shared for this applicant.');
                            }
                          }}
                          style={{
                            border: '1px solid #16A34A',
                            borderRadius: '7px',
                            background: '#FFFFFF',
                            color: '#16A34A',
                            padding: '6px 11px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#F0FDF4')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                        >
                          💬 WhatsApp
                        </button>
                      </div>

                      {/* Pitch Note */}
                      {pitch && (
                        <div
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #E7E6E2',
                            borderRadius: '8px',
                            padding: '9px 12px',
                            fontSize: '13px',
                            color: '#374151',
                            lineHeight: 1.45
                          }}
                        >
                          "{pitch}"
                        </div>
                      )}

                      {/* Highlighted Skills */}
                      {skills.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                          {skills.map((s, idx) => (
                            <span
                              key={idx}
                              style={{
                                background: '#FFFFFF',
                                border: '1px solid #E7E6E2',
                                borderRadius: '4px',
                                padding: '2px 7px',
                                fontSize: '11px',
                                fontWeight: 500,
                                color: '#0F3FFE'
                              }}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        {app.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => onAcceptApp(app.id)}
                              style={{
                                flex: 1,
                                border: '1px solid #0F3FFE',
                                borderRadius: '7px',
                                background: '#0F3FFE',
                                color: '#FFFFFF',
                                padding: '8px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = '#0C33CC')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = '#0F3FFE')}
                            >
                              ✓ Accept to Squad
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeclineApp(app.id)}
                              style={{
                                border: '1px solid #E7E6E2',
                                borderRadius: '7px',
                                background: '#FFFFFF',
                                color: '#55534D',
                                padding: '8px 14px',
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer'
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = '#F6F6F4')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                            >
                              Decline
                            </button>
                          </>
                        )}

                        {isAccepted && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Remove ${applicantName} from the squad? This will re-open a spot.`)) {
                                onRemoveApp(app.id);
                              }
                            }}
                            style={{
                              border: '1px solid #FECACA',
                              borderRadius: '7px',
                              background: '#FEF2F2',
                              color: '#B91C1C',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Remove Member (Re-open Spot)
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmPostId && (
        <div
          onClick={() => setDeleteConfirmPostId(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(26,26,25,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 70
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(400px, 100%)',
              background: '#FFFFFF',
              border: '1px solid #E7E6E2',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1A1A19' }}>
              Delete squad listing?
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#55534D', lineHeight: 1.5 }}>
              This will permanently remove this squad opening and cancel any pending applications.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmPostId(null)}
                style={{
                  border: '1px solid #E7E6E2',
                  borderRadius: '7px',
                  background: '#FFFFFF',
                  color: '#55534D',
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteSquadPost(deleteConfirmPostId);
                  setDeleteConfirmPostId(null);
                }}
                style={{
                  border: '1px solid #DC2626',
                  borderRadius: '7px',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
