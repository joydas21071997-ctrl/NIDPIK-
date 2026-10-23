import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { eq, or, ilike, desc } from 'drizzle-orm';
import { db } from '../../src/db/index';
import * as schema from '../../src/db/schema';
import { authenticate, AuthenticatedRequest, requireRole, logAudit } from '../auth';

export const mediaRouter = Router();

// Ensure upload directory exists
const uploadDir = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    const unique = `${cleanName}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}${ext}`;
    cb(null, unique);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|svg|gif|avif/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP, SVG, GIF, AVIF) are permitted.'));
    }
  }
});

// GET /api/media
mediaRouter.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    let queryBuilder = db.select().from(schema.media);

    if (search) {
      const q = `%${search}%`;
      queryBuilder = queryBuilder.where(
        or(
          ilike(schema.media.originalName, q),
          ilike(schema.media.altText, q),
          ilike(schema.media.title, q)
        )
      ) as any;
    }

    const rows = await queryBuilder.orderBy(desc(schema.media.createdAt));
    res.json(rows.map(r => ({
      id: r.id,
      filename: r.filename,
      originalName: r.originalName,
      url: r.url,
      mimeType: r.mimeType,
      sizeBytes: Number(r.sizeBytes),
      width: r.width,
      height: r.height,
      altText: r.altText || '',
      title: r.title || '',
      createdAt: r.createdAt
    })));
  } catch (err: any) {
    console.error('[GET MEDIA ERROR]', err);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

// POST /api/media (UPLOAD)
mediaRouter.post('/', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image file uploaded' });
      return;
    }

    const file = req.file;
    const user = req.user!;
    const id = 'med_' + crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();
    const url = `/uploads/${file.filename}`;
    const altText = req.body.altText || path.basename(file.originalname, path.extname(file.originalname));
    const title = req.body.title || file.originalname;

    await db.insert(schema.media).values({
      id,
      filename: file.filename,
      originalName: file.originalname,
      url,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      width: null,
      height: null,
      altText,
      title,
      createdAt: now
    });

    await logAudit(user.id, user.email, 'MEDIA_UPLOADED', 'media', id, { filename: file.filename, size: file.size });

    res.status(201).json({
      id,
      filename: file.filename,
      originalName: file.originalname,
      url,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      altText,
      title,
      createdAt: now
    });
  } catch (err: any) {
    console.error('[UPLOAD MEDIA ERROR]', err);
    res.status(500).json({ error: 'Failed to save media upload' });
  }
});

// PUT /api/media/:id (UPDATE METADATA)
mediaRouter.put('/:id', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { altText, title } = req.body;
    const user = req.user!;

    await db.update(schema.media).set({
      altText: altText || '',
      title: title || ''
    }).where(eq(schema.media.id, id));

    await logAudit(user.id, user.email, 'MEDIA_UPDATED', 'media', id, { altText, title });

    const updatedRows = await db.select().from(schema.media).where(eq(schema.media.id, id)).limit(1);
    res.json(updatedRows[0]);
  } catch (err: any) {
    console.error('[UPDATE MEDIA ERROR]', err);
    res.status(500).json({ error: 'Failed to update media' });
  }
});

// DELETE /api/media/:id
mediaRouter.delete('/:id', authenticate, requireRole(['OWNER', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const existingRows = await db.select({ filename: schema.media.filename }).from(schema.media).where(eq(schema.media.id, id)).limit(1);
    const existing = existingRows[0];
    if (!existing) {
      res.status(404).json({ error: 'Media not found' });
      return;
    }

    // Delete from disk if present
    const diskPath = path.resolve(uploadDir, existing.filename);
    if (fs.existsSync(diskPath)) {
      try {
        fs.unlinkSync(diskPath);
      } catch (e) {
        console.warn('Could not delete file from disk:', diskPath, e);
      }
    }

    await db.delete(schema.media).where(eq(schema.media.id, id));
    await logAudit(user.id, user.email, 'MEDIA_DELETED', 'media', id, { filename: existing.filename });

    res.json({ success: true });
  } catch (err: any) {
    console.error('[DELETE MEDIA ERROR]', err);
    res.status(500).json({ error: 'Failed to delete media' });
  }
});

