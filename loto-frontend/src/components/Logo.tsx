import React from 'react';
import { IconCrown } from './icons';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b from-gold-300 to-gold-600 text-bg shadow-gold">
        <IconCrown className="h-5 w-5" />
      </span>
      <span className="font-display text-lg tracking-wide text-gradient-gold">Loto Online</span>
    </div>
  );
}
