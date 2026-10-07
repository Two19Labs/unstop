// src/components/Footer.jsx
import React from 'react';
import './Footer.css';

export default function Footer({ onNavigate = () => {} }) {
  const handleNav = (screenId) => onNavigate(screenId);

  return (
    <footer className="onestop-site-footer">
      <p className="onestop-footer-text">
        <span>Made with </span>
        <span className="onestop-footer-heart" aria-label="love">♥</span>
        <span> by </span>
        <a
          href="https://www.linkedin.com/in/aditya-singhani-69294a27a/"
          target="_blank"
          rel="noopener noreferrer"
          className="onestop-footer-link"
        >
          Aditya Singhani
        </a>
        <span> &amp; </span>
        <a
          href="https://www.linkedin.com/in/manthan-kabra/"
          target="_blank"
          rel="noopener noreferrer"
          className="onestop-footer-link"
        >
          Manthan Kabra
        </a>
        <span className="onestop-footer-dot"> · </span>
        <span>From the House of </span>
        <a
          href="https://two19labs.in"
          target="_blank"
          rel="noopener noreferrer"
          className="onestop-footer-link"
        >
          Two19 Labs
        </a>
        <span className="onestop-footer-dot"> · </span>
        <button
          type="button"
          onClick={() => handleNav('about')}
          className="onestop-footer-link onestop-footer-btn"
        >
          About
        </button>
        <span className="onestop-footer-dot"> · </span>
        <button
          type="button"
          onClick={() => handleNav('contact')}
          className="onestop-footer-link onestop-footer-btn"
        >
          Contact &amp; support
        </button>
        <span className="onestop-footer-dot"> · </span>
        <a href="/privacy" className="onestop-footer-link">Privacy</a>
        <span className="onestop-footer-dot"> · </span>
        <a href="/terms" className="onestop-footer-link">Terms</a>
      </p>
    </footer>
  );
}
