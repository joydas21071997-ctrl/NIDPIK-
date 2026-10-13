import { Router, Request, Response } from 'express';
import { db } from '../db';
import { authenticate, AuthenticatedRequest, requireRole, logAudit } from '../auth';
import crypto from 'crypto';

export const categoryRouter = Router();

export function formatCategoryRow(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    iconName: row.icon_name,
    image: row.image || undefined,
    subcategories: JSON.parse(row.subcategories_json || '[]'),
    featuredProductIds: JSON.parse(row.featured_product_ids_json || '[]'),
    faqs: JSON.parse(row.faqs_json || '[]'),
    isFeatured: Boolean(row.is_featured),
    orderIndex: Number(row.order_index),
    seoTitle: row.seo_title || undefined,
    seoDescription: row.seo_description || undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// GET /api/categories
categoryRouter.get('/', (req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM categories ORDER BY order_index ASC').all();
  res.json(rows.map(formatCategoryRow));
});

// GET /api/categories/:idOrSlug
categoryRouter.get('/:idOrSlug', (req: Request, res: Response) => {
  const param = req.params.idOrSlug;
  const row = db.prepare('SELECT * FROM categories WHERE id = ? OR slug = ?').get(param, param);
  if (!row) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }
  res.json(formatCategoryRow(row));
});

// POST /api/categories
categoryRouter.post('/', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), (req: AuthenticatedRequest, res: Response) => {
  const body = req.body;
  const user = req.user!;

  if (!body.name) {
    res.status(400).json({ error: 'Category name is required' });
    return;
  }

  const id = body.id || 'cat_' + crypto.randomUUID().slice(0, 8);
  const slug = (body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).trim();
  const now = new Date().toISOString();

  const count = (db.prepare('SELECT COUNT(*) as c FROM categories').get() as any).c;

  db.prepare(`
    INSERT INTO categories (
      id, slug, name, description, icon_name, image, subcategories_json,
      featured_product_ids_json, faqs_json, is_featured, order_index,
      seo_title, seo_description, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', ?, ?)
  `).run(
    id,
    slug,
    body.name,
    body.description || '',
    body.iconName || 'LayoutGrid',
    body.image || null,
    JSON.stringify(body.subcategories || []),
    JSON.stringify(body.featuredProductIds || []),
    JSON.stringify(body.faqs || []),
    body.isFeatured ? 1 : 0,
    body.orderIndex !== undefined ? Number(body.orderIndex) : count,
    body.seoTitle || `${body.name} - Buying Guides & Recommendations | NIDPIK`,
    body.seoDescription || body.description || '',
    now,
    now
  );

  logAudit(user.id, user.email, 'CATEGORY_CREATED', 'category', id, { name: body.name });
  const created = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  res.status(201).json(formatCategoryRow(created));
});

// PUT /api/categories/:id
categoryRouter.put('/:id', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const body = req.body;
  const user = req.user!;

  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as any;
  if (!existing) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }

  const now = new Date().toISOString();

  db.prepare(`
    UPDATE categories SET
      slug = ?,
      name = ?,
      description = ?,
      icon_name = ?,
      image = ?,
      subcategories_json = ?,
      featured_product_ids_json = ?,
      faqs_json = ?,
      is_featured = ?,
      order_index = ?,
      seo_title = ?,
      seo_description = ?,
      status = ?,
      updated_at = ?
    WHERE id = ?
  `).run(
    body.slug !== undefined ? body.slug : existing.slug,
    body.name !== undefined ? body.name : existing.name,
    body.description !== undefined ? body.description : existing.description,
    body.iconName !== undefined ? body.iconName : existing.icon_name,
    body.image !== undefined ? body.image : existing.image,
    body.subcategories !== undefined ? JSON.stringify(body.subcategories) : existing.subcategories_json,
    body.featuredProductIds !== undefined ? JSON.stringify(body.featuredProductIds) : existing.featured_product_ids_json,
    body.faqs !== undefined ? JSON.stringify(body.faqs) : existing.faqs_json,
    body.isFeatured !== undefined ? (body.isFeatured ? 1 : 0) : existing.is_featured,
    body.orderIndex !== undefined ? Number(body.orderIndex) : existing.order_index,
    body.seoTitle !== undefined ? body.seoTitle : existing.seo_title,
    body.seoDescription !== undefined ? body.seoDescription : existing.seo_description,
    body.status !== undefined ? body.status : existing.status,
    now,
    id
  );

  logAudit(user.id, user.email, 'CATEGORY_UPDATED', 'category', id, { name: body.name || existing.name });
  const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  res.json(formatCategoryRow(updated));
});

// DELETE /api/categories/:id
categoryRouter.delete('/:id', authenticate, requireRole(['OWNER', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;

  const existing = db.prepare('SELECT name FROM categories WHERE id = ?').get(id) as any;
  if (!existing) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }

  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  logAudit(user.id, user.email, 'CATEGORY_DELETED', 'category', id, { name: existing.name });

  res.json({ success: true, message: 'Category deleted successfully.' });
});
