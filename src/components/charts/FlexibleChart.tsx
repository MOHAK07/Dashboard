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
  const isTimeSeriesChart = title.toLowerCase().includes('trends') || title.toLowerCase().includes('time');
  
  // Color scheme for datasets
  const getDatasetColors = () => {
    const baseColors = [
      '#3b82f6', '#22c55e', '#f97316', '#ef4444', '#8b5cf6',
      '#06b6d4', '#f59e0b', '#ec4899', '#84cc16', '#6366f1'
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
          chartData: [], 
          categories: [],
          series: [],
          hasData: false, 
          errorMessage: 'No time series data available' 
        };
      }

      if (isMultiDataset && isTimeSeriesChart) {
        // Multi-dataset time series comparison - ONLY for trends over time
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
        title={`${title}${isMultiDataset && !isTimeSeriesChart ? ' - Individual Dataset Views' : isMultiDataset ? ' - Dataset Comparison' : ''}`}
        availableTypes={getAvailableTypes()}
        currentType={chartType}
        onChartTypeChange={setChartType}
        className={className}
      >
        {isMultiDataset && !isTimeSeriesChart && (
          <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-800 rounded-lg">
                <Database className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="font-semibold text-primary-900 dark:text-primary-100">
                  Individual Dataset View Mode
                </h3>
                <p className="text-sm text-primary-700 dark:text-primary-300">
                  Viewing {multiDatasetData.length} datasets separately to preserve data integrity
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

  // Multi-dataset individual chart rendering (except for time series)
  if (isMultiDataset && !isTimeSeriesChart) {
    return (
      <ChartContainer
        title={`${title} - Individual Dataset Views`}
        availableTypes={getAvailableTypes()}
        currentType={chartType}
        onChartTypeChange={setChartType}
        className={className}
      >
        <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-800 rounded-lg">
              <Database className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-900 dark:text-primary-100">
                Individual Dataset View Mode
              </h3>
              <p className="text-sm text-primary-700 dark:text-primary-300">
                Each dataset is displayed separately to preserve data integrity and context
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

        <div className={`grid gap-6 ${multiDatasetData.length === 2 ? 'grid-cols-1 lg:grid-cols-2' : multiDatasetData.length === 3 ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'}`}>
          {multiDatasetData.map((dataset) => {
            // Process each dataset individually
            const numericColumns = DataProcessor.findNumericColumns(dataset.data);
            const categoricalColumns = DataProcessor.findCategoricalColumns(dataset.data);
            
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
              return (
                <div key={dataset.datasetId} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2 mb-4">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: dataset.color }}
                    />
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      {dataset.datasetName}
                    </h4>
                  </div>
                  <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
                    <p className="text-sm">Insufficient data for visualization</p>
                  </div>
                </div>
              );
            }

            const aggregatedData = DataProcessor.aggregateByCategory(dataset.data, categoryColumn, valueColumn);
            const limitedData = aggregatedData.slice(0, 8); // Limit for individual charts

            const isHorizontalBar = chartType === 'horizontalBar';
            const actualChartType = isHorizontalBar ? 'bar' : chartType;
            const isPieChart = actualChartType === 'pie' || actualChartType === 'donut';

            const chartOptions: ApexOptions = {
              chart: {
                type: actualChartType === 'donut' ? 'donut' : actualChartType,
                background: 'transparent',
                toolbar: { show: false },
                height: '100%',
                width: '100%',
                parentHeightOffset: 0,
                animations: {
                  enabled: true,
                  easing: 'easeinout',
                  speed: 800
                }
              },
              
              ...(isPieChart ? {
                labels: limitedData.map(item => item.name),
                legend: {
                  position: 'bottom',
                  labels: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
                  show: limitedData.length <= 6
                }
              } : {
                xaxis: {
                  categories: limitedData.map(item => item.name),
                  labels: {
                    style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
                    rotate: limitedData.length > 6 ? -45 : 0
                  }
                },
                yaxis: {
                  labels: {
                    formatter: (val: number) => DataProcessor.formatCurrency(val, state.settings.currency),
                    style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' }
                  }
                }
              }),

              colors: [dataset.color],
              theme: { mode: isDarkMode ? 'dark' : 'light' },
              grid: { 
                borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                show: !isPieChart,
                padding: { top: 0, right: 10, bottom: 0, left: 10 }
              },
              
              tooltip: {
                theme: isDarkMode ? 'dark' : 'light',
                y: {
                  formatter: (val: number) => DataProcessor.formatCurrency(val, state.settings.currency)
                }
              },
              
              plotOptions: {
                pie: {
                  donut: {
                    size: actualChartType === 'donut' ? '60%' : '0%',
                  },
                  expandOnClick: false,
                  offsetX: 0,
                  offsetY: 0
                },
                bar: {
                  borderRadius: 4,
                  columnWidth: '75%',
                  barHeight: '75%',
                  horizontal: isHorizontalBar,
                  dataLabels: { position: 'top' }
                }
              },
              
              dataLabels: {
                enabled: isPieChart && limitedData.length <= 6,
                formatter: isPieChart ? (val: number) => `${val.toFixed(1)}%` : undefined,
                style: { colors: ['#ffffff'] }
              }
            };

            const series = isPieChart ? 
              limitedData.map(item => item.total) : 
              [{
                name: 'Value',
                data: limitedData.map(item => item.total),
                color: dataset.color
              }];

            return (
              <div key={dataset.datasetId} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2 mb-4">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: dataset.color }}
                  />
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    {dataset.datasetName}
                  </h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({dataset.data.length} rows)
                  </span>
                </div>
                <div className="h-80">
                  <Chart
                    options={chartOptions}
                    series={series}
                    type={actualChartType === 'donut' ? 'donut' : actualChartType}
                    height="100%"
                    width="100%"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </ChartContainer>
    );
  }

  // Chart configuration
  const isHorizontalBar = chartType === 'horizontalBar';
  const actualChartType = isHorizontalBar ? 'bar' : chartType;
  const isPieChart = actualChartType === 'pie' || actualChartType === 'donut';
  
  // Determine series data
  const finalSeries = isTimeSeriesChart && timeSeriesSeries ? timeSeriesSeries : 
    isPieChart ? (chartData || []) : 
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
      parentHeightOffset: 0,
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
        show: categories.length <= 8
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
          formatter: isHorizontalBar ? 
            (val: number) => val.toString() :
            (val: number) => DataProcessor.formatCurrency(val, state.settings.currency),
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
    
    legend: isMultiDataset && isTimeSeriesChart && !isPieChart ? {
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
      shared: isMultiDataset && isTimeSeriesChart && !isPieChart,
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
        barHeight: '75%',
        horizontal: isHorizontalBar,
        dataLabels: { position: 'top' },
        distributed: false,
        rangeBarOverlap: true,
        rangeBarGroupRows: false
      }
    },
    
    dataLabels: {
      enabled: isPieChart,
      formatter: isPieChart ? (val: number) => `${val.toFixed(1)}%` : undefined,
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
  console.log('FlexibleChart Final Debug:', {
    chartType,
    hasData,
    isMultiDataset,
    isTimeSeriesChart,
    categoriesLength: categories?.length,
    chartDataLength: chartData?.length,
    series: finalSeries
  });

  return (
    <ChartContainer
      title={`${title}${isMultiDataset && isTimeSeriesChart ? ' - Dataset Comparison' : ''}`}
      availableTypes={getAvailableTypes()}
      onChartTypeChange={setChartType}
      currentType={chartType}
      className={className}
    >
      {isMultiDataset && isTimeSeriesChart && (
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
                Comparing trends across {multiDatasetData.length} active datasets
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