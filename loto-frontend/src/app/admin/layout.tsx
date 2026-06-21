'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';
import { Logo } from '@/components/Logo';
import { useAuthStore } from '@/lib/auth-store';
import { IconShield, IconUsers, IconDeposit, IconWithdraw, IconHistory, IconLogout, IconHome } from '@/components/icons';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin', label: 'Overview', icon: IconShield, exact: true },
  { href: '/admin/users', label: 'Users', icon: IconUsers },
  { href: '/admin/deposits', label: 'Deposits', icon: IconDeposit },
  { href: '/admin/withdraws', label: 'Withdraws', icon: IconWithdraw },
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
                <Link key={item.href} href={item.href} className={cn('flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors', active ? 'bg-ruby-500/15 text-ruby-300' : 'text-gold-100/60 hover:bg-white/5')}>
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
            <button onClick={() => { logout(); router.push('/login'); }} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-gold-100/50 hover:bg-white/5 hover:text-ruby-400">
              <IconLogout className="h-4.5 w-4.5" /> Log out
            </button>
          </div>
        </aside>
        <main className="min-h-screen flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
