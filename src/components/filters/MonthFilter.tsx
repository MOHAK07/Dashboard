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
  availableMonths,
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
    if (selectedMonths.length === availableMonths.length) {
      onChange([]);
    } else {
      onChange([...availableMonths]);
    }
  };

  const isAllSelected = selectedMonths.length === availableMonths.length && availableMonths.length > 0;

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

      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={isLoading}
          className="input-field w-full flex items-center justify-between text-left"
        >
          <span className={selectedMonths.length === 0 ? 'text-gray-500 dark:text-gray-400' : ''}>
            {selectedMonths.length === 0 
              ? 'Select months...'
              : selectedMonths.length === 1
              ? selectedMonths[0]
              : `${selectedMonths.length} months selected`
            }
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {isDropdownOpen && (
          <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
            {/* Select All Option */}
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={handleSelectAll}
                className="w-full flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                  isAllSelected 
                    ? 'bg-primary-500 border-primary-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}>
                  {isAllSelected && <Check className="h-3 w-3 text-white" />}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select All ({availableMonths.length})
                </span>
              </button>
            </div>

            {/* Month Options */}
            <div className="p-1">
              {availableMonths.map(month => {
                const isSelected = selectedMonths.includes(month);
                const isAvailable = availableMonths.includes(month);
                
                return (
                  <button
                    key={month}
                    onClick={() => handleMonthToggle(month)}
                    disabled={!isAvailable}
                    className={`
                      w-full flex items-center space-x-2 p-2 rounded transition-colors
                      ${isSelected 
                        ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }
                      ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                      isSelected 
                        ? 'bg-primary-500 border-primary-500' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className="text-sm">{month}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {selectedMonths.length > 0 && (
        <div className="text-xs text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-lg p-2">
          <p>Selected: {selectedMonths.join(', ')}</p>
        </div>
      )}

      {availableMonths.length === 0 && (
        <div className="text-xs text-warning-600 dark:text-warning-400 bg-warning-50 dark:bg-warning-900/20 rounded-lg p-2">
          <p>No month data available in current dataset</p>
        </div>
      )}
    </div>
  );
}