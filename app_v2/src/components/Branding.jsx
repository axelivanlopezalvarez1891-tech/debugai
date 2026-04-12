import React from 'react';

export const PrimaryLogo = ({ className = "w-10 h-10", iconOnly = false }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative w-full h-full aspect-square bg-[#fbbf24] rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
        <span className="text-black font-black text-2xl select-none">D</span>
        <div className="absolute inset-0 rounded-xl ring-1 ring-white/20"></div>
      </div>
      {!iconOnly && (
        <div className="flex flex-col leading-tight">
          <span className="text-white font-bold tracking-tight text-lg">DebugAI</span>
          <span className="text-gray-500 font-medium text-xs tracking-widest uppercase">Guardian</span>
        </div>
      )}
    </div>
  );
};

export const MonochromeLogo = ({ className = "w-8 h-8" }) => {
  return (
    <div className={`relative ${className} bg-white/10 rounded-lg flex items-center justify-center overflow-hidden group hover:bg-white/20 transition-colors`}>
      <span className="text-white font-black text-lg">D</span>
    </div>
  );
};

export default PrimaryLogo;
