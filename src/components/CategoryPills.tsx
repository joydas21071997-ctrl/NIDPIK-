import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Smartphone,
  CookingPot,
  Sparkles,
  Dumbbell,
  Luggage,
  Shirt,
  Briefcase,
  PackageCheck,
  Tag,
  Home,
  LayoutGrid,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { categories } from '../data/categories';

interface CategoryPillsProps {
  layout?: 'scroll' | 'grid';
  activeCategory?: string;
  onSelect?: (slug: string) => void;
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  layout = 'scroll',
  activeCategory,
  onSelect
}) => {
  const { navigate } = useApp();
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const getIcon = (name: string) => {
    switch (name) {
      case 'Smartphone':
        return <Smartphone className="w-5 h-5 text-blue-600" />;
      case 'CookingPot':
        return <CookingPot className="w-5 h-5 text-amber-600" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-rose-500" />;
      case 'Dumbbell':
        return <Dumbbell className="w-5 h-5 text-emerald-600" />;
      case 'Luggage':
        return <Luggage className="w-5 h-5 text-indigo-600" />;
      case 'Shirt':
        return <Shirt className="w-5 h-5 text-purple-600" />;
      case 'Briefcase':
        return <Briefcase className="w-5 h-5 text-slate-700" />;
      case 'PackageCheck':
        return <PackageCheck className="w-5 h-5 text-teal-600" />;
      case 'Home':
        return <Home className="w-5 h-5 text-sky-600" />;
      case 'BadgePercent':
        return <Tag className="w-5 h-5 text-blue-600" />;
      default:
        return <LayoutGrid className="w-5 h-5 text-slate-600" />;
    }
  };

  const getBgTint = (name: string) => {
    switch (name) {
      case 'Smartphone':
        return 'bg-blue-50 group-hover:bg-blue-100';
      case 'CookingPot':
        return 'bg-amber-50 group-hover:bg-amber-100';
      case 'Sparkles':
        return 'bg-rose-50 group-hover:bg-rose-100';
      case 'Dumbbell':
        return 'bg-emerald-50 group-hover:bg-emerald-100';
      case 'Luggage':
        return 'bg-indigo-50 group-hover:bg-indigo-100';
      case 'Shirt':
        return 'bg-purple-50 group-hover:bg-purple-100';
      case 'Briefcase':
        return 'bg-slate-100 group-hover:bg-slate-200';
      case 'PackageCheck':
        return 'bg-teal-50 group-hover:bg-teal-100';
      case 'Home':
        return 'bg-sky-50 group-hover:bg-sky-100';
      case 'BadgePercent':
        return 'bg-blue-50 group-hover:bg-blue-100';
      default:
        return 'bg-slate-50 group-hover:bg-slate-100';
    }
  };

  const handleCategoryClick = (slug: string) => {
    if (onSelect) {
      onSelect(slug);
    } else {
      navigate(`/category/${slug}`);
    }
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -260, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 260, behavior: 'smooth' });
    }
  };

  if (layout === 'grid') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {categories.map((cat) => {
          const isCurrent = activeCategory === cat.slug;
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.slug)}
              className={`group flex items-center gap-3 p-3 rounded-2xl border transition-all text-left ${
                isCurrent
                  ? 'bg-blue-50/90 border-blue-500 shadow-xs ring-1 ring-blue-500/20'
                  : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center transition-colors ${getBgTint(
                  cat.iconName
                )}`}
              >
                {getIcon(cat.iconName)}
              </div>
              <div className="min-w-0 flex-1">
                <span
                  className={`block text-xs font-semibold leading-tight truncate ${
                    isCurrent ? 'text-blue-700' : 'text-slate-800 group-hover:text-blue-600'
                  }`}
                >
                  {cat.name}
                </span>
                <span className="text-[10px] text-slate-600 truncate block mt-0.5">
                  {cat.subcategories.length} subcategories
                </span>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative group/carousel">
      {/* Left scroll control (visible on sm+ screens when hover) */}
      <button
        type="button"
        onClick={scrollLeft}
        aria-label="Scroll left categories"
        className="hidden md:flex absolute -left-3.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 shadow-md items-center justify-center text-slate-700 hover:text-blue-600 hover:border-blue-400 transition-all opacity-0 group-hover/carousel:opacity-100"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Right scroll control */}
      <button
        type="button"
        onClick={scrollRight}
        aria-label="Scroll right categories"
        className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 shadow-md items-center justify-center text-slate-700 hover:text-blue-600 hover:border-blue-400 transition-all opacity-0 group-hover/carousel:opacity-100"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Horizontal Smooth Swipeable Scroll container with native touch momentum */}
      <div
        ref={scrollRef}
        tabIndex={0}
        aria-label="Categories horizontal list"
        className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-2 px-1 scroll-smooth snap-x snap-mandatory focus:outline-none"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {categories.map((cat) => {
          const isCurrent = activeCategory === cat.slug;
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.slug)}
              className={`snap-start group shrink-0 flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center w-[100px] sm:w-[112px] cursor-pointer select-none ${
                isCurrent
                  ? 'bg-blue-50/90 border-blue-500 shadow-xs ring-1 ring-blue-500/20'
                  : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs active:scale-95'
              }`}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center mb-2 transition-colors ${getBgTint(
                  cat.iconName
                )}`}
              >
                {getIcon(cat.iconName)}
              </div>
              <span
                className={`text-xs font-semibold leading-tight line-clamp-1 w-full px-1 ${
                  isCurrent ? 'text-blue-700 font-bold' : 'text-slate-800 group-hover:text-blue-600'
                }`}
                title={cat.name}
              >
                {cat.name}
              </span>
            </button>
          );
        })}

        {/* View All Categories Chip */}
        <button
          onClick={() => navigate('/categories')}
          className="snap-start group shrink-0 flex flex-col items-center justify-center p-3 rounded-2xl border bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs active:scale-95 transition-all text-center w-[100px] sm:w-[112px] cursor-pointer select-none"
        >
          <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-2 bg-slate-50 group-hover:bg-blue-50 transition-colors">
            <LayoutGrid className="w-5 h-5 text-slate-700 group-hover:text-blue-600" />
          </div>
          <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 leading-tight">
            All ({categories.length})
          </span>
        </button>
      </div>
    </div>
  );
};
