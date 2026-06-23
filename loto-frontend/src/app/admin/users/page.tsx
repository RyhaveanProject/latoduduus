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
import { IconSearch, IconBan, IconCheck, IconDeposit, IconWithdraw } from '@/components/icons';

export default function AdminUsersPage() {
  const { push } = useToast();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBalance, setEditingBalance] = useState<Record<string, string>>({});

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
    }
  };

  const updateBalance = async (u: User, operation: 'set' | 'increase' | 'decrease') => {
    const val = Number(editingBalance[u.id]);
    if (Number.isNaN(val) || val < 0) {
      push('Enter valid amount', 'error');
      return;
    }

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
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-xl font-bold text-gold-100">Users</h1>
        <form onSubmit={onSearch} className="w-full sm:w-80">
          <Input
            icon={<IconSearch className="h-4 w-4" />}
            placeholder="Search by email, name or ID"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
      </div>

      <GlassCard className="overflow-x-auto">
        <table className="w-full min-w-[1020px] text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wide text-gold-200/40">
              <th className="px-5 py-3">User</th>
              <th className="px-5 py-3">Balance</th>
              <th className="px-5 py-3">Deposited</th>
              <th className="px-5 py-3">Withdrawn</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Adjust balance</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-5 py-6 text-gold-100/40">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-6 text-gold-100/40">No users found</td></tr>
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
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wide ${u.isBanned ? 'bg-ruby-500/15 text-ruby-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                      {u.isBanned ? 'Blocked' : 'Active'}
                    </span>
                    {u.isBanned && u.bannedReason && (
                      <p className="mt-1 max-w-[180px] text-[11px] text-ruby-300/70">{u.bannedReason}</p>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        className="w-24 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-gold-100 outline-none"
                        placeholder="Amount"
                        value={editingBalance[u.id] ?? ''}
                        onChange={(e) => setEditingBalance((m) => ({ ...m, [u.id]: e.target.value }))}
                      />
                      <button onClick={() => updateBalance(u, 'set')} className="rounded-lg bg-white/5 px-2 py-1 text-xs text-gold-200 hover:bg-white/10">Set</button>
                      <button onClick={() => updateBalance(u, 'increase')} className="rounded-lg bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20">
                        <IconDeposit className="inline h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => updateBalance(u, 'decrease')} className="rounded-lg bg-ruby-500/10 px-2 py-1 text-xs text-ruby-300 hover:bg-ruby-500/20">
                        <IconWithdraw className="inline h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => updateBalance(u, 'set')} className="text-emerald-400 hover:text-emerald-300">
                        <IconCheck className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button
                      size="sm"
                      variant={u.isBanned ? 'secondary' : 'danger'}
                      icon={<IconBan className="h-3.5 w-3.5" />}
                      onClick={() => toggleBan(u)}
                    >
                      {u.isBanned ? 'Unblock' : 'Block'}
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
