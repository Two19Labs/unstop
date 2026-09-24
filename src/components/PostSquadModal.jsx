// src/components/PostSquadModal.jsx
// Redesigned Post a Squad / Edit Squad Modal according to OneStop Team Finder handoff
import React, { useState, useEffect, useMemo } from 'react';
import { SKILLS, initialsOf } from '../data/initialData';
import { sanitizeIndianPhone } from '../context/AuthContext';
import { normalizeYear } from '../data/colleges';

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

export default function PostSquadModal({
  isOpen,
  onClose,
  competitions = [],
  initialCompId = null,
  editingPost = null,
  profile = null,
  onSubmitPost,
  onSuccess
}) {
  const [custom, setCustom] = useState(false);
  const [compQ, setCompQ] = useState('');
  const [selectedCompId, setSelectedCompId] = useState('');

  // Custom competition fields
  const [customTitle, setCustomTitle] = useState('');
  const [customHost, setCustomHost] = useState('');
  const [customLink, setCustomLink] = useState('');

  // Squad steppers
  const [total, setTotal] = useState(4);
  const [open, setOpen] = useState(2);

  // Skill toggles
  const [want, setWant] = useState([]);
  const [have, setHave] = useState([]);

  // Note to applicants
  const [note, setNote] = useState('');

  // WhatsApp phone
  const [phone, setPhone] = useState('');

  const [formError, setFormError] = useState('');

  // Pre-fill fields on open / edit
  useEffect(() => {
    if (!isOpen) return;
    setFormError('');

    if (editingPost) {
      const matchComp = competitions.find(c => String(c.id) === String(editingPost.compId));
      if (matchComp) {
        setCustom(false);
        setSelectedCompId(String(editingPost.compId));
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
      const brings = Array.isArray(editingPost.skills_have)
        ? editingPost.skills_have
        : (Array.isArray(editingPost.have) ? editingPost.have : []);

      setWant(looking);
      setHave(brings);
      setNote(editingPost.description || editingPost.desc || '');
      setPhone(sanitizeIndianPhone(editingPost.phone_number || editingPost.phone || editingPost.leadPhone || profile?.phone || ''));
    } else {
      if (initialCompId) {
        setCustom(false);
        setSelectedCompId(String(initialCompId));
      } else if (competitions.length > 0 && !selectedCompId) {
        setCustom(false);
        setSelectedCompId(String(competitions[0].id));
      } else {
        setCustom(false);
      }

      setCustomTitle('');
      setCustomHost('');
      setCustomLink('');
      setTotal(4);
      setOpen(2);
      setWant([]);
      setHave([]);
      setNote('');
      setPhone(sanitizeIndianPhone(profile?.phone || ''));
    }
  }, [isOpen, editingPost, initialCompId, competitions, profile]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter top 4 Unstop competitions for picker
  const filteredComps = useMemo(() => {
    if (!compQ.trim()) return competitions.slice(0, 4);
    const q = compQ.trim().toLowerCase();
    return competitions
      .filter(c => (c.title || '').toLowerCase().includes(q) || (c.host || c.orgName || '').toLowerCase().includes(q))
      .slice(0, 4);
  }, [competitions, compQ]);

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

  const toggleHave = (skill) => {
    if (have.includes(skill)) {
      setHave(have.filter(s => s !== skill));
    } else {
      setHave([...have, skill]);
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

    if (!custom) {
      const match = competitions.find(c => String(c.id) === String(selectedCompId));
      if (!match) {
        setFormError('Please select a competition from the Unstop list or switch to "Not on Unstop?".');
        return;
      }
      compTitle = match.title;
      compHost = match.host || match.orgName || 'Organizer';
      compLink = match.unstopUrl || '';
      finalCompId = match.id;
      compLogo = match.logo || match.orgLogo || null;
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

    const cleanPhone = sanitizeIndianPhone(phone);
    if (!cleanPhone || cleanPhone.length !== 10) {
      setFormError('Please enter a valid 10-digit WhatsApp number.');
      return;
    }

    const creatorName = profile?.name || 'Aarav Mehta';
    const creatorCollege = profile?.college || 'SRCC';
    const creatorYear = normalizeYear(profile?.year || profile?.batch || 'UG 2nd Year');

    onSubmitPost({
      isEdit: Boolean(editingPost),
      postId: editingPost?.id,
      compId: finalCompId,
      competition_name: compTitle,
      organizer: compHost,
      compLogo,
      logo: compLogo,
      competition_link: compLink,
      phone_number: cleanPhone,
      leadPhone: cleanPhone,
      spots: open,
      spots_left: open,
      total_members: total,
      size: total,
      want,
      skills: want.length > 0 ? want : ['All skills welcome'],
      skills_looking_for: want.length > 0 ? want : ['All skills welcome'],
      have,
      skills_have: have,
      desc: note.trim() || `Squad for ${compTitle}. Message me on WhatsApp if you want to team up!`,
      description: note.trim() || `Squad for ${compTitle}. Message me on WhatsApp if you want to team up!`,
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
  const userCollege = profile?.college || 'SRCC';
  const userYear = normalizeYear(profile?.year || profile?.batch || 'UG 2nd Year');

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
                {custom ? 'Pick from Unstop' : 'Not on Unstop?'}
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
                    onChange={(e) => setCompQ(e.target.value)}
                    placeholder="Search competitions on Unstop"
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
                  {filteredComps.map((c) => {
                    const isSelected = String(selectedCompId) === String(c.id);
                    const inits = initialsOf(c.host || c.orgName || 'Host');
                    const dueStr = formatDueText(c);
                    const teamInfo = c.team || (c.maxTeam ? `Teams of ${c.maxTeam}` : 'Teams of 2–4');

                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCompId(String(c.id));
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
                        <span
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            border: '1px solid var(--line-lighter, #EFEEEA)',
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
                          {inits}
                        </span>
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
                  })}
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

          {/* 3. Skill Pill Groups */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink, #1A1A19)' }}>
                Looking for
              </span>
              <span style={{ fontSize: '12px', color: 'var(--ink-muted, #75736C)' }}>
                Pick up to 3 {want.length > 0 ? `(${want.length}/3)` : ''}
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink, #1A1A19)' }}>
                You bring
              </span>
              <span style={{ fontSize: '12px', color: 'var(--ink-muted, #75736C)' }}>
                Helps people decide
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {SKILLS.map((sk) => {
                const on = have.includes(sk);
                return (
                  <button
                    key={sk}
                    type="button"
                    onClick={() => toggleHave(sk)}
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

          {/* 5. WhatsApp number */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink, #1A1A19)' }}>
              WhatsApp number
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                border: '1px solid var(--line, #E7E6E2)',
                borderRadius: '9px',
                overflow: 'hidden',
                background: 'var(--surface, #FFFFFF)'
              }}
            >
              <span
                style={{
                  padding: '10px 12px',
                  background: 'var(--surface-sunken, #F9F9F7)',
                  borderRight: '1px solid var(--line, #E7E6E2)',
                  fontSize: '14px',
                  color: 'var(--ink-secondary, #55534D)',
                  fontWeight: 600
                }}
              >
                +91
              </span>
              <input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit number"
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: 0,
                  padding: '10px 12px',
                  fontSize: '14px',
                  background: 'transparent',
                  color: 'var(--ink, #1A1A19)',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </div>
            <span style={{ fontSize: '12px', color: 'var(--ink-muted, #75736C)' }}>
              Only shared with people you accept.
            </span>
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
            padding: '14px 20px',
            borderTop: '1px solid var(--line, #E7E6E2)',
            background: 'var(--surface, #FFFFFF)',
            flexShrink: 0
          }}
        >
          <span style={{ fontSize: '12px', color: 'var(--ink-muted, #75736C)' }}>
            {open} open of {total}
          </span>
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
