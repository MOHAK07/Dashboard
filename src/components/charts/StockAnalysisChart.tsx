import React, { useState, useMemo } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { ChartContainer } from "./ChartContainer";
import { useApp } from "../../contexts/AppContext";
import { useGlobalFilterContext } from "../../contexts/GlobalFilterContext";

interface StockAnalysisChartProps {
  className?: string;
}

// Enhanced date parsing function to handle multiple formats
const parseDate = (dateString: string): Date | null => {
  if (!dateString || typeof dateString !== "string") return null;
  
  // Remove any extra whitespace
  const cleanDateString = dateString.trim();
  
  // Try multiple date formats
  const formats = [
    // dd-mm-yyyy or dd/mm/yyyy
    /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/,
    // dd-mm-yy or dd/mm/yy
    /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2})$/,
    // yyyy-mm-dd
    /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/,
  ];
  
  for (const format of formats) {
    const match = cleanDateString.match(format);
    if (match) {
      let day, month, year;
      
      if (format === formats[2]) {
        // yyyy-mm-dd format
        year = parseInt(match[1], 10);
        month = parseInt(match[2], 10) - 1;
        day = parseInt(match[3], 10);
      } else {
        // dd-mm-yyyy or dd-mm-yy format
        day = parseInt(match[1], 10);
        month = parseInt(match[2], 10) - 1;
        year = parseInt(match[3], 10);
        
        // Handle 2-digit years
        if (year < 100) {
          year += year < 50 ? 2000 : 1900;
        }
      }
      
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        const date = new Date(year, month, day);
        if (
          date.getFullYear() === year &&
          date.getMonth() === month &&
          date.getDate() === day
        ) {
          return date;
        }
      }
    }
  }
  
  // Fallback: try native Date parsing
  const fallbackDate = new Date(cleanDateString);
  return !isNaN(fallbackDate.getTime()) ? fallbackDate : null;
};

export function StockAnalysisChart({
  className = "",
}: StockAnalysisChartProps) {
  const { state } = useApp();
  const { getFilteredData } = useGlobalFilterContext();
  const [chartType, setChartType] = useState<"area" | "bar">("area");
  
  const isDarkMode = state.settings.theme === "dark";

  const processedData = useMemo(() => {
    const activeData = state.datasets
      .filter((d) => state.activeDatasetIds.includes(d.id))
      .flatMap((d) => getFilteredData(d.data));

    console.log("Active data length:", activeData.length);
    console.log("Sample data:", activeData.slice(0, 2));

    if (activeData.length === 0) {
      console.log("No active data found");
      return { rcfData: null, boomiData: null, hasData: false };
    }

    // Check if required columns exist
    const sampleRow = activeData[0];
    const requiredColumns = [
      "Date",
      "RCF Production",
      "RCF Sales", 
      "RCF Stock Left",
      "Boomi Samrudhi Production",
      "Boomi Samrudhi Sales",
      "Boomi Samrudhi Stock Left"
    ];
    
    console.log("Available columns:", Object.keys(sampleRow));
    const missingColumns = requiredColumns.filter(col => !(col in sampleRow));
    if (missingColumns.length > 0) {
      console.warn("Missing columns:", missingColumns);
    }

    const monthlyData: {
      [month: string]: {
        rcfProduction: number[];
        rcfSales: number[];
        rcfStock: number[];
        boomiProduction: number[];
        boomiSales: number[];
        boomiStock: number[];
      };
    } = {};

    let processedRowCount = 0;
    let skippedRowCount = 0;

    activeData.forEach((row, index) => {
      try {
        // Handle optional Date field more robustly
        const dateValue = row["Date"];
        if (!dateValue) {
          console.log(`Row ${index}: Missing date, skipping`);
          skippedRowCount++;
          return;
        }

        const date = parseDate(String(dateValue));
        if (!date) {
          console.log(`Row ${index}: Invalid date format "${dateValue}", skipping`);
          skippedRowCount++;
          return;
        }

        const monthKey = date.toLocaleString("en-US", {
          month: "short",
          year: "numeric",
        });

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            rcfProduction: [],
            rcfSales: [],
            rcfStock: [],
            boomiProduction: [],
            boomiSales: [],
            boomiStock: [],
          };
        }

        const parseAndPush = (arr: number[], value: any, fieldName: string) => {
          if (value !== null && value !== undefined && String(value).trim() !== "") {
            const stringValue = String(value).replace(/,/g, "");
            const num = parseFloat(stringValue);
            if (!isNaN(num)) {
              arr.push(num);
            } else {
              console.log(`Row ${index}: Invalid ${fieldName} value "${value}"`);
            }
          }
        };

        // Parse data with better error handling
        parseAndPush(monthlyData[monthKey].rcfProduction, row["RCF Production"], "RCF Production");
        parseAndPush(monthlyData[monthKey].rcfSales, row["RCF Sales"], "RCF Sales");
        parseAndPush(monthlyData[monthKey].rcfStock, row["RCF Stock Left"], "RCF Stock Left");
        parseAndPush(monthlyData[monthKey].boomiProduction, row["Boomi Samrudhi Production"], "Boomi Samrudhi Production");
        parseAndPush(monthlyData[monthKey].boomiSales, row["Boomi Samrudhi Sales"], "Boomi Samrudhi Sales");
        parseAndPush(monthlyData[monthKey].boomiStock, row["Boomi Samrudhi Stock Left"], "Boomi Samrudhi Stock Left");

        processedRowCount++;
      } catch (e) {
        console.error(`Error processing row ${index}:`, row, e);
        skippedRowCount++;
      }
    });

    console.log(`Processed ${processedRowCount} rows, skipped ${skippedRowCount} rows`);
    console.log("Monthly data keys:", Object.keys(monthlyData));

    const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA.getTime() - dateB.getTime();
    });

    if (sortedMonths.length === 0) {
      console.log("No valid months found after processing");
      return { rcfData: null, boomiData: null, hasData: false };
    }

    console.log("Sorted months:", sortedMonths);

    const avg = (arr: number[]) =>
      arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const createSeries = (product: "rcf" | "boomi") => {
      const p = product === "rcf" ? "rcf" : "boomi";
      
      const productionData = sortedMonths.map((m) => {
        const data = monthlyData[m][`${p}Production` as keyof (typeof monthlyData)[string]];
        return Math.round(avg(data));
      });
      
      const salesData = sortedMonths.map((m) => {
        const data = monthlyData[m][`${p}Sales` as keyof (typeof monthlyData)[string]];
        return Math.round(avg(data));
      });
      
      const stockData = sortedMonths.map((m) => {
        const data = monthlyData[m][`${p}Stock` as keyof (typeof monthlyData)[string]];
        return Math.round(avg(data));
      });

      console.log(`${product} Production data:`, productionData);
      console.log(`${product} Sales data:`, salesData);
      console.log(`${product} Stock data:`, stockData);

      return [
        {
          name: "Production",
          data: productionData,
          color: "#3b82f6",
        },
        {
          name: "Sales", 
          data: salesData,
          color: "#ef4444",
        },
        {
          name: "Unsold Stock",
          data: stockData,
          color: "#ffc658",
        },
      ];
    };

    const rcfData = { categories: sortedMonths, series: createSeries("rcf") };
    const boomiData = { categories: sortedMonths, series: createSeries("boomi") };

    // Check if we have any actual data
    const hasActualData = rcfData.series.some(series => 
      series.data.some(value => value > 0)
    ) || boomiData.series.some(series => 
      series.data.some(value => value > 0)
    );

    console.log("Has actual data:", hasActualData);

    return { rcfData, boomiData, hasData: hasActualData };
  }, [state.datasets, state.activeDatasetIds, getFilteredData]);

  // Debug output
  console.log("ProcessedData:", processedData);

  if (!processedData.hasData) {
    return (
      <div className={`p-4 text-center ${className}`}>
        <p className="text-gray-500">
          No valid stock data available for the selected datasets. 
          Please check that your data contains valid dates and numeric values.
        </p>
      </div>
    );
  }

  const createChartOptions = (
    categories: string[],
    series: any[]
  ): ApexOptions => ({
    chart: {
      type: chartType,
      background: "transparent",
      toolbar: { show: false },
      height: 420,
      animations: {
        enabled: true,
        speed: 800,
        animateGradually: { enabled: false },
        dynamicAnimation: { enabled: true, speed: 900 },
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "40%",
        borderRadius: 4,
        dataLabels: { position: "top" },
      },
    },
    fill: {
      type: chartType === "area" ? "gradient" : "solid",
      colors: series.map((s) => s.color),
      gradient:
        chartType === "area"
          ? {
              shadeIntensity: 1,
              type: "vertical",
              opacityFrom: 0.8,
              opacityTo: 0.4,
              stops: [0, 100],
            }
          : undefined,
      opacity: chartType === "area" ? 1 : 1,
    },
    stroke: { curve: "smooth", width: chartType === "area" ? 2 : 0 },
    dataLabels: { enabled: false },
    xaxis: {
      categories,
      labels: { style: { colors: isDarkMode ? "#9ca3af" : "#6b7280" } },
      title: {
        text: "Month",
        style: { color: isDarkMode ? "#9ca3af" : "#6b7280" },
      },
    },
    yaxis: {
      labels: {
        style: { colors: isDarkMode ? "#9ca3af" : "#6b7280" },
        formatter: (val) => val.toFixed(0),
      },
      title: {
        text: "Average Value",
        style: { color: isDarkMode ? "#9ca3af" : "#6b7280" },
      },
    },
    tooltip: {
      theme: isDarkMode ? "dark" : "light",
      y: { formatter: (val) => `${val.toFixed(2)}` },
    },
    legend: {
      position: "bottom",
      horizontalAlign: "center",
      labels: { colors: isDarkMode ? "#9ca3af" : "#6b7280" },
    },
    grid: { borderColor: isDarkMode ? "#374151" : "#e5e7eb" },
    colors: series.map((s) => s.color),
  });

  const renderChart = (
    data: { categories: string[]; series: any[] } | null,
    title: string
  ) => {
    if (!data) return null;

    const options = createChartOptions(data.categories, data.series);

    return (
      <ChartContainer
        title={title}
        availableTypes={["area", "bar"]}
        currentType={chartType}
        onChartTypeChange={(type) => setChartType(type as any)}
      >
        <Chart
          key={chartType}
          options={options}
          series={data.series}
          type={chartType}
          height={options.chart?.height}
          width="100%"
        />
      </ChartContainer>
    );
  };

  return (
    <div className={`space-y-5 ${className}`}>
      {renderChart(
        processedData.rcfData,
        "RCF: Production, Sales, and Unsold Stock Over Time"
      )}
      {renderChart(
        processedData.boomiData,
        "Boomi Samrudhi: Production, Sales, and Unsold Stock Over Time"
      )}
    </div>
  );
}

export default StockAnalysisChart;
