import React from "react";
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
import { useApp } from "../../contexts/AppContext";
import { DrillDownBreadcrumb } from "../DrillDownBreadcrumb";
import { ColorManager } from "../../utils/colorManager";

interface OverviewTabProps {
  data: FlexibleDataRow[];
}

export function OverviewTab({ data }: OverviewTabProps) {
  const { state } = useApp();
  const isDarkMode = state.settings.theme === "dark";

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
      (dataset.name.toLowerCase().includes('revenue') || 
       dataset.fileName.toLowerCase().includes('revenue'))
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
          <p className="text-lg font-medium">No data available for the selected filters.</p>
          <p className="text-sm">Try adjusting your filter criteria.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DrillDownBreadcrumb />

      {/* Pass the filtered 'data' prop to all child components */}
      <DatasetSpecificKPIs data={data} />
      {hasRevenueData && <RevenueKPICards data={data} />}
      {hasStockData && <StockKPICards data={data} />}
      {hasMDAClaimData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <MDAClaimKPI data={data} />
        </div>
      )}

      <div className="grid grid-cols-1">
        <WeeklyDataDistributionChart data={data} />
      </div>

      {hasFOMData && <BuyerTypeAnalysisChart data={data} />}
      <DatasetTimeSeriesChart data={data} />
      <DynamicRevenueBreakdownChart data={data} />
      {hasStockData && <StockAnalysisChart data={data} />}
      {hasMDAClaimData && <MDAClaimChart data={data} />}
    </div>
  );
}