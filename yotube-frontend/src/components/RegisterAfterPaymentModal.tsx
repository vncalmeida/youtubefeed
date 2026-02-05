import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { registerAfterPayment } from '../service/auth';

interface Props {
  email: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RegisterAfterPaymentModal({ email, open, onClose, onSuccess }: Props) {
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!company || !password) return;
    setLoading(true);
    setError('');
    try {
      await registerAfterPayment(email, company, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Falha ao registrar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <motion.form
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        >
          <h2 className="mb-4 text-xl font-semibold">Finalize seu cadastro</h2>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Nome da empresa</label>
            <input
              type="text"
              value={company}
              onChange={e => setCompany(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          {error && <div className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</div>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Registrar'}
            </button>
          </div>
        </motion.form>
      </motion.div>
    </AnimatePresence>
  );
}
