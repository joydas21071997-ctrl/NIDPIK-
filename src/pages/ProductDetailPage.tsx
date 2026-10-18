import React, { useState, useEffect } from 'react';
import { useApp, COUNTRIES } from '../context/AppContext';
import { getProductBySlug as staticGetProductBySlug, products, buyingGuides, comparisons, reviews } from '../data';
import { api } from '../services/api';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { DisclosureBox } from '../components/DisclosureBox';
import { ProductCard } from '../components/ProductCard';
import {
  ExternalLink,
  Heart,
  Scale,
  Check,
  X,
  ShieldCheck,
  Package,
  Sparkles,
  Info,
  Calendar,
  AlertCircle,
  Bell,
  Star,
  TrendingDown,
  Send,
  MessageSquare,
  Clock
} from 'lucide-react';

interface ProductDetailPageProps {
  slug: string;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ slug }) => {
  const {
    navigate,
    toggleSaveProduct,
    isProductSaved,
    addToCompare,
    removeFromCompare,
    isProductInCompare,
    triggerAffiliateClick,
    selectedCountry,
    formatPrice,
    getProductBySlug: getProductFromContext
  } = useApp();

  const currentCountry = COUNTRIES.find((c) => c.code === selectedCountry) || COUNTRIES[0];

  const product = (getProductFromContext && getProductFromContext(slug)) || staticGetProductBySlug(slug);
  const [imgError, setImgError] = useState(false);

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Product Not Found</h1>
        <p className="text-slate-600 mb-6 text-sm">
          The requested product could not be located in our research catalog.
        </p>
        <button
          onClick={() => navigate('/products')}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold"
        >
          Browse All Products
        </button>
      </div>
    );
  }

  const saved = isProductSaved(product.id);
  const inCompare = isProductInCompare(product.id);

  const discountPercent = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : null;

  // Price Drop Alert State
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertEmail, setAlertEmail] = useState('');
  const [alertTargetPrice, setAlertTargetPrice] = useState(Math.floor(product.price * 0.9));
  const [alertSubmitting, setAlertSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // User Reviews State
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState({ totalCount: 0, averageRating: 5.0 });
  const [writeReviewOpen, setWriteReviewOpen] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewEmail, setReviewEmail] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHeadline, setReviewHeadline] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (product?.id) {
      api.products
        .getUserReviews(product.id)
        .then((res) => {
          if (res && res.reviews) {
            setReviewsList(res.reviews);
            setReviewStats({ totalCount: res.totalCount, averageRating: res.averageRating });
          }
        })
        .catch(() => {});
    }
  }, [product?.id]);

  const handlePriceAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertEmail || !alertEmail.includes('@')) return;
    setAlertSubmitting(true);
    try {
      const res = await api.products.setPriceAlert(product.id, {
        email: alertEmail,
        targetPrice: alertTargetPrice
      });
      setAlertMessage(res.message);
      setAlertEmail('');
    } catch (err: any) {
      setAlertMessage(err?.message || 'Failed to set price alert.');
    } finally {
      setAlertSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) return;
    setReviewSubmitting(true);
    try {
      const res = await api.products.submitUserReview(product.id, {
        authorName: reviewName,
        authorEmail: reviewEmail || 'hello@nidpik.com',
        rating: reviewRating,
        headline: reviewHeadline,
        comment: reviewComment
      });
      setReviewSuccessMsg(res.message);
      setReviewName('');
      setReviewHeadline('');
      setReviewComment('');
      // Reload reviews
      api.products.getUserReviews(product.id).then((r) => {
        if (r && r.reviews) {
          setReviewsList(r.reviews);
          setReviewStats({ totalCount: r.totalCount, averageRating: r.averageRating });
        }
      });
    } catch (err: any) {
      setReviewSuccessMsg(err?.message || 'Could not submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Similar products in the same category
  const similarProducts = products
    .filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id)
    .slice(0, 3);

  // Relevant comparisons containing this product
  const relevantComparisons = comparisons.filter((c) =>
    c.productIds.includes(product.id as any)
  );

  // Relevant guides
  const relevantGuides = buyingGuides.filter(
    (g) => g.categorySlug === product.categorySlug || g.featuredProductIds.includes(product.id)
  );

  // Schema.org Product JSON-LD for SEO
  const productSchema = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: [product.image],
    description: product.shortDescription,
    brand: {
      '@type': 'Brand',
      name: product.brand
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: product.price,
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: product.merchant.name
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Schema.org Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      {/* BREADCRUMBS */}
      <Breadcrumbs
        items={[
          { label: 'Products', href: '/products' },
          { label: product.category, href: `/category/${product.categorySlug}` },
          { label: product.name }
        ]}
      />

      {/* TOP SUMMARY CARD (SPLIT LAYOUT) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: IMAGE MEDIA */}
          <div className="lg:col-span-5 relative bg-[#F8FAFC] rounded-2xl p-6 border border-slate-200/80 flex items-center justify-center aspect-square">
            {product.badge && (
              <div className="absolute top-4 left-4 z-10">
                <span className="text-xs font-semibold text-slate-800 bg-white/95 px-3 py-1 rounded-md border border-slate-200 shadow-2xs">
                  {product.badge}
                </span>
              </div>
            )}

            <button
              onClick={() => toggleSaveProduct(product.id)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/95 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-rose-500 transition-colors shadow-2xs"
              title={saved ? 'Remove from saved' : 'Save to wishlist'}
            >
              <Heart className={`w-4 h-4 ${saved ? 'text-rose-500 fill-rose-500' : ''}`} />
            </button>

            {imgError ? (
              <div className="flex flex-col items-center text-slate-400">
                <Package className="w-16 h-16 stroke-1 text-slate-400 mb-2" />
                <span className="text-xs font-medium">{product.name}</span>
              </div>
            ) : (
              <img
                src={product.image}
                alt={product.name}
                onError={() => setImgError(true)}
                referrerPolicy="no-referrer"
                className="max-h-72 w-full object-contain mix-blend-multiply"
              />
            )}
          </div>

          {/* RIGHT: PURCHASE / VERDICT CONTIGUOUS MODULE */}
          <div className="lg:col-span-7 space-y-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
                <span className="font-semibold text-blue-600">{product.brand}</span>
                <span aria-hidden="true">·</span>
                <span>{product.subcategory}</span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Calendar className="w-3 h-3" />
                  Checked {product.lastUpdated}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                {product.name}
              </h1>

              {product.ratingDisplay && (
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                  <Sparkles className="w-3.5 h-3.5" />
                  {product.ratingDisplay}
                </div>
              )}
            </div>

            {/* Price Row */}
            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-500 block mb-0.5">
                    Estimated Price on {product.merchant.name}
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
                      {formatPrice(product.price)}
                    </span>
                    {product.oldPrice && (
                      <span className="text-sm text-slate-600 line-through tabular-nums">
                        MRP {formatPrice(product.oldPrice)}
                      </span>
                    )}
                    {discountPercent && (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        Save {discountPercent}%
                      </span>
                    )}
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => triggerAffiliateClick(product)}
                    className="flex-1 sm:flex-initial py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <span>Check Price on {product.merchant.name.split(' ')[0]}</span>
                    <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    onClick={() => {
                      if (inCompare) {
                        removeFromCompare(product.id);
                      } else {
                        addToCompare(product.id);
                      }
                    }}
                    className={`p-3 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                      inCompare
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                    title={inCompare ? 'Remove from compare' : 'Compare with other products'}
                  >
                    <Scale className="w-4 h-4 text-blue-600" />
                    <span className="hidden sm:inline">{inCompare ? 'In Compare' : 'Compare'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* PRICE DROP TRACKER & ALERT NOTIFIER */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Price Tracker &amp; Deal Alert
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Lowest recorded price: <strong className="text-slate-700">{formatPrice(Math.round(product.price * 0.92))}</strong>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAlertOpen(!alertOpen)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5 text-blue-600" />
                  <span>{alertOpen ? 'Close Alert' : 'Set Price Drop Alert'}</span>
                </button>
              </div>

              {alertOpen && (
                <form onSubmit={handlePriceAlertSubmit} className="pt-3 border-t border-slate-100 space-y-2.5 animate-in fade-in duration-150">
                  <p className="text-xs text-slate-600 font-medium">
                    We track verified retail prices daily. Get an instant email alert when this item drops below your target:
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      required
                      placeholder="Your email address (e.g. name@gmail.com)"
                      value={alertEmail}
                      onChange={(e) => setAlertEmail(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900"
                    />
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1">
                      <span className="text-xs font-bold text-slate-500">Target ({currentCountry.currencySymbol})</span>
                      <input
                        type="number"
                        required
                        value={alertTargetPrice}
                        onChange={(e) => setAlertTargetPrice(Number(e.target.value))}
                        className="w-20 text-xs bg-transparent focus:outline-none font-bold text-slate-900"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={alertSubmitting}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors shrink-0 disabled:opacity-60 cursor-pointer"
                    >
                      {alertSubmitting ? 'Saving...' : 'Set Alert'}
                    </button>
                  </div>
                  {alertMessage && (
                    <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                      {alertMessage}
                    </p>
                  )}
                </form>
              )}
            </div>

            {/* QUICK VERDICT CALLOUT */}
            <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-100/80 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block">
                Editor's Quick Verdict
              </span>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                "{product.quickVerdict}"
              </p>
            </div>

            {/* BEST FOR & NOT IDEAL FOR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100">
                <span className="font-bold text-emerald-800 flex items-center gap-1 mb-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Best For
                </span>
                <p className="text-slate-700 leading-relaxed">{product.bestFor}</p>
              </div>

              {product.notIdealFor && (
                <div className="p-3 bg-amber-50/40 rounded-xl border border-amber-100">
                  <span className="font-bold text-amber-800 flex items-center gap-1 mb-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    Not Ideal For
                  </span>
                  <p className="text-slate-700 leading-relaxed">{product.notIdealFor}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DISCLOSURE */}
      <DisclosureBox />

      {/* KEY FEATURES & PROS / CONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* PROS & CONS (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-xl font-bold text-slate-900">
              Honest Pros &amp; Cons
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Pros */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  What We Liked
                </h3>
                <ul className="space-y-2">
                  {product.pros.map((pro, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cons */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                  <X className="w-4 h-4 text-rose-500" />
                  Trade-Offs &amp; Limitations
                </h3>
                <ul className="space-y-2">
                  {product.cons.map((con, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Key Features */}
            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Key Highlights</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                {product.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SPECIFICATIONS TABLE (5 COLS) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-xl font-bold text-slate-900">
              Verified Specifications
            </h2>
            <div className="divide-y divide-slate-100 text-xs">
              {Object.entries(product.specifications).map(([key, val]) => (
                <div key={key} className="py-2.5 flex items-baseline justify-between gap-4">
                  <span className="text-slate-500 font-medium">{key}</span>
                  <span className="text-slate-900 font-semibold text-right tabular-nums">{val}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={() => triggerAffiliateClick(product)}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <span>View Full Tech Specs on {product.merchant.name}</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RELEVANT COMPARISONS SECTION */}
      {relevantComparisons.length > 0 && (
        <div className="pt-4 border-t border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-600" />
              Comparisons Featuring {product.name.split(' ')[0]}
            </h3>
            <button
              onClick={() => navigate('/compare')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              All Comparisons →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relevantComparisons.map((comp) => (
              <div
                key={comp.id}
                onClick={() => navigate(`/compare/${comp.slug}`)}
                className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 cursor-pointer transition-colors shadow-2xs group flex flex-col justify-between"
              >
                <div>
                  <span className="text-[11px] font-semibold text-blue-600">Head-to-Head</span>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors mt-1">
                    {comp.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {comp.verdictSummary}
                  </p>
                </div>
                <div className="mt-3 text-xs font-semibold text-blue-600">
                  Read comparison breakdown →
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COMMUNITY USER REVIEWS & RATINGS */}
      <div className="pt-8 border-t border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Community &amp; Buyer Reviews
              </h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {reviewStats.totalCount} {reviewStats.totalCount === 1 ? 'Review' : 'Reviews'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Real experiences from verified purchasers and daily users.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setWriteReviewOpen(!writeReviewOpen)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
            <span>{writeReviewOpen ? 'Cancel' : 'Write a Review'}</span>
          </button>
        </div>

        {/* WRITE REVIEW FORM */}
        {writeReviewOpen && (
          <form
            onSubmit={handleReviewSubmit}
            className="bg-white rounded-2xl border border-blue-200 p-5 sm:p-6 shadow-xs space-y-4 animate-in fade-in duration-150"
          >
            <h4 className="text-sm font-bold text-slate-900">
              Share your honest feedback on {product.name}
            </h4>

            {/* Rating Stars */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Your Rating (1 to 5 Stars):
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= reviewRating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300 hover:text-slate-400'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-700 ml-2">
                  {reviewRating} out of 5
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Name (or City):
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suman Roy (Kolkata)"
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Review Headline:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Best budget purchase this month!"
                  value={reviewHeadline}
                  onChange={(e) => setReviewHeadline(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detailed Experience &amp; Practical Tips:
              </label>
              <textarea
                rows={3}
                required
                placeholder="What did you like? Any issues or limitations other buyers should know about?"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900"
              />
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                All reviews are checked for authentic consumer experiences.
              </span>
              <button
                type="submit"
                disabled={reviewSubmitting}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {reviewSubmitting ? (
                  <span>Publishing...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Review</span>
                  </>
                )}
              </button>
            </div>

            {reviewSuccessMsg && (
              <p className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                {reviewSuccessMsg}
              </p>
            )}
          </form>
        )}

        {/* REVIEWS LIST */}
        <div className="space-y-3">
          {reviewsList.length === 0 ? (
            <div className="p-6 bg-slate-50/70 border border-slate-200 rounded-2xl text-center text-slate-500">
              <p className="text-xs font-medium">Be the first to leave a community review for this product!</p>
            </div>
          ) : (
            reviewsList.map((rev) => (
              <div
                key={rev.id}
                className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-slate-900">
                      {rev.headline || 'Verified Buyer Experience'}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
                    <Check className="w-3 h-3 text-emerald-600" />
                    Verified User
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-normal">
                  {rev.comment}
                </p>

                <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                  <span className="font-semibold text-slate-600">{rev.author_name}</span>
                  <span>•</span>
                  <span>{new Date(rev.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SIMILAR PRODUCTS */}
      {similarProducts.length > 0 && (
        <div className="pt-6 border-t border-slate-200 space-y-6">
          <div className="flex items-baseline justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Similar Alternatives</h3>
              <p className="text-xs text-slate-500 mt-0.5">Other tested options in {product.category}</p>
            </div>
            <button
              onClick={() => navigate(`/category/${product.categorySlug}`)}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              View More in {product.category} →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {similarProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
