'use client';
import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/Button';
import { AdminAPI } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { formatMoney } from '@/lib/utils';
import { IconHistory } from '@/components/icons';

interface WithdrawRow {
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
  cardNumber?: string;
  walletAddress?: string;
}

interface WithdrawHistoryResponse {
  withdraws: WithdrawRow[];
}

export default function AdminWithdrawsPage() {
  const { push } = useToast();
  const [rows, setRows] = useState<WithdrawRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = (await AdminAPI.withdrawsHistory()) as WithdrawHistoryResponse;
      setRows(Array.isArray(res?.withdraws) ? res.withdraws : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (withdrawId: string) => {
    setBusyId(withdrawId);
    try {
      await AdminAPI.approveWithdraw(withdrawId);
      push('Withdraw approved', 'success');
      await load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      push(Array.isArray(msg) ? msg.join(', ') : msg || 'Could not approve withdraw', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (withdrawId: string) => {
    const reason = window.prompt('Rejection reason', 'Withdrawal details are invalid')?.trim();
    if (!reason) return;

    setBusyId(withdrawId);
    try {
      await AdminAPI.rejectWithdraw(withdrawId, reason);
      push('Withdraw rejected', 'success');
      await load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      push(Array.isArray(msg) ? msg.join(', ') : msg || 'Could not reject withdraw', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-gold-100">Withdraws</h1>
          <p className="text-sm text-gold-100/45">Çıxarış sorğularını kart və ya cüzdan məlumatı ilə birlikdə idarə et.</p>
        </div>
        <Button variant="secondary" icon={<IconHistory className="h-4 w-4" />} onClick={load}>
          Refresh list
        </Button>
      </div>

      <GlassCard className="overflow-x-auto">
        <table className="w-full min-w-[1020px] text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wide text-gold-200/40">
              <th className="px-5 py-3">User</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Method</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Payout details</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-5 py-6 text-gold-100/40">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-6 text-gold-100/40">No withdraws found</td></tr>
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
                    {r.cardNumber && <div>Card: {r.cardNumber}</div>}
                    {r.walletAddress && <div>Wallet: {r.walletAddress}</div>}
                    {r.approvedAt && <div className="mt-1">Approved: {new Date(r.approvedAt).toLocaleString()}</div>}
                    {r.rejectionReason && <div className="mt-1 text-ruby-300">{r.rejectionReason}</div>}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {r.status === 'pending' ? (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" loading={busyId === r.id} onClick={() => approve(r.id)}>Approve withdraw</Button>
                        <Button size="sm" variant="danger" loading={busyId === r.id} onClick={() => reject(r.id)}>Reject withdraw</Button>
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
