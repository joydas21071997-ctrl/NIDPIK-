import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { products } from '../data/products';
import { categories } from '../data/categories';
import { priceRanges } from '../data/budgetTiers';
import { ProductCard } from '../components/ProductCard';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Filter, SlidersHorizontal, ArrowUpDown, X } from 'lucide-react';

export const ProductListingPage: React.FC = () => {
  const { currentPath } = useApp();

  // Parse any query params if present, e.g. /products?category=electronics
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriceRangeIndex, setSelectedPriceRangeIndex] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Available brands in the dataset
  const brands = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.brand)));
  }, []);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'all' && p.categorySlug !== selectedCategory) {
        return false;
      }
      // Brand filter
      if (selectedBrand !== 'all' && p.brand !== selectedBrand) {
        return false;
      }
      // Price range filter
      const range = priceRanges[selectedPriceRangeIndex];
      if (p.price < range.min || p.price > range.max) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.shortDescription.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      return 0; // featured default
    });
  }, [selectedCategory, selectedBrand, selectedPriceRangeIndex, sortBy, searchQuery]);

  const clearAllFilters = () => {
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSelectedPriceRangeIndex(0);
    setSearchQuery('');
    setSortBy('featured');
  };

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedBrand !== 'all' ||
    selectedPriceRangeIndex !== 0 ||
    searchQuery.trim() !== '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* BREADCRUMBS */}
      <Breadcrumbs items={[{ label: 'All Products' }]} />

      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Discover Products
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse {products.length} editorially tested picks across Indian market categories starting from ₹99.
          </p>
        </div>

        {/* MOBILE FILTER TOGGLE & SORTING */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="lg:hidden flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs"
          >
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Filters {hasActiveFilters && '•'}</span>
          </button>

          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* MAIN 2-COLUMN LAYOUT: SIDEBAR FILTERS + PRODUCT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* DESKTOP SIDEBAR FILTERS (3 COLS) */}
        <div
          className={`lg:col-span-3 bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-6 ${
            mobileFilterOpen ? 'block fixed inset-4 z-50 overflow-y-auto lg:static lg:inset-auto lg:z-auto' : 'hidden lg:block'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              Filter Products
            </h3>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Clear all
              </button>
            )}
            <button
              onClick={() => setMobileFilterOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Search in catalog */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">Search within catalog</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. kettle, wireless, bottle..."
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Price Range Filter (from ₹99!) */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">Price Budget (INR ₹)</label>
            <div className="space-y-1">
              {priceRanges.map((range, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedPriceRangeIndex(idx)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                    selectedPriceRangeIndex === idx
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{range.label}</span>
                  {selectedPriceRangeIndex === idx && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">Categories</label>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                  selectedCategory === 'all'
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>All Categories</span>
                <span className="text-[11px] text-slate-400">({products.length})</span>
              </button>
              {categories.slice(0, 8).map((cat) => {
                const count = products.filter((p) => p.categorySlug === cat.slug).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                      selectedCategory === cat.slug
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    <span className="text-[11px] text-slate-400">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Brand Filter */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">Brand</label>
            <div className="space-y-1 max-h-40 overflow-y-auto no-scrollbar">
              <button
                onClick={() => setSelectedBrand('all')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                  selectedBrand === 'all'
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                All Brands
              </button>
              {brands.map((b) => (
                <button
                  key={b}
                  onClick={() => setSelectedBrand(b)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    selectedBrand === b
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* PRODUCT GRID (9 COLS) */}
        <div className="lg:col-span-9 space-y-6">
          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="flex items-center flex-wrap gap-2 text-xs">
              <span className="text-slate-400 font-medium">Active filters:</span>
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 font-semibold rounded-lg border border-blue-200">
                  {categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}
                  <button onClick={() => setSelectedCategory('all')}>
                    <X className="w-3 h-3 ml-0.5" />
                  </button>
                </span>
              )}
              {selectedPriceRangeIndex !== 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 font-semibold rounded-lg border border-blue-200">
                  {priceRanges[selectedPriceRangeIndex].label}
                  <button onClick={() => setSelectedPriceRangeIndex(0)}>
                    <X className="w-3 h-3 ml-0.5" />
                  </button>
                </span>
              )}
              {selectedBrand !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 font-semibold rounded-lg border border-blue-200">
                  {selectedBrand}
                  <button onClick={() => setSelectedBrand('all')}>
                    <X className="w-3 h-3 ml-0.5" />
                  </button>
                </span>
              )}
              {searchQuery.trim() !== '' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 font-semibold rounded-lg border border-blue-200">
                  "{searchQuery}"
                  <button onClick={() => setSearchQuery('')}>
                    <X className="w-3 h-3 ml-0.5" />
                  </button>
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="text-xs text-slate-500 hover:text-slate-700 underline"
              >
                Reset all
              </button>
            </div>
          )}

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 md:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
              <h3 className="text-base font-bold text-slate-800">No products match your current filters</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try widening your price range or clearing category filters to discover more items.
              </p>
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
