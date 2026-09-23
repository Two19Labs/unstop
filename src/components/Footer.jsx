// src/components/Footer.jsx
import React from 'react';
import './Footer.css';

export default function Footer() {
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
      </p>
    </footer>
  );
}
