import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getCategoryBySlug, getProductsForCategory, buyingGuides, comparisons, reviews, categories } from '../data';
import { ProductCard } from '../components/ProductCard';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { DisclosureBox } from '../components/DisclosureBox';
import { ChevronDown, ArrowRight, BookOpen, Scale, FileText, HelpCircle } from 'lucide-react';

interface CategoryPageProps {
  slug: string;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({ slug }) => {
  const { navigate } = useApp();
  const category = getCategoryBySlug(slug);

  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  if (!category) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Category Not Found</h1>
        <p className="text-slate-600 mb-6 text-sm">We couldn't find the category you're looking for.</p>
        <button
          onClick={() => navigate('/categories')}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold"
        >
          View All Categories
        </button>
      </div>
    );
  }

  const categoryProducts = getProductsForCategory(category.slug);
  const filteredProducts =
    selectedSubcategory === 'All'
      ? categoryProducts
      : categoryProducts.filter((p) => p.subcategory === selectedSubcategory);

  const relatedGuides = buyingGuides.filter((g) => g.categorySlug === category.slug);
  const relatedComparisons = comparisons.filter((c) => c.categorySlug === category.slug);
  const relatedReviews = reviews.filter((r) =>
    categoryProducts.some((p) => p.id === r.productId)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* BREADCRUMBS */}
      <Breadcrumbs
        items={[
          { label: 'Categories', href: '/categories' },
          { label: category.name }
        ]}
      />

      {/* CATEGORY HERO / INTRO */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="inline-block text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-md">
          Product Discovery Category
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {category.name}
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-3xl leading-relaxed">
          {category.description}
        </p>

        {/* SUBCATEGORY PILLS */}
        <div className="pt-4 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-xs font-semibold text-slate-400 shrink-0">Subcategories:</span>
          <button
            onClick={() => setSelectedSubcategory('All')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              selectedSubcategory === 'All'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All ({categoryProducts.length})
          </button>
          {category.subcategories.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubcategory(sub)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                selectedSubcategory === sub
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* DISCLOSURE */}
      <DisclosureBox compact={true} />

      {/* PRODUCTS GRID */}
      <div>
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {selectedSubcategory === 'All' ? `Recommended ${category.name}` : selectedSubcategory}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {filteredProducts.length} editor-evaluated picks
            </p>
          </div>
          <button
            onClick={() => navigate('/products')}
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            All Products Catalog →
          </button>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-2xl p-10 text-center text-slate-500 border border-slate-200">
            <p className="text-sm font-semibold">No products in this specific subcategory yet.</p>
            <p className="text-xs text-slate-400 mt-1">
              Switch to "All" or browse our comprehensive buying guides below.
            </p>
          </div>
        )}
      </div>

      {/* BUYING GUIDES & COMPARISONS IN THIS CATEGORY */}
      {(relatedGuides.length > 0 || relatedComparisons.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-200">
          {/* Guides */}
          {relatedGuides.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                {category.name} Buying Guides
              </h3>
              <div className="space-y-3">
                {relatedGuides.map((guide) => (
                  <div
                    key={guide.id}
                    onClick={() => navigate(`/buying-guides/${guide.slug}`)}
                    className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 cursor-pointer transition-colors shadow-2xs group"
                  >
                    <span className="text-[11px] font-semibold text-blue-600">
                      {guide.readingTime}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors mt-1">
                      {guide.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {guide.subtitle}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comparisons */}
          {relatedComparisons.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Scale className="w-5 h-5 text-blue-600" />
                Head-to-Head Comparisons
              </h3>
              <div className="space-y-3">
                {relatedComparisons.map((comp) => (
                  <div
                    key={comp.id}
                    onClick={() => navigate(`/compare/${comp.slug}`)}
                    className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 cursor-pointer transition-colors shadow-2xs group"
                  >
                    <span className="text-[11px] font-semibold text-slate-400">
                      Updated {comp.updatedAt}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors mt-1">
                      {comp.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {comp.verdictSummary}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CATEGORY FAQS */}
      {category.faqs && category.faqs.length > 0 && (
        <div className="pt-6 border-t border-slate-200 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            Frequently Asked Questions about {category.name}
          </h3>
          <div className="space-y-2">
            {category.faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full p-4 text-left flex items-center justify-between text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        isOpen ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
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

      {/* RELATED CATEGORIES */}
      <div className="pt-6 border-t border-slate-200">
        <h4 className="text-sm font-bold text-slate-900 mb-3">Other Categories to Explore</h4>
        <div className="flex flex-wrap gap-2">
          {categories
            .filter((c) => c.slug !== category.slug)
            .map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/category/${c.slug}`)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                {c.name}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export const CategoriesIndexPage: React.FC = () => {
  const { navigate } = useApp();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <Breadcrumbs items={[{ label: 'Categories' }]} />

      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Browse All Product Categories
        </h1>
        <p className="text-slate-600 text-sm max-w-2xl">
          NIDPIK categorizes everyday essentials, electronics, kitchen appliances, and budget finds tailored to Indian living conditions and INR budgets.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const count = getProductsForCategory(cat.slug).length;
          return (
            <div
              key={cat.id}
              onClick={() => navigate(`/category/${cat.slug}`)}
              className="nidpik-card rounded-2xl p-6 cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {cat.name}
                  </h3>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                    {count} Products
                  </span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                  {cat.description}
                </p>

                {/* Subcategories list */}
                <div className="flex flex-wrap gap-1.5">
                  {cat.subcategories.slice(0, 4).map((sub) => (
                    <span
                      key={sub}
                      className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                    >
                      {sub}
                    </span>
                  ))}
                  {cat.subcategories.length > 4 && (
                    <span className="text-[11px] text-slate-400 px-1 py-0.5">
                      +{cat.subcategories.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                <span>Explore {cat.name}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
