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
    const dateCol = columns.find(c => c.toLowerCase().trim() === 'date');

    const findCol = (prefix: string, field: string) =>
      columns.find(c => c.toLowerCase().includes(prefix) && c.toLowerCase().includes(field));

    const rcfProdCol = findCol('rcf', 'production');
    const rcfSalesCol = findCol('rcf', 'sales');
    const rcfStockCol = findCol('rcf', 'stock');
    const boomiProdCol = findCol('boomi', 'production');
    const boomiSalesCol = findCol('boomi', 'sales');
    const boomiStockCol = findCol('boomi', 'stock');

    if (!dateCol) {
      return { rcfData: null, boomiData: null, hasData: false };
    }

    const parseNum = (val: any) => {
      if (val === null || val === '-' || String(val).trim() === '') return 0;
      const n = parseFloat(String(val).replace(/[",\s]/g, ''));
      return isNaN(n) ? 0 : n;
    };

    const map = new Map<string, {
      rcfProduction: number;
      rcfSales: number;
      rcfStock: number;
      boomiProduction: number;
      boomiSales: number;
      boomiStock: number;
    }>();

    allStockData.forEach(row => {
      const d = String(row[dateCol]).trim();
      if (!d) return;

      map.set(d, {
        rcfProduction: parseNum(row[rcfProdCol!] || 0),
        rcfSales:      parseNum(row[rcfSalesCol!] || 0),
        rcfStock:      parseNum(row[rcfStockCol!] || 0),
        boomiProduction: parseNum(row[boomiProdCol!] || 0),
        boomiSales:      parseNum(row[boomiSalesCol!] || 0),
        boomiStock:      parseNum(row[boomiStockCol!] || 0),
      });
    });

    const sortedDates = Array.from(map.keys()).sort((a, b) =>
      new Date(a).getTime() - new Date(b).getTime()
    );

    const aggregate = (dates: string[]) => {
      if (dates.length <= 15) {
        return { dates, map };
      }

      const aggregatedDates: string[] = [];
      const aggregatedMap = new Map<string, any>();

      if (dates.length > 50) {
        const monthMap = new Map<string, any>();
        dates.forEach(d => {
          const m = new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          const data = map.get(d)!;
          const mm = monthMap.get(m) || { ...data, count: 0 };
          mm.rcfProduction += data.rcfProduction;
          mm.rcfSales      += data.rcfSales;
          mm.rcfStock      += data.rcfStock;
          mm.boomiProduction += data.boomiProduction;
          mm.boomiSales      += data.boomiSales;
          mm.boomiStock      += data.boomiStock;
          mm.count++;
          monthMap.set(m, mm);
        });

        Array.from(monthMap.keys()).sort().forEach(m => {
          const d = monthMap.get(m);
          aggregatedDates.push(m);
          aggregatedMap.set(m, {
            rcfProduction: Math.round(d.rcfProduction / d.count),
            rcfSales:      Math.round(d.rcfSales / d.count),
            rcfStock:      Math.round(d.rcfStock / d.count),
            boomiProduction: Math.round(d.boomiProduction / d.count),
            boomiSales:      Math.round(d.boomiSales / d.count),
            boomiStock:      Math.round(d.boomiStock / d.count),
          });
        });
      } else {
        const step = Math.ceil(dates.length / 12);
        for (let i = 0; i < dates.length; i += step) {
          const d = dates[i];
          aggregatedDates.push(d);
          aggregatedMap.set(d, map.get(d));
        }
      }

      return { dates: aggregatedDates, map: aggregatedMap };
    };

    const useAgg = chartType === 'horizontalBar';
    const { dates: finalDates, map: finalMap } = useAgg
      ? aggregate(sortedDates)
      : { dates: sortedDates, map };

    const makeData = () => ({
      categories: finalDates,
      series: [
        { name: 'Production/RCF',        data: finalDates.map(d => finalMap.get(d).rcfProduction), color: '#3b82f6' },
        { name: 'Sales/RCF',             data: finalDates.map(d => finalMap.get(d).rcfSales),      color: '#ef4444' },
        { name: 'Unsold/RCF',            data: finalDates.map(d => finalMap.get(d).rcfStock),      color: '#f59e0b' },
      ]
    });

    return {
      rcfData: makeData(),
      boomiData: {
        categories: finalDates,
        series: [
          { name: 'Production/Boomi', data: finalDates.map(d => finalMap.get(d).boomiProduction), color: '#3b82f6' },
          { name: 'Sales/Boomi',      data: finalDates.map(d => finalMap.get(d).boomiSales),      color: '#ef4444' },
          { name: 'Unsold/Boomi',     data: finalDates.map(d => finalMap.get(d).boomiStock),      color: '#f59e0b' },
        ]
      },
      hasData: finalDates.length > 0
    };
  }, [state.datasets, state.activeDatasetIds, chartType]);

  if (!processStockData.hasData) return null;

  const createChartOptions = (title: string): ApexOptions => {
    const isHorizontal = chartType === 'horizontalBar';
    const actualType = isHorizontal ? 'bar' : chartType;
    const count = processStockData.rcfData!.categories.length;
    const dynamicHeight = isHorizontal ? Math.max(400, count * 40 + 200) : 500;
    
    const baseOptions: ApexOptions = {
      chart: {
        type: actualType,
        background: 'transparent',
        toolbar: { show: false },
        height: dynamicHeight,
        animations: { enabled: true, easing: 'easeinout', speed: 800 }
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: processStockData.rcfData!.categories,
        labels: {
          style: { colors: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: '12px' },
          rotate: isHorizontal ? 0 : -45
        },
        title: { text: isHorizontal ? 'Value (Units)' : 'Date', style: { color: isDarkMode ? '#9ca3af' : '#6b7280' } }
      },
      yaxis: {
        labels: {
          style: { colors: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: '11px' },
          formatter: val => {
            if (isHorizontal) {
              const d = String(val);
              return d.length > 7 && d.includes('-')
                ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : d;
            }
            const n = typeof val === 'string' ? parseFloat(val) : val;
            return n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `${(n/1e3).toFixed(1)}K` : `${n}`;
          }
        },
        title: { text: isHorizontal ? 'Date' : 'Value (Units)', style: { color: isDarkMode ? '#9ca3af' : '#6b7280' } }
      },
      colors: processStockData.rcfData!.series.map(s => s.color),
      theme: { mode: isDarkMode ? 'dark' : 'light' },
      grid: { borderColor: isDarkMode ? '#374151' : '#e5e7eb', padding: { top: 10, right: 15, bottom: 10, left: 15 } },
      tooltip: {
        theme: isDarkMode ? 'dark' : 'light',
        shared: true,
        intersect: false,
        y: { formatter: v => v >= 1e6 ? `${(v/1e6).toFixed(2)}M units` : v >= 1e3 ? `${(v/1e3).toFixed(2)}K units` : `${v} units` }
      },
      legend: {
        show: true,
        position: 'bottom',
        horizontalAlign: 'center',
        labels: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
        markers: { width: 12, height: 12, radius: 6 },
        itemMargin: { horizontal: 10, vertical: 5 }
      },
      responsive: [{
        breakpoint: 768,
        options: {
          chart: { height: isHorizontal ? Math.max(300, count * 20 + 150) : 400 },
          xaxis: { labels: { rotate: isHorizontal ? 0 : -90, style: { fontSize: '10px' } } },
          yaxis: { labels: { style: { fontSize: '10px' } } }
        }
      }]
    };

    if (actualType === 'bar') {
      baseOptions.plotOptions = {
        bar: {
          horizontal: isHorizontal,
          borderRadius: 3,
          columnWidth: isHorizontal ? '70%' : '75%',
          barHeight: isHorizontal ? '75%' : undefined,
          dataLabels: { position: isHorizontal ? 'bottom' : 'top' }
        }
      };
      
      if (baseOptions.responsive && baseOptions.responsive[0] && baseOptions.responsive[0].options) {
        if (!baseOptions.responsive.options.plotOptions) {
          baseOptions.responsive.options.plotOptions = {};
        }
        baseOptions.responsive.options.plotOptions.bar = {
          columnWidth: isHorizontal ? '80%' : '85%',
          barHeight: isHorizontal ? '80%' : undefined
        };
      }
    } else if (actualType === 'line') {
      baseOptions.stroke = {
        curve: 'smooth',
        width: 2
      };
      baseOptions.markers = {
        size: 4,
        strokeWidth: 2,
        hover: {
          size: 6
        }
      };
    }

    return baseOptions;
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {processStockData.rcfData && (
        <ChartContainer
          title="RCF: Production, Sales, and Unsold Stock Over Time"
          availableTypes={['bar', 'line', 'horizontalBar']}
          currentType={chartType}
          onChartTypeChange={type => setChartType(type as any)}
        >
          <Chart
            options={createChartOptions('RCF')}
            series={processStockData.rcfData.series}
            type={chartType === 'horizontalBar' ? 'bar' : chartType}
            height={createChartOptions('RCF').chart!.height!}
            width="100%"
          />
        </ChartContainer>
      )}
      {processStockData.boomiData && (
        <ChartContainer
          title="Boomi Samrudhi: Production, Sales, and Unsold Stock Over Time"
          availableTypes={['bar', 'line', 'horizontalBar']}
          currentType={chartType}
          onChartTypeChange={type => setChartType(type as any)}
        >
          <Chart
            options={createChartOptions('Boomi Samrudhi')}
            series={processStockData.boomiData.series}
            type={chartType === 'horizontalBar' ? 'bar' : chartType}
            height={createChartOptions('Boomi Samrudhi').chart!.height!}
            width="100%"
          />
        </ChartContainer>
      )}
    </div>
  );
}

export default StockAnalysisChart;


