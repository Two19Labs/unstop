// src/components/AboutScreen.jsx
import React, { useState } from 'react';
import './InfoPages.css';

const WHATSAPP_NUMBER = '917007679485';
const EMAIL = 'two19labs@gmail.com';

const FOUNDERS = [
  { initials: 'AS', name: 'Aditya Singhani' },
  { initials: 'MK', name: 'Manthan Kabra', blue: true }
];

const BUILD_OPTIONS = [
  { id: 'website', title: 'Website', sub: 'Business site, portfolio, landing page' },
  { id: 'app', title: 'Web or mobile app', sub: 'A product your customers use' },
  { id: 'internal', title: 'Internal tool', sub: 'Dashboards, CRMs, admin panels' },
  { id: 'automation', title: 'Automation', sub: 'Forms, approvals, reports on autopilot' },
  { id: 'event', title: 'Event platform', sub: 'Registrations, passes, check-ins' },
  { id: 'unsure', title: 'Not sure yet', sub: "Tell us the problem, we'll suggest" }
];

const GOAL_OPTIONS = [
  { id: 'hours', title: 'Save hours of manual work' },
  { id: 'customers', title: 'Bring in more customers' },
  { id: 'bookings', title: 'Take bookings or payments' },
  { id: 'oneplace', title: 'Keep everything in one place' },
  { id: 'professional', title: 'Look more professional' },
  { id: 'replace', title: "Replace a tool we've outgrown" }
];

const OTHER = 'other';

function toggle(list, id) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

// Turns picked ids into labels; "Other" becomes whatever the user typed (dropped if empty)
function resolvePicks(ids, options, otherText) {
  return ids
    .map((id) => (id === OTHER ? otherText.trim() : options.find((o) => o.id === id)?.title))
    .filter(Boolean);
}

function isStepValid(ids, otherText) {
  if (ids.length === 0) return false;
  if (ids.length === 1 && ids[0] === OTHER) return otherText.trim().length > 0;
  return true;
}

function InquiryCard() {
  const [step, setStep] = useState(1);
  const [what, setWhat] = useState([]);
  const [whatText, setWhatText] = useState('');
  const [goals, setGoals] = useState([]);
  const [goalText, setGoalText] = useState('');
  const [extra, setExtra] = useState('');

  const building = resolvePicks(what, BUILD_OPTIONS, whatText);
  const fixes = resolvePicks(goals, GOAL_OPTIONS, goalText);
  const canNext = step === 1 ? isStepValid(what, whatText) : isStepValid(goals, goalText);

  const lines = ['Hi Two19 Labs, I have a project in mind.', ''];
  if (building.length) lines.push(`Building: ${building.join(', ')}`);
  if (fixes.length) lines.push(`It should: ${fixes.join(', ')}`);
  if (extra.trim()) lines.push('', extra.trim());
  const body = lines.join('\n');
  const subject = building.length ? `Project inquiry · ${building.join(', ')}` : 'Project inquiry';

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(body)}`;
  const emailUrl = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  // Props for a step's interactive elements, so hidden steps stay out of the tab order
  const stepProps = (n) => ({
    className: `t19-iq-step${step === n ? ' is-current' : ''}`,
    'aria-hidden': step !== n
  });
  const tab = (n) => (step === n ? undefined : -1);

  const summary = [
    ...building.map((label) => ({ label, step: 1 })),
    ...fixes.map((label) => ({ label, step: 2 }))
  ];

  return (
    <div className="t19-iq">
      <div className="t19-iq-top">
        <span className="t19-label">Start an inquiry</span>
        <span className="t19-label t19-iq-count" aria-live="polite">
          <b>0{step}</b> / 03
        </span>
      </div>

      <div className="t19-iq-progress" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span key={n} className={n <= step ? 'is-done' : ''} />
        ))}
      </div>

      <div className="t19-iq-steps">
        {/* Step 1 */}
        <div {...stepProps(1)}>
          <div className="t19-iq-step-head">
            <h3>What are we building<span className="t19-dot">?</span></h3>
            <p>Pick everything that applies.</p>
          </div>
          <div className="t19-iq-tiles">
            {[...BUILD_OPTIONS, { id: OTHER, title: 'Other', sub: 'Tell us in your own words' }].map((o) => (
              <button
                key={o.id}
                type="button"
                tabIndex={tab(1)}
                className={`t19-iq-tile${o.id === OTHER ? ' t19-iq-tile--wide' : ''}${what.includes(o.id) ? ' is-active' : ''}`}
                aria-pressed={what.includes(o.id)}
                onClick={() => setWhat((w) => toggle(w, o.id))}
              >
                <span className="t19-iq-tile-title">{o.title}</span>
                <span className="t19-iq-tile-sub">{o.sub}</span>
              </button>
            ))}
          </div>
          <input
            type="text"
            className={`t19-iq-input t19-iq-other${step === 1 && what.includes(OTHER) ? ' is-shown' : ''}`}
            placeholder="What do you want built?"
            aria-label="What do you want built?"
            maxLength={120}
            value={whatText}
            onChange={(e) => setWhatText(e.target.value)}
            tabIndex={step === 1 && what.includes(OTHER) ? undefined : -1}
          />
        </div>

        {/* Step 2 */}
        <div {...stepProps(2)}>
          <div className="t19-iq-step-head">
            <h3>What should it fix<span className="t19-dot">?</span></h3>
            <p>Pick everything that applies.</p>
          </div>
          <div className="t19-iq-chips">
            {[...GOAL_OPTIONS, { id: OTHER, title: 'Other' }].map((o) => (
              <button
                key={o.id}
                type="button"
                tabIndex={tab(2)}
                className={`t19-iq-chip${goals.includes(o.id) ? ' is-active' : ''}`}
                aria-pressed={goals.includes(o.id)}
                onClick={() => setGoals((g) => toggle(g, o.id))}
              >
                {o.title}
              </button>
            ))}
          </div>
          <input
            type="text"
            className={`t19-iq-input t19-iq-other${step === 2 && goals.includes(OTHER) ? ' is-shown' : ''}`}
            placeholder="What else should it fix?"
            aria-label="What else should it fix?"
            maxLength={120}
            value={goalText}
            onChange={(e) => setGoalText(e.target.value)}
            tabIndex={step === 2 && goals.includes(OTHER) ? undefined : -1}
          />
        </div>

        {/* Step 3 */}
        <div {...stepProps(3)}>
          <div className="t19-iq-step-head">
            <h3>Anything else<span className="t19-dot">?</span></h3>
            <p>Optional. Then pick how to send it.</p>
          </div>
          {summary.length > 0 && (
            <div className="t19-iq-pills">
              {summary.map((s, i) => (
                <button
                  key={`${s.step}-${i}`}
                  type="button"
                  tabIndex={tab(3)}
                  className="t19-iq-pill"
                  title={`Edit step ${s.step}`}
                  onClick={() => setStep(s.step)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
          <textarea
            className="t19-iq-input t19-iq-textarea"
            rows={4}
            maxLength={500}
            placeholder="Deadlines, links, context, anything that helps (optional)"
            aria-label="Anything else"
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            tabIndex={tab(3)}
          />
          <div className="t19-iq-send">
            <a
              className="t19-btn t19-btn--primary"
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={tab(3)}
            >
              Send on WhatsApp
            </a>
            <a
              className="t19-btn t19-btn--dark-outline"
              href={emailUrl}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={tab(3)}
            >
              Email
            </a>
          </div>
        </div>
      </div>

      <div className="t19-iq-foot">
        <button
          type="button"
          className="t19-btn t19-iq-back"
          disabled={step === 1}
          onClick={() => setStep((s) => Math.max(1, s - 1))}
        >
          ← Back
        </button>
        {step < 3 ? (
          <button
            type="button"
            className="t19-btn t19-iq-next"
            disabled={!canNext}
            onClick={() => setStep((s) => s + 1)}
          >
            Next →
          </button>
        ) : (
          <span className="t19-iq-note">Nothing is sent until you hit send.</span>
        )}
      </div>
    </div>
  );
}

export default function AboutScreen() {
  return (
    <div className="t19-page t19-about">
      <header className="t19-panel t19-halftone t19-about-head">
        <h1 className="t19-display t19-about-title">
          Two19 Labs<span className="t19-dot">.</span>
        </h1>

        <div className="t19-founders">
          {FOUNDERS.map((f) => (
            <div key={f.initials} className="t19-founder">
              <span className={`t19-monogram${f.blue ? ' t19-monogram--blue' : ''}`} aria-hidden="true">
                {f.initials}
              </span>
              <div>
                <div className="t19-founder-name">{f.name}</div>
                <div className="t19-label t19-founder-meta">Co-founder · SSCBS, DU</div>
              </div>
            </div>
          ))}
        </div>

        <p className="t19-serif t19-about-tagline">
          Made by people who'd rather fix it than complain about it.
        </p>
      </header>

      <section className="t19-about-section">
        <div className="t19-section-label">
          <span className="t19-num">01</span>
          <span className="t19-label">Who we are</span>
        </div>
        <p className="t19-about-copy">
          <strong>We love building things that make life easier and work better.</strong> OneStop is one of our
          initiatives. We do the same for clients and organisations: we find what slows your team down and build
          what makes it faster, simpler and easier to run, from the first idea to the final line of code.
        </p>
      </section>

      <section className="t19-build">
        <div className="t19-build-copy">
          <div className="t19-build-intro">
            <span className="t19-label">Two19 Labs<span className="t19-dot">.</span></span>
            <h2 className="t19-display t19-build-title">
              Need something built<span className="t19-dot">?</span>
            </h2>
            <p>
              Two19 Labs builds custom software and web platforms from scratch. If you've got an idea, or know
              someone who could use our help, we'd love to hear about it.
            </p>
          </div>
          <div className="t19-build-links">
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
            <a href="https://two19labs.in" target="_blank" rel="noopener noreferrer">two19labs.in ↗</a>
          </div>
        </div>

        <InquiryCard />
      </section>
    </div>
  );
}
