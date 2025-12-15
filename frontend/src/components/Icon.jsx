import React from 'react';

export default function Icon({ name, size = 24, className = '', ...props }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true,
    focusable: false,
    className,
    ...props,
  };

  switch (name) {
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" />
          <line x1="20" y1="20" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'edit_square':
    case 'edit':
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="currentColor" />
          <path d="M20.71 7.04a1.003 1.003 0 000-1.42l-2.34-2.34a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill="currentColor" />
        </svg>
      );
    case 'psychology':
    case 'brain':
      return (
        <svg {...common}>
          <path d="M12 2a4 4 0 00-4 4v1H7a3 3 0 000 6h1v1a4 4 0 004 4 4 4 0 004-4v-1h1a3 3 0 000-6h-1V6a4 4 0 00-4-4z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        </svg>
      );
    case 'monitoring':
    case 'chart':
      return (
        <svg {...common}>
          <polyline points="3,17 9,11 13,15 21,7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <rect x="1" y="3" width="22" height="18" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
        </svg>
      );
    case 'devices':
    case 'device':
      return (
        <svg {...common}>
          <rect x="2" y="4" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <rect x="7" y="18" width="10" height="2" rx="1" fill="currentColor" />
        </svg>
      );
    case 'style':
    case 'brush':
      return (
        <svg {...common}>
          <path d="M3 21c1.5-1.5 4-4 6-6l10-10c1-1 2.2-1 3 0s1 2 .1 3.1L15 12c-2 2-4.5 4.5-6 6-1 1-3 1-4 0z" fill="currentColor" />
        </svg>
      );
    case 'school':
      return (
        <svg {...common}>
          <path d="M12 3l9 5-9 5-9-5 9-5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" fill="none" />
          <path d="M12 13v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M6 18v2a2 2 0 002 2h8a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.2" fill="none" />
        </svg>
      );
    case 'task_alt':
    case 'check':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M9 12.5l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      );
  }
}
