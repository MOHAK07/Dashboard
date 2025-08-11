import React, { useState, useMemo } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { FlexibleDataRow } from '../../types';
import { ChartContainer } from './ChartContainer';
import { useApp } from '../../contexts/AppContext';

// Use the same color function for consistency
const getUniqueDatasetColor = (datasetIndex: number, totalDatasets: number) => {
  const baseColors = [
    '#3b82f6', // blue
    '#7ab839', // green
    '#f97316', // orange
    '#ef4444', // red
    '#1A2885', // dark blue
    '#06b6d4', // cyan
    '#f59e0b', // amber
    '#dc2626', // red variant
    '#84cc16', // lime
    '#059669', // emerald
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange variant
    '#6366f1', // indigo
  ];
  
  return baseColors[datasetIndex % baseColors.length];
};

interface DynamicRevenueBreakdownChartProps {
  className?: string;
}

export function DynamicRevenueBreakdownChart({ className = '' }: DynamicRevenueBreakdownChartProps) {
  const { state } = useApp();
  const [chartType, setChartType] = useState<'donut' | 'pie'>('donut');
  const isDarkMode = state.settings.theme === 'dark';

  // Process revenue data for allowed datasets only
  const processRevenueData = useMemo(() => {
    if (state.datasets.length === 0) {
      return { labels: [], series: [], colors: [], hasData: false, totalRevenue: 0 };
    }

    // Filter for allowed datasets only: FOM, LFOM, POS LFOM, POS FOM
    const allowedDatasets = state.datasets.filter(dataset => {
      const isActive = state.activeDatasetIds.includes(dataset.id);
      const name = dataset.name.toLowerCase();
      
      // Exclude MDA claim and stocks datasets
      if (name.includes('mda') || name.includes('claim') || name.includes('stock')) {
        return false;
      }
      
      // Include only FOM, LFOM, POS FOM, POS LFOM
      const isFOM = name.includes('fom') && !name.includes('pos') && !name.includes('lfom');
      const isLFOM = name.includes('lfom') && !name.includes('pos');
      const isPOSFOM = name.includes('pos') && name.includes('fom') && !name.includes('lfom');
      const isPOSLFOM = name.includes('pos') && name.includes('lfom');
      
      return isActive && (isFOM || isLFOM || isPOSFOM || isPOSLFOM);
    });

    if (allowedDatasets.length === 0) {
      return { labels: [], series: [], colors: [], hasData: false, totalRevenue: 0 };
    }

    const revenueData: { name: string; revenue: number; color: string }[] = [];
    let totalRevenue = 0;

    allowedDatasets.forEach((dataset, index) => {
      // Find price/revenue column (prefer Price over other columns)
      const priceColumn = Object.keys(dataset.data[0] || {}).find(col => 
        col.toLowerCase() === 'price'
      ) || Object.keys(dataset.data[0] || {}).find(col => 
        col.toLowerCase().includes('revenue') || 
        col.toLowerCase().includes('amount') ||
        col.toLowerCase().includes('value')
      );

      if (!priceColumn) {
        return;
      }

      // Calculate total revenue for this dataset
      const datasetRevenue = dataset.data.reduce((sum, row) => {
        const price = parseFloat(String(row[priceColumn] || '0')) || 0;
        return sum + price;
      }, 0);

      if (datasetRevenue > 0) {
        // Determine corrected dataset display name
        let displayName = dataset.name;
        if (dataset.name.toLowerCase().includes('lfom') && !dataset.name.toLowerCase().includes('pos')) {
          displayName = 'LFOM';
        } else if (dataset.name.toLowerCase().includes('fom') && !dataset.name.toLowerCase().includes('pos') && !dataset.name.toLowerCase().includes('lfom')) {
          displayName = 'FOM';
        } else if (dataset.name.toLowerCase().includes('pos') && dataset.name.toLowerCase().includes('fom') && !dataset.name.toLowerCase().includes('lfom')) {
          displayName = 'POS FOM';
        } else if (dataset.name.toLowerCase().includes('pos') && dataset.name.toLowerCase().includes('lfom')) {
          displayName = 'POS LFOM';
        }

        revenueData.push({
          name: displayName,
          revenue: Math.round(datasetRevenue * 100) / 100,
          color: getUniqueDatasetColor(index, allowedDatasets.length)
        });

        totalRevenue += datasetRevenue;
      }
    });

    if (revenueData.length === 0) {
      return { labels: [], series: [], colors: [], hasData: false, totalRevenue: 0 };
    }

    return {
      labels: revenueData.map(item => item.name),
      series: revenueData.map(item => item.revenue),
      colors: revenueData.map(item => item.color),
      hasData: true,
      totalRevenue: Math.round(totalRevenue * 100) / 100
    };
  }, [state.datasets, state.activeDatasetIds]);

  if (!processRevenueData.hasData) {
    return (
      <ChartContainer
        title="Category Breakdown - Revenue Distribution"
        availableTypes={['donut', 'pie']}
        currentType={chartType}
        onChartTypeChange={(type) => setChartType(type as 'donut' | 'pie')}
        className={className}
      >
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <p className="text-lg font-medium">No Revenue Data Available</p>
            <p className="text-sm mt-2">
              Activate FOM, LFOM, POS FOM, or POS LFOM datasets with 'Price' columns to view breakdown
            </p>
          </div>
        </div>
      </ChartContainer>
    );
  }

  const chartOptions: ApexOptions = {
    chart: {
      type: chartType,
      background: 'transparent',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800
      }
    },
    
    labels: processRevenueData.labels,
    colors: processRevenueData.colors,
    
    legend: {
      position: 'bottom',
      labels: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
      markers: {
        width: 12,
        height: 12,
        radius: 6
      }
    },
    
    plotOptions: {
      pie: {
        donut: {
          size: chartType === 'donut' ? '60%' : '0%',
          labels: {
            show: chartType === 'donut',
            name: {
              show: true,
              color: isDarkMode ? '#9ca3af' : '#6b7280',
              fontSize: '16px',
              fontWeight: 600
            },
            value: {
              show: true,
              fontSize: '24px',
              fontWeight: 700,
              color: isDarkMode ? '#f3f4f6' : '#374151',
              formatter: (val: string) => {
                const numVal = parseFloat(val);
                return `₹${numVal.toLocaleString('en-IN', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                })}`;
              }
            },
            total: {
              show: true,
              label: 'Total Revenue',
              fontSize: '14px',
              color: isDarkMode ? '#9ca3af' : '#6b7280',
              formatter: () => {
                return `₹${processRevenueData.totalRevenue.toLocaleString('en-IN', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                })}`;
              }
            }
          }
        },
        expandOnClick: false
      }
    },
    
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
      style: { 
        colors: ['#ffffff'],
        fontSize: '14px',
        fontWeight: 'bold'
      },
      dropShadow: {
        enabled: true,
        top: 1,
        left: 1,
        blur: 1,
        opacity: 0.8
      }
    },
    
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
      y: {
        formatter: (val: number) => {
          const percentage = ((val / processRevenueData.totalRevenue) * 100).toFixed(1);
          return `₹${val.toLocaleString('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          })} (${percentage}%)`;
        }
      }
    },
    
    responsive: [{
      breakpoint: 768,
      options: {
        legend: { position: 'bottom' },
        plotOptions: {
          pie: {
            donut: {
              labels: {
                value: {
                  fontSize: '20px'
                },
                total: {
                  fontSize: '12px'
                }
              }
            }
          }
        }
      }
    }]
  };

  return (
    <ChartContainer
      title="Category Breakdown - Revenue Distribution"
      availableTypes={['donut', 'pie']}
      currentType={chartType}
      onChartTypeChange={(type) => setChartType(type as 'donut' | 'pie')}
      className={className}
    >
      <div className="w-full h-full min-h-[500px] flex items-center justify-center">
        <div className="w-full max-w-[600px] h-[400px]">
          <Chart
            options={chartOptions}
            series={processRevenueData.series}
            type={chartType}
            height="100%"
            width="100%"
          />
        </div>
      </div>
      
      {/* Revenue Summary */}
      <div className="mt-4 text-center">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Total Revenue: ₹{processRevenueData.totalRevenue.toLocaleString('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          })}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Based on {processRevenueData.labels.length} active dataset{processRevenueData.labels.length > 1 ? 's' : ''}
        </p>
      </div>
    </ChartContainer>
  );
}