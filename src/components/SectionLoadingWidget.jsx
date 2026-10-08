// src/components/SectionLoadingWidget.jsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import OneStopLogo from './OneStopLogo';
import { GENERAL_PUNS } from './FunLoadingScreen';
import './SectionLoadingWidget.css';

// Module-level memory to prevent showing the exact same quote twice in a row
let lastPickedQuote = '';

export default function SectionLoadingWidget({
  headline = 'Fetching live competitions...',
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

  // Measured once from mount: parent re-renders must not restart the clock or cancel the dismissal
  const startRef = useRef(Date.now());
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsDismissing(true);
    setTimeout(() => onCompleteRef.current && onCompleteRef.current(), 160);
  }, []);

  // Visible for at least minDurationMs, then dismissed as soon as data is ready
  useEffect(() => {
    if (!isReady) return undefined;
    const remaining = Math.max(0, minDurationMs - (Date.now() - startRef.current));
    const timer = setTimeout(finish, remaining);
    return () => clearTimeout(timer);
  }, [isReady, minDurationMs, finish]);

  // Hard cap from mount, whatever happens
  useEffect(() => {
    const timer = setTimeout(finish, maxDurationMs);
    return () => clearTimeout(timer);
  }, [maxDurationMs, finish]);

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
