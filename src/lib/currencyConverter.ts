// Currency conversion utilities for Razorpay-supported currencies

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Rate from USD
}

// Razorpay supported currencies with current exchange rates
export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 90.3 },
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1 },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.855 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.741 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.49 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', rate: 1.28 },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', rate: 3.67 },
];

// Competitive pricing structure in INR (base currency)
// Pricing based on market research with 40-50% profit margin
export const PRICING_INR = {
  free: { monthly: 0, annual: 0 },
  basic: { monthly: 599, annual: 5999 }, // ~$6.63/mo - competitive with GitHub Teams
  pro: { monthly: 1799, annual: 17999 }, // ~$19.92/mo - premium team features
  enterprise: { monthly: 7999, annual: 79999 }, // ~$88.56/mo - full enterprise support
};

/**
 * Convert price from INR to target currency
 */
export function convertPrice(priceINR: number, targetCurrency: string): number {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === targetCurrency);
  if (!currency || targetCurrency === 'INR') return priceINR;

  // Convert INR to USD first, then to target currency
  const inrRate = SUPPORTED_CURRENCIES.find(c => c.code === 'INR')!.rate;
  const priceUSD = priceINR / inrRate;
  const targetPrice = priceUSD * currency.rate;

  // Round to nearest whole number for clean display
  return Math.round(targetPrice);
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  return currency?.symbol || currencyCode;
}

/**
 * Format price with currency symbol
 */
export function formatPrice(price: number, currencyCode: string): string {
  const symbol = getCurrencySymbol(currencyCode);

  // Format with commas for Indian numbering system (INR)
  if (currencyCode === 'INR') {
    return `${symbol}${price.toLocaleString('en-IN')}`;
  }

  // Format with commas for Western numbering system
  return `${symbol}${price.toLocaleString('en-US')}`;
}

/**
 * Get Razorpay amount in paise/cents
 */
export function getRazorpayAmount(price: number, currencyCode: string): number {
  // Razorpay expects amount in smallest currency unit
  // INR: paise (1 INR = 100 paise)
  // USD: cents (1 USD = 100 cents)
  return Math.round(price * 100);
}
