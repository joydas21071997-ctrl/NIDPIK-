import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Product } from '../types';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  CheckCircle2,
  ShoppingBag,
  ExternalLink,
  Scale,
  Heart,
  Tag,
  ArrowRight,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

export const AiAdvisorModal: React.FC = () => {
  const {
    aiAdvisorOpen,
    setAiAdvisorOpen,
    initialAiPrompt,
    navigate,
    triggerAffiliateClick,
    addToCompare,
    isProductInCompare,
    toggleSaveProduct,
    isProductSaved,
    formatPrice
  } = useApp();

  const [query, setQuery] = useState('');
  const [budgetMax, setBudgetMax] = useState<number | undefined>(undefined);
  const [category, setCategory] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [result, setResult] = useState<{
    advice: string;
    products: Product[];
    reasons: Record<string, string>;
    isAiPowered?: boolean;
  } | null>(null);

  const [presets, setPresets] = useState<Array<{ id: string; label: string; query: string }>>([
    {
      id: 'wfh-setup',
      label: 'WFH Desk Setup Essentials',
      query: 'What are the most essential work from home desk items that deliver high utility?'
    },
    {
      id: 'kitchen-essentials',
      label: 'Small Kitchen Essentials',
      query: 'Useful daily problem-solving gadgets for a compact kitchen'
    },
    {
      id: 'utility-budget',
      label: 'Practical Everyday Picks',
      query: 'Best practical everyday utility products that are actually durable'
    },
    {
      id: 'student-hostel',
      label: 'College & Hostel Must-Haves',
      query: 'Top durable and budget-friendly products for college students living in a dorm or apartment'
    }
  ]);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (aiAdvisorOpen) {
      if (initialAiPrompt) {
        setQuery(initialAiPrompt);
        handleAsk(initialAiPrompt);
      } else {
        setTimeout(() => inputRef.current?.focus(), 80);
      }
    } else {
      // Keep result in memory or reset query if needed
    }
  }, [aiAdvisorOpen, initialAiPrompt]);

  // Load backend presets on mount
  useEffect(() => {
    api.ai
      .getPresets()
      .then((res) => {
        if (res && res.presets) {
          setPresets(res.presets);
        }
      })
      .catch(() => {});
  }, []);

  if (!aiAdvisorOpen) return null;

  const handleAsk = async (promptToUse?: string, budgetOverride?: number) => {
    const q = (promptToUse || query).trim();
    if (!q) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.ai.recommend({
        query: q,
        budgetMax: budgetOverride !== undefined ? budgetOverride : budgetMax,
        category: category !== 'all' ? category : undefined
      });
      setResult(res);
    } catch (err: any) {
      setError(err?.message || 'Could not fetch recommendation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAsk();
  };

  const handlePresetClick = (pQuery: string) => {
    setQuery(pQuery);
    handleAsk(pQuery);
  };

  const handleBudgetFilter = (max?: number) => {
    setBudgetMax(max);
    if (query.trim()) {
      handleAsk(query, max);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => setAiAdvisorOpen(false)}
    >
      <div
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg tracking-tight">NIDPIK AI Buying Advisor</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/20">
                  Grounded in Honest Picks
                </span>
              </div>
              <p className="text-xs text-blue-200/80">
                Tell us what you need, your room, or budget — we recommend genuine tested picks from ₹99
              </p>
            </div>
          </div>
          <button
            onClick={() => setAiAdvisorOpen(false)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* INPUT & FILTERS CONTAINER */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 shrink-0 space-y-3">
          <form onSubmit={handleFormSubmit} className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 'Useful kitchen organizers under ₹500' or 'Student desk setup'..."
              className="w-full bg-white border border-slate-300 rounded-xl pl-4 pr-24 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent font-medium"
              disabled={loading}
            />
            <div className="absolute right-1.5 flex items-center gap-1">
              {query && !loading && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-xs"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Ask AI</span>
              </button>
            </div>
          </form>

          {/* BUDGET CHIPS */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-slate-500 font-medium mr-1 flex items-center gap-1">
              <Tag className="w-3 h-3 text-blue-600" /> Max Budget:
            </span>
            {[
              { label: 'Any', value: undefined },
              { label: 'Under ₹99', value: 99 },
              { label: 'Under ₹299', value: 299 },
              { label: 'Under ₹499', value: 499 },
              { label: 'Under ₹999', value: 999 },
              { label: 'Under ₹1,999', value: 1999 }
            ].map((b) => (
              <button
                key={b.label}
                type="button"
                onClick={() => handleBudgetFilter(b.value)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                  budgetMax === b.value
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* QUICK PRESET SUGGESTIONS */}
          {!result && !loading && (
            <div className="pt-1">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Popular Buying Queries:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetClick(preset.query)}
                    className="text-xs bg-white text-slate-700 border border-slate-200 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50/50 px-2.5 py-1.5 rounded-lg text-left transition-all flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RESULTS SCROLLABLE BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 animate-pulse">
                <Sparkles className="w-6 h-6 animate-spin text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  NIDPIK AI is analyzing products & practical criteria...
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Filtering honest specs, Indian everyday utility, and genuine merchant value.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <p className="font-semibold">Notice</p>
              <p className="text-xs mt-0.5">{error}</p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* ADVICE CALLOUT */}
              <div className="bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 border border-blue-100 rounded-xl p-4 sm:p-5 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                        NIDPIK Buying Verdict
                      </span>
                      {result.isAiPowered && (
                        <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                          AI Analyzed
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-800 leading-relaxed font-normal">
                      {result.advice}
                    </p>
                  </div>
                </div>
              </div>

              {/* RECOMMENDED PRODUCTS LIST */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                    Recommended Products ({result.products.length})
                  </h4>
                  <span className="text-xs text-slate-400">
                    Transparent Affiliate Links
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3.5">
                  {result.products.map((product) => {
                    const justification = result.reasons[product.id] || product.quickVerdict;
                    const inCompare = isProductInCompare(product.id);
                    const isSaved = isProductSaved(product.id);

                    return (
                      <div
                        key={product.id}
                        className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 hover:border-blue-300 transition-all shadow-2xs hover:shadow-xs flex flex-col sm:flex-row gap-4"
                      >
                        {/* IMAGE */}
                        <div
                          className="w-full sm:w-32 h-32 bg-slate-100 rounded-lg overflow-hidden shrink-0 cursor-pointer relative group"
                          onClick={() => {
                            setAiAdvisorOpen(false);
                            navigate(`/product/${product.slug}`);
                          }}
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          {product.badge && (
                            <span className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-2xs">
                              {product.badge}
                            </span>
                          )}
                        </div>

                        {/* INFO & REASON */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
                                  {product.brand} • {product.category}
                                </span>
                                <h5
                                  className="text-sm sm:text-base font-bold text-slate-900 hover:text-blue-600 cursor-pointer line-clamp-2 leading-snug"
                                  onClick={() => {
                                    setAiAdvisorOpen(false);
                                    navigate(`/product/${product.slug}`);
                                  }}
                                >
                                  {product.name}
                                </h5>
                              </div>

                              {/* Price */}
                              <div className="text-right shrink-0">
                                <span className="text-base sm:text-lg font-black text-slate-900">
                                  {product.currency}{product.price.toLocaleString('en-IN')}
                                </span>
                                {product.oldPrice && (
                                  <span className="block text-[11px] text-slate-400 line-through">
                                    {product.currency}{product.oldPrice.toLocaleString('en-IN')}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Why AI Picked This */}
                            {justification && (
                              <div className="mt-2 text-xs bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 text-slate-700 flex items-start gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                  <strong className="font-semibold text-slate-900">Why this fits: </strong>
                                  <span>{justification}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* ACTIONS */}
                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => addToCompare(product.id)}
                                className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium flex items-center gap-1 transition-colors ${
                                  inCompare
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                <Scale className="w-3.5 h-3.5" />
                                <span>{inCompare ? 'In Compare' : 'Compare'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => toggleSaveProduct(product.id)}
                                className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium flex items-center gap-1 transition-colors ${
                                  isSaved
                                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                                    : 'text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-500' : ''}`} />
                                <span>{isSaved ? 'Saved' : 'Save'}</span>
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setAiAdvisorOpen(false);
                                  navigate(`/product/${product.slug}`);
                                }}
                                className="text-xs font-semibold text-slate-700 hover:text-blue-600 px-2 py-1 flex items-center gap-1"
                              >
                                View Specs
                                <ArrowRight className="w-3 h-3" />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  triggerAffiliateClick(product, 'ai_advisor', 'check_merchant_btn')
                                }
                                className="text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
                              >
                                <span>{product.merchant?.name || 'Amazon'}</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* FOOTER DISCLOSURE */}
              <div className="text-[11px] text-slate-400 bg-slate-50 border border-slate-100 rounded-lg p-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  NIDPIK Editorial Transparency: Zero sponsored placement in AI recommendations.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setQuery('');
                    setTimeout(() => inputRef.current?.focus(), 50);
                  }}
                  className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                >
                  <RotateCcw className="w-3 h-3" />
                  Ask another question
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
