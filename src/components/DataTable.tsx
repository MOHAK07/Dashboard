import React, { useState, useMemo } from "react";
import { Search, SortAsc, SortDesc, Filter, Edit, Trash2 } from "lucide-react";
import { FlexibleDataRow } from "../types";
import { DataProcessor } from "../utils/dataProcessing";
import { useApp } from "../contexts/AppContext";

interface DataTableProps {
  data: FlexibleDataRow[];
  className?: string;
  tableId?: string;
  onEdit?: (record: FlexibleDataRow) => void;
  onDelete?: (record: FlexibleDataRow) => void;
  selectedRecords?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  showActions?: boolean;
}

interface ColumnConfig {
  key: string;
  label: string;
  width: number;
  sortable: boolean;
  filterable: boolean;
  isNumeric: boolean;
}

// Helper function to calculate text width
function getTextWidth(
  text: string,
  font: string = "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto"
): number {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return text.length * 8;
  context.font = font;
  const metrics = context.measureText(text);
  return Math.ceil(metrics.width);
}

export function DataTable({
  data,
  className = "",
  tableId = "data-table",
  onEdit,
  onDelete,
  selectedRecords = [],
  onSelectionChange,
  showActions = false,
}: DataTableProps) {
  const { state } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" });
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>(
    {}
  );
  const [showFilters, setShowFilters] = useState(false);

  const columns: ColumnConfig[] = useMemo(() => {
    if (data.length === 0) return [];

    const sampleRow = data[0];
    const numericColumns = DataProcessor.findNumericColumns(data);

    return Object.keys(sampleRow).map((key) => {
      const lowerKey = key.toLowerCase();

      // Calculate the maximum content width for this column
      let maxContentWidth = getTextWidth(key, "12px -apple-system") + 60;

      // Sample first 100 rows to determine max width
      const sampleSize = Math.min(data.length, 100);
      for (let i = 0; i < sampleSize; i++) {
        const value = data[i][key];
        let displayValue = String(value || "");

        if (numericColumns.includes(key) && typeof value === "number") {
          if (lowerKey.includes("price") || lowerKey.includes("revenue")) {
            displayValue = DataProcessor.formatCurrency(
              value,
              state.settings.currency
            );
          } else {
            displayValue = DataProcessor.formatNumber(value);
          }
        }

        const contentWidth = getTextWidth(displayValue) + 40;
        maxContentWidth = Math.max(maxContentWidth, contentWidth);
      }

      // Apply min and max constraints
      let width = Math.min(Math.max(maxContentWidth, 120), 400);

      // Special cases for known long content
      if (lowerKey.includes("address") || lowerKey.includes("adress")) {
        width = Math.max(width, 250);
      } else if (lowerKey.includes("quantity applied for mda claim")) {
        width = Math.max(width, 250);
      } else if (
        lowerKey.includes("boomi samrudhi") ||
        lowerKey.includes("rcf production") ||
        lowerKey.includes("rcf sales")
      ) {
        width = Math.max(width, 200);
      }

      return {
        key,
        label: key,
        width,
        sortable: true,
        filterable:
          !lowerKey.includes("address") && !lowerKey.includes("adress"),
        isNumeric: numericColumns.includes(key),
      };
    });
  }, [data, state.settings.currency]);

  const idColumnKey = useMemo(() => {
    if (data.length > 0 && "id" in data[0]) {
      return "id";
    }
    return columns.length > 0 ? columns[0].key : "";
  }, [data, columns]);

  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    if (searchTerm) {
      filtered = filtered.filter((row) =>
        Object.values(row).some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        )
      );
    }

    Object.entries(columnFilters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter((row) =>
          String(row[key] || "")
            .toLowerCase()
            .includes(value.toLowerCase())
        );
      }
    });

    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortConfig.direction === "asc"
            ? aValue - bValue
            : bValue - aValue;
        }

        const aString = String(aValue || "").toLowerCase();
        const bString = String(bValue || "").toLowerCase();

        if (sortConfig.direction === "asc") {
          return aString.localeCompare(bString);
        } else {
          return bString.localeCompare(aString);
        }
      });
    }

    return filtered;
  }, [data, searchTerm, sortConfig, columnFilters]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleColumnFilter = (key: string, value: string) => {
    setColumnFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? (
      <SortAsc className="h-4 w-4" />
    ) : (
      <SortDesc className="h-4 w-4" />
    );
  };

  const handleSelectionChange = (recordId: string, checked: boolean) => {
    if (!onSelectionChange) return;

    if (checked) {
      onSelectionChange([...selectedRecords, recordId]);
    } else {
      onSelectionChange(selectedRecords.filter((id) => id !== recordId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;

    if (checked) {
      const allIds = filteredAndSortedData.map((row, idx) =>
        String(row[idColumnKey] || idx)
      );
      onSelectionChange(allIds);
    } else {
      onSelectionChange([]);
    }
  };

  if (data.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <p className="text-lg font-medium">No data available</p>
            <p className="text-sm">Upload data to view the data explorer</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {tableId === "data-table" ? "Data Explorer" : "Dataset Table"}
        </h3>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-64"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors focus:outline-none ${
              showFilters
                ? "bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400"
                : "hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
            aria-label="Toggle column filters"
          >
            <Filter className="h-5 w-5" />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg overflow-x-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {columns
              .filter((col) => col.filterable)
              .map((column) => (
                <div key={column.key}>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {column.label}
                  </label>
                  <input
                    type="text"
                    placeholder={`Filter ${column.label.toLowerCase()}...`}
                    value={columnFilters[column.key] || ""}
                    onChange={(e) =>
                      handleColumnFilter(column.key, e.target.value)
                    }
                    className="input-field text-sm"
                  />
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-auto" style={{ maxHeight: "400px" }}>
          <table className="w-full border-collapse">
            <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0 z-10">
              <tr>
                {showActions && (
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700"
                    style={{
                      minWidth: "140px",
                      width: "140px",
                      borderRight: "1px solid rgb(229 231 235)",
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={
                          selectedRecords.length ===
                            filteredAndSortedData.length &&
                          filteredAndSortedData.length > 0
                        }
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span>Actions</span>
                    </div>
                  </th>
                )}
                {columns.map((column, colIndex) => (
                  <th
                    key={column.key}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700"
                    style={{
                      minWidth: `${column.width}px`,
                      width: `${column.width}px`,
                      borderRight:
                        colIndex < columns.length - 1
                          ? "1px solid rgb(229 231 235)"
                          : "none",
                    }}
                  >
                    {column.sortable ? (
                      <button
                        onClick={() => handleSort(column.key)}
                        className="flex items-center space-x-1 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none w-full"
                        title={column.label}
                      >
                        <span className="whitespace-nowrap overflow-hidden text-ellipsis block">
                          {column.label}
                        </span>
                        {getSortIcon(column.key)}
                      </button>
                    ) : (
                      <span
                        className="whitespace-nowrap overflow-hidden text-ellipsis block"
                        title={column.label}
                      >
                        {column.label}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (showActions ? 1 : 0)}
                    className="p-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    No data matches your current filters
                  </td>
                </tr>
              ) : (
                filteredAndSortedData.map((row, rowIndex) => {
                  const recordId = String(row[idColumnKey] || rowIndex);
                  const isSelected = selectedRecords.includes(recordId);

                  return (
                    <tr
                      key={recordId}
                      className={`border-b border-gray-200 dark:border-gray-700 ${
                        rowIndex % 2 === 0
                          ? "bg-white dark:bg-gray-900"
                          : "bg-gray-50 dark:bg-gray-800"
                      } hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors`}
                    >
                      {showActions && (
                        <td
                          className="px-4 py-3"
                          style={{
                            minWidth: "140px",
                            width: "140px",
                            borderRight: "1px solid rgb(229 231 235)",
                          }}
                        >
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) =>
                                handleSelectionChange(
                                  recordId,
                                  e.target.checked
                                )
                              }
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <button
                              onClick={() => onEdit?.(row)}
                              className="p-1 hover:bg-primary-100 dark:hover:bg-primary-900/50 rounded transition-colors"
                              title="Edit record"
                            >
                              <Edit className="h-3 w-3 text-primary-600 dark:text-primary-400" />
                            </button>
                            <button
                              onClick={() => onDelete?.(row)}
                              className="p-1 hover:bg-error-100 dark:hover:bg-error-900/50 rounded transition-colors"
                              title="Delete record"
                            >
                              <Trash2 className="h-3 w-3 text-error-600 dark:text-error-400" />
                            </button>
                          </div>
                        </td>
                      )}
                      {columns.map((column, colIndex) => {
                        const value = row[column.key];
                        let displayValue = String(value || "");

                        if (column.isNumeric && typeof value === "number") {
                          if (
                            column.key.toLowerCase().includes("price") ||
                            column.key.toLowerCase().includes("revenue")
                          ) {
                            displayValue = DataProcessor.formatCurrency(
                              value,
                              state.settings.currency
                            );
                          } else {
                            displayValue = DataProcessor.formatNumber(value);
                          }
                        }

                        return (
                          <td
                            key={column.key}
                            className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100"
                            style={{
                              minWidth: `${column.width}px`,
                              width: `${column.width}px`,
                              borderRight:
                                colIndex < columns.length - 1
                                  ? "1px solid rgb(229 231 235)"
                                  : "none",
                            }}
                            title={displayValue}
                          >
                            <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                              {displayValue}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <div>
          Showing {filteredAndSortedData.length} of {data.length} rows
          {selectedRecords.length > 0 && (
            <span className="ml-4 text-primary-600 dark:text-primary-400">
              {selectedRecords.length} selected
            </span>
          )}
        </div>

        {searchTerm || Object.values(columnFilters).some(Boolean) ? (
          <button
            onClick={() => {
              setSearchTerm("");
              setColumnFilters({});
            }}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            Clear filters
          </button>
        ) : null}
      </div>
    </div>
  );
}
