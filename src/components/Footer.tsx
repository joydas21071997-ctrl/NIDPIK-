import React, { useState } from 'react';
import { Logo } from './Logo';
import { useApp, COUNTRIES, REGIONS_CONFIG, type RegionConfig } from '../context/AppContext';
import { ShieldCheck, Sparkles, CheckCircle2, ArrowRight, KeyRound, Globe, Mail } from 'lucide-react';
import { categories } from '../data/categories';
import { api } from '../services/api';
import { db } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';

export interface FooterProps {
  regionConfig?: RegionConfig;
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ regionConfig: propRegionConfig, className = '' }) => {
  const {
    navigate,
    formatPrice,
    selectedCountry,
    setSelectedCountry,
    currentRegion
  } = useApp();

  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // Use props if passed, otherwise fall back to AppContext regional configuration
  const region: RegionConfig = propRegionConfig || currentRegion || REGIONS_CONFIG[selectedCountry] || REGIONS_CONFIG.IN;

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (cleanEmail && cleanEmail.includes('@')) {
      // 1. Save to Backend Database
      api.subscribers.subscribe(cleanEmail, `footer_${region.code.toLowerCase()}`).catch(() => {});

      // 2. Save to Firestore
      try {
        addDoc(collection(db, 'newsletter_subscribers'), {
          email: cleanEmail,
          country: region.code,
          source: 'footer',
          createdAt: new Date().toISOString()
        }).catch(() => {});
      } catch {
        // ignore
      }

      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className={`bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* TOP BRAND & NEWSLETTER STRIP */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-12 border-b border-slate-800">
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white px-3 py-1.5 rounded-lg inline-block shadow-xs">
              <Logo size="md" showTagline={true} />
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-lg">
              <strong className="text-white font-medium">NIDPIK</strong> (Need + Pick) is an independent product discovery and buying guide platform for {region.shopperAudience}. We help you cut through marketing hype to find what is genuinely worth buying in {region.name} {region.flag}.
            </p>
            
            {/* Dynamic Regional Trust Badges */}
            <div className="flex items-center gap-4 text-xs text-slate-400 font-medium flex-wrap pt-1">
              {(region.trustBadges || []).map((badge, idx) => (
                <span key={idx} className="flex items-center gap-1.5 text-slate-300" title={badge.subtitle}>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{badge.title}</span>
                </span>
              ))}
            </div>

            {/* Direct Contact & Active Market Indicator */}
            <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>Editorial Desk:</span>
                <a href={`mailto:${region.contactEmail || 'hello@nidpik.com'}`} className="text-blue-400 hover:underline">
                  {region.contactEmail || 'hello@nidpik.com'}
                </a>
              </span>
              <span className="text-slate-600">·</span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Market:</span>
                <strong className="text-white font-medium">{region.name} ({region.currencyCode})</strong>
              </span>
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col justify-center bg-slate-800/60 p-6 rounded-2xl border border-slate-700/60">
            <h3 className="text-white font-bold text-base mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              Get Better Product Picks for {region.name} {region.flag}
            </h3>
            <p className="text-slate-400 text-xs mb-4">
              {region.newsletterSubtitle} No spam.
            </p>
            {subscribed ? (
              <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs px-4 py-3 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                Thank you! You are subscribed to NIDPIK weekly product picks.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={`Enter email for ${region.name} recommendations...`}
                  required
                  className="px-3.5 py-2.5 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 flex-1"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors whitespace-nowrap flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  Subscribe
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* NAVIGATION LINKS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 py-12 border-b border-slate-800 text-xs">
          {/* Col 1: Categories */}
          <div>
            <h4 className="text-white font-semibold uppercase tracking-wider text-[11px] mb-3">
              Categories
            </h4>
            <ul className="space-y-2">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <a
                    href={`/category/${cat.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/category/${cat.slug}`);
                    }}
                    className="hover:text-blue-400 transition-colors"
                  >
                    {cat.name}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="/categories"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/categories');
                  }}
                  className="text-blue-400 hover:underline font-medium"
                >
                  All Categories →
                </a>
              </li>
            </ul>
          </div>

          {/* Col 2: Dynamic Regional Budget Discovery */}
          <div>
            <h4 className="text-white font-semibold uppercase tracking-wider text-[11px] mb-3 flex items-center gap-1.5">
              <span>Budget Discovery</span>
              <span className="text-[10px] text-blue-400 font-mono">({region.currencySymbol})</span>
            </h4>
            <ul className="space-y-2">
              {(region.budgetTiers || []).map((tier) => (
                <li key={tier.slug}>
                  <a
                    href={`/${tier.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/${tier.slug}`);
                    }}
                    className="hover:text-blue-400 transition-colors flex items-center justify-between"
                  >
                    <span>{tier.label}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Picks</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Research & Guides */}
          <div>
            <h4 className="text-white font-semibold uppercase tracking-wider text-[11px] mb-3">
              Research &amp; Guides
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/buying-guides"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/buying-guides');
                  }}
                  className="hover:text-blue-400 transition-colors"
                >
                  In-Depth Buying Guides
                </a>
              </li>
              <li>
                <a
                  href="/compare"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/compare');
                  }}
                  className="hover:text-blue-400 transition-colors"
                >
                  Side-by-Side Comparisons
                </a>
              </li>
              <li>
                <a
                  href="/reviews"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/reviews');
                  }}
                  className="hover:text-blue-400 transition-colors"
                >
                  Hands-On Reviews
                </a>
              </li>
              <li>
                <a
                  href="/articles"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/articles');
                  }}
                  className="hover:text-blue-400 transition-colors"
                >
                  Consumer Advice Articles
                </a>
              </li>
              <li>
                <a
                  href="/problems"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/problems');
                  }}
                  className="hover:text-blue-400 transition-colors"
                >
                  Problem-First Discovery
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Trust & Editorial */}
          <div>
            <h4 className="text-white font-semibold uppercase tracking-wider text-[11px] mb-3">
              Trust &amp; Editorial
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/how-we-choose"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/how-we-choose');
                  }}
                  className="hover:text-blue-400 transition-colors"
                >
                  How We Choose
                </a>
              </li>
              <li>
                <a
                  href="/editorial-policy"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/editorial-policy');
                  }}
                  className="hover:text-blue-400 transition-colors"
                >
                  Editorial Policy
                </a>
              </li>
              <li>
                <a
                  href="/affiliate-disclosure"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/affiliate-disclosure');
                  }}
                  className="hover:text-blue-400 transition-colors"
                >
                  Affiliate Disclosure
                </a>
              </li>
              <li>
                <a
                  href="/about"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/about');
                  }}
                  className="hover:text-blue-400 transition-colors"
                >
                  About NIDPIK
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/contact');
                  }}
                  className="hover:text-blue-400 transition-colors"
                >
                  Contact Editorial Team
                </a>
              </li>
            </ul>
          </div>

          {/* Col 5: Legal & Privacy */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <h4 className="text-white font-semibold uppercase tracking-wider text-[11px] mb-3">
              Legal &amp; Privacy
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/privacy"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/privacy');
                  }}
                  className="hover:text-blue-400 transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/terms');
                  }}
                  className="hover:text-blue-400 transition-colors"
                >
                  Terms &amp; Conditions
                </a>
              </li>
              <li>
                <a
                  href="/affiliate-disclosure"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/affiliate-disclosure');
                  }}
                  className="hover:text-blue-400 transition-colors"
                >
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* AFFILIATE DISCLOSURE & DYNAMIC REGIONAL DISCLAIMER */}
        <div className="pt-8 pb-4 text-xs text-slate-400 leading-relaxed space-y-4">
          <div className="flex items-start gap-3 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
            <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <div className="text-slate-200">
                <strong className="text-white">Affiliate Disclosure:</strong> As an Amazon Associate and verified partner, NIDPIK earns from qualifying purchases. If you purchase through merchant links on NIDPIK, we may earn an affiliate commission at zero additional cost to you. NIDPIK does not sell products directly.
              </div>
              <div className="text-slate-400 text-[11px]">
                {region.disclosureText}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-0.5 flex-wrap">
                <span className="font-semibold text-slate-300">Supported Markets &amp; Merchants:</span>
                <span>{region.merchantsSummary}</span>
              </div>
            </div>
          </div>

          {/* Quick Region Switcher in Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-2 border-t border-slate-800/80 gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="text-[11px] text-slate-500">Switch Market:</span>
              <div className="flex items-center gap-1.5">
                {COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setSelectedCountry(c.code as any)}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                      selectedCountry === c.code
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <span>{c.flag}</span>
                    <span>{c.code}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 text-slate-500 text-[11px]">
              <div>
                © 2026 NIDPIK. All rights reserved.
              </div>
              <span className="text-slate-700">·</span>
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="text-slate-600 hover:text-slate-400 p-1 rounded-md transition-colors cursor-pointer"
                aria-label="Admin Access"
                title="Admin Portal"
              >
                <KeyRound className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
