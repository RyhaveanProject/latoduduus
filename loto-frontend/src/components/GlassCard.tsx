import React from 'react';
import { cn } from '@/lib/utils';

export function GlassCard({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('glass rounded-2xl shadow-glass', className)} {...rest}>
      {children}
    </div>
  );
}
