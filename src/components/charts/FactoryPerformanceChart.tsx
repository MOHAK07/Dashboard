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
    },
    xaxis: {
      categories: categories,
      labels: {
        style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
        formatter: isHorizontal
          ? (value: string) => DataProcessor.formatCurrency(Number(value), state.settings.currency)
          : undefined,
      },
    },
    yaxis: {
      labels: {
        style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
        formatter: !isHorizontal ? (val: number) => DataProcessor.formatCurrency(val, state.settings.currency) : undefined,
      },
    },
    colors: ['#3b82f6'],
    theme: { mode: isDarkMode ? 'dark' : 'light' },
    grid: { borderColor: isDarkMode ? '#374151' : '#e5e7eb' },
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
      custom: ({ series, seriesIndex, dataPointIndex, w }: any) => {
        if (dataPointIndex === undefined || !factoryData[dataPointIndex]) return '';
        
        const factory = factoryData[dataPointIndex];
        const value = series[seriesIndex][dataPointIndex];
        
        return `
          <div style="padding: 12px; background: ${isDarkMode ? '#1f2937' : '#ffffff'}; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="font-weight: 600; color: ${isDarkMode ? '#f3f4f6' : '#374151'}; margin-bottom: 8px;">
              ${factory.name}
            </div>
            <div style="margin-bottom: 6px;">
              <span style="color: ${isDarkMode ? '#9ca3af' : '#6b7280'};">Revenue: </span>
              <span style="font-weight: 600; color: #3b82f6;">
                ${DataProcessor.formatCurrency(value, state.settings.currency)}
              </span>
            </div>
            <div style="margin-bottom: 6px;">
              <span style="color: ${isDarkMode ? '#9ca3af' : '#6b7280'};">Units Sold: </span>
              <span style="font-weight: 600;">
                ${DataProcessor.formatNumber(factory.totalUnits)}
              </span>
            </div>
            <div style="margin-bottom: 6px;">
              <span style="color: ${isDarkMode ? '#9ca3af' : '#6b7280'};">Products: </span>
              <span style="font-weight: 600;">${factory.products}</span>
            </div>
            <div>
              <span style="color: ${isDarkMode ? '#9ca3af' : '#6b7280'};">Plants: </span>
              <span style="font-weight: 600;">${factory.plants}</span>
            </div>
          </div>
        `;
      },
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