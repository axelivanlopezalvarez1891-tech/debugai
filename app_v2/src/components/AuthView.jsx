import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2, Sparkles, ShieldCheck } from 'lucide-react';

const AuthView = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ user: '', pass: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await resp.json();
      
      if (data.ok) {
        onLogin(data.user);
      } else {
        setError(data.msg || 'Error en la autenticación');
      }
    } catch (err) {
      setError('Fallo de conexión con el núcleo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#030303]/80 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md p-8 rounded-[2.5rem] border border-white/10 glass-card shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fbbf24] via-[#f59e0b] to-[#fbbf24] opacity-50"></div>
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4 relative group">
            <ShieldCheck className="w-8 h-8 text-[#fbbf24] group-hover:scale-110 transition-transform" />
            <div className="absolute -inset-2 bg-amber-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {isLogin ? 'Acceso al Nucleo' : 'Registro de Agente'}
          </h2>
          <p className="text-gray-500 text-xs font-medium mt-1">
            {isLogin ? 'Ingresa tus credenciales de DebugAI Guardian' : 'Inicia tu entrenamiento en la auditoría de élite'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <User className="w-4 h-4 text-gray-500 group-focus-within:text-[#fbbf24] transition-colors" />
            </div>
            <input 
              type="text"
              required
              placeholder="Nombre de usuario"
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-gray-200 outline-none focus:border-[#fbbf24]/40 transition-all placeholder:text-gray-700"
              value={formData.user}
              onChange={(e) => setFormData({ ...formData, user: e.target.value })}
            />
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Lock className="w-4 h-4 text-gray-500 group-focus-within:text-[#fbbf24] transition-colors" />
            </div>
            <input 
              type="password"
              required
              placeholder="Contraseña Maestra"
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-gray-200 outline-none focus:border-[#fbbf24]/40 transition-all placeholder:text-gray-700"
              value={formData.pass}
              onChange={(e) => setFormData({ ...formData, pass: e.target.value })}
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-red-400 text-[10px] font-bold text-center bg-red-500/10 py-2 rounded-xl border border-red-500/20"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-[#fbbf24] text-black font-black text-sm uppercase tracking-[0.2em] hover:bg-[#f59e0b] hover:scale-[1.02] transition-all active:scale-[0.98] shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                {isLogin ? 'Verificar Identidad' : 'Comenzar Operación'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center bg-white/[0.02] -mx-8 -mb-8 p-6 border-t border-white/5">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-500 hover:text-[#fbbf24] transition-colors"
          >
            {isLogin ? '¿No tienes cuenta? Regístrate Aquí' : '¿Ya eres un agente? Iniciar Sesión'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthView;
