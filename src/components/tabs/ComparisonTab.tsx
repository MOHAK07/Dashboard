import React, { useState } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { Database } from 'lucide-react';
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

  /* ─────────────────────────────
     1. Guard-clauses (placeholders)
     ───────────────────────────── */
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

  /* ─────────────────────────────
     2. Plant aggregation
     ───────────────────────────── */
  const uniquePlants = DataProcessor.getUniqueValues(data, 'PlantName');

  const plantData = isMultiDataset
    ? createMultiDatasetPlantData(multiDatasetData)
    : DataProcessor.aggregateByPlant(data);

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

  /* ─────────────────────────────
     3. Filtering & KPIs
     ───────────────────────────── */
  const filteredPlantData =
    selectedPlants.length > 0
      ? plantData.filter((plant) => selectedPlants.includes(plant.name))
      : plantData.slice(0, isMultiDataset ? 8 : 5);

  const plantKPIs = filteredPlantData.map((plant) => {
    const productCount =
      typeof plant.products === 'object' && plant.products !== null
        ? Object.keys(plant.products).length
        : 0;

    return {
      name: plant.name,
      totalRevenue: plant.totalRevenue,
      totalUnits: plant.totalUnits,
      avgRevenuePerUnit: plant.avgRevenuePerUnit,
      productCount,
      datasetInfo: plant.datasetInfo || null,
    };
  });

  /* ─────────────────────────────
     4. Grouped-bar chart config
     ───────────────────────────── */
  const productNames = Array.from(
    new Set(
      filteredPlantData.flatMap((plant) =>
        typeof plant.products === 'object' && plant.products !== null
          ? Object.keys(plant.products)
          : []
      )
    )
  );

  const groupedBarOptions: ApexOptions = {
    chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
    plotOptions: { bar: { horizontal: false, columnWidth: '70%', borderRadius: 4 } },
    dataLabels: { enabled: false },
    xaxis: {
      categories: productNames,
      labels: { style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' } },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => DataProcessor.formatCurrency(val, state.settings.currency),
        style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
      },
    },
    colors: ['#3b82f6', '#22c55e', '#f97316', '#ef4444', '#8b5cf6'],
    theme: { mode: isDarkMode ? 'dark' : 'light' },
    grid: { borderColor: isDarkMode ? '#374151' : '#e5e7eb' },
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
      y: { formatter: (val: number) => DataProcessor.formatCurrency(val, state.settings.currency) },
    },
    legend: { labels: { colors: isDarkMode ? '#9ca3af' : '#6b7280' } },
  };

  const groupedBarSeries = filteredPlantData.map((plant) => ({
    name: plant.name,
    data: productNames.map((product) =>
      typeof plant.products === 'object' && plant.products !== null
        ? plant.products[product]?.revenue || 0
        : 0
    ),
  }));

  /* ─────────────────────────────
     5. Radar chart config
     ───────────────────────────── */
  const radarOptions: ApexOptions = {
    chart: { type: 'radar', background: 'transparent' },
    xaxis: {
      categories: ['Revenue', 'Units Sold', 'Avg Price', 'Product Variety'],
      labels: { style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' } },
    },
    yaxis: { show: false },
    colors: ['#3b82f6', '#22c55e', '#f97316', '#ef4444', '#8b5cf6'],
    theme: { mode: isDarkMode ? 'dark' : 'light' },
    legend: { labels: { colors: isDarkMode ? '#9ca3af' : '#6b7280' } },
    plotOptions: {
      radar: {
        polygons: {
          strokeColors: isDarkMode ? '#374151' : '#e5e7eb',
          connectorColors: isDarkMode ? '#374151' : '#e5e7eb',
        },
      },
    },
  };

  const maxRevenue = Math.max(...plantKPIs.map((p) => p.totalRevenue));
  const maxUnits = Math.max(...plantKPIs.map((p) => p.totalUnits));
  const maxAvgPrice = Math.max(...plantKPIs.map((p) => p.avgRevenuePerUnit));
  const maxProducts = Math.max(...plantKPIs.map((p) => p.productCount));

  const radarSeries = plantKPIs.map((plant) => ({
    name: plant.name,
    data: [
      (plant.totalRevenue / maxRevenue) * 100,
      (plant.totalUnits / maxUnits) * 100,
      (plant.avgRevenuePerUnit / maxAvgPrice) * 100,
      (plant.productCount / maxProducts) * 100,
    ],
  }));

  /* ─────────────────────────────
     6. JSX render
     ───────────────────────────── */
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
                Comparing data across {multiDatasetData.length} active datasets:{' '}
                {multiDatasetData.map((d) => d.datasetName).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Plant selection */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Select Plants to Compare{isMultiDataset ? ' (Across All Active Datasets)' : ''}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {uniquePlants.map((plant) => (
            <label key={plant} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedPlants.includes(plant)}
                onChange={(e) =>
                  e.target.checked
                    ? setSelectedPlants([...selectedPlants, plant])
                    : setSelectedPlants(selectedPlants.filter((p) => p !== plant))
                }
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{plant}</span>
            </label>
          ))}
        </div>
        {selectedPlants.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Showing top {isMultiDataset ? 8 : 5} plants by default. Select plants above to
            customize comparison.
          </p>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {plantKPIs.map((plant) => (
          <div key={plant.name} className="card">
            <div className="flex items-center justify-between mb-4">
              {/* FIX: plant.name now inside <h4> tag and tag properly closed */}
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                {plant.name}
              </h4>
              {plant.datasetInfo && (
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: plant.datasetInfo.color }}
                  title={`From dataset: ${plant.datasetInfo.name}`}
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-sm font-bold text-primary-600 dark:text-primary-400 break-words">
                  {DataProcessor.formatCurrency(plant.totalRevenue, state.settings.currency)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-600 dark:text-gray-400">Units Sold</p>
                <p className="text-sm font-bold text-secondary-600 dark:text-secondary-400">
                  {DataProcessor.formatNumber(plant.totalUnits)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-600 dark:text-gray-400">Avg Price</p>
                <p className="text-sm font-bold text-accent-600 dark:text-accent-400 break-words">
                  {DataProcessor.formatCurrency(plant.avgRevenuePerUnit, state.settings.currency)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-600 dark:text-gray-400">Products</p>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  {plant.productCount}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="space-y-8">
        <ChartContainer title="Revenue by Product and Plant" className="w-full">
          <Chart options={groupedBarOptions} series={groupedBarSeries} type="bar" height="100%" />
        </ChartContainer>

        <ChartContainer title="Multi-Metric Comparison" className="w-full">
          <Chart options={radarOptions} series={radarSeries} type="radar" height="100%" />
        </ChartContainer>
      </div>
    </div>
  );
}

/* ─────────────────────────────
   7. Helper for multi-datasets
   ───────────────────────────── */
function createMultiDatasetPlantData(
  multiDatasetData: Array<{
    datasetId: string;
    datasetName: string;
    data: DataRow[];
    color: string;
  }>
) {
  const plantMap = new Map<
    string,
    ReturnType<typeof DataProcessor.aggregateByPlant>[number] & {
      datasetInfo: { name: string; color: string; id: string };
    }
  >();

  multiDatasetData.forEach((dataset) => {
    const datasetPlantData = DataProcessor.aggregateByPlant(dataset.data);

    datasetPlantData.forEach((plant) => {
      const key = plant.name;

      if (!plantMap.has(key)) {
        plantMap.set(key, {
          ...plant,
          datasetInfo: { name: dataset.datasetName, color: dataset.color, id: dataset.datasetId },
        });
      } else {
        const existing = plantMap.get(key)!;
        existing.totalRevenue += plant.totalRevenue;
        existing.totalUnits += plant.totalUnits;

        Object.keys(plant.products).forEach((productName) => {
          if (existing.products[productName]) {
            existing.products[productName].revenue += plant.products[productName].revenue;
            existing.products[productName].units += plant.products[productName].units;
          } else {
            existing.products[productName] = { ...plant.products[productName] };
          }
        });

        existing.avgRevenuePerUnit =
          existing.totalUnits > 0 ? existing.totalRevenue / existing.totalUnits : 0;

        if (existing.datasetInfo.id !== dataset.datasetId) {
          existing.datasetInfo = { name: 'Multiple Datasets', color: '#6b7280', id: 'mixed' };
        }
      }
    });
  });

  return Array.from(plantMap.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
}
