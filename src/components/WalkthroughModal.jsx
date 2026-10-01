// src/components/WalkthroughModal.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowRightIcon,
  CloseIcon
} from './icons';
import OneStopLogo from './OneStopLogo';
import { trackEvent } from '../lib/posthog';
import './WalkthroughModal.css';

const SLIDES = [
  {
    id: 'filters',
    badge: 'filters',
    title: 'tell us what you’re into',
    description: 'pick circuits, categories, sub-tracks and fee. counts update as you go.'
  },
  {
    id: 'browse',
    badge: 'browse',
    title: 'every competition that fits, in one place',
    description: 'pulled from every major platform and campus portal. undergrad-only, nothing expired, soonest deadlines first.'
  },
  {
    id: 'bookmarks',
    badge: 'bookmarks',
    title: 'every round, counted down',
    description: 'bookmark a competition and we track each round’s deadline, not just registration.'
  },
  {
    id: 'team-finder',
    badge: 'team finder',
    title: 'find teammates from any college',
    description: 'post a squad or request to join one. see the skills each squad needs upfront.'
  },
  {
    id: 'requests',
    badge: 'requests',
    title: 'accepted? whatsapp them, or chat here',
    description: 'open whatsapp in one tap, or keep it on onestop chat if you’d rather not share your number.'
  },
  {
    id: 'profile',
    badge: 'profile',
    title: 'add your college, get your feed',
    description: 'set your college, year and skills. we hide what you can’t enter and show squads that need you.'
  }
];

const SCRIPTS = [
  {
    len: 7200,
    steps: [
      { at: 1300, cue: 'du' },
      { at: 2500, cue: 'case' },
      { at: 3700, cue: 'fin' },
      { at: 4900, cue: 'free' }
    ]
  },
  { len: 8000, steps: [] },
  { len: 5000, steps: [{ at: 2400, cue: 'open' }] },
  { len: 5000, steps: [{ at: 2000, cue: 'join' }] },
  {
    len: 6800,
    steps: [
      { at: 1900, cue: 'accept' },
      { at: 3400, cue: 'wa', hover: true },
      { at: 4600, cue: 'chat', hover: true }
    ]
  },
  { len: 5000, steps: [{ at: 2600, cue: 'req', hover: true }] }
];

const URGENCY_CONFIG = {
  blue: {
    uBd: '1px solid rgba(15,63,254,0.35)',
    uBg: 'rgba(15,63,254,0.08)',
    uInk: '#0F3FFE',
    bd: '#E7E6E2',
    bg: '#FFFFFF',
    sh: 'none'
  },
  yellow: {
    uBd: '1px solid rgba(245,158,11,0.40)',
    uBg: 'rgba(245,158,11,0.14)',
    uInk: '#F59E0B',
    bd: 'rgba(245,158,11,0.45)',
    bg: 'linear-gradient(180deg, rgba(254,252,232,0.70) 0%, #FFFFFF 42%)',
    sh: '0 2px 8px rgba(245,158,11,0.08)'
  },
  red: {
    uBd: '1px solid rgba(239,68,68,0.40)',
    uBg: 'rgba(239,68,68,0.12)',
    uInk: '#EF4444',
    bd: 'rgba(239,68,68,0.45)',
    bg: 'linear-gradient(180deg, rgba(254,242,242,0.65) 0%, #FFFFFF 42%)',
    sh: '0 2px 8px rgba(239,68,68,0.08)'
  }
};

const LOGOS = {
  SR: '/walkthrough/sr.png',
  SS: '/walkthrough/ss.png',
  KM: '/walkthrough/km.jpg',
  HC: '/walkthrough/hc.png',
  HR: '/walkthrough/hr.webp',
  SC: '/walkthrough/sc.png',
  SV: '/walkthrough/sv.png',
  LS: '/walkthrough/ls.jpg',
  MH: '/walkthrough/mh.png',
  RC: '/walkthrough/rc.jpg'
};

const CARDS = [
  {
    ini: 'SR',
    host: 'Shri Ram College of Commerce (SRCC)',
    title: 'SRCC Business Conclave Case Challenge 2026',
    prize: '₹1,50,000 Prize Pool',
    team: '1–3 Members',
    ends: '12 Oct, 11:59 PM',
    regs: '3,240',
    left: '10 days left',
    urgency: 'blue'
  },
  {
    ini: 'SS',
    host: 'Shaheed Sukhdev College of Business Studies',
    title: 'SSCBS Consulting Case Challenge',
    prize: '₹1,00,000 Prize Pool',
    team: '1–4 Members',
    ends: '3 Oct, 11:59 PM',
    regs: '2,410',
    left: '18h left',
    urgency: 'yellow'
  },
  {
    ini: 'KM',
    host: 'Kirori Mal College',
    title: 'KMC Finance Case Showdown',
    prize: '₹50,000 Prize Pool',
    team: '1–3 Members',
    ends: '2 Oct, 6:00 PM',
    regs: '1,920',
    left: '4h left',
    urgency: 'red'
  },
  {
    ini: 'HC',
    host: 'Hindu College',
    title: 'Hindu Case Clash 2026',
    prize: '₹75,000 Prize Pool',
    team: '2–4 Members',
    ends: '7 Oct, 11:59 PM',
    regs: '1,180',
    left: '5 days left',
    urgency: 'blue'
  },
  {
    ini: 'HR',
    host: 'Hansraj College',
    title: 'Hansraj Strategy Summit Case Comp',
    prize: '₹60,000 Prize Pool',
    team: '2–3 Members',
    ends: '8 Oct, 11:59 PM',
    regs: '860',
    left: '6 days left',
    urgency: 'blue'
  },
  {
    ini: 'SC',
    host: 'St. Stephen’s College',
    title: 'Stephen’s Policy Case Competition',
    prize: '₹45,000 Prize Pool',
    team: '1–3 Members',
    ends: '11 Oct, 11:59 PM',
    regs: '780',
    left: '9 days left',
    urgency: 'blue'
  },
  {
    ini: 'SV',
    host: 'Sri Venkateswara College',
    title: 'Venky Valuation Case Cup',
    prize: '₹55,000 Prize Pool',
    team: '1–3 Members',
    ends: '13 Oct, 11:59 PM',
    regs: '1,050',
    left: '11 days left',
    urgency: 'blue'
  },
  {
    ini: 'LS',
    host: 'Lady Shri Ram College for Women',
    title: 'LSR Marketing Case Fiesta',
    prize: '₹40,000 Prize Pool',
    team: '2–3 Members',
    ends: '14 Oct, 11:59 PM',
    regs: '640',
    left: '12 days left',
    urgency: 'blue'
  },
  {
    ini: 'MH',
    host: 'Miranda House',
    title: 'Miranda ESG Case Challenge',
    prize: '₹35,000 Prize Pool',
    team: '2–4 Members',
    ends: '16 Oct, 11:59 PM',
    regs: '420',
    left: '14 days left',
    urgency: 'blue'
  },
  {
    ini: 'RC',
    host: 'Ramjas College',
    title: 'Ramjas B-Plan & Case Duel',
    prize: '₹30,000 Prize Pool',
    team: '2–3 Members',
    ends: '18 Oct, 11:59 PM',
    regs: '',
    left: '16 days left',
    urgency: 'blue'
  }
];

const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const CLICK = 240;

function getCursorAt(sc, currentT, paneEl, lastPosMap) {
  if (!paneEl) return { x: 0, y: 0, op: 0, clickK: -1, clickCue: null };
  const pr = paneEl.getBoundingClientRect();
  const pos = (cue) => {
    const el = paneEl.querySelector(`[data-cue="${cue}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      x: r.left - pr.left + Math.min(r.width * 0.5, 40),
      y: r.top - pr.top + r.height * 0.55
    };
  };

  let p = { x: pr.width * 0.88, y: pr.height * 0.96 };
  for (const s of sc.steps) {
    const st = s.at - 850;
    const en = s.at - 120;
    if (currentT < st) break;
    const tg = pos(s.cue) || lastPosMap[s.cue];
    if (!tg) break;
    lastPosMap[s.cue] = tg;
    if (currentT >= en) {
      p = tg;
      continue;
    }
    const k = ease((currentT - st) / (en - st));
    p = { x: p.x + (tg.x - p.x) * k, y: p.y + (tg.y - p.y) * k };
    break;
  }

  if (!sc.steps.length) return { x: p.x, y: p.y, op: 0, clickK: -1, clickCue: null };

  const last = sc.steps[sc.steps.length - 1].at;
  let op = currentT < 300 ? currentT / 300 : 1;
  if (currentT > last + 1100) op = Math.max(0, 1 - (currentT - last - 1100) / 300);

  const c = sc.steps.find((s) => !s.hover && currentT >= s.at && currentT < s.at + CLICK * 2);
  return {
    x: p.x,
    y: p.y,
    op,
    clickK: c ? (currentT - c.at) / (CLICK * 2) : -1,
    clickCue: c && currentT < c.at + CLICK ? c.cue : null
  };
}

export default function WalkthroughModal({
  isOpen,
  onClose,
  onComplete,
  autoAdvance = true
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [t, setT] = useState(0);

  const paneRef = useRef(null);
  const gridRef = useRef(null);
  const winRef = useRef(null);
  const lastPosRef = useRef({});
  const isHoveredRef = useRef(false);
  const touchStartX = useRef(null);
  const startTimestampRef = useRef(Date.now());

  // Reset clock and position cache when slide changes
  const goToSlide = useCallback((newStep) => {
    const target = Math.max(0, Math.min(SLIDES.length - 1, newStep));
    setCurrentStep(target);
    setT(0);
    lastPosRef.current = {};
  }, []);

  // PostHog analytics
  useEffect(() => {
    if (isOpen) {
      trackEvent('walkthrough_opened', { step: currentStep });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      trackEvent('walkthrough_step_viewed', {
        step_index: currentStep,
        step_id: SLIDES[currentStep]?.id,
        step_title: SLIDES[currentStep]?.title
      });
    }
  }, [currentStep, isOpen]);

  // Animation ticker loop
  useEffect(() => {
    if (!isOpen) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setT(SCRIPTS[currentStep].len);
      return;
    }

    let animId;
    let lastTime = performance.now();

    const loop = (now) => {
      const dt = Math.min(100, now - lastTime);
      lastTime = now;

      if (!document.hidden && !isHoveredRef.current) {
        setT((prevT) => {
          const sc = SCRIPTS[currentStep];
          const nextT = prevT + dt;
          if (nextT >= sc.len) {
            if (autoAdvance && currentStep < SLIDES.length - 1) {
              setCurrentStep((s) => s + 1);
              lastPosRef.current = {};
              return 0;
            } else {
              // Last slide loops back to t = 0
              return 0;
            }
          }
          return nextT;
        });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, currentStep, autoAdvance]);

  // Handlers
  const handleSkip = useCallback(() => {
    trackEvent('walkthrough_skipped', { step_index: currentStep });
    if (typeof onComplete === 'function') {
      onComplete();
    } else if (typeof onClose === 'function') {
      onClose();
    }
  }, [currentStep, onComplete, onClose]);

  const handleComplete = useCallback(() => {
    trackEvent('walkthrough_completed', { total_steps: SLIDES.length });
    if (typeof onComplete === 'function') {
      onComplete();
    } else if (typeof onClose === 'function') {
      onClose();
    }
  }, [onComplete, onClose]);

  const handleNext = useCallback(() => {
    if (currentStep === SLIDES.length - 1) {
      handleComplete();
    } else {
      goToSlide(currentStep + 1);
    }
  }, [currentStep, goToSlide, handleComplete]);

  const handlePrev = useCallback(() => {
    goToSlide(currentStep - 1);
  }, [currentStep, goToSlide]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleSkip();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, handleSkip]);

  // Mobile swipe support
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  if (!isOpen) return null;

  const slide = SLIDES[currentStep];
  const sc = SCRIPTS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === SLIDES.length - 1;

  // Derive interactive cursor & ripple positions
  const cur = getCursorAt(sc, t, paneRef.current, lastPosRef.current);
  const k = cur.clickK;

  // Press transform map
  const press = {};
  ['squadup', 'du', 'case', 'fin', 'free', 'open', 'join', 'accept'].forEach((key) => {
    press[key] = cur.clickCue === key ? 'scale(0.94)' : 'scale(1)';
  });

  // Slide 0: Filters derived state
  const du = currentStep === 0 && t >= 1300;
  const cs = currentStep === 0 && t >= 2500;
  const fin = currentStep === 0 && t >= 3700;
  const free = currentStep === 0 && t >= 4900;
  const total = [du, cs, fin, free].filter(Boolean).length;

  // Slide 1: Browse scroll position & chip animations
  let scroll = 0;
  if (currentStep === 1 && gridRef.current && winRef.current) {
    const max = Math.max(0, gridRef.current.offsetHeight - winRef.current.clientHeight);
    const kk = Math.min(1, Math.max(0, (t - 1300) / 6000));
    scroll = max * ease(kk);
  }
  const after = (at) => t >= at;
  const fade = (at) => (after(at) ? 1 : 0);

  // Slide 2: Bookmarks countdown
  const elapsedSecs = Math.floor((Date.now() - startTimestampRef.current) / 1000);
  const countdownSecs = Math.max(0, 14 * 3600 + 22 * 60 + 9 - elapsedSecs);
  const p = (n) => String(n).padStart(2, '0');
  const timerText = `${Math.floor(countdownSecs / 3600)}h ${p(
    Math.floor((countdownSecs % 3600) / 60)
  )}m ${p(countdownSecs % 60)}s`;
  const openBg =
    currentStep === 2 && t > 1700 && t < 2900 ? '#0E4ED3' : '#155EEF';

  // Slide 3: Team finder state
  const requested = currentStep === 3 && t >= 2000;

  // Slide 4: Requests state
  const accepted = currentStep === 4 && t >= 1900;
  const chatBg = currentStep === 4 && t > 4400 ? '#0F3FFE' : 'rgba(15, 63, 254, 0.08)';
  const chatInk = currentStep === 4 && t > 4400 ? '#FFFFFF' : '#0F3FFE';
  const capOp = accepted ? 1 : 0.35;

  // Slide 5: Profile KPIs counting up
  const cnt = (n, d) => String(Math.round(n * Math.min(1, Math.max(0, (t - d) / 1100))));
  const k1 = currentStep === 5 ? cnt(12, 300) : '0';
  const k2 = currentStep === 5 ? cnt(4, 450) : '0';
  const k3 = currentStep === 5 ? cnt(2, 600) : '0';
  const reqOp = currentStep === 5 && t > 2300 && t < 3800 ? 0.75 : 1;

  return (
    <div
      className="walkthrough-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="walkthrough-title"
    >
      <div
        className="walkthrough-modal"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => {
          isHoveredRef.current = true;
        }}
        onMouseLeave={() => {
          isHoveredRef.current = false;
        }}
      >
        {/* Header Bar */}
        <div className="walkthrough-header">
          <div className="walkthrough-brand">
            <OneStopLogo height={20} />
          </div>

          <div className="walkthrough-header-actions">
            <span className="walkthrough-step-counter">
              {currentStep + 1} of {SLIDES.length}
            </span>
            <button
              type="button"
              className="walkthrough-close-btn"
              onClick={handleSkip}
              aria-label="Close walkthrough"
              title="Close walkthrough"
            >
              <CloseIcon size={16} />
            </button>
          </div>
        </div>

        {/* Slide Body */}
        <div className="walkthrough-body">
          {/* Left Text Pane */}
          <div className="walkthrough-text-pane">
            <span className="walkthrough-badge">{slide.badge}</span>
            <h2 id="walkthrough-title" className="walkthrough-title">
              {slide.title}
            </h2>
            <p className="walkthrough-description">{slide.description}</p>
          </div>

          {/* Right Visual Pane */}
          <div ref={paneRef} className="walkthrough-visual-pane">
            <div className="walkthrough-zoom-wrapper">
              {/* Slide 0: Filters */}
              {currentStep === 0 && (
                <div
                  style={{
                    width: '268px',
                    flex: 'none',
                    background: '#FFFFFF',
                    border: '1px solid #E7E6E2',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '7px',
                    boxShadow: '0 4px 18px rgba(0,0,0,0.06)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingBottom: '6px',
                      borderBottom: '1px solid #E7E6E2',
                      minHeight: '27px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '14.7px',
                          fontWeight: 700,
                          color: '#1A1A19',
                          letterSpacing: '-0.2px'
                        }}
                      >
                        Filters
                      </span>
                      {total > 0 && (
                        <span
                          style={{
                            background: 'rgba(113,34,44,0.1)',
                            color: '#71222c',
                            fontSize: '10.5px',
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: '9999px',
                            letterSpacing: '0.2px'
                          }}
                        >
                          {total}
                        </span>
                      )}
                    </div>
                    {total > 0 && (
                      <span
                        style={{
                          fontSize: '11.7px',
                          color: '#71222c',
                          fontWeight: 700,
                          padding: '2px 5px',
                          borderRadius: '4px'
                        }}
                      >
                        Reset All
                      </span>
                    )}
                  </div>

                  {/* Circuits */}
                  <div style={{ display: 'flex', flexDirection: 'column', paddingTop: '2px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flex: 1,
                          padding: '4px 0'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#55534D"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                          <span
                            style={{
                              fontSize: '13.4px',
                              fontWeight: 700,
                              color: '#1A1A19',
                              letterSpacing: '-0.1px'
                            }}
                          >
                            Circuits
                          </span>
                        </div>
                        {du && (
                          <span
                            style={{
                              background: 'rgba(113,34,44,0.1)',
                              color: '#71222c',
                              fontSize: '10.5px',
                              fontWeight: 800,
                              padding: '1px 6px',
                              borderRadius: '9999px',
                              letterSpacing: '0.2px'
                            }}
                          >
                            1
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: '10.9px',
                          fontWeight: 700,
                          color: '#55534D',
                          padding: '2px 6px',
                          lineHeight: 1
                        }}
                      >
                        All
                      </span>
                    </div>

                    <div
                      style={{
                        paddingTop: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <div
                        data-cue="du"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12.4px',
                          color: du ? '#1A1A19' : '#55534D',
                          padding: '2px 0'
                        }}
                      >
                        <span
                          style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '3.5px',
                            border: `1.5px solid ${du ? '#1c4980' : '#cbd5e1'}`,
                            background: du ? '#1c4980' : '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'all .15s ease',
                            transform: press.du
                          }}
                        >
                          {du && (
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#FFFFFF"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </span>
                        <span style={{ flex: 1, lineHeight: 1.25, fontWeight: 500 }}>
                          DU Circuit
                        </span>
                        <span
                          style={{
                            fontSize: '11.2px',
                            color: '#55534D',
                            fontWeight: 600,
                            opacity: 0.85
                          }}
                        >
                          (48)
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12.4px',
                          color: '#55534D',
                          padding: '2px 0'
                        }}
                      >
                        <span
                          style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '3.5px',
                            border: '1.5px solid #cbd5e1',
                            background: '#FFFFFF',
                            flexShrink: 0
                          }}
                        />
                        <span style={{ flex: 1, lineHeight: 1.25, fontWeight: 500 }}>
                          IIMs, IITs & Premier
                        </span>
                        <span
                          style={{
                            fontSize: '11.2px',
                            color: '#55534D',
                            fontWeight: 600,
                            opacity: 0.85
                          }}
                        >
                          (36)
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12.4px',
                          color: '#55534D',
                          padding: '2px 0'
                        }}
                      >
                        <span
                          style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '3.5px',
                            border: '1.5px solid #cbd5e1',
                            background: '#FFFFFF',
                            flexShrink: 0
                          }}
                        />
                        <span style={{ flex: 1, lineHeight: 1.25, fontWeight: 500 }}>
                          Corporate & Global
                        </span>
                        <span
                          style={{
                            fontSize: '11.2px',
                            color: '#55534D',
                            fontWeight: 600,
                            opacity: 0.85
                          }}
                        >
                          (72)
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12.4px',
                          color: '#55534D',
                          padding: '2px 0'
                        }}
                      >
                        <span
                          style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '3.5px',
                            border: '1.5px solid #cbd5e1',
                            background: '#FFFFFF',
                            flexShrink: 0
                          }}
                        />
                        <span style={{ flex: 1, lineHeight: 1.25, fontWeight: 500 }}>Others</span>
                        <span
                          style={{
                            fontSize: '11.2px',
                            color: '#55534D',
                            fontWeight: 600,
                            opacity: 0.85
                          }}
                        >
                          (58)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Categories */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      paddingTop: '6px',
                      borderTop: '1px solid rgba(0,0,0,0.05)'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flex: 1,
                          padding: '4px 0'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#55534D"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                          <span
                            style={{
                              fontSize: '13.4px',
                              fontWeight: 700,
                              color: '#1A1A19',
                              letterSpacing: '-0.1px'
                            }}
                          >
                            Categories
                          </span>
                        </div>
                        {cs && (
                          <span
                            style={{
                              background: 'rgba(113,34,44,0.1)',
                              color: '#71222c',
                              fontSize: '10.5px',
                              fontWeight: 800,
                              padding: '1px 6px',
                              borderRadius: '9999px',
                              letterSpacing: '0.2px'
                            }}
                          >
                            1
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: '10.9px',
                          fontWeight: 700,
                          color: '#55534D',
                          padding: '2px 6px',
                          lineHeight: 1
                        }}
                      >
                        All
                      </span>
                    </div>

                    <div
                      style={{
                        paddingTop: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <div
                        data-cue="case"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12.4px',
                          color: cs ? '#1A1A19' : '#55534D',
                          padding: '2px 0'
                        }}
                      >
                        <span
                          style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '3.5px',
                            border: `1.5px solid ${cs ? '#1c4980' : '#cbd5e1'}`,
                            background: cs ? '#1c4980' : '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'all .15s ease',
                            transform: press.case
                          }}
                        >
                          {cs && (
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#FFFFFF"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </span>
                        <span style={{ flex: 1, lineHeight: 1.25, fontWeight: 500 }}>
                          Case Comps
                        </span>
                        <span
                          style={{
                            fontSize: '11.2px',
                            color: '#55534D',
                            fontWeight: 600,
                            opacity: 0.85
                          }}
                        >
                          (64)
                        </span>
                      </div>

                      {cs && (
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '4px',
                            padding: '4px 6px 8px 24px'
                          }}
                        >
                          <span
                            data-cue="fin"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2.5px 8px',
                              fontSize: '10.9px',
                              fontWeight: 600,
                              borderRadius: '6px',
                              border: `1px solid ${fin ? '#0F3FFE' : '#E7E6E2'}`,
                              background: fin ? '#0F3FFE' : '#FFFFFF',
                              color: fin ? '#FFFFFF' : '#55534D',
                              lineHeight: 1.3,
                              transition: 'all .15s ease',
                              transform: press.fin
                            }}
                          >
                            <span>Finance & Valuation</span>
                            {fin && <span>✓</span>}
                          </span>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '2.5px 8px',
                              fontSize: '10.9px',
                              fontWeight: 600,
                              borderRadius: '6px',
                              border: '1px solid #E7E6E2',
                              background: '#FFFFFF',
                              color: '#55534D',
                              lineHeight: 1.3
                            }}
                          >
                            Strategy & Consulting
                          </span>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '2.5px 8px',
                              fontSize: '10.9px',
                              fontWeight: 600,
                              borderRadius: '6px',
                              border: '1px solid #E7E6E2',
                              background: '#FFFFFF',
                              color: '#55534D',
                              lineHeight: 1.3
                            }}
                          >
                            Marketing & Brand
                          </span>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '2.5px 8px',
                              fontSize: '10.9px',
                              fontWeight: 600,
                              borderRadius: '6px',
                              border: '1px solid #E7E6E2',
                              background: '#FFFFFF',
                              color: '#55534D',
                              lineHeight: 1.3
                            }}
                          >
                            B-Plan & Pitch
                          </span>
                        </div>
                      )}

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12.4px',
                          color: '#55534D',
                          padding: '2px 0'
                        }}
                      >
                        <span
                          style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '3.5px',
                            border: '1.5px solid #cbd5e1',
                            background: '#FFFFFF',
                            flexShrink: 0
                          }}
                        />
                        <span style={{ flex: 1, lineHeight: 1.25, fontWeight: 500 }}>
                          Hackathons
                        </span>
                        <span
                          style={{
                            fontSize: '11.2px',
                            color: '#55534D',
                            fontWeight: 600,
                            opacity: 0.85
                          }}
                        >
                          (41)
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12.4px',
                          color: '#55534D',
                          padding: '2px 0'
                        }}
                      >
                        <span
                          style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '3.5px',
                            border: '1.5px solid #cbd5e1',
                            background: '#FFFFFF',
                            flexShrink: 0
                          }}
                        />
                        <span style={{ flex: 1, lineHeight: 1.25, fontWeight: 500 }}>
                          Quizzes
                        </span>
                        <span
                          style={{
                            fontSize: '11.2px',
                            color: '#55534D',
                            fontWeight: 600,
                            opacity: 0.85
                          }}
                        >
                          (27)
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12.4px',
                          color: '#55534D',
                          padding: '2px 0'
                        }}
                      >
                        <span
                          style={{
                            width: '14px',
                            height: '14px',
                            borderRadius: '3.5px',
                            border: '1.5px solid #cbd5e1',
                            background: '#FFFFFF',
                            flexShrink: 0
                          }}
                        />
                        <span style={{ flex: 1, lineHeight: 1.25, fontWeight: 500 }}>
                          Debates
                        </span>
                        <span
                          style={{
                            fontSize: '11.2px',
                            color: '#55534D',
                            fontWeight: 600,
                            opacity: 0.85
                          }}
                        >
                          (22)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Entry Fee */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      paddingTop: '6px',
                      borderTop: '1px solid rgba(0,0,0,0.05)',
                      gap: '4px'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '11.4px',
                        fontWeight: 700,
                        color: '#55534D',
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px',
                        padding: '1px 0'
                      }}
                    >
                      Entry Fee
                    </span>
                    <div
                      style={{
                        display: 'flex',
                        border: '1px solid #E7E6E2',
                        borderRadius: '7px',
                        padding: '2px',
                        gap: '2px',
                        width: '100%'
                      }}
                    >
                      <span
                        style={{
                          flex: 1,
                          fontSize: '11.5px',
                          padding: '4px 5px',
                          borderRadius: '5px',
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          background: !free ? '#FFFFFF' : 'transparent',
                          color: !free ? '#1A1A19' : '#55534D',
                          fontWeight: !free ? 700 : 600,
                          boxShadow: !free ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                          transition: 'all .15s ease'
                        }}
                      >
                        All
                      </span>
                      <span
                        data-cue="free"
                        style={{
                          flex: 1,
                          fontSize: '11.5px',
                          padding: '4px 5px',
                          borderRadius: '5px',
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          background: free ? '#FFFFFF' : 'transparent',
                          color: free ? '#1A1A19' : '#55534D',
                          fontWeight: free ? 700 : 600,
                          boxShadow: free ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                          transition: 'all .15s ease',
                          transform: press.free
                        }}
                      >
                        Free
                      </span>
                      <span
                        style={{
                          flex: 1,
                          fontSize: '11.5px',
                          fontWeight: 600,
                          padding: '4px 5px',
                          borderRadius: '5px',
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          color: '#55534D'
                        }}
                      >
                        Paid
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Slide 1: Browse */}
              {currentStep === 1 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    width: '100%',
                    maxWidth: '330px'
                  }}
                >
                  {/* Applied Filter Chips */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        opacity: fade(150),
                        transform: `translateY(${after(150) ? '0px' : '6px'})`,
                        transition: 'opacity .25s ease, transform .25s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        fontSize: '11.5px',
                        borderRadius: '999px',
                        padding: '2.5px 9px',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.3,
                        background: '#F2F1ED',
                        color: '#1A1A19',
                        border: '1px solid #E7E6E2',
                        fontWeight: 700
                      }}
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ flex: 'none', marginRight: '4px' }}
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <polyline points="19 12 12 19 5 12" />
                      </svg>
                      Closing soonest
                    </span>
                    <span
                      style={{
                        opacity: fade(330),
                        transform: `translateY(${after(330) ? '0px' : '6px'})`,
                        transition: 'opacity .25s ease, transform .25s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        borderRadius: '999px',
                        padding: '2.5px 9px',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.3,
                        background: 'rgba(15,63,254,0.07)',
                        color: '#0F3FFE',
                        border: '1px solid rgba(15,63,254,0.20)'
                      }}
                    >
                      DU Circuit
                    </span>
                    <span
                      style={{
                        opacity: fade(510),
                        transform: `translateY(${after(510) ? '0px' : '6px'})`,
                        transition: 'opacity .25s ease, transform .25s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        borderRadius: '999px',
                        padding: '2.5px 9px',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.3,
                        background: 'rgba(15,63,254,0.07)',
                        color: '#0F3FFE',
                        border: '1px solid rgba(15,63,254,0.20)'
                      }}
                    >
                      Case Comps
                    </span>
                    <span
                      style={{
                        opacity: fade(690),
                        transform: `translateY(${after(690) ? '0px' : '6px'})`,
                        transition: 'opacity .25s ease, transform .25s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        borderRadius: '999px',
                        padding: '2.5px 9px',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.3,
                        background: 'rgba(15,63,254,0.07)',
                        color: '#0F3FFE',
                        border: '1px solid rgba(15,63,254,0.20)'
                      }}
                    >
                      Free
                    </span>
                    <span
                      style={{
                        opacity: fade(870),
                        transition: 'opacity .25s ease',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        color: '#0F3FFE',
                        padding: '2px 4px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Edit in Browse
                    </span>
                  </div>

                  {/* Window of Scrollable Competition Cards */}
                  <div
                    ref={winRef}
                    style={{
                      height: '360px',
                      overflow: 'hidden',
                      display: 'flex',
                      justifyContent: 'center',
                      WebkitMaskImage:
                        'linear-gradient(180deg, transparent 0, #000 4%, #000 88%, transparent 100%)',
                      maskImage:
                        'linear-gradient(180deg, transparent 0, #000 4%, #000 88%, transparent 100%)',
                      opacity: fade(900),
                      transition: 'opacity .35s ease'
                    }}
                  >
                    <div
                      ref={gridRef}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '302px',
                        gap: '12px',
                        padding: '8px 2px 24px',
                        alignSelf: 'flex-start',
                        transform: `translateY(-${scroll}px)`
                      }}
                    >
                      {CARDS.map((c, i) => {
                        const u = URGENCY_CONFIG[c.urgency];
                        return (
                          <div
                            key={i}
                            style={{
                              border: `1px solid ${u.bd}`,
                              background: u.bg,
                              boxShadow: u.sh,
                              borderRadius: '12px',
                              display: 'flex',
                              flexDirection: 'column',
                              width: '302px',
                              padding: '16px 17px 17px',
                              gap: '12px'
                            }}
                          >
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '40px minmax(0,1fr)',
                                alignItems: 'start',
                                gap: '11px'
                              }}
                            >
                              <div
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '9px',
                                  border: '1px solid #E7E6E2',
                                  background: '#F2F1ED',
                                  color: '#55534D',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  overflow: 'hidden',
                                  flex: 'none',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                                  position: 'relative'
                                }}
                              >
                                {c.ini}
                                <span
                                  style={{
                                    position: 'absolute',
                                    inset: '2px',
                                    backgroundImage: `url("${LOGOS[c.ini]}")`,
                                    backgroundPosition: 'center',
                                    backgroundSize: 'contain',
                                    backgroundRepeat: 'no-repeat'
                                  }}
                                />
                              </div>
                              <span
                                style={{
                                  fontSize: '13px',
                                  fontWeight: 500,
                                  color: '#55534D',
                                  lineHeight: 1.35,
                                  paddingTop: '2px'
                                }}
                              >
                                {c.host}
                              </span>
                            </div>

                            <h3
                              style={{
                                margin: 0,
                                fontSize: '16px',
                                fontWeight: 700,
                                lineHeight: 1.35,
                                letterSpacing: '-0.01em',
                                color: '#1A1A19',
                                minHeight: '42px',
                                textWrap: 'pretty'
                              }}
                            >
                              {c.title}
                            </h3>

                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '8px',
                                background: 'rgba(16,185,129,0.08)',
                                border: '1px solid rgba(16,185,129,0.22)',
                                borderRadius: '10px',
                                padding: '8px 12px'
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '7px',
                                  minWidth: 0,
                                  flex: 1
                                }}
                              >
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="#059669"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                                  <path d="M4 22h16" />
                                  <path d="M10 14.66V17c0 .55-.45 1-1 1H7" />
                                  <path d="M14 14.66V17c0 .55.45 1 1 1h2" />
                                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
                                </svg>
                                <span
                                  style={{
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    color: '#047857',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                  }}
                                >
                                  {c.prize}
                                </span>
                              </div>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '2px 7px',
                                  borderRadius: '5px',
                                  letterSpacing: '0.2px',
                                  flexShrink: 0,
                                  whiteSpace: 'nowrap',
                                  background: '#FFFFFF',
                                  color: '#10B981',
                                  border: '1px solid rgba(16,185,129,0.32)'
                                }}
                              >
                                Free Entry
                              </span>
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '12px',
                                color: '#55534D',
                                fontWeight: 600,
                                minHeight: '20px',
                                flexWrap: 'wrap'
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                <svg
                                  width="13"
                                  height="13"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="#55534D"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                  <circle cx="9" cy="7" r="4" />
                                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                                <span>{c.team}</span>
                              </div>
                              <span
                                style={{
                                  width: '3px',
                                  height: '3px',
                                  borderRadius: '50%',
                                  background: '#E7E6E2',
                                  flexShrink: 0
                                }}
                              />
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                <svg
                                  width="13"
                                  height="13"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="#55534D"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                                  <line x1="16" y1="2" x2="16" y2="6" />
                                  <line x1="8" y1="2" x2="8" y2="6" />
                                  <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                <span>Ends {c.ends}</span>
                              </div>
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '8px',
                                minHeight: '22px'
                              }}
                            >
                              {c.regs ? (
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    fontSize: '12px',
                                    color: '#75736C'
                                  }}
                                >
                                  <svg
                                    width="13"
                                    height="13"
                                    viewBox="0 0 24 24"
                                    fill="#f97316"
                                    stroke="#f97316"
                                    strokeWidth="1"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" />
                                  </svg>
                                  <span>
                                    <strong style={{ color: '#1A1A19' }}>{c.regs}</strong> registrations
                                  </span>
                                </div>
                              ) : (
                                <span style={{ color: '#0F3FFE', fontWeight: 600, fontSize: '11px' }}>
                                  Recently Listed
                                </span>
                              )}
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  border: u.uBd,
                                  borderRadius: '20px',
                                  background: u.uBg,
                                  color: u.uInk,
                                  padding: '3px 9px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                <span
                                  style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: u.uInk,
                                    display: 'inline-block'
                                  }}
                                />
                                <svg
                                  width="11"
                                  height="11"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <circle cx="12" cy="12" r="10" />
                                  <polyline points="12 6 12 12 16 14" />
                                </svg>
                                <span>{c.left}</span>
                              </span>
                            </div>

                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '8px',
                                paddingTop: '4px'
                              }}
                            >
                              <div
                                style={{
                                  border: '1px solid #0F3FFE',
                                  borderRadius: '9px',
                                  background: '#0F3FFE',
                                  color: '#FFFFFF',
                                  padding: '9px 10px',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  whiteSpace: 'nowrap',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '5px'
                                }}
                              >
                                <span>Apply</span>
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="#FFFFFF"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                  <polyline points="15 3 21 3 21 9" />
                                  <line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                              </div>
                              <div
                                style={{
                                  border: '1px solid #E7E6E2',
                                  borderRadius: '9px',
                                  background: '#FFFFFF',
                                  color: '#1A1A19',
                                  padding: '9px 10px',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  whiteSpace: 'nowrap',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '5px'
                                }}
                              >
                                <svg
                                  width="13"
                                  height="13"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="#1A1A19"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                  <circle cx="9" cy="7" r="4" />
                                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                                <span>Squad up</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Slide 2: Bookmarks */}
              {currentStep === 2 && (
                <div
                  style={{
                    width: '296px',
                    flex: 'none',
                    minHeight: '274px',
                    background: '#FFFDF5',
                    border: '1.5px solid rgba(245,158,11,0.40)',
                    borderRadius: '16px',
                    padding: '14px 15px 15px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    boxShadow: '0 8px 22px rgba(0,0,0,0.06)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        minWidth: 0,
                        flex: 1
                      }}
                    >
                      <div
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '7px',
                          border: '1px solid #E7E6E2',
                          background: '#F2F1ED',
                          color: '#55534D',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          flex: 'none',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                          userSelect: 'none',
                          position: 'relative'
                        }}
                      >
                        SR
                        <span
                          style={{
                            position: 'absolute',
                            inset: '2px',
                            backgroundImage: `url("${LOGOS.SR}")`,
                            backgroundPosition: 'center',
                            backgroundSize: 'contain',
                            backgroundRepeat: 'no-repeat'
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 500,
                          color: '#55534D',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        Shri Ram College of Commerce (SRCC)
                      </span>
                    </div>
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #E7E6E2',
                        background: '#F2F1ED',
                        color: '#75736C',
                        fontSize: '14px',
                        fontWeight: 500,
                        borderRadius: '7px',
                        lineHeight: 1,
                        flexShrink: 0
                      }}
                    >
                      ×
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: '#1A1A19',
                      lineHeight: 1.25,
                      margin: 0,
                      minHeight: '38px'
                    }}
                  >
                    SRCC Business Conclave Case Challenge 2026
                  </h3>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      padding: '10px 12px',
                      borderRadius: '11px',
                      background: '#FFFBEB',
                      border: '1px solid rgba(245,158,11,0.28)'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          color: '#D97706',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Round 2 of 3
                      </span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 600,
                          lineHeight: 1.2,
                          whiteSpace: 'nowrap',
                          background: '#FFFBEB',
                          border: '1px solid #FCD34D',
                          color: '#D97706'
                        }}
                      >
                        Closing soon
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '13.5px',
                        fontWeight: 700,
                        color: '#1A1A19',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.3,
                        marginTop: '1px'
                      }}
                    >
                      Executive Case Deck &amp; Pitch
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                        fontSize: '11.5px',
                        fontWeight: 500,
                        marginTop: '1px'
                      }}
                    >
                      <span style={{ color: '#55534D', whiteSpace: 'nowrap' }}>
                        Due 12 Oct, 11:59 PM
                      </span>
                      <span
                        style={{
                          fontWeight: 600,
                          fontVariantNumeric: 'tabular-nums',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: '#D97706',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <span style={{ fontSize: '12px' }}>⏱</span>
                        <span>{timerText}</span>
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '4px',
                      fontSize: '11.5px',
                      color: '#75736C',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      padding: '1px 2px',
                      minHeight: '18px'
                    }}
                  >
                    <span style={{ fontSize: '12px' }}>→</span>
                    <span>Next: </span>
                    <span
                      style={{
                        color: '#1A1A19',
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      National Grand Finale
                    </span>
                    <span style={{ color: '#55534D', fontWeight: 500 }}> · 20 Oct</span>
                  </div>

                  <div
                    data-cue="open"
                    style={{
                      transform: press.open,
                      transition: 'transform .12s ease, background .12s ease',
                      marginTop: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      width: '100%',
                      height: '38px',
                      borderRadius: '10px',
                      background: openBg,
                      color: '#FFFFFF',
                      fontSize: '13.5px',
                      fontWeight: 600
                    }}
                  >
                    <span>Open Portal</span>
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Slide 3: Team finder */}
              {currentStep === 3 && (
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E7E6E2',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    width: '302px',
                    flex: 'none',
                    padding: '16px 17px 17px',
                    gap: '12px',
                    boxShadow: '0 4px 18px rgba(0,0,0,0.06)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }}
                  >
                    <span
                      style={{
                        background: 'rgba(15,63,254,0.08)',
                        color: '#0F3FFE',
                        border: '1px solid rgba(15,63,254,0.35)',
                        borderRadius: '20px',
                        padding: '2px 9px',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.02em',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      1 spot left
                    </span>
                    <span style={{ fontSize: '12px', color: '#75736C', whiteSpace: 'nowrap' }}>
                      2h ago
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: '#0F3FFE',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        fontWeight: 700,
                        flex: 'none'
                      }}
                    >
                      D
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          flexWrap: 'wrap'
                        }}
                      >
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A19' }}>
                          Devanshi K.
                        </span>
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: '#16A34A',
                            display: 'inline-block'
                          }}
                        />
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#75736C',
                          marginTop: '1px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        SRCC · UG 3rd Year
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #E7E6E2', paddingTop: '10px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#75736C',
                        textTransform: 'uppercase'
                      }}
                    >
                      Competing in
                    </span>
                    <h3
                      style={{
                        margin: '3px 0 0',
                        fontSize: '15px',
                        fontWeight: 700,
                        color: '#1A1A19',
                        lineHeight: 1.35,
                        textWrap: 'pretty'
                      }}
                    >
                      SRCC Business Conclave Case Challenge 2026
                    </h3>
                    <div style={{ marginTop: '5px' }}>
                      <span style={{ fontSize: '12px', color: '#55534D' }}>
                        Shri Ram College of Commerce (SRCC)
                      </span>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#75736C' }}>
                      Teammates needed with:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
                      <span
                        style={{
                          background: 'rgba(15,63,254,0.08)',
                          color: '#0F3FFE',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Financial Modeling
                      </span>
                      <span
                        style={{
                          background: 'rgba(15,63,254,0.08)',
                          color: '#0F3FFE',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Deck Design
                      </span>
                      <span
                        style={{
                          background: 'rgba(15,63,254,0.08)',
                          color: '#0F3FFE',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Pitching
                      </span>
                    </div>
                  </div>

                  <div style={{ paddingTop: '10px', borderTop: '1px solid #E7E6E2' }}>
                    {!requested ? (
                      <div
                        data-cue="join"
                        style={{
                          transform: press.join,
                          transition: 'transform .12s ease',
                          width: '100%',
                          border: '1px solid #0F3FFE',
                          borderRadius: '9px',
                          background: '#0F3FFE',
                          color: '#FFFFFF',
                          padding: '10px 14px',
                          fontSize: '13px',
                          fontWeight: 600,
                          textAlign: 'center'
                        }}
                      >
                        Request to join
                      </div>
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          border: '1px solid #E7E6E2',
                          borderRadius: '9px',
                          background: '#F2F1ED',
                          color: '#75736C',
                          padding: '10px 14px',
                          fontSize: '13px',
                          fontWeight: 600,
                          textAlign: 'center'
                        }}
                      >
                        Requested  -  pending
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Slide 4: Requests */}
              {currentStep === 4 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%'
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '340px',
                      background: '#FFFFFF',
                      border: '1px solid #E7E6E2',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 18px rgba(0,0,0,0.06)'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        padding: '16px 18px'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '9px',
                            flexWrap: 'wrap'
                          }}
                        >
                          <span style={{ fontSize: '14px', fontWeight: 600, color: '#1A1A19' }}>
                            Ananya Sharma
                          </span>
                          {!accepted ? (
                            <span
                              style={{
                                borderRadius: '20px',
                                padding: '2px 9px',
                                fontSize: '11px',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                background: '#F9F9F7',
                                color: '#75736C',
                                border: '1px solid #E7E6E2'
                              }}
                            >
                              Pending
                            </span>
                          ) : (
                            <span
                              style={{
                                borderRadius: '20px',
                                padding: '2px 9px',
                                fontSize: '11px',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                background: 'rgba(22,163,74,0.15)',
                                color: '#16A34A',
                                border: '1px solid rgba(22,163,74,0.35)'
                              }}
                            >
                              Accepted
                            </span>
                          )}
                        </div>
                        <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#75736C' }}>
                          IIT Delhi · applied to SRCC Business Conclave Case Challenge 2026
                        </p>
                        <p
                          style={{
                            margin: '9px 0 0',
                            fontSize: '13px',
                            color: '#1A1A19',
                            lineHeight: 1.5,
                            borderLeft: '2px solid #E7E6E2',
                            paddingLeft: '11px'
                          }}
                        >
                          Built the financial model for our Round 1 deck. Happy to own the numbers.
                        </p>
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '6px',
                            marginTop: '9px'
                          }}
                        >
                          <span
                            style={{
                              background: '#F2F1ED',
                              borderRadius: '6px',
                              padding: '3px 8px',
                              fontSize: '11px',
                              fontWeight: 500,
                              color: '#55534D',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Financial Modeling
                          </span>
                          <span
                            style={{
                              background: '#F2F1ED',
                              borderRadius: '6px',
                              padding: '3px 8px',
                              fontSize: '11px',
                              fontWeight: 500,
                              color: '#55534D',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Excel
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          data-cue="chat"
                          style={{
                            border: '1px solid #0F3FFE',
                            borderRadius: '8px',
                            background: chatBg,
                            color: chatInk,
                            transition: 'all .12s ease',
                            padding: '8px 12px',
                            whiteSpace: 'nowrap',
                            fontSize: '13px',
                            fontWeight: 600,
                            minHeight: '38px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                          <span>Chat</span>
                        </span>
                        {!accepted ? (
                          <>
                            <span
                              style={{
                                border: '1px solid #E7E6E2',
                                borderRadius: '8px',
                                background: '#FFFFFF',
                                color: '#55534D',
                                padding: '8px 14px',
                                whiteSpace: 'nowrap',
                                fontSize: '13px',
                                fontWeight: 500,
                                minHeight: '38px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              Decline
                            </span>
                            <span
                              data-cue="accept"
                              style={{
                                transform: press.accept,
                                transition: 'transform .12s ease',
                                border: '1px solid #0F3FFE',
                                borderRadius: '8px',
                                background: '#0F3FFE',
                                color: '#FFFFFF',
                                padding: '8px 14px',
                                whiteSpace: 'nowrap',
                                fontSize: '13px',
                                fontWeight: 600,
                                minHeight: '38px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              Accept
                            </span>
                          </>
                        ) : (
                          <span
                            data-cue="wa"
                            style={{
                              border: '1px solid #16A34A',
                              borderRadius: '8px',
                              background: '#16A34A',
                              color: '#FFFFFF',
                              padding: '8px 14px',
                              whiteSpace: 'nowrap',
                              fontSize: '13px',
                              fontWeight: 600,
                              minHeight: '38px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            WhatsApp
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      opacity: capOp,
                      transition: 'opacity .3s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      width: '100%',
                      maxWidth: '340px',
                      marginTop: '12px',
                      fontSize: '12px',
                      color: '#75736C'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: '#0F3FFE',
                          flex: 'none'
                        }}
                      />
                      <span>
                        <strong style={{ color: '#1A1A19', fontWeight: 600 }}>chat</strong> stays on
                        onestop, no number shared
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: '#16A34A',
                          flex: 'none'
                        }}
                      />
                      <span>
                        <strong style={{ color: '#1A1A19', fontWeight: 600 }}>whatsapp</strong> opens a
                        direct chat with the context prefilled
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Slide 5: Profile */}
              {currentStep === 5 && (
                <div
                  style={{
                    width: '100%',
                    maxWidth: '340px',
                    background: '#FFFFFF',
                    border: '1px solid #E7E6E2',
                    borderRadius: '12px',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    boxShadow: '0 4px 18px rgba(0,0,0,0.06)'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <h1
                      style={{
                        margin: 0,
                        fontSize: '22px',
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                        lineHeight: 1.2,
                        color: '#1A1A19',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Good evening, Aarav
                    </h1>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12.5px',
                        color: '#75736C'
                      }}
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#0F3FFE"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                        <path d="M6 12v5c3 3 9 3 12 0v-5" />
                      </svg>
                      <span style={{ color: '#55534D', fontWeight: 500 }}>SRCC</span>
                      <span style={{ color: '#75736C' }}>·</span>
                      <span style={{ color: '#75736C' }}>UG 2nd Year</span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      rowGap: '8px',
                      alignItems: 'stretch',
                      marginLeft: '-18px'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '2px',
                        padding: '2px 18px',
                        borderLeft: '1px solid #E7E6E2'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '20px',
                          fontWeight: 700,
                          letterSpacing: '-0.02em',
                          lineHeight: 1.15,
                          color: '#1A1A19',
                          fontVariantNumeric: 'tabular-nums'
                        }}
                      >
                        {k1}
                      </span>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 500,
                          color: '#75736C',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        new today
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '2px',
                        padding: '2px 18px',
                        borderLeft: '1px solid #E7E6E2'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '20px',
                          fontWeight: 700,
                          letterSpacing: '-0.02em',
                          lineHeight: 1.15,
                          color: '#1A1A19',
                          fontVariantNumeric: 'tabular-nums'
                        }}
                      >
                        {k2}
                      </span>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 500,
                          color: '#75736C',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        squads for you
                      </span>
                    </div>

                    <div
                      data-cue="req"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '2px',
                        padding: '2px 18px',
                        borderLeft: '1px solid #E7E6E2',
                        opacity: reqOp,
                        transition: 'opacity .14s ease'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '20px',
                          fontWeight: 700,
                          letterSpacing: '-0.02em',
                          lineHeight: 1.15,
                          color: '#0F3FFE',
                          fontVariantNumeric: 'tabular-nums'
                        }}
                      >
                        {k3}
                      </span>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 500,
                          color: '#75736C',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        requests
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Ripple Click Indicator */}
            <div
              style={{
                position: 'absolute',
                left: `${cur.x - 14}px`,
                top: `${cur.y - 14}px`,
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'rgba(15, 63, 254, 0.25)',
                opacity: k >= 0 ? 1 - k : 0,
                transform: `scale(${k >= 0 ? 0.4 + k * 1.1 : 0.4})`,
                pointerEvents: 'none',
                zIndex: 4
              }}
            />

            {/* Animated Fake Cursor */}
            <div
              style={{
                position: 'absolute',
                left: `${cur.x}px`,
                top: `${cur.y}px`,
                opacity: cur.op,
                transform: `scale(${cur.clickCue ? 0.85 : 1})`,
                transformOrigin: '0 0',
                transition: 'transform .1s ease',
                pointerEvents: 'none',
                zIndex: 5,
                filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.25))'
              }}
            >
              <svg width="20" height="22" viewBox="0 0 20 22">
                <path
                  d="M1.5 1.5 L1.5 17.5 L5.6 13.8 L8.4 20.2 L11.2 19 L8.5 12.7 L14 12.7 Z"
                  fill="#1A1A19"
                  stroke="#FFFFFF"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="walkthrough-footer">
          {/* Step Indicator Dots */}
          <div className="walkthrough-dots" role="tablist" aria-label="Walkthrough progress">
            {SLIDES.map((s, idx) => {
              const isPast = idx < currentStep;
              const isActive = idx === currentStep;
              const width = isActive ? '24px' : '8px';
              const bg = isPast
                ? '#0F3FFE'
                : isActive
                ? 'rgba(15, 63, 254, 0.18)'
                : '#E7E6E2';
              const fillPercent = isActive
                ? `${Math.min(100, (t / SCRIPTS[currentStep].len) * 100)}%`
                : '0%';

              return (
                <button
                  key={s.id}
                  type="button"
                  className="walkthrough-dot"
                  onClick={() => goToSlide(idx)}
                  style={{
                    width,
                    backgroundColor: bg
                  }}
                  aria-label={`Go to slide ${idx + 1}: ${s.badge}`}
                >
                  <span
                    className="walkthrough-dot-fill"
                    style={{
                      width: fillPercent
                    }}
                  />
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="walkthrough-actions">
            <button
              type="button"
              className="walkthrough-skip-btn"
              onClick={handleSkip}
            >
              Skip
            </button>

            {!isFirst && (
              <button
                type="button"
                className="walkthrough-prev-btn"
                onClick={handlePrev}
              >
                Back
              </button>
            )}

            <button
              type="button"
              className="walkthrough-next-btn"
              onClick={handleNext}
            >
              <span>{isLast ? 'Set up profile' : 'Next'}</span>
              <ArrowRightIcon size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
