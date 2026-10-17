import React from 'react';
import { useApp } from '../context/AppContext';
import { reviews, getReviewBySlug, getProductBySlug, getAuthorById } from '../data';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { DisclosureBox } from '../components/DisclosureBox';
import { ProductCard } from '../components/ProductCard';
import { FileText, Check, X, ArrowRight, ExternalLink, Sparkles, ShieldCheck } from 'lucide-react';

export const ReviewsPage: React.FC = () => {
  const { navigate, formatPrice } = useApp();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumbs items={[{ label: 'Reviews' }]} />

      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Editorial Product Reviews
        </h1>
        <p className="text-slate-600 text-sm max-w-2xl">
          Independent hands-on assessments. We buy or lab-test products to see how they perform in real daily usage before recommending them.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        {reviews.map((rev) => {
          const product = getProductBySlug(rev.productId);
          return (
            <div
              key={rev.id}
              onClick={() => navigate(`/reviews/${rev.slug}`)}
              className="nidpik-card rounded-xl sm:rounded-2xl p-3.5 sm:p-6 cursor-pointer group flex flex-col justify-between space-y-3 sm:space-y-4"
            >
              <div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Editorial Verdict
                </span>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors mt-2 leading-snug">
                  {rev.title}
                </h3>

                <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                  {rev.verdict}
                </p>
              </div>

              {product && (
                <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-3 border border-slate-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-10 h-10 object-contain rounded bg-white p-1"
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-slate-900 truncate block">
                      {product.name}
                    </span>
                    <span className="text-xs font-bold text-slate-700 tabular-nums">
                      {formatPrice(product.price)}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                <span>Read Full Review</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface ReviewDetailPageProps {
  slug: string;
}

export const ReviewDetailPage: React.FC<ReviewDetailPageProps> = ({ slug }) => {
  const { navigate, triggerAffiliateClick, formatPrice } = useApp();
  const review = getReviewBySlug(slug);

  if (!review) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Review Not Found</h1>
        <p className="text-slate-600 mb-6 text-sm">We couldn't locate this product review.</p>
        <button
          onClick={() => navigate('/reviews')}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold"
        >
          View All Reviews
        </button>
      </div>
    );
  }

  const product = getProductBySlug(review.productId);
  const author = getAuthorById(review.authorId);

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-10 overflow-hidden text-left">
      <Breadcrumbs
        items={[
          { label: 'Reviews', href: '/reviews' },
          { label: review.title }
        ]}
      />

      {/* HEADER */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider">
          <span>Hands-on Review</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>{review.readingTime}</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {review.title}
        </h1>

        <div className="flex items-center gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span className="font-semibold text-slate-800">{author?.name || 'Editorial Staff'}</span>
          <span aria-hidden="true">·</span>
          <span>Tested &amp; Updated {review.updatedAt}</span>
        </div>
      </div>

      {/* PRODUCT MEDIA & PRICE STRIP */}
      {product && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-slate-50 rounded-2xl p-2 border border-slate-100 flex items-center justify-center shrink-0">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-xs font-bold text-blue-600">{product.brand}</span>
              <h3 className="text-base font-bold text-slate-900 leading-snug">{product.name}</h3>
              <div className="text-sm font-bold text-slate-900 tabular-nums mt-0.5">
                {formatPrice(product.price)}{' '}
                {product.oldPrice && (
                  <span className="text-xs text-slate-400 font-normal line-through">
                    {formatPrice(product.oldPrice)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => triggerAffiliateClick(product)}
              className="flex-1 sm:flex-initial py-2.5 px-5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Check Price on {product.merchant.name.split(' ')[0]}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigate(`/product/${product.slug}`)}
              className="py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-xl transition-colors"
            >
              Specs
            </button>
          </div>
        </div>
      )}

      {/* FINAL SCORE CALLOUT */}
      <div className="bg-emerald-50/70 border-2 border-emerald-200 rounded-3xl p-6 space-y-2">
        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
          Editorial Score &amp; Verdict
        </span>
        <p className="text-sm text-slate-800 leading-relaxed font-medium">
          {review.verdict}
        </p>
        <div className="text-xs font-bold text-emerald-900 pt-2 border-t border-emerald-200/80">
          {review.finalRatingText}
        </div>
      </div>

      <DisclosureBox />

      {/* WHAT WE LIKED & DID NOT LIKE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-600" />
            What We Liked
          </h3>
          <ul className="space-y-2.5">
            {review.whatWeLiked.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
            <X className="w-4 h-4 text-rose-500" />
            What We Did Not Like
          </h3>
          <ul className="space-y-2.5">
            {review.whatWeDidNotLike.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* IN-DEPTH TESTING LOG */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-xl font-bold text-slate-900">
          Real-World Testing Observations
        </h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          {review.inDepthTesting}
        </p>
      </div>

      {/* WHO IT IS FOR */}
      <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 text-xs text-slate-700 space-y-1">
        <span className="font-bold text-blue-900 block">Who Should Buy This:</span>
        <p className="leading-relaxed">{review.whoItIsFor}</p>
      </div>
    </div>
  );
};
