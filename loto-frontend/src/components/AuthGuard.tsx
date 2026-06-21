'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { IconSpinner } from './icons';

export function AuthGuard({ children, requireAdmin }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { user, hydrated, hydrate } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (hydrated && !user) router.replace('/login');
    if (hydrated && user && requireAdmin && user.role === 'user') router.replace('/dashboard');
  }, [hydrated, user, requireAdmin, router]);

  if (!hydrated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-gold-300">
        <IconSpinner className="h-7 w-7" />
      </div>
    );
  }

  return <>{children}</>;
}
