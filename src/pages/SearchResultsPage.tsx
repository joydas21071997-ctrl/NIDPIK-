import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { searchAll, products, getProductBySlug } from '../data';
import { ProductCard } from '../components/ProductCard';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Search, Package, BookOpen, Scale, FileText, ArrowRight, Heart } from 'lucide-react';

export const SearchResultsPage: React.FC = () => {
  const { currentPath, navigate } = useApp();

  // Extract query from URL if available, e.g. /search?q=earbuds
  const queryParam = new URLSearchParams(window.location.search).get('q') || '';
  const [activeTab, setActiveTab] = useState<'all' | 'products' | 'guides' | 'comparisons' | 'articles'>('all');

  const results = searchAll(queryParam);
  const totalResults =
    results.products.length +
    results.guides.length +
    results.comparisons.length +
    results.articles.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumbs items={[{ label: 'Search Results' }]} />

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Search className="w-6 h-6 text-blue-600" />
          Search Results {queryParam && <span>for "{queryParam}"</span>}
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm">
          Found {totalResults} relevant items across products, guides, and editorial research.
        </p>
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar w-fit">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Results ({totalResults})
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'products'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Products ({results.products.length})
        </button>
        <button
          onClick={() => setActiveTab('guides')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'guides'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Buying Guides ({results.guides.length})
        </button>
        <button
          onClick={() => setActiveTab('comparisons')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'comparisons'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Comparisons ({results.comparisons.length})
        </button>
        <button
          onClick={() => setActiveTab('articles')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeTab === 'articles'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Articles ({results.articles.length})
        </button>
      </div>

      {totalResults === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <p className="text-base font-bold text-slate-800">No results found for "{queryParam}"</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try searching for broader categories (e.g. "kitchen", "earbuds", "cables") or specific budget figures ("under 500", "under 1000").
          </p>
          <button
            onClick={() => navigate('/products')}
            className="px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
          >
            Browse All Products
          </button>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Products Section */}
          {(activeTab === 'all' || activeTab === 'products') && results.products.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Products ({results.products.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
                {results.products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}

          {/* Guides Section */}
          {(activeTab === 'all' || activeTab === 'guides') && results.guides.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Buying Guides ({results.guides.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.guides.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => navigate(`/buying-guides/${g.slug}`)}
                    className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 cursor-pointer transition-colors shadow-2xs group flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[11px] font-semibold text-blue-600">{g.category}</span>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors mt-1">
                        {g.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{g.subtitle}</p>
                    </div>
                    <div className="mt-3 text-xs font-semibold text-blue-600 flex items-center gap-1">
                      <span>Read guide</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comparisons Section */}
          {(activeTab === 'all' || activeTab === 'comparisons') && results.comparisons.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Scale className="w-5 h-5 text-blue-600" />
                Comparisons ({results.comparisons.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.comparisons.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => navigate(`/compare/${c.slug}`)}
                    className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 cursor-pointer transition-colors shadow-2xs group flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[11px] font-semibold text-blue-600">{c.category}</span>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors mt-1">
                        {c.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.verdictSummary}</p>
                    </div>
                    <div className="mt-3 text-xs font-semibold text-blue-600 flex items-center gap-1">
                      <span>View comparison</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Articles Section */}
          {(activeTab === 'all' || activeTab === 'articles') && results.articles.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Articles ({results.articles.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.articles.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => navigate(`/articles/${a.slug}`)}
                    className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 cursor-pointer transition-colors shadow-2xs group flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[11px] font-semibold text-blue-600">{a.category}</span>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors mt-1">
                        {a.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{a.excerpt}</p>
                    </div>
                    <div className="mt-3 text-xs font-semibold text-blue-600 flex items-center gap-1">
                      <span>Read article</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const SavedPicksPage: React.FC = () => {
  const { savedProductIds, navigate } = useApp();

  const savedProducts = savedProductIds
    .map((id) => getProductBySlug(id))
    .filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumbs items={[{ label: 'Saved Products' }]} />

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
          Your Saved Products ({savedProducts.length})
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm">
          Keep track of products you're researching for your home, travel, or work setup.
        </p>
      </div>

      {savedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {savedProducts.map((p) => p && (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <Heart className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-base font-bold text-slate-800">You haven't saved any products yet</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click the heart icon on any product card while browsing to save it to your personal research list.
          </p>
          <button
            onClick={() => navigate('/products')}
            className="px-4 py-2 bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
          >
            Explore Products
          </button>
        </div>
      )}
    </div>
  );
};
