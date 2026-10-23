import { pgTable, text, integer, doublePrecision, timestamp, varchar } from 'drizzle-orm/pg-core';

// 1. USERS
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  salt: text('salt').notNull(),
  name: text('name').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('EDITOR'),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: text('created_at').notNull(),
  lastLogin: text('last_login')
});

// 2. SESSIONS
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull()
});

// 3. PRODUCTS
export const products = pgTable('products', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  brand: text('brand').notNull(),
  category: text('category').notNull(),
  categorySlug: text('category_slug').notNull(),
  subcategory: text('subcategory').notNull(),
  price: doublePrecision('price').notNull(),
  oldPrice: doublePrecision('old_price'),
  currency: text('currency').notNull().default('₹'),
  badge: text('badge'),
  image: text('image').notNull(),
  galleryJson: text('gallery_json').default('[]'),
  shortDescription: text('short_description').notNull(),
  quickVerdict: text('quick_verdict').notNull(),
  bestFor: text('best_for').notNull(),
  notIdealFor: text('not_ideal_for'),
  featuresJson: text('features_json').notNull().default('[]'),
  specificationsJson: text('specifications_json').notNull().default('{}'),
  prosJson: text('pros_json').notNull().default('[]'),
  consJson: text('cons_json').notNull().default('[]'),
  merchantJson: text('merchant_json').notNull(),
  affiliateUrl: text('affiliate_url').notNull(),
  affiliateNetwork: text('affiliate_network').default('Amazon Associates'),
  lastUpdated: text('last_updated').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('PUBLISHED'),
  ratingDisplay: text('rating_display'),
  inStock: integer('in_stock').notNull().default(1),
  budgetTier: doublePrecision('budget_tier').notNull(),
  problemTagsJson: text('problem_tags_json').default('[]'),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  canonicalUrl: text('canonical_url'),
  ogImage: text('og_image'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
});

// 4. CATEGORIES
export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  iconName: text('icon_name').notNull(),
  image: text('image'),
  subcategoriesJson: text('subcategories_json').notNull().default('[]'),
  featuredProductIdsJson: text('featured_product_ids_json').notNull().default('[]'),
  faqsJson: text('faqs_json').notNull().default('[]'),
  isFeatured: integer('is_featured').notNull().default(0),
  orderIndex: integer('order_index').notNull().default(0),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  status: varchar('status', { length: 20 }).notNull().default('PUBLISHED'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
});

// 5. ARTICLES
export const articles = pgTable('articles', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  categorySlug: text('category_slug').notNull(),
  excerpt: text('excerpt').notNull(),
  authorId: text('author_id').notNull(),
  publishedAt: text('published_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  readingTime: text('reading_time').notNull(),
  image: text('image').notNull(),
  contentJson: text('content_json').notNull().default('[]'),
  tagsJson: text('tags_json').notNull().default('[]'),
  recommendedProductIdsJson: text('recommended_product_ids_json').notNull().default('[]'),
  status: varchar('status', { length: 20 }).notNull().default('PUBLISHED'),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  canonicalUrl: text('canonical_url'),
  ogImage: text('og_image'),
  createdAt: text('created_at').notNull()
});

// 6. BUYING GUIDES
export const buyingGuides = pgTable('buying_guides', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  categorySlug: text('category_slug').notNull(),
  subtitle: text('subtitle').notNull(),
  quickAnswer: text('quick_answer').notNull(),
  authorId: text('author_id').notNull(),
  publishedAt: text('published_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  readingTime: text('reading_time').notNull(),
  featuredProductIdsJson: text('featured_product_ids_json').notNull().default('[]'),
  budgetRange: text('budget_range').notNull(),
  whatToLookForJson: text('what_to_look_for_json').notNull().default('[]'),
  whoShouldBuy: text('who_should_buy').notNull(),
  whoShouldSkip: text('who_should_skip').notNull(),
  faqsJson: text('faqs_json').notNull().default('[]'),
  status: varchar('status', { length: 20 }).notNull().default('PUBLISHED'),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  canonicalUrl: text('canonical_url'),
  ogImage: text('og_image'),
  createdAt: text('created_at').notNull()
});

// 7. COMPARISONS
export const comparisons = pgTable('comparisons', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  subtitle: text('subtitle').notNull(),
  category: text('category').notNull(),
  categorySlug: text('category_slug').notNull(),
  productIdsJson: text('product_ids_json').notNull().default('[]'),
  winnerProductId: text('winner_product_id'),
  verdictSummary: text('verdict_summary').notNull(),
  comparisonPointsJson: text('comparison_points_json').notNull().default('[]'),
  authorId: text('author_id').notNull(),
  updatedAt: text('updated_at').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('PUBLISHED'),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  canonicalUrl: text('canonical_url'),
  ogImage: text('og_image'),
  createdAt: text('created_at').notNull()
});

// 8. REVIEWS
export const reviews = pgTable('reviews', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  productId: text('product_id').notNull(),
  authorId: text('author_id').notNull(),
  updatedAt: text('updated_at').notNull(),
  readingTime: text('reading_time').notNull(),
  verdict: text('verdict').notNull(),
  whoItIsFor: text('who_it_is_for').notNull(),
  whatWeLikedJson: text('what_we_liked_json').notNull().default('[]'),
  whatWeDidNotLikeJson: text('what_we_did_not_like_json').notNull().default('[]'),
  inDepthTesting: text('in_depth_testing').notNull(),
  finalRatingText: text('final_rating_text').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('PUBLISHED'),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  canonicalUrl: text('canonical_url'),
  ogImage: text('og_image'),
  createdAt: text('created_at').notNull()
});

// 9. PROBLEM COLLECTIONS
export const problemCollections = pgTable('problem_collections', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  tagline: text('tagline').notNull(),
  description: text('description').notNull(),
  image: text('image').notNull(),
  targetUser: text('target_user').notNull(),
  productIdsJson: text('product_ids_json').notNull().default('[]'),
  adviceTipsJson: text('advice_tips_json').notNull().default('[]'),
  status: varchar('status', { length: 20 }).notNull().default('PUBLISHED'),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
});

// 10. BUDGET TIERS
export const budgetTiers = pgTable('budget_tiers', {
  amount: doublePrecision('amount').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  headline: text('headline').notNull(),
  description: text('description').notNull(),
  recommendedCategory: text('recommended_category').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
});

// 11. MERCHANTS
export const merchants = pgTable('merchants', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  logoText: text('logo_text').notNull(),
  logoImage: text('logo_image'),
  badgeColor: text('badge_color').notNull(),
  affiliateBaseUrl: text('affiliate_base_url').notNull(),
  affiliateNetwork: text('affiliate_network').default('Direct Affiliate'),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
});

// 12. AFFILIATE LINKS
export const affiliateLinks = pgTable('affiliate_links', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull(),
  merchantId: text('merchant_id').notNull(),
  affiliateUrl: text('affiliate_url').notNull(),
  destinationUrl: text('destination_url'),
  trackingInfo: text('tracking_info'),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  lastCheckedAt: text('last_checked_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
});

// 13. AUTHORS
export const authors = pgTable('authors', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  avatar: text('avatar').notNull(),
  bio: text('bio').notNull(),
  socialLinksJson: text('social_links_json').default('{}'),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
});

// 14. MEDIA
export const media = pgTable('media', {
  id: text('id').primaryKey(),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  url: text('url').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  width: integer('width'),
  height: integer('height'),
  altText: text('alt_text'),
  title: text('title'),
  createdAt: text('created_at').notNull()
});

// 15. SETTINGS
export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  valueJson: text('value_json').notNull(),
  updatedAt: text('updated_at').notNull()
});

// 16. AUDIT LOGS
export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  userEmail: text('user_email').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  detailsJson: text('details_json').default('{}'),
  createdAt: text('created_at').notNull()
});

// 17. AFFILIATE CLICKS
export const affiliateClicks = pgTable('affiliate_clicks', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull(),
  merchantId: text('merchant_id').notNull(),
  sourcePage: text('source_page').notNull(),
  ctaType: text('cta_type').notNull(),
  createdAt: text('created_at').notNull()
});

// 18. PRICE ALERTS
export const priceAlerts = pgTable('price_alerts', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull(),
  email: text('email').notNull(),
  targetPrice: doublePrecision('target_price').notNull(),
  currentPrice: doublePrecision('current_price').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: text('created_at').notNull()
});

// 19. USER REVIEWS
export const userReviews = pgTable('user_reviews', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull(),
  authorName: text('author_name').notNull(),
  authorEmail: text('author_email').notNull(),
  rating: integer('rating').notNull(),
  headline: text('headline').notNull(),
  comment: text('comment').notNull(),
  isVerified: integer('is_verified').notNull().default(1),
  status: varchar('status', { length: 20 }).notNull().default('APPROVED'),
  createdAt: text('created_at').notNull()
});

// 20. NEWSLETTER SUBSCRIBERS
export const newsletterSubscribers = pgTable('newsletter_subscribers', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  source: text('source').default('website'),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: text('created_at').notNull()
});
