import { BudgetTier } from '../types';

export const budgetTiers: BudgetTier[] = [
  {
    amount: 99,
    title: 'Best Under ₹99',
    slug: 'best-under-99',
    headline: 'High-utility small essentials under ₹99',
    description: 'Everyday fixes, micro-organizers, and cleaning tools that cost less than a cup of specialty coffee but deliver genuine daily value.',
    recommendedCategory: 'Everyday Essentials'
  },
  {
    amount: 199,
    title: 'Best Under ₹199',
    slug: 'best-under-199',
    headline: 'Practical problem solvers under ₹199',
    description: 'Tested cable ties, sink strainers, mobile desktop kickstands, and micro-tools with surprising durability.',
    recommendedCategory: 'Work & Study'
  },
  {
    amount: 299,
    title: 'Best Under ₹299',
    slug: 'best-under-299',
    headline: 'Proven value champions under ₹299',
    description: 'Stainless steel water bottles, braided fast-charging cables, and compact kitchen organizers that punch above their weight.',
    recommendedCategory: 'Home & Kitchen'
  },
  {
    amount: 499,
    title: 'Best Under ₹499',
    slug: 'best-under-499',
    headline: 'Essential upgrades under ₹499',
    description: 'High-speed multi-port adapters, digital luggage scales, compact desk lamps, and durable resistance fitness bands.',
    recommendedCategory: 'Electronics'
  },
  {
    amount: 999,
    title: 'Best Under ₹999',
    slug: 'best-under-999',
    headline: 'Heavyweight daily utility under ₹999',
    description: 'Fast 1.5L electric kettles, smart Wi-Fi geyser plugs, ergonomic laptop risers, and revolving spice carousels.',
    recommendedCategory: 'Home & Kitchen'
  },
  {
    amount: 1999,
    title: 'Best Under ₹1,999',
    slug: 'best-under-1999',
    headline: 'Smart lifestyle picks under ₹1,999',
    description: 'Top-selling wireless earbuds with ENC, Bluetooth fitness smartwatches, and durable induction cooktops.',
    recommendedCategory: 'Electronics'
  },
  {
    amount: 2999,
    title: 'Best Under ₹2,999',
    slug: 'best-under-2999',
    headline: 'Premium home & entertainment under ₹2,999',
    description: 'Full HD streaming sticks, cordless waterproof grooming systems, and high-capacity fast charging power banks.',
    recommendedCategory: 'Electronics'
  },
  {
    amount: 4999,
    title: 'Best Under ₹4,999',
    slug: 'best-under-4999',
    headline: 'Flagship tier upgrades under ₹4,999',
    description: 'Active Noise Cancelling earbuds, compact digital air fryers, and smart ambient HEPA air purifiers for clean indoor living.',
    recommendedCategory: 'Home & Kitchen'
  }
];

export const priceRanges = [
  { label: 'All Budgets', min: 0, max: Infinity },
  { label: '₹99 – ₹199', min: 99, max: 199 },
  { label: '₹199 – ₹299', min: 199, max: 299 },
  { label: '₹299 – ₹499', min: 299, max: 499 },
  { label: '₹499 – ₹999', min: 499, max: 999 },
  { label: '₹999 – ₹1,999', min: 999, max: 1999 },
  { label: '₹1,999 – ₹2,999', min: 1999, max: 2999 },
  { label: '₹2,999+', min: 2999, max: Infinity }
];
