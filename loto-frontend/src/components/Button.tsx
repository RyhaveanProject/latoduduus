'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import { IconSpinner } from './icons';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variants: Record<Variant, string> = {
  primary: 'bg-gradient-to-b from-gold-300 to-gold-600 text-bg font-semibold shadow-gold hover:brightness-110 active:brightness-95',
  secondary: 'bg-white/10 text-gold-100 border border-white/10 hover:bg-white/15',
  ghost: 'bg-transparent text-gold-200 hover:bg-white/5',
  danger: 'bg-gradient-to-b from-ruby-400 to-ruby-600 text-white font-semibold hover:brightness-110',
  outline: 'bg-transparent border border-gold-500/50 text-gold-300 hover:bg-gold-500/10',
};

const sizes: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
  md: 'text-sm px-4 py-2.5 rounded-xl gap-2',
  lg: 'text-base px-6 py-3.5 rounded-2xl gap-2',
};

export function Button({ variant = 'primary', size = 'md', loading, icon, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <IconSpinner /> : icon}
      {children}
    </button>
  );
}
