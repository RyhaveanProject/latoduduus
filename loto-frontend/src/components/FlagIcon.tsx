import React from 'react';
import { cn } from '@/lib/utils';

// Lightweight inline flag glyphs (SVG, no emoji, no external requests)
const FLAGS: Record<string, React.ReactNode> = {
  us: (
    <svg viewBox="0 0 24 16" className="h-full w-full">
      <rect width="24" height="16" fill="#b22234" />
      {[0, 2, 4, 6, 8, 10, 12].map((y) => (
        <rect key={y} y={y} width="24" height="1.23" fill="#fff" />
      ))}
      <rect width="10" height="8.6" fill="#3c3b6e" />
    </svg>
  ),
  az: (
    <svg viewBox="0 0 24 16" className="h-full w-full">
      <rect width="24" height="5.33" fill="#00b5e2" />
      <rect y="5.33" width="24" height="5.33" fill="#e2001a" />
      <rect y="10.66" width="24" height="5.34" fill="#00a651" />
      <circle cx="12" cy="8" r="2.6" fill="#fff" />
      <circle cx="12.9" cy="8" r="2.1" fill="#e2001a" />
    </svg>
  ),
  ru: (
    <svg viewBox="0 0 24 16" className="h-full w-full">
      <rect width="24" height="5.33" fill="#fff" />
      <rect y="5.33" width="24" height="5.33" fill="#0039a6" />
      <rect y="10.66" width="24" height="5.34" fill="#d52b1e" />
    </svg>
  ),
  tr: (
    <svg viewBox="0 0 24 16" className="h-full w-full">
      <rect width="24" height="16" fill="#e30a17" />
      <circle cx="9.5" cy="8" r="3.6" fill="#fff" />
      <circle cx="10.6" cy="8" r="2.9" fill="#e30a17" />
    </svg>
  ),
  ge: (
    <svg viewBox="0 0 24 16" className="h-full w-full">
      <rect width="24" height="16" fill="#fff" />
      <rect x="10.2" width="3.6" height="16" fill="#ff0000" />
      <rect y="6.2" width="24" height="3.6" fill="#ff0000" />
    </svg>
  ),
  sa: (
    <svg viewBox="0 0 24 16" className="h-full w-full">
      <rect width="24" height="16" fill="#006c35" />
      <rect x="4" y="7.2" width="16" height="1.6" fill="#fff" />
    </svg>
  ),
  cn: (
    <svg viewBox="0 0 24 16" className="h-full w-full">
      <rect width="24" height="16" fill="#de2910" />
      <polygon points="4,3 5,6 2,4.3 6,4.3 3,6" fill="#ffde00" />
    </svg>
  ),
};

export function FlagIcon({ code, className }: { code: string; className?: string }) {
  return <span className={cn('inline-block overflow-hidden rounded-[3px] ring-1 ring-white/15', className)}>{FLAGS[code] ?? FLAGS.us}</span>;
}
