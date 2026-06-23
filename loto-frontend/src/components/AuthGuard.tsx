'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { IconSpinner } from './icons';

export function AuthGuard({ children, requireAdmin }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { user, hydrated, hydrate } = useAuthStore();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (!hydrated) return;

    if (!user) {
      setRedirecting(true);
      router.replace('/login');
      return;
    }

    const isAdmin = user.role === 'admin' || user.role === 'superadmin';

    if (!requireAdmin && isAdmin) {
      // Admin user in dashboard → send to admin panel
      setRedirecting(true);
      router.replace('/admin');
      return;
    }

    if (requireAdmin && !isAdmin) {
      // Normal user in admin panel → send to dashboard
      setRedirecting(true);
      router.replace('/dashboard');
      return;
    }
  }, [hydrated, user, requireAdmin, router]);

  // Show spinner while loading or redirecting
  if (!hydrated || !user || redirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-gold-300">
        <IconSpinner className="h-7 w-7" />
      </div>
    );
  }

  const isAdmin = user.role === 'admin' || user.role === 'superadmin';

  // Don't render dashboard content for admins, or admin content for users
  if (!requireAdmin && isAdmin) return null;
  if (requireAdmin && !isAdmin) return null;

  return <>{children}</>;
}
