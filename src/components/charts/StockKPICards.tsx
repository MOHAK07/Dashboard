import React, { useMemo } from "react";
import {
  Package,
  TrendingUp,
  TrendingDown,
  Factory,
  ShoppingCart,
  IndianRupee,
} from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import { useGlobalFilterContext } from "../../contexts/GlobalFilterContext";
import { ColorManager } from "../../utils/colorManager";

interface StockKPICardsProps {
  className?: string;
}

// Enhanced date parsing function (copied from StockAnalysisChart)
const parseDate = (dateString: string): Date | null => {
  if (!dateString || typeof dateString !== "string") return null;

  // Remove any extra whitespace
  const cleanDateString = dateString.trim();

  // Try multiple date formats
  const formats = [
    // dd-mm-yyyy or dd/mm/yyyy
    /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/,
    // dd-mm-yy or dd/mm/yy
    /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2})$/,
    // yyyy-mm-dd
    /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/,
  ];

  for (const format of formats) {
    const match = cleanDateString.match(format);
    if (match) {
      let day, month, year;

      if (format === formats[2]) {
        // yyyy-mm-dd format
        year = parseInt(match[1], 10);
        month = parseInt(match[2], 10) - 1;
        day = parseInt(match[3], 10);
      } else {
        // dd-mm-yyyy or dd-mm-yy format
        day = parseInt(match[1], 10);
        month = parseInt(match[2], 10) - 1;
        year = parseInt(match[3], 10);

        // Handle 2-digit years
        if (year < 100) {
          year += year < 50 ? 2000 : 1900;
        }
      }

      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        const date = new Date(year, month, day);
        if (
          date.getFullYear() === year &&
          date.getMonth() === month &&
          date.getDate() === day
        ) {
          return date;
        }
      }
    }
  }

  // Fallback: try native Date parsing
  const fallbackDate = new Date(cleanDateString);
  return !isNaN(fallbackDate.getTime()) ? fallbackDate : null;
};

export function StockKPICards({ className = "" }: StockKPICardsProps) {
  const { state } = useApp();
  const { getFilteredData, filterState } = useGlobalFilterContext();

  // Dynamic date range logic with data-based fallback
  const dateRangeText = useMemo(() => {
    const { selectedMonths } = filterState.filters.months;
    const { startDate, endDate } = filterState.filters.dateRange;
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

    // Priority 1: Use selected months from global filter
    if (selectedMonths.length > 0) {
      const sortedMonths = [...selectedMonths].sort(
        (a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b)
      );

      if (sortedMonths.length === 1) {
        return `(${sortedMonths[0]}'25)`;
      } else {
        const fromMonth = sortedMonths[0];
        const toMonth = sortedMonths[sortedMonths.length - 1];
        return `(From ${fromMonth}'25 to ${toMonth}'25)`;
      }
    }

    // Priority 2: Use date range from global date range filter
    if (startDate && endDate) {
      try {
        const startDateObj = new Date(startDate + "T00:00:00");
        const endDateObj = new Date(endDate + "T00:00:00");

        const startMonth = monthOrder[startDateObj.getUTCMonth()];
        const startYear = startDateObj.getFullYear().toString().slice(-2);
        const endMonth = monthOrder[endDateObj.getUTCMonth()];
        const endYear = endDateObj.getFullYear().toString().slice(-2);

        if (startMonth === endMonth && startYear === endYear) {
          return `(${startMonth}'${startYear})`;
        } else {
          return `(From ${startMonth}'${startYear} to ${endMonth}'${endYear})`;
        }
      } catch (e) {
        // Fallback if date is invalid
      }
    }

    // Priority 2.5: Use only start date if end date is not available
    if (startDate) {
      try {
        const date = new Date(startDate + "T00:00:00");
        const monthName = monthOrder[date.getUTCMonth()];
        const year = date.getFullYear().toString().slice(-2);
        return `(From ${monthName}'${year})`;
      } catch (e) {
        // Fallback if date is invalid
      }
    }

    // Priority 3: Derive from actual stock data when no filters are applied
    const stockDatasets = state.datasets.filter(
      (dataset) =>
        state.activeDatasetIds.includes(dataset.id) &&
        ColorManager.isStockDataset(dataset.name)
    );

    if (stockDatasets.length > 0) {
      const allStockData = stockDatasets.flatMap((dataset) => dataset.data);

      if (allStockData.length > 0) {
        const sampleRow = allStockData[0];
        const columns = Object.keys(sampleRow);
        const dateColumn = columns.find((col) =>
          col.toLowerCase().includes("date")
        );

        if (dateColumn) {
          let earliestDate: Date | null = null;
          let latestDate: Date | null = null;

          allStockData.forEach((row) => {
            const date = parseDate(row[dateColumn]);
            if (date) {
              if (!earliestDate || date < earliestDate) {
                earliestDate = date;
              }
              if (!latestDate || date > latestDate) {
                latestDate = date;
              }
            }
          });

          if (earliestDate && latestDate) {
            const startMonth = monthOrder[earliestDate.getMonth()];
            const startYear = earliestDate.getFullYear().toString().slice(-2);
            const endMonth = monthOrder[latestDate.getMonth()];
            const endYear = latestDate.getFullYear().toString().slice(-2);

            if (startMonth === endMonth && startYear === endYear) {
              return `(${startMonth}'${startYear})`;
            } else {
              return `(From ${startMonth}'${startYear} to ${endMonth}'${endYear})`;
            }
          }
        }
      }
    }

    // Final fallback (should rarely be reached)
    return "(All data)";
  }, [
    filterState.filters.months,
    filterState.filters.dateRange,
    state.datasets,
    state.activeDatasetIds,
  ]);

  const kpiData = useMemo(() => {
    const stockDatasets = state.datasets.filter(
      (dataset) =>
        state.activeDatasetIds.includes(dataset.id) &&
        ColorManager.isStockDataset(dataset.name)
    );

    if (stockDatasets.length === 0) {
      return { hasData: false };
    }

    const allStockData = stockDatasets.flatMap((dataset) =>
      getFilteredData(dataset.data)
    );

    if (allStockData.length === 0) {
      return { hasData: false };
    }

    const sampleRow = allStockData[0];
    const columns = Object.keys(sampleRow);

    const findColumn = (keywords: string[]) =>
      columns.find((col) =>
        keywords.every((kw) => col.toLowerCase().includes(kw))
      );

    const dateColumn = findColumn(["date"]);
    const rcfProductionColumn = findColumn(["rcf", "production"]);
    const rcfSalesColumn = findColumn(["rcf", "sales"]);
    const rcfPriceColumn = findColumn(["rcf", "price"]);
    const rcfRevenueColumn = findColumn(["rcf", "revenue"]);

    const boomiProductionColumn = findColumn(["boomi", "production"]);
    const boomiSalesColumn = findColumn(["boomi", "sales"]);
    const boomiPriceColumn = findColumn(["boomi", "price"]);
    const boomiRevenueColumn = findColumn(["boomi", "revenue"]);

    if (
      !rcfProductionColumn ||
      !rcfSalesColumn ||
      !boomiProductionColumn ||
      !boomiSalesColumn ||
      !dateColumn // Ensure Date column exists
    ) {
      console.warn(
        "Production Sales KPI - Missing required columns (incl. Date)"
      );
      return { hasData: false };
    }

    const parseIndianNumber = (value: any): number => {
      if (!value || value === "-" || String(value).trim() === "") return 0;
      const cleaned = String(value).replace(/[",\s]/g, "");
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    let totalRCFProduction = 0;
    let totalRCFSales = 0;
    let totalRCFRevenue = 0;
    let rcfPrice = 0;

    let totalBoomiProduction = 0;
    let totalBoomiSales = 0;
    let totalBoomiRevenue = 0;
    let boomiPrice = 0;

    allStockData.forEach((row, index) => {
      // Sum KPIs
      totalRCFProduction += parseIndianNumber(row[rcfProductionColumn]);
      totalRCFSales += parseIndianNumber(row[rcfSalesColumn]);
      if (rcfRevenueColumn)
        totalRCFRevenue += parseIndianNumber(row[rcfRevenueColumn]);

      totalBoomiProduction += parseIndianNumber(row[boomiProductionColumn]);
      totalBoomiSales += parseIndianNumber(row[boomiSalesColumn]);
      if (boomiRevenueColumn)
        totalBoomiRevenue += parseIndianNumber(row[boomiRevenueColumn]);

      if (index === 0) {
        if (rcfPriceColumn) rcfPrice = parseIndianNumber(row[rcfPriceColumn]);
        if (boomiPriceColumn)
          boomiPrice = parseIndianNumber(row[boomiPriceColumn]);
      }
    });

    // If revenue columns don't exist, calculate from sales and price
    if (!rcfRevenueColumn && rcfPrice > 0) {
      totalRCFRevenue = totalRCFSales * rcfPrice;
    }
    if (!boomiRevenueColumn && boomiPrice > 0) {
      totalBoomiRevenue = totalBoomiSales * boomiPrice;
    }

    return {
      hasData: true,
      rcfProduction: totalRCFProduction,
      rcfSales: totalRCFSales,
      rcfPrice,
      rcfRevenue: totalRCFRevenue,
      boomiProduction: totalBoomiProduction,
      boomiSales: totalBoomiSales,
      boomiPrice,
      boomiRevenue: totalBoomiRevenue,
    };
  }, [state.datasets, state.activeDatasetIds, getFilteredData]);

  if (!kpiData.hasData) {
    return null;
  }

  const formatAmount = (amount: number): string => {
    if (amount >= 10000000) {
      return `${(amount / 10000000).toFixed(2)}Cr`;
    } else if (amount >= 100000) {
      return `${(amount / 100000).toFixed(2)}L`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(2)}K`;
    }
    return amount.toFixed(0);
  };

  const formatCurrency = (amount: number): string => `₹${formatAmount(amount)}`;

  const getPerformanceStatus = (production: number, sales: number) => {
    const ratio = sales > 0 ? production / sales : production > 0 ? 2 : 0;
    if (ratio > 1.2)
      return { status: "High Production", color: "success", icon: TrendingUp };
    if (ratio > 0.8)
      return { status: "Balanced", color: "warning", icon: Package };
    return { status: "High Demand", color: "error", icon: TrendingDown };
  };

  const {
    rcfProduction,
    rcfSales,
    rcfPrice,
    rcfRevenue,
    boomiProduction,
    boomiSales,
    boomiPrice,
    boomiRevenue,
  } = kpiData;
  const rcfStatus = getPerformanceStatus(rcfProduction, rcfSales);
  const boomiStatus = getPerformanceStatus(boomiProduction, boomiSales);

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${className}`}>
      {/* RCF Product KPI */}
      <div className="card hover:shadow-md transition-all duration-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-400">
                RCF Product Performance
              </p>
              <p className="text-[0.8rem] font-normal text-gray-500 dark:text-gray-500 -mt-0.5">
                {dateRangeText}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Factory className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-1" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Production
                  </span>
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatAmount(rcfProduction || 0)}{" "}
                  <span className="text-sm font-normal">bags</span>
                </p>
              </div>

              <div className="text-center mb-1">
                <div className="flex items-center justify-center mb-1">
                  <ShoppingCart className="h-4 w-4 text-green-600 dark:text-green-400 mr-1" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Sales
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatAmount(rcfSales || 0)}{" "}
                  <span className="text-sm font-normal">bags</span>
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <IndianRupee className="h-4 w-4 text-purple-600 dark:text-purple-400 mr-1" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Price
                  </span>
                </div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(rcfPrice || 0)}
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <TrendingUp className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mr-1" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Revenue
                  </span>
                </div>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {formatCurrency(rcfRevenue || 0)}
                </p>
              </div>
            </div>
            <div
              className={`flex items-center space-x-1.5 ${
                rcfStatus.color === "success"
                  ? "text-success-600 dark:text-success-400"
                  : rcfStatus.color === "warning"
                  ? "text-warning-600 dark:text-warning-400"
                  : "text-error-600 dark:text-error-400"
              }`}
            >
              <rcfStatus.icon className="h-4 w-4" />
              <span className="text-sm font-medium">{rcfStatus.status}</span>
            </div>
          </div>
          <div
            className={`p-3 rounded-lg ${
              rcfStatus.color === "success"
                ? "bg-success-100 dark:bg-success-900/50"
                : rcfStatus.color === "warning"
                ? "bg-warning-100 dark:bg-warning-900/50"
                : "bg-error-100 dark:bg-error-900/50"
            }`}
          >
            <Package
              className={`h-6 w-6 ${
                rcfStatus.color === "success"
                  ? "text-success-600 dark:text-success-400"
                  : rcfStatus.color === "warning"
                  ? "text-warning-600 dark:text-warning-400"
                  : "text-error-600 dark:text-error-400"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Boomi Samrudhi Product KPI */}
      <div className="card hover:shadow-md transition-all duration-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-400">
                Boomi Samrudhi Product Performance
              </p>
              <p className="text-[0.8rem] font-normal text-gray-500 dark:text-gray-500 -mt-0.5">
                {dateRangeText}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Factory className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-1" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Production
                  </span>
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatAmount(boomiProduction || 0)}{" "}
                  <span className="text-sm font-normal">bags</span>
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <ShoppingCart className="h-4 w-4 text-green-600 dark:text-green-400 mr-1" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Sales
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatAmount(boomiSales || 0)}{" "}
                  <span className="text-sm font-normal">bags</span>
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <IndianRupee className="h-4 w-4 text-purple-600 dark:text-purple-400 mr-1" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Price
                  </span>
                </div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(boomiPrice || 0)}
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <TrendingUp className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mr-1" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Revenue
                  </span>
                </div>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {formatCurrency(boomiRevenue || 0)}
                </p>
              </div>
            </div>
            <div
              className={`flex items-center space-x-1.5 ${
                boomiStatus.color === "success"
                  ? "text-success-600 dark:text-success-400"
                  : boomiStatus.color === "warning"
                  ? "text-warning-600 dark:text-warning-400"
                  : "text-error-600 dark:text-error-400"
              }`}
            >
              <boomiStatus.icon className="h-4 w-4" />
              <span className="text-sm font-medium">{boomiStatus.status}</span>
            </div>
          </div>
          <div
            className={`p-3 rounded-lg ${
              boomiStatus.color === "success"
                ? "bg-success-100 dark:bg-success-900/50"
                : boomiStatus.color === "warning"
                ? "bg-warning-100 dark:bg-warning-900/50"
                : "bg-error-100 dark:bg-error-900/50"
            }`}
          >
            <Package
              className={`h-6 w-6 ${
                boomiStatus.color === "success"
                  ? "text-success-600 dark:text-success-400"
                  : boomiStatus.color === "warning"
                  ? "text-warning-600 dark:text-warning-400"
                  : "text-error-600 dark:text-error-400"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default StockKPICards;
