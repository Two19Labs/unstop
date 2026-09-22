// src/components/FunLoadingScreen.jsx
import React, { useState, useEffect, useMemo } from 'react';
import OneStopLogo from './OneStopLogo';
import './FunLoadingScreen.css';

const SARCASTIC_PUNS = [
  "Aligning the BCG matrix with our broken sleep schedules...",
  "Fixing the 1-pixel font margin error on slide 47 of the pitch deck...",
  "Convincing the team that 'Market Research' isn't just scrolling Reddit at 3 AM...",
  "Consultant voice activated: 'Let's take this offline and circle back by EOD'...",
  "Aggressively googling TAM, SAM, and SOM 5 minutes before deadline...",
  "Formatting financial valuation models until Excel starts crying in #VALUE!...",
  "Checking cumulative prize pools to see if we can finally afford iced americanos...",
  "Rehearsing confident head nods for the Q&A round we didn't prepare for...",
  "Praying the Unstop submission server doesn't crash at 11:58 PM...",
  "Inserting buzzwords: 'Synergistic paradigm shift with high-conviction scalability'...",
  "Debating whether a 2:00 AM WhatsApp brainstorm counts as team synergy...",
  "Scouting premier DU, IIT & IIM opportunities with 0% mock data..."
];

export default function FunLoadingScreen({
  isReady = false,
  minDurationMs = 3400,
  onComplete
}) {
  const [punIndex, setPunIndex] = useState(0);
  const [fadeState, setFadeState] = useState('in'); // 'in' | 'out'
  const [progress, setProgress] = useState(10);
  const [isDismissing, setIsDismissing] = useState(false);

  // Shuffle or randomize puns for uniqueness on each load
  const punsList = useMemo(() => {
    return [...SARCASTIC_PUNS].sort(() => 0.5 - Math.random());
  }, []);

  // Smooth progress bar animation
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(95, Math.floor((elapsed / minDurationMs) * 95));
      setProgress(pct);
    }, 50);

    return () => clearInterval(interval);
  }, [minDurationMs]);

  // Rotate puns every 950ms with a quick cross-fade
  useEffect(() => {
    const interval = setInterval(() => {
      setFadeState('out');
      setTimeout(() => {
        setPunIndex((prev) => (prev + 1) % punsList.length);
        setFadeState('in');
      }, 160);
    }, 1050);

    return () => clearInterval(interval);
  }, [punsList.length]);

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
        }, 360);
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
    }, 200);
  };

  return (
    <div className={`fun-loading-overlay ${isDismissing ? 'fun-loading-dismiss' : ''}`}>
      {/* Background ambient lighting */}
      <div className="fun-loading-glow fun-loading-glow-1" />
      <div className="fun-loading-glow fun-loading-glow-2" />

      {/* Top right skip button */}
      <button
        type="button"
        className="fun-loading-skip-btn"
        onClick={handleSkip}
        title="Skip intro loading"
      >
        Skip ➔
      </button>

      {/* Center Card */}
      <div className="fun-loading-card">
        {/* Animated Brand Emblem */}
        <div className="fun-loading-logo-wrap">
          <div className="fun-loading-logo-aura" />
          <OneStopLogo variant="icon" height={52} />
        </div>

        {/* Brand Title */}
        <div className="fun-loading-header">
          <span className="fun-loading-brand">OneStop</span>
          <span className="fun-loading-badge">BOOTING ARTIFACTS</span>
        </div>

        {/* Rotating Pun Text */}
        <div className="fun-loading-pun-container">
          <p className={`fun-loading-pun ${fadeState === 'out' ? 'pun-fade-out' : 'pun-fade-in'}`}>
            "{punsList[punIndex]}"
          </p>
        </div>

        {/* Progress Bar */}
        <div className="fun-loading-progress-track">
          <div
            className="fun-loading-progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Collegiate Micro-Ticker */}
        <div className="fun-loading-ticker">
          <span className="ticker-item">
            <span className="ticker-dot green" />
            Live Ingestion
          </span>
          <span className="ticker-sep">·</span>
          <span className="ticker-item">Adrenaline: 99%</span>
          <span className="ticker-sep">·</span>
          <span className="ticker-item">Zero Sandboxes</span>
        </div>
      </div>
    </div>
  );
}
