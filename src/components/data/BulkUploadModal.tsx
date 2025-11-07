import React, { useState, useEffect } from "react";
import {
  X,
  UploadCloud,
  FileText,
  AlertCircle,
  Database,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { TableName, TABLES } from "../../lib/supabase.ts";
import { DatabaseService } from "../../services/databaseService.ts";
import { parseCSV, parseXLSX, ParserResult } from "../../utils/fileParser.ts";
import { FlexibleDataRow } from "../../types/index.ts";
import {
  FOMRecord,
  LFOMRecord,
  MDAClaimRecord,
  POSLFOMRecord,
  POSFOMRecord,
  StockRecord,
  RevenueRecord,
  CBGRecord,
} from "../../types/database.ts";

interface BulkUploadModalProps {
  tableName: TableName;
  onClose: () => void;
  onSuccess: () => void;
}

type UploadStep = "1_select" | "2_preview" | "3_uploading" | "4_complete";

interface ValidationError {
  row: number;
  column: string;
  value: any;
  issue: string;
}

// Add this utility function at the top of the file, before the component
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};


// Excel date conversion function
function excelDateToJSDate(serial: number): Date {
  // Excel dates are stored as days since January 1, 1900 (with 1900 incorrectly treated as a leap year)
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);

  return new Date(
    date_info.getFullYear(),
    date_info.getMonth(),
    date_info.getDate()
  );
}

// Comprehensive date parsing function
function parseToYYYYMMDD(value: any): string | null {
  if (!value || value === "") return null;

  // If it's already in YYYY-MM-DD format, return it
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  // If it's an Excel serial number
  if (typeof value === "number" && value > 1 && value < 100000) {
    try {
      const date = excelDateToJSDate(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0]; // Returns YYYY-MM-DD
      }
    } catch (error) {
      console.warn("Failed to convert Excel date:", value);
    }
  }

  // If it's a string that might be a date
  if (typeof value === "string") {
    // Try parsing various formats
    const formats = [
      /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/, // DD/MM/YYYY or DD-MM-YYYY
      /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2})$/, // DD/MM/YY or DD-MM-YY
      /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/, // YYYY/MM/DD or YYYY-MM-DD
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // MM/DD/YYYY
    ];

    for (const format of formats) {
      const match = value.match(format);
      if (match) {
        let day, month, year;

        if (format === formats[0] || format === formats[1]) {
          // DD/MM/YYYY or DD/MM/YY format
          day = parseInt(match[1]);
          month = parseInt(match[2]);
          year = parseInt(match[3]);
          if (format === formats[1] && year < 100) {
            year += year < 30 ? 2000 : 1900; // Assume 2000s for years < 30, 1900s otherwise
          }
        } else if (format === formats[2]) {
          // YYYY/MM/DD format
          year = parseInt(match[1]);
          month = parseInt(match[2]);
          day = parseInt(match[3]);
        } else if (format === formats[3]) {
          // MM/DD/YYYY format
          month = parseInt(match[1]);
          day = parseInt(match[2]);
          year = parseInt(match[3]);
        }

        // Validate and create date
        if (
          year &&
          month &&
          day &&
          month >= 1 &&
          month <= 12 &&
          day >= 1 &&
          day <= 31 &&
          year >= 1900 &&
          year <= 2100
        ) {
          try {
            const date = new Date(year, month - 1, day);
            if (
              date.getFullYear() === year &&
              date.getMonth() === month - 1 &&
              date.getDate() === day
            ) {
              return date.toISOString().split("T")[0];
            }
          } catch (error) {
            // Continue to next format
          }
        }
      }
    }

    // Try JavaScript Date parsing as last resort
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime()) && date.getFullYear() >= 1900) {
        return date.toISOString().split("T")[0];
      }
    } catch (error) {
      // Parsing failed
    }
  }

  return null;
}

// Get table column names excluding the auto-increment 'id' column
const getTableColumnNames = (tableName: TableName): string[] => {
  const tableColumns: Record<TableName, string[]> = {
    [TABLES.FOM]: [
      "Date",
      "Week",
      "Month",
      "Year",
      "Name",
      "Adress",
      "Pin code",
      "Taluka",
      "District",
      "State",
      "Quantity",
      "Price",
      "Buyer Type",
      "Unit Price",
    ],
    [TABLES.LFOM]: [
      "Date",
      "Week",
      "Month",
      "Year",
      "Name",
      "Adress",
      "Pin code",
      "Taluka",
      "District",
      "State",
      "Quantity",
      "Price",
      "Buyer Type",
    ],
    [TABLES.MDA_CLAIM]: [
      "Year",
      "Month",
      "Week",
      "Quantity Applied for MDA Claim/Sold",
      "Claim Accepted",
      "Eligible Amount",
      "Amount Received",
      "Amount not Received",
      "EQ QTY",
      "Date of Receipt",
    ],
    [TABLES.POS_LFOM]: [
      "Date",
      "Week",
      "Month",
      "Year",
      "Name",
      "Adress",
      "State",
      "Quantity",
      "Price",
      "Type",
    ],
    [TABLES.POS_FOM]: [
      "Date",
      "Week",
      "Month",
      "Year",
      "Name",
      "Adress",
      "State",
      "Quantity",
      "Price",
      "Revenue",
      "Type",
    ],
    [TABLES.STOCK]: [
      "Date",
      "RCF Production",
      "Boomi Samrudhi Production",
      "RCF Sales",
      "Boomi Samrudhi Sales",
      "RCF Stock Left",
      "Boomi Samrudhi Stock Left",
      "Total Stock Left",
      "RCF Price",
      "RCF Revenue",
      "Boomi Samrudhi Price",
      "Boomi Samrudhi Revenue",
    ],
    [TABLES.REVENUE]: [
      "Month",
      "Direct sales FOM",
      "FOM B2B",
      "FOM B2C",
      "Direct Sales LFOM",
      "LFOM B2C",
      "MDA claim received",
      "Total Revenue",
    ],
    [TABLES.CBG]: [
      "Bill.Doc",
      "Bill.Doc.Date",
      "Month",
      "Year",
      "Bill to party",
      "Revenue GL",
      "Sales Doc Type",
      "Bill to party name",
      "City",
      "Ship to party name",
      "State Discription",
      "Matrl Description",
      "Unit",
      "Quantity",
      "Rate",
      "Basic Value",
      "CGST Amount",
      "SGST Amount",
      "IGST Amount",
      "Transportation amount",
      "Total Invoice value",
      "Plant",
      "Material Code",
      "Truck Number",
      "Transpoter Name",
      "R.O Number&Date",
      "BPGSTIN Number",
      "Sales Order No",
      "Sales Order Date",
      "Purchase Order",
      "Billing Type",
      "Permit Number and Date",
      "Billing ACCT Doc No.(RV)",
      "Excise ACCT Doc No.(SA)",
      "OFS Number and Date",
      "NOC Number and Date",
      "Delivery number",
      "HSN/SAC",
      "Compression filling Amount",
      "Unit Price",
      "Actual Production in MT",
    ],
    [TABLES.APP_STATUS]: ["status_message", "last_update"],
  };

  return tableColumns[tableName] || [];
};

// Helper function to get date columns for each table
const getDateColumns = (tableName: TableName): string[] => {
  const dateColumns: Record<TableName, string[]> = {
    [TABLES.FOM]: ["Date"],
    [TABLES.LFOM]: ["Date"],
    [TABLES.MDA_CLAIM]: ["Date of Receipt"],
    [TABLES.POS_LFOM]: ["Date"],
    [TABLES.POS_FOM]: ["Date"],
    [TABLES.STOCK]: ["Date"],
    [TABLES.REVENUE]: [],
    [TABLES.CBG]: ["Bill.Doc.Date"],
    [TABLES.APP_STATUS]: [],
  };

  return dateColumns[tableName] || [];
};

export function BulkUploadModal({
  tableName,
  onClose,
  onSuccess,
}: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<UploadStep>("1_select");
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<FlexibleDataRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  const CHUNK_SIZE = 500;

  // Hide body overflow when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Get expected columns dynamically from the interface (excluding id)
  const expectedColumns = getTableColumnNames(tableName);
  const dateColumns = getDateColumns(tableName);

  // Transform data to convert dates to proper format
  const transformData = (data: FlexibleDataRow[]): FlexibleDataRow[] => {
    return data.map((row) => {
      const transformedRow = { ...row };

      // Convert date columns to YYYY-MM-DD format
      dateColumns.forEach((dateCol) => {
        if (
          transformedRow[dateCol] !== undefined &&
          transformedRow[dateCol] !== null
        ) {
          const convertedDate = parseToYYYYMMDD(transformedRow[dateCol]);
          if (convertedDate) {
            transformedRow[dateCol] = convertedDate;
          }
        }
      });

      return transformedRow;
    });
  };

  const validateData = (
    data: FlexibleDataRow[],
    headers: string[]
  ): {
    errors: ValidationError[];
    warnings: string[];
  } => {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Filter out 'id' column from headers for validation (if present)
    const filteredHeaders = headers.filter(
      (header) => header.toLowerCase() !== "id"
    );

    // Check for missing required columns (excluding id)
    const missingColumns = expectedColumns.filter(
      (col) => !filteredHeaders.includes(col)
    );
    if (missingColumns.length > 0) {
      warnings.push(`Missing expected columns: ${missingColumns.join(", ")}`);
    }

    // Check for extra columns (excluding id)
    const extraColumns = filteredHeaders.filter(
      (col) => !expectedColumns.includes(col)
    );
    if (extraColumns.length > 0) {
      warnings.push(
        `Extra columns found: ${extraColumns.join(
          ", "
        )} - these will be ignored if not in database schema`
      );
    }

    // Warn if id column is present (since it's auto-generated)
    if (headers.some((header) => header.toLowerCase() === "id")) {
      warnings.push(
        `'id' column detected - this will be ignored as it's auto-generated by the database`
      );
    }

    // Validate data rows
    data.forEach((row, index) => {
      // Check for completely empty rows (excluding id column)
      if (
        filteredHeaders.every((h) => !row[h] || String(row[h]).trim() === "")
      ) {
        errors.push({
          row: index + 1,
          column: "all",
          value: "empty",
          issue: "Completely empty row",
        });
        return;
      }

      filteredHeaders.forEach((header) => {
        const value = row[header];

        // Skip validation for id column
        if (header.toLowerCase() === "id") {
          return;
        }

        // Dynamic type checking based on the interface
        if (value && value !== "") {
          // Check numeric fields by examining the interface types
          if (isNumericColumn(header, tableName)) {
            const numValue =
              typeof value === "string"
                ? parseFloat(value.replace(/[,\s]/g, ""))
                : Number(value);
            if (isNaN(numValue)) {
              errors.push({
                row: index + 1,
                column: header,
                value,
                issue: "Expected numeric value",
              });
            }
          }

          // Enhanced date field validation
          if (dateColumns.includes(header)) {
            // Try to convert the date
            const convertedDate = parseToYYYYMMDD(value);
            if (!convertedDate) {
              errors.push({
                row: index + 1,
                column: header,
                value,
                issue:
                  "Invalid date format - please use YYYY-MM-DD, DD/MM/YYYY, or Excel date format",
              });
            }
          }
        }
      });
    });

    return { errors, warnings };
  };

  // Helper function to determine if a column should be numeric based on interface (excluding id)
  const isNumericColumn = (columnName: string, table: TableName): boolean => {
    const numericColumns: Record<TableName, string[]> = {
      [TABLES.FOM]: ["Year", "Pin code", "Quantity", "Price", "Unit Price"],
      [TABLES.LFOM]: ["Year", "Pin code", "Quantity"],
      [TABLES.MDA_CLAIM]: ["Year", "Week"],
      [TABLES.POS_LFOM]: ["Year", "Quantity", "Price"],
      [TABLES.POS_FOM]: ["Year", "Quantity", "Price", "Revenue"],
      [TABLES.STOCK]: [
        "RCF Production",
        "Boomi Samrudhi Production",
        "RCF Sales",
        "Boomi Samrudhi Sales",
        "RCF Stock Left",
        "Boomi Samrudhi Stock Left",
        "Total Stock Left",
        "RCF Price",
        "RCF Revenue",
        "Boomi Samrudhi Price",
        "Boomi Samrudhi Revenue",
      ],
      [TABLES.REVENUE]: [],
      [TABLES.CBG]: [
        "Bill.Doc",
        "Year",
        "Bill to party",
        "Revenue GL",
        "Plant",
        "Sales Order No",
        "Billing ACCT Doc No.(RV)",
        "Excise ACCT Doc No.(SA)",
        "Delivery number",
        "HSN/SAC",
        "Unit Price",
        "Actual Production in MT",
      ],
      [TABLES.APP_STATUS]: [],
    };

    return numericColumns[table]?.includes(columnName) || false;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setParsedData([]);
      setHeaders([]);
      setValidationErrors([]);
      setValidationWarnings([]);
      setStep("1_select");
    }
  };

  const handleParseFile = async () => {
    if (!file) return;

    setIsParsing(true);
    setError(null);
    setParsedData([]);
    setHeaders([]);
    setValidationErrors([]);
    setValidationWarnings([]);

    try {
      let results: ParserResult;
      if (file.type === "text/csv") {
        results = await parseCSV(file);
      } else if (
        file.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel"
      ) {
        results = await parseXLSX(file);
      } else {
        throw new Error("Unsupported file type. Please upload CSV or XLSX.");
      }

      if (results.data.length === 0 || results.meta.fields.length === 0) {
        throw new Error("File is empty or headers could not be read.");
      }

      // Transform the data to convert dates
      const transformedData = transformData(results.data);

      // Validate the transformed data
      const { errors, warnings } = validateData(
        transformedData,
        results.meta.fields
      );

      setParsedData(transformedData);
      setHeaders(results.meta.fields);
      setValidationErrors(errors);
      setValidationWarnings(warnings);
      setStep("2_preview");
    } catch (err: any) {
      console.error("Parsing error:", err);
      setError(
        err.message || "An unknown error occurred while parsing the file."
      );
      setStep("1_select");
    } finally {
      setIsParsing(false);
    }
  };

  const handleUpload = async () => {
    if (parsedData.length === 0) {
      setError("No data to upload.");
      return;
    }

    if (validationErrors.length > 0) {
      setError("Please fix validation errors before uploading.");
      return;
    }

    setStep("3_uploading");
    setError(null);
    setUploadProgress(0);

    const totalRecords = parsedData.length;

    try {
      // Remove 'id' column from data before upload (if present)
      const cleanedData = parsedData.map((row) => {
        const { id, ...cleanRow } = row;
        return cleanRow;
      });

      for (let i = 0; i < totalRecords; i += CHUNK_SIZE) {
        const chunk = cleanedData.slice(i, i + CHUNK_SIZE);
        const result = await DatabaseService.insertBatch(tableName, chunk);

        if (result.error) {
          setError(
            `Failed to upload chunk ${i / CHUNK_SIZE + 1}: ${
              result.error.message
            }`
          );
          setStep("2_preview");
          return;
        }
        setUploadProgress(
          Math.min(((i + CHUNK_SIZE) / totalRecords) * 100, 100)
        );
      }
      setStep("4_complete");
    } catch (err: any) {
      setError(`Upload failed: ${err.message}`);
      setStep("2_preview");
    }
  };

  const handleDone = () => {
    onSuccess();
    onClose();
  };

  const renderValidationSummary = () => {
    if (validationErrors.length === 0 && validationWarnings.length === 0) {
      return (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              Data validation passed successfully
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-4 space-y-3">
        {validationWarnings.length > 0 && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Warnings ({validationWarnings.length})
                </h4>
                <ul className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  {validationWarnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {validationErrors.length > 0 && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Errors ({validationErrors.length}) - Must be fixed before
                  upload
                </h4>
                <div className="mt-2 max-h-32 overflow-y-auto">
                  <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                    {validationErrors.slice(0, 10).map((error, index) => (
                      <li key={index}>
                        • Row {error.row}, Column "{error.column}":{" "}
                        {error.issue}
                        {error.value && ` (Value: "${error.value}")`}
                      </li>
                    ))}
                    {validationErrors.length > 10 && (
                      <li className="font-medium">
                        ... and {validationErrors.length - 10} more errors
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPreviewTable = () => (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Data Preview (First 50 Rows)
        </h3>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {parsedData.length} records found
        </span>
      </div>

      {renderValidationSummary()}

      <div className="mt-4 max-h-64 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
            <tr>
              {headers.map((header) => {
                const isIdColumn = header.toLowerCase() === "id";
                const isDateColumn = dateColumns.includes(header);
                return (
                  <th
                    key={header}
                    scope="col"
                    className={`px-4 py-2 text-left text-xs font-medium uppercase tracking-wider ${
                      isIdColumn
                        ? "text-gray-400 dark:text-gray-500"
                        : expectedColumns.includes(header)
                        ? "text-green-600 dark:text-green-400"
                        : "text-yellow-600 dark:text-yellow-400"
                    }`}
                  >
                    {header}
                    {isDateColumn && (
                      <span
                        className="ml-1"
                        title="Date column - automatically converted to YYYY-MM-DD format"
                      >
                        📅
                      </span>
                    )}
                    {isIdColumn && (
                      <span
                        className="ml-1"
                        title="This column will be ignored (auto-generated)"
                      >
                        🚫
                      </span>
                    )}
                    {!expectedColumns.includes(header) && !isIdColumn && (
                      <span
                        className="ml-1"
                        title="Column not in expected schema"
                      >
                        ⚠️
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {parsedData.slice(0, 50).map((row, rowIndex) => {
              const hasError = validationErrors.some(
                (err) => err.row === rowIndex + 1
              );
              return (
                <tr
                  key={rowIndex}
                  className={`${
                    hasError
                      ? "bg-red-50 dark:bg-red-900/20"
                      : rowIndex % 2 === 0
                      ? "bg-white dark:bg-gray-900"
                      : "bg-gray-50 dark:bg-gray-800/50"
                  }`}
                >
                  {headers.map((header) => {
                    const cellError = validationErrors.find(
                      (err) =>
                        err.row === rowIndex + 1 &&
                        (err.column === header || err.column === "all")
                    );
                    const isIdColumn = header.toLowerCase() === "id";
                    const isDateColumn = dateColumns.includes(header);

                    return (
                      <td
                        key={`${rowIndex}-${header}`}
                        className={`px-4 py-2 whitespace-nowrap text-sm ${
                          isIdColumn
                            ? "text-gray-400 dark:text-gray-500"
                            : cellError
                            ? "text-red-600 dark:text-red-400 font-medium"
                            : isDateColumn
                            ? "text-blue-600 dark:text-blue-400 font-medium"
                            : "text-gray-600 dark:text-gray-300"
                        }`}
                        title={
                          isIdColumn
                            ? "This column will be ignored (auto-generated)"
                            : isDateColumn
                            ? "Date converted to YYYY-MM-DD format"
                            : cellError
                            ? cellError.issue
                            : undefined
                        }
                      >
                        {String(row[header] === null ? "NULL" : row[header])}
                        {cellError && !isIdColumn && (
                          <span className="ml-1">⚠️</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (step) {
      case "1_select":
        return (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/50">
              <UploadCloud className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="mt-3 text-center sm:mt-4">
              <h3 className="text-xl font-semibold leading-6 text-gray-900 dark:text-gray-100">
                Bulk Upload to {tableName}
              </h3>
              <div className="mt-3">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Upload CSV or XLSX files with your data. We'll validate the
                  format and show you a preview before importing.
                </p>

                {/* Info about ID column and date format */}
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                    {dateColumns.length > 0 && (
                      <p>
                        <strong>Date Format:</strong> Dates in columns{" "}
                        {dateColumns.map((col) => `"${col}"`).join(", ")} will
                        be automatically converted to YYYY-MM-DD format.
                      </p>
                    )}
                  </div>
                </div>

                <input
                  type="file"
                  id="file-upload"
                  className="sr-only"
                  accept=".csv, .xlsx"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 px-6 py-10 flex flex-col items-center justify-center hover:border-primary-500 dark:hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200"
                >
                  {file ? (
                    <div className="text-center">
                      <FileText className="h-10 w-10 text-primary-500 mx-auto mb-1" />
                      <p className="font-semibold text-gray-800 dark:text-gray-200 text-lg">
                        {file.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.size)}
                      </p>
                      <span className="text-sm text-primary-600 dark:text-primary-400 mt-1 block">
                        Click to change file
                      </span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <UploadCloud className="h-10 w-10 text-gray-400 mx-auto mb-1" />
                      <p className="text-gray-600 dark:text-gray-300 text-lg">
                        <span className="font-semibold text-primary-600 dark:text-primary-400">
                          Click to upload
                        </span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        CSV or XLSX files up to 10MB
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </>
        );
      case "2_preview":
        return (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/50">
              <FileText className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="mt-3 text-center sm:mt-4">
              <h3 className="text-xl font-semibold leading-6 text-gray-900 dark:text-gray-100">
                Review & Validate Data
              </h3>
            </div>
            {renderPreviewTable()}
          </>
        );
      case "3_uploading":
        return (
          <div className="text-center py-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/50 dark:to-primary-800/50 mb-6">
              <Loader2 className="h-8 w-8 text-primary-600 dark:text-primary-400 animate-spin" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Uploading Your Data
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Processing {parsedData.length.toLocaleString()} records for{" "}
              {tableName}...
            </p>
            <div className="w-full max-w-md mx-auto">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-200 mt-3">
                {Math.round(uploadProgress)}%
              </p>
            </div>
          </div>
        );
      case "4_complete":
        return (
          <div className="text-center py-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 mb-6">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Upload Successful!
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Successfully imported {parsedData.length.toLocaleString()} records
              into {tableName} with proper date formatting.
            </p>
          </div>
        );
    }
  };

  const renderFooterButtons = () => {
    switch (step) {
      case "1_select":
        return (
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              type="button"
              className="btn-secondary w-full sm:w-auto"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary w-full sm:w-auto flex items-center justify-center"
              disabled={!file || isParsing}
              onClick={handleParseFile}
            >
              {isParsing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Parsing...
                </>
              ) : (
                "Parse & Preview File"
              )}
            </button>
          </div>
        );
      case "2_preview":
        return (
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              type="button"
              className="btn-secondary w-full sm:w-auto"
              onClick={() => setStep("1_select")}
            >
              Back
            </button>
            <button
              type="button"
              className={`w-full sm:w-auto flex items-center justify-center ${
                validationErrors.length > 0
                  ? "bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
                  : "btn-primary"
              }`}
              disabled={validationErrors.length > 0}
              onClick={handleUpload}
            >
              {validationErrors.length > 0 ? (
                <>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Fix Errors First
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Upload to Database
                </>
              )}
            </button>
          </div>
        );
      case "3_uploading":
        return null;
      case "4_complete":
        return (
          <button
            type="button"
            className="btn-primary w-full flex items-center justify-center"
            onClick={handleDone}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Done
          </button>
        );
    }
  };

  return (
    <div
      className="relative z-50"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Enhanced backdrop with blur */}
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" />

      {/* Modal positioning - accounts for sidebar */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          {/* Responsive modal container */}
          <div className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl transition-all">
            {/* Close button */}
            <div className="absolute top-4 right-4 z-10">
              <button
                type="button"
                className="rounded-full bg-gray-100 dark:bg-gray-700 p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal content */}
            <div className="px-6 pt-5 pb-5 sm:px-8">
              {renderStepContent()}

              {/* Error display */}
              {error && (
                <div className="mt-6 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                        Upload Error
                      </h3>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 sm:px-8">
              {renderFooterButtons()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
