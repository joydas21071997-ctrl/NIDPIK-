import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { products } from '../data/products';
import { problemCollections } from '../data/problemCollections';
import { buyingGuides } from '../data/buyingGuides';
import { comparisons } from '../data/comparisons';
import { articles } from '../data/articles';
import { ProductCard } from '../components/ProductCard';
import { CategoryPills } from '../components/CategoryPills';
import { SubscribeModal } from '../components/SubscribeModal';
import {
  Search,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Scale,
  BookOpen,
  FileText,
  Zap,
  TrendingUp,
  Mail,
  Send
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { navigate, setSearchModalOpen, selectedCountry, formatPrice } = useApp();

  const [lowerEmail, setLowerEmail] = useState('');
  const [lowerSubscribed, setLowerSubscribed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const handleLowerSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = lowerEmail.toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@')) return;

    try {
      const subId = 'sub_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      setDoc(doc(db, 'newsletter_subscribers', subId), {
        id: subId,
        email: cleanEmail,
        source: 'homepage_lower',
        createdAt: new Date().toISOString()
      }).catch(() => {});
    } catch {}

    api.subscribers.subscribe(cleanEmail, 'homepage_lower').catch(() => {});

    try {
      const existing = JSON.parse(localStorage.getItem('nidpik_subscribers') || '[]');
      existing.push({ email: cleanEmail, source: 'homepage_lower', date: new Date().toISOString() });
      localStorage.setItem('nidpik_subscribers', JSON.stringify(existing));
    } catch {}

    setLowerSubscribed(true);
    setLowerEmail('');
  };

  const popularPicks = products.filter((p) =>
    ['boat-airdopes-141', 'pigeon-electric-kettle', 'milton-water-bottle-steel', 'fire-tv-stick-hd'].includes(p.id)
  );

  return (
    <div className="space-y-6 sm:space-y-10 md:space-y-12 pb-12 overflow-x-hidden w-full max-w-full">
      
      {/* 1. CLEAN HERO & SEARCH SECTION (Blog & Discovery Centric) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-slate-50 to-white pt-6 sm:pt-10 pb-8 sm:pb-12 border-b border-blue-100/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4 sm:space-y-6">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-100/80 px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Independent Product Discovery &amp; Buying Guides</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight text-balance">
            Find the Right Products for <br className="hidden sm:inline" />
            <span className="text-blue-600 relative inline-block pb-1">
              Your Everyday Need
            </span>
          </h1>

          <p className="text-slate-600 text-xs sm:text-base max-w-2xl mx-auto leading-relaxed">
            Honest reviews, clear comparisons, and expert buying guides for shoppers across India, US, UK, and Canada. No sponsored bias.
          </p>

          {/* Prominent Global Search Bar */}
          <div className="max-w-2xl mx-auto pt-2">
            <div
              onClick={() => setSearchModalOpen(true)}
              className="bg-white border-2 border-slate-200 hover:border-blue-500 rounded-full p-2 pl-4 sm:pl-6 flex items-center justify-between shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 text-slate-400 text-xs sm:text-sm font-medium flex-1 truncate">
                <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
                <span className="truncate">Search needs, products, guides, or budget...</span>
              </div>
              <button
                type="button"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shrink-0 transition-colors shadow-xs"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-center flex-wrap gap-1.5 text-[11px] text-slate-500 mt-2.5">
              <span className="font-semibold text-slate-700">Trending Searches:</span>
              {['Earbuds', 'Electric Kettle', 'Steel Bottle', 'Streaming Stick'].map((hint) => (
                <button
                  key={hint}
                  onClick={() => setSearchModalOpen(true)}
                  className="hover:text-blue-600 underline underline-offset-2 transition-colors cursor-pointer"
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. LATEST ARTICLES & INSIGHTS (Prioritized immediately below search/hero area for blog focus) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-3 sm:mb-5">
          <div>
            <div className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-wider mb-0.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Editorial &amp; Consumer Advice</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900">
              Latest Articles &amp; Buying Insights
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Read directly on NIDPIK: smart saving tips, expert guides &amp; honest recommendations.
            </p>
          </div>
          <button
            onClick={() => navigate('/articles')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <span>All Articles</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
          {articles.slice(0, 3).map((art) => (
            <div
              key={art.id}
              onClick={() => navigate(`/articles/${art.slug}`)}
              className="nidpik-card rounded-xl sm:rounded-2xl p-3 sm:p-4 cursor-pointer group flex flex-col justify-between space-y-3 hover:shadow-md transition-shadow"
            >
              <div className="aspect-16/10 rounded-xl overflow-hidden bg-slate-100 relative">
                <img
                  src={art.image}
                  alt={art.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300"
                />
              </div>

              <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1 font-medium">
                    <span className="text-blue-600 font-bold">{art.category}</span>
                    <span>·</span>
                    <span>{art.readingTime}</span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                    {art.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {art.excerpt}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                  <span>Read Article</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. EXPLORE CATEGORIES */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div>
            <h2 className="text-base sm:text-xl font-bold text-slate-900 flex items-center gap-1.5">
              <span>Explore Categories</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500">Swipe horizontally to browse product categories</p>
          </div>
          <button
            onClick={() => navigate('/categories')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            <span>All Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <CategoryPills layout="scroll" />
      </section>

      {/* COMPACT CATEGORY EMAIL SUBSCRIBE */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Get weekly product picks</h4>
              <p className="text-[11px] text-slate-600">Handpicked value finds &amp; guides.</p>
            </div>
          </div>
          <div className="w-full sm:w-auto">
            {lowerSubscribed ? (
               <div className="text-emerald-600 text-xs font-bold text-center">Subscribed!</div>
            ) : (
              <form onSubmit={handleLowerSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={lowerEmail}
                  onChange={(e) => setLowerEmail(e.target.value)}
                  placeholder="Your email..."
                  required
                  className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none flex-1"
                />
                <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold cursor-pointer">Join</button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 4. POPULAR PICKS FOR YOU */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-3 sm:mb-5">
          <div>
            <div className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-wider mb-0.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Editor Tested
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900">Popular Picks for You</h2>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Handpicked recommendations tested for everyday reliability.
            </p>
          </div>
          <button
            onClick={() => navigate('/products')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
          {popularPicks.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 5. PROBLEM-BASED PRODUCT DISCOVERY */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-3 sm:mb-5">
          <div>
            <div className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-wider mb-0.5 flex items-center gap-1">
              <Zap className="w-3 h-3 text-blue-600" />
              Need-First Discovery
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900">
              Problem-Based Collections
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Solve actual dilemmas: compact kitchens, WFH desks, or travel packing.
            </p>
          </div>
          <button
            onClick={() => navigate('/problems')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <span>All Problems</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
          {problemCollections.slice(0, 3).map((problem) => (
            <div
              key={problem.id}
              onClick={() => navigate(`/problems/${problem.slug}`)}
              className="nidpik-card rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer group flex flex-col justify-between"
            >
              <div className="relative aspect-16/9 w-full overflow-hidden bg-slate-100 max-h-36 sm:max-h-44">
                <img
                  src={problem.image}
                  alt={problem.title}
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80';
                  }}
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                  <span className="text-[9px] uppercase font-bold text-blue-300 tracking-wider">
                    Problem Solver
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-white leading-snug drop-shadow-xs">
                    {problem.title}
                  </h3>
                </div>
              </div>

              <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-2">
                <p className="text-[11px] sm:text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {problem.tagline}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                  <span>Explore Solutions ({problem.productIds.length} picks)</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. PRODUCT COMPARISONS */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-3 sm:mb-5">
          <div>
            <div className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-wider mb-0.5 flex items-center gap-1">
              <Scale className="w-3 h-3 text-blue-600" />
              Head-to-Head Showdowns
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900">
              Product Comparisons
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500">
              We test close contenders side-by-side so you don't overspend.
            </p>
          </div>
          <button
            onClick={() => navigate('/compare')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <span>All Comparisons</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
          {comparisons.slice(0, 2).map((comp) => {
            const compProducts = comp.productIds
              .map((id) => products.find((p) => p.id === id))
              .filter(Boolean);

            return (
              <div
                key={comp.id}
                onClick={() => navigate(`/compare/${comp.slug}`)}
                className="nidpik-card rounded-xl sm:rounded-2xl p-3.5 sm:p-5 cursor-pointer group flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-500 mb-1.5 font-medium">
                    <span className="text-blue-600 font-bold">{comp.category}</span>
                    <span>Updated {comp.updatedAt}</span>
                  </div>
                  <h3 className="text-xs sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                    {comp.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {comp.verdictSummary}
                  </p>
                </div>

                {compProducts.length >= 2 && (
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 sm:p-2.5 rounded-xl border border-slate-100 items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-lg p-1 border border-slate-200 shrink-0 flex items-center justify-center">
                        <img src={compProducts[0]?.image} alt="" className="w-full h-full object-contain" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] sm:text-xs font-bold text-slate-900 truncate block">
                          {compProducts[0]?.brand}
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-blue-600 font-bold">
                          {formatPrice(compProducts[0]?.price ?? 0)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 border-l border-slate-200 pl-2">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-lg p-1 border border-slate-200 shrink-0 flex items-center justify-center">
                        <img src={compProducts[1]?.image} alt="" className="w-full h-full object-contain" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] sm:text-xs font-bold text-slate-900 truncate block">
                          {compProducts[1]?.brand}
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-blue-600 font-bold">
                          {formatPrice(compProducts[1]?.price ?? 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                  <span>Read Breakdown</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. FEATURED BUYING GUIDES */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-3 sm:mb-5">
          <div>
            <div className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-wider mb-0.5 flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-blue-600" />
              Research Guides
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900">
              Featured Buying Guides
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Tested decision frameworks for smart shoppers.
            </p>
          </div>
          <button
            onClick={() => navigate('/buying-guides')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <span>All Guides</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {buyingGuides.slice(0, 3).map((guide) => (
            <div
              key={guide.id}
              onClick={() => navigate(`/buying-guides/${guide.slug}`)}
              className="nidpik-card rounded-xl sm:rounded-2xl p-3.5 sm:p-4 cursor-pointer group flex flex-col justify-between space-y-2.5"
            >
              <div>
                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-500 mb-1 font-medium">
                  <span className="text-blue-600 font-semibold">{guide.category}</span>
                  <span>·</span>
                  <span>{guide.readingTime}</span>
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                  {guide.title}
                </h3>
                <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                  {guide.subtitle}
                </p>
              </div>

              <div className="p-2 sm:p-2.5 bg-slate-50 rounded-lg sm:rounded-xl border border-slate-100 text-[11px]">
                <span className="font-semibold text-slate-800 block mb-0.5">Quick Answer:</span>
                <p className="text-slate-600 line-clamp-2">{guide.quickAnswer}</p>
              </div>

              <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                <span>Read Full Guide</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. NEWSLETTER SECTION */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white border border-slate-800 shadow-md">
          <div className="max-w-2xl mx-auto text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-amber-300 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
              <Mail className="w-3.5 h-3.5" />
              <span>Get Nitpicky Quickly</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
              Never Overpay for Everyday Tech &amp; Home Essentials
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg mx-auto">
              Join thousands of smart shoppers. Every week we send 3 verified recommendations, hidden price drops, and zero-bullshit product guides.
            </p>

            <div className="pt-2 max-w-md mx-auto">
              {lowerSubscribed ? (
                <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs px-4 py-2.5 rounded-xl font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>You're in! Check your inbox for this week's verified picks.</span>
                </div>
              ) : (
                <form onSubmit={handleLowerSubscribe} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    value={lowerEmail}
                    onChange={(e) => setLowerEmail(e.target.value)}
                    placeholder="Enter your email address..."
                    required
                    className="px-3.5 py-2.5 text-xs bg-slate-800/90 border border-slate-700 text-white rounded-xl placeholder-slate-400 focus:outline-none focus:border-blue-400 flex-1 shadow-inner"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <span>Subscribe Free</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
              <span className="text-[10px] text-slate-400 block mt-2">
                No spam, ever. Unsubscribe with 1-click anytime.
              </span>
            </div>
          </div>
        </div>
      </section>

      <SubscribeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

