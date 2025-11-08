import React, { useMemo, useState } from 'react';
import { IndianRupee, Package, PieChart as PieChartIcon, Users, TrendingUp, BarChart, ChevronDown } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useGlobalFilterContext } from '../../contexts/GlobalFilterContext';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

// Helper functions (assuming they are correct from the existing file)
const parseNumericValue = (value: any): number => {
    if (value === null || value === undefined) return 0;
    const num = parseFloat(String(value).replace(/,/g, ''));
    return isNaN(num) ? 0 : num;
};

const formatIndianNumber = (value: number): string => {
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';
    if (isNaN(absValue)) return '₹0';

    if (absValue >= 10000000) {
        return `${sign}${(absValue / 10000000).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 })} Cr`;
    } else if (absValue >= 100000) {
        return `${sign}${(absValue / 100000).toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 })} L`;
    }
    return `${sign}${absValue.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 })}`;
};

const convertKgToMT = (kg: number): number => kg / 1000;

// Reusable components for the new UI
const StatCard = ({ icon, title, value, subValue, colorClass, trend }) => (
    <div className="relative p-6 bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
        <div className={`absolute top-4 right-4 text-white text-2xl p-3 rounded-full ${colorClass}`}>
            {icon}
        </div>
        <div className="flex flex-col h-full justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">{value}</p>
                {subValue && <p className="text-sm text-gray-500 dark:text-gray-400">{subValue}</p>}
            </div>
            {trend && (
                <div className="flex items-center text-sm text-green-500 mt-4">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span>{trend}</span>
                </div>
            )}
        </div>
    </div>
);

const CustomerRow = ({ rank, name, revenue, sales, cbgContribution }) => {
    const rankColors = [
        'bg-yellow-400 dark:bg-yellow-500',
        'bg-gray-300 dark:bg-gray-400',
        'bg-yellow-600 dark:bg-yellow-700'
    ];
    return (
        <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg transition-transform hover:scale-[1.02]">
            <div className={`flex-shrink-0 h-10 w-10 rounded-full ${rankColors[rank - 1]} flex items-center justify-center font-bold text-white`}>
                #{rank}
            </div>
            <div className="ml-4 flex-grow">
                <p className="text-md font-bold text-gray-800 dark:text-white">{name}</p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-1">
                    <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${cbgContribution}%` }}></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{cbgContribution.toFixed(1)}% of CBG Revenue</p>
            </div>
            <div className="text-right ml-4">
                <p className="text-lg font-bold text-green-500">₹{formatIndianNumber(revenue)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{formatIndianNumber(convertKgToMT(sales))} MT</p>
            </div>
        </div>
    );
};


export function DashboardOverviewTab() {
  const { state } = useApp();
  const { getFilteredData } = useGlobalFilterContext();
  const [pieChartType, setPieChartType] = useState<'pie' | 'donut'>('donut');
  const isDarkMode = state.settings.theme === 'dark' || (state.settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Data processing logic (copied and assumed correct)
  const cbgData = useMemo(() => {
    const cbgDataset = state.datasets.find(
      (d) =>
        state.activeDatasetIds.includes(d.id) && d.name.toLowerCase() === 'cbg'
    );
    return cbgDataset ? getFilteredData(cbgDataset.data) : [];
  }, [state.datasets, state.activeDatasetIds, getFilteredData]);

  const { cbgSales, cbgRevenue, topCustomers } = useMemo(() => {
    if (cbgData.length === 0) {
        return { cbgSales: 0, cbgRevenue: 0, topCustomers: [] };
    }
    const sales = cbgData.reduce((acc, row) => acc + parseNumericValue(row['Quantity']), 0);
    const revenue = cbgData.reduce((acc, row) => acc + parseNumericValue(row['Basic Value']) + parseNumericValue(row['Compression filling Amount']), 0);
    const customerMap = new Map<string, { sales: number; revenue: number }>();
    cbgData.forEach((row) => {
        const customerName = row['Ship to party name'] as string;
        if (!customerName) return;
        if (!customerMap.has(customerName)) {
            customerMap.set(customerName, { sales: 0, revenue: 0 });
        }
        const customerData = customerMap.get(customerName)!;
        customerData.sales += parseNumericValue(row['Quantity']);
        customerData.revenue += (parseNumericValue(row['Basic Value']) || 0) + (parseNumericValue(row['Compression filling Amount']) || 0);
    });
    const customers = Array.from(customerMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 3);
    return { cbgSales: sales, cbgRevenue: revenue, topCustomers: customers };
  }, [cbgData]);

  const { fomSales, fomRevenue, lfomSales, lfomRevenue } = useMemo(() => {
    const fomDataset = state.datasets.find((d) => state.activeDatasetIds.includes(d.id) && d.name.toLowerCase().includes('fom') && !d.name.toLowerCase().includes('lfom'));
    const lfomDataset = state.datasets.find((d) => state.activeDatasetIds.includes(d.id) && d.name.toLowerCase().includes('lfom'));
    const calculate = (dataset) => {
      if (!dataset) return { sales: 0, revenue: 0 };
      const filteredData = getFilteredData(dataset.data || []);
      const quantityColumn = Object.keys(dataset.data[0] || {}).find(c => c.toLowerCase().trim() === 'quantity');
      const priceColumn = Object.keys(dataset.data[0] || {}).find(c => c.toLowerCase().trim() === 'price');
      let totalQuantity = quantityColumn ? filteredData.reduce((sum, row) => sum + (parseFloat(String(row[quantityColumn] || '0').replace(/,/g, '')) || 0), 0) : 0;
      let totalRevenue = priceColumn ? filteredData.reduce((sum, row) => sum + (parseFloat(String(row[priceColumn] || '0').replace(/,/g, '')) || 0), 0) : 0;
      if (priceColumn) totalRevenue = (totalRevenue * 100) / 105;
      return { sales: totalQuantity, revenue: totalRevenue };
    };
    const fomMetrics = calculate(fomDataset);
    const lfomMetrics = calculate(lfomDataset);
    return { fomSales: fomMetrics.sales, fomRevenue: fomMetrics.revenue, lfomSales: lfomMetrics.sales, lfomRevenue: lfomMetrics.revenue };
  }, [state.datasets, state.activeDatasetIds, getFilteredData]);

  const fertilizerSales = fomSales + lfomSales;
  const fertilizerRevenue = fomRevenue + lfomRevenue;
  const combinedSales = cbgSales + fertilizerSales;
  const combinedRevenue = cbgRevenue + fertilizerRevenue;

  // Chart options
  const pieChartOptions: ApexOptions = {
    chart: { type: pieChartType, height: 350, background: 'transparent', fontFamily: 'Inter, sans-serif' },
    labels: ['CBG', 'Fertilizer (FOM & LFOM)'],
    colors: ['#3B82F6', '#10B981'],
    theme: { mode: isDarkMode ? 'dark' : 'light' },
    dataLabels: { enabled: true, formatter: (val) => `${parseFloat(val).toFixed(1)}%` },
    plotOptions: {
      pie: {
        donut: {
          size: pieChartType === 'donut' ? '70%' : '0%',
          labels: {
            show: pieChartType === 'donut',
            total: {
              show: true,
              label: 'Total Revenue',
              formatter: () => `₹${formatIndianNumber(combinedRevenue)}`,
              color: isDarkMode ? '#FFFFFF' : '#374151'
            },
            value: {
                color: isDarkMode ? '#FFFFFF' : '#374151'
            }
          },
        },
      },
    },
    legend: { position: 'bottom', labels: { colors: isDarkMode ? '#9CA3AF' : '#6B7280' } },
    tooltip: { theme: isDarkMode ? 'dark' : 'light', y: { formatter: (value) => `₹${formatIndianNumber(value)}` } }
  };
  const pieChartSeries = [cbgRevenue, fertilizerRevenue];

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white tracking-tight">Leafiniti Sales Dashboard</h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mt-1">CBG & Fertilizer Analytics Overview</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Combined Revenue */}
            <StatCard
                icon={<IndianRupee size={24}/>}
                title="Combined Revenue"
                value={`₹${formatIndianNumber(combinedRevenue)}`}
                colorClass="bg-gradient-to-tr from-green-500 to-green-400"
            />
            {/* Combined Sales */}
            <StatCard
                icon={<Package size={24}/>}
                title="Combined Sales"
                value={`${formatIndianNumber(convertKgToMT(combinedSales))} MT`}
                colorClass="bg-gradient-to-tr from-blue-500 to-blue-400"
            />

            {/* CBG Performance */}
            <div className="md:col-span-1 bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">CBG Performance</h2>
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <p className="text-gray-500 dark:text-gray-400">Revenue</p>
                        <p className="text-lg font-bold text-gray-800 dark:text-white">₹{formatIndianNumber(cbgRevenue)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="text-gray-500 dark:text-gray-400">Sales</p>
                        <p className="text-lg font-bold text-gray-800 dark:text-white">{formatIndianNumber(convertKgToMT(cbgSales))} MT</p>
                    </div>
                </div>
            </div>

            {/* Fertilizer Performance */}
            <div className="md:col-span-1 bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Fertilizer Performance</h2>
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <p className="text-gray-500 dark:text-gray-400">Revenue (FOM & LFOM)</p>
                        <p className="text-lg font-bold text-gray-800 dark:text-white">₹{formatIndianNumber(fertilizerRevenue)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="text-gray-500 dark:text-gray-400">Sales (FOM & LFOM)</p>
                        <p className="text-lg font-bold text-gray-800 dark:text-white">{formatIndianNumber(convertKgToMT(fertilizerSales))} MT</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column (Pie Chart) */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">Revenue Breakdown</h2>
                <div className="flex p-1 bg-gray-200 dark:bg-gray-700 rounded-lg">
                    <button onClick={() => setPieChartType('pie')} className={`px-3 py-1 text-sm rounded-md transition-colors ${pieChartType === 'pie' ? 'bg-white dark:bg-gray-900 text-blue-500 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Pie</button>
                    <button onClick={() => setPieChartType('donut')} className={`px-3 py-1 text-sm rounded-md transition-colors ${pieChartType === 'donut' ? 'bg-white dark:bg-gray-900 text-blue-500 shadow' : 'text-gray-600 dark:text-gray-300'}`}>Donut</button>
                </div>
            </div>
            <Chart options={pieChartOptions} series={pieChartSeries} type={pieChartType} height={350} />
        </div>

        {/* Bottom Row (Top Customers) */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Top 3 Customers by CBG Revenue</h2>
            <div className="space-y-4">
                {topCustomers.map((customer, index) => (
                    <CustomerRow
                        key={index}
                        rank={index + 1}
                        name={customer.name}
                        revenue={customer.revenue}
                        sales={customer.sales}
                        cbgContribution={(customer.revenue / cbgRevenue) * 100}
                    />
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}
