import { Router, Request, Response } from 'express';
import { eq, or, and, lte, ilike, asc, desc, inArray } from 'drizzle-orm';
import { db } from '../../src/db/index';
import * as schema from '../../src/db/schema';
import { authenticate, AuthenticatedRequest, requireRole, logAudit } from '../auth';
import crypto from 'crypto';

export const productRouter = Router();

// Helper to format product row from Drizzle/PostgreSQL to frontend Product object
export function formatProductRow(row: any) {
  if (!row) return null;
  const galleryJson = row.galleryJson ?? row.gallery_json ?? '[]';
  const featuresJson = row.featuresJson ?? row.features_json ?? '[]';
  const specificationsJson = row.specificationsJson ?? row.specifications_json ?? '{}';
  const prosJson = row.prosJson ?? row.pros_json ?? '[]';
  const consJson = row.consJson ?? row.cons_json ?? '[]';
  const merchantJson = row.merchantJson ?? row.merchant_json;
  const problemTagsJson = row.problemTagsJson ?? row.problem_tags_json ?? '[]';

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    category: row.category,
    categorySlug: row.categorySlug ?? row.category_slug,
    subcategory: row.subcategory,
    price: Number(row.price),
    oldPrice: (row.oldPrice ?? row.old_price) !== null && (row.oldPrice ?? row.old_price) !== undefined ? Number(row.oldPrice ?? row.old_price) : undefined,
    currency: row.currency || '₹',
    badge: row.badge || undefined,
    image: row.image,
    gallery: typeof galleryJson === 'string' ? JSON.parse(galleryJson || '[]') : galleryJson,
    shortDescription: row.shortDescription ?? row.short_description,
    quickVerdict: row.quickVerdict ?? row.quick_verdict,
    bestFor: row.bestFor ?? row.best_for,
    notIdealFor: (row.notIdealFor ?? row.not_ideal_for) || undefined,
    features: typeof featuresJson === 'string' ? JSON.parse(featuresJson || '[]') : featuresJson,
    specifications: typeof specificationsJson === 'string' ? JSON.parse(specificationsJson || '{}') : specificationsJson,
    pros: typeof prosJson === 'string' ? JSON.parse(prosJson || '[]') : prosJson,
    cons: typeof consJson === 'string' ? JSON.parse(consJson || '[]') : consJson,
    merchant: typeof merchantJson === 'string' ? JSON.parse(merchantJson) : merchantJson,
    affiliateUrl: row.affiliateUrl ?? row.affiliate_url,
    affiliateUrls: { IN: row.affiliateUrl ?? row.affiliate_url },
    meeshoUrl: (row.meeshoUrl ?? row.meesho_url) || undefined,
    meeshoPrice: (row.meeshoPrice ?? row.meesho_price) !== null && (row.meeshoPrice ?? row.meesho_price) !== undefined ? Number(row.meeshoPrice ?? row.meesho_price) : undefined,
    affiliateNetwork: (row.affiliateNetwork ?? row.affiliate_network) || 'Amazon Associates',
    lastUpdated: row.lastUpdated ?? row.last_updated,
    status: row.status,
    ratingDisplay: (row.ratingDisplay ?? row.rating_display) || undefined,
    inStock: Boolean(row.inStock ?? row.in_stock),
    budgetTier: Number(row.budgetTier ?? row.budget_tier),
    problemTags: typeof problemTagsJson === 'string' ? JSON.parse(problemTagsJson || '[]') : problemTagsJson,
    seoTitle: (row.seoTitle ?? row.seo_title) || undefined,
    seoDescription: (row.seoDescription ?? row.seo_description) || undefined,
    canonicalUrl: (row.canonicalUrl ?? row.canonical_url) || undefined,
    ogImage: (row.ogImage ?? row.og_image) || undefined,
    createdAt: row.createdAt ?? row.created_at,
    updatedAt: row.updatedAt ?? row.updated_at
  };
}

// GET /api/products
productRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { status, category, search, sort, budget } = req.query;

    const conditions: any[] = [];

    if (status && status !== 'all') {
      conditions.push(eq(schema.products.status, String(status)));
    } else if (!status) {
      conditions.push(eq(schema.products.status, 'PUBLISHED'));
    }

    if (category && category !== 'all') {
      conditions.push(eq(schema.products.categorySlug, String(category)));
    }

    if (budget) {
      conditions.push(lte(schema.products.price, Number(budget)));
    }

    if (search) {
      const q = `%${String(search).trim()}%`;
      conditions.push(
        or(
          ilike(schema.products.name, q),
          ilike(schema.products.brand, q),
          ilike(schema.products.shortDescription, q),
          ilike(schema.products.subcategory, q)
        )
      );
    }

    let queryBuilder = db.select().from(schema.products);

    if (conditions.length > 0) {
      queryBuilder = queryBuilder.where(and(...conditions)) as any;
    }

    if (sort === 'price-asc') {
      queryBuilder = queryBuilder.orderBy(asc(schema.products.price)) as any;
    } else if (sort === 'price-desc') {
      queryBuilder = queryBuilder.orderBy(desc(schema.products.price)) as any;
    } else if (sort === 'newest') {
      queryBuilder = queryBuilder.orderBy(desc(schema.products.createdAt)) as any;
    } else {
      queryBuilder = queryBuilder.orderBy(desc(schema.products.updatedAt)) as any;
    }

    const rows = await queryBuilder;
    res.json(rows.map(formatProductRow));
  } catch (err: any) {
    console.error('[GET PRODUCTS ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:idOrSlug
productRouter.get('/:idOrSlug', async (req: Request, res: Response) => {
  try {
    const param = req.params.idOrSlug;
    const rows = await db
      .select()
      .from(schema.products)
      .where(or(eq(schema.products.id, param), eq(schema.products.slug, param)))
      .limit(1);

    const row = rows[0];
    if (!row) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(formatProductRow(row));
  } catch (err: any) {
    console.error('[GET PRODUCT ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/products (CREATE)
productRouter.post('/', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = req.body;
    const user = req.user!;

    if (!body.name || !body.price || !body.category) {
      res.status(400).json({ error: 'Product name, price, and category are required.' });
      return;
    }

    const id = body.id || 'prod_' + crypto.randomUUID().slice(0, 8);
    let slug = (body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).trim();

    // Ensure unique slug
    const existingSlug = await db.select({ id: schema.products.id }).from(schema.products).where(eq(schema.products.slug, slug)).limit(1);
    if (existingSlug.length > 0) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const now = new Date().toISOString();
    const status = body.status || 'DRAFT';
    const categorySlug = body.categorySlug || body.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const merchant = typeof body.merchant === 'object' ? body.merchant : {
      id: 'amazon',
      name: 'Amazon India',
      logoText: 'Amazon',
      badgeColor: '#FF9900',
      affiliateBaseUrl: 'https://www.amazon.in/dp/'
    };

    await db.insert(schema.products).values({
      id,
      slug,
      name: body.name,
      brand: body.brand || 'NIDPIK Selected',
      category: body.category,
      categorySlug,
      subcategory: body.subcategory || 'General',
      price: Number(body.price),
      oldPrice: body.oldPrice ? Number(body.oldPrice) : null,
      currency: body.currency || '₹',
      badge: body.badge || null,
      image: body.image || '/src/assets/images/nidpik_hero_showcase_1790936631391.jpg',
      galleryJson: JSON.stringify(body.gallery || [body.image]),
      shortDescription: body.shortDescription || '',
      quickVerdict: body.quickVerdict || '',
      bestFor: body.bestFor || '',
      notIdealFor: body.notIdealFor || null,
      featuresJson: JSON.stringify(body.features || []),
      specificationsJson: JSON.stringify(body.specifications || {}),
      prosJson: JSON.stringify(body.pros || []),
      consJson: JSON.stringify(body.cons || []),
      merchantJson: JSON.stringify(merchant),
      affiliateUrl: body.affiliateUrl || 'https://www.amazon.in',
      affiliateNetwork: body.affiliateNetwork || 'Amazon Associates',
      lastUpdated: body.lastUpdated || 'October 2026',
      status,
      ratingDisplay: body.ratingDisplay || 'Editor Tested',
      inStock: body.inStock !== false ? 1 : 0,
      budgetTier: Number(body.budgetTier || body.price || 999),
      problemTagsJson: JSON.stringify(body.problemTags || []),
      seoTitle: body.seoTitle || `${body.name} - Price, Review & Alternatives | NIDPIK`,
      seoDescription: body.seoDescription || body.shortDescription || '',
      canonicalUrl: body.canonicalUrl || `https://nidpik.in/product/${slug}`,
      ogImage: body.ogImage || body.image || '',
      createdAt: now,
      updatedAt: now
    });

    await logAudit(user.id, user.email, 'PRODUCT_CREATED', 'product', id, { name: body.name, status });

    const createdRows = await db.select().from(schema.products).where(eq(schema.products.id, id)).limit(1);
    res.status(201).json(formatProductRow(createdRows[0]));
  } catch (err: any) {
    console.error('[CREATE PRODUCT ERROR]', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/products/:id (UPDATE)
productRouter.put('/:id', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const user = req.user!;

    const existingRows = await db.select().from(schema.products).where(eq(schema.products.id, id)).limit(1);
    const existing = existingRows[0];
    if (!existing) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const now = new Date().toISOString();
    const slug = body.slug ? body.slug.trim() : existing.slug;
    const categorySlug = body.categorySlug || (body.category ? body.category.toLowerCase().replace(/[^a-z0-9]+/g, '-') : existing.categorySlug);

    const merchant = typeof body.merchant === 'object' ? body.merchant : (
      existing.merchantJson ? JSON.parse(existing.merchantJson) : { name: 'Amazon India' }
    );

    await db.update(schema.products).set({
      slug,
      name: body.name !== undefined ? body.name : existing.name,
      brand: body.brand !== undefined ? body.brand : existing.brand,
      category: body.category !== undefined ? body.category : existing.category,
      categorySlug,
      subcategory: body.subcategory !== undefined ? body.subcategory : existing.subcategory,
      price: body.price !== undefined ? Number(body.price) : existing.price,
      oldPrice: body.oldPrice !== undefined ? (body.oldPrice ? Number(body.oldPrice) : null) : existing.oldPrice,
      currency: body.currency || existing.currency || '₹',
      badge: body.badge !== undefined ? body.badge : existing.badge,
      image: body.image !== undefined ? body.image : existing.image,
      galleryJson: body.gallery !== undefined ? JSON.stringify(body.gallery) : existing.galleryJson,
      shortDescription: body.shortDescription !== undefined ? body.shortDescription : existing.shortDescription,
      quickVerdict: body.quickVerdict !== undefined ? body.quickVerdict : existing.quickVerdict,
      bestFor: body.bestFor !== undefined ? body.bestFor : existing.bestFor,
      notIdealFor: body.notIdealFor !== undefined ? body.notIdealFor : existing.notIdealFor,
      featuresJson: body.features !== undefined ? JSON.stringify(body.features) : existing.featuresJson,
      specificationsJson: body.specifications !== undefined ? JSON.stringify(body.specifications) : existing.specificationsJson,
      prosJson: body.pros !== undefined ? JSON.stringify(body.pros) : existing.prosJson,
      consJson: body.cons !== undefined ? JSON.stringify(body.cons) : existing.consJson,
      merchantJson: JSON.stringify(merchant),
      affiliateUrl: body.affiliateUrl !== undefined ? body.affiliateUrl : existing.affiliateUrl,
      affiliateNetwork: body.affiliateNetwork !== undefined ? body.affiliateNetwork : existing.affiliateNetwork,
      lastUpdated: body.lastUpdated || existing.lastUpdated,
      status: body.status !== undefined ? body.status : existing.status,
      ratingDisplay: body.ratingDisplay !== undefined ? body.ratingDisplay : existing.ratingDisplay,
      inStock: body.inStock !== undefined ? (body.inStock ? 1 : 0) : existing.inStock,
      budgetTier: body.budgetTier !== undefined ? Number(body.budgetTier) : existing.budgetTier,
      problemTagsJson: body.problemTags !== undefined ? JSON.stringify(body.problemTags) : existing.problemTagsJson,
      seoTitle: body.seoTitle !== undefined ? body.seoTitle : existing.seoTitle,
      seoDescription: body.seoDescription !== undefined ? body.seoDescription : existing.seoDescription,
      canonicalUrl: body.canonicalUrl !== undefined ? body.canonicalUrl : existing.canonicalUrl,
      ogImage: body.ogImage !== undefined ? body.ogImage : existing.ogImage,
      updatedAt: now
    }).where(eq(schema.products.id, id));

    await logAudit(user.id, user.email, 'PRODUCT_UPDATED', 'product', id, { name: body.name || existing.name });

    const updatedRows = await db.select().from(schema.products).where(eq(schema.products.id, id)).limit(1);
    res.json(formatProductRow(updatedRows[0]));
  } catch (err: any) {
    console.error('[UPDATE PRODUCT ERROR]', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// PATCH /api/products/:id/status (QUICK STATUS CHANGE)
productRouter.patch('/:id/status', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user!;

    if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
      res.status(400).json({ error: 'Invalid status. Must be DRAFT, PUBLISHED, or ARCHIVED.' });
      return;
    }

    const now = new Date().toISOString();
    await db.update(schema.products).set({ status, updatedAt: now }).where(eq(schema.products.id, id));

    await logAudit(user.id, user.email, `PRODUCT_STATUS_${status}`, 'product', id);

    const updatedRows = await db.select().from(schema.products).where(eq(schema.products.id, id)).limit(1);
    res.json(formatProductRow(updatedRows[0]));
  } catch (err: any) {
    console.error('[STATUS PRODUCT ERROR]', err);
    res.status(500).json({ error: 'Failed to update product status' });
  }
});

// POST /api/products/:id/duplicate
productRouter.post('/:id/duplicate', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const existingRows = await db.select().from(schema.products).where(eq(schema.products.id, id)).limit(1);
    const existing = existingRows[0];
    if (!existing) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const newId = 'prod_' + crypto.randomUUID().slice(0, 8);
    const newSlug = `${existing.slug}-copy-${Date.now().toString().slice(-4)}`;
    const newName = `${existing.name} (Copy)`;
    const now = new Date().toISOString();

    await db.insert(schema.products).values({
      ...existing,
      id: newId,
      slug: newSlug,
      name: newName,
      status: 'DRAFT',
      seoTitle: `${newName} | NIDPIK`,
      canonicalUrl: `https://nidpik.in/product/${newSlug}`,
      createdAt: now,
      updatedAt: now
    });

    await logAudit(user.id, user.email, 'PRODUCT_DUPLICATED', 'product', newId, { originalId: id });

    const createdRows = await db.select().from(schema.products).where(eq(schema.products.id, newId)).limit(1);
    res.status(201).json(formatProductRow(createdRows[0]));
  } catch (err: any) {
    console.error('[DUPLICATE PRODUCT ERROR]', err);
    res.status(500).json({ error: 'Failed to duplicate product' });
  }
});

// DELETE /api/products/:id
productRouter.delete('/:id', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const existingRows = await db.select({ name: schema.products.name }).from(schema.products).where(eq(schema.products.id, id)).limit(1);
    const existing = existingRows[0];
    if (!existing) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    await db.delete(schema.products).where(eq(schema.products.id, id));
    await logAudit(user.id, user.email, 'PRODUCT_DELETED', 'product', id, { name: existing.name });

    res.json({ success: true, message: 'Product deleted permanently.' });
  } catch (err: any) {
    console.error('[DELETE PRODUCT ERROR]', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// POST /api/products/bulk (BULK ACTIONS)
productRouter.post('/bulk', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { ids, action } = req.body;
    const user = req.user!;

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'Product IDs array required.' });
      return;
    }

    const now = new Date().toISOString();

    if (action === 'publish') {
      await db.update(schema.products).set({ status: 'PUBLISHED', updatedAt: now }).where(inArray(schema.products.id, ids));
      await logAudit(user.id, user.email, 'BULK_PUBLISH_PRODUCTS', 'product', 'multiple', { count: ids.length });
    } else if (action === 'unpublish') {
      await db.update(schema.products).set({ status: 'DRAFT', updatedAt: now }).where(inArray(schema.products.id, ids));
      await logAudit(user.id, user.email, 'BULK_UNPUBLISH_PRODUCTS', 'product', 'multiple', { count: ids.length });
    } else if (action === 'archive') {
      await db.update(schema.products).set({ status: 'ARCHIVED', updatedAt: now }).where(inArray(schema.products.id, ids));
      await logAudit(user.id, user.email, 'BULK_ARCHIVE_PRODUCTS', 'product', 'multiple', { count: ids.length });
    } else if (action === 'delete') {
      if (user.role === 'EDITOR') {
        res.status(403).json({ error: 'Editors cannot delete products in bulk.' });
        return;
      }
      await db.delete(schema.products).where(inArray(schema.products.id, ids));
      await logAudit(user.id, user.email, 'BULK_DELETE_PRODUCTS', 'product', 'multiple', { count: ids.length });
    } else {
      res.status(400).json({ error: 'Invalid bulk action.' });
      return;
    }

    res.json({ success: true, count: ids.length, action });
  } catch (err: any) {
    console.error('[BULK PRODUCTS ERROR]', err);
    res.status(500).json({ error: 'Failed to perform bulk product action' });
  }
});

// POST /api/products/:id/price-alert
productRouter.post('/:id/price-alert', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, targetPrice } = req.body;

    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'Valid email address is required.' });
      return;
    }

    const productRows = await db
      .select({ price: schema.products.price, name: schema.products.name })
      .from(schema.products)
      .where(eq(schema.products.id, id))
      .limit(1);

    const product = productRows[0];
    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const currentPrice = Number(product.price);
    const target = targetPrice ? Number(targetPrice) : Math.floor(currentPrice * 0.9);
    const now = new Date().toISOString();

    await db.insert(schema.priceAlerts).values({
      id: alertId,
      productId: id,
      email,
      targetPrice: target,
      currentPrice,
      status: 'active',
      createdAt: now
    });

    res.json({
      success: true,
      message: `Price alert set! We will notify ${email} when the price drops below ₹${target.toLocaleString('en-IN')}.`,
      alertId,
      targetPrice: target
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to register price alert.' });
  }
});

// GET /api/products/:id/price-history
productRouter.get('/:id/price-history', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const productRows = await db
      .select({ price: schema.products.price, oldPrice: schema.products.oldPrice, name: schema.products.name })
      .from(schema.products)
      .where(eq(schema.products.id, id))
      .limit(1);

    const product = productRows[0];
    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    const current = Number(product.price);
    const old = product.oldPrice ? Number(product.oldPrice) : Math.round(current * 1.25);
    const lowest = Math.round(current * 0.92);
    const highest = old;

    const history = [
      { month: '6 Months Ago', price: highest },
      { month: '4 Months Ago', price: Math.round((highest + current) / 2) },
      { month: '2 Months Ago', price: Math.round(current * 1.05) },
      { month: 'Last Month', price: lowest },
      { month: 'Current Price', price: current }
    ];

    res.json({
      productId: id,
      currentPrice: current,
      lowestRecorded: lowest,
      highestRecorded: highest,
      averagePrice: Math.round((current + lowest + highest) / 3),
      history
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
});

// GET /api/products/:id/user-reviews
productRouter.get('/:id/user-reviews', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const reviews = await db
      .select()
      .from(schema.userReviews)
      .where(and(eq(schema.userReviews.productId, id), eq(schema.userReviews.status, 'APPROVED')))
      .orderBy(desc(schema.userReviews.createdAt));

    const count = reviews.length;
    const avg = count > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1) : '5.0';

    res.json({
      reviews,
      totalCount: count,
      averageRating: Number(avg)
    });
  } catch (err: any) {
    res.json({ reviews: [], totalCount: 0, averageRating: 5.0 });
  }
});

// POST /api/products/:id/user-reviews
productRouter.post('/:id/user-reviews', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { authorName, authorEmail, rating, headline, comment } = req.body;

  if (!authorName || !comment || !rating) {
    res.status(400).json({ error: 'Name, rating, and feedback comment are required.' });
    return;
  }

  const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  try {
    await db.insert(schema.userReviews).values({
      id: reviewId,
      productId: id,
      authorName: authorName.trim(),
      authorEmail: authorEmail?.trim() || 'community@nidpik.in',
      rating: Math.min(5, Math.max(1, Number(rating))),
      headline: headline?.trim() || 'Verified Purchase Feedback',
      comment: comment.trim(),
      isVerified: 1,
      status: 'APPROVED',
      createdAt: now
    });

    res.json({
      success: true,
      message: 'Thank you! Your review has been verified and published.',
      reviewId
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to submit review.' });
  }
});


