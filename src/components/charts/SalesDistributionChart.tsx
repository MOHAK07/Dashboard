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
  const { state, getMultiDatasetData } = useApp();
  const [chartType, setChartType] = useState<'donut' | 'pie'>('donut');
  
  const multiDatasetData = getMultiDatasetData();
  const isMultiDataset = multiDatasetData.length > 1;
  
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

  // For multi-dataset comparison, we'll show multiple pie charts side by side
  if (isMultiDataset) {
    return (
      <ChartContainer
        title="Sales Distribution by Plant - Dataset Comparison"
        onChartTypeChange={(type) => setChartType(type as 'donut' | 'pie')}
        availableTypes={['donut', 'pie']}
        currentType={chartType}
      >
        <div className="grid grid-cols-2 gap-8 h-full p-4 overflow-visible">
          {multiDatasetData.map((dataset, index) => {
            const datasetPlantData = DataProcessor.aggregateByPlant(dataset.data);
            const datasetTotalRevenue = datasetPlantData.reduce((sum, plant) => sum + plant.totalRevenue, 0);
            
            if (datasetPlantData.length === 0) return null;

            const chartOptions: ApexOptions = {
              chart: {
                type: chartType,
                background: 'transparent',
                fontFamily: 'inherit',
                animations: {
                  enabled: true,
                  speed: 300
                }
              },
              labels: datasetPlantData.map(plant => plant.name),
              colors: [
                dataset.color,
                `${dataset.color}CC`,
                `${dataset.color}99`,
                `${dataset.color}66`,
                `${dataset.color}33`
              ],
              legend: {
                show: false, // Hide individual legends to save space
              },
              plotOptions: {
                pie: {
                  donut: {
                    size: chartType === 'donut' ? '50%' : '0%',
                    labels: {
                      show: chartType === 'donut',
                      name: {
                        show: true,
                        fontSize: '10px',
                        color: isDarkMode ? '#9ca3af' : '#6b7280',
                      },
                      value: {
                        show: true,
                        fontSize: '12px',
                        formatter: (val: string) => DataProcessor.formatCurrency(Number(val), state.settings.currency),
                        color: isDarkMode ? '#f3f4f6' : '#374151',
                      },
                      total: {
                        show: true,
                        label: 'Total',
                        fontSize: '10px',
                        formatter: () => DataProcessor.formatCurrency(datasetTotalRevenue, state.settings.currency),
                        color: isDarkMode ? '#f3f4f6' : '#374151',
                      },
                    },
                  },
                },
              },
              dataLabels: {
                enabled: true,
                style: {
                  fontSize: '10px',
                  colors: ['#ffffff'],
                },
                formatter: (val: number) => val > 5 ? `${val.toFixed(0)}%` : '', // Only show if > 5%
              },
              tooltip: {
                theme: isDarkMode ? 'dark' : 'light',
                y: {
                  formatter: (val: number) => DataProcessor.formatCurrency(val, state.settings.currency),
                },
              },
            };

            const series = datasetPlantData.map(plant => plant.totalRevenue);

            return (
              <div key={dataset.datasetId} className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm h-[400px]">
                <div className="flex items-center space-x-2 mb-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: dataset.color }}
                  />
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 text-center">
                    {dataset.datasetName}
                  </h4>
                </div>
                <div className="w-full h-full flex items-center justify-center">
                  <Chart
                    options={chartOptions}
                    series={series}
                    type={chartType}
                    height="100%"
                    width="100%"
                  />
                </div>
                <div className="mt-2 text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Total: {DataProcessor.formatCurrency(datasetTotalRevenue, state.settings.currency)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </ChartContainer>
    );
  }

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
        offsetX: 0, // Remove the offset that was causing the chart to be partially off-screen
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
      <div className="relative w-full h-[400px] flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <div className="w-full h-full flex flex-col items-center justify-center">
          <div className="w-full max-w-[600px] h-[300px] flex items-center justify-center">
            <Chart
              key={chartKey}
              options={chartOptions}
              series={series}
              type={chartType}
              height="100%"
              width="100%"
            />
          </div>
          <div className={`mt-4 flex flex-col items-center justify-center text-center ${chartType === 'pie' && 'hidden'}`}>
          </div>
        </div>
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
