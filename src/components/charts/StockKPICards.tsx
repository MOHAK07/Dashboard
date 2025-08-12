import React, { useMemo } from 'react';
import { Package, TrendingUp, TrendingDown } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { ColorManager } from '../../utils/colorManager';

interface StockKPICardsProps {
  className?: string;
}

export function StockKPICards({ className = '' }: StockKPICardsProps) {
  const { state } = useApp();

  // Calculate stock KPIs for both products
  const stockKPIs = useMemo(() => {
    // Find stock datasets
    const stockDatasets = state.datasets.filter(dataset => 
      state.activeDatasetIds.includes(dataset.id) && 
      ColorManager.isStockDataset(dataset.name)
    );

    if (stockDatasets.length === 0) {
      return { hasData: false, rcfStock: 0, boomiStock: 0 };
    }

    // Combine all stock data
    const allStockData = stockDatasets.flatMap(dataset => dataset.data);

    if (allStockData.length === 0) {
      return { hasData: false, rcfStock: 0, boomiStock: 0 };
    }

    // Find required columns (case-insensitive)
    const sampleRow = allStockData[0];
    const columns = Object.keys(sampleRow);
    
    const rcfStockColumn = columns.find(col => {
      const lowerCol = col.toLowerCase().trim();
      return lowerCol.includes('rcf') && lowerCol.includes('stock');
    });
    const boomiStockColumn = columns.find(col => {
      const lowerCol = col.toLowerCase().trim();
      return lowerCol.includes('boomi') && lowerCol.includes('stock');
    });

    console.log('Stock KPI - Column Detection:', {
      availableColumns: columns,
      rcfStockColumn,
      boomiStockColumn
    });

    if (!rcfStockColumn || !boomiStockColumn) {
      console.warn('Stock KPI - Missing required stock columns');
      return { hasData: false, rcfStock: 0, boomiStock: 0 };
    }

    // Parse Indian number format
    const parseIndianNumber = (value: string): number => {
      if (!value || value === '-' || value === '' || value.trim() === '') return 0;
      
      // Remove commas, quotes, and extra spaces, but keep decimal points
      const cleaned = value.replace(/[",\s]/g, '');
      const parsed = parseFloat(cleaned);
      
      return isNaN(parsed) ? 0 : parsed;
    };

    // Calculate total stock for each product
    let totalRCFStock = 0;
    let totalBoomiStock = 0;
    let validRowCount = 0;

    allStockData.forEach((row, index) => {
      const rcfStockRaw = String(row[rcfStockColumn] || '').trim();
      const boomiStockRaw = String(row[boomiStockColumn] || '').trim();
      
      const rcfStock = parseIndianNumber(rcfStockRaw);
      const boomiStock = parseIndianNumber(boomiStockRaw);
      
      console.log(`Stock KPI Row ${index + 1}: RCF Stock: ${rcfStockRaw} -> ${rcfStock}, Boomi Stock: ${boomiStockRaw} -> ${boomiStock}`);

      if (rcfStock >= 0 || boomiStock >= 0) {
        totalRCFStock += rcfStock;
        totalBoomiStock += boomiStock;
        validRowCount++;
      }
    });

    console.log('Stock KPI - Final Totals:', {
      totalRCFStock,
      totalBoomiStock,
      validRowCount
    });

    return {
      hasData: validRowCount > 0,
      rcfStock: Math.round(totalRCFStock * 100) / 100,
      boomiStock: Math.round(totalBoomiStock * 100) / 100
    };
  }, [state.datasets, state.activeDatasetIds]);

  if (!stockKPIs.hasData) {
    return null; // Don't render if no stock data
  }

  const formatStockAmount = (amount: number): string => {
    if (amount >= 10000000) { // 1 crore
      return `${(amount / 10000000).toFixed(2)}Cr`;
    } else if (amount >= 100000) { // 1 lakh
      return `${(amount / 100000).toFixed(2)}L`;
    } else if (amount >= 1000) { // 1 thousand
      return `${(amount / 1000).toFixed(2)}K`;
    }
    return amount.toFixed(0);
  };

  const getStockStatus = (amount: number) => {
    if (amount > 500000) return { status: 'High', color: 'success', icon: TrendingUp };
    if (amount > 100000) return { status: 'Medium', color: 'warning', icon: Package };
    return { status: 'Low', color: 'error', icon: TrendingDown };
  };

  const rcfStatus = getStockStatus(stockKPIs.rcfStock);
  const boomiStatus = getStockStatus(stockKPIs.boomiStock);

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 ${className}`}>
      {/* RCF Stock KPI */}
      <div className="card hover:shadow-md transition-all duration-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              RCF Total Stock Remaining
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {formatStockAmount(stockKPIs.rcfStock)}
            </p>
            
            <div className={`flex items-center space-x-1.5 mb-3 ${
              rcfStatus.color === 'success' ? 'text-success-600 dark:text-success-400' :
              rcfStatus.color === 'warning' ? 'text-warning-600 dark:text-warning-400' :
              'text-error-600 dark:text-error-400'
            }`}>
              <rcfStatus.icon className="h-4 w-4" />
              <span className="text-sm font-medium">
                {rcfStatus.status} Stock Level
              </span>
            </div>

            <div className="text-xs text-gray-600 dark:text-gray-400">
              <span>Raw Value: {stockKPIs.rcfStock.toLocaleString()} units</span>
            </div>
          </div>
          
          <div className={`p-3 rounded-lg ${
            rcfStatus.color === 'success' ? 'bg-success-100 dark:bg-success-900/50' :
            rcfStatus.color === 'warning' ? 'bg-warning-100 dark:bg-warning-900/50' :
            'bg-error-100 dark:bg-error-900/50'
          }`}>
            <Package className={`h-6 w-6 ${
              rcfStatus.color === 'success' ? 'text-success-600 dark:text-success-400' :
              rcfStatus.color === 'warning' ? 'text-warning-600 dark:text-warning-400' :
              'text-error-600 dark:text-error-400'
            }`} />
          </div>
        </div>
      </div>

      {/* Boomi Samrudhi Stock KPI */}
      <div className="card hover:shadow-md transition-all duration-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Boomi Samrudhi Total Stock Remaining
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {formatStockAmount(stockKPIs.boomiStock)}
            </p>
            
            <div className={`flex items-center space-x-1.5 mb-3 ${
              boomiStatus.color === 'success' ? 'text-success-600 dark:text-success-400' :
              boomiStatus.color === 'warning' ? 'text-warning-600 dark:text-warning-400' :
              'text-error-600 dark:text-error-400'
            }`}>
              <boomiStatus.icon className="h-4 w-4" />
              <span className="text-sm font-medium">
                {boomiStatus.status} Stock Level
              </span>
            </div>

            <div className="text-xs text-gray-600 dark:text-gray-400">
              <span>Raw Value: {stockKPIs.boomiStock.toLocaleString()} units</span>
            </div>
          </div>
          
          <div className={`p-3 rounded-lg ${
            boomiStatus.color === 'success' ? 'bg-success-100 dark:bg-success-900/50' :
            boomiStatus.color === 'warning' ? 'bg-warning-100 dark:bg-warning-900/50' :
            'bg-error-100 dark:bg-error-900/50'
          }`}>
            <Package className={`h-6 w-6 ${
              boomiStatus.color === 'success' ? 'text-success-600 dark:text-success-400' :
              boomiStatus.color === 'warning' ? 'text-warning-600 dark:text-warning-400' :
              'text-error-600 dark:text-error-400'
            }`} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default StockKPICards;
