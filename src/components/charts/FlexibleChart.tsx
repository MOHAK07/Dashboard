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
  const [chartType, setChartType] = useState(initialChartType);
  
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

  if (!hasData) {
    return (
      <ChartContainer
        title={title}
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

  const chartOptions: ApexOptions = {
    chart: {
      type: chartType === 'donut' ? 'donut' : chartType,
      background: 'transparent',
      toolbar: { show: false },
    },
    labels: chartType === 'pie' || chartType === 'donut' ? categories : undefined,
    xaxis: chartType !== 'pie' && chartType !== 'donut' ? {
      categories: categories,
      labels: {
        style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
      },
    } : undefined,
    yaxis: chartType !== 'pie' && chartType !== 'donut' ? {
      labels: {
        formatter: (val: number) => DataProcessor.formatCurrency(val, state.settings.currency),
        style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
      },
    } : undefined,
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
          size: chartType === 'donut' ? '70%' : '0%',
        },
      },
      bar: {
        borderRadius: 4,
        columnWidth: '70%',
      },
    },
    dataLabels: {
      enabled: chartType === 'pie' || chartType === 'donut',
      formatter: (val: number) => `${val.toFixed(1)}%`,
    },
    stroke: {
      curve: 'smooth',
      width: chartType === 'line' || chartType === 'area' ? 3 : 0,
    },
    fill: {
      type: chartType === 'area' ? 'gradient' : 'solid',
    },
  };

  const series = chartType === 'pie' || chartType === 'donut' 
    ? chartData 
    : [{ name: 'Value', data: chartData }];

  return (
    <ChartContainer
      title={title}
      onChartTypeChange={(type) => setChartType(type as any)}
      availableTypes={['bar', 'line', 'area', 'pie', 'donut']}
      currentType={chartType}
      className={className}
    >
      <Chart
        options={chartOptions}
        series={series}
        type={chartType === 'donut' ? 'donut' : chartType}
        height="100%"
      />
    </ChartContainer>
  );
}