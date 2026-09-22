// src/components/PostSquadModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { SKILLS } from '../data/initialData';
import { sanitizeIndianPhone } from '../context/AuthContext';
import SearchableCollegeSelect from './SearchableCollegeSelect';
import { YEAR_OPTIONS, normalizeYear } from '../data/colleges';
import InstitutionLogo from './InstitutionLogo';

export default function PostSquadModal({
  isOpen,
  onClose,
  competitions = [],
  initialCompId = null,
  editingPost = null,
  profile = null,
  onSubmitPost
}) {
  const [mode, setMode] = useState('unstop'); // 'unstop' | 'custom'
  const [selectedCompId, setSelectedCompId] = useState('');
  const [compSearch, setCompSearch] = useState('');

  // Custom competition fields
  const [customTitle, setCustomTitle] = useState('');
  const [customHost, setCustomHost] = useState('');
  const [customLink, setCustomLink] = useState('');

  // Squad details
  const [spots, setSpots] = useState('2');
  const [totalMembers, setTotalMembers] = useState('4');
  const [skillsLooking, setSkillsLooking] = useState([]);
  const [skillsHave, setSkillsHave] = useState([]);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [desc, setDesc] = useState('');
  const [phone, setPhone] = useState('');
  const [college, setCollege] = useState('');
  const [year, setYear] = useState('UG 2nd Year');

  const [formError, setFormError] = useState('');

  // Populate draft on open / edit
  useEffect(() => {
    if (!isOpen) return;
    setFormError('');

    if (editingPost) {
      // Editing mode
      const isLiveComp = competitions.some(c => String(c.id) === String(editingPost.compId));
      if (isLiveComp) {
        setMode('unstop');
        setSelectedCompId(String(editingPost.compId));
      } else {
        setMode('custom');
        setCustomTitle(editingPost.competition_name || editingPost.title || '');
        setCustomHost(editingPost.organizer || '');
        setCustomLink(editingPost.competition_link || '');
      }

      setSpots(String(editingPost.spots_left !== undefined ? editingPost.spots_left : (editingPost.spots || 1)));
      setTotalMembers(String(editingPost.total_members || editingPost.size || 4));
      setSkillsLooking(Array.isArray(editingPost.skills_looking_for) ? editingPost.skills_looking_for : (editingPost.want || []));
      setSkillsHave(Array.isArray(editingPost.skills_have) ? editingPost.skills_have : []);
      setDesc(editingPost.description || editingPost.desc || '');
      setPhone(sanitizeIndianPhone(editingPost.phone_number || editingPost.phone || profile?.phone || ''));
      setCollege(editingPost.college || profile?.college || '');
      setYear(normalizeYear(editingPost.year || profile?.year || profile?.batch || 'UG 2nd Year'));
    } else {
      // Creating new
      if (initialCompId) {
        setMode('unstop');
        setSelectedCompId(String(initialCompId));
      } else if (competitions.length > 0 && !selectedCompId) {
        setMode('unstop');
        setSelectedCompId(String(competitions[0].id));
      }

      setCustomTitle('');
      setCustomHost('');
      setCustomLink('');
      setSpots('2');
      setTotalMembers('4');
      setSkillsLooking([]);
      setSkillsHave([]);
      setDesc('');
      setPhone(sanitizeIndianPhone(profile?.phone || ''));
      setCollege(profile?.college || '');
      setYear(normalizeYear(profile?.year || profile?.batch || 'UG 2nd Year'));
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

  const filteredComps = useMemo(() => {
    if (!compSearch.trim()) return competitions.slice(0, 40);
    const q = compSearch.toLowerCase().trim();
    return competitions.filter(c =>
      (c.title || '').toLowerCase().includes(q) ||
      (c.host || '').toLowerCase().includes(q)
    ).slice(0, 40);
  }, [competitions, compSearch]);

  if (!isOpen) return null;

  const toggleSkillLooking = (skill) => {
    setSkillsLooking(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const toggleSkillHave = (skill) => {
    setSkillsHave(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const handleAddCustomSkill = (targetType) => {
    const trimmed = customSkillInput.trim();
    if (!trimmed) return;
    if (targetType === 'looking' && !skillsLooking.includes(trimmed)) {
      setSkillsLooking(prev => [...prev, trimmed]);
    } else if (targetType === 'have' && !skillsHave.includes(trimmed)) {
      setSkillsHave(prev => [...prev, trimmed]);
    }
    setCustomSkillInput('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    let compTitle = '';
    let compHost = '';
    let compLink = '';
    let compLogo = editingPost?.compLogo || editingPost?.logo || null;
    let finalCompId = null;

    if (mode === 'unstop') {
      const match = competitions.find(c => String(c.id) === String(selectedCompId));
      if (!match) {
        setFormError('Please select a competition from the list or switch to Custom Competition.');
        return;
      }
      compTitle = match.title;
      compHost = match.host || match.orgName || '';
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
      setFormError('Compulsory WhatsApp number: Please enter a valid 10-digit Indian phone number.');
      return;
    }

    const spotsNum = Math.max(1, parseInt(spots, 10) || 1);
    const totalNum = Math.max(spotsNum + 1, parseInt(totalMembers, 10) || (spotsNum + 1));

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
      spots: spotsNum,
      total_members: totalNum,
      skills: skillsLooking.length > 0 ? skillsLooking : ['Open to anyone'],
      skills_looking_for: skillsLooking.length > 0 ? skillsLooking : ['Open to anyone'],
      skills_have: skillsHave,
      desc: desc.trim() || `Building a squad for ${compTitle}. Looking for dedicated teammates.`,
      college: college.trim() || profile?.college || '',
      year: year,
    });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(26,26,25,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 60
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(540px, 100%)',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: '#FFFFFF',
          border: '1px solid #E7E6E2',
          borderRadius: '14px',
          boxShadow: '0 20px 40px rgba(26,26,25,0.18)'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '16px 20px',
            borderBottom: '1px solid #E7E6E2',
            position: 'sticky',
            top: 0,
            background: '#FFFFFF',
            zIndex: 2
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#1A1A19' }}>
              {editingPost ? 'Edit squad listing' : 'Post a squad'}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#75736C' }}>
              SSCBS OS Teammate Matching Engine · Open for all colleges & universities
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
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

        {/* Error Alert */}
        {formError && (
          <div
            style={{
              margin: '14px 20px 0',
              padding: '10px 14px',
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#B91C1C',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>⚠️</span>
            <span>{formError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Mode Switcher */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#1A1A19', display: 'block', marginBottom: '6px' }}>
              Competition Source
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', background: '#F6F6F4', padding: '3px', borderRadius: '9px' }}>
              <button
                type="button"
                onClick={() => setMode('unstop')}
                style={{
                  border: 0,
                  borderRadius: '7px',
                  background: mode === 'unstop' ? '#FFFFFF' : 'transparent',
                  color: mode === 'unstop' ? '#0F3FFE' : '#55534D',
                  fontWeight: mode === 'unstop' ? 700 : 500,
                  padding: '8px 10px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: mode === 'unstop' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                Live Unstop List ({competitions.length})
              </button>
              <button
                type="button"
                onClick={() => setMode('custom')}
                style={{
                  border: 0,
                  borderRadius: '7px',
                  background: mode === 'custom' ? '#FFFFFF' : 'transparent',
                  color: mode === 'custom' ? '#0F3FFE' : '#55534D',
                  fontWeight: mode === 'custom' ? 700 : 500,
                  padding: '8px 10px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: mode === 'custom' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                + Custom Competition
              </button>
            </div>
          </div>

          {/* Unstop Selection */}
          {mode === 'unstop' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#1A1A19' }}>Select Competition</span>
              <input
                type="text"
                placeholder="Type to filter competitions..."
                value={compSearch}
                onChange={(e) => setCompSearch(e.target.value)}
                style={{
                  border: '1px solid #E7E6E2',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  marginBottom: '4px'
                }}
              />
              <select
                value={selectedCompId}
                onChange={(e) => setSelectedCompId(e.target.value)}
                style={{
                  border: '1px solid #E7E6E2',
                  borderRadius: '9px',
                  background: '#FFFFFF',
                  padding: '10px 12px',
                  fontSize: '14px',
                  color: '#1A1A19',
                  width: '100%'
                }}
              >
                {filteredComps.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} — {c.host || c.orgName}
                  </option>
                ))}
              </select>

              {selectedCompId && (() => {
                const sel = competitions.find(c => String(c.id) === String(selectedCompId));
                if (!sel) return null;
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', background: '#F8F8F6', borderRadius: '8px', border: '1px solid #EFEEEA', marginTop: '4px' }}>
                    <InstitutionLogo logo={sel.logo || sel.orgLogo} name={sel.host || sel.orgName} size={28} borderRadius={6} fontSize={10} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A19', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sel.title}
                      </div>
                      <div style={{ fontSize: '11px', color: '#75736C' }}>
                        {sel.host || sel.orgName}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#1A1A19' }}>Competition Name *</span>
                <input
                  type="text"
                  placeholder="e.g. HUL L.I.M.E, Harvard Case Competition, Local Hackathon..."
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  style={{
                    border: '1px solid #E7E6E2',
                    borderRadius: '8px',
                    padding: '9px 12px',
                    fontSize: '14px'
                  }}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: '#75736C' }}>Organizer / Host</span>
                  <input
                    type="text"
                    placeholder="e.g. IIM Bangalore, Bain & Co..."
                    value={customHost}
                    onChange={(e) => setCustomHost(e.target.value)}
                    style={{
                      border: '1px solid #E7E6E2',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '13px'
                    }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: '#75736C' }}>Competition URL</span>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={customLink}
                    onChange={(e) => setCustomLink(e.target.value)}
                    style={{
                      border: '1px solid #E7E6E2',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '13px'
                    }}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Spots & Total Members */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#1A1A19' }}>Open Spots Needed</span>
              <input
                type="number"
                min="1"
                max="8"
                value={spots}
                onChange={(e) => setSpots(e.target.value)}
                style={{
                  border: '1px solid #E7E6E2',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  fontSize: '14px'
                }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#1A1A19' }}>Total Squad Size</span>
              <input
                type="number"
                min="2"
                max="10"
                value={totalMembers}
                onChange={(e) => setTotalMembers(e.target.value)}
                style={{
                  border: '1px solid #E7E6E2',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  fontSize: '14px'
                }}
              />
            </label>
          </div>

          {/* Skills Looking For */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#1A1A19' }}>Skills Needed (Looking for)</span>
              <span style={{ fontSize: '11px', color: '#75736C' }}>{skillsLooking.length} selected</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {SKILLS.map((skill) => {
                const on = skillsLooking.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkillLooking(skill)}
                    style={{
                      border: `1px solid ${on ? '#0F3FFE' : '#E7E6E2'}`,
                      borderRadius: '20px',
                      background: on ? '#0F3FFE' : '#FFFFFF',
                      color: on ? '#FFFFFF' : '#1A1A19',
                      padding: '5px 12px',
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

            {/* Custom Skill Input */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
              <input
                type="text"
                placeholder="Add custom skill needed..."
                value={customSkillInput}
                onChange={(e) => setCustomSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomSkill('looking');
                  }
                }}
                style={{
                  flex: 1,
                  border: '1px solid #E7E6E2',
                  borderRadius: '8px',
                  padding: '7px 11px',
                  fontSize: '12px'
                }}
              />
              <button
                type="button"
                onClick={() => handleAddCustomSkill('looking')}
                style={{
                  border: '1px solid #E7E6E2',
                  borderRadius: '8px',
                  background: '#F6F6F4',
                  color: '#1A1A19',
                  padding: '7px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                + Add
              </button>
            </div>
          </div>

          {/* Skills Host Brings */}
          <div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#1A1A19', display: 'block', marginBottom: '6px' }}>
              Skills You Bring (Optional)
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {SKILLS.slice(0, 8).map((skill) => {
                const on = skillsHave.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkillHave(skill)}
                    style={{
                      border: `1px solid ${on ? '#15803D' : '#E7E6E2'}`,
                      borderRadius: '20px',
                      background: on ? '#15803D' : '#FFFFFF',
                      color: on ? '#FFFFFF' : '#1A1A19',
                      padding: '5px 12px',
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
          </div>

          {/* Description */}
          <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#1A1A19' }}>Pitch & Approach</span>
            <textarea
              rows="3"
              placeholder="What are your goals, work style, or past competition experience?"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              style={{
                border: '1px solid #E7E6E2',
                borderRadius: '8px',
                padding: '9px 12px',
                fontSize: '13px',
                lineHeight: 1.5
              }}
            />
          </label>

          {/* WhatsApp Phone & College */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#1A1A19' }}>
                WhatsApp Number *
              </span>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: '10px', fontSize: '13px', color: '#75736C', fontWeight: 500 }}>
                  +91
                </span>
                <input
                  type="tel"
                  placeholder="9876543210"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  style={{
                    width: '100%',
                    border: '1px solid #E7E6E2',
                    borderRadius: '8px',
                    padding: '9px 12px 9px 42px',
                    fontSize: '14px',
                    fontFamily: 'monospace'
                  }}
                />
              </div>
              <span style={{ fontSize: '11px', color: '#75736C' }}>Shared with teammates once accepted</span>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#1A1A19' }}>Host College</span>
              <input
                type="text"
                placeholder="e.g. SSCBS, SRCC, IIT Delhi..."
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                style={{
                  border: '1px solid #E7E6E2',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  fontSize: '13px'
                }}
              />
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            style={{
              marginTop: '4px',
              border: '1px solid #0F3FFE',
              borderRadius: '9px',
              background: '#0F3FFE',
              color: '#FFFFFF',
              padding: '13px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'background 120ms ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#0C33CC')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#0F3FFE')}
          >
            {editingPost ? 'Save changes' : 'Post squad'}
          </button>
        </form>
      </div>
    </div>
  );
}
