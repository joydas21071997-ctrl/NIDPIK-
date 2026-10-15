import { Router, Request, Response } from 'express';
import { db, hashPassword } from '../db';
import { authenticate, AuthenticatedRequest, requireRole, logAudit } from '../auth';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

export const adminRouter = Router();

// ==========================================
// ANALYTICS & DASHBOARD SUMMARY
// ==========================================
adminRouter.get('/summary', authenticate, (req: Request, res: Response) => {
  const productStats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'PUBLISHED' THEN 1 ELSE 0 END) as published,
      SUM(CASE WHEN status = 'DRAFT' THEN 1 ELSE 0 END) as draft,
      SUM(CASE WHEN status = 'ARCHIVED' THEN 1 ELSE 0 END) as archived
    FROM products
  `).get() as any;

  const counts = {
    categories: (db.prepare('SELECT COUNT(*) as c FROM categories').get() as any).c,
    articles: (db.prepare('SELECT COUNT(*) as c FROM articles').get() as any).c,
    guides: (db.prepare('SELECT COUNT(*) as c FROM buying_guides').get() as any).c,
    reviews: (db.prepare('SELECT COUNT(*) as c FROM reviews').get() as any).c,
    comparisons: (db.prepare('SELECT COUNT(*) as c FROM comparisons').get() as any).c,
    problems: (db.prepare('SELECT COUNT(*) as c FROM problem_collections').get() as any).c,
    merchants: (db.prepare('SELECT COUNT(*) as c FROM merchants').get() as any).c,
    clicks: (db.prepare('SELECT COUNT(*) as c FROM affiliate_clicks').get() as any).c,
    media: (db.prepare('SELECT COUNT(*) as c FROM media').get() as any).c
  };

  const recentProducts = db.prepare(`
    SELECT id, name, slug, brand, category, price, status, updated_at
    FROM products
    ORDER BY updated_at DESC
    LIMIT 6
  `).all();

  const recentAudits = db.prepare(`
    SELECT * FROM audit_logs
    ORDER BY created_at DESC
    LIMIT 10
  `).all();

  const popularClicked = db.prepare(`
    SELECT c.product_id, p.name, p.price, p.image, COUNT(*) as clicks
    FROM affiliate_clicks c
    LEFT JOIN products p ON c.product_id = p.id
    GROUP BY c.product_id
    ORDER BY clicks DESC
    LIMIT 5
  `).all();

  res.json({
    products: {
      total: productStats.total || 0,
      published: productStats.published || 0,
      draft: productStats.draft || 0,
      archived: productStats.archived || 0
    },
    counts,
    recentProducts,
    recentAudits,
    popularClicked
  });
});

// ==========================================
// AUTHORS CRUD
// ==========================================
adminRouter.get('/authors', (req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM authors ORDER BY name ASC').all();
  res.json(rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    avatar: r.avatar,
    bio: r.bio,
    socialLinks: JSON.parse(r.social_links_json || '{}'),
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  })));
});

adminRouter.post('/authors', authenticate, requireRole(['OWNER', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { name, role, avatar, bio } = req.body;
  const user = req.user!;
  if (!name || !role) {
    res.status(400).json({ error: 'Author name and role are required' });
    return;
  }
  const id = req.body.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO authors (id, name, role, avatar, bio, social_links_json, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, '{}', 'active', ?, ?)
  `).run(id, name, role, avatar || '', bio || '', now, now);

  logAudit(user.id, user.email, 'AUTHOR_CREATED', 'author', id, { name });
  const created = db.prepare('SELECT * FROM authors WHERE id = ?').get(id);
  res.status(201).json(created);
});

adminRouter.put('/authors/:id', authenticate, requireRole(['OWNER', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, role, avatar, bio, status } = req.body;
  const user = req.user!;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE authors SET
      name = COALESCE(?, name),
      role = COALESCE(?, role),
      avatar = COALESCE(?, avatar),
      bio = COALESCE(?, bio),
      status = COALESCE(?, status),
      updated_at = ?
    WHERE id = ?
  `).run(name, role, avatar, bio, status, now, id);

  logAudit(user.id, user.email, 'AUTHOR_UPDATED', 'author', id, { name });
  const updated = db.prepare('SELECT * FROM authors WHERE id = ?').get(id);
  res.json(updated);
});

adminRouter.delete('/authors/:id', authenticate, requireRole(['OWNER', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  db.prepare('DELETE FROM authors WHERE id = ?').run(id);
  logAudit(user.id, user.email, 'AUTHOR_DELETED', 'author', id);
  res.json({ success: true });
});

// ==========================================
// USERS MANAGEMENT
// ==========================================
adminRouter.get('/users', authenticate, requireRole(['OWNER', 'ADMIN']), (req: Request, res: Response) => {
  const rows = db.prepare('SELECT id, email, name, role, status, created_at, last_login FROM users ORDER BY created_at ASC').all();
  res.json(rows);
});

adminRouter.post('/users', authenticate, requireRole(['OWNER', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { email, password, name, role } = req.body;
  const currentUser = req.user!;

  if (!email || !password || !name) {
    res.status(400).json({ error: 'Email, password, and name are required' });
    return;
  }

  // Only OWNER can create OWNER or ADMIN roles
  const assignRole = role || 'EDITOR';
  if (assignRole === 'OWNER' && currentUser.role !== 'OWNER') {
    res.status(403).json({ error: 'Only the Owner can assign Owner role.' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) {
    res.status(409).json({ error: 'A user with this email already exists.' });
    return;
  }

  const id = 'usr_' + crypto.randomUUID().slice(0, 8);
  const { hash, salt } = hashPassword(password);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (id, email, password_hash, salt, name, role, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'active', ?)
  `).run(id, email.toLowerCase().trim(), hash, salt, name, assignRole, now);

  logAudit(currentUser.id, currentUser.email, 'USER_CREATED', 'user', id, { email, role: assignRole });
  res.status(201).json({ id, email, name, role: assignRole, status: 'active', createdAt: now });
});

adminRouter.put('/users/:id/role', authenticate, requireRole(['OWNER']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;
  const currentUser = req.user!;

  if (!['OWNER', 'ADMIN', 'EDITOR'].includes(role)) {
    res.status(400).json({ error: 'Invalid role' });
    return;
  }

  if (id === currentUser.id && role !== 'OWNER') {
    res.status(400).json({ error: 'You cannot demote yourself from Owner.' });
    return;
  }

  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
  logAudit(currentUser.id, currentUser.email, 'USER_ROLE_CHANGED', 'user', id, { newRole: role });

  res.json({ success: true, id, role });
});

adminRouter.put('/users/:id/status', authenticate, requireRole(['OWNER', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const currentUser = req.user!;

  if (!['active', 'disabled'].includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  if (id === currentUser.id) {
    res.status(400).json({ error: 'You cannot disable your own account.' });
    return;
  }

  db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, id);
  logAudit(currentUser.id, currentUser.email, `USER_${status.toUpperCase()}`, 'user', id);

  res.json({ success: true, id, status });
});

adminRouter.delete('/users/:id', authenticate, requireRole(['OWNER']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const currentUser = req.user!;

  if (id === currentUser.id) {
    res.status(400).json({ error: 'You cannot delete your own account.' });
    return;
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  logAudit(currentUser.id, currentUser.email, 'USER_DELETED', 'user', id);

  res.json({ success: true });
});

// ==========================================
// SETTINGS
// ==========================================
adminRouter.get('/settings', (req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM settings').all() as any[];
  const settingsObj: Record<string, any> = {};
  for (const r of rows) {
    try {
      settingsObj[r.key] = JSON.parse(r.value_json);
    } catch {
      settingsObj[r.key] = r.value_json;
    }
  }
  res.json(settingsObj);
});

adminRouter.put('/settings/:key', authenticate, requireRole(['OWNER', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { key } = req.params;
  const value = req.body;
  const user = req.user!;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT OR REPLACE INTO settings (key, value_json, updated_at)
    VALUES (?, ?, ?)
  `).run(key, JSON.stringify(value), now);

  logAudit(user.id, user.email, 'SETTINGS_UPDATED', 'settings', key);
  res.json({ success: true, key, value });
});

// ==========================================
// OFFICIAL LOGO UPLOAD & MANAGEMENT
// ==========================================
const logoStorage = multer.diskStorage({
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

const uploadLogoMulter = multer({
  storage: logoStorage,
  limits: { fileSize: 15 * 1024 * 1024 }
});

adminRouter.post('/upload-logo', uploadLogoMulter.single('file'), (req: Request, res: Response) => {
  try {
    let logoUrl = '';

    // If file was uploaded via multipart/form-data
    if (req.file) {
      logoUrl = `/uploads/${req.file.filename}`;
      const filePath = req.file.path;

      // Also copy to /public/logo.png for root fallback
      try {
        const ext = path.extname(req.file.originalname).toLowerCase();
        if (ext === '.svg') {
          fs.copyFileSync(filePath, path.resolve(process.cwd(), 'public', 'logo.svg'));
        } else {
          fs.copyFileSync(filePath, path.resolve(process.cwd(), 'public', 'logo.png'));
        }
      } catch (copyErr) {
        console.warn('Could not mirror file to public/logo:', copyErr);
      }
    } else if (req.body?.dataUrl) {
      // If base64 image dataUrl was provided
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
      logoUrl = req.body.logoUrl;
    }

    if (!logoUrl) {
      res.status(400).json({ error: 'No image file or URL was provided.' });
      return;
    }

    // Update settings in database
    const existing = db.prepare("SELECT value_json FROM settings WHERE key = 'general'").get() as any;
    let generalObj: Record<string, any> = {};
    if (existing?.value_json) {
      try {
        generalObj = JSON.parse(existing.value_json);
      } catch {}
    }
    generalObj.logoUrl = logoUrl;

    const now = new Date().toISOString();
    db.prepare(`
      INSERT OR REPLACE INTO settings (key, value_json, updated_at)
      VALUES ('general', ?, ?)
    `).run(JSON.stringify(generalObj), now);

    res.json({
      success: true,
      logoUrl,
      message: 'Official website logo updated successfully!'
    });
  } catch (err: any) {
    console.error('Failed to upload logo:', err);
    res.status(500).json({ error: err.message || 'Server error uploading logo' });
  }
});

// ==========================================
// AUDIT LOGS
// ==========================================
adminRouter.get('/audit-logs', authenticate, requireRole(['OWNER', 'ADMIN']), (req: Request, res: Response) => {
  const rows = db.prepare(`
    SELECT * FROM audit_logs
    ORDER BY created_at DESC
    LIMIT 200
  `).all() as any[];

  res.json(rows.map(r => ({
    id: r.id,
    userId: r.user_id,
    userEmail: r.user_email,
    action: r.action,
    entityType: r.entity_type,
    entityId: r.entity_id,
    details: JSON.parse(r.details_json || '{}'),
    createdAt: r.created_at
  })));
});

// ==========================================
// NEWSLETTER SUBSCRIBERS
// ==========================================
adminRouter.get('/subscribers', authenticate, (req: Request, res: Response) => {
  const subscribers = db.prepare(`
    SELECT * FROM newsletter_subscribers
    ORDER BY created_at DESC
  `).all() as any[];

  res.json({
    total: subscribers.length,
    active: subscribers.filter(s => s.status === 'active').length,
    subscribers: subscribers.map(s => ({
      id: s.id,
      email: s.email,
      source: s.source,
      status: s.status,
      createdAt: s.created_at
    }))
  });
});

adminRouter.delete('/subscribers/:id', authenticate, requireRole(['OWNER', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id;
  db.prepare('DELETE FROM newsletter_subscribers WHERE id = ?').run(id);
  logAudit(req.user!.id, req.user!.email, 'DELETE_SUBSCRIBER', 'newsletter', id);
  res.json({ success: true, message: 'Subscriber removed successfully.' });
});
