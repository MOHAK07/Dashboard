import React from 'react';
import { FlexibleDataRow } from '../../types';
import { KPICards } from '../charts/KPICards';
import { FlexibleChart } from '../charts/FlexibleChart';
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

      {/* KPI Cards */}
      <KPICards data={data} currency={state.settings.currency} />

      {/* Data Overview */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Dataset Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Detected Columns</h4>
            <div className="space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total: {Object.keys(data[0] || {}).length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Numeric: {numericColumns.length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Categorical: {categoricalColumns.length}
              </p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Key Columns</h4>
            <div className="space-y-1">
              {dateColumn && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Date: {dateColumn}
                </p>
              )}
              {numericColumns.slice(0, 3).map(col => (
                <p key={col} className="text-sm text-gray-600 dark:text-gray-400">
                  Numeric: {col}
                </p>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Data Quality</h4>
            <div className="space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Rows: {data.length.toLocaleString()}
              </p>
              <p className="text-sm text-success-600 dark:text-success-400">
                ✓ Data loaded successfully
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-8">
        {categoricalColumns.length > 0 && numericColumns.length > 0 && (
          <FlexibleChart
            data={data}
            title="Data Distribution"
            chartType="bar"
            isDarkMode={isDarkMode}
          />
        )}
      </div>
      
      {dateColumn && numericColumns.length > 0 && (
        <div className="grid grid-cols-1 gap-8">
          <FlexibleChart
            data={data}
            title="Trends Over Time"
            chartType="line"
            isDarkMode={isDarkMode}
          />
        </div>
      )}

      {categoricalColumns.length > 0 && numericColumns.length > 0 && (
        <div className="grid grid-cols-1 gap-8">
          <FlexibleChart
            data={data}
            title="Category Breakdown"
            chartType="donut"
            isDarkMode={isDarkMode}
          />
        </div>
      )}
    </div>
  );
}