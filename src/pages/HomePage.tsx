import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { products } from '../data/products';
import { budgetTiers } from '../data/budgetTiers';
import { problemCollections } from '../data/problemCollections';
import { buyingGuides } from '../data/buyingGuides';
import { comparisons } from '../data/comparisons';
import { reviews } from '../data/reviews';
import { articles } from '../data/articles';
import { ProductCard } from '../components/ProductCard';
import { CategoryPills } from '../components/CategoryPills';
import { SubscribeModal } from '../components/SubscribeModal';
import {
  Search,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Scale,
  BookOpen,
  FileText,
  Tag,
  Zap,
  TrendingUp,
  Mail,
  Send,
  Layers
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { navigate, setSearchModalOpen, openAiAdvisorWithPrompt } = useApp();

  const [frontEmail, setFrontEmail] = useState('');
  const [frontSubscribed, setFrontSubscribed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Popular Picks (Top 4 products shown compactly in 2-col on mobile, 4-col on desktop)
  const popularPicks = products.filter((p) =>
    ['boat-airdopes-141', 'pigeon-electric-kettle', 'milton-water-bottle-steel', 'fire-tv-stick-hd'].includes(p.id)
  );

  const handleFrontSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = frontEmail.toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@')) return;

    // 1. Dual-write to Firebase Firestore
    try {
      const subId = 'sub_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      setDoc(doc(db, 'newsletter_subscribers', subId), {
        id: subId,
        email: cleanEmail,
        source: 'homepage_banner',
        createdAt: new Date().toISOString()
      }).catch((err) => console.warn('Firestore subscription note:', err));
    } catch {
      // ignore
    }

    // 2. Write to Backend SQLite
    api.subscribers.subscribe(cleanEmail, 'homepage_banner').catch(() => {});

    // 3. LocalStorage persistence
    try {
      const existing = JSON.parse(localStorage.getItem('nidpik_subscribers') || '[]');
      existing.push({ email: cleanEmail, source: 'homepage_banner', date: new Date().toISOString() });
      localStorage.setItem('nidpik_subscribers', JSON.stringify(existing));
    } catch {
      // ignore
    }

    setFrontSubscribed(true);
    setFrontEmail('');
  };

  return (
    <div className="space-y-6 sm:space-y-10 md:space-y-12 pb-12">
      
      {/* 1. HERO SECTION (Compact, Catchy & Eye-Catching on Mobile) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#E8F1FF]/60 via-[#F1F6FF]/30 to-[#F8FAFC] pt-4 sm:pt-8 pb-6 sm:pb-10 border-b border-blue-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-center">
            
            {/* Left Column: Headline & Search */}
            <div className="lg:col-span-7 space-y-3 sm:space-y-5 text-left">
              {/* Subtle kicker */}
              <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span>Smart Choices for Everyday India</span>
              </div>

              {/* Main Headline (Clean line-height for mobile screens without overlap) */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[46px] font-extrabold text-slate-900 tracking-tight leading-tight pb-1 text-balance">
                Find the Right Products for <br />
                <span className="text-blue-600 relative inline-block pb-1.5">
                  Your Need
                  <svg
                    className="absolute bottom-0 left-0 w-full h-1.5 text-blue-400"
                    viewBox="0 0 100 12"
                    preserveAspectRatio="none"
                    fill="none"
                  >
                    <path
                      d="M1 9.5C25 3.5 75 3.5 99 9.5"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-slate-600 text-xs sm:text-base max-w-xl leading-relaxed">
                Honest recommendations, simple comparisons, and practical buying guides. No sponsored bias.
              </p>

              {/* Prominent Global Search Bar */}
              <div className="pt-0.5 max-w-xl">
                <div
                  onClick={() => setSearchModalOpen(true)}
                  className="bg-white border-2 border-slate-200 hover:border-blue-500 rounded-full p-1.5 pl-3.5 sm:pl-5 flex items-center justify-between shadow-xs hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 text-slate-400 text-xs sm:text-sm font-medium flex-1 truncate">
                    <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
                    <span className="truncate">Search needs, products, or budget ₹...</span>
                  </div>
                  <button
                    type="button"
                    className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shrink-0 transition-colors shadow-2xs"
                  >
                    <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>

                {/* Search suggestion hints */}
                <div className="flex items-center flex-wrap gap-1.5 text-[10px] sm:text-xs text-slate-500 mt-2 px-1">
                  <span className="font-semibold text-slate-700">Quick:</span>
                  {['Under ₹99', 'Earbuds under ₹2000', 'Small kitchen', 'Steel bottle'].map((hint) => (
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

            {/* Right Column: Clean, Zero-Crash Editorial Feature Showcase */}
            <div className="lg:col-span-5 relative mt-3 lg:mt-0">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-lg border border-slate-200/80 space-y-3.5 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-100/70 text-blue-700 flex items-center justify-center font-bold text-xs">
                      NP
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                        NIDPIK Product Standard
                      </h3>
                      <p className="text-[10px] text-slate-500">Everyday problem discovery engine</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Verified Tests
                  </span>
                </div>

                {/* 3 Core Highlights */}
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/50 transition-colors flex items-start gap-2.5">
                    <Tag className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block text-[11px] sm:text-xs">Starting from ₹99</span>
                      <span className="text-[10px] sm:text-[11px] text-slate-500 leading-tight">
                        Hand-tested budget utility items that deliver everyday reliability.
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/50 transition-colors flex items-start gap-2.5">
                    <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block text-[11px] sm:text-xs">Problem-First Architecture</span>
                      <span className="text-[10px] sm:text-[11px] text-slate-500 leading-tight">
                        Designed for small kitchens, WFH desks, student hostel rooms &amp; travel.
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/50 transition-colors flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block text-[11px] sm:text-xs">Zero Fabricated Ratings</span>
                      <span className="text-[10px] sm:text-[11px] text-slate-500 leading-tight">
                        No fake reviews, no sponsored bias. Real test results and clear affiliate transparency.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Trust Floating Bar */}
                <div className="bg-slate-900 text-white p-2 sm:p-2.5 rounded-xl flex items-center justify-around text-xs font-medium">
                  <div className="text-center">
                    <span className="block font-black text-blue-400 text-xs sm:text-sm">₹99</span>
                    <span className="text-[8px] sm:text-[9px] text-slate-300">Starts From</span>
                  </div>
                  <div className="h-4 sm:h-5 w-px bg-slate-700" />
                  <div className="text-center">
                    <span className="block font-black text-blue-400 text-xs sm:text-sm">100%</span>
                    <span className="text-[8px] sm:text-[9px] text-slate-300">Honest Tests</span>
                  </div>
                  <div className="h-4 sm:h-5 w-px bg-slate-700" />
                  <div className="text-center">
                    <span className="block font-black text-blue-400 text-xs sm:text-sm">10+</span>
                    <span className="text-[8px] sm:text-[9px] text-slate-300">Categories</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
 
      {/* 1.5 AI BUYING ADVISOR INTERACTIVE SECTION */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-md relative overflow-hidden border border-blue-800/50">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="space-y-2 max-w-xl text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] sm:text-xs font-bold border border-blue-400/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>NIDPIK AI Product Buying Advisor</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-snug">
                Confused about what to buy? Let AI pick for your budget &amp; need.
              </h2>
              <p className="text-xs sm:text-sm text-blue-200/80 leading-relaxed">
                Describe your daily problem, room, or price limit. Our advisor cross-checks genuine test verdicts, Indian budget constraints, and trusted merchant deals starting from ₹99.
              </p>
            </div>

            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2 shrink-0">
              <button
                onClick={() => openAiAdvisorWithPrompt()}
                className="px-5 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
                <span>Open AI Buying Advisor</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Click Prompts */}
          <div className="relative z-10 mt-4 pt-4 border-t border-white/10 flex items-center flex-wrap gap-2 text-xs">
            <span className="text-blue-300 font-semibold text-[11px]">Popular searches:</span>
            {[
              'WFH Desk Setup Under ₹999',
              'Small kitchen gadgets under ₹500',
              'Practical utility picks under ₹99',
              'Hostel student essentials'
            ].map((promptText) => (
              <button
                key={promptText}
                onClick={() => openAiAdvisorWithPrompt(promptText)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-blue-100 hover:text-white border border-white/10 transition-colors text-[11px] font-medium cursor-pointer"
              >
                "{promptText}"
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. EXPLORE CATEGORIES (Smooth Horizontal Touch Carousel) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div>
            <h2 className="text-base sm:text-xl font-bold text-slate-900 flex items-center gap-1.5">
              <span>Explore Categories</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500">Swipe horizontally to discover product categories</p>
          </div>
          <button
            onClick={() => navigate('/categories')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            <span>All Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Clean, swipeable pills with touch momentum */}
        <CategoryPills layout="scroll" />
      </section>

      {/* FRONT EMAIL SUBSCRIPTION BAR (Prominently placed at the top for easy 1-click access) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-3.5 sm:p-5 text-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-6">
          <div className="text-left flex items-start gap-3 w-full md:w-auto">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black text-white">Subscribe to NIDPIK Weekly</span>
                <span className="text-[9px] bg-white/20 text-blue-100 font-bold px-1.5 py-0.2 rounded-full">
                  FREE
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-blue-100 mt-0.5">
                Handpicked value finds, ₹99 budget gems &amp; buying guides directly in your email.
              </p>
            </div>
          </div>

          <div className="w-full md:w-auto shrink-0">
            {frontSubscribed ? (
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/30 border border-emerald-400 text-emerald-100 text-xs px-3 py-1.5 rounded-xl font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Subscribed! Check your inbox.</span>
              </div>
            ) : (
              <form onSubmit={handleFrontSubscribe} className="flex gap-1.5 w-full sm:w-auto">
                <input
                  type="email"
                  value={frontEmail}
                  onChange={(e) => setFrontEmail(e.target.value)}
                  placeholder="Enter email address..."
                  required
                  className="px-3 py-1.5 text-xs bg-white text-slate-900 rounded-xl placeholder-slate-400 focus:outline-none flex-1 sm:w-60 shadow-2xs"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-xs shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <span>Subscribe</span>
                  <Send className="w-3 h-3" />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 3. POPULAR PICKS FOR YOU (2-Column Compact Grid on Mobile to prevent endless scrolling!) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-3 sm:mb-5">
          <div>
            <div className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-wider mb-0.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Editor Tested
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900">Popular Picks for You</h2>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Handpicked recommendations tested for Indian homes &amp; daily budgets.
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

        {/* 2-column on mobile, 4-column on desktop: saves massive vertical space */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
          {popularPicks.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 4. BEST PRODUCTS FROM ₹99 (Dedicated Budget Discovery Engine) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-blue-50/70 via-slate-50 to-blue-50/40 rounded-2xl sm:rounded-3xl p-3.5 sm:p-7 border border-blue-100/80">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 sm:mb-6 gap-3">
            <div>
              <div className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-blue-600 bg-blue-100/80 px-2 py-0.5 rounded-md mb-1.5">
                <Tag className="w-3 h-3" />
                Budget Discovery Engine
              </div>
              <h2 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Best Products From <span className="text-blue-600">₹99</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-600 mt-1 max-w-xl">
                Real value starts at ₹99. We test budget items to find the rare gems that actually deliver everyday utility.
              </p>
            </div>
            <button
              onClick={() => navigate('/best-under-99')}
              className="text-xs font-bold text-blue-700 hover:text-blue-800 bg-white border border-blue-200 px-3.5 py-1.5 rounded-xl shadow-2xs transition-colors self-start md:self-auto cursor-pointer"
            >
              All Budget Tiers →
            </button>
          </div>

          {/* Budget Tiers Grid (₹99, ₹199, ₹299, ₹499, ₹999, ₹1999, ₹2999, ₹4999) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2 sm:gap-3.5">
            {budgetTiers.map((tier) => (
              <div
                key={tier.slug}
                onClick={() => navigate(`/${tier.slug}`)}
                className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      Budget
                    </span>
                    <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">
                      ₹{tier.amount}
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    Best Under ₹{tier.amount.toLocaleString('en-IN')}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                    {tier.headline}
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                  <span>View Products</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. PROBLEM-BASED PRODUCT DISCOVERY */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-3 sm:mb-5">
          <div>
            <div className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-wider mb-0.5 flex items-center gap-1">
              <Zap className="w-3 h-3 text-blue-600" />
              Need-First Architecture
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900">
              Problem-Based Discovery
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 max-w-xl">
              Solve actual dilemmas: compact kitchens, hostel life, or desk organization.
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

      {/* 6. FEATURED BUYING GUIDES */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-3 sm:mb-5">
          <div>
            <div className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-wider mb-0.5 flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-blue-600" />
              Editorial Research
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900">
              Featured Buying Guides
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Tested decision frameworks for Indian shoppers.
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
                  <span aria-hidden="true">·</span>
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
                <span>Read Full Buying Guide</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. LATEST ARTICLES & INSIGHTS (Read directly on NIDPIK) */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-3 sm:mb-5">
          <div>
            <div className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-wider mb-0.5 flex items-center gap-1">
              <FileText className="w-3 h-3 text-blue-600" />
              Consumer Advice &amp; Editorial
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900">
              Latest Articles &amp; Insights
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500">
              Read directly on NIDPIK website: smart saving tips, decluttering guides &amp; honest opinions.
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
              className="nidpik-card rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer group flex flex-col justify-between"
            >
              <div className="aspect-16/9 w-full overflow-hidden bg-slate-100 max-h-36 sm:max-h-44">
                <img
                  src={art.image}
                  alt={art.title}
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                />
              </div>

              <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-500 mb-1 font-medium">
                    <span className="text-blue-600 font-semibold">{art.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{art.readingTime}</span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                    {art.title}
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                    {art.excerpt}
                  </p>
                </div>

                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                  <span>Read Article on NIDPIK</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 9. TRUST & EDITORIAL CONSTITUTION BANNER */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-200 shadow-2xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 text-left">
            <div className="space-y-1.5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">Zero Fabricated Ratings</h3>
              <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                We never invent fake star counts or false discount timers. Recommendations are grounded in actual specifications and testing.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">India-First Conditions</h3>
              <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                Products are evaluated for Indian voltage fluctuations, borewell water hardness, tropical humidity, and realistic INR budgets.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">Budget Starts from ₹99</h3>
              <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                Useful product discovery shouldn’t require spending thousands. We surface genuine problem-solvers starting right from ₹99.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Global Subscribe Modal triggerable from hero */}
      <SubscribeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};
