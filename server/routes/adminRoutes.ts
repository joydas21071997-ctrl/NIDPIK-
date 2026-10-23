import { Router, Request, Response } from 'express';
import { eq, desc, asc, count as sqlCount } from 'drizzle-orm';
import { db } from '../../src/db/index';
import * as schema from '../../src/db/schema';
import { hashPassword } from '../crypto';
import { authenticate, AuthenticatedRequest, requireRole, logAudit } from '../auth';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

export const adminRouter = Router();

// ==========================================
// ANALYTICS & DASHBOARD SUMMARY
// ==========================================
adminRouter.get('/summary', authenticate, async (req: Request, res: Response) => {
  try {
    const allProducts = await db.select().from(schema.products);
    const totalProd = allProducts.length;
    const publishedProd = allProducts.filter(p => p.status === 'PUBLISHED').length;
    const draftProd = allProducts.filter(p => p.status === 'DRAFT').length;
    const archivedProd = allProducts.filter(p => p.status === 'ARCHIVED').length;

    const countCat = (await db.select({ count: sqlCount() }).from(schema.categories))[0]?.count || 0;
    const countArt = (await db.select({ count: sqlCount() }).from(schema.articles))[0]?.count || 0;
    const countGui = (await db.select({ count: sqlCount() }).from(schema.buyingGuides))[0]?.count || 0;
    const countRev = (await db.select({ count: sqlCount() }).from(schema.reviews))[0]?.count || 0;
    const countCom = (await db.select({ count: sqlCount() }).from(schema.comparisons))[0]?.count || 0;
    const countPro = (await db.select({ count: sqlCount() }).from(schema.problemCollections))[0]?.count || 0;
    const countMer = (await db.select({ count: sqlCount() }).from(schema.merchants))[0]?.count || 0;
    const countCli = (await db.select({ count: sqlCount() }).from(schema.affiliateClicks))[0]?.count || 0;
    const countMed = (await db.select({ count: sqlCount() }).from(schema.media))[0]?.count || 0;

    const recentProducts = await db
      .select({
        id: schema.products.id,
        name: schema.products.name,
        slug: schema.products.slug,
        brand: schema.products.brand,
        category: schema.products.category,
        price: schema.products.price,
        status: schema.products.status,
        updatedAt: schema.products.updatedAt
      })
      .from(schema.products)
      .orderBy(desc(schema.products.updatedAt))
      .limit(6);

    const recentAuditsRaw = await db
      .select()
      .from(schema.auditLogs)
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(10);

    const recentAudits = recentAuditsRaw.map(r => ({
      id: r.id,
      userId: r.userId,
      userEmail: r.userEmail,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      details: typeof r.detailsJson === 'string' ? JSON.parse(r.detailsJson || '{}') : r.detailsJson,
      createdAt: r.createdAt
    }));

    res.json({
      products: {
        total: Number(totalProd),
        published: Number(publishedProd),
        draft: Number(draftProd),
        archived: Number(archivedProd)
      },
      counts: {
        categories: Number(countCat),
        articles: Number(countArt),
        guides: Number(countGui),
        reviews: Number(countRev),
        comparisons: Number(countCom),
        problems: Number(countPro),
        merchants: Number(countMer),
        clicks: Number(countCli),
        media: Number(countMed)
      },
      recentProducts,
      recentAudits,
      popularClicked: []
    });
  } catch (err: any) {
    console.error('[SUMMARY ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// ==========================================
// AUTHORS CRUD
// ==========================================
adminRouter.get('/authors', async (req: Request, res: Response) => {
  try {
    const rows = await db.select().from(schema.authors).orderBy(asc(schema.authors.name));
    res.json(rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      role: r.role,
      avatar: r.avatar,
      bio: r.bio,
      socialLinks: typeof r.socialLinksJson === 'string' ? JSON.parse(r.socialLinksJson || '{}') : (r.socialLinksJson || {}),
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    })));
  } catch (err: any) {
    console.error('[GET AUTHORS ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch authors' });
  }
});

adminRouter.post('/authors', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, role, avatar, bio } = req.body;
    const user = req.user!;
    if (!name || !role) {
      res.status(400).json({ error: 'Author name and role are required' });
      return;
    }
    const id = req.body.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const now = new Date().toISOString();

    await db.insert(schema.authors).values({
      id,
      name,
      role,
      avatar: avatar || '',
      bio: bio || '',
      socialLinksJson: '{}',
      status: 'active',
      createdAt: now,
      updatedAt: now
    });

    await logAudit(user.id, user.email, 'AUTHOR_CREATED', 'author', id, { name });
    const createdRows = await db.select().from(schema.authors).where(eq(schema.authors.id, id)).limit(1);
    res.status(201).json(createdRows[0]);
  } catch (err: any) {
    console.error('[CREATE AUTHOR ERROR]', err);
    res.status(500).json({ error: 'Failed to create author' });
  }
});

adminRouter.put('/authors/:id', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, role, avatar, bio, status } = req.body;
    const user = req.user!;
    const now = new Date().toISOString();

    const existingRows = await db.select().from(schema.authors).where(eq(schema.authors.id, id)).limit(1);
    const existing = existingRows[0];
    if (!existing) {
      res.status(404).json({ error: 'Author not found' });
      return;
    }

    await db.update(schema.authors).set({
      name: name !== undefined ? name : existing.name,
      role: role !== undefined ? role : existing.role,
      avatar: avatar !== undefined ? avatar : existing.avatar,
      bio: bio !== undefined ? bio : existing.bio,
      status: status !== undefined ? status : existing.status,
      updatedAt: now
    }).where(eq(schema.authors.id, id));

    await logAudit(user.id, user.email, 'AUTHOR_UPDATED', 'author', id, { name });
    const updatedRows = await db.select().from(schema.authors).where(eq(schema.authors.id, id)).limit(1);
    res.json(updatedRows[0]);
  } catch (err: any) {
    console.error('[UPDATE AUTHOR ERROR]', err);
    res.status(500).json({ error: 'Failed to update author' });
  }
});

adminRouter.delete('/authors/:id', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    await db.delete(schema.authors).where(eq(schema.authors.id, id));
    await logAudit(user.id, user.email, 'AUTHOR_DELETED', 'author', id);
    res.json({ success: true });
  } catch (err: any) {
    console.error('[DELETE AUTHOR ERROR]', err);
    res.status(500).json({ error: 'Failed to delete author' });
  }
});

// ==========================================
// USERS MANAGEMENT
// ==========================================
adminRouter.get('/users', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const rows = await db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        role: schema.users.role,
        status: schema.users.status,
        createdAt: schema.users.createdAt,
        lastLogin: schema.users.lastLogin
      })
      .from(schema.users)
      .orderBy(asc(schema.users.createdAt));

    const sanitized = rows.map((r) => {
      if (r.id === 'user_owner' || r.role === 'OWNER') {
        return { ...r, email: 'admin@nidpik.com', name: 'NIDPIK Site Administrator' };
      }
      return r;
    });
    res.json(sanitized);
  } catch (err: any) {
    console.error('[GET USERS ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

adminRouter.post('/users', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password, name, role } = req.body;
    const currentUser = req.user!;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required' });
      return;
    }

    const assignRole = role || 'EDITOR';
    if (assignRole === 'OWNER' && currentUser.role !== 'OWNER') {
      res.status(403).json({ error: 'Only the Owner can assign Owner role.' });
      return;
    }

    const existingRows = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email.toLowerCase().trim())).limit(1);
    if (existingRows.length > 0) {
      res.status(409).json({ error: 'A user with this email already exists.' });
      return;
    }

    const id = 'usr_' + crypto.randomUUID().slice(0, 8);
    const { hash, salt } = hashPassword(password);
    const now = new Date().toISOString();

    await db.insert(schema.users).values({
      id,
      email: email.toLowerCase().trim(),
      passwordHash: hash,
      salt,
      name,
      role: assignRole,
      status: 'active',
      createdAt: now
    });

    await logAudit(currentUser.id, currentUser.email, 'USER_CREATED', 'user', id, { email, role: assignRole });
    res.status(201).json({ id, email, name, role: assignRole, status: 'active', createdAt: now });
  } catch (err: any) {
    console.error('[CREATE USER ERROR]', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

adminRouter.put('/users/:id/role', authenticate, requireRole(['OWNER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
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

    await db.update(schema.users).set({ role }).where(eq(schema.users.id, id));
    await logAudit(currentUser.id, currentUser.email, 'USER_ROLE_CHANGED', 'user', id, { newRole: role });

    res.json({ success: true, id, role });
  } catch (err: any) {
    console.error('[UPDATE USER ROLE ERROR]', err);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

adminRouter.put('/users/:id/status', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
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

    await db.update(schema.users).set({ status }).where(eq(schema.users.id, id));
    await logAudit(currentUser.id, currentUser.email, `USER_${status.toUpperCase()}`, 'user', id);

    res.json({ success: true, id, status });
  } catch (err: any) {
    console.error('[UPDATE USER STATUS ERROR]', err);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

adminRouter.delete('/users/:id', authenticate, requireRole(['OWNER']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    if (id === currentUser.id) {
      res.status(400).json({ error: 'You cannot delete your own account.' });
      return;
    }

    await db.delete(schema.users).where(eq(schema.users.id, id));
    await logAudit(currentUser.id, currentUser.email, 'USER_DELETED', 'user', id);

    res.json({ success: true });
  } catch (err: any) {
    console.error('[DELETE USER ERROR]', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ==========================================
// SETTINGS
// ==========================================
adminRouter.get('/settings', async (req: Request, res: Response) => {
  try {
    const rows = await db.select().from(schema.settings);
    const settingsObj: Record<string, any> = {};
    for (const r of rows) {
      try {
        settingsObj[r.key] = JSON.parse(r.valueJson);
      } catch {
        settingsObj[r.key] = r.valueJson;
      }
    }
    res.json(settingsObj);
  } catch (err: any) {
    console.error('[GET SETTINGS ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

adminRouter.put('/settings/:key', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { key } = req.params;
    const value = req.body;
    const user = req.user!;
    const now = new Date().toISOString();

    await db.insert(schema.settings).values({
      key,
      valueJson: JSON.stringify(value),
      updatedAt: now
    }).onConflictDoUpdate({
      target: schema.settings.key,
      set: {
        valueJson: JSON.stringify(value),
        updatedAt: now
      }
    });

    await logAudit(user.id, user.email, 'SETTINGS_UPDATED', 'settings', key);
    res.json({ success: true, key, value });
  } catch (err: any) {
    console.error('[UPDATE SETTINGS ERROR]', err);
    res.status(500).json({ error: 'Failed to update setting' });
  }
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

adminRouter.post('/upload-logo', uploadLogoMulter.single('file'), async (req: Request, res: Response) => {
  try {
    let logoUrl = '';

    if (req.file) {
      logoUrl = `/uploads/${req.file.filename}`;
      const filePath = req.file.path;
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

    const existingRows = await db.select().from(schema.settings).where(eq(schema.settings.key, 'general')).limit(1);
    const existing = existingRows[0];
    let generalObj: Record<string, any> = {};
    if (existing?.valueJson) {
      try {
        generalObj = JSON.parse(existing.valueJson);
      } catch {}
    }
    generalObj.logoUrl = logoUrl;

    const now = new Date().toISOString();
    await db.insert(schema.settings).values({
      key: 'general',
      valueJson: JSON.stringify(generalObj),
      updatedAt: now
    }).onConflictDoUpdate({
      target: schema.settings.key,
      set: {
        valueJson: JSON.stringify(generalObj),
        updatedAt: now
      }
    });

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
adminRouter.get('/audit-logs', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const rows = await db
      .select()
      .from(schema.auditLogs)
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(200);

    res.json(rows.map(r => ({
      id: r.id,
      userId: r.userId,
      userEmail: r.userEmail,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      details: typeof r.detailsJson === 'string' ? JSON.parse(r.detailsJson || '{}') : r.detailsJson,
      createdAt: r.createdAt
    })));
  } catch (err: any) {
    console.error('[GET AUDIT LOGS ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// ==========================================
// NEWSLETTER SUBSCRIBERS
// ==========================================
adminRouter.get('/subscribers', authenticate, async (req: Request, res: Response) => {
  try {
    const subscribers = await db
      .select()
      .from(schema.newsletterSubscribers)
      .orderBy(desc(schema.newsletterSubscribers.createdAt));

    res.json({
      total: subscribers.length,
      active: subscribers.filter(s => s.status === 'active').length,
      subscribers: subscribers.map(s => ({
        id: s.id,
        email: s.email,
        source: s.source,
        status: s.status,
        createdAt: s.createdAt
      }))
    });
  } catch (err: any) {
    console.error('[GET SUBSCRIBERS ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
});

adminRouter.delete('/subscribers/:id', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id;
    await db.delete(schema.newsletterSubscribers).where(eq(schema.newsletterSubscribers.id, id));
    await logAudit(req.user!.id, req.user!.email, 'DELETE_SUBSCRIBER', 'newsletter', id);
    res.json({ success: true, message: 'Subscriber removed successfully.' });
  } catch (err: any) {
    console.error('[DELETE SUBSCRIBER ERROR]', err);
    res.status(500).json({ error: 'Failed to remove subscriber' });
  }
});

