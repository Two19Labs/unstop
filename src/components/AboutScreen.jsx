// src/components/AboutScreen.jsx
import React from 'react';
import './AboutScreen.css';

export default function AboutScreen({ onNavigate = () => {} }) {
  return (
    <div className="about-screen-container">
      {/* 01. Hero Banner */}
      <section className="about-hero">
        <div className="about-hero-topline">
          <div className="about-brand-tag">
            <span>Two19 Labs</span>
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--primary)' }} />
            <span>In-House Lab Project</span>
          </div>
          <div className="about-doc-meta">v1.0 · 2026 Edition</div>
        </div>

        <h1 className="about-hero-title">
          We Build Bespoke Software<span className="dot-blue">.</span>
          <br />
          No Templates<span className="dot-blue">.</span> Ever<span className="dot-blue">.</span>
        </h1>

        <p className="about-hero-accent">
          ready to be unstoppable?
        </p>

        <p className="about-hero-description">
          <strong>OneStop</strong> is a real-time collegiate opportunity discovery radar and peer squad finder built 
          from scratch by <strong>Two19 Labs</strong>. We designed and engineered this platform as a live 
          demonstration of our craft: pairing custom architecture, real-time data synchronization, and frictionless 
          user experience to solve real student problems at scale.
        </p>
      </section>

      {/* 02. Who We Are */}
      <section className="about-section-card">
        <div className="about-section-header">
          <span className="about-section-num">01</span>
          <h2 className="about-section-title">The Studio &amp; Positioning</h2>
        </div>

        <div className="about-quote-box">
          <div className="about-quote-lead">
            We build custom software and web platforms from scratch — and wire in the automation that removes the manual work inside them.
          </div>
          <p className="about-quote-sub">
            In one line: a technology studio building custom software, web platforms, and the automation layer that connects them.
          </p>
        </div>

        <p style={{ margin: 0, fontSize: '14.5px', lineHeight: 1.65, color: 'var(--ink-secondary)' }}>
          Two19 Labs is a small, senior technology studio. We are early by design — lean enough that the people 
          who scope your project are the same senior engineers who build it, and close enough to the work that 
          nothing gets lost in translation. We don't compete on bloated headcount or boilerplate templates. 
          We compete on craft, speed, and direct access: founders on every call, working software in front of you early, 
          and a direct line to the team actually shipping it.
        </p>
        <p style={{ margin: 0, fontSize: '14.5px', lineHeight: 1.65, color: 'var(--ink-secondary)', fontWeight: 600 }}>
          <em>"Our edge isn't scale — it's care. Small enough to obsess over your build, senior enough to get it right the first time."</em>
        </p>
      </section>

      {/* 03. Why OneStop Exists */}
      <section className="about-section-card">
        <div className="about-section-header">
          <span className="about-section-num">02</span>
          <h2 className="about-section-title">The Origin Story — Why We Built OneStop</h2>
        </div>

        <p style={{ margin: 0, fontSize: '14.5px', lineHeight: 1.65, color: 'var(--ink-secondary)' }}>
          As students in Delhi University navigating national case competitions, hackathons, and corporate 
          challenges (McKinsey, Bain, HUL L.I.M.E., Tata Steel-a-thon, ITC Interrobang), we experienced first-hand 
          how fragmented collegiate opportunities were:
        </p>

        <div className="about-grid-2">
          <div className="about-cap-card">
            <h3 className="about-cap-title">
              <span style={{ color: '#DC2626' }}>✕</span> The Broken Status Quo
            </h3>
            <p className="about-cap-desc">
              Cluttered WhatsApp groups with 1,000 unread messages, missed registration deadlines, scam links, 
              and desperate LinkedIn DMs trying to find a teammate who actually knows financial modeling or pitch deck design.
            </p>
          </div>

          <div className="about-cap-card">
            <h3 className="about-cap-title">
              <span style={{ color: 'var(--success)' }}>✓</span> The OneStop Standard
            </h3>
            <p className="about-cap-desc">
              Real-time ingestion of 700+ live opportunities, multi-round countdown radars, skill-matched squad hosting, 
              and turn-based private vetting chat with zero phone number leaks. Engineered for students, by students.
            </p>
          </div>
        </div>
      </section>

      {/* 04. What We Do */}
      <section className="about-section-card">
        <div className="about-section-header">
          <span className="about-section-num">03</span>
          <h2 className="about-section-title">What Two19 Labs Builds</h2>
        </div>

        <p style={{ margin: 0, fontSize: '14.5px', lineHeight: 1.65, color: 'var(--ink-secondary)' }}>
          Our work has one center of gravity: building software and the web platforms around it, with everything else extending from that core.
        </p>

        <div className="about-grid-2">
          <div className="about-cap-card">
            <h3 className="about-cap-title">Custom Software &amp; Web Platforms</h3>
            <p className="about-cap-desc">
              We design, build, and maintain custom web applications shaped around how a business actually operates — never shoehorned into an off-the-shelf template.
            </p>
            <div className="about-cap-tags">
              <span className="about-pill">Internal Dashboards</span>
              <span className="about-pill">Customer Portals</span>
              <span className="about-pill">SaaS Applications</span>
              <span className="about-pill">Bespoke Marketplaces</span>
            </div>
          </div>

          <div className="about-cap-card">
            <h3 className="about-cap-title">Automation Woven In</h3>
            <p className="about-cap-desc">
              Automation isn't a bolt-on; it's the intelligence layer built directly into the system: scheduled crawlers, API pipelines, document processing, and removing repetitive work.
            </p>
            <div className="about-cap-tags">
              <span className="about-pill">Workflow Engines</span>
              <span className="about-pill">Data Ingestion</span>
              <span className="about-pill">API Integrations</span>
              <span className="about-pill">Automated Alerts</span>
            </div>
          </div>

          <div className="about-cap-card">
            <h3 className="about-cap-title">Technical Leadership &amp; Architecture</h3>
            <p className="about-cap-desc">
              CTO-as-a-Service: strategy, system architecture, database security, and stack decisions for ambitious teams without an in-house technical co-founder.
            </p>
            <div className="about-cap-tags">
              <span className="about-pill">System Architecture</span>
              <span className="about-pill">Database Hardening</span>
              <span className="about-pill">Row-Level Security</span>
            </div>
          </div>

          <div className="about-cap-card">
            <h3 className="about-cap-title">Long-Term Engineering Partnership</h3>
            <p className="about-cap-desc">
              We don't ship and vanish. We provide post-launch monitoring, performance tuning, security maintenance, and iterative feature scaling as your business grows.
            </p>
            <div className="about-cap-tags">
              <span className="about-pill">Production Monitoring</span>
              <span className="about-pill">Zero Bloat</span>
              <span className="about-pill">You Own 100% of IP</span>
            </div>
          </div>
        </div>
      </section>

      {/* 05. Selected Work */}
      <section className="about-section-card">
        <div className="about-section-header">
          <span className="about-section-num">04</span>
          <h2 className="about-section-title">Selected Client Work &amp; Case Studies</h2>
        </div>

        <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--ink-muted)' }}>
          We describe every engagement as exactly what it was — specificity is more convincing than borrowed scale.
        </p>

        <div className="about-work-list">
          <div className="about-work-item">
            <div className="about-work-head">
              <h3 className="about-work-name">Ghoomar</h3>
              <span className="about-work-badge">Web Platform · Delivered</span>
            </div>
            <p className="about-work-desc">
              A modern, high-speed, conversion-minded web platform built from scratch for the Ghoomar restaurant brand. 
              Delivered complete brand web presence, digital touchpoints, responsive layouts, and performance optimization end-to-end.
            </p>
          </div>

          <div className="about-work-item">
            <div className="about-work-head">
              <h3 className="about-work-name">Ashirvad (at ITC)</h3>
              <span className="about-work-badge">Kiosk UI Prototype</span>
            </div>
            <p className="about-work-desc">
              An in-store touchscreen kiosk interface prototype designed for Ashirvad, a flagship brand under ITC. 
              Translated complex retail consumer journeys into a clean, intuitive, tactile touchscreen UI experience.
            </p>
          </div>

          <div className="about-work-item">
            <div className="about-work-head">
              <h3 className="about-work-name">University of Delhi</h3>
              <span className="about-work-badge">Internal Software Projects</span>
            </div>
            <p className="about-work-desc">
              A series of specialized internal software tools and operational workflow utilities engineered for academic 
              societies, event management bodies, and student teams across collegiate Delhi University colleges.
            </p>
          </div>

          <div className="about-work-item" style={{ borderLeft: '3px solid var(--primary)' }}>
            <div className="about-work-head">
              <h3 className="about-work-name">OneStop</h3>
              <span className="about-work-badge" style={{ background: 'var(--primary)', color: '#FFFFFF', borderColor: 'var(--primary)' }}>
                Flagship In-House Product
              </span>
            </div>
            <p className="about-work-desc">
              Our live flagship product. Real-time opportunity ingestion across 700+ nationwide opportunities, 
              edge CDN caching, multi-round stage tracking, and privacy-first squad matching with turn-based vetting chat.
            </p>
          </div>
        </div>
      </section>

      {/* 06. Co-Founders */}
      <section className="about-section-card">
        <div className="about-section-header">
          <span className="about-section-num">05</span>
          <h2 className="about-section-title">The Co-Founders</h2>
        </div>

        <div className="about-grid-2">
          {/* Aditya Singhani */}
          <div className="about-founder-card">
            <div className="about-founder-top">
              <div className="about-founder-avatar">AS</div>
              <div className="about-founder-meta">
                <h4>Aditya Singhani</h4>
                <p>Co-Founder &amp; Engineering Lead</p>
              </div>
            </div>
            <p className="about-founder-bio">
              Student at Shaheed Sukhdev College of Business Studies (SSCBS), University of Delhi. 
              Specializes in full-stack system architecture, Supabase PostgreSQL, row-level security hardening, 
              edge pipelines, and crafting clean, high-performance user interfaces from the ground up.
            </p>
            <a
              href="https://www.linkedin.com/in/aditya-singhani-69294a27a/"
              target="_blank"
              rel="noopener noreferrer"
              className="about-founder-link"
            >
              Connect on LinkedIn ↗
            </a>
          </div>

          {/* Manthan Kabra */}
          <div className="about-founder-card">
            <div className="about-founder-top">
              <div className="about-founder-avatar" style={{ background: '#1A1A19' }}>MK</div>
              <div className="about-founder-meta">
                <h4>Manthan Kabra</h4>
                <p>Co-Founder &amp; Strategy Lead</p>
              </div>
            </div>
            <p className="about-founder-bio">
              Co-Founder at Two19 Labs. Leads product positioning, ecosystem strategy, client alignments, and 
              collegiate community partnerships. Dedicated to building software solutions that eliminate operational 
              clutter and deliver tangible business outcomes.
            </p>
            <a
              href="https://www.linkedin.com/in/manthan-kabra/"
              target="_blank"
              rel="noopener noreferrer"
              className="about-founder-link"
            >
              Connect on LinkedIn ↗
            </a>
          </div>
        </div>
      </section>

      {/* 07. How We Work */}
      <section className="about-section-card">
        <div className="about-section-header">
          <span className="about-section-num">06</span>
          <h2 className="about-section-title">How We Work — The 7 Sprints</h2>
        </div>

        <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--ink-muted)' }}>
          A structured engineering process from first conversation to long-term partnership. Every milestone is deliberate and documented.
        </p>

        <div className="about-process-grid">
          <div className="about-process-step">
            <span className="about-step-idx">01</span>
            <h4 className="about-step-title">Discovery</h4>
            <p className="about-step-text">Understanding pain points, existing workflows, and business goals.</p>
          </div>
          <div className="about-process-step">
            <span className="about-step-idx">02</span>
            <h4 className="about-step-title">Architecture</h4>
            <p className="about-step-text">Tailored tech strategy, data schema, and security planning.</p>
          </div>
          <div className="about-process-step">
            <span className="about-step-idx">03</span>
            <h4 className="about-step-title">Alignment</h4>
            <p className="about-step-text">Fixed timelines, deliverables, and transparent investment.</p>
          </div>
          <div className="about-process-step">
            <span className="about-step-idx">04</span>
            <h4 className="about-step-title">Focused Sprints</h4>
            <p className="about-step-text">Iterative builds with working software in your hands early.</p>
          </div>
          <div className="about-process-step">
            <span className="about-step-idx">05</span>
            <h4 className="about-step-title">Rigorous QA</h4>
            <p className="about-step-text">Functional testing, performance tuning, and security audits.</p>
          </div>
          <div className="about-process-step">
            <span className="about-step-idx">06</span>
            <h4 className="about-step-title">Handover</h4>
            <p className="about-step-text">Production deployment, full documentation, and 100% IP ownership.</p>
          </div>
          <div className="about-process-step">
            <span className="about-step-idx">07</span>
            <h4 className="about-step-title">Partnership</h4>
            <p className="about-step-text">Ongoing monitoring, feature scaling, and technical guidance.</p>
          </div>
        </div>
      </section>

      {/* 08. Agency Inbound Call to Action */}
      <section className="about-cta-banner">
        <span className="about-cta-tag">Start a Project</span>
        <h2 className="about-cta-title">
          Build Smarter<span style={{ color: '#60A5FA' }}>.</span> Scale Faster<span style={{ color: '#60A5FA' }}>.</span>
        </h2>
        <p className="about-cta-desc">
          Have an ambitious idea, internal tool, customer portal, or web platform you need built from scratch? 
          Skip the layers of agency bureaucracy and talk directly to the engineers building your software.
        </p>

        <div className="about-cta-actions">
          <button
            type="button"
            className="about-btn-primary"
            onClick={() => onNavigate('contact')}
          >
            <span>Start a Conversation</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>

          <a
            href="https://two19labs.in"
            target="_blank"
            rel="noopener noreferrer"
            className="about-btn-secondary"
          >
            <span>Visit Two19Labs.in</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </div>
      </section>
    </div>
  );
}
