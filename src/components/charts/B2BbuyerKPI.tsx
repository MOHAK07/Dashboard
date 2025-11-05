import React, { useMemo } from "react";
import { User, TrendingUp, ShoppingCart, Tag } from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import { useGlobalFilterContext } from "../../contexts/GlobalFilterContext";
import { DataProcessor } from "../../utils/dataProcessing";

interface B2BBuyerKPIsProps {
  className?: string;
}

interface B2BBuyerData {
  name: string;
  totalQuantity: number;
  totalRevenue: number;
}

export function B2BBuyerKPIs({ className = "" }: B2BBuyerKPIsProps) {
  const { state } = useApp();
  const { getFilteredData, filterState } = useGlobalFilterContext();

  const fomDataset = useMemo(() => {
    return state.datasets.find(
      (d) =>
        state.activeDatasetIds.includes(d.id) &&
        d.name.toLowerCase().includes("fom") &&
        !d.name.toLowerCase().includes("lfom")
    );
  }, [state.datasets, state.activeDatasetIds]);

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

  // Parse various month formats (1, "01", "Apr", "April", etc.) -> 0..11 or -1 if unknown
  const parseMonthToIndex = (raw: any): number => {
    if (raw == null) return -1;
    const s = String(raw).trim();
    // numeric month
    const n = parseInt(s, 10);
    if (!Number.isNaN(n) && n >= 1 && n <= 12) return n - 1;
    const lower = s.toLowerCase();
    for (let i = 0; i < monthOrder.length; i++) {
      if (monthOrder[i].toLowerCase() === lower) return i;
    }
    // short names like "apr", "apr-2025", "apr25"
    const short = lower.slice(0, 3);
    for (let i = 0; i < monthOrder.length; i++) {
      if (monthOrder[i].slice(0, 3).toLowerCase() === short) return i;
    }
    return -1;
  };

  // Derive a month range string for the current fomDataset (priority: selectedMonths -> dateRange -> dataset)
  const monthDisplayText = useMemo(() => {
    if (!fomDataset) return "(Selected period)";

    const { selectedMonths } = filterState.filters.months;
    const { startDate, endDate } = filterState.filters.dateRange;

    // Priority 1: selectedMonths (use year from dateRange if available, else default '25')
    if (selectedMonths && selectedMonths.length > 0) {
      const sortedMonths = [...selectedMonths].sort(
        (a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b)
      );
      const fromMonth = sortedMonths[0];
      const toMonth = sortedMonths[sortedMonths.length - 1];

      // try to get year from dateRange.startDate, otherwise fall back to '25'
      const deriveYearAbbr = (dateStr?: string) => {
        if (!dateStr) return "25";
        try {
          const dt = new Date(dateStr + "T00:00:00");
          return String(dt.getFullYear()).slice(-2);
        } catch {
          return "25";
        }
      };
      const yearAbbr = deriveYearAbbr(startDate);

      if (fromMonth === toMonth) {
        return `(${fromMonth}'${yearAbbr})`;
      }
      return `(From ${fromMonth}'${yearAbbr} to ${toMonth}'${yearAbbr})`;
    }

    // Priority 2: global dateRange (startDate + endDate)
    if (startDate) {
      try {
        const startDt = new Date(startDate + "T00:00:00");
        const startMonth = monthOrder[startDt.getUTCMonth()];
        const startYear = String(startDt.getFullYear()).slice(-2);

        if (endDate) {
          const endDt = new Date(endDate + "T00:00:00");
          const endMonth = monthOrder[endDt.getUTCMonth()];
          const endYear = String(endDt.getFullYear()).slice(-2);

          if (startMonth === endMonth && startYear === endYear) {
            return `(${startMonth}'${startYear})`;
          }
          return `(From ${startMonth}'${startYear} to ${endMonth}'${endYear})`;
        }

        return `(From ${startMonth}'${startYear})`;
      } catch {
        // fall through to dataset-derived
      }
    }

    // Priority 3: derive from dataset using filtered rows (use filtered data to respect other filters)
    try {
      const filtered = getFilteredData(fomDataset.data || []);
      if (!Array.isArray(filtered) || filtered.length === 0) {
        return "(Selected period)";
      }

      // robustly find month/year columns
      const yearCol = DataProcessor.findColumnByKeywords(filtered, ["year"]);
      const monthCol = DataProcessor.findColumnByKeywords(filtered, ["month"]);

      // If we have both year & month columns, pick latest year then earliest->latest month in that year
      if (yearCol && monthCol) {
        const years = filtered
          .map((r) => parseInt(String(r[yearCol]), 10))
          .filter((y) => !Number.isNaN(y));
        if (years.length > 0) {
          const latestYear = Math.max(...years);
          const monthsInLatestYear = filtered
            .filter((r) => {
              const yr = r[yearCol];
              const parsed = parseInt(String(yr), 10);
              return !Number.isNaN(parsed)
                ? parsed === latestYear
                : String(yr) === String(latestYear);
            })
            .map((r) => r[monthCol])
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
            const yearAbbr = String(latestYear).slice(-2);
            return from === to
              ? `(${from}'${yearAbbr})`
              : `(From ${from}'${yearAbbr} to ${to}'${yearAbbr})`;
          }
        }
      }

      // If no year column or year parsing failed, attempt to derive across all rows by month only
      const monthIndicesAll = Array.from(
        new Set(
          filtered
            .map((r) => parseMonthToIndex(r[monthCol || Object.keys(r)[0]]))
            .filter((i) => i >= 0)
        )
      );
      if (monthIndicesAll.length > 0) {
        monthIndicesAll.sort((a, b) => a - b);
        const from = monthOrder[monthIndicesAll[0]];
        const to = monthOrder[monthIndicesAll[monthIndicesAll.length - 1]];
        // if we couldn't derive a year, try to use '25' as fallback
        const fallbackYear = "25";
        return from === to
          ? `(${from}'${fallbackYear})`
          : `(From ${from}'${fallbackYear} to ${to}'${fallbackYear})`;
      }
    } catch (e) {
      // ignore and fallback
    }

    return "(Selected period)";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fomDataset, filterState.filters, getFilteredData]);

  const topB2BBuyers = useMemo((): B2BBuyerData[] => {
    if (!fomDataset) {
      return [];
    }
    const filteredData = getFilteredData(fomDataset.data);

    if (filteredData.length === 0) {
      return [];
    }

    const nameColumn = DataProcessor.findColumnByKeywords(filteredData, [
      "name",
    ]);
    const quantityColumn = DataProcessor.findColumnByKeywords(filteredData, [
      "quantity",
    ]);
    const priceColumn = DataProcessor.findColumnByKeywords(filteredData, [
      "price",
    ]);
    const buyerTypeColumn = DataProcessor.findColumnByKeywords(filteredData, [
      "buyer type",
    ]);

    if (!nameColumn || !quantityColumn || !priceColumn || !buyerTypeColumn) {
      console.warn("B2B Buyer KPIs: Missing required columns in FOM dataset.");
      return [];
    }

    const buyerMap = new Map<string, B2BBuyerData>();
    filteredData.forEach((row) => {
      const buyerType = String(row[buyerTypeColumn] || "")
        .toUpperCase()
        .trim();
      if (buyerType === "B2B") {
        const name = String(row[nameColumn] || "Unknown Buyer");
        const quantity = parseFloat(String(row[quantityColumn] || "0")) || 0;
        const revenue = parseFloat(String(row[priceColumn] || "0")) || 0;
        if (!buyerMap.has(name)) {
          buyerMap.set(name, { name, totalQuantity: 0, totalRevenue: 0 });
        }
        const buyer = buyerMap.get(name)!;
        buyer.totalQuantity += quantity;
        buyer.totalRevenue += revenue;
      }
    });

    return Array.from(buyerMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);
  }, [fomDataset, getFilteredData]);

  if (!fomDataset || topB2BBuyers.length === 0) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return DataProcessor.formatCurrency(amount, state.settings.currency);
  };

  const formatQuantity = (amount: number) => {
    return `${DataProcessor.formatNumber(amount)} MT`;
  };

  return (
    <div className={"card " + className} style={{ marginTop: "12px" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/50 rounded-lg">
            <User className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Top B2B Buyers{" "}
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {monthDisplayText}
            </span>
          </h3>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto pr-2">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th scope="col" className="px-4 py-3">
                Buyer
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Total Revenue
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Total Quantity
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Average Price
              </th>
            </tr>
          </thead>
          <tbody>
            {topB2BBuyers.map((buyer) => (
              <tr
                key={buyer.name}
                className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white truncate">
                  <div className="flex items-center space-x-3">
                    <span
                      className="flex-shrink-0 w-2 h-2 rounded-full"
                      style={{ backgroundColor: "#BA0F0F" }}
                    ></span>
                    <span>{buyer.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-800 dark:text-gray-200">
                  <div className="flex items-center justify-end space-x-1.5">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span>{formatCurrency(buyer.totalRevenue)}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                  <div className="flex items-center justify-end space-x-1.5">
                    <ShoppingCart className="h-4 w-4 text-purple-500" />
                    <span>{formatQuantity(buyer.totalQuantity)}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                  <div className="flex items-center justify-end space-x-1.5">
                    <Tag className="h-4 w-4 text-blue-500" />
                    <span>
                      {buyer.totalQuantity > 0
                        ? formatCurrency(
                            buyer.totalRevenue / buyer.totalQuantity
                          )
                        : formatCurrency(0)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
