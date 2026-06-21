'use client';
import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
  endAdornment?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, error, endAdornment, className, ...rest }, ref) => {
    return (
      <label className="block w-full">
        {label && <span className="mb-1.5 block text-xs font-medium text-gold-200/80">{label}</span>}
        <div className={cn('flex items-center gap-2 rounded-xl border bg-white/[0.04] px-3.5 py-2.5 transition-colors', error ? 'border-ruby-500/60' : 'border-white/10 focus-within:border-gold-500/60')}>
          {icon && <span className="text-gold-400/70">{icon}</span>}
          <input
            ref={ref}
            className={cn('w-full bg-transparent text-sm text-gold-50 placeholder:text-gold-100/30 outline-none', className)}
            {...rest}
          />
          {endAdornment}
        </div>
        {error && <span className="mt-1 block text-xs text-ruby-400">{error}</span>}
      </label>
    );
  }
);
Input.displayName = 'Input';
