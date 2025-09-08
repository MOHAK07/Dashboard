import React from 'react';
import { Calendar, X } from 'lucide-react';

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  minDate?: string;
  maxDate?: string;
  onChange: (startDate: string, endDate: string) => void;
  onReset: () => void;
  isLoading?: boolean;
}

export function DateRangeFilter({
  startDate,
  endDate,
  minDate,
  maxDate,
  onChange,
  onReset,
  isLoading = false
}: DateRangeFilterProps) {
  const hasSelection = startDate || endDate;

  const handleStartDateChange = (value: string) => {
    onChange(value, endDate);
  };

  const handleEndDateChange = (value: string) => {
    onChange(startDate, value);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Date Range</h4>
        </div>
        {hasSelection && (
          <button
            onClick={onReset}
            className="text-sm text-error-600 dark:text-error-400 hover:text-error-700 dark:hover:text-error-300 transition-colors flex items-center space-x-1"
          >
            <X className="h-3 w-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            From Date
          </label>
          <input
            type="date"
            value={startDate}
            min={minDate}
            max={maxDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            disabled={isLoading}
            className="input-field w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            To Date
          </label>
          <input
            type="date"
            value={endDate}
            min={startDate || minDate}
            max={maxDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            disabled={isLoading}
            className="input-field w-full"
          />
        </div>
      </div>

      {minDate && maxDate && (
        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
          <p>Available range: {minDate} to {maxDate}</p>
        </div>
      )}

      {startDate && endDate && (
        <div className="text-xs text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-lg p-2">
          <p>Selected: {startDate} to {endDate}</p>
          <p>Duration: {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} days</p>
        </div>
      )}
    </div>
  );
}