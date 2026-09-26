// src/lib/admin.js

export const ADMIN_EMAIL = 'aditya.25015@sscbs.du.ac.in';

export const ADMIN_EMAILS = [
  ADMIN_EMAIL,
];

/**
 * Checks whether the provided email has administrative privileges.
 * Strictly limited to aditya.25015@sscbs.du.ac.in.
 * 
 * @param {string} email 
 * @returns {boolean}
 */
export function isAdminEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.toLowerCase().trim();
  return ADMIN_EMAILS.some((admin) => admin.toLowerCase() === normalized);
}
