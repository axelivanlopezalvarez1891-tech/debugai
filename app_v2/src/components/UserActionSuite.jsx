import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Gift, 
  Coins, 
  Trash2, 
  ShieldAlert, 
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

const ActionButton = ({ icon: Icon, label, onClick, color, loading, danger }) => (
  <button 
    onClick={onClick}
    disabled={loading}
    className={`w-full p-4 rounded-2xl border flex items-center justify-between group transition-all duration-300 active:scale-95
      ${danger 
        ? 'bg-red-500/5 border-red-500/20 text-red-500 hover:bg-red-500/10 hover:border-red-500/40' 
        : `bg-${color}/5 border-${color}/20 text-${color} hover:bg-${color}/10 hover:border-${color}/40`
      }
    `}
  >
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-xl border border-current opacity-60`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="font-bold text-sm tracking-tight">{label}</span>
    </div>
    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />}
  </button>
);

const UserActionSuite = ({ user, actions }) => {
  const [loadingAction, setLoadingAction] = useState(null);
  const [notification, setNotification] = useState(null);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 border-2 border-dashed border-white/5 rounded-3xl">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-6">
          <User className="w-8 h-8 text-gray-700" />
        </div>
        <h3 className="text-gray-400 font-bold mb-2">Selecciona un Usuario</h3>
        <p className="text-gray-600 text-xs">Haz clic en un usuario de la lista para gestionar sus privilegios maestros.</p>
      </div>
    );
  }

  const handleAction = async (type, fn, ...args) => {
    setLoadingAction(type);
    const result = await fn(user.username, ...args);
    setLoadingAction(null);
    setNotification(result);
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <span className="text-xl font-black text-indigo-400">{user.username?.substring(0, 2).toUpperCase()}</span>
          </div>
          <div>
            <h3 className="text-white font-black text-xl leading-tight">{user.username}</h3>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-widest">{user.premium ? 'Legacy Plus Active' : 'Basic Tier'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
            <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-1">Tokens</p>
            <p className="text-lg font-black text-white">{user.creditos}</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
            <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-1">ID Admin</p>
            <p className="text-lg font-black text-white">{user.is_admin ? 'YES' : 'NO'}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3">
        <div className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] mb-4">Master Operations</div>
        
        <ActionButton 
          icon={Gift} 
          label="Regalar Plus (30d)" 
          color="green-500"
          loading={loadingAction === 'plus'}
          onClick={() => handleAction('plus', actions.giftPlus, 30 * 24 * 60 * 60 * 1000)}
        />

        <ActionButton 
          icon={Coins} 
          label="Regalar +1000 Tokens" 
          color="amber-500"
          loading={loadingAction === 'tokens'}
          onClick={() => handleAction('tokens', actions.giftTokens, 1000)}
        />

        <div className="pt-4 mt-4 border-t border-white/5">
          <ActionButton 
            icon={Trash2} 
            label="Borrar Cuenta Permanentemente" 
            danger
            loading={loadingAction === 'delete'}
            onClick={() => {
              if (window.confirm(`¿ESTÁS SEGURO? Esta acción destruirá la cuenta de ${user.username} y no podrá recuperarse.`)) {
                handleAction('delete', actions.deleteUser);
              }
            }}
          />
        </div>
      </div>

      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className={`mt-6 p-4 rounded-xl border flex gap-3
              ${notification.success ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}
            `}
          >
            {notification.success ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <p className="text-xs font-bold leading-relaxed">{notification.msg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0" />
        <p className="text-[10px] text-amber-500/80 font-bold leading-relaxed">
          Las acciones realizadas en este panel son definitivas y afectan directamente al núcleo de la base de datos de DebugAI.
        </p>
      </div>
    </div>
  );
};

export default UserActionSuite;
