import Papa from "papaparse";
import * as XLSX from "xlsx";
import { FlexibleDataRow } from "../types/index.ts";

// Define a type for the parser result for consistency
export interface ParserResult {
  data: FlexibleDataRow[];
  meta: {
    fields: string[];
  };
}

/**
 * Parses a CSV file and cleans headers.
 * @param file The CSV file to parse.
 * @returns A promise that resolves with the parsed data and cleaned headers.
 */
export const parseCSV = (file: File): Promise<ParserResult> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true, // Use the first row as headers
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const originalHeaders = (results.meta.fields || []) as string[];

          // --- HEADER CLEANING ---
          const cleanedHeaders = originalHeaders.map((h) =>
            h ? h.trim() : "unknown_header"
          );

          // Re-map the data to use the cleaned headers as keys
          const cleanedData = (results.data as FlexibleDataRow[]).map((row) => {
            const newRow: FlexibleDataRow = {};
            for (let i = 0; i < cleanedHeaders.length; i++) {
              const originalHeader = originalHeaders[i];
              const cleanedHeader = cleanedHeaders[i];
              newRow[cleanedHeader] = row[originalHeader];
            }
            return newRow;
          });

          resolve({
            data: cleanedData,
            meta: { fields: cleanedHeaders },
          });
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};

/**
 * Parses an XLSX file and cleans headers.
 * @param file The XLSX file to parse.
 * @returns A promise that resolves with the parsed data and cleaned headers.
 */
export const parseXLSX = (file: File): Promise<ParserResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const headerData = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
        })[0] as string[];

        const cleanedHeaders = headerData.map((h) =>
          h ? h.trim() : "unknown_header"
        );

        const jsonData = XLSX.utils.sheet_to_json(sheet, {
          header: cleanedHeaders,
          range: 1, // Skip the header row
          defval: null,
        }) as FlexibleDataRow[];

        resolve({
          data: jsonData,
          meta: { fields: cleanedHeaders },
        });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Parses a JSON file and cleans headers.
 * @param file The JSON file to parse.
 * @returns A promise that resolves with the parsed data and cleaned headers.
 */
export const parseJSON = (file: File): Promise<ParserResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data: FlexibleDataRow[] = JSON.parse(text);

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("JSON file is not an array or is empty.");
        }

        // --- HEADER CLEANING ---
        // Get headers from the first object and trim them
        const originalHeaders = Object.keys(data[0]);
        const cleanedHeaders = originalHeaders.map((h) =>
          h ? h.trim() : "unknown_header"
        );

        // If headers needed cleaning, remap the data
        const needsCleaning = originalHeaders.some(
          (h, i) => h !== cleanedHeaders[i]
        );

        if (needsCleaning) {
          const cleanedData = data.map((row) => {
            const newRow: FlexibleDataRow = {};
            for (let i = 0; i < cleanedHeaders.length; i++) {
              const originalHeader = originalHeaders[i];
              const cleanedHeader = cleanedHeaders[i];
              newRow[cleanedHeader] = row[originalHeader];
            }
            return newRow;
          });
          resolve({ data: cleanedData, meta: { fields: cleanedHeaders } });
        } else {
          // No cleaning needed, return as is
          resolve({ data, meta: { fields: cleanedHeaders } });
        }
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsText(file);
  });
};
