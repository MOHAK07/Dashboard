import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { X } from 'lucide-react';
import { AppProvider, useApp } from './contexts/AppContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MultiFileUpload } from './components/MultiFileUpload';
import { DatasetLibrary } from './components/DatasetLibrary';
import { OverviewTab } from './components/tabs/OverviewTab';
import { ComparisonTab } from './components/tabs/ComparisonTab';
import { DeepDiveTab } from './components/tabs/DeepDiveTab';
import { ExplorerTab } from './components/tabs/ExplorerTab';
import { SettingsTab } from './components/tabs/SettingsTab';
import { DataRow } from './types';
import { WelcomeScreen } from './components/WelcomeScreen';

function DashboardContent() {
  const { state, addDataset, toggleDatasetLibrary } = useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);

  // Check if this is the first visit
  useEffect(() => {
    // Auto-load sample data if no data is present and not explicitly loaded
    if (state.data.length === 0 && !state.sampleDataLoaded) {
      // Show welcome screen
    }
  }, [state.data.length, state.sampleDataLoaded]);


  const renderTabContent = () => {
    if (state.data.length === 0) {
      return <WelcomeScreen onFileUpload={() => setShowFileUpload(true)} />;
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
      case 'settings':
        return <SettingsTab />;
      default:
        return <OverviewTab data={filteredData} />;
    }
  };

  // Show welcome screen when no data is loaded
  if (state.data.length === 0 && !showFileUpload) {
    return <WelcomeScreen onFileUpload={() => setShowFileUpload(true)} />;
  }

  // Show file upload modal
  if (showFileUpload) {
    // Add a prop to distinguish between close and continue actions
    const handleClose = () => setShowFileUpload(false); // Only close modal, show WelcomeScreen
    const handleContinue = () => {
      setShowFileUpload(false);
      // Optionally, you could set a flag to skip WelcomeScreen if needed
      // For now, closing modal will show dashboard if data is present
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

      {/* Dataset Library overlays the dashboard, positioned next to the sidebar */}
      <div className={`fixed top-0 left-0 h-full z-40 transition-all duration-300 pointer-events-none`}> 
        <div className={`transition-all duration-300 pointer-events-auto ${state.datasetLibraryOpen ? (sidebarCollapsed ? 'ml-16 w-80' : 'ml-64 w-80') : 'w-0 ml-0 overflow-hidden'}`}> 
          <DatasetLibrary 
            isOpen={state.datasetLibraryOpen} 
            onToggle={toggleDatasetLibrary}
            sidebarCollapsed={sidebarCollapsed}
          />
        </div>
      </div>

      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <Header 
          onMobileMenuToggle={() => setMobileSidebarOpen(true)}
          onDatasetLibraryToggle={toggleDatasetLibrary}
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