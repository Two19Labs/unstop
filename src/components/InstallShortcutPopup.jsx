// src/components/InstallShortcutPopup.jsx
// Mobile shortcut & PWA install popup for OneStop by Two19 Labs

import React, { useState, useEffect, useCallback } from 'react';
import { isMobileDevice, isIOS, isStandalone } from '../lib/browserPushService';
import { trackEvent } from '../lib/posthog';
import './InstallShortcutPopup.css';

const DISMISSED_KEY = 'onestop_shortcut_prompt_dismissed_at';
const SNOOZE_DURATION_MS = 5 * 24 * 60 * 60 * 1000; // 5 days cooldown after dismiss

export default function InstallShortcutPopup({ forceOpen = false, onClose = null }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [iosDevice, setIosDevice] = useState(false);
  const [installed, setInstalled] = useState(false);

  // Check device conditions and standalone mode
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const standalone = isStandalone();
    if (standalone) {
      setInstalled(true);
      return;
    }

    const mobileCheck = isMobileDevice() || window.innerWidth <= 768;
    setIsMobile(mobileCheck);
    setIosDevice(isIOS());

    // Listen for Chrome/Edge/Android beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Listen for successful install event
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsVisible(false);
      setShowGuideModal(false);
      setInstalled(true);
      try {
        localStorage.setItem('onestop_shortcut_installed', 'true');
      } catch (err) {}
      trackEvent('pwa_shortcut_installed');
    };

    // Allow any screen/component to trigger this popup
    const handleManualOpen = () => {
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('onestop:open-install-prompt', handleManualOpen);

    // Initial evaluation for auto-showing prompt on mobile
    const checkDismissalAndAutoShow = () => {
      try {
        const dismissedAt = localStorage.getItem(DISMISSED_KEY);
        if (dismissedAt) {
          const elapsed = Date.now() - parseInt(dismissedAt, 10);
          if (elapsed < SNOOZE_DURATION_MS) {
            return; // snoozed
          }
        }
      } catch (err) {}

      // If mobile and not already running in standalone app mode
      if (mobileCheck && !standalone) {
        // Wait 2.2 seconds for initial page render/boot screen to complete
        const timer = setTimeout(() => {
          setIsVisible(true);
          trackEvent('pwa_install_popup_shown', {
            is_ios: isIOS(),
            platform: navigator.platform
          });
        }, 2200);

        return () => clearTimeout(timer);
      }
    };

    const cleanupAutoShow = checkDismissalAndAutoShow();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('onestop:open-install-prompt', handleManualOpen);
      if (typeof cleanupAutoShow === 'function') cleanupAutoShow();
    };
  }, []);

  // Update on forceOpen prop changes
  useEffect(() => {
    if (forceOpen) {
      setIsVisible(true);
    }
  }, [forceOpen]);

  const handleDismiss = useCallback((e) => {
    if (e) e.stopPropagation();
    setIsVisible(false);
    setShowGuideModal(false);
    try {
      localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    } catch (err) {}
    trackEvent('pwa_install_popup_dismissed');
    if (onClose) onClose();
  }, [onClose]);

  const handleInstallClick = async () => {
    trackEvent('pwa_install_popup_action_clicked', {
      has_deferred_prompt: Boolean(deferredPrompt),
      is_ios: iosDevice
    });

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsVisible(false);
          setInstalled(true);
          trackEvent('pwa_install_accepted');
        } else {
          trackEvent('pwa_install_dismissed_native');
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn('Error during native install prompt:', err);
        setShowGuideModal(true);
      }
    } else {
      // On iOS or browsers without native prompt, reveal visual guide
      setShowGuideModal(true);
    }
  };

  // If already running standalone or not visible, render nothing
  if (installed || (!isVisible && !showGuideModal)) {
    return null;
  }

  return (
    <>
      {/* 1. Compact Floating Bottom Card above Mobile Bottom Nav */}
      {isVisible && !showGuideModal && (
        <div
          className="onestop-install-popup"
          role="region"
          aria-label="Install OneStop shortcut"
        >
          <div className="onestop-install-popup-content">
            <div className="onestop-install-popup-icon-wrap">
              <img
                src="/onestop-icon.png"
                alt="OneStop"
                className="onestop-install-popup-icon"
              />
              <span className="onestop-install-popup-badge" title="Instant App">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </span>
            </div>

            <div className="onestop-install-popup-text">
              <div className="onestop-install-popup-header-row">
                <span className="onestop-install-popup-tag">SHORTCUT</span>
                <span className="onestop-install-popup-dot">•</span>
                <span className="onestop-install-popup-subtag">NO APP STORE</span>
              </div>
              <h4 className="onestop-install-popup-title">Install OneStop</h4>
              <p className="onestop-install-popup-desc">
                Add 1-tap shortcut to home screen &amp; use on the go.
              </p>
            </div>

            <div className="onestop-install-popup-actions">
              <button
                type="button"
                className="onestop-install-btn-primary"
                onClick={handleInstallClick}
                aria-label="Install shortcut"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="onestop-install-btn-icon"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Install</span>
              </button>

              <button
                type="button"
                className="onestop-install-btn-dismiss"
                onClick={handleDismiss}
                aria-label="Dismiss shortcut prompt"
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
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Step-by-Step Visual Guide Modal (Specially designed for iOS & manual installs) */}
      {showGuideModal && (
        <div
          className="onestop-guide-modal-backdrop"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="onestop-guide-modal-sheet"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="onestop-guide-title"
          >
            <div className="onestop-guide-drag-handle" />

            <div className="onestop-guide-header">
              <div className="onestop-guide-brand">
                <img
                  src="/onestop-icon.png"
                  alt="OneStop"
                  className="onestop-guide-icon"
                />
                <div>
                  <h3 id="onestop-guide-title" className="onestop-guide-title">
                    Add OneStop to Home Screen
                  </h3>
                  <p className="onestop-guide-subtitle">
                    Quick 1-tap shortcut for competitions &amp; squads
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="onestop-guide-close-btn"
                onClick={() => {
                  setShowGuideModal(false);
                  setIsVisible(false);
                  handleDismiss();
                }}
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="onestop-guide-steps">
              {iosDevice ? (
                <>
                  <div className="onestop-guide-step-item">
                    <div className="onestop-guide-step-number">1</div>
                    <div className="onestop-guide-step-text">
                      <strong>Tap the Share button</strong>
                      <span>
                        Located at the bottom of Safari (or top right on iPad). Look for the{' '}
                        <span className="onestop-guide-inline-icon">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                            <polyline points="16 6 12 2 8 6" />
                            <line x1="12" y1="2" x2="12" y2="15" />
                          </svg>
                        </span>{' '}
                        Share icon.
                      </span>
                    </div>
                  </div>

                  <div className="onestop-guide-step-item">
                    <div className="onestop-guide-step-number">2</div>
                    <div className="onestop-guide-step-text">
                      <strong>Select "Add to Home Screen"</strong>
                      <span>
                        Scroll down the menu list and tap{' '}
                        <span className="onestop-guide-inline-icon">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <rect x="3" y="3" width="18" height="18" rx="4" />
                            <line x1="12" y1="8" x2="12" y2="16" />
                            <line x1="8" y1="12" x2="16" y2="12" />
                          </svg>
                        </span>{' '}
                        <strong>Add to Home Screen</strong>.
                      </span>
                    </div>
                  </div>

                  <div className="onestop-guide-step-item">
                    <div className="onestop-guide-step-number">3</div>
                    <div className="onestop-guide-step-text">
                      <strong>Tap "Add" in top-right</strong>
                      <span>
                        Confirm the name <strong>OneStop</strong> and tap Add. You can now launch it anytime directly from your phone!
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="onestop-guide-step-item">
                    <div className="onestop-guide-step-number">1</div>
                    <div className="onestop-guide-step-text">
                      <strong>Open Browser Menu</strong>
                      <span>
                        Tap the three dots{' '}
                        <span className="onestop-guide-inline-icon">⋮</span> in your browser's top or bottom bar.
                      </span>
                    </div>
                  </div>

                  <div className="onestop-guide-step-item">
                    <div className="onestop-guide-step-number">2</div>
                    <div className="onestop-guide-step-text">
                      <strong>Tap "Add to Home screen" or "Install App"</strong>
                      <span>
                        Select the install option from the browser menu.
                      </span>
                    </div>
                  </div>

                  <div className="onestop-guide-step-item">
                    <div className="onestop-guide-step-number">3</div>
                    <div className="onestop-guide-step-text">
                      <strong>Enjoy 1-tap access on the go</strong>
                      <span>
                        OneStop is saved right on your home screen for rapid access without opening the browser.
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="onestop-guide-footer">
              <div className="onestop-guide-perks">
                <span>⚡ Instant load</span>
                <span>🔔 Deadline push alerts</span>
                <span>🚀 Full screen</span>
              </div>
              <button
                type="button"
                className="onestop-guide-gotit-btn"
                onClick={() => {
                  setShowGuideModal(false);
                  setIsVisible(false);
                  handleDismiss();
                }}
              >
                Got It, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
