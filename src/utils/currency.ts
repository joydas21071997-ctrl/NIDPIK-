// src/utils/currency.ts
import { COUNTRIES, EXCHANGE_RATES, type CountryCode } from '../config/regions';

export const formatPrice = (price: number | undefined | null, countryCode?: string): string => {
  if (price === undefined || price === null || isNaN(price)) {
    return '';
  }

  const validCountryCode = (countryCode?.toUpperCase() || 'IN') as CountryCode;
  const country = COUNTRIES.find((c) => c.code === validCountryCode) || COUNTRIES[0];
  const rate = EXCHANGE_RATES[validCountryCode] ?? 1;
  const convertedPrice = Math.max(1, Math.round(price * rate));

  return `${country.currencySymbol}${convertedPrice.toLocaleString()}`;
};
