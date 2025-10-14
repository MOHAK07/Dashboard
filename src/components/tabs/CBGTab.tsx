import React, { useMemo, useState, useEffect } from "react";
import {
  Factory,
  Users,
  Package2,
  IndianRupee,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Wallet,
  Gauge,
} from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import { useGlobalFilterContext } from "../../contexts/GlobalFilterContext";
import { ChartContainer } from "../charts/ChartContainer";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

// Helper functions
const getDaysInMonth = (month: string, year: number) => {
  const monthMap: { [key: string]: number } = {
    January: 0,
    February: 1,
    March: 2,
    April: 3,
    May: 4,
    June: 5,
    July: 6,
    August: 7,
    September: 8,
    October: 9,
    November: 10,
    December: 11,
  };
  return new Date(year, monthMap[month] + 1, 0).getDate();
};

const parseNumericValue = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const num = parseFloat(String(value).replace(/,/g, ""));
  return isNaN(num) ? 0 : num;
};

const formatNumber = (value: number): string => {
  return value
    .toFixed(2)
    .replace(/\B(?=(?:(\d{3})+(?!\d))+(?=\d{2}))/g, ",")
    .replace(/\B(?=(\d{2})+(?!\d)$)/g, ",");
};

const formatIndianNumber = (value: number): string => {
  const absValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (absValue >= 10000000) {
    return (
      sign +
      (absValue / 10000000).toLocaleString("en-IN", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
      }) +
      " Cr"
    );
  } else if (absValue >= 100000) {
    return (
      sign +
      (absValue / 100000).toLocaleString("en-IN", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
      }) +
      " L"
    );
  } else if (absValue >= 1000) {
    return (
      sign +
      (absValue / 1000).toLocaleString("en-IN", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
      }) +
      "K"
    );
  } else {
    return (
      sign +
      absValue.toLocaleString("en-IN", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
      })
    );
  }
};

// Helper function to get the starting month and year from data
const getStartingPeriod = (data: any[]) => {
  if (data.length === 0) return null;

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

  let earliestYear = Infinity;
  let earliestMonth = "";

  data.forEach((row) => {
    const year = Number(row["Year"]);
    const month = String(row["Month"]);

    if (!year || !month) return;

    if (year < earliestYear) {
      earliestYear = year;
      earliestMonth = month;
    } else if (year === earliestYear) {
      const currentMonthIndex = monthOrder.indexOf(month);
      const earliestMonthIndex = monthOrder.indexOf(earliestMonth);

      if (
        currentMonthIndex !== -1 &&
        (earliestMonthIndex === -1 || currentMonthIndex < earliestMonthIndex)
      ) {
        earliestMonth = month;
      }
    }
  });

  if (earliestYear === Infinity) return null;

  const shortYear = String(earliestYear).slice(-2);
  return `${earliestMonth}'${shortYear}`;
};

const formatIndianCommas = (value: number): string => {
  return Math.round(value).toLocaleString("en-IN");
};

// Dark mode hook
const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      const isDarkMode =
        document.documentElement.classList.contains("dark") ||
        (window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      setIsDark(isDarkMode);
    };

    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", checkDarkMode);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", checkDarkMode);
    };
  }, []);

  return isDark;
};

// Premium Executive Summary Cards
const ExecutiveSummaryCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = "blue",
  suffix = "",
  sparklineData = [],
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down";
  trendValue?: string;
  color?: "blue" | "green" | "purple" | "orange" | "indigo";
  suffix?: string;
  sparklineData?: number[];
}) => {
  const colorThemes = {
    blue: {
      gradient: "from-blue-600 via-blue-700 to-blue-800",
      light: "from-blue-50 to-blue-100",
      border: "border-blue-200 dark:border-blue-800",
      text: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    green: {
      gradient: "from-emerald-600 via-emerald-700 to-emerald-800",
      light: "from-emerald-50 to-emerald-100",
      border: "border-emerald-200 dark:border-emerald-800",
      text: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    purple: {
      gradient: "from-purple-600 via-purple-700 to-purple-800",
      light: "from-purple-50 to-purple-100",
      border: "border-purple-200 dark:border-purple-800",
      text: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-900/20",
    },
    orange: {
      gradient: "from-orange-600 via-orange-700 to-orange-800",
      light: "from-orange-50 to-orange-100",
      border: "border-orange-200 dark:border-orange-800",
      text: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-900/20",
    },
    indigo: {
      gradient: "from-indigo-600 via-indigo-700 to-indigo-800",
      light: "from-indigo-50 to-indigo-100",
      border: "border-indigo-200 dark:border-indigo-800",
      text: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-900/20",
    },
  };

  const theme = colorThemes[color];

  return (
    <div
      className={`group relative overflow-hidden rounded-xl bg-white dark:bg-gray-900 shadow-lg hover:shadow-xl transition-all duration-500 ${theme.border} border-2 backdrop-blur-sm`}
    >
      {/* Premium Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-transparent to-gray-900"></div>
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent rounded-full -translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-white/10 to-transparent rounded-full translate-x-12 translate-y-12"></div>
      </div>

      {/* Header with Icon */}
      <div
        className={`relative px-4 pt-4 pb-3 bg-gradient-to-br ${theme.light} dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2.5 rounded-xl bg-gradient-to-br ${theme.gradient} shadow-md`}
            >
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                {title}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative px-4 py-4">
        <div className="flex items-end justify-between">
          <div className="flex-1">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight">
              {typeof value === "number" ? formatIndianCommas(value) : value}
              <span className="text-lg font-medium text-gray-500 ml-2">
                {suffix}
              </span>
            </div>
            {subtitle && (
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {subtitle}
              </p>
            )}
          </div>

          {/* Mini Sparkline */}
          {sparklineData.length > 0 && (
            <div className="w-20 h-10 opacity-60">
              <svg width="100%" height="100%" className={`${theme.text}`}>
                <polyline
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  points={sparklineData
                    .map(
                      (point, index) =>
                        `${(index / (sparklineData.length - 1)) * 80},${
                          40 - (point / Math.max(...sparklineData)) * 32
                        }`
                    )
                    .join(" ")}
                />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ProductionAnalyticsDashboard = ({ data }: { data: any[] }) => {
  return (
    <div className="bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden backdrop-blur-sm">
      {/* Premium Blue Gradient Header */}
      <div className="relative px-6 py-4 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 dark:from-slate-900 dark:via-gray-800 dark:to-slate-900">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <Factory className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-1">
                Production Insights
              </h2>
              <p className="text-blue-200 text-sm font-medium">
                Monthly capacity utilization & performance metrics
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Clean, Professional Layout */}
      <div className="p-5">
        {/* Minimalist Month Cards - Horizontal Timeline Style */}
        <div className="space-y-4">
          {data.map((month, index) => {
            const efficiency =
              (month.actualProduction / month.productionCapacity) * 100;
            const revenuePerKg = month.revenue / month.actualProduction;

            return (
              <div
                key={index}
                className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Month Header Bar with Theme Colors */}
                <div className="px-5 py-3 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-8 rounded-full bg-blue-500"></div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {month.month}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {efficiency.toFixed(1)}% Efficiency
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metrics Grid - Clean & Professional */}
                <div className="px-5 py-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {/* Capacity Metric - Updated with Gauge icon and gradient yellow */}
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Gauge className="w-4 h-4 text-orange-500 mr-2" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Capacity
                        </span>
                      </div>
                      <div className="text-xl font-bold text-orange-500 bg-clip-text text-transparent">
                        {formatIndianNumber(month.productionCapacity)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Kg
                      </div>
                    </div>

                    {/* Sales Metric */}
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Package2 className="w-4 h-4 text-blue-500 mr-2" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Sales
                        </span>
                      </div>
                      <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {formatIndianNumber(month.actualProduction)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Kg
                      </div>
                    </div>

                    {/* Revenue Metric */}
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <IndianRupee className="w-4 h-4 text-emerald-500 mr-2" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Revenue
                        </span>
                      </div>
                      <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{formatIndianNumber(month.revenue)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Total
                      </div>
                    </div>

                    {/* Rate per Kg Metric */}
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <BarChart3 className="w-4 h-4 text-purple-500 mr-2" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                          Rate/Kg
                        </span>
                      </div>
                      <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                        ₹{formatIndianCommas(revenuePerKg)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Per Kg
                      </div>
                    </div>
                  </div>

                  {/* Consistent Theme Progress Indicator */}
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Production Capacity Utilisation
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {efficiency.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full transition-all duration-1000 bg-blue-500"
                        style={{ width: `${Math.min(efficiency, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const CustomerIntelligenceHub = ({ data }: { data: any[] }) => {
  const totalRevenue = data.reduce((acc, c) => acc + c.revenue, 0);

  return (
    <div className="bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden backdrop-blur-sm">
      <style jsx global>{`
        @media print {
          .customer-name-for-print {
            -webkit-line-clamp: unset !important;
            overflow: visible !important;
            white-space: normal !important;
            display: block !important;
          }
        }
      `}</style>
      {/* Premium Header */}
      <div className="relative px-6 py-4 bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-950 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M20 20c0 11.046-8.954 20-20 20v20h40V20H20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-1">
                Customer Hub
              </h2>
              <p className="text-emerald-200 text-sm font-medium">
                {data.length} active partnerships driving growth
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Enhanced Customer Cards with Gray Theme */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {data.map((customer, index) => {
            const marketShare = (customer.revenue / totalRevenue) * 100;
            const ratePerKg = customer.revenue / customer.sales;

            return (
              <div
                key={index}
                className="group relative p-6 bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800/80 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border-2 border-gray-200 dark:border-gray-600 hover:-translate-y-2 backdrop-blur-sm"
              >
                {/* Customer Header */}
                <div className="relative mb-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="customer-name-for-print text-lg font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-tight mb-3">
                        {customer.name}
                      </h4>
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {marketShare.toFixed(1)}% Revenue Share
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Metrics Section */}
                <div className="relative space-y-5">
                  {/* Revenue Showcase */}
                  <div className="text-center p-4 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 rounded-2xl border border-slate-200 dark:border-slate-800/50 shadow-sm">
                    <div className="flex items-center justify-center mb-2">
                      <Wallet className="w-5 h-5 text-slate-600 dark:text-slate-400 mr-2" />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                        Total Revenue
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      ₹{formatIndianNumber(customer.revenue)}
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Sales Volume Card */}
                    <div className="p-4 bg-white/70 dark:bg-gray-800/70 rounded-xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                      <div className="flex items-center mb-2">
                        <Package2 className="w-4 h-4 text-gray-600 dark:text-gray-400 mr-2" />
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                          Sales Volume
                        </span>
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatIndianNumber(customer.sales)}
                      </div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Kilograms
                      </div>
                    </div>

                    {/* Rate per Kg Card */}
                    <div className="p-4 bg-white/70 dark:bg-gray-800/70 rounded-xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                      <div className="flex items-center mb-2">
                        <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-500 mr-2" />
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                          Rate/Kg
                        </span>
                      </div>
                      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{formatIndianCommas(ratePerKg)}
                      </div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Per kilogram
                      </div>
                    </div>
                  </div>

                  {/* Market Share Display */}
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
                    <div className="flex items-center">
                      <Activity className="w-4 h-4 text-teal-600 dark:text-teal-500 mr-2" />
                      <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                        Revenue Contribution
                      </span>
                    </div>
                    <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
                      {marketShare.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export function CBGTab() {
  const { state } = useApp();
  const { getFilteredData } = useGlobalFilterContext();
  const isDarkMode = useDarkMode();

  const cbgData = useMemo(() => {
    const cbgDataset = state.datasets.find(
      (d) =>
        state.activeDatasetIds.includes(d.id) && d.name.toLowerCase() === "cbg"
    );
    return cbgDataset ? getFilteredData(cbgDataset.data) : [];
  }, [state.datasets, state.activeDatasetIds, getFilteredData]);

  const [chartType, setChartType] = useState<"bar" | "line" | "area">("bar");
  const [pieChartType, setPieChartType] = useState<"pie" | "donut">("donut");

  // Summary Cards Data with sparkline data and starting period
  const summaryData = useMemo(() => {
    if (cbgData.length === 0) {
      return {
        totalSales: 0,
        totalRevenue: 0,
        sparklineProduction: [],
        sparklineRevenue: [],
        startingPeriod: null,
      };
    }

    const totalSales = cbgData.reduce(
      (acc, row) => acc + parseNumericValue(row["Quantity"]),
      0
    );
    const totalRevenue = cbgData.reduce(
      (acc, row) => acc + parseNumericValue(row["Total Invoice value"]),
      0
    );

    // Generate mock sparkline data
    const sparklineProduction = [65, 78, 66, 44, 56, 67, 75];
    const sparklineRevenue = [45, 52, 38, 24, 33, 26, 21];

    // Get starting period
    const startingPeriod = getStartingPeriod(cbgData);

    return {
      totalSales,
      totalRevenue,
      sparklineProduction,
      sparklineRevenue,
      startingPeriod,
    };
  }, [cbgData]);

  // Monthly Distribution Data
  const monthlyDistribution = useMemo(() => {
    if (cbgData.length === 0) return [];

    const monthlyMap = new Map<
      string,
      {
        productionCapacity: number;
        actualProduction: number;
        revenue: number;
      }
    >();

    cbgData.forEach((row) => {
      const month = String(row["Month"]);
      const year = Number(row["Year"]);
      if (!month || !year || !getDaysInMonth(month, year)) return;

      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, {
          productionCapacity: 10.2 * 1000 * getDaysInMonth(month, year),
          actualProduction: 0,
          revenue: 0,
        });
      }

      const monthData = monthlyMap.get(month)!;
      monthData.actualProduction += parseNumericValue(row["Quantity"]);
      monthData.revenue += parseNumericValue(row["Total Invoice value"]);
    });

    return Array.from(monthlyMap.entries()).map(
      ([month, { productionCapacity, actualProduction, revenue }]) => ({
        month,
        productionCapacity,
        actualProduction,
        sales: actualProduction,
        revenue,
      })
    );
  }, [cbgData]);

  // Customer Comparison Data
  const customerComparison = useMemo(() => {
    if (cbgData.length === 0) return [];
    const customerMap = new Map<string, { sales: number; revenue: number }>();

    cbgData.forEach((row) => {
      const customerName = row["Ship to party name"] as string;
      if (!customerName) return;

      if (!customerMap.has(customerName)) {
        customerMap.set(customerName, { sales: 0, revenue: 0 });
      }

      const customerData = customerMap.get(customerName)!;
      customerData.sales += parseNumericValue(row["Quantity"]);
      customerData.revenue += parseNumericValue(row["Total Invoice value"]);
    });

    return Array.from(customerMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [cbgData]);

  // Enhanced Chart Options
  const comparisonChartOptions: ApexOptions = {
    chart: {
      type: chartType,
      height: 500,
      toolbar: { show: false },
      background: "transparent",
      fontFamily: "Inter, sans-serif",
      animations: {
        enabled: true,
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150,
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350,
        },
      },
    },
    colors: ["#3B82F6", "#10B981"],
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: monthlyDistribution.map((d) => d.month),
      labels: {
        style: {
          colors: isDarkMode ? "#9CA3AF" : "#6B7280",
          fontSize: "11px",
          fontWeight: 500,
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      title: {
        text: "Production (Kg)",
        style: {
          color: isDarkMode ? "#9CA3AF" : "#6B7280",
          fontSize: "11px",
          fontWeight: 600,
        },
      },
      labels: {
        style: {
          colors: isDarkMode ? "#9CA3AF" : "#6B7280",
          fontSize: "11px",
        },
        formatter: function (value) {
          return formatIndianCommas(value);
        },
      },
    },
    grid: {
      borderColor: isDarkMode ? "#374151" : "#E5E7EB",
      strokeDashArray: 3,
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    stroke: {
      curve: "smooth",
      width: chartType === "line" || chartType === "area" ? 3 : 0,
    },
    fill: {
      type: chartType === "area" ? "gradient" : "solid",
      gradient: {
        shade: "light",
        type: "vertical",
        shadeIntensity: 0.3,
        gradientToColors: ["#93C5FD", "#86EFAC"],
        inverseColors: false,
        opacityFrom: 0.8,
        opacityTo: 0.1,
        stops: [0, 100],
      },
      opacity: chartType === "area" ? 0.8 : 0.9,
    },
    tooltip: {
      theme: isDarkMode ? "dark" : "light",
      shared: true,
      intersect: false,
      y: {
        formatter: function (value) {
          return formatIndianCommas(value) + " Kg";
        },
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
      labels: {
        colors: isDarkMode ? "#9CA3AF" : "#6B7280",
      },
      markers: {
        radius: 4,
      },
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        columnWidth: "60%",
        dataLabels: {
          position: "top",
        },
      },
    },
  };

  const comparisonChartSeries = [
    {
      name: "Sales in Kg",
      data: monthlyDistribution.map((d) =>
        parseFloat(formatNumber(d.actualProduction))
      ),
    },
    {
      name: "Production Capacity",
      data: monthlyDistribution.map((d) =>
        parseFloat(formatNumber(d.productionCapacity))
      ),
    },
  ];

  const pieChartOptions: ApexOptions = {
    chart: {
      type: pieChartType,
      height: 400,
      background: "transparent",
      fontFamily: "Inter, sans-serif",
    },
    labels: customerComparison.map((c) => c.name),
    colors: [
      "#3B82F6",
      "#10B981",
      "#F59E0B",
      "#EF4444",
      "#8B5CF6",
      "#EC4899",
      "#06B6D4",
      "#84CC16",
    ],
    dataLabels: {
      enabled: true,
      formatter: function (val, opts) {
        return parseFloat(val).toFixed(1) + "%";
      },
      style: {
        fontSize: "12px",
        fontWeight: 600,
        colors: pieChartType === "pie" ? ["#ffffff"] : ["#ffffff"],
      },
      dropShadow: {
        enabled: false,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: pieChartType === "donut" ? "70%" : "0%",
          labels: {
            show: pieChartType === "donut",
            total: {
              show: true,
              label: "Total Revenue",
              fontSize: "14px",
              fontWeight: 600,
              color: isDarkMode ? "#9CA3AF" : "#6B7280",
              formatter: function () {
                const total = customerComparison.reduce(
                  (acc, c) => acc + c.revenue,
                  0
                );
                return "₹" + formatIndianNumber(total);
              },
            },
            value: {
              show: true,
              fontSize: "24px",
              fontWeight: 700,
              color: isDarkMode ? "#FFFFFF" : "#111827",
              formatter: function (val) {
                return "₹" + formatIndianNumber(parseFloat(val));
              },
            },
          },
        },
      },
    },
    legend: {
      position: "bottom",
      horizontalAlign: "center",
      labels: {
        colors: isDarkMode ? "#9CA3AF" : "#6B7280",
        useSeriesColors: false,
      },
      markers: {
        radius: 4,
      },
      itemMargin: {
        horizontal: 8,
        vertical: 4,
      },
    },
    tooltip: {
      theme: isDarkMode ? "dark" : "light",
      y: {
        formatter: function (value, { seriesIndex, dataPointIndex, w }) {
          const customerRevenue =
            customerComparison[seriesIndex]?.revenue || value;
          return "₹" + formatIndianCommas(customerRevenue);
        },
      },
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: {
            height: 350,
          },
          legend: {
            position: "bottom",
          },
        },
      },
    ],
  };

  const pieChartSeries = customerComparison.map((c) => c.revenue);

  return (
    <div className="space-y-4 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 min-h-screen">
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }
      `}</style>

      {/* Executive Summary Cards */}
      <div
        id="kpi-cards-container"
        className="grid grid-cols-1 lg:grid-cols-2 gap-5"
      >
        <ExecutiveSummaryCard
          title="Production Volume"
          value={summaryData.totalSales}
          subtitle={`Total CBG production across all facilities${
            summaryData.startingPeriod
              ? ` (from ${summaryData.startingPeriod})`
              : ""
          }`}
          icon={Package2}
          color="blue"
          suffix="Kg"
          trend="up"
          trendValue="+12.4%"
          sparklineData={summaryData.sparklineProduction}
        />
        <ExecutiveSummaryCard
          title="Revenue Generated"
          value={`₹${formatIndianNumber(summaryData.totalRevenue)}`}
          subtitle={`Total earnings from CBG sales${
            summaryData.startingPeriod
              ? ` (from ${summaryData.startingPeriod})`
              : ""
          }`}
          icon={IndianRupee}
          color="green"
          trend="up"
          trendValue="+18.7%"
          sparklineData={summaryData.sparklineRevenue}
        />
      </div>

      {/* Production Analytics Dashboard */}
      <div className="printable-chart-container">
        <ProductionAnalyticsDashboard data={monthlyDistribution} />
      </div>

      {/* Customer Intelligence Hub */}
      <div className="printable-chart-container">
        <CustomerIntelligenceHub data={customerComparison} />
      </div>

      {/* Advanced Analytics Charts - Full Width */}
      <div className="space-y-5">
        {/* Production vs Capacity Chart */}
        <div className="printable-chart-container w-full bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden backdrop-blur-sm">
          <ChartContainer
            title="Production vs Sales Comparison"
            availableTypes={["bar", "line", "area"]}
            currentType={chartType}
            onChartTypeChange={(type) =>
              setChartType(type as "bar" | "line" | "area")
            }
          >
            <Chart
              options={comparisonChartOptions}
              series={comparisonChartSeries}
              type={chartType}
              height={500}
            />
          </ChartContainer>
        </div>

        {/* Revenue Distribution Chart */}
        <div className="printable-chart-container w-full bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden backdrop-blur-sm">
          <ChartContainer
            title="Customer Revenue Contribution Analysis"
            availableTypes={["pie", "donut"]}
            currentType={pieChartType}
            onChartTypeChange={(type) =>
              setPieChartType(type as "pie" | "donut")
            }
          >
            <Chart
              key={`${pieChartType}-${isDarkMode}`}
              options={pieChartOptions}
              series={pieChartSeries}
              type={pieChartType}
              height={400}
            />
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}
