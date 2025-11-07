import React, { useMemo } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useApp } from "../../contexts/AppContext";
import { useGlobalFilterContext } from "../../contexts/GlobalFilterContext";
import { ChartContainer } from "./ChartContainer";
import { DataProcessor } from "../../utils/dataProcessing";
import { ColorManager } from "../../utils/colorManager";
import { FlexibleDataRow } from "../../types";

interface BuyerTypeData {
  buyerType: string;
  totalSales: number;
  totalQuantity: number;
  count: number;
  averagePrice: number;
}

export function BuyerTypeAnalysisChart() {
  const { state } = useApp();
  const { getFilteredData } = useGlobalFilterContext();

  // Get all active datasets and process buyer type data from each
  const buyerTypeAnalysis = useMemo((): BuyerTypeData[] => {
    const activeDatasets = state.datasets.filter((d) =>
      state.activeDatasetIds.includes(d.id)
    );

    if (activeDatasets.length === 0) return [];

    // Initialize buyer type aggregation
    const buyerTypeMap = new Map<
      string,
      { total: number; totalQuantity: number; count: number; prices: number[] }
    >();

    // Always include both buckets
    buyerTypeMap.set("B2B", {
      total: 0,
      totalQuantity: 0,
      count: 0,
      prices: [],
    });
    buyerTypeMap.set("B2C", {
      total: 0,
      totalQuantity: 0,
      count: 0,
      prices: [],
    });

    activeDatasets.forEach((dataset) => {
      const data = getFilteredData(dataset.data);
      if (!data || data.length === 0) return;

      const name = (dataset.name || "").toLowerCase();
      const fileName = (dataset.fileName || "").toLowerCase();

      // Determine dataset type
      const isFOM =
        (name.includes("fom") || fileName.includes("fom")) &&
        !name.includes("lfom") &&
        !fileName.includes("lfom") &&
        !name.includes("pos") &&
        !fileName.includes("pos");

      const isLFOM =
        (name.includes("lfom") || fileName.includes("lfom")) &&
        !name.includes("pos") &&
        !fileName.includes("pos");

      // Columns (case-insensitive)
      const cols = Object.keys(data[0] || {});
      const findCol = (pred: (s: string) => boolean) =>
        cols.find((c) => pred(c.toLowerCase()));

      const buyerTypeColumn = isFOM
        ? findCol(
            (lc) =>
              lc.replace(/\s+/g, "").includes("buyer") && lc.includes("type")
          )
        : undefined; // force non-FOM into B2C regardless of any column

      const priceColumn = findCol(
        (lc) => lc === "price" || lc.includes("price")
      );
      const quantityColumn = findCol(
        (lc) => lc === "quantity" || lc.includes("quantity")
      );

      if (!priceColumn || !quantityColumn) {
        console.log(`Dataset ${dataset.name} missing required columns:`, {
          buyerTypeColumn,
          priceColumn,
          quantityColumn,
        });
        return;
      }

      // Helper: parse numbers safely (strip currency symbols/commas)
      const parsePrice = (v: unknown) => {
        if (typeof v === "number") return v;
        if (typeof v === "string") {
          const cleaned = v.replace(/[₹,$\s]/g, "").replace(/,/g, "");
          return parseFloat(cleaned) || 0;
        }
        return 0;
      };
      const parseQty = (v: unknown) => {
        if (typeof v === "number") return v;
        if (typeof v === "string") return parseFloat(v) || 0;
        return 0;
      };

      // Iterate rows
      data.forEach((row) => {
        const qty = parseQty(row[quantityColumn]);
        if (qty <= 0) return;

        let price = parsePrice(row[priceColumn]);
        if (price <= 0) return;

        // Apply FOM/LFOM revenue adjustment
        if (isFOM || isLFOM) {
          price = (price * 100) / 105;
        }

        // Bucket logic:
        // - FOM: use buyer type if present (only dataset that can be B2B/B2C)
        // - Non-FOM (e.g., LFOM): force everything into B2C
        let bucket: "B2B" | "B2C" = "B2C";

        if (isFOM && buyerTypeColumn) {
          const btRaw = String(row[buyerTypeColumn] ?? "")
            .toUpperCase()
            .trim();
          if (btRaw === "B2B" || btRaw === "B-2-B" || btRaw === "B 2 B") {
            bucket = "B2B";
          } else {
            // Anything else counts as B2C
            bucket = "B2C";
          }
        }

        const agg = buyerTypeMap.get(bucket)!;
        agg.total += price;
        agg.totalQuantity += qty;
        agg.count += 1;
        agg.prices.push(price);
      });
    });

    // Build chart data
    return Array.from(buyerTypeMap.entries())
      .map(([buyerType, data]) => ({
        buyerType,
        totalSales: data.total,
        totalQuantity: data.totalQuantity,
        count: data.count,
        averagePrice:
          data.totalQuantity > 0 ? data.total / data.totalQuantity : 0,
      }))
      .sort((a, b) => b.totalSales - a.totalSales);
  }, [state.datasets, state.activeDatasetIds, getFilteredData]);

  // Get primary dataset color (preferably FOM if available)
  const primaryColor = useMemo(() => {
    const activeDatasets = state.datasets.filter((d) =>
      state.activeDatasetIds.includes(d.id)
    );
    const fomDataset = activeDatasets.find(
      (dataset) =>
        dataset.name.toLowerCase().includes("fom") ||
        dataset.fileName.toLowerCase().includes("fom")
    );

    if (fomDataset) {
      return "#ba0f0f"; // Use dark red for FOM dataset
    }

    // Fall back to first active dataset color
    return activeDatasets.length > 0
      ? activeDatasets[0].color ||
          ColorManager.getDatasetColor(activeDatasets[0].name)
      : "#3B82F6";
  }, [state.datasets, state.activeDatasetIds]);

  // Don't render if no data at all
  if (
    buyerTypeAnalysis.length === 0 ||
    buyerTypeAnalysis.every((item) => item.totalSales === 0)
  ) {
    return null;
  }

  // ApexCharts configuration
  const chartOptions: ApexOptions = {
    chart: {
      type: "bar",
      height: 350,
      background: "transparent",
      toolbar: {
        show: false,
      },
    },
    theme: {
      mode: state.settings.theme === "dark" ? "dark" : "light",
    },
    colors: [primaryColor],
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
        columnWidth: "30%",
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: buyerTypeAnalysis.map((item) => item.buyerType),
      labels: {
        style: {
          colors: state.settings.theme === "dark" ? "#9CA3AF" : "#6B7280",
          fontSize: "12px",
        },
      },
      axisBorder: {
        color: state.settings.theme === "dark" ? "#4B5563" : "#9CA3AF",
      },
      axisTicks: {
        color: state.settings.theme === "dark" ? "#4B5563" : "#9CA3AF",
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: state.settings.theme === "dark" ? "#9CA3AF" : "#6B7280",
          fontSize: "12px",
        },
        formatter: function (value) {
          if (value >= 10000000) {
            return `₹${(value / 10000000).toFixed(1)}Cr`;
          } else if (value >= 100000) {
            return `₹${(value / 100000).toFixed(1)}L`;
          } else if (value >= 1000) {
            return `₹${(value / 1000).toFixed(0)}K`;
          } else {
            return `₹${value}`;
          }
        },
      },
    },
    grid: {
      borderColor: state.settings.theme === "dark" ? "#374151" : "#E5E7EB",
      strokeDashArray: 3,
    },
    tooltip: {
      theme: state.settings.theme === "dark" ? "dark" : "light",
      custom: function ({ series, seriesIndex, dataPointIndex, w }) {
        const data = buyerTypeAnalysis[dataPointIndex];
        return `
          <div style="min-width: 250px; max-width: 300px;" class="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
            <div class="space-y-1 text-sm">
              <p class="text-blue-600 dark:text-blue-400">
                <span class="font-medium">Total Sales:</span> ${DataProcessor.formatCurrency(
                  data.totalSales,
                  state.settings.currency
                )}
              </p>
              <p class="text-gray-600 dark:text-gray-400">
                <span class="font-medium">Total Quantity:</span> ${DataProcessor.formatNumber(
                  data.totalQuantity
                )} metric ton
              </p>
              <p class="text-blue-600 dark:text-blue-400">
                <span class="font-medium">Average Price:</span> ₹${data.averagePrice.toFixed(
                  2
                )}/kg
              </p>
            </div>
          </div>
        `;
      },
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: {
            height: 300,
          },
          plotOptions: {
            bar: {
              columnWidth: "70%",
            },
          },
        },
      },
    ],
  };

  const chartSeries = [
    {
      name: "Total Sales",
      data: buyerTypeAnalysis.map((item) => item.totalSales),
    },
  ];

  // Get dataset names for title
  const activeDatasetNames = state.datasets
    .filter(
      (d) =>
        state.activeDatasetIds.includes(d.id) &&
        !d.name.toLowerCase().includes("stock") &&
        !d.name.toLowerCase().includes("revenue") &&
        !d.name.toLowerCase().includes("mda claim") &&
        !d.name.toLowerCase().includes("cbg")
    )
    .map((d) => d.name)
    .join(", ");

  return (
    <ChartContainer
      title={`Sales Analysis by Buyer Type (B2B vs B2C) - ${activeDatasetNames}`}
      className="col-span-1 lg:col-span-2"
    >
      <div className="h-96">
        <Chart
          options={chartOptions}
          series={chartSeries}
          type="bar"
          height="100%"
        />
      </div>

      {/* Summary Statistics */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {buyerTypeAnalysis.map((data, index) => (
          <div
            key={data.buyerType}
            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
          >
            <div className="text-center">
              <div
                className="w-4 h-4 rounded-full mx-auto mb-2"
                style={{ backgroundColor: primaryColor }}
              ></div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                {data.buyerType}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                {DataProcessor.formatCurrency(
                  data.totalSales,
                  state.settings.currency
                )}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {DataProcessor.formatNumber(data.totalQuantity)} metric ton
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-semibold">
                Average: ₹{data.averagePrice.toFixed(2)}/kg
              </p>
            </div>
          </div>
        ))}

        {/* Total Summary */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-800">
          <div className="text-center">
            <div
              className="w-4 h-4 rounded-full mx-auto mb-2"
              style={{ backgroundColor: primaryColor }}
            ></div>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
              Total Sales
            </p>
            <p className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-1">
              {DataProcessor.formatCurrency(
                buyerTypeAnalysis.reduce(
                  (sum, data) => sum + data.totalSales,
                  0
                ),
                state.settings.currency
              )}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              {buyerTypeAnalysis
                .reduce((sum, data) => sum + data.totalQuantity, 0)
                .toFixed(2)}{" "}
              metric ton
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              From{" "}
              {state.datasets
                .filter((d) => state.activeDatasetIds.includes(d.id))
                .reduce((sum, dataset) => sum + dataset.data.length, 0)}{" "}
              total records
            </p>
          </div>
        </div>
      </div>
    </ChartContainer>
  );
}
