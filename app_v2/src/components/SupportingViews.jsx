import React from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Globe, 
  Terminal, 
  Settings as SettingsIcon, 
  Cpu, 
  Zap, 
  HardDrive,
  Database,
  CloudLightning,
  Hash,
  Clock,
  Unlock,
  Key,
  ShieldCheck
} from 'lucide-react';


const ViewHeader = ({ icon: Icon, title, subtitle }) => (
  <div className="mb-8">
    <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
      <Icon className="w-6 h-6 text-[#fbbf24]" />
      {title}
    </h1>
    <p className="text-gray-500 text-sm font-medium">{subtitle}</p>
  </div>
);

export const PerformanceView = () => (
  <div className="space-y-8">
    <ViewHeader 
      icon={Activity} 
      title="Telemetría de Rendimiento" 
      subtitle="Análisis detallado de recursos y latencia global" 
    />
    
    <div className="grid grid-cols-2 gap-6">
      <div className="glass-panel rounded-3xl p-6 border-white/5 h-64 relative overflow-hidden flex flex-col justify-end">
        <div className="absolute top-6 left-6">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Carga de CPU</p>
          <p className="text-3xl font-black text-white">42.8%</p>
        </div>
        <div className="flex items-end gap-1 h-24">
          {[40, 45, 38, 52, 48, 42, 44, 46, 50, 42, 40].map((h, i) => (
            <motion.div 
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              className="flex-1 bg-gradient-to-t from-indigo-500/40 to-indigo-400/10 rounded-t-sm"
            />
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-6 border-white/5 h-64 relative overflow-hidden flex flex-col justify-end">
        <div className="absolute top-6 left-6">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Uso de Memoria</p>
          <p className="text-3xl font-black text-white">12.4 GB</p>
        </div>
        <div className="flex items-end gap-1 h-24">
          {[60, 62, 61, 63, 62, 64, 65, 63, 62, 64, 63].map((h, i) => (
            <motion.div 
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              className="flex-1 bg-gradient-to-t from-amber-500/40 to-amber-400/10 rounded-t-sm"
            />
          ))}
        </div>
      </div>
    </div>

    <div className="grid grid-cols-4 gap-4">
      {[
        { label: 'Cloud SQL', icon: Database, status: 'Healthy', val: '24ms' },
        { label: 'Compute Engine', icon: Cpu, status: 'Scaling', val: '8 Nodes' },
        { label: 'Storage', icon: HardDrive, status: '92% Free', val: '1.2TB' },
        { label: 'API Gateway', icon: Zap, status: 'Locked', val: '0ms' }
      ].map((item, i) => (
        <div key={i} className="glass-card rounded-2xl p-4 border-white/5">
          <item.icon className="w-5 h-5 text-gray-500 mb-3" />
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{item.label}</p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-black text-white">{item.val}</span>
            <span className="text-[9px] font-bold text-green-500">{item.status}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const EdgeView = () => (
  <div className="h-full flex flex-col">
    <ViewHeader 
      icon={Globe} 
      title="Red Edge Mundial" 
      subtitle="Distribución de tráfico y nodos CDN activos" 
    />
    
    <div className="flex-1 glass-panel rounded-3xl border-white/5 relative overflow-hidden flex flex-col items-center justify-center p-8">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        {/* Mock globe grid */}
        <div className="w-full h-full border border-white/5 rounded-full scale-[2] translate-y-1/2"></div>
        <div className="w-full h-full border border-white/5 rounded-full scale-[1.5] translate-y-1/2 rotate-45"></div>
      </div>

      <div className="relative text-center mb-12">
        <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 mx-auto animate-pulse">
          <Globe className="w-8 h-8 text-indigo-400" />
        </div>
        <h3 className="text-white font-black text-xl mb-1 tracking-tight">Red Activa en 24 Regiones</h3>
        <p className="text-gray-500 text-xs max-w-xs mx-auto leading-relaxed">
          Los nodos de baja latencia están operando al 100%. Sincronización automática con GCP y AWS activada.
        </p>
      </div>

      <div className="relative w-full grid grid-cols-3 gap-4 max-w-2xl">
        <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-colors">
          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">América</p>
          <p className="text-xs font-black text-white">8 Nodos — 12ms</p>
          <div className="w-full h-1 bg-green-500/20 rounded-full mt-2 overflow-hidden">
            <div className="w-3/4 h-full bg-green-500"></div>
          </div>
        </div>
        <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-colors">
          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Europa</p>
          <p className="text-xs font-black text-white">12 Nodos — 34ms</p>
          <div className="w-full h-1 bg-green-500/20 rounded-full mt-2 overflow-hidden">
            <div className="w-1/2 h-full bg-green-500"></div>
          </div>
        </div>
        <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-colors">
          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Asia/Pacífico</p>
          <p className="text-xs font-black text-white">4 Nodos — 156ms</p>
          <div className="w-full h-1 bg-amber-500/20 rounded-full mt-2 overflow-hidden">
            <div className="w-1/4 h-full bg-amber-500"></div>
          </div>
        </div>
      </div>
    </div>

  </div>
);

export const LogsScreen = ({ logs }) => (
  <div className="h-full flex flex-col">
    <ViewHeader 
      icon={Terminal} 
      title="Terminal de Registros" 
      subtitle="Flujo en tiempo real de eventos del sistema" 
    />
    
    <div className="flex-1 glass-panel rounded-3xl border-white/5 overflow-hidden flex flex-col font-mono">
      <div className="bg-black/40 px-4 py-2 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40"></div>
          <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/40"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/40"></div>
        </div>
        <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">debugai-guardian-system.log</span>
      </div>
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-2">
        {logs.map((log, i) => (
          <div key={i} className="flex gap-4 text-xs">
            <span className="text-gray-700 w-24 flex-shrink-0">[{log.time}]</span>
            <span className={`w-20 font-black uppercase tracking-tighter flex-shrink-0
              ${log.type === 'SECURITY' ? 'text-red-500' : 
                log.type === 'PERFORMANCE' ? 'text-indigo-400' : 
                log.type === 'ERROR' ? 'text-red-400' : 'text-gray-500'}
            `}>
              {log.type}
            </span>
            <span className="text-gray-300">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const SettingsView = () => (
  <div className="space-y-8">
    <ViewHeader 
      icon={SettingsIcon} 
      title="Configura tu Núcleo" 
      subtitle="Ajustes críticos de infraestructura y API" 
    />
    
    <div className="grid grid-cols-1 gap-4">
      {[
        { title: 'Modo de Despliegue', sub: 'Cambia entre Canary e instantáneo', icon: CloudLightning, toggle: true },
        { title: 'Hardening de Base de Datos', sub: 'Cifrado de grado militar activo', icon: ShieldCheck, toggle: true },
        { title: 'Límites de Rate Limit', sub: 'Máximo 300 peticiones / min por IP', icon: Hash, val: '300/min' },
        { title: 'Identidad Maestra', sub: 'Gestiona tu llave de acceso al sistema', icon: Key, action: 'Cambiar Llave' }
      ].map((item, i) => (
        <div key={i} className="glass-panel rounded-2xl p-6 border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center">
              <item.icon className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <p className="text-white font-bold">{item.title}</p>
              <p className="text-gray-500 text-xs">{item.sub}</p>
            </div>
          </div>
          
          {item.toggle ? (
            <div className="w-10 h-5 bg-indigo-500/20 rounded-full border border-indigo-500/40 relative">
              <div className="absolute right-1 top-1 w-3 h-3 bg-indigo-400 rounded-full shadow-lg shadow-indigo-500/40"></div>
            </div>
          ) : (
            <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all">
              {item.val || item.action}
            </button>
          )}
        </div>
      ))}
    </div>
  </div>
);
