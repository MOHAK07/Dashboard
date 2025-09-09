import { useState, useEffect, useCallback, useMemo } from "react";
import {
  GlobalFilters,
  FilterValidationResult,
  FilterState,
  DEFAULT_GLOBAL_FILTERS,
  MONTHS,
  BUYER_TYPES,
} from "../types/filters";
import { FlexibleDataRow } from "../types";
import { DataProcessor } from "../utils/dataProcessing";

export function useGlobalFilters(data: FlexibleDataRow[]) {
  const [filterState, setFilterState] = useState<FilterState>({
    filters: DEFAULT_GLOBAL_FILTERS,
    isLoading: false,
    error: null,
    availableOptions: {
      dateRange: { min: "", max: "" },
      months: [],
      buyerTypes: [],
    },
  });

  // Calculate available filter options - STATIC approach
  const availableOptions = useMemo(() => {
    // Static date range - always show full range regardless of data
    const currentYear = new Date().getFullYear();
    const staticDateRange = {
      min: `${currentYear - 5}-01-01`, // 5 years ago
      max: `${currentYear + 1}-12-31`, // Next year
    };

    // Always show all 12 months regardless of data
    const availableMonths = [...MONTHS];

    // Always show both buyer types regardless of data
    const availableBuyerTypes = [...BUYER_TYPES];

    return {
      dateRange: staticDateRange,
      months: availableMonths,
      buyerTypes: availableBuyerTypes,
    };
  }, []); // No dependencies - completely static

  // Update available options when component mounts
  useEffect(() => {
    setFilterState((prev) => ({
      ...prev,
      availableOptions,
    }));
  }, [availableOptions]);

  // Validate filters
  const validateFilters = useCallback(
    (filters: GlobalFilters): FilterValidationResult => {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Validate date range
      if (filters.dateRange.startDate && filters.dateRange.endDate) {
        const startDate = new Date(filters.dateRange.startDate);
        const endDate = new Date(filters.dateRange.endDate);

        if (startDate > endDate) {
          errors.push("Start date cannot be after end date");
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    },
    []
  );

  // Enhanced date parsing function
  const parseRowDate = useCallback((dateValue: any): Date | null => {
    if (!dateValue) return null;

    let dateStr = String(dateValue).trim();

    // Handle MM/DD/YYYY format
    if (dateStr.includes("/")) {
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        let month, day, year;

        // Detect format based on first part
        if (parseInt(parts[0]) > 12) {
          // DD/MM/YYYY format
          [day, month, year] = parts;
        } else {
          // MM/DD/YYYY format
          [month, day, year] = parts;
        }

        // Ensure 4-digit year
        if (year.length === 2) {
          year = parseInt(year) < 50 ? "20" + year : "19" + year;
        }

        dateStr = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
    }

    // Handle DD-MM-YYYY format
    if (dateStr.includes("-") && dateStr.split("-")[0].length <= 2) {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const [day, month, year] = parts;
        const fullYear =
          year.length === 2
            ? parseInt(year) < 50
              ? "20" + year
              : "19" + year
            : year;
        dateStr = `${fullYear}-${month.padStart(2, "0")}-${day.padStart(
          2,
          "0"
        )}`;
      }
    }

    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  }, []);

  // Apply filters to data - FIXED LOGIC
  const applyFilters = useCallback(
    (data: FlexibleDataRow[], filters: GlobalFilters): FlexibleDataRow[] => {
      if (!filters.isActive || data.length === 0) return data;

      let filteredData = [...data];
      const columns = Object.keys(data[0] || {});

      try {
        const dateColumn = columns.find(
          (col) =>
            col.toLowerCase() === "date" || col.toLowerCase().includes("date")
        );
        const monthColumn = columns.find(
          (col) =>
            col.toLowerCase() === "month" || col.toLowerCase().includes("month")
        );

        // Apply date range filter
        if (filters.dateRange.startDate && filters.dateRange.endDate) {
          if (dateColumn) {
            const startDate = new Date(filters.dateRange.startDate);
            const endDate = new Date(filters.dateRange.endDate);
            endDate.setHours(23, 59, 59, 999); // Include the whole end day

            filteredData = filteredData.filter((row) => {
              const rowDate = parseRowDate(row[dateColumn]);
              if (!rowDate) return false;
              return rowDate >= startDate && rowDate <= endDate;
            });
          }
        }

        // Apply month filter with cross-check from date column
        if (filters.months.selectedMonths.length > 0) {
          const selectedMonths = new Set(filters.months.selectedMonths);
          const monthNames = [
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

          filteredData = filteredData.filter((row) => {
            // Check 1: Match against the 'Month' column directly
            if (monthColumn) {
              const monthValue = String(row[monthColumn] || "").trim();
              if (selectedMonths.has(monthValue)) {
                return true;
              }
            }

            // Check 2: Match against the 'Date' column as a fallback
            if (dateColumn) {
              const rowDate = parseRowDate(row[dateColumn]);
              if (rowDate) {
                const monthNameFromDate = monthNames[rowDate.getMonth()];
                if (selectedMonths.has(monthNameFromDate)) {
                  return true;
                }
              }
            }
            return false;
          });
        }

        // Apply buyer type filter
        if (filters.buyerTypes.selectedTypes.length > 0) {
          const buyerTypeColumn = columns.find((col) => {
            const lowerCol = col.toLowerCase().replace(/\s+/g, "");
            return lowerCol.includes("buyer") && lowerCol.includes("type");
          });

          if (buyerTypeColumn) {
            filteredData = filteredData.filter((row) => {
              const buyerType = String(row[buyerTypeColumn] || "")
                .toUpperCase()
                .trim();
              return filters.buyerTypes.selectedTypes.includes(
                buyerType as "B2B" | "B2C"
              );
            });
          }
        }
      } catch (error) {
        console.error("Error applying filters:", error);
        setFilterState((prev) => ({
          ...prev,
          error: "Failed to apply filters",
        }));
        return data;
      }

      return filteredData;
    },
    [parseRowDate]
  );

  // Update filters
  const updateFilters = useCallback(
    (newFilters: Partial<GlobalFilters>) => {
      setFilterState((prev) => {
        const updatedFilters = {
          ...prev.filters,
          ...newFilters,
          isActive: true,
        };

        const validation = validateFilters(updatedFilters);

        return {
          ...prev,
          filters: updatedFilters,
          error: validation.isValid ? null : validation.errors.join(", "),
        };
      });
    },
    [validateFilters]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilterState((prev) => ({
      ...prev,
      filters: DEFAULT_GLOBAL_FILTERS,
      error: null,
    }));
  }, []);

  // Reset specific filter type
  const resetFilter = useCallback((filterType: keyof GlobalFilters) => {
    setFilterState((prev) => {
      const updatedFilters = { ...prev.filters };

      switch (filterType) {
        case "dateRange":
          updatedFilters.dateRange = { startDate: "", endDate: "" };
          break;
        case "months":
          updatedFilters.months = { selectedMonths: [] };
          break;
        case "buyerTypes":
          updatedFilters.buyerTypes = { selectedTypes: [] };
          break;
      }

      // Check if any filters are still active
      const hasActiveFilters =
        updatedFilters.dateRange.startDate ||
        updatedFilters.dateRange.endDate ||
        updatedFilters.months.selectedMonths.length > 0 ||
        updatedFilters.buyerTypes.selectedTypes.length > 0;

      updatedFilters.isActive = hasActiveFilters;

      return {
        ...prev,
        filters: updatedFilters,
        error: null,
      };
    });
  }, []);

  // Get filtered data
  const getFilteredData = useCallback(
    (sourceData: FlexibleDataRow[]) => {
      return applyFilters(sourceData, filterState.filters);
    },
    [applyFilters, filterState.filters]
  );

  // Check if filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filterState.filters.isActive &&
      (filterState.filters.dateRange.startDate ||
        filterState.filters.dateRange.endDate ||
        filterState.filters.months.selectedMonths.length > 0 ||
        filterState.filters.buyerTypes.selectedTypes.length > 0)
    );
  }, [filterState.filters]);

  return {
    filterState,
    updateFilters,
    clearFilters,
    resetFilter,
    getFilteredData,
    validateFilters,
    hasActiveFilters,
    availableOptions: filterState.availableOptions,
  };
}
