import { MonochromeLogo } from './Branding';
import { 
  Users,
  Coins,
  BadgeCheck,
  Package,
  LayoutDashboard,
  Terminal,
  ShieldCheck,
  Settings,
  BarChart3,
  Globe,
  ChevronRight
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, active = false, badge, color }) => (
  <div className={`
    group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200
    ${active ? 'bg-white/5 text-white' : 'text-gray-400 hover:bg-white/[0.03] hover:text-gray-200'}
  `}>
    <div className="flex items-center gap-3">
      <Icon className={`w-5 h-5 ${active ? (color || 'text-[#fbbf24]') : 'group-hover:text-gray-200'}`} />
      <span className="font-medium text-sm tracking-wide">{label}</span>
    </div>
    {badge && (
      <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-[10px] font-bold text-gray-300">
        {badge}
      </span>
    )}
  </div>
);

const Sidebar = ({ activeView, onViewChange, user }) => {
  return (
    <aside className="w-[260px] h-screen flex flex-col border-r border-white/5 bg-[#030303]/50 backdrop-blur-md">
      <div className="p-6">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => onViewChange('guardian')}>
          <MonochromeLogo />
          <div>
            <h2 className="text-white font-bold text-sm leading-none">DebugAI</h2>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest mt-1">
              {user?.plan === 'admin' ? 'Master Engine' : 'Guardian Core'}
            </p>
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
        
        {user?.plan === 'admin' && (
          <div onClick={() => onViewChange('management')}>
            <SidebarItem icon={ShieldCheck} label="Master Control" active={activeView === 'management'} badge="ADMIN" color="text-amber-500" />
          </div>
        )}

        <div onClick={() => onViewChange('store')}>
          <SidebarItem icon={Package} label="Token Store" active={activeView === 'store'} badge={user?.plan === 'pro' ? 'PRO' : null} color="text-indigo-400" />
        </div>

        <div onClick={() => onViewChange('settings')}>
          <SidebarItem icon={Settings} label="System Config" active={activeView === 'settings'} />
        </div>
      </nav>

      {user && (
        <div className="p-4 bg-white/[0.02] border-t border-white/5 space-y-2">
          {/* User Profile Card */}
          <div className="flex items-center gap-3 p-3 rounded-2xl border border-white/5 bg-white/[0.02]">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs
              ${user.plan === 'pro' ? 'bg-indigo-500/20 text-indigo-400' : 
                user.plan === 'admin' ? 'bg-amber-500/20 text-amber-500' : 
                'bg-gray-500/20 text-gray-400'}
            `}>
              {user.username?.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-white truncate">{user.username}</p>
                {user.plan === 'pro' && <BadgeCheck className="w-3 h-3 text-indigo-400" />}
                {user.plan === 'admin' && <ShieldCheck className="w-3 h-3 text-amber-500" />}
              </div>
              <p className="text-[9px] text-gray-500 uppercase tracking-tighter">
                {user.plan === 'pro' ? 'Plan Legacy Plus' : user.plan === 'admin' ? 'Administrador' : 'Plan Estándar'}
              </p>
            </div>
          </div>

          {/* Credits Mini-Card */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-500/5 border border-amber-500/10">
            <div className="flex items-center gap-2">
              <Coins className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Tokens Disponibles</span>
            </div>
            <span className="text-xs font-black text-[#fbbf24]">{user.creditos}</span>
          </div>

          <button 
            onClick={() => onViewChange('store')}
            className="w-full py-2.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-300 hover:bg-white/10 hover:text-white transition-all underline decoration-amber-500/30 underline-offset-4"
          >
            Añadir Créditos
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
