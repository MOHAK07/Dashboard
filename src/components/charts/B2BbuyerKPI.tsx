import React, { useMemo } from "react";
import { User, TrendingUp, ShoppingCart } from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import { useGlobalFilterContext } from "../../contexts/GlobalFilterContext";
import { DataProcessor } from "../../utils/dataProcessing";
import { FlexibleDataRow } from "../../types";

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

  const monthDisplayText = useMemo(() => {
    if (!fomDataset) return "";

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

    // If a month filter is applied, use the first selected month
    if (selectedMonths.length > 0) {
      const sortedMonths = [...selectedMonths].sort(
        (a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b)
      );
      // Assuming the year is 2025 as per the context
      return `(from ${sortedMonths[0]}'25)`;
    }

    // If a date range filter is applied, use the start date's month
    if (startDate) {
      try {
        const date = new Date(startDate + "T00:00:00"); // Ensure correct parsing
        const monthName = monthOrder[date.getMonth()];
        const year = date.getFullYear().toString().slice(-2);
        return `(from ${monthName}'${year})`;
      } catch (e) {
        // Fallback if date is invalid
      }
    }

    // Default: find the earliest month in the dataset for the latest year
    const yearColumn = DataProcessor.findColumnByKeywords(fomDataset.data, [
      "year",
    ]);
    const monthColumn = DataProcessor.findColumnByKeywords(fomDataset.data, [
      "month",
    ]);

    if (fomDataset.data.length > 0 && yearColumn && monthColumn) {
      const latestYear = Math.max(
        ...fomDataset.data
          .map((row) => parseInt(String(row[yearColumn])))
          .filter((y) => !isNaN(y))
      );

      const monthsInLatestYear = fomDataset.data
        .filter((row) => String(row[yearColumn]) === String(latestYear))
        .map((row) => String(row[monthColumn]))
        .filter(Boolean);

      if (monthsInLatestYear.length > 0) {
        const uniqueMonths = [...new Set(monthsInLatestYear)];
        uniqueMonths.sort(
          (a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b)
        );
        return `(from ${uniqueMonths[0]}'${String(latestYear).slice(-2)})`;
      }
    }

    return "(starting from April'25)"; // Fallback text
  }, [filterState.filters, fomDataset]);

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
        const quantity = parseFloat(String(row[quantityColumn] || "0"));
        const revenue = parseFloat(String(row[priceColumn] || "0"));
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
