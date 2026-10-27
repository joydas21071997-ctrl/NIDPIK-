import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { articles } from '../data/articles';
import { categories } from '../data/categories';
import { CategoryPills } from '../components/CategoryPills';
import { Search, ArrowRight, FileText, Clock, Mail, CheckCircle2, Send, Sparkles } from 'lucide-react';
import { db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { api } from '../services/api';

export const HomePage: React.FC = () => {
  const { navigate, setSearchModalOpen } = useApp();

  const [lowerEmail, setLowerEmail] = useState('');
  const [lowerSubscribed, setLowerSubscribed] = useState(false);

  const handleLowerSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = lowerEmail.toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@')) return;

    try {
      const subId = 'sub_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      setDoc(doc(db, 'newsletter_subscribers', subId), {
        id: subId,
        email: cleanEmail,
        source: 'homepage_newsletter',
        createdAt: new Date().toISOString()
      }).catch(() => {});
    } catch {}

    api.subscribers.subscribe(cleanEmail, 'homepage_newsletter').catch(() => {});

    try {
      const existing = JSON.parse(localStorage.getItem('nidpik_subscribers') || '[]');
      existing.push({ email: cleanEmail, source: 'homepage', date: new Date().toISOString() });
      localStorage.setItem('nidpik_subscribers', JSON.stringify(existing));
    } catch {}

    setLowerSubscribed(true);
    setLowerEmail('');
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 overflow-x-hidden w-full max-w-full">
      
      {/* TOP CATEGORY BAR (Categories at the top for instant mobile access) */}
      <div className="bg-white border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5">
          <CategoryPills layout="scroll" />
        </div>
      </div>

      {/* HERO & SEARCH BAR */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 text-center space-y-3 sm:space-y-4">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Affiliate Blog &amp; Expert Buying Guides</span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Honest Reviews &amp; Smart Affiliate Recommendations
        </h1>

        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
          Read curated buying guides, expert product recommendations, and everyday saving tips.
        </p>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto pt-1">
          <div
            onClick={() => setSearchModalOpen(true)}
            className="bg-white border border-slate-200 hover:border-blue-500 rounded-full py-2.5 px-4 flex items-center justify-between shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2 text-slate-400 text-xs sm:text-sm font-medium flex-1 truncate">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
              <span className="truncate">Search articles, guides, or topics...</span>
            </div>
            <button
              type="button"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shrink-0 transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* RECENT ARTICLES & BLOG FEED (Mobile Friendly Feed) */}
      <section className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-base sm:text-xl font-extrabold text-slate-900 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Latest Blog Posts &amp; Guides</span>
            </h2>
          </div>
          <button
            onClick={() => navigate('/articles')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            <span>View All ({articles.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {articles.map((art) => (
            <div
              key={art.id}
              onClick={() => navigate(`/articles/${art.slug}`)}
              className="nidpik-card rounded-xl sm:rounded-2xl p-3 cursor-pointer group flex flex-col justify-between space-y-3 bg-white border border-slate-200 hover:border-blue-400 transition-all shadow-2xs hover:shadow-md"
            >
              <div className="aspect-16/10 rounded-lg sm:rounded-xl overflow-hidden bg-slate-100 relative">
                <img
                  src={art.image}
                  alt={art.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1 font-semibold">
                    <span className="text-blue-600 uppercase tracking-wider">{art.category}</span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5 text-slate-400" />
                      {art.readingTime}
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                    {art.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {art.excerpt}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-blue-600">
                  <span>Read Article</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* NEWSLETTER SUBSCRIBE BANNER */}
      <section className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 pt-4">
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white border border-slate-800 shadow-lg text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-300 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
            <Mail className="w-3 h-3" />
            <span>Weekly Affiliate Insights</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">
            Never Miss a Verified Buying Guide &amp; Deal
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            Get honest product recommendations and smart shopping tips delivered straight to your inbox.
          </p>

          <div className="max-w-md mx-auto pt-1">
            {lowerSubscribed ? (
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs px-4 py-2.5 rounded-xl font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Successfully subscribed! Thank you.</span>
              </div>
            ) : (
              <form onSubmit={handleLowerSubscribe} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={lowerEmail}
                  onChange={(e) => setLowerEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  required
                  className="px-3.5 py-2.5 text-xs bg-slate-800 border border-slate-700 text-white rounded-xl placeholder-slate-400 focus:outline-none focus:border-blue-400 flex-1 shadow-inner"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
                >
                  <span>Subscribe</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

    </div>
  );
};
