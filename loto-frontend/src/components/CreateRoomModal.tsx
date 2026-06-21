'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import { useI18n } from '@/lib/i18n';
import { RoomsAPI } from '@/lib/api';
import { useToast } from './Toast';
import { Room } from '@/types';

export function CreateRoomModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const router = useRouter();
  const { push } = useToast();
  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [entryFee, setEntryFee] = useState('5');
  const [maxPlayers, setMaxPlayers] = useState('8');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const room = (await RoomsAPI.create({
        name,
        visibility,
        entryFee: Number(entryFee),
        maxPlayers: Number(maxPlayers),
      })) as Room;
      push('Room created', 'success');
      router.push(`/dashboard/game?roomId=${room.id}`);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      push(msg || 'Failed to create room', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={t('game.createRoom')} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Input label={t('home.createRoom')} required value={name} onChange={(e) => setName(e.target.value)} placeholder="Golden Hall" />
        <div className="grid grid-cols-2 gap-3">
          <Input label={t('game.entryFee')} type="number" min={0} required value={entryFee} onChange={(e) => setEntryFee(e.target.value)} />
          <Input label={t('game.maxPlayers')} type="number" min={2} max={50} required value={maxPlayers} onChange={(e) => setMaxPlayers(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setVisibility('public')} className={`flex-1 rounded-xl border px-3 py-2 text-sm transition-colors ${visibility === 'public' ? 'border-gold-500/60 bg-gold-500/10 text-gold-200' : 'border-white/10 text-gold-100/50'}`}>
            {t('game.public')}
          </button>
          <button type="button" onClick={() => setVisibility('private')} className={`flex-1 rounded-xl border px-3 py-2 text-sm transition-colors ${visibility === 'private' ? 'border-gold-500/60 bg-gold-500/10 text-gold-200' : 'border-white/10 text-gold-100/50'}`}>
            {t('game.private')}
          </button>
        </div>
        <Button type="submit" className="w-full" size="lg" loading={loading}>{t('game.createRoom')}</Button>
      </form>
    </Modal>
  );
}
