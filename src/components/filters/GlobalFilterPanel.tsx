import React, { useState, useRef, useEffect } from 'react';
import { Filter, X, Calendar, Clock, Users, ChevronDown } from 'lucide-react';
import { GlobalFilters, MONTHS, BUYER_TYPES } from '../../types/filters';
import { DateRangeFilter } from './DateRangeFilter';
import { MonthFilter } from './MonthFilter';
import { BuyerTypeFilter } from './BuyerTypeFilter';

interface GlobalFilterPanelProps {
  filters: GlobalFilters;
  availableOptions: {
    dateRange: { min: string; max: string };
    months: string[];
    buyerTypes: ('B2B' | 'B2C')[];
  };
  onFiltersChange: (filters: Partial<GlobalFilters>) => void;
  onClearFilters: () => void;
  onResetFilter: (filterType: keyof GlobalFilters) => void;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

export function GlobalFilterPanel({
  filters,
  availableOptions,
  onFiltersChange,
  onClearFilters,
  onResetFilter,
  isLoading = false,
  error = null,
  className = ''
}: GlobalFilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'date' | 'month' | 'buyer'>('date');
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const hasActiveFilters = 
    filters.dateRange.startDate || 
    filters.dateRange.endDate ||
    filters.months.selectedMonths.length > 0 ||
    filters.buyerTypes.selectedTypes.length > 0;

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.dateRange.startDate || filters.dateRange.endDate) count++;
    if (filters.months.selectedMonths.length > 0) count++;
    if (filters.buyerTypes.selectedTypes.length > 0) count++;
    return count;
  };

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    onFiltersChange({
      dateRange: { startDate, endDate }
    });
  };

  const handleMonthChange = (selectedMonths: string[]) => {
    onFiltersChange({
      months: { selectedMonths }
    });
  };

  const handleBuyerTypeChange = (selectedTypes: ('B2B' | 'B2C')[]) => {
    onFiltersChange({
      buyerTypes: { selectedTypes }
    });
  };

  const tabs = [
    { id: 'date' as const, label: 'Date Range', icon: Calendar },
    { id: 'month' as const, label: 'Months', icon: Clock },
    { id: 'buyer' as const, label: 'Buyer Type', icon: Users }
  ];

  return (
    <div className={`relative ${className}`} ref={panelRef}>
      {/* Filter Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500
          ${hasActiveFilters 
            ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 shadow-sm' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        disabled={isLoading}
        aria-label="Open global filters"
        title={`Global Filters${hasActiveFilters ? ` (${getActiveFilterCount()} active)` : ''}`}
      >
        <div className="relative">
          <Filter className="h-5 w-5" />
          {hasActiveFilters && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-bold">{getActiveFilterCount()}</span>
            </div>
          )}
        </div>
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Global Filters</span>
              </h3>
              <div className="flex items-center space-x-2">
                {hasActiveFilters && (
                  <button
                    onClick={onClearFilters}
                    className="text-sm text-error-600 dark:text-error-400 hover:text-error-700 dark:hover:text-error-300 transition-colors"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-error-50 dark:bg-error-900/20 border-b border-error-200 dark:border-error-700">
              <p className="text-sm text-error-700 dark:text-error-300">{error}</p>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 border-b-2 border-primary-500' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Filter Content */}
          <div className="p-4 max-h-80 overflow-y-auto">
            {activeTab === 'date' && (
              <DateRangeFilter
                startDate={filters.dateRange.startDate}
                endDate={filters.dateRange.endDate}
                minDate={availableOptions.dateRange.min}
                maxDate={availableOptions.dateRange.max}
                onChange={handleDateRangeChange}
                onReset={() => onResetFilter('dateRange')}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'month' && (
              <MonthFilter
                selectedMonths={filters.months.selectedMonths}
                availableMonths={availableOptions.months}
                onChange={handleMonthChange}
                onReset={() => onResetFilter('months')}
                isLoading={isLoading}
              />
            )}

            {activeTab === 'buyer' && (
              <BuyerTypeFilter
                selectedTypes={filters.buyerTypes.selectedTypes}
                availableTypes={availableOptions.buyerTypes}
                onChange={handleBuyerTypeChange}
                onReset={() => onResetFilter('buyerTypes')}
                isLoading={isLoading}
              />
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {hasActiveFilters ? `${getActiveFilterCount()} filter${getActiveFilterCount() > 1 ? 's' : ''} active` : 'No filters applied'}
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="btn-primary text-sm"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}