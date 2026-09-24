// src/components/FunLoadingScreen.jsx
import React, { useState, useEffect, useMemo } from 'react';
import OneStopLogo from './OneStopLogo';
import './FunLoadingScreen.css';
import './SectionLoadingWidget.css';

export const GENERAL_PUNS = [
  "Aligning the BCG matrix with our broken circadian rhythm...",
  "Fixing the 1-pixel font margin error on slide 47 because aesthetics > unit economics...",
  "Consultant mode activated: 'Let's take this offline and circle back by EOD'...",
  "Consultant voice: 'Let's double-click on that' instead of admitting we have no clue...",
  "Formatting financial valuation models until Excel starts crying in #VALUE!...",
  "Aggressively googling 'TAM SAM SOM difference' in incognito 4 minutes before deadline...",
  "Rehearsing confident head nods for the Q&A round we didn't prepare for...",
  "Praying the Unstop submission server doesn't 504 at 11:58:59 PM...",
  "Inserting buzzwords: 'Synergistic paradigm shift with high-conviction hyper-scalability'...",
  "Calling an unsourced bar chart 'Proprietary Primary Market Research'...",
  "Pretending we understood the judge's question about DCF sensitivity analysis...",
  "Calling a basic Canva gradient 'Proprietary Visual Design Architecture'...",
  "Re-reading the problem statement 10 minutes before submission because nobody read it...",
  "Calculating how to stretch 3 bullet points into a 25-slide executive deck...",
  "Our Go-To-Market strategy is 10% market penetration and 90% divine intervention...",
  "Checking if winning 3rd place covers the cost of midnight caffeine runs and therapy...",
  "Pasting Porter's Five Forces into a deck that is literally about selling chai...",
  "Convincing ourselves that our 4-member squad is 'lean, agile, and disruptive'...",
  "Refactoring slide headers to start with aggressive action verbs so judges feel intimidated...",
  "Negotiating equity split on a case competition idea that currently exists only as a Google Doc title...",
  "Translating 'we have no idea' into 'preliminary exploratory heuristics'...",
  "Exporting as 'Final_v7_ACTUAL_FINAL_SUBMIT_THIS_ONE_REAL.pdf'...",
  "Asking ChatGPT to 'make this sound like McKinsey wrote it during a panic attack'...",
  "Googling 'what is EBITDA' under the table while maintaining confident eye contact...",
  "Converting cold coffee directly into slide transitions and imaginary revenue...",
  "Reminding everyone that 11:59:59 PM is a hard deadline, not a gentle suggestion...",
  "Polishing the executive summary until it shines brighter than our collegiate GPA...",
  "Replacing all pie charts with donut charts because we're hungry and sophisticated...",
  "Debating whether a 3:00 AM existential crisis counts as 'design thinking'...",
  "Citing 'Internal Industry Estimates (2026)' for numbers we hallucinated in the shower...",
  "Practicing hand gestures in the bathroom mirror so we look like a TED Talk keynote...",
  "Replacing 'we sent a Google Form to our hostel wing' with 'Rigorous Empirical Field Study'...",
  "Running a DCF model where revenue growth matches our adrenaline spike: 500% YoY...",
  "Explaining our churn rate: 'Users aren't churning, they're just spiritually graduating'...",
  "Putting McKinsey's 7S framework into a problem that just needed basic common sense...",
  "Diagnosing our pitch deck: Symptoms include 40 bullet points and zero customer validation...",
  "Claiming our product has 'viral network effects' because our moms promised to share the link...",
  "Burning the midnight oil, the 3 AM candle, and whatever sanity was left in reserve...",
  "Turning 'we winged the entire Q&A' into 'agile real-time executive adaptability'...",
  "Double-checking if our valuation is in INR, USD, or pure delusions of grandeur...",
  "Telling the judges our burn rate is fine while burning through Red Bulls at 4 AM..."
];

export const BROWSE_PUNS = [
  "Hunting for hackathons with top prize pools and guaranteed midnight biryani...",
  "Benchmarking competitions where the cash prize exceeds our semester tuition fees...",
  "Filtering out competitions where round 1 is a 60-question aptitude test on Sunday morning...",
  "Searching for competitions where 'Winner takes all' doesn't mean 'Winner loses all sleep'...",
  "Cross-checking if the 2 Lakh prize pool is real cash or 199,000 platform discount coupons...",
  "Indexing high-stakes challenges faster than a hosteller opens Swiggy at 1:30 AM...",
  "Scouting corporate challenges so we can add 'National Finalist' to our LinkedIn headline...",
  "Screening hackathons to ensure Red Bull sponsors are physically present on campus...",
  "Calculating the ROI of spending 72 hours coding vs. sleeping like a responsible adult...",
  "Verifying that 'Exciting Goodies & Swag' doesn't just mean a single sticker and a ballpoint pen...",
  "Filtering out comps whose problem statement is 'Solve world peace with Web3 and AI'...",
  "Sorting by highest prize money because our campus canteen debt is reaching sovereign levels...",
  "Tracking registration deadlines before your procrastinating brain convinces you 'there's still time'...",
  "Locating campus rounds so we can get free AC travel and an excuse to miss 8:30 AM attendance...",
  "Scanning national challenges to see which Fortune 500 company wants free student consulting...",
  "Aligning competition deadlines with our nocturnal collegiate circadian rhythm...",
  "Parsing 40-page competition rulebooks to find out the submission limit is actually 3 slides...",
  "Checking if top 3 cash awards justify submitting at 4:30 AM on a working Tuesday..."
];

export const SQUAD_PUNS = [
  "Running Monte Carlo simulations on whether your prospective teammate will reply or ghost on WhatsApp...",
  "Matching dream teams: 1 person who works, 1 who talks, and 2 moral support passengers...",
  "Filtering out teammates who write 'I specialize in ideation, high-level vision, and vibes'...",
  "Building a hackathon squad: 1 full-stack developer, 3 people offering 'UI feedback' and snacks...",
  "Convincing the group that 4 finance generalists and 0 coders is a 'lean and agile startup formation'...",
  "Rehearsing the synchronized head nod so the judge thinks the entire team contributed equally...",
  "Scouting a teammate whose laptop can run Docker without triggering the campus fire alarm...",
  "Looking for someone who knows Excel formulas that don't immediately resolve to #REF!...",
  "Finding a teammate who won't magically contract amnesia 2 hours before the 11:59 PM submission...",
  "Dividing responsibilities: You do the 40-page financial model, I'll pick the presentation font...",
  "Negotiating team roles: Who presents slide 1 vs. who hides off-camera during the Q&A cross-examination...",
  "Searching for that mythical teammate who submits their deck slides 24 hours BEFORE the deadline...",
  "Checking squad compatibility: Must be willing to survive on instant noodles, chai, and shared panic...",
  "Pairing you with teammates who won't put Comic Sans or neon green text in an investment pitch...",
  "Verifying phone numbers so we know exactly whose phone to ring 47 times at 11:45 PM...",
  "Matching complementary skillsets: 1 financial modeler + 3 emotional support slides...",
  "Filtering prospective teammates: Must possess a working webcam and basic human empathy...",
  "Negotiating equity split on a 24-hour hackathon project that doesn't even compile yet..."
];

export const SARCASTIC_PUNS = GENERAL_PUNS;

// Module-level memory to prevent consecutive duplicate quotes
let lastFullScreenQuote = '';

export default function FunLoadingScreen({
  isReady = true,
  minDurationMs = 800,
  maxDurationMs = 1450,
  onComplete,
  headline = "OneStop",
  subtitle = null,
  customPuns = null,
}) {
  const [isDismissing, setIsDismissing] = useState(false);

  // Exactly one quote per full loading screen, shuffled at random
  const quote = useMemo(() => {
    const pool = Array.isArray(customPuns) && customPuns.length > 0 ? customPuns : GENERAL_PUNS;
    if (!pool || pool.length === 0) return '';
    let candidate = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1 && candidate === lastFullScreenQuote) {
      const filtered = pool.filter(q => q !== lastFullScreenQuote);
      candidate = filtered[Math.floor(Math.random() * filtered.length)] || candidate;
    }
    lastFullScreenQuote = candidate;
    return candidate;
  }, [customPuns]);

  // Handle completion: dismiss promptly when minDurationMs has elapsed & isReady, or enforce maxDurationMs cap (<= 1.5s max)
  useEffect(() => {
    let timer = null;
    let completed = false;
    const start = Date.now();

    const finish = () => {
      if (completed) return;
      completed = true;
      setIsDismissing(true);
      timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 180);
    };

    const checkDone = () => {
      const elapsed = Date.now() - start;
      if (elapsed >= maxDurationMs || (elapsed >= minDurationMs && isReady)) {
        finish();
      } else {
        const remaining = Math.min(
          Math.max(40, minDurationMs - elapsed),
          Math.max(40, maxDurationMs - elapsed)
        );
        timer = setTimeout(checkDone, remaining);
      }
    };

    checkDone();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isReady, minDurationMs, maxDurationMs, onComplete]);

  return (
    <div
      className={`fun-loading-overlay ${isDismissing ? 'fun-loading-dismiss' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="fun-loading-card">
        <div className="section-loading-ring-wrap" style={{ width: '48px', height: '48px', marginBottom: '14px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="section-loading-ring" aria-hidden="true" />
          <OneStopLogo variant="icon" height={22} />
        </div>
        <h3 className="section-loading-title">{headline}</h3>
        <p className="section-loading-sub">{subtitle || quote}</p>
      </div>
    </div>
  );
}
