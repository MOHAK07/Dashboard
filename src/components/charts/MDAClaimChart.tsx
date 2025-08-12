// import React, { useState, useMemo } from 'react';
// import Chart from 'react-apexcharts';
// import { ApexOptions } from 'apexcharts';
// import { FlexibleDataRow } from '../../types';
// import { ChartContainer } from './ChartContainer';
// import { useApp } from '../../contexts/AppContext';
// import { DataProcessor } from '../../utils/dataProcessing';
// import { ColorManager } from '../../utils/colorManager';

// interface MDAClaimChartProps {
//   className?: string;
// }

// export function MDAClaimChart({ className = '' }: MDAClaimChartProps) {
//   const { state } = useApp();
//   const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('line');
//   const isDarkMode = state.settings.theme === 'dark';

//   // Process MDA claim data
//   const processMDAData = useMemo(() => {
//     // Find MDA claim datasets
//     const mdaDatasets = state.datasets.filter(dataset => 
//       state.activeDatasetIds.includes(dataset.id) && 
//       ColorManager.isMDAClaimDataset(dataset.name)
//     );

//     if (mdaDatasets.length === 0) {
//       return { categories: [], series: [], hasData: false };
//     }

//     // Combine all MDA claim data
//     const allMDAData = mdaDatasets.flatMap(dataset => dataset.data);

//     if (allMDAData.length === 0) {
//       return { categories: [], series: [], hasData: false };
//     }

//     // Find required columns (case-insensitive)
//     const sampleRow = allMDAData[0];
//     const columns = Object.keys(sampleRow);
    
//     // Enhanced column detection with multiple fallback strategies
//     const monthColumn = columns.find(col => {
//       const lowerCol = col.toLowerCase().trim();
//       return lowerCol === 'month' || 
//              lowerCol.includes('month') ||
//              lowerCol === 'period' ||
//              lowerCol.includes('time');
//     });
    
//     const eligibleAmountColumn = columns.find(col => {
//       const lowerCol = col.toLowerCase().trim();
//       return (lowerCol.includes('eligible') && lowerCol.includes('amount')) ||
//              lowerCol === 'eligible amount' ||
//              lowerCol.includes('eligible_amount') ||
//              lowerCol.includes('eligibleamount');
//     });
    
//     const amountReceivedColumn = columns.find(col => {
//       const lowerCol = col.toLowerCase().trim();
//       return (lowerCol.includes('amount') && lowerCol.includes('received')) ||
//              lowerCol === 'amount received' ||
//              lowerCol.includes('amount_received') ||
//              lowerCol.includes('amountreceived') ||
//              lowerCol.includes('received_amount');
//     });

//     console.log('MDA Claim Chart - Column Detection:', {
//       availableColumns: columns,
//       monthColumn,
//       eligibleAmountColumn,
//       amountReceivedColumn
//     });

//     if (!monthColumn || !eligibleAmountColumn || !amountReceivedColumn) {
//       console.warn('MDA Claim Chart - Missing required columns');
//       return { categories: [], series: [], hasData: false };
//     }

//     // Group by month and sum amounts
//     const monthlyData = new Map<string, { eligible: number; received: number }>();

//     allMDAData.forEach((row, index) => {
//       let month = String(row[monthColumn] || '').trim();
      
//       // Skip rows with invalid month data
//       if (!month || month === '-' || month === '' || month === 'Total') {
//         return;
//       }
      
//       // Handle different month formats
//       if (!month.includes('-')) {
//         // If month doesn't contain hyphen, skip it
//         return;
//       }

//       // Validate month format (should be like "Dec-23", "Jan-24")
//       const monthParts = month.split('-');
//       if (monthParts.length !== 2 || !monthParts[0] || !monthParts[1]) {
//         console.warn(`Invalid month format: ${month}`);
//         return;
//       }

//       // Parse amounts with enhanced logic for Indian number format
//       let eligibleRaw = String(row[eligibleAmountColumn] || '').trim();
//       let receivedRaw = String(row[amountReceivedColumn] || '').trim();
      
//       // Skip rows with dash values or empty values
//       if (eligibleRaw === '-' || eligibleRaw === '' || 
//           receivedRaw === '-' || receivedRaw === '' ||
//           eligibleRaw === 'Total' || receivedRaw === 'Total') {
//         return;
//       }

//       // Enhanced number parsing for Indian format
//       const parseIndianNumber = (value: string): number => {
//         if (!value || value === '-' || value === '' || value === 'Total') return 0;
        
//         // Remove commas, quotes, spaces, and handle decimal points
//         let cleaned = value.replace(/[",\s]/g, '');
        
//         // Handle cases where .00 is at the end
//         if (cleaned.endsWith('.00')) {
//           cleaned = cleaned.slice(0, -3);
//         }
        
//         const parsed = parseFloat(cleaned);
        
//         return isNaN(parsed) ? 0 : parsed;
//       };

//       const eligible = parseIndianNumber(eligibleRaw);
//       const received = parseIndianNumber(receivedRaw);
      
//       console.log(`MDA Chart Row ${index + 1} - Month: ${month}, Eligible: ${eligibleRaw} -> ${eligible}, Received: ${receivedRaw} -> ${received}`);

//       // Include rows with valid amounts (including zero)
//       if (eligible >= 0 && received >= 0 && (eligible > 0 || received > 0)) {
//         if (!monthlyData.has(month)) {
//           monthlyData.set(month, { eligible: 0, received: 0 });
//         }
        
//         const current = monthlyData.get(month)!;
//         current.eligible += eligible;
//         current.received += received;
//       }
//     });

//     console.log('MDA Claim Chart - Monthly Data:', Array.from(monthlyData.entries()));

//     // Sort months chronologically
//     const sortedMonths = Array.from(monthlyData.keys()).sort((a, b) => {
//       // Extract month and year from formats like "Dec-23", "Jan-24"
//       const partsA = a.split('-');
//       const partsB = b.split('-');
      
//       if (partsA.length !== 2 || partsB.length !== 2) {
//         return 0;
//       }
      
//       const [monthA, yearA] = partsA;
//       const [monthB, yearB] = partsB;
      
//       const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
//                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
//       // Convert 2-digit years to 4-digit years
//       let fullYearA = parseInt(yearA);
//       let fullYearB = parseInt(yearB);
      
//       if (fullYearA < 100) {
//         fullYearA += fullYearA < 50 ? 2000 : 1900;
//       }
//       if (fullYearB < 100) {
//         fullYearB += fullYearB < 50 ? 2000 : 1900;
//       }
      
//       const yearComparison = fullYearA - fullYearB;
//       if (yearComparison !== 0) return yearComparison;
      
//       return monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB);
//     });

//     const eligibleData = sortedMonths.map(month => {
//       const data = monthlyData.get(month)!;
//       return Math.round(data.eligible * 100) / 100; // Keep original values, round to 2 decimals
//     });

//     const receivedData = sortedMonths.map(month => {
//       const data = monthlyData.get(month)!;
//       return Math.round(data.received * 100) / 100; // Keep original values, round to 2 decimals
//     });

//     console.log('MDA Claim Chart - Final Data:', {
//       sortedMonths,
//       eligibleData,
//       receivedData
//     });

//     return {
//       categories: sortedMonths,
//       series: [
//         {
//           name: 'Eligible Amount',
//           data: eligibleData,
//           color: '#3b82f6' // Blue
//         },
//         {
//           name: 'Amount Received',
//           data: receivedData,
//           color: '#22c55e' // Green
//         }
//       ],
//       hasData: sortedMonths.length > 0 && (eligibleData.some(v => v > 0) || receivedData.some(v => v > 0))
//     };
//   }, [state.datasets, state.activeDatasetIds]);

//   if (!processMDAData.hasData) {
//     return null; // Don't render if no MDA claim data
//   }

//   const chartOptions: ApexOptions = {
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
//       width: chartType === 'line' ? 4 : chartType === 'area' ? 3 : 0,
//     },
    
//     fill: {
//       type: chartType === 'area' ? 'gradient' : 'solid',
//       gradient: chartType === 'area' ? {
//         shadeIntensity: 1,
//         type: 'vertical',
//         colorStops: [
//           { offset: 0, color: '#3b82f6', opacity: 0.8 },
//           { offset: 50, color: '#3b82f6', opacity: 0.4 },
//           { offset: 100, color: '#3b82f6', opacity: 0.1 }
//         ]
//       } : undefined
//     },
    
//     dataLabels: { enabled: false },
    
//     xaxis: {
//       categories: processMDAData.categories,
//       labels: {
//         style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
//         rotate: processMDAData.categories.length > 8 ? -45 : 0
//       },
//       title: {
//         text: 'Months',
//         style: { color: isDarkMode ? '#9ca3af' : '#6b7280' }
//       }
//     },
    
//     yaxis: {
//       labels: {
//         formatter: (val: number) => {
//           // Format values in thousands/lakhs/crores
//           if (val >= 10000000) { // 1 crore
//             return `₹${(val / 10000000).toFixed(1)}Cr`;
//           } else if (val >= 100000) { // 1 lakh
//             return `₹${(val / 100000).toFixed(1)}L`;
//           } else if (val >= 1000) { // 1 thousand
//             return `₹${(val / 1000).toFixed(1)}K`;
//           }
//           return `₹${val}`;
//         },
//         style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' }
//       },
//       title: {
//         text: 'Amount (₹)',
//         style: { color: isDarkMode ? '#9ca3af' : '#6b7280' }
//       }
//     },
    
//     colors: processMDAData.series.map(s => s.color),
    
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
//           // Format tooltip values
//           if (val >= 10000000) { // 1 crore
//             return `₹${(val / 10000000).toFixed(2)} Crores`;
//           } else if (val >= 100000) { // 1 lakh
//             return `₹${(val / 100000).toFixed(2)} Lakhs`;
//           } else if (val >= 1000) { // 1 thousand
//             return `₹${(val / 1000).toFixed(2)} Thousands`;
//           }
//           return `₹${val.toLocaleString()}`;
//         }
//       }
//     },
    
//     legend: {
//       show: true,
//       position: 'top',
//       labels: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
//       markers: {
//         width: 12,
//         height: 12,
//         radius: 6
//       }
//     },
    
//     markers: {
//       size: chartType === 'line' ? 6 : 0,
//       colors: processMDAData.series.map(s => s.color),
//       strokeColors: '#ffffff',
//       strokeWidth: 2,
//       hover: { size: 8 }
//     },
    
//     plotOptions: {
//       bar: {
//         borderRadius: 4,
//         columnWidth: '75%',
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
//   };

//   return (
//     <ChartContainer
//       title="MDA Claim Analysis - Eligible vs Received Amount"
//       availableTypes={['line', 'area', 'bar']}
//       currentType={chartType}
//       onChartTypeChange={(type) => setChartType(type as 'line' | 'area' | 'bar')}
//       className={className}
//     >
//       <div className="w-full h-full min-h-[500px]">
//         <Chart
//           options={chartOptions}
//           series={processMDAData.series}
//           type={chartType}
//           height="500px"
//           width="100%"
//         />
//       </div>
//     </ChartContainer>
//   );
// }

import React, { useState, useMemo } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { FlexibleDataRow } from '../../types';
import { ChartContainer } from './ChartContainer';
import { useApp } from '../../contexts/AppContext';
import { DataProcessor } from '../../utils/dataProcessing';
import { ColorManager } from '../../utils/colorManager';

interface MDAClaimChartProps {
  className?: string;
}

export function MDAClaimChart({ className = '' }: MDAClaimChartProps) {
  const { state } = useApp();
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('line');
  const isDarkMode = state.settings.theme === 'dark';

  // Process MDA claim data
  const processMDAData = useMemo(() => {
    // Find MDA claim datasets
    const mdaDatasets = state.datasets.filter(dataset => 
      state.activeDatasetIds.includes(dataset.id) && 
      ColorManager.isMDAClaimDataset(dataset.name)
    );

    if (mdaDatasets.length === 0) {
      return { categories: [], series: [], hasData: false };
    }

    // Combine all MDA claim data
    const allMDAData = mdaDatasets.flatMap(dataset => dataset.data);

    if (allMDAData.length === 0) {
      return { categories: [], series: [], hasData: false };
    }

    // Find required columns (exact match and case-insensitive)
    const sampleRow = allMDAData[0];
    const columns = Object.keys(sampleRow);
    
    // Enhanced column detection for Month column
    const monthColumn = columns.find(col => {
      const lowerCol = col.toLowerCase().trim();
      return lowerCol === 'month' || 
             lowerCol.includes('month') ||
             lowerCol === 'period' ||
             lowerCol.includes('time') ||
             lowerCol.includes('date');
    });
    
    // Enhanced column detection for Eligible Amount
    const eligibleAmountColumn = columns.find(col => {
      const lowerCol = col.toLowerCase().trim();
      return lowerCol === 'eligible amount' ||
             (lowerCol.includes('eligible') && lowerCol.includes('amount')) ||
             lowerCol.includes('eligible_amount') ||
             lowerCol.includes('eligibleamount');
    });
    
    // Enhanced column detection for Amount Received
    const amountReceivedColumn = columns.find(col => {
      const lowerCol = col.toLowerCase().trim();
      return lowerCol === 'amount received' ||
             (lowerCol.includes('amount') && lowerCol.includes('received')) ||
             lowerCol.includes('amount_received') ||
             lowerCol.includes('amountreceived') ||
             lowerCol.includes('received_amount');
    });

    console.log('MDA Claim Chart - Column Detection:', {
      availableColumns: columns,
      monthColumn,
      eligibleAmountColumn,
      amountReceivedColumn
    });

    if (!monthColumn || !eligibleAmountColumn || !amountReceivedColumn) {
      console.warn('MDA Claim Chart - Missing required columns');
      return { categories: [], series: [], hasData: false };
    }

    // Group by month and sum amounts
    const monthlyData = new Map<string, { eligible: number; received: number }>();

    // Enhanced number parsing function
    const parseIndianNumber = (value: string | number | null | undefined): number => {
      if (value === null || value === undefined || value === '-' || value === '' || String(value).trim() === '') {
        return 0;
      }
      
      // Convert to string and clean
      let cleaned = String(value).replace(/[",\s]/g, '');
      
      // Handle cases where .00 is at the end
      if (cleaned.endsWith('.00')) {
        cleaned = cleaned.slice(0, -3);
      }
      
      const parsed = parseFloat(cleaned);
      
      return isNaN(parsed) ? 0 : parsed;
    };

    // Function to format date to Month-Year
    const formatMonthYear = (dateValue: any): string | null => {
      if (!dateValue || dateValue === '-' || dateValue === '') return null;
      
      try {
        let date: Date;
        
        // Handle different date formats
        if (typeof dateValue === 'string') {
          if (dateValue.includes('-')) {
            date = new Date(dateValue);
          } else {
            return null;
          }
        } else if (dateValue instanceof Date) {
          date = dateValue;
        } else {
          return null;
        }
        
        if (isNaN(date.getTime())) return null;
        
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const month = months[date.getMonth()];
        const year = date.getFullYear().toString().slice(-2);
        
        return `${month}-${year}`;
      } catch (error) {
        console.warn('Error parsing date:', dateValue, error);
        return null;
      }
    };

    allMDAData.forEach((row, index) => {
      const monthValue = row[monthColumn];
      const month = formatMonthYear(monthValue);
      
      // Skip rows with invalid month data
      if (!month) {
        return;
      }

      // Parse amounts
      const eligibleRaw = row[eligibleAmountColumn];
      const receivedRaw = row[amountReceivedColumn];
      
      const eligible = parseIndianNumber(eligibleRaw);
      const received = parseIndianNumber(receivedRaw);
      
      console.log(`MDA Chart Row ${index + 1} - Month: ${month}, Eligible: ${eligibleRaw} -> ${eligible}, Received: ${receivedRaw} -> ${received}`);

      // Include rows with valid amounts (including zero)
      if (eligible >= 0 && received >= 0 && (eligible > 0 || received > 0)) {
        if (!monthlyData.has(month)) {
          monthlyData.set(month, { eligible: 0, received: 0 });
        }
        
        const current = monthlyData.get(month)!;
        current.eligible += eligible;
        current.received += received;
      }
    });

    console.log('MDA Claim Chart - Monthly Data:', Array.from(monthlyData.entries()));

    // Sort months chronologically
    const sortedMonths = Array.from(monthlyData.keys()).sort((a, b) => {
      // Extract month and year from formats like "Dec-23", "Jan-24"
      const partsA = a.split('-');
      const partsB = b.split('-');
      
      if (partsA.length !== 2 || partsB.length !== 2) {
        return 0;
      }
      
      const [monthA, yearA] = partsA;
      const [monthB, yearB] = partsB;
      
      const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      // Convert 2-digit years to 4-digit years
      let fullYearA = parseInt(yearA);
      let fullYearB = parseInt(yearB);
      
      if (fullYearA < 100) {
        fullYearA += fullYearA < 50 ? 2000 : 1900;
      }
      if (fullYearB < 100) {
        fullYearB += fullYearB < 50 ? 2000 : 1900;
      }
      
      const yearComparison = fullYearA - fullYearB;
      if (yearComparison !== 0) return yearComparison;
      
      return monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB);
    });

    const eligibleData = sortedMonths.map(month => {
      const data = monthlyData.get(month)!;
      return Math.round(data.eligible * 100) / 100; // Keep original values, round to 2 decimals
    });

    const receivedData = sortedMonths.map(month => {
      const data = monthlyData.get(month)!;
      return Math.round(data.received * 100) / 100; // Keep original values, round to 2 decimals
    });

    console.log('MDA Claim Chart - Final Data:', {
      sortedMonths,
      eligibleData,
      receivedData
    });

    return {
      categories: sortedMonths,
      series: [
        {
          name: 'Eligible Amount',
          data: eligibleData,
          color: '#3b82f6' // Blue
        },
        {
          name: 'Amount Received',
          data: receivedData,
          color: '#22c55e' // Green
        }
      ],
      hasData: sortedMonths.length > 0 && (eligibleData.some(v => v > 0) || receivedData.some(v => v > 0))
    };
  }, [state.datasets, state.activeDatasetIds]);

  if (!processMDAData.hasData) {
    return null; // Don't render if no MDA claim data
  }

  const chartOptions: ApexOptions = {
    chart: {
      type: chartType,
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
      width: chartType === 'line' ? 4 : chartType === 'area' ? 3 : 0,
    },
    
    fill: {
      type: chartType === 'area' ? 'gradient' : 'solid',
      gradient: chartType === 'area' ? {
        shadeIntensity: 1,
        type: 'vertical',
        colorStops: [
          { offset: 0, color: '#3b82f6', opacity: 0.8 },
          { offset: 50, color: '#3b82f6', opacity: 0.4 },
          { offset: 100, color: '#3b82f6', opacity: 0.1 }
        ]
      } : undefined
    },
    
    dataLabels: { enabled: false },
    
    xaxis: {
      categories: processMDAData.categories,
      labels: {
        style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' },
        rotate: processMDAData.categories.length > 8 ? -45 : 0
      },
      title: {
        text: 'Months',
        style: { color: isDarkMode ? '#9ca3af' : '#6b7280' }
      }
    },
    
    yaxis: {
      labels: {
        formatter: (val: number) => {
          // Format values in thousands/lakhs/crores
          if (val >= 10000000) { // 1 crore
            return `₹${(val / 10000000).toFixed(1)}Cr`;
          } else if (val >= 100000) { // 1 lakh
            return `₹${(val / 100000).toFixed(1)}L`;
          } else if (val >= 1000) { // 1 thousand
            return `₹${(val / 1000).toFixed(1)}K`;
          }
          return `₹${val}`;
        },
        style: { colors: isDarkMode ? '#9ca3af' : '#6b7280' }
      },
      title: {
        text: 'Amount (₹)',
        style: { color: isDarkMode ? '#9ca3af' : '#6b7280' }
      }
    },
    
    colors: processMDAData.series.map(s => s.color),
    
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
          // Format tooltip values
          if (val >= 10000000) { // 1 crore
            return `₹${(val / 10000000).toFixed(2)} Crores`;
          } else if (val >= 100000) { // 1 lakh
            return `₹${(val / 100000).toFixed(2)} Lakhs`;
          } else if (val >= 1000) { // 1 thousand
            return `₹${(val / 1000).toFixed(2)} Thousands`;
          }
          return `₹${val.toLocaleString()}`;
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
      size: chartType === 'line' ? 6 : 0,
      colors: processMDAData.series.map(s => s.color),
      strokeColors: '#ffffff',
      strokeWidth: 2,
      hover: { size: 8 }
    },
    
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '75%',
        dataLabels: { position: 'top' }
      }
    },
    
    responsive: [{
      breakpoint: 768,
      options: {
        legend: { position: 'bottom' },
        xaxis: {
          labels: { rotate: -90 }
        }
      }
    }]
  };

  return (
    <ChartContainer
      title="MDA Claim Analysis - Eligible vs Received Amount"
      availableTypes={['line', 'area', 'bar']}
      currentType={chartType}
      onChartTypeChange={(type) => setChartType(type as 'line' | 'area' | 'bar')}
      className={className}
    >
      <div className="w-full h-full min-h-[500px]">
        <Chart
          options={chartOptions}
          series={processMDAData.series}
          type={chartType}
          height="500px"
          width="100%"
        />
      </div>
    </ChartContainer>
  );
}