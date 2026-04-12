import React, { useState } from 'react';
import { 
  FolderIcon, 
  PlayCircleIcon, 
  HistoryIcon, 
  SettingsIcon, 
  UsersIcon, 
  LayoutDashboardIcon, 
  CpuIcon,
  SearchIcon,
  PlusIcon,
  CheckCircle2Icon,
  XCircleIcon,
  AlertTriangleIcon,
  RotateCwIcon,
  BellIcon,
  MoreHorizontalIcon
} from 'lucide-react';

const Logo = () => (
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 bg-[#fbbf24] rounded-lg flex items-center justify-center font-bold text-black text-lg shadow-lg shadow-yellow-500/10">D</div>
    <span className="text-lg font-bold tracking-tight text-white">DebugAI</span>
  </div>
);

const SidebarItem = ({ icon: Icon, label, active = false }) => (
  <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${active ? 'bg-white/10 text-white border border-white/5 shadow-sm' : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'}`}>
    <Icon size={18} strokeWidth={active ? 2.5 : 2} />
    <span className={`text-xs font-semibold ${active ? '' : ''}`}>{label}</span>
  </div>
);

const TestRow = ({ name, status, progress, lastRun, trigger, duration, active = false, onClick }) => {
  const colors = {
    Passed: 'text-green-400',
    Failed: 'text-red-400',
    Warning: 'text-orange-400',
    Running: 'text-blue-400'
  };

  const icons = {
    Passed: <CheckCircle2Icon size={14} />,
    Failed: <XCircleIcon size={14} />,
    Warning: <AlertTriangleIcon size={14} />,
    Running: <RotateCwIcon size={14} className="animate-spin" />
  };

  return (
    <div 
      onClick={onClick}
      className={`grid grid-cols-6 gap-4 p-4 items-center rounded-xl cursor-pointer transition-all duration-300 border ${active ? 'bg-white/5 border-white/10' : 'border-transparent hover:bg-white/[0.02]'} group relative overflow-hidden`}
    >
      <div 
        className="absolute left-0 top-0 bottom-0 w-[3px]" 
        style={{ backgroundColor: status === 'Failed' ? '#ef4444' : status === 'Passed' ? '#10b981' : status === 'Warning' ? '#f59e0b' : '#3b82f6' }}
      />
      
      <div className="col-span-1 pl-2">
        <div className="font-bold text-sm text-gray-200 group-hover:text-white transition-colors">{name}</div>
        {status === 'Failed' && <div className="text-[9px] text-red-500 font-bold mt-0.5">Bug Detected: UI Overlap</div>}
      </div>
      
      <div className={`flex items-center gap-2 font-bold ${colors[status]}`}>
        {icons[status]}
        <span className="text-[10px] uppercase tracking-wider">{status}</span>
      </div>
      
      <div className="flex flex-col gap-1 pr-4">
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-700 ${status === 'Failed' ? 'bg-red-500/50' : status === 'Passed' ? 'bg-green-500' : status === 'Warning' ? 'bg-orange-500' : 'bg-blue-500'}`} 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>
      
      <div className="text-[11px] text-gray-500">{lastRun}</div>
      <div className="text-[11px] text-gray-500">{trigger}</div>
      <div className="text-[11px] text-gray-400 font-medium">{duration}</div>
    </div>
  );
};

export const Dashboard = ({ isMini = false }) => {
  const [selectedTest, setSelectedTest] = useState(1);

  const tests = [
    { id: 0, name: "Login Flow", status: "Passed", progress: 100, lastRun: "2m ago", trigger: "CI/CD", duration: "1m 14s" },
    { id: 1, name: "Checkout Process", status: "Failed", progress: 65, lastRun: "5m ago", trigger: "Manual", duration: "2m 30s" },
    { id: 2, name: "API Auth", status: "Warning", progress: 88, lastRun: "15m ago", trigger: "CI/CD", duration: "45s" },
    { id: 3, name: "User Profile", status: "Passed", progress: 100, lastRun: "20m ago", trigger: "CI/CD", duration: "1m 02s" },
    { id: 4, name: "Search Bar", status: "Running", progress: 45, lastRun: "Now", trigger: "Manual", duration: "55s" },
  ];

  if (isMini) {
    return (
      <div className="w-full h-full bg-[#0a0a0c] flex overflow-hidden">
        <div className="w-12 border-right border-white/5 p-2 flex flex-col gap-4 items-center">
            <div className="w-6 h-6 bg-accent-primary rounded flex items-center justify-center text-[10px] font-bold text-black">D</div>
            {[1,2,3,4].map(i => <div key={i} className="w-6 h-6 bg-white/5 rounded" />)}
        </div>
        <div className="flex-1 p-4 space-y-4">
            <div className="flex justify-between items-center">
               <div className="w-24 h-4 bg-white/10 rounded" />
               <div className="w-12 h-6 bg-accent-secondary/50 rounded" />
            </div>
            <div className="space-y-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-full h-10 bg-white/5 rounded-lg border border-white/5" />
                ))}
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black text-gray-300 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-dark-sidebar border-r border-white/5 p-6 flex flex-col gap-10 backdrop-blur-3xl relative z-20">
        <Logo />
        <nav className="flex flex-col gap-1.5 pt-4">
          <SidebarItem icon={FolderIcon} label="Projects" />
          <SidebarItem icon={PlayCircleIcon} label="Test Runs" active />
          <SidebarItem icon={HistoryIcon} label="History" />
          <SidebarItem icon={CpuIcon} label="Automation" />
          <SidebarItem icon={LayoutDashboardIcon} label="Environments" />
          <SidebarItem icon={UsersIcon} label="Team" />
          <SidebarItem icon={SettingsIcon} label="Settings" />
        </nav>
        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-400 border border-indigo-500/30">JD</div>
             <div className="text-[10px] flex flex-col">
                <span className="text-white font-bold leading-none mb-1">John Doe</span>
                <span className="text-gray-500 leading-none">Pro Plan</span>
             </div>
           </div>
           <BellIcon size={14} className="text-gray-500" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-[#050505] px-10 py-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[150px] pointer-events-none rounded-full" />
        
        <header className="flex justify-between items-end mb-10 z-10">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">Test Runs</h1>
            <p className="text-gray-500 text-sm">Real-time automation and bug detection logs.</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-accent-primary/50 transition-all w-48"
              />
            </div>
            <button className="flex items-center gap-2 bg-accent-secondary text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg shadow-indigo-500/10 hover:opacity-90 active:scale-95 transition-all">
              <PlusIcon size={14} />
              New Run
            </button>
          </div>
        </header>

        <section className="flex-1 bg-white/[0.01] border border-white/5 rounded-2xl overflow-hidden glass-card z-10">
          <div className="grid grid-cols-6 gap-4 p-5 text-[10px] font-bold text-gray-600 uppercase tracking-[0.15em] border-b border-white/5 bg-white/[0.01]">
            <div>Name</div>
            <div>Status</div>
            <div className="pr-10">Progress</div>
            <div>Last Run</div>
            <div>Trigger</div>
            <div>Duration</div>
          </div>
          <div className="p-2 flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-280px)]">
            {tests.map(test => (
              <TestRow 
                key={test.id} 
                {...test} 
                active={selectedTest === test.id}
                onClick={() => setSelectedTest(test.id)}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Right side Panel */}
      <aside className={`w-[360px] bg-[#0a0a0c] border-l border-white/5 p-8 flex flex-col gap-8 transition-all duration-500 z-20`}>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white leading-tight">{tests[selectedTest].name}</h3>
              <div className="text-[10px] text-gray-500 font-mono tracking-wider">REF: RUN-82910-X</div>
            </div>
            <button className="p-2 hover:bg-white/5 rounded-lg">
              <MoreHorizontalIcon size={16} />
            </button>
          </div>

          <div className="space-y-6">
             <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                   <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Duration</div>
                   <div className="text-sm font-bold text-white">{tests[selectedTest].duration}</div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                   <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Accuracy</div>
                   <div className="text-sm font-bold text-green-400">99.8%</div>
                </div>
             </div>

             <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Activity Logs</h4>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                </div>
                <div className="bg-black/50 p-4 rounded-xl border border-white/5 space-y-3 font-mono text-[11px] leading-relaxed">
                   <div className="flex gap-2">
                      <span className="text-white/20">01</span>
                      <span className="text-gray-400">Initializing AI environment...</span>
                   </div>
                   <div className="flex gap-2">
                      <span className="text-white/20">02</span>
                      <span className="text-gray-400">Injecting session tokens...</span>
                   </div>
                   {tests[selectedTest].status === 'Failed' && (
                     <div className="flex gap-2 text-red-400/90 font-bold bg-red-400/5 p-1 rounded">
                        <span>!!</span>
                        <span>ERROR: UI_OVERLAP_DETECTED [.buy-btn]</span>
                     </div>
                   )}
                   <div className="flex gap-2">
                      <span className="text-white/20">03</span>
                      <span className="text-gray-400">Cleaning up test state.</span>
                   </div>
                </div>
             </div>
          </div>

          <div className="mt-auto space-y-3">
             <button className="w-full bg-[#fbbf24] text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-yellow-500/5 hover:scale-[1.02] transition-all">
                <CpuIcon size={16} />
                Explain with AI
             </button>
             <button className="w-full bg-white/5 text-gray-300 font-bold py-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
                Retry Process
             </button>
          </div>
      </aside>
    </div>
  );
};

export default Dashboard;
