// WhatsApp number helpers, shared by the app and scripts/*_test.js
export function sanitizeIndianPhone(raw) {
  if (!raw) return '';
  let digits = String(raw).trim().replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  else if (digits.length > 10 && digits.startsWith('91')) digits = digits.slice(-10);
  return digits.slice(0, 10);
}

// WhatsApp numbers are strictly 10 digits starting with 6-9 (same rule as the database)
export function isValidIndianPhone(raw) {
  return /^[6-9]\d{9}$/.test(String(raw || ''));
}

// Input handler for every WhatsApp number box: digits only, max 10. A pasted
// "+91 98765 43210" or "098765..." is trimmed to the 10-digit number.
export function cleanPhoneInput(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length > 10) return sanitizeIndianPhone(digits);
  return digits;
}

export function phoneValidationError(raw) {
  const digits = String(raw || '');
  if (!digits) return 'Please enter your 10-digit WhatsApp number.';
  if (digits.length !== 10) return 'WhatsApp number must be exactly 10 digits.';
  if (!isValidIndianPhone(digits)) return 'Enter a valid mobile number (starts with 6, 7, 8 or 9).';
  return '';
}

export function formatWhatsAppUrl(phone, textMessage = '') {
  const cleanPhone = sanitizeIndianPhone(phone);
  if (!isValidIndianPhone(cleanPhone)) return '#';
  return `https://wa.me/91${cleanPhone}${textMessage ? `?text=${encodeURIComponent(textMessage)}` : ''}`;
}
