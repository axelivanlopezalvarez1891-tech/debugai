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
import StoreView from './components/StoreView';
import { useDebugSimulation } from './hooks/useDebugSimulation';
import { useManagement } from './hooks/useManagement';

import AuthView from './components/AuthView';
import { 
  PerformanceView, 
  EdgeView, 
  LogsScreen, 
  SettingsView 
} from './components/SupportingViews';

function App() {
  const [isBooting, setIsBooting] = useState(true);
  const [activeView, setActiveView] = useState('guardian'); // guardian, management, settings, store
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  
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

  // Check for session on load
  useEffect(() => {
    const checkUser = async () => {
      try {
        const resp = await fetch('/api/auth/get-perfil');
        const data = await resp.json();
        if (data.ok) {
          setUser(data.user);
        }
      } catch (err) {
        console.error("Auth check failed");
      } finally {
        setLoadingUser(false);
      }
    };
    checkUser();
  }, []);

  const handleUnlock = () => setIsAuthorized(true);

  const renderContent = () => {
    // If we are in management view and not authorized, show the lock
    if (activeView === 'management' && !isAuthorized) {
      return <MasterLockScreen onUnlock={handleUnlock} />;
    }

    switch (activeView) {
      case 'guardian':
        return <GuardianWorkspace user={user} />;
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
      case 'settings':
        return <SettingsView user={user} onUpdate={setUser} />;
      case 'store':
        return <StoreView user={user} />;
      default:
        return <GuardianWorkspace user={user} />;
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
            <Layout 
              activeView={activeView} 
              onViewChange={setActiveView}
              user={user}
              rightPanel={
                activeView === 'management'
                  ? <UserActionSuite user={selectedUser} actions={{ giftPlus, giftTokens, deleteUser }} />
                  : null
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
