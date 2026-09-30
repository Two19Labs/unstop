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
  ShieldCheckIcon
} from './icons';
import OneStopLogo from './OneStopLogo';
import { trackEvent } from '../lib/posthog';
import './WalkthroughModal.css';

const SLIDES = [
  {
    id: 'curated-speed',
    badge: 'Curated Speed Layer',
    badgeIcon: ZapIcon,
    title: 'Supercharge Your Case Comps & Hackathons',
    subtitle: 'The collegiate speed layer for Unstop competitions',
    description:
      'Skip digging through 10,000+ cluttered listings. OneStop hand-curates premier corporate & collegiate circuits—including Tata Imagination, Flipkart GRiD, L’Oréal Brandstorm, Reliance TUP, and the DU Circuit—with instant eligibility checks.',
    previewType: 'competition',
    previewData: {
      tag: 'Premier Circuit',
      title: 'Flipkart GRiD 6.0 — Robotics & Tech Challenge',
      host: 'Flipkart · Engineering Circuit',
      prize: '₹5,25,000 Cash Pool',
      deadline: 'Closing in 2 days',
      format: 'Teams of 2–3 · Free Entry'
    }
  },
  {
    id: 'round-deadlines',
    badge: 'Multi-Round Deadlines',
    badgeIcon: ClockIcon,
    title: 'Never Miss a Submission Cutoff Again',
    subtitle: 'Live multi-round countdowns & emergency alerts',
    description:
      'Competitions don’t just have one deadline. Track Round 1 online quizzes, Round 2 executive case summaries, and Round 3 finals with real-time countdowns, automated revalidation, and instant desktop alerts before server locks.',
    previewType: 'rounds',
    previewData: {
      comp: 'Tata Imagination Challenge 2026',
      rounds: [
        { name: 'Round 1: Online Brand Quiz', status: 'completed', text: 'Completed · 100% Score' },
        { name: 'Round 2: Detailed Case Deck', status: 'active', text: 'Submissions close in 14h 22m' },
        { name: 'Round 3: National Grand Finale', status: 'upcoming', text: 'Live Presentation at Mumbai' }
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
      'Don’t scramble solo or settle for random groups. Recruit high-caliber peers from SRCC, IIT, IIM, BITS, SSCBS, and colleges across India. Filter by skills—developers, financial modelers, deck designers, and pitch presenters.',
    previewType: 'squad',
    previewData: {
      role: 'Seeking: Financial Analyst & UI Deck Lead',
      competition: 'L’Oréal Brandstorm 2026',
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
      'When a squad lead accepts your application—or when you accept a prospective teammate—OneStop provides a direct WhatsApp connection prefilled with the competition context so you can immediately begin working on your pitch deck.',
    previewType: 'whatsapp',
    previewData: {
      recipient: 'Ananya Sharma (IIT Delhi)',
      comp: 'Reliance TUP 9.0',
      message: 'Hey Ananya! Connecting regarding our squad for "Reliance TUP 9.0". Let’s sync on the problem statement!'
    }
  },
  {
    id: 'catered-profile',
    badge: 'Personalized For You',
    badgeIcon: SparklesIcon,
    title: 'Build Your Profile & Unlock Catered Matches',
    subtitle: 'Personalized opportunities & teammate recruiting',
    description:
      'Set your college, degree (UG vs. PG), and core superpowers. OneStop filters out competitions you aren’t eligible for, highlights dream matches, and lets squad leaders recruit you directly.',
    previewType: 'profile_perks',
    previewData: {
      perks: [
        { icon: '🎯', title: 'Catered Competition Feed', desc: 'Curated strictly for your college and course eligibility.' },
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
              <div className="wt-preview-comp-card">
                <div className="wt-preview-comp-header">
                  <span className="wt-pill-circuit">{slide.previewData.tag}</span>
                  <span className="wt-pill-deadline">{slide.previewData.deadline}</span>
                </div>
                <h4 className="wt-preview-comp-title">{slide.previewData.title}</h4>
                <div className="wt-preview-comp-host">{slide.previewData.host}</div>
                <div className="wt-preview-comp-meta">
                  <div className="wt-meta-item">
                    <span className="wt-meta-label">Prize</span>
                    <span className="wt-meta-val wt-val-prize">{slide.previewData.prize}</span>
                  </div>
                  <div className="wt-meta-item">
                    <span className="wt-meta-label">Participation</span>
                    <span className="wt-meta-val">{slide.previewData.format}</span>
                  </div>
                </div>
                <div className="wt-preview-comp-footer">
                  <span className="wt-speed-badge">⚡ Instant 1-Click Verification</span>
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
