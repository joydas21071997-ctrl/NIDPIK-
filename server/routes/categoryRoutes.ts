import { Router, Request, Response } from 'express';
import { eq, or, asc, count as sqlCount } from 'drizzle-orm';
import { db } from '../../src/db/index';
import * as schema from '../../src/db/schema';
import { authenticate, AuthenticatedRequest, requireRole, logAudit } from '../auth';
import crypto from 'crypto';

export const categoryRouter = Router();

export function formatCategoryRow(row: any) {
  if (!row) return null;
  const subcategoriesJson = row.subcategoriesJson ?? row.subcategories_json ?? '[]';
  const featuredProductIdsJson = row.featuredProductIdsJson ?? row.featured_product_ids_json ?? '[]';
  const faqsJson = row.faqsJson ?? row.faqs_json ?? '[]';

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    iconName: row.iconName ?? row.icon_name,
    image: row.image || undefined,
    subcategories: typeof subcategoriesJson === 'string' ? JSON.parse(subcategoriesJson) : subcategoriesJson,
    featuredProductIds: typeof featuredProductIdsJson === 'string' ? JSON.parse(featuredProductIdsJson) : featuredProductIdsJson,
    faqs: typeof faqsJson === 'string' ? JSON.parse(faqsJson) : faqsJson,
    isFeatured: Boolean(row.isFeatured ?? row.is_featured),
    orderIndex: Number(row.orderIndex ?? row.order_index),
    seoTitle: (row.seoTitle ?? row.seo_title) || undefined,
    seoDescription: (row.seoDescription ?? row.seo_description) || undefined,
    status: row.status,
    createdAt: row.createdAt ?? row.created_at,
    updatedAt: row.updatedAt ?? row.updated_at
  };
}

// GET /api/categories
categoryRouter.get('/', async (req: Request, res: Response) => {
  try {
    const rows = await db.select().from(schema.categories).orderBy(asc(schema.categories.orderIndex));
    res.json(rows.map(formatCategoryRow));
  } catch (err: any) {
    console.error('[GET CATEGORIES ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/categories/:idOrSlug
categoryRouter.get('/:idOrSlug', async (req: Request, res: Response) => {
  try {
    const param = req.params.idOrSlug;
    const rows = await db
      .select()
      .from(schema.categories)
      .where(or(eq(schema.categories.id, param), eq(schema.categories.slug, param)))
      .limit(1);

    const row = rows[0];
    if (!row) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.json(formatCategoryRow(row));
  } catch (err: any) {
    console.error('[GET CATEGORY ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// POST /api/categories
categoryRouter.post('/', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = req.body;
    const user = req.user!;

    if (!body.name) {
      res.status(400).json({ error: 'Category name is required' });
      return;
    }

    const id = body.id || 'cat_' + crypto.randomUUID().slice(0, 8);
    const slug = (body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).trim();
    const now = new Date().toISOString();

    const countRes = await db.select({ count: sqlCount() }).from(schema.categories);
    const orderIdx = body.orderIndex !== undefined ? Number(body.orderIndex) : Number(countRes[0]?.count || 0);

    await db.insert(schema.categories).values({
      id,
      slug,
      name: body.name,
      description: body.description || '',
      iconName: body.iconName || 'LayoutGrid',
      image: body.image || null,
      subcategoriesJson: JSON.stringify(body.subcategories || []),
      featuredProductIdsJson: JSON.stringify(body.featuredProductIds || []),
      faqsJson: JSON.stringify(body.faqs || []),
      isFeatured: body.isFeatured ? 1 : 0,
      orderIndex: orderIdx,
      seoTitle: body.seoTitle || `${body.name} - Buying Guides & Recommendations | NIDPIK`,
      seoDescription: body.seoDescription || body.description || '',
      status: 'PUBLISHED',
      createdAt: now,
      updatedAt: now
    });

    await logAudit(user.id, user.email, 'CATEGORY_CREATED', 'category', id, { name: body.name });
    const createdRows = await db.select().from(schema.categories).where(eq(schema.categories.id, id)).limit(1);
    res.status(201).json(formatCategoryRow(createdRows[0]));
  } catch (err: any) {
    console.error('[CREATE CATEGORY ERROR]', err);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /api/categories/:id
categoryRouter.put('/:id', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const user = req.user!;

    const existingRows = await db.select().from(schema.categories).where(eq(schema.categories.id, id)).limit(1);
    const existing = existingRows[0];
    if (!existing) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const now = new Date().toISOString();

    await db.update(schema.categories).set({
      slug: body.slug !== undefined ? body.slug : existing.slug,
      name: body.name !== undefined ? body.name : existing.name,
      description: body.description !== undefined ? body.description : existing.description,
      iconName: body.iconName !== undefined ? body.iconName : existing.iconName,
      image: body.image !== undefined ? body.image : existing.image,
      subcategoriesJson: body.subcategories !== undefined ? JSON.stringify(body.subcategories) : existing.subcategoriesJson,
      featuredProductIdsJson: body.featuredProductIds !== undefined ? JSON.stringify(body.featuredProductIds) : existing.featuredProductIdsJson,
      faqsJson: body.faqs !== undefined ? JSON.stringify(body.faqs) : existing.faqsJson,
      isFeatured: body.isFeatured !== undefined ? (body.isFeatured ? 1 : 0) : existing.isFeatured,
      orderIndex: body.orderIndex !== undefined ? Number(body.orderIndex) : existing.orderIndex,
      seoTitle: body.seoTitle !== undefined ? body.seoTitle : existing.seoTitle,
      seoDescription: body.seoDescription !== undefined ? body.seoDescription : existing.seoDescription,
      status: body.status !== undefined ? body.status : existing.status,
      updatedAt: now
    }).where(eq(schema.categories.id, id));

    await logAudit(user.id, user.email, 'CATEGORY_UPDATED', 'category', id, { name: body.name || existing.name });
    const updatedRows = await db.select().from(schema.categories).where(eq(schema.categories.id, id)).limit(1);
    res.json(formatCategoryRow(updatedRows[0]));
  } catch (err: any) {
    console.error('[UPDATE CATEGORY ERROR]', err);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/categories/:id
categoryRouter.delete('/:id', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const existingRows = await db.select({ name: schema.categories.name }).from(schema.categories).where(eq(schema.categories.id, id)).limit(1);
    const existing = existingRows[0];
    if (!existing) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    await db.delete(schema.categories).where(eq(schema.categories.id, id));
    await logAudit(user.id, user.email, 'CATEGORY_DELETED', 'category', id, { name: existing.name });

    res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (err: any) {
    console.error('[DELETE CATEGORY ERROR]', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

