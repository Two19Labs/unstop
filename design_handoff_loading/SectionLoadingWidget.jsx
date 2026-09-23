// src/components/SectionLoadingWidget.jsx
import React, { useState, useEffect, useMemo } from 'react';
import OneStopLogo from './OneStopLogo';
import { GENERAL_PUNS } from './FunLoadingScreen';
import './SectionLoadingWidget.css';

export default function SectionLoadingWidget({
  headline = 'Fetching live competitions from Unstop...',
  subtitle = 'Pulling direct listings across DU, IIMs, IITs & premier colleges',
  customPuns = null,
  showPuns = true,
  minDurationMs = 1800,
  isReady = true,
  onComplete,
}) {
  const [isDismissing, setIsDismissing] = useState(false);

  // One quote per loading screen. A new mount picks a new random one.
  const quote = useMemo(() => {
    const pool = Array.isArray(customPuns) && customPuns.length > 0 ? customPuns : GENERAL_PUNS;
    return pool[Math.floor(Math.random() * pool.length)] || pool[0];
  }, [customPuns]);

  // Dismiss once minDuration has elapsed AND data is ready
  useEffect(() => {
    let timer = null;
    const start = Date.now();
    const checkDone = () => {
      const elapsed = Date.now() - start;
      if (elapsed >= minDurationMs && isReady) {
        setIsDismissing(true);
        timer = setTimeout(() => onComplete && onComplete(), 220);
      } else {
        timer = setTimeout(checkDone, Math.max(50, minDurationMs - elapsed));
      }
    };
    checkDone();
    return () => timer && clearTimeout(timer);
  }, [isReady, minDurationMs, onComplete]);

  return (
    <div
      className={`section-loading-card ${isDismissing ? 'is-dismissing' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="section-loading-ring-wrap">
        <div className="section-loading-ring" aria-hidden="true" />
        <OneStopLogo variant="icon" height={22} />
      </div>
      <h3 className="section-loading-title">{headline}</h3>
      <p className="section-loading-sub">{showPuns ? quote : subtitle}</p>
    </div>
  );
}
