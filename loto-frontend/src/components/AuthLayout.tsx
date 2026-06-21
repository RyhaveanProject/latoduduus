import React from 'react';
import { Logo } from '@/components/Logo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export function AuthLayout({ children, subtitleSlot }: { children: React.ReactNode; subtitleSlot?: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-felt bg-radial-fade text-gold-50">
      <div className="pointer-events-none absolute -left-32 top-1/3 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-gold-500/10 blur-3xl" />
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <Logo />
        <LanguageSwitcher />
      </header>
      <main className="relative z-10 mx-auto flex max-w-md flex-col items-center px-5 pb-20 pt-6 sm:pt-14">
        {subtitleSlot}
        {children}
      </main>
    </div>
  );
}
