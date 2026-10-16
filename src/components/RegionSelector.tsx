import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useApp, COUNTRIES } from '../context/AppContext';

export const RegionSelector: React.FC = () => {
  const { selectedCountry, setSelectedCountry } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const currentCountryObj = COUNTRIES.find((c) => c.code === selectedCountry) || COUNTRIES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1.5 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
        aria-label="Select Market"
      >
        <span className="text-base">{currentCountryObj.flag}</span>
        <span>{currentCountryObj.code}</span>
        <ChevronDown className="w-3 h-3 text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 space-y-1">
          <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
            Select Market
          </div>
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              onClick={() => {
                setSelectedCountry(c.code as any);
                setIsOpen(false);
              }}
              className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                selectedCountry === c.code
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-base">{c.flag}</span>
                {c.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
