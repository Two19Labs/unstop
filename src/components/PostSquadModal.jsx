// src/components/PostSquadModal.jsx
// Redesigned Post a Squad / Edit Squad Modal according to OneStop Team Finder handoff
import React, { useState, useEffect, useMemo } from 'react';
import { SKILLS, initialsOf } from '../data/initialData';
import { sanitizeIndianPhone, isValidIndianPhone } from '../context/AuthContext';
import { normalizeYear } from '../data/colleges';
import InstitutionLogo from './InstitutionLogo';

function formatDueText(comp) {
  if (!comp) return '';
  let h = 24;
  if (comp.deadline) {
    const diff = new Date(comp.deadline).getTime() - Date.now();
    if (!isNaN(diff)) h = Math.max(1, Math.round(diff / 3600000));
  } else if (comp.days !== undefined && comp.days !== null) {
    h = Math.max(1, Math.round(Number(comp.days) * 24));
  }
  if (h < 24) return `${h}h left`;
  const d = Math.round(h / 24);
  return `${d}d left`;
}

export function isSoloCompetition(comp) {
  if (!comp) return false;
  if (comp.isSolo === true) return true;
  if (comp.maxTeam !== undefined && comp.maxTeam !== null && Number(comp.maxTeam) <= 1) return true;
  if (comp.team && typeof comp.team === 'string') {
    const t = comp.team.toLowerCase().trim();
    if (t.includes('solo') || t.includes('individual') || t === '1' || t === '1 member' || t === '1 person') {
      return true;
    }
  }
  if (comp.teamSizeDisplay && typeof comp.teamSizeDisplay === 'string') {
    const td = comp.teamSizeDisplay.toLowerCase().trim();
    if (td.includes('solo') || td.includes('individual') || td === '1' || td === '1 member' || td === '1 person') {
      return true;
    }
  }
  return false;
}

export default function PostSquadModal({
  isOpen,
  onClose,
  competitions = [],
  initialCompId = null,
  editingPost = null,
  profile = null,
  onSubmitPost,
  onSuccess,
  onDeletePost
}) {
  const [custom, setCustom] = useState(false);
  const [compQ, setCompQ] = useState('');
  const [selectedCompId, setSelectedCompId] = useState('');
  // Once a competition is picked, collapse the list to just that pick until the search bar is focused again
  const [pickerOpen, setPickerOpen] = useState(true);

  // Custom competition fields
  const [customTitle, setCustomTitle] = useState('');
  const [customHost, setCustomHost] = useState('');
  const [customLink, setCustomLink] = useState('');

  // Squad steppers
  const [total, setTotal] = useState(4);
  const [open, setOpen] = useState(2);

  // Skill toggles
  const [want, setWant] = useState([]);

  // Note to applicants
  const [note, setNote] = useState('');

  // Communication Method Choice ('whatsapp' | 'chat')
  const [commMethod, setCommMethod] = useState('whatsapp');

  // WhatsApp mode always uses the number on the host's profile
  const profilePhone = sanitizeIndianPhone(profile?.phone || '');
  const validProfilePhone = isValidIndianPhone(profilePhone);

  const [formError, setFormError] = useState('');

  // Filter out solo / individual competitions: Squads are for team participation only
  const teamCompetitions = useMemo(() => {
    return (competitions || []).filter(c => !isSoloCompetition(c));
  }, [competitions]);

  // Pre-fill fields on open / edit
  useEffect(() => {
    if (!isOpen) return;
    setFormError('');
    setCompQ('');
    setPickerOpen(true);

    if (editingPost) {
      const matchComp = teamCompetitions.find(c => String(c.id) === String(editingPost.compId)) ||
        competitions.find(c => String(c.id) === String(editingPost.compId));
      if (matchComp) {
        setCustom(false);
        setSelectedCompId(String(matchComp.id));
        setPickerOpen(false);
      } else {
        setCustom(true);
        setCustomTitle(editingPost.competition_name || editingPost.title || '');
        setCustomHost(editingPost.organizer || editingPost.host || '');
        setCustomLink(editingPost.competition_link || '');
      }

      const tot = Number(editingPost.total_members || editingPost.size || 4);
      const spots = Number(editingPost.spots_left !== undefined ? editingPost.spots_left : (editingPost.spots || Math.max(1, tot - 1)));
      setTotal(tot);
      setOpen(Math.min(spots, tot - 1));

      const looking = Array.isArray(editingPost.skills_looking_for)
        ? editingPost.skills_looking_for
        : (Array.isArray(editingPost.want) ? editingPost.want : []);
      
      setNote(editingPost.description || editingPost.desc || '');
      setCommMethod(editingPost.comm_method === 'chat' ? 'chat' : 'whatsapp');
    } else {
      if (initialCompId) {
        const match = teamCompetitions.find(c => String(c.id) === String(initialCompId));
        if (match) {
          setCustom(false);
          setSelectedCompId(String(initialCompId));
          setPickerOpen(false);
        } else {
          setCustom(false);
          setSelectedCompId(teamCompetitions.length > 0 ? String(teamCompetitions[0].id) : '');
        }
      } else if (teamCompetitions.length > 0 && (!selectedCompId || !teamCompetitions.some(c => String(c.id) === String(selectedCompId)))) {
        setCustom(false);
        setSelectedCompId(String(teamCompetitions[0].id));
      } else {
        setCustom(false);
      }

      setCustomTitle('');
      setCustomHost('');
      setCustomLink('');
      setTotal(4);
      setOpen(2);
      setWant([]);
      setNote('');
      setCommMethod('whatsapp');
    }
  }, [isOpen, editingPost, initialCompId, teamCompetitions, competitions, profile]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter team competitions for picker (excluding solo/individual opportunities)
  const filteredComps = useMemo(() => {
    if (!compQ.trim()) return teamCompetitions.slice(0, 5);
    const q = compQ.trim().toLowerCase();
    return teamCompetitions
      .filter(c => (c.title || '').toLowerCase().includes(q) || (c.host || c.orgName || '').toLowerCase().includes(q))
      .slice(0, 8);
  }, [teamCompetitions, compQ]);

  const selectedComp = selectedCompId
    ? (teamCompetitions.find(c => String(c.id) === String(selectedCompId)) ||
      competitions.find(c => String(c.id) === String(selectedCompId)))
    : null;
  const showCollapsed = !pickerOpen && Boolean(selectedComp);
  const visibleComps = showCollapsed ? [selectedComp] : filteredComps;

  if (!isOpen) return null;

  // Stepper handlers
  const decTotal = () => {
    const nextTotal = Math.max(2, total - 1);
    setTotal(nextTotal);
    if (open >= nextTotal) setOpen(nextTotal - 1);
  };

  const incTotal = () => {
    const nextTotal = Math.min(6, total + 1);
    setTotal(nextTotal);
  };

  const decOpen = () => {
    setOpen(prev => Math.max(1, prev - 1));
  };

  const incOpen = () => {
    setOpen(prev => Math.min(total - 1, prev + 1));
  };

  // Skill toggle handlers
  const toggleWant = (skill) => {
    if (want.includes(skill)) {
      setWant(want.filter(s => s !== skill));
    } else {
      if (want.length >= 3) {
        setFormError('You can pick up to 3 skills for "Looking for".');
        return;
      }
      setFormError('');
      setWant([...want, skill]);
    }
  };

  
  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    let compTitle = '';
    let compHost = '';
    let compLink = '';
    let finalCompId = null;
    let compLogo = editingPost?.compLogo || editingPost?.logo || null;

    let compDeadline = null;
    if (!custom) {
      const match = teamCompetitions.find(c => String(c.id) === String(selectedCompId)) ||
        competitions.find(c => String(c.id) === String(selectedCompId));
      if (!match) {
        setFormError('Please select a competition from the list or switch to "Not on OneStop?".');
        return;
      }
      compTitle = match.title;
      compHost = match.host || match.orgName || 'Organizer';
      compLink = match.unstopUrl || '';
      finalCompId = match.id;
      compLogo = match.logo || match.orgLogo || null;
      compDeadline = match.deadline || null;
    } else {
      if (!customTitle.trim()) {
        setFormError('Please enter the competition name.');
        return;
      }
      compTitle = customTitle.trim();
      compHost = customHost.trim() || 'Organizer';
      compLink = customLink.trim();
      if (compLink && !/^https?:\/\//i.test(compLink)) {
        compLink = `https://${compLink}`;
      }
      finalCompId = editingPost?.compId || `custom_${Date.now()}`;
    }

    // WhatsApp mode uses the number on the host's profile (never typed in here)
    if (commMethod === 'whatsapp' && !validProfilePhone) {
      setFormError('Add a WhatsApp number to your profile first, or choose OneStop Chat.');
      return;
    }

    let expiryMs = compDeadline ? new Date(compDeadline).getTime() : NaN;
    if (isNaN(expiryMs) || expiryMs <= Date.now() || custom) {
      expiryMs = Date.now() + 15 * 24 * 60 * 60 * 1000;
    }
    const expiryTimestamp = new Date(expiryMs).toISOString();

    const creatorName = profile?.name || 'You';
    const creatorCollege = profile?.college || '';
    const creatorYear = normalizeYear(profile?.year || profile?.batch || '');

    onSubmitPost({
      isEdit: Boolean(editingPost),
      postId: editingPost?.id,
      compId: finalCompId,
      competition_id: custom ? null : String(finalCompId),
      is_custom: Boolean(custom),
      expires_at: expiryTimestamp,
      competition_name: compTitle,
      organizer: compHost,
      compLogo,
      logo: compLogo,
      competition_link: compLink,
      comm_method: commMethod,
      commMethod: commMethod,
      spots: open,
      spots_left: open,
      total_members: total,
      size: total,
      want,
      skills: want.length > 0 ? want : ['All skills welcome'],
      skills_looking_for: want.length > 0 ? want : ['All skills welcome'],
      have: [],
      skills_have: [],
      desc: note.trim() || `Squad for ${compTitle}. ${commMethod === 'whatsapp' ? 'Message me on WhatsApp if you want to team up!' : 'Apply via OneStop to team up!'}`,
      description: note.trim() || `Squad for ${compTitle}. ${commMethod === 'whatsapp' ? 'Message me on WhatsApp if you want to team up!' : 'Apply via OneStop to team up!'}`,
      college: creatorCollege,
      year: creatorYear,
      lead: creatorName,
      created_by_name: creatorName
    });

    if (onSuccess) onSuccess();
    onClose();
  };

  const userInitial = (profile?.name || 'U').charAt(0).toUpperCase();
  const userName = profile?.name || 'Collegiate Lead';
  const userCollege = profile?.college || '';
  const userYear = normalizeYear(profile?.year || profile?.batch || '');

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box'
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(26, 26, 25, 0.35)'
        }}
      />

      {/* Modal Dialog */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: 'min(560px, 100%)',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface, #FFFFFF)',
          border: '1px solid var(--line, #E7E6E2)',
          borderRadius: '14px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '18px 20px 16px',
            borderBottom: '1px solid var(--line, #E7E6E2)',
            flexShrink: 0
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--ink, #1A1A19)' }}>
              {editingPost ? 'Edit squad' : 'Post a squad'}
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--ink-muted, #75736C)' }}>
              People apply with a short note. You pick who joins.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: '32px',
              height: '32px',
              flex: 'none',
              border: '1px solid var(--line, #E7E6E2)',
              borderRadius: '8px',
              background: 'var(--surface-sunken, #F9F9F7)',
              color: 'var(--ink-secondary, #55534D)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '22px'
          }}
        >
          {formError && (
            <div
              style={{
                background: 'rgba(220, 38, 38, 0.10)',
                border: '1px solid rgba(220, 38, 38, 0.35)',
                borderRadius: '8px',
                padding: '9px 13px',
                fontSize: '13px',
                color: 'var(--urgency-red, #DC2626)',
                fontWeight: 500
              }}
            >
              {formError}
            </div>
          )}

          {/* 1. Competition Picker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink, #1A1A19)' }}>
                Competition
              </span>
              <button
                type="button"
                onClick={() => setCustom(!custom)}
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--primary, #0F3FFE)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {custom ? 'Pick from OneStop' : 'Not on OneStop?'}
              </button>
            </div>

            {!custom ? (
              <>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '9px',
                    border: '1px solid var(--line, #E7E6E2)',
                    borderRadius: '9px',
                    padding: '0 12px',
                    color: 'var(--ink-muted, #75736C)',
                    background: 'var(--surface, #FFFFFF)'
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.3-4.3"></path>
                  </svg>
                  <input
                    value={compQ}
                    onChange={(e) => {
                      setCompQ(e.target.value);
                      setPickerOpen(true);
                    }}
                    onFocus={() => setPickerOpen(true)}
                    placeholder="Search competitions"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      border: 0,
                      background: 'transparent',
                      padding: '10px 0',
                      fontSize: '14px',
                      color: 'var(--ink, #1A1A19)',
                      outline: 'none'
                    }}
                  />
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {visibleComps.length === 0 ? (
                    <div
                      style={{
                        padding: '16px 12px',
                        textAlign: 'center',
                        background: 'var(--surface-sunken, #F9F9F7)',
                        borderRadius: '10px',
                        border: '1px dashed var(--line, #E7E6E2)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink-muted, #75736C)' }}>
                        {compQ.trim() ? `No team competitions found matching "${compQ.trim()}".` : 'No team competitions found.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setCustom(true);
                          if (compQ.trim()) setCustomTitle(compQ.trim());
                          setFormError('');
                        }}
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: 'var(--primary, #0F3FFE)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px 6px',
                          textDecoration: 'underline'
                        }}
                      >
                        Not on OneStop? Enter details manually
                      </button>
                    </div>
                  ) : (
                    visibleComps.map((c) => {
                      const isSelected = String(selectedCompId) === String(c.id);
                      const inits = initialsOf(c.host || c.orgName || 'Host');
                      const dueStr = formatDueText(c);
                      const teamInfo = c.team || (c.maxTeam ? `Teams of ${c.maxTeam}` : 'Teams of 2–4');

                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            if (showCollapsed) {
                              setPickerOpen(true);
                              return;
                            }
                            setSelectedCompId(String(c.id));
                            setCompQ('');
                            setPickerOpen(false);
                            setFormError('');
                          }}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '32px minmax(0, 1fr) auto',
                            gap: '10px',
                            alignItems: 'center',
                            textAlign: 'left',
                            border: isSelected ? '1px solid var(--primary, #0F3FFE)' : '1px solid var(--line, #E7E6E2)',
                            background: isSelected ? 'var(--primary-tint-7, rgba(15,63,254,0.07))' : 'var(--surface, #FFFFFF)',
                            borderRadius: '10px',
                            padding: '9px 11px',
                            cursor: 'pointer',
                            transition: 'border-color 0.15s ease'
                          }}
                        >
                          <InstitutionLogo
                            name={c.host || c.orgName}
                            title={c.title}
                            logo={c.logo || c.orgLogo}
                            size={32}
                            borderRadius={8}
                          />
                          <span style={{ minWidth: 0, lineHeight: 1.3 }}>
                            <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--ink, #1A1A19)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c.title}
                            </span>
                            <span style={{ display: 'block', fontSize: '12px', color: 'var(--ink-muted, #75736C)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c.host || c.orgName || 'Organizer'} · {teamInfo}
                            </span>
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--ink-muted, #75736C)', whiteSpace: 'nowrap' }}>
                            {dueStr}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Competition name *"
                  style={{
                    border: '1px solid var(--line, #E7E6E2)',
                    borderRadius: '9px',
                    padding: '10px 12px',
                    fontSize: '14px',
                    background: 'var(--surface, #FFFFFF)',
                    color: 'var(--ink, #1A1A19)',
                    outline: 'none'
                  }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    value={customHost}
                    onChange={(e) => setCustomHost(e.target.value)}
                    placeholder="Organiser"
                    style={{
                      minWidth: 0,
                      border: '1px solid var(--line, #E7E6E2)',
                      borderRadius: '9px',
                      padding: '10px 12px',
                      fontSize: '14px',
                      background: 'var(--surface, #FFFFFF)',
                      color: 'var(--ink, #1A1A19)',
                      outline: 'none'
                    }}
                  />
                  <input
                    value={customLink}
                    onChange={(e) => setCustomLink(e.target.value)}
                    placeholder="Link (optional)"
                    style={{
                      minWidth: 0,
                      border: '1px solid var(--line, #E7E6E2)',
                      borderRadius: '9px',
                      padding: '10px 12px',
                      fontSize: '14px',
                      background: 'var(--surface, #FFFFFF)',
                      color: 'var(--ink, #1A1A19)',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Team size and Open spots steppers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink, #1A1A19)' }}>
                Team size
              </span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid var(--line, #E7E6E2)',
                  borderRadius: '9px',
                  padding: '4px',
                  background: 'var(--surface, #FFFFFF)'
                }}
              >
                <button
                  type="button"
                  onClick={decTotal}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '7px',
                    background: 'var(--surface-muted, #F2F1ED)',
                    color: 'var(--ink, #1A1A19)',
                    fontSize: '17px',
                    fontWeight: 500,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  −
                </button>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink, #1A1A19)' }}>
                  {total}
                </span>
                <button
                  type="button"
                  onClick={incTotal}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '7px',
                    background: 'var(--surface-muted, #F2F1ED)',
                    color: 'var(--ink, #1A1A19)',
                    fontSize: '17px',
                    fontWeight: 500,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  +
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink, #1A1A19)' }}>
                Open spots
              </span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid var(--line, #E7E6E2)',
                  borderRadius: '9px',
                  padding: '4px',
                  background: 'var(--surface, #FFFFFF)'
                }}
              >
                <button
                  type="button"
                  onClick={decOpen}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '7px',
                    background: 'var(--surface-muted, #F2F1ED)',
                    color: 'var(--ink, #1A1A19)',
                    fontSize: '17px',
                    fontWeight: 500,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  −
                </button>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--ink, #1A1A19)' }}>
                  {open}
                </span>
                <button
                  type="button"
                  onClick={incOpen}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '7px',
                    background: 'var(--surface-muted, #F2F1ED)',
                    color: 'var(--ink, #1A1A19)',
                    fontSize: '17px',
                    fontWeight: 500,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* 3. Skills needed in the team */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink, #1A1A19)' }}>
                Skills needed in the team
              </span>
              <span style={{ fontSize: '12px', color: 'var(--ink-muted, #75736C)' }}>
                {want.length > 0 ? `${want.length} selected` : 'Select skills needed'}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {SKILLS.map((sk) => {
                const on = want.includes(sk);
                return (
                  <button
                    key={sk}
                    type="button"
                    onClick={() => toggleWant(sk)}
                    style={{
                      border: on ? '1px solid var(--primary, #0F3FFE)' : '1px solid var(--line, #E7E6E2)',
                      borderRadius: '20px',
                      background: on ? 'var(--primary, #0F3FFE)' : 'var(--surface, #FFFFFF)',
                      color: on ? '#FFFFFF' : 'var(--ink, #1A1A19)',
                      padding: '5px 12px',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {sk}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Note to applicants */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink, #1A1A19)' }}>
                Note to applicants
              </span>
              <span style={{ fontSize: '12px', color: 'var(--ink-muted, #75736C)' }}>Optional</span>
            </div>
            <textarea
              rows="3"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What you're aiming for, how you'll work, when you meet."
              style={{
                border: '1px solid var(--line, #E7E6E2)',
                borderRadius: '9px',
                padding: '10px 12px',
                fontSize: '14px',
                lineHeight: 1.5,
                background: 'var(--surface, #FFFFFF)',
                color: 'var(--ink, #1A1A19)',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* 5. Communication Preference & WhatsApp number */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink, #1A1A19)' }}>
              Preferred communication channel
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setCommMethod('whatsapp')}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: commMethod === 'whatsapp' ? '2px solid #25D366' : '1px solid var(--line, #E7E6E2)',
                  background: commMethod === 'whatsapp' ? 'rgba(37, 211, 102, 0.08)' : 'var(--surface, #FFFFFF)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <div style={{ width: '24px', height: '24px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.276-.101-.477-.15-.678.15-.201.3-.778.978-.954 1.179-.176.2-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.896-.799-1.501-1.786-1.677-2.087-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.201-.3.301-.501.101-.2.05-.376-.025-.526-.075-.15-.678-1.635-.929-2.239-.245-.588-.493-.508-.678-.518l-.578-.01c-.2 0-.527.075-.803.376-.276.301-1.054 1.03-1.054 2.512s1.079 2.913 1.23 3.114c.15.201 2.124 3.243 5.145 4.549.719.31 1.281.496 1.719.635.722.23 1.379.197 1.9.12.58-.087 1.78-.727 2.03-1.43.251-.703.251-1.305.176-1.43-.075-.126-.276-.201-.577-.352z"></path><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.982-1.396A9.957 9.957 0 0 0 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.167c-1.614 0-3.12-.486-4.383-1.323l-.314-.207-2.955.828.84-2.88-.204-.325A8.134 8.134 0 0 1 3.833 12c0-4.503 3.664-8.167 8.167-8.167s8.167 3.664 8.167 8.167-3.664 8.167-8.167 8.167z"></path></svg>
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink, #1A1A19)' }}>WhatsApp</div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-muted, #75736C)' }}>Share your profile number</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCommMethod('chat')}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: commMethod === 'chat' ? '2px solid #0F3FFE' : '1px solid var(--line, #E7E6E2)',
                  background: commMethod === 'chat' ? 'rgba(15, 63, 254, 0.08)' : 'var(--surface, #FFFFFF)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <div style={{ width: '24px', height: '24px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F3FFE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path></svg>
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink, #1A1A19)' }}>OneStop Chat</div>
                  <div style={{ fontSize: '11px', color: 'var(--ink-muted, #75736C)' }}>Number stays private</div>
                </div>
              </button>
            </div>

            {commMethod === 'whatsapp' ? (
              <div style={{ padding: '8px 12px', background: 'rgba(37, 211, 102, 0.08)', borderRadius: '8px', border: '1px solid rgba(37, 211, 102, 0.30)', fontSize: '12px', color: 'var(--ink-secondary, #55534D)', lineHeight: 1.45, marginTop: '4px' }}>
                Signed-in users can message you on the WhatsApp number on your profile{validProfilePhone ? ` (${profilePhone})` : ''}. You'll also see the number of everyone who requests to join. No in-app chat.
              </div>
            ) : (
              <div style={{ padding: '8px 12px', background: 'rgba(15, 63, 254, 0.06)', borderRadius: '8px', border: '1px solid rgba(15, 63, 254, 0.18)', fontSize: '12px', color: 'var(--primary, #0F3FFE)', lineHeight: 1.45, marginTop: '4px' }}>
                🔒 People request to chat. You approve who you talk to. Nobody's phone number is shown, including yours.
              </div>
            )}
          </div>

          {/* 6. Posting as banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'var(--surface-sunken, #F9F9F7)',
              border: '1px solid var(--line-lighter, #EFEEEA)',
              borderRadius: '9px',
              padding: '9px 11px'
            }}
          >
            <span
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'var(--surface-muted, #F2F1ED)',
                color: 'var(--ink-secondary, #55534D)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 700,
                flex: 'none'
              }}
            >
              {userInitial}
            </span>
            <span style={{ flex: 1, fontSize: '12px', color: 'var(--ink-secondary, #55534D)' }}>
              Posting as <strong style={{ color: 'var(--ink, #1A1A19)' }}>{userName}</strong> · {userCollege} · {userYear}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '14px 20px calc(14px + var(--sab, 0px))',
            borderTop: '1px solid var(--line, #E7E6E2)',
            background: 'var(--surface, #FFFFFF)',
            flexShrink: 0
          }}

        >
          <span style={{ fontSize: '12px', color: 'var(--ink-muted, #75736C)' }}>
            {open} open of {total}
          </span>
          {editingPost && onDeletePost && (
            <button
              type="button"
              onClick={() => {
                const compName = editingPost.comp?.title || editingPost.competition_name || editingPost.title || 'this squad';
                if (window.confirm(`Are you sure you want to delete your squad listing for "${compName}"? This action cannot be undone.`)) {
                  onDeletePost(editingPost.id);
                  onClose();
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                border: '1px solid rgba(220, 38, 38, 0.25)',
                borderRadius: '9px',
                background: 'rgba(220, 38, 38, 0.05)',
                color: '#DC2626',
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                marginLeft: '8px'
              }}
              title="Delete squad listing"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              <span>Delete squad</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            style={{
              marginLeft: 'auto',
              border: '1px solid var(--line, #E7E6E2)',
              borderRadius: '9px',
              background: 'var(--surface, #FFFFFF)',
              color: 'var(--ink, #1A1A19)',
              padding: '9px 14px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            style={{
              border: '1px solid var(--primary, #0F3FFE)',
              borderRadius: '9px',
              background: 'var(--primary, #0F3FFE)',
              color: '#FFFFFF',
              padding: '9px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
          >
            {editingPost ? 'Save changes' : 'Post squad'}
          </button>
        </div>
      </div>
    </div>
  );
}
