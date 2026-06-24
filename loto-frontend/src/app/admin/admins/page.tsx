'use client';
import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/GlassCard';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { AdminAPI } from '@/lib/api';
import { AdminListItem, AdminListResponse } from '@/types';
import { useToast } from '@/components/Toast';
import { IconPlus, IconShield, IconHistory } from '@/components/icons';

const DEFAULT_PERMISSIONS = ['view_users', 'manage_users', 'manage_deposits', 'manage_withdraws'];

export default function AdminAdminsPage() {
  const { push } = useToast();
  const [admins, setAdmins] = useState<AdminListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const res = (await AdminAPI.adminsList()) as AdminListResponse;
      setAdmins(Array.isArray(res?.admins) ? res.admins : []);
    } catch {
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await AdminAPI.createAdmin({
        ...form,
        permissions: DEFAULT_PERMISSIONS,
        isSuperAdmin: false,
      });
      push('Admin created', 'success');
      setForm({ email: '', password: '', firstName: '', lastName: '' });
      await loadAdmins();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      push(Array.isArray(msg) ? msg.join(', ') : msg || 'Could not create admin', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAdminStatus = async (admin: AdminListItem) => {
    setBusyId(admin.id);
    try {
      const updated = (await AdminAPI.updateAdmin(admin.id, { isActive: !admin.isActive })) as AdminListItem;
      setAdmins((list) => list.map((item) => (item.id === admin.id ? { ...item, isActive: updated.isActive } : item)));
      push(updated.isActive ? 'Admin activated' : 'Admin disabled', 'success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      push(Array.isArray(msg) ? msg.join(', ') : msg || 'Could not update admin', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-gold-100">Admins</h1>
          <p className="text-sm text-gold-100/45">Yeni admin yarat və mövcud admin hesablarını aktiv/passiv et.</p>
        </div>
        <Button variant="secondary" icon={<IconHistory className="h-4 w-4" />} onClick={loadAdmins}>
          Refresh list
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">
        <GlassCard className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ruby-500/10 text-ruby-400">
              <IconPlus className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-lg text-gold-100">Create admin login</p>
              <p className="text-xs text-gold-100/45">New admin will be able to sign in immediately.</p>
            </div>
          </div>

          <form onSubmit={createAdmin} className="space-y-4">
            <Input label="First name" value={form.firstName} onChange={(e) => setForm((s) => ({ ...s, firstName: e.target.value }))} />
            <Input label="Last name" value={form.lastName} onChange={(e) => setForm((s) => ({ ...s, lastName: e.target.value }))} />
            <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
            <Input label="Password" type="password" required value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} />
            <Button type="submit" className="w-full" loading={submitting}>Create admin</Button>
          </form>
        </GlassCard>

        <GlassCard className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wide text-gold-200/40">
                <th className="px-5 py-3">Admin</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Permissions</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-6 text-gold-100/40">Loading...</td></tr>
              ) : admins.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-6 text-gold-100/40">No admins found</td></tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="border-b border-white/5 align-top">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ruby-500/10 text-ruby-300">
                          <IconShield className="h-4.5 w-4.5" />
                        </span>
                        <div>
                          <p className="text-gold-100">{admin.firstName || admin.lastName ? `${admin.firstName ?? ''} ${admin.lastName ?? ''}`.trim() : admin.email}</p>
                          <p className="text-xs text-gold-100/40">{admin.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gold-100/70">{admin.isSuperAdmin ? 'Super admin' : 'Admin'}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wide ${admin.isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-ruby-500/15 text-ruby-400'}`}>
                        {admin.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gold-100/55">{admin.permissions.join(', ') || '—'}</td>
                    <td className="px-5 py-3 text-gold-100/40">{admin.createdAt ? new Date(admin.createdAt).toLocaleString() : '—'}</td>
                    <td className="px-5 py-3 text-right">
                      {!admin.isSuperAdmin ? (
                        <Button
                          size="sm"
                          variant={admin.isActive ? 'danger' : 'secondary'}
                          loading={busyId === admin.id}
                          onClick={() => toggleAdminStatus(admin)}
                        >
                          {admin.isActive ? 'Disable admin' : 'Activate admin'}
                        </Button>
                      ) : (
                        <span className="text-xs text-gold-100/35">Protected</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </GlassCard>
      </div>
    </div>
  );
}
