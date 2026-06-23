'use client';
import React, { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-felt bg-radial-fade px-4 text-gold-50">
      <div className="glass max-w-md rounded-2xl p-8 text-center shadow-glass">
        <h2 className="font-display mb-3 text-xl font-bold text-ruby-400">
          Xəta baş verdi
        </h2>
        <p className="mb-6 text-sm text-gold-100/60">
          {error?.message || 'Gözlənilməz xəta. Zəhmət olmasa yenidən cəhd edin.'}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="rounded-xl bg-gold-500/20 px-5 py-2.5 text-sm font-medium text-gold-300 hover:bg-gold-500/30 transition-colors"
          >
            Yenidən cəhd et
          </button>
          <button
            onClick={() => { window.location.href = '/login'; }}
            className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-gold-100/60 hover:bg-white/5 transition-colors"
          >
            Giriş səhifəsinə qayıt
          </button>
        </div>
      </div>
    </div>
  );
}
