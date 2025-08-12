// import React, { useState, useMemo } from 'react';
// import Chart from 'react-apexcharts';
// import { ApexOptions } from 'apexcharts';
// import { FlexibleDataRow } from '../../types';
// import { ChartContainer } from './ChartContainer';
// import { useApp } from '../../contexts/AppContext';
// import { ColorManager } from '../../utils/colorManager';

// interface StockAnalysisChartProps {
//   className?: string;
// }

// export function StockAnalysisChart({ className = '' }: StockAnalysisChartProps) {
//   const { state } = useApp();
//   const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');
//   const isDarkMode = state.settings.theme === 'dark';

//   // Process stock data for both RCF and Boomi Samrudhi
//   const processStockData = useMemo(() => {
//     // Find stock datasets
//     const stockDatasets = state.datasets.filter(dataset => 
//       state.activeDatasetIds.includes(dataset.id) && 
//       ColorManager.isStockDataset(dataset.name)
//     );

//     if (stockDatasets.length === 0) {
//       return { rcfData: null, boomiData: null, hasData: false };
//     }

//     // Combine all stock data
//     const allStockData = stockDatasets.flatMap(dataset => dataset.data);

//     if (allStockData.length === 0) {
//       return { rcfData: null, boomiData: null, hasData: false };
//     }

//     // Find required columns (case-insensitive)
//     const sampleRow = allStockData[0];
//     const columns = Object.keys(sampleRow);
    
//     const dateColumn = columns.find(col => {
//       const lowerCol = col.toLowerCase().trim();
//       return lowerCol === 'date';
//     });

//     // RCF columns
//     const rcfProductionColumn = columns.find(col => {
//       const lowerCol = col.toLowerCase().trim();
//       return lowerCol.includes('rcf') && lowerCol.includes('production');
//     });
//     const rcfSalesColumn = columns.find(col => {
//       const lowerCol = col.toLowerCase().trim();
//       return lowerCol.includes('rcf') && lowerCol.includes('sales');
//     });
//     const rcfStockColumn = columns.find(col => {
//       const lowerCol = col.toLowerCase().trim();
//       return lowerCol.includes('rcf') && lowerCol.includes('stock');
//     });

//     // Boomi Samrudhi columns
//     const boomiProductionColumn = columns.find(col => {
//       const lowerCol = col.toLowerCase().trim();
//       return lowerCol.includes('boomi') && lowerCol.includes('production');
//     });
//     const boomiSalesColumn = columns.find(col => {
//       const lowerCol = col.toLowerCase().trim();
//       return lowerCol.includes('boomi') && lowerCol.includes('sales');
//     });
//     const boomiStockColumn = columns.find(col => {
//       const lowerCol = col.toLowerCase().trim();
//       return lowerCol.includes('boomi') && lowerCol.includes('stock');
//     });

//     console.log('Stock Chart - Column Detection:', {
//       availableColumns: columns,
//       dateColumn,
//       rcfProductionColumn,
//       rcfSalesColumn,
//       rcfStockColumn,
//       boomiProductionColumn,
//       boomiSalesColumn,
//       boomiStockColumn
//     });

//     if (!dateColumn) {
//       console.warn('Stock Chart - Missing date column');
//       return { rcfData: null, boomiData: null, hasData: false };
//     }

//     // Parse Indian number format
//     const parseIndianNumber = (value: string): number => {
//       if (!value || value === '-' || value === '' || value.trim() === '') return 0;
      
//       // Remove commas, quotes, and extra spaces, but keep decimal points
//       const cleaned = value.replace(/[",\s]/g, '');
//       const parsed = parseFloat(cleaned);
      
//       return isNaN(parsed) ? 0 : parsed;
//     };

//     // Process data by date
//     const dateMap = new Map<string, {
//       rcfProduction: number;
//       rcfSales: number;
//       rcfStock: number;
//       boomiProduction: number;
//       boomiSales: number;
//       boomiStock: number;
//     }>();

//     allStockData.forEach((row, index) => {
//       const dateValue = String(row[dateColumn] || '').trim();
      
//       if (!dateValue || dateValue === '-' || dateValue === '') {
//         return;
//       }

//       // Parse all values
//       const rcfProduction = rcfProductionColumn ? parseIndianNumber(String(row[rcfProductionColumn] || '0')) : 0;
//       const rcfSales = rcfSalesColumn ? parseIndianNumber(String(row[rcfSalesColumn] || '0')) : 0;
//       const rcfStock = rcfStockColumn ? parseIndianNumber(String(row[rcfStockColumn] || '0')) : 0;
//       const boomiProduction = boomiProductionColumn ? parseIndianNumber(String(row[boomiProductionColumn] || '0')) : 0;
//       const boomiSales = boomiSalesColumn ? parseIndianNumber(String(row[boomiSalesColumn] || '0')) : 0;
//       const boomiStock = boomiStockColumn ? parseIndianNumber(String(row[boomiStockColumn] || '0')) : 0;

//       console.log(`Stock Row ${index + 1} - Date: ${dateValue}`, {
//         rcfProduction, rcfSales, rcfStock,
//         boomiProduction, boomiSales, boomiStock
//       });

//       dateMap.set(dateValue, {
//         rcfProduction,
//         rcfSales,
//         rcfStock,
//         boomiProduction,
//         boomiSales,
//         boomiStock
//       });
//     });

//     // Sort dates chronologically
//     const sortedDates = Array.from(dateMap.keys()).sort((a, b) => {
//       const dateA = new Date(a);
//       const dateB = new Date(b);
//       return dateA.getTime() - dateB.getTime();
//     });

//     console.log('Stock Chart - Processed Data:', {
//       totalDates: sortedDates.length,
//       dateRange: sortedDates.length > 0 ? `${sortedDates[0]} to ${sortedDates[sortedDates.length - 1]}` : 'None'
//     });

//     // Prepare RCF data
//     const rcfData = {
//       categories: sortedDates,
//       series: [
//         {
//           name: 'Production/RCF',
//           data: sortedDates.map(date => dateMap.get(date)!.rcfProduction),
//           color: '#3b82f6' // Blue
//         },
//         {
//           name: 'Sales/RCF',
//           data: sortedDates.map(date => dateMap.get(date)!.rcfSales),
//           color: '#ef4444' // Red
//         },
//         {
//           name: 'Unsold/RCF',
//           data: sortedDates.map(date => dateMap.get(date)!.rcfStock),
//           color: '#f59e0b' // Yellow/Orange
//         }
//       ]
//     };

//     // Prepare Boomi Samrudhi data
//     const boomiData = {
//       categories: sortedDates,
//       series: [
//         {
//           name: 'Production/Boomi Samrudhi',
//           data: sortedDates.map(date => dateMap.get(date)!.boomiProduction),
//           color: '#3b82f6' // Blue
//         },
//         {
//           name: 'Sales/Boomi Samrudhi',
//           data: sortedDates.map(date => dateMap.get(date)!.boomiSales),
//           color: '#ef4444' // Red
//         },
//         {
//           name: 'Unsold/Boomi Samrudhi',
//           data: sortedDates.map(date => dateMap.get(date)!.boomiStock),
//           color: '#f59e0b' // Yellow/Orange
//         }
//       ]
//     };

//     return {
//       rcfData,
//       boomiData,
//       hasData: sortedDates.length > 0
//     };
//   }, [state.datasets, state.activeDatasetIds]);

//   if (!processStockData.hasData) {
//     return null; // Don't render if no stock data
//   }

//   const createChartOptions = (title: string): ApexOptions => ({
//     chart: {
//       type: chartType,
//       background: 'transparent',
//       toolbar: { show: false },
//       animations: {
//         enabled: true,
//         easing: 'easeinout',
//         speed: 800
//       }
//     },
    
//     stroke: {
//       curve: 'smooth',
//       width: chartType === 'line' ? 3 : chartType === 'area' ? 2 : 0,
//     },
    
//     fill: {
//       type: chartType === 'area' ? 'gradient' : 'solid',
//       gradient: chartType === 'area' ? {
//         shadeIntensity: 1,
//         type: 'vertical',
//         colorStops: [
//           { offset: 0, color: '#3b82f6', opacity: 0.8 },
//           { offset: 100, color: '#3b82f6', opacity: 0.1 }
//         ]
//       } : undefined
//     },
    
//     dataLabels: { enabled: false },
    
//     xaxis: {
//       categories: processStockData.rcfData?.categories || [],
//       labels: {
//         style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
//         rotate: -45
//       },
//       title: {
//         text: 'Date',
//         style: { color: isDarkMode ? '#9ca3af' : '#6b7280' }
//       }
//     },
    
//     yaxis: {
//       labels: {
//         formatter: (val: number) => {
//           if (val >= 1000000) {
//             return `${(val / 1000000).toFixed(1)}M`;
//           } else if (val >= 1000) {
//             return `${(val / 1000).toFixed(1)}K`;
//           }
//           return val.toString();
//         },
//         style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' }
//       },
//       title: {
//         text: 'Value',
//         style: { color: isDarkMode ? '#9ca3af' : '#6b7280' }
//       }
//     },
    
//     theme: { mode: isDarkMode ? 'dark' : 'light' },
    
//     grid: { 
//       borderColor: isDarkMode ? '#374151' : '#e5e7eb',
//       padding: {
//         top: 0,
//         right: 10,
//         bottom: 0,
//         left: 10
//       }
//     },
    
//     tooltip: {
//       theme: isDarkMode ? 'dark' : 'light',
//       shared: true,
//       intersect: false,
//       y: {
//         formatter: (val: number) => {
//           if (val >= 1000000) {
//             return `${(val / 1000000).toFixed(2)}M units`;
//           } else if (val >= 1000) {
//             return `${(val / 1000).toFixed(2)}K units`;
//           }
//           return `${val} units`;
//         }
//       }
//     },
    
//     legend: {
//       show: true,
//       position: 'bottom',
//       labels: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
//       markers: {
//         width: 12,
//         height: 12,
//         radius: 6
//       }
//     },
    
//     plotOptions: {
//       bar: {
//         borderRadius: 2,
//         columnWidth: '80%',
//         dataLabels: { position: 'top' }
//       }
//     },
    
//     responsive: [{
//       breakpoint: 768,
//       options: {
//         legend: { position: 'bottom' },
//         xaxis: {
//           labels: { rotate: -90 }
//         }
//       }
//     }]
//   });

//   return (
//     <div className={`space-y-8 ${className}`}>
//       {/* RCF Chart */}
//       {processStockData.rcfData && (
//         <ChartContainer
//           title="RCF: Production, Sales, and Unsold Stock Over Time"
//           availableTypes={['bar', 'line', 'area']}
//           currentType={chartType}
//           onChartTypeChange={(type) => setChartType(type as 'bar' | 'line' | 'area')}
//         >
//           <div className="w-full h-full min-h-[500px]">
//             <Chart
//               options={createChartOptions('RCF')}
//               series={processStockData.rcfData.series}
//               type={chartType}
//               height="500px"
//               width="100%"
//             />
//           </div>
//         </ChartContainer>
//       )}

//       {/* Boomi Samrudhi Chart */}
//       {processStockData.boomiData && (
//         <ChartContainer
//           title="Boomi Samrudhi: Production, Sales, and Unsold Stock Over Time"
//           availableTypes={['bar', 'line', 'area']}
//           currentType={chartType}
//           onChartTypeChange={(type) => setChartType(type as 'bar' | 'line' | 'area')}
//         >
//           <div className="w-full h-full min-h-[500px]">
//             <Chart
//               options={createChartOptions('Boomi Samrudhi')}
//               series={processStockData.boomiData.series}
//               type={chartType}
//               height="500px"
//               width="100%"
//             />
//           </div>
//         </ChartContainer>
//       )}
//     </div>
//   );
// }

import React, { useState, useMemo } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { FlexibleDataRow } from '../../types';
import { ChartContainer } from './ChartContainer';
import { useApp } from '../../contexts/AppContext';
import { ColorManager } from '../../utils/colorManager';

interface StockAnalysisChartProps {
  className?: string;
}

export function StockAnalysisChart({ className = '' }: StockAnalysisChartProps) {
  const { state } = useApp();
  const [chartType, setChartType] = useState<'bar' | 'line' | 'horizontalBar'>('bar');
  const isDarkMode = state.settings.theme === 'dark';

  // Process stock data for both RCF and Boomi Samrudhi
  const processStockData = useMemo(() => {
    // Find stock datasets
    const stockDatasets = state.datasets.filter(dataset => 
      state.activeDatasetIds.includes(dataset.id) && 
      ColorManager.isStockDataset(dataset.name)
    );

    if (stockDatasets.length === 0) {
      return { rcfData: null, boomiData: null, hasData: false };
    }

    // Combine all stock data
    const allStockData = stockDatasets.flatMap(dataset => dataset.data);

    if (allStockData.length === 0) {
      return { rcfData: null, boomiData: null, hasData: false };
    }

    // Find required columns (case-insensitive)
    const sampleRow = allStockData[0];
    const columns = Object.keys(sampleRow);
    
    const dateColumn = columns.find(col => {
      const lowerCol = col.toLowerCase().trim();
      return lowerCol === 'date';
    });

    // RCF columns
    const rcfProductionColumn = columns.find(col => {
      const lowerCol = col.toLowerCase().trim();
      return lowerCol.includes('rcf') && lowerCol.includes('production');
    });
    const rcfSalesColumn = columns.find(col => {
      const lowerCol = col.toLowerCase().trim();
      return lowerCol.includes('rcf') && lowerCol.includes('sales');
    });
    const rcfStockColumn = columns.find(col => {
      const lowerCol = col.toLowerCase().trim();
      return lowerCol.includes('rcf') && lowerCol.includes('stock');
    });

    // Boomi Samrudhi columns
    const boomiProductionColumn = columns.find(col => {
      const lowerCol = col.toLowerCase().trim();
      return lowerCol.includes('boomi') && lowerCol.includes('production');
    });
    const boomiSalesColumn = columns.find(col => {
      const lowerCol = col.toLowerCase().trim();
      return lowerCol.includes('boomi') && lowerCol.includes('sales');
    });
    const boomiStockColumn = columns.find(col => {
      const lowerCol = col.toLowerCase().trim();
      return lowerCol.includes('boomi') && lowerCol.includes('stock');
    });

    console.log('Stock Chart - Column Detection:', {
      availableColumns: columns,
      dateColumn,
      rcfProductionColumn,
      rcfSalesColumn,
      rcfStockColumn,
      boomiProductionColumn,
      boomiSalesColumn,
      boomiStockColumn
    });

    if (!dateColumn) {
      console.warn('Stock Chart - Missing date column');
      return { rcfData: null, boomiData: null, hasData: false };
    }

    // Parse Indian number format
    const parseIndianNumber = (value: string): number => {
      if (!value || value === '-' || value === '' || value.trim() === '') return 0;
      
      // Remove commas, quotes, and extra spaces, but keep decimal points
      const cleaned = value.replace(/[",\s]/g, '');
      const parsed = parseFloat(cleaned);
      
      return isNaN(parsed) ? 0 : parsed;
    };

    // Process data by date
    const dateMap = new Map<string, {
      rcfProduction: number;
      rcfSales: number;
      rcfStock: number;
      boomiProduction: number;
      boomiSales: number;
      boomiStock: number;
    }>();

    allStockData.forEach((row, index) => {
      const dateValue = String(row[dateColumn] || '').trim();
      
      if (!dateValue || dateValue === '-' || dateValue === '') {
        return;
      }

      // Parse all values
      const rcfProduction = rcfProductionColumn ? parseIndianNumber(String(row[rcfProductionColumn] || '0')) : 0;
      const rcfSales = rcfSalesColumn ? parseIndianNumber(String(row[rcfSalesColumn] || '0')) : 0;
      const rcfStock = rcfStockColumn ? parseIndianNumber(String(row[rcfStockColumn] || '0')) : 0;
      const boomiProduction = boomiProductionColumn ? parseIndianNumber(String(row[boomiProductionColumn] || '0')) : 0;
      const boomiSales = boomiSalesColumn ? parseIndianNumber(String(row[boomiSalesColumn] || '0')) : 0;
      const boomiStock = boomiStockColumn ? parseIndianNumber(String(row[boomiStockColumn] || '0')) : 0;

      console.log(`Stock Row ${index + 1} - Date: ${dateValue}`, {
        rcfProduction, rcfSales, rcfStock,
        boomiProduction, boomiSales, boomiStock
      });

      dateMap.set(dateValue, {
        rcfProduction,
        rcfSales,
        rcfStock,
        boomiProduction,
        boomiSales,
        boomiStock
      });
    });

    // Sort dates chronologically
    const sortedDates = Array.from(dateMap.keys()).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA.getTime() - dateB.getTime();
    });

    console.log('Stock Chart - Processed Data:', {
      totalDates: sortedDates.length,
      dateRange: sortedDates.length > 0 ? `${sortedDates[0]} to ${sortedDates[sortedDates.length - 1]}` : 'None'
    });

    // Function to aggregate data for better horizontal bar display
    const aggregateDataForHorizontal = (dates: string[], dataMap: Map<string, any>) => {
      // If we have more than 15 dates, aggregate by week or month for horizontal display
      if (dates.length <= 15) {
        return { dates, dataMap };
      }

      const aggregatedMap = new Map();
      const aggregatedDates: string[] = [];

      if (dates.length > 50) {
        // Aggregate by month for very large datasets
        const monthMap = new Map<string, {
          rcfProduction: number;
          rcfSales: number;
          rcfStock: number;
          boomiProduction: number;
          boomiSales: number;
          boomiStock: number;
          count: number;
        }>();

        dates.forEach(date => {
          const monthKey = new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          const data = dataMap.get(date);
          
          if (!monthMap.has(monthKey)) {
            monthMap.set(monthKey, {
              rcfProduction: 0, rcfSales: 0, rcfStock: 0,
              boomiProduction: 0, boomiSales: 0, boomiStock: 0,
              count: 0
            });
          }
          
          const monthData = monthMap.get(monthKey)!;
          monthData.rcfProduction += data.rcfProduction;
          monthData.rcfSales += data.rcfSales;
          monthData.rcfStock += data.rcfStock;
          monthData.boomiProduction += data.boomiProduction;
          monthData.boomiSales += data.boomiSales;
          monthData.boomiStock += data.boomiStock;
          monthData.count += 1;
        });

        // Convert to arrays and take averages where appropriate
        Array.from(monthMap.keys()).sort().forEach(monthKey => {
          const data = monthMap.get(monthKey)!;
          aggregatedDates.push(monthKey);
          aggregatedMap.set(monthKey, {
            rcfProduction: Math.round(data.rcfProduction / data.count),
            rcfSales: Math.round(data.rcfSales / data.count),
            rcfStock: Math.round(data.rcfStock / data.count),
            boomiProduction: Math.round(data.boomiProduction / data.count),
            boomiSales: Math.round(data.boomiSales / data.count),
            boomiStock: Math.round(data.boomiStock / data.count)
          });
        });
      } else {
        // Take every nth item for medium datasets
        const step = Math.ceil(dates.length / 12);
        for (let i = 0; i < dates.length; i += step) {
          const date = dates[i];
          aggregatedDates.push(date);
          aggregatedMap.set(date, dataMap.get(date));
        }
      }

      return { dates: aggregatedDates, dataMap: aggregatedMap };
    };

    // Use aggregated data for horizontal bars, original for others
    const useAggregated = chartType === 'horizontalBar';
    const { dates: finalDates, dataMap: finalDataMap } = useAggregated 
      ? aggregateDataForHorizontal(sortedDates, dateMap)
      : { dates: sortedDates, dataMap: dateMap };

    // Prepare RCF data
    const rcfData = {
      categories: finalDates,
      series: [
        {
          name: 'Production/RCF',
          data: finalDates.map(date => finalDataMap.get(date)!.rcfProduction),
          color: '#3b82f6' // Blue
        },
        {
          name: 'Sales/RCF',
          data: finalDates.map(date => finalDataMap.get(date)!.rcfSales),
          color: '#ef4444' // Red
        },
        {
          name: 'Unsold/RCF',
          data: finalDates.map(date => finalDataMap.get(date)!.rcfStock),
          color: '#f59e0b' // Yellow/Orange
        }
      ]
    };

    // Prepare Boomi Samrudhi data
    const boomiData = {
      categories: finalDates,
      series: [
        {
          name: 'Production/Boomi Samrudhi',
          data: finalDates.map(date => finalDataMap.get(date)!.boomiProduction),
          color: '#3b82f6' // Blue
        },
        {
          name: 'Sales/Boomi Samrudhi',
          data: finalDates.map(date => finalDataMap.get(date)!.boomiSales),
          color: '#ef4444' // Red
        },
        {
          name: 'Unsold/Boomi Samrudhi',
          data: finalDates.map(date => finalDataMap.get(date)!.boomiStock),
          color: '#f59e0b' // Yellow/Orange
        }
      ]
    };

    return {
      rcfData,
      boomiData,
      hasData: finalDates.length > 0
    };
  }, [state.datasets, state.activeDatasetIds, chartType]); // Added chartType to dependencies

  if (!processStockData.hasData) {
    return null; // Don't render if no stock data
  }

  const createChartOptions = (title: string): ApexOptions => {
    // Get the actual chart type to use for ApexCharts
    const actualChartType = chartType === 'horizontalBar' ? 'bar' : chartType;
    const isHorizontal = chartType === 'horizontalBar';

    // Calculate dynamic height for horizontal bars
    const dataPoints = processStockData.rcfData?.categories?.length || 0;
    const minBarHeight = isHorizontal ? Math.max(400, dataPoints * 25) : 500;

    return {
      chart: {
        type: actualChartType,
        background: 'transparent',
        toolbar: { show: false },
        height: isHorizontal ? minBarHeight : 500,
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800
        }
      },
      
      stroke: {
        curve: 'smooth',
        width: chartType === 'line' ? 3 : 0,
      },
      
      fill: {
        type: 'solid'
      },
      
      dataLabels: { 
        enabled: false 
      },
      
      xaxis: {
        categories: processStockData.rcfData?.categories || [],
        labels: {
          style: { 
            colors: isDarkMode ? '#9ca3af' : '#6b7280',
            fontSize: '12px'
          },
          rotate: !isHorizontal ? -45 : 0,
          maxHeight: !isHorizontal ? 100 : undefined,
          formatter: isHorizontal ? (val: number) => {
            if (val >= 1000000) {
              return `${(val / 1000000).toFixed(1)}M`;
            } else if (val >= 1000) {
              return `${(val / 1000).toFixed(1)}K`;
            }
            return val.toString();
          } : undefined
        },
        title: {
          text: isHorizontal ? 'Value (Units)' : 'Date',
          style: { color: isDarkMode ? '#9ca3af' : '#6b7280' }
        },
        tickAmount: isHorizontal ? 8 : undefined
      },
      
      yaxis: {
        labels: {
          style: { 
            colors: isDarkMode ? '#9ca3af' : '#6b7280',
            fontSize: '11px'
          },
          formatter: (val: number | string) => {
            if (isHorizontal) {
              // For horizontal bars, show dates on y-axis with better formatting
              const dateStr = val.toString();
              // If it's a full date, format it nicely
              if (dateStr.includes('-') && dateStr.length > 7) {
                try {
                  return new Date(dateStr).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric'
                  });
                } catch {
                  return dateStr;
                }
              }
              return dateStr;
            } else {
              // For vertical charts, format numbers
              const numVal = typeof val === 'string' ? parseFloat(val) : val;
              if (numVal >= 1000000) {
                return `${(numVal / 1000000).toFixed(1)}M`;
              } else if (numVal >= 1000) {
                return `${(numVal / 1000).toFixed(1)}K`;
              }
              return numVal.toString();
            }
          }
        },
        title: {
          text: isHorizontal ? 'Date' : 'Value (Units)',
          style: { color: isDarkMode ? '#9ca3af' : '#6b7280' }
        }
      },
      
      colors: processStockData.rcfData?.series.map(s => s.color) || [],
      
      theme: { mode: isDarkMode ? 'dark' : 'light' },
      
      grid: { 
        borderColor: isDarkMode ? '#374151' : '#e5e7eb',
        padding: {
          top: 10,
          right: 15,
          bottom: 10,
          left: 15
        },
        xaxis: {
          lines: {
            show: true
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        }
      },
      
      tooltip: {
        theme: isDarkMode ? 'dark' : 'light',
        shared: true,
        intersect: false,
        y: {
          formatter: (val: number) => {
            if (val >= 1000000) {
              return `${(val / 1000000).toFixed(2)}M units`;
            } else if (val >= 1000) {
              return `${(val / 1000).toFixed(2)}K units`;
            }
            return `${val} units`;
          }
        }
      },
      
      legend: {
        show: true,
        position: 'bottom',
        horizontalAlign: 'center',
        labels: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
        markers: {
          width: 12,
          height: 12,
          radius: 6
        },
        itemMargin: {
          horizontal: 10,
          vertical: 5
        }
      },
      
      plotOptions: {
        bar: {
          horizontal: isHorizontal,
          borderRadius: 3,
          columnWidth: isHorizontal ? '70%' : '75%',
          barHeight: isHorizontal ? '75%' : '70%',
          dataLabels: { 
            position: isHorizontal ? 'bottom' : 'top'
          },
          distributed: false
        }
      },
      
      responsive: [{
        breakpoint: 768,
        options: {
          chart: {
            height: isHorizontal ? Math.max(300, dataPoints * 20) : 400
          },
          legend: { 
            position: 'bottom',
            horizontalAlign: 'center'
          },
          xaxis: {
            labels: { 
              rotate: isHorizontal ? 0 : -90,
              style: { fontSize: '10px' }
            }
          },
          yaxis: {
            labels: {
              style: { fontSize: '10px' }
            }
          },
          plotOptions: {
            bar: {
              horizontal: isHorizontal,
              columnWidth: isHorizontal ? '80%' : '85%',
              barHeight: isHorizontal ? '80%' : '75%'
            }
          }
        }
      }]
    };
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* RCF Chart */}
      {processStockData.rcfData && (
        <ChartContainer
          title="RCF: Production, Sales, and Unsold Stock Over Time"
          availableTypes={['bar', 'line', 'horizontalBar']}
          currentType={chartType}
          onChartTypeChange={(type) => setChartType(type as 'bar' | 'line' | 'horizontalBar')}
        >
          <div className="w-full h-full" style={{ 
            minHeight: chartType === 'horizontalBar' 
              ? `${Math.max(400, (processStockData.rcfData?.categories?.length || 0) * 25)}px`
              : '500px'
          }}>
            <Chart
              options={createChartOptions('RCF')}
              series={processStockData.rcfData.series}
              type={chartType === 'horizontalBar' ? 'bar' : chartType}
              height={chartType === 'horizontalBar' 
                ? Math.max(400, (processStockData.rcfData?.categories?.length || 0) * 25)
                : 500}
              width="100%"
            />
          </div>
        </ChartContainer>
      )}

      {/* Boomi Samrudhi Chart */}
      {processStockData.boomiData && (
        <ChartContainer
          title="Boomi Samrudhi: Production, Sales, and Unsold Stock Over Time"
          availableTypes={['bar', 'line', 'horizontalBar']}
          currentType={chartType}
          onChartTypeChange={(type) => setChartType(type as 'bar' | 'line' | 'horizontalBar')}
        >
          <div className="w-full h-full" style={{ 
            minHeight: chartType === 'horizontalBar' 
              ? `${Math.max(400, (processStockData.boomiData?.categories?.length || 0) * 25)}px`
              : '500px'
          }}>
            <Chart
              options={createChartOptions('Boomi Samrudhi')}
              series={processStockData.boomiData.series}
              type={chartType === 'horizontalBar' ? 'bar' : chartType}
              height={chartType === 'horizontalBar' 
                ? Math.max(400, (processStockData.boomiData?.categories?.length || 0) * 25)
                : 500}
              width="100%"
            />
          </div>
        </ChartContainer>
      )}
    </div>
  );
}