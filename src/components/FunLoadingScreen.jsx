// src/components/FunLoadingScreen.jsx
import React, { useState, useEffect, useMemo } from 'react';
import OneStopLogo from './OneStopLogo';
import './FunLoadingScreen.css';

export const GENERAL_PUNS = [
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
  "Scouting premier DU, IIT & IIM opportunities with 0% mock data...",
  "Pretending we understood the judge's question about DCF sensitivity analysis...",
  "Calling a basic Canva gradient 'Proprietary Visual Architecture'...",
  "Re-reading the problem statement 10 minutes before submission because nobody read it...",
  "Calculating how to turn 3 bullet points into a 20-slide executive summary...",
  "Running a Monte Carlo simulation on whether our teammate will respond to WhatsApp...",
  "Explaining our 'Go-To-Market' strategy: 'Virality on Instagram Reels and vibes'...",
  "Checking if winning 3rd place covers the cost of midnight caffeine runs...",
  "Synchronizing with live Unstop servers before the caffeine wears off...",
  "Pasting Porter's Five Forces into a deck that definitely didn't ask for Porter's Five Forces...",
  "Extracting high-stakes competitions from premier campuses across India...",
  "Convincing ourselves that our 4-member squad is 'lean, agile, and disruptive'...",
  "Refactoring slide headers to start with action verbs so judges feel intimidated...",
  "Negotiating equity split on a case competition idea that doesn't exist yet...",
  "Translating 'we have no idea' into 'preliminary exploratory heuristics'...",
  "Filtering out phantom hackathons to deliver 100% genuine campus challenges...",
  "Re-exporting pitch deck as PDF because PowerPoint font embedding failed again...",
  "Asking ChatGPT to 'make this sound like McKinsey wrote it during a panic attack'...",
  "Double-checking team registration numbers so we don't end up solo by accident...",
  "Practicing hand gestures in the mirror for the online presentation round...",
  "Googling 'what is EBITDA' in an incognito tab while nodding thoughtfully...",
  "Converting coffee directly into slide animations and financial projections...",
  "Wrangling live competition APIs across North Campus, Powai, and Ahmedabad...",
  "Reminding everyone that 'submission deadline is 11:59:59 PM, NOT 12:00:00 AM'...",
  "Polishing executive summary until it shines brighter than our future careers..."
];

export const BROWSE_PUNS = [
  "Synchronizing with live Unstop servers across premier engineering & B-school campuses...",
  "Scouting national case competitions, hackathons, and corporate challenges...",
  "Filtering out phantom links — delivering 100% verified campus competitions...",
  "Aggressively indexing prize pools to fund the squad's caffeine addiction...",
  "Aligning competition deadlines with our broken collegiate sleep schedules...",
  "Extracting live criteria from DU, IIT Bombay, IIM Ahmedabad, XLRI, and BITS...",
  "Parsing competition decks before Unstop's submission counter ticks down...",
  "Consultant voice activated: 'Benchmarking the highest-yield collegiate comps'...",
  "Verifying that submission deadlines aren't actually 11:59 PM tonight...",
  "Pasting Porter's Five Forces into memory caches while listings download...",
  "Checking if top 3 cash awards justify staying up till 4:30 AM on a Tuesday...",
  "Translating complex challenge rubrics into actionable student wins..."
];

export const SQUAD_PUNS = [
  "Scouting collegiate squads across DU, IITs, IIMs, and top universities...",
  "Running Monte Carlo simulations on whether your prospective teammate replies to WhatsApp...",
  "Debating whether a 2:00 AM brainstorm session qualifies as genuine team synergy...",
  "Negotiating equity split on a 24-hour hackathon idea that doesn't exist yet...",
  "Double-checking squad spots so nobody is accidentally left to solo a 5-round case...",
  "Convincing the group that 4 generalists and 0 coders is a 'lean and agile' formation...",
  "Rehearsing synchronized head nods for the squad's upcoming presentation round...",
  "Verifying phone numbers for instant, zero-spam WhatsApp team handshakes...",
  "Filtering out teammates who claim 'I specialize in ideation and vibes'...",
  "Matching complementary skillsets: 1 financial modeler + 3 emotional support slides..."
];

export const SARCASTIC_PUNS = GENERAL_PUNS;

export default function FunLoadingScreen({
  isReady = true,
  minDurationMs = 2500,
  onComplete,
  badge = "FETCHING COMPETITIONS",
  headline = "OneStop",
  customPuns = null,
  tickerItems = ["Live Ingestion", "Adrenaline: 99%", "Zero Sandboxes"],
  allowSkip = true
}) {
  const [punIndex, setPunIndex] = useState(0);
  const [fadeState, setFadeState] = useState('in'); // 'in' | 'out'
  const [progress, setProgress] = useState(12);
  const [isDismissing, setIsDismissing] = useState(false);

  // Shuffle or randomize puns for uniqueness on each load
  const punsList = useMemo(() => {
    const pool = Array.isArray(customPuns) && customPuns.length > 0 ? customPuns : GENERAL_PUNS;
    return [...pool].sort(() => 0.5 - Math.random());
  }, [customPuns]);

  // Smooth progress bar animation
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(96, Math.floor((elapsed / minDurationMs) * 96));
      setProgress(pct);
    }, 35);

    return () => clearInterval(interval);
  }, [minDurationMs]);

  // Rotate puns every 820ms with a quick cross-fade for 2.5s screen
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
      {allowSkip && (
        <button
          type="button"
          className="fun-loading-skip-btn"
          onClick={handleSkip}
          title="Skip loading screen"
        >
          Skip ➔
        </button>
      )}

      {/* Center Card */}
      <div className="fun-loading-card">
        {/* Animated Brand Emblem */}
        <div className="fun-loading-logo-wrap">
          <div className="fun-loading-logo-aura" />
          <OneStopLogo variant="icon" height={52} />
        </div>

        {/* Brand Title */}
        <div className="fun-loading-header">
          <span className="fun-loading-brand">{headline}</span>
          <span className="fun-loading-badge">{badge}</span>
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
          {tickerItems.map((item, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="ticker-sep">·</span>}
              <span className="ticker-item">
                {idx === 0 && <span className="ticker-dot green" />}
                {item}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
