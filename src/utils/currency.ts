// src/utils/currency.ts
import { COUNTRIES } from '../context/AppContext';

const exchangeRates: Record<string, number> = {
  IN: 1,
  US: 0.012,
  UK: 0.009,
  CA: 0.016,
};

export const formatPrice = (price: number, countryCode: string): string => {
  const country = COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0];
  const rate = exchangeRates[countryCode] || 1;
  const convertedPrice = Math.round(price * rate);
  return `${country.currencySymbol}${convertedPrice.toLocaleString()}`;
};
