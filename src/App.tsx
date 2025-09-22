import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AppProvider, useApp } from "./contexts/AppContext";
import { GlobalFilterProvider } from "./contexts/GlobalFilterContext";
import { useAuth } from "./hooks/useAuth";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { LoginScreen } from "./components/auth/LoginScreen";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { MultiFileUpload } from "./components/MultiFileUpload";
import { OverviewTab } from "./components/tabs/OverviewTab";
import { DataManagementTab } from "./components/data/DataManagementTab";
import { ExplorerTab } from "./components/tabs/ExplorerTab";
import { DatasetsTab } from "./components/tabs/DatasetsTab";
import { SettingsTab } from "./components/tabs/SettingsTab";
import { AlertCircle, CheckCircle, X } from "lucide-react";

function ExportStatusIndicator() {
  const { state, dispatch } = useApp();
  const { isExporting, exportSuccessMessage } = state;
  const [showSuccess, setShowSuccess] = useState(false);

  // Effect to manage the visibility and auto-hide of the success/error message
  useEffect(() => {
    if (exportSuccessMessage) {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
        // Allow time for fade-out animation before clearing the message from state
        setTimeout(() => {
          dispatch({ type: "SET_EXPORT_SUCCESS", payload: null });
        }, 400); // This should match the transition duration
      }, 3000); // Message visible for 3 seconds

      return () => clearTimeout(timer);
    }
  }, [exportSuccessMessage, dispatch]);

  // Render nothing if there is no activity
  if (!isExporting && !showSuccess) {
    return null;
  }

  // Loading Indicator
  if (isExporting) {
    return (
      <div className="fixed top-20 right-5 z-[100] w-full max-w-sm p-4 rounded-lg shadow-2xl border-l-4 bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900/50 dark:border-blue-500 dark:text-blue-200 transition-all duration-300 ease-in-out transform opacity-100 translate-x-0">
        <div className="flex items-center space-x-4">
          <div className="animate-spin h-6 w-6 border-2 border-current border-t-transparent rounded-full" />
          <div>
            <p className="font-bold">Exporting...</p>
            <p className="text-sm">Your file is being generated.</p>
          </div>
        </div>
      </div>
    );
  }

  // Success or Error Pop-up
  if (showSuccess && exportSuccessMessage) {
    const isSuccess = exportSuccessMessage.toLowerCase().includes("success");
    const successClasses =
      "bg-green-100 border-green-500 text-green-800 dark:bg-green-900/50 dark:border-green-500 dark:text-green-200";
    const errorClasses =
      "bg-red-100 border-red-500 text-red-800 dark:bg-red-900/50 dark:border-red-500 dark:text-red-200";
    const visibilityClasses = showSuccess
      ? "opacity-100 translate-x-0"
      : "opacity-0 translate-x-10";

    return (
      <div
        className={`fixed top-20 right-5 z-[100] w-full max-w-sm p-4 rounded-lg shadow-2xl border-l-4 transition-all duration-300 ease-in-out transform ${visibilityClasses} ${
          isSuccess ? successClasses : errorClasses
        }`}
      >
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {isSuccess ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <AlertCircle className="h-6 w-6 text-red-500" />
            )}
          </div>
          <div className="ml-3 flex-1">
            <p className="font-bold">{isSuccess ? "Success" : "Error"}</p>
            <p className="text-sm">{exportSuccessMessage}</p>
          </div>
          <button
            onClick={() => setShowSuccess(false)}
            className="ml-4 p-1 rounded-full hover:bg-black/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function DashboardContent() {
  const { state, setActiveTab } = useApp();
  const { user, isLoading: authLoading, role } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);

  // This effect sets the default tab based on the user's role after login.
  useEffect(() => {
    if (role && !state.activeTab) {
      if (role === "admin") {
        setActiveTab("overview");
      } else if (role === "operator") {
        setActiveTab("data-management");
      }
    }
  }, [role, state.activeTab, setActiveTab]);

  const handleSidebarToggle = () => {
    setSidebarCollapsed((prev) => {
      const newState = !prev;

      // Dispatch custom event for charts to listen to
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("sidebar-toggle", {
            detail: { collapsed: newState },
          })
        );
        // Also dispatch a resize event as fallback
        window.dispatchEvent(new Event("resize"));
      }, 300); // Match your CSS transition duration

      return newState;
    });
  };

  useEffect(() => {
    const handleOpenFileUpload = () => setShowFileUpload(true);
    window.addEventListener("openFileUpload", handleOpenFileUpload);
    return () =>
      window.removeEventListener("openFileUpload", handleOpenFileUpload);
  }, []);

  useEffect(() => {
    const handleDatabaseChange = (event: CustomEvent) => {
      console.log("Database change detected in App:", event.detail);
    };
    window.addEventListener(
      "supabase-data-changed",
      handleDatabaseChange as EventListener
    );
    return () => {
      window.removeEventListener(
        "supabase-data-changed",
        handleDatabaseChange as EventListener
      );
    };
  }, []);

  if (authLoading || (user && !role)) {
    return (
      <LoadingSpinner message="Initializing..." className="min-h-screen" />
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
    const filteredData = state.filteredData;
    let tabToRender = state.activeTab;

    if (role === "operator" && tabToRender === "overview") {
      setActiveTab("data-management");
      return <DataManagementTab />;
    }

    switch (tabToRender) {
      case "overview":
        return role === "admin" ? <OverviewTab data={filteredData} /> : null;
      case "data-management":
        return <DataManagementTab />;
      case "explorer":
        return <ExplorerTab data={filteredData} />;
      case "datasets":
        return <DatasetsTab />;
      case "settings":
        return <SettingsTab />;
      default:
        const defaultTab = role === "admin" ? "overview" : "data-management";
        setActiveTab(defaultTab);
        return null;
    }
  };

  if (showFileUpload) {
    const handleClose = () => setShowFileUpload(false);
    const handleContinue = () => {
      setShowFileUpload(false);
      setActiveTab(role === "admin" ? "overview" : "data-management");
    };
    return (
      <MultiFileUpload onClose={handleClose} onContinue={handleContinue} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <ExportStatusIndicator />
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={handleSidebarToggle}
        isMobileOpen={mobileSidebarOpen}
        onMobileToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />

      <div
        ref={mainContentRef}
        className={`transition-all duration-300 ${
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
        }`}
      >
        <Header
          onMobileMenuToggle={() => setMobileSidebarOpen(true)}
          onUploadNewDataset={() => setShowFileUpload(true)}
        />
        <main
          className="p-4 lg:p-6 transition-all duration-300"
          id="dashboard-content"
        >
          <div>{renderTabContent()}</div>
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
          <GlobalFilterProvider>
            <DashboardContent />
          </GlobalFilterProvider>
        </AppProvider>
      </Router>
    </ErrorBoundary>
  );
}
