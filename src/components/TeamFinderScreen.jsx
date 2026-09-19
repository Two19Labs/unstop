// src/components/TeamFinderScreen.jsx
import React, { useState } from 'react';
import { SKILLS, DISCIPLINES, initialsOf } from '../data/initialData';

export default function TeamFinderScreen({
  posts = [],
  competitions = [],
  profile,
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

  const compMap = new Map();
  competitions.forEach(c => compMap.set(c.id, c));

  const getComp = (compId) => compMap.get(compId) || { title: 'Competition', host: 'OneStop', discipline: 'General', logo: null };

  const profileSkills = profile?.skills || [];

  // Filter posts
  const visiblePosts = posts.filter((p) => {
    const c = getComp(p.compId);
    const spotsLeft = (p.size || 4) - (p.filled || 1);

    if (tScope === 'mine' && !p.mine) return false;
    if (tScope === 'open' && (p.mine || spotsLeft <= 0)) return false;
    if (tSkills.length > 0 && !p.want?.some(w => tSkills.includes(w))) return false;
    if (tDisc.length > 0 && !tDisc.includes(c.discipline)) return false;
    if (tMatch && !p.want?.some(w => profileSkills.includes(w))) return false;

    if (tq.trim()) {
      const hay = `${c.title || ''} ${c.host || ''} ${p.lead || ''} ${(p.want || []).join(' ')} ${p.desc || ''}`.toLowerCase();
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
  const activeSkills = SKILLS.filter(k => posts.some(p => p.want?.includes(k)));
  const activeDisciplines = DISCIPLINES.filter(d => posts.some(p => getComp(p.compId).discipline === d));

  const countAll = posts.length;
  const countOpen = posts.filter(p => !p.mine && (p.size || 4) - (p.filled || 1) > 0).length;
  const countMine = posts.filter(p => p.mine).length;

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
          const comp = getComp(post.compId);
          const left = (post.size || 4) - (post.filled || 1);
          const spotsText = left <= 0 ? 'Full' : `${left} ${left === 1 ? 'spot left' : 'spots left'}`;
          const isUrgent = left <= 1;
          const initials = initialsOf(comp.host || 'Host');

          let btnLabel = 'Request to join';
          let btnBg = '#0F3FFE';
          let btnColor = '#FFFFFF';
          let btnBorder = '#0F3FFE';

          if (post.mine) {
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
                    backgroundColor: comp.logo ? '#FFFFFF' : '#F2F1ED',
                    backgroundImage: comp.logo ? `url("${comp.logo}")` : 'none',
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
                  {!comp.logo && <span>{initials}</span>}
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
                    {comp.title}
                  </h3>
                  <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#55534D', lineHeight: 1.5 }}>
                    {post.desc}
                  </p>
                </div>
              </div>

              {/* Row 3: Skills Needed */}
              {post.want && post.want.length > 0 && (
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#75736C' }}>Looking for</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {post.want.map((skill, sIdx) => (
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
                {post.mine
                  ? `Your post · ${post.filled || 1} of ${post.size || 4} filled`
                  : post.lead}
              </p>

              {/* Row 5: Action Button */}
              <button
                onClick={() => {
                  if (post.mine) {
                    onGoRequests();
                    return;
                  }
                  if (post.state === 'open' || !post.state) {
                    onOpenApply(post);
                    return;
                  }
                  if (post.state === 'accepted') {
                    onOpenWhatsApp(post);
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
            padding: '44px 18px',
            textAlign: 'center'
          }}
        >
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1A1A19' }}>
            No squads match these filters
          </p>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#75736C' }}>
            Clear a filter, or post your own squad and let applicants come to you.
          </p>
        </div>
      )}
    </div>
  );
}
