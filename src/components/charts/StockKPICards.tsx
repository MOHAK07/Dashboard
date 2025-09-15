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

export function StockKPICards({ className = "" }: StockKPICardsProps) {
  const { state } = useApp();
  const { getFilteredData } = useGlobalFilterContext();

  const productionSalesKPIs = useMemo(() => {
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
      !boomiSalesColumn
    ) {
      console.warn("Production Sales KPI - Missing required columns");
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

  if (!productionSalesKPIs.hasData) {
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
  } = productionSalesKPIs;
  const rcfStatus = getPerformanceStatus(rcfProduction, rcfSales);
  const boomiStatus = getPerformanceStatus(boomiProduction, boomiSales);

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${className}`}>
      {/* RCF Product KPI */}
      <div className="card hover:shadow-md transition-all duration-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-400 mb-4">
              RCF Product Performance
            </p>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Factory className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-1" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Production
                  </span>
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatAmount(rcfProduction || 0)}
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
                  {formatAmount(rcfSales || 0)}
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
            <p className="text-sm font-medium text-gray-800 dark:text-gray-400 mb-4">
              Boomi Samrudhi Product Performance
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Factory className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-1" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Production
                  </span>
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatAmount(boomiProduction || 0)}
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
                  {formatAmount(boomiSales || 0)}
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
