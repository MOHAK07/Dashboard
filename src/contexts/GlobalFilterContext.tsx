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
  const { state, dispatch } = useApp();
  
  const {
    filterState,
    updateFilters,
    clearFilters,
    resetFilter,
    getFilteredData,
    hasActiveFilters,
    availableOptions
  } = useGlobalFilters(state.data);

  // Apply filters whenever filter state or data changes
  useEffect(() => {
    if (state.data.length === 0) return;

    const filteredData = getFilteredData(state.data);
    
    // Update filtered data in app context
    dispatch({ type: 'SET_FILTERED_DATA', payload: filteredData });
    
    console.log('Global filters applied:', {
      originalDataLength: state.data.length,
      filteredDataLength: filteredData.length,
      activeFilters: filterState.filters,
      hasActiveFilters
    });
  }, [filterState.filters, state.data, getFilteredData, hasActiveFilters, dispatch]);

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