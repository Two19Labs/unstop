// src/components/ProfileScreen.jsx
import React, { useState, useEffect } from 'react';
import { SKILLS } from '../data/initialData';

export default function ProfileScreen({
  profile,
  onSaveProfile,
  user,
  onOpenAuthModal,
  onSignOut
}) {
  const [name, setName] = useState(profile?.name || '');
  const [college, setCollege] = useState(profile?.college || '');
  const [course, setCourse] = useState(profile?.course || '');
  const [batch, setBatch] = useState(profile?.batch || '2027');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [skills, setSkills] = useState(profile?.skills || []);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setCollege(profile.college || '');
      setCourse(profile.course || '');
      setBatch(profile.batch || '2027');
      setPhone(profile.phone || '');
      setSkills(profile.skills || []);
    }
  }, [profile]);

  const toggleSkill = (skill) => {
    setSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSaveProfile({
      name: name.trim() || 'Student',
      college: college.trim() || 'College',
      course: course.trim() || 'Degree',
      batch: batch.trim() || '2027',
      phone: phone.trim(),
      skills
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2400);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '17px', maxWidth: '620px' }}>
      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: '25px', fontWeight: 700, letterSpacing: '-0.02em', color: '#1A1A19' }}>
          Profile
        </h1>
        <p style={{ margin: '7px 0 0', fontSize: '14px', color: '#75736C' }}>
          Squad leads see this when you apply. Skills drive what gets recommended to you.
        </p>
      </div>

      {/* Profile Form Card */}
      <form
        onSubmit={handleSave}
        style={{
          background: '#FFFFFF',
          border: '1px solid #E7E6E2',
          borderRadius: '12px',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}
      >
        {/* Fields Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '13px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#75736C' }}>Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
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

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#75736C' }}>College</span>
            <input
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              placeholder="College name"
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

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#75736C' }}>Course</span>
            <input
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="e.g. B.Com (H), B.Tech, BMS"
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

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#75736C' }}>Graduating batch</span>
            <input
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              placeholder="2027"
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
        </div>

        {/* Skills Multi-select */}
        <div>
          <span style={{ fontSize: '12px', fontWeight: 500, color: '#75736C' }}>Skills</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginTop: '8px' }}>
            {SKILLS.map((skill) => {
              const on = skills.includes(skill);
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

        {/* WhatsApp Phone */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: 500, color: '#75736C' }}>WhatsApp number</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98••• ••210"
            style={{
              border: '1px solid #E7E6E2',
              borderRadius: '9px',
              background: '#FFFFFF',
              padding: '10px 12px',
              fontSize: '14px',
              color: '#1A1A19'
            }}
          />
          <span style={{ fontSize: '12px', color: '#75736C' }}>Shared only after a lead accepts you.</span>
        </label>

        {/* Action Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
          <button
            type="submit"
            style={{
              border: '1px solid #0F3FFE',
              borderRadius: '9px',
              background: '#0F3FFE',
              color: '#FFFFFF',
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'background 120ms ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#0C33CC')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#0F3FFE')}
          >
            Save changes
          </button>

          {savedSuccess && (
            <span style={{ fontSize: '13px', color: '#15803D', fontWeight: 500 }}>
              ✓ Profile saved
            </span>
          )}
        </div>
      </form>

      {/* Account / Cloud Sync Card */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E7E6E2',
          borderRadius: '12px',
          padding: '16px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A19' }}>
            {user ? 'Cloud Sync Active' : 'Guest Mode'}
          </div>
          <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#75736C' }}>
            {user
              ? `Signed in as ${user.email} · bookmarks & squad posts synced`
              : 'Sign in to sync bookmarks and squad applications across devices.'}
          </p>
        </div>

        <div>
          {user ? (
            <button
              onClick={onSignOut}
              style={{
                border: '1px solid #E7E6E2',
                borderRadius: '8px',
                background: '#FFFFFF',
                color: '#55534D',
                padding: '7px 12px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F2F1ED')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
            >
              Sign out
            </button>
          ) : (
            <button
              onClick={onOpenAuthModal}
              style={{
                border: '1px solid #0F3FFE',
                borderRadius: '8px',
                background: '#0F3FFE',
                color: '#FFFFFF',
                padding: '7px 14px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#0C33CC')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#0F3FFE')}
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
