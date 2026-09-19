// src/components/PostSquadModal.jsx
import React, { useState, useEffect } from 'react';
import { SKILLS } from '../data/initialData';

export default function PostSquadModal({
  isOpen,
  onClose,
  competitions = [],
  initialCompId = null,
  onSubmitPost
}) {
  const [compId, setCompId] = useState(initialCompId || (competitions[0]?.id || 1));
  const [spots, setSpots] = useState('2');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [desc, setDesc] = useState('');

  useEffect(() => {
    if (initialCompId) {
      setCompId(initialCompId);
    } else if (competitions.length > 0 && !compId) {
      setCompId(competitions[0].id);
    }
  }, [initialCompId, competitions, compId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleSkill = (skill) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const spotsNum = parseInt(spots, 10) || 1;
    onSubmitPost({
      compId: Number(compId),
      spots: spotsNum,
      skills: selectedSkills.length > 0 ? selectedSkills : ['Open to anyone'],
      desc: desc.trim() || 'Looking for collaborators to compete together.'
    });
    // Reset draft
    setSpots('2');
    setSelectedSkills([]);
    setDesc('');
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(26,26,25,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        zIndex: 55
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(460px, 100%)',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#FFFFFF',
          border: '1px solid #E7E6E2',
          borderRadius: '14px'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '15px 20px',
            borderBottom: '1px solid #E7E6E2'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1A1A19' }}>Post a squad</h2>
          <button
            onClick={onClose}
            style={{
              border: '1px solid #E7E6E2',
              borderRadius: '8px',
              background: '#FFFFFF',
              color: '#75736C',
              width: '30px',
              height: '30px',
              cursor: 'pointer',
              fontSize: '14px',
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F2F1ED';
              e.currentTarget.style.color = '#1A1A19';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FFFFFF';
              e.currentTarget.style.color = '#75736C';
            }}
          >
            ×
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#75736C' }}>Competition</span>
            <select
              value={compId}
              onChange={(e) => setCompId(e.target.value)}
              style={{
                border: '1px solid #E7E6E2',
                borderRadius: '9px',
                background: '#FFFFFF',
                padding: '10px 12px',
                fontSize: '14px',
                color: '#1A1A19'
              }}
            >
              {competitions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#75736C' }}>Spots open</span>
            <input
              value={spots}
              onChange={(e) => setSpots(e.target.value)}
              placeholder="2"
              type="number"
              min="1"
              max="10"
              style={{
                border: '1px solid #E7E6E2',
                borderRadius: '9px',
                background: '#FFFFFF',
                padding: '10px 12px',
                fontSize: '14px',
                color: '#1A1A19'
              }}
            />
          </label>

          <div>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#75736C' }}>Skills you need</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginTop: '8px' }}>
              {SKILLS.map((skill) => {
                const on = selectedSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
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
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#75736C' }}>What you are building</span>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows="3"
              placeholder="Two lines on the approach and what you want from a teammate."
              style={{
                border: '1px solid #E7E6E2',
                borderRadius: '9px',
                background: '#FFFFFF',
                padding: '10px 12px',
                fontSize: '14px',
                lineHeight: 1.5,
                color: '#1A1A19'
              }}
            />
          </label>

          <button
            type="submit"
            style={{
              marginTop: '6px',
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
            Post squad
          </button>
        </form>
      </div>
    </div>
  );
}
