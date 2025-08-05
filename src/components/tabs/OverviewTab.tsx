import React from 'react';
import { DataRow } from '../../types';
import { KPICards } from '../charts/KPICards';
import { FactoryPerformanceChart } from '../charts/FactoryPerformanceChart';
import { SalesDistributionChart } from '../charts/SalesDistributionChart';
import { SalesTrendsChart } from '../charts/SalesTrendsChart';
import { GeographicalMap } from '../charts/GeographicalMap';
import { useApp } from '../../contexts/AppContext';
import { DrillDownBreadcrumb } from '../DrillDownBreadcrumb';

interface OverviewTabProps {
  data: DataRow[];
}

export function OverviewTab({ data }: OverviewTabProps) {
  const { state } = useApp();
  const isDarkMode = state.settings.theme === 'dark';

  return (
    <div className="space-y-8">
      {/* Drill-down Breadcrumb */}
      <DrillDownBreadcrumb />

      {/* KPI Cards */}
      <KPICards data={data} currency={state.settings.currency} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-8">
        <FactoryPerformanceChart data={data} isDarkMode={isDarkMode} />
      </div>
      
      <div className="grid grid-cols-1 gap-8">
        <SalesDistributionChart data={data} isDarkMode={isDarkMode} />
      </div>

      <div className="grid grid-cols-1 gap-8">
        <SalesTrendsChart data={data} isDarkMode={isDarkMode} />
      </div>

      <div className="grid grid-cols-1 gap-8">
        <GeographicalMap data={data} />
      </div>
    </div>
  );
}