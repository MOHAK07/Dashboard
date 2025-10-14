import React, { useState, useEffect, useRef } from "react";
import { Menu, Sun, Moon, Download, Filter, User } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { ExportUtils } from "../utils/exportUtils";
import { DatabaseSyncIndicator } from "./DatabaseSyncIndicator";
import { GlobalFilterDialog } from "./filters/GlobalFilterDialog";
import { ActiveFiltersDisplay } from "./filters/ActiveFiltersDisplay";
import { SavedFilters } from "./SavedFilters";
import { useGlobalFilterContext } from "../contexts/GlobalFilterContext";
import { useAuth } from "../hooks/useAuth";
import { UpdateStatus } from "./UpdateStatus";
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
  const { state, dispatch, setSettings } = useApp();
  const {
    filterState,
    updateFilters,
    clearFilters,
    resetFilter,
    hasActiveFilters,
  } = useGlobalFilterContext();
  const { user, signOut } = useAuth();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showGlobalFilters, setShowGlobalFilters] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

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
    setShowExportMenu(false);
    dispatch({ type: "SET_EXPORTING", payload: true });
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
      dispatch({
        type: "SET_EXPORT_SUCCESS",
        payload: `Export to ${format.toUpperCase()} successful!`,
      });
    } catch (error) {
      console.error("Export failed:", error);
      dispatch({
        type: "SET_EXPORT_SUCCESS",
        payload: `Export to ${format.toUpperCase()} failed.`,
      });
    } finally {
      dispatch({ type: "SET_EXPORTING", payload: false });
      setTimeout(
        () => dispatch({ type: "SET_EXPORT_SUCCESS", payload: null }),
        3000
      );
    }
  };

  // Calculate active filter count for display
  const getActiveFilterCount = () => {
    let count = 0;
    if (
      filterState.filters.dateRange.startDate ||
      filterState.filters.dateRange.endDate
    )
      count++;
    if (filterState.filters.months.selectedMonths.length > 0) count++;
    if (filterState.filters.buyerTypes.selectedTypes.length > 0) count++;
    return count;
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-4 py-2 sm:py-3 lg:px-6 transition-all duration-300">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onMobileMenuToggle}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden focus:outline-none"
            aria-label="Open sidebar"
          >
            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {/* Logo and Title */}
          <div className="hidden md:flex lg:flex items-center space-x-3">
            <img
              src={state.settings.theme === "dark" ? logoDark : logoLight}
              alt="Company Logo"
              className="h-8 sm:h-9 md:h-10 w-auto"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
          {/* UpdateStatus - Show inline on larger screens */}
          <div className="hidden xl:block">
            <UpdateStatus />
          </div>

          {/* Database Sync Indicator */}
          <DatabaseSyncIndicator />

          {/* Saved Filters */}
          {state.data.length > 0 && (
            <div className="hidden sm:block">
              <SavedFilters />
            </div>
          )}

          {/* Global Filters Button */}
          {state.data.length > 0 && (
            <button
              onClick={() => setShowGlobalFilters(true)}
              className={`
                relative p-1.5 sm:p-2 rounded-lg transition-all duration-200 focus:outline-none
                ${
                  hasActiveFilters
                    ? "bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 shadow-sm"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                }
              `}
              title="Global Filters"
            >
              <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
              {hasActiveFilters && (
                <div className="absolute -top-0.5 sm:-top-1 -right-0.5 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">
                    {getActiveFilterCount()}
                  </span>
                </div>
              )}
            </button>
          )}

          {/* Export Menu */}
          {state.data.length > 0 && (
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none"
                aria-label="Export options"
              >
                <Download className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-44 sm:w-48 md:w-52 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="py-2">
                    <button
                      onClick={() => handleExport("pdf")}
                      className="w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Export as PDF
                    </button>
                    <button
                      onClick={() => handleExport("png")}
                      className="w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Export as PNG
                    </button>
                    <button
                      onClick={() => handleExport("csv")}
                      className="w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Export Data (CSV)
                    </button>
                    <button
                      onClick={() => handleExport("json")}
                      className="w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
            className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none"
            aria-label={`Switch to ${
              state.settings.theme === "light" ? "dark" : "light"
            } theme`}
          >
            {state.settings.theme === "light" ? (
              <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </button>

          {/* User Menu */}
          {user && (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none"
                title="User menu"
              >
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 sm:w-64 md:w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                      Signed in as
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate max-w-full">
                      {user.email}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* UpdateStatus - Show on separate line for smaller screens */}
      <div className="xl:hidden mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <UpdateStatus />
      </div>

      {/* Active Filters Display */}
      {state.data.length > 0 && hasActiveFilters && (
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700">
          <ActiveFiltersDisplay
            filters={filterState.filters}
            onRemoveFilter={resetFilter}
            onClearAll={clearFilters}
            className=""
          />
        </div>
      )}

      {/* Active Dataset Indicator */}
      {state.activeDatasetIds.length > 0 && (
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex-shrink-0">
              Active Dataset{state.activeDatasetIds.length > 1 ? "s" : ""}:
            </span>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {state.datasets
                .filter((d) => state.activeDatasetIds.includes(d.id))
                .map((dataset) => (
                  <div
                    key={dataset.id}
                    className="flex items-center space-x-1.5 sm:space-x-2 min-w-0"
                  >
                    <div
                      className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: dataset.color }}
                    />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                      {dataset.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                      ({dataset.rowCount.toLocaleString()} rows)
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Global Filter Dialog */}
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
    </header>
  );
}
