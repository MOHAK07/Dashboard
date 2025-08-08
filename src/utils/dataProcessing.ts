import { FlexibleDataRow } from '../types';

export class DataProcessor {
  static getUniqueValues(data: FlexibleDataRow[], column: string): string[] {
    const values = data
      .map(row => String(row[column] || ''))
      .filter(value => value && value.trim() !== '')
      .filter(Boolean);
    return [...new Set(values)].sort();
  }

  static getDateRange(data: FlexibleDataRow[]): { start: string; end: string } {
    if (data.length === 0) return { start: '', end: '' };
    
    // Try to find date column
    const dateColumn = this.findDateColumn(data);
    if (!dateColumn) return { start: '', end: '' };
    
    const dates = data
      .map(row => {
        const dateValue = row[dateColumn];
        if (!dateValue) return null;
        
        // Handle different date formats
        let dateStr = String(dateValue);
        
        // Convert MM/DD/YYYY to YYYY-MM-DD
        if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            const [month, day, year] = parts;
            dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
        }
        
        // Convert DD-MM-YYYY to YYYY-MM-DD
        if (dateStr.includes('-') && dateStr.split('-')[0].length <= 2) {
          const parts = dateStr.split('-');
          if (parts.length === 3) {
            const [day, month, year] = parts;
            dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
        }
        
        return new Date(dateStr);
      })
      .filter(date => date && !isNaN(date.getTime()))
      .sort((a, b) => a!.getTime() - b!.getTime());
    
    if (dates.length === 0) return { start: '', end: '' };
    
    return {
      start: dates[0]!.toISOString().split('T')[0],
      end: dates[dates.length - 1]!.toISOString().split('T')[0]
    };
  }

  static findDateColumn(data: FlexibleDataRow[]): string | null {
    if (data.length === 0) return null;
    
    const columns = Object.keys(data[0]);
    const dateColumns = columns.filter(col => 
      col.toLowerCase().includes('date') || 
      col.toLowerCase() === 'date'
    );
    
    return dateColumns[0] || null;
  }

  static findNumericColumns(data: FlexibleDataRow[]): string[] {
    if (data.length === 0) return [];
    
    const columns = Object.keys(data[0]);
    return columns.filter(column => {
      // Check if most values in this column are numeric
      const numericCount = data.slice(0, 10).reduce((count, row) => {
        const value = row[column];
        return count + (typeof value === 'number' || !isNaN(parseFloat(String(value))) ? 1 : 0);
      }, 0);
      
      return numericCount > 5; // More than half of sample rows are numeric
    });
  }

  static findCategoricalColumns(data: FlexibleDataRow[]): string[] {
    if (data.length === 0) return [];
    
    const columns = Object.keys(data[0]);
    const numericColumns = this.findNumericColumns(data);
    const dateColumn = this.findDateColumn(data);
    
    return columns.filter(column => 
      !numericColumns.includes(column) && 
      column !== dateColumn &&
      column.toLowerCase() !== 'address' &&
      column.toLowerCase() !== 'adress'
    );
  }

  static aggregateByCategory(data: FlexibleDataRow[], categoryColumn: string, valueColumn: string) {
    const categoryMap = new Map();
    
    data.forEach(row => {
      const category = String(row[categoryColumn] || 'Unknown');
      const value = parseFloat(String(row[valueColumn] || '0')) || 0;
      
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          name: category,
          total: 0,
          count: 0,
          average: 0,
        });
      }
      
      const categoryData = categoryMap.get(category);
      categoryData.total += value;
      categoryData.count += 1;
      categoryData.average = categoryData.total / categoryData.count;
    });
    
    return Array.from(categoryMap.values()).sort((a, b) => b.total - a.total);
  }

  static getTimeSeries(data: FlexibleDataRow[], groupBy: 'day' | 'week' | 'month' = 'month') {
    const dateColumn = this.findDateColumn(data);
    if (!dateColumn) return [];
    
    const numericColumns = this.findNumericColumns(data);
    const primaryValueColumn = numericColumns.find(col => 
      col.toLowerCase().includes('price') || 
      col.toLowerCase().includes('revenue') ||
      col.toLowerCase().includes('amount')
    ) || numericColumns[0];
    
    if (!primaryValueColumn) return [];
    
    const timeMap = new Map();
    
    data.forEach(row => {
      const dateValue = row[dateColumn];
      if (!dateValue) return;
      
      let timeKey: string;
      let dateStr = String(dateValue);
      
      // Normalize date format
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const [month, day, year] = parts;
          dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
      
      if (dateStr.includes('-') && dateStr.split('-')[0].length <= 2) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const [day, month, year] = parts;
          dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
      
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return;
      
      switch (groupBy) {
        case 'day':
          timeKey = dateStr;
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          timeKey = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          timeKey = dateStr.substring(0, 7);
          break;
        default:
          timeKey = dateStr.substring(0, 7);
      }
      
      if (!timeMap.has(timeKey)) {
        timeMap.set(timeKey, {
          date: timeKey,
          value: 0,
          count: 0,
        });
      }
      
      const timePoint = timeMap.get(timeKey);
      const value = parseFloat(String(row[primaryValueColumn] || '0')) || 0;
      timePoint.value += value;
      timePoint.count += 1;
    });
    
    return Array.from(timeMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  static calculateKPIs(data: FlexibleDataRow[]) {
    if (data.length === 0) {
      return {
        totalRecords: 0,
        totalValue: 0,
        averageValue: 0,
        uniqueCategories: 0,
      };
    }

    const numericColumns = this.findNumericColumns(data);
    const categoricalColumns = this.findCategoricalColumns(data);
    
    const primaryValueColumn = numericColumns.find(col => 
      col.toLowerCase().includes('price') || 
      col.toLowerCase().includes('revenue') ||
      col.toLowerCase().includes('amount') ||
      col.toLowerCase().includes('quantity')
    ) || numericColumns[0];

    const primaryCategoryColumn = categoricalColumns.find(col =>
      col.toLowerCase().includes('name') ||
      col.toLowerCase().includes('product') ||
      col.toLowerCase().includes('category')
    ) || categoricalColumns[0];

    const totalValue = primaryValueColumn ? 
      data.reduce((sum, row) => sum + (parseFloat(String(row[primaryValueColumn] || '0')) || 0), 0) : 0;
    
    const uniqueCategories = primaryCategoryColumn ?
      new Set(data.map(row => String(row[primaryCategoryColumn] || '')).filter(Boolean)).size : 0;

    return {
      totalRecords: data.length,
      totalValue,
      averageValue: data.length > 0 ? totalValue / data.length : 0,
      uniqueCategories,
      primaryValueColumn,
      primaryCategoryColumn,
    };
  }

  static formatCurrency(value: number, currency: string = 'INR'): string {
    if (currency === 'INR') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    
    const localeMap: { [key: string]: string } = {
      'USD': 'en-US',

  static findColumnByKeywords(data: FlexibleDataRow[], keywords: string[]): string | null {
    if (!data || data.length === 0) return null;
    
    const columns = Object.keys(data[0]);
    
    for (const keyword of keywords) {
      const found = columns.find(col => 
        col.toLowerCase().includes(keyword.toLowerCase())
      );
      if (found) return found;
    }
    
    return null;
  }
      'EUR': 'de-DE',
      'GBP': 'en-GB', 
      'JPY': 'ja-JP',
      'CAD': 'en-CA',
    };
    
    const locale = localeMap[currency] || 'en-US';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  static formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static formatPercentage(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100);
  }

  // Helper method to check if a value looks like a number
  private static looksLikeNumber(value: string): boolean {
    if (!value || value.trim() === '') return false;
    const trimmed = value.trim();
    return !isNaN(parseFloat(trimmed)) && isFinite(parseFloat(trimmed));
  }

  // Helper method to identify numeric columns
  private static isNumericColumn(columnName: string): boolean {
    const numericKeywords = [
      'quantity', 'price', 'revenue', 'amount', 'total', 'sum', 'count',
      'production', 'sales', 'stock', 'left', 'units', 'value', 'cost',
      'latitude', 'longitude', 'week', 'year', 'code'
    ];
    
    const lowerColumn = columnName.toLowerCase();
    return numericKeywords.some(keyword => lowerColumn.includes(keyword));
  }
}