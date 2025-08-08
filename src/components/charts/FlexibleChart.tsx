import React, { useState, useMemo } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { FlexibleDataRow } from '../../types';
import { DataProcessor } from '../../utils/dataProcessing';
import { ChartContainer } from './ChartContainer';
import { useApp } from '../../contexts/AppContext';
import { Database } from 'lucide-react';

interface FlexibleChartProps {
  data: FlexibleDataRow[];
  title: string;
  chartType?: 'bar' | 'line' | 'pie' | 'donut' | 'area';
  isDarkMode?: boolean;
  className?: string;
}

export function FlexibleChart({ 
  data, 
  title, 
  chartType: initialChartType = 'bar', 
  isDarkMode = false,
  className = ''
}: FlexibleChartProps) {
  const { state, getMultiDatasetData } = useApp();
  const [chartType, setChartType] = useState<string>(initialChartType);
  
  // Multi-dataset detection and data preparation
  const multiDatasetData = getMultiDatasetData();
  const isMultiDataset = multiDatasetData.length > 1;
  
  // Color scheme for multi-dataset comparison
  const getDatasetColors = () => {
    const baseColors = [
      '#3b82f6', // Blue
      '#22c55e', // Green
      '#f97316', // Orange
      '#ef4444', // Red
      '#8b5cf6', // Purple
      '#06b6d4', // Cyan
      '#f59e0b', // Amber
      '#ec4899', // Pink
      '#84cc16', // Lime
      '#6366f1'  // Indigo
    ];
    
    if (isMultiDataset) {
      return multiDatasetData.map((dataset, index) => 
        dataset.color || baseColors[index % baseColors.length]
      );
    }
    
    return baseColors;
  };
  
  // Process time series data for "Trends Over Time" chart
  const processTimeSeriesData = () => {
    try {
      if (!data || data.length === 0) {
        return { 
          chartData: isMultiDataset ? [] : [], 
          categories: [],
          series: [],
          hasData: false, 
          errorMessage: 'No time series data available' 
        };
      }

      if (isMultiDataset) {
        // Multi-dataset time series comparison
        const allDates = new Set<string>();
        const datasetSeries: any[] = [];

        multiDatasetData.forEach(dataset => {
          const datasetTimeSeries = DataProcessor.getTimeSeries(dataset.data, 'month');
          datasetTimeSeries.forEach(point => allDates.add(point.date));
        });

        const sortedDates = Array.from(allDates).sort();

        multiDatasetData.forEach((dataset, index) => {
          const datasetTimeSeries = DataProcessor.getTimeSeries(dataset.data, 'month');
          const timeSeriesMap = new Map(datasetTimeSeries.map(point => [point.date, point.revenue]));
          
          datasetSeries.push({
            name: dataset.datasetName,
            data: sortedDates.map(date => timeSeriesMap.get(date) || 0),
            color: dataset.color
          });
        });

        return {
          chartData: [],
          categories: sortedDates.map(date => {
            const dateObj = new Date(date + '-01');
            return dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          }),
          series: datasetSeries,
          hasData: true,
          errorMessage: null
        };
      }

      // Single dataset time series
      const timeSeriesData = DataProcessor.getTimeSeries(data, 'month');
      
      if (!timeSeriesData || timeSeriesData.length === 0) {
        // Fallback to day-based grouping if month fails
        const daySeriesData = DataProcessor.getTimeSeries(data, 'day');
        if (!daySeriesData || daySeriesData.length === 0) {
          return { 
            chartData: [], 
            categories: [],
            series: [],
            hasData: false, 
            errorMessage: 'No valid date data found for time series' 
          };
        }
        
        // Limit to last 30 days for readability
        const limitedDayData = daySeriesData.slice(-30);
        return {
          chartData: limitedDayData.map(point => Math.round(point.value * 100) / 100),
          categories: limitedDayData.map(point => {
            const date = new Date(point.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }),
          series: [{
            name: 'Value',
            data: limitedDayData.map(point => Math.round(point.value * 100) / 100),
            color: '#3b82f6'
          }],
          hasData: true,
          errorMessage: null
        };
      }

      return {
        chartData: timeSeriesData.map(point => Math.round(point.value * 100) / 100),
        categories: timeSeriesData.map(point => {
          const date = new Date(point.date + '-01');
          return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }),
        series: [{
          name: 'Value',
          data: timeSeriesData.map(point => Math.round(point.value * 100) / 100),
          color: '#3b82f6'
        }],
        hasData: true,
        errorMessage: null
      };
    } catch (error) {
      console.error('Time series processing error:', error);
      return { 
        chartData: [], 
        categories: [],
        series: [],
        hasData: false, 
        errorMessage: `Time series error: ${error.message}` 
      };
    }
  };

  // Comprehensive data processing with error handling
  const { chartData, categories, series: timeSeriesSeries, hasData, errorMessage } = useMemo(() => {
    try {
      // Special handling for "Trends Over Time" chart
      if (title.toLowerCase().includes('trends') || title.toLowerCase().includes('time')) {
        return processTimeSeriesData();
      }
      
      // Early return for empty data
      if (!data || !Array.isArray(data) || data.length === 0) {
        return { 
          chartData: [], 
          categories: [],
          series: [],
          hasData: false, 
          errorMessage: 'No data available' 
        };
      }

      // Validate data structure
      const firstRow = data[0];
      if (!firstRow || typeof firstRow !== 'object') {
        return { 
          chartData: [], 
          categories: [],
          series: [],
          hasData: false, 
          errorMessage: 'Invalid data structure' 
        };
      }

      if (isMultiDataset) {
        // Multi-dataset comparison for distribution charts
        const allCategories = new Set<string>();
        const datasetSeries: any[] = [];

        // Find common columns across datasets
        const numericColumns = DataProcessor.findNumericColumns(data);
        const categoricalColumns = DataProcessor.findCategoricalColumns(data);
        
        const valueColumn = numericColumns.find(col => 
          col.toLowerCase().includes('price') || 
          col.toLowerCase().includes('revenue') ||
          col.toLowerCase().includes('quantity') ||
          col.toLowerCase().includes('amount') ||
          col.toLowerCase().includes('value') ||
          col.toLowerCase().includes('total')
        ) || numericColumns[0];

        const categoryColumn = categoricalColumns.find(col =>
          col.toLowerCase().includes('name') ||
          col.toLowerCase().includes('product') ||
          col.toLowerCase().includes('category') ||
          col.toLowerCase().includes('type') ||
          col.toLowerCase().includes('item')
        ) || categoricalColumns[0];

        if (!valueColumn || !categoryColumn) {
          return { 
            chartData: [], 
            categories: [],
            series: [],
            hasData: false, 
            errorMessage: 'Insufficient columns for multi-dataset comparison' 
          };
        }

        // Collect all categories across datasets
        multiDatasetData.forEach(dataset => {
          const aggregatedData = DataProcessor.aggregateByCategory(dataset.data, categoryColumn, valueColumn);
          aggregatedData.forEach(item => allCategories.add(item.name));
        });

        const sortedCategories = Array.from(allCategories).sort();

        // Create series for each dataset
        multiDatasetData.forEach((dataset, index) => {
          const aggregatedData = DataProcessor.aggregateByCategory(dataset.data, categoryColumn, valueColumn);
          const dataMap = new Map(aggregatedData.map(item => [item.name, item.total]));
          
          datasetSeries.push({
            name: dataset.datasetName,
            data: sortedCategories.map(category => dataMap.get(category) || 0),
            color: dataset.color
          });
        });

        return {
          chartData: [],
          categories: sortedCategories.slice(0, 10), // Limit for readability
          series: datasetSeries.map(s => ({
            ...s,
            data: s.data.slice(0, 10)
          })),
          hasData: true,
          errorMessage: null
        };
      }

      // Find columns with comprehensive fallbacks
      const numericColumns = DataProcessor.findNumericColumns(data);
      const categoricalColumns = DataProcessor.findCategoricalColumns(data);
      
      console.log('FlexibleChart Debug:', {
        dataLength: data.length,
        numericColumns,
        categoricalColumns,
        firstRow: Object.keys(firstRow)
      });

      // Enhanced column detection with multiple fallback strategies
      let valueColumn = null;
      let categoryColumn = null;

      // Strategy 1: Find by keywords
      valueColumn = numericColumns.find(col => 
        col.toLowerCase().includes('price') || 
        col.toLowerCase().includes('revenue') ||
        col.toLowerCase().includes('quantity') ||
        col.toLowerCase().includes('amount') ||
        col.toLowerCase().includes('value') ||
        col.toLowerCase().includes('total')
      );

      categoryColumn = categoricalColumns.find(col =>
        col.toLowerCase().includes('name') ||
        col.toLowerCase().includes('product') ||
        col.toLowerCase().includes('category') ||
        col.toLowerCase().includes('type') ||
        col.toLowerCase().includes('item')
      );

      // Strategy 2: Use first available columns
      if (!valueColumn && numericColumns.length > 0) {
        valueColumn = numericColumns[0];
      }
      
      if (!categoryColumn && categoricalColumns.length > 0) {
        categoryColumn = categoricalColumns[0];
      }

      // Strategy 3: Create synthetic data if no proper columns found
      if (!valueColumn || !categoryColumn) {
        console.warn('FlexibleChart: Creating synthetic data due to missing columns');
        
        // Try to use any available column as category
        const availableColumns = Object.keys(firstRow);
        categoryColumn = categoryColumn || availableColumns.find(col => 
          col.toLowerCase() !== 'date' && 
          col.toLowerCase() !== 'time'
        ) || availableColumns[0];

        // Create count-based data if no numeric column
        if (!valueColumn) {
          const categoryData = DataProcessor.aggregateByColumn(data, categoryColumn);
          return {
            chartData: categoryData.map(item => item.value),
            categories: categoryData.map(item => item.name),
            series: [{
              name: 'Count',
              data: categoryData.map(item => item.value),
              color: '#3b82f6'
            }],
            hasData: true,
            errorMessage: null
          };
        }
      }

      // Process data with error handling
      const aggregatedData = DataProcessor.aggregateByCategory(data, categoryColumn, valueColumn);
      
      if (!aggregatedData || aggregatedData.length === 0) {
        return { 
          chartData: [], 
          categories: [],
          series: [],
          hasData: false, 
          errorMessage: 'No aggregated data generated' 
        };
      }

      // Limit data points for better visualization (top 10)
      const limitedData = aggregatedData.slice(0, 10);

      return {
        chartData: limitedData.map(item => Math.round(item.total * 100) / 100), // Round to 2 decimals
        categories: limitedData.map(item => item.name || 'Unknown'),
        series: [{
          name: 'Value',
          data: limitedData.map(item => Math.round(item.total * 100) / 100),
          color: '#3b82f6'
        }],
        hasData: true,
        errorMessage: null
      };

    } catch (error) {
      console.error('FlexibleChart processing error:', error);
      return { 
        chartData: [], 
        categories: [],
        series: [],
        hasData: false, 
        errorMessage: `Processing error: ${error.message}` 
      };
    }
  }, [data, title, isMultiDataset, multiDatasetData]);

  // Chart type configuration
  const getAvailableTypes = () => {
    if (initialChartType === 'bar' || title.toLowerCase().includes('distribution')) {
      return ['bar', 'horizontalBar'];
    } else if (initialChartType === 'line' || title.toLowerCase().includes('trends')) {
      return ['line', 'area', 'bar'];
    } else if (initialChartType === 'donut') {
      return ['donut', 'pie'];
    }
    return [initialChartType];
  };

  // Error state rendering
  if (!hasData) {
    return (
      <ChartContainer
        title={`${title}${isMultiDataset ? ' - Dataset Comparison' : ''}`}
        availableTypes={getAvailableTypes()}
        currentType={chartType}
        onChartTypeChange={setChartType}
        className={className}
      >
        {isMultiDataset && (
          <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 rounded-lg">
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
          </div>
        )}
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <p className="text-lg font-medium">
              {errorMessage || 'No suitable data for visualization'}
            </p>
            <p className="text-sm mt-2">
              {data?.length > 0 
                ? 'Upload data with numeric and categorical columns' 
                : 'Upload data to view charts'
              }
            </p>
          </div>
        </div>
      </ChartContainer>
    );
  }

  // Chart configuration
  const isHorizontalBar = chartType === 'horizontalBar';
  const actualChartType = isHorizontalBar ? 'bar' : chartType;
  const isPieChart = actualChartType === 'pie' || actualChartType === 'donut';
  const isTimeSeriesChart = title.toLowerCase().includes('trends') || title.toLowerCase().includes('time');
  
  // Determine series data
  const finalSeries = isTimeSeriesChart && timeSeriesSeries ? timeSeriesSeries : 
    isPieChart ? (chartData || []) : 
    isMultiDataset && timeSeriesSeries ? timeSeriesSeries :
    [{
      name: 'Value',
      data: (chartData || []),
      color: '#3b82f6'
    }];

  // Comprehensive chart options with error prevention
  const chartOptions: ApexOptions = {
    chart: {
      type: actualChartType === 'donut' ? 'donut' : actualChartType,
      background: 'transparent',
      toolbar: { show: false },
      height: '100%',
      width: '100%',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800
      }
    },
    
    // Conditional configuration based on chart type
    ...(isPieChart ? {
      labels: categories || [],
      legend: {
        position: 'bottom',
        labels: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
        show: !isMultiDataset || categories.length <= 8
      }
    } : {
      xaxis: {
        categories: categories || [],
        labels: {
          style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
          rotate: categories && categories.length > 10 ? -45 : 0
        },
        title: {
          text: title.toLowerCase().includes('trends') ? 'Time Period' : 'Categories',
          style: { color: isDarkMode ? '#9ca3af' : '#6b7280' }
        }
      },
      yaxis: {
        labels: {
          formatter: isHorizontalBar ? null : (val: number) => 
            DataProcessor.formatCurrency(val, state.settings.currency),
          style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' }
        },
        title: {
          text: title.toLowerCase().includes('trends') ? 'Sales Value' : 'Value',
          style: { color: isDarkMode ? '#9ca3af' : '#6b7280' }
        }
      }
    }),

    colors: getDatasetColors(),
    
    theme: { mode: isDarkMode ? 'dark' : 'light' },
    
    grid: { 
      borderColor: isDarkMode ? '#374151' : '#e5e7eb',
      show: !isPieChart,
      padding: {
        top: 0,
        right: 30,
        bottom: 0,
        left: 10
      }
    },
    
    legend: isMultiDataset && !isPieChart ? {
      show: true,
      position: 'top',
      labels: {
        colors: isDarkMode ? '#9ca3af' : '#6b7280',
      },
      markers: {
        width: 12,
        height: 12,
        radius: 6,
      }
    } : undefined,
    
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
      shared: isMultiDataset && !isPieChart,
      intersect: false,
      y: {
        formatter: (val: number) => DataProcessor.formatCurrency(val, state.settings.currency)
      }
    },
    
    plotOptions: {
      pie: {
        donut: {
          size: actualChartType === 'donut' ? '70%' : '0%',
          labels: {
            show: actualChartType === 'donut',
            total: {
              show: true,
              label: 'Total',
              formatter: () => DataProcessor.formatCurrency(
                Array.isArray(chartData) ? chartData.reduce((sum, val) => sum + val, 0) : 0, 
                state.settings.currency
              )
            }
          }
        },
        expandOnClick: false,
        offsetX: 0,
        offsetY: 0
      },
      bar: {
        borderRadius: 4,
        columnWidth: '75%',
        barHeight: '85%',
        horizontal: isHorizontalBar,
        dataLabels: { position: 'top' },
        distributed: false,
        rangeBarOverlap: true,
        rangeBarGroupRows: false
      }
    },
    
    dataLabels: {
      enabled: isPieChart,
      formatter: isPieChart ? (val: number) => `${val.toFixed(1)}%` : null,
      style: { colors: ['#ffffff'] }
    },
    
    stroke: {
      curve: 'smooth',
      width: actualChartType === 'line' || actualChartType === 'area' ? 4 : 0
    },
    
    fill: {
      type: actualChartType === 'area' ? 'gradient' : 'solid',
      gradient: actualChartType === 'area' ? {
        shadeIntensity: 1,
        type: 'vertical',
        colorStops: [
          { offset: 0, color: '#3b82f6', opacity: 0.8 },
          { offset: 100, color: '#3b82f6', opacity: 0.1 }
        ]
      } : undefined
    },

    // Responsive configuration
    responsive: [{
      breakpoint: 768,
      options: {
        plotOptions: {
          bar: { 
            horizontal: true,
            columnWidth: '80%',
            barHeight: '80%'
          }
        },
        legend: {
          position: 'bottom'
        },
        xaxis: {
          labels: {
            rotate: -90
          }
        },
        chart: {
          height: 400
        }
      }
    }]
  };

  // Debug logging
  console.log('FlexibleChart render:', {
    title,
    chartType,
    hasData,
    isMultiDataset,
    categoriesLength: categories?.length,
    chartDataLength: chartData?.length,
    series: finalSeries
  });

  return (
    <ChartContainer
      title={`${title}${isMultiDataset ? ' - Dataset Comparison' : ''}`}
      availableTypes={getAvailableTypes()}
      onChartTypeChange={setChartType}
      currentType={chartType}
      className={className}
    >
      {isMultiDataset && (
        <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 rounded-lg">
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
            {multiDatasetData.map((dataset, index) => (
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
      <div className="w-full h-full min-h-[500px]">
        <Chart
          options={chartOptions}
          series={finalSeries}
          type={actualChartType === 'donut' ? 'donut' : actualChartType}
          height="500px"
          width="100%"
        />
      </div>
    </ChartContainer>
  );
}