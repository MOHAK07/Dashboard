import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { DataRow, ValidationResult, ValidationError } from '../types';

const REQUIRED_COLUMNS = [
  'Date', 'FactoryID', 'FactoryName', 'PlantID', 'PlantName',
  'Latitude', 'Longitude', 'ProductName', 'UnitsSold', 'Revenue'
];

export class FileParser {
  static async parseFile(file: File): Promise<{ data: any[], errors: string[] }> {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'csv':
        return this.parseCSV(file);
      case 'xlsx':
      case 'xls':
        return this.parseExcel(file);
      case 'json':
        return this.parseJSON(file);
      default:
        throw new Error(`Unsupported file type: ${extension}`);
    }
  }

  private static parseCSV(file: File): Promise<{ data: any[], errors: string[] }> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
        transform: (value: string, header: string) => {
          // Transform numeric columns
          if (['UnitsSold', 'Revenue', 'Latitude', 'Longitude'].includes(header)) {
            const num = parseFloat(value);
            return isNaN(num) ? value : num;
          }
          return value.trim();
        },
        complete: (results) => {
          resolve({
            data: results.data,
            errors: results.errors.map(error => error.message)
          });
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        }
      });
    });
  }

  private static parseExcel(file: File): Promise<{ data: any[], errors: string[] }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: ''
          });

          if (jsonData.length === 0) {
            reject(new Error('Excel file is empty'));
            return;
          }

          // Convert to object format with headers
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1).map(row => {
            const obj: any = {};
            headers.forEach((header, index) => {
              const value = (row as any[])[index];
              // Transform numeric columns
              if (['UnitsSold', 'Revenue', 'Latitude', 'Longitude'].includes(header)) {
                obj[header] = typeof value === 'number' ? value : parseFloat(value) || 0;
              } else {
                obj[header] = value || '';
              }
            });
            return obj;
          });

          resolve({
            data: rows,
            errors: []
          });
        } catch (error) {
          reject(new Error(`Excel parsing error: ${error}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read Excel file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  private static parseJSON(file: File): Promise<{ data: any[], errors: string[] }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const data = JSON.parse(text);
          
          if (!Array.isArray(data)) {
            reject(new Error('JSON file must contain an array of objects'));
            return;
          }

          resolve({
            data,
            errors: []
          });
        } catch (error) {
          reject(new Error(`JSON parsing error: ${error}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read JSON file'));
      };

      reader.readAsText(file);
    });
  }

  static validateData(data: any[]): ValidationResult {
    const errors: ValidationError[] = [];
    const validRowsData: DataRow[] = [];
    
    if (data.length === 0) {
      return {
        isValid: false,
        totalRows: 0,
        validRows: 0,
        errors: [{ row: 0, column: 'general', message: 'No data found', severity: 'error' }],
        missingColumns: REQUIRED_COLUMNS,
        summary: {
          message: '❌ No data found in file',
          type: 'error'
        },
        validData: [],
      };
    }

    // Check for missing columns
    const firstRow = data[0];
    const presentColumns = Object.keys(firstRow);
    const missingColumns = REQUIRED_COLUMNS.filter(col => !presentColumns.includes(col));

    if (missingColumns.length > 0) {
      return {
        isValid: false,
        totalRows: data.length,
        validRows: 0,
        errors: missingColumns.map(col => ({
          row: 0,
          column: col,
          message: `Required column '${col}' not found`,
          severity: 'error' as const
        })),
        missingColumns,
        summary: {
          message: `❌ Missing required columns: ${missingColumns.join(', ')}`,
          type: 'error'
        },
        validData: [],
      };
    }

    // Validate each row
    data.forEach((row, index) => {
      const rowNumber = index + 1;
      let isRowValid = true;

      // Validate Date
      if (!row.Date || !this.isValidDate(row.Date)) {
        errors.push({
          row: rowNumber,
          column: 'Date',
          message: 'Invalid date format (expected YYYY-MM-DD)',
          severity: 'error'
        });
        isRowValid = false;
      }

      // Validate numeric fields
      ['UnitsSold', 'Revenue', 'Latitude', 'Longitude'].forEach(field => {
        if (row[field] === undefined || row[field] === null || row[field] === '') {
          errors.push({
            row: rowNumber,
            column: field,
            message: `Missing ${field}`,
            severity: 'warning'
          });
        } else if (isNaN(Number(row[field]))) {
          errors.push({
            row: rowNumber,
            column: field,
            message: `Invalid numeric value for ${field}`,
            severity: 'error'
          });
          isRowValid = false;
        }
      });

      // Validate required text fields
      ['FactoryID', 'FactoryName', 'PlantID', 'PlantName', 'ProductName'].forEach(field => {
        if (!row[field] || String(row[field]).trim() === '') {
          errors.push({
            row: rowNumber,
            column: field,
            message: `Missing ${field}`,
            severity: 'warning'
          });
        }
      });

      if (isRowValid) {
        validRowsData.push({
          Date: row.Date,
          FactoryID: String(row.FactoryID),
          FactoryName: String(row.FactoryName),
          PlantID: String(row.PlantID),
          PlantName: String(row.PlantName),
          Latitude: Number(row.Latitude),
          Longitude: Number(row.Longitude),
          ProductName: String(row.ProductName),
          UnitsSold: Number(row.UnitsSold),
          Revenue: Number(row.Revenue),
        });
      }
    });

    const errorCount = errors.filter(e => e.severity === 'error').length;
    const warningCount = errors.filter(e => e.severity === 'warning').length;

    let summary;
    if (errorCount > 0) {
      summary = {
        message: `❌ ${errorCount} critical errors found. ${validRowsData.length}/${data.length} rows can be loaded.`,
        type: 'error' as const
      };
    } else if (warningCount > 0) {
      summary = {
        message: `⚠️ ${warningCount} warnings found. ${validRowsData.length}/${data.length} rows loaded successfully.`,
        type: 'warning' as const
      };
    } else {
      summary = {
        message: `✅ ${validRowsData.length} rows loaded successfully`,
        type: 'success' as const
      };
    }

    return {
      isValid: validRowsData.length > 0,
      totalRows: data.length,
      validRows: validRowsData.length,
      errors,
      missingColumns,
      summary,
      validData: validRowsData,
    };
  }

  private static isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && 
           dateString.match(/^\d{4}-\d{2}-\d{2}$/) !== null;
  }
}