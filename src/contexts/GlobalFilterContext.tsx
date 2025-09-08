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
      
      // Directly update filtered data in app context
      if (JSON.stringify(filteredData) !== JSON.stringify(state.filteredData)) {
        // Use dispatch to update filtered data directly
        const event = new CustomEvent('global-filters-applied', {
          detail: { filteredData }
        });
        window.dispatchEvent(event);
      }
    } else {
      // Reset to original data when no filters are active
      if (JSON.stringify(state.data) !== JSON.stringify(state.filteredData)) {
        const event = new CustomEvent('global-filters-applied', {
          detail: { filteredData: state.data }
        });
        window.dispatchEvent(event);
      }
    }
  }, [filterState.filters, getFilteredData, state.data, state.filteredData]);

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