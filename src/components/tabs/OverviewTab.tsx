import React from 'react';
import { FlexibleDataRow } from '../../types';
import { DatasetSpecificKPIs } from '../charts/DatasetSpecificKPIs';
import { DatasetTimeSeriesChart } from '../charts/DatasetTimeSeriesChart';
import { WeeklyDataDistributionChart } from '../charts/WeeklyDataDistributionChart';
import { DynamicRevenueBreakdownChart } from '../charts/DynamicRevenueBreakdownChart';
import { useApp } from '../../contexts/AppContext';
import { DrillDownBreadcrumb } from '../DrillDownBreadcrumb';
import { DataProcessor } from '../../utils/dataProcessing';

interface OverviewTabProps {
  data: FlexibleDataRow[];
}

export function OverviewTab({ data }: OverviewTabProps) {
  const { state } = useApp();
  const isDarkMode = state.settings.theme === 'dark';

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-lg font-medium">No data available</p>
          <p className="text-sm">Upload data to view the dashboard overview</p>
        </div>
      </div>
    );
  }

  const numericColumns = DataProcessor.findNumericColumns(data);
  const categoricalColumns = DataProcessor.findCategoricalColumns(data);
  const dateColumn = DataProcessor.findDateColumn(data);

  return (
    <div className="space-y-8">
      {/* Drill-down Breadcrumb */}
      <DrillDownBreadcrumb />

      {/* Dataset-Specific KPI Cards */}
      <DatasetSpecificKPIs />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-8">
        <WeeklyDataDistributionChart />
      </div>

      {/* Quality Trends by Month - Repositioned */}
      <DatasetTimeSeriesChart />

      {/* Dynamic Revenue Breakdown */}
      <DynamicRevenueBreakdownChart />
    </div>
  );
}