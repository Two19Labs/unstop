// src/components/WhatIsOneStopTour.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  GraduationCapIcon,
  CheckIcon,
  TrophyIcon,
  ClockIcon,
  BellIcon,
  WhatsAppIcon,
  UsersIcon
} from './icons';
import { TOUR_SLIDES } from '../data/tourSlides';
import './WhatIsOneStopTour.css';


const SLIDE_DURATION_MS = 4800;

export default function WhatIsOneStopTour({ initialStep = 0 }) {
  const [currentStep, setCurrentStep] = useState(initialStep);

  // Auto-play in an infinite loop. Re-armed on every step change so each slide
  // (including one picked via dots/arrows) gets its full duration.
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentStep((prev) => (prev + 1) % TOUR_SLIDES.length);
    }, SLIDE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [currentStep]);

  const handleNext = useCallback(() => {
    setCurrentStep((prev) => (prev + 1) % TOUR_SLIDES.length);
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentStep((prev) => (prev === 0 ? TOUR_SLIDES.length - 1 : prev - 1));
  }, []);

  const goToStep = useCallback((stepIdx) => {
    setCurrentStep(stepIdx);
  }, []);

  const slide = TOUR_SLIDES[currentStep];

  return (
    <div
      className="onestop-tour-container"
      aria-label="What is OneStop product tour"
    >
      {/* Top Header: Indicator + Label + Step Counter */}
      <div className="onestop-tour-top">
        <div className="onestop-tour-brand">
          <span className="onestop-tour-dot-indicator" aria-hidden="true" />
          <span className="onestop-tour-brand-text">WHAT IS ONESTOP?</span>
        </div>
        <span className="onestop-tour-counter">
          {currentStep + 1} of {TOUR_SLIDES.length}
        </span>
      </div>

      {/* Middle Interactive / Animated Stage */}
      <div className="onestop-tour-stage">
        {/* Slide 0: Filters */}
        {currentStep === 0 && (
          <div className="onestop-tour-slide-content" key="slide-0">
            <div className="onestop-tour-filter-card">
              <div className="onestop-tour-filter-header">
                <span className="onestop-tour-filter-title">
                  Filters <span className="onestop-tour-filter-badge">3</span>
                </span>
                <span className="onestop-tour-filter-reset">Reset All</span>
              </div>

              <div>
                <div className="onestop-tour-filter-item">
                  <div className="onestop-tour-filter-check">
                    <span className="onestop-tour-checkbox checked">
                      <CheckIcon size={11} color="#FFFFFF" />
                    </span>
                    <span style={{ fontWeight: 600 }}>DU Circuit</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>(48)</span>
                </div>
                <div className="onestop-tour-filter-item">
                  <div className="onestop-tour-filter-check">
                    <span className="onestop-tour-checkbox" />
                    <span>IIMs &amp; Premier</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>(36)</span>
                </div>
              </div>

              <div>
                <div className="onestop-tour-filter-item">
                  <div className="onestop-tour-filter-check">
                    <span className="onestop-tour-checkbox checked">
                      <CheckIcon size={11} color="#FFFFFF" />
                    </span>
                    <span style={{ fontWeight: 600 }}>Case Comps</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>(64)</span>
                </div>
                <span className="onestop-tour-filter-tag">
                  Finance &amp; Valuation <CheckIcon size={10} color="#0F3FFE" />
                </span>
              </div>

              <div className="onestop-tour-fee-toggle">
                <span className="onestop-tour-fee-pill">All</span>
                <span className="onestop-tour-fee-pill active">Free</span>
                <span className="onestop-tour-fee-pill">Paid</span>
              </div>
            </div>
          </div>
        )}

        {/* Slide 1: Browse */}
        {currentStep === 1 && (
          <div className="onestop-tour-slide-content" key="slide-1">
            <div className="onestop-tour-browse-card">
              <div className="onestop-tour-browse-tags">
                <span className="onestop-tour-pill-tag">Closing soonest</span>
                <span className="onestop-tour-pill-tag blue">DU Circuit</span>
                <span className="onestop-tour-pill-tag blue">Case Comps</span>
                <span className="onestop-tour-pill-tag blue">Free</span>
              </div>

              <div className="onestop-tour-comp-header">
                <div className="onestop-tour-comp-logo">SR</div>
                <div>
                  <div className="onestop-tour-comp-host">SRCC · Shri Ram College</div>
                  <h4 className="onestop-tour-comp-title">Business Conclave Case 2026</h4>
                </div>
              </div>

              <div className="onestop-tour-comp-prize-row">
                <span className="onestop-tour-comp-prize">
                  <TrophyIcon size={13} color="#15803D" /> ₹1,50,000 Prize
                </span>
                <span className="onestop-tour-comp-fee">Free Entry</span>
              </div>

              <div className="onestop-tour-comp-meta">
                <span>Team of 2-4</span>
                <span style={{ color: '#DC2626', fontWeight: 600 }}>Ends in 3 days</span>
              </div>

              <button type="button" className="onestop-tour-comp-btn">
                <span>Apply to Competition</span>
              </button>
            </div>
          </div>
        )}

        {/* Slide 2: Bookmarks */}
        {currentStep === 2 && (
          <div className="onestop-tour-slide-content" key="slide-2">
            <div className="onestop-tour-bm-card">
              <div className="onestop-tour-bm-top">
                <span className="onestop-tour-bm-badge">
                  <ClockIcon size={11} color="#FFFFFF" /> Due soon
                </span>
                <span className="onestop-tour-bm-round">Round 2 of 2</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>
                  Kirori Mal College (KMC)
                </span>
                <h4 className="onestop-tour-bm-title">KMC Finance Case Showdown</h4>
              </div>

              <div className="onestop-tour-bm-clock">
                <span className="onestop-tour-bm-due">Valuation Deck Submission</span>
                <span className="onestop-tour-bm-time">
                  <ClockIcon size={12} color="#DC2626" /> 1h 52m 10s
                </span>
              </div>

              <div style={{ fontSize: '11px', color: '#64748B', textAlign: 'center' }}>
                Track every stage deadline, not just registration.
              </div>
            </div>
          </div>
        )}

        {/* Slide 3: Reminders */}
        {currentStep === 3 && (
          <div className="onestop-tour-slide-content" key="slide-3">
            <div className="onestop-tour-reminders-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <BellIcon size={13} color="#0F3FFE" /> Alerts &amp; Cutoffs
                </span>
                <span style={{ background: '#DC2626', color: '#FFFFFF', fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '9999px' }}>
                  3 new
                </span>
              </div>

              <div className="onestop-tour-notif-row urgent">
                <div className="onestop-tour-notif-icon">
                  <ClockIcon size={14} color="#DC2626" />
                </div>
                <div>
                  <div className="onestop-tour-notif-text">KMC Valuation Deck closes in 1 hour</div>
                  <div className="onestop-tour-notif-time">Submit round 2 draft</div>
                </div>
              </div>

              <div className="onestop-tour-notif-row">
                <div className="onestop-tour-notif-icon">
                  <BellIcon size={14} color="#0F3FFE" />
                </div>
                <div>
                  <div className="onestop-tour-notif-text">SRCC Conclave extended by 24h</div>
                  <div className="onestop-tour-notif-time">New deadline 13 Oct</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Slide 4: Team Finder */}
        {currentStep === 4 && (
          <div className="onestop-tour-slide-content" key="slide-4">
            <div className="onestop-tour-squad-card">
              <div className="onestop-tour-squad-top">
                <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 500 }}>
                  Hindu College · Case Clash
                </span>
                <span className="onestop-tour-squad-spots">
                  <span className="onestop-tour-spot-dot" />
                  <span className="onestop-tour-spot-dot open" />
                  <span className="onestop-tour-spot-dot open" />
                  1 of 3 open
                </span>
              </div>

              <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>
                Looking for financial valuation &amp; deck designer
              </h4>

              <div className="onestop-tour-squad-skills">
                <span className="onestop-tour-skill-pill">Financial Modeling</span>
                <span className="onestop-tour-skill-pill">Deck Making</span>
              </div>

              <button type="button" className="onestop-tour-squad-btn">
                <UsersIcon size={13} color="#FFFFFF" />
                <span>Join Squad</span>
              </button>
            </div>
          </div>
        )}

        {/* Slide 5: Requests */}
        {currentStep === 5 && (
          <div className="onestop-tour-slide-content" key="slide-5">
            <div className="onestop-tour-requests-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="onestop-tour-req-status">
                  <CheckIcon size={11} color="#16A34A" /> Accepted Teammate
                </span>
                <span style={{ fontSize: '11px', color: '#64748B' }}>Just now</span>
              </div>

              <div>
                <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                  Aarav Sharma
                </h4>
                <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                  SRCC · UG 2nd Year · Financial Modeling
                </span>
              </div>

              <div className="onestop-tour-req-actions">
                <div className="onestop-tour-chat-btn">
                  💬 Chat here
                </div>
                <div className="onestop-tour-wa-btn">
                  <WhatsAppIcon size={14} /> WhatsApp
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Slide 6: Profile (Matches the exact uploaded screenshot) */}
        {currentStep === 6 && (
          <div className="onestop-tour-slide-content" key="slide-6">
            <div className="onestop-tour-profile-card">
              <div className="onestop-tour-profile-header">
                <h4 className="onestop-tour-profile-name">Good evening, Aarav</h4>
                <div className="onestop-tour-profile-sub">
                  <GraduationCapIcon size={13} color="#0F3FFE" />
                  <span className="onestop-tour-profile-college">SRCC</span>
                  <span className="onestop-tour-profile-dot">·</span>
                  <span className="onestop-tour-profile-year">UG 2nd Year</span>
                </div>
              </div>

              <div className="onestop-tour-profile-stats">
                <div className="onestop-tour-profile-stat">
                  <span className="onestop-tour-stat-num">12</span>
                  <span className="onestop-tour-stat-label">new today</span>
                </div>
                <div className="onestop-tour-profile-stat">
                  <span className="onestop-tour-stat-num">4</span>
                  <span className="onestop-tour-stat-label">squads for you</span>
                </div>
                <div className="onestop-tour-profile-stat">
                  <span className="onestop-tour-stat-num blue">2</span>
                  <span className="onestop-tour-stat-label">requests</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section: Badge + Title + Description + Carousel Controls */}
      <div className="onestop-tour-bottom">
        <div className="onestop-tour-text-meta">
          <span className="onestop-tour-badge">{slide.badge}</span>
          <h3 className="onestop-tour-title">{slide.title}</h3>
          <p className="onestop-tour-desc">{slide.description}</p>
        </div>

        <div className="onestop-tour-controls">
          {/* 7 Navigation Dots */}
          <div className="onestop-tour-dots" role="tablist" aria-label="Tour slides">
            {TOUR_SLIDES.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                className={`onestop-tour-dot ${currentStep === idx ? 'active' : ''}`}
                onClick={() => goToStep(idx)}
                aria-label={`Go to slide ${idx + 1}: ${s.badge}`}
              />
            ))}
          </div>

          {/* Left & Right Arrow Buttons */}
          <div className="onestop-tour-arrows">
            <button
              type="button"
              className="onestop-tour-nav-btn"
              onClick={handlePrev}
              aria-label="Previous tour slide"
              title="Previous slide"
            >
              <ChevronLeftIcon size={15} />
            </button>
            <button
              type="button"
              className="onestop-tour-nav-btn"
              onClick={handleNext}
              aria-label="Next tour slide"
              title="Next slide"
            >
              <ChevronRightIcon size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
