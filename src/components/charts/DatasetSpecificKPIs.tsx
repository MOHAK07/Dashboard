import React, { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import { useGlobalFilterContext } from "../../contexts/GlobalFilterContext";
import { DataProcessor } from "../../utils/dataProcessing";

// Same color helper you had
const getDatasetColorByName = (datasetName: string) => {
  const lowerName = datasetName.toLowerCase();

  if (
    lowerName.includes("pos") &&
    lowerName.includes("fom") &&
    !lowerName.includes("lfom")
  ) {
    return "#3b82f6";
  } else if (lowerName.includes("pos") && lowerName.includes("lfom")) {
    return "#22c55e";
  } else if (lowerName.includes("lfom") && !lowerName.includes("pos")) {
    return "#f59e0b";
  } else if (
    lowerName.includes("fom") &&
    !lowerName.includes("pos") &&
    !lowerName.includes("lfom")
  ) {
    return "#ba0f0f";
  }

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

  // Helper: convert a month-like value to month index (0-11) or -1 if unknown
  const parseMonthToIndex = (raw: any): number => {
    if (raw == null) return -1;
    const s = String(raw).trim();

    // numeric month (1..12 or 01..12)
    const asNum = parseInt(s, 10);
    if (!Number.isNaN(asNum) && asNum >= 1 && asNum <= 12) {
      return asNum - 1;
    }

    // full/short month name, case-insensitive
    const lower = s.toLowerCase();
    // check exact full match
    for (let i = 0; i < monthOrder.length; i++) {
      if (monthOrder[i].toLowerCase() === lower) return i;
    }
    // check first 3 letters (e.g., "Apr", "apr")
    for (let i = 0; i < monthOrder.length; i++) {
      if (monthOrder[i].slice(0, 3).toLowerCase() === lower.slice(0, 3))
        return i;
    }

    // sometimes months are numeric strings like "04", handled above; else unknown
    return -1;
  };

  // Helper: derive display text for a *single* dataset
  const getMonthDisplayForDataset = (dataset: any): string => {
    // Priority 1: global selected months from filter
    const { selectedMonths } = filterState.filters.months;
    const { startDate, endDate } = filterState.filters.dateRange;

    if (selectedMonths && selectedMonths.length > 0) {
      const sortedMonths = [...selectedMonths].sort(
        (a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b)
      );
      if (sortedMonths.length === 1) {
        return `(${sortedMonths[0]}'25)`;
      } else {
        const fromMonth = sortedMonths[0];
        const toMonth = sortedMonths[sortedMonths.length - 1];
        return `(From ${fromMonth}'25 to ${toMonth}'25)`;
      }
    }

    // Priority 2: global date range
    if (startDate && endDate) {
      try {
        const startDateObj = new Date(startDate + "T00:00:00");
        const endDateObj = new Date(endDate + "T00:00:00");

        const startMonth = monthOrder[startDateObj.getUTCMonth()];
        const startYear = startDateObj.getFullYear().toString().slice(-2);
        const endMonth = monthOrder[endDateObj.getUTCMonth()];
        const endYear = endDateObj.getFullYear().toString().slice(-2);

        if (startMonth === endMonth && startYear === endYear) {
          return `(${startMonth}'${startYear})`;
        } else {
          return `(From ${startMonth}'${startYear} to ${endMonth}'${endYear})`;
        }
      } catch (e) {
        // ignore and continue to dataset-based derivation
      }
    }

    // Priority 2.5: only start date
    if (startDate && !endDate) {
      try {
        const date = new Date(startDate + "T00:00:00");
        const monthName = monthOrder[date.getUTCMonth()];
        const year = date.getFullYear().toString().slice(-2);
        return `(From ${monthName}'${year})`;
      } catch (e) {
        // fallback
      }
    }

    // Priority 3: derive from dataset's filtered rows
    if (dataset && Array.isArray(dataset.data) && dataset.data.length > 0) {
      const filtered = getFilteredData(dataset.data);
      if (filtered.length > 0) {
        // detect month and year column names robustly
        const sample =
          filtered.find((r) => r && Object.keys(r).length > 0) || {};
        const keys = Object.keys(sample);
        const yearKey =
          keys.find((k) => k.toLowerCase().trim() === "year") ||
          keys.find((k) => /year/i.test(k));
        const monthKey =
          keys.find((k) => k.toLowerCase().trim() === "month") ||
          keys.find((k) => /month/i.test(k));

        if (yearKey && monthKey) {
          // find latest year number
          let latestYear = -Infinity;
          const rowsWithYear = filtered
            .map((r) => {
              const y = r[yearKey];
              const parsed = parseInt(String(y), 10);
              return Number.isNaN(parsed) ? null : parsed;
            })
            .filter((y) => y !== null);

          if (rowsWithYear.length === 0) {
            // fallback: if year values are two-digit or missing, try to ignore year and use months across all rows
            const monthIndices = filtered
              .map((r) => parseMonthToIndex(r[monthKey]))
              .filter((i) => i >= 0);
            if (monthIndices.length > 0) {
              monthIndices.sort((a, b) => a - b);
              const from = monthOrder[monthIndices[0]];
              const to = monthOrder[monthIndices[monthIndices.length - 1]];
              return from === to
                ? `(${from}'25)`
                : `(From ${from}'25 to ${to}'25)`;
            }
            return "(Selected period)";
          }

          latestYear = Math.max(...(rowsWithYear as number[]));
          if (!isFinite(latestYear)) return "(Selected period)";

          // filter rows for latest year and collect unique months
          const monthsInLatestYear = filtered
            .filter((r) => {
              const y = r[yearKey];
              // compare numerically if possible, else string-equals
              const py = parseInt(String(y), 10);
              if (!Number.isNaN(py)) return py === latestYear;
              return String(y) === String(latestYear);
            })
            .map((r) => r[monthKey])
            .filter(Boolean);

          const monthIndices = Array.from(
            new Set(
              monthsInLatestYear
                .map((m) => parseMonthToIndex(m))
                .filter((i) => i >= 0)
            )
          );

          if (monthIndices.length > 0) {
            monthIndices.sort((a, b) => a - b);
            const from = monthOrder[monthIndices[0]];
            const to = monthOrder[monthIndices[monthIndices.length - 1]];
            const shortYear = String(latestYear).slice(-2);
            if (from === to) return `(${from}'${shortYear})`;
            return `(From ${from}'${shortYear} to ${to}'${shortYear})`;
          }
        }
      }
    }

    // final fallback
    return "(Selected period)";
  };

  // compute KPIs for FOM and LFOM separately and include dateRange per dataset
  const { fomKpi, lfomKpi } = useMemo(() => {
    const fomDataset = state.datasets.find((d) => {
      const n = d.name.toLowerCase();
      return n.includes("fom") && !n.includes("lfom") && !n.includes("pos");
    });

    const lfomDataset = state.datasets.find((d) => {
      const n = d.name.toLowerCase();
      return n.includes("lfom") && !n.includes("pos");
    });

    const calculate = (dataset) => {
      if (!dataset) return null;
      const filteredData = getFilteredData(dataset.data || []);

      const firstRow = (dataset.data && dataset.data[0]) || {};
      const quantityColumn = Object.keys(firstRow || {}).find(
        (c) => c.toLowerCase().trim() === "quantity"
      );
      const priceColumn = Object.keys(firstRow || {}).find(
        (c) => c.toLowerCase().trim() === "price"
      );

      let totalQuantity = 0;
      if (quantityColumn) {
        totalQuantity = filteredData.reduce((sum, row) => {
          const raw = String(row[quantityColumn] || "0");
          const cleaned = raw.replace(/,/g, "");
          return sum + (parseFloat(cleaned) || 0);
        }, 0);
      }

      let totalRevenue = 0;
      if (priceColumn) {
        totalRevenue = filteredData.reduce((sum, row) => {
          const raw = String(row[priceColumn] || "0");
          const cleaned = raw.replace(/,/g, "");
          return sum + (parseFloat(cleaned) || 0);
        }, 0);

        // *** Special rule: for FOM dataset, apply (sum * 100) / 105 ***
        const name = String(dataset.name || "").toLowerCase();
        const isFom =
          name.includes("fom") &&
          !name.includes("lfom") &&
          !name.includes("pos");
        const isLfom = name.includes("lfom") && !name.includes("pos");

        if (isFom || isLfom) {
          totalRevenue = (totalRevenue * 100) / 105;
        }
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
        // important: compute dateRange per dataset
        dateRange: getMonthDisplayForDataset(dataset),
      };
    };

    return { fomKpi: calculate(fomDataset), lfomKpi: calculate(lfomDataset) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.datasets, state.activeDatasetIds, getFilteredData, filterState]);

  const kpiCards = [
    {
      title: "FOM Sales",
      kpi: fomKpi,
      value: fomKpi?.totalQuantity,
      hasData: fomKpi?.hasQuantityData,
      type: "quantity",
    },
    {
      title: "LFOM Sales",
      kpi: lfomKpi,
      value: lfomKpi?.totalQuantity,
      hasData: lfomKpi?.hasQuantityData,
      type: "quantity",
    },
    {
      title: "FOM Revenue",
      kpi: fomKpi,
      value: fomKpi?.totalRevenue,
      hasData: fomKpi?.hasRevenueData,
      type: "revenue",
    },
    {
      title: "LFOM Revenue",
      kpi: lfomKpi,
      value: lfomKpi?.totalRevenue,
      hasData: lfomKpi?.hasRevenueData,
      type: "revenue",
    },
  ];

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 ${className}`}
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
                  {card.title}{" "}
                  <span className="text-[0.8rem] font-normal text-gray-500 dark:text-gray-500">
                    {card.kpi?.dateRange}
                  </span>
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
