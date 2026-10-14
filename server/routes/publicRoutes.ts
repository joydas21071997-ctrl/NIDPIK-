import { Router, Request, Response } from 'express';
import { db } from '../db';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { formatProductRow } from './productRoutes';
import { formatCategoryRow } from './categoryRoutes';
import {
  formatArticleRow,
  formatGuideRow,
  formatComparisonRow,
  formatReviewRow,
  formatProblemRow
} from './contentRoutes';
import { formatMerchantRow } from './merchantRoutes';

const publicLogoStorage = multer.diskStorage({
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

const uploadPublicLogo = multer({
  storage: publicLogoStorage,
  limits: { fileSize: 25 * 1024 * 1024 }
});

export const publicRouter = Router();

// GET /api/public/bootstrap
// Returns full live published catalog for instant frontend synchronization
publicRouter.get('/bootstrap', (req: Request, res: Response) => {
  const products = db.prepare("SELECT * FROM products WHERE status = 'PUBLISHED' ORDER BY updated_at DESC").all().map(formatProductRow);
  const categories = db.prepare("SELECT * FROM categories WHERE status = 'PUBLISHED' ORDER BY order_index ASC").all().map(formatCategoryRow);
  const articles = db.prepare("SELECT * FROM articles WHERE status = 'PUBLISHED' ORDER BY created_at DESC").all().map(formatArticleRow);
  const guides = db.prepare("SELECT * FROM buying_guides WHERE status = 'PUBLISHED' ORDER BY created_at DESC").all().map(formatGuideRow);
  const comparisons = db.prepare("SELECT * FROM comparisons WHERE status = 'PUBLISHED' ORDER BY created_at DESC").all().map(formatComparisonRow);
  const reviews = db.prepare("SELECT * FROM reviews WHERE status = 'PUBLISHED' ORDER BY created_at DESC").all().map(formatReviewRow);
  const problems = db.prepare("SELECT * FROM problem_collections WHERE status = 'PUBLISHED' ORDER BY created_at ASC").all().map(formatProblemRow);
  const budgets = db.prepare('SELECT * FROM budget_tiers ORDER BY amount ASC').all().map((r: any) => ({
    amount: Number(r.amount),
    title: r.title,
    slug: r.slug,
    headline: r.headline,
    description: r.description,
    recommendedCategory: r.recommended_category
  }));
  const merchants = db.prepare("SELECT * FROM merchants WHERE status = 'active' ORDER BY name ASC").all().map(formatMerchantRow);
  const authors = db.prepare("SELECT * FROM authors WHERE status = 'active'").all().map((r: any) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    avatar: r.avatar,
    bio: r.bio
  }));

  // Settings
  const settingsRows = db.prepare('SELECT * FROM settings').all() as any[];
  const settings: Record<string, any> = {};
  for (const s of settingsRows) {
    try {
      settings[s.key] = JSON.parse(s.value_json);
    } catch {
      settings[s.key] = s.value_json;
    }
  }

  res.json({
    products,
    categories,
    articles,
    buyingGuides: guides,
    comparisons,
    reviews,
    problemCollections: problems,
    budgetTiers: budgets,
    merchants,
    authors,
    settings,
    serverTime: new Date().toISOString()
  });
});

// POST /api/public/update-logo
// Frictionless instant logo update for the user (supports file upload, base64, external URL, or reset)
publicRouter.post('/update-logo', uploadPublicLogo.single('file'), async (req: Request, res: Response) => {
  try {
    let logoUrl = '';
    const resetDefault = req.body?.resetDefault === 'true' || req.body?.resetDefault === true;

    if (resetDefault) {
      logoUrl = '/logo.svg';
    } else if (req.file) {
      // Direct file uploaded
      logoUrl = `/uploads/${req.file.filename}`;
      const filePath = req.file.path;
      const ext = path.extname(req.file.originalname).toLowerCase();
      try {
        if (ext === '.svg') {
          fs.copyFileSync(filePath, path.resolve(process.cwd(), 'public', 'logo.svg'));
        } else {
          fs.copyFileSync(filePath, path.resolve(process.cwd(), 'public', 'logo.png'));
        }
      } catch (err) {
        console.warn('Could not mirror file to public/logo:', err);
      }
    } else if (req.body?.dataUrl) {
      // Base64 data url
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
      let rawUrl = String(req.body.logoUrl).trim();
      logoUrl = rawUrl;

      // If it's a remote URL, try to cache it locally
      if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
        try {
          const fetchRes = await fetch(rawUrl);
          if (fetchRes.ok) {
            const arrayBuffer = await fetchRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const contentType = fetchRes.headers.get('content-type') || '';
            const ext = contentType.includes('svg') ? '.svg' : contentType.includes('webp') ? '.webp' : contentType.includes('jpeg') || contentType.includes('jpg') ? '.jpg' : '.png';
            const filename = `nidpik_official_logo_${Date.now()}${ext}`;
            const uploadDir = path.resolve(process.cwd(), 'public', 'uploads');
            if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true });
            }
            const filePath = path.resolve(uploadDir, filename);
            fs.writeFileSync(filePath, buffer);
            logoUrl = `/uploads/${filename}`;

            try {
              if (ext === '.svg') {
                fs.writeFileSync(path.resolve(process.cwd(), 'public', 'logo.svg'), buffer);
              } else {
                fs.writeFileSync(path.resolve(process.cwd(), 'public', 'logo.png'), buffer);
              }
            } catch (e) {}
          }
        } catch (fetchErr) {
          console.warn('Remote logo fetch note:', fetchErr);
          // Keep rawUrl as fallback
          logoUrl = rawUrl;
        }
      }
    }

    if (!logoUrl) {
      res.status(400).json({ error: 'Please provide an image file or a valid image URL' });
      return;
    }

    // Persist to database settings
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
      settings: generalObj,
      message: 'Official brand logo updated successfully across the entire site.'
    });
  } catch (err: any) {
    console.error('Update logo error:', err);
    res.status(500).json({ error: err.message || 'Failed to update logo' });
  }
});

// GET /api/public/search?q=...
publicRouter.get('/search', (req: Request, res: Response) => {
  const rawQ = String(req.query.q || '').trim();
  if (!rawQ) {
    res.json({
      products: [],
      guides: [],
      comparisons: [],
      articles: [],
      categories: [],
      problems: []
    });
    return;
  }

  // Detect price numbers, e.g. "under 500", "under ₹2000"
  const priceMatch = rawQ.match(/under\s*₹?\s*(\d+)/i) || rawQ.match(/₹\s*(\d+)/i);
  const maxPrice = priceMatch ? parseInt(priceMatch[1], 10) : null;

  const likeQ = `%${rawQ}%`;

  let productQuery = "SELECT * FROM products WHERE status = 'PUBLISHED' AND (name LIKE ? OR brand LIKE ? OR category LIKE ? OR subcategory LIKE ? OR short_description LIKE ? OR best_for LIKE ?)";
  const productParams: any[] = [likeQ, likeQ, likeQ, likeQ, likeQ, likeQ];

  if (maxPrice !== null) {
    productQuery += ' AND price <= ?';
    productParams.push(maxPrice);
  }
  productQuery += ' ORDER BY price ASC LIMIT 20';

  const matchedProducts = db.prepare(productQuery).all(...productParams).map(formatProductRow);

  const matchedGuides = db.prepare("SELECT * FROM buying_guides WHERE status = 'PUBLISHED' AND (title LIKE ? OR subtitle LIKE ? OR category LIKE ?) LIMIT 10")
    .all(likeQ, likeQ, likeQ).map(formatGuideRow);

  const matchedComparisons = db.prepare("SELECT * FROM comparisons WHERE status = 'PUBLISHED' AND (title LIKE ? OR subtitle LIKE ? OR category LIKE ?) LIMIT 10")
    .all(likeQ, likeQ, likeQ).map(formatComparisonRow);

  const matchedArticles = db.prepare("SELECT * FROM articles WHERE status = 'PUBLISHED' AND (title LIKE ? OR excerpt LIKE ? OR category LIKE ?) LIMIT 10")
    .all(likeQ, likeQ, likeQ).map(formatArticleRow);

  const matchedCategories = db.prepare("SELECT * FROM categories WHERE status = 'PUBLISHED' AND (name LIKE ? OR description LIKE ?) LIMIT 10")
    .all(likeQ, likeQ).map(formatCategoryRow);

  const matchedProblems = db.prepare("SELECT * FROM problem_collections WHERE status = 'PUBLISHED' AND (title LIKE ? OR tagline LIKE ? OR description LIKE ?) LIMIT 10")
    .all(likeQ, likeQ, likeQ).map(formatProblemRow);

  res.json({
    products: matchedProducts,
    guides: matchedGuides,
    comparisons: matchedComparisons,
    articles: matchedArticles,
    categories: matchedCategories,
    problems: matchedProblems
  });
});

// Dynamic XML Sitemap
publicRouter.get('/sitemap.xml', (req: Request, res: Response) => {
  const host = req.get('host');
  const baseUrl = process.env.APP_URL || (host ? `${req.protocol}://${host}` : 'https://nidpik.com');
  const now = new Date().toISOString().split('T')[0];

  const products = db.prepare("SELECT slug, updated_at FROM products WHERE status = 'PUBLISHED'").all() as any[];
  const categories = db.prepare("SELECT slug, updated_at FROM categories WHERE status = 'PUBLISHED'").all() as any[];
  const articles = db.prepare("SELECT slug, updated_at FROM articles WHERE status = 'PUBLISHED'").all() as any[];
  const guides = db.prepare("SELECT slug, updated_at FROM buying_guides WHERE status = 'PUBLISHED'").all() as any[];
  const comparisons = db.prepare("SELECT slug, updated_at FROM comparisons WHERE status = 'PUBLISHED'").all() as any[];
  const reviews = db.prepare("SELECT slug, updated_at FROM reviews WHERE status = 'PUBLISHED'").all() as any[];
  const problems = db.prepare("SELECT slug, updated_at FROM problem_collections WHERE status = 'PUBLISHED'").all() as any[];
  const budgets = db.prepare('SELECT slug FROM budget_tiers').all() as any[];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}/</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${baseUrl}/products</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${baseUrl}/categories</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${baseUrl}/buying-guides</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${baseUrl}/compare</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${baseUrl}/reviews</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${baseUrl}/articles</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${baseUrl}/problems</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
`;

  for (const b of budgets) {
    xml += `  <url><loc>${baseUrl}/${b.slug}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`;
  }
  for (const p of products) {
    xml += `  <url><loc>${baseUrl}/product/${p.slug}</loc><lastmod>${p.updated_at?.split('T')[0] || now}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
  }
  for (const c of categories) {
    xml += `  <url><loc>${baseUrl}/category/${c.slug}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
  }
  for (const g of guides) {
    xml += `  <url><loc>${baseUrl}/buying-guides/${g.slug}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
  }
  for (const c of comparisons) {
    xml += `  <url><loc>${baseUrl}/compare/${c.slug}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
  }
  for (const r of reviews) {
    xml += `  <url><loc>${baseUrl}/reviews/${r.slug}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
  }
  for (const a of articles) {
    xml += `  <url><loc>${baseUrl}/articles/${a.slug}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
  }
  for (const pr of problems) {
    xml += `  <url><loc>${baseUrl}/problems/${pr.slug}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
  }

  xml += '</urlset>';

  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

// Dynamic robots.txt
publicRouter.get('/robots.txt', (req: Request, res: Response) => {
  const host = req.get('host');
  const baseUrl = process.env.APP_URL || (host ? `${req.protocol}://${host}` : 'https://nidpik.com');
  const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`;
  res.header('Content-Type', 'text/plain');
  res.send(robots);
});
