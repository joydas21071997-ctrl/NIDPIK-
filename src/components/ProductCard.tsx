import React, { useState } from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { Heart, Scale, ExternalLink, Package } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  featured?: boolean;
  compact?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  featured = false,
  compact = false
}) => {
  const {
    navigate,
    toggleSaveProduct,
    isProductSaved,
    addToCompare,
    removeFromCompare,
    isProductInCompare,
    triggerAffiliateClick,
    selectedCountry,
    formatPrice
  } = useApp();

  const [imgError, setImgError] = useState(false);
  const saved = isProductSaved(product.id);
  const inCompare = isProductInCompare(product.id);

  const isIndia = selectedCountry === 'IN';
  const currencySymbol =
    selectedCountry === 'US'
      ? '$'
      : selectedCountry === 'UK'
      ? '£'
      : selectedCountry === 'CA'
      ? 'C$'
      : '₹';

  const discountPercent = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : null;

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) return;
    navigate(`/product/${product.slug}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`nidpik-card rounded-xl sm:rounded-2xl overflow-hidden flex flex-col cursor-pointer relative group transition-all duration-200 hover:shadow-md ${
        featured ? 'ring-1 ring-blue-500/30 shadow-xs' : 'shadow-2xs'
      }`}
    >
      {/* CARD TOP MEDIA CONTAINER (Compact on mobile to save vertical scrolling) */}
      <div className={`relative bg-[#F8FAFC] w-full overflow-hidden flex items-center justify-center border-b border-slate-100 ${
        compact
          ? 'h-28 sm:h-36 p-2 sm:p-3'
          : 'h-32 sm:h-44 md:h-48 p-2.5 sm:p-4'
      }`}>
        
        {/* Subtle Badge (Top Left) */}
        {product.badge && (
          <div className="absolute top-2 left-2 z-10 max-w-[70%] truncate">
            <span className="text-[9px] sm:text-[11px] font-semibold text-slate-800 bg-white/95 backdrop-blur-xs px-1.5 sm:px-2 py-0.5 rounded-md border border-slate-200/80 shadow-2xs truncate block">
              {product.badge}
            </span>
          </div>
        )}

        {/* Wishlist Save Button (Top Right) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSaveProduct(product.id);
          }}
          className="absolute top-2 right-2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 backdrop-blur-xs border border-slate-200/80 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors shadow-2xs"
          title={saved ? 'Remove from saved' : 'Save to wishlist'}
          aria-label={saved ? 'Remove from saved' : 'Save to wishlist'}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${saved ? 'text-rose-500 fill-rose-500' : ''}`} />
        </button>

        {/* Product Image with Fallback */}
        {imgError ? (
          <div className="flex flex-col items-center justify-center text-slate-400 p-2 text-center">
            <Package className="w-8 h-8 sm:w-10 sm:h-10 mb-1 stroke-1 text-slate-400" />
            <span className="text-[10px] sm:text-xs font-medium text-slate-500 line-clamp-1">{product.name}</span>
          </div>
        ) : (
          <img
            src={product.image}
            alt={product.name}
            onError={() => setImgError(true)}
            referrerPolicy="no-referrer"
            loading="lazy"
            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-104 transition-transform duration-300"
          />
        )}
      </div>

      {/* CARD CONTENT (Optimized compact typography for mobile) */}
      <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3 bg-white">
        <div>
          {/* Category & Brand Header */}
          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500 mb-1 font-medium truncate">
            <span className="font-semibold text-slate-700">{product.brand}</span>
            <span aria-hidden="true" className="text-slate-400">·</span>
            <span className="truncate">{product.category}</span>
          </div>

          {/* Product Name */}
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
            {product.name}
          </h3>

          {/* Best For Tagline */}
          <p className="text-[10px] sm:text-xs text-slate-500 mt-1 line-clamp-1">
            <span className="font-semibold text-slate-700">Best:</span> {product.bestFor}
          </p>
        </div>

        {/* PRICING & ACTIONS */}
        <div className="pt-2 border-t border-slate-100 space-y-1.5 sm:space-y-2">
          {/* Price row */}
          <div className="flex items-baseline justify-between gap-1 flex-wrap">
            <span className="text-xs sm:text-base font-black text-slate-900 tabular-nums">
              {formatPrice(product.price)}
              {product.oldPrice && (
                <span className="ml-1.5 text-[9px] sm:text-xs text-slate-400 line-through tabular-nums font-normal">
                  {formatPrice(product.oldPrice)}
                </span>
              )}
            </span>

            {discountPercent && discountPercent > 0 && (
              <span className="text-[8px] sm:text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 sm:px-1.5 py-0.2 rounded shrink-0">
                {discountPercent}% OFF
              </span>
            )}
          </div>

            {/* Button Actions Row */}
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              {/* Affiliate CTA */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerAffiliateClick(product);
                }}
                className="flex-1 min-w-0 py-1.5 sm:py-2 px-1.5 sm:px-2 bg-slate-50 hover:bg-blue-50 text-slate-800 hover:text-blue-600 font-semibold text-[10px] sm:text-xs rounded-lg sm:rounded-xl border border-slate-200 hover:border-blue-300 transition-all flex items-center justify-center gap-1 shadow-2xs group/btn"
                title={`View on ${product.merchant.name}`}
              >
                <span className="truncate">View on {product.merchant.name.split(' ')[0]}</span>
                <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400 group-hover/btn:text-blue-600 shrink-0" />
              </button>

            {/* Quick Compare Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (inCompare) {
                  removeFromCompare(product.id);
                } else {
                  addToCompare(product.id);
                }
              }}
              className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl border text-xs font-medium transition-colors flex items-center justify-center shrink-0 ${
                inCompare
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
              }`}
              title={inCompare ? 'Remove from comparison' : 'Add to compare'}
              aria-label={inCompare ? 'Remove from comparison' : 'Add to compare'}
            >
              <Scale className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
