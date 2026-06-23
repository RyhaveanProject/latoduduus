'use client';
import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ background: '#0a0a0f', color: '#f5e6c8', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', padding: '20px', textAlign: 'center' }}>
          <h2 style={{ color: '#e05252', fontSize: '20px', fontWeight: 'bold' }}>Kritik xəta</h2>
          <p style={{ color: '#f5e6c8aa', fontSize: '14px', maxWidth: '400px' }}>
            {error?.message || 'Tətbiq xətası baş verdi.'}
          </p>
          <button
            onClick={reset}
            style={{ background: '#d9a536', color: '#0a0a0f', border: 'none', borderRadius: '12px', padding: '10px 24px', cursor: 'pointer', fontWeight: '600' }}
          >
            Yenidən yüklə
          </button>
          <a href="/login" style={{ color: '#d9a536aa', fontSize: '12px' }}>
            Giriş səhifəsinə qayıt
          </a>
        </div>
      </body>
    </html>
  );
}
