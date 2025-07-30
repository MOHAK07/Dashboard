import React, { useState } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { DataRow } from '../../types';
import { DataProcessor } from '../../utils/dataProcessing';
import { ChartContainer } from './ChartContainer';
import { useApp } from '../../contexts/AppContext';

interface SalesDistributionChartProps {
  data: DataRow[];
  isDarkMode?: boolean;
  enableDrillDown?: boolean;
}

export function SalesDistributionChart({ data, isDarkMode = false }: SalesDistributionChartProps) {
  const { addDrillDownFilter, state } = useApp();
  const [chartType, setChartType] = useState<'donut' | 'pie'>('donut');
  
  const plantData = DataProcessor.aggregateByPlant(data);
  
  if (plantData.length === 0) {
    return (
      <ChartContainer
        title="Sales Distribution by Plant"
        onChartTypeChange={(type) => setChartType(type as 'donut' | 'pie')}
        availableTypes={['donut', 'pie']}
        currentType={chartType}
      >
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          No plant data available
        </div>
      </ChartContainer>
    );
  }

  const totalRevenue = plantData.reduce((sum, plant) => sum + plant.totalRevenue, 0);

  const chartOptions: ApexOptions = {
    chart: {
      id: 'sales-distribution',
      type: chartType,
      background: 'transparent',
      animations: {
        enabled: true,
        speed: 600,
        animateGradually: {
            enabled: true,
            delay: 150
        },
        dynamicAnimation: {
            enabled: true,
            speed: 350
        }
      },
      events: {
        dataPointSelection: (event: any, chartContext: any, config: any) => {
          const plantName = plantData[config.dataPointIndex]?.name;
          if (plantName) {
            addDrillDownFilter('PlantName', plantName);
          }
        },
      },
    },
    labels: plantData.map(plant => plant.name),
    colors: [
      '#3b82f6', '#22c55e', '#f97316', '#ef4444', 
      '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899'
    ],
    legend: {
      position: 'bottom',
      labels: {
        colors: isDarkMode ? '#9ca3af' : '#6b7280',
      },
    },
    plotOptions: {
      pie: {
        offsetX: chartType === 'pie' ? -80 : 0,
        donut: {
          size: chartType === 'donut' ? '70%' : '0%',
          labels: {
            show: chartType === 'donut',
            name: {
              show: true,
              color: isDarkMode ? '#9ca3af' : '#6b7280',
            },
            value: {
              show: true,
              formatter: (val: string) => DataProcessor.formatCurrency(Number(val), state.settings.currency),
              color: isDarkMode ? '#f3f4f6' : '#374151',
            },
            total: {
              show: true,
              label: 'Total Revenue',
              formatter: () => DataProcessor.formatCurrency(totalRevenue, state.settings.currency),
              color: isDarkMode ? '#f3f4f6' : '#374151',
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
      style: {
        colors: ['#ffffff'],
      },
    },
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
      y: {
        formatter: (val: number) => DataProcessor.formatCurrency(val, state.settings.currency),
      },
    },
    responsive: [{
      breakpoint: 768,
      options: {
        legend: {
          position: 'bottom'
        }
      }
    }]
  };

  const series = plantData.map(plant => plant.totalRevenue);
  
  const chartKey = JSON.stringify(state.filters.drillDownFilters);

  return (
    <ChartContainer
      title="Sales Distribution by Plant"
      onChartTypeChange={(type) => setChartType(type as 'donut' | 'pie')}
      availableTypes={['donut', 'pie']}
      currentType={chartType}
    >
      <div className="relative w-full h-full">
        <Chart
          key={chartKey}
          options={chartOptions}
          series={series}
          type={chartType}
          height="100%"
          width="100%"
        />
        <div 
          className={`absolute top-1/2 right-10 -translate-y-1/2 flex flex-col items-center justify-center text-center pointer-events-none transition-opacity duration-300
          ${chartType === 'pie' ? 'opacity-100' : 'opacity-0'}`}
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {DataProcessor.formatCurrency(totalRevenue, state.settings.currency)}
          </p>
        </div>
      </div>
    </ChartContainer>
  );
}