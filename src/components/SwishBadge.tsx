import React from 'react';

interface SwishLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const SwishLogo: React.FC<SwishLogoProps> = ({ className = '', size = 32, showText = false }) => {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="swishGradientLeft" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EB1C24" />
            <stop offset="100%" stopColor="#F7931E" />
          </linearGradient>
          <linearGradient id="swishGradientRight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00A9E0" />
            <stop offset="100%" stopColor="#003A70" />
          </linearGradient>
        </defs>

        {/* Outer subtle shadow circle for badge style if needed */}
        <circle cx="50" cy="50" r="48" fill="#FFFFFF" />

        {/* Swish Swirl Shapes */}
        <g transform="translate(14, 14) scale(0.72)">
          {/* Warm Left Swirl */}
          <path
            d="M 49 14 C 28 14 12 30 12 51 C 12 65 20 77 32 82 C 34 83 36 82 36 80 C 36 78 34 77 33 76 C 24 71 18 62 18 51 C 18 34 32 20 49 20 C 60 20 70 26 75 35 C 76 37 78 37 79 36 C 80 35 80 33 79 32 C 72 21 61 14 49 14 Z"
            fill="url(#swishGradientLeft)"
          />
          {/* Cool Right Swirl */}
          <path
            d="M 51 86 C 72 86 88 70 88 49 C 88 35 80 23 68 18 C 66 17 64 18 64 20 C 64 22 66 23 67 24 C 76 29 82 38 82 49 C 82 66 68 80 51 80 C 40 80 30 74 25 65 C 24 63 22 63 21 64 C 20 65 20 67 21 68 C 28 79 39 86 51 86 Z"
            fill="url(#swishGradientRight)"
          />
          {/* Accent Dots */}
          <circle cx="34" cy="38" r="4.5" fill="#EB1C24" />
          <circle cx="66" cy="62" r="4.5" fill="#00A9E0" />
        </g>
      </svg>

      {showText && (
        <span className="font-bold tracking-tight text-slate-900 text-lg sm:text-xl font-sans">
          Swish
        </span>
      )}
    </div>
  );
};
