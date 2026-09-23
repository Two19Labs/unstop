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
        background: 'var(--ink)',
        color: 'var(--canvas)',
        border: '1px solid var(--line)',
        borderRadius: '10px',
        padding: '12px 18px',
        fontSize: '13px',
        fontWeight: 500,
        zIndex: 9999,
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        pointerEvents: 'none',
        whiteSpace: 'nowrap'
      }}
    >
      {message}
    </div>
  );
}
