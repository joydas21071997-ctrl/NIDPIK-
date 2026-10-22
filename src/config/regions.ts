export type CountryCode = 'IN' | 'US' | 'UK' | 'CA';

export interface CountryInfo {
  code: CountryCode;
  name: string;
  currencySymbol: string;
  currencyCode: string;
  flag: string;
}

export interface RegionTrustBadge {
  title: string;
  subtitle: string;
}

export interface RegionBudgetTier {
  amount: number;
  label: string;
  slug: string;
}

export interface RegionConfig {
  code: CountryCode;
  name: string;
  currencySymbol: string;
  currencyCode: string;
  flag: string;
  locale: string;
  merchantsSummary: string;
  disclosureText: string;
  shopperAudience: string;
  newsletterSubtitle: string;
  trustBadges: RegionTrustBadge[];
  budgetTiers: RegionBudgetTier[];
  partnerMerchants: string[];
  contactEmail: string;
}

export const COUNTRIES: CountryInfo[] = [
  { code: 'IN', name: 'India', currencySymbol: '₹', currencyCode: 'INR', flag: '🇮🇳' },
  { code: 'US', name: 'United States', currencySymbol: '$', currencyCode: 'USD', flag: '🇺🇸' },
  { code: 'UK', name: 'United Kingdom', currencySymbol: '£', currencyCode: 'GBP', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', currencySymbol: 'C$', currencyCode: 'CAD', flag: '🇨🇦' },
];

export const EXCHANGE_RATES: Record<CountryCode, number> = {
  IN: 1,
  US: 0.012,
  UK: 0.009,
  CA: 0.016,
};

export const REGIONS_CONFIG: Record<CountryCode, RegionConfig> = {
  IN: {
    code: 'IN',
    name: 'India',
    currencySymbol: '₹',
    currencyCode: 'INR',
    flag: '🇮🇳',
    locale: 'en-IN',
    merchantsSummary: 'Amazon India, Flipkart, Meesho, and verified partner stores',
    disclosureText: 'Product prices, deals, and availability are subject to real-time merchant updates on Amazon India, Flipkart, Meesho, and partner websites.',
    shopperAudience: 'smart shoppers across India',
    newsletterSubtitle: 'Weekly handpicked value picks, practical buying guides, and honest product tests for Indian households.',
    contactEmail: 'hello@nidpik.com',
    partnerMerchants: ['Amazon India', 'Flipkart', 'Meesho', 'Croma', 'Tata CLiQ'],
    trustBadges: [
      { title: 'Zero Fabricated Ratings', subtitle: 'Authentic hands-on testing' },
      { title: 'INR Fair Price Tracking', subtitle: 'Live price and deal verification' },
      { title: 'Verified Buying Guides', subtitle: 'Unbiased consumer advice' },
    ],
    budgetTiers: [
      { amount: 99, label: 'Under ₹99', slug: 'best-under-99' },
      { amount: 199, label: 'Under ₹199', slug: 'best-under-199' },
      { amount: 299, label: 'Under ₹299', slug: 'best-under-299' },
      { amount: 499, label: 'Under ₹499', slug: 'best-under-499' },
      { amount: 999, label: 'Under ₹999', slug: 'best-under-999' },
      { amount: 1999, label: 'Under ₹1,999', slug: 'best-under-1999' },
      { amount: 2999, label: 'Under ₹2,999', slug: 'best-under-2999' },
      { amount: 4999, label: 'Under ₹4,999', slug: 'best-under-4999' },
    ]
  },
  US: {
    code: 'US',
    name: 'United States',
    currencySymbol: '$',
    currencyCode: 'USD',
    flag: '🇺🇸',
    locale: 'en-US',
    merchantsSummary: 'Amazon.com, Walmart, Best Buy, and verified partner stores',
    disclosureText: 'Product prices, deals, and availability are subject to real-time merchant updates on Amazon.com, Walmart, Best Buy, and authorized retailers.',
    shopperAudience: 'smart shoppers across the United States',
    newsletterSubtitle: 'Weekly handpicked value picks, practical buying guides, and honest product tests for US homes.',
    contactEmail: 'hello@nidpik.com',
    partnerMerchants: ['Amazon US', 'Walmart', 'Best Buy', 'Target'],
    trustBadges: [
      { title: 'Zero Fabricated Ratings', subtitle: 'Authentic hands-on testing' },
      { title: 'USD Fair Price Tracking', subtitle: 'Live price and deal verification' },
      { title: 'Verified Buying Guides', subtitle: 'Unbiased consumer advice' },
    ],
    budgetTiers: [
      { amount: 99, label: 'Under $15', slug: 'best-under-99' },
      { amount: 199, label: 'Under $25', slug: 'best-under-199' },
      { amount: 299, label: 'Under $35', slug: 'best-under-299' },
      { amount: 499, label: 'Under $50', slug: 'best-under-499' },
      { amount: 999, label: 'Under $100', slug: 'best-under-999' },
      { amount: 1999, label: 'Under $150', slug: 'best-under-1999' },
      { amount: 2999, label: 'Under $200', slug: 'best-under-2999' },
      { amount: 4999, label: 'Under $350', slug: 'best-under-4999' },
    ]
  },
  UK: {
    code: 'UK',
    name: 'United Kingdom',
    currencySymbol: '£',
    currencyCode: 'GBP',
    flag: '🇬🇧',
    locale: 'en-GB',
    merchantsSummary: 'Amazon UK, Currys, Argos, and verified partner stores',
    disclosureText: 'Product prices, deals, and availability are subject to real-time merchant updates on Amazon UK, Currys, Argos, and authorized retailers.',
    shopperAudience: 'smart shoppers across the United Kingdom',
    newsletterSubtitle: 'Weekly handpicked value picks, practical buying guides, and honest product tests for UK homes.',
    contactEmail: 'hello@nidpik.com',
    partnerMerchants: ['Amazon UK', 'Currys', 'Argos', 'John Lewis'],
    trustBadges: [
      { title: 'Zero Fabricated Ratings', subtitle: 'Authentic hands-on testing' },
      { title: 'GBP Fair Price Tracking', subtitle: 'Live price and deal verification' },
      { title: 'Verified Buying Guides', subtitle: 'Unbiased consumer advice' },
    ],
    budgetTiers: [
      { amount: 99, label: 'Under £10', slug: 'best-under-99' },
      { amount: 199, label: 'Under £20', slug: 'best-under-199' },
      { amount: 299, label: 'Under £30', slug: 'best-under-299' },
      { amount: 499, label: 'Under £45', slug: 'best-under-499' },
      { amount: 999, label: 'Under £80', slug: 'best-under-999' },
      { amount: 1999, label: 'Under £130', slug: 'best-under-1999' },
      { amount: 2999, label: 'Under £180', slug: 'best-under-2999' },
      { amount: 4999, label: 'Under £300', slug: 'best-under-4999' },
    ]
  },
  CA: {
    code: 'CA',
    name: 'Canada',
    currencySymbol: 'C$',
    currencyCode: 'CAD',
    flag: '🇨🇦',
    locale: 'en-CA',
    merchantsSummary: 'Amazon Canada, Best Buy, Canadian Tire, and partner stores',
    disclosureText: 'Product prices, deals, and availability are subject to real-time merchant updates on Amazon Canada, Best Buy, Canadian Tire, and authorized stores.',
    shopperAudience: 'smart shoppers across Canada',
    newsletterSubtitle: 'Weekly handpicked value picks, practical buying guides, and honest product tests for Canadian households.',
    contactEmail: 'hello@nidpik.com',
    partnerMerchants: ['Amazon CA', 'Best Buy CA', 'Canadian Tire', 'Walmart CA'],
    trustBadges: [
      { title: 'Zero Fabricated Ratings', subtitle: 'Authentic hands-on testing' },
      { title: 'CAD Fair Price Tracking', subtitle: 'Live price and deal verification' },
      { title: 'Verified Buying Guides', subtitle: 'Unbiased consumer advice' },
    ],
    budgetTiers: [
      { amount: 99, label: 'Under C$15', slug: 'best-under-99' },
      { amount: 199, label: 'Under C$25', slug: 'best-under-199' },
      { amount: 299, label: 'Under C$35', slug: 'best-under-299' },
      { amount: 499, label: 'Under C$60', slug: 'best-under-499' },
      { amount: 999, label: 'Under C$120', slug: 'best-under-999' },
      { amount: 1999, label: 'Under C$180', slug: 'best-under-1999' },
      { amount: 2999, label: 'Under C$250', slug: 'best-under-2999' },
      { amount: 4999, label: 'Under C$400', slug: 'best-under-4999' },
    ]
  }
};
