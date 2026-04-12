import React from 'react';
import { 
  LayoutDashboard, 
  Terminal, 
  ShieldCheck, 
  Settings, 
  BarChart3, 
  Globe,
  Bell,
  Search,
  ChevronRight
} from 'lucide-react';
import { MonochromeLogo } from './Branding';

const SidebarItem = ({ icon: Icon, label, active = false, badge }) => (
  <div className={`
    group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200
    ${active ? 'bg-white/5 text-white' : 'text-gray-400 hover:bg-white/[0.03] hover:text-gray-200'}
  `}>
    <div className="flex items-center gap-3">
      <Icon className={`w-5 h-5 ${active ? 'text-[#fbbf24]' : 'group-hover:text-gray-200'}`} />
      <span className="font-medium text-sm tracking-wide">{label}</span>
    </div>
    {badge && (
      <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-[10px] font-bold text-gray-300">
        {badge}
      </span>
    )}
  </div>
);

const Sidebar = ({ activeView, onViewChange }) => {
  return (
    <aside className="w-[260px] h-screen flex flex-col border-r border-white/5 bg-[#030303]/50 backdrop-blur-md">
      <div className="p-6">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => onViewChange('guardian')}>
          <MonochromeLogo />
          <div>
            <h2 className="text-white font-bold text-sm leading-none">DebugAI</h2>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest mt-1">Enterprise</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto pt-2">
        <div className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] px-3 mb-4">
          Core Platform
        </div>
        <div onClick={() => onViewChange('guardian')}>
          <SidebarItem icon={LayoutDashboard} label="Guardian Hub" active={activeView === 'guardian'} />
        </div>
        <div onClick={() => onViewChange('management')}>
          <SidebarItem icon={ShieldCheck} label="Master Control" active={activeView === 'management'} badge="ADMIN" />
        </div>
        <div onClick={() => onViewChange('logs')}>
          <SidebarItem icon={Terminal} label="Live Logs" active={activeView === 'logs'} badge="8.4k" />
        </div>
        
        <div className="mt-8 text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] px-3 mb-4">
          Analytics
        </div>
        <div onClick={() => onViewChange('performance')}>
          <SidebarItem icon={BarChart3} label="Performance" active={activeView === 'performance'} />
        </div>
        <div onClick={() => onViewChange('edge')}>
          <SidebarItem icon={Globe} label="Edge Network" active={activeView === 'edge'} />
        </div>
        <div onClick={() => onViewChange('settings')}>
          <SidebarItem icon={Settings} label="System Config" active={activeView === 'settings'} />
        </div>
      </nav>



      <div className="p-4 bg-white/[0.02] border-t border-white/5">
        <div className="flex items-center gap-3 p-2 rounded-xl border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/5 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#fbbf24] to-orange-500 p-0.5">
            <div className="w-full h-full rounded-[6px] bg-[#030303] flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">PRO</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-white uppercase tracking-tighter">Legacy API</p>
            <p className="text-[9px] text-gray-500">Connected</p>
          </div>
          <ChevronRight className="w-3 h-3 text-gray-600" />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
