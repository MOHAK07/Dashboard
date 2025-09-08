import React from 'react';
import { X, Calendar, Clock, Users } from 'lucide-react';
import { GlobalFilters } from '../../types/filters';

interface ActiveFiltersDisplayProps {
  filters: GlobalFilters;
  onRemoveFilter: (filterType: keyof GlobalFilters) => void;
  onClearAll: () => void;
  className?: string;
}

export function ActiveFiltersDisplay({
  filters,
  onRemoveFilter,
  onClearAll,
  className = ''
}: ActiveFiltersDisplayProps) {
  const activeFilters = [];

  // Date range filter
  if (filters.dateRange.startDate || filters.dateRange.endDate) {
    activeFilters.push({
      type: 'dateRange' as const,
      label: 'Date Range',
      value: `${filters.dateRange.startDate || 'Start'} - ${filters.dateRange.endDate || 'End'}`,
      icon: Calendar
    });
  }

  // Month filter
  if (filters.months.selectedMonths.length > 0) {
    const monthsText = filters.months.selectedMonths.length === 1
      ? filters.months.selectedMonths[0]
      : `${filters.months.selectedMonths.length} months`;
    
    activeFilters.push({
      type: 'months' as const,
      label: 'Months',
      value: monthsText,
      icon: Clock
    });
  }

  // Buyer type filter
  if (filters.buyerTypes.selectedTypes.length > 0) {
    const typesText = filters.buyerTypes.selectedTypes.join(', ');
    
    activeFilters.push({
      type: 'buyerTypes' as const,
      label: 'Buyer Type',
      value: typesText,
      icon: Users
    });
  }

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className={`bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
            Active Filters:
          </span>
          
          {activeFilters.map((filter) => {
            const Icon = filter.icon;
            return (
              <div
                key={filter.type}
                className="inline-flex items-center space-x-2 bg-white dark:bg-gray-800 border border-primary-300 dark:border-primary-600 rounded-full px-3 py-1 text-sm"
              >
                <Icon className="h-3 w-3 text-primary-600 dark:text-primary-400" />
                <span className="font-medium text-primary-700 dark:text-primary-300">
                  {filter.label}:
                </span>
                <span className="text-primary-600 dark:text-primary-400">
                  {filter.value}
                </span>
                <button
                  onClick={() => onRemoveFilter(filter.type)}
                  className="ml-1 p-0.5 hover:bg-primary-100 dark:hover:bg-primary-800 rounded-full transition-colors"
                  title={`Remove ${filter.label} filter`}
                >
                  <X className="h-3 w-3 text-primary-500 dark:text-primary-400" />
                </button>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClearAll}
          className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors flex items-center space-x-1 font-medium"
        >
          <X className="h-4 w-4" />
          <span>Clear All</span>
        </button>
      </div>
    </div>
  );
}