'use client';
import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/GlassCard';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Avatar } from '@/components/Avatar';
import { AdminAPI } from '@/lib/api';
import { User } from '@/types';
import { useToast } from '@/components/Toast';
import { formatMoney } from '@/lib/utils';
import { IconSearch, IconBan, IconCheck } from '@/components/icons';

export default function AdminUsersPage() {
  const { push } = useToast();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBalance, setEditingBalance] = useState<Record<string, string>>({});

  const load = async (search?: string) => {
    setLoading(true);
    try {
      const res = (await AdminAPI.usersList(search ? { search } : undefined)) as User[];
      setUsers(res ?? []);
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
      if (u.isBanned) await AdminAPI.unbanUser(u.id);
      else await AdminAPI.banUser(u.id);
      setUsers((arr) => arr.map((x) => (x.id === u.id ? { ...x, isBanned: !x.isBanned } : x)));
      push(u.isBanned ? 'User unbanned' : 'User banned', 'success');
    } catch {
      push('Action failed', 'error');
    }
  };

  const setBalance = async (u: User) => {
    const val = Number(editingBalance[u.id]);
    if (Number.isNaN(val)) return;
    try {
      await AdminAPI.setBalance({ userId: u.id, balance: val });
      setUsers((arr) => arr.map((x) => (x.id === u.id ? { ...x, balance: val } : x)));
      push('Balance updated', 'success');
    } catch {
      push('Could not update balance', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-gold-100">Users</h1>
        <form onSubmit={onSearch} className="w-72">
          <Input icon={<IconSearch className="h-4 w-4" />} placeholder="Search by email or ID" value={query} onChange={(e) => setQuery(e.target.value)} />
        </form>
      </div>

      <GlassCard className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wide text-gold-200/40">
              <th className="px-5 py-3">User</th>
              <th className="px-5 py-3">Balance</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Set balance</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-6 text-gold-100/40">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-6 text-gold-100/40">No users found</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-white/5">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={`${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()} email={u.email} src={u.avatar} size={32} />
                      <div>
                        <p className="text-gold-100">{u.firstName || u.email}</p>
                        <p className="text-xs text-gold-100/40">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gold-200">{formatMoney(u.balance)}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wide ${u.isBanned ? 'bg-ruby-500/15 text-ruby-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                      {u.isBanned ? 'Banned' : 'Active'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <input
                        className="w-24 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-gold-100 outline-none"
                        placeholder={String(u.balance)}
                        value={editingBalance[u.id] ?? ''}
                        onChange={(e) => setEditingBalance((m) => ({ ...m, [u.id]: e.target.value }))}
                      />
                      <button onClick={() => setBalance(u)} className="text-emerald-400 hover:text-emerald-300"><IconCheck className="h-4 w-4" /></button>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button size="sm" variant={u.isBanned ? 'secondary' : 'danger'} icon={<IconBan className="h-3.5 w-3.5" />} onClick={() => toggleBan(u)}>
                      {u.isBanned ? 'Unban' : 'Ban'}
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
