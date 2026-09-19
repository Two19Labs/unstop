// src/components/Toast.jsx
import React from 'react';

export default function Toast({ message }) {
  if (!message) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '22px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#1A1A19',
        color: '#FFFFFF',
        borderRadius: '10px',
        padding: '12px 18px',
        fontSize: '13px',
        fontWeight: 500,
        zIndex: 9999,
        boxShadow: '0 4px 12px rgba(26,26,25,0.18)',
        pointerEvents: 'none',
        whiteSpace: 'nowrap'
      }}
    >
      {message}
    </div>
  );
}
