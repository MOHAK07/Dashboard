import React, { useState } from 'react';
import { ApexOptions } from 'apexcharts';
import { DataRow } from '../../types';
import { DataProcessor } from '../../utils/dataProcessing';
import { ChartContainer } from './ChartContainer';
import Chart from 'react-apexcharts';
import { useApp } from '../../contexts/AppContext';

interface SalesTrendsChartProps {
  data: DataRow[];
  isDarkMode?: boolean;
}

export function SalesTrendsChart({ data, isDarkMode = false }: SalesTrendsChartProps) {
  const { state } = useApp();
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('line');
  
  const timeSeriesData = DataProcessor.getTimeSeries(data, 'month');
  
  // Return placeholder if no data is available
  if (!data || data.length === 0 || !timeSeriesData || timeSeriesData.length === 0) {
    return (
      <ChartContainer
        title="Sales Trends Over Time"
        onChartTypeChange={(type) => setChartType(type as 'line' | 'area' | 'bar')}
        availableTypes={['line', 'area', 'bar']}
        currentType={chartType}
      >
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <p className="text-lg font-medium">No data available</p>
            <p className="text-sm">Upload data to view sales trends</p>
          </div>
        </div>
      </ChartContainer>
    );
  }

  const chartOptions: ApexOptions = {
    chart: {
      type: chartType,
      toolbar: {
        show: false,
      },
      background: 'transparent',
      zoom: {
        enabled: true,
      },
    },
    stroke: {
      curve: 'smooth',
      width: chartType === 'line' ? 3 : 0,
    },
    fill: {
      type: chartType === 'area' ? 'gradient' : 'solid',
      gradient: {
        shadeIntensity: 1,
        type: 'vertical',
        colorStops: [
          {
            offset: 0,
            color: '#3b82f6',
            opacity: 0.8
          },
          {
            offset: 100,
            color: '#3b82f6',
            opacity: 0.1
          }
        ]
      }
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: timeSeriesData.map(point => {
        const date = new Date(point.date + '-01');
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }),
      labels: {
        style: {
          colors: isDarkMode ? '#9ca3af' : '#6b7280',
        },
      },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => DataProcessor.formatCurrency(val, state.settings.currency),
        style: {
          colors: isDarkMode ? '#9ca3af' : '#6b7280',
        },
      },
    },
    colors: ['#3b82f6'],
    theme: {
      mode: isDarkMode ? 'dark' : 'light',
    },
    grid: {
      borderColor: isDarkMode ? '#374151' : '#e5e7eb',
    },
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
      shared: true,
      intersect: false,
      followCursor: true,
      y: {
        formatter: (val: number) => DataProcessor.formatCurrency(val, state.settings.currency),
      },
      x: {
        formatter: (val: number, opts: any) => {
          if (opts && opts.dataPointIndex !== undefined) {
            const date = new Date(timeSeriesData[opts.dataPointIndex].date + '-01');
            return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          }
          return '';
        },
      },
      custom: ({ series, seriesIndex, dataPointIndex, w }: any) => {
        if (dataPointIndex === undefined || !timeSeriesData[dataPointIndex]) return '';
        
        const currentValue = series[seriesIndex][dataPointIndex];
        const previousValue = dataPointIndex > 0 ? series[seriesIndex][dataPointIndex - 1] : null;
        const date = new Date(timeSeriesData[dataPointIndex].date + '-01');
        const formattedDate = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        let changeText = '';
        if (previousValue !== null && previousValue !== 0) {
          const change = ((currentValue - previousValue) / previousValue) * 100;
          const changeColor = change >= 0 ? '#22c55e' : '#ef4444';
          const changeIcon = change >= 0 ? '↗' : '↘';
          changeText = `
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
              <span style="color: ${changeColor}; font-weight: 600;">
                ${changeIcon} ${Math.abs(change).toFixed(1)}% vs previous period
              </span>
            </div>
          `;
        }
        
        return `
          <div style="padding: 12px; background: ${isDarkMode ? '#1f2937' : '#ffffff'}; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="font-weight: 600; color: ${isDarkMode ? '#f3f4f6' : '#374151'}; margin-bottom: 4px;">
              ${formattedDate}
            </div>
            <div style="font-size: 18px; font-weight: 700; color: #3b82f6;">
              ${DataProcessor.formatCurrency(currentValue, state.settings.currency)}
            </div>
            <div style="font-size: 12px; color: ${isDarkMode ? '#9ca3af' : '#6b7280'}; margin-top: 4px;">
              Units: ${DataProcessor.formatNumber(timeSeriesData[dataPointIndex].units)}
            </div>
            ${changeText}
          </div>
        `;
      },
    },
    markers: {
      size: chartType === 'line' ? 6 : 0,
      colors: ['#3b82f6'],
      strokeColors: '#ffffff',
      strokeWidth: 2,
      hover: {
        size: 8,
      },
    },
  };

  const series = [
    {
      name: 'Revenue',
      data: timeSeriesData.map(point => point.revenue),
    },
  ];

  return (
    <ChartContainer
      title="Sales Trends Over Time"
      onChartTypeChange={(type) => setChartType(type as 'line' | 'area' | 'bar')}
      availableTypes={['line', 'area', 'bar']}
      currentType={chartType}
    >
      <Chart
        options={chartOptions}
        series={series}
        type={chartType}
        height="100%"
      />
    </ChartContainer>
  );
}