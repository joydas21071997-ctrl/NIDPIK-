import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface DisclosureBoxProps {
  compact?: boolean;
}

export const DisclosureBox: React.FC<DisclosureBoxProps> = ({ compact = false }) => {
  const { navigate } = useApp();

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-lg">
        <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        <span>
          Independent editorial picks. We may earn an affiliate commission at no extra cost to you.{' '}
          <a
            href="/affiliate-disclosure"
            onClick={(e) => {
              e.preventDefault();
              navigate('/affiliate-disclosure');
            }}
            className="text-blue-600 hover:underline font-medium"
          >
            Learn more
          </a>
        </span>
      </div>
    );
  }

  return (
    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 text-xs text-slate-600 flex items-start gap-2.5">
      <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
      <div>
        <span className="font-semibold text-slate-800">NIDPIK Editorial &amp; Affiliate Disclosure: </span>
        All products featured are selected by our independent editorial team based on rigorous real-world testing. When you purchase through merchant links on our site, we may earn an affiliate commission at no extra cost to you. We never accept compensation in exchange for positive product ratings.{' '}
        <a
          href="/editorial-policy"
          onClick={(e) => {
            e.preventDefault();
            navigate('/editorial-policy');
          }}
          className="text-blue-600 hover:underline font-semibold"
        >
          Read our Editorial Policy →
        </a>
      </div>
    </div>
  );
};
