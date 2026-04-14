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
import LandingStage from './components/LandingStage';
import GuardianWorkspace from './components/GuardianWorkspace';
import StoreView from './components/StoreView';
import UserManagementView from './components/UserManagementView';
import AuthView from './components/AuthView';
import ChatHub from './components/ChatHub';
import { SettingsView } from './components/SupportingViews';
import { useManagement } from './hooks/useManagement';
function App() {
  const [isBooting, setIsBooting] = useState(true);
  const [activeView, setActiveView] = useState('chat'); // chat, management, settings, store
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  
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
      case 'chat':
        return <ChatHub user={user} />;
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
        return <ChatHub user={user} />;
    }
  };

  // If we are still booting or checking user, show nothing or boot sequence
  if (isBooting) {
    return (
      <div className="bg-[#030303] min-h-screen text-gray-200">
        <LoadingSequence onComplete={() => setIsBooting(false)} />
      </div>
    );
  }

  // If no user and not booting, show LandingStage
  if (!user && !loadingUser) {
    return (
      <>
        <LandingStage onAction={() => setShowAuth(true)} />
        <AnimatePresence>
          {showAuth && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md px-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative w-full max-w-lg"
              >
                <button 
                  onClick={() => setShowAuth(false)}
                  className="absolute -top-12 right-0 text-white/50 hover:text-white font-bold text-xs uppercase tracking-widest"
                >
                  Cerrar
                </button>
                <AuthView onLogin={(user) => {
                  setUser(user);
                  setShowAuth(false);
                }} />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="bg-[#030303] min-h-screen text-gray-200 selection:bg-[#fbbf24]/30">
      <AnimatePresence mode="wait">
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
      </AnimatePresence>
    </div>
  );
}

export default App;
