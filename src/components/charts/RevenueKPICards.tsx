import React, { useMemo } from "react";
import { TrendingUp, DollarSign, Calendar, BarChart3 } from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import { useGlobalFilterContext } from "../../contexts/GlobalFilterContext";
import { DataProcessor } from "../../utils/dataProcessing";

interface RevenueKPICardsProps {
  className?: string;
}

interface RevenueData {
  month: string;
  directSalesFOM: number;
  directSalesLFOM: number;
  mdaClaimReceived: number;
  totalRevenue: number;
}

export function RevenueKPICards({ className = "" }: RevenueKPICardsProps) {
  const { state } = useApp();
  const { getFilteredData } = useGlobalFilterContext();

  // Process revenue data from Revenue table
  const revenueData = useMemo((): RevenueData[] => {
    // Find Revenue datasets
    const revenueDatasets = state.datasets.filter(
      (dataset) =>
        state.activeDatasetIds.includes(dataset.id) &&
        (dataset.name.toLowerCase().includes("revenue") ||
          dataset.fileName.toLowerCase().includes("revenue"))
    );

    if (revenueDatasets.length === 0) {
      return [];
    }

    // Combine all revenue data
    const allRevenueData = revenueDatasets.flatMap((dataset) =>
      getFilteredData(dataset.data)
    );

    if (allRevenueData.length === 0) {
      return [];
    }

    // Find required columns (case-insensitive)
    const sampleRow = allRevenueData[0];
    const columns = Object.keys(sampleRow);

    const monthsColumn = columns.find((col) => {
      const lowerCol = col.toLowerCase().trim();
      return lowerCol === "months" || lowerCol === "month";
    });

    const directSalesFOMColumn = columns.find((col) => {
      const lowerCol = col.toLowerCase().trim();
      return (
        lowerCol === "direct sales fom" ||
        (lowerCol.includes("direct") && lowerCol.includes("fom"))
      );
    });

    const directSalesLFOMColumn = columns.find((col) => {
      const lowerCol = col.toLowerCase().trim();
      return (
        lowerCol === "direct sales lfom" ||
        (lowerCol.includes("direct") && lowerCol.includes("lfom"))
      );
    });

    const mdaClaimColumn = columns.find((col) => {
      const lowerCol = col.toLowerCase().trim();
      return (
        lowerCol === "mda claim received" ||
        (lowerCol.includes("mda") && lowerCol.includes("claim"))
      );
    });

    const totalRevenueColumn = columns.find((col) => {
      const lowerCol = col.toLowerCase().trim();
      return (
        lowerCol === "total revenue" ||
        (lowerCol.includes("total") && lowerCol.includes("revenue"))
      );
    });

    if (
      !monthsColumn ||
      !directSalesFOMColumn ||
      !directSalesLFOMColumn ||
      !mdaClaimColumn ||
      !totalRevenueColumn
    ) {
      console.warn("Revenue KPI: Missing required columns");
      return [];
    }

    // Parse amount function for Indian number format
    const parseAmount = (value: any): number => {
      if (
        value === null ||
        value === undefined ||
        value === "-" ||
        value === "" ||
        String(value).trim() === "" ||
        String(value).toLowerCase() === "nan"
      ) {
        return 0;
      }

      let cleaned = String(value).replace(/[",\s]/g, "");

      if (cleaned.endsWith(".00")) {
        cleaned = cleaned.slice(0, -3);
      }

      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    // Process data
    const processedData: RevenueData[] = allRevenueData
      .map((row) => ({
        month: String(row[monthsColumn] || "").trim(),
        directSalesFOM: parseAmount(row[directSalesFOMColumn]),
        directSalesLFOM: parseAmount(row[directSalesLFOMColumn]),
        mdaClaimReceived: parseAmount(row[mdaClaimColumn]),
        totalRevenue: parseAmount(row[totalRevenueColumn]),
      }))
      .filter((item) => item.month && item.month !== "");

    // Sort by month order
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

    return processedData.sort((a, b) => {
      const aIndex = monthOrder.indexOf(a.month);
      const bIndex = monthOrder.indexOf(b.month);
      return aIndex - bIndex;
    });
  }, [state.datasets, state.activeDatasetIds, getFilteredData]);

  // Get latest month data from the (potentially filtered) data
  const latestMonthData =
    revenueData.length > 0 ? revenueData[revenueData.length - 1] : null;

  if (!latestMonthData) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return DataProcessor.formatCurrency(amount, state.settings.currency);
  };

  const displayData = latestMonthData;

  return (
    <div className={`grid grid-cols-1 gap-4 sm:gap-6 ${className}`}>
      <div className="card hover:shadow-lg transition-all duration-200">
        {/* Mobile Layout - Stacked vertically */}
        <div className="flex flex-col space-y-4 md:hidden">
          {/* Total Revenue Section */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <Calendar className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
                Total Revenue for {displayData.month}
              </p>
            </div>
            <p className="text-2xl sm:text-2xl font-semibold text-primary-900 dark:text-primary-100">
              {formatCurrency(displayData.totalRevenue)}
            </p>
          </div>

          {/* Horizontal Divider for Mobile */}
          <div className="border-t border-gray-200 dark:border-gray-800"></div>

          {/* Breakdown Section */}
          <div className="space-y-3">
            {/* Direct Sales FOM */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                <p className="text-sm sm:text-base font-small text-gray-700 dark:text-gray-200">
                  Direct Sales FOM
                </p>
              </div>
              <p className="text-base sm:text-lg font-semibold text-blue-600 dark:text-blue-400">
                {formatCurrency(displayData.directSalesFOM)}
              </p>
            </div>

            {/* Direct Sales LFOM */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0"></div>
                <p className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200">
                  Direct Sales LFOM
                </p>
              </div>
              <p className="text-base sm:text-lg font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(displayData.directSalesLFOM)}
              </p>
            </div>

            {/* MDA Claim Received */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500 flex-shrink-0"></div>
                <p className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200">
                  MDA Claim Received
                </p>
              </div>
              <p className="text-base sm:text-lg font-semibold text-purple-600 dark:text-purple-400">
                {formatCurrency(displayData.mdaClaimReceived)}
              </p>
            </div>
          </div>
        </div>

        {/* Desktop/Tablet Layout - Side by side */}
        <div className="hidden md:flex justify-between items-start">
          {/* Left Side: Total Revenue */}
          <div className="flex-1 pr-4 lg:pr-6">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
                Total Revenue for {displayData.month}
              </p>
            </div>
            <p className="text-2xl lg:text-3xl xl:text-3xl font-semibold text-primary-900 dark:text-primary-100">
              {formatCurrency(displayData.totalRevenue)}
            </p>
          </div>

          {/* Vertical Divider */}
          <div className="border-l border-gray-200 dark:border-gray-800 h-24 lg:h-28 self-center"></div>

          {/* Right Side: Breakdown */}
          <div className="flex-1 pl-4 lg:pl-6">
            <div className="space-y-3 lg:space-y-4">
              {/* Direct Sales FOM */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                  <p className="text-sm lg:text-base xl:text-md font-medium text-gray-700 dark:text-gray-200">
                    Direct Sales FOM
                  </p>
                </div>
                <p className="text-base lg:text-lg xl:text-lg font-semibold text-blue-600 dark:text-blue-400 text-right">
                  {formatCurrency(displayData.directSalesFOM)}
                </p>
              </div>

              {/* Direct Sales LFOM */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0"></div>
                  <p className="text-sm lg:text-base xl:text-md font-medium text-gray-700 dark:text-gray-200">
                    Direct Sales LFOM
                  </p>
                </div>
                <p className="text-base lg:text-lg xl:text-lg font-semibold text-green-600 dark:text-green-400 text-right">
                  {formatCurrency(displayData.directSalesLFOM)}
                </p>
              </div>

              {/* MDA Claim Received */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500 flex-shrink-0"></div>
                  <p className="text-sm lg:text-base xl:text-md font-medium text-gray-700 dark:text-gray-200">
                    MDA Claim Received
                  </p>
                </div>
                <p className="text-base lg:text-lg xl:text-lg font-semibold text-purple-600 dark:text-purple-400 text-right">
                  {formatCurrency(displayData.mdaClaimReceived)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RevenueKPICards;
