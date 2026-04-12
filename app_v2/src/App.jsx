import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Layout from './components/Layout';
import DeploymentHero from './components/DeploymentHero';
import MetricsGrid from './components/MetricsGrid';
import DetailsPanel from './components/DetailsPanel';
import UserManagementView from './components/UserManagementView';
import UserActionSuite from './components/UserActionSuite';
import MasterLockScreen from './components/MasterLockScreen';
import LoadingSequence from './components/LoadingSequence';
import GuardianWorkspace from './components/GuardianWorkspace';
import { useDebugSimulation } from './hooks/useDebugSimulation';
import { useManagement } from './hooks/useManagement';

import { 
  PerformanceView, 
  EdgeView, 
  LogsScreen, 
  SettingsView 
} from './components/SupportingViews';

function App() {
  const [isBooting, setIsBooting] = useState(true);
  const [activeView, setActiveView] = useState('guardian'); // guardian, management, logs, performance, edge, settings
  const [selectedUser, setSelectedUser] = useState(null);
  
  const { stabilityScore, riskLevel, logs, isPlaying } = useDebugSimulation();
  const { 
    users, 
    stats, 
    isAuthorized, 
    searchQuery, 
    setSearchQuery, 
    setIsAuthorized,
    giftPlus,
    giftTokens,
    deleteUser 
  } = useManagement();

  const handleUnlock = () => setIsAuthorized(true);

  const renderContent = () => {
    switch (activeView) {
      case 'guardian':
        return <GuardianWorkspace />;
      case 'management':
        return (
          <UserManagementView 
            users={users}
            selectedUser={selectedUser}
            onSelectUser={setSelectedUser}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            stats={stats}
          />
        );
      case 'logs':
        return <LogsScreen logs={logs} />;
      case 'performance':
        return <PerformanceView />;
      case 'edge':
        return <EdgeView />;
      case 'settings':
        return <SettingsView />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#030303] min-h-screen text-gray-200 selection:bg-neon-cyan/30">
      <AnimatePresence mode="wait">
        {isBooting ? (
          <LoadingSequence key="boot" onComplete={() => setIsBooting(false)} />
        ) : (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative"
          >
            {/* Global Lock - Appears when transitioning from management or session invalid */}
            {!isAuthorized && <MasterLockScreen onUnlock={handleUnlock} />}
            
            <Layout 
              activeView={activeView} 
              onViewChange={setActiveView}
              rightPanel={
                activeView === 'management'
                  ? <UserActionSuite user={selectedUser} actions={{ giftPlus, giftTokens, deleteUser }} />
                  : <DetailsPanel logs={logs} />
              }
            >
              <div className="animate-in fade-in duration-1000">
                {renderContent()}
              </div>
            </Layout>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
