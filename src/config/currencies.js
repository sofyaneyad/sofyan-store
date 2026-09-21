/**
 * Price Formatter for SOFYANEYAD Store (USD - $)
 * Clean and fast currency display without unnecessary external API calls or multi-currency switching.
 */

export function formatPrice(amount, _currencyCode = 'USD', decimals = -1) {
  const num = Number(amount) || 0;
  
  let formattedNumber;
  if (decimals >= 0) {
    formattedNumber = num.toFixed(decimals);
  } else if (num % 1 === 0) {
    formattedNumber = num.toString();
  } else {
    formattedNumber = num.toFixed(2);
  }

  // Format with thousand commas (e.g. 1,250.00)
  const parts = formattedNumber.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return `$${parts.join('.')}`;
}

export function convertPrice(amount) {
  return Number(amount) || 0;
}

export const DEFAULT_CURRENCY = 'USD';

export const CURRENCIES = {
  USD: {
    code: 'USD',
    name: 'دولار أمريكي',
    symbol: '$',
    symbolPosition: 'before',
    rate: 1.0
  }
};
