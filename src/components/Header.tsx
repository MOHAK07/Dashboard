import React, { useState, useEffect, useRef } from "react";
import {
  Menu,
  Sun,
  Moon,
  Download,
  Filter,
  User,
} from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { ExportUtils } from "../utils/exportUtils";
import { DatabaseSyncIndicator } from "./DatabaseSyncIndicator";
import { GlobalFilterDialog } from "./filters/GlobalFilterDialog";
import { ActiveFiltersDisplay } from "./filters/ActiveFiltersDisplay";
import { SavedFilters } from "./SavedFilters";
import { useGlobalFilterContext } from "../contexts/GlobalFilterContext";
import { useAuth } from "../hooks/useAuth";
// @ts-ignore
import logoDark from "../assets/TrualtLogo2.png";
// @ts-ignore
import logoLight from "../assets/TrualtLogo.png";

interface HeaderProps {
  onMobileMenuToggle: () => void;
  onUploadNewDataset: () => void;
}

export function Header({
  onMobileMenuToggle,
  onUploadNewDataset,
}: HeaderProps) {
  const { state, setSettings } = useApp();
  const {
    filterState,
    updateFilters,
    clearFilters,
    resetFilter,
    hasActiveFilters
  } = useGlobalFilterContext();
  const { user, signOut } = useAuth();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showGlobalFilters, setShowGlobalFilters] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Click-away logic for menus
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        showExportMenu &&
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setShowExportMenu(false);
      }
      if (
        showUserMenu &&
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showExportMenu, showUserMenu]);

  const toggleTheme = () => {
    const newTheme = state.settings.theme === "light" ? "dark" : "light";
    const newSettings = {
      ...state.settings,
      theme: newTheme as "light" | "dark" | "system",
    };
    setSettings(newSettings);
  };

  const handleExport = async (format: "pdf" | "png" | "csv" | "json") => {
    try {
      await ExportUtils.exportDashboard(
        {
          format,
          includeCharts: format === "pdf" || format === "png",
          includeData: format === "csv" || format === "json",
        },
        state.filteredData,
        state.settings.currency
      );
      setShowExportMenu(false);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  return (
    <header
      className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 lg:px-6 transition-all duration-300`}
    >
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMobileMenuToggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden focus:outline-none"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo and Title */}
          <div className="hidden lg:flex items-center space-x-3">
            <img
              src={state.settings.theme === "dark" ? logoDark : logoLight}
              alt="Company Logo"
              className="h-10 w-auto"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-2 lg:space-x-2">
          {/* Database Sync Indicator */}
          <DatabaseSyncIndicator />

          {/* Saved Filters */}
          {state.data.length > 0 && <SavedFilters />}

          {/* Global Filters */}
          {state.data.length > 0 && (
            <>
              <button
                onClick={() => setShowGlobalFilters(true)}
                className={`
                  p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500
                  ${hasActiveFilters 
                    ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 shadow-sm' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }
                `}
                title="Open Global Filters"
              >
                <div className="relative">
                  <Filter className="h-5 w-5" />
                  {hasActiveFilters && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">
                        {(filterState.filters.dateRange.startDate ? 1 : 0) +
                         filterState.filters.months.selectedMonths.length > 0 ? 1 : 0 +
                         filterState.filters.buyerTypes.selectedTypes.length > 0 ? 1 : 0}
                      </span>
                    </div>
                  )}
                </div>
              </button>

              <GlobalFilterDialog
                isOpen={showGlobalFilters}
                onClose={() => setShowGlobalFilters(false)}
                filters={filterState.filters}
                availableOptions={filterState.availableOptions}
                onFiltersChange={updateFilters}
                onClearFilters={clearFilters}
                onResetFilter={resetFilter}
                isLoading={filterState.isLoading}
                error={filterState.error}
              />
            </>
          )}

          {/* Export Menu */}
          {state.data.length > 0 && (
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none"
                aria-label="Export options"
              >
                <Download className="h-5 w-5" />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="py-2">
                    <button
                      onClick={() => handleExport("pdf")}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Export as PDF
                    </button>
                    <button
                      onClick={() => handleExport("png")}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Export as PNG
                    </button>
                    <button
                      onClick={() => handleExport("csv")}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Export Data (CSV)
                    </button>
                    <button
                      onClick={() => handleExport("json")}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Export Data (JSON)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none"
            aria-label={`Switch to ${
              state.settings.theme === "light" ? "dark" : "light"
            } theme`}
          >
            {state.settings.theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </button>

          {/* User Menu */}
          {user && (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none"
                title="User menu"
              >
                <User className="h-5 w-5" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Signed in as
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>
                  <div className="py-2">
                    <button
                      onClick={() => {
                        signOut();
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {state.data.length > 0 && hasActiveFilters && (
        <ActiveFiltersDisplay
          filters={filterState.filters}
          onRemoveFilter={resetFilter}
          onClearAll={clearFilters}
          className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
        />
      )}

      {/* Active Dataset Indicator */}
      {state.activeDatasetIds.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Active Dataset{state.activeDatasetIds.length > 1 ? "s" : ""}:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {state.datasets
                .filter((d) => state.activeDatasetIds.includes(d.id))
                .map((dataset) => (
                  <div key={dataset.id} className="flex items-center space-x-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: dataset.color }}
                    />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {dataset.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({dataset.rowCount.toLocaleString()} rows)
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
