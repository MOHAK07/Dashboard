import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { FlexibleDataRow } from "../../types";
import { DatasetSpecificKPIs } from "../charts/DatasetSpecificKPIs";
import { DatasetTimeSeriesChart } from "../charts/DatasetTimeSeriesChart";
import { WeeklyDataDistributionChart } from "../charts/WeeklyDataDistributionChart";
import { DynamicRevenueBreakdownChart } from "../charts/DynamicRevenueBreakdownChart";
import { MDAClaimChart } from "../charts/MDAClaimChart";
import { MDAClaimKPI } from "../charts/MDAClaimKPI";
import { StockAnalysisChart } from "../charts/StockAnalysisChart";
import { BuyerTypeAnalysisChart } from "../charts/BuyerTypeAnalysisChart";
import { StockKPICards } from "../charts/StockKPICards";
import { RevenueKPICards } from "../charts/RevenueKPICards";
import { B2BBuyerKPIs } from "../charts/B2BbuyerKPI";
import { useApp } from "../../contexts/AppContext";
import { DrillDownBreadcrumb } from "../DrillDownBreadcrumb";
import { ColorManager } from "../../utils/colorManager";

interface OverviewTabProps {
  data: FlexibleDataRow[];
}

export function OverviewTab({ data }: OverviewTabProps) {
  const { state } = useApp();
  const isDarkMode = state.settings.theme === "dark";
  const [chartsVisible, setChartsVisible] = useState(true);

  // Check if MDA claim data is available
  const hasMDAClaimData = state.datasets.some(
    (dataset) =>
      state.activeDatasetIds.includes(dataset.id) &&
      ColorManager.isMDAClaimDataset(dataset.name)
  );

  // Check if stock data is available
  const hasStockData = state.datasets.some(
    (dataset) =>
      state.activeDatasetIds.includes(dataset.id) &&
      ColorManager.isStockDataset(dataset.name)
  );

  // Check if revenue data is available
  const hasRevenueData = state.datasets.some(
    (dataset) =>
      state.activeDatasetIds.includes(dataset.id) &&
      (dataset.name.toLowerCase().includes("revenue") ||
        dataset.fileName.toLowerCase().includes("revenue"))
  );

  const hasFOMData = state.datasets.some(
    (dataset) =>
      state.activeDatasetIds.includes(dataset.id) &&
      (dataset.name.toLowerCase().includes("fom") ||
        dataset.fileName.toLowerCase().includes("fom") ||
        (dataset.detectedColumns?.includes("Buyer Type") &&
          dataset.detectedColumns?.includes("Price") &&
          dataset.detectedColumns?.includes("Name")))
  );

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-lg font-medium">
            No data available for the selected filters.
          </p>
          <p className="text-sm">Try adjusting your filter criteria.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <DrillDownBreadcrumb />

      {/* Pass the filtered 'data' prop to all child components */}
      <div id="kpi-cards-container" className="gap-3 grid grid-cols-1">
        {/* First Section Heading - Year-to-Date */}
        <div className="mb-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Annual Performance Summary
          </h2>
          <div className="h-1 w-24 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"></div>
        </div>

        <DatasetSpecificKPIs />

        {hasStockData && <StockKPICards />}

        <B2BBuyerKPIs />
        {hasMDAClaimData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <MDAClaimKPI />
          </div>
        )}

        {/* Second Section Heading - Monthly Revenue (Static) */}
        {hasRevenueData && (
          <>
            <div className="mt-6 mb-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Monthly Revenue Insights
              </h2>
              <div className="h-1 w-24 bg-gradient-to-r from-green-600 to-green-400 rounded-full"></div>
            </div>
            <RevenueKPICards />
          </>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setChartsVisible(!chartsVisible)}
          className="glass-button flex items-center space-x-3 px-5 py-2"
        >
          {chartsVisible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          <span>{chartsVisible ? "Hide Charts" : "Show Charts"}</span>
        </button>
      </div>

      {chartsVisible && (
        <>
          <div className="printable-chart-container grid grid-cols-1">
            <DatasetTimeSeriesChart />
          </div>

          {hasFOMData && (
            <div className="printable-chart-container">
              <BuyerTypeAnalysisChart />
            </div>
          )}

          {/* <div className="printable-chart-container">
            <WeeklyDataDistributionChart />
          </div> */}

          <div className="printable-chart-container">
            <DynamicRevenueBreakdownChart />
          </div>

          {hasStockData && (
            <div className="printable-chart-container">
              <StockAnalysisChart />
            </div>
          )}

          {hasMDAClaimData && (
            <div className="printable-chart-container">
              <MDAClaimChart />
            </div>
          )}
        </>
      )}
    </div>
  );
}
