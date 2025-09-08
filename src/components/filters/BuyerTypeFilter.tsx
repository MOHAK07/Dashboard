import React from 'react';
import { Users, X, Check } from 'lucide-react';

interface BuyerTypeFilterProps {
  selectedTypes: ('B2B' | 'B2C')[];
  availableTypes: ('B2B' | 'B2C')[];
  onChange: (selectedTypes: ('B2B' | 'B2C')[]) => void;
  onReset: () => void;
  isLoading?: boolean;
}

export function BuyerTypeFilter({
  selectedTypes,
  availableTypes, // This parameter is now ignored - we always show both B2B and B2C
  onChange,
  onReset,
  isLoading = false
}: BuyerTypeFilterProps) {
  const hasSelection = selectedTypes.length > 0;

  // Always show both buyer types regardless of data
  const allBuyerTypes: ('B2B' | 'B2C')[] = ['B2B', 'B2C'];

  const handleTypeToggle = (type: 'B2B' | 'B2C') => {
    if (selectedTypes.includes(type)) {
      onChange(selectedTypes.filter(t => t !== type));
    } else {
      onChange([...selectedTypes, type]);
    }
  };

  const buyerTypeInfo = {
    'B2B': {
      label: 'Business to Business',
      description: 'Sales to other businesses and enterprises',
      color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300'
    },
    'B2C': {
      label: 'Business to Consumer',
      description: 'Direct sales to individual consumers',
      color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300'
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-primary-600 dark:text-primary-400" />
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Buyer Type</h4>
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
        {allBuyerTypes.map(type => {
          const isSelected = selectedTypes.includes(type);
          const info = buyerTypeInfo[type];
          
          return (
            <button
              key={type}
              onClick={() => handleTypeToggle(type)}
              disabled={isLoading}
              className={`
                w-full p-4 border-2 rounded-lg transition-all duration-200 text-left
                ${isSelected 
                  ? `${info.color} border-current` 
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                }
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                      isSelected 
                        ? 'bg-current border-current' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {isSelected && <Check className="h-4 w-4 text-white" />}
                    </div>
                    <span className="font-bold text-lg">{type}</span>
                  </div>
                  <p className="text-sm font-medium mb-1">{info.label}</p>
                  <p className="text-xs opacity-75">{info.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedTypes.length > 0 && (
        <div className="text-xs text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3">
          <p className="font-medium mb-1">Selected Types ({selectedTypes.length}):</p>
          <p>{selectedTypes.join(', ')}</p>
        </div>
      )}

      {selectedTypes.length === 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <p>No buyer types selected - showing data for all buyer types</p>
        </div>
      )}
    </div>
  );
}