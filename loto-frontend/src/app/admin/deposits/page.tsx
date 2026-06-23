'use client';
import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/GlassCard';
import { AdminAPI } from '@/lib/api';
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
  const [rows, setRows] = useState<DepositRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AdminAPI.depositsHistory()
      .then((res) => setRows(Array.isArray((res as DepositHistoryResponse)?.deposits) ? (res as DepositHistoryResponse).deposits : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

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
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-6 text-gold-100/40">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-6 text-gold-100/40">No deposits found</td></tr>
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
