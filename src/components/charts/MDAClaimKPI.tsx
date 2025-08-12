// import React, { useMemo } from 'react';
// import { TrendingUp, TrendingDown, Percent } from 'lucide-react';
// import { useApp } from '../../contexts/AppContext';
// import { ColorManager } from '../../utils/colorManager';

// interface MDAClaimKPIProps {
//   className?: string;
// }

// export function MDAClaimKPI({ className = '' }: MDAClaimKPIProps) {
//   const { state } = useApp();

//   // Calculate MDA claim KPIs
//   const mdaKPIs = useMemo(() => {
//     // Find MDA claim datasets
//     const mdaDatasets = state.datasets.filter(dataset => 
//       state.activeDatasetIds.includes(dataset.id) && 
//       ColorManager.isMDAClaimDataset(dataset.name)
//     );

//     if (mdaDatasets.length === 0) {
//       console.log('MDA KPI: No MDA datasets found');
//       return { hasData: false, recoveryPercentage: 0, totalEligible: 0, totalReceived: 0 };
//     }

//     // Combine all MDA claim data
//     const allMDAData = mdaDatasets.flatMap(dataset => dataset.data);

//     if (allMDAData.length === 0) {
//       console.log('MDA KPI: No data in MDA datasets');
//       return { hasData: false, recoveryPercentage: 0, totalEligible: 0, totalReceived: 0 };
//     }

//     // Find required columns (exact match first, then case-insensitive)
//     const sampleRow = allMDAData[0];
//     const columns = Object.keys(sampleRow);
    
//     console.log('MDA KPI: Available columns:', columns);
    
//     // Find Eligible Amount column
//     const eligibleAmountColumn = columns.find(col => {
//       const lowerCol = col.toLowerCase().trim();
//       return lowerCol === 'eligible amount' ||
//              (lowerCol.includes('eligible') && lowerCol.includes('amount')) ||
//              lowerCol.includes('eligible_amount') ||
//              lowerCol.includes('eligibleamount');
//     });
    
//     // Find Amount Received column
//     const amountReceivedColumn = columns.find(col => {
//       const lowerCol = col.toLowerCase().trim();
//       return lowerCol === 'amount received' ||
//              (lowerCol.includes('amount') && lowerCol.includes('received')) ||
//              lowerCol.includes('amount_received') ||
//              lowerCol.includes('amountreceived') ||
//              lowerCol.includes('received_amount');
//     });

//     console.log('MDA KPI: Column detection results:', {
//       eligibleAmountColumn,
//       amountReceivedColumn
//     });

//     if (!eligibleAmountColumn || !amountReceivedColumn) {
//       console.warn('MDA KPI: Missing required columns');
//       return { hasData: false, recoveryPercentage: 0, totalEligible: 0, totalReceived: 0 };
//     }

//     // Calculate totals with improved parsing
//     let totalEligible = 0;
//     let totalReceived = 0;
//     let validRowCount = 0;

//     // Enhanced parsing function for amounts
//     const parseAmount = (value: any): number => {
//       if (value === null || value === undefined || value === '-' || value === '' || 
//           String(value).trim() === '' || String(value).toLowerCase() === 'nan') {
//         return 0;
//       }
      
//       // Convert to string and clean
//       let cleaned = String(value).replace(/[",\s]/g, '');
      
//       // Handle cases where .00 is at the end
//       if (cleaned.endsWith('.00')) {
//         cleaned = cleaned.slice(0, -3);
//       }
      
//       const parsed = parseFloat(cleaned);
      
//       return isNaN(parsed) ? 0 : parsed;
//     };

//     allMDAData.forEach((row, index) => {
//       const eligibleRaw = row[eligibleAmountColumn];
//       const receivedRaw = row[amountReceivedColumn];
      
//       const eligible = parseAmount(eligibleRaw);
//       const received = parseAmount(receivedRaw);
      
//       if (index < 10) { // Log first 10 rows for debugging
//         console.log(`MDA KPI Row ${index + 1}: Eligible=${eligibleRaw} -> ${eligible}, Received=${receivedRaw} -> ${received}`);
//       }

//       // Only include rows where at least one amount is greater than 0
//       if (eligible > 0 || received > 0) {
//         totalEligible += eligible;
//         totalReceived += received;
//         validRowCount++;
//       }
//     });

//     console.log('MDA KPI: Final calculation results:', {
//       totalEligible,
//       totalReceived,
//       validRowCount,
//       recoveryPercentage: totalEligible > 0 ? (totalReceived / totalEligible) * 100 : 0
//     });

//     const recoveryPercentage = totalEligible > 0 ? (totalReceived / totalEligible) * 100 : 0;

//     return {
//       hasData: validRowCount > 0,
//       recoveryPercentage: Math.round(recoveryPercentage * 100) / 100,
//       totalEligible,
//       totalReceived
//     };
//   }, [state.datasets, state.activeDatasetIds]);

//   if (!mdaKPIs.hasData) {
//     console.log('MDA KPI: No data to display, component will not render');
//     return null;
//   }

//   const formatAmount = (amount: number): string => {
//     if (amount >= 10000000) { // 1 crore
//       return `₹${(amount / 10000000).toFixed(2)}Cr`;
//     } else if (amount >= 100000) { // 1 lakh
//       return `₹${(amount / 100000).toFixed(2)}L`;
//     } else if (amount >= 1000) { // 1 thousand
//       return `₹${(amount / 1000).toFixed(2)}K`;
//     }
//     return `₹${amount.toFixed(2)}`;
//   };

//   const getChangeIcon = (percentage: number) => {
//     if (percentage >= 75) return <TrendingUp className="h-4 w-4 text-success-500" />;
//     if (percentage >= 50) return <Percent className="h-4 w-4 text-warning-500" />;
//     return <TrendingDown className="h-4 w-4 text-error-500" />;
//   };

//   const getChangeColor = (percentage: number) => {
//     if (percentage >= 75) return 'text-success-600 dark:text-success-400';
//     if (percentage >= 50) return 'text-warning-600 dark:text-warning-400';
//     return 'text-error-600 dark:text-error-400';
//   };

//   const getBackgroundColor = (percentage: number) => {
//     if (percentage >= 75) return 'bg-success-100 dark:bg-success-900/50';
//     if (percentage >= 50) return 'bg-warning-100 dark:bg-warning-900/50';
//     return 'bg-error-100 dark:bg-error-900/50';
//   };

//   return (
//     <div className={`card hover:shadow-md transition-all duration-200 ${className}`}>
//       <div className="flex items-start justify-between">
//         <div className="flex-1">
//           <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
//             MDA Claim Recovery Rate
//           </p>
//           <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
//             {mdaKPIs.recoveryPercentage.toFixed(2)}%
//           </p>
          
//           <div className={`flex items-center space-x-1.5 mb-3 ${getChangeColor(mdaKPIs.recoveryPercentage)}`}>
//             {getChangeIcon(mdaKPIs.recoveryPercentage)}
//             <span className="text-sm font-medium">
//               {mdaKPIs.recoveryPercentage >= 75 ? 'Excellent' : 
//                mdaKPIs.recoveryPercentage >= 50 ? 'Good' : 'Needs Improvement'}
//             </span>
//           </div>

//           <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
//             <div className="flex justify-between">
//               <span>Total Eligible:</span>
//               <span className="font-medium">{formatAmount(mdaKPIs.totalEligible)}</span>
//             </div>
//             <div className="flex justify-between">
//               <span>Amount Received:</span>
//               <span className="font-medium">{formatAmount(mdaKPIs.totalReceived)}</span>
//             </div>
//           </div>
//         </div>
        
//         <div className={`p-3 rounded-lg ${getBackgroundColor(mdaKPIs.recoveryPercentage)}`}>
//           <Percent className={`h-6 w-6 ${
//             mdaKPIs.recoveryPercentage >= 75 ? 'text-success-600 dark:text-success-400' :
//             mdaKPIs.recoveryPercentage >= 50 ? 'text-warning-600 dark:text-warning-400' :
//             'text-error-600 dark:text-error-400'
//           }`} />
//         </div>
//       </div>

//       {/* Progress Bar */}
//       <div className="mt-4">
//         <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
//           <span>Recovery Progress</span>
//           <span>{mdaKPIs.recoveryPercentage.toFixed(2)}%</span>
//         </div>
//         <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
//           <div 
//             className={`h-2 rounded-full transition-all duration-500 ${
//               mdaKPIs.recoveryPercentage >= 75 ? 'bg-success-500' :
//               mdaKPIs.recoveryPercentage >= 50 ? 'bg-warning-500' :
//               'bg-error-500'
//             }`}
//             style={{ width: `${Math.min(mdaKPIs.recoveryPercentage, 100)}%` }}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }

// export default MDAClaimKPI;

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Percent } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { ColorManager } from '../../utils/colorManager';

interface ProductKPI {
  name: string;
  avgProduction: number;
  avgSales: number;
  recoveryRate: number; // sales ÷ production × 100
}

const formatAmount = (amount: number): string => {
  if (amount >= 1e7) return `₹${(amount / 1e7).toFixed(2)}Cr`;
  if (amount >= 1e5) return `₹${(amount / 1e5).toFixed(2)}L`;
  if (amount >= 1e3) return `₹${(amount / 1e3).toFixed(2)}K`;
  return `₹${amount.toFixed(2)}`;
};

const getChangeIcon = (pct: number) => 
  pct >= 75 ? <TrendingUp className="h-4 w-4 text-success-500"/> :
  pct >= 50 ? <Percent    className="h-4 w-4 text-warning-500"/> :
               <TrendingDown className="h-4 w-4 text-error-500"/>;

export function MDAClaimKPI() {
  const { state } = useApp();

  const productKPIs: ProductKPI[] = useMemo(() => {
    // Helper to compute averages for a given dataset name predicate
    const computeFor = (predicate: (name: string) => boolean, displayName: string): ProductKPI | null => {
      const ds = state.datasets
        .filter(d => state.activeDatasetIds.includes(d.id) && predicate(d.name))
        .flatMap(d => d.data);
      if (!ds.length) return null;

      // detect columns
      const cols = Object.keys(ds[0]);
      const prodCol = cols.find(c => c.toLowerCase().includes('production'));
      const salesCol = cols.find(c => c.toLowerCase().includes('sales'));
      if (!prodCol || !salesCol) return null;

      let sumProd = 0, sumSales = 0;
      ds.forEach(r => {
        const p = parseFloat(String(r[prodCol]).replace(/[, ]/g, '')) || 0;
        const s = parseFloat(String(r[salesCol]).replace(/[, ]/g, '')) || 0;
        sumProd += p;
        sumSales += s;
      });
      const avgProd = sumProd / ds.length;
      const avgSales = sumSales / ds.length;
      const recoveryPct = avgProd > 0 ? (avgSales / avgProd) * 100 : 0;

      return {
        name: displayName,
        avgProduction: Math.round(avgProd * 100) / 100,
        avgSales: Math.round(avgSales * 100) / 100,
        recoveryRate: Math.round(recoveryPct * 100) / 100
      };
    };

    return [
      computeFor(name => ColorManager.isRCFDataset(name), 'RCF'),
      computeFor(name => ColorManager.isBoomiDataset(name), 'Boomi Samrudhi')
    ].filter(Boolean) as ProductKPI[];
  }, [state.datasets, state.activeDatasetIds]);

  if (!productKPIs.length) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {productKPIs.map(({ name, avgProduction, avgSales, recoveryRate }) => (
        <div key={name} className="card p-6 hover:shadow-lg transition">
          <h3 className="text-lg font-semibold mb-4">{name} Averages</h3>
          <div className="flex space-x-6 mb-4">
            <div>
              <p className="text-sm text-gray-500">Avg Production</p>
              <p className="text-2xl font-bold">{formatAmount(avgProduction)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Sales</p>
              <p className="text-2xl font-bold">{formatAmount(avgSales)}</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm text-gray-500">Recovery Rate</p>
              <div className="flex items-center space-x-2">
                {getChangeIcon(recoveryRate)}
                <p className="text-xl font-bold">{recoveryRate.toFixed(1)}%</p>
              </div>
            </div>
            <div className={`p-2 rounded-full ${
              recoveryRate >= 75 ? 'bg-green-100' :
              recoveryRate >= 50 ? 'bg-yellow-100' :
              'bg-red-100'
            }`}>
              <Percent className={`h-6 w-6 ${
                recoveryRate >= 75 ? 'text-success-600' :
                recoveryRate >= 50 ? 'text-warning-600' :
                'text-error-600'
              }`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
