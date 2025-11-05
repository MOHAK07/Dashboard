import React, { useMemo } from "react";
import { Percent, FileText, CheckCircle, Wallet, Calendar } from "lucide-react";
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
        dateRange: null,
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
        dateRange: null,
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
        dateRange: null,
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
        dateRange: null,
      };
    }

    // Calculate earliest and latest dates from filtered data
    let earliestYear = Infinity;
    let earliestMonthIndex = 12;
    let latestYear = -Infinity;
    let latestMonthIndex = -1;

    filteredData.forEach((row) => {
      const year = parseInt(String(row[yearColumn]));
      const monthIndex = monthOrder.indexOf(String(row[monthColumn]));

      if (!isNaN(year) && monthIndex !== -1) {
        const rowYearMonth = year * 100 + monthIndex;
        const earliestYearMonth = earliestYear * 100 + earliestMonthIndex;
        const latestYearMonth = latestYear * 100 + latestMonthIndex;

        // Check for earliest date
        if (rowYearMonth < earliestYearMonth) {
          earliestYear = year;
          earliestMonthIndex = monthIndex;
        }

        // Check for latest date
        if (rowYearMonth > latestYearMonth) {
          latestYear = year;
          latestMonthIndex = monthIndex;
        }
      }
    });

    // Create dynamic date range string
    let dateRangeDisplay = null;
    if (earliestYear !== Infinity && latestYear !== -Infinity) {
      const fromMonth = monthOrder[earliestMonthIndex];
      const fromYear = earliestYear.toString().slice(-2);
      const toMonth = monthOrder[latestMonthIndex];
      const toYear = latestYear.toString().slice(-2);

      if (fromMonth === toMonth && fromYear === toYear) {
        dateRangeDisplay = `(${fromMonth}'${fromYear})`;
      } else {
        dateRangeDisplay = `(From ${fromMonth}'${fromYear} to ${toMonth}'${toYear})`;
      }
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
      dateRange: dateRangeDisplay,
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
      {/* Date Header */}
      {mdaKPIs.dateRange && (
        <div className="mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <div className="flex flex-col">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                MDA Claim Recovery Rate
              </p>
              <p className="text-[0.8rem] font-normal text-gray-500 dark:text-gray-500 -mt-0.5">
                {mdaKPIs.dateRange}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Section: Recovery Rate */}
        <div className="flex items-center w-full md:w-auto md:justify-start space-x-4">
          <div className={`p-3 rounded-lg ${statusStyle.bgColor}`}>
            <Percent className={`h-6 w-6 ${statusStyle.iconColor}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Recovery Percentage
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {mdaKPIs.recoveryPercentage.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Right Section: Amounts */}
        <div className="w-full md:w-auto flex flex-1 flex-col sm:flex-row sm:items-center justify-start sm:justify-end gap-6 sm:gap-8">
          {/* Metric Item */}
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
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
            <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
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
            <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-lg">
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
