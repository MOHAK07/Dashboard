import React from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { Database } from 'lucide-react';
import { FlexibleDataRow } from '../../types';
import { DataProcessor } from '../../utils/dataProcessing';
import { ChartContainer } from '../charts/ChartContainer';
import { useApp } from '../../contexts/AppContext';

interface DeepDiveTabProps {
  data: FlexibleDataRow[];
}

export function DeepDiveTab({ data }: DeepDiveTabProps) {
  const { state, getMultiDatasetData } = useApp();
  const isDarkMode = state.settings.theme === 'dark';
  const multiDatasetData = getMultiDatasetData();
  const isMultiDataset = multiDatasetData.length > 1;
  
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-lg font-medium">No data available</p>
          <p className="text-sm">Upload data to view detailed analysis</p>
        </div>
      </div>
    );
  }

  // Enhanced data processing for multi-dataset deep dive
  const processDeepDiveData = () => {
    const categoricalColumns = DataProcessor.findCategoricalColumns(data);
    const numericColumns = DataProcessor.findNumericColumns(data);
    
    const primaryCategoryColumn = categoricalColumns.find(col =>
      col.toLowerCase().includes('name') ||
      col.toLowerCase().includes('product') ||
      col.toLowerCase().includes('category')
    ) || categoricalColumns[0];

    const primaryValueColumn = numericColumns.find(col => 
      col.toLowerCase().includes('price') || 
      col.toLowerCase().includes('revenue') ||
      col.toLowerCase().includes('quantity') ||
      col.toLowerCase().includes('amount')
    ) || numericColumns[0];

    if (!primaryCategoryColumn || !primaryValueColumn) {
      return null;
    }

    if (isMultiDataset) {
      // Multi-dataset deep dive analysis
      const datasetAnalysis = multiDatasetData.map(dataset => {
        const aggregatedData = DataProcessor.aggregateByCategory(dataset.data, primaryCategoryColumn, primaryValueColumn);
        return {
          ...dataset,
          aggregatedData,
          topPerformer: aggregatedData[0] || null,
          mostFrequent: aggregatedData.sort((a, b) => b.count - a.count)[0] || null,
          highestAverage: aggregatedData.sort((a, b) => b.average - a.average)[0] || null
        };
      });

      return {
        primaryCategoryColumn,
        primaryValueColumn,
        aggregatedData: DataProcessor.aggregateByCategory(data, primaryCategoryColumn, primaryValueColumn),
        datasetAnalysis
      };
    } else {
      // Single dataset analysis
      const aggregatedData = DataProcessor.aggregateByCategory(data, primaryCategoryColumn, primaryValueColumn);
      return {
        primaryCategoryColumn,
        primaryValueColumn,
        aggregatedData,
        datasetAnalysis: []
      };
    }
  };

  const deepDiveData = processDeepDiveData();

  if (!deepDiveData) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-lg font-medium">Insufficient data for deep dive</p>
          <p className="text-sm">Need both categorical and numeric columns</p>
        </div>
      </div>
    );
  }

  const { primaryCategoryColumn, primaryValueColumn, aggregatedData, datasetAnalysis } = deepDiveData;

  // Treemap Data
  const treemapOptions: ApexOptions = {
    chart: {
      type: 'treemap',
      background: 'transparent',
      toolbar: { show: false }
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '12px',
        fontWeight: 'bold',
        colors: ['#ffffff'],
      },
      formatter: (text: string, opts: any) => {
        const value = opts.value;
        return [text, DataProcessor.formatCurrency(value, state.settings.currency)];
      },
    },
    colors: isMultiDataset ? multiDatasetData.map(d => d.color) : [
      '#3b82f6', '#22c55e', '#f97316', '#ef4444', '#8b5cf6', 
      '#06b6d4', '#f59e0b', '#ec4899', '#84cc16', '#6366f1'
    ],
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
      y: {
        formatter: (val: number) => DataProcessor.formatCurrency(val, state.settings.currency),
      },
    },
    plotOptions: {
      treemap: {
        distributed: true,
        enableShades: false,
      },
    },
    legend: isMultiDataset ? {
      show: true,
      position: 'bottom',
      labels: {
        colors: isDarkMode ? '#9ca3af' : '#6b7280',
      },
    } : { show: false },
  };

  const treemapSeries = isMultiDataset ? 
    multiDatasetData.map(dataset => ({
      name: dataset.datasetName,
      data: DataProcessor.aggregateByCategory(dataset.data, primaryCategoryColumn, primaryValueColumn)
        .slice(0, 8)
        .map(item => ({
          x: item.name,
          y: item.total,
        })),
    })) :
    [{
      data: aggregatedData.map(item => ({
        x: item.name,
        y: item.total,
      })),
    }];

  // Scatter Plot Data
  const scatterOptions: ApexOptions = {
    chart: {
      type: 'scatter',
      zoom: {
        enabled: true,
        type: 'xy',
      },
      background: 'transparent',
      toolbar: { show: false }
    },
    xaxis: {
      title: {
        text: 'Count',
        style: {
          color: isDarkMode ? '#9ca3af' : '#6b7280',
        },
      },
      labels: {
        formatter: (val: number) => DataProcessor.formatNumber(val),
        style: {
          colors: isDarkMode ? '#9ca3af' : '#6b7280',
        },
      },
    },
    yaxis: {
      title: {
        text: 'Total Value',
        style: {
          color: isDarkMode ? '#9ca3af' : '#6b7280',
        },
      },
      labels: {
        formatter: (val: number) => DataProcessor.formatCurrency(val, state.settings.currency),
        style: {
          colors: isDarkMode ? '#9ca3af' : '#6b7280',
        },
      },
    },
    colors: isMultiDataset ? multiDatasetData.map(d => d.color) : ['#3b82f6'],
    theme: {
      mode: isDarkMode ? 'dark' : 'light',
    },
    grid: {
      borderColor: isDarkMode ? '#374151' : '#e5e7eb',
    },
    legend: isMultiDataset ? {
      show: true,
      position: 'top',
      labels: {
        colors: isDarkMode ? '#9ca3af' : '#6b7280',
      },
    } : { show: false },
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
      shared: isMultiDataset,
      intersect: false,
      custom: isMultiDataset ? undefined : ({ dataPointIndex }: any) => {
        if (dataPointIndex >= 0 && dataPointIndex < aggregatedData.length) {
          const item = aggregatedData[dataPointIndex];
          return `
            <div class="p-3">
              <div class="font-semibold">${item.name}</div>
              <div>Count: ${DataProcessor.formatNumber(item.count)}</div>
              <div>Total: ${DataProcessor.formatCurrency(item.total, state.settings.currency)}</div>
              <div>Average: ${DataProcessor.formatCurrency(item.average, state.settings.currency)}</div>
            </div>
          `;
        }
        return '';
      },
    },
  };

  const scatterSeries = isMultiDataset ?
    multiDatasetData.map(dataset => ({
      name: dataset.datasetName,
      data: DataProcessor.aggregateByCategory(dataset.data, primaryCategoryColumn, primaryValueColumn)
        .map(item => ({
          x: item.count,
          y: item.total,
        })),
    })) :
    [{
      name: primaryCategoryColumn,
      data: aggregatedData.map(item => ({
        x: item.count,
        y: item.total,
      })),
    }];

  return (
    <div className="space-y-8">
      {/* Multi-dataset indicator */}
      {isMultiDataset && (
        <div className="card bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-800 rounded-lg">
              <Database className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-900 dark:text-primary-100">
                Multi-Dataset Deep Dive
              </h3>
              <p className="text-sm text-primary-700 dark:text-primary-300">
                Analyzing performance across {multiDatasetData.length} datasets
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {multiDatasetData.map((dataset) => (
              <div key={dataset.datasetId} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: dataset.color }}
                />
                <span className="text-sm text-primary-700 dark:text-primary-300">
                  {dataset.datasetName}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Summary */}
      {isMultiDataset ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {datasetAnalysis.map((dataset) => (
            <div key={dataset.datasetId} className="card">
              <div className="flex items-center space-x-2 mb-4">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: dataset.color }}
                />
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  {dataset.datasetName}
                </h4>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Top by Value</p>
                  <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                    {dataset.topPerformer?.name || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {DataProcessor.formatCurrency(dataset.topPerformer?.total || 0, state.settings.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Most Frequent</p>
                  <p className="text-sm font-bold text-secondary-600 dark:text-secondary-400">
                    {dataset.mostFrequent?.name || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {DataProcessor.formatNumber(dataset.mostFrequent?.count || 0)} records
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Highest Average</p>
                  <p className="text-sm font-bold text-accent-600 dark:text-accent-400">
                    {dataset.highestAverage?.name || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {DataProcessor.formatCurrency(dataset.highestAverage?.average || 0, state.settings.currency)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Top {primaryCategoryColumn} by Value
            </h4>
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {aggregatedData[0]?.name || 'N/A'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {DataProcessor.formatCurrency(aggregatedData[0]?.total || 0, state.settings.currency)}
            </p>
          </div>
          
          <div className="card">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Most Frequent {primaryCategoryColumn}
            </h4>
            <p className="text-2xl font-bold text-secondary-600 dark:text-secondary-400">
              {aggregatedData.sort((a, b) => b.count - a.count)[0]?.name || 'N/A'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {DataProcessor.formatNumber(aggregatedData.sort((a, b) => b.count - a.count)[0]?.count || 0)} records
            </p>
          </div>
          
          <div className="card">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Highest Average Value
            </h4>
            <p className="text-2xl font-bold text-accent-600 dark:text-accent-400">
              {aggregatedData.sort((a, b) => b.average - a.average)[0]?.name || 'N/A'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {DataProcessor.formatCurrency(aggregatedData.sort((a, b) => b.average - a.average)[0]?.average || 0, state.settings.currency)}
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="space-y-8">
        <ChartContainer title={`${primaryValueColumn} Distribution (Treemap)${isMultiDataset ? ' - Dataset Comparison' : ''}`} className="w-full">
          <Chart
            options={treemapOptions}
            series={treemapSeries}
            type="treemap"
            height="100%"
          />
        </ChartContainer>

        <ChartContainer title={`Count vs Value Correlation${isMultiDataset ? ' - Dataset Comparison' : ''}`} className="w-full">
          <Chart
            options={scatterOptions}
            series={scatterSeries}
            type="scatter"
            height="100%"
          />
        </ChartContainer>
      </div>
    </div>
  );
}