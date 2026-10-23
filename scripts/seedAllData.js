// @ts-nocheck
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import crypto from 'crypto';

import { products as seedProducts } from '../src/data/products.js';
import { categories as seedCategories } from '../src/data/categories.js';
import { buyingGuides as seedGuides } from '../src/data/buyingGuides.js';
import { comparisons as seedComparisons } from '../src/data/comparisons.js';
import { reviews as seedReviews } from '../src/data/reviews.js';
import { articles as seedArticles } from '../src/data/articles.js';
import { problemCollections as seedProblems } from '../src/data/problemCollections.js';
import { budgetTiers as seedBudgets } from '../src/data/budgetTiers.js';
import { merchants as seedMerchants } from '../src/data/merchants.js';
import { authors as seedAuthors } from '../src/data/authors.js';

import * as schema from '../src/db/schema.js';

const { Pool } = pg;

const pool = new Pool({
  host: process.env.SQL_HOST,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DB_NAME,
  max: 10,
  connectionTimeoutMillis: 15000,
});

const db = drizzle(pool, { schema });

function hashPassword(password, salt) {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, generatedSalt, 64).toString('hex');
  return { hash, salt: generatedSalt };
}

async function runSeed() {
  console.log('[Seed] Testing Cloud SQL PostgreSQL connection from Node.js runtime...');
  
  // 1. Real Connection Test
  const timeResult = await db.execute(sql`SELECT NOW() as current_time, current_database() as db_name, current_user as db_user;`);
  console.log('[Seed] Connection SUCCESS! Server time & DB info:', timeResult.rows[0]);

  const now = new Date().toISOString();

  // 2. Seed Users
  const ownerEmail = (process.env.ADMIN_OWNER_EMAIL || 'admin@nidpik.com').trim().toLowerCase();
  const ownerPassword = process.env.ADMIN_OWNER_PASSWORD || '';
  const { hash, salt } = hashPassword(ownerPassword);

  console.log('[Seed] Seeding users...');
  await db.insert(schema.users).values({
    id: 'user_owner',
    email: ownerEmail,
    passwordHash: hash,
    salt: salt,
    name: 'NIDPIK Site Administrator',
    role: 'OWNER',
    status: 'active',
    createdAt: now
  }).onConflictDoNothing();

  if (ownerEmail !== 'admin@nidpik.com') {
    await db.insert(schema.users).values({
      id: 'user_admin_alias',
      email: 'admin@nidpik.com',
      passwordHash: hash,
      salt: salt,
      name: 'NIDPIK Site Administrator',
      role: 'OWNER',
      status: 'active',
      createdAt: now
    }).onConflictDoNothing();
  }

  // 3. Seed Merchants
  console.log('[Seed] Seeding merchants...');
  for (const m of seedMerchants) {
    await db.insert(schema.merchants).values({
      id: m.id,
      name: m.name,
      logoText: m.logoText,
      badgeColor: m.badgeColor,
      affiliateBaseUrl: m.affiliateBaseUrl,
      affiliateNetwork: m.name + ' Affiliate',
      status: 'active',
      notes: 'Initial seed merchant',
      createdAt: now,
      updatedAt: now
    }).onConflictDoNothing();
  }

  // 4. Seed Authors
  console.log('[Seed] Seeding authors...');
  for (const a of seedAuthors) {
    await db.insert(schema.authors).values({
      id: a.id,
      name: a.name,
      role: a.role,
      avatar: a.avatar,
      bio: a.bio,
      socialLinksJson: '{}',
      status: 'active',
      createdAt: now,
      updatedAt: now
    }).onConflictDoNothing();
  }

  // 5. Seed Budget Tiers
  console.log('[Seed] Seeding budget tiers...');
  for (const b of seedBudgets) {
    await db.insert(schema.budgetTiers).values({
      amount: b.amount,
      title: b.title,
      slug: b.slug,
      headline: b.headline,
      description: b.description,
      recommendedCategory: b.recommendedCategory,
      createdAt: now,
      updatedAt: now
    }).onConflictDoNothing();
  }

  // 6. Seed Categories
  console.log('[Seed] Seeding categories...');
  let cIdx = 0;
  for (const c of seedCategories) {
    await db.insert(schema.categories).values({
      id: c.id || c.slug,
      slug: c.slug,
      name: c.name,
      description: c.description || '',
      iconName: c.iconName || 'Package',
      image: c.image || '',
      subcategoriesJson: JSON.stringify(c.subcategories || []),
      featuredProductIdsJson: JSON.stringify(c.featuredProductIds || []),
      faqsJson: JSON.stringify(c.faqs || []),
      isFeatured: c.isFeatured ? 1 : 0,
      orderIndex: cIdx++,
      status: 'PUBLISHED',
      createdAt: now,
      updatedAt: now
    }).onConflictDoNothing();
  }

  // 7. Seed Products
  console.log('[Seed] Seeding products...');
  for (const p of seedProducts) {
    await db.insert(schema.products).values({
      id: p.id,
      slug: p.slug,
      name: p.name,
      brand: p.brand || 'NIDPIK Verified',
      category: p.category || 'General',
      categorySlug: p.categorySlug || 'general',
      subcategory: p.subcategory || 'General',
      price: p.price ?? 99,
      oldPrice: p.oldPrice || null,
      currency: p.currency || '₹',
      badge: p.badge || null,
      image: p.image || '',
      galleryJson: JSON.stringify(p.gallery || []),
      shortDescription: p.shortDescription || '',
      quickVerdict: p.quickVerdict || '',
      bestFor: p.bestFor || '',
      notIdealFor: p.notIdealFor || null,
      featuresJson: JSON.stringify(p.features || []),
      specificationsJson: JSON.stringify(p.specifications || {}),
      prosJson: JSON.stringify(p.pros || []),
      consJson: JSON.stringify(p.cons || []),
      merchantJson: JSON.stringify(p.merchant || { id: 'amazon', name: 'Amazon India' }),
      affiliateUrl: p.affiliateUrl || (p.affiliateUrls ? p.affiliateUrls.IN || '' : ''),
      affiliateNetwork: p.affiliateNetwork || 'Amazon Associates',
      lastUpdated: p.lastUpdated || now,
      status: p.status || 'PUBLISHED',
      ratingDisplay: p.ratingDisplay || '4.5/5',
      inStock: p.inStock ? 1 : 0,
      budgetTier: p.budgetTier ?? 99,
      problemTagsJson: JSON.stringify(p.problemTags || []),
      seoTitle: p.seoTitle || p.name,
      seoDescription: p.seoDescription || p.shortDescription,
      canonicalUrl: p.canonicalUrl || null,
      ogImage: p.ogImage || p.image,
      createdAt: now,
      updatedAt: now
    }).onConflictDoNothing();

    if (p.affiliateUrl || (p.affiliateUrls && p.affiliateUrls.IN)) {
      await db.insert(schema.affiliateLinks).values({
        id: `link_${p.id}_amazon`,
        productId: p.id,
        merchantId: p.merchant?.id || 'amazon',
        affiliateUrl: p.affiliateUrl || p.affiliateUrls?.IN || '',
        destinationUrl: p.affiliateUrl || p.affiliateUrls?.IN || '',
        trackingInfo: 'Initial Seed Link',
        status: 'active',
        createdAt: now,
        updatedAt: now
      }).onConflictDoNothing();
    }
  }

  // 8. Seed Articles
  console.log('[Seed] Seeding articles...');
  for (const a of seedArticles) {
    await db.insert(schema.articles).values({
      id: a.id || a.slug,
      slug: a.slug,
      title: a.title,
      category: a.category || 'Guides',
      categorySlug: a.categorySlug || 'guides',
      excerpt: a.excerpt || '',
      authorId: a.author?.id || a.authorId || 'rahul-sharma',
      publishedAt: a.publishedAt || now,
      updatedAt: a.updatedAt || now,
      readingTime: a.readingTime || '5 min read',
      image: a.coverImage || a.image || '',
      contentJson: JSON.stringify(a.paragraphs || a.content || []),
      tagsJson: JSON.stringify(a.tags || []),
      recommendedProductIdsJson: JSON.stringify(a.relatedProductIds || []),
      status: 'PUBLISHED',
      seoTitle: a.seoTitle || a.title,
      seoDescription: a.seoDescription || a.excerpt,
      createdAt: now
    }).onConflictDoNothing();
  }

  // 9. Seed Buying Guides
  console.log('[Seed] Seeding buying guides...');
  for (const g of seedGuides) {
    await db.insert(schema.buyingGuides).values({
      id: g.id || g.slug,
      slug: g.slug,
      title: g.title,
      category: g.category || 'Guides',
      categorySlug: g.categorySlug || 'guides',
      subtitle: g.subtitle || '',
      quickAnswer: g.quickAnswer || '',
      authorId: g.author?.id || g.authorId || 'rahul-sharma',
      publishedAt: g.publishedAt || now,
      updatedAt: g.updatedAt || now,
      readingTime: g.readingTime || '6 min read',
      featuredProductIdsJson: JSON.stringify(g.featuredProductIds || []),
      budgetRange: g.budgetRange || '₹99 - ₹4,999',
      whatToLookForJson: JSON.stringify(g.whatToLookFor || []),
      whoShouldBuy: g.whoShouldBuy || '',
      whoShouldSkip: g.whoShouldSkip || '',
      faqsJson: JSON.stringify(g.faqs || []),
      status: 'PUBLISHED',
      seoTitle: g.seoTitle || g.title,
      seoDescription: g.seoDescription || g.subtitle,
      createdAt: now
    }).onConflictDoNothing();
  }

  // 10. Seed Comparisons
  console.log('[Seed] Seeding comparisons...');
  for (const comp of seedComparisons) {
    await db.insert(schema.comparisons).values({
      id: comp.id || comp.slug,
      slug: comp.slug,
      title: comp.title,
      subtitle: comp.subtitle || '',
      category: comp.category || 'Comparisons',
      categorySlug: comp.categorySlug || 'comparisons',
      productIdsJson: JSON.stringify(comp.productIds || []),
      winnerProductId: comp.winnerProductId || null,
      verdictSummary: comp.verdictSummary || '',
      comparisonPointsJson: JSON.stringify(comp.comparisonPoints || []),
      authorId: comp.author?.id || comp.authorId || 'rahul-sharma',
      updatedAt: comp.updatedAt || now,
      status: 'PUBLISHED',
      seoTitle: comp.seoTitle || comp.title,
      seoDescription: comp.seoDescription || comp.subtitle,
      createdAt: now
    }).onConflictDoNothing();
  }

  // 11. Seed Reviews
  console.log('[Seed] Seeding reviews...');
  for (const r of seedReviews) {
    await db.insert(schema.reviews).values({
      id: r.id || r.slug,
      slug: r.slug,
      title: r.title,
      productId: r.productId || r.product?.id || '',
      authorId: r.author?.id || r.authorId || 'rahul-sharma',
      updatedAt: r.updatedAt || now,
      readingTime: r.readingTime || '5 min read',
      verdict: r.verdict || '',
      whoItIsFor: r.whoItIsFor || '',
      whatWeLikedJson: JSON.stringify(r.whatWeLiked || []),
      whatWeDidNotLikeJson: JSON.stringify(r.whatWeDidNotLike || []),
      inDepthTesting: r.inDepthTesting || '',
      finalRatingText: r.finalRatingText || '4.5/5',
      status: 'PUBLISHED',
      seoTitle: r.seoTitle || r.title,
      seoDescription: r.seoDescription || r.verdict,
      createdAt: now
    }).onConflictDoNothing();
  }

  // 12. Seed Problem Collections
  console.log('[Seed] Seeding problem collections...');
  for (const pr of seedProblems) {
    await db.insert(schema.problemCollections).values({
      id: pr.id || pr.slug,
      slug: pr.slug,
      title: pr.title,
      tagline: pr.tagline || '',
      description: pr.description || '',
      image: pr.image || '',
      targetUser: pr.targetUser || '',
      productIdsJson: JSON.stringify(pr.featuredProductIds || []),
      adviceTipsJson: JSON.stringify(pr.adviceTips || []),
      status: 'PUBLISHED',
      seoTitle: pr.seoTitle || pr.title,
      seoDescription: pr.seoDescription || pr.tagline,
      createdAt: now,
      updatedAt: now
    }).onConflictDoNothing();
  }

  // 13. Seed Settings
  console.log('[Seed] Seeding settings...');
  await db.insert(schema.settings).values({
    key: 'general',
    valueJson: JSON.stringify({
      siteName: 'NIDPIK',
      tagline: 'Find • Compare • Pick Right',
      logoUrl: '',
      currencySymbol: '₹',
      minBudgetEntry: '99',
      contactEmail: 'hello@nidpik.com',
      affiliateDisclaimer: 'Some links on NIDPIK are affiliate links. When you purchase through them, we may earn a modest commission from approved merchant partners like Amazon India at no additional cost to you.'
    }),
    updatedAt: now
  }).onConflictDoNothing();

  await db.insert(schema.settings).values({
    key: 'seo',
    valueJson: JSON.stringify({
      defaultTitle: 'NIDPIK | Find, Compare & Pick Right',
      defaultDescription: 'India-focused product discovery, buying guides, comparisons, and smart budget picks starting from ₹99. Find the right product for your actual need.',
      titleSeparator: '|',
      twitterHandle: '@nidpik_in'
    }),
    updatedAt: now
  }).onConflictDoNothing();

  console.log('[Seed] Seeding completed successfully!');

  // 14. Query & Display Row Counts Across All 20 Tables
  const countsQuery = await db.execute(sql`
    SELECT 'users' as table_name, count(*) as count FROM users UNION ALL
    SELECT 'sessions', count(*) FROM sessions UNION ALL
    SELECT 'products', count(*) FROM products UNION ALL
    SELECT 'categories', count(*) FROM categories UNION ALL
    SELECT 'articles', count(*) FROM articles UNION ALL
    SELECT 'buying_guides', count(*) FROM buying_guides UNION ALL
    SELECT 'comparisons', count(*) FROM comparisons UNION ALL
    SELECT 'reviews', count(*) FROM reviews UNION ALL
    SELECT 'problem_collections', count(*) FROM problem_collections UNION ALL
    SELECT 'budget_tiers', count(*) FROM budget_tiers UNION ALL
    SELECT 'merchants', count(*) FROM merchants UNION ALL
    SELECT 'affiliate_links', count(*) FROM affiliate_links UNION ALL
    SELECT 'authors', count(*) FROM authors UNION ALL
    SELECT 'media', count(*) FROM media UNION ALL
    SELECT 'settings', count(*) FROM settings UNION ALL
    SELECT 'audit_logs', count(*) FROM audit_logs UNION ALL
    SELECT 'affiliate_clicks', count(*) FROM affiliate_clicks UNION ALL
    SELECT 'price_alerts', count(*) FROM price_alerts UNION ALL
    SELECT 'user_reviews', count(*) FROM user_reviews UNION ALL
    SELECT 'newsletter_subscribers', count(*) FROM newsletter_subscribers;
  `);

  console.log('\n================ FINAL ROW COUNTS IN CLOUD SQL POSTGRESQL ================');
  console.table(countsQuery.rows);
  console.log('=========================================================================\n');

  await pool.end();
  process.exit(0);
}

runSeed().catch((err) => {
  console.error('[Seed Error] Failed to seed Cloud SQL database:', err);
  process.exit(1);
});
