import { Router, Request, Response } from 'express';
import { db } from '../db';
import { authenticate, AuthenticatedRequest, requireRole, logAudit } from '../auth';
import crypto from 'crypto';

export const contentRouter = Router();

// ==========================================
// ARTICLES CRUD
// ==========================================
export function formatArticleRow(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    categorySlug: row.category_slug,
    excerpt: row.excerpt,
    authorId: row.author_id,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    readingTime: row.reading_time,
    image: row.image,
    content: JSON.parse(row.content_json || '[]'),
    tags: JSON.parse(row.tags_json || '[]'),
    recommendedProductIds: JSON.parse(row.recommended_product_ids_json || '[]'),
    status: row.status,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    canonicalUrl: row.canonical_url,
    ogImage: row.og_image,
    createdAt: row.created_at
  };
}

contentRouter.get('/articles', (req: Request, res: Response) => {
  const { status } = req.query;
  let query = 'SELECT * FROM articles';
  const params: any[] = [];
  if (status && status !== 'all') {
    query += ' WHERE status = ?';
    params.push(status);
  }
  query += ' ORDER BY created_at DESC';
  const rows = db.prepare(query).all(...params);
  res.json(rows.map(formatArticleRow));
});

contentRouter.get('/articles/:idOrSlug', (req: Request, res: Response) => {
  const p = req.params.idOrSlug;
  const row = db.prepare('SELECT * FROM articles WHERE id = ? OR slug = ?').get(p, p);
  if (!row) {
    res.status(404).json({ error: 'Article not found' });
    return;
  }
  res.json(formatArticleRow(row));
});

contentRouter.post('/articles', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), (req: AuthenticatedRequest, res: Response) => {
  const body = req.body;
  const user = req.user!;

  if (!body.title || !body.category) {
    res.status(400).json({ error: 'Title and category are required' });
    return;
  }

  const id = body.id || 'art_' + crypto.randomUUID().slice(0, 8);
  const slug = (body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).trim();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO articles (
      id, slug, title, category, category_slug, excerpt, author_id, published_at,
      updated_at, reading_time, image, content_json, tags_json,
      recommended_product_ids_json, status, seo_title, seo_description,
      canonical_url, og_image, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    slug,
    body.title,
    body.category,
    body.categorySlug || body.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    body.excerpt || '',
    body.authorId || 'rahul-sharma',
    body.publishedAt || now,
    now,
    body.readingTime || '5 min read',
    body.image || '/src/assets/images/nidpik_hero_showcase_1790936631391.jpg',
    JSON.stringify(Array.isArray(body.content) ? body.content : (body.content ? body.content.split('\n\n') : [])),
    JSON.stringify(body.tags || []),
    JSON.stringify(body.recommendedProductIds || []),
    body.status || 'DRAFT',
    body.seoTitle || `${body.title} | NIDPIK`,
    body.seoDescription || body.excerpt || '',
    body.canonicalUrl || `https://nidpik.in/articles/${slug}`,
    body.ogImage || body.image || '',
    now
  );

  logAudit(user.id, user.email, 'ARTICLE_CREATED', 'article', id, { title: body.title });
  const created = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
  res.status(201).json(formatArticleRow(created));
});

contentRouter.put('/articles/:id', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const body = req.body;
  const user = req.user!;

  const existing = db.prepare('SELECT * FROM articles WHERE id = ?').get(id) as any;
  if (!existing) {
    res.status(404).json({ error: 'Article not found' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE articles SET
      slug = ?, title = ?, category = ?, category_slug = ?, excerpt = ?, author_id = ?,
      updated_at = ?, reading_time = ?, image = ?, content_json = ?, tags_json = ?,
      recommended_product_ids_json = ?, status = ?, seo_title = ?, seo_description = ?,
      canonical_url = ?, og_image = ?
    WHERE id = ?
  `).run(
    body.slug !== undefined ? body.slug : existing.slug,
    body.title !== undefined ? body.title : existing.title,
    body.category !== undefined ? body.category : existing.category,
    body.categorySlug !== undefined ? body.categorySlug : existing.category_slug,
    body.excerpt !== undefined ? body.excerpt : existing.excerpt,
    body.authorId !== undefined ? body.authorId : existing.author_id,
    now,
    body.readingTime !== undefined ? body.readingTime : existing.reading_time,
    body.image !== undefined ? body.image : existing.image,
    body.content !== undefined ? JSON.stringify(Array.isArray(body.content) ? body.content : body.content.split('\n\n')) : existing.content_json,
    body.tags !== undefined ? JSON.stringify(body.tags) : existing.tags_json,
    body.recommendedProductIds !== undefined ? JSON.stringify(body.recommendedProductIds) : existing.recommended_product_ids_json,
    body.status !== undefined ? body.status : existing.status,
    body.seoTitle !== undefined ? body.seoTitle : existing.seo_title,
    body.seoDescription !== undefined ? body.seoDescription : existing.seo_description,
    body.canonicalUrl !== undefined ? body.canonicalUrl : existing.canonical_url,
    body.ogImage !== undefined ? body.ogImage : existing.og_image,
    id
  );

  logAudit(user.id, user.email, 'ARTICLE_UPDATED', 'article', id, { title: body.title || existing.title });
  const updated = db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
  res.json(formatArticleRow(updated));
});

contentRouter.delete('/articles/:id', authenticate, requireRole(['OWNER', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  db.prepare('DELETE FROM articles WHERE id = ?').run(id);
  logAudit(user.id, user.email, 'ARTICLE_DELETED', 'article', id);
  res.json({ success: true });
});

// ==========================================
// BUYING GUIDES CRUD
// ==========================================
export function formatGuideRow(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    categorySlug: row.category_slug,
    subtitle: row.subtitle,
    quickAnswer: row.quick_answer,
    authorId: row.author_id,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    readingTime: row.reading_time,
    featuredProductIds: JSON.parse(row.featured_product_ids_json || '[]'),
    budgetRange: row.budget_range,
    whatToLookFor: JSON.parse(row.what_to_look_for_json || '[]'),
    whoShouldBuy: row.who_should_buy,
    whoShouldSkip: row.who_should_skip,
    faqs: JSON.parse(row.faqs_json || '[]'),
    status: row.status,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    canonicalUrl: row.canonical_url,
    ogImage: row.og_image,
    createdAt: row.created_at
  };
}

contentRouter.get('/guides', (req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM buying_guides ORDER BY created_at DESC').all();
  res.json(rows.map(formatGuideRow));
});

contentRouter.get('/guides/:idOrSlug', (req: Request, res: Response) => {
  const p = req.params.idOrSlug;
  const row = db.prepare('SELECT * FROM buying_guides WHERE id = ? OR slug = ?').get(p, p);
  if (!row) {
    res.status(404).json({ error: 'Guide not found' });
    return;
  }
  res.json(formatGuideRow(row));
});

contentRouter.post('/guides', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), (req: AuthenticatedRequest, res: Response) => {
  const body = req.body;
  const user = req.user!;

  const id = body.id || 'guide_' + crypto.randomUUID().slice(0, 8);
  const slug = (body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).trim();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO buying_guides (
      id, slug, title, category, category_slug, subtitle, quick_answer,
      author_id, published_at, updated_at, reading_time, featured_product_ids_json,
      budget_range, what_to_look_for_json, who_should_buy, who_should_skip,
      faqs_json, status, seo_title, seo_description, canonical_url, og_image, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    slug,
    body.title,
    body.category,
    body.categorySlug || body.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    body.subtitle || '',
    body.quickAnswer || '',
    body.authorId || 'rahul-sharma',
    now,
    now,
    body.readingTime || '6 min read',
    JSON.stringify(body.featuredProductIds || []),
    body.budgetRange || 'Under ₹2,000',
    JSON.stringify(body.whatToLookFor || []),
    body.whoShouldBuy || '',
    body.whoShouldSkip || '',
    JSON.stringify(body.faqs || []),
    body.status || 'DRAFT',
    body.seoTitle || `${body.title} | NIDPIK Guide`,
    body.seoDescription || body.subtitle || '',
    body.canonicalUrl || `https://nidpik.in/buying-guides/${slug}`,
    body.ogImage || null,
    now
  );

  logAudit(user.id, user.email, 'GUIDE_CREATED', 'guide', id, { title: body.title });
  const created = db.prepare('SELECT * FROM buying_guides WHERE id = ?').get(id);
  res.status(201).json(formatGuideRow(created));
});

contentRouter.put('/guides/:id', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const body = req.body;
  const user = req.user!;

  const existing = db.prepare('SELECT * FROM buying_guides WHERE id = ?').get(id) as any;
  if (!existing) {
    res.status(404).json({ error: 'Guide not found' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE buying_guides SET
      slug = ?, title = ?, category = ?, category_slug = ?, subtitle = ?, quick_answer = ?,
      author_id = ?, updated_at = ?, reading_time = ?, featured_product_ids_json = ?,
      budget_range = ?, what_to_look_for_json = ?, who_should_buy = ?, who_should_skip = ?,
      faqs_json = ?, status = ?, seo_title = ?, seo_description = ?, canonical_url = ?, og_image = ?
    WHERE id = ?
  `).run(
    body.slug !== undefined ? body.slug : existing.slug,
    body.title !== undefined ? body.title : existing.title,
    body.category !== undefined ? body.category : existing.category,
    body.categorySlug !== undefined ? body.categorySlug : existing.category_slug,
    body.subtitle !== undefined ? body.subtitle : existing.subtitle,
    body.quickAnswer !== undefined ? body.quickAnswer : existing.quick_answer,
    body.authorId !== undefined ? body.authorId : existing.author_id,
    now,
    body.readingTime !== undefined ? body.readingTime : existing.reading_time,
    body.featuredProductIds !== undefined ? JSON.stringify(body.featuredProductIds) : existing.featured_product_ids_json,
    body.budgetRange !== undefined ? body.budgetRange : existing.budget_range,
    body.whatToLookFor !== undefined ? JSON.stringify(body.whatToLookFor) : existing.what_to_look_for_json,
    body.whoShouldBuy !== undefined ? body.whoShouldBuy : existing.who_should_buy,
    body.whoShouldSkip !== undefined ? body.whoShouldSkip : existing.who_should_skip,
    body.faqs !== undefined ? JSON.stringify(body.faqs) : existing.faqs_json,
    body.status !== undefined ? body.status : existing.status,
    body.seoTitle !== undefined ? body.seoTitle : existing.seo_title,
    body.seoDescription !== undefined ? body.seoDescription : existing.seo_description,
    body.canonicalUrl !== undefined ? body.canonicalUrl : existing.canonical_url,
    body.ogImage !== undefined ? body.ogImage : existing.og_image,
    id
  );

  logAudit(user.id, user.email, 'GUIDE_UPDATED', 'guide', id, { title: body.title || existing.title });
  const updated = db.prepare('SELECT * FROM buying_guides WHERE id = ?').get(id);
  res.json(formatGuideRow(updated));
});

contentRouter.delete('/guides/:id', authenticate, requireRole(['OWNER', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  db.prepare('DELETE FROM buying_guides WHERE id = ?').run(id);
  logAudit(user.id, user.email, 'GUIDE_DELETED', 'guide', id);
  res.json({ success: true });
});

// ==========================================
// COMPARISONS CRUD
// ==========================================
export function formatComparisonRow(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    category: row.category,
    categorySlug: row.category_slug,
    productIds: JSON.parse(row.product_ids_json || '[]'),
    winnerProductId: row.winner_product_id || undefined,
    verdictSummary: row.verdict_summary,
    comparisonPoints: JSON.parse(row.comparison_points_json || '[]'),
    authorId: row.author_id,
    updatedAt: row.updated_at,
    status: row.status,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    canonicalUrl: row.canonical_url,
    ogImage: row.og_image,
    createdAt: row.created_at
  };
}

contentRouter.get('/comparisons', (req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM comparisons ORDER BY created_at DESC').all();
  res.json(rows.map(formatComparisonRow));
});

contentRouter.get('/comparisons/:idOrSlug', (req: Request, res: Response) => {
  const p = req.params.idOrSlug;
  const row = db.prepare('SELECT * FROM comparisons WHERE id = ? OR slug = ?').get(p, p);
  if (!row) {
    res.status(404).json({ error: 'Comparison not found' });
    return;
  }
  res.json(formatComparisonRow(row));
});

contentRouter.post('/comparisons', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), (req: AuthenticatedRequest, res: Response) => {
  const body = req.body;
  const user = req.user!;

  const id = body.id || 'comp_' + crypto.randomUUID().slice(0, 8);
  const slug = (body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).trim();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO comparisons (
      id, slug, title, subtitle, category, category_slug, product_ids_json,
      winner_product_id, verdict_summary, comparison_points_json, author_id,
      updated_at, status, seo_title, seo_description, canonical_url, og_image, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    slug,
    body.title,
    body.subtitle || '',
    body.category,
    body.categorySlug || body.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    JSON.stringify(body.productIds || []),
    body.winnerProductId || null,
    body.verdictSummary || '',
    JSON.stringify(body.comparisonPoints || []),
    body.authorId || 'rahul-sharma',
    now,
    body.status || 'DRAFT',
    body.seoTitle || `${body.title} | NIDPIK`,
    body.seoDescription || body.verdictSummary || '',
    body.canonicalUrl || `https://nidpik.in/compare/${slug}`,
    body.ogImage || null,
    now
  );

  logAudit(user.id, user.email, 'COMPARISON_CREATED', 'comparison', id, { title: body.title });
  const created = db.prepare('SELECT * FROM comparisons WHERE id = ?').get(id);
  res.status(201).json(formatComparisonRow(created));
});

contentRouter.put('/comparisons/:id', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const body = req.body;
  const user = req.user!;

  const existing = db.prepare('SELECT * FROM comparisons WHERE id = ?').get(id) as any;
  if (!existing) {
    res.status(404).json({ error: 'Comparison not found' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE comparisons SET
      slug = ?, title = ?, subtitle = ?, category = ?, category_slug = ?,
      product_ids_json = ?, winner_product_id = ?, verdict_summary = ?,
      comparison_points_json = ?, author_id = ?, updated_at = ?, status = ?,
      seo_title = ?, seo_description = ?, canonical_url = ?, og_image = ?
    WHERE id = ?
  `).run(
    body.slug !== undefined ? body.slug : existing.slug,
    body.title !== undefined ? body.title : existing.title,
    body.subtitle !== undefined ? body.subtitle : existing.subtitle,
    body.category !== undefined ? body.category : existing.category,
    body.categorySlug !== undefined ? body.categorySlug : existing.category_slug,
    body.productIds !== undefined ? JSON.stringify(body.productIds) : existing.product_ids_json,
    body.winnerProductId !== undefined ? body.winnerProductId : existing.winner_product_id,
    body.verdictSummary !== undefined ? body.verdictSummary : existing.verdict_summary,
    body.comparisonPoints !== undefined ? JSON.stringify(body.comparisonPoints) : existing.comparison_points_json,
    body.authorId !== undefined ? body.authorId : existing.author_id,
    now,
    body.status !== undefined ? body.status : existing.status,
    body.seoTitle !== undefined ? body.seoTitle : existing.seo_title,
    body.seoDescription !== undefined ? body.seoDescription : existing.seo_description,
    body.canonicalUrl !== undefined ? body.canonicalUrl : existing.canonical_url,
    body.ogImage !== undefined ? body.ogImage : existing.og_image,
    id
  );

  logAudit(user.id, user.email, 'COMPARISON_UPDATED', 'comparison', id, { title: body.title || existing.title });
  const updated = db.prepare('SELECT * FROM comparisons WHERE id = ?').get(id);
  res.json(formatComparisonRow(updated));
});

contentRouter.delete('/comparisons/:id', authenticate, requireRole(['OWNER', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  db.prepare('DELETE FROM comparisons WHERE id = ?').run(id);
  logAudit(user.id, user.email, 'COMPARISON_DELETED', 'comparison', id);
  res.json({ success: true });
});

// ==========================================
// REVIEWS CRUD
// ==========================================
export function formatReviewRow(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    productId: row.product_id,
    authorId: row.author_id,
    updatedAt: row.updated_at,
    readingTime: row.reading_time,
    verdict: row.verdict,
    whoItIsFor: row.who_it_is_for,
    whatWeLiked: JSON.parse(row.what_we_liked_json || '[]'),
    whatWeDidNotLike: JSON.parse(row.what_we_did_not_like_json || '[]'),
    inDepthTesting: row.in_depth_testing,
    finalRatingText: row.final_rating_text,
    status: row.status,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    canonicalUrl: row.canonical_url,
    ogImage: row.og_image,
    createdAt: row.created_at
  };
}

contentRouter.get('/reviews', (req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM reviews ORDER BY created_at DESC').all();
  res.json(rows.map(formatReviewRow));
});

contentRouter.get('/reviews/:idOrSlug', (req: Request, res: Response) => {
  const p = req.params.idOrSlug;
  const row = db.prepare('SELECT * FROM reviews WHERE id = ? OR slug = ?').get(p, p);
  if (!row) {
    res.status(404).json({ error: 'Review not found' });
    return;
  }
  res.json(formatReviewRow(row));
});

contentRouter.post('/reviews', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), (req: AuthenticatedRequest, res: Response) => {
  const body = req.body;
  const user = req.user!;

  const id = body.id || 'rev_' + crypto.randomUUID().slice(0, 8);
  const slug = (body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).trim();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO reviews (
      id, slug, title, product_id, author_id, updated_at, reading_time,
      verdict, who_it_is_for, what_we_liked_json, what_we_did_not_like_json,
      in_depth_testing, final_rating_text, status, seo_title, seo_description,
      canonical_url, og_image, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    slug,
    body.title,
    body.productId,
    body.authorId || 'rahul-sharma',
    now,
    body.readingTime || '5 min read',
    body.verdict || '',
    body.whoItIsFor || '',
    JSON.stringify(body.whatWeLiked || []),
    JSON.stringify(body.whatWeDidNotLike || []),
    body.inDepthTesting || '',
    body.finalRatingText || 'Editor Score: 4.8 / 5.0',
    body.status || 'DRAFT',
    body.seoTitle || `${body.title} | NIDPIK`,
    body.seoDescription || body.verdict || '',
    body.canonicalUrl || `https://nidpik.in/reviews/${slug}`,
    body.ogImage || null,
    now
  );

  logAudit(user.id, user.email, 'REVIEW_CREATED', 'review', id, { title: body.title });
  const created = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
  res.status(201).json(formatReviewRow(created));
});

contentRouter.put('/reviews/:id', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const body = req.body;
  const user = req.user!;

  const existing = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id) as any;
  if (!existing) {
    res.status(404).json({ error: 'Review not found' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE reviews SET
      slug = ?, title = ?, product_id = ?, author_id = ?, updated_at = ?, reading_time = ?,
      verdict = ?, who_it_is_for = ?, what_we_liked_json = ?, what_we_did_not_like_json = ?,
      in_depth_testing = ?, final_rating_text = ?, status = ?, seo_title = ?, seo_description = ?,
      canonical_url = ?, og_image = ?
    WHERE id = ?
  `).run(
    body.slug !== undefined ? body.slug : existing.slug,
    body.title !== undefined ? body.title : existing.title,
    body.productId !== undefined ? body.productId : existing.product_id,
    body.authorId !== undefined ? body.authorId : existing.author_id,
    now,
    body.readingTime !== undefined ? body.readingTime : existing.reading_time,
    body.verdict !== undefined ? body.verdict : existing.verdict,
    body.whoItIsFor !== undefined ? body.whoItIsFor : existing.who_it_is_for,
    body.whatWeLiked !== undefined ? JSON.stringify(body.whatWeLiked) : existing.what_we_liked_json,
    body.whatWeDidNotLike !== undefined ? JSON.stringify(body.whatWeDidNotLike) : existing.what_we_did_not_like_json,
    body.inDepthTesting !== undefined ? body.inDepthTesting : existing.in_depth_testing,
    body.finalRatingText !== undefined ? body.finalRatingText : existing.final_rating_text,
    body.status !== undefined ? body.status : existing.status,
    body.seoTitle !== undefined ? body.seoTitle : existing.seo_title,
    body.seoDescription !== undefined ? body.seoDescription : existing.seo_description,
    body.canonicalUrl !== undefined ? body.canonicalUrl : existing.canonical_url,
    body.ogImage !== undefined ? body.ogImage : existing.og_image,
    id
  );

  logAudit(user.id, user.email, 'REVIEW_UPDATED', 'review', id, { title: body.title || existing.title });
  const updated = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
  res.json(formatReviewRow(updated));
});

contentRouter.delete('/reviews/:id', authenticate, requireRole(['OWNER', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
  logAudit(user.id, user.email, 'REVIEW_DELETED', 'review', id);
  res.json({ success: true });
});

// ==========================================
// PROBLEM COLLECTIONS CRUD
// ==========================================
export function formatProblemRow(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    tagline: row.tagline,
    description: row.description,
    image: row.image,
    targetUser: row.target_user,
    productIds: JSON.parse(row.product_ids_json || '[]'),
    adviceTips: JSON.parse(row.advice_tips_json || '[]'),
    status: row.status,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

contentRouter.get('/problems', (req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM problem_collections ORDER BY created_at ASC').all();
  res.json(rows.map(formatProblemRow));
});

contentRouter.get('/problems/:idOrSlug', (req: Request, res: Response) => {
  const p = req.params.idOrSlug;
  const row = db.prepare('SELECT * FROM problem_collections WHERE id = ? OR slug = ?').get(p, p);
  if (!row) {
    res.status(404).json({ error: 'Problem collection not found' });
    return;
  }
  res.json(formatProblemRow(row));
});

contentRouter.post('/problems', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), (req: AuthenticatedRequest, res: Response) => {
  const body = req.body;
  const user = req.user!;

  const id = body.id || 'prob_' + crypto.randomUUID().slice(0, 8);
  const slug = (body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).trim();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO problem_collections (
      id, slug, title, tagline, description, image, target_user,
      product_ids_json, advice_tips_json, status, seo_title, seo_description,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    slug,
    body.title,
    body.tagline || '',
    body.description || '',
    body.image || '/src/assets/images/nidpik_kitchen_small_1790936646322.jpg',
    body.targetUser || 'Indian urban households',
    JSON.stringify(body.productIds || []),
    JSON.stringify(body.adviceTips || []),
    body.status || 'DRAFT',
    body.seoTitle || `${body.title} | NIDPIK`,
    body.seoDescription || body.tagline || '',
    now,
    now
  );

  logAudit(user.id, user.email, 'PROBLEM_CREATED', 'problem', id, { title: body.title });
  const created = db.prepare('SELECT * FROM problem_collections WHERE id = ?').get(id);
  res.status(201).json(formatProblemRow(created));
});

contentRouter.put('/problems/:id', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const body = req.body;
  const user = req.user!;

  const existing = db.prepare('SELECT * FROM problem_collections WHERE id = ?').get(id) as any;
  if (!existing) {
    res.status(404).json({ error: 'Problem collection not found' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE problem_collections SET
      slug = ?, title = ?, tagline = ?, description = ?, image = ?, target_user = ?,
      product_ids_json = ?, advice_tips_json = ?, status = ?, seo_title = ?, seo_description = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    body.slug !== undefined ? body.slug : existing.slug,
    body.title !== undefined ? body.title : existing.title,
    body.tagline !== undefined ? body.tagline : existing.tagline,
    body.description !== undefined ? body.description : existing.description,
    body.image !== undefined ? body.image : existing.image,
    body.targetUser !== undefined ? body.targetUser : existing.target_user,
    body.productIds !== undefined ? JSON.stringify(body.productIds) : existing.product_ids_json,
    body.adviceTips !== undefined ? JSON.stringify(body.adviceTips) : existing.advice_tips_json,
    body.status !== undefined ? body.status : existing.status,
    body.seoTitle !== undefined ? body.seoTitle : existing.seo_title,
    body.seoDescription !== undefined ? body.seoDescription : existing.seo_description,
    now,
    id
  );

  logAudit(user.id, user.email, 'PROBLEM_UPDATED', 'problem', id, { title: body.title || existing.title });
  const updated = db.prepare('SELECT * FROM problem_collections WHERE id = ?').get(id);
  res.json(formatProblemRow(updated));
});

contentRouter.delete('/problems/:id', authenticate, requireRole(['OWNER', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  db.prepare('DELETE FROM problem_collections WHERE id = ?').run(id);
  logAudit(user.id, user.email, 'PROBLEM_DELETED', 'problem', id);
  res.json({ success: true });
});

// ==========================================
// BUDGET TIERS CRUD
// ==========================================
contentRouter.get('/budgets', (req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM budget_tiers ORDER BY amount ASC').all() as any[];
  res.json(rows.map(r => ({
    amount: Number(r.amount),
    title: r.title,
    slug: r.slug,
    headline: r.headline,
    description: r.description,
    recommendedCategory: r.recommended_category,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  })));
});

contentRouter.put('/budgets/:amount', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), (req: AuthenticatedRequest, res: Response) => {
  const amount = Number(req.params.amount);
  const body = req.body;
  const user = req.user!;

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE budget_tiers SET
      title = ?, headline = ?, description = ?, recommended_category = ?, updated_at = ?
    WHERE amount = ?
  `).run(
    body.title,
    body.headline,
    body.description,
    body.recommendedCategory,
    now,
    amount
  );

  logAudit(user.id, user.email, 'BUDGET_UPDATED', 'budget', String(amount));
  const updated = db.prepare('SELECT * FROM budget_tiers WHERE amount = ?').get(amount);
  res.json(updated);
});
