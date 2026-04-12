import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Cpu, Zap, Loader2, Info } from 'lucide-react';

const SYSTEM_LOGS = [
  "Scanning local environment...",
  "Injecting AI guardian modules...",
  "Calibrating analysis engine...",
  "Synchronizing security protocols...",
  "Kernel integrity: VERIFIED",
  "Ready for deployment."
];

const LoadingSequence = ({ onComplete }) => {
  const [currentLog, setCurrentLog] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const logInterval = setInterval(() => {
      setCurrentLog(prev => (prev < SYSTEM_LOGS.length - 1 ? prev + 1 : prev));
    }, 800);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 1.5;
      });
    }, 50);

    return () => {
      clearInterval(logInterval);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#030303] flex items-center justify-center z-[9999] overflow-hidden">
      {/* Cinematic Background */}
      <div className="absolute inset-0 cinematic-gradient opacity-30"></div>
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-indigo-500/10 blur-[150px] rounded-full animate-pulse-slow"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-neon-cyan/5 blur-[150px] rounded-full animate-pulse-slow"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
        transition={{ duration: 0.8 }}
        className="relative z-10 flex flex-col items-center"
      >
        {/* Logo Section */}
        <div className="mb-12 relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="w-32 h-32 rounded-3xl border-2 border-dashed border-white/10 flex items-center justify-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#fbbf24] to-orange-500 p-0.5 shadow-2xl shadow-orange-500/20">
              <div className="w-full h-full rounded-[14px] bg-[#030303] flex items-center justify-center text-3xl font-black text-white italic">
                D
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center mt-6"
          >
            <h1 className="text-3xl font-black text-white tracking-widest uppercase italic">DebugAI <span className="text-[#fbbf24]">PRO</span></h1>
            <p className="text-gray-500 text-xs font-bold tracking-[0.3em] mt-2 uppercase">Initializing Pre-Deploy Guardian...</p>
          </motion.div>
        </div>

        {/* HUD Elements */}
        <div className="w-64 space-y-4">
          <div className="relative h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              style={{ width: `${progress}%` }}
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-neon-purple via-neon-cyan to-white shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all duration-100"
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-black text-gray-600 uppercase tracking-widest px-1">
            <span>System Boot</span>
            <span className="text-neon-cyan">{Math.round(progress)}%</span>
          </div>

          <div className="h-6 overflow-hidden relative">
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentLog}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="flex items-center gap-2 text-[10px] font-medium text-neon-cyan/60 italic"
              >
                <Info className="w-3 h-3" />
                {SYSTEM_LOGS[currentLog]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Decorative Grid */}
        <div className="absolute inset-0 noise-overlay opacity-5 pointer-events-none"></div>
      </motion.div>
    </div>
  );
};

export default LoadingSequence;
