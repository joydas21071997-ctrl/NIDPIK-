import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { ExternalLink, ShieldCheck, X } from 'lucide-react';

export const AffiliateModal: React.FC = () => {
  const { affiliateRedirect, closeAffiliateModal } = useApp();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!affiliateRedirect?.isOpen) {
      setCountdown(3);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.open(affiliateRedirect.url, '_blank', 'noopener,noreferrer');
          closeAffiliateModal();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [affiliateRedirect?.isOpen, affiliateRedirect?.url, closeAffiliateModal]);

  if (!affiliateRedirect?.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 text-center relative">
        <button
          onClick={closeAffiliateModal}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
          <ExternalLink className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">
            Visiting {affiliateRedirect.merchantName}
          </h3>
          <p className="text-xs text-slate-500 font-medium line-clamp-1 px-4">
            {affiliateRedirect.productName}
          </p>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-left space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            NIDPIK Editorial Guarantee
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500">
            NIDPIK is a product research platform and not a retailer. You are checking price directly on {affiliateRedirect.merchantName}. We may earn an affiliate commission at zero extra cost to you.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => {
              window.open(affiliateRedirect.url, '_blank', 'noopener,noreferrer');
              closeAffiliateModal();
            }}
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Proceed to {affiliateRedirect.merchantName.split(' ')[0]} ({countdown}s)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={closeAffiliateModal}
            className="py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-xl transition-colors"
          >
            Stay on NIDPIK
          </button>
        </div>
      </div>
    </div>
  );
};
