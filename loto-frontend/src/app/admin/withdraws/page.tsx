'use client';
import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/GlassCard';
import { AdminAPI } from '@/lib/api';
import { formatMoney } from '@/lib/utils';

interface WithdrawRow {
  id: string;
  userEmail?: string;
  amount: number;
  currency: string;
  method: 'bank' | 'crypto';
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export default function AdminWithdrawsPage() {
  const [rows, setRows] = useState<WithdrawRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AdminAPI.withdrawsHistory()
      .then((res) => setRows((res as WithdrawRow[]) ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-bold text-gold-100">Withdraws</h1>
      <GlassCard className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wide text-gold-200/40">
              <th className="px-5 py-3">User</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Method</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-6 text-gold-100/40">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-6 text-gold-100/40">No withdraws found</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-white/5">
                  <td className="px-5 py-3 text-gold-100">{r.userEmail ?? r.id.slice(-6)}</td>
                  <td className="px-5 py-3 text-gold-200">{formatMoney(r.amount, r.currency)}</td>
                  <td className="px-5 py-3 uppercase text-xs text-gold-100/60">{r.method}</td>
                  <td className="px-5 py-3 text-gold-100/40">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <StatusPill status={r.status} />
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
    accepted: 'bg-emerald-500/15 text-emerald-400',
    rejected: 'bg-ruby-500/15 text-ruby-400',
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wide ${map[status] ?? map.pending}`}>{status}</span>;
}
