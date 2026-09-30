// src/components/WalkthroughModal.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  TrophyIcon,
  UsersIcon,
  ClockIcon,
  WhatsAppIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckIcon,
  CloseIcon,
  ZapIcon,
  ShieldCheckIcon,
  FlameIcon,
  CalendarIcon
} from './icons';
import InstitutionLogo from './InstitutionLogo';
import OneStopLogo from './OneStopLogo';
import { trackEvent } from '../lib/posthog';
import './WalkthroughModal.css';

const SLIDES = [
  {
    id: 'curated-speed',
    badge: 'Curated Speed Layer',
    badgeIcon: ZapIcon,
    title: 'Every Premier Student Competition in One Place',
    subtitle: 'Aggregated & verified across top platforms, circuits & campus portals',
    description:
      'Skip digging through fragmented portals and cluttered listings. OneStop aggregates and curates high-impact student competitions across India—from corporate flagships (Tata, Flipkart, L’Oréal, Reliance) to university circuits (DU, IITs, IIMs, BITS)—covering case challenges, hackathons, quizzes, simulations, and corporate awards with instant eligibility verification.',
    previewType: 'competition',
    previewData: {
      circuit: 'Premier Corporate Circuit',
      title: 'Tata Imagination Challenge 2026',
      host: 'Tata Sons',
      logo: 'https://d8it4huxumps7.cloudfront.net/uploads/images/150x150/uploadedManual-66c3426e256b7_tata.png',
      prize: '₹5,00,000 Cash Pool',
      fee: 'Free',
      team: '1–3 Members',
      mode: 'Online · National Track',
      registrations: '18,450',
      countdown: 'Closing in 2 days',
      squadCount: 3
    }
  },
  {
    id: 'round-deadlines',
    badge: 'Multi-Round Deadlines',
    badgeIcon: ClockIcon,
    title: 'Never Miss a Submission Cutoff Again',
    subtitle: 'Live multi-round countdowns & emergency alerts',
    description:
      'Competitions don’t just have one deadline. Track online quizzes, business simulations, executive case summaries, prototype submissions, and national finals with real-time countdowns and instant desktop alerts before server locks.',
    previewType: 'rounds',
    previewData: {
      comp: 'Tata Imagination Challenge 2026',
      rounds: [
        { name: 'Round 1: Online Brand & Logic Quiz', status: 'completed', text: 'Completed · 100% Score' },
        { name: 'Round 2: Executive Case Deck & Pitch', status: 'active', text: 'Submissions close in 14h 22m' },
        { name: 'Round 3: National Grand Finale Presentation', status: 'upcoming', text: 'Live Jury Round · Mumbai' }
      ]
    }
  },
  {
    id: 'squad-finder',
    badge: 'Collegiate Squad Finder',
    badgeIcon: UsersIcon,
    title: 'Build Your Dream Team Across Colleges',
    subtitle: 'Vetted teammates matching complementary superpowers',
    description:
      'Don’t scramble solo or settle for random groups. Recruit high-caliber peers from SRCC, IIT, IIM, BITS, SSCBS, and colleges across India. Filter by skills—developers, financial modelers, deck designers, researchers, and pitch presenters.',
    previewType: 'squad',
    previewData: {
      role: 'Seeking: Financial Modeling & Deck Design Lead',
      competition: 'Tata Imagination Challenge 2026',
      lead: 'Devanshi K. · SRCC (UG 3rd Year)',
      tags: ['Financial Modeling', 'Deck Design', 'Pitching'],
      urgency: '1 spot remaining'
    }
  },
  {
    id: 'whatsapp-handshake',
    badge: 'Instant Handshake',
    badgeIcon: WhatsAppIcon,
    title: 'Instant 1-Tap WhatsApp Squad Coordination',
    subtitle: 'Zero friction, zero email delay',
    description:
      'When a squad lead accepts your application—or when you accept a prospective teammate—OneStop provides a direct WhatsApp connection prefilled with the competition context so you can immediately begin collaborating on your submission.',
    previewType: 'whatsapp',
    previewData: {
      recipient: 'Ananya Sharma (IIT Delhi)',
      comp: 'Tata Imagination Challenge 2026',
      message: 'Hey Ananya! Connecting regarding our squad for "Tata Imagination Challenge 2026". Let’s sync on the problem statement!'
    }
  },
  {
    id: 'catered-profile',
    badge: 'Personalized For You',
    badgeIcon: SparklesIcon,
    title: 'Build Your Profile & Unlock Catered Matches',
    subtitle: 'Personalized opportunities & teammate recruiting',
    description:
      'Set your college, degree (UG vs. PG), and core superpowers. OneStop filters out competitions you aren’t eligible for across all platforms, highlights dream matches, and lets squad leaders recruit you directly.',
    previewType: 'profile_perks',
    previewData: {
      perks: [
        { icon: '🎯', title: 'Catered Competition Feed', desc: 'Curated strictly for your college and course eligibility across all sources.' },
        { icon: '🚀', title: 'Recruitment Spotlight', desc: 'Squad leads searching for your skills can discover & invite you.' },
        { icon: '🔔', title: 'Multi-Round Push Alerts', desc: 'Get notified before submission windows lock.' }
      ]
    }
  }
];

export default function WalkthroughModal({
  isOpen,
  onClose,
  onComplete
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const touchStartX = useRef(null);

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

  // Keyboard navigation (Arrow keys + Esc)
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
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  const slide = SLIDES[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === SLIDES.length - 1;
  const BadgeIconComponent = slide.badgeIcon;

  const handleNext = () => {
    if (isLast) {
      handleComplete();
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, SLIDES.length - 1));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSkip = () => {
    trackEvent('walkthrough_skipped', { step_index: currentStep });
    if (typeof onComplete === 'function') {
      onComplete();
    } else if (typeof onClose === 'function') {
      onClose();
    }
  };

  const handleComplete = () => {
    trackEvent('walkthrough_completed', { total_steps: SLIDES.length });
    if (typeof onComplete === 'function') {
      onComplete();
    } else if (typeof onClose === 'function') {
      onClose();
    }
  };

  // Touch swipe support for mobile
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) {
      // Swiped left -> next
      handleNext();
    } else if (diff < -50) {
      // Swiped right -> prev
      handlePrev();
    }
    touchStartX.current = null;
  };

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
      >
        {/* Top Header Bar */}
        <div className="walkthrough-header">
          <div className="walkthrough-brand">
            <OneStopLogo height={22} />
            <span className="walkthrough-brand-divider">/</span>
            <span className="walkthrough-brand-tag">TOUR</span>
          </div>

          <div className="walkthrough-header-actions">
            <span className="walkthrough-step-counter">
              {currentStep + 1} of {SLIDES.length}
            </span>
            <button
              type="button"
              className="walkthrough-close-btn"
              onClick={handleSkip}
              aria-label="Skip walkthrough"
              title="Skip walkthrough"
            >
              <CloseIcon size={16} />
            </button>
          </div>
        </div>

        {/* Slide Content Body */}
        <div className="walkthrough-body">
          {/* Left / Top: Copy Section */}
          <div className="walkthrough-text-pane">
            <div className="walkthrough-badge">
              {BadgeIconComponent && <BadgeIconComponent size={14} className="walkthrough-badge-icon" />}
              <span>{slide.badge}</span>
            </div>

            <h2 id="walkthrough-title" className="walkthrough-title">
              {slide.title}
            </h2>

            <p className="walkthrough-subtitle">{slide.subtitle}</p>

            <p className="walkthrough-description">{slide.description}</p>
          </div>

          {/* Right / Bottom: Interactive Visual Preview */}
          <div className="walkthrough-visual-pane">
            {slide.previewType === 'competition' && (
              <div className="home-rail-card wt-authentic-rail-card">
                {/* Top Bar: Host Profile with InstitutionLogo + Circuit Tag */}
                <div className="wt-card-host-row">
                  <InstitutionLogo
                    logo={slide.previewData.logo}
                    name={slide.previewData.host}
                    size={38}
                    borderRadius={9}
                    fontSize={12}
                  />
                  <div className="wt-card-host-meta">
                    <span className="wt-card-host-name">{slide.previewData.host}</span>
                    <span className="wt-card-circuit-tag">{slide.previewData.circuit}</span>
                  </div>
                </div>

                {/* Competition Title */}
                <h3 className="wt-card-title" title={slide.previewData.title}>
                  {slide.previewData.title}
                </h3>

                {/* Featured Prize & Entry Bar */}
                <div className="wt-card-prize-bar">
                  <div className="wt-card-prize-info">
                    <TrophyIcon size={14} color="#059669" />
                    <span className="wt-card-prize-text">{slide.previewData.prize}</span>
                  </div>
                  <span className="wt-card-fee-badge">{slide.previewData.fee}</span>
                </div>

                {/* Specs Row: Team Format + Mode / Location */}
                <div className="wt-card-specs-row">
                  <div className="wt-card-spec-item">
                    <UsersIcon size={13} color="var(--ink-secondary)" />
                    <span>{slide.previewData.team}</span>
                  </div>
                  <span className="wt-card-spec-dot" />
                  <div className="wt-card-spec-item">
                    <CalendarIcon size={13} color="var(--ink-secondary)" />
                    <span>{slide.previewData.mode}</span>
                  </div>
                </div>

                {/* Metrics Row: Registration Social Proof + Live Urgency Countdown Pill */}
                <div className="wt-card-metrics-row">
                  <div className="wt-card-registrations">
                    <FlameIcon size={13} color="#f97316" />
                    <span>
                      <strong>{slide.previewData.registrations}</strong> registrations
                    </span>
                  </div>

                  <span className="wt-card-urgency-pill">
                    <span className="wt-card-pulse-dot" />
                    <ClockIcon size={11} color="var(--primary)" />
                    <span>{slide.previewData.countdown}</span>
                  </span>
                </div>

                {/* Action Buttons Row */}
                <div className="wt-card-actions-grid">
                  <button type="button" className="wt-card-btn-primary" tabIndex={-1}>
                    View Details
                  </button>
                  <button type="button" className="wt-card-btn-secondary" tabIndex={-1}>
                    <UsersIcon size={13} />
                    <span>Find Teammates ({slide.previewData.squadCount})</span>
                  </button>
                </div>
              </div>
            )}

            {slide.previewType === 'rounds' && (
              <div className="wt-preview-rounds-card">
                <div className="wt-rounds-header">
                  <TrophyIcon size={16} />
                  <span>{slide.previewData.comp}</span>
                </div>
                <div className="wt-rounds-timeline">
                  {slide.previewData.rounds.map((r, i) => (
                    <div key={i} className={`wt-round-step wt-round-${r.status}`}>
                      <div className="wt-round-node">
                        {r.status === 'completed' ? (
                          <CheckIcon size={12} color="#FFFFFF" />
                        ) : r.status === 'active' ? (
                          <div className="wt-round-pulse" />
                        ) : (
                          <span className="wt-round-num">{i + 1}</span>
                        )}
                      </div>
                      <div className="wt-round-info">
                        <div className="wt-round-name">{r.name}</div>
                        <div className="wt-round-desc">{r.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {slide.previewType === 'squad' && (
              <div className="wt-preview-squad-card">
                <div className="wt-squad-top">
                  <span className="wt-squad-urgent">{slide.previewData.urgency}</span>
                  <span className="wt-squad-comp">{slide.previewData.competition}</span>
                </div>
                <h4 className="wt-squad-role">{slide.previewData.role}</h4>
                <div className="wt-squad-lead">
                  <UsersIcon size={14} />
                  <span>{slide.previewData.lead}</span>
                </div>
                <div className="wt-squad-tags">
                  {slide.previewData.tags.map((t, idx) => (
                    <span key={idx} className="wt-squad-tag">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="wt-squad-action-preview">
                  <button type="button" className="wt-squad-mock-btn" tabIndex={-1}>
                    Request to Join Squad →
                  </button>
                </div>
              </div>
            )}

            {slide.previewType === 'whatsapp' && (
              <div className="wt-preview-wa-card">
                <div className="wt-wa-header">
                  <div className="wt-wa-avatar">
                    <WhatsAppIcon size={18} />
                  </div>
                  <div>
                    <div className="wt-wa-title">{slide.previewData.recipient}</div>
                    <div className="wt-wa-sub">{slide.previewData.comp}</div>
                  </div>
                </div>
                <div className="wt-wa-chat-bubble">
                  <p>{slide.previewData.message}</p>
                  <span className="wt-wa-time">Just now · Sent via OneStop Handshake</span>
                </div>
                <div className="wt-wa-badge-row">
                  <ShieldCheckIcon size={14} color="#15803D" />
                  <span>Verified phone exchange upon mutual request acceptance</span>
                </div>
              </div>
            )}

            {slide.previewType === 'profile_perks' && (
              <div className="wt-preview-perks-card">
                <div className="wt-perks-list">
                  {slide.previewData.perks.map((p, i) => (
                    <div key={i} className="wt-perk-item">
                      <div className="wt-perk-icon">{p.icon}</div>
                      <div>
                        <div className="wt-perk-title">{p.title}</div>
                        <div className="wt-perk-desc">{p.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="walkthrough-footer">
          {/* Step Indicator Dots */}
          <div className="walkthrough-dots" role="tablist" aria-label="Walkthrough progress">
            {SLIDES.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                className={`walkthrough-dot ${idx === currentStep ? 'active' : ''}`}
                onClick={() => setCurrentStep(idx)}
                aria-label={`Go to slide ${idx + 1}: ${s.badge}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="walkthrough-actions">
            <button
              type="button"
              className="walkthrough-skip-btn"
              onClick={handleSkip}
            >
              Skip tour
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
              <span>{isLast ? 'Build My Profile & Start Winning' : 'Next'}</span>
              <ArrowRightIcon size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
