/**
 * Stripe Payment Gateway Configuration & Card Helpers
 * Supports realistic card validation, formatting, and official Stripe test cards.
 */

// Default Stripe test card values for quick 1-click testing
export const STRIPE_TEST_CARDS = {
  success: {
    number: '4242 4242 4242 4242',
    rawNumber: '4242424242424242',
    exp: '12/28',
    cvc: '123',
    name: 'سفيان إياد',
    label: 'بطاقة تجريبية ناجحة (4242)'
  }
};

/**
 * Detects card brand based on card number prefix
 */
export function detectCardBrand(number = '') {
  const clean = number.replace(/\s+/g, '');
  if (/^4/.test(clean)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(clean)) return 'mastercard';
  if (/^3[47]/.test(clean)) return 'amex';
  if (/^(6011|65|64[4-9])/.test(clean)) return 'discover';
  return 'generic';
}

/**
 * Formats card number into 4-digit chunks
 */
export function formatCardNumber(value = '') {
  const clean = value.replace(/\D+/g, '').slice(0, 16);
  const parts = [];
  for (let i = 0; i < clean.length; i += 4) {
    parts.push(clean.substring(i, i + 4));
  }
  return parts.join(' ');
}

/**
 * Formats expiration date into MM/YY
 */
export function formatExpiryDate(value = '') {
  const clean = value.replace(/\D+/g, '').slice(0, 4);
  if (clean.length >= 3) {
    return `${clean.slice(0, 2)}/${clean.slice(2)}`;
  }
  return clean;
}

/**
 * Validates expiration date (must be current or future month/year)
 */
export function validateExpiryDate(exp = '') {
  if (!/^\d{2}\/\d{2}$/.test(exp)) return false;
  const [month, year] = exp.split('/').map(Number);
  if (month < 1 || month > 12) return false;
  
  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;
  return true;
}

/**
 * Generates a realistic Stripe Transaction ID
 */
export function generateTransactionId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let rand = '';
  for (let i = 0; i < 24; i++) {
    rand += chars[Math.floor(Math.random() * chars.length)];
  }
  return `pi_3P${rand}`;
}
