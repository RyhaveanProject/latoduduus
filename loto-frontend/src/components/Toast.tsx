'use client';
import React, { createContext, useCallback, useContext, useState } from 'react';
import { IconCheck, IconAlert, IconClose } from './icons';
import { cn } from '@/lib/utils';

interface Toast { id: number; message: string; type: 'success' | 'error' | 'info' }
interface ToastContextValue { push: (message: string, type?: Toast['type']) => void }

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex w-[min(360px,90vw)] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'glass animate-fade-up flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm shadow-glass',
              t.type === 'success' && 'border-emerald-500/40',
              t.type === 'error' && 'border-ruby-500/40'
            )}
          >
            {t.type === 'success' && <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />}
            {t.type === 'error' && <IconAlert className="mt-0.5 h-4 w-4 shrink-0 text-ruby-400" />}
            {t.type === 'info' && <IconAlert className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />}
            <span className="text-gold-50/90">{t.message}</span>
            <button onClick={() => setToasts((arr) => arr.filter((x) => x.id !== t.id))} className="ml-auto text-gold-200/50 hover:text-gold-100">
              <IconClose className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
