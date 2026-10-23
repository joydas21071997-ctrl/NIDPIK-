import { Router, Request, Response } from 'express';
import { eq, or, desc, asc } from 'drizzle-orm';
import { db } from '../../src/db/index';
import * as schema from '../../src/db/schema';
import { authenticate, AuthenticatedRequest, requireRole, logAudit } from '../auth';
import crypto from 'crypto';

export const contentRouter = Router();

// ==========================================
// ARTICLES CRUD
// ==========================================
export function formatArticleRow(row: any) {
  if (!row) return null;
  const contentJson = row.contentJson ?? row.content_json ?? '[]';
  const tagsJson = row.tagsJson ?? row.tags_json ?? '[]';
  const recommendedProductIdsJson = row.recommendedProductIdsJson ?? row.recommended_product_ids_json ?? '[]';

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    categorySlug: row.categorySlug ?? row.category_slug,
    excerpt: row.excerpt,
    authorId: row.authorId ?? row.author_id,
    publishedAt: row.publishedAt ?? row.published_at,
    updatedAt: row.updatedAt ?? row.updated_at,
    readingTime: row.readingTime ?? row.reading_time,
    image: row.image,
    content: typeof contentJson === 'string' ? JSON.parse(contentJson) : contentJson,
    tags: typeof tagsJson === 'string' ? JSON.parse(tagsJson) : tagsJson,
    recommendedProductIds: typeof recommendedProductIdsJson === 'string' ? JSON.parse(recommendedProductIdsJson) : recommendedProductIdsJson,
    status: row.status,
    seoTitle: row.seoTitle ?? row.seo_title,
    seoDescription: row.seoDescription ?? row.seo_description,
    canonicalUrl: row.canonicalUrl ?? row.canonical_url,
    ogImage: row.ogImage ?? row.og_image,
    createdAt: row.createdAt ?? row.created_at
  };
}

contentRouter.get('/articles', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    let queryBuilder = db.select().from(schema.articles);

    if (status && status !== 'all') {
      queryBuilder = queryBuilder.where(eq(schema.articles.status, String(status))) as any;
    }

    const rows = await queryBuilder.orderBy(desc(schema.articles.createdAt));
    res.json(rows.map(formatArticleRow));
  } catch (err: any) {
    console.error('[GET ARTICLES ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

contentRouter.get('/articles/:idOrSlug', async (req: Request, res: Response) => {
  try {
    const p = req.params.idOrSlug;
    const rows = await db
      .select()
      .from(schema.articles)
      .where(or(eq(schema.articles.id, p), eq(schema.articles.slug, p)))
      .limit(1);

    const row = rows[0];
    if (!row) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }
    res.json(formatArticleRow(row));
  } catch (err: any) {
    console.error('[GET ARTICLE ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

contentRouter.post('/articles', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = req.body;
    const user = req.user!;

    if (!body.title || !body.category) {
      res.status(400).json({ error: 'Title and category are required' });
      return;
    }

    const id = body.id || 'art_' + crypto.randomUUID().slice(0, 8);
    const slug = (body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).trim();
    const now = new Date().toISOString();

    await db.insert(schema.articles).values({
      id,
      slug,
      title: body.title,
      category: body.category,
      categorySlug: body.categorySlug || body.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      excerpt: body.excerpt || '',
      authorId: body.authorId || 'rahul-sharma',
      publishedAt: body.publishedAt || now,
      updatedAt: now,
      readingTime: body.readingTime || '5 min read',
      image: body.image || '/src/assets/images/nidpik_hero_showcase_1790936631391.jpg',
      contentJson: JSON.stringify(Array.isArray(body.content) ? body.content : (body.content ? body.content.split('\n\n') : [])),
      tagsJson: JSON.stringify(body.tags || []),
      recommendedProductIdsJson: JSON.stringify(body.recommendedProductIds || []),
      status: body.status || 'DRAFT',
      seoTitle: body.seoTitle || `${body.title} | NIDPIK`,
      seoDescription: body.seoDescription || body.excerpt || '',
      canonicalUrl: body.canonicalUrl || `https://nidpik.in/articles/${slug}`,
      ogImage: body.ogImage || body.image || '',
      createdAt: now
    });

    await logAudit(user.id, user.email, 'ARTICLE_CREATED', 'article', id, { title: body.title });
    const createdRows = await db.select().from(schema.articles).where(eq(schema.articles.id, id)).limit(1);
    res.status(201).json(formatArticleRow(createdRows[0]));
  } catch (err: any) {
    console.error('[CREATE ARTICLE ERROR]', err);
    res.status(500).json({ error: 'Failed to create article' });
  }
});

contentRouter.put('/articles/:id', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const user = req.user!;

    const existingRows = await db.select().from(schema.articles).where(eq(schema.articles.id, id)).limit(1);
    const existing = existingRows[0];
    if (!existing) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }

    const now = new Date().toISOString();
    await db.update(schema.articles).set({
      slug: body.slug !== undefined ? body.slug : existing.slug,
      title: body.title !== undefined ? body.title : existing.title,
      category: body.category !== undefined ? body.category : existing.category,
      categorySlug: body.categorySlug !== undefined ? body.categorySlug : existing.categorySlug,
      excerpt: body.excerpt !== undefined ? body.excerpt : existing.excerpt,
      authorId: body.authorId !== undefined ? body.authorId : existing.authorId,
      updatedAt: now,
      readingTime: body.readingTime !== undefined ? body.readingTime : existing.readingTime,
      image: body.image !== undefined ? body.image : existing.image,
      contentJson: body.content !== undefined ? JSON.stringify(Array.isArray(body.content) ? body.content : body.content.split('\n\n')) : existing.contentJson,
      tagsJson: body.tags !== undefined ? JSON.stringify(body.tags) : existing.tagsJson,
      recommendedProductIdsJson: body.recommendedProductIds !== undefined ? JSON.stringify(body.recommendedProductIds) : existing.recommendedProductIdsJson,
      status: body.status !== undefined ? body.status : existing.status,
      seoTitle: body.seoTitle !== undefined ? body.seoTitle : existing.seoTitle,
      seoDescription: body.seoDescription !== undefined ? body.seoDescription : existing.seoDescription,
      canonicalUrl: body.canonicalUrl !== undefined ? body.canonicalUrl : existing.canonicalUrl,
      ogImage: body.ogImage !== undefined ? body.ogImage : existing.ogImage
    }).where(eq(schema.articles.id, id));

    await logAudit(user.id, user.email, 'ARTICLE_UPDATED', 'article', id, { title: body.title || existing.title });
    const updatedRows = await db.select().from(schema.articles).where(eq(schema.articles.id, id)).limit(1);
    res.json(formatArticleRow(updatedRows[0]));
  } catch (err: any) {
    console.error('[UPDATE ARTICLE ERROR]', err);
    res.status(500).json({ error: 'Failed to update article' });
  }
});

contentRouter.delete('/articles/:id', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    await db.delete(schema.articles).where(eq(schema.articles.id, id));
    await logAudit(user.id, user.email, 'ARTICLE_DELETED', 'article', id);
    res.json({ success: true });
  } catch (err: any) {
    console.error('[DELETE ARTICLE ERROR]', err);
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

// ==========================================
// BUYING GUIDES CRUD
// ==========================================
export function formatGuideRow(row: any) {
  if (!row) return null;
  const featuredProductIdsJson = row.featuredProductIdsJson ?? row.featured_product_ids_json ?? '[]';
  const whatToLookForJson = row.whatToLookForJson ?? row.what_to_look_for_json ?? '[]';
  const faqsJson = row.faqsJson ?? row.faqs_json ?? '[]';

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    categorySlug: row.categorySlug ?? row.category_slug,
    subtitle: row.subtitle,
    quickAnswer: row.quickAnswer ?? row.quick_answer,
    authorId: row.authorId ?? row.author_id,
    publishedAt: row.publishedAt ?? row.published_at,
    updatedAt: row.updatedAt ?? row.updated_at,
    readingTime: row.readingTime ?? row.reading_time,
    featuredProductIds: typeof featuredProductIdsJson === 'string' ? JSON.parse(featuredProductIdsJson) : featuredProductIdsJson,
    budgetRange: row.budgetRange ?? row.budget_range,
    whatToLookFor: typeof whatToLookForJson === 'string' ? JSON.parse(whatToLookForJson) : whatToLookForJson,
    whoShouldBuy: row.whoShouldBuy ?? row.who_should_buy,
    whoShouldSkip: row.whoShouldSkip ?? row.who_should_skip,
    faqs: typeof faqsJson === 'string' ? JSON.parse(faqsJson) : faqsJson,
    status: row.status,
    seoTitle: row.seoTitle ?? row.seo_title,
    seoDescription: row.seoDescription ?? row.seo_description,
    canonicalUrl: row.canonicalUrl ?? row.canonical_url,
    ogImage: row.ogImage ?? row.og_image,
    createdAt: row.createdAt ?? row.created_at
  };
}

contentRouter.get('/guides', async (req: Request, res: Response) => {
  try {
    const rows = await db.select().from(schema.buyingGuides).orderBy(desc(schema.buyingGuides.createdAt));
    res.json(rows.map(formatGuideRow));
  } catch (err: any) {
    console.error('[GET GUIDES ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch guides' });
  }
});

contentRouter.get('/guides/:idOrSlug', async (req: Request, res: Response) => {
  try {
    const p = req.params.idOrSlug;
    const rows = await db
      .select()
      .from(schema.buyingGuides)
      .where(or(eq(schema.buyingGuides.id, p), eq(schema.buyingGuides.slug, p)))
      .limit(1);

    const row = rows[0];
    if (!row) {
      res.status(404).json({ error: 'Guide not found' });
      return;
    }
    res.json(formatGuideRow(row));
  } catch (err: any) {
    console.error('[GET GUIDE ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch guide' });
  }
});

contentRouter.post('/guides', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = req.body;
    const user = req.user!;

    const id = body.id || 'guide_' + crypto.randomUUID().slice(0, 8);
    const slug = (body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).trim();
    const now = new Date().toISOString();

    await db.insert(schema.buyingGuides).values({
      id,
      slug,
      title: body.title,
      category: body.category,
      categorySlug: body.categorySlug || body.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      subtitle: body.subtitle || '',
      quickAnswer: body.quickAnswer || '',
      authorId: body.authorId || 'rahul-sharma',
      publishedAt: now,
      updatedAt: now,
      readingTime: body.readingTime || '6 min read',
      featuredProductIdsJson: JSON.stringify(body.featuredProductIds || []),
      budgetRange: body.budgetRange || 'Under ₹2,000',
      whatToLookForJson: JSON.stringify(body.whatToLookFor || []),
      whoShouldBuy: body.whoShouldBuy || '',
      whoShouldSkip: body.whoShouldSkip || '',
      faqsJson: JSON.stringify(body.faqs || []),
      status: body.status || 'DRAFT',
      seoTitle: body.seoTitle || `${body.title} | NIDPIK Guide`,
      seoDescription: body.seoDescription || body.subtitle || '',
      canonicalUrl: body.canonicalUrl || `https://nidpik.in/buying-guides/${slug}`,
      ogImage: body.ogImage || null,
      createdAt: now
    });

    await logAudit(user.id, user.email, 'GUIDE_CREATED', 'guide', id, { title: body.title });
    const createdRows = await db.select().from(schema.buyingGuides).where(eq(schema.buyingGuides.id, id)).limit(1);
    res.status(201).json(formatGuideRow(createdRows[0]));
  } catch (err: any) {
    console.error('[CREATE GUIDE ERROR]', err);
    res.status(500).json({ error: 'Failed to create guide' });
  }
});

contentRouter.put('/guides/:id', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const user = req.user!;

    const existingRows = await db.select().from(schema.buyingGuides).where(eq(schema.buyingGuides.id, id)).limit(1);
    const existing = existingRows[0];
    if (!existing) {
      res.status(404).json({ error: 'Guide not found' });
      return;
    }

    const now = new Date().toISOString();
    await db.update(schema.buyingGuides).set({
      slug: body.slug !== undefined ? body.slug : existing.slug,
      title: body.title !== undefined ? body.title : existing.title,
      category: body.category !== undefined ? body.category : existing.category,
      categorySlug: body.categorySlug !== undefined ? body.categorySlug : existing.categorySlug,
      subtitle: body.subtitle !== undefined ? body.subtitle : existing.subtitle,
      quickAnswer: body.quickAnswer !== undefined ? body.quickAnswer : existing.quickAnswer,
      authorId: body.authorId !== undefined ? body.authorId : existing.authorId,
      updatedAt: now,
      readingTime: body.readingTime !== undefined ? body.readingTime : existing.readingTime,
      featuredProductIdsJson: body.featuredProductIds !== undefined ? JSON.stringify(body.featuredProductIds) : existing.featuredProductIdsJson,
      budgetRange: body.budgetRange !== undefined ? body.budgetRange : existing.budgetRange,
      whatToLookForJson: body.whatToLookFor !== undefined ? JSON.stringify(body.whatToLookFor) : existing.whatToLookForJson,
      whoShouldBuy: body.whoShouldBuy !== undefined ? body.whoShouldBuy : existing.whoShouldBuy,
      whoShouldSkip: body.whoShouldSkip !== undefined ? body.whoShouldSkip : existing.whoShouldSkip,
      faqsJson: body.faqs !== undefined ? JSON.stringify(body.faqs) : existing.faqsJson,
      status: body.status !== undefined ? body.status : existing.status,
      seoTitle: body.seoTitle !== undefined ? body.seoTitle : existing.seoTitle,
      seoDescription: body.seoDescription !== undefined ? body.seoDescription : existing.seoDescription,
      canonicalUrl: body.canonicalUrl !== undefined ? body.canonicalUrl : existing.canonicalUrl,
      ogImage: body.ogImage !== undefined ? body.ogImage : existing.ogImage
    }).where(eq(schema.buyingGuides.id, id));

    await logAudit(user.id, user.email, 'GUIDE_UPDATED', 'guide', id, { title: body.title || existing.title });
    const updatedRows = await db.select().from(schema.buyingGuides).where(eq(schema.buyingGuides.id, id)).limit(1);
    res.json(formatGuideRow(updatedRows[0]));
  } catch (err: any) {
    console.error('[UPDATE GUIDE ERROR]', err);
    res.status(500).json({ error: 'Failed to update guide' });
  }
});

contentRouter.delete('/guides/:id', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    await db.delete(schema.buyingGuides).where(eq(schema.buyingGuides.id, id));
    await logAudit(user.id, user.email, 'GUIDE_DELETED', 'guide', id);
    res.json({ success: true });
  } catch (err: any) {
    console.error('[DELETE GUIDE ERROR]', err);
    res.status(500).json({ error: 'Failed to delete guide' });
  }
});

// ==========================================
// COMPARISONS CRUD
// ==========================================
export function formatComparisonRow(row: any) {
  if (!row) return null;
  const productIdsJson = row.productIdsJson ?? row.product_ids_json ?? '[]';
  const comparisonPointsJson = row.comparisonPointsJson ?? row.comparison_points_json ?? '[]';

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    category: row.category,
    categorySlug: row.categorySlug ?? row.category_slug,
    productIds: typeof productIdsJson === 'string' ? JSON.parse(productIdsJson) : productIdsJson,
    winnerProductId: (row.winnerProductId ?? row.winner_product_id) || undefined,
    verdictSummary: row.verdictSummary ?? row.verdict_summary,
    comparisonPoints: typeof comparisonPointsJson === 'string' ? JSON.parse(comparisonPointsJson) : comparisonPointsJson,
    authorId: row.authorId ?? row.author_id,
    updatedAt: row.updatedAt ?? row.updated_at,
    status: row.status,
    seoTitle: row.seoTitle ?? row.seo_title,
    seoDescription: row.seoDescription ?? row.seo_description,
    canonicalUrl: row.canonicalUrl ?? row.canonical_url,
    ogImage: row.ogImage ?? row.og_image,
    createdAt: row.createdAt ?? row.created_at
  };
}

contentRouter.get('/comparisons', async (req: Request, res: Response) => {
  try {
    const rows = await db.select().from(schema.comparisons).orderBy(desc(schema.comparisons.createdAt));
    res.json(rows.map(formatComparisonRow));
  } catch (err: any) {
    console.error('[GET COMPARISONS ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch comparisons' });
  }
});

contentRouter.get('/comparisons/:idOrSlug', async (req: Request, res: Response) => {
  try {
    const p = req.params.idOrSlug;
    const rows = await db
      .select()
      .from(schema.comparisons)
      .where(or(eq(schema.comparisons.id, p), eq(schema.comparisons.slug, p)))
      .limit(1);

    const row = rows[0];
    if (!row) {
      res.status(404).json({ error: 'Comparison not found' });
      return;
    }
    res.json(formatComparisonRow(row));
  } catch (err: any) {
    console.error('[GET COMPARISON ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch comparison' });
  }
});

contentRouter.post('/comparisons', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = req.body;
    const user = req.user!;

    const id = body.id || 'comp_' + crypto.randomUUID().slice(0, 8);
    const slug = (body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).trim();
    const now = new Date().toISOString();

    await db.insert(schema.comparisons).values({
      id,
      slug,
      title: body.title,
      subtitle: body.subtitle || '',
      category: body.category,
      categorySlug: body.categorySlug || body.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      productIdsJson: JSON.stringify(body.productIds || []),
      winnerProductId: body.winnerProductId || null,
      verdictSummary: body.verdictSummary || '',
      comparisonPointsJson: JSON.stringify(body.comparisonPoints || []),
      authorId: body.authorId || 'rahul-sharma',
      updatedAt: now,
      status: body.status || 'DRAFT',
      seoTitle: body.seoTitle || `${body.title} | NIDPIK`,
      seoDescription: body.seoDescription || body.verdictSummary || '',
      canonicalUrl: body.canonicalUrl || `https://nidpik.in/compare/${slug}`,
      ogImage: body.ogImage || null,
      createdAt: now
    });

    await logAudit(user.id, user.email, 'COMPARISON_CREATED', 'comparison', id, { title: body.title });
    const createdRows = await db.select().from(schema.comparisons).where(eq(schema.comparisons.id, id)).limit(1);
    res.status(201).json(formatComparisonRow(createdRows[0]));
  } catch (err: any) {
    console.error('[CREATE COMPARISON ERROR]', err);
    res.status(500).json({ error: 'Failed to create comparison' });
  }
});

contentRouter.put('/comparisons/:id', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const user = req.user!;

    const existingRows = await db.select().from(schema.comparisons).where(eq(schema.comparisons.id, id)).limit(1);
    const existing = existingRows[0];
    if (!existing) {
      res.status(404).json({ error: 'Comparison not found' });
      return;
    }

    const now = new Date().toISOString();
    await db.update(schema.comparisons).set({
      slug: body.slug !== undefined ? body.slug : existing.slug,
      title: body.title !== undefined ? body.title : existing.title,
      subtitle: body.subtitle !== undefined ? body.subtitle : existing.subtitle,
      category: body.category !== undefined ? body.category : existing.category,
      categorySlug: body.categorySlug !== undefined ? body.categorySlug : existing.categorySlug,
      productIdsJson: body.productIds !== undefined ? JSON.stringify(body.productIds) : existing.productIdsJson,
      winnerProductId: body.winnerProductId !== undefined ? body.winnerProductId : existing.winnerProductId,
      verdictSummary: body.verdictSummary !== undefined ? body.verdictSummary : existing.verdictSummary,
      comparisonPointsJson: body.comparisonPoints !== undefined ? JSON.stringify(body.comparisonPoints) : existing.comparisonPointsJson,
      authorId: body.authorId !== undefined ? body.authorId : existing.authorId,
      updatedAt: now,
      status: body.status !== undefined ? body.status : existing.status,
      seoTitle: body.seoTitle !== undefined ? body.seoTitle : existing.seoTitle,
      seoDescription: body.seoDescription !== undefined ? body.seoDescription : existing.seoDescription,
      canonicalUrl: body.canonicalUrl !== undefined ? body.canonicalUrl : existing.canonicalUrl,
      ogImage: body.ogImage !== undefined ? body.ogImage : existing.ogImage
    }).where(eq(schema.comparisons.id, id));

    await logAudit(user.id, user.email, 'COMPARISON_UPDATED', 'comparison', id, { title: body.title || existing.title });
    const updatedRows = await db.select().from(schema.comparisons).where(eq(schema.comparisons.id, id)).limit(1);
    res.json(formatComparisonRow(updatedRows[0]));
  } catch (err: any) {
    console.error('[UPDATE COMPARISON ERROR]', err);
    res.status(500).json({ error: 'Failed to update comparison' });
  }
});

contentRouter.delete('/comparisons/:id', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    await db.delete(schema.comparisons).where(eq(schema.comparisons.id, id));
    await logAudit(user.id, user.email, 'COMPARISON_DELETED', 'comparison', id);
    res.json({ success: true });
  } catch (err: any) {
    console.error('[DELETE COMPARISON ERROR]', err);
    res.status(500).json({ error: 'Failed to delete comparison' });
  }
});

// ==========================================
// REVIEWS CRUD
// ==========================================
export function formatReviewRow(row: any) {
  if (!row) return null;
  const whatWeLikedJson = row.whatWeLikedJson ?? row.what_we_liked_json ?? '[]';
  const whatWeDidNotLikeJson = row.whatWeDidNotLikeJson ?? row.what_we_did_not_like_json ?? '[]';

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    productId: row.productId ?? row.product_id,
    authorId: row.authorId ?? row.author_id,
    updatedAt: row.updatedAt ?? row.updated_at,
    readingTime: row.readingTime ?? row.reading_time,
    verdict: row.verdict,
    whoItIsFor: row.whoItIsFor ?? row.who_it_is_for,
    whatWeLiked: typeof whatWeLikedJson === 'string' ? JSON.parse(whatWeLikedJson) : whatWeLikedJson,
    whatWeDidNotLike: typeof whatWeDidNotLikeJson === 'string' ? JSON.parse(whatWeDidNotLikeJson) : whatWeDidNotLikeJson,
    inDepthTesting: row.inDepthTesting ?? row.in_depth_testing,
    finalRatingText: row.finalRatingText ?? row.final_rating_text,
    status: row.status,
    seoTitle: row.seoTitle ?? row.seo_title,
    seoDescription: row.seoDescription ?? row.seo_description,
    canonicalUrl: row.canonicalUrl ?? row.canonical_url,
    ogImage: row.ogImage ?? row.og_image,
    createdAt: row.createdAt ?? row.created_at
  };
}

contentRouter.get('/reviews', async (req: Request, res: Response) => {
  try {
    const rows = await db.select().from(schema.reviews).orderBy(desc(schema.reviews.createdAt));
    res.json(rows.map(formatReviewRow));
  } catch (err: any) {
    console.error('[GET REVIEWS ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

contentRouter.get('/reviews/:idOrSlug', async (req: Request, res: Response) => {
  try {
    const p = req.params.idOrSlug;
    const rows = await db
      .select()
      .from(schema.reviews)
      .where(or(eq(schema.reviews.id, p), eq(schema.reviews.slug, p)))
      .limit(1);

    const row = rows[0];
    if (!row) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }
    res.json(formatReviewRow(row));
  } catch (err: any) {
    console.error('[GET REVIEW ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});

contentRouter.post('/reviews', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = req.body;
    const user = req.user!;

    const id = body.id || 'rev_' + crypto.randomUUID().slice(0, 8);
    const slug = (body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).trim();
    const now = new Date().toISOString();

    await db.insert(schema.reviews).values({
      id,
      slug,
      title: body.title,
      productId: body.productId,
      authorId: body.authorId || 'rahul-sharma',
      updatedAt: now,
      readingTime: body.readingTime || '5 min read',
      verdict: body.verdict || '',
      whoItIsFor: body.whoItIsFor || '',
      whatWeLikedJson: JSON.stringify(body.whatWeLiked || []),
      whatWeDidNotLikeJson: JSON.stringify(body.whatWeDidNotLike || []),
      inDepthTesting: body.inDepthTesting || '',
      finalRatingText: body.finalRatingText || 'Editor Score: 4.8 / 5.0',
      status: body.status || 'DRAFT',
      seoTitle: body.seoTitle || `${body.title} | NIDPIK`,
      seoDescription: body.seoDescription || body.verdict || '',
      canonicalUrl: body.canonicalUrl || `https://nidpik.in/reviews/${slug}`,
      ogImage: body.ogImage || null,
      createdAt: now
    });

    await logAudit(user.id, user.email, 'REVIEW_CREATED', 'review', id, { title: body.title });
    const createdRows = await db.select().from(schema.reviews).where(eq(schema.reviews.id, id)).limit(1);
    res.status(201).json(formatReviewRow(createdRows[0]));
  } catch (err: any) {
    console.error('[CREATE REVIEW ERROR]', err);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

contentRouter.put('/reviews/:id', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const user = req.user!;

    const existingRows = await db.select().from(schema.reviews).where(eq(schema.reviews.id, id)).limit(1);
    const existing = existingRows[0];
    if (!existing) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    const now = new Date().toISOString();
    await db.update(schema.reviews).set({
      slug: body.slug !== undefined ? body.slug : existing.slug,
      title: body.title !== undefined ? body.title : existing.title,
      productId: body.productId !== undefined ? body.productId : existing.productId,
      authorId: body.authorId !== undefined ? body.authorId : existing.authorId,
      updatedAt: now,
      readingTime: body.readingTime !== undefined ? body.readingTime : existing.readingTime,
      verdict: body.verdict !== undefined ? body.verdict : existing.verdict,
      whoItIsFor: body.whoItIsFor !== undefined ? body.whoItIsFor : existing.whoItIsFor,
      whatWeLikedJson: body.whatWeLiked !== undefined ? JSON.stringify(body.whatWeLiked) : existing.whatWeLikedJson,
      whatWeDidNotLikeJson: body.whatWeDidNotLike !== undefined ? JSON.stringify(body.whatWeDidNotLike) : existing.whatWeDidNotLikeJson,
      inDepthTesting: body.inDepthTesting !== undefined ? body.inDepthTesting : existing.inDepthTesting,
      finalRatingText: body.finalRatingText !== undefined ? body.finalRatingText : existing.finalRatingText,
      status: body.status !== undefined ? body.status : existing.status,
      seoTitle: body.seoTitle !== undefined ? body.seoTitle : existing.seoTitle,
      seoDescription: body.seoDescription !== undefined ? body.seoDescription : existing.seoDescription,
      canonicalUrl: body.canonicalUrl !== undefined ? body.canonicalUrl : existing.canonicalUrl,
      ogImage: body.ogImage !== undefined ? body.ogImage : existing.ogImage
    }).where(eq(schema.reviews.id, id));

    await logAudit(user.id, user.email, 'REVIEW_UPDATED', 'review', id, { title: body.title || existing.title });
    const updatedRows = await db.select().from(schema.reviews).where(eq(schema.reviews.id, id)).limit(1);
    res.json(formatReviewRow(updatedRows[0]));
  } catch (err: any) {
    console.error('[UPDATE REVIEW ERROR]', err);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

contentRouter.delete('/reviews/:id', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    await db.delete(schema.reviews).where(eq(schema.reviews.id, id));
    await logAudit(user.id, user.email, 'REVIEW_DELETED', 'review', id);
    res.json({ success: true });
  } catch (err: any) {
    console.error('[DELETE REVIEW ERROR]', err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// ==========================================
// PROBLEM COLLECTIONS CRUD
// ==========================================
export function formatProblemRow(row: any) {
  if (!row) return null;
  const productIdsJson = row.productIdsJson ?? row.product_ids_json ?? '[]';
  const adviceTipsJson = row.adviceTipsJson ?? row.advice_tips_json ?? '[]';

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    tagline: row.tagline,
    description: row.description,
    image: row.image,
    targetUser: row.targetUser ?? row.target_user,
    productIds: typeof productIdsJson === 'string' ? JSON.parse(productIdsJson) : productIdsJson,
    adviceTips: typeof adviceTipsJson === 'string' ? JSON.parse(adviceTipsJson) : adviceTipsJson,
    status: row.status,
    seoTitle: row.seoTitle ?? row.seo_title,
    seoDescription: row.seoDescription ?? row.seo_description,
    createdAt: row.createdAt ?? row.created_at,
    updatedAt: row.updatedAt ?? row.updated_at
  };
}

contentRouter.get('/problems', async (req: Request, res: Response) => {
  try {
    const rows = await db.select().from(schema.problemCollections).orderBy(asc(schema.problemCollections.createdAt));
    res.json(rows.map(formatProblemRow));
  } catch (err: any) {
    console.error('[GET PROBLEMS ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch problem collections' });
  }
});

contentRouter.get('/problems/:idOrSlug', async (req: Request, res: Response) => {
  try {
    const p = req.params.idOrSlug;
    const rows = await db
      .select()
      .from(schema.problemCollections)
      .where(or(eq(schema.problemCollections.id, p), eq(schema.problemCollections.slug, p)))
      .limit(1);

    const row = rows[0];
    if (!row) {
      res.status(404).json({ error: 'Problem collection not found' });
      return;
    }
    res.json(formatProblemRow(row));
  } catch (err: any) {
    console.error('[GET PROBLEM ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch problem collection' });
  }
});

contentRouter.post('/problems', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = req.body;
    const user = req.user!;

    const id = body.id || 'prob_' + crypto.randomUUID().slice(0, 8);
    const slug = (body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).trim();
    const now = new Date().toISOString();

    await db.insert(schema.problemCollections).values({
      id,
      slug,
      title: body.title,
      tagline: body.tagline || '',
      description: body.description || '',
      image: body.image || '/src/assets/images/nidpik_kitchen_small_1790936646322.jpg',
      targetUser: body.targetUser || 'Indian urban households',
      productIdsJson: JSON.stringify(body.productIds || []),
      adviceTipsJson: JSON.stringify(body.adviceTips || []),
      status: body.status || 'DRAFT',
      seoTitle: body.seoTitle || `${body.title} | NIDPIK`,
      seoDescription: body.seoDescription || body.tagline || '',
      createdAt: now,
      updatedAt: now
    });

    await logAudit(user.id, user.email, 'PROBLEM_CREATED', 'problem', id, { title: body.title });
    const createdRows = await db.select().from(schema.problemCollections).where(eq(schema.problemCollections.id, id)).limit(1);
    res.status(201).json(formatProblemRow(createdRows[0]));
  } catch (err: any) {
    console.error('[CREATE PROBLEM ERROR]', err);
    res.status(500).json({ error: 'Failed to create problem collection' });
  }
});

contentRouter.put('/problems/:id', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const user = req.user!;

    const existingRows = await db.select().from(schema.problemCollections).where(eq(schema.problemCollections.id, id)).limit(1);
    const existing = existingRows[0];
    if (!existing) {
      res.status(404).json({ error: 'Problem collection not found' });
      return;
    }

    const now = new Date().toISOString();
    await db.update(schema.problemCollections).set({
      slug: body.slug !== undefined ? body.slug : existing.slug,
      title: body.title !== undefined ? body.title : existing.title,
      tagline: body.tagline !== undefined ? body.tagline : existing.tagline,
      description: body.description !== undefined ? body.description : existing.description,
      image: body.image !== undefined ? body.image : existing.image,
      targetUser: body.targetUser !== undefined ? body.targetUser : existing.targetUser,
      productIdsJson: body.productIds !== undefined ? JSON.stringify(body.productIds) : existing.productIdsJson,
      adviceTipsJson: body.adviceTips !== undefined ? JSON.stringify(body.adviceTips) : existing.adviceTipsJson,
      status: body.status !== undefined ? body.status : existing.status,
      seoTitle: body.seoTitle !== undefined ? body.seoTitle : existing.seoTitle,
      seoDescription: body.seoDescription !== undefined ? body.seoDescription : existing.seoDescription,
      updatedAt: now
    }).where(eq(schema.problemCollections.id, id));

    await logAudit(user.id, user.email, 'PROBLEM_UPDATED', 'problem', id, { title: body.title || existing.title });
    const updatedRows = await db.select().from(schema.problemCollections).where(eq(schema.problemCollections.id, id)).limit(1);
    res.json(formatProblemRow(updatedRows[0]));
  } catch (err: any) {
    console.error('[UPDATE PROBLEM ERROR]', err);
    res.status(500).json({ error: 'Failed to update problem collection' });
  }
});

contentRouter.delete('/problems/:id', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    await db.delete(schema.problemCollections).where(eq(schema.problemCollections.id, id));
    await logAudit(user.id, user.email, 'PROBLEM_DELETED', 'problem', id);
    res.json({ success: true });
  } catch (err: any) {
    console.error('[DELETE PROBLEM ERROR]', err);
    res.status(500).json({ error: 'Failed to delete problem collection' });
  }
});

// ==========================================
// BUDGET TIERS CRUD
// ==========================================
contentRouter.get('/budgets', async (req: Request, res: Response) => {
  try {
    const rows = await db.select().from(schema.budgetTiers).orderBy(asc(schema.budgetTiers.amount));
    res.json(rows.map(r => ({
      amount: Number(r.amount),
      title: r.title,
      slug: r.slug,
      headline: r.headline,
      description: r.description,
      recommendedCategory: r.recommendedCategory,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    })));
  } catch (err: any) {
    console.error('[GET BUDGETS ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch budget tiers' });
  }
});

contentRouter.put('/budgets/:amount', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const amount = Number(req.params.amount);
    const body = req.body;
    const user = req.user!;

    const now = new Date().toISOString();
    await db.update(schema.budgetTiers).set({
      title: body.title,
      headline: body.headline,
      description: body.description,
      recommendedCategory: body.recommendedCategory,
      updatedAt: now
    }).where(eq(schema.budgetTiers.amount, amount));

    await logAudit(user.id, user.email, 'BUDGET_UPDATED', 'budget', String(amount));
    const updatedRows = await db.select().from(schema.budgetTiers).where(eq(schema.budgetTiers.amount, amount)).limit(1);
    res.json(updatedRows[0]);
  } catch (err: any) {
    console.error('[UPDATE BUDGET ERROR]', err);
    res.status(500).json({ error: 'Failed to update budget tier' });
  }
});

