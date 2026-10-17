import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { buyingGuides, getGuideBySlug, getProductBySlug, getAuthorById } from '../data';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { DisclosureBox } from '../components/DisclosureBox';
import { ProductCard } from '../components/ProductCard';
import { ComparisonTable } from '../components/ComparisonTable';
import { BookOpen, Calendar, Clock, Check, X, ArrowRight, HelpCircle, ChevronDown, User } from 'lucide-react';

export const BuyingGuidesPage: React.FC = () => {
  const { navigate } = useApp();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumbs items={[{ label: 'Buying Guides' }]} />

      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Comprehensive Buying Guides
        </h1>
        <p className="text-slate-600 text-sm max-w-2xl">
          Detailed decision frameworks, feature checklists, and lab-tested recommendations written specifically for everyday consumer needs and value budgets.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        {buyingGuides.map((guide) => (
          <div
            key={guide.id}
            onClick={() => navigate(`/buying-guides/${guide.slug}`)}
            className="nidpik-card rounded-xl sm:rounded-2xl p-3.5 sm:p-6 cursor-pointer group flex flex-col justify-between space-y-2.5 sm:space-y-4"
          >
            <div>
              <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-500 mb-1.5 font-medium">
                <span className="text-blue-600 font-semibold">{guide.category}</span>
                <span aria-hidden="true">·</span>
                <span>{guide.readingTime}</span>
              </div>
              <h3 className="text-xs sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                {guide.title}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                {guide.subtitle}
              </p>
            </div>

            <div className="p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <span className="font-semibold text-slate-800 block mb-0.5 text-[11px]">Quick Answer:</span>
              <p className="text-[10px] sm:text-[11px] text-slate-600 line-clamp-2">{guide.quickAnswer}</p>
            </div>

            <div className="pt-2 sm:pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
              <span>Read Full Guide</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface BuyingGuideDetailPageProps {
  slug: string;
}

export const BuyingGuideDetailPage: React.FC<BuyingGuideDetailPageProps> = ({ slug }) => {
  const { navigate } = useApp();
  const guide = getGuideBySlug(slug);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  if (!guide) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Guide Not Found</h1>
        <p className="text-slate-600 mb-6 text-sm">We couldn't locate this buying guide.</p>
        <button
          onClick={() => navigate('/buying-guides')}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold"
        >
          View All Buying Guides
        </button>
      </div>
    );
  }

  const author = getAuthorById(guide.authorId);
  const featuredProducts = guide.featuredProductIds
    .map((id) => getProductBySlug(id))
    .filter(Boolean);

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-10 overflow-hidden text-left">
      {/* BREADCRUMBS */}
      <Breadcrumbs
        items={[
          { label: 'Buying Guides', href: '/buying-guides' },
          { label: guide.category, href: `/category/${guide.categorySlug}` },
          { label: guide.title }
        ]}
      />

      {/* ARTICLE HEADER */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider">
          <span>{guide.category}</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>Target Budget: {guide.budgetRange}</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {guide.title}
        </h1>

        <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
          {guide.subtitle}
        </p>

        {/* METADATA BAR (UNBOXED WITH TYPOGRAPHIC SEPARATORS) */}
        <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span className="font-semibold text-slate-800">{author?.name || 'NIDPIK Editorial Team'}</span>
          <span aria-hidden="true">·</span>
          <span>Published {guide.publishedAt}</span>
          <span aria-hidden="true">·</span>
          <span>Updated {guide.updatedAt}</span>
          <span aria-hidden="true">·</span>
          <span>{guide.readingTime}</span>
        </div>
      </div>

      {/* QUICK ANSWER / TL;DR BOX */}
      <div className="bg-blue-50/70 border-2 border-blue-200 rounded-3xl p-6 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          The Quick Answer (TL;DR)
        </div>
        <p className="text-sm text-slate-800 leading-relaxed font-medium">
          {guide.quickAnswer}
        </p>
      </div>

      {/* DISCLOSURE */}
      <DisclosureBox />

      {/* TOP RECOMMENDATIONS CARDS */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Top Recommendations
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Based on our test criteria for real-world daily commuting and usage
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {featuredProducts.map((p) => p && (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>

      {/* COMPARISON MATRIX (IF 2+ FEATURED PRODUCTS) */}
      {featuredProducts.length >= 2 && (
        <div className="space-y-4 pt-6 border-t border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            Head-to-Head Spec Matrix
          </h2>
          <ComparisonTable products={featuredProducts as any} />
        </div>
      )}

      {/* WHAT TO LOOK FOR (CHECKLIST) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <h2 className="text-xl font-bold text-slate-900">
          What to Look for Before Buying
        </h2>
        <div className="space-y-4">
          {guide.whatToLookFor.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-mono">
                  {idx + 1}
                </span>
                {item.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed pl-7">
                {item.explanation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* WHO SHOULD BUY VS SKIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-600" />
            Who Should Buy This
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed">
            {guide.whoShouldBuy}
          </p>
        </div>

        <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
            <X className="w-4 h-4 text-amber-600" />
            Who Should Skip / Look Elsewhere
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed">
            {guide.whoShouldSkip}
          </p>
        </div>
      </div>

      {/* FAQS */}
      {guide.faqs && guide.faqs.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            Frequently Asked Questions
          </h2>
          <div className="space-y-2">
            {guide.faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={index} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full p-4 text-left flex items-center justify-between text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AUTHOR BIO */}
      {author && (
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-4">
          <img
            src={author.avatar}
            alt={author.name}
            className="w-12 h-12 rounded-full object-cover shrink-0"
          />
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Written By</span>
            <h4 className="text-sm font-bold text-slate-900">{author.name} · {author.role}</h4>
            <p className="text-xs text-slate-500 leading-relaxed">{author.bio}</p>
          </div>
        </div>
      )}
    </div>
  );
};
