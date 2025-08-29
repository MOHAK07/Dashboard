import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import { useAuth } from './hooks/useAuth';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingSpinner } from './components/LoadingSpinner';
import { LoginScreen } from './components/auth/LoginScreen';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MultiFileUpload } from './components/MultiFileUpload';
import { OverviewTab } from './components/tabs/OverviewTab';
import { DataManagementTab } from './components/data/DataManagementTab';
import { ExplorerTab } from './components/tabs/ExplorerTab';
import { DatasetsTab } from './components/tabs/DatasetsTab';
import { SettingsTab } from './components/tabs/SettingsTab';
import { WelcomeScreen } from './components/WelcomeScreen';

function DashboardContent() {
  // Hooks must come first, before any return
  const { state, setActiveTab } = useApp();
  const { user, userProfile, isLoading: authLoading, canAccessDashboard } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);

  // Listen for file upload events from the datasets tab
  useEffect(() => {
    const handleOpenFileUpload = () => setShowFileUpload(true);
    window.addEventListener('openFileUpload', handleOpenFileUpload);
    return () => window.removeEventListener('openFileUpload', handleOpenFileUpload);
  }, []);

  // Listen for database changes (from realtime subscriptions)
  useEffect(() => {
    const handleDatabaseChange = (event: CustomEvent) => {
      console.log('Database change detected in App:', event.detail);
      // UI feedback if needed
    };
    window.addEventListener('supabase-data-changed', handleDatabaseChange as EventListener);
    return () => {
      window.removeEventListener('supabase-data-changed', handleDatabaseChange as EventListener);
    };
  }, []);

  // Now you can safely return early based on loading state
  if (authLoading) {
    return (
      <LoadingSpinner
        message="Checking authentication..."
        className="min-h-screen"
      />
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (state.isLoading && state.datasets.length === 0) {
    return (
      <LoadingSpinner
        message="Connecting to database..."
        type="database"
        className="min-h-screen"
      />
    );
  }

  const renderTabContent = () => {
    if (state.datasets.length === 0 && !showFileUpload) {
      return <WelcomeScreen onFileUpload={() => setShowFileUpload(true)} />;
    }

    const filteredData = state.filteredData;
    switch (state.activeTab) {
      case 'overview':
        // Check if user can access dashboard overview
        if (!canAccessDashboard()) {
          return (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <p className="text-lg font-medium">Access Restricted</p>
                <p className="text-sm mt-2">Dashboard overview is only available to administrators</p>
                <p className="text-xs mt-1 text-gray-400">Current role: {userProfile?.role || 'Unknown'}</p>
              </div>
            </div>
          );
        }
        return <OverviewTab data={filteredData} />;
      case 'data-management':
        return <DataManagementTab />;
      case 'explorer':
        return <ExplorerTab data={filteredData} />;
      case 'datasets':
        return <DatasetsTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        // Default to data-management for operators, overview for admins
        const defaultTab = canAccessDashboard() ? 'overview' : 'data-management';
        setActiveTab(defaultTab);
        return defaultTab === 'overview' ? <OverviewTab data={filteredData} /> : <DataManagementTab />;
    }
  };

  // Early return for welcome screen
  if (state.datasets.length === 0 && !showFileUpload) {
    return <WelcomeScreen onFileUpload={() => setShowFileUpload(true)} />;
  }

  // Early return for file upload modal
  if (showFileUpload) {
    const handleClose = () => setShowFileUpload(false);
    const handleContinue = () => {
      setShowFileUpload(false);
      setActiveTab('overview');
    };
    return <MultiFileUpload onClose={handleClose} onContinue={handleContinue} />;
  }

  // Main dashboard render
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={mobileSidebarOpen}
        onMobileToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />

      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <Header
          onMobileMenuToggle={() => setMobileSidebarOpen(true)}
          onUploadNewDataset={() => setShowFileUpload(true)}
        />
        <main className="p-4 lg:p-6 transition-all duration-300" id="dashboard-content">
          <div className="max-w-7xl mx-auto">{renderTabContent()}</div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppProvider>
          <DashboardContent />
        </AppProvider>
      </Router>
    </ErrorBoundary>
  );
}
