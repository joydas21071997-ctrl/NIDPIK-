import React from 'react';
import { useApp } from '../context/AppContext';
import { getBudgetTierBySlug, getBudgetTierByAmount, budgetTiers, products, buyingGuides } from '../data';
import { ProductCard } from '../components/ProductCard';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { DisclosureBox } from '../components/DisclosureBox';
import { Tag, Sparkles, ArrowRight, ShieldCheck, Check } from 'lucide-react';

interface BudgetListingPageProps {
  slug: string;
}

export const BudgetListingPage: React.FC<BudgetListingPageProps> = ({ slug }) => {
  const { navigate, formatPrice, selectedCountry } = useApp();
  const tier = getBudgetTierBySlug(slug) || budgetTiers[0];

  // Get products strictly <= tier.amount
  const tierProducts = products.filter((p) => p.price <= tier.amount);

  // Related buying guides within this price scope
  const relatedGuides = buyingGuides.slice(0, 2);

  const getCountryName = () => {
    switch (selectedCountry) {
      case 'US': return 'US';
      case 'UK': return 'UK';
      case 'CA': return 'Canada';
      default: return 'India';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* BREADCRUMBS */}
      <Breadcrumbs
        items={[
          { label: 'Budget Discovery', href: '/best-under-99' },
          { label: `Under ${formatPrice(tier.amount)}` }
        ]}
      />

      {/* HERO BANNER */}
      <div className="bg-gradient-to-br from-blue-50/80 via-white to-blue-50/40 rounded-3xl p-6 sm:p-8 border border-blue-100 shadow-xs space-y-4">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-md">
          <Tag className="w-3.5 h-3.5" />
          Budget Discovery: Starts from {formatPrice(99)}
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Best Picks Under {formatPrice(tier.amount)}
        </h1>

        <p className="text-slate-600 text-sm sm:text-base max-w-3xl leading-relaxed">
          {tier.description} We handpick products that offer true durability, avoiding disposable novelty items so every unit of currency spent provides lasting real-world utility.
        </p>

        {/* QUICK SWITCHER FOR ALL BUDGET TIERS */}
        <div className="pt-4 border-t border-blue-100/80">
          <span className="text-xs font-semibold text-slate-500 block mb-2">Switch Budget:</span>
          <div className="flex flex-wrap gap-2">
            {budgetTiers.map((b) => (
              <button
                key={b.slug}
                onClick={() => navigate(`/${b.slug}`)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  b.slug === tier.slug
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400'
                }`}
              >
                {formatPrice(b.amount)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* DISCLOSURE */}
      <DisclosureBox compact={true} />

      {/* PRODUCTS UNDER THIS BUDGET */}
      <div>
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Tested Picks Priced Under {formatPrice(tier.amount)}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {tierProducts.length} verified products within this budget ceiling
            </p>
          </div>
        </div>


        {tierProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
            {tierProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-10 text-center text-slate-500 border border-slate-200">
            <p className="text-sm font-semibold">No direct products strictly under this ceiling in current demo filter.</p>
            <p className="text-xs text-slate-400 mt-1">Check adjacent budget ranges starting from {formatPrice(99)}.</p>
          </div>
        )}
      </div>

      {/* EDITORIAL CONTEXT & BUYING GUIDANCE */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-lg font-bold text-slate-900">
          How to Pick the Best Value Under {formatPrice(tier.amount)}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600 leading-relaxed">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <span className="font-bold text-slate-900 block">1. Material Quality First</span>
            <p>
              Under {formatPrice(tier.amount)}, avoid fragile plastic mechanisms with moving joints. Look for dense microfibers, 304 food-grade stainless steel, and ballistic nylon weaves.
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <span className="font-bold text-slate-900 block">2. Brand Warranty Verification</span>
            <p>
              Prefer verified brands with authorized service centers and responsive customer support rather than anonymous unbranded importers.
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
            <span className="font-bold text-slate-900 block">3. Multi-Purpose Utility</span>
            <p>
              The best budget products do two jobs well: an electric kettle boils water for chai and cooks instant eggs, giving double return on investment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
