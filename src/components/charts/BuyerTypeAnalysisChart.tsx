import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'react-apexcharts'; 
import { useApp } from '../../contexts/AppContext';
import { ChartContainer } from './ChartContainer';
import { DataProcessor } from '../../utils/dataProcessing';
import { ColorManager } from '../../utils/colorManager';
import { FlexibleDataRow } from '../../types';

interface BuyerTypeData {
  buyerType: string;
  totalSales: number;
  totalQuantity: number;
  count: number;
  averagePrice: number;
}

export function BuyerTypeAnalysisChart() {
  const { state } = useApp();
  
  // Check if FOM dataset is active and get its color
  const fomDataInfo = useMemo(() => {
    const activeDatasets = state.datasets.filter(d => state.activeDatasetIds.includes(d.id));
    const fomDataset = activeDatasets.find(dataset => 
      dataset.name.toLowerCase().includes('fom') ||
      dataset.fileName.toLowerCase().includes('fom') ||
      // Check if dataset has the characteristic FOM columns
      (dataset.detectedColumns?.includes('Buyer Type') && 
       dataset.detectedColumns?.includes('Price') &&
       dataset.detectedColumns?.includes('Name'))
    );
    
    return fomDataset ? {
      data: fomDataset.data,
      color: fomDataset.color || ColorManager.getDatasetColor(fomDataset.name),
      name: fomDataset.name
    } : null;
  }, [state.datasets, state.activeDatasetIds]);

  const buyerTypeAnalysis = useMemo((): BuyerTypeData[] => {
    if (!fomDataInfo || fomDataInfo.data.length === 0) return [];

    const fomData = fomDataInfo.data;

    // Find the buyer type column (case insensitive and flexible matching)
    const buyerTypeColumn = Object.keys(fomData[0] || {}).find(col => {
      const lowerCol = col.toLowerCase().replace(/\s+/g, '');
      return lowerCol.includes('buyer') && lowerCol.includes('type');
    });
    
    // Find the price column (case insensitive)
    const priceColumn = Object.keys(fomData[0] || {}).find(col => 
      col.toLowerCase() === 'price' || col.toLowerCase().includes('price')
    );

    // Find the quantity column (case insensitive)
    const quantityColumn = Object.keys(fomData[0] || {}).find(col => 
      col.toLowerCase() === 'quantity' || col.toLowerCase().includes('quantity')
    );

    if (!buyerTypeColumn || !priceColumn || !quantityColumn) {
      console.log('Missing columns:', { buyerTypeColumn, priceColumn, quantityColumn });
      console.log('Available columns:', Object.keys(fomData[0] || {}));
      return [];
    }

    // Group data by buyer type with improved parsing
    const buyerTypeMap = new Map<string, { total: number; totalQuantity: number; count: number; prices: number[] }>();

    fomData.forEach((row: FlexibleDataRow, index: number) => {
      const buyerTypeRaw = row[buyerTypeColumn];
      const priceRaw = row[priceColumn];
      const quantityRaw = row[quantityColumn];

      // More robust buyer type parsing
      let buyerType = String(buyerTypeRaw || '').toUpperCase().trim();
      
      // Handle common variations
      if (buyerType === 'B2B' || buyerType === 'B-2-B' || buyerType === 'B 2 B') {
        buyerType = 'B2B';
      } else if (buyerType === 'B2C' || buyerType === 'B-2-C' || buyerType === 'B 2 C') {
        buyerType = 'B2C';
      }

      // More robust price parsing
      let price = 0;
      if (typeof priceRaw === 'number') {
        price = priceRaw;
      } else if (typeof priceRaw === 'string') {
        // Remove currency symbols and commas, then parse
        const cleanPrice = priceRaw.replace(/[₹,$\s]/g, '');
        price = parseFloat(cleanPrice) || 0;
      }

      // More robust quantity parsing
      let quantity = 0;
      if (typeof quantityRaw === 'number') {
        quantity = quantityRaw;
      } else if (typeof quantityRaw === 'string') {
        quantity = parseFloat(quantityRaw) || 0;
      }

      // Only include valid entries
      if (buyerType && (buyerType === 'B2B' || buyerType === 'B2C') && price > 0 && quantity > 0) {
        if (!buyerTypeMap.has(buyerType)) {
          buyerTypeMap.set(buyerType, { total: 0, totalQuantity: 0, count: 0, prices: [] });
        }

        const data = buyerTypeMap.get(buyerType)!;
        data.total += price;
        data.totalQuantity += quantity;
        data.count += 1;
        data.prices.push(price);
      } else if (buyerType && (buyerType === 'B2B' || buyerType === 'B2C')) {
        // Log rows with valid buyer type but invalid price/quantity for debugging
        console.log(`Row ${index + 1}: Valid buyer type (${buyerType}) but invalid price (${priceRaw}) or quantity (${quantityRaw})`);
      }
    });

    console.log('Parsed buyer type data:', Array.from(buyerTypeMap.entries()));

    // Convert to array format for chart
    return Array.from(buyerTypeMap.entries()).map(([buyerType, data]) => ({
      buyerType,
      totalSales: data.total,
      totalQuantity: data.totalQuantity,
      count: data.count,
      averagePrice: data.total / data.count,
    })).sort((a, b) => b.totalSales - a.totalSales);
  }, [fomDataInfo]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {`Buyer Type: ${label}`}
          </p>
          <div className="space-y-1 text-sm">
            <p className="text-blue-600 dark:text-blue-400">
              <span className="font-medium">Total Sales:</span> {DataProcessor.formatCurrency(data.totalSales, state.settings.currency)}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-medium">Total Quantity:</span> {DataProcessor.formatNumber(data.totalQuantity)} metric ton
            </p>
            {/* <p className="text-gray-600 dark:text-gray-400">
              <span className="font-medium">Number of Orders:</span> {DataProcessor.formatNumber(data.count)}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <span className="font-medium">Average Price:</span> {DataProcessor.formatCurrency(data.averagePrice, state.settings.currency)}
            </p> */}
          </div>
        </div>
      );
    }
    return null;
  };

  // Don't render if no FOM data
  if (!fomDataInfo || buyerTypeAnalysis.length === 0) {
    return null;
  }

  const datasetColor = fomDataInfo.color;

  return (
    <ChartContainer 
      title={`Sales Analysis by Buyer Type (B2B vs B2C) - ${fomDataInfo.name}`}
      className="col-span-1 lg:col-span-2"
    >
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={buyerTypeAnalysis}
            margin={{
              top: 20,
              right: 30,
              left: 80, // Increased left margin to prevent Y-axis cutoff
              bottom: 60,
            }}
            barCategoryGap="40%" // Reduced bar thickness
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={state.settings.theme === 'dark' ? '#374151' : '#e5e7eb'} 
            />
            <XAxis 
              dataKey="buyerType" 
              tick={{ 
                fill: state.settings.theme === 'dark' ? '#9ca3af' : '#6b7280',
                fontSize: 12
              }}
              tickLine={{ stroke: state.settings.theme === 'dark' ? '#4b5563' : '#9ca3af' }}
              axisLine={{ stroke: state.settings.theme === 'dark' ? '#4b5563' : '#9ca3af' }}
              angle={0}
              textAnchor="middle"
            />
            <YAxis 
              tick={{ 
                fill: state.settings.theme === 'dark' ? '#9ca3af' : '#6b7280',
                fontSize: 11
              }}
              tickLine={{ stroke: state.settings.theme === 'dark' ? '#4b5563' : '#9ca3af' }}
              axisLine={{ stroke: state.settings.theme === 'dark' ? '#4b5563' : '#9ca3af' }}
              tickFormatter={(value) => {
                // Format large numbers more compactly
                if (value >= 10000000) {
                  return `₹${(value / 10000000).toFixed(1)}Cr`;
                } else if (value >= 100000) {
                  return `₹${(value / 100000).toFixed(1)}L`;
                } else if (value >= 1000) {
                  return `₹${(value / 1000).toFixed(0)}K`;
                } else {
                  return `₹${value}`;
                }
              }}
              width={70} // Fixed width for Y-axis
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="totalSales" 
              fill={datasetColor}
              radius={[4, 4, 0, 0]}
              stroke={datasetColor}
              strokeWidth={1}
              maxBarSize={120} // Limit bar width
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Summary Statistics */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {buyerTypeAnalysis.map((data, index) => (
          <div key={data.buyerType} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="text-center">
              <div 
                className="w-4 h-4 rounded-full mx-auto mb-2"
                style={{ backgroundColor: datasetColor }}
              ></div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                {data.buyerType}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                {DataProcessor.formatCurrency(data.totalSales, state.settings.currency)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {DataProcessor.formatNumber(data.totalQuantity)} metric ton
              </p>
              {/* <p className="text-xs text-gray-500 dark:text-gray-500">
                Avg: {DataProcessor.formatCurrency(data.averagePrice, state.settings.currency)}
              </p> */}
            </div>
          </div>
        ))}
        
        {/* Total Summary */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-800">
          <div className="text-center">
            <div 
              className="w-4 h-4 rounded-full mx-auto mb-2"
              style={{ backgroundColor: datasetColor }}
            ></div>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
              Total Sales
            </p>
            <p className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-1">
              {DataProcessor.formatCurrency(
                buyerTypeAnalysis.reduce((sum, data) => sum + data.totalSales, 0),
                state.settings.currency
              )}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              {buyerTypeAnalysis.reduce((sum, data) => sum + data.totalQuantity, 0)} metric ton
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              From {fomDataInfo.data.length} total records
            </p>
          </div>
        </div>
      </div>
    </ChartContainer>
  );
}