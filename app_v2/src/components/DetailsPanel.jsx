import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Shield, AlertTriangle, Info, Search, Zap } from 'lucide-react';

const LogItem = ({ log }) => {
  const getSeverityColor = () => {
    switch (log.level) {
      case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
    }
  };

  const Icon = log.level === 'high' ? Shield : log.level === 'medium' ? AlertTriangle : Info;

  return (
    <motion.div 
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`p-3 rounded-xl border mb-3 flex gap-3 transition-colors hover:bg-white/[0.04] cursor-pointer group ${getSeverityColor()}`}
    >
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{log.category}</span>
          <span className="text-[10px] font-medium opacity-60 font-mono">{log.timestamp}</span>
        </div>
        <p className="text-sm font-medium leading-relaxed truncate group-hover:text-white transition-colors">
          {log.message}
        </p>
      </div>
    </motion.div>
  );
};

const DetailsPanel = ({ logs }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-white font-bold text-lg leading-tight">Live Runtime</h3>
          <p className="text-gray-500 text-xs font-medium">Real-time system telemetry</p>
        </div>
        <div className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center">
          <Terminal className="w-5 h-5 text-[#fbbf24]" />
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Filter logs..." 
            className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-300 outline-none focus:border-[#fbbf24]/30 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="space-y-1">
          <AnimatePresence initial={false}>
            {logs.map((log) => (
              <LogItem key={log.id} log={log} />
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-white/5">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-[#fbbf24]" />
            <span className="text-indigo-200 font-bold text-xs uppercase tracking-wider">AI Insight</span>
          </div>
          <p className="text-xs text-indigo-200/70 leading-relaxed italic">
            "We've detected a cluster of rate-limit warnings. Recommend scaling Edge Nodes by 15% before deployment."
          </p>
        </div>
      </div>
    </div>
  );
};

export default DetailsPanel;
