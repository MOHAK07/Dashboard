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
    const stockDatasets = state.datasets.filter(dataset =>
      state.activeDatasetIds.includes(dataset.id) &&
      ColorManager.isStockDataset(dataset.name)
    );
    if (stockDatasets.length === 0) {
      return { rcfData: null, boomiData: null, hasData: false };
    }
    const allStockData = stockDatasets.flatMap(ds => ds.data);
    if (allStockData.length === 0) {
      return { rcfData: null, boomiData: null, hasData: false };
    }

    const columns = Object.keys(allStockData[0]);
    const dateColumn = columns.find(c => c.toLowerCase().trim() === 'date');
    const rcfProdCol = columns.find(c => c.toLowerCase().includes('rcf') && c.toLowerCase().includes('production'));
    const rcfSalesCol = columns.find(c => c.toLowerCase().includes('rcf') && c.toLowerCase().includes('sales'));
    const rcfStockCol = columns.find(c => c.toLowerCase().includes('rcf') && c.toLowerCase().includes('stock'));
    const boomiProdCol = columns.find(c => c.toLowerCase().includes('boomi') && c.toLowerCase().includes('production'));
    const boomiSalesCol = columns.find(c => c.toLowerCase().includes('boomi') && c.toLowerCase().includes('sales'));
    const boomiStockCol = columns.find(c => c.toLowerCase().includes('boomi') && c.toLowerCase().includes('stock'));

    if (!dateColumn) return { rcfData: null, boomiData: null, hasData: false };

    const parseIndian = (val: any) => {
      if (!val || val === '-' || String(val).trim() === '') return 0;
      const cleaned = String(val).replace(/[",\s]/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    };

    const dateMap = new Map<string, {
      rcfProduction: number;
      rcfSales: number;
      rcfStock: number;
      boomiProduction: number;
      boomiSales: number;
      boomiStock: number;
    }>();

    allStockData.forEach(row => {
      const date = String(row[dateColumn]).trim();
      if (!date) return;
      dateMap.set(date, {
        rcfProduction: rcfProdCol ? parseIndian(row[rcfProdCol]) : 0,
        rcfSales:      rcfSalesCol ? parseIndian(row[rcfSalesCol]) : 0,
        rcfStock:      rcfStockCol ? parseIndian(row[rcfStockCol]) : 0,
        boomiProduction: boomiProdCol ? parseIndian(row[boomiProdCol]) : 0,
        boomiSales:      boomiSalesCol ? parseIndian(row[boomiSalesCol]) : 0,
        boomiStock:      boomiStockCol ? parseIndian(row[boomiStockCol]) : 0
      });
    });

    const sortedDates = Array.from(dateMap.keys()).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    // Aggregation for horizontal bars when dates >15
    const aggregate = (dates: string[]) => {
      if (dates.length <= 15) return { dates, map: dateMap };
      if (dates.length > 50) {
        // monthly aggregation
        const m = new Map<string, { sum: any; count: number }>();
        dates.forEach(d => {
          const key = new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          if (!m.has(key)) m.set(key, { sum: dateMap.get(d)!, count: 0 });
          const entry = m.get(key)!;
          ['rcfProduction','rcfSales','rcfStock','boomiProduction','boomiSales','boomiStock']
            .forEach(f => (entry.sum as any)[f] += (dateMap.get(d) as any)[f]);
          entry.count++;
        });
        const aggMap = new Map<string, any>();
        Array.from(m.entries()).sort().forEach(([key, { sum, count }]) => {
          aggMap.set(key, Object.fromEntries(Object.entries(sum).map(([k, v]) => [k, Math.round(v/count)])));
        });
        return { dates: Array.from(aggMap.keys()), map: aggMap };
      } else {
        // sample every nth
        const step = Math.ceil(dates.length / 12);
        const sampled = dates.filter((_, i) => i % step === 0);
        const sm = new Map<string, any>();
        sampled.forEach(d => sm.set(d, dateMap.get(d)));
        return { dates: sampled, map: sm };
      }
    };

    const useAgg = chartType === 'horizontalBar';
    const { dates: finalDates, map: finalMap } = aggregate(sortedDates);

    const build = (field: keyof typeof finalMap.get('')) => finalDates.map(d => (finalMap.get(d) as any)[field]);

    const rcfData = {
      categories: finalDates,
      series: [
        { name: 'Production/RCF', data: build('rcfProduction'), color: '#3b82f6' },
        { name: 'Sales/RCF',      data: build('rcfSales'),      color: '#ef4444' },
        { name: 'Unsold/RCF',     data: build('rcfStock'),      color: '#f59e0b' }
      ]
    };

    const boomiData = {
      categories: finalDates,
      series: [
        { name: 'Production/Boomi', data: build('boomiProduction'), color: '#3b82f6' },
        { name: 'Sales/Boomi',      data: build('boomiSales'),      color: '#ef4444' },
        { name: 'Unsold/Boomi',     data: build('boomiStock'),      color: '#f59e0b' }
      ]
    };

    return { rcfData, boomiData, hasData: finalDates.length > 0 };
  }, [state.datasets, state.activeDatasetIds, chartType]);

  if (!processStockData.hasData) return null;

  const createChartOptions = (isHorizontal: boolean): ApexOptions => {
    const dataCount = processStockData.rcfData?.categories.length || 0;
    const height = isHorizontal ? dataCount * 40 + 200 : 500;

    return {
      chart: {
        type: isHorizontal ? 'bar' : chartType,
        background: 'transparent',
        height,
        animations: { enabled: true, easing: 'easeinout', speed: 800 }
      },
      plotOptions: {
        bar: {
          horizontal: isHorizontal,
          borderRadius: 3,
          columnWidth: isHorizontal ? '70%' : '75%',
          barHeight: isHorizontal ? '75%' : '70%',
          distributed: false
        }
      },
      xaxis: {
        categories: processStockData.rcfData!.categories,
        labels: {
          rotate: isHorizontal ? 0 : -45,
          style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' }
        },
        title: {
          text: isHorizontal ? 'Value (Units)' : 'Date',
          style: { color: isDarkMode ? '#9ca3af' : '#6b7280' }
        }
      },
      yaxis: {
        labels: {
          formatter: val => {
            if (isHorizontal) {
              const str = String(val);
              const d = new Date(str);
              if (!isNaN(d.getTime())) {
                return d.toLocaleDateString('en-US',{ month:'short', day:'numeric' });
              }
              return str;
            }
            const num = Number(val);
            if (num >= 1e6) return `${(num/1e6).toFixed(1)}M`;
            if (num >= 1e3) return `${(num/1e3).toFixed(1)}K`;
            return String(num);
          },
          style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' }
        },
        title: {
          text: isHorizontal ? 'Date' : 'Value (Units)',
          style: { color: isDarkMode ? '#9ca3af' : '#6b7280' }
        }
      },
      colors: processStockData.rcfData!.series.map(s => s.color),
      grid: { padding: { top: 10, right: 15, bottom: 10, left: 15 } },
      tooltip: {
        shared: true,
        y: { formatter: v => v >= 1e6 ? `${(v/1e6).toFixed(2)}M` : v >= 1e3 ? `${(v/1e3).toFixed(2)}K` : `${v}` }
      },
      legend: {
        position: 'bottom',
        labels: { colors: isDarkMode ? '#9ca3af' : '#6b7280' }
      }
    };
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {processStockData.rcfData && (
        <ChartContainer
          title="RCF: Production, Sales, and Unsold Stock Over Time"
          availableTypes={['bar', 'line', 'horizontalBar']}
          currentType={chartType}
          onChartTypeChange={type => setChartType(type as 'bar' | 'line' | 'horizontalBar')}
        >
          <Chart
            options={createChartOptions(chartType === 'horizontalBar')}
            series={processStockData.rcfData.series}
            type={chartType === 'horizontalBar' ? 'bar' : chartType}
            height={chartType === 'horizontalBar' ? processStockData.rcfData.categories.length * 40 + 200 : 500}
            width="100%"
          />
        </ChartContainer>
      )}

      {processStockData.boomiData && (
        <ChartContainer
          title="Boomi Samrudhi: Production, Sales, and Unsold Stock Over Time"
          availableTypes={['bar', 'line', 'horizontalBar']}
          currentType={chartType}
          onChartTypeChange={type => setChartType(type as 'bar' | 'line' | 'horizontalBar')}
        >
          <Chart
            options={createChartOptions(chartType === 'horizontalBar')}
            series={processStockData.boomiData.series}
            type={chartType === 'horizontalBar' ? 'bar' : chartType}
            height={chartType === 'horizontalBar' ? processStockData.boomiData.categories.length * 40 + 200 : 500}
            width="100%"
          />
        </ChartContainer>
      )}
    </div>
  );
}
