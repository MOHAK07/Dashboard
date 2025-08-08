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
  const { addDrillDownFilter, state, getMultiDatasetData } = useApp();
  const [chartType, setChartType] = useState<'bar' | 'horizontal'>('bar');
  const isHorizontal = chartType === 'horizontal';

  const multiDatasetData = getMultiDatasetData();
  const isMultiDataset = multiDatasetData.length > 1;

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
  
  // Prepare data for multi-dataset comparison
  const prepareChartData = () => {
    if (!isMultiDataset) {
      return {
        categories: factoryData.map((f) => f.name),
        series: [{
          name: 'Revenue',
          data: factoryData.map((f) => f.totalRevenue),
          color: '#3b82f6'
        }]
      };
    }

    // For multi-dataset, create series for each dataset
    const allFactories = new Set<string>();
    const datasetSeries: any[] = [];

    multiDatasetData.forEach(dataset => {
      const datasetFactoryData = DataProcessor.aggregateByFactory(dataset.data);
      datasetFactoryData.forEach(factory => allFactories.add(factory.name));
      
      datasetSeries.push({
        name: dataset.datasetName,
        data: Array.from(allFactories).map(factoryName => {
          const factory = datasetFactoryData.find(f => f.name === factoryName);
          return factory ? factory.totalRevenue : 0;
        }),
        color: dataset.color
      });
    });

    return {
      categories: Array.from(allFactories),
      series: datasetSeries
    };
  };

  const { categories, series } = prepareChartData();

  const chartOptions: ApexOptions = {
    chart: {
      id: 'factory-performance',
      type: 'bar',
      toolbar: { show: false },
      background: 'transparent',
      stacked: false,
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
        columnWidth: isMultiDataset ? '60%' : '70%',
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
          : (value: string) => value.toString(),
      },
    },
    yaxis: {
      labels: {
        style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
        formatter: !isHorizontal 
          ? (val: number) => DataProcessor.formatCurrency(val, state.settings.currency) 
          : (val: number) => val.toString(),
      },
    },
    colors: series.map(s => s.color),
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
      custom: ({ series: tooltipSeries, seriesIndex, dataPointIndex, w }: any) => {
        if (dataPointIndex === undefined || !factoryData[dataPointIndex]) return '';
        
        const factoryName = categories[dataPointIndex];
        const value = tooltipSeries[seriesIndex][dataPointIndex];
        const seriesName = w.globals.seriesNames[seriesIndex];
        
        return `
          <div style="padding: 12px; background: ${isDarkMode ? '#1f2937' : '#ffffff'}; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="font-weight: 600; color: ${isDarkMode ? '#f3f4f6' : '#374151'}; margin-bottom: 8px;">
              ${factoryName}
            </div>
            ${isMultiDataset ? `
            <div style="margin-bottom: 6px;">
              <span style="color: ${isDarkMode ? '#9ca3af' : '#6b7280'};">Dataset: </span>
              <span style="font-weight: 600;">${seriesName}</span>
            </div>
            ` : ''}
            <div style="margin-bottom: 6px;">
              <span style="color: ${isDarkMode ? '#9ca3af' : '#6b7280'};">Revenue: </span>
              <span style="font-weight: 600; color: ${series[seriesIndex]?.color || '#3b82f6'};">
                ${DataProcessor.formatCurrency(value, state.settings.currency)}
              </span>
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
        },
        xaxis: {
          labels: {
            formatter: (val: number) => DataProcessor.formatCurrency(val, state.settings.currency),
            style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' }
          }
        },
        yaxis: {
          labels: {
            formatter: (val: string) => val.toString(),
            style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' }
          }
        }
      }
    }]
  };

  return (
    <ChartContainer
      title={`Factory Performance${isMultiDataset ? ' Comparison' : ''}`}
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