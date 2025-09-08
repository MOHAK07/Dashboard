import { useState, useEffect, useCallback, useMemo } from 'react';
import { GlobalFilters, FilterValidationResult, FilterState, DEFAULT_GLOBAL_FILTERS, MONTHS, BUYER_TYPES } from '../types/filters';
import { FlexibleDataRow } from '../types';
import { DataProcessor } from '../utils/dataProcessing';

export function useGlobalFilters(data: FlexibleDataRow[]) {
  const [filterState, setFilterState] = useState<FilterState>({
    filters: DEFAULT_GLOBAL_FILTERS,
    isLoading: false,
    error: null,
    availableOptions: {
      dateRange: { min: '', max: '' },
      months: [],
      buyerTypes: []
    }
  });

  // Calculate available filter options based on current data
  const availableOptions = useMemo(() => {
    // Get date range from data
    const dateRange = data.length > 0 ? DataProcessor.getDateRange(data) : { start: '', end: '' };
    
    // Always show all 12 months regardless of data
    const availableMonths = [...MONTHS];

    // Get available buyer types from data
    const availableBuyerTypes = data.length > 0 ? (() => {
      const buyerTypeColumn = Object.keys(data[0]).find(col => {
        const lowerCol = col.toLowerCase().replace(/\s+/g, '');
        return lowerCol.includes('buyer') && lowerCol.includes('type');
      });
      
      return buyerTypeColumn 
        ? [...new Set(data.map(row => String(row[buyerTypeColumn] || '')).filter(Boolean))]
          .map(type => type.toUpperCase().trim())
          .filter(type => BUYER_TYPES.includes(type as any)) as ('B2B' | 'B2C')[]
        : [...BUYER_TYPES];
    })() : [...BUYER_TYPES];

    return {
      dateRange,
      months: availableMonths,
      buyerTypes: availableBuyerTypes
    };
  }, [data]);

  // Update available options when data changes
  useEffect(() => {
    setFilterState(prev => ({
      ...prev,
      availableOptions
    }));
  }, [availableOptions]);

  // Validate filters
  const validateFilters = useCallback((filters: GlobalFilters): FilterValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate date range
    if (filters.dateRange.startDate && filters.dateRange.endDate) {
      const startDate = new Date(filters.dateRange.startDate);
      const endDate = new Date(filters.dateRange.endDate);
      
      if (startDate > endDate) {
        errors.push('Start date cannot be after end date');
      }
      
      const { min, max } = availableOptions.dateRange;
      if (min && max) {
        const minDate = new Date(min);
        const maxDate = new Date(max);
        
        if (startDate < minDate || endDate > maxDate) {
          warnings.push(`Date range is outside available data range (${min} to ${max})`);
        }
      }
    }

    // Validate months
    if (filters.months.selectedMonths.length > 0) {
      const invalidMonths = filters.months.selectedMonths.filter(
        month => !availableOptions.months.includes(month)
      );
      
      if (invalidMonths.length > 0) {
        warnings.push(`Some selected months are not available in current data: ${invalidMonths.join(', ')}`);
      }
    }

    // Validate buyer types
    if (filters.buyerTypes.selectedTypes.length > 0) {
      const invalidTypes = filters.buyerTypes.selectedTypes.filter(
        type => !availableOptions.buyerTypes.includes(type)
      );
      
      if (invalidTypes.length > 0) {
        warnings.push(`Some selected buyer types are not available in current data: ${invalidTypes.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, [availableOptions]);

  // Apply filters to data
  const applyFilters = useCallback((data: FlexibleDataRow[], filters: GlobalFilters): FlexibleDataRow[] => {
    if (!filters.isActive) return data;
    if (data.length === 0) return data;

    let filteredData = [...data];

    try {
      // Apply date range filter
      if (filters.dateRange.startDate && filters.dateRange.endDate) {
        const dateColumn = Object.keys(data[0]).find(col => 
          col.toLowerCase() === 'date' || col.toLowerCase().includes('date')
        );
        
        if (dateColumn) {
          const startDate = new Date(filters.dateRange.startDate);
          const endDate = new Date(filters.dateRange.endDate);
          
          filteredData = filteredData.filter(row => {
            const dateValue = row[dateColumn];
            if (!dateValue) return false;
            
            // Enhanced date parsing
            let dateStr = String(dateValue);
            
            // Handle MM/DD/YYYY and DD/MM/YYYY formats
            if (dateStr.includes('/')) {
              const parts = dateStr.split('/');
              if (parts.length === 3) {
                let month, day, year;
                if (parseInt(parts[0]) > 12) {
                  // DD/MM/YYYY format
                  [day, month, year] = parts;
                } else {
                  // MM/DD/YYYY format
                  [month, day, year] = parts;
                }
                if (year.length === 2) {
                  year = '20' + year;
                }
                dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              }
            }
            
            // Handle DD-MM-YYYY format
            if (dateStr.includes('-') && dateStr.split('-')[0].length <= 2) {
              const parts = dateStr.split('-');
              if (parts.length === 3) {
                const [day, month, year] = parts;
                const fullYear = year.length === 2 ? '20' + year : year;
                dateStr = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              }
            }
            
            const rowDate = new Date(dateStr);
            if (isNaN(rowDate.getTime())) return false;
            
            return rowDate >= startDate && rowDate <= endDate;
          });
        }
      }

      // Apply month filter
      if (filters.months.selectedMonths.length > 0) {
        const monthColumn = Object.keys(data[0] || {}).find(col => 
          col.toLowerCase() === 'month' || col.toLowerCase().includes('month')
        );
        
        if (monthColumn) {
          filteredData = filteredData.filter(row => {
            const monthValue = String(row[monthColumn] || '').trim();
            return filters.months.selectedMonths.includes(monthValue);
          });
        }
      }

      // Apply buyer type filter
      if (filters.buyerTypes.selectedTypes.length > 0) {
        const buyerTypeColumn = Object.keys(data[0] || {}).find(col => {
          const lowerCol = col.toLowerCase().replace(/\s+/g, '');
          return lowerCol.includes('buyer') && lowerCol.includes('type');
        });
        
        if (buyerTypeColumn) {
          filteredData = filteredData.filter(row => {
            const buyerType = String(row[buyerTypeColumn] || '').toUpperCase().trim();
            return filters.buyerTypes.selectedTypes.includes(buyerType as 'B2B' | 'B2C');
          });
        }
      }

    } catch (error) {
      console.error('Error applying filters:', error);
      setFilterState(prev => ({
        ...prev,
        error: 'Failed to apply filters'
      }));
      return data;
    }

    return filteredData;
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<GlobalFilters>) => {
    setFilterState(prev => {
      const updatedFilters = {
        ...prev.filters,
        ...newFilters,
        isActive: true
      };
      
      const validation = validateFilters(updatedFilters);
      
      return {
        ...prev,
        filters: updatedFilters,
        error: validation.isValid ? null : validation.errors.join(', ')
      };
    });
  }, [validateFilters]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilterState(prev => ({
      ...prev,
      filters: DEFAULT_GLOBAL_FILTERS,
      error: null
    }));
  }, []);

  // Reset specific filter type
  const resetFilter = useCallback((filterType: keyof GlobalFilters) => {
    setFilterState(prev => {
      const updatedFilters = { ...prev.filters };
      
      switch (filterType) {
        case 'dateRange':
          updatedFilters.dateRange = { startDate: '', endDate: '' };
          break;
        case 'months':
          updatedFilters.months = { selectedMonths: [] };
          break;
        case 'buyerTypes':
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
        error: null
      };
    });
  }, []);

  // Get filtered data
  const getFilteredData = useCallback((sourceData: FlexibleDataRow[]) => {
    return applyFilters(sourceData, filterState.filters);
  }, [applyFilters, filterState.filters]);

  // Check if filters are active
  const hasActiveFilters = useMemo(() => {
    return filterState.filters.isActive && (
      filterState.filters.dateRange.startDate ||
      filterState.filters.dateRange.endDate ||
      filterState.filters.months.selectedMonths.length > 0 ||
      filterState.filters.buyerTypes.selectedTypes.length > 0
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
    availableOptions: filterState.availableOptions
  };
}