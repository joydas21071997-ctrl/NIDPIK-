import React from 'react';
import { useApp } from '../context/AppContext';
import { getProductBySlug } from '../data';
import { Scale, X, ArrowRight } from 'lucide-react';

export const CompareTray: React.FC = () => {
  const { compareProductIds, removeFromCompare, clearCompare, navigate, currentPath } = useApp();

  if (compareProductIds.length === 0) return null;
  // If we are already on the compare page, hide floating tray
  if (currentPath === '/compare' || currentPath.startsWith('/compare/')) return null;

  const compareProducts = compareProductIds
    .map(id => getProductBySlug(id))
    .filter(Boolean);

  const handleLaunchCompare = () => {
    if (compareProducts.length >= 2) {
      navigate(`/compare/${compareProducts[0]!.slug}-vs-${compareProducts[1]!.slug}`);
    } else {
      navigate('/compare');
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-xl bg-white border border-slate-300 rounded-2xl shadow-xl p-3 flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 shrink-0">
          <Scale className="w-4 h-4 text-blue-600" />
          <span>Compare ({compareProducts.length}/3):</span>
        </div>

        {compareProducts.map((p) => p && (
          <div
            key={p.id}
            className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-700 shrink-0 border border-slate-200"
          >
            <span className="truncate max-w-[110px]">{p.name}</span>
            <button
              onClick={() => removeFromCompare(p.id)}
              className="p-0.5 text-slate-400 hover:text-slate-600 rounded"
              title="Remove"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={clearCompare}
          className="text-xs text-slate-400 hover:text-slate-600 px-1 py-1"
        >
          Clear
        </button>
        <button
          onClick={handleLaunchCompare}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1"
        >
          <span>Compare</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
