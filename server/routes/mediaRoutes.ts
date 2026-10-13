import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { db } from '../db';
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
mediaRouter.get('/', authenticate, (req: Request, res: Response) => {
  const { search } = req.query;
  let query = 'SELECT * FROM media';
  const params: any[] = [];
  if (search) {
    query += ' WHERE original_name LIKE ? OR alt_text LIKE ? OR title LIKE ?';
    const q = `%${search}%`;
    params.push(q, q, q);
  }
  query += ' ORDER BY created_at DESC';

  const rows = db.prepare(query).all(...params) as any[];
  res.json(rows.map(r => ({
    id: r.id,
    filename: r.filename,
    originalName: r.original_name,
    url: r.url,
    mimeType: r.mime_type,
    sizeBytes: Number(r.size_bytes),
    width: r.width,
    height: r.height,
    altText: r.alt_text || '',
    title: r.title || '',
    createdAt: r.created_at
  })));
});

// POST /api/media (UPLOAD)
mediaRouter.post('/', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), upload.single('file'), (req: AuthenticatedRequest, res: Response) => {
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

  db.prepare(`
    INSERT INTO media (id, filename, original_name, url, mime_type, size_bytes, width, height, alt_text, title, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    file.filename,
    file.originalname,
    url,
    file.mimetype,
    file.size,
    null,
    null,
    altText,
    title,
    now
  );

  logAudit(user.id, user.email, 'MEDIA_UPLOADED', 'media', id, { filename: file.filename, size: file.size });

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
});

// PUT /api/media/:id (UPDATE METADATA)
mediaRouter.put('/:id', authenticate, requireRole(['OWNER', 'ADMIN', 'EDITOR']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { altText, title } = req.body;
  const user = req.user!;

  db.prepare('UPDATE media SET alt_text = ?, title = ? WHERE id = ?').run(altText || '', title || '', id);
  logAudit(user.id, user.email, 'MEDIA_UPDATED', 'media', id, { altText, title });

  const updated = db.prepare('SELECT * FROM media WHERE id = ?').get(id);
  res.json(updated);
});

// DELETE /api/media/:id
mediaRouter.delete('/:id', authenticate, requireRole(['OWNER', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;

  const existing = db.prepare('SELECT filename FROM media WHERE id = ?').get(id) as any;
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

  db.prepare('DELETE FROM media WHERE id = ?').run(id);
  logAudit(user.id, user.email, 'MEDIA_DELETED', 'media', id, { filename: existing.filename });

  res.json({ success: true });
});
