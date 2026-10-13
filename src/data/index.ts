export * from './merchants';
export * from './authors';
export * from './categories';
export * from './budgetTiers';
export * from './products';
export * from './problemCollections';
export * from './buyingGuides';
export * from './comparisons';
export * from './reviews';
export * from './articles';

import { products } from './products';
import { categories } from './categories';
import { buyingGuides } from './buyingGuides';
import { comparisons } from './comparisons';
import { reviews } from './reviews';
import { articles } from './articles';
import { problemCollections } from './problemCollections';
import { budgetTiers } from './budgetTiers';
import { authors } from './authors';

// Helper utilities
export function getProductBySlug(slug: string) {
  return products.find(p => p.slug === slug || p.id === slug);
}

export function getCategoryBySlug(slug: string) {
  return categories.find(c => c.slug === slug || c.id === slug);
}

export function getGuideBySlug(slug: string) {
  return buyingGuides.find(g => g.slug === slug || g.id === slug);
}

export function getComparisonBySlug(slug: string) {
  return comparisons.find(c => c.slug === slug || c.id === slug);
}

export function getReviewBySlug(slug: string) {
  return reviews.find(r => r.slug === slug || r.id === slug || r.productId === slug);
}

export function getArticleBySlug(slug: string) {
  return articles.find(a => a.slug === slug || a.id === slug);
}

export function getProblemBySlug(slug: string) {
  return problemCollections.find(p => p.slug === slug || p.id === slug);
}

export function getBudgetTierByAmount(amount: number) {
  return budgetTiers.find(b => b.amount === amount);
}

export function getBudgetTierBySlug(slug: string) {
  return budgetTiers.find(b => b.slug === slug);
}

export function getAuthorById(id: string) {
  return authors.find(a => a.id === id);
}

export function getProductsForCategory(categorySlug: string) {
  return products.filter(p => p.categorySlug === categorySlug);
}

export function getProductsForBudget(maxAmount: number) {
  return products.filter(p => p.price <= maxAmount);
}

export function searchAll(query: string) {
  const q = query.toLowerCase().trim();
  if (!q) {
    return {
      products: [],
      guides: [],
      comparisons: [],
      articles: [],
      categories: [],
      problems: []
    };
  }

  // Detect price numbers in query, e.g. "under 500" or "under 2000"
  const priceMatch = q.match(/under\s*₹?\s*(\d+)/i) || q.match(/₹\s*(\d+)/i);
  const maxPrice = priceMatch ? parseInt(priceMatch[1], 10) : null;

  const matchedProducts = products.filter(p => {
    const textMatch = (
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.subcategory.toLowerCase().includes(q) ||
      p.shortDescription.toLowerCase().includes(q) ||
      p.bestFor.toLowerCase().includes(q)
    );
    if (maxPrice !== null) {
      return p.price <= maxPrice && (textMatch || q.includes('under') || q.includes('products'));
    }
    return textMatch;
  });

  const matchedGuides = buyingGuides.filter(g =>
    g.title.toLowerCase().includes(q) ||
    g.subtitle.toLowerCase().includes(q) ||
    g.category.toLowerCase().includes(q)
  );

  const matchedComparisons = comparisons.filter(c =>
    c.title.toLowerCase().includes(q) ||
    c.subtitle.toLowerCase().includes(q) ||
    c.category.toLowerCase().includes(q)
  );

  const matchedArticles = articles.filter(a =>
    a.title.toLowerCase().includes(q) ||
    a.excerpt.toLowerCase().includes(q) ||
    a.tags.some(t => t.toLowerCase().includes(q))
  );

  const matchedCategories = categories.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.subcategories.some(s => s.toLowerCase().includes(q))
  );

  const matchedProblems = problemCollections.filter(p =>
    p.title.toLowerCase().includes(q) ||
    p.tagline.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q)
  );

  return {
    products: matchedProducts,
    guides: matchedGuides,
    comparisons: matchedComparisons,
    articles: matchedArticles,
    categories: matchedCategories,
    problems: matchedProblems
  };
}
