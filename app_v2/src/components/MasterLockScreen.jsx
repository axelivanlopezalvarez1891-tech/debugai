import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, ChevronRight, Loader2, AlertCircle } from 'lucide-react';

const MasterLockScreen = ({ onUnlock }) => {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!key) return;

    setLoading(true);
    setError('');

    try {
      const resp = await fetch('/api/admin/make-me-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: key, user: 'Axel' })
      });

      const data = await resp.json();
      if (data.ok) {
        onUnlock();
      } else {
        setError(data.msg || 'Acceso denegado. Llave incorrecta.');
      }
    } catch (err) {
      setError('Error de conexión con el servidor maestro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#030303]/80 backdrop-blur-2xl">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md p-8 glass-panel rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#fbbf24] to-transparent opacity-50"></div>
        
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#fbbf24]/10 border border-[#fbbf24]/20 flex items-center justify-center mb-6">
            <ShieldCheck className="w-8 h-8 text-[#fbbf24]" />
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight mb-2">Identidad Maestra</h2>
          <p className="text-gray-500 text-sm font-medium mb-8">
            Ingresa la Llave Maestra para acceder a las operaciones críticas de DebugAI.
          </p>

          <form onSubmit={handleUnlock} className="w-full space-y-4">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Lock className="w-4 h-4 text-gray-500 group-focus-within:text-[#fbbf24] transition-colors" />
              </div>
              <input 
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-700 outline-none focus:border-[#fbbf24]/50 focus:ring-1 focus:ring-[#fbbf24]/20 transition-all font-mono"
                autoFocus
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="flex items-center gap-2 text-red-400 text-xs font-bold px-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all
                ${loading 
                  ? 'bg-gray-800 text-gray-500' 
                  : 'bg-[#fbbf24] text-black hover:bg-[#fcd34d] hover:scale-[1.02] shadow-xl shadow-[#fbbf24]/20'
                }
              `}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Verificar Identidad
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Decorative noise */}
        <div className="absolute inset-0 noise-overlay opacity-5 pointer-events-none"></div>
      </motion.div>
    </div>
  );
};

export default MasterLockScreen;
