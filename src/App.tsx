import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { X } from 'lucide-react';
import { AppProvider, useApp } from './contexts/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MultiFileUpload } from './components/MultiFileUpload';
import { OverviewTab } from './components/tabs/OverviewTab';
import { ComparisonTab } from './components/tabs/ComparisonTab';
import { DeepDiveTab } from './components/tabs/DeepDiveTab';
import { ExplorerTab } from './components/tabs/ExplorerTab';
import { DatasetsTab } from './components/tabs/DatasetsTab';
import { SettingsTab } from './components/tabs/SettingsTab';
import { DataRow } from './types';
import { WelcomeScreen } from './components/WelcomeScreen';

function DashboardContent() {
  const { state, setActiveTab, loadSampleData } = useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);

  // Listen for file upload events from the datasets tab
  useEffect(() => {
    const handleOpenFileUpload = () => setShowFileUpload(true);
    window.addEventListener('openFileUpload', handleOpenFileUpload);
    return () => window.removeEventListener('openFileUpload', handleOpenFileUpload);
  }, []);

  const renderTabContent = () => {
    // Show welcome screen only if no datasets are loaded
    if (state.datasets.length === 0 && !showFileUpload) {
      return (
        <WelcomeScreen 
          onFileUpload={() => setShowFileUpload(true)}
        />
      );
    }

    const filteredData = state.filteredData;

    switch (state.activeTab) {
      case 'overview':
        return <OverviewTab data={filteredData} />;
      case 'comparison':
        return <ComparisonTab data={filteredData} />;
      case 'deepdive':
        return <DeepDiveTab data={filteredData} />;
      case 'explorer':
        return <ExplorerTab data={filteredData} />;
      case 'datasets':
        return <DatasetsTab />;
      case 'settings':
        return <SettingsTab />;
      default:
    // Switch to overview tab after upload
    setActiveTab('overview');
  };

  // Show welcome screen when no datasets are loaded and not uploading
  if (state.datasets.length === 0 && !showFileUpload) {
    return (
      <WelcomeScreen 
        onFileUpload={() => setShowFileUpload(true)}
      />
    );
  }

  // Show file upload modal
  if (showFileUpload) {
    const handleClose = () => setShowFileUpload(false);
    const handleContinue = () => {
      setShowFileUpload(false);
      // Switch to datasets tab after upload
      setActiveTab('datasets');
    };
    
    return (
      <MultiFileUpload 
        onClose={handleClose}
        onContinue={handleContinue}
      />
    );
  }

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
        <main className={`p-4 lg:p-6 transition-all duration-300`} id="dashboard-content">
          <div className="max-w-7xl mx-auto">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <Router>
        <DashboardContent />
      </Router>
    </AppProvider>
  );
}

export default App;