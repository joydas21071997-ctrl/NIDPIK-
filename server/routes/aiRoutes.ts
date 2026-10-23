import { Router, Request, Response } from 'express';
import { db } from '../../src/db';
import * as schema from '../../src/db/schema';
import { eq, and, or, lte, asc } from 'drizzle-orm';
import { GoogleGenAI, Type } from '@google/genai';
import { formatProductRow } from './productRoutes';

export const aiRouter = Router();

// Trending AI Presets for instant clicks
aiRouter.get('/presets', (req: Request, res: Response) => {
  res.json({
    presets: [
      {
        id: 'wfh-budget',
        label: 'WFH Desk Setup Under ₹999',
        query: 'What are the most essential work from home desk items under ₹999?',
        icon: 'Monitor'
      },
      {
        id: 'kitchen-daily',
        label: 'Small Kitchen Essentials Under ₹500',
        query: 'I have a compact kitchen. Which useful daily problem-solving gadgets should I buy under ₹500?',
        icon: 'Utensils'
      },
      {
        id: 'daily-99',
        label: 'High Utility Picks Under ₹99',
        query: 'Show me the best practical everyday utility products under ₹99 that are actually worth buying.',
        icon: 'Tag'
      },
      {
        id: 'student-hostel',
        label: 'College & Hostel Must-Haves',
        query: 'What are top durable and budget-friendly products for college students living in a hostel?',
        icon: 'GraduationCap'
      },
      {
        id: 'travel-pack',
        label: 'Compact Travel & Commute',
        query: 'Best compact travel, organizing, and daily metro commute accessories under ₹700.',
        icon: 'Luggage'
      }
    ]
  });
});

// POST /api/ai/recommend
aiRouter.post('/recommend', async (req: Request, res: Response) => {
  try {
    const { query, budgetMax, category } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    const cleanQuery = query.trim();

    // 1. Fetch published products from PostgreSQL via Drizzle
    const whereConditions: any[] = [eq(schema.products.status, 'PUBLISHED')];

    if (budgetMax && Number(budgetMax) > 0) {
      whereConditions.push(lte(schema.products.price, Number(budgetMax)));
    }

    if (category && category !== 'all') {
      whereConditions.push(
        or(
          eq(schema.products.category, category),
          eq(schema.products.categorySlug, category)
        )
      );
    }

    let productRows = await db.select()
      .from(schema.products)
      .where(and(...whereConditions))
      .orderBy(asc(schema.products.price));

    if (productRows.length === 0) {
      // Relax filters if no product found
      const fallbackRows = await db.select()
        .from(schema.products)
        .where(eq(schema.products.status, 'PUBLISHED'))
        .orderBy(asc(schema.products.price))
        .limit(10);

      return res.json({
        advice: `We couldn't find exact matches within the strict budget limit, but here are some of our top value-for-money recommendations for Indian shoppers.`,
        products: fallbackRows.map(formatProductRow),
        reasons: {}
      });
    }

    // Format products catalog preview for Gemini context
    const catalogSummary = productRows.slice(0, 35).map((p: any) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      category: p.category,
      price: p.price,
      quickVerdict: p.quickVerdict ?? p.quick_verdict,
      bestFor: p.bestFor ?? p.best_for,
      problemTags: (() => {
        try {
          return JSON.parse(p.problemTagsJson ?? p.problem_tags_json ?? '[]');
        } catch {
          return [];
        }
      })()
    }));

    // Check if GEMINI_API_KEY is available
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI();
        const systemPrompt = `You are NIDPIK's expert AI Product Buying Advisor. NIDPIK is India's most honest, practical product discovery and buying guide platform focusing on high utility and budget-friendly picks (from ₹99).
Analyze the user's requirement and recommend the best 2 to 4 products ONLY from the provided product catalog below.

Rules:
1. Recommend ONLY products present in the catalog using their exact 'id'.
2. Provide a clear, honest, conversational advice summary explaining why these picks suit the user's need.
3. If the user asked in Bengali or English, reply in friendly, clear English (or Bengali if the user specifically converses in Bengali, or natural easy English with high clarity).
4. For each selected product ID, give a specific 1-2 sentence reason why it fits this user's situation.
5. Strictly return valid JSON following the schema.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `User query: "${cleanQuery}"
Requested max budget: ${budgetMax ? '₹' + budgetMax : 'Not specified'}
Preferred category: ${category || 'Any'}

Available Products Catalog:
${JSON.stringify(catalogSummary, null, 2)}`
                }
              ]
            }
          ],
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                advice: {
                  type: Type.STRING,
                  description: 'Practical, honest advice explaining the picks for Indian shoppers.'
                },
                selectedProductIds: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'List of 2 to 4 product IDs from the catalog that best solve this requirement.'
                },
                reasons: {
                  type: Type.OBJECT,
                  description: 'Map of productId to a specific justification sentence.',
                  properties: {}
                }
              },
              required: ['advice', 'selectedProductIds', 'reasons']
            }
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          const selectedMap = new Map(productRows.map((p: any) => [p.id, p]));
          
          const matchedProducts = (parsed.selectedProductIds || [])
            .map((id: string) => selectedMap.get(id))
            .filter(Boolean)
            .map(formatProductRow);

          if (matchedProducts.length > 0) {
            return res.json({
              advice: parsed.advice,
              products: matchedProducts,
              reasons: parsed.reasons || {},
              isAiPowered: true
            });
          }
        }
      } catch (geminiError: any) {
        console.warn('[NIDPIK AI] Gemini call fallback to heuristic engine:', geminiError?.message || geminiError);
      }
    }

    // Heuristic Fallback (zero cost, 100% offline resilient)
    const lowerQ = cleanQuery.toLowerCase();
    const scoredProducts = productRows.map((p: any) => {
      let score = 0;
      const text = `${p.name} ${p.brand} ${p.category} ${p.subcategory} ${p.bestFor ?? p.best_for} ${p.quickVerdict ?? p.quick_verdict} ${p.problemTagsJson ?? p.problem_tags_json}`.toLowerCase();
      
      const words = lowerQ.split(/\s+/).filter((w) => w.length > 2);
      for (const w of words) {
        if (text.includes(w)) score += 2;
      }
      if (lowerQ.includes('kitchen') && text.includes('kitchen')) score += 5;
      if (lowerQ.includes('wfh') || lowerQ.includes('desk') || lowerQ.includes('office')) {
        if (text.includes('desk') || text.includes('wfh') || text.includes('work')) score += 5;
      }
      if (lowerQ.includes('student') || lowerQ.includes('hostel')) {
        if (text.includes('student') || text.includes('hostel') || text.includes('daily')) score += 4;
      }
      if (lowerQ.includes('clean') || lowerQ.includes('cleaning')) {
        if (text.includes('clean')) score += 5;
      }
      return { p, score };
    });

    scoredProducts.sort((a, b) => b.score - a.score);
    const topPicks = scoredProducts
      .slice(0, 4)
      .map((item) => formatProductRow(item.p))
      .filter((prod): prod is NonNullable<typeof prod> => prod !== null);

    const fallbackReasons: Record<string, string> = {};
    for (const prod of topPicks) {
      if (prod) {
        fallbackReasons[prod.id] = prod.quickVerdict || prod.bestFor || 'Top-rated value pick in our testing.';
      }
    }

    res.json({
      advice: `Here are NIDPIK's top-recommended, value-for-money picks matched for "${cleanQuery}". Each product has been curated for durability, daily practical utility, and transparent pricing.`,
      products: topPicks,
      reasons: fallbackReasons,
      isAiPowered: false
    });
  } catch (error: any) {
    console.error('[NIDPIK AI] Error processing recommendation:', error);
    res.status(500).json({ error: 'Failed to process product recommendation' });
  }
});
