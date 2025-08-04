import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Dataset, DataRow, FilterState, UserSettings, TabType } from '../types';

// Define the state interface
interface AppState {
  datasets: Dataset[];
  activeDatasetIds: string[];
  data: DataRow[];
  filteredData: DataRow[];
  filters: FilterState;
  settings: UserSettings;
  activeTab: TabType;
  isLoading: boolean;
  error: string | null;
  sampleDataLoaded: boolean;
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
  | { type: 'SET_SETTINGS'; payload: UserSettings }
  | { type: 'SET_ACTIVE_TAB'; payload: TabType }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOAD_SAMPLE_DATA' };

// Initial state
const initialState: AppState = {
  datasets: [],
  activeDatasetIds: [],
  data: [],
  filteredData: [],
  filters: {
    dateRange: { start: '', end: '' },
    selectedProducts: [],
    selectedPlants: [],
    selectedFactories: [],
    drillDownFilters: {},
  },
  settings: {
    theme: 'light' as 'light' | 'dark' | 'system',
    currency: 'INR',
    language: 'en',
    notifications: true,
    autoSave: true,
    savedFilterSets: [],
    chartPreferences: {},
  },
  activeTab: 'overview',
  isLoading: false,
  error: null,
  sampleDataLoaded: false,
};

// Helper function to combine data from active datasets
function combineActiveDatasets(datasets: Dataset[], activeDatasetIds: string[]): DataRow[] {
  if (activeDatasetIds.length === 0) return [];
  
  const activeDatasets = datasets.filter(d => activeDatasetIds.includes(d.id));
  return activeDatasets.flatMap(dataset => dataset.data);
}

// Reducer function
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_DATASETS':
      return { ...state, datasets: action.payload };
    
    case 'ADD_DATASET': {
      const newDatasets = [...state.datasets, action.payload];
      // Only activate the first dataset automatically
      const newActiveDatasetIds = state.datasets.length === 0 
        ? [action.payload.id] 
        : state.activeDatasetIds;
      const combinedData = combineActiveDatasets(newDatasets, newActiveDatasetIds);
      
      return { 
        ...state, 
        datasets: newDatasets,
        activeDatasetIds: newActiveDatasetIds,
        data: combinedData,
        filteredData: combinedData,
      };
    }
    
    case 'SET_ACTIVE_DATASETS':
      const combinedData = combineActiveDatasets(state.datasets, action.payload);
      return { 
        ...state, 
        activeDatasetIds: action.payload,
        data: combinedData,
        filteredData: combinedData,
      };
    
    case 'TOGGLE_DATASET_ACTIVE': {
      const datasetId = action.payload;
      const isActive = state.activeDatasetIds.includes(datasetId);
      const newActiveIds = isActive
        ? state.activeDatasetIds.filter(id => id !== datasetId)
        : [...state.activeDatasetIds, datasetId];
      
      const newCombinedData = combineActiveDatasets(state.datasets, newActiveIds);
      return { 
        ...state, 
        activeDatasetIds: newActiveIds,
        data: newCombinedData,
        filteredData: newCombinedData,
      };
    }
    
    case 'DELETE_DATASET': {
      const filteredDatasets = state.datasets.filter(d => d.id !== action.payload);
      const filteredActiveIds = state.activeDatasetIds.filter(id => id !== action.payload);
      const newCombinedData = combineActiveDatasets(filteredDatasets, filteredActiveIds);
      
      return {
        ...state,
        datasets: filteredDatasets,
        activeDatasetIds: filteredActiveIds,
        data: newCombinedData,
        filteredData: newCombinedData,
      };
    }
    
    case 'SET_DATA':
      return { ...state, data: action.payload };
    
    case 'SET_FILTERED_DATA':
      return { ...state, filteredData: action.payload };
    
    case 'SET_FILTERS':
      return { ...state, filters: action.payload };
    
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'LOAD_SAMPLE_DATA':
      return { ...state, sampleDataLoaded: true };
    
    default:
      return state;
  }
}

// Create context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Helper functions
  setActiveTab: (tab: TabType) => void;
  setFilters: (filters: FilterState) => void;
  setSettings: (settings: UserSettings) => void;
  toggleDatasetActive: (id: string) => void;
  removeDataset: (id: string) => void;
  getMultiDatasetData: () => Array<{
    datasetId: string;
    datasetName: string;
    data: DataRow[];
    color: string;
  }>;
  loadSampleData: () => void;
} | undefined>(undefined);

// Provider component
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Helper functions
  const setActiveTab = (tab: TabType) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  };

  const setFilters = (filters: FilterState) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  };

  const setSettings = (settings: UserSettings) => {
    dispatch({ type: 'SET_SETTINGS', payload: settings });
    
    // Apply theme immediately
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (settings.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const toggleDatasetActive = (id: string) => {
    dispatch({ type: 'TOGGLE_DATASET_ACTIVE', payload: id });
  };

  const removeDataset = (id: string) => {
    dispatch({ type: 'DELETE_DATASET', payload: id });
  };

  const getMultiDatasetData = () => {
    return state.datasets
      .filter(d => state.activeDatasetIds.includes(d.id))
      .map(dataset => ({
        datasetId: dataset.id,
        datasetName: dataset.name,
        data: dataset.data,
        color: dataset.color,
      }));
  };

  const loadSampleData = () => {
    // Generate sample data
    const sampleData: DataRow[] = [
      {
        Date: '2024-01-15',
        FactoryID: 'F001',
        FactoryName: 'TechCorp Manufacturing',
        PlantID: 'P001',
        PlantName: 'Plant Alpha',
        Latitude: 40.7128,
        Longitude: -74.0060,
        ProductName: 'Widget Pro',
        UnitsSold: 150,
        Revenue: 25000,
      },
      {
        Date: '2024-01-16',
        FactoryID: 'F002',
        FactoryName: 'Global Industries',
        PlantID: 'P002',
        PlantName: 'Plant Beta',
        Latitude: 34.0522,
        Longitude: -118.2437,
        ProductName: 'Smart Device',
        UnitsSold: 200,
        Revenue: 45000,
      },
      // Add more sample data as needed
    ];

    const sampleDataset: Dataset = {
      id: 'sample-dataset',
      name: 'Sample Dataset',
      data: sampleData,
      fileName: 'sample-data.csv',
      fileSize: 1024,
      uploadDate: new Date().toISOString(),
      status: 'valid',
      rowCount: sampleData.length,
      validationSummary: 'Sample data loaded successfully',
      color: '#3b82f6',
      preview: sampleData.slice(0, 5),
    };

    dispatch({ type: 'ADD_DATASET', payload: sampleDataset });
    dispatch({ type: 'LOAD_SAMPLE_DATA' });
  };

  return (
    <AppContext.Provider value={{ 
      state, 
      dispatch,
      setActiveTab,
      setFilters,
      setSettings,
      toggleDatasetActive,
      removeDataset,
      getMultiDatasetData,
      loadSampleData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}