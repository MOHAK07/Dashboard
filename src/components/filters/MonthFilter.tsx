import React, { useState } from 'react';
import { Clock, X, ChevronDown, Check } from 'lucide-react';
import { MONTHS } from '../../types/filters';

interface MonthFilterProps {
  selectedMonths: string[];
  availableMonths: string[];
  onChange: (selectedMonths: string[]) => void;
  onReset: () => void;
  isLoading?: boolean;
}

export function MonthFilter({
  selectedMonths,
  availableMonths, // This will always be all 12 months now
  onChange,
  onReset,
  isLoading = false
}: MonthFilterProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const hasSelection = selectedMonths.length > 0;

  const handleMonthToggle = (month: string) => {
    if (selectedMonths.includes(month)) {
      onChange(selectedMonths.filter(m => m !== month));
    } else {
      onChange([...selectedMonths, month]);
    }
  };

  const handleSelectAll = () => {
    if (selectedMonths.length === 12) {
      onChange([]);
    } else {
      onChange([...availableMonths]);
    }
  };

  const isAllSelected = selectedMonths.length === 12;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Months</h4>
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

      {/* Select All Option */}
      <div className="mb-4">
        <button
          onClick={handleSelectAll}
          className="w-full flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
            isAllSelected 
              ? 'bg-primary-500 border-primary-500' 
              : 'border-gray-300 dark:border-gray-600'
          }`}>
            {isAllSelected && <Check className="h-4 w-4 text-white" />}
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Select All Months
          </span>
        </button>
      </div>

      {/* Month Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {availableMonths.map(month => {
          const isSelected = selectedMonths.includes(month);
          
          return (
            <button
              key={month}
              onClick={() => handleMonthToggle(month)}
              disabled={isLoading}
              className={`
                flex items-center space-x-2 p-3 border-2 rounded-lg transition-all duration-200
                ${isSelected 
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300' 
                  : 'border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                isSelected 
                  ? 'bg-primary-500 border-primary-500' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}>
                {isSelected && <Check className="h-3 w-3 text-white" />}
              </div>
              <span className="text-sm font-medium">{month}</span>
            </button>
          );
        })}
      </div>

      {selectedMonths.length > 0 && (
        <div className="text-xs text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-lg p-2">
          <p>Selected: {selectedMonths.join(', ')}</p>
        </div>
      )}
    </div>
  );
}