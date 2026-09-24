// src/components/SectionLoadingWidget.jsx
import React, { useState, useEffect, useMemo } from 'react';
import OneStopLogo from './OneStopLogo';
import { GENERAL_PUNS } from './FunLoadingScreen';
import './SectionLoadingWidget.css';

// Module-level memory to prevent showing the exact same quote twice in a row
let lastPickedQuote = '';

export default function SectionLoadingWidget({
  headline = 'Fetching live competitions from Unstop...',
  subtitle = 'Pulling direct listings across DU, IIMs, IITs & premier colleges',
  customPuns = null,
  showPuns = true,
  minDurationMs = 1500,
  maxDurationMs = 3000,
  isReady = true,
  onComplete,
}) {
  const [isDismissing, setIsDismissing] = useState(false);

  // Exactly one quote per full loading screen, shuffled at random
  const quote = useMemo(() => {
    const pool = Array.isArray(customPuns) && customPuns.length > 0 ? customPuns : GENERAL_PUNS;
    if (!pool || pool.length === 0) return '';
    let candidate = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1 && candidate === lastPickedQuote) {
      // Pick a different one from the pool
      const filtered = pool.filter(q => q !== lastPickedQuote);
      candidate = filtered[Math.floor(Math.random() * filtered.length)] || candidate;
    }
    lastPickedQuote = candidate;
    return candidate;
  }, [customPuns]);

  // Stays visible for exactly 1.5s (minDurationMs) when ready, capped at maxDurationMs
  useEffect(() => {
    let timer = null;
    let completed = false;
    const start = Date.now();

    const finish = () => {
      if (completed) return;
      completed = true;
      setIsDismissing(true);
      timer = setTimeout(() => onComplete && onComplete(), 160);
    };

    const checkDone = () => {
      const elapsed = Date.now() - start;
      if (elapsed >= minDurationMs && isReady) {
        finish();
      } else if (elapsed >= maxDurationMs) {
        finish();
      } else {
        const remaining = Math.max(30, minDurationMs - elapsed);
        timer = setTimeout(checkDone, remaining);
      }
    };

    checkDone();
    return () => timer && clearTimeout(timer);
  }, [isReady, minDurationMs, maxDurationMs, onComplete]);

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
