// src/components/AboutScreen.jsx
import React from 'react';
import './InfoPages.css';

const EMAIL = 'two19labs@gmail.com';

export default function AboutScreen({ onNavigate = () => {} }) {
  return (
    <div className="info-page">
      <header className="info-hero">
        <span className="info-label">About OneStop</span>
        <h1 className="info-title">
          Made by people who'd rather fix it than complain about it<span className="info-dot">.</span>
        </h1>
        <p className="info-sub">
          OneStop is an initiative by <strong>Two19 Labs</strong>, a small studio run by two co-founders who
          build software that makes everyday things <em className="info-serif">easier</em>.
        </p>
      </header>

      <section className="info-block">
        <span className="info-label">The initiative</span>
        <p>
          Competitions, hackathons and case challenges are spread across a dozen websites and a hundred group
          chats. Deadlines slip past, good opportunities go unseen, and finding a team usually means messaging
          strangers and hoping for the best.
        </p>
        <p>
          So we built one place for all of it. That's how we like to work: notice something that's harder than
          it should be, then build the thing that fixes it. OneStop is one of those. It won't be the last.
        </p>
      </section>

      <section className="info-block">
        <span className="info-label">The people behind it</span>
        <div className="info-founders" aria-hidden="true">
          <span className="info-monogram">AS</span>
          <span className="info-monogram">MK</span>
        </div>
        <p>
          Two19 Labs was started by <strong>Aditya Singhani</strong> and <strong>Manthan Kabra</strong>, two
          students at Shaheed Sukhdev College of Business Studies, University of Delhi. What started as
          late-night conversations about everything that felt harder than it should be turned into a habit: spot
          a problem, take the initiative, and build the thing that fixes it. Between the two of them, they take
          things from the first idea to the final line of code. OneStop is one of the things that came out of
          that, and it won't be the last.
        </p>
      </section>

      <section className="info-closing">
        <span className="info-label">Two19 Labs<span className="info-dot">.</span></span>
        <p>
          <strong>Need something built?</strong> Two19 Labs builds custom software and web platforms. If you've
          got an idea, or know someone who could use our help, we'd love to hear about it.
        </p>
        <div className="info-links">
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          <span className="info-sep">·</span>
          <button type="button" onClick={() => onNavigate('contact')}>Message us on WhatsApp</button>
          <span className="info-sep">·</span>
          <a href="https://two19labs.in" target="_blank" rel="noopener noreferrer">two19labs.in ↗</a>
        </div>
      </section>
    </div>
  );
}
