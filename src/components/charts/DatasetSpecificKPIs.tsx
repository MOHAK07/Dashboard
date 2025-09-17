import React, { useMemo } from "react";
import { TrendingUp, Database, BarChart3, Package } from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import { useGlobalFilterContext } from "../../contexts/GlobalFilterContext";
import { DataProcessor } from "../../utils/dataProcessing";

// Use the same color function for consistency
const getDatasetColorByName = (datasetName: string) => {
  const lowerName = datasetName.toLowerCase();

  // Fixed color mapping based on dataset type
  if (
    lowerName.includes("pos") &&
    lowerName.includes("fom") &&
    !lowerName.includes("lfom")
  ) {
    return "#3b82f6"; // Blue for POS FOM
  } else if (lowerName.includes("pos") && lowerName.includes("lfom")) {
    return "#22c55e"; // Green for POS LFOM
  } else if (lowerName.includes("lfom") && !lowerName.includes("pos")) {
    return "#f59e0b"; // Amber for LFOM (different from POS LFOM)
  } else if (
    lowerName.includes("fom") &&
    !lowerName.includes("pos") &&
    !lowerName.includes("lfom")
  ) {
    return "#ba0f0f"; // Dark red for FOM
  }

  // Fallback colors for other datasets
  const baseColors = [
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#f59e0b",
    "#dc2626",
    "#84cc16",
    "#059669",
  ];

  return baseColors[Math.abs(datasetName.length) % baseColors.length];
};

interface DatasetSpecificKPIsProps {
  className?: string;
}

export function DatasetSpecificKPIs({
  className = "",
}: DatasetSpecificKPIsProps) {
  const { state } = useApp();
  const { getFilteredData, filterState } = useGlobalFilterContext();

  const monthDisplayText = useMemo(() => {
    const { selectedMonths } = filterState.filters.months;
    const { startDate } = filterState.filters.dateRange;
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
      // Assuming the year is relevant to the selection context, might need a dynamic year here
      return `for ${sortedMonths[0]}`;
    }

    // Priority 2: Use start date from global date range filter
    if (startDate) {
      try {
        const date = new Date(startDate + "T00:00:00"); // Ensure correct parsing
        const monthName = monthOrder[date.getUTCMonth()];
        const year = date.getFullYear().toString().slice(-2);
        return `from ${monthName}'${year}`;
      } catch (e) {
        // Fallback if date is invalid
      }
    }

    // Priority 3: Derive from FOM/LFOM data
    const fomLfomData = state.datasets
      .filter(
        (d) =>
          state.activeDatasetIds.includes(d.id) &&
          (d.name.toLowerCase().includes("fom") ||
            d.name.toLowerCase().includes("lfom")) &&
          !d.name.toLowerCase().includes("pos")
      )
      .flatMap((d) => d.data);

    if (fomLfomData.length > 0) {
      const firstRow = fomLfomData[0];
      const yearColumn = Object.keys(firstRow).find(
        (c) => c.toLowerCase() === "year"
      );
      const monthColumn = Object.keys(firstRow).find(
        (c) => c.toLowerCase() === "month"
      );

      if (monthColumn && yearColumn) {
        // Find the latest year in the dataset
        let latestYear = 0;
        for (const row of fomLfomData) {
          const year = parseInt(String(row[yearColumn]), 10);
          if (!isNaN(year) && year > latestYear) {
            latestYear = year;
          }
        }

        if (latestYear > 0) {
          // Filter for data only from that latest year and get the months
          const monthsInLatestYear = fomLfomData
            .filter((row) => String(row[yearColumn]) === String(latestYear))
            .map((row) => String(row[monthColumn]))
            .filter(Boolean);

          if (monthsInLatestYear.length > 0) {
            // Find the earliest month within that year
            const uniqueMonths = [...new Set(monthsInLatestYear)];
            uniqueMonths.sort(
              (a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b)
            );
            return `from ${uniqueMonths[0]}'${String(latestYear).slice(-2)}`;
          }
        }
      }
    }

    // Final fallback
    return "for selected period";
  }, [
    filterState.filters.months,
    filterState.filters.dateRange,
    state.datasets,
    state.activeDatasetIds,
  ]);

  const { fomKpi, lfomKpi } = useMemo(() => {
    const fomDataset = state.datasets.find(
      (d) =>
        d.name.toLowerCase().includes("fom") &&
        !d.name.toLowerCase().includes("pos")
    );
    const lfomDataset = state.datasets.find(
      (d) =>
        d.name.toLowerCase().includes("lfom") &&
        !d.name.toLowerCase().includes("pos")
    );

    const calculate = (dataset) => {
      if (!dataset) return null;
      const filteredData = getFilteredData(dataset.data);
      const quantityColumn = Object.keys(dataset.data[0] || {}).find(
        (c) => c.toLowerCase().trim() === "quantity"
      );
      const priceColumn = Object.keys(dataset.data[0] || {}).find(
        (c) => c.toLowerCase().trim() === "price"
      );

      let totalQuantity = 0;
      if (quantityColumn) {
        totalQuantity = filteredData.reduce(
          (sum, row) =>
            sum + (parseFloat(String(row[quantityColumn] || "0")) || 0),
          0
        );
      }

      let totalRevenue = 0;
      if (priceColumn) {
        totalRevenue = filteredData.reduce(
          (sum, row) =>
            sum + (parseFloat(String(row[priceColumn] || "0")) || 0),
          0
        );
      }

      return {
        id: dataset.id,
        name: dataset.name,
        totalQuantity,
        totalRevenue,
        rowCount: filteredData.length,
        isActive: state.activeDatasetIds.includes(dataset.id),
        color: getDatasetColorByName(dataset.name),
        hasQuantityData: !!quantityColumn,
        hasRevenueData: !!priceColumn,
      };
    };

    return { fomKpi: calculate(fomDataset), lfomKpi: calculate(lfomDataset) };
  }, [state.datasets, state.activeDatasetIds, getFilteredData]);

  const kpiCards = [
    {
      title: `FOM Sales ${monthDisplayText}`,
      kpi: fomKpi,
      value: fomKpi?.totalQuantity,
      hasData: fomKpi?.hasQuantityData,
      type: "quantity",
    },
    {
      title: `LFOM Sales ${monthDisplayText}`,
      kpi: lfomKpi,
      value: lfomKpi?.totalQuantity,
      hasData: lfomKpi?.hasQuantityData,
      type: "quantity",
    },
    {
      title: `FOM Revenue ${monthDisplayText}`,
      kpi: fomKpi,
      value: fomKpi?.totalRevenue,
      hasData: fomKpi?.hasRevenueData,
      type: "revenue",
    },
    {
      title: `LFOM Revenue ${monthDisplayText}`,
      kpi: lfomKpi,
      value: lfomKpi?.totalRevenue,
      hasData: lfomKpi?.hasRevenueData,
      type: "revenue",
    },
  ];

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 ${className}`}
    >
      {kpiCards.map((card, index) => (
        <div
          key={index}
          className={`card transition-all duration-200 ${
            card.kpi?.isActive
              ? "ring-2 ring-opacity-50 shadow-md"
              : "opacity-75 hover:opacity-100"
          }`}
          style={{
            ringColor: card.kpi?.isActive ? card.kpi.color : "transparent",
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-2">
              <div className="flex items-center space-x-2 mb-2">
                {card.kpi && (
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: card.kpi.color,
                    }}
                  />
                )}
                <p className="text-[0.958rem] font-medium text-gray-600 dark:text-gray-400">
                  {card.title}
                </p>
              </div>

              <p className="text-[1.2rem] font-bold text-gray-900 dark:text-gray-100 mb-1">
                {card.kpi && card.hasData
                  ? card.type === "quantity"
                    ? `${(card.value ?? 0).toLocaleString("en-US", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })} MT`
                    : DataProcessor.formatCurrency(
                        card.value ?? 0,
                        state.settings.currency
                      )
                  : "No Data"}
              </p>

              {card.kpi && (
                <div className="flex items-center space-x-2 text-xs">
                  <span
                    className={`${
                      card.kpi.isActive
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {card.kpi.isActive ? "● Active" : "○ Inactive"}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {card.kpi.rowCount.toLocaleString()} rows
                  </span>
                </div>
              )}
            </div>

            <div
              className="p-2 rounded-lg"
              style={{
                backgroundColor: `${card.kpi?.color || "#cccccc"}20`,
                color: card.kpi?.color || "#cccccc",
              }}
            >
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
