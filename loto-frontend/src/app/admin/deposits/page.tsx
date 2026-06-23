'use client';
import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/Button';
import { AdminAPI } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { formatMoney } from '@/lib/utils';

interface DepositRow {
  id: string;
  userId: string;
  userEmail?: string;
  email?: string;
  amount: number;
  currency: string;
  paymentMethod: 'bank' | 'crypto';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedAt?: string;
  rejectionReason?: string;
}

interface DepositHistoryResponse {
  deposits: DepositRow[];
}

export default function AdminDepositsPage() {
  const { push } = useToast();
  const [rows, setRows] = useState<DepositRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    AdminAPI.depositsHistory()
      .then((res) => setRows(Array.isArray((res as DepositHistoryResponse)?.deposits) ? (res as DepositHistoryResponse).deposits : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (depositId: string) => {
    setBusyId(depositId);
    try {
      await AdminAPI.approveDeposit(depositId);
      push('Deposit approved', 'success');
      await Promise.resolve(load());
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      push(Array.isArray(msg) ? msg.join(', ') : msg || 'Could not approve deposit', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (depositId: string) => {
    const reason = window.prompt('Rejection reason', 'Payment proof is invalid')?.trim();
    if (!reason) return;

    setBusyId(depositId);
    try {
      await AdminAPI.rejectDeposit(depositId, reason);
      push('Deposit rejected', 'success');
      await Promise.resolve(load());
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      push(Array.isArray(msg) ? msg.join(', ') : msg || 'Could not reject deposit', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-bold text-gold-100">Deposits</h1>
      <GlassCard className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wide text-gold-200/40">
              <th className="px-5 py-3">User</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Method</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Details</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-5 py-6 text-gold-100/40">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-6 text-gold-100/40">No deposits found</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-white/5 align-top">
                  <td className="px-5 py-3 text-gold-100">
                    <div>{r.userEmail ?? r.email ?? '—'}</div>
                    <div className="text-[11px] text-gold-100/30">{r.userId}</div>
                  </td>
                  <td className="px-5 py-3 text-gold-200">{formatMoney(r.amount, r.currency)}</td>
                  <td className="px-5 py-3 uppercase text-xs text-gold-100/60">{r.paymentMethod}</td>
                  <td className="px-5 py-3 text-gold-100/40">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <StatusPill status={r.status} />
                  </td>
                  <td className="px-5 py-3 text-xs text-gold-100/55">
                    {r.approvedAt && <div>Approved: {new Date(r.approvedAt).toLocaleString()}</div>}
                    {r.rejectionReason && <div className="text-ruby-300">{r.rejectionReason}</div>}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {r.status === 'pending' ? (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" loading={busyId === r.id} onClick={() => approve(r.id)}>Approve</Button>
                        <Button size="sm" variant="danger" loading={busyId === r.id} onClick={() => reject(r.id)}>Reject</Button>
                      </div>
                    ) : (
                      <span className="text-xs text-gold-100/35">Completed</span>
                    )}
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

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-gold-500/15 text-gold-300',
    approved: 'bg-emerald-500/15 text-emerald-400',
    rejected: 'bg-ruby-500/15 text-ruby-400',
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wide ${map[status] ?? map.pending}`}>{status}</span>;
}
