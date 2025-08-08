import React, { useState } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { Database } from 'lucide-react';
import { FlexibleDataRow } from '../../types';
import { DataProcessor } from '../../utils/dataProcessing';
import { ChartContainer } from '../charts/ChartContainer';
import { useApp } from '../../contexts/AppContext';

interface ComparisonTabProps {
  data: FlexibleDataRow[];
}

export function ComparisonTab({ data }: ComparisonTabProps) {
  const { state, getMultiDatasetData } = useApp();
  const isDarkMode = state.settings.theme === 'dark';
  const multiDatasetData = getMultiDatasetData();
  const isMultiDataset = multiDatasetData.length > 1;

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-lg font-medium">No data available</p>
          <p className="text-sm">Upload data to view comparisons</p>
        </div>
      </div>
    );
  }

  // Enhanced data processing for multi-dataset comparison
  const processComparisonData = () => {
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
      // Multi-dataset comparison
      const allCategories = new Set<string>();
      const datasetSeries: any[] = [];

      // Collect all categories across datasets
      multiDatasetData.forEach(dataset => {
        const aggregatedData = DataProcessor.aggregateByCategory(dataset.data, primaryCategoryColumn, primaryValueColumn);
        aggregatedData.forEach(item => allCategories.add(item.name));
      });

      const sortedCategories = Array.from(allCategories).sort().slice(0, 10);

      // Create series for each dataset
      multiDatasetData.forEach((dataset) => {
        const aggregatedData = DataProcessor.aggregateByCategory(dataset.data, primaryCategoryColumn, primaryValueColumn);
        const dataMap = new Map(aggregatedData.map(item => [item.name, item.total]));
        
        datasetSeries.push({
          name: dataset.datasetName,
          data: sortedCategories.map(category => dataMap.get(category) || 0),
          color: dataset.color
        });
      });

      return {
        primaryCategoryColumn,
        primaryValueColumn,
        categories: sortedCategories,
        series: datasetSeries,
        aggregatedData: [],
        uniqueCategories: sortedCategories
      };
    } else {
      // Single dataset comparison
      const uniqueCategories = DataProcessor.getUniqueValues(data, primaryCategoryColumn);
      const aggregatedData = DataProcessor.aggregateByCategory(data, primaryCategoryColumn, primaryValueColumn);

      return {
        primaryCategoryColumn,
        primaryValueColumn,
        categories: aggregatedData.map(item => item.name),
        series: [{
          name: primaryValueColumn,
          data: aggregatedData.map(item => item.total),
          color: '#3b82f6'
        }],
        aggregatedData,
        uniqueCategories
      };
    }
  };

  const comparisonData = processComparisonData();

  if (!comparisonData) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-lg font-medium">Insufficient data for comparison</p>
          <p className="text-sm">Need both categorical and numeric columns</p>
        </div>
      </div>
    );
  }

  const { primaryCategoryColumn, primaryValueColumn, categories, series, aggregatedData, uniqueCategories } = comparisonData;

  const filteredData = selectedCategories.length > 0 && !isMultiDataset
    ? aggregatedData.filter(item => selectedCategories.includes(item.name))
    : aggregatedData.slice(0, isMultiDataset ? 8 : 5);

  // Enhanced comparison chart options with multi-dataset support
  const comparisonOptions: ApexOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      background: 'transparent',
      stacked: false,
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: isMultiDataset ? '60%' : '70%',
        borderRadius: 4,
        dataLabels: {
          position: 'top'
        }
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: isMultiDataset ? categories : filteredData.map(item => item.name),
      labels: {
        style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
        rotate: categories.length > 8 ? -45 : 0
      },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => DataProcessor.formatCurrency(val, state.settings.currency),
        style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
      },
    },
    colors: isMultiDataset ? 
      multiDatasetData.map(d => d.color) : 
      ['#3b82f6', '#22c55e', '#f97316', '#ef4444', '#8b5cf6'],
    theme: { mode: isDarkMode ? 'dark' : 'light' },
    grid: { borderColor: isDarkMode ? '#374151' : '#e5e7eb' },
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
      y: {
        formatter: (val: number) => DataProcessor.formatCurrency(val, state.settings.currency),
      },
    },
  };

  const comparisonSeries = isMultiDataset ? series : [{
    name: primaryValueColumn,
    data: filteredData.map(item => item.total),
  }];

  // Enhanced radar chart for multi-metric comparison
  const radarOptions: ApexOptions = {
    chart: { 
      type: 'radar', 
      background: 'transparent',
      toolbar: { show: false }
    },
    xaxis: {
      categories: ['Total Value', 'Count', 'Average'],
      labels: { style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' } },
    },
    yaxis: { show: false },
    colors: isMultiDataset ? 
      multiDatasetData.map(d => d.color) : 
      ['#3b82f6', '#22c55e', '#f97316', '#ef4444', '#8b5cf6'],
    theme: { mode: isDarkMode ? 'dark' : 'light' },
    legend: { 
      labels: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
      show: true,
      position: 'bottom'
    },
    stroke: {
      width: 2
    },
    fill: {
      opacity: 0.1
    },
    markers: {
      size: 4
    }
  };

  // Enhanced radar series for multi-dataset
  const radarSeries = isMultiDataset ? 
    multiDatasetData.map(dataset => {
      const datasetAggregated = DataProcessor.aggregateByCategory(dataset.data, primaryCategoryColumn, primaryValueColumn);
      const totalValue = datasetAggregated.reduce((sum, item) => sum + item.total, 0);
      const totalCount = datasetAggregated.reduce((sum, item) => sum + item.count, 0);
      const avgValue = totalCount > 0 ? totalValue / totalCount : 0;
      
      // Normalize values for radar chart
      const maxTotal = Math.max(...multiDatasetData.map(d => {
        const agg = DataProcessor.aggregateByCategory(d.data, primaryCategoryColumn, primaryValueColumn);
        return agg.reduce((sum, item) => sum + item.total, 0);
      }));
      const maxCount = Math.max(...multiDatasetData.map(d => {
        const agg = DataProcessor.aggregateByCategory(d.data, primaryCategoryColumn, primaryValueColumn);
        return agg.reduce((sum, item) => sum + item.count, 0);
      }));
      const maxAvg = Math.max(...multiDatasetData.map(d => {
        const agg = DataProcessor.aggregateByCategory(d.data, primaryCategoryColumn, primaryValueColumn);
        const total = agg.reduce((sum, item) => sum + item.total, 0);
        const count = agg.reduce((sum, item) => sum + item.count, 0);
        return count > 0 ? total / count : 0;
      }));
      
      return {
        name: dataset.datasetName,
        data: [
          maxTotal > 0 ? (totalValue / maxTotal) * 100 : 0,
          maxCount > 0 ? (totalCount / maxCount) * 100 : 0,
          maxAvg > 0 ? (avgValue / maxAvg) * 100 : 0,
        ],
      };
    }) :
    filteredData.map(item => {
      const maxTotal = Math.max(...filteredData.map(item => item.total));
      const maxCount = Math.max(...filteredData.map(item => item.count));
      const maxAverage = Math.max(...filteredData.map(item => item.average));
      
      return {
        name: item.name,
        data: [
          (item.total / maxTotal) * 100,
          (item.count / maxCount) * 100,
          (item.average / maxAverage) * 100,
        ],
      };
    });

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
                Multi-Dataset Comparison Mode
              </h3>
              <p className="text-sm text-primary-700 dark:text-primary-300">
                Comparing data across {multiDatasetData.length} active datasets
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

      {/* Category selection */}
      {!isMultiDataset && (
        <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Select {primaryCategoryColumn} to Compare
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {uniqueCategories.slice(0, 20).map((category) => (
            <label key={category} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedCategories.includes(category)}
                onChange={(e) =>
                  e.target.checked
                    ? setSelectedCategories([...selectedCategories, category])
                    : setSelectedCategories(selectedCategories.filter((c) => c !== category))
                }
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                {category}
              </span>
            </label>
          ))}
        </div>
        {selectedCategories.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Showing top {isMultiDataset ? 8 : 5} categories by default. Select categories above to customize comparison.
          </p>
        )}
        </div>
      )}

      {/* KPI cards */}
      <div className={`grid gap-6 ${isMultiDataset ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'}`}>
        {isMultiDataset ? (
          multiDatasetData.map((dataset) => {
            const datasetAggregated = DataProcessor.aggregateByCategory(dataset.data, primaryCategoryColumn, primaryValueColumn);
            const totalValue = datasetAggregated.reduce((sum, item) => sum + item.total, 0);
            const totalCount = datasetAggregated.reduce((sum, item) => sum + item.count, 0);
            const avgValue = totalCount > 0 ? totalValue / totalCount : 0;
            const topCategory = datasetAggregated.length > 0 ? datasetAggregated[0].name : 'N/A';
            
            return (
              <div key={dataset.datasetId} className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: dataset.color }}
                    />
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {dataset.datasetName}
                    </h4>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Total Value</p>
                    <p className="text-sm font-bold text-primary-600 dark:text-primary-400 break-words">
                      {DataProcessor.formatCurrency(totalValue, state.settings.currency)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Count</p>
                    <p className="text-sm font-bold text-secondary-600 dark:text-secondary-400">
                      {DataProcessor.formatNumber(totalCount)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Average</p>
                    <p className="text-sm font-bold text-accent-600 dark:text-accent-400 break-words">
                      {DataProcessor.formatCurrency(avgValue, state.settings.currency)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Top Item</p>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300 truncate">
                      {topCategory}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          filteredData.map((item) => (
          <div key={item.name} className="card">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {item.name}
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-gray-600 dark:text-gray-400">Total Value</p>
                <p className="text-sm font-bold text-primary-600 dark:text-primary-400 break-words">
                  {DataProcessor.formatCurrency(item.total, state.settings.currency)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-600 dark:text-gray-400">Count</p>
                <p className="text-sm font-bold text-secondary-600 dark:text-secondary-400">
                  {DataProcessor.formatNumber(item.count)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-600 dark:text-gray-400">Average</p>
                <p className="text-sm font-bold text-accent-600 dark:text-accent-400 break-words">
                  {DataProcessor.formatCurrency(item.average, state.settings.currency)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-600 dark:text-gray-400">Share</p>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  {aggregatedData.length > 0 ? ((item.total / aggregatedData.reduce((sum, d) => sum + d.total, 0)) * 100).toFixed(1) : '0'}%
                </p>
              </div>
            </div>
          </div>
          ))
        )}
      </div>

      {/* Charts */}
      <div className="space-y-8">
        <ChartContainer title={`${primaryValueColumn} by ${primaryCategoryColumn}${isMultiDataset ? ' - Dataset Comparison' : ''}`} className="w-full">
          <Chart options={comparisonOptions} series={comparisonSeries} type="bar" height="100%" />
        </ChartContainer>

        <ChartContainer title={`Multi-Metric Comparison${isMultiDataset ? ' - Dataset Comparison' : ''}`} className="w-full">
          <Chart options={radarOptions} series={radarSeries} type="radar" height="100%" />
        </ChartContainer>
      </div>
    </div>
  );
}