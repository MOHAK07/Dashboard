import React, { useState, useMemo } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { FlexibleDataRow } from '../../types';
import { ChartContainer } from './ChartContainer';
import { useApp } from '../../contexts/AppContext';

// Use the same color function for consistency
const getDatasetColorByName = (datasetName: string) => {
  const lowerName = datasetName.toLowerCase();
  
  // Fixed color mapping based on dataset type
  if (lowerName.includes('pos') && lowerName.includes('fom') && !lowerName.includes('lfom')) {
    return '#3b82f6'; // Blue for POS FOM
  } else if (lowerName.includes('pos') && lowerName.includes('lfom')) {
    return '#7ab839'; // Green for POS LFOM
  } else if (lowerName.includes('lfom') && !lowerName.includes('pos')) {
    return '#7ab839'; // Green for LFOM
  } else if (lowerName.includes('fom') && !lowerName.includes('pos') && !lowerName.includes('lfom')) {
    return '#f97316'; // Orange for FOM
  }
  
  // Fallback colors for other datasets
  const baseColors = [
    '#ef4444', '#8b5cf6', '#06b6d4', '#f59e0b', '#dc2626', '#84cc16', '#059669'
  ];
  
  return baseColors[Math.abs(datasetName.length) % baseColors.length];
};

const getDatasetDisplayName = (datasetName: string) => {
  const lowerName = datasetName.toLowerCase();
  
  if (lowerName.includes('pos') && lowerName.includes('fom') && !lowerName.includes('lfom')) {
    return 'POS FOM';
  } else if (lowerName.includes('pos') && lowerName.includes('lfom')) {
    return 'POS LFOM';
  } else if (lowerName.includes('lfom') && !lowerName.includes('pos')) {
    return 'LFOM';
  } else if (lowerName.includes('fom') && !lowerName.includes('pos') && !lowerName.includes('lfom')) {
    return 'FOM';
  }
  
  return datasetName;
};

interface WeeklyDataDistributionChartProps {
  className?: string;
}

export function WeeklyDataDistributionChart({ className = '' }: WeeklyDataDistributionChartProps) {
  const { state, getMultiDatasetData } = useApp();
  const [chartType, setChartType] = useState<'bar' | 'horizontalBar'>('bar');
  const isDarkMode = state.settings.theme === 'dark';
  
  const multiDatasetData = getMultiDatasetData();
  const isMultiDataset = multiDatasetData.length > 1;

  // Process weekly data for each dataset
  const processWeeklyData = useMemo(() => {
    if (state.datasets.length === 0) {
      return { categories: [], series: [], hasData: false };
    }

    const allWeekMonthCombos = new Set<string>();
    const datasetSeries: any[] = [];

    // Process each active dataset
    state.datasets
      .filter(dataset => state.activeDatasetIds.includes(dataset.id))
      .forEach((dataset, index) => {
        // Find quantity, week, and month columns
        const quantityColumn = Object.keys(dataset.data[0] || {}).find(col => 
          col.toLowerCase() === 'quantity'
        );
        const weekColumn = Object.keys(dataset.data[0] || {}).find(col => 
          col.toLowerCase() === 'week'
        );
        const monthColumn = Object.keys(dataset.data[0] || {}).find(col => 
          col.toLowerCase() === 'month'
        );

        if (!quantityColumn || !weekColumn || !monthColumn) {
          return;
        }

        // Group by week-month combination and sum quantities
        const weeklyData = new Map<string, { quantity: number; month: string; week: string }>();
        
        dataset.data.forEach(row => {
          const week = String(row[weekColumn] || '').trim();
          const month = String(row[monthColumn] || '').trim();
          const quantity = parseFloat(String(row[quantityColumn] || '0')) || 0;
          
          if (week && month && quantity > 0) {
            // Create a unique key for week-month combination
            const weekMonthKey = `${week}-${month}`;
            allWeekMonthCombos.add(weekMonthKey);
            
            if (!weeklyData.has(weekMonthKey)) {
              weeklyData.set(weekMonthKey, { quantity: 0, month, week });
            }
            
            const current = weeklyData.get(weekMonthKey)!;
            current.quantity += quantity;
          }
        });

        // Determine dataset display name with corrected color mapping
        datasetSeries.push({
          name: getDatasetDisplayName(dataset.name),
          data: weeklyData,
          color: getDatasetColorByName(dataset.name),
          datasetId: dataset.id
        });
      });

    // Sort week-month combinations chronologically
    const sortedWeekMonths = Array.from(allWeekMonthCombos).sort((a, b) => {
      const [weekA, monthA] = a.split('-');
      const [weekB, monthB] = b.split('-');
      
      const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
      
      const monthIndexA = monthOrder.indexOf(monthA);
      const monthIndexB = monthOrder.indexOf(monthB);
      
      if (monthIndexA !== monthIndexB) {
        return monthIndexA - monthIndexB;
      }
      
      // Extract week number for sorting within same month
      const weekNumA = parseInt(weekA.replace(/\D/g, '')) || 0;
      const weekNumB = parseInt(weekB.replace(/\D/g, '')) || 0;
      return weekNumA - weekNumB;
    });

    // Create final series with aligned data and formatted categories
    const finalSeries = datasetSeries.map(series => ({
      name: series.name,
      data: sortedWeekMonths.map(weekMonth => {
        const weekData = series.data.get(weekMonth);
        return weekData ? Math.round(weekData.quantity * 100) / 100 : 0;
      }),
      color: series.color
    }));

    // Create formatted categories with month abbreviations in brackets
    const formattedCategories = sortedWeekMonths.map(weekMonth => {
      const [week, month] = weekMonth.split('-');
      const monthAbbr = month.substring(0, 3); // Get first 3 letters
      return `${week} (${monthAbbr})`;
    });

    return {
      categories: formattedCategories,
      series: finalSeries,
      hasData: finalSeries.length > 0 && sortedWeekMonths.length > 0
    };
  }, [state.datasets, state.activeDatasetIds]);

  if (!processWeeklyData.hasData) {
    return (
      <ChartContainer
        title="Data Distribution - Weekly Quantity Analysis"
        availableTypes={['bar', 'horizontalBar']}
        currentType={chartType}
        onChartTypeChange={(type) => setChartType(type as 'bar' | 'horizontalBar')}
        className={className}
      >
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <p className="text-lg font-medium">No Weekly Data Available</p>
            <p className="text-sm mt-2">
              Upload datasets with 'Quantity', 'Week', and 'Month' columns to view distribution
            </p>
          </div>
        </div>
      </ChartContainer>
    );
  }

  const isHorizontalBar = chartType === 'horizontalBar';
  const actualChartType = isHorizontalBar ? 'bar' : chartType;

  const chartOptions: ApexOptions = {
    chart: {
      type: actualChartType,
      background: 'transparent',
      toolbar: { show: false },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800
      }
    },
    
    stroke: {
      curve: 'smooth',
      width: 0,
    },
    
    dataLabels: { enabled: false },
    
    xaxis: {
      categories: processWeeklyData.categories,
      labels: {
        style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
        rotate: !isHorizontalBar && processWeeklyData.categories.length > 8 ? -45 : 0
      },
      title: {
        text: isHorizontalBar ? 'Quantity' : 'Week (Month)',
        style: { color: isDarkMode ? '#9ca3af' : '#6b7280' }
      }
    },
    
    yaxis: {
      labels: {
        formatter: (val: number) => {
          return val.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
          });
        },
        style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' }
      },
      title: {
        text: isHorizontalBar ? 'Week (Month)' : 'Quantity',
        style: { color: isDarkMode ? '#9ca3af' : '#6b7280' }
      }
    },
    
    colors: processWeeklyData.series.map(s => s.color),
    
    theme: { mode: isDarkMode ? 'dark' : 'light' },
    
    grid: { 
      borderColor: isDarkMode ? '#374151' : '#e5e7eb',
      padding: {
        top: 0,
        right: 10,
        bottom: 0,
        left: 10
      }
    },
    
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
      shared: true,
      intersect: false,
      y: {
        formatter: (val: number) => {
          return `${val.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
          })} units`;
        }
      }
    },
    
    legend: {
      show: true,
      position: 'top',
      labels: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
      markers: {
        width: 12,
        height: 12,
        radius: 6
      }
    },
    
    markers: {
      size: 0,
      colors: processWeeklyData.series.map(s => s.color),
      strokeColors: '#ffffff',
      strokeWidth: 2,
      hover: { size: 8 }
    },
    
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '75%',
        horizontal: isHorizontalBar,
        dataLabels: { position: isHorizontalBar ? 'center' : 'top' }
      }
    },
    
    responsive: [{
      breakpoint: 768,
      options: {
        legend: { position: 'bottom' },
        xaxis: {
          labels: { rotate: isHorizontalBar ? 0 : -90 }
        },
        plotOptions: {
          bar: {
            horizontal: true
          }
        }
      }
    }]
  };

  return (
    <ChartContainer
      title={`Data Distribution - Weekly Quantity Analysis${isMultiDataset ? ' - Dataset Comparison' : ''}`}
      availableTypes={['bar', 'horizontalBar']}
      currentType={chartType}
      onChartTypeChange={(type) => setChartType(type as 'bar' | 'horizontalBar')}
      className={className}
    >
      <div className="w-full h-full min-h-[500px]">
        <Chart
          options={chartOptions}
          series={processWeeklyData.series}
          type={actualChartType}
          height="500px"
          width="100%"
        />
      </div>
    </ChartContainer>
  );
}