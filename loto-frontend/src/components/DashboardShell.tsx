'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/lib/auth-store';
import { Logo } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Avatar } from './Avatar';
import { formatMoney } from '@/lib/utils';
import {
  IconHome, IconUser, IconDeposit, IconWithdraw, IconHistory, IconSettings, IconLogout, IconShield, IconClose,
} from './icons';
import { cn } from '@/lib/utils';
import { getLocaleMeta } from '@/lib/locale-config';

const NAV = [
  { href: '/dashboard', key: 'nav.home', icon: IconHome },
  { href: '/dashboard/profile', key: 'nav.profile', icon: IconUser },
  { href: '/dashboard/deposit', key: 'nav.deposit', icon: IconDeposit },
  { href: '/dashboard/withdraw', key: 'nav.withdraw', icon: IconWithdraw },
  { href: '/dashboard/history', key: 'nav.history', icon: IconHistory },
  { href: '/dashboard/settings', key: 'nav.settings', icon: IconSettings },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const currency = getLocaleMeta(locale).currency;

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="px-5 py-6">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors',
                active ? 'bg-gold-500/15 text-gold-200 shadow-[inset_0_0_0_1px_rgba(217,165,54,0.35)]' : 'text-gold-100/60 hover:bg-white/5 hover:text-gold-100'
              )}
            >
              <Icon className="h-4.5 w-4.5" />
              {t(item.key)}
            </Link>
          );
        })}
        {(user?.role === 'admin' || user?.role === 'superadmin') && (
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-ruby-400/80 hover:bg-white/5 hover:text-ruby-300"
          >
            <IconShield className="h-4.5 w-4.5" />
            {t('nav.admin')}
          </Link>
        )}
      </nav>
      <div className="border-t border-white/5 p-4">
        <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-gold-100/50 hover:bg-white/5 hover:text-ruby-400">
          <IconLogout className="h-4.5 w-4.5" />
          {t('common.logout')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-felt bg-radial-fade text-gold-50">
      <div className="mx-auto flex max-w-[1440px]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-white/5 bg-bg-soft/60 backdrop-blur-xl lg:block">
          {SidebarContent}
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-72 bg-bg-soft shadow-glass animate-fade-up">
              <button className="absolute right-3 top-3 text-gold-200/60" onClick={() => setMobileOpen(false)}>
                <IconClose className="h-5 w-5" />
              </button>
              {SidebarContent}
            </div>
          </div>
        )}

        <div className="min-h-screen flex-1">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/5 bg-bg/70 px-4 py-3 backdrop-blur-xl sm:px-6">
            <button className="text-gold-200 lg:hidden" onClick={() => setMobileOpen(true)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="hidden text-sm text-gold-100/50 lg:block">{t('home.welcome')}, {user?.firstName || user?.email}</div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-xl border border-gold-500/20 bg-gold-500/5 px-3.5 py-2 sm:flex">
                <span className="text-xs text-gold-200/60">{t('common.balance')}</span>
                <span className="font-semibold text-gold-300">{formatMoney(user?.balance ?? 0, currency)}</span>
              </div>
              <LanguageSwitcher compact />
              <Link href="/dashboard/profile">
                <Avatar name={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()} email={user?.email} src={user?.avatar} size={36} />
              </Link>
            </div>
          </header>
          <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
