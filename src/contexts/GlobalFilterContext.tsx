import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useGlobalFilters } from '../hooks/useGlobalFilters';
import { GlobalFilters, FilterState } from '../types/filters';
import { FlexibleDataRow } from '../types';
import { useApp } from './AppContext';

interface GlobalFilterContextType {
  filterState: FilterState;
  updateFilters: (filters: Partial<GlobalFilters>) => void;
  clearFilters: () => void;
  resetFilter: (filterType: keyof GlobalFilters) => void;
  getFilteredData: (data: FlexibleDataRow[]) => FlexibleDataRow[];
  hasActiveFilters: boolean;
  availableOptions: FilterState['availableOptions'];
}

const GlobalFilterContext = createContext<GlobalFilterContextType | undefined>(undefined);

interface GlobalFilterProviderProps {
  children: ReactNode;
}

export function GlobalFilterProvider({ children }: GlobalFilterProviderProps) {
  const { state, setFilters } = useApp();
  
  const {
    filterState,
    updateFilters,
    clearFilters,
    resetFilter,
    getFilteredData,
    hasActiveFilters,
    availableOptions
  } = useGlobalFilters(state.data);

  // Sync global filters with app context when filters change
  useEffect(() => {
    if (filterState.filters.isActive) {
      const filteredData = getFilteredData(state.data);
      
      // Update the app context with filtered data
      setFilters({
        dateRange: {
          start: filterState.filters.dateRange.startDate,
          end: filterState.filters.dateRange.endDate
        },
        selectedValues: {
          ...(filterState.filters.months.selectedMonths.length > 0 && {
            Month: filterState.filters.months.selectedMonths
          }),
          ...(filterState.filters.buyerTypes.selectedTypes.length > 0 && {
            'Buyer Type': filterState.filters.buyerTypes.selectedTypes
          })
        },
        selectedProducts: [],
        selectedPlants: [],
        selectedFactories: [],
        drillDownFilters: state.filters.drillDownFilters
      });
    } else {
      // Clear filters in app context
      setFilters({
        dateRange: { start: '', end: '' },
        selectedValues: {},
        selectedProducts: [],
        selectedPlants: [],
        selectedFactories: [],
        drillDownFilters: state.filters.drillDownFilters
      });
    }
  }, [filterState.filters, getFilteredData, state.data, state.filters.drillDownFilters, setFilters]);

  const contextValue: GlobalFilterContextType = {
    filterState,
    updateFilters,
    clearFilters,
    resetFilter,
    getFilteredData,
    hasActiveFilters,
    availableOptions
  };

  return (
    <GlobalFilterContext.Provider value={contextValue}>
      {children}
    </GlobalFilterContext.Provider>
  );
}

export function useGlobalFilterContext() {
  const context = useContext(GlobalFilterContext);
  if (!context) {
    throw new Error('useGlobalFilterContext must be used within a GlobalFilterProvider');
  }
  return context;
}