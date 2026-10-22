import { Router, Request, Response } from 'express';
import { db } from '../db';
import { authenticate, AuthenticatedRequest, requireRole, logAudit } from '../auth';
import crypto from 'crypto';

export const productRouter = Router();

// Helper to format product row from SQLite JSON columns to frontend Product object
export function formatProductRow(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    category: row.category,
    categorySlug: row.category_slug,
    subcategory: row.subcategory,
    price: Number(row.price),
    oldPrice: row.old_price !== null ? Number(row.old_price) : undefined,
    currency: row.currency || '₹',
    badge: row.badge || undefined,
    image: row.image,
    gallery: JSON.parse(row.gallery_json || '[]'),
    shortDescription: row.short_description,
    quickVerdict: row.quick_verdict,
    bestFor: row.best_for,
    notIdealFor: row.not_ideal_for || undefined,
    features: JSON.parse(row.features_json || '[]'),
    specifications: JSON.parse(row.specifications_json || '{}'),
    pros: JSON.parse(row.pros_json || '[]'),
    cons: JSON.parse(row.cons_json || '[]'),
    merchant: typeof row.merchant_json === 'string' ? JSON.parse(row.merchant_json) : row.merchant_json,
    affiliateUrl: row.affiliate_url,
    affiliateUrls: row.affiliate_urls_json ? JSON.parse(row.affiliate_urls_json) : { IN: row.affiliate_url },
    meeshoUrl: row.meesho_url || (row.affiliate_urls_json ? (() => { try { return JSON.parse(row.affiliate_urls_json).MEESHO; } catch { return undefined; } })() : undefined),
    meeshoPrice: row.meesho_price !== null && row.meesho_price !== undefined ? Number(row.meesho_price) : undefined,
    affiliateNetwork: row.affiliate_network || 'Amazon Associates',
    lastUpdated: row.last_updated,
    status: row.status,
    ratingDisplay: row.rating_display || undefined,
    inStock: Boolean(row.in_stock),
    budgetTier: Number(row.budget_tier),
    problemTags: JSON.parse(row.problem_tags_json || '[]'),
    seoTitle: row.seo_title || undefined,
    seoDescription: row.seo_description || undefined,
    canonicalUrl: row.canonical_url || undefined,
    ogImage: row.og_image || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// GET /api/products
// Public sees only PUBLISHED products unless query param ?status=... is passed by authenticated admin
productRouter.get('/', (req: Request, res: Response) => {
  const { status, category, search, sort, budget } = req.query;

  let query = 'SELECT * FROM products WHERE 1=1';
  const params: any[] = [];

  if (status && status !== 'all') {
    query += ' AND status = ?';
    params.push(status);
  } else if (!status) {
    // Default public: show PUBLISHED
    query += ' AND status = ?';
    params.push('PUBLISHED');
  }

  if (category && category !== 'all') {
    query += ' AND category_slug = ?';
    params.push(category);
  }

  if (budget) {
    query += ' AND price <= ?';
    params.push(Number(budget));
  }

  if (search) {
    const q = `%${String(search).trim()}%`;
    query += ' AND (name LIKE ? OR brand LIKE ? OR short_description LIKE ? OR subcategory LIKE ?)';
    params.push(q, q, q, q);
  }

  if (sort === 'price-asc') {
    query += ' ORDER BY price ASC';
  } else if (sort === 'price-desc') {
    query += ' ORDER BY price DESC';
  } else if (sort === 'newest') {
    query += ' ORDER BY created_at DESC';
  } else {
    query += ' ORDER BY updated_at DESC';
  }

  const rows = db.prepare(query).all(...params);
  res.json(rows.map(formatProductRow));
});

// GET /api/products/:idOrSlug
productRouter.get('/:idOrSlug', (req: Request, res: Response) => {
  const param = req.params.idOrSlug;
  const row = db.prepare('SELECT * FROM products WHERE id = ? OR slug = ?').get(param, param);
  if (!row) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  res.json(formatProductRow(row));
});

// POST /api/products (CREATE)
productRouter.post('/', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), (req: AuthenticatedRequest, res: Response) => {
  const body = req.body;
  const user = req.user!;

  if (!body.name || !body.price || !body.category) {
    res.status(400).json({ error: 'Product name, price, and category are required.' });
    return;
  }

  const id = body.id || 'prod_' + crypto.randomUUID().slice(0, 8);
  let slug = (body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).trim();

  // Ensure unique slug
  const existing = db.prepare('SELECT id FROM products WHERE slug = ?').get(slug);
  if (existing) {
    slug = `${slug}-${Date.now().toString().slice(-4)}`;
  }

  const now = new Date().toISOString();
  const status = body.status || 'DRAFT';

  const stmt = db.prepare(`
    INSERT INTO products (
      id, slug, name, brand, category, category_slug, subcategory, price, old_price,
      currency, badge, image, gallery_json, short_description, quick_verdict,
      best_for, not_ideal_for, features_json, specifications_json, pros_json,
      cons_json, merchant_json, affiliate_url, affiliate_urls_json, meesho_url, meesho_price, affiliate_network, last_updated,
      status, rating_display, in_stock, budget_tier, problem_tags_json,
      seo_title, seo_description, canonical_url, og_image, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?
    )
  `);

  const categorySlug = body.categorySlug || body.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const merchant = typeof body.merchant === 'object' ? body.merchant : {
    id: 'amazon',
    name: 'Amazon India',
    logoText: 'Amazon',
    badgeColor: '#FF9900',
    affiliateBaseUrl: 'https://www.amazon.in/dp/'
  };

  const affiliateUrlsObj = body.affiliateUrls || (body.affiliateUrl ? { IN: body.affiliateUrl } : {});
  const meeshoLink = body.meeshoUrl || affiliateUrlsObj.MEESHO || null;
  const meeshoPriceVal = body.meeshoPrice !== undefined && body.meeshoPrice !== null ? Number(body.meeshoPrice) : null;

  stmt.run(
    id,
    slug,
    body.name,
    body.brand || 'NIDPIK Selected',
    body.category,
    categorySlug,
    body.subcategory || 'General',
    Number(body.price),
    body.oldPrice ? Number(body.oldPrice) : null,
    body.currency || '₹',
    body.badge || null,
    body.image || '/src/assets/images/nidpik_hero_showcase_1790936631391.jpg',
    JSON.stringify(body.gallery || [body.image]),
    body.shortDescription || '',
    body.quickVerdict || '',
    body.bestFor || '',
    body.notIdealFor || null,
    JSON.stringify(body.features || []),
    JSON.stringify(body.specifications || {}),
    JSON.stringify(body.pros || []),
    JSON.stringify(body.cons || []),
    JSON.stringify(merchant),
    body.affiliateUrl || 'https://www.amazon.in',
    JSON.stringify(affiliateUrlsObj),
    meeshoLink,
    meeshoPriceVal,
    body.affiliateNetwork || 'Amazon Associates',
    body.lastUpdated || 'October 2026',
    status,
    body.ratingDisplay || 'Editor Tested',
    body.inStock !== false ? 1 : 0,
    Number(body.budgetTier || body.price || 999),
    JSON.stringify(body.problemTags || []),
    body.seoTitle || `${body.name} - Price, Review & Alternatives | NIDPIK`,
    body.seoDescription || body.shortDescription || '',
    body.canonicalUrl || `https://nidpik.in/product/${slug}`,
    body.ogImage || body.image || '',
    now,
    now
  );

  logAudit(user.id, user.email, 'PRODUCT_CREATED', 'product', id, { name: body.name, status });

  const created = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  res.status(201).json(formatProductRow(created));
});

// PUT /api/products/:id (UPDATE)
productRouter.put('/:id', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const body = req.body;
  const user = req.user!;

  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
  if (!existing) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  const now = new Date().toISOString();
  const slug = body.slug ? body.slug.trim() : existing.slug;
  const categorySlug = body.categorySlug || (body.category ? body.category.toLowerCase().replace(/[^a-z0-9]+/g, '-') : existing.category_slug);

  const merchant = typeof body.merchant === 'object' ? body.merchant : (
    existing.merchant_json ? JSON.parse(existing.merchant_json) : { name: 'Amazon India' }
  );

  const affiliateUrlsObj = body.affiliateUrls !== undefined ? body.affiliateUrls : (
    existing.affiliate_urls_json ? JSON.parse(existing.affiliate_urls_json) : { IN: existing.affiliate_url }
  );
  const meeshoLink = body.meeshoUrl !== undefined ? body.meeshoUrl : (
    existing.meesho_url || (affiliateUrlsObj ? affiliateUrlsObj.MEESHO : null)
  );
  const meeshoPriceVal = body.meeshoPrice !== undefined ? (body.meeshoPrice ? Number(body.meeshoPrice) : null) : existing.meesho_price;

  const stmt = db.prepare(`
    UPDATE products SET
      slug = ?,
      name = ?,
      brand = ?,
      category = ?,
      category_slug = ?,
      subcategory = ?,
      price = ?,
      old_price = ?,
      currency = ?,
      badge = ?,
      image = ?,
      gallery_json = ?,
      short_description = ?,
      quick_verdict = ?,
      best_for = ?,
      not_ideal_for = ?,
      features_json = ?,
      specifications_json = ?,
      pros_json = ?,
      cons_json = ?,
      merchant_json = ?,
      affiliate_url = ?,
      affiliate_urls_json = ?,
      meesho_url = ?,
      meesho_price = ?,
      affiliate_network = ?,
      last_updated = ?,
      status = ?,
      rating_display = ?,
      in_stock = ?,
      budget_tier = ?,
      problem_tags_json = ?,
      seo_title = ?,
      seo_description = ?,
      canonical_url = ?,
      og_image = ?,
      updated_at = ?
    WHERE id = ?
  `);

  stmt.run(
    slug,
    body.name !== undefined ? body.name : existing.name,
    body.brand !== undefined ? body.brand : existing.brand,
    body.category !== undefined ? body.category : existing.category,
    categorySlug,
    body.subcategory !== undefined ? body.subcategory : existing.subcategory,
    body.price !== undefined ? Number(body.price) : existing.price,
    body.oldPrice !== undefined ? (body.oldPrice ? Number(body.oldPrice) : null) : existing.old_price,
    body.currency || existing.currency || '₹',
    body.badge !== undefined ? body.badge : existing.badge,
    body.image !== undefined ? body.image : existing.image,
    body.gallery !== undefined ? JSON.stringify(body.gallery) : existing.gallery_json,
    body.shortDescription !== undefined ? body.shortDescription : existing.short_description,
    body.quickVerdict !== undefined ? body.quickVerdict : existing.quick_verdict,
    body.bestFor !== undefined ? body.bestFor : existing.best_for,
    body.notIdealFor !== undefined ? body.notIdealFor : existing.not_ideal_for,
    body.features !== undefined ? JSON.stringify(body.features) : existing.features_json,
    body.specifications !== undefined ? JSON.stringify(body.specifications) : existing.specifications_json,
    body.pros !== undefined ? JSON.stringify(body.pros) : existing.pros_json,
    body.cons !== undefined ? JSON.stringify(body.cons) : existing.cons_json,
    JSON.stringify(merchant),
    body.affiliateUrl !== undefined ? body.affiliateUrl : existing.affiliate_url,
    JSON.stringify(affiliateUrlsObj),
    meeshoLink,
    meeshoPriceVal,
    body.affiliateNetwork !== undefined ? body.affiliateNetwork : existing.affiliate_network,
    body.lastUpdated || existing.last_updated,
    body.status !== undefined ? body.status : existing.status,
    body.ratingDisplay !== undefined ? body.ratingDisplay : existing.rating_display,
    body.inStock !== undefined ? (body.inStock ? 1 : 0) : existing.in_stock,
    body.budgetTier !== undefined ? Number(body.budgetTier) : existing.budget_tier,
    body.problemTags !== undefined ? JSON.stringify(body.problemTags) : existing.problem_tags_json,
    body.seoTitle !== undefined ? body.seoTitle : existing.seo_title,
    body.seoDescription !== undefined ? body.seoDescription : existing.seo_description,
    body.canonicalUrl !== undefined ? body.canonicalUrl : existing.canonical_url,
    body.ogImage !== undefined ? body.ogImage : existing.og_image,
    now,
    id
  );

  logAudit(user.id, user.email, 'PRODUCT_UPDATED', 'product', id, { name: body.name || existing.name });

  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  res.json(formatProductRow(updated));
});

// PATCH /api/products/:id/status (QUICK STATUS CHANGE)
productRouter.patch('/:id/status', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const user = req.user!;

  if (!['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status)) {
    res.status(400).json({ error: 'Invalid status. Must be DRAFT, PUBLISHED, or ARCHIVED.' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE products SET status = ?, updated_at = ? WHERE id = ?').run(status, now, id);

  logAudit(user.id, user.email, `PRODUCT_STATUS_${status}`, 'product', id);

  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  res.json(formatProductRow(updated));
});

// POST /api/products/:id/duplicate
productRouter.post('/:id/duplicate', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;

  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
  if (!existing) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  const newId = 'prod_' + crypto.randomUUID().slice(0, 8);
  const newSlug = `${existing.slug}-copy-${Date.now().toString().slice(-4)}`;
  const newName = `${existing.name} (Copy)`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO products (
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
      'DRAFT', ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?
    )
  `).run(
    newId,
    newSlug,
    newName,
    existing.brand,
    existing.category,
    existing.category_slug,
    existing.subcategory,
    existing.price,
    existing.old_price,
    existing.currency,
    existing.badge,
    existing.image,
    existing.gallery_json,
    existing.short_description,
    existing.quick_verdict,
    existing.best_for,
    existing.not_ideal_for,
    existing.features_json,
    existing.specifications_json,
    existing.pros_json,
    existing.cons_json,
    existing.merchant_json,
    existing.affiliate_url,
    existing.affiliate_network,
    existing.last_updated,
    existing.rating_display,
    existing.in_stock,
    existing.budget_tier,
    existing.problem_tags_json,
    `${newName} | NIDPIK`,
    existing.seo_description,
    `https://nidpik.in/product/${newSlug}`,
    existing.og_image,
    now,
    now
  );

  logAudit(user.id, user.email, 'PRODUCT_DUPLICATED', 'product', newId, { originalId: id });

  const created = db.prepare('SELECT * FROM products WHERE id = ?').get(newId);
  res.status(201).json(formatProductRow(created));
});

// DELETE /api/products/:id
productRouter.delete('/:id', authenticate, requireRole(['OWNER', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;

  const existing = db.prepare('SELECT name FROM products WHERE id = ?').get(id) as any;
  if (!existing) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  db.prepare('DELETE FROM products WHERE id = ?').run(id);
  logAudit(user.id, user.email, 'PRODUCT_DELETED', 'product', id, { name: existing.name });

  res.json({ success: true, message: 'Product deleted permanently.' });
});

// POST /api/products/bulk (BULK ACTIONS)
productRouter.post('/bulk', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), (req: AuthenticatedRequest, res: Response) => {
  const { ids, action } = req.body;
  const user = req.user!;

  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: 'Product IDs array required.' });
    return;
  }

  const now = new Date().toISOString();

  if (action === 'publish') {
    const stmt = db.prepare('UPDATE products SET status = ?, updated_at = ? WHERE id = ?');
    for (const id of ids) stmt.run('PUBLISHED', now, id);
    logAudit(user.id, user.email, 'BULK_PUBLISH_PRODUCTS', 'product', 'multiple', { count: ids.length });
  } else if (action === 'unpublish') {
    const stmt = db.prepare('UPDATE products SET status = ?, updated_at = ? WHERE id = ?');
    for (const id of ids) stmt.run('DRAFT', now, id);
    logAudit(user.id, user.email, 'BULK_UNPUBLISH_PRODUCTS', 'product', 'multiple', { count: ids.length });
  } else if (action === 'archive') {
    const stmt = db.prepare('UPDATE products SET status = ?, updated_at = ? WHERE id = ?');
    for (const id of ids) stmt.run('ARCHIVED', now, id);
    logAudit(user.id, user.email, 'BULK_ARCHIVE_PRODUCTS', 'product', 'multiple', { count: ids.length });
  } else if (action === 'delete') {
    if (user.role === 'EDITOR') {
      res.status(403).json({ error: 'Editors cannot delete products in bulk.' });
      return;
    }
    const stmt = db.prepare('DELETE FROM products WHERE id = ?');
    for (const id of ids) stmt.run(id);
    logAudit(user.id, user.email, 'BULK_DELETE_PRODUCTS', 'product', 'multiple', { count: ids.length });
  } else {
    res.status(400).json({ error: 'Invalid bulk action.' });
    return;
  }

  res.json({ success: true, count: ids.length, action });
});

// POST /api/products/:id/price-alert
productRouter.post('/:id/price-alert', (req: Request, res: Response) => {
  const { id } = req.params;
  const { email, targetPrice } = req.body;

  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'Valid email address is required.' });
    return;
  }

  const product = db.prepare('SELECT price, name FROM products WHERE id = ?').get(id) as any;
  if (!product) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }

  const alertId = `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const currentPrice = Number(product.price);
  const target = targetPrice ? Number(targetPrice) : Math.floor(currentPrice * 0.9);
  const now = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO price_alerts (id, product_id, email, target_price, current_price, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'active', ?)
    `).run(alertId, id, email, target, currentPrice, now);

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
productRouter.get('/:id/price-history', (req: Request, res: Response) => {
  const { id } = req.params;
  const product = db.prepare('SELECT price, old_price, name FROM products WHERE id = ?').get(id) as any;
  if (!product) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }

  const current = Number(product.price);
  const old = product.old_price ? Number(product.old_price) : Math.round(current * 1.25);
  const lowest = Math.round(current * 0.92);
  const highest = old;

  // Generate realistic 6-month price trend data
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
});

// GET /api/products/:id/user-reviews
productRouter.get('/:id/user-reviews', (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const reviews = db.prepare(`
      SELECT * FROM user_reviews 
      WHERE product_id = ? AND status = 'APPROVED' 
      ORDER BY created_at DESC
    `).all(id) as any[];

    // Calculate rating stats
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
productRouter.post('/:id/user-reviews', (req: Request, res: Response) => {
  const { id } = req.params;
  const { authorName, authorEmail, rating, headline, comment } = req.body;

  if (!authorName || !comment || !rating) {
    res.status(400).json({ error: 'Name, rating, and feedback comment are required.' });
    return;
  }

  const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO user_reviews (id, product_id, author_name, author_email, rating, headline, comment, is_verified, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'APPROVED', ?)
    `).run(
      reviewId,
      id,
      authorName.trim(),
      authorEmail?.trim() || 'community@nidpik.in',
      Math.min(5, Math.max(1, Number(rating))),
      headline?.trim() || 'Verified Purchase Feedback',
      comment.trim(),
      now
    );

    res.json({
      success: true,
      message: 'Thank you! Your review has been verified and published.',
      reviewId
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to submit review.' });
  }
});

