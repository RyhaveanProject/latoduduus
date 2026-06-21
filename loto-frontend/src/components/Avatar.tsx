import React from 'react';
import { initials, cn } from '@/lib/utils';

export function Avatar({ name, email, src, size = 40, className }: { name?: string; email?: string; src?: string; size?: number; className?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name ?? email ?? 'avatar'} style={{ width: size, height: size }} className={cn('rounded-full object-cover ring-2 ring-gold-500/30', className)} />;
  }
  return (
    <div
      style={{ width: size, height: size }}
      className={cn('flex items-center justify-center rounded-full bg-gradient-to-br from-gold-300 to-gold-700 font-semibold text-bg ring-2 ring-gold-500/30', className)}
    >
      {initials(name, email)}
    </div>
  );
}
