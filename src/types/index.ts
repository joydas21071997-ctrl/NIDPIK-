export interface Merchant {
  id: string;
  name: string;
  logoText: string;
  badgeColor: string;
  affiliateBaseUrl: string;
}

export interface Author {
  id: string;
  name: string;
  role: string;
  avatar: string;
  bio: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string;
  categorySlug: string;
  subcategory: string;
  price: number;
  oldPrice?: number;
  currency: string;
  badge?: 'Best Value' | 'Budget Pick' | 'Editor\'s Choice' | 'Top Rated' | 'Best for Travel' | 'Best for Small Homes' | 'Student Pick';
  image: string;
  shortDescription: string;
  quickVerdict: string;
  bestFor: string;
  notIdealFor?: string;
  features: string[];
  specifications: Record<string, string>;
  pros: string[];
  cons: string[];
  merchant: Merchant;
  affiliateUrl: string;
  lastUpdated: string;
  status: 'active' | 'archived';
  ratingDisplay?: string; // e.g. "Editor Tested - 4.6/5 Value"
  inStock: boolean;
  budgetTier: number; // max budget threshold, e.g. 99, 199, 299, 499, 999, 1999, 2999, 4999
  problemTags?: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  subcategories: string[];
  featuredProductIds: string[];
  faqs: { question: string; answer: string }[];
}

export interface BuyingGuide {
  id: string;
  title: string;
  slug: string;
  category: string;
  categorySlug: string;
  subtitle: string;
  quickAnswer: string;
  authorId: string;
  publishedAt: string;
  updatedAt: string;
  readingTime: string;
  featuredProductIds: string[];
  budgetRange: string;
  whatToLookFor: { title: string; explanation: string }[];
  whoShouldBuy: string;
  whoShouldSkip: string;
  faqs: { question: string; answer: string }[];
}

export interface Comparison {
  id: string;
  title: string;
  slug: string;
  subtitle: string;
  category: string;
  categorySlug: string;
  productIds: [string, string] | [string, string, string];
  verdictSummary: string;
  winnerProductId?: string;
  comparisonPoints: {
    feature: string;
    description: string;
    winnerIndex?: number;
  }[];
  authorId: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  title: string;
  slug: string;
  productId: string;
  authorId: string;
  updatedAt: string;
  readingTime: string;
  verdict: string;
  whoItIsFor: string;
  whatWeLiked: string[];
  whatWeDidNotLike: string[];
  inDepthTesting: string;
  finalRatingText: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  categorySlug: string;
  excerpt: string;
  authorId: string;
  publishedAt: string;
  updatedAt: string;
  readingTime: string;
  image: string;
  content: string[];
  tags: string[];
  recommendedProductIds?: string[];
}

export interface ProblemCollection {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  image: string;
  targetUser: string;
  productIds: string[];
  adviceTips: string[];
}

export interface BudgetTier {
  amount: number;
  title: string;
  slug: string;
  headline: string;
  description: string;
  recommendedCategory: string;
}
