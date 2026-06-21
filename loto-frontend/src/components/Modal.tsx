'use client';
import React from 'react';
import { IconClose } from './icons';
import { GlassCard } from './GlassCard';

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <GlassCard className="relative z-10 w-full max-w-md animate-pop p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-gold-100">{title}</h3>
          <button onClick={onClose} className="text-gold-200/50 hover:text-gold-100"><IconClose className="h-4.5 w-4.5" /></button>
        </div>
        {children}
      </GlassCard>
    </div>
  );
}
