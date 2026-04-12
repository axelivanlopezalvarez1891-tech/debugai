import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const Layout = ({ children, rightPanel, activeView, onViewChange }) => {
  return (
    <div className="flex h-screen bg-[#030303] overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 noise-overlay pointer-events-none z-0"></div>
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Sidebar */}
      <div className="relative z-10 flex-shrink-0">
        <Sidebar activeView={activeView} onViewChange={onViewChange} />
      </div>


      {/* Main Container */}
      <div className="relative z-10 flex flex-col flex-1 min-w-0">
        <TopBar />
        
        <main className="flex-1 flex overflow-hidden">
          {/* Central Scrollable Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar relative">
            <div className="max-w-[1400px] mx-auto p-8">
              {children}
            </div>
          </div>

          {/* Right Context Panel (Authoritative Review) */}
          {rightPanel && (
            <aside className="w-[380px] flex-shrink-0 border-l border-white/5 bg-[#030303]/10 backdrop-blur-sm overflow-y-auto">
              <div className="p-6">
                {rightPanel}
              </div>
            </aside>
          )}
        </main>
      </div>
    </div>
  );
};

export default Layout;
