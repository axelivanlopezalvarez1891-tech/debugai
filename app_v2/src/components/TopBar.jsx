import React from 'react';
import { Search, Bell, Command, ChevronDown } from 'lucide-react';

const TopBar = () => {
  return (
    <header className="h-16 border-b border-white/5 bg-[#030303]/30 backdrop-blur-md flex items-center justify-between px-8">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 transition-all focus-within:ring-1 focus-within:ring-[#fbbf24]/50 group">
          <Search className="w-4 h-4 text-gray-500 group-focus-within:text-[#fbbf24]" />
          <input 
            type="text" 
            placeholder="Search deployment logs..." 
            className="bg-transparent border-none outline-none text-sm text-gray-300 placeholder:text-gray-600 w-64"
          />
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-white/10 bg-white/5 ml-2">
            <Command className="w-2.5 h-2.5 text-gray-500" />
            <span className="text-[10px] font-bold text-gray-500">K</span>
          </div>
        </div>

        <div className="h-4 w-px bg-white/10"></div>

        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-[#030303] bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-400">
                {String.fromCharCode(64 + i)}
              </div>
            ))}
          </div>
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">3 Systems Active</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-xl hover:bg-white/5 transition-colors group">
          <Bell className="w-5 h-5 text-gray-400 group-hover:text-white" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#fbbf24] rounded-full border-2 border-[#030303]"></span>
        </button>

        <div className="h-8 w-px bg-white/10"></div>

        <div className="flex items-center gap-3 pl-2 cursor-pointer group">
          <div className="text-right">
            <p className="text-sm font-bold text-white leading-none">Axel Lopez</p>
            <p className="text-[10px] text-gray-500 font-medium">Administrator</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-all">
            <span className="text-xs font-black text-white">AL</span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
        </div>
      </div>
    </header>
  );
};

export default TopBar;
