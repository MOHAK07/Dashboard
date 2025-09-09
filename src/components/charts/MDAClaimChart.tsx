import React, { useState, useMemo } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { ChartContainer } from "./ChartContainer";
import { useApp } from "../../contexts/AppContext";
import { useGlobalFilterContext } from "../../contexts/GlobalFilterContext";
import { ColorManager } from "../../utils/colorManager";

interface MDAClaimChartProps {
  className?: string;
}

export function MDAClaimChart({ className = "" }: MDAClaimChartProps) {
  const { state } = useApp();
  const { filterState } = useGlobalFilterContext();
  const [chartType, setChartType] = useState<"line" | "area" | "bar">("line");
  const isDarkMode = state.settings.theme === "dark";

  const processMDAData = useMemo(() => {
    const mdaDatasets = state.datasets.filter(
      (dataset) =>
        state.activeDatasetIds.includes(dataset.id) &&
        ColorManager.isMDAClaimDataset(dataset.name)
    );

    if (mdaDatasets.length === 0) {
      return { categories: [], series: [], hasData: false };
    }

    let allMDAData = mdaDatasets.flatMap((dataset) => dataset.data);

    if (allMDAData.length === 0) {
      return { categories: [], series: [], hasData: false };
    }

    const sampleRow = allMDAData[0];
    const columns = Object.keys(sampleRow);
    const monthColumn = columns.find((col) => col.toLowerCase().includes("month"));
    const yearColumn = columns.find((col) => col.toLowerCase().includes("year"));
    const eligibleAmountColumn = columns.find((col) => col.toLowerCase().includes("eligible"));
    const amountReceivedColumn = columns.find((col) => col.toLowerCase().includes("received"));

    if (!monthColumn || !yearColumn || !eligibleAmountColumn || !amountReceivedColumn) {
      console.warn("MDA Chart: Missing required columns");
      return { categories: [], series: [], hasData: false };
    }

    const { startDate, endDate } = filterState.filters.dateRange;
    const { selectedMonths } = filterState.filters.months;
    const monthOrder = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    let filteredData = allMDAData;

    // 1. Apply Custom Date Range Filter (New Robust Logic)
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Use UTC methods to avoid timezone issues and create a numeric representation (YYYYMM)
      const startYearMonth = start.getUTCFullYear() * 100 + start.getUTCMonth(); 
      const endYearMonth = end.getUTCFullYear() * 100 + end.getUTCMonth();

      filteredData = filteredData.filter(row => {
        const year = parseInt(String(row[yearColumn]));
        const monthIndex = monthOrder.indexOf(String(row[monthColumn]));

        if (isNaN(year) || monthIndex === -1) {
          return false;
        }

        const rowYearMonth = year * 100 + monthIndex;
        
        return rowYearMonth >= startYearMonth && rowYearMonth <= endYearMonth;
      });
    }

    // 2. Apply Month Name Filter (on already date-filtered data)
    if (selectedMonths.length > 0) {
      filteredData = filteredData.filter(row => selectedMonths.includes(String(row[monthColumn])));
    }

    const monthAbbrevMap: { [key: string]: string } = {
        January: "Jan", February: "Feb", March: "Mar", April: "Apr", May: "May", June: "Jun",
        July: "Jul", August: "Aug", September: "Sep", October: "Oct", November: "Nov", December: "Dec",
    };

    const formatMonthYear = (year: any, month: any): string | null => {
        try {
            const yearNum = parseInt(String(year));
            const monthStr = String(month).trim();
            if (isNaN(yearNum) || !monthStr || monthStr === "-") return null;
            const monthAbbrev = monthAbbrevMap[monthStr] || monthStr.substring(0, 3);
            const yearAbbrev = yearNum.toString().slice(-2);
            return `${monthAbbrev}-${yearAbbrev}`;
        } catch {
            return null;
        }
    };

    const parseAmount = (value: any): number => {
        if (value === null || value === undefined || value === "-" || String(value).trim() === "") return 0;
        let cleaned = String(value).replace(/[",\s]/g, "");
        if (cleaned.endsWith(".00")) cleaned = cleaned.slice(0, -3);
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    };

    const monthlyData = new Map<string, { eligible: number; received: number }>();
    filteredData.forEach((row) => {
        const monthYear = formatMonthYear(row[yearColumn], row[monthColumn]);
        if (!monthYear) return;
        const eligible = parseAmount(row[eligibleAmountColumn]);
        const received = parseAmount(row[amountReceivedColumn]);
        if (eligible > 0 || received > 0) {
            const current = monthlyData.get(monthYear) || { eligible: 0, received: 0 };
            current.eligible += eligible;
            current.received += received;
            monthlyData.set(monthYear, current);
        }
    });
    
    if (monthlyData.size === 0) {
        return { categories: [], series: [], hasData: false };
    }

    const sortedMonths = Array.from(monthlyData.keys()).sort((a, b) => {
        const [monthA, yearA] = a.split('-');
        const [monthB, yearB] = b.split('-');
        const monthOrderSort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const fullYearA = parseInt(yearA) < 50 ? 2000 + parseInt(yearA) : 1900 + parseInt(yearA);
        const fullYearB = parseInt(yearB) < 50 ? 2000 + parseInt(yearB) : 1900 + parseInt(yearB);
        
        if (fullYearA !== fullYearB) return fullYearA - fullYearB;
        return monthOrderSort.indexOf(monthA) - monthOrderSort.indexOf(monthB);
    });

    const eligibleData = sortedMonths.map((month) => Math.round((monthlyData.get(month)!.eligible) * 100) / 100);
    const receivedData = sortedMonths.map((month) => Math.round((monthlyData.get(month)!.received) * 100) / 100);

    return {
        categories: sortedMonths,
        series: [
            { name: "Eligible Amount", data: eligibleData, color: "#3b82f6" },
            { name: "Amount Received", data: receivedData, color: "#22c55e" },
        ],
        hasData: sortedMonths.length > 0 && (eligibleData.some(v => v > 0) || receivedData.some(v => v > 0)),
    };
}, [state.datasets, state.activeDatasetIds, filterState]);


  if (!processMDAData.hasData) {
    return null;
  }

  const chartOptions: ApexOptions = {
    chart: {
      type: chartType,
      background: "transparent",
      toolbar: { show: false },
      animations: { enabled: true, speed: 800 },
    },
    stroke: {
      curve: "smooth",
      width: chartType === "line" ? 4 : chartType === "area" ? 3 : 0,
    },
    fill: {
      type: chartType === "area" ? "gradient" : "solid",
      colors: processMDAData.series.map((s) => s.color),
      gradient: chartType === "area" ? {
        shadeIntensity: 1, type: "vertical", opacityFrom: 0.8, opacityTo: 0.1, stops: [0, 100],
      } : undefined,
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: processMDAData.categories,
      labels: {
        style: { colors: isDarkMode ? "#9ca3af" : "#6b7280" },
        rotate: processMDAData.categories.length > 8 ? -45 : 0,
      },
      title: { text: "Months", style: { color: isDarkMode ? "#9ca3af" : "#6b7280" } },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => {
          if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
          if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
          if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
          return `₹${val}`;
        },
        style: { colors: isDarkMode ? "#9ca3af" : "#6b7280" },
      },
      title: { text: "Amount (₹)", style: { color: isDarkMode ? "#9ca3af" : "#6b7280" } },
    },
    colors: processMDAData.series.map((s) => s.color),
    theme: { mode: isDarkMode ? "dark" : "light" },
    grid: { borderColor: isDarkMode ? "#374151" : "#e5e7eb", padding: { top: 0, right: 10, bottom: 0, left: 10 } },
    tooltip: {
      theme: isDarkMode ? "dark" : "light",
      shared: true,
      intersect: false,
      y: {
        formatter: (val: number) => {
          if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Crores`;
          if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakhs`;
          if (val >= 1000) return `₹${(val / 1000).toFixed(2)} Thousands`;
          return `₹${val.toLocaleString()}`;
        },
      },
    },
    legend: {
      show: true, position: "top", labels: { colors: isDarkMode ? "#9ca3af" : "#6b7280" },
      markers: { width: 12, height: 12, radius: 6 },
    },
    markers: {
      size: chartType === "line" ? 6 : 0,
      colors: processMDAData.series.map((s) => s.color),
      strokeColors: "#ffffff",
      strokeWidth: 2,
      hover: { size: 8 },
    },
    plotOptions: { bar: { borderRadius: 4, columnWidth: "75%", dataLabels: { position: "top" } } },
    responsive: [{
      breakpoint: 768,
      options: {
        legend: { position: "bottom" },
        xaxis: { labels: { rotate: -90 } },
      },
    }],
  };

  return (
    <ChartContainer
      title="MDA Claim Analysis - Eligible vs Received Amount"
      availableTypes={["line", "area", "bar"]}
      currentType={chartType}
      onChartTypeChange={(type) => setChartType(type as "line" | "area" | "bar")}
      className={className}
    >
      <div className="w-full h-full min-h-[500px]">
        <Chart
          options={chartOptions}
          series={processMDAData.series}
          type={chartType}
          height="500px"
          width="100%"
        />
      </div>
    </ChartContainer>
  );
}