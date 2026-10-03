// src/components/WhatIsOneStopTour.jsx
// Login-panel tour: the full animated "What is OneStop?" walkthrough, embedded
// inline and looping forever.
import React, { lazy, Suspense } from 'react';
import './WhatIsOneStopTour.css';

const WalkthroughModal = lazy(() => import('./WalkthroughModal'));

export default function WhatIsOneStopTour() {
  return (
    <Suspense fallback={<div className="onestop-tour-container" />}>
      <WalkthroughModal embedded />
    </Suspense>
  );
}
