'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { Logo } from '@/components/Logo';
import { useAuthStore } from '@/lib/auth-store';
import {
  IconShield,
  IconUsers,
  IconDeposit,
  IconWithdraw,
  IconHistory,
  IconLogout,
  IconHome,
  IconPlus,
} from '@/components/icons';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin', label: 'Overview', icon: IconShield, exact: true },
  { href: '/admin/users', label: 'Users', icon: IconUsers },
  { href: '/admin/deposits', label: 'Deposits', icon: IconDeposit },
  { href: '/admin/withdraws', label: 'Withdraws', icon: IconWithdraw },
  { href: '/admin/admins', label: 'Admins', icon: IconPlus },
  { href: '/admin/logs', label: 'Telegram logs', icon: IconHistory },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAdmin>
      <AdminShell>{children}</AdminShell>
    </AuthGuard>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-felt bg-radial-fade text-gold-50">
      <div className="mx-auto flex max-w-[1440px]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-ruby-500/15 bg-bg-soft/60 backdrop-blur-xl lg:block">
          <div className="px-5 py-6">
            <Logo />
            <span className="mt-2 inline-block rounded-full bg-ruby-500/15 px-2.5 py-0.5 text-[10px] uppercase tracking-widest text-ruby-400">Admin</span>
          </div>
          <nav className="space-y-1 px-3">
            {NAV.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors',
                    active ? 'bg-ruby-500/15 text-ruby-300' : 'text-gold-100/60 hover:bg-white/5',
                  )}
                >
                  <Icon className="h-4.5 w-4.5" />
                  {item.label}
                </Link>
              );
            })}
            <Link href="/dashboard" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-gold-100/50 hover:bg-white/5">
              <IconHome className="h-4.5 w-4.5" /> Back to app
            </Link>
          </nav>
          <div className="absolute bottom-4 w-64 px-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-gold-100/50 hover:bg-white/5 hover:text-ruby-400"
            >
              <IconLogout className="h-4.5 w-4.5" /> Log out
            </button>
          </div>
        </aside>

        <main className="min-h-screen flex-1 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
          <div className="mb-5 space-y-3 lg:hidden">
            <div className="rounded-2xl border border-white/10 bg-bg-soft/70 p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Logo />
                  <span className="mt-2 inline-block rounded-full bg-ruby-500/15 px-2.5 py-0.5 text-[10px] uppercase tracking-widest text-ruby-400">Admin</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="/dashboard" className="rounded-xl border border-white/10 px-3 py-2 text-xs text-gold-100/70">
                    Back to app
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="rounded-xl border border-ruby-500/25 bg-ruby-500/10 px-3 py-2 text-xs text-ruby-300"
                  >
                    Log out
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {NAV.map((item) => {
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors',
                      active
                        ? 'border-ruby-500/30 bg-ruby-500/15 text-ruby-300'
                        : 'border-white/10 bg-white/5 text-gold-100/65',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
