// src/components/ProfileScreen.jsx
import React, { useState, useEffect } from 'react';
import { SKILLS } from '../data/initialData';
import { YEAR_OPTIONS } from '../data/colleges';
import { useAuth } from '../context/AuthContext';
import SearchableCollegeSelect from './SearchableCollegeSelect';

export default function ProfileScreen({
  profile,
  onSaveProfile,
  user,
  onOpenAuthModal,
  onSignOut
}) {
  const { getProfileCooldown } = useAuth();
  const [name, setName] = useState(profile?.name || '');
  const [college, setCollege] = useState(profile?.college || '');
  const [year, setYear] = useState(() => {
    if (profile?.year && YEAR_OPTIONS.includes(profile.year)) return profile.year;
    if (profile?.batch && YEAR_OPTIONS.includes(profile.batch)) return profile.batch;
    if ((profile?.education_level || '').toLowerCase().includes('post')) return 'PG 1st Year';
    return 'UG 2nd Year';
  });
  const [phone, setPhone] = useState(profile?.phone || '');
  const [skills, setSkills] = useState(profile?.skills || []);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Live 24-Hour Cooldown
  const [cooldown, setCooldown] = useState(() => (getProfileCooldown ? getProfileCooldown(profile, user) : { isLocked: false }));

  useEffect(() => {
    if (!getProfileCooldown) return;
    setCooldown(getProfileCooldown(profile, user));
    const interval = setInterval(() => {
      setCooldown(getProfileCooldown(profile, user));
    }, 1000);
    return () => clearInterval(interval);
  }, [profile, user, getProfileCooldown]);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setCollege(profile.college || '');
      setPhone(profile.phone || '');
      setSkills(profile.skills || []);
      if (profile.year && YEAR_OPTIONS.includes(profile.year)) {
        setYear(profile.year);
      } else if (profile.batch && YEAR_OPTIONS.includes(profile.batch)) {
        setYear(profile.batch);
      } else if ((profile.education_level || '').toLowerCase().includes('post')) {
        setYear('PG 1st Year');
      } else {
        setYear('UG 2nd Year');
      }
    }
  }, [profile]);

  const toggleSkill = (skill) => {
    if (cooldown.isLocked) return;
    setSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const isPostgraduate = year.startsWith('PG');

  const handleSave = (e) => {
    e.preventDefault();
    if (cooldown.isLocked) return;
    onSaveProfile({
      name: name.trim() || 'Student',
      college: college.trim() || 'College',
      course: '', // removed per user request
      year: year,
      batch: year,
      education_level: isPostgraduate ? 'postgraduate' : 'undergraduate',
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

      {/* 24-Hour Cooldown Notice */}
      {cooldown.isLocked && (
        <div
          style={{
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            color: '#92400E'
          }}
        >
          <span style={{ fontSize: '16px' }}>🔒</span>
          <div>
            <strong>Profile edit locked:</strong> Details can only be updated once every 24 hours. Cooldown remaining:{' '}
            <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{cooldown.remainingFormatted}</span>
          </div>
        </div>
      )}

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
        {/* Academic Standing / Year Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A19' }}>
              Academic Standing
            </span>
            <span style={{ fontSize: '11px', color: '#75736C' }}>
              {isPostgraduate ? '✨ MBA & PG challenges unlocked' : '🛡️ Undergraduate competitions only'}
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '8px'
            }}
          >
            {YEAR_OPTIONS.map((y) => {
              const isSelected = year === y;
              const isPgOption = y.startsWith('PG');
              return (
                <button
                  key={y}
                  type="button"
                  disabled={cooldown.isLocked}
                  onClick={() => setYear(y)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '11px 13px',
                    borderRadius: '9px',
                    border: `1.5px solid ${isSelected ? '#0F3FFE' : '#E7E6E2'}`,
                    background: isSelected ? 'rgba(15, 63, 254, 0.05)' : '#FFFFFF',
                    cursor: cooldown.isLocked ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    transition: 'all 140ms ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected && !cooldown.isLocked) e.currentTarget.style.borderColor = '#CFCDC7';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected && !cooldown.isLocked) e.currentTarget.style.borderColor = '#E7E6E2';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        border: `2px solid ${isSelected ? '#0F3FFE' : '#CFCDC7'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {isSelected && (
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0F3FFE' }} />
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: isSelected ? 600 : 500,
                        color: isSelected ? '#0F3FFE' : '#1A1A19'
                      }}
                    >
                      {y}
                    </span>
                  </div>
                  {isPgOption && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: isSelected ? '#0F3FFE' : '#75736C',
                        background: isSelected ? '#EEF2FF' : '#F6F6F4',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        letterSpacing: '0.02em'
                      }}
                    >
                      MBA/PG
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div
            style={{
              fontSize: '12px',
              color: '#55534D',
              background: '#F9F9F7',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #EFEEEA',
              lineHeight: 1.4
            }}
          >
            {isPostgraduate ? (
              <span>
                ✨ <strong>Postgraduate active:</strong> Showing MBA & postgraduate flagship challenges (IIM, corporate summits) <em>as well as</em> all open collegiate competitions.
              </span>
            ) : (
              <span>
                🛡️ <strong>Undergraduate active:</strong> Showing curated undergraduate-eligible competitions. MBA-only and PG-exclusive listings are strictly hidden.
              </span>
            )}
          </div>
        </div>

        {/* Fields Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '13px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#75736C' }}>Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              disabled={cooldown.isLocked}
              style={{
                border: '1px solid #E7E6E2',
                borderRadius: '9px',
                background: cooldown.isLocked ? '#F9F9F7' : '#FFFFFF',
                padding: '10px 12px',
                fontSize: '14px',
                color: '#1A1A19'
              }}
            />
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#75736C' }}>College / University</span>
            <SearchableCollegeSelect
              value={college}
              onChange={(val) => setCollege(val)}
              placeholder="Search college (e.g. SRCC, SSCBS, IIT)..."
              disabled={cooldown.isLocked}
            />
          </div>
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
            disabled={cooldown.isLocked}
            style={{
              border: '1px solid #E7E6E2',
              borderRadius: '9px',
              background: cooldown.isLocked ? '#F9F9F7' : '#FFFFFF',
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
            disabled={cooldown.isLocked}
            style={{
              border: `1px solid ${cooldown.isLocked ? '#CFCDC7' : '#0F3FFE'}`,
              borderRadius: '9px',
              background: cooldown.isLocked ? '#E7E6E2' : '#0F3FFE',
              color: cooldown.isLocked ? '#75736C' : '#FFFFFF',
              padding: '10px 20px',
              cursor: cooldown.isLocked ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'background 120ms ease'
            }}
            onMouseEnter={(e) => {
              if (!cooldown.isLocked) e.currentTarget.style.background = '#0C33CC';
            }}
            onMouseLeave={(e) => {
              if (!cooldown.isLocked) e.currentTarget.style.background = '#0F3FFE';
            }}
          >
            {cooldown.isLocked ? 'Edit Locked (24h Cooldown)' : 'Save changes'}
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
