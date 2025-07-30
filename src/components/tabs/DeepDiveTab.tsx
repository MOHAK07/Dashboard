import React, { useState } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { DataRow } from '../../types';
import { DataProcessor } from '../../utils/dataProcessing';
import { ChartContainer } from '../charts/ChartContainer';
import { useApp } from '../../contexts/AppContext';

interface DeepDiveTabProps {
  data: DataRow[];
}

export function DeepDiveTab({ data }: DeepDiveTabProps) {
  const { state, getMultiDatasetData } = useApp();
  const isDarkMode = state.settings.theme === 'dark';
  const multiDatasetData = getMultiDatasetData();
  const isMultiDataset = multiDatasetData.length > 1;
  
  // Return placeholder if no data is available
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-lg font-medium">No data available</p>
          <p className="text-sm">Upload data to view detailed analysis</p>
        </div>
      </div>
    );
  }

  const productData = DataProcessor.aggregateByProduct(data);

  // Return placeholder if no product data is available
  if (!productData || productData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-lg font-medium">No product data available</p>
          <p className="text-sm">The uploaded data doesn't contain product information</p>
        </div>
      </div>
    );
  }

  // Treemap Data
  const treemapOptions: ApexOptions = {
    chart: {
      type: 'treemap',
      background: 'transparent',
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '12px',
        fontWeight: 'bold',
        colors: ['#ffffff'],
      },
      formatter: (text: string, opts: any) => {
        const value = opts.value;
        return [text, DataProcessor.formatCurrency(value)];
      },
    },
    colors: [
      '#3b82f6', '#22c55e', '#f97316', '#ef4444', '#8b5cf6', 
      '#06b6d4', '#f59e0b', '#ec4899', '#84cc16', '#6366f1'
    ],
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
      y: {
        formatter: (val: number) => DataProcessor.formatCurrency(val, state.settings.currency),
      },
    },
    plotOptions: {
      treemap: {
        distributed: true,
        enableShades: false,
      },
    },
  };

  const treemapSeries = [
    {
      data: productData.map(product => ({
        x: product.name,
        y: product.totalRevenue,
      })),
    },
  ];

  // Scatter Plot Data
  const scatterOptions: ApexOptions = {
    chart: {
      type: 'scatter',
      zoom: {
        enabled: true,
        type: 'xy',
      },
      background: 'transparent',
    },
    xaxis: {
      title: {
        text: 'Units Sold',
        style: {
          color: isDarkMode ? '#9ca3af' : '#6b7280',
        },
      },
      labels: {
        formatter: (val: number) => DataProcessor.formatNumber(val),
        style: {
          colors: isDarkMode ? '#9ca3af' : '#6b7280',
        },
      },
    },
    yaxis: {
      title: {
        text: 'Revenue',
        style: {
          color: isDarkMode ? '#9ca3af' : '#6b7280',
        },
      },
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
      custom: ({ dataPointIndex }: any) => {
        const product = productData[dataPointIndex];
        return `
          <div class="p-3">
            <div class="font-semibold">${product.name}</div>
            <div>Units: ${DataProcessor.formatNumber(product.totalUnits)}</div>
            <div>Revenue: ${DataProcessor.formatCurrency(product.totalRevenue, state.settings.currency)}</div>
            <div>Avg Price: ${DataProcessor.formatCurrency(product.avgRevenuePerUnit, state.settings.currency)}</div>
          </div>
        `;
      },
    },
  };

  const scatterSeries = [
    {
      name: 'Products',
      data: productData.map(product => ({
        x: product.totalUnits,
        y: product.totalRevenue,
      })),
    },
  ];

  // Heatmap Data - Monthly Sales by Product
  const monthlyData = new Map<string, Map<string, number>>();
  
  data.forEach(row => {
    const month = row.Date.substring(0, 7);
    if (!monthlyData.has(month)) {
      monthlyData.set(month, new Map());
    }
    const monthMap = monthlyData.get(month)!;
    const currentValue = monthMap.get(row.ProductName) || 0;
    monthMap.set(row.ProductName, currentValue + row.Revenue);
  });

  const allMonths = Array.from(monthlyData.keys()).sort();
  const topProducts = productData.slice(0, 10).map(p => p.name); // Top 10 products by revenue

  const heatmapSeries = topProducts.map(product => ({
    name: product,
    data: allMonths.map(month => {
      const value = monthlyData.get(month)?.get(product) || 0;
      return {
        x: month,
        y: value,
      };
    }),
  }));

  const heatmapOptions: ApexOptions = {
    chart: {
      type: 'heatmap',
      background: 'transparent',
    },
    dataLabels: {
      enabled: false,
    },
    colors: ['#3b82f6'],
    xaxis: {
      type: 'category',
      categories: allMonths,
      labels: {
        style: {
          colors: isDarkMode ? '#9ca3af' : '#6b7280',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: isDarkMode ? '#9ca3af' : '#6b7280',
        },
      },
    },
    theme: {
      mode: isDarkMode ? 'dark' : 'light',
    },
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
      y: {
        formatter: (val: number) => DataProcessor.formatCurrency(val, state.settings.currency),
      },
    },
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.5,
        colorScale: {
          ranges: [
            { from: 0, to: 0, color: '#f3f4f6' },
            { from: 1, to: 1000000, color: '#3b82f6' },
          ],
        },
      },
    },
  };

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
                Multi-Dataset Deep Dive
              </h3>
              <p className="text-sm text-primary-700 dark:text-primary-300">
                Analyzing product performance across {multiDatasetData.length} datasets: {multiDatasetData.map(d => d.datasetName).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Product Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Top Product by Revenue
          </h4>
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {productData[0]?.name || 'N/A'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {DataProcessor.formatCurrency(productData[0]?.totalRevenue || 0, state.settings.currency)}
          </p>
        </div>
        
        <div className="card">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Most Popular Product
          </h4>
          <p className="text-2xl font-bold text-secondary-600 dark:text-secondary-400">
            {productData.sort((a, b) => b.totalUnits - a.totalUnits)[0]?.name || 'N/A'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {DataProcessor.formatNumber(productData.sort((a, b) => b.totalUnits - a.totalUnits)[0]?.totalUnits || 0)} units
          </p>
        </div>
        
        <div className="card">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Highest Avg Price
          </h4>
          <p className="text-2xl font-bold text-accent-600 dark:text-accent-400">
            {productData.sort((a, b) => b.avgRevenuePerUnit - a.avgRevenuePerUnit)[0]?.name || 'N/A'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {DataProcessor.formatCurrency(productData.sort((a, b) => b.avgRevenuePerUnit - a.avgRevenuePerUnit)[0]?.avgRevenuePerUnit || 0, state.settings.currency)}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartContainer title="Product Revenue Contribution (Treemap)">
          <Chart
            options={treemapOptions}
            series={treemapSeries}
            type="treemap"
            height="100%"
          />
        </ChartContainer>

        <ChartContainer title="Units vs Revenue Correlation">
          <Chart
            options={scatterOptions}
            series={scatterSeries}
            type="scatter"
            height="100%"
          />
        </ChartContainer>
      </div>

      <ChartContainer title="Monthly Sales Heatmap by Product" className="col-span-full">
        <Chart
          options={heatmapOptions}
          series={heatmapSeries}
          type="heatmap"
          height="100%"
        />
      </ChartContainer>
    </div>
  );
}