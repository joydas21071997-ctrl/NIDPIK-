import React, { useState } from 'react';
import { X, Mail, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { db } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubscribeModal: React.FC<SubscribeModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [frequency, setFrequency] = useState<'weekly' | 'deals'>('weekly');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) return;

    // 1. Store in backend database
    api.subscribers.subscribe(cleanEmail, `modal_${frequency}`).catch(() => {});

    // 2. Store in Firestore
    try {
      addDoc(collection(db, 'newsletter_subscribers'), {
        email: cleanEmail,
        frequency,
        source: 'modal',
        createdAt: new Date().toISOString()
      }).catch(() => {});
    } catch {
      // ignore
    }

    // Store in localStorage for persistence
    try {
      const existing = JSON.parse(localStorage.getItem('nidpik_subscribers') || '[]');
      existing.push({ email: cleanEmail, frequency, date: new Date().toISOString() });
      localStorage.setItem('nidpik_subscribers', JSON.stringify(existing));
    } catch {
      // ignore
    }

    setIsSubmitted(true);
    setTimeout(() => {
      // Keep feedback for a moment
    }, 1000);
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setEmail('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gradient Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 text-white text-left relative">
          <button
            onClick={handleReset}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-[11px] font-bold text-blue-100 mb-2">
            <Sparkles className="w-3 h-3" />
            <span>NIDPIK Insider Club</span>
          </div>
          <h3 className="text-xl font-black text-white">Subscribe for Smart Picks</h3>
          <p className="text-xs text-blue-100 mt-1 leading-relaxed">
            Get weekly tested recommendations, price drop alerts, and value finds starting from ₹99.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {isSubmitted ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">You're on the list!</h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                We sent a welcome confirmation to <strong className="text-slate-800">{email}</strong>. Watch your inbox for genuine Indian product picks!
              </p>
              <button
                onClick={handleReset}
                className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
              >
                Back to Browsing
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Preference selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                  What would you like to receive?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFrequency('weekly')}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                      frequency === 'weekly'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Weekly Digest</span>
                    <span className="block text-[10px] font-normal text-slate-500 mt-0.5">Top 5 tested picks</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFrequency('deals')}
                    className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all ${
                      frequency === 'deals'
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Price Drops</span>
                    <span className="block text-[10px] font-normal text-slate-500 mt-0.5">Under ₹99 & ₹499 deals</span>
                  </button>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md hover:shadow-lg active:scale-98 cursor-pointer"
              >
                Subscribe Now (Free)
              </button>

              {/* Trust Micro-copy */}
              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Zero spam. Unsubscribe anytime with 1 click.</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
