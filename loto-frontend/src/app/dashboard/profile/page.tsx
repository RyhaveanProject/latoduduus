'use client';
import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/GlassCard';
import { Avatar } from '@/components/Avatar';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/lib/auth-store';
import { getLocaleMeta } from '@/lib/locale-config';
import { formatMoney } from '@/lib/utils';
import { UsersAPI } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { IconLock, IconCheck } from '@/components/icons';

export default function ProfilePage() {
  const { t, locale } = useI18n();
  const { user, setUser } = useAuthStore();
  const { push } = useToast();
  const currency = getLocaleMeta(locale).currency;

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    UsersAPI.transactions()
      .then((res) => setTransactions((res as any[]) ?? []))
      .catch(() => {});
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await UsersAPI.updateProfile({ firstName, lastName });
      setUser({ ...(user as any), ...(updated as object) });
      push('Profile updated', 'success');
    } catch {
      push('Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwSaving(true);
    try {
      await UsersAPI.updateProfile({ currentPassword, newPassword });
      push('Password changed', 'success');
      setCurrentPassword('');
      setNewPassword('');
    } catch {
      push('Could not change password', 'error');
    } finally {
      setPwSaving(false);
    }
  };

  const deposits = transactions.filter((tx) => tx.type === 'deposit');
  const withdraws = transactions.filter((tx) => tx.type === 'withdraw');

  return (
    <div className="space-y-6">
      <GlassCard className="flex flex-wrap items-center gap-5 p-6">
        <Avatar name={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()} email={user?.email} src={user?.avatar} size={64} />
        <div>
          <h1 className="font-display text-xl font-bold text-gold-100">{user?.firstName || user?.email}</h1>
          <p className="text-sm text-gold-100/50">{t('profile.id')}: {user?.id}</p>
          <p className="text-sm text-gold-100/50">{t('profile.email')}: {user?.email}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-gold-200/50">{t('common.balance')}</p>
          <p className="font-display text-2xl font-bold text-gradient-gold">{formatMoney(user?.balance ?? 0, currency)}</p>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="mb-4 font-display text-base font-semibold text-gold-100">{t('profile.title')}</h2>
        <form onSubmit={saveProfile} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label={t('auth.firstName')} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <Input label={t('auth.lastName')} value={lastName} onChange={(e) => setLastName(e.target.value)} />
          <div className="sm:col-span-2">
            <Button type="submit" loading={saving}>{t('common.save')}</Button>
          </div>
        </form>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold text-gold-100">
          <IconLock className="h-4 w-4" /> {t('profile.changePassword')}
        </h2>
        <form onSubmit={changePassword} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label={t('profile.currentPassword')} type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          <Input label={t('profile.newPassword')} type="password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <div className="sm:col-span-2">
            <Button type="submit" loading={pwSaving} icon={<IconCheck className="h-4 w-4" />}>{t('common.save')}</Button>
          </div>
        </form>
      </GlassCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <h2 className="mb-4 font-display text-base font-semibold text-gold-100">{t('profile.depositHistory')}</h2>
          <TxList rows={deposits} t={t} currency={currency} />
        </GlassCard>
        <GlassCard className="p-6">
          <h2 className="mb-4 font-display text-base font-semibold text-gold-100">{t('profile.withdrawHistory')}</h2>
          <TxList rows={withdraws} t={t} currency={currency} />
        </GlassCard>
      </div>
    </div>
  );
}

function TxList({ rows, t, currency }: { rows: any[]; t: (k: string) => string; currency: string }) {
  if (!rows.length) return <p className="text-sm text-gold-100/40">—</p>;
  return (
    <div className="space-y-2.5">
      {rows.map((tx) => (
        <div key={tx.id} className="flex items-center justify-between text-sm">
          <span className="text-gold-100/60">{new Date(tx.createdAt).toLocaleDateString()}</span>
          <span className="text-gold-200">{formatMoney(tx.amount, currency)}</span>
          <StatusBadge status={tx.status} t={t} />
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status, t }: { status: string; t: (k: string) => string }) {
  const map: Record<string, string> = {
    pending: 'bg-gold-500/15 text-gold-300',
    accepted: 'bg-emerald-500/15 text-emerald-400',
    rejected: 'bg-ruby-500/15 text-ruby-400',
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wide ${map[status] ?? map.pending}`}>{t(`common.${status}`)}</span>;
}
