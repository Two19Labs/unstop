// src/components/InstitutionLogo.jsx
import React, { useState } from 'react';
import { initialsOf } from '../data/initialData';
import { getInstitutionSvg } from '../data/institutionLogos';

export default function InstitutionLogo({
  logo,
  logoUrl,
  icon,
  name = '',
  organizer = '',
  host = '',
  title = '',
  size = 40,
  borderRadius = 8,
  fontSize = 12,
  className = '',
  style = {}
}) {
  const [failedUrl, setFailedUrl] = useState(null);

  const effectiveName = name || organizer || host || '';
  const effectiveLogo = logo || logoUrl || icon;

  // 1. First priority: Exact authentic vector SVG match
  const matchedSvg = getInstitutionSvg(`${effectiveName} ${title}`);

  const containerStyle = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
    borderRadius: `${borderRadius}px`,
    border: '1px solid var(--line, #E7E6E2)',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flex: 'none',
    boxSizing: 'border-box',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
    ...style
  };

  if (matchedSvg) {
    return (
      <div className={`institution-logo-wrap tf-comp-logo-wrap ${className}`} style={containerStyle}>
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {matchedSvg}
        </div>
      </div>
    );
  }

  // 2. Second priority: Valid remote image URL if not failed
  const showImg = Boolean(
    effectiveLogo &&
    typeof effectiveLogo === 'string' &&
    effectiveLogo.trim().length > 0 &&
    failedUrl !== effectiveLogo
  );

  if (showImg) {
    return (
      <div className={`institution-logo-wrap tf-comp-logo-wrap ${className}`} style={containerStyle}>
        <img
          src={effectiveLogo}
          alt={effectiveName ? `${effectiveName} logo` : 'Institution logo'}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={() => setFailedUrl(effectiveLogo)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
            padding: '2px',
            boxSizing: 'border-box'
          }}
          loading="lazy"
        />
      </div>
    );
  }

  // 3. Fallback: Clean initials badge
  return (
    <div
      className={`institution-logo-fallback tf-comp-logo-wrap ${className}`}
      style={{
        ...containerStyle,
        backgroundColor: 'var(--surface-muted, #F2F1ED)',
        color: 'var(--ink-secondary, #55534D)',
        fontSize: `${fontSize}px`,
        fontWeight: 700,
        userSelect: 'none'
      }}
    >
      {initialsOf(effectiveName || title || 'Host')}
    </div>
  );
}
