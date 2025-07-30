import React, { useState } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { DataRow } from '../../types';
import { DataProcessor } from '../../utils/dataProcessing';
import { ChartContainer } from '../charts/ChartContainer';
import { useApp } from '../../contexts/AppContext';

interface ComparisonTabProps {
  data: DataRow[];
}

export function ComparisonTab({ data }: ComparisonTabProps) {
  const { state, getMultiDatasetData } = useApp();
  const isDarkMode = state.settings.theme === 'dark';
  const multiDatasetData = getMultiDatasetData();
  const isMultiDataset = multiDatasetData.length > 1;
  
  const [selectedPlants, setSelectedPlants] = useState<string[]>([]);
  
  // Return placeholder if no data is available
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-lg font-medium">No data available</p>
          <p className="text-sm">Upload data to view plant comparisons</p>
        </div>
      </div>
    );
  }

  const uniquePlants = DataProcessor.getUniqueValues(data, 'PlantName');
  const plantData = DataProcessor.aggregateByPlant(data);
  
  // Return placeholder if no plant data is available
  if (!plantData || plantData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-lg font-medium">No plant data available</p>
          <p className="text-sm">The uploaded data doesn't contain plant information</p>
        </div>
      </div>
    );
  }

  const filteredPlantData = selectedPlants.length > 0 
    ? plantData.filter(plant => selectedPlants.includes(plant.name))
    : plantData.slice(0, 5); // Show top 5 by default

  // KPI Cards for selected plants
  const plantKPIs = filteredPlantData.map(plant => ({
    name: plant.name,
    totalRevenue: plant.totalRevenue,
    totalUnits: plant.totalUnits,
    avgRevenuePerUnit: plant.avgRevenuePerUnit,
    productCount: Object.keys(plant.products).length,
  }));

  // Grouped Bar Chart Data
  const productNames = Array.from(new Set(
    filteredPlantData.flatMap(plant => Object.keys(plant.products))
  ));

  const groupedBarOptions: ApexOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      background: 'transparent',
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '70%',
        borderRadius: 4,
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: productNames,
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
    colors: ['#3b82f6', '#22c55e', '#f97316', '#ef4444', '#8b5cf6'],
    theme: {
      mode: isDarkMode ? 'dark' : 'light',
    },
    grid: {
      borderColor: isDarkMode ? '#374151' : '#e5e7eb',
    },
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
      y: {
        formatter: (val: number) => DataProcessor.formatCurrency(val, state.settings.currency),
      },
    },
    legend: {
      labels: {
        colors: isDarkMode ? '#9ca3af' : '#6b7280',
      },
    },
  };

  const groupedBarSeries = filteredPlantData.map(plant => ({
    name: plant.name,
    data: productNames.map(product => plant.products[product]?.revenue || 0),
  }));

  // Radar Chart Data
  const radarOptions: ApexOptions = {
    chart: {
      type: 'radar',
      background: 'transparent',
    },
    xaxis: {
      categories: ['Revenue', 'Units Sold', 'Avg Price', 'Product Variety'],
      labels: {
        style: {
          colors: isDarkMode ? '#9ca3af' : '#6b7280',
        },
      },
    },
    yaxis: {
      show: false,
    },
    colors: ['#3b82f6', '#22c55e', '#f97316', '#ef4444', '#8b5cf6'],
    theme: {
      mode: isDarkMode ? 'dark' : 'light',
    },
    legend: {
      labels: {
        colors: isDarkMode ? '#9ca3af' : '#6b7280',
      },
    },
    plotOptions: {
      radar: {
        polygons: {
          strokeColors: isDarkMode ? '#374151' : '#e5e7eb',
          connectorColors: isDarkMode ? '#374151' : '#e5e7eb',
        },
      },
    },
  };

  // Normalize data for radar chart (0-100 scale)
  const maxRevenue = Math.max(...plantKPIs.map(p => p.totalRevenue));
  const maxUnits = Math.max(...plantKPIs.map(p => p.totalUnits));
  const maxAvgPrice = Math.max(...plantKPIs.map(p => p.avgRevenuePerUnit));
  const maxProducts = Math.max(...plantKPIs.map(p => p.productCount));

  const radarSeries = plantKPIs.map(plant => ({
    name: plant.name,
    data: [
      (plant.totalRevenue / maxRevenue) * 100,
      (plant.totalUnits / maxUnits) * 100,
      (plant.avgRevenuePerUnit / maxAvgPrice) * 100,
      (plant.productCount / maxProducts) * 100,
    ],
  }));

  return (
    <div className="space-y-8">
      {/* Multi-dataset indicator */}
      {isMultiDataset && (
        <div className="card bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-800 rounded-lg">
              <Database className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="font-semibold text-primary-900 dark:text-primary-100">
                Multi-Dataset Comparison Mode
              </h3>
              <p className="text-sm text-primary-700 dark:text-primary-300">
                Comparing data across {multiDatasetData.length} active datasets: {multiDatasetData.map(d => d.datasetName).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Plant Selection */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Select Plants to Compare{isMultiDataset ? ' (Across All Active Datasets)' : ''}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {uniquePlants.map(plant => (
            <label key={plant} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedPlants.includes(plant)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedPlants([...selectedPlants, plant]);
                  } else {
                    setSelectedPlants(selectedPlants.filter(p => p !== plant));
                  }
                }}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{plant}</span>
            </label>
          ))}
        </div>
        {selectedPlants.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Showing top 5 plants by default. Select plants above to customize comparison.
          </p>
        )}
      </div>

      {/* KPI Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {plantKPIs.map((plant, index) => (
          <div key={plant.name} className="card">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {plant.name}
            </h4>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                  {DataProcessor.formatCurrency(plant.totalRevenue, state.settings.currency)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Units Sold</p>
                <p className="text-lg font-bold text-secondary-600 dark:text-secondary-400">
                  {DataProcessor.formatNumber(plant.totalUnits)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Price</p>
                <p className="text-lg font-bold text-accent-600 dark:text-accent-400">
                  {DataProcessor.formatCurrency(plant.avgRevenuePerUnit, state.settings.currency)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Products</p>
                <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
                  {plant.productCount}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartContainer title="Revenue by Product and Plant">
          <Chart
            options={groupedBarOptions}
            series={groupedBarSeries}
            type="bar"
            height="100%"
          />
        </ChartContainer>

        <ChartContainer title="Multi-Metric Comparison">
          <Chart
            options={radarOptions}
            series={radarSeries}
            type="radar"
            height="100%"
          />
        </ChartContainer>
      </div>
    </div>
  );
}