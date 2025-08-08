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
  
  const { chartData, categories, hasData } = useMemo(() => {
    if (data.length === 0) {
      return { chartData: [], categories: [], hasData: false };
    }

    const numericColumns = DataProcessor.findNumericColumns(data);
    const categoricalColumns = DataProcessor.findCategoricalColumns(data);
    
    const valueColumn = numericColumns.find(col => 
      col.toLowerCase().includes('price') || 
      col.toLowerCase().includes('revenue') ||
      col.toLowerCase().includes('quantity') ||
      col.toLowerCase().includes('amount')
    ) || numericColumns[0];

    const categoryColumn = categoricalColumns.find(col =>
      col.toLowerCase().includes('name') ||
      col.toLowerCase().includes('product') ||
      col.toLowerCase().includes('category') ||
      col.toLowerCase().includes('type')
    ) || categoricalColumns[0];

    if (!valueColumn || !categoryColumn) {
      return { chartData: [], categories: [], hasData: false };
    }

    const aggregatedData = DataProcessor.aggregateByCategory(data, categoryColumn, valueColumn);
    
    return {
      chartData: aggregatedData.map(item => item.total),
      categories: aggregatedData.map(item => item.name),
      hasData: true
    };
  }, [data]);

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
            <p className="text-lg font-medium">No suitable data for visualization</p>
            <p className="text-sm">Upload data with numeric and categorical columns</p>
          </div>
        </div>
      </ChartContainer>
    );
  }

  const isHorizontalBar = chartType === 'horizontalBar';
  const actualChartType = isHorizontalBar ? 'bar' : chartType;
  const chartOptions: ApexOptions = {
    chart: {
      type: actualChartType === 'donut' ? 'donut' : actualChartType,
      background: 'transparent',
      toolbar: { show: false },
    },
    labels: actualChartType === 'pie' || actualChartType === 'donut' ? categories : undefined,
    xaxis: actualChartType === 'pie' || actualChartType === 'donut' ? {} : {
      categories: categories,
      labels: {
        style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
        formatter: isHorizontalBar ? (val: number) => DataProcessor.formatCurrency(val, state.settings.currency) : undefined,
      },
    },
    yaxis: actualChartType === 'pie' || actualChartType === 'donut' ? {} : {
      labels: {
        formatter: isHorizontalBar ? undefined : (val: number) => DataProcessor.formatCurrency(val, state.settings.currency),
        style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
      },
    },
    colors: [
      '#3b82f6', '#22c55e', '#f97316', '#ef4444', 
      '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899'
    ],
    theme: { mode: isDarkMode ? 'dark' : 'light' },
    grid: { borderColor: isDarkMode ? '#374151' : '#e5e7eb' },
    legend: {
      labels: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
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
        },
      },
      bar: {
        borderRadius: 4,
        columnWidth: '70%',
        horizontal: isHorizontalBar,
      },
    },
    dataLabels: {
      enabled: actualChartType === 'pie' || actualChartType === 'donut',
      formatter: (val: number) => `${val.toFixed(1)}%`,
    },
    stroke: {
      curve: 'smooth',
      width: actualChartType === 'line' || actualChartType === 'area' ? 3 : 0,
    },
    fill: {
      type: actualChartType === 'area' ? 'gradient' : 'solid',
    },
  };

  const series = actualChartType === 'pie' || actualChartType === 'donut' 
    ? chartData 
    : [{ name: 'Value', data: chartData }];

  return (
    <ChartContainer
      title={title}
      availableTypes={getAvailableTypes()}
      onChartTypeChange={setChartType}
      currentType={chartType}
      className={className}
    >
      <Chart
        options={chartOptions}
        series={series}
        type={actualChartType === 'donut' ? 'donut' : actualChartType}
        height="100%"
      />
    </ChartContainer>
  );
}