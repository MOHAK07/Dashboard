// import React, { useMemo } from "react";
// import { TrendingUp, TrendingDown, Percent } from "lucide-react";
// import { useApp } from "../../contexts/AppContext";
// import { useGlobalFilterContext } from "../../contexts/GlobalFilterContext";
// import { ColorManager } from "../../utils/colorManager";

// interface MDAClaimKPIProps {
//   className?: string;
// }

// export function MDAClaimKPI({ className = "" }: MDAClaimKPIProps) {
//   const { state } = useApp();
//   const { filterState } = useGlobalFilterContext(); // Use filterState for direct access

//   const mdaKPIs = useMemo(() => {
//     const mdaDatasets = state.datasets.filter(
//       (dataset) =>
//         state.activeDatasetIds.includes(dataset.id) &&
//         ColorManager.isMDAClaimDataset(dataset.name)
//     );

//     if (mdaDatasets.length === 0) {
//       return {
//         hasData: false,
//         recoveryPercentage: 0,
//         totalEligible: 0,
//         totalReceived: 0,
//       };
//     }

//     let allMDAData = mdaDatasets.flatMap((dataset) => dataset.data);

//     if (allMDAData.length === 0) {
//       return {
//         hasData: false,
//         recoveryPercentage: 0,
//         totalEligible: 0,
//         totalReceived: 0,
//       };
//     }

//     const sampleRow = allMDAData[0];
//     const columns = Object.keys(sampleRow);
//     const monthColumn = columns.find((col) =>
//       col.toLowerCase().includes("month")
//     );
//     const yearColumn = columns.find((col) =>
//       col.toLowerCase().includes("year")
//     );
//     const eligibleAmountColumn = columns.find((col) =>
//       col.toLowerCase().includes("eligible")
//     );
//     const amountReceivedColumn = columns.find((col) =>
//       col.toLowerCase().includes("received")
//     );

//     if (
//       !monthColumn ||
//       !yearColumn ||
//       !eligibleAmountColumn ||
//       !amountReceivedColumn
//     ) {
//       console.warn("MDA KPI: Missing required columns");
//       return {
//         hasData: false,
//         recoveryPercentage: 0,
//         totalEligible: 0,
//         totalReceived: 0,
//       };
//     }

//     const { startDate, endDate } = filterState.filters.dateRange;
//     const { selectedMonths } = filterState.filters.months;
//     const monthOrder = [
//       "January",
//       "February",
//       "March",
//       "April",
//       "May",
//       "June",
//       "July",
//       "August",
//       "September",
//       "October",
//       "November",
//       "December",
//     ];

//     let filteredData = allMDAData;

//     // Apply Custom Date Range Filter using the robust numeric method
//     if (startDate && endDate) {
//       const start = new Date(startDate);
//       const end = new Date(endDate);
//       const startYearMonth = start.getUTCFullYear() * 100 + start.getUTCMonth();
//       const endYearMonth = end.getUTCFullYear() * 100 + end.getUTCMonth();

//       filteredData = filteredData.filter((row) => {
//         const year = parseInt(String(row[yearColumn]));
//         const monthIndex = monthOrder.indexOf(String(row[monthColumn]));
//         if (isNaN(year) || monthIndex === -1) return false;
//         const rowYearMonth = year * 100 + monthIndex;
//         return rowYearMonth >= startYearMonth && rowYearMonth <= endYearMonth;
//       });
//     }

//     // Apply Month Name Filter
//     if (selectedMonths.length > 0) {
//       filteredData = filteredData.filter((row) =>
//         selectedMonths.includes(String(row[monthColumn]))
//       );
//     }

//     if (filteredData.length === 0) {
//       return {
//         hasData: false,
//         recoveryPercentage: 0,
//         totalEligible: 0,
//         totalReceived: 0,
//       };
//     }

//     let totalEligible = 0;
//     let totalReceived = 0;

//     const parseAmount = (value: any): number => {
//       if (
//         value === null ||
//         value === undefined ||
//         value === "-" ||
//         String(value).trim() === ""
//       )
//         return 0;
//       let cleaned = String(value).replace(/[",\s]/g, "");
//       if (cleaned.endsWith(".00")) cleaned = cleaned.slice(0, -3);
//       const parsed = parseFloat(cleaned);
//       return isNaN(parsed) ? 0 : parsed;
//     };

//     filteredData.forEach((row) => {
//       const eligible = parseAmount(row[eligibleAmountColumn]);
//       const received = parseAmount(row[amountReceivedColumn]);
//       if (eligible > 0 || received > 0) {
//         totalEligible += eligible;
//         totalReceived += received;
//       }
//     });

//     const recoveryPercentage =
//       totalEligible > 0 ? (totalReceived / totalEligible) * 100 : 0;

//     return {
//       hasData: totalEligible > 0 || totalReceived > 0,
//       recoveryPercentage: Math.round(recoveryPercentage * 100) / 100,
//       totalEligible,
//       totalReceived,
//     };
//   }, [state.datasets, state.activeDatasetIds, filterState]);

//   if (!mdaKPIs.hasData) {
//     return null;
//   }

//   const formatAmount = (amount: number): string => {
//     if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
//     if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
//     if (amount >= 1000) return `₹${(amount / 1000).toFixed(2)}K`;
//     return `₹${amount.toFixed(2)}`;
//   };

//   const getChangeIcon = (percentage: number) => {
//     if (percentage >= 75)
//       return <TrendingUp className="h-4 w-4 text-success-500" />;
//     if (percentage >= 50)
//       return <Percent className="h-4 w-4 text-warning-500" />;
//     return <TrendingDown className="h-4 w-4 text-error-500" />;
//   };

//   const getChangeColor = (percentage: number) => {
//     if (percentage >= 75) return "text-success-600 dark:text-success-400";
//     if (percentage >= 50) return "text-warning-600 dark:text-warning-400";
//     return "text-error-600 dark:text-error-400";
//   };

//   const getBackgroundColor = (percentage: number) => {
//     if (percentage >= 75) return "bg-success-100 dark:bg-success-900/50";
//     if (percentage >= 50) return "bg-warning-100 dark:bg-warning-900/50";
//     return "bg-error-100 dark:bg-error-900/50";
//   };

//   return (
//     <div
//       className={`card hover:shadow-md transition-all duration-200 ${className}`}
//     >
//       <div className="flex items-start justify-between">
//         <div className="flex-1">
//           <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
//             MDA Claim Recovery Rate
//           </p>
//           <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
//             {mdaKPIs.recoveryPercentage.toFixed(2)}%
//           </p>

//           {/* <div className={`flex items-center space-x-1.5 mb-3 ${getChangeColor(mdaKPIs.recoveryPercentage)}`}>
//             {getChangeIcon(mdaKPIs.recoveryPercentage)}
//             <span className="text-sm font-medium">
//               {mdaKPIs.recoveryPercentage >= 75 ? 'Excellent' :
//                mdaKPIs.recoveryPercentage >= 50 ? 'Good' : 'Needs Improvement'}
//             </span>
//           </div> */}

//           <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
//             <div className="flex justify-between">
//               <span>Total Eligible:</span>
//               <span className="font-medium">
//                 {formatAmount(mdaKPIs.totalEligible)}
//               </span>
//             </div>
//             <div className="flex justify-between">
//               <span>Amount Received:</span>
//               <span className="font-medium">
//                 {formatAmount(mdaKPIs.totalReceived)}
//               </span>
//             </div>
//           </div>
//         </div>

//         <div
//           className={`p-3 rounded-lg ${getBackgroundColor(
//             mdaKPIs.recoveryPercentage
//           )}`}
//         >
//           <Percent
//             className={`h-6 w-6 ${
//               mdaKPIs.recoveryPercentage >= 75
//                 ? "text-success-600 dark:text-success-400"
//                 : mdaKPIs.recoveryPercentage >= 50
//                 ? "text-warning-600 dark:text-warning-400"
//                 : "text-error-600 dark:text-error-400"
//             }`}
//           />
//         </div>
//       </div>

//       {/* <div className="mt-4">
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
//       </div> */}
//     </div>
//   );
// }

// export default MDAClaimKPI;

import React, { useMemo } from "react";
import { Percent, FileText, CheckCircle, Wallet } from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import { useGlobalFilterContext } from "../../contexts/GlobalFilterContext";
import { ColorManager } from "../../utils/colorManager";

interface MDAClaimKPIProps {
  className?: string;
}

export function MDAClaimKPI({ className = "" }: MDAClaimKPIProps) {
  const { state } = useApp();
  const { filterState } = useGlobalFilterContext();

  const mdaKPIs = useMemo(() => {
    const mdaDatasets = state.datasets.filter(
      (dataset) =>
        state.activeDatasetIds.includes(dataset.id) &&
        ColorManager.isMDAClaimDataset(dataset.name)
    );

    if (mdaDatasets.length === 0) {
      return {
        hasData: false,
        recoveryPercentage: 0,
        totalEligible: 0,
        totalReceived: 0,
        balanceAmount: 0,
      };
    }

    let allMDAData = mdaDatasets.flatMap((dataset) => dataset.data);

    if (allMDAData.length === 0) {
      return {
        hasData: false,
        recoveryPercentage: 0,
        totalEligible: 0,
        totalReceived: 0,
        balanceAmount: 0,
      };
    }

    const sampleRow = allMDAData[0];
    const columns = Object.keys(sampleRow);
    const monthColumn = columns.find((col) =>
      col.toLowerCase().includes("month")
    );
    const yearColumn = columns.find((col) =>
      col.toLowerCase().includes("year")
    );
    const eligibleAmountColumn = columns.find((col) =>
      col.toLowerCase().includes("eligible")
    );
    const amountReceivedColumn = columns.find((col) =>
      col.toLowerCase().includes("received")
    );

    if (
      !monthColumn ||
      !yearColumn ||
      !eligibleAmountColumn ||
      !amountReceivedColumn
    ) {
      console.warn("MDA KPI: Missing required columns");
      return {
        hasData: false,
        recoveryPercentage: 0,
        totalEligible: 0,
        totalReceived: 0,
        balanceAmount: 0,
      };
    }

    const { startDate, endDate } = filterState.filters.dateRange;
    const { selectedMonths } = filterState.filters.months;
    const monthOrder = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    let filteredData = allMDAData;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const startYearMonth = start.getUTCFullYear() * 100 + start.getUTCMonth();
      const endYearMonth = end.getUTCFullYear() * 100 + end.getUTCMonth();

      filteredData = filteredData.filter((row) => {
        const year = parseInt(String(row[yearColumn]));
        const monthIndex = monthOrder.indexOf(String(row[monthColumn]));
        if (isNaN(year) || monthIndex === -1) return false;
        const rowYearMonth = year * 100 + monthIndex;
        return rowYearMonth >= startYearMonth && rowYearMonth <= endYearMonth;
      });
    }

    if (selectedMonths.length > 0) {
      filteredData = filteredData.filter((row) =>
        selectedMonths.includes(String(row[monthColumn]))
      );
    }

    if (filteredData.length === 0) {
      return {
        hasData: false,
        recoveryPercentage: 0,
        totalEligible: 0,
        totalReceived: 0,
        balanceAmount: 0,
      };
    }

    let totalEligible = 0;
    let totalReceived = 0;

    const parseAmount = (value: any): number => {
      if (
        value === null ||
        value === undefined ||
        value === "-" ||
        String(value).trim() === ""
      )
        return 0;
      let cleaned = String(value).replace(/[",\s]/g, "");
      if (cleaned.endsWith(".00")) cleaned = cleaned.slice(0, -3);
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    filteredData.forEach((row) => {
      const eligible = parseAmount(row[eligibleAmountColumn]);
      const received = parseAmount(row[amountReceivedColumn]);
      if (eligible > 0 || received > 0) {
        totalEligible += eligible;
        totalReceived += received;
      }
    });

    const balanceAmount = totalEligible - totalReceived;
    const recoveryPercentage =
      totalEligible > 0 ? (totalReceived / totalEligible) * 100 : 0;

    return {
      hasData: totalEligible > 0 || totalReceived > 0,
      recoveryPercentage: Math.round(recoveryPercentage * 100) / 100,
      totalEligible,
      totalReceived,
      balanceAmount,
    };
  }, [state.datasets, state.activeDatasetIds, filterState]);

  if (!mdaKPIs.hasData) {
    return null;
  }

  const formatAmount = (amount: number): string => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    return `₹${(amount / 1000).toFixed(2)}K`;
  };

  const getStatusStyle = (percentage: number) => {
    if (percentage >= 75)
      return {
        iconColor: "text-success-500",
        bgColor: "bg-success-100 dark:bg-success-900/50",
      };
    if (percentage >= 50)
      return {
        iconColor: "text-warning-500",
        bgColor: "bg-warning-100 dark:bg-warning-900/50",
      };
    return {
      iconColor: "text-error-500",
      bgColor: "bg-error-100 dark:bg-error-900/50",
    };
  };

  const statusStyle = getStatusStyle(mdaKPIs.recoveryPercentage);

  return (
    <div className={`card lg:col-span-3 ${className}`}>
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Section: Recovery Rate */}
        <div className="flex items-center justify-between w-full md:w-auto md:justify-start space-x-4">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              MDA Claim Recovery Rate
            </p>
            <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">
              {mdaKPIs.recoveryPercentage.toFixed(2)}%
            </p>
          </div>
          <div className={`p-3 rounded-lg ${statusStyle.bgColor}`}>
            <Percent className={`h-6 w-6 ${statusStyle.iconColor}`} />
          </div>
        </div>

        {/* Right Section: Amounts */}
        <div className="w-full md:w-auto flex flex-1 flex-col sm:flex-row sm:items-center justify-start sm:justify-end gap-6 sm:gap-8">
          {/* Metric Item */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Eligible
              </p>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {formatAmount(mdaKPIs.totalEligible)}
              </p>
            </div>
          </div>

          {/* Metric Item */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Amount Received
              </p>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {formatAmount(mdaKPIs.totalReceived)}
              </p>
            </div>
          </div>

          {/* Metric Item */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
              <Wallet className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Balance Amount
              </p>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {formatAmount(mdaKPIs.balanceAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MDAClaimKPI;
