import React, { useState, useEffect } from 'react';
import { Filter, X, Calendar, Clock, Users, RotateCcw } from 'lucide-react';
import { GlobalFilters } from '../../types/filters';
import { DateRangeFilter } from './DateRangeFilter';
import { MonthFilter } from './MonthFilter';
import { BuyerTypeFilter } from './BuyerTypeFilter';

interface GlobalFilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
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
}

export function GlobalFilterDialog({
  isOpen,
  onClose,
  filters,
  availableOptions,
  onFiltersChange,
  onClearFilters,
  onResetFilter,
  isLoading = false,
  error = null,
}: GlobalFilterDialogProps) {
  const [activeTab, setActiveTab] = useState<'date' | 'month' | 'buyer'>('date');

  // Close dialog on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/50 rounded-lg">
                <Filter className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Global Filters
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Apply filters across all dashboard components
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {hasActiveFilters && (
                <button
                  onClick={onClearFilters}
                  className="flex items-center space-x-2 text-sm text-error-600 dark:text-error-400 hover:text-error-700 dark:hover:text-error-300 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Clear All</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                  {getActiveFilterCount()} filter{getActiveFilterCount() > 1 ? 's' : ''} active
                </span>
                <div className="flex flex-wrap gap-1">
                  {filters.dateRange.startDate && (
                    <span className="text-xs bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 px-2 py-1 rounded">
                      Date Range
                    </span>
                  )}
                  {filters.months.selectedMonths.length > 0 && (
                    <span className="text-xs bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 px-2 py-1 rounded">
                      {filters.months.selectedMonths.length} Month{filters.months.selectedMonths.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {filters.buyerTypes.selectedTypes.length > 0 && (
                    <span className="text-xs bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 px-2 py-1 rounded">
                      {filters.buyerTypes.selectedTypes.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-error-50 dark:bg-error-900/20 border-b border-error-200 dark:border-error-700">
            <p className="text-sm text-error-700 dark:text-error-300">{error}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 flex items-center justify-center space-x-2 py-4 px-6 text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 border-b-2 border-primary-500' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filter Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'date' && (
            <DateRangeFilter
              startDate={filters.dateRange.startDate}
              endDate={filters.dateRange.endDate}
              minDate={availableOptions.dateRange.start}
              maxDate={availableOptions.dateRange.end}
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
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {hasActiveFilters ? (
                <span>
                  {getActiveFilterCount()} filter{getActiveFilterCount() > 1 ? 's' : ''} will be applied to all dashboard components
                </span>
              ) : (
                <span>No filters applied - showing all data</span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={onClose}
                className="btn-primary"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}