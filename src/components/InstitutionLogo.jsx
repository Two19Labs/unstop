// src/components/InstitutionLogo.jsx
import React, { useState } from 'react';
import { initialsOf } from '../data/initialData';

export default function InstitutionLogo({
  logo,
  name = '',
  size = 36,
  borderRadius = 8,
  fontSize = 12,
  className = '',
  style = {}
}) {
  const [failedUrl, setFailedUrl] = useState(null);

  // If a valid logo URL is provided and has not failed, display real logo image
  const showImg = Boolean(logo && typeof logo === 'string' && logo.trim().length > 0 && failedUrl !== logo);

  if (showImg) {
    return (
      <div
        className={`institution-logo-wrap ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          minWidth: `${size}px`,
          minHeight: `${size}px`,
          borderRadius: `${borderRadius}px`,
          border: '1px solid #EFEEEA',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flex: 'none',
          padding: '2px',
          boxSizing: 'border-box',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          ...style
        }}
      >
        <img
          src={logo}
          alt={name ? `${name} logo` : 'Institution logo'}
          onError={() => setFailedUrl(logo)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block'
          }}
          loading="lazy"
        />
      </div>
    );
  }

  // Fallback: Clean initials badge
  return (
    <div
      className={`institution-logo-fallback ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        borderRadius: `${borderRadius}px`,
        border: '1px solid #EFEEEA',
        backgroundColor: '#F2F1ED',
        color: '#55534D',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none',
        fontSize: `${fontSize}px`,
        fontWeight: 700,
        userSelect: 'none',
        ...style
      }}
    >
      {initialsOf(name || 'Host')}
    </div>
  );
}
