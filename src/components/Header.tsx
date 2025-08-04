import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, 
  Sun, 
  Moon, 
  Calendar,
  Filter,
  Download,
  Search,
  Bell,
  User,
  Upload
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { DataProcessor } from '../utils/dataProcessing';
import { ExportUtils } from '../utils/exportUtils';
import { SavedFilters } from './SavedFilters';

interface HeaderProps {
  onMobileMenuToggle: () => void;
  onUploadNewDataset: () => void;
}

export function Header({ onMobileMenuToggle, onDatasetLibraryToggle, onUploadNewDataset }: HeaderProps) {
  const { state, setFilters, setSettings, toggleDatasetLibrary } = useApp();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const uploadMenuRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Click-away logic for menus
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showUploadMenu && uploadMenuRef.current && !uploadMenuRef.current.contains(event.target as Node)) {
        setShowUploadMenu(false);
      }
      if (showFilterMenu && filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setShowFilterMenu(false);
      }
      if (showExportMenu && exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUploadMenu, showFilterMenu, showExportMenu]);

  const uniqueProducts = state.data.length > 0 ? DataProcessor.getUniqueValues(state.data, 'ProductName') : [];
  const dateRange = state.data.length > 0 ? DataProcessor.getDateRange(state.data) : { start: '', end: '' };

  const toggleTheme = () => {
    const newTheme = state.settings.theme === 'light' ? 'dark' : 'light';
    const newSettings = { ...state.settings, theme: newTheme };
    setSettings(newSettings);
  };

  const handleDateRangeChange = (start: string, end: string) => {
    setFilters({
      ...state.filters,
      dateRange: { start, end }
    });
  };

  const handleProductChange = (products: string[]) => {
    setFilters({
      ...state.filters,
      selectedProducts: products
    });
  };

  const handleExport = async (format: 'pdf' | 'png' | 'csv' | 'json') => {
    try {
      await ExportUtils.exportDashboard(
        {
          format,
          includeCharts: format === 'pdf' || format === 'png',
          includeData: format === 'csv' || format === 'json',
        },
        state.filteredData,
        state.settings.currency
      );
      setShowExportMenu(false);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <header className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 lg:px-6 transition-all duration-300`}>
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMobileMenuToggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="hidden sm:block">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Analytics Dashboard
            </h2>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* Upload Menu */}
          <div className="relative" ref={uploadMenuRef}>
            <button
              onClick={() => setShowUploadMenu(!showUploadMenu)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              title="Upload datasets"
            >
              <Upload className="h-5 w-5" />
            </button>

            {showUploadMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="py-2">
                  <button
                    onClick={() => {
                      setShowUploadMenu(false);
                      onUploadNewDataset();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Upload New Dataset
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Saved Filters */}
          {state.data.length > 0 && (
            <SavedFilters />
          )}

          {/* Global Filters */}
          {state.data.length > 0 && (
            <div className="relative" ref={filterMenuRef}>
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Open filters"
              >
                <Filter className="h-5 w-5" />
              </button>

              {showFilterMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="p-4 space-y-4">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">Global Filters</h3>
                    
                    {/* Date Range */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Date Range
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={state.filters.dateRange.start}
                          min={dateRange.start}
                          max={dateRange.end}
                          onChange={(e) => handleDateRangeChange(e.target.value, state.filters.dateRange.end)}
                          className="input-field text-sm"
                        />
                        <input
                          type="date"
                          value={state.filters.dateRange.end}
                          min={dateRange.start}
                          max={dateRange.end}
                          onChange={(e) => handleDateRangeChange(state.filters.dateRange.start, e.target.value)}
                          className="input-field text-sm"
                        />
                      </div>
                    </div>

                    {/* Product Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Products
                      </label>
                      <select
                        multiple
                        value={state.filters.selectedProducts}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, option => option.value);
                          handleProductChange(selected);
                        }}
                        className="input-field text-sm h-24"
                      >
                        {uniqueProducts.map(product => (
                          <option key={product} value={product}>
                            {product}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                    </div>

                    <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => {
                          setFilters({
                            dateRange: { start: '', end: '' },
                            selectedProducts: [],
                            selectedPlants: [],
                            selectedFactories: [],
                            drillDownFilters: {},
                          });
                        }}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                      >
                        Clear All
                      </button>
                      <button
                        onClick={() => setShowFilterMenu(false)}
                        className="btn-primary text-sm"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Export Menu */}
          {state.data.length > 0 && (
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Export options"
              >
                <Download className="h-5 w-5" />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="py-2">
                    <button
                      onClick={() => handleExport('pdf')}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Export as PDF
                    </button>
                    <button
                      onClick={() => handleExport('png')}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Export as PNG
                    </button>
                    <button
                      onClick={() => handleExport('csv')}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Export Data (CSV)
                    </button>
                    <button
                      onClick={() => handleExport('json')}
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
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label={`Switch to ${state.settings.theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {state.settings.theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {state.data.length > 0 && (
        state.filters.dateRange.start || 
        state.filters.dateRange.end || 
        state.filters.selectedProducts.length > 0
      ) && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 px-2 py-1">
              Active Filters:
            </span>
            
            {state.filters.dateRange.start && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300">
                {state.filters.dateRange.start} - {state.filters.dateRange.end || 'ongoing'}
              </span>
            )}
            
            {state.filters.selectedProducts.map(product => (
              <span
                key={product}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary-100 dark:bg-secondary-900/50 text-secondary-700 dark:text-secondary-300"
              >
                {product}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Active Dataset Indicator */}
      {state.activeDatasetIds.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Active Dataset{state.activeDatasetIds.length > 1 ? 's' : ''}:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {state.datasets
                .filter(d => state.activeDatasetIds.includes(d.id))
                .map(dataset => (
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