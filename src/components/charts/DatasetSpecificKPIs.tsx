import React from 'react';
import { TrendingUp, Database, BarChart3, Package } from 'lucide-react';
import { FlexibleDataRow } from '../../types';
import { useApp } from '../../contexts/AppContext';

// Use the same color function for consistency
const getUniqueDatasetColor = (datasetIndex: number, totalDatasets: number) => {
  const baseColors = [
    '#3b82f6', // blue
    '#7ab839', // green
    '#f97316', // orange
    '#ef4444', // red
    '#1A2885', // dark blue
    '#06b6d4', // cyan
    '#f59e0b', // amber
    '#dc2626', // red variant
    '#84cc16', // lime
    '#059669', // emerald
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange variant
    '#6366f1', // indigo
  ];
  
  return baseColors[datasetIndex % baseColors.length];
};

interface DatasetSpecificKPIsProps {
  className?: string;
}

export function DatasetSpecificKPIs({ className = '' }: DatasetSpecificKPIsProps) {
  const { state } = useApp();

  // Calculate exact quantity totals for each dataset
  const calculateDatasetKPIs = () => {
    const datasetKPIs = state.datasets.map((dataset, index) => {
      // Find quantity column (exact match, case insensitive)
      const quantityColumn = Object.keys(dataset.data[0] || {}).find(col => 
        col.toLowerCase() === 'quantity'
      );

      let totalQuantity = 0;
      if (quantityColumn) {
        totalQuantity = dataset.data.reduce((sum, row) => {
          const quantity = parseFloat(String(row[quantityColumn] || '0')) || 0;
          return sum + quantity;
        }, 0);
      }

      // Determine dataset type based on name
      let displayName = dataset.name;
      if (dataset.name.toLowerCase().includes('lfom') && !dataset.name.toLowerCase().includes('pos')) {
        displayName = 'LFOM Sales';
      } else if (dataset.name.toLowerCase().includes('fom') && !dataset.name.toLowerCase().includes('pos') && !dataset.name.toLowerCase().includes('lfom')) {
        displayName = 'FOM Sales';
      } else if (dataset.name.toLowerCase().includes('pos') && dataset.name.toLowerCase().includes('fom')) {
        displayName = 'POS FOM Sales';
      } else if (dataset.name.toLowerCase().includes('pos') && dataset.name.toLowerCase().includes('lfom')) {
        displayName = 'POS LFOM Sales';
      } else {
        displayName = `${dataset.name} Sales`;
      }

      return {
        id: dataset.id,
        name: displayName,
        totalQuantity: Math.round(totalQuantity * 100) / 100, // Round to 2 decimal places
        rowCount: dataset.rowCount,
        isActive: state.activeDatasetIds.includes(dataset.id),
        color: getUniqueDatasetColor(index, state.datasets.length),
        hasQuantityData: !!quantityColumn
      };
    });

    return datasetKPIs;
  };

  const datasetKPIs = calculateDatasetKPIs();

  // If no datasets, show placeholder
  if (datasetKPIs.length === 0) {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
        {['FOM Sales', 'LFOM Sales', 'POS FOM Sales', 'POS LFOM Sales'].map((name, index) => (
          <div key={name} className="card opacity-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {name}
                </p>
                <p className="text-2xl font-bold text-gray-400 dark:text-gray-500 mb-1">
                  No Data
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Upload {name.split(' ')[0]} dataset
                </p>
              </div>
              
              <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                <Package className="h-6 w-6 text-gray-400" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {datasetKPIs.map((dataset) => (
        <div
          key={dataset.id}
          className={`card transition-all duration-200 ${
            dataset.isActive 
              ? 'ring-2 ring-opacity-50 shadow-md' 
              : 'opacity-75 hover:opacity-100'
          }`}
          style={{ 
            ringColor: dataset.isActive ? dataset.color : 'transparent'
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: dataset.color }}
                />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {dataset.name}
                </p>
              </div>
              
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {dataset.hasQuantityData ? (
                  dataset.totalQuantity.toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2
                  })
                ) : (
                  'No Quantity Data'
                )}
              </p>
              
              <div className="flex items-center space-x-2 text-xs">
                <span className={`${dataset.isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {dataset.isActive ? '● Active' : '○ Inactive'}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  {dataset.rowCount.toLocaleString()} rows
                </span>
              </div>
            </div>
            
            <div 
              className="p-3 rounded-lg"
              style={{ 
                backgroundColor: `${dataset.color}20`,
                color: dataset.color
              }}
            >
              <BarChart3 className="h-6 w-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}