// src/components/OneStopLogo.jsx
import React from 'react';
import './OneStopLogo.css';

export default function OneStopLogo({
  variant = 'full', // 'full' | 'icon'
  height = 26,
  width,
  alt = 'OneStop',
  className = '',
  style = {},
  onClick
}) {
  const isInteractive = Boolean(onClick);
  const containerStyle = {
    height: typeof height === 'number' ? `${height}px` : height,
    ...(width ? { width: typeof width === 'number' ? `${width}px` : width } : {}),
    ...style
  };

  if (variant === 'icon') {
    return (
      <span
        className={`onestop-logo-wrapper onestop-icon-wrapper ${isInteractive ? 'interactive' : ''} ${className}`}
        style={containerStyle}
        onClick={onClick}
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : undefined}
      >
        <img
          src="/onestop-icon.png"
          alt={alt}
          className="onestop-icon-img"
          loading="eager"
          decoding="async"
        />
      </span>
    );
  }

  return (
    <span
      className={`onestop-logo-wrapper ${isInteractive ? 'interactive' : ''} ${className}`}
      style={containerStyle}
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
    >
      <img
        src="/onestop-logo.png"
        alt={alt}
        className="onestop-logo-img onestop-logo-light"
        loading="eager"
        decoding="async"
      />
      <img
        src="/onestop-logo-white.png"
        alt={alt}
        className="onestop-logo-img onestop-logo-dark"
        loading="eager"
        decoding="async"
      />
    </span>
  );
}
