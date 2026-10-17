import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Static seed data imports
import { products as seedProducts } from '../src/data/products';
import { categories as seedCategories } from '../src/data/categories';
import { buyingGuides as seedGuides } from '../src/data/buyingGuides';
import { comparisons as seedComparisons } from '../src/data/comparisons';
import { reviews as seedReviews } from '../src/data/reviews';
import { articles as seedArticles } from '../src/data/articles';
import { problemCollections as seedProblems } from '../src/data/problemCollections';
import { budgetTiers as seedBudgets } from '../src/data/budgetTiers';
import { merchants as seedMerchants } from '../src/data/merchants';
import { authors as seedAuthors } from '../src/data/authors';

const dbPath = path.resolve(process.cwd(), 'nidpik.sqlite');
export const db = new DatabaseSync(dbPath);

// Enable WAL mode for high performance concurrent reads
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    -- USERS
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('OWNER', 'ADMIN', 'EDITOR')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'disabled')),
      created_at TEXT NOT NULL,
      last_login TEXT
    );

    -- SESSIONS
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    -- PRODUCTS
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      category TEXT NOT NULL,
      category_slug TEXT NOT NULL,
      subcategory TEXT NOT NULL,
      price REAL NOT NULL,
      old_price REAL,
      currency TEXT NOT NULL DEFAULT '₹',
      badge TEXT,
      image TEXT NOT NULL,
      gallery_json TEXT DEFAULT '[]',
      short_description TEXT NOT NULL,
      quick_verdict TEXT NOT NULL,
      best_for TEXT NOT NULL,
      not_ideal_for TEXT,
      features_json TEXT NOT NULL DEFAULT '[]',
      specifications_json TEXT NOT NULL DEFAULT '{}',
      pros_json TEXT NOT NULL DEFAULT '[]',
      cons_json TEXT NOT NULL DEFAULT '[]',
      merchant_json TEXT NOT NULL,
      affiliate_url TEXT NOT NULL,
      affiliate_network TEXT DEFAULT 'Amazon Associates',
      last_updated TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK(status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
      rating_display TEXT,
      in_stock INTEGER NOT NULL DEFAULT 1,
      budget_tier REAL NOT NULL,
      problem_tags_json TEXT DEFAULT '[]',
      seo_title TEXT,
      seo_description TEXT,
      canonical_url TEXT,
      og_image TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- CATEGORIES
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      icon_name TEXT NOT NULL,
      image TEXT,
      subcategories_json TEXT NOT NULL DEFAULT '[]',
      featured_product_ids_json TEXT NOT NULL DEFAULT '[]',
      faqs_json TEXT NOT NULL DEFAULT '[]',
      is_featured INTEGER NOT NULL DEFAULT 0,
      order_index INTEGER NOT NULL DEFAULT 0,
      seo_title TEXT,
      seo_description TEXT,
      status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK(status IN ('PUBLISHED', 'ARCHIVED')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- ARTICLES
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      category_slug TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      author_id TEXT NOT NULL,
      published_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      reading_time TEXT NOT NULL,
      image TEXT NOT NULL,
      content_json TEXT NOT NULL DEFAULT '[]',
      tags_json TEXT NOT NULL DEFAULT '[]',
      recommended_product_ids_json TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK(status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
      seo_title TEXT,
      seo_description TEXT,
      canonical_url TEXT,
      og_image TEXT,
      created_at TEXT NOT NULL
    );

    -- BUYING GUIDES
    CREATE TABLE IF NOT EXISTS buying_guides (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      category_slug TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      quick_answer TEXT NOT NULL,
      author_id TEXT NOT NULL,
      published_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      reading_time TEXT NOT NULL,
      featured_product_ids_json TEXT NOT NULL DEFAULT '[]',
      budget_range TEXT NOT NULL,
      what_to_look_for_json TEXT NOT NULL DEFAULT '[]',
      who_should_buy TEXT NOT NULL,
      who_should_skip TEXT NOT NULL,
      faqs_json TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK(status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
      seo_title TEXT,
      seo_description TEXT,
      canonical_url TEXT,
      og_image TEXT,
      created_at TEXT NOT NULL
    );

    -- COMPARISONS
    CREATE TABLE IF NOT EXISTS comparisons (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      category TEXT NOT NULL,
      category_slug TEXT NOT NULL,
      product_ids_json TEXT NOT NULL DEFAULT '[]',
      winner_product_id TEXT,
      verdict_summary TEXT NOT NULL,
      comparison_points_json TEXT NOT NULL DEFAULT '[]',
      author_id TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK(status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
      seo_title TEXT,
      seo_description TEXT,
      canonical_url TEXT,
      og_image TEXT,
      created_at TEXT NOT NULL
    );

    -- REVIEWS
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      product_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      reading_time TEXT NOT NULL,
      verdict TEXT NOT NULL,
      who_it_is_for TEXT NOT NULL,
      what_we_liked_json TEXT NOT NULL DEFAULT '[]',
      what_we_did_not_like_json TEXT NOT NULL DEFAULT '[]',
      in_depth_testing TEXT NOT NULL,
      final_rating_text TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK(status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
      seo_title TEXT,
      seo_description TEXT,
      canonical_url TEXT,
      og_image TEXT,
      created_at TEXT NOT NULL
    );

    -- PROBLEM COLLECTIONS
    CREATE TABLE IF NOT EXISTS problem_collections (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      tagline TEXT NOT NULL,
      description TEXT NOT NULL,
      image TEXT NOT NULL,
      target_user TEXT NOT NULL,
      product_ids_json TEXT NOT NULL DEFAULT '[]',
      advice_tips_json TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK(status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
      seo_title TEXT,
      seo_description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- BUDGET TIERS
    CREATE TABLE IF NOT EXISTS budget_tiers (
      amount REAL PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      headline TEXT NOT NULL,
      description TEXT NOT NULL,
      recommended_category TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- MERCHANTS
    CREATE TABLE IF NOT EXISTS merchants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      logo_text TEXT NOT NULL,
      logo_image TEXT,
      badge_color TEXT NOT NULL,
      affiliate_base_url TEXT NOT NULL,
      affiliate_network TEXT DEFAULT 'Direct Affiliate',
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'archived')),
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- AFFILIATE LINKS
    CREATE TABLE IF NOT EXISTS affiliate_links (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      merchant_id TEXT NOT NULL,
      affiliate_url TEXT NOT NULL,
      destination_url TEXT,
      tracking_info TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'archived')),
      last_checked_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- AUTHORS
    CREATE TABLE IF NOT EXISTS authors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      avatar TEXT NOT NULL,
      bio TEXT NOT NULL,
      social_links_json TEXT DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'archived')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- MEDIA
    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      url TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      width INTEGER,
      height INTEGER,
      alt_text TEXT,
      title TEXT,
      created_at TEXT NOT NULL
    );

    -- SETTINGS
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- AUDIT LOGS
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_email TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      details_json TEXT DEFAULT '{}',
      created_at TEXT NOT NULL
    );

    -- AFFILIATE CLICKS
    CREATE TABLE IF NOT EXISTS affiliate_clicks (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      merchant_id TEXT NOT NULL,
      source_page TEXT NOT NULL,
      cta_type TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    -- PRICE ALERTS
    CREATE TABLE IF NOT EXISTS price_alerts (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      email TEXT NOT NULL,
      target_price REAL NOT NULL,
      current_price REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'triggered', 'unsubscribed')),
      created_at TEXT NOT NULL
    );

    -- USER REVIEWS
    CREATE TABLE IF NOT EXISTS user_reviews (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_email TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      headline TEXT NOT NULL,
      comment TEXT NOT NULL,
      is_verified INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'APPROVED' CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED')),
      created_at TEXT NOT NULL
    );

    -- NEWSLETTER SUBSCRIBERS
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      source TEXT DEFAULT 'website',
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'unsubscribed')),
      created_at TEXT NOT NULL
    );

    -- INDEXES for search and fast queries
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_slug);
    CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
    CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
    CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
    CREATE INDEX IF NOT EXISTS idx_guides_status ON buying_guides(status);
    CREATE INDEX IF NOT EXISTS idx_comparisons_status ON comparisons(status);
    CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
    CREATE INDEX IF NOT EXISTS idx_clicks_product ON affiliate_clicks(product_id);
    CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_price_alerts_prod ON price_alerts(product_id);
    CREATE INDEX IF NOT EXISTS idx_user_reviews_prod ON user_reviews(product_id);
    CREATE INDEX IF NOT EXISTS idx_subscribers_email ON newsletter_subscribers(email);
  `);

  seedDatabaseIfEmpty();
}

// Password hashing helper using standard scrypt
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, generatedSalt, 64).toString('hex');
  return { hash, salt: generatedSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const checkHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(checkHash, 'hex'));
}

function seedDatabaseIfEmpty() {
  const countRow = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  if (countRow.count > 0) {
    return; // Already populated
  }

  console.log('[NIDPIK DB] Database is empty. Seeding initial data from static datasets...');

  const now = new Date().toISOString();

  // 1. Seed Users (Default Admin accounts)
  const usersToSeed = [
    {
      id: 'user_owner',
      email: 'admin@nidpik.in',
      name: 'NIDPIK Owner',
      role: 'OWNER',
      passwords: ['Nidpik@Secure#2026']
    },
    {
      id: 'user_editor',
      email: 'editor@nidpik.in',
      name: 'Senior Content Editor',
      role: 'EDITOR',
      passwords: ['Nidpik@Editor#2026']
    },
    {
      id: 'user_admin',
      email: 'manager@nidpik.in',
      name: 'Platform Manager',
      role: 'ADMIN',
      passwords: ['Nidpik@Manager#2026']
    }
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, salt, name, role, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'active', ?)
  `);

  for (const u of usersToSeed) {
    // Hash primary password
    const { hash, salt } = hashPassword(u.passwords[0]);
    insertUser.run(u.id, u.email, hash, salt, u.name, u.role, now);
  }

  // 2. Seed Merchants
  const insertMerchant = db.prepare(`
    INSERT OR REPLACE INTO merchants (id, name, logo_text, logo_image, badge_color, affiliate_base_url, affiliate_network, status, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)
  `);
  for (const m of seedMerchants) {
    insertMerchant.run(
      m.id,
      m.name,
      m.logoText,
      null,
      m.badgeColor,
      m.affiliateBaseUrl,
      m.name + ' Affiliate',
      'Initial seed merchant',
      now,
      now
    );
  }

  // 3. Seed Authors
  const insertAuthor = db.prepare(`
    INSERT OR REPLACE INTO authors (id, name, role, avatar, bio, social_links_json, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, '{}', 'active', ?, ?)
  `);
  for (const a of seedAuthors) {
    insertAuthor.run(a.id, a.name, a.role, a.avatar, a.bio, now, now);
  }

  // 4. Seed Categories
  const insertCategory = db.prepare(`
    INSERT OR REPLACE INTO categories (
      id, slug, name, description, icon_name, image, subcategories_json,
      featured_product_ids_json, faqs_json, is_featured, order_index,
      seo_title, seo_description, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', ?, ?)
  `);
  seedCategories.forEach((cat, index) => {
    insertCategory.run(
      cat.id,
      cat.slug,
      cat.name,
      cat.description,
      cat.iconName,
      null,
      JSON.stringify(cat.subcategories || []),
      JSON.stringify(cat.featuredProductIds || []),
      JSON.stringify(cat.faqs || []),
      index < 6 ? 1 : 0,
      index,
      `${cat.name} | NIDPIK Buying Guides & Recommendations`,
      cat.description,
      now,
      now
    );
  });

  // 5. Seed Products
  const insertProduct = db.prepare(`
    INSERT OR REPLACE INTO products (
      id, slug, name, brand, category, category_slug, subcategory, price, old_price,
      currency, badge, image, gallery_json, short_description, quick_verdict,
      best_for, not_ideal_for, features_json, specifications_json, pros_json,
      cons_json, merchant_json, affiliate_url, affiliate_network, last_updated,
      status, rating_display, in_stock, budget_tier, problem_tags_json,
      seo_title, seo_description, canonical_url, og_image, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      'PUBLISHED', ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?
    )
  `);

  for (const p of seedProducts) {
    insertProduct.run(
      p.id,
      p.slug,
      p.name,
      p.brand,
      p.category,
      p.categorySlug,
      p.subcategory,
      p.price,
      p.oldPrice || null,
      p.currency || '₹',
      p.badge || null,
      p.image,
      JSON.stringify([p.image]),
      p.shortDescription,
      p.quickVerdict,
      p.bestFor,
      p.notIdealFor || null,
      JSON.stringify(p.features || []),
      JSON.stringify(p.specifications || {}),
      JSON.stringify(p.pros || []),
      JSON.stringify(p.cons || []),
      JSON.stringify(p.merchant),
      p.affiliateUrl || p.affiliateUrls?.IN || (p.affiliateUrls ? Object.values(p.affiliateUrls)[0] : '') || '',
      'Amazon Associates',
      p.lastUpdated,
      p.ratingDisplay || 'Editor Tested: 4.8/5 Value',
      p.inStock ? 1 : 0,
      p.budgetTier,
      JSON.stringify(p.problemTags || []),
      `${p.name} - Price, Review & Alternatives | NIDPIK`,
      p.shortDescription,
      `https://nidpik.in/product/${p.slug}`,
      p.image,
      now,
      now
    );
  }

  // 6. Seed Articles
  const insertArticle = db.prepare(`
    INSERT OR REPLACE INTO articles (
      id, slug, title, category, category_slug, excerpt, author_id, published_at,
      updated_at, reading_time, image, content_json, tags_json,
      recommended_product_ids_json, status, seo_title, seo_description,
      canonical_url, og_image, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', ?, ?, ?, ?, ?)
  `);
  for (const a of seedArticles) {
    insertArticle.run(
      a.id,
      a.slug,
      a.title,
      a.category,
      a.categorySlug,
      a.excerpt,
      a.authorId,
      a.publishedAt,
      a.updatedAt,
      a.readingTime,
      a.image,
      JSON.stringify(a.content || []),
      JSON.stringify(a.tags || []),
      JSON.stringify(a.recommendedProductIds || []),
      `${a.title} | NIDPIK`,
      a.excerpt,
      `https://nidpik.in/articles/${a.slug}`,
      a.image,
      now
    );
  }

  // 7. Seed Buying Guides
  const insertGuide = db.prepare(`
    INSERT OR REPLACE INTO buying_guides (
      id, slug, title, category, category_slug, subtitle, quick_answer,
      author_id, published_at, updated_at, reading_time, featured_product_ids_json,
      budget_range, what_to_look_for_json, who_should_buy, who_should_skip,
      faqs_json, status, seo_title, seo_description, canonical_url, og_image, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', ?, ?, ?, ?, ?)
  `);
  for (const g of seedGuides) {
    insertGuide.run(
      g.id,
      g.slug,
      g.title,
      g.category,
      g.categorySlug,
      g.subtitle,
      g.quickAnswer,
      g.authorId,
      g.publishedAt,
      g.updatedAt,
      g.readingTime,
      JSON.stringify(g.featuredProductIds || []),
      g.budgetRange,
      JSON.stringify(g.whatToLookFor || []),
      g.whoShouldBuy,
      g.whoShouldSkip,
      JSON.stringify(g.faqs || []),
      `${g.title} | NIDPIK Buying Guide`,
      g.subtitle,
      `https://nidpik.in/buying-guides/${g.slug}`,
      null,
      now
    );
  }

  // 8. Seed Comparisons
  const insertComparison = db.prepare(`
    INSERT OR REPLACE INTO comparisons (
      id, slug, title, subtitle, category, category_slug, product_ids_json,
      winner_product_id, verdict_summary, comparison_points_json, author_id,
      updated_at, status, seo_title, seo_description, canonical_url, og_image, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', ?, ?, ?, ?, ?)
  `);
  for (const c of seedComparisons) {
    insertComparison.run(
      c.id,
      c.slug,
      c.title,
      c.subtitle,
      c.category,
      c.categorySlug,
      JSON.stringify(c.productIds || []),
      c.winnerProductId || null,
      c.verdictSummary,
      JSON.stringify(c.comparisonPoints || []),
      c.authorId,
      c.updatedAt,
      `${c.title} | NIDPIK Comparison`,
      c.subtitle,
      `https://nidpik.in/compare/${c.slug}`,
      null,
      now
    );
  }

  // 9. Seed Reviews
  const insertReview = db.prepare(`
    INSERT OR REPLACE INTO reviews (
      id, slug, title, product_id, author_id, updated_at, reading_time,
      verdict, who_it_is_for, what_we_liked_json, what_we_did_not_like_json,
      in_depth_testing, final_rating_text, status, seo_title, seo_description,
      canonical_url, og_image, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', ?, ?, ?, ?, ?)
  `);
  for (const r of seedReviews) {
    insertReview.run(
      r.id,
      r.slug,
      r.title,
      r.productId,
      r.authorId,
      r.updatedAt,
      r.readingTime,
      r.verdict,
      r.whoItIsFor,
      JSON.stringify(r.whatWeLiked || []),
      JSON.stringify(r.whatWeDidNotLike || []),
      r.inDepthTesting,
      r.finalRatingText,
      `${r.title} | NIDPIK Review`,
      r.verdict,
      `https://nidpik.in/reviews/${r.slug}`,
      null,
      now
    );
  }

  // 10. Seed Problem Collections
  const insertProblem = db.prepare(`
    INSERT OR REPLACE INTO problem_collections (
      id, slug, title, tagline, description, image, target_user,
      product_ids_json, advice_tips_json, status, seo_title, seo_description,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', ?, ?, ?, ?)
  `);
  for (const prob of seedProblems) {
    insertProblem.run(
      prob.id,
      prob.slug,
      prob.title,
      prob.tagline,
      prob.description,
      prob.image,
      prob.targetUser,
      JSON.stringify(prob.productIds || []),
      JSON.stringify(prob.adviceTips || []),
      `${prob.title} | NIDPIK Problem Solver`,
      prob.tagline,
      now,
      now
    );
  }

  // 11. Seed Budget Tiers
  const insertBudget = db.prepare(`
    INSERT OR REPLACE INTO budget_tiers (
      amount, title, slug, headline, description, recommended_category, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const b of seedBudgets) {
    insertBudget.run(b.amount, b.title, b.slug, b.headline, b.description, b.recommendedCategory, now, now);
  }

  // 12. Seed Site Settings
  const insertSetting = db.prepare(`
    INSERT OR REPLACE INTO settings (key, value_json, updated_at) VALUES (?, ?, ?)
  `);
  insertSetting.run('general', JSON.stringify({
    siteName: 'NIDPIK',
    tagline: 'Find • Compare • Pick Right',
    brandBlue: '#2563EB',
    secondaryBlue: '#3B82F6',
    deepNavy: '#0F172A',
    contactEmail: 'editorial@nidpik.in',
    affiliateDisclosureText: 'Some links on NIDPIK are affiliate links. If you purchase through these merchant links, we may earn an affiliate commission at zero additional cost to you. NIDPIK does not sell products directly. Product prices and availability are subject to merchant updates.',
    editorialPolicyText: 'We maintain strict editorial independence. No manufacturer or merchant can pay for higher review scores or top-spot placement in our buying guides.',
    defaultCurrency: '₹',
    minBudget: 99
  }), now);

  insertSetting.run('seo', JSON.stringify({
    defaultTitle: 'NIDPIK | Find, Compare & Pick the Right Products',
    defaultDescription: 'Discover useful products, honest buying guides, simple comparisons, and value-for-money recommendations for Indian shoppers. Budget picks from ₹99.',
    ogImage: '/src/assets/images/nidpik_hero_showcase_1790936631391.jpg',
    twitterHandle: '@nidpik_in'
  }), now);

  // 13. Initial Audit Log
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (id, user_id, user_email, action, entity_type, entity_id, details_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertAudit.run(
    'audit_init',
    'system',
    'system@nidpik.in',
    'DATABASE_SEEDED',
    'system',
    'database',
    JSON.stringify({ message: 'Initial migration of static data completed successfully' }),
    now
  );

  console.log('[NIDPIK DB] Database seeding completed successfully!');
}
