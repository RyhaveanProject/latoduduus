'use client';
import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/GlassCard';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Avatar } from '@/components/Avatar';
import { AdminAPI } from '@/lib/api';
import { AdminUserListResponse, User } from '@/types';
import { useToast } from '@/components/Toast';
import { formatMoney } from '@/lib/utils';
import { IconSearch, IconBan, IconDeposit, IconWithdraw, IconHistory } from '@/components/icons';

export default function AdminUsersPage() {
  const { push } = useToast();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBalance, setEditingBalance] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async (search?: string) => {
    setLoading(true);
    try {
      const res = (await AdminAPI.usersList(search ? { search } : undefined)) as AdminUserListResponse;
      setUsers(Array.isArray(res?.users) ? res.users : []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(query);
  };

  const toggleBan = async (u: User) => {
    setBusyId(u.id);
    try {
      if (u.isBanned) {
        await AdminAPI.unbanUser(u.id);
      } else {
        const reason = window.prompt('Block reason', u.bannedReason || 'Blocked by admin') || 'Blocked by admin';
        await AdminAPI.banUser(u.id, reason);
      }
      setUsers((arr) =>
        arr.map((x) =>
          x.id === u.id
            ? { ...x, isBanned: !x.isBanned, bannedReason: u.isBanned ? undefined : (x.bannedReason || 'Blocked by admin') }
            : x,
        ),
      );
      push(u.isBanned ? 'User unblocked' : 'User blocked', 'success');
    } catch {
      push('Action failed', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const updateBalance = async (u: User, operation: 'set' | 'increase' | 'decrease') => {
    const val = Number(editingBalance[u.id]);
    if (Number.isNaN(val) || val < 0) {
      push('Enter valid amount', 'error');
      return;
    }

    setBusyId(`${u.id}:${operation}`);
    try {
      const res = (await AdminAPI.setBalance({
        userId: u.id,
        amount: val,
        operation,
        reason: `Admin ${operation} balance`,
      })) as { balanceAfter?: number };

      const nextBalance = typeof res?.balanceAfter === 'number'
        ? res.balanceAfter
        : operation === 'set'
          ? val
          : operation === 'increase'
            ? (u.balance || 0) + val
            : (u.balance || 0) - val;

      setUsers((arr) => arr.map((x) => (x.id === u.id ? { ...x, balance: nextBalance } : x)));
      setEditingBalance((prev) => ({ ...prev, [u.id]: '' }));
      push('Balance updated', 'success');
    } catch {
      push('Could not update balance', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-gold-100">Users</h1>
          <p className="text-sm text-gold-100/45">Balans artır, azald, dondur və istifadəçi statusuna nəzarət et.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <form onSubmit={onSearch} className="w-full sm:w-80">
            <Input
              icon={<IconSearch className="h-4 w-4" />}
              placeholder="Search by email, name or ID"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>
          <Button variant="secondary" icon={<IconHistory className="h-4 w-4" />} onClick={() => load(query || undefined)}>
            Refresh
          </Button>
        </div>
      </div>

      <GlassCard className="overflow-x-auto">
        <table className="w-full min-w-[1180px] text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wide text-gold-200/40">
              <th className="px-5 py-3">User</th>
              <th className="px-5 py-3">Balance</th>
              <th className="px-5 py-3">Deposited</th>
              <th className="px-5 py-3">Withdrawn</th>
              <th className="px-5 py-3">Stats</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Balance controls</th>
              <th className="px-5 py-3 text-right">Account action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-5 py-6 text-gold-100/40">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={8} className="px-5 py-6 text-gold-100/40">No users found</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-white/5 align-top">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={`${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()} email={u.email} src={u.avatar} size={32} />
                      <div>
                        <p className="text-gold-100">{u.firstName || u.lastName ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() : u.email}</p>
                        <p className="text-xs text-gold-100/40">{u.email}</p>
                        <p className="text-[11px] text-gold-100/30">{u.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gold-200">{formatMoney(u.balance)}</td>
                  <td className="px-5 py-3 text-gold-100/70">{formatMoney(u.totalDeposited ?? 0)}</td>
                  <td className="px-5 py-3 text-gold-100/70">{formatMoney(u.totalWithdrawn ?? 0)}</td>
                  <td className="px-5 py-3 text-xs text-gold-100/55">
                    <div>Played: {u.gamesPlayed ?? 0}</div>
                    <div>Won: {u.gamesWon ?? 0}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wide ${u.isBanned ? 'bg-ruby-500/15 text-ruby-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                      {u.isBanned ? 'Blocked' : 'Active'}
                    </span>
                    {u.isBanned && u.bannedReason && (
                      <p className="mt-1 max-w-[220px] text-[11px] text-ruby-300/70">{u.bannedReason}</p>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="space-y-2">
                      <input
                        className="w-28 rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs text-gold-100 outline-none"
                        placeholder="Amount"
                        value={editingBalance[u.id] ?? ''}
                        onChange={(e) => setEditingBalance((m) => ({ ...m, [u.id]: e.target.value }))}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" loading={busyId === `${u.id}:set`} onClick={() => updateBalance(u, 'set')}>
                          Set balance
                        </Button>
                        <Button size="sm" loading={busyId === `${u.id}:increase`} icon={<IconDeposit className="h-3.5 w-3.5" />} onClick={() => updateBalance(u, 'increase')}>
                          Increase
                        </Button>
                        <Button size="sm" variant="danger" loading={busyId === `${u.id}:decrease`} icon={<IconWithdraw className="h-3.5 w-3.5" />} onClick={() => updateBalance(u, 'decrease')}>
                          Decrease
                        </Button>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button
                      size="sm"
                      variant={u.isBanned ? 'secondary' : 'danger'}
                      loading={busyId === u.id}
                      icon={<IconBan className="h-3.5 w-3.5" />}
                      onClick={() => toggleBan(u)}
                    >
                      {u.isBanned ? 'Unblock user' : 'Block user'}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
