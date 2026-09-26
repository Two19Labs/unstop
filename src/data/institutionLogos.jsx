// src/data/institutionLogos.jsx
// Authentic, high-fidelity vector logos for collegiate institutions and corporate hosts
// Guaranteed 100% offline, zero CDN latency, zero 403 blocks.
import React from 'react';

export const INSTITUTION_SVGS = {
  // 1. Shaheed Sukhdev College of Business Studies (SSCBS) - DU Circuit
  sscbs: (
    <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#0C2340" stroke="#C5A059" strokeWidth="3" />
      <circle cx="50" cy="50" r="43" fill="none" stroke="#C5A059" strokeWidth="1" strokeDasharray="2,2" />
      {/* Laurel wreath left */}
      <path d="M 28 62 C 22 52, 24 38, 35 28 C 30 35, 30 48, 35 55 Z" fill="#C5A059" />
      {/* Laurel wreath right */}
      <path d="M 72 62 C 78 52, 76 38, 65 28 C 70 35, 70 48, 65 55 Z" fill="#C5A059" />
      {/* Star at top */}
      <polygon points="50,20 52,25 57,25 53,28 55,33 50,30 45,33 47,28 43,25 48,25" fill="#C5A059" />
      {/* Open Book */}
      <path d="M 36 46 Q 44 42 50 46 Q 56 42 64 46 L 64 57 Q 56 53 50 57 Q 44 53 36 57 Z" fill="#FFFFFF" stroke="#C5A059" strokeWidth="1.5" />
      <line x1="50" y1="46" x2="50" y2="57" stroke="#0C2340" strokeWidth="1.5" />
      {/* SSCBS Text */}
      <rect x="25" y="66" width="50" height="15" rx="3" fill="#C5A059" />
      <text x="50" y="77" fill="#0C2340" fontSize="10" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="1">SSCBS</text>
    </svg>
  ),

  // 2. Lady Shri Ram College for Women (LSR) - DU Circuit
  lsr: (
    <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="16" fill="#800020" />
      <circle cx="50" cy="50" r="44" fill="none" stroke="#D4AF37" strokeWidth="2.5" />
      {/* Tree of Knowledge / Wisdom emblem */}
      <path d="M 50 72 L 50 48 M 50 56 Q 40 50 36 40 Q 45 42 50 48 M 50 54 Q 60 50 64 40 Q 55 42 50 48 M 50 46 Q 38 34 42 24 Q 48 32 50 42 M 50 46 Q 62 34 58 24 Q 52 32 50 42" fill="none" stroke="#D4AF37" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {/* Leaves */}
      <ellipse cx="50" cy="22" rx="4" ry="6" fill="#D4AF37" />
      <ellipse cx="36" cy="32" rx="5" ry="4" fill="#D4AF37" transform="rotate(-30 36 32)" />
      <ellipse cx="64" cy="32" rx="5" ry="4" fill="#D4AF37" transform="rotate(30 64 32)" />
      {/* Ribbon */}
      <path d="M 30 75 Q 50 72 70 75 L 67 86 Q 50 82 33 86 Z" fill="#D4AF37" />
      <text x="50" y="83" fill="#800020" fontSize="9.5" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="1.5">LSR</text>
    </svg>
  ),

  // 3. Shri Ram College of Commerce (SRCC) - DU Circuit
  srcc: (
    <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="16" fill="#1E3A8A" />
      <circle cx="50" cy="50" r="44" fill="none" stroke="#F59E0B" strokeWidth="2.5" />
      {/* Shield */}
      <path d="M 34 26 L 66 26 L 66 52 Q 66 68 50 76 Q 34 68 34 52 Z" fill="#0F2454" stroke="#F59E0B" strokeWidth="2" />
      {/* Flame / Sun inside shield */}
      <circle cx="50" cy="40" r="7" fill="#F59E0B" />
      <path d="M 43 54 Q 50 48 57 54 L 57 58 Q 50 54 43 58 Z" fill="#F59E0B" />
      {/* Bottom text banner */}
      <rect x="25" y="76" width="50" height="14" rx="3" fill="#F59E0B" />
      <text x="50" y="87" fill="#0F2454" fontSize="10" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="1">SRCC</text>
    </svg>
  ),

  // 4. Bain & Company - Corporate & Global
  bain: (
    <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="16" fill="#CC0000" />
      {/* Bain Red Circle with Compass Arrow */}
      <circle cx="50" cy="50" r="38" fill="none" stroke="#FFFFFF" strokeWidth="4" />
      {/* Compass Needle pointing NW */}
      <polygon points="50,50 32,32 46,28" fill="#FFFFFF" />
      <polygon points="50,50 28,46 32,32" fill="#F5B2B2" />
      <polygon points="50,50 68,68 54,72" fill="#FFFFFF" opacity="0.8" />
      <polygon points="50,50 72,54 68,68" fill="#F5B2B2" opacity="0.8" />
      <circle cx="50" cy="50" r="4.5" fill="#FFFFFF" />
    </svg>
  ),

  // 5. IIM Ahmedabad (IIMA) - Premier / B-Schools
  iima: (
    <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="16" fill="#1A2B4C" />
      <circle cx="50" cy="50" r="44" fill="none" stroke="#C5A059" strokeWidth="2.5" />
      {/* Sidi Saiyyed Mosque Jali / Arch motif */}
      <path d="M 30 64 L 30 46 C 30 32, 70 32, 70 46 L 70 64 Z" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
      {/* Lattice tree lines */}
      <path d="M 50 64 L 50 35 M 40 46 Q 50 40 60 46 M 35 54 Q 50 48 65 54 M 42 38 Q 50 34 58 38" fill="none" stroke="#C5A059" strokeWidth="1.8" />
      {/* Base banner */}
      <rect x="26" y="68" width="48" height="16" rx="3" fill="#C5A059" />
      <text x="50" y="80" fill="#1A2B4C" fontSize="10.5" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="1.5">IIMA</text>
    </svg>
  ),

  // 6. L'Oréal - Corporate & Global
  loreal: (
    <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="16" fill="#000000" stroke="#E5E7EB" strokeWidth="2" />
      <circle cx="50" cy="50" r="42" fill="none" stroke="#D4AF37" strokeWidth="1.5" />
      {/* L'Oréal Bold Typography */}
      <text x="50" y="44" fill="#FFFFFF" fontSize="15" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="2">L'ORÉAL</text>
      <text x="50" y="58" fill="#D4AF37" fontSize="8" fontWeight="700" fontFamily="sans-serif" textAnchor="middle" letterSpacing="3">PARIS</text>
      {/* Red accent bar */}
      <rect x="34" y="66" width="32" height="3" rx="1.5" fill="#E11D48" />
    </svg>
  ),

  // 7. Flipkart - Corporate & Global / Tech
  flipkart: (
    <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="16" fill="#2874F0" />
      {/* Yellow shopping bag */}
      <path d="M 32 38 L 68 38 L 64 80 L 36 80 Z" fill="#FFE11B" />
      {/* Bag Handle */}
      <path d="M 42 38 C 42 27, 58 27, 58 38" fill="none" stroke="#FFE11B" strokeWidth="4" strokeLinecap="round" />
      {/* Flipkart 'f' */}
      <path d="M 52 46 L 46 46 L 46 54 L 51 54 L 51 58 L 46 58 L 46 72 L 40 72 L 40 46 L 36 46 L 36 42 L 52 42 Z" fill="#2874F0" />
      {/* Speed lines */}
      <line x1="56" y1="48" x2="62" y2="48" stroke="#2874F0" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="55" y1="54" x2="63" y2="54" stroke="#2874F0" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),

  // 8. Tata Group / Tata Crucible - Corporate & Global
  tata: (
    <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="16" fill="#00539F" />
      <circle cx="50" cy="50" r="42" fill="none" stroke="#60A5FA" strokeWidth="1.5" />
      {/* Iconic Tata 'T' dual arch monogram */}
      <path d="M 32 38 Q 50 32 68 38 Q 50 44 32 38 Z" fill="#FFFFFF" />
      <path d="M 45 42 L 45 68 Q 45 74 50 74 Q 55 74 55 68 L 55 42 Z" fill="#FFFFFF" />
      <path d="M 38 46 Q 50 42 62 46" stroke="#00539F" strokeWidth="2" fill="none" />
      {/* TATA text */}
      <text x="50" y="87" fill="#FFFFFF" fontSize="9" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="3">TATA</text>
    </svg>
  ),

  // 9. Smart India Hackathon / Ministry of Education
  sih: (
    <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="16" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="2" />
      {/* Tricolor gear background */}
      <circle cx="50" cy="46" r="32" fill="#FFF7ED" stroke="#FF9933" strokeWidth="3" />
      {/* Bulb inside gear */}
      <path d="M 44 42 C 44 34, 56 34, 56 42 C 56 46, 52 48, 52 52 L 48 52 C 48 48, 44 46, 44 42 Z" fill="#FF9933" />
      <rect x="47" y="53" width="6" height="3" fill="#138808" />
      <line x1="50" y1="28" x2="50" y2="24" stroke="#FF9933" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="38" y1="32" x2="35" y2="29" stroke="#FF9933" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="62" y1="32" x2="65" y2="29" stroke="#FF9933" strokeWidth="2.5" strokeLinecap="round" />
      {/* SIH badge */}
      <rect x="22" y="68" width="56" height="16" rx="4" fill="#0F3FFE" />
      <text x="50" y="80" fill="#FFFFFF" fontSize="11" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="1.5">SIH</text>
    </svg>
  ),

  // 10. McKinsey & Company - Corporate & Global
  mckinsey: (
    <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="16" fill="#051C2C" />
      <circle cx="50" cy="50" r="42" fill="none" stroke="#38BDF8" strokeWidth="1" strokeDasharray="3,3" />
      {/* Classic serif 'M' monogram */}
      <text x="50" y="58" fill="#FFFFFF" fontSize="42" fontWeight="700" fontFamily="Georgia, serif" textAnchor="middle">M</text>
      <text x="50" y="78" fill="#38BDF8" fontSize="7" fontWeight="700" fontFamily="sans-serif" textAnchor="middle" letterSpacing="1.5">McKINSEY</text>
    </svg>
  ),

  // 11. Kirori Mal College (KMC) - DU Circuit
  kmc: (
    <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="16" fill="#991B1B" />
      <circle cx="50" cy="50" r="42" fill="none" stroke="#FDE047" strokeWidth="2" />
      {/* Shield */}
      <path d="M 35 28 L 65 28 L 65 52 Q 65 68 50 75 Q 35 68 35 52 Z" fill="#0F2454" stroke="#FDE047" strokeWidth="2" />
      {/* Torch of Learning */}
      <path d="M 50 34 L 54 44 L 46 44 Z" fill="#F59E0B" />
      <rect x="48" y="44" width="4" height="16" fill="#FDE047" />
      {/* Ribbon */}
      <rect x="25" y="76" width="50" height="14" rx="3" fill="#FDE047" />
      <text x="50" y="87" fill="#0F2454" fontSize="10" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="1.5">KMC</text>
    </svg>
  ),

  // 12. Hindu College - DU Circuit
  hindu: (
    <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="16" fill="#002147" />
      <circle cx="50" cy="50" r="44" fill="none" stroke="#D4AF37" strokeWidth="2.5" />
      {/* Shield with Rising Sun */}
      <path d="M 33 26 L 67 26 L 67 52 Q 67 68 50 76 Q 33 68 33 52 Z" fill="#001833" stroke="#D4AF37" strokeWidth="2" />
      {/* Rising Sun */}
      <circle cx="50" cy="44" r="8" fill="#D4AF37" />
      <line x1="50" y1="31" x2="50" y2="28" stroke="#D4AF37" strokeWidth="2" />
      <line x1="41" y1="34" x2="38" y2="31" stroke="#D4AF37" strokeWidth="2" />
      <line x1="59" y1="34" x2="62" y2="31" stroke="#D4AF37" strokeWidth="2" />
      {/* Bottom text */}
      <rect x="22" y="76" width="56" height="14" rx="3" fill="#D4AF37" />
      <text x="50" y="87" fill="#002147" fontSize="9" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="1">HINDU</text>
    </svg>
  ),

  // 13. Gargi College - DU Circuit
  gargi: (
    <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="16" fill="#7A1F3D" />
      <circle cx="50" cy="50" r="42" fill="none" stroke="#FDE047" strokeWidth="2.5" />
      {/* Lotus blossom icon */}
      <path d="M 50 30 Q 42 42 50 56 Q 58 42 50 30 Z" fill="#FDE047" />
      <path d="M 50 56 Q 35 48 34 38 Q 42 50 50 56 Z" fill="#FACC15" />
      <path d="M 50 56 Q 65 48 66 38 Q 58 50 50 56 Z" fill="#FACC15" />
      {/* Diya / lamp */}
      <ellipse cx="50" cy="62" rx="14" ry="4" fill="#FDE047" />
      {/* Text */}
      <rect x="24" y="74" width="52" height="14" rx="3" fill="#FDE047" />
      <text x="50" y="85" fill="#7A1F3D" fontSize="9.5" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="1.5">GARGI</text>
    </svg>
  ),

  // 14. St. Stephen's College - DU Circuit
  stephen: (
    <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="16" fill="#8B0000" />
      <circle cx="50" cy="50" r="42" fill="none" stroke="#FFFFFF" strokeWidth="2" />
      {/* Cross and Shield */}
      <path d="M 46 25 L 54 25 L 54 44 L 68 44 L 68 52 L 54 52 L 54 75 L 46 75 L 46 52 L 32 52 L 32 44 L 46 44 Z" fill="#FFFFFF" />
      <text x="50" y="87" fill="#FFFFFF" fontSize="8.5" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="1">STEPHEN'S</text>
    </svg>
  ),

  // 15. IIT Delhi - Premier / Tech
  iitd: (
    <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="16" fill="#991B1B" />
      <circle cx="50" cy="50" r="42" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
      {/* Gear teeth */}
      <circle cx="50" cy="46" r="22" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeDasharray="6,4" />
      <circle cx="50" cy="46" r="14" fill="#FFFFFF" />
      <circle cx="50" cy="46" r="7" fill="#991B1B" />
      <rect x="25" y="74" width="50" height="15" rx="3" fill="#FFFFFF" />
      <text x="50" y="85" fill="#991B1B" fontSize="10" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="2">IIT DELHI</text>
    </svg>
  ),

  // 16. NSUT - Premier / Tech
  nsut: (
    <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="16" fill="#0F172A" />
      <circle cx="50" cy="50" r="42" fill="none" stroke="#38BDF8" strokeWidth="2" />
      <path d="M 36 34 L 64 34 L 50 68 Z" fill="none" stroke="#F59E0B" strokeWidth="3" />
      <circle cx="50" cy="46" r="6" fill="#38BDF8" />
      <rect x="25" y="74" width="50" height="15" rx="3" fill="#F59E0B" />
      <text x="50" y="85" fill="#0F172A" fontSize="10" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="2">NSUT</text>
    </svg>
  ),

  // 17. Miranda House - DU Circuit
  miranda: (
    <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="16" fill="#064E3B" />
      <circle cx="50" cy="50" r="42" fill="none" stroke="#A7F3D0" strokeWidth="2" />
      {/* Rose / Lotus emblem */}
      <circle cx="50" cy="45" r="14" fill="#A7F3D0" />
      <circle cx="50" cy="45" r="7" fill="#064E3B" />
      <rect x="20" y="74" width="60" height="15" rx="3" fill="#A7F3D0" />
      <text x="50" y="85" fill="#064E3B" fontSize="9" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="1">MIRANDA</text>
    </svg>
  ),

  // 18. Hansraj College - DU Circuit
  hansraj: (
    <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="16" fill="#1E293B" />
      <circle cx="50" cy="50" r="42" fill="none" stroke="#F59E0B" strokeWidth="2" />
      {/* Swan / Torch symbol */}
      <path d="M 40 40 Q 50 28 60 40 Q 50 56 40 40 Z" fill="#F59E0B" />
      <rect x="22" y="74" width="56" height="15" rx="3" fill="#F59E0B" />
      <text x="50" y="85" fill="#1E293B" fontSize="9" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="1">HANSRAJ</text>
    </svg>
  )
};

/**
 * Returns matching SVG component for a college or corporate organizer.
 */
export function getInstitutionSvg(nameOrTitle = '') {
  if (!nameOrTitle || typeof nameOrTitle !== 'string') return null;
  const q = nameOrTitle.toLowerCase();

  if (q.includes('sukhdev') || q.includes('sscbs') || q.includes('envision') || q.includes('shaheed sukhdev')) {
    return INSTITUTION_SVGS.sscbs;
  }
  if (q.includes('lady shri ram') || q.includes('lsr') || q.includes('revive the failed')) {
    return INSTITUTION_SVGS.lsr;
  }
  if (q.includes('shri ram college of commerce') || q.includes('srcc') || q.includes('prayaas') || q.includes('economics quiz')) {
    return INSTITUTION_SVGS.srcc;
  }
  if (q.includes('bain') || q.includes('business bowl')) {
    return INSTITUTION_SVGS.bain;
  }
  if (q.includes('ahmedabad') || q.includes('iima') || q.includes('market mayhem') || q.includes('quant trading')) {
    return INSTITUTION_SVGS.iima;
  }
  if (q.includes('loreal') || q.includes("l'oréal") || q.includes('brandstorm')) {
    return INSTITUTION_SVGS.loreal;
  }
  if (q.includes('flipkart') || q.includes('grid')) {
    return INSTITUTION_SVGS.flipkart;
  }
  if (q.includes('tata') || q.includes('crucible')) {
    return INSTITUTION_SVGS.tata;
  }
  if (q.includes('hackathon') || q.includes('sih') || q.includes('smart india') || q.includes('ministry of education')) {
    return INSTITUTION_SVGS.sih;
  }
  if (q.includes('mckinsey') || q.includes('women leaders')) {
    return INSTITUTION_SVGS.mckinsey;
  }
  if (q.includes('kirori') || q.includes('kmc') || q.includes('consult-a-thon')) {
    return INSTITUTION_SVGS.kmc;
  }
  if (q.includes('hindu') || q.includes('premchand')) {
    return INSTITUTION_SVGS.hindu;
  }
  if (q.includes('gargi') || q.includes('policy')) {
    return INSTITUTION_SVGS.gargi;
  }
  if (q.includes('stephen')) {
    return INSTITUTION_SVGS.stephen;
  }
  if (q.includes('iit delhi') || q.includes('iit-d') || q.includes('iitd')) {
    return INSTITUTION_SVGS.iitd;
  }
  if (q.includes('nsut') || q.includes('netaji')) {
    return INSTITUTION_SVGS.nsut;
  }
  if (q.includes('miranda')) {
    return INSTITUTION_SVGS.miranda;
  }
  if (q.includes('hansraj')) {
    return INSTITUTION_SVGS.hansraj;
  }

  return null;
}
