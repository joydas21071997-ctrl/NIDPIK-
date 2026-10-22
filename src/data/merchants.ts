import { Merchant } from '../types';

export const merchants: Merchant[] = [
  {
    id: 'amazon',
    name: 'Amazon India',
    logoText: 'Amazon',
    badgeColor: '#FF9900',
    affiliateBaseUrl: 'https://www.amazon.in/dp/'
  },
  {
    id: 'flipkart',
    name: 'Flipkart',
    logoText: 'Flipkart',
    badgeColor: '#2874F0',
    affiliateBaseUrl: 'https://www.flipkart.com/p/'
  },
  {
    id: 'meesho',
    name: 'Meesho',
    logoText: 'Meesho',
    badgeColor: '#84226b',
    affiliateBaseUrl: 'https://www.meesho.com/'
  },
  {
    id: 'croma',
    name: 'Croma',
    logoText: 'Croma',
    badgeColor: '#00B5B5',
    affiliateBaseUrl: 'https://www.croma.com/p/'
  },
  {
    id: 'tatacliq',
    name: 'Tata CLiQ',
    logoText: 'Tata CLiQ',
    badgeColor: '#D8232A',
    affiliateBaseUrl: 'https://www.tatacliq.com/p/'
  }
];

