import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { useApp } from '../context/AppContext';
import {
  Search,
  Heart,
  Scale,
  Menu,
  X,
  ChevronDown,
  Mail,
  User,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { categories } from '../data/categories';
import { budgetTiers } from '../data/budgetTiers';
import { SubscribeModal } from './SubscribeModal';
import { AuthModal } from './AuthModal';
import { RegionSelector } from './RegionSelector';
import { COUNTRIES } from '../context/AppContext';

export const Header: React.FC = () => {
  const {
    navigate,
    currentPath,
    setSearchModalOpen,
    savedProductIds,
    compareProductIds,
    selectedCountry,
    setSelectedCountry,
    formatPrice
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesDropdown, setCategoriesDropdown] = useState(false);
  const [budgetDropdown, setBudgetDropdown] = useState(false);
  const [subscribeModalOpen, setSubscribeModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);



  useEffect(() => {
    setUserEmail(localStorage.getItem('nidpik_user_email'));
  }, [authModalOpen]);

  const isActive = (path: string) => {
    if (path === '/' && currentPath === '/') return true;
    if (path !== '/' && currentPath.startsWith(path)) return true;
    return false;
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
    setCategoriesDropdown(false);
    setBudgetDropdown(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            
            {/* ZONE 1: BRAND LOGO */}
            <div className="flex items-center gap-2 shrink-0">
              <Logo size="md" showTagline={false} />
            </div>

            {/* ZONE 2: PRIMARY NAVIGATION LINKS (Desktop) */}
            <nav className="hidden lg:flex items-center space-x-5 text-sm font-medium text-slate-700">
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('/');
                }}
                className={`transition-colors py-1 ${
                  isActive('/') ? 'text-blue-600 font-bold border-b-2 border-blue-600' : 'hover:text-blue-600'
                }`}
              >
                Home
              </a>

              {/* Categories with Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setCategoriesDropdown(true)}
                onMouseLeave={() => setCategoriesDropdown(false)}
              >
                <button
                  onClick={() => handleNavClick('/categories')}
                  className={`inline-flex items-center gap-1 transition-colors py-1 cursor-pointer ${
                    isActive('/category') || isActive('/categories')
                      ? 'text-blue-600 font-bold'
                      : 'hover:text-blue-600'
                  }`}
                >
                  Categories
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {categoriesDropdown && (
                  <div className="absolute top-full left-0 w-64 pt-2 shadow-xl z-50">
                    <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-lg">
                      <div className="text-[10px] font-bold text-slate-400 px-3 py-1.5 uppercase tracking-wider">
                        Browse Categories
                      </div>
                      {categories.slice(0, 8).map((cat) => (
                        <a
                          key={cat.id}
                          href={`/category/${cat.slug}`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleNavClick(`/category/${cat.slug}`);
                          }}
                          className="block px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                        >
                          {cat.name}
                        </a>
                      ))}
                      <div className="border-t border-slate-100 my-1 pt-1">
                        <a
                          href="/categories"
                          onClick={(e) => {
                            e.preventDefault();
                            handleNavClick('/categories');
                          }}
                          className="block px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          All Categories →
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Budget Engine Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setBudgetDropdown(true)}
                onMouseLeave={() => setBudgetDropdown(false)}
              >
                <button
                  onClick={() => handleNavClick('/best-under-99')}
                  className={`inline-flex items-center gap-1 transition-colors py-1 cursor-pointer ${
                    currentPath.includes('/best-under-')
                      ? 'text-blue-600 font-bold'
                      : 'hover:text-blue-600'
                  }`}
                >
                  Under ₹99
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {budgetDropdown && (
                  <div className="absolute top-full left-0 w-56 pt-2 shadow-xl z-50">
                    <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-lg">
                      <div className="text-[10px] font-bold text-slate-400 px-3 py-1.5 uppercase tracking-wider">
                        Discover by Price
                      </div>
                      {budgetTiers.map((tier) => (
                        <a
                          key={tier.slug}
                          href={`/${tier.slug}`}
                          onClick={(e) => {
                            e.preventDefault();
                            handleNavClick(`/${tier.slug}`);
                          }}
                          className="flex items-center justify-between px-3 py-1.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                        >
                          <span className="font-semibold">{`Under ${formatPrice(tier.amount)}`}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <a
                href="/buying-guides"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('/buying-guides');
                }}
                className={`transition-colors py-1 ${
                  isActive('/buying-guides') ? 'text-blue-600 font-bold' : 'hover:text-blue-600'
                }`}
              >
                Buying Guides
              </a>

              <a
                href="/compare"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('/compare');
                }}
                className={`transition-colors py-1 ${
                  isActive('/compare') ? 'text-blue-600 font-bold' : 'hover:text-blue-600'
                }`}
              >
                Comparisons
              </a>

              <a
                href="/reviews"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('/reviews');
                }}
                className={`transition-colors py-1 ${
                  isActive('/reviews') ? 'text-blue-600 font-bold' : 'hover:text-blue-600'
                }`}
              >
                Reviews
              </a>

              <a
                href="/articles"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('/articles');
                }}
                className={`transition-colors py-1 ${
                  isActive('/articles') ? 'text-blue-600 font-bold' : 'hover:text-blue-600'
                }`}
              >
                Articles
              </a>
            </nav>

            {/* ZONE 3: ACTIONS (SEARCH + COUNTRY + SUBSCRIBE + USER + SAVED + MOBILE TRIGGER) */}
            <div className="flex items-center gap-1.5 sm:gap-2">

              {/* Market / Country Selector */}
              <RegionSelector />





              {/* Login / Profile Button */}
              <button
                onClick={() => setAuthModalOpen(true)}
                className="p-2 text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors relative"
                title={userEmail ? `Account (${userEmail})` : 'Login / Sign In'}
                aria-label="Account Login"
              >
                <User className="w-4 h-4" />
                {userEmail && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                )}
              </button>

              {/* Compare Counter */}
              {compareProductIds.length > 0 && (
                <button
                  onClick={() => handleNavClick('/compare')}
                  className="relative p-2 text-slate-600 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                  title={`Compare ${compareProductIds.length} products`}
                  aria-label={`Compare ${compareProductIds.length} products`}
                >
                  <Scale className="w-4 h-4 text-blue-600" />
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-blue-600 rounded-full">
                    {compareProductIds.length}
                  </span>
                </button>
              )}

              {/* Saved Wishlist Button */}
              <button
                onClick={() => handleNavClick('/saved')}
                className="relative p-2 text-slate-600 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                title="Saved Products"
                aria-label="Saved products"
              >
                <Heart className={`w-4 h-4 ${savedProductIds.length > 0 ? 'text-rose-500 fill-rose-500' : 'text-slate-600'}`} />
                {savedProductIds.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-rose-500 rounded-full">
                    {savedProductIds.length}
                  </span>
                )}
              </button>

              {/* Mobile Menu Hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-slate-700 hover:text-blue-600 rounded-lg hover:bg-slate-100 focus:outline-none"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5 text-slate-800" /> : <Menu className="w-5 h-5 text-slate-800" />}
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE NAVIGATION DRAWER */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto">
            {/* Mobile Search Prominent */}
            <div
              onClick={() => {
                setMobileMenuOpen(false);
                setSearchModalOpen(true);
              }}
              className="flex items-center gap-2 p-2.5 bg-slate-100 rounded-xl text-slate-600 text-xs font-medium cursor-pointer"
            >
              <Search className="w-4 h-4 text-blue-600" />
              <span>Search products, budget under ₹, or guides...</span>
            </div>

            {/* Quick Email Subscribe Box Inside Mobile Menu */}
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  Subscribe to NIDPIK Weekly
                </span>
                <span className="text-[10px] bg-blue-200/80 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                  FREE
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mb-2">
                Handpicked tested picks &amp; price drops sent to your inbox.
              </p>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSubscribeModalOpen(true);
                }}
                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Subscribe with Email</span>
              </button>
            </div>

            {/* User Account / Login Bar in Mobile Drawer */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <div className="flex items-center gap-2 truncate">
                <User className="w-4 h-4 text-slate-500" />
                <span className="font-semibold text-slate-700 truncate">
                  {userEmail ? userEmail : 'Guest User'}
                </span>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAuthModalOpen(true);
                }}
                className="text-xs font-bold text-blue-600 hover:underline shrink-0"
              >
                {userEmail ? 'Manage Account' : 'Sign In'}
              </button>
            </div>

            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">Main Sections</div>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button
                onClick={() => handleNavClick('/')}
                className={`p-2.5 text-left rounded-xl transition-colors ${isActive('/') ? 'bg-blue-50 text-blue-600 font-bold' : 'bg-slate-50 text-slate-700'}`}
              >
                🏠 Home
              </button>
              <button
                onClick={() => handleNavClick('/products')}
                className={`p-2.5 text-left rounded-xl transition-colors ${isActive('/products') ? 'bg-blue-50 text-blue-600 font-bold' : 'bg-slate-50 text-slate-700'}`}
              >
                📦 All Products
              </button>
              <button
                onClick={() => handleNavClick('/categories')}
                className={`p-2.5 text-left rounded-xl transition-colors ${isActive('/categories') ? 'bg-blue-50 text-blue-600 font-bold' : 'bg-slate-50 text-slate-700'}`}
              >
                📂 Categories
              </button>
              <button
                onClick={() => handleNavClick('/buying-guides')}
                className={`p-2.5 text-left rounded-xl transition-colors ${isActive('/buying-guides') ? 'bg-blue-50 text-blue-600 font-bold' : 'bg-slate-50 text-slate-700'}`}
              >
                📖 Buying Guides
              </button>
              <button
                onClick={() => handleNavClick('/compare')}
                className={`p-2.5 text-left rounded-xl transition-colors ${isActive('/compare') ? 'bg-blue-50 text-blue-600 font-bold' : 'bg-slate-50 text-slate-700'}`}
              >
                ⚖️ Comparisons
              </button>
              <button
                onClick={() => handleNavClick('/reviews')}
                className={`p-2.5 text-left rounded-xl transition-colors ${isActive('/reviews') ? 'bg-blue-50 text-blue-600 font-bold' : 'bg-slate-50 text-slate-700'}`}
              >
                ⭐ Reviews
              </button>
              <button
                onClick={() => handleNavClick('/articles')}
                className={`p-2.5 text-left rounded-xl transition-colors ${isActive('/articles') ? 'bg-blue-50 text-blue-600 font-bold' : 'bg-slate-50 text-slate-700'}`}
              >
                📝 Articles
              </button>
              <button
                onClick={() => handleNavClick('/saved')}
                className={`p-2.5 text-left rounded-xl transition-colors ${isActive('/saved') ? 'bg-blue-50 text-blue-600 font-bold' : 'bg-slate-50 text-slate-700'}`}
              >
                ❤️ Saved ({savedProductIds.length})
              </button>
            </div>

            {/* Quick Category Touch Scroll inside drawer */}
            <div className="pt-2 border-t border-slate-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">
                Browse Categories
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleNavClick(`/category/${cat.slug}`)}
                    className="shrink-0 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-lg transition-colors whitespace-nowrap"
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget Quick Filters */}
            <div className="pt-2 border-t border-slate-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">
                Best Under ₹ Price Finder
              </div>
              <div className="flex flex-wrap gap-1.5">
                {budgetTiers.map((tier) => (
                  <button
                    key={tier.slug}
                    onClick={() => handleNavClick(`/${tier.slug}`)}
                    className="px-2.5 py-1 text-xs font-bold bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 rounded-lg transition-colors"
                  >
                    ₹{tier.amount}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Global Modals */}
      <SubscribeModal
        isOpen={subscribeModalOpen}
        onClose={() => setSubscribeModalOpen(false)}
      />
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
};
