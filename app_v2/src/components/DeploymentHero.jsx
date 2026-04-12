import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, ShieldAlert, CheckCircle2, AlertTriangle, Zap } from 'lucide-react';

const DeploymentHero = ({ score, risk, isPlaying }) => {
  const getStatusConfig = () => {
    switch (risk) {
      case 'low':
        return {
          color: 'text-[#22c55e]',
          bg: 'bg-[#22c55e]/10',
          border: 'border-[#22c55e]/20',
          glow: 'status-glow-green',
          label: 'Deployment Safe',
          icon: CheckCircle2,
          btnText: 'Deploy Now',
          btnClass: 'bg-[#22c55e] hover:bg-[#16a34a] shadow-[#22c55e]/20'
        };
      case 'medium':
        return {
          color: 'text-[#f59e0b]',
          bg: 'bg-[#f59e0b]/10',
          border: 'border-[#f59e0b]/20',
          glow: 'status-glow-yellow',
          label: 'Risk Warning',
          icon: AlertTriangle,
          btnText: 'Deploy Anyway',
          btnClass: 'bg-[#f59e0b] hover:bg-[#d97706] shadow-[#f59e0b]/20'
        };
      case 'high':
        return {
          color: 'text-[#ef4444]',
          bg: 'bg-[#ef4444]/10',
          border: 'border-[#ef4444]/20',
          glow: 'status-glow-red',
          label: 'Deployment Blocked',
          icon: ShieldAlert,
          btnText: 'Manual Review Required',
          btnClass: 'bg-gray-800 cursor-not-allowed text-gray-500 border border-white/5'
        };
      default:
        return {};
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`relative w-full h-[320px] rounded-3xl overflow-hidden glass-panel border border-white/10 ${config.glow} transition-all duration-700`}>
      {/* Background Pulse */}
      <div className={`absolute inset-0 ${config.bg} opacity-20 animate-pulse-slow`}></div>
      
      <div className="relative h-full flex flex-col items-center justify-center text-center p-8 z-10">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-4"
        >
          <div className={`p-4 rounded-2xl ${config.bg} ${config.color} border ${config.border}`}>
            <Icon className="w-8 h-8" />
          </div>
          
          <div>
            <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${config.color} mb-1 block`}>
              Stability Confidence
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-8xl font-black text-white tracking-tighter tracking-tight">
                {score}
              </span>
              <span className="text-2xl font-bold text-gray-500">%</span>
            </div>
          </div>

          <p className="text-gray-400 font-medium max-w-md mx-auto line-clamp-2">
            AI-driven analysis indicates {risk === 'low' ? 'no critical blockers' : risk === 'medium' ? 'potential performance regressions' : 'critical security vulnerabilities'} in the current build pipeline.
          </p>

          <div className="flex items-center gap-4 mt-4">
            <button className={`px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-xl flex items-center gap-2 group ${config.btnClass}`}>
              <Rocket className={`w-4 h-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${risk === 'high' ? 'opacity-0' : ''}`} />
              {config.btnText}
            </button>
            
            <button className="px-6 py-3.5 rounded-xl font-bold text-sm bg-white/5 text-gray-300 hover:bg-white/10 transition-all border border-white/5 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#fbbf24]" />
              Explain with AI
            </button>
          </div>
        </motion.div>
      </div>

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
    </div>
  );
};

export default DeploymentHero;
