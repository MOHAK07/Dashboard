import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Dataset, DataRow, FilterState } from '../types';

// Define the state interface
interface AppState {
  datasets: Dataset[];
  activeDatasetIds: string[];
  data: DataRow[];
  filteredData: DataRow[];
  filters: FilterState;
  isDatasetLibraryOpen: boolean;
  currentTab: string;
  drillDownPath: string[];
}

// Define action types
type AppAction =
  | { type: 'SET_DATASETS'; payload: Dataset[] }
  | { type: 'ADD_DATASET'; payload: Dataset }
  | { type: 'SET_ACTIVE_DATASETS'; payload: string[] }
  | { type: 'TOGGLE_DATASET_ACTIVE'; payload: string }
  | { type: 'DELETE_DATASET'; payload: string }
  | { type: 'SET_DATA'; payload: DataRow[] }
  | { type: 'SET_FILTERED_DATA'; payload: DataRow[] }
  | { type: 'SET_FILTERS'; payload: FilterState }
  | { type: 'TOGGLE_DATASET_LIBRARY' }
  | { type: 'SET_CURRENT_TAB'; payload: string }
  | { type: 'SET_DRILL_DOWN_PATH'; payload: string[] };

// Initial state
const initialState: AppState = {
  datasets: [],
  activeDatasetIds: [],
  data: [],
  filteredData: [],
  filters: {},
  isDatasetLibraryOpen: false,
  currentTab: 'overview',
  drillDownPath: [],
};

// Reducer function
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_DATASETS':
      return { ...state, datasets: action.payload };
    
    case 'ADD_DATASET':
      return { ...state, datasets: [...state.datasets, action.payload] };
    
    case 'SET_ACTIVE_DATASETS':
      return { ...state, activeDatasetIds: action.payload };
    
    case 'TOGGLE_DATASET_ACTIVE':
      const datasetId = action.payload;
      const isActive = state.activeDatasetIds.includes(datasetId);
      const newActiveIds = isActive
        ? state.activeDatasetIds.filter(id => id !== datasetId)
        : [...state.activeDatasetIds, datasetId];
      return { ...state, activeDatasetIds: newActiveIds };
    
    case 'DELETE_DATASET':
      const filteredDatasets = state.datasets.filter(d => d.id !== action.payload);
      const filteredActiveIds = state.activeDatasetIds.filter(id => id !== action.payload);
      return {
        ...state,
        datasets: filteredDatasets,
        activeDatasetIds: filteredActiveIds,
      };
    
    case 'SET_DATA':
      return { ...state, data: action.payload };
    
    case 'SET_FILTERED_DATA':
      return { ...state, filteredData: action.payload };
    
    case 'SET_FILTERS':
      return { ...state, filters: action.payload };
    
    case 'TOGGLE_DATASET_LIBRARY':
      return { ...state, isDatasetLibraryOpen: !state.isDatasetLibraryOpen };
    
    case 'SET_CURRENT_TAB':
      return { ...state, currentTab: action.payload };
    
    case 'SET_DRILL_DOWN_PATH':
      return { ...state, drillDownPath: action.payload };
    
    default:
      return state;
  }
}

// Create context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | undefined>(undefined);

// Provider component
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook to use the context
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}