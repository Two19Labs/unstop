// src/components/SectionLoadingWidget.jsx
import React, { useState, useEffect, useMemo } from 'react';
import OneStopLogo from './OneStopLogo';
import { GENERAL_PUNS } from './FunLoadingScreen';
import './SectionLoadingWidget.css';

export default function SectionLoadingWidget({
  badge = "FETCHING REAL-TIME LISTINGS",
  headline = "OneStop Browse",
  customPuns = null,
  minDurationMs = 2500,
  isReady = true,
  onComplete,
  tickerItems = ["Live Unstop Crawl", "Real-time Verification", "Zero Placeholders"],
  allowSkip = true
}) {
  const [punIndex, setPunIndex] = useState(0);
  const [fadeState, setFadeState] = useState('in');
  const [progress, setProgress] = useState(14);
  const [isDismissing, setIsDismissing] = useState(false);

  const punsList = useMemo(() => {
    const pool = Array.isArray(customPuns) && customPuns.length > 0 ? customPuns : GENERAL_PUNS;
    return [...pool].sort(() => 0.5 - Math.random());
  }, [customPuns]);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(96, Math.floor((elapsed / minDurationMs) * 96));
      setProgress(pct);
    }, 35);
    return () => clearInterval(interval);
  }, [minDurationMs]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeState('out');
      setTimeout(() => {
        setPunIndex((prev) => (prev + 1) % punsList.length);
        setFadeState('in');
      }, 140);
    }, 820);
    return () => clearInterval(interval);
  }, [punsList.length]);

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

      <div className="section-loading-pun-box">
        <p className={`section-loading-pun ${fadeState === 'out' ? 'pun-fade-out' : 'pun-fade-in'}`}>
          "{punsList[punIndex]}"
        </p>
      </div>

      <div className="section-loading-progress-track">
        <div
          className="section-loading-progress-bar"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
