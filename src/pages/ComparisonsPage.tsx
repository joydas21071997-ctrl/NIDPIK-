import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { comparisons, getComparisonBySlug, getProductBySlug, products, getAuthorById } from '../data';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { DisclosureBox } from '../components/DisclosureBox';
import { ComparisonTable } from '../components/ComparisonTable';
import { Scale, ArrowRight, Check, Trophy, ExternalLink, Sparkles } from 'lucide-react';

export const ComparisonsPage: React.FC = () => {
  const { navigate, compareProductIds } = useApp();

  // Custom comparison selector state
  const [productAId, setProductAId] = useState<string>(products[0]?.id || '');
  const [productBId, setProductBId] = useState<string>(products[1]?.id || '');

  const handleCustomCompare = (e: React.FormEvent) => {
    e.preventDefault();
    if (productAId && productBId && productAId !== productBId) {
      const pA = getProductBySlug(productAId);
      const pB = getProductBySlug(productBId);
      if (pA && pB) {
        navigate(`/compare/${pA.slug}-vs-${pB.slug}`);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <Breadcrumbs items={[{ label: 'Comparisons' }]} />

      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Product Comparisons
        </h1>
        <p className="text-slate-600 text-sm max-w-2xl">
          Direct head-to-head comparisons to help you choose between close contenders without biased marketing claims.
        </p>
      </div>

      {/* INTERACTIVE CUSTOM COMPARISON LAUNCHER */}
      <div className="bg-gradient-to-br from-blue-50/70 via-white to-blue-50/40 rounded-3xl p-6 sm:p-8 border border-blue-100 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
          <Scale className="w-4 h-4" />
          Interactive Product Compare Tool
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          Compare Any Two Products from our Catalog
        </h2>
        <p className="text-xs text-slate-600 max-w-xl">
          Select any two products from our verified catalog to inspect side-by-side specifications, prices, and trade-offs.
        </p>

        <form onSubmit={handleCustomCompare} className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          <div className="sm:col-span-5">
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Product A</label>
            <select
              value={productAId}
              onChange={(e) => setProductAId(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (₹{p.price})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 flex items-center justify-center pt-4 sm:pt-0">
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
              VS
            </span>
          </div>

          <div className="sm:col-span-5">
            <label className="text-[11px] font-semibold text-slate-500 block mb-1">Product B</label>
            <select
              value={productBId}
              onChange={(e) => setProductBId(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id} disabled={p.id === productAId}>
                  {p.name} (₹{p.price})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-12 pt-2">
            <button
              type="submit"
              disabled={productAId === productBId}
              className="py-2.5 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>Compare These Products</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>

      {/* CURATED COMPARISONS LIST */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Curated Head-to-Head Showdowns
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Detailed editorial breakdowns of the most popular questions in the Indian market
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
          {comparisons.map((comp) => {
            const compProducts = comp.productIds
              .map((id) => getProductBySlug(id))
              .filter(Boolean);

            return (
              <div
                key={comp.id}
                onClick={() => navigate(`/compare/${comp.slug}`)}
                className="nidpik-card rounded-xl sm:rounded-3xl p-3.5 sm:p-6 cursor-pointer group flex flex-col justify-between space-y-3 sm:space-y-4"
              >
                <div>
                  <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-500 mb-1.5 font-medium">
                    <span className="text-blue-600 font-semibold">{comp.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>Updated {comp.updatedAt}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                    {comp.title}
                  </h3>

                  <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                    {comp.subtitle}
                  </p>

                  {/* MINI PRODUCT PAIR PREVIEW */}
                  <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100">
                    {compProducts.map((p, idx) => p && (
                      <React.Fragment key={p.id}>
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-9 h-9 object-contain bg-slate-50 p-1 rounded-md shrink-0 border border-slate-200"
                          />
                          <div className="min-w-0 truncate">
                            <span className="text-xs font-semibold text-slate-900 block truncate">
                              {p.name}
                            </span>
                            <span className="text-[11px] text-slate-500 font-bold tabular-nums">
                              ₹{p.price}
                            </span>
                          </div>
                        </div>
                        {idx === 0 && <span className="text-xs font-bold text-slate-400">vs</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 line-clamp-2">
                  <span className="font-semibold text-slate-900 block mb-0.5">Quick Verdict:</span>
                  {comp.verdictSummary}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                  <span>Read Full Comparison Breakdown</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface ComparisonDetailPageProps {
  slug: string;
}

export const ComparisonDetailPage: React.FC<ComparisonDetailPageProps> = ({ slug }) => {
  const { navigate, triggerAffiliateClick } = useApp();

  // Check if slug is standard curated comparison or dynamic "a-vs-b"
  let comparison = getComparisonBySlug(slug);
  let productsToCompare: any[] = [];

  if (comparison) {
    productsToCompare = comparison.productIds
      .map((id) => getProductBySlug(id))
      .filter(Boolean);
  } else if (slug.includes('-vs-')) {
    // Dynamic comparison URL: e.g. "product-a-vs-product-b"
    const [slugA, slugB] = slug.split('-vs-');
    const pA = getProductBySlug(slugA);
    const pB = getProductBySlug(slugB);
    if (pA && pB) {
      productsToCompare = [pA, pB];
      comparison = {
        id: slug,
        title: `${pA.name} vs ${pB.name}`,
        slug: slug,
        subtitle: `Direct specification and value comparison between ${pA.brand} and ${pB.brand}.`,
        category: pA.category,
        categorySlug: pA.categorySlug,
        productIds: [pA.id, pB.id],
        verdictSummary: `Both products deliver strong value in ${pA.category}. Compare prices, dimensions, and specifications below to determine which fits your specific daily needs.`,
        comparisonPoints: [
          {
            feature: 'Pricing & Value',
            description: `${pA.name} costs ₹${pA.price} compared to ${pB.name} at ₹${pB.price}.`
          }
        ],
        authorId: 'rahul-sharma',
        updatedAt: 'October 2026'
      };
    }
  }

  if (!comparison || productsToCompare.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Comparison Not Found</h1>
        <p className="text-slate-600 mb-6 text-sm">We couldn't find this product matchup.</p>
        <button
          onClick={() => navigate('/compare')}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold"
        >
          View All Comparisons
        </button>
      </div>
    );
  }

  const author = getAuthorById(comparison.authorId);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 text-left">
      <Breadcrumbs
        items={[
          { label: 'Comparisons', href: '/compare' },
          { label: comparison.category, href: `/category/${comparison.categorySlug}` },
          { label: comparison.title }
        ]}
      />

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider">
          <span>{comparison.category}</span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>Head-to-Head Comparison</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {comparison.title}
        </h1>

        <p className="text-slate-600 text-base leading-relaxed">
          {comparison.subtitle}
        </p>

        <div className="flex items-center gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span className="font-semibold text-slate-800">{author?.name || 'NIDPIK Labs'}</span>
          <span aria-hidden="true">·</span>
          <span>Updated {comparison.updatedAt}</span>
        </div>
      </div>

      {/* VERDICT SUMMARY CALLOUT */}
      <div className="bg-blue-50/70 border-2 border-blue-200 rounded-3xl p-6 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
          <Trophy className="w-4 h-4 text-amber-500" />
          The Final Verdict &amp; Winner
        </div>
        <p className="text-sm text-slate-800 leading-relaxed font-medium">
          {comparison.verdictSummary}
        </p>
      </div>

      <DisclosureBox />

      {/* SIDE-BY-SIDE SPECIFICATION MATRIX */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">
          Side-by-Side Comparison Matrix
        </h2>
        <ComparisonTable products={productsToCompare} />
      </div>

      {/* DETAILED COMPARISON BREAKDOWNS */}
      {comparison.comparisonPoints && comparison.comparisonPoints.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <h2 className="text-xl font-bold text-slate-900">
            Key Feature Showdowns
          </h2>
          <div className="space-y-6">
            {comparison.comparisonPoints.map((point, idx) => (
              <div key={idx} className="space-y-2 border-b border-slate-100 pb-5 last:border-b-0 last:pb-0">
                <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                  <span>{point.feature}</span>
                  {point.winnerIndex !== undefined && productsToCompare[point.winnerIndex] && (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Winner: {productsToCompare[point.winnerIndex].name.split(' ')[0]}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {point.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
