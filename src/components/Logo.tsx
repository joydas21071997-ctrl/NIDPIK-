import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showTagline = false
}) => {
  const { navigate, settings } = useApp();
  const [imgError, setImgError] = useState(false);

  const customLogoUrl = settings?.general?.logoUrl;
  const logoSrc = customLogoUrl || '/logo.png';

  // Reset error state if logo URL changes
  useEffect(() => {
    setImgError(false);
  }, [customLogoUrl]);

  const heightClasses = {
    sm: 'h-7 sm:h-8',
    md: 'h-8 sm:h-9 md:h-10',
    lg: 'h-10 sm:h-12'
  };

  return (
    <a
      href="/"
      onClick={(e) => {
        e.preventDefault();
        navigate('/');
      }}
      className={`inline-flex flex-col group select-none text-left focus:outline-none transition-transform active:scale-98 ${className}`}
      aria-label="NIDPIK - Find, Compare & Pick Right"
    >
      <div className="flex items-center">
        {!imgError ? (
          <img
            key={logoSrc}
            src={logoSrc}
            alt="NIDPIK"
            onError={() => {
              if (logoSrc !== '/logo.png') {
                // Try PNG fallback before inline glyph
                const img = new Image();
                img.src = '/logo.png';
                img.onload = () => {
                  const el = document.querySelector('img[alt="NIDPIK"]') as HTMLImageElement;
                  if (el) el.src = '/logo.png';
                };
                img.onerror = () => setImgError(true);
              } else {
                setImgError(true);
              }
            }}
            className={`${heightClasses[size]} w-auto max-w-[220px] object-contain drop-shadow-2xs`}
            loading="eager"
          />
        ) : (
          /* Clean brand wordmark fallback if image fails to load */
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-700 via-blue-600 to-sky-400 flex items-center justify-center text-white font-black text-sm shadow-xs">
              N
            </div>
            <div className="font-black text-xl tracking-tight leading-none">
              <span className="text-slate-900">NID</span>
              <span className="text-blue-600">PIK</span>
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 ml-0.5 inline-block" />
            </div>
          </div>
        )}
      </div>

      {showTagline && (
        <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-slate-400 mt-1">
          FIND <span className="text-blue-600">·</span> COMPARE <span className="text-blue-600">·</span> PICK RIGHT
        </span>
      )}
    </a>
  );
};
