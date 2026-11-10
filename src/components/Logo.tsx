import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ className = '', showText = true, size = 'md' }) => {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14'
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div className={`relative flex items-center justify-center ${iconSizes[size]}`}>
        {/* Glow halo */}
        <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-md" />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 100"
          fill="none"
          className="relative w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(0,140,255,0.7)]"
          aria-label="TOP LAPTOP"
        >
          <defs>
            <linearGradient id="blueCyanLogo" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00D4FF" />
              <stop offset="100%" stopColor="#008CFF" />
            </linearGradient>
          </defs>
          <polygon points="50,5 90,26 90,74 50,95 10,74 10,26" stroke="#008CFF" strokeWidth="2.5" fill="#080F1C" strokeOpacity="0.8" />
          <polygon points="50,12 83,30 83,70 50,88 17,70 17,30" stroke="#00D4FF" strokeWidth="1" strokeDasharray="3,3" fill="none" opacity="0.4" />
          <rect x="26" y="27" width="48" height="32" rx="4" stroke="url(#blueCyanLogo)" strokeWidth="3" fill="#050505" />
          <path d="M33 43L45 35L55 45L67 37" stroke="#00D4FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19 63L23 69H77L81 63H19Z" fill="url(#blueCyanLogo)" />
          <rect x="42" y="65" width="16" height="2" rx="1" fill="#FFFFFF" opacity="0.9" />
          <path d="M48 18L62 18L52 27L48 18Z" fill="#00D4FF" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col tracking-tight">
          <div className={`font-black font-sans leading-none flex items-center gap-1.5 ${textSizes[size]}`}>
            <span className="text-white">TOP</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500">
              LAPTOP
            </span>
          </div>
          <span className="text-[9px] font-bold tracking-[0.25em] text-cyan-400/90 uppercase mt-0.5">
            Algeria Tech
          </span>
        </div>
      )}
    </div>
  );
};
