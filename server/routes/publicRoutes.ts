import { Router, Request, Response } from 'express';
import { db } from '../../src/db';
import * as schema from '../../src/db/schema';
import { eq, and, or, ilike, lte, asc, desc } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { formatProductRow } from './productRoutes';
import { formatCategoryRow } from './categoryRoutes';
import {
  formatArticleRow,
  formatGuideRow,
  formatComparisonRow,
  formatReviewRow,
  formatProblemRow
} from './contentRoutes';
import { formatMerchantRow } from './merchantRoutes';
import { ensurePostgresInitialized, classifyDatabaseError } from '../initPostgres';

const publicLogoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.resolve(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const unique = `nidpik_official_logo_${Date.now()}${ext}`;
    cb(null, unique);
  }
});

const uploadPublicLogo = multer({
  storage: publicLogoStorage,
  limits: { fileSize: 25 * 1024 * 1024 }
});

export const publicRouter = Router();

// GET /api/public/bootstrap
// Returns full live published catalog for instant frontend synchronization
publicRouter.get('/bootstrap', async (req: Request, res: Response) => {
  try {
    await ensurePostgresInitialized();

    const rawProducts = await db.select().from(schema.products).where(eq(schema.products.status, 'PUBLISHED')).orderBy(desc(schema.products.updatedAt));
    const products = rawProducts.map(formatProductRow);

    const rawCategories = await db.select().from(schema.categories).where(eq(schema.categories.status, 'PUBLISHED')).orderBy(asc(schema.categories.orderIndex));
    const categories = rawCategories.map(formatCategoryRow);

    const rawArticles = await db.select().from(schema.articles).where(eq(schema.articles.status, 'PUBLISHED')).orderBy(desc(schema.articles.createdAt));
    const articles = rawArticles.map(formatArticleRow);

    const rawGuides = await db.select().from(schema.buyingGuides).where(eq(schema.buyingGuides.status, 'PUBLISHED')).orderBy(desc(schema.buyingGuides.createdAt));
    const guides = rawGuides.map(formatGuideRow);

    const rawComparisons = await db.select().from(schema.comparisons).where(eq(schema.comparisons.status, 'PUBLISHED')).orderBy(desc(schema.comparisons.createdAt));
    const comparisons = rawComparisons.map(formatComparisonRow);

    const rawReviews = await db.select().from(schema.reviews).where(eq(schema.reviews.status, 'PUBLISHED')).orderBy(desc(schema.reviews.createdAt));
    const reviews = rawReviews.map(formatReviewRow);

    const rawProblems = await db.select().from(schema.problemCollections).where(eq(schema.problemCollections.status, 'PUBLISHED')).orderBy(asc(schema.problemCollections.createdAt));
    const problems = rawProblems.map(formatProblemRow);

    const rawBudgets = await db.select().from(schema.budgetTiers).orderBy(asc(schema.budgetTiers.amount));
    const budgets = rawBudgets.map((r: any) => ({
      amount: Number(r.amount),
      title: r.title,
      slug: r.slug,
      headline: r.headline,
      description: r.description,
      recommendedCategory: r.recommendedCategory ?? r.recommended_category
    }));

    const rawMerchants = await db.select().from(schema.merchants).where(eq(schema.merchants.status, 'active')).orderBy(asc(schema.merchants.name));
    const merchants = rawMerchants.map(formatMerchantRow);

    const rawAuthors = await db.select().from(schema.authors).where(eq(schema.authors.status, 'active'));
    const authors = rawAuthors.map((r: any) => ({
      id: r.id,
      name: r.name,
      role: r.role,
      avatar: r.avatar,
      bio: r.bio
    }));

    // Settings
    const settingsRows = await db.select().from(schema.settings);
    const settingsObj: Record<string, any> = {};
    for (const s of settingsRows) {
      try {
        settingsObj[s.key] = JSON.parse(s.valueJson);
      } catch {
        settingsObj[s.key] = s.valueJson;
      }
    }

    res.json({
      products,
      categories,
      articles,
      buyingGuides: guides,
      comparisons,
      reviews,
      problemCollections: problems,
      budgetTiers: budgets,
      merchants,
      authors,
      settings: settingsObj,
      serverTime: new Date().toISOString()
    });
  } catch (err: any) {
    const diag = classifyDatabaseError(err);
    console.error('[NIDPIK BOOTSTRAP ERROR]', JSON.stringify({
      ...diag,
      errorMessage: err?.cause?.message || err?.message || String(err),
    }));
    res.status(500).json({
      error: 'Failed to load bootstrap data',
      code: diag.code,
      reason: diag.reason,
      hint: diag.hint,
    });
  }
});

// POST /api/public/update-logo
// Frictionless instant logo update for the user (supports file upload, base64, external URL, or reset)
publicRouter.post('/update-logo', uploadPublicLogo.single('file'), async (req: Request, res: Response) => {
  try {
    let logoUrl = '';
    const resetDefault = req.body?.resetDefault === 'true' || req.body?.resetDefault === true;

    if (resetDefault) {
      logoUrl = '/logo.svg';
    } else if (req.file) {
      // Direct file uploaded
      logoUrl = `/uploads/${req.file.filename}`;
      const filePath = req.file.path;
      const ext = path.extname(req.file.originalname).toLowerCase();
      try {
        if (ext === '.svg') {
          fs.copyFileSync(filePath, path.resolve(process.cwd(), 'public', 'logo.svg'));
        } else {
          fs.copyFileSync(filePath, path.resolve(process.cwd(), 'public', 'logo.png'));
        }
      } catch (err) {
        console.warn('Could not mirror file to public/logo:', err);
      }
    } else if (req.body?.dataUrl) {
      // Base64 data url
      const matches = req.body.dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mime = matches[1];
        const ext = mime.includes('svg') ? '.svg' : mime.includes('webp') ? '.webp' : mime.includes('jpeg') || mime.includes('jpg') ? '.jpg' : '.png';
        const filename = `nidpik_official_logo_${Date.now()}${ext}`;
        const uploadDir = path.resolve(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filePath = path.resolve(uploadDir, filename);
        fs.writeFileSync(filePath, Buffer.from(matches[2], 'base64'));
        logoUrl = `/uploads/${filename}`;

        try {
          if (ext === '.svg') {
            fs.writeFileSync(path.resolve(process.cwd(), 'public', 'logo.svg'), Buffer.from(matches[2], 'base64'));
          } else {
            fs.writeFileSync(path.resolve(process.cwd(), 'public', 'logo.png'), Buffer.from(matches[2], 'base64'));
          }
        } catch (e) {}
      }
    } else if (req.body?.logoUrl) {
      let rawUrl = String(req.body.logoUrl).trim();
      logoUrl = rawUrl;

      // If it's a remote URL, try to cache it locally
      if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
        try {
          const fetchRes = await fetch(rawUrl);
          if (fetchRes.ok) {
            const arrayBuffer = await fetchRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const contentType = fetchRes.headers.get('content-type') || '';
            const ext = contentType.includes('svg') ? '.svg' : contentType.includes('webp') ? '.webp' : contentType.includes('jpeg') || contentType.includes('jpg') ? '.jpg' : '.png';
            const filename = `nidpik_official_logo_${Date.now()}${ext}`;
            const uploadDir = path.resolve(process.cwd(), 'public', 'uploads');
            if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true });
            }
            const filePath = path.resolve(uploadDir, filename);
            fs.writeFileSync(filePath, buffer);
            logoUrl = `/uploads/${filename}`;

            try {
              if (ext === '.svg') {
                fs.writeFileSync(path.resolve(process.cwd(), 'public', 'logo.svg'), buffer);
              } else {
                fs.writeFileSync(path.resolve(process.cwd(), 'public', 'logo.png'), buffer);
              }
            } catch (e) {}
          }
        } catch (fetchErr) {
          console.warn('Remote logo fetch note:', fetchErr);
          // Keep rawUrl as fallback
          logoUrl = rawUrl;
        }
      }
    }

    if (!logoUrl) {
      res.status(400).json({ error: 'Please provide an image file or a valid image URL' });
      return;
    }

    // Persist to database settings
    const existing = await db.select().from(schema.settings).where(eq(schema.settings.key, 'general')).limit(1);
    let generalObj: Record<string, any> = {};
    if (existing[0]?.valueJson) {
      try {
        generalObj = JSON.parse(existing[0].valueJson);
      } catch {}
    }
    generalObj.logoUrl = logoUrl;

    const now = new Date().toISOString();
    await db.insert(schema.settings)
      .values({
        key: 'general',
        valueJson: JSON.stringify(generalObj),
        updatedAt: now
      })
      .onConflictDoUpdate({
        target: schema.settings.key,
        set: {
          valueJson: JSON.stringify(generalObj),
          updatedAt: now
        }
      });

    res.json({
      success: true,
      logoUrl,
      settings: generalObj,
      message: 'Official brand logo updated successfully across the entire site.'
    });
  } catch (err: any) {
    console.error('Update logo error:', err);
    res.status(500).json({ error: err.message || 'Failed to update logo' });
  }
});

// GET /api/public/search?q=...
publicRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const rawQ = String(req.query.q || '').trim();
    if (!rawQ) {
      res.json({
        products: [],
        guides: [],
        comparisons: [],
        articles: [],
        categories: [],
        problems: []
      });
      return;
    }

    // Detect price numbers, e.g. "under 500", "under ₹2000"
    const priceMatch = rawQ.match(/under\s*₹?\s*(\d+)/i) || rawQ.match(/₹\s*(\d+)/i);
    const maxPrice = priceMatch ? parseInt(priceMatch[1], 10) : null;

    const likeQ = `%${rawQ}%`;

    const productConditions: any[] = [
      eq(schema.products.status, 'PUBLISHED'),
      or(
        ilike(schema.products.name, likeQ),
        ilike(schema.products.brand, likeQ),
        ilike(schema.products.category, likeQ),
        ilike(schema.products.subcategory, likeQ),
        ilike(schema.products.shortDescription, likeQ),
        ilike(schema.products.bestFor, likeQ)
      )
    ];

    if (maxPrice !== null) {
      productConditions.push(lte(schema.products.price, maxPrice));
    }

    const rawProducts = await db.select()
      .from(schema.products)
      .where(and(...productConditions))
      .orderBy(asc(schema.products.price))
      .limit(20);

    const matchedProducts = rawProducts.map(formatProductRow);

    const rawGuides = await db.select()
      .from(schema.buyingGuides)
      .where(and(
        eq(schema.buyingGuides.status, 'PUBLISHED'),
        or(
          ilike(schema.buyingGuides.title, likeQ),
          ilike(schema.buyingGuides.subtitle, likeQ),
          ilike(schema.buyingGuides.category, likeQ)
        )
      ))
      .limit(10);
    const matchedGuides = rawGuides.map(formatGuideRow);

    const rawComparisons = await db.select()
      .from(schema.comparisons)
      .where(and(
        eq(schema.comparisons.status, 'PUBLISHED'),
        or(
          ilike(schema.comparisons.title, likeQ),
          ilike(schema.comparisons.subtitle, likeQ),
          ilike(schema.comparisons.category, likeQ)
        )
      ))
      .limit(10);
    const matchedComparisons = rawComparisons.map(formatComparisonRow);

    const rawArticles = await db.select()
      .from(schema.articles)
      .where(and(
        eq(schema.articles.status, 'PUBLISHED'),
        or(
          ilike(schema.articles.title, likeQ),
          ilike(schema.articles.excerpt, likeQ),
          ilike(schema.articles.category, likeQ)
        )
      ))
      .limit(10);
    const matchedArticles = rawArticles.map(formatArticleRow);

    const rawCategories = await db.select()
      .from(schema.categories)
      .where(and(
        eq(schema.categories.status, 'PUBLISHED'),
        or(
          ilike(schema.categories.name, likeQ),
          ilike(schema.categories.description, likeQ)
        )
      ))
      .limit(10);
    const matchedCategories = rawCategories.map(formatCategoryRow);

    const rawProblems = await db.select()
      .from(schema.problemCollections)
      .where(and(
        eq(schema.problemCollections.status, 'PUBLISHED'),
        or(
          ilike(schema.problemCollections.title, likeQ),
          ilike(schema.problemCollections.tagline, likeQ),
          ilike(schema.problemCollections.description, likeQ)
        )
      ))
      .limit(10);
    const matchedProblems = rawProblems.map(formatProblemRow);

    res.json({
      products: matchedProducts,
      guides: matchedGuides,
      comparisons: matchedComparisons,
      articles: matchedArticles,
      categories: matchedCategories,
      problems: matchedProblems
    });
  } catch (err: any) {
    console.error('Public search error:', err);
    res.status(500).json({ error: 'Search query failed' });
  }
});

// Newsletter Subscription
publicRouter.post('/subscribe', async (req: Request, res: Response) => {
  const { email, source } = req.body;
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    res.status(400).json({ error: 'Valid email address is required.' });
    return;
  }

  const cleanEmail = email.toLowerCase().trim();
  const now = new Date().toISOString();
  const id = 'sub_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);

  try {
    await db.insert(schema.newsletterSubscribers)
      .values({
        id,
        email: cleanEmail,
        source: source || 'website',
        status: 'active',
        createdAt: now
      })
      .onConflictDoUpdate({
        target: schema.newsletterSubscribers.email,
        set: { status: 'active' }
      });

    res.json({ success: true, message: 'Thank you for subscribing to NIDPIK!' });
  } catch (error: any) {
    console.error('[NIDPIK] Error saving subscriber:', error);
    res.status(500).json({ error: 'Failed to record subscription.' });
  }
});

// Dynamic XML Sitemap
publicRouter.get('/sitemap.xml', async (req: Request, res: Response) => {
  try {
    const host = req.get('host');
    const baseUrl = process.env.APP_URL || (host ? `${req.protocol}://${host}` : 'https://nidpik.com');
    const now = new Date().toISOString().split('T')[0];

    const productsList = await db.select({ slug: schema.products.slug, updatedAt: schema.products.updatedAt }).from(schema.products).where(eq(schema.products.status, 'PUBLISHED'));
    const categoriesList = await db.select({ slug: schema.categories.slug, updatedAt: schema.categories.updatedAt }).from(schema.categories).where(eq(schema.categories.status, 'PUBLISHED'));
    const articlesList = await db.select({ slug: schema.articles.slug, updatedAt: schema.articles.updatedAt }).from(schema.articles).where(eq(schema.articles.status, 'PUBLISHED'));
    const guidesList = await db.select({ slug: schema.buyingGuides.slug, updatedAt: schema.buyingGuides.updatedAt }).from(schema.buyingGuides).where(eq(schema.buyingGuides.status, 'PUBLISHED'));
    const comparisonsList = await db.select({ slug: schema.comparisons.slug, updatedAt: schema.comparisons.updatedAt }).from(schema.comparisons).where(eq(schema.comparisons.status, 'PUBLISHED'));
    const reviewsList = await db.select({ slug: schema.reviews.slug, updatedAt: schema.reviews.updatedAt }).from(schema.reviews).where(eq(schema.reviews.status, 'PUBLISHED'));
    const problemsList = await db.select({ slug: schema.problemCollections.slug, updatedAt: schema.problemCollections.updatedAt }).from(schema.problemCollections).where(eq(schema.problemCollections.status, 'PUBLISHED'));
    const budgetsList = await db.select({ slug: schema.budgetTiers.slug }).from(schema.budgetTiers);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}/</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${baseUrl}/products</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${baseUrl}/categories</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${baseUrl}/buying-guides</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${baseUrl}/compare</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${baseUrl}/reviews</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${baseUrl}/articles</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${baseUrl}/problems</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
`;

    for (const b of budgetsList) {
      xml += `  <url><loc>${baseUrl}/${b.slug}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
    }
    for (const p of productsList) {
      xml += `  <url><loc>${baseUrl}/product/${p.slug}</loc><lastmod>${p.updatedAt?.split('T')[0] || now}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
    }
    for (const c of categoriesList) {
      xml += `  <url><loc>${baseUrl}/category/${c.slug}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
    }
    for (const g of guidesList) {
      xml += `  <url><loc>${baseUrl}/buying-guides/${g.slug}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
    }
    for (const c of comparisonsList) {
      xml += `  <url><loc>${baseUrl}/compare/${c.slug}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
    }
    for (const r of reviewsList) {
      xml += `  <url><loc>${baseUrl}/reviews/${r.slug}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
    }
    for (const a of articlesList) {
      xml += `  <url><loc>${baseUrl}/articles/${a.slug}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
    }
    for (const pr of problemsList) {
      xml += `  <url><loc>${baseUrl}/problems/${pr.slug}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
    }

    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err: any) {
    console.error('Sitemap error:', err);
    res.status(500).send('Error generating sitemap');
  }
});

// Dynamic robots.txt
publicRouter.get('/robots.txt', (req: Request, res: Response) => {
  const host = req.get('host');
  const baseUrl = process.env.APP_URL || (host ? `${req.protocol}://${host}` : 'https://nidpik.com');
  const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`;
  res.header('Content-Type', 'text/plain');
  res.send(robots);
});
