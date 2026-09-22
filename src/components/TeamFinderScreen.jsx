// src/components/TeamFinderScreen.jsx
import React, { useState } from 'react';
import { SKILLS, DISCIPLINES, initialsOf, isMockPost } from '../data/initialData';

export default function TeamFinderScreen({
  posts = [],
  competitions = [],
  profile,
  applications = [],
  user = null,
  onOpenPostSquad,
  onOpenApply,
  onOpenWhatsApp,
  onGoRequests
}) {
  const [tq, setTq] = useState('');
  const [tScope, setTScope] = useState('all'); // 'all' | 'open' | 'mine'
  const [tSkills, setTSkills] = useState([]);
  const [tDisc, setTDisc] = useState([]);
  const [tMatch, setTMatch] = useState(false);

  const profileSkills = profile?.skills || [];

  // Filter out any mock posts and normalize schema
  const cleanPosts = posts.filter(p => !isMockPost(p));

  const normalizedPosts = cleanPosts.map((p) => {
    const comp = competitions.find(c => String(c.id) === String(p.compId) || (p.competition_name && c.title && c.title.toLowerCase() === p.competition_name.toLowerCase())) || null;
    const title = p.competition_name || comp?.title || p.title || 'Competition';
    const host = p.organizer || comp?.host || 'Host Institution';
    const logo = comp?.logo || null;
    const desc = p.description || p.desc || '';
    const want = p.skills_looking_for || p.want || [];
    const spotsLeft = p.spots_left !== undefined ? Number(p.spots_left) : Math.max(0, (p.total_members || p.size || 4) - (p.filled || 1));
    const totalMembers = p.total_members || p.size || (spotsLeft + (p.filled || 1));
    const filledCount = p.filled !== undefined ? p.filled : Math.max(1, totalMembers - spotsLeft);
    const lead = p.created_by_name || p.lead || 'Student Lead';
    const leadMeta = [lead, p.college, p.year].filter(Boolean).join(' · ');
    const isMine = Boolean(
      p.mine ||
      (user && p.user_id && p.user_id === user.id) ||
      (user && p.created_by_email && p.created_by_email === user.email) ||
      (profile?.name && lead === profile.name)
    );
    const discipline = comp?.discipline || 'General';

    // Compute live application state from Supabase applications
    const myApp = applications.find(a =>
      (String(a.postId) === String(p.id) || String(a.post_id) === String(p.id)) &&
      (a.dir === 'out' || (user && a.applicant_id === user.id))
    );

    let postState = p.state || 'open';
    if (isMine) {
      postState = 'own';
    } else if (myApp) {
      postState = myApp.status === 'accepted' ? 'accepted' : 'requested';
    } else if (spotsLeft <= 0) {
      postState = 'full';
    }

    return {
      ...p,
      displayTitle: title,
      displayHost: host,
      displayLogo: logo,
      displayDesc: desc,
      displaySkills: want,
      displaySpotsLeft: spotsLeft,
      displayTotalMembers: totalMembers,
      displayFilledCount: filledCount,
      displayLead: lead,
      displayLeadMeta: leadMeta,
      isMine,
      state: postState,
      discipline,
      rawComp: comp
    };
  });

  // Filter posts
  const visiblePosts = normalizedPosts.filter((p) => {
    if (tScope === 'mine' && !p.isMine) return false;
    if (tScope === 'open' && (p.isMine || p.displaySpotsLeft <= 0)) return false;
    if (tSkills.length > 0 && !p.displaySkills.some(w => tSkills.includes(w))) return false;
    if (tDisc.length > 0 && !tDisc.includes(p.discipline)) return false;
    if (tMatch && !p.displaySkills.some(w => profileSkills.includes(w))) return false;

    if (tq.trim()) {
      const hay = `${p.displayTitle} ${p.displayHost} ${p.displayLeadMeta} ${p.displaySkills.join(' ')} ${p.displayDesc}`.toLowerCase();
      if (!hay.includes(tq.trim().toLowerCase())) return false;
    }
    return true;
  });

  const toggleSkill = (skill) => {
    setTSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  const toggleDisc = (disc) => {
    setTDisc(prev => prev.includes(disc) ? prev.filter(d => d !== disc) : [...prev, disc]);
  };

  const handleReset = () => {
    setTq('');
    setTScope('all');
    setTSkills([]);
    setTDisc([]);
    setTMatch(false);
  };

  // Extract skills and categories present in current posts for chips
  const activeSkills = SKILLS.filter(k => normalizedPosts.some(p => p.displaySkills.includes(k)));
  const activeDisciplines = DISCIPLINES.filter(d => normalizedPosts.some(p => p.discipline === d));

  const countAll = normalizedPosts.length;
  const countOpen = normalizedPosts.filter(p => !p.isMine && p.displaySpotsLeft > 0).length;
  const countMine = normalizedPosts.filter(p => p.isMine).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '17px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '25px', fontWeight: 700, letterSpacing: '-0.02em', color: '#1A1A19' }}>
            Team finder
          </h1>
          <p style={{ margin: '7px 0 0', fontSize: '14px', color: '#75736C' }}>
            Squads looking for undergrad teammates. Once a lead accepts you, WhatsApp opens in one click.
          </p>
        </div>

        <button
          onClick={() => onOpenPostSquad(null)}
          style={{
            border: '1px solid #0F3FFE',
            borderRadius: '9px',
            background: '#0F3FFE',
            color: '#FFFFFF',
            padding: '11px 17px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            fontSize: '14px',
            fontWeight: 600,
            transition: 'background 120ms ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#0C33CC')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#0F3FFE')}
        >
          Post a squad
        </button>
      </div>

      {/* Filter Card */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E7E6E2',
          borderRadius: '12px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {/* Row 1: Search & Scopes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <input
            value={tq}
            onChange={(e) => setTq(e.target.value)}
            placeholder="Search by competition, college or skill"
            style={{
              flex: 1,
              minWidth: '210px',
              border: '1px solid #E7E6E2',
              borderRadius: '10px',
              background: '#FFFFFF',
              padding: '10px 13px',
              fontSize: '14px',
              color: '#1A1A19'
            }}
          />

          <div
            style={{
              display: 'flex',
              background: '#F6F6F4',
              border: '1px solid #EFEEEA',
              borderRadius: '10px',
              padding: '3px',
              gap: '3px'
            }}
          >
            {[
              { id: 'all', label: 'All squads', count: countAll },
              { id: 'open', label: 'Open spots', count: countOpen },
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

        {/* Row 2: Skill Needed Chips */}
        {activeSkills.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '9px',
              flexWrap: 'wrap',
              paddingTop: '12px',
              borderTop: '1px solid #F0EFEB'
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#75736C', paddingTop: '7px' }}>
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
                    padding: '6px 13px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontSize: '13px',
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

        {/* Row 3: Category Chips */}
        {activeDisciplines.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#75736C' }}>Category</span>
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
                    padding: '6px 13px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontSize: '13px',
                    fontWeight: 500,
                    transition: 'all 120ms ease'
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>
        )}

        {/* Row 4: Matches my skills & Reset */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            paddingTop: '12px',
            borderTop: '1px solid #F0EFEB'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setTMatch(!tMatch)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: `1px solid ${tMatch ? '#0F3FFE' : '#E7E6E2'}`,
                borderRadius: '20px',
                background: tMatch ? 'rgba(15,63,254,0.07)' : '#FFFFFF',
                color: '#1A1A19',
                padding: '6px 13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontSize: '13px',
                fontWeight: 500
              }}
            >
              <span
                style={{
                  width: '15px',
                  height: '15px',
                  borderRadius: '4px',
                  border: `1px solid ${tMatch ? '#0F3FFE' : '#CFCDC7'}`,
                  background: tMatch ? '#0F3FFE' : '#FFFFFF',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 'none',
                  fontSize: '10px',
                  fontWeight: 700,
                  lineHeight: 1
                }}
              >
                {tMatch ? '✓' : ''}
              </span>
              <span>Matches my skills</span>
            </button>

            <span style={{ fontSize: '13px', color: '#55534D' }}>
              {visiblePosts.length} {visiblePosts.length === 1 ? 'squad' : 'squads'}
            </span>
          </div>

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
            Clear all
          </button>
        </div>
      </div>

      {/* Posts Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '12px'
        }}
      >
        {visiblePosts.map((post) => {
          const left = post.displaySpotsLeft;
          const spotsText = left <= 0 ? 'Full' : `${left} ${left === 1 ? 'spot left' : 'spots left'}`;
          const isUrgent = left <= 1;
          const initials = initialsOf(post.displayHost || 'Host');

          let btnLabel = 'Request to join';
          let btnBg = '#0F3FFE';
          let btnColor = '#FFFFFF';
          let btnBorder = '#0F3FFE';

          if (post.isMine) {
            btnLabel = 'Manage applicants';
            btnBg = '#1A1A19';
            btnColor = '#FFFFFF';
            btnBorder = '#1A1A19';
          } else if (post.state === 'requested') {
            btnLabel = 'Requested — pending';
            btnBg = '#FFFFFF';
            btnColor = '#75736C';
            btnBorder = '#E7E6E2';
          } else if (post.state === 'accepted') {
            btnLabel = 'Open WhatsApp group';
            btnBg = '#1A1A19';
            btnColor = '#FFFFFF';
            btnBorder = '#1A1A19';
          }

          return (
            <div
              key={post.id}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E7E6E2',
                borderRadius: '12px',
                padding: '17px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '11px'
              }}
            >
              {/* Row 1: Spots & Posted time */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: isUrgent ? '#0F3FFE' : '#55534D',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {spotsText}
                </span>
                <span style={{ fontSize: '12px', color: '#75736C', whiteSpace: 'nowrap' }}>
                  {post.posted || 'recently'}
                </span>
              </div>

              {/* Row 2: Logo Tile + Title + Description */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    border: '1px solid #EFEEEA',
                    backgroundColor: post.displayLogo ? '#FFFFFF' : '#F2F1ED',
                    backgroundImage: post.displayLogo ? `url("${post.displayLogo}")` : 'none',
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    color: '#55534D',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 'none',
                    fontSize: '11px',
                    fontWeight: 700
                  }}
                >
                  {!post.displayLogo && <span>{initials}</span>}
                </span>

                <div style={{ minWidth: 0 }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '15px',
                      fontWeight: 600,
                      lineHeight: 1.35,
                      textWrap: 'pretty',
                      color: '#1A1A19'
                    }}
                  >
                    {post.displayTitle}
                  </h3>
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#75736C', marginTop: '2px' }}>
                    {post.displayHost}
                  </div>
                  {post.displayDesc && (
                    <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#55534D', lineHeight: 1.5 }}>
                      {post.displayDesc}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 3: Skills Needed */}
              {post.displaySkills && post.displaySkills.length > 0 && (
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#75736C' }}>Looking for</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {post.displaySkills.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        style={{
                          background: 'rgba(15,63,254,0.07)',
                          borderRadius: '6px',
                          padding: '4px 9px',
                          fontSize: '12px',
                          fontWeight: 500,
                          color: '#0F3FFE',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Row 4: Lead Line */}
              <p style={{ margin: 0, fontSize: '12px', color: '#75736C' }}>
                {post.isMine
                  ? `Your post · ${post.displayFilledCount} of ${post.displayTotalMembers} filled`
                  : post.displayLeadMeta}
              </p>

              {/* Row 5: Action Button */}
              <button
                onClick={() => {
                  if (post.isMine) {
                    onGoRequests();
                    return;
                  }
                  if (post.state === 'accepted') {
                    onOpenWhatsApp(post);
                    return;
                  }
                  if (post.state !== 'requested') {
                    onOpenApply(post);
                  }
                }}
                style={{
                  marginTop: 'auto',
                  border: `1px solid ${btnBorder}`,
                  borderRadius: '8px',
                  background: btnBg,
                  color: btnColor,
                  padding: '10px 14px',
                  cursor: post.state === 'requested' ? 'default' : 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'opacity 120ms ease'
                }}
              >
                {btnLabel}
              </button>
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
            borderRadius: '12px',
            padding: '52px 20px',
            textAlign: 'center'
          }}
        >
          {cleanPosts.length === 0 ? (
            <>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1A1A19' }}>
                No squad openings right now
              </p>
              <p style={{ margin: '8px auto 16px', maxWidth: '420px', fontSize: '13px', color: '#75736C', lineHeight: 1.5 }}>
                Be the first to post a squad opening for an undergraduate competition. Teammates can apply and connect with you on WhatsApp.
              </p>
              <button
                onClick={() => onOpenPostSquad(null)}
                style={{
                  border: '1px solid #0F3FFE',
                  borderRadius: '8px',
                  background: '#0F3FFE',
                  color: '#FFFFFF',
                  padding: '10px 18px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                Post a squad opening
              </button>
            </>
          ) : (
            <>
              <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1A1A19' }}>
                No squads match these filters
              </p>
              <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#75736C' }}>
                Clear a filter, or post your own squad and let applicants come to you.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
