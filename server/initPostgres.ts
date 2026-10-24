import pg from 'pg';
import fs from 'fs';
import { sql } from 'drizzle-orm';
import { db, getResolvedDbConfig } from '../src/db/index';
import * as schema from '../src/db/schema';
import { hashPassword } from './crypto';

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

const { Client } = pg;

let isPostgresReady = false;
let initPromise: Promise<void> | null = null;

export interface SafeDbErrorDiagnostic {
  code: string;
  reason: string;
  hint: string;
  targetDatabase: string;
  targetUser: string;
  connectionType: 'unix_socket' | 'tcp' | 'unconfigured';
  socketPathExists?: boolean;
}

export function classifyDatabaseError(err: any): SafeDbErrorDiagnostic {
  const cfg = getResolvedDbConfig();
  const code = String(err?.cause?.code || err?.code || 'UNKNOWN_DB_ERROR');
  const rawMsg = String(err?.cause?.message || err?.message || 'Database operation failed');

  let socketPathExists: boolean | undefined;
  if (cfg.isSocket && cfg.host) {
    try {
      socketPathExists = fs.existsSync(cfg.host);
    } catch {
      socketPathExists = false;
    }
  }

  let reason = 'Database query or connection failed.';
  let hint = 'Check Cloud Run logs and verify Cloud SQL instance connection and environment variables.';

  if (code === '3D000') {
    reason = `PostgreSQL database "${cfg.database}" does not exist on the target Cloud SQL instance.`;
    hint = `Create a database named "${cfg.database}" in Google Cloud Console -> Cloud SQL -> Databases, or set SQL_DB_NAME=postgres in Cloud Run.`;
  } else if (code === '28P01' || code === '28000') {
    reason = `PostgreSQL authentication failed for database user "${cfg.user || '(unset)'}".`;
    hint = `Verify that user "${cfg.user || '(unset)'}" exists in Cloud SQL -> Users and that SQL_PASSWORD (or nidpik-sql-password secret) matches the user's password with no leading/trailing spaces or tabs.`;
  } else if (code === '42P01') {
    reason = 'Required PostgreSQL tables do not exist in the target database.';
    hint = 'Ensure the database user has CREATE privileges on schema public so automatic schema initialization can create the tables.';
  } else if (code === '42501') {
    reason = `PostgreSQL permission denied for user "${cfg.user || '(unset)'}" on schema public or tables.`;
    hint = `Grant cloudsqlsuperuser to "${cfg.user || '(unset)'}" or run: GRANT ALL ON SCHEMA public TO "${cfg.user}"; GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "${cfg.user}";`;
  } else if (code === 'ENOENT' || rawMsg.includes('.s.PGSQL.5432')) {
    reason = `Cloud SQL Unix domain socket not found at "${cfg.host || '(unset)'}".`;
    hint = 'In Cloud Run -> Edit & Deploy New Revision -> Connections, attach the Cloud SQL instance (nidpik-postgres) and verify INSTANCE_CONNECTION_NAME matches project:region:instance.';
  } else if (code === 'ECONNREFUSED' || code === 'ETIMEDOUT') {
    reason = 'Database network connection was refused or timed out.';
    hint = 'Verify Cloud SQL instance attachment in Cloud Run and ensure the Cloud Run service account has the Cloud SQL Client (roles/cloudsql.client) IAM role.';
  }

  return {
    code,
    reason,
    hint,
    targetDatabase: cfg.database,
    targetUser: cfg.user || '(unset)',
    connectionType: !cfg.host ? 'unconfigured' : cfg.isSocket ? 'unix_socket' : 'tcp',
    ...(socketPathExists !== undefined ? { socketPathExists } : {}),
  };
}

async function tryCreateMissingDatabase(): Promise<boolean> {
  const cfg = getResolvedDbConfig();
  if (!cfg.host || !cfg.user || !cfg.database || cfg.database === 'postgres') {
    return false;
  }

  const safeDbIdentifier = cfg.database.replace(/[^a-zA-Z0-9_]/g, '');
  if (!safeDbIdentifier) return false;

  const client = new Client({
    host: cfg.host,
    user: cfg.user,
    password: cfg.password,
    database: 'postgres',
    ...(cfg.port && !cfg.isSocket ? { port: cfg.port } : {}),
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    const checkRes = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [safeDbIdentifier]
    );
    if (checkRes.rowCount === 0) {
      console.log(`[NIDPIK DB] Creating missing PostgreSQL database "${safeDbIdentifier}"...`);
      await client.query(`CREATE DATABASE "${safeDbIdentifier}"`);
      console.log(`[NIDPIK DB] Database "${safeDbIdentifier}" created successfully.`);
    }
    return true;
  } catch (createErr: any) {
    console.warn(
      `[NIDPIK DB] Could not auto-create database "${safeDbIdentifier}":`,
      createErr?.code || createErr?.message
    );
    return false;
  } finally {
    try {
      await client.end();
    } catch {}
  }
}

async function createAllPostgresTables(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      name TEXT NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'EDITOR',
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      last_login TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      category TEXT NOT NULL,
      category_slug TEXT NOT NULL,
      subcategory TEXT NOT NULL,
      price DOUBLE PRECISION NOT NULL,
      old_price DOUBLE PRECISION,
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
      status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED',
      rating_display TEXT,
      in_stock INTEGER NOT NULL DEFAULT 1,
      budget_tier DOUBLE PRECISION NOT NULL,
      problem_tags_json TEXT DEFAULT '[]',
      seo_title TEXT,
      seo_description TEXT,
      canonical_url TEXT,
      og_image TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

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
      status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

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
      status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED',
      seo_title TEXT,
      seo_description TEXT,
      canonical_url TEXT,
      og_image TEXT,
      created_at TEXT NOT NULL
    );

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
      status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED',
      seo_title TEXT,
      seo_description TEXT,
      canonical_url TEXT,
      og_image TEXT,
      created_at TEXT NOT NULL
    );

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
      status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED',
      seo_title TEXT,
      seo_description TEXT,
      canonical_url TEXT,
      og_image TEXT,
      created_at TEXT NOT NULL
    );

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
      status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED',
      seo_title TEXT,
      seo_description TEXT,
      canonical_url TEXT,
      og_image TEXT,
      created_at TEXT NOT NULL
    );

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
      status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED',
      seo_title TEXT,
      seo_description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS budget_tiers (
      amount DOUBLE PRECISION PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      headline TEXT NOT NULL,
      description TEXT NOT NULL,
      recommended_category TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS merchants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      logo_text TEXT NOT NULL,
      logo_image TEXT,
      badge_color TEXT NOT NULL,
      affiliate_base_url TEXT NOT NULL,
      affiliate_network TEXT DEFAULT 'Direct Affiliate',
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS affiliate_links (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      merchant_id TEXT NOT NULL,
      affiliate_url TEXT NOT NULL,
      destination_url TEXT,
      tracking_info TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      last_checked_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS authors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      avatar TEXT NOT NULL,
      bio TEXT NOT NULL,
      social_links_json TEXT DEFAULT '{}',
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

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

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

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

    CREATE TABLE IF NOT EXISTS affiliate_clicks (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      merchant_id TEXT NOT NULL,
      source_page TEXT NOT NULL,
      cta_type TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS price_alerts (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      email TEXT NOT NULL,
      target_price DOUBLE PRECISION NOT NULL,
      current_price DOUBLE PRECISION NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_reviews (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      author_name TEXT NOT NULL,
      author_email TEXT NOT NULL,
      rating INTEGER NOT NULL,
      headline TEXT NOT NULL,
      comment TEXT NOT NULL,
      is_verified INTEGER NOT NULL DEFAULT 1,
      status VARCHAR(20) NOT NULL DEFAULT 'APPROVED',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      source TEXT DEFAULT 'website',
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL
    );
  `);
}

async function seedPostgresCatalogIfEmpty(): Promise<void> {
  const existingProducts = await db.select({ id: schema.products.id }).from(schema.products).limit(1);
  if (existingProducts.length > 0) {
    return;
  }

  console.log('[NIDPIK DB] PostgreSQL catalog is empty. Seeding initial dataset...');
  const now = new Date().toISOString();

  // 1. Seed Owner Admin User if ADMIN_OWNER_PASSWORD is provided
  const ownerEmail = (process.env.ADMIN_OWNER_EMAIL || 'admin@nidpik.com').trim().toLowerCase();
  const ownerPassword = process.env.ADMIN_OWNER_PASSWORD?.trim();
  if (ownerPassword) {
    const { hash, salt } = hashPassword(ownerPassword);
    await db.insert(schema.users).values({
      id: 'user_owner',
      email: ownerEmail,
      passwordHash: hash,
      salt,
      name: 'NIDPIK Site Administrator',
      role: 'OWNER',
      status: 'active',
      createdAt: now,
    }).onConflictDoNothing();
  }

  // 2. Seed Merchants
  for (const m of seedMerchants) {
    await db.insert(schema.merchants).values({
      id: m.id,
      name: m.name,
      logoText: m.logoText,
      badgeColor: m.badgeColor,
      affiliateBaseUrl: m.affiliateBaseUrl,
      affiliateNetwork: `${m.name} Affiliate`,
      status: 'active',
      notes: 'Initial seed merchant',
      createdAt: now,
      updatedAt: now,
    }).onConflictDoNothing();
  }

  // 3. Seed Authors
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
      updatedAt: now,
    }).onConflictDoNothing();
  }

  // 4. Seed Budget Tiers
  for (const b of seedBudgets) {
    await db.insert(schema.budgetTiers).values({
      amount: b.amount,
      title: b.title,
      slug: b.slug,
      headline: b.headline,
      description: b.description,
      recommendedCategory: b.recommendedCategory,
      createdAt: now,
      updatedAt: now,
    }).onConflictDoNothing();
  }

  // 5. Seed Categories
  let cIdx = 0;
  for (const c of seedCategories) {
    await db.insert(schema.categories).values({
      id: c.id || c.slug,
      slug: c.slug,
      name: c.name,
      description: c.description || '',
      iconName: c.iconName || 'Package',
      image: null,
      subcategoriesJson: JSON.stringify(c.subcategories || []),
      featuredProductIdsJson: JSON.stringify(c.featuredProductIds || []),
      faqsJson: JSON.stringify(c.faqs || []),
      isFeatured: cIdx < 6 ? 1 : 0,
      orderIndex: cIdx++,
      seoTitle: `${c.name} | NIDPIK Buying Guides & Recommendations`,
      seoDescription: c.description || '',
      status: 'PUBLISHED',
      createdAt: now,
      updatedAt: now,
    }).onConflictDoNothing();
  }

  // 6. Seed Products & Affiliate Links
  for (const p of seedProducts) {
    const affUrl = p.affiliateUrl || (p.affiliateUrls ? p.affiliateUrls.IN || '' : '');
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
      galleryJson: JSON.stringify([p.image]),
      shortDescription: p.shortDescription || '',
      quickVerdict: p.quickVerdict || '',
      bestFor: p.bestFor || '',
      notIdealFor: p.notIdealFor || null,
      featuresJson: JSON.stringify(p.features || []),
      specificationsJson: JSON.stringify(p.specifications || {}),
      prosJson: JSON.stringify(p.pros || []),
      consJson: JSON.stringify(p.cons || []),
      merchantJson: JSON.stringify(p.merchant || { id: 'amazon', name: 'Amazon India' }),
      affiliateUrl: affUrl,
      affiliateNetwork: 'Amazon Associates',
      lastUpdated: p.lastUpdated || now,
      status: (!p.status || p.status === 'active') ? 'PUBLISHED' : p.status,
      ratingDisplay: p.ratingDisplay || '4.5/5',
      inStock: p.inStock ? 1 : 0,
      budgetTier: p.budgetTier ?? 99,
      problemTagsJson: JSON.stringify(p.problemTags || []),
      seoTitle: `${p.name} - Price, Review & Alternatives | NIDPIK`,
      seoDescription: p.shortDescription || '',
      canonicalUrl: `https://nidpik.in/product/${p.slug}`,
      ogImage: p.image || '',
      createdAt: now,
      updatedAt: now,
    }).onConflictDoNothing();

    if (affUrl) {
      await db.insert(schema.affiliateLinks).values({
        id: `link_${p.id}_amazon`,
        productId: p.id,
        merchantId: p.merchant?.id || 'amazon',
        affiliateUrl: affUrl,
        destinationUrl: affUrl,
        trackingInfo: 'Initial Seed Link',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      }).onConflictDoNothing();
    }
  }

  // 7. Seed Articles
  for (const a of seedArticles) {
    await db.insert(schema.articles).values({
      id: a.id || a.slug,
      slug: a.slug,
      title: a.title,
      category: a.category || 'Guides',
      categorySlug: a.categorySlug || 'guides',
      excerpt: a.excerpt || '',
      authorId: a.authorId || 'rahul-sharma',
      publishedAt: a.publishedAt || now,
      updatedAt: a.updatedAt || now,
      readingTime: a.readingTime || '5 min read',
      image: a.image || '',
      contentJson: JSON.stringify(a.content || []),
      tagsJson: JSON.stringify(a.tags || []),
      recommendedProductIdsJson: JSON.stringify(a.recommendedProductIds || []),
      status: 'PUBLISHED',
      seoTitle: `${a.title} | NIDPIK`,
      seoDescription: a.excerpt || '',
      canonicalUrl: `https://nidpik.in/articles/${a.slug}`,
      ogImage: a.image || '',
      createdAt: now,
    }).onConflictDoNothing();
  }

  // 8. Seed Buying Guides
  for (const g of seedGuides) {
    await db.insert(schema.buyingGuides).values({
      id: g.id || g.slug,
      slug: g.slug,
      title: g.title,
      category: g.category || 'Guides',
      categorySlug: g.categorySlug || 'guides',
      subtitle: g.subtitle || '',
      quickAnswer: g.quickAnswer || '',
      authorId: g.authorId || 'rahul-sharma',
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
      seoTitle: `${g.title} | NIDPIK Buying Guide`,
      seoDescription: g.subtitle || '',
      createdAt: now,
    }).onConflictDoNothing();
  }

  // 9. Seed Comparisons
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
      authorId: comp.authorId || 'rahul-sharma',
      updatedAt: comp.updatedAt || now,
      status: 'PUBLISHED',
      seoTitle: `${comp.title} | NIDPIK Comparison`,
      seoDescription: comp.subtitle || '',
      createdAt: now,
    }).onConflictDoNothing();
  }

  // 10. Seed Reviews
  for (const r of seedReviews) {
    await db.insert(schema.reviews).values({
      id: r.id || r.slug,
      slug: r.slug,
      title: r.title,
      productId: r.productId || '',
      authorId: r.authorId || 'rahul-sharma',
      updatedAt: r.updatedAt || now,
      readingTime: r.readingTime || '5 min read',
      verdict: r.verdict || '',
      whoItIsFor: r.whoItIsFor || '',
      whatWeLikedJson: JSON.stringify(r.whatWeLiked || []),
      whatWeDidNotLikeJson: JSON.stringify(r.whatWeDidNotLike || []),
      inDepthTesting: r.inDepthTesting || '',
      finalRatingText: r.finalRatingText || '4.5/5',
      status: 'PUBLISHED',
      seoTitle: `${r.title} | NIDPIK Review`,
      seoDescription: r.verdict || '',
      createdAt: now,
    }).onConflictDoNothing();
  }

  // 11. Seed Problem Collections
  for (const pr of seedProblems) {
    await db.insert(schema.problemCollections).values({
      id: pr.id || pr.slug,
      slug: pr.slug,
      title: pr.title,
      tagline: pr.tagline || '',
      description: pr.description || '',
      image: pr.image || '',
      targetUser: pr.targetUser || '',
      productIdsJson: JSON.stringify(pr.productIds || []),
      adviceTipsJson: JSON.stringify(pr.adviceTips || []),
      status: 'PUBLISHED',
      seoTitle: `${pr.title} | NIDPIK Problem Solver`,
      seoDescription: pr.tagline || '',
      createdAt: now,
      updatedAt: now,
    }).onConflictDoNothing();
  }

  // 12. Seed Settings
  await db.insert(schema.settings).values({
    key: 'general',
    valueJson: JSON.stringify({
      siteName: 'NIDPIK',
      tagline: 'Find • Compare • Pick Right',
      logoUrl: '',
      currencySymbol: '₹',
      minBudgetEntry: '99',
      contactEmail: 'hello@nidpik.com',
      affiliateDisclaimer:
        'Some links on NIDPIK are affiliate links. When you purchase through them, we may earn a modest commission from approved merchant partners like Amazon India at no additional cost to you.',
    }),
    updatedAt: now,
  }).onConflictDoNothing();

  await db.insert(schema.settings).values({
    key: 'seo',
    valueJson: JSON.stringify({
      defaultTitle: 'NIDPIK | Find, Compare & Pick Right',
      defaultDescription:
        'India-focused product discovery, buying guides, comparisons, and smart budget picks starting from ₹99. Find the right product for your actual need.',
      titleSeparator: '|',
      twitterHandle: '@nidpik_in',
    }),
    updatedAt: now,
  }).onConflictDoNothing();

  console.log('[NIDPIK DB] Initial PostgreSQL catalog seeding complete.');
}

export async function ensurePostgresInitialized(): Promise<void> {
  if (isPostgresReady) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // Fast check: verify if products table already exists and has rows
      try {
        const existing = await db.select({ id: schema.products.id }).from(schema.products).limit(1);
        if (existing.length > 0) {
          await db.execute(sql`UPDATE products SET status = 'PUBLISHED' WHERE status = 'active';`);
          isPostgresReady = true;
          return;
        }
      } catch (probeErr: any) {
        const pgCode = String(probeErr?.cause?.code || probeErr?.code || '');
        if (pgCode === '3D000') {
          await tryCreateMissingDatabase();
        } else if (pgCode !== '42P01') {
          throw probeErr;
        }
      }

      // Ensure all 20 schema tables exist and seed initial catalog if empty
      await createAllPostgresTables();
      await seedPostgresCatalogIfEmpty();
      await db.execute(sql`UPDATE products SET status = 'PUBLISHED' WHERE status = 'active';`);
      isPostgresReady = true;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}
