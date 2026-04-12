import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Search, 
  Trash2, 
  Gift, 
  Coins, 
  BadgeCheck, 
  Calendar,
  MoreVertical,
  Shield
} from 'lucide-react';

const UserRow = ({ user, onSelect, selected }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    onClick={() => onSelect(user)}
    className={`grid grid-cols-6 gap-4 p-4 rounded-xl border transition-all cursor-pointer group mb-2
      ${selected 
        ? 'bg-[#fbbf24]/5 border-[#fbbf24]/30 shadow-lg shadow-[#fbbf24]/5' 
        : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]'
      }
    `}
  >
    <div className="col-span-2 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm
        ${user.is_admin ? 'bg-amber-500/20 text-amber-500' : 'bg-indigo-500/20 text-indigo-500'}
      `}>
        {user.username?.substring(0, 2).toUpperCase()}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-sm">{user.username}</span>
          {user.is_admin && <Shield className="w-3 h-3 text-amber-500" />}
          {user.premium === 1 && <BadgeCheck className="w-3 h-3 text-green-500" />}
        </div>
        <span className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">
          {user.is_admin ? 'Admin Supremo' : 'Usuario Base'}
        </span>
      </div>
    </div>

    <div className="flex items-center">
      <div className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border
        ${user.premium === 1 
          ? 'bg-green-500/10 text-green-500 border-green-500/20' 
          : 'bg-gray-500/10 text-gray-400 border-white/5'}
      `}>
        {user.premium === 1 ? 'Legacy Plus' : 'Estándar'}
      </div>
    </div>

    <div className="flex items-center gap-2 text-gray-400">
      <Coins className="w-4 h-4 text-[#fbbf24]" />
      <span className="font-mono text-sm font-bold truncate">{user.creditos}</span>
    </div>

    <div className="flex items-center gap-2 text-gray-500 col-span-2 justify-between">
      <div className="flex items-center gap-2">
        <Calendar className="w-3 h-3" />
        <span className="text-[10px] font-medium">{new Date(user.created_at).toLocaleDateString()}</span>
      </div>
      <button className="p-2 rounded-lg hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all">
        <MoreVertical className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  </motion.div>
);

const UserManagementView = ({ users, selectedUser, onSelectUser, searchQuery, setSearchQuery, stats }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <Users className="w-6 h-6 text-[#fbbf24]" />
            Soporte Maestro
          </h1>
          <p className="text-gray-500 text-sm font-medium">Gestión de privilegios y auditoría de cuentas</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#fbbf24] transition-colors" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar usuario por nombre..." 
              className="bg-white/[0.03] border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-sm text-gray-300 outline-none focus:border-[#fbbf24]/40 w-80 transition-all placeholder:text-gray-700"
            />
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card rounded-2xl p-4 border-white/5">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Usuarios</p>
            <p className="text-2xl font-black text-white">{stats.totalUsers}</p>
          </div>
          <div className="glass-card rounded-2xl p-4 border-white/5">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Cuentas PRO</p>
            <p className="text-2xl font-black text-white">{stats.proUsers}</p>
          </div>
          <div className="glass-card rounded-2xl p-4 border-white/5">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Recaudación (USD)</p>
            <p className="text-2xl font-black text-[#fbbf24]">${stats.revenueUsd}</p>
          </div>
        </div>
      )}

      <div>
        <div className="grid grid-cols-6 gap-4 px-4 mb-4 text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">
          <span className="col-span-2 text-left">Identidad</span>
          <span>Suscripción</span>
          <span>Tokens</span>
          <span className="col-span-2">Registro & Acciones</span>
        </div>

        <div className="max-h-[calc(100vh-420px)] overflow-y-auto pr-2 custom-scrollbar">
          {users.map((user) => (
            <UserRow 
              key={user.username} 
              user={user} 
              onSelect={onSelectUser}
              selected={selectedUser?.username === user.username}
            />
          ))}

          {users.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-gray-600 font-medium">No se han encontrado usuarios para esta búsqueda.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagementView;
