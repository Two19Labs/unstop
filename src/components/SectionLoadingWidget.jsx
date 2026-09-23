// src/components/SectionLoadingWidget.jsx
import React, { useState, useEffect, useMemo } from 'react';
import OneStopLogo from './OneStopLogo';
import { GENERAL_PUNS } from './FunLoadingScreen';
import './SectionLoadingWidget.css';

export default function SectionLoadingWidget({
  badge = "FETCHING REAL-TIME LISTINGS",
  headline = "OneStop Browse",
  customPuns = null,
  minDurationMs = 1800,
  isReady = true,
  onComplete,
  tickerItems = ["Live Unstop Crawl", "Real-time Verification", "Zero Placeholders"],
  allowSkip = true
}) {
  const [progress, setProgress] = useState(14);
  const [isDismissing, setIsDismissing] = useState(false);

  // Pick exactly ONE quote for the entire duration of this loading screen
  const quote = useMemo(() => {
    const pool = Array.isArray(customPuns) && customPuns.length > 0 ? customPuns : GENERAL_PUNS;
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex] || pool[0];
  }, [customPuns]);

  const gradId = useMemo(() => `secCircleGrad-${Math.random().toString(36).slice(2, 9)}`, []);

  // Smooth circular progress animation
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(96, Math.floor((elapsed / minDurationMs) * 96));
      setProgress(pct);
    }, 35);
    return () => clearInterval(interval);
  }, [minDurationMs]);

  // Handle completion when both minDuration has elapsed AND isReady is true
  useEffect(() => {
    let timer = null;
    const start = Date.now();

    const checkDone = () => {
      const elapsed = Date.now() - start;
      if (elapsed >= minDurationMs && isReady) {
        setProgress(100);
        setIsDismissing(true);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 220);
      } else {
        const remaining = Math.max(50, minDurationMs - elapsed);
        timer = setTimeout(checkDone, remaining);
      }
    };

    checkDone();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isReady, minDurationMs, onComplete]);

  const handleSkip = () => {
    setProgress(100);
    setIsDismissing(true);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 120);
  };

  const strokeOffset = Math.max(0, 88 - (progress / 100) * 88);

  return (
    <div className={`section-loading-widget ${isDismissing ? 'widget-dismiss' : ''}`}>
      <div className="section-loading-top">
        <div className="section-loading-brand-wrap">
          <OneStopLogo variant="icon" height={26} />
          <span className="section-loading-title">{headline}</span>
          <span className="section-loading-badge">{badge}</span>
        </div>

        <div className="section-loading-actions">
          <div className="section-loading-ticker">
            {tickerItems.map((item, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="ticker-dot-sep">·</span>}
                <span className="ticker-label">
                  {idx === 0 && <span className="ticker-live-dot" />}
                  {item}
                </span>
              </React.Fragment>
            ))}
          </div>

          {allowSkip && (
            <button
              type="button"
              className="section-loading-skip-btn"
              onClick={handleSkip}
              title="Skip loading animation"
            >
              Skip ➔
            </button>
          )}
        </div>
      </div>

      <div className="section-loading-main">
        {/* Circular Loading Thing */}
        <div className="section-circular-loader" aria-label="Loading">
          <svg className="section-circular-svg" viewBox="0 0 36 36">
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0F3FFE" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>
            <circle
              className="section-circular-track"
              cx="18"
              cy="18"
              r="14"
              fill="none"
              strokeWidth="3.2"
            />
            <circle
              className="section-circular-head"
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth="3.2"
              strokeDasharray="88"
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Single Quote */}
        <div className="section-loading-pun-box">
          <p className="section-loading-pun">
            "{quote}"
          </p>
        </div>
      </div>
    </div>
  );
}
