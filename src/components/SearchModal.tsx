import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Search, X, ArrowRight, Tag, BookOpen, Scale, FileText, Package, Sparkles } from 'lucide-react';
import { searchAll } from '../data';

export const SearchModal: React.FC = () => {
  const { searchModalOpen, setSearchModalOpen, navigate, openAiAdvisorWithPrompt } = useApp();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchModalOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [searchModalOpen]);

  if (!searchModalOpen) return null;

  const results = searchAll(query);
  const hasResults =
    results.products.length > 0 ||
    results.guides.length > 0 ||
    results.comparisons.length > 0 ||
    results.articles.length > 0;

  const quickPicks = [
    'Best wireless earbuds under ₹2000',
    'Useful products for small kitchen',
    'Best water bottle under ₹500',
    'Useful products under ₹299',
    'Best budget products for students',
    'Best products under ₹99'
  ];

  const handleSelectQuery = (q: string) => {
    setQuery(q);
  };

  const handleNavigate = (path: string) => {
    setSearchModalOpen(false);
    navigate(path);
  };

  const handleFullSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      handleNavigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* INPUT HEADER */}
        <form onSubmit={handleFullSearch} className="relative flex items-center border-b border-slate-200 px-4 py-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-blue-600 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, categories or your need (e.g. 'earbuds under ₹2000')..."
            className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-sm font-medium focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setSearchModalOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
          >
            <span className="text-xs font-mono bg-white px-1.5 py-0.5 border border-slate-200 rounded text-slate-500">
              ESC
            </span>
          </button>
        </form>

        {/* BODY AREA */}
        <div className="overflow-y-auto p-4 space-y-4">
          {/* AI Quick Banner */}
          <div className="p-3 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-200/80 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Can't find what you need?
                </p>
                <p className="text-[11px] text-slate-500">
                  Ask our AI Advisor to match products to your room, need or budget
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchModalOpen(false);
                openAiAdvisorWithPrompt(query || undefined);
              }}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg shrink-0 transition-colors flex items-center gap-1 shadow-2xs"
            >
              <span>Ask AI</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {!query && (
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Popular Searches &amp; Needs
                </span>
                <div className="flex flex-wrap gap-2">
                  {quickPicks.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleSelectQuery(item)}
                      className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg transition-colors flex items-center gap-1.5 text-left"
                    >
                      <Tag className="w-3 h-3 text-slate-400" />
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Discover by Budget
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['best-under-99', 'best-under-299', 'best-under-999', 'best-under-1999'].map((slug) => (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => handleNavigate(`/${slug}`)}
                      className="p-2.5 text-left border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-xl transition-colors group"
                    >
                      <span className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 block">
                        {slug.replace('best-under-', 'Under ₹')}
                      </span>
                      <span className="text-[10px] text-slate-500">Value picks</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {query && !hasResults && (
            <div className="py-8 text-center text-slate-500 space-y-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">No direct keyword match for "{query}"</p>
                <p className="text-xs text-slate-500 mt-1">
                  Our catalog has curated value picks. Let AI match your requirement!
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchModalOpen(false);
                  openAiAdvisorWithPrompt(query);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Ask AI Advisor to recommend for "{query}"</span>
              </button>
            </div>
          )}

          {query && hasResults && (
            <div className="space-y-4">
              {/* Matched Products */}
              {results.products.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-blue-600" />
                      Products ({results.products.length})
                    </span>
                    <button
                      onClick={() => handleNavigate(`/products?q=${encodeURIComponent(query)}`)}
                      className="text-xs text-blue-600 hover:underline font-medium"
                    >
                      View all in Products →
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {results.products.slice(0, 4).map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleNavigate(`/product/${p.slug}`)}
                        className="flex items-center gap-3 py-2 px-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group"
                      >
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-10 h-10 object-contain rounded-md bg-slate-100 p-1 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 truncate">
                            {p.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate">
                            {p.brand} · {p.category} · <span className="font-semibold text-slate-800">₹{p.price}</span>
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Buying Guides */}
              {results.guides.length > 0 && (
                <div className="border-t border-slate-100 pt-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    Buying Guides ({results.guides.length})
                  </span>
                  <div className="space-y-1.5">
                    {results.guides.slice(0, 3).map((g) => (
                      <div
                        key={g.id}
                        onClick={() => handleNavigate(`/buying-guides/${g.slug}`)}
                        className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group"
                      >
                        <h4 className="text-xs font-semibold text-slate-900 group-hover:text-blue-600">
                          {g.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{g.subtitle}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Comparisons */}
              {results.comparisons.length > 0 && (
                <div className="border-t border-slate-100 pt-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                    <Scale className="w-3.5 h-3.5 text-blue-600" />
                    Comparisons ({results.comparisons.length})
                  </span>
                  <div className="space-y-1.5">
                    {results.comparisons.slice(0, 2).map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleNavigate(`/compare/${c.slug}`)}
                        className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group"
                      >
                        <h4 className="text-xs font-semibold text-slate-900 group-hover:text-blue-600">
                          {c.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{c.subtitle}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Matched Articles */}
              {results.articles.length > 0 && (
                <div className="border-t border-slate-100 pt-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    Articles ({results.articles.length})
                  </span>
                  <div className="space-y-1.5">
                    {results.articles.slice(0, 2).map((a) => (
                      <div
                        key={a.id}
                        onClick={() => handleNavigate(`/articles/${a.slug}`)}
                        className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group"
                      >
                        <h4 className="text-xs font-semibold text-slate-900 group-hover:text-blue-600">
                          {a.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-1">{a.excerpt}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER BAR */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Press Enter to view full results</span>
          <button
            type="button"
            onClick={handleFullSearch}
            className="font-semibold text-blue-600 hover:underline flex items-center gap-1"
          >
            Search all for "{query || 'products'}" →
          </button>
        </div>
      </div>
    </div>
  );
};
