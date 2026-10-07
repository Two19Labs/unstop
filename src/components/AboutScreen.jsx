// src/components/AboutScreen.jsx
import React from 'react';
import './InfoPages.css';

const EMAIL = 'two19labs@gmail.com';

export default function AboutScreen({ onNavigate = () => {} }) {
  return (
    <div className="t19-page">
      <header className="t19-panel t19-halftone t19-hero">
        <div className="t19-hero-top t19-label">
          <span>About OneStop</span>
          <span className="t19-label-sep">·</span>
          <span>A Two19 Labs initiative</span>
        </div>
        <h1 className="t19-display t19-hero-title">
          Made by people who'd rather fix it than complain about it<span className="t19-dot">.</span>
        </h1>
        <p className="t19-hero-sub">
          OneStop is an initiative by Two19 Labs, a small studio run by two co-founders who build software that
          makes everyday things easier.
        </p>
      </header>

      <section className="t19-section">
        <div className="t19-section-side">
          <span className="t19-num">01</span>
          <span className="t19-label">The initiative</span>
        </div>
        <div className="t19-section-body">
          <h2 className="t19-display t19-section-title">
            One place for all of it<span className="t19-dot">.</span>
          </h2>
          <p>
            Competitions, hackathons and case challenges are spread across a dozen websites and a hundred group
            chats. Deadlines slip past, good opportunities go unseen, and finding a team usually means messaging
            strangers and hoping for the best.
          </p>
          <p>
            So we built one place for all of it. That's how we like to work: notice something that's harder than
            it should be, then build the thing that fixes it. OneStop is one of those. It won't be the last.
          </p>
        </div>
      </section>

      <section className="t19-section">
        <div className="t19-section-side">
          <span className="t19-num">02</span>
          <span className="t19-label">The people behind it</span>
        </div>
        <div className="t19-section-body">
          <h2 className="t19-display t19-section-title">
            Two founders. One habit<span className="t19-dot">.</span>
          </h2>
          <p>
            Two19 Labs was started by <strong>Aditya Singhani</strong> and <strong>Manthan Kabra</strong>, two
            students at Shaheed Sukhdev College of Business Studies, University of Delhi. What started as
            late-night conversations about everything that felt harder than it should be turned into a habit:
            spot a problem, take the initiative, and build the thing that fixes it. Between the two of them, they
            take things from the first idea to the final line of code. OneStop is one of the things that came out
            of that.
          </p>
          <div className="t19-founders">
            {[
              { initials: 'AS', name: 'Aditya Singhani' },
              { initials: 'MK', name: 'Manthan Kabra' }
            ].map((f) => (
              <div key={f.initials} className="t19-founder">
                <span className="t19-monogram" aria-hidden="true">{f.initials}</span>
                <div>
                  <div className="t19-founder-name">{f.name}</div>
                  <div className="t19-label t19-founder-meta">Co-founder · SSCBS, DU</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="t19-panel t19-closing">
        <div className="t19-closing-copy">
          <span className="t19-label">Two19 Labs<span className="t19-dot">.</span></span>
          <h2 className="t19-display t19-closing-title">
            Need something built<span className="t19-dot">?</span>
          </h2>
          <p>
            Two19 Labs builds custom software and web platforms from scratch. If you've got an idea, or know
            someone who could use our help, we'd love to hear about it.
          </p>
        </div>
        <div className="t19-actions">
          <a className="t19-btn t19-btn--dark" href={`mailto:${EMAIL}`}>Start a conversation</a>
          <button type="button" className="t19-btn t19-btn--outline" onClick={() => onNavigate('contact')}>
            Message on WhatsApp
          </button>
          <a className="t19-btn t19-btn--outline" href="https://two19labs.in" target="_blank" rel="noopener noreferrer">
            two19labs.in ↗
          </a>
        </div>
      </section>
    </div>
  );
}
