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
    if (!hydrated) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    // Admin istifadəçi dashboard-a girmək istəyirsə → admin panelə yönləndir
    if (!requireAdmin && (user.role === 'admin' || user.role === 'superadmin')) {
      router.replace('/admin');
      return;
    }

    // Adi istifadəçi admin panelə girmək istəyirsə → dashboard-a yönləndir
    if (requireAdmin && user.role === 'user') {
      router.replace('/dashboard');
      return;
    }
  }, [hydrated, user, requireAdmin, router]);

  if (!hydrated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-gold-300">
        <IconSpinner className="h-7 w-7" />
      </div>
    );
  }

  // Admin dashboard-da olmamalı
  if (!requireAdmin && (user.role === 'admin' || user.role === 'superadmin')) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-gold-300">
        <IconSpinner className="h-7 w-7" />
      </div>
    );
  }

  // Adi user admin paneldə olmamalı
  if (requireAdmin && user.role === 'user') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-gold-300">
        <IconSpinner className="h-7 w-7" />
      </div>
    );
  }

  return <>{children}</>;
}
