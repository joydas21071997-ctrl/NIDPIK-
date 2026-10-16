import React from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { ExternalLink, Check, X } from 'lucide-react';

interface ComparisonTableProps {
  products: Product[];
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ products }) => {
  const { navigate, triggerAffiliateClick, formatPrice } = useApp();

  if (!products || products.length === 0) return null;

  // Collect all unique specification keys across products
  const specKeysSet = new Set<string>();
  products.forEach((p) => {
    Object.keys(p.specifications || {}).forEach((k) => specKeysSet.add(k));
  });
  const specKeys = Array.from(specKeysSet);

  return (
    <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-xs">
      <table className="w-full text-left border-collapse min-w-[600px]">
        {/* TABLE HEADER WITH PRODUCT PREVIEW */}
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/50">
            <th className="p-4 w-1/4 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Product
            </th>
            {products.map((p) => (
              <th key={p.id} className="p-4 w-1/3 align-top">
                <div className="space-y-2">
                  <div className="w-20 h-20 bg-white rounded-xl border border-slate-200 p-2 flex items-center justify-center mx-auto">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-center">
                    {p.badge && (
                      <span className="inline-block text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded mb-1">
                        {p.badge}
                      </span>
                    )}
                    <h4
                      onClick={() => navigate(`/product/${p.slug}`)}
                      className="text-xs font-bold text-slate-900 hover:text-blue-600 cursor-pointer line-clamp-2"
                    >
                      {p.name}
                    </h4>
                    <div className="text-sm font-bold text-slate-900 mt-1 tabular-nums">
                      {formatPrice(p.price)}
                    </div>
                    <button
                      onClick={() => triggerAffiliateClick(p)}
                      className="mt-2 w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 shadow-2xs"
                    >
                      <span>Check Price</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>

        {/* COMPARISON METRICS */}
        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
          {/* Best For Row */}
          <tr className="hover:bg-slate-50/60">
            <td className="p-3.5 font-semibold text-slate-900 bg-slate-50/30">
              Best For
            </td>
            {products.map((p) => (
              <td key={p.id} className="p-3.5">
                {p.bestFor}
              </td>
            ))}
          </tr>

          {/* Not Ideal For Row */}
          <tr className="hover:bg-slate-50/60">
            <td className="p-3.5 font-semibold text-slate-900 bg-slate-50/30">
              Not Ideal For
            </td>
            {products.map((p) => (
              <td key={p.id} className="p-3.5 text-slate-500">
                {p.notIdealFor || '—'}
              </td>
            ))}
          </tr>

          {/* Dynamic Specifications */}
          {specKeys.map((key) => (
            <tr key={key} className="hover:bg-slate-50/60">
              <td className="p-3.5 font-medium text-slate-800 bg-slate-50/30">
                {key}
              </td>
              {products.map((p) => (
                <td key={p.id} className="p-3.5 tabular-nums">
                  {p.specifications[key] || '—'}
                </td>
              ))}
            </tr>
          ))}

          {/* Pros */}
          <tr className="hover:bg-slate-50/60">
            <td className="p-3.5 font-semibold text-emerald-800 bg-emerald-50/20">
              Key Advantages
            </td>
            {products.map((p) => (
              <td key={p.id} className="p-3.5 space-y-1">
                {p.pros.map((pro, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-slate-600">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{pro}</span>
                  </div>
                ))}
              </td>
            ))}
          </tr>

          {/* Cons */}
          <tr className="hover:bg-slate-50/60">
            <td className="p-3.5 font-semibold text-rose-800 bg-rose-50/20">
              Trade-offs / Cons
            </td>
            {products.map((p) => (
              <td key={p.id} className="p-3.5 space-y-1">
                {p.cons.map((con, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-slate-600">
                    <X className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span>{con}</span>
                  </div>
                ))}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};
