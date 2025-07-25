import React, { useState } from 'react';
import { ApexOptions } from 'apexcharts';
import Chart from 'react-apexcharts';
import { DataRow } from '../../types';
import { DataProcessor } from '../../utils/dataProcessing';
import { ChartContainer } from './ChartContainer';
import { useApp } from '../../contexts/AppContext';

interface FactoryPerformanceChartProps {
  data: DataRow[];
  isDarkMode?: boolean;
  enableDrillDown?: boolean;
}

export function FactoryPerformanceChart({
  data,
  isDarkMode = false,
  enableDrillDown = true,
}: FactoryPerformanceChartProps) {
  const { addDrillDownFilter, state } = useApp();
  const [chartType, setChartType] = useState<'bar' | 'horizontal'>('bar');
  const isHorizontal = chartType === 'horizontal';

  const factoryData = DataProcessor.aggregateByFactory(data);
  
  if (factoryData.length === 0) {
    return (
      <ChartContainer
        title="Factory Performance"
        onChartTypeChange={(type) => setChartType(type as 'bar' | 'horizontal')}
        availableTypes={['bar', 'horizontal']}
        currentType={chartType}
      >
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          No factory data available
        </div>
      </ChartContainer>
    );
  }
  
  const categories = factoryData.map((f) => f.name);
  const values = factoryData.map((f) => f.totalRevenue);

  const chartOptions: ApexOptions = {
    chart: {
      id: 'factory-performance',
      type: 'bar',
      toolbar: { show: false },
      background: 'transparent',
      events: enableDrillDown ? {
        dataPointSelection: (event: any, chartContext: any, config: any) => {
          const factoryName = categories[config.dataPointIndex];
          addDrillDownFilter('FactoryName', factoryName);
        },
      } : {},
    },
    plotOptions: {
      bar: {
        horizontal: isHorizontal,
        borderRadius: 8,
        dataLabels: { 
          position: isHorizontal ? 'center' : 'top' 
        },
      },
    },
    dataLabels: {
      enabled: false,
      formatter: (val: number) => DataProcessor.formatCurrency(val, state.settings.currency),
      style: {
        colors: [isDarkMode ? '#f3f4f6' : '#374151'],
      },
    },
    xaxis: {
      categories: isHorizontal ? undefined : categories,
      labels: {
        style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
      },
    },
    yaxis: {
      categories: isHorizontal ? categories : undefined,
      labels: {
        style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
        formatter: (val: number) => DataProcessor.formatCurrency(val, state.settings.currency),
      },
    },
    colors: ['#3b82f6'],
    theme: { mode: isDarkMode ? 'dark' : 'light' },
    grid: { borderColor: isDarkMode ? '#374151' : '#e5e7eb' },
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
      y: { formatter: (val: number) => DataProcessor.formatCurrency(val, state.settings.currency) },
    },
    responsive: [{
      breakpoint: 768,
      options: {
        plotOptions: {
          bar: {
            horizontal: true,
          }
        }
      }
    }]
  };

  const series = [
    {
      name: 'Revenue',
      data: values,
    },
  ];

  return (
    <ChartContainer
      title="Factory Performance"
      onChartTypeChange={(type) => setChartType(type as 'bar' | 'horizontal')}
      availableTypes={['bar', 'horizontal']}
      currentType={chartType}
    >
      <Chart
        options={chartOptions}
        series={series}
        type="bar"
        height="100%"
      />
    </ChartContainer>
  );
}
