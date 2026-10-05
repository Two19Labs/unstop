// Runs before the app renders (kept as a file so the CSP can forbid inline scripts)
try {
  localStorage.removeItem('onestop_theme');
  document.documentElement.setAttribute('data-theme', 'light');
} catch (e) {}
