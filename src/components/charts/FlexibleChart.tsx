import React, { useState, useMemo } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { FlexibleDataRow } from '../../types';
import { DataProcessor } from '../../utils/dataProcessing';
import { ChartContainer } from './ChartContainer';
import { useApp } from '../../contexts/AppContext';

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
  const { state } = useApp();
  const [chartType, setChartType] = useState<string>(initialChartType);
  
  // Comprehensive data processing with error handling
  const { chartData, categories, hasData, errorMessage } = useMemo(() => {
    try {
      // Early return for empty data
      if (!data || !Array.isArray(data) || data.length === 0) {
        return { 
          chartData: [], 
          categories: [], 
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
          hasData: false, 
          errorMessage: 'No aggregated data generated' 
        };
      }

      // Limit data points for better visualization (top 10)
      const limitedData = aggregatedData.slice(0, 10);

      return {
        chartData: limitedData.map(item => Math.round(item.total * 100) / 100), // Round to 2 decimals
        categories: limitedData.map(item => item.name || 'Unknown'),
        hasData: true,
        errorMessage: null
      };

    } catch (error) {
      console.error('FlexibleChart processing error:', error);
      return { 
        chartData: [], 
        categories: [], 
        hasData: false, 
        errorMessage: `Processing error: ${error.message}` 
      };
    }
  }, [data]);

  // Chart type configuration
  const getAvailableTypes = () => {
    if (initialChartType === 'bar') {
      return ['bar', 'horizontalBar'];
    } else if (initialChartType === 'line') {
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
        title={title}
        availableTypes={getAvailableTypes()}
        currentType={chartType}
        onChartTypeChange={setChartType}
        className={className}
      >
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

  // Comprehensive chart options with error prevention
  const chartOptions: ApexOptions = {
    chart: {
      type: actualChartType === 'donut' ? 'donut' : actualChartType,
      background: 'transparent',
      toolbar: { show: false },
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
        labels: { colors: isDarkMode ? '#9ca3af' : '#6b7280' }
      }
    } : {
      xaxis: {
        categories: categories || [],
        labels: {
          style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
          formatter: isHorizontalBar ? (val: number) => 
            DataProcessor.formatCurrency(val, state.settings.currency) : undefined,
        },
      },
      yaxis: {
        labels: {
          formatter: isHorizontalBar ? undefined : (val: number) => 
            DataProcessor.formatCurrency(val, state.settings.currency),
          style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
        },
      }
    }),

    colors: [
      '#3b82f6', '#22c55e', '#f97316', '#ef4444', 
      '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899',
      '#84cc16', '#6366f1'
    ],
    
    theme: { mode: isDarkMode ? 'dark' : 'light' },
    
    grid: { 
      borderColor: isDarkMode ? '#374151' : '#e5e7eb',
      show: !isPieChart
    },
    
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
      y: {
        formatter: (val: number) => DataProcessor.formatCurrency(val, state.settings.currency),
      },
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
                chartData.reduce((sum, val) => sum + val, 0), 
                state.settings.currency
              )
            }
          }
        },
      },
      bar: {
        borderRadius: 4,
        columnWidth: '70%',
        horizontal: isHorizontalBar,
        dataLabels: { position: 'top' }
      },
    },
    
    dataLabels: {
      enabled: isPieChart,
      formatter: isPieChart ? (val: number) => `${val.toFixed(1)}%` : undefined,
      style: { colors: ['#ffffff'] }
    },
    
    stroke: {
      curve: 'smooth',
      width: actualChartType === 'line' || actualChartType === 'area' ? 3 : 0,
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
          bar: { horizontal: true }
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  };

  // Series data with proper formatting
  const series = isPieChart 
    ? (chartData || [])
    : [{ 
        name: 'Value', 
        data: (chartData || []),
        color: '#3b82f6'
      }];

  // Debug logging
  console.log('FlexibleChart render:', {
    title,
    chartType,
    hasData,
    categoriesLength: categories?.length,
    chartDataLength: chartData?.length,
    series
  });

  return (
    <ChartContainer
      title={title}
      availableTypes={getAvailableTypes()}
      onChartTypeChange={setChartType}
      currentType={chartType}
      className={className}
    >
      <div className="w-full h-full min-h-[320px] flex items-center justify-center">
        <Chart
          options={chartOptions}
          series={series}
          type={actualChartType === 'donut' ? 'donut' : actualChartType}
          height="100%"
          width="100%"
        />
      </div>
    </ChartContainer>
  );
}