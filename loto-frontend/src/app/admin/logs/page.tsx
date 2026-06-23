'use client';
import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/GlassCard';
import { AdminAPI } from '@/lib/api';

interface LogRow {
  id: string;
  event: string;
  message: string;
  status?: string;
  relatedUserId?: string;
  amount?: number;
  createdAt: string;
}

interface LogsResponse {
  logs: LogRow[];
}

export default function AdminLogsPage() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AdminAPI.telegramLogs()
      .then((res) => setRows(Array.isArray((res as LogsResponse)?.logs) ? (res as LogsResponse).logs : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-bold text-gold-100">Telegram logs</h1>
      <GlassCard className="divide-y divide-white/5">
        {loading ? (
          <div className="p-6 text-sm text-gold-100/40">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-sm text-gold-100/40">No logs found</div>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="px-5 py-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gold-200/40">
                <span className="uppercase tracking-wide text-gold-300">{r.event}</span>
                <span>{new Date(r.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-1 text-sm text-gold-100/75">{r.message}</p>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-gold-100/35">
                {r.relatedUserId && <span>User: {r.relatedUserId}</span>}
                {typeof r.amount === 'number' && <span>Amount: {r.amount}</span>}
                {r.status && <span>Status: {r.status}</span>}
              </div>
            </div>
          ))
        )}
      </GlassCard>
    </div>
  );
}
