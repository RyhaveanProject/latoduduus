'use client';
import React, { Suspense } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { DashboardShell } from '@/components/DashboardShell';
import { IconSpinner } from '@/components/icons';

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg text-gold-300">
      <IconSpinner className="h-7 w-7" />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DashboardShell>
        <Suspense fallback={<LoadingFallback />}>
          {children}
        </Suspense>
      </DashboardShell>
    </AuthGuard>
  );
}
