import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppState, DataRow, FilterState, UserSettings, TabType, Dataset, BrushSelection, ChartAnnotation } from '../types';

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  setData: (data: DataRow[]) => void;
  addDataset: (dataset: Dataset) => void;
  removeDataset: (datasetId: string) => void;
  setActiveDataset: (datasetId: string) => void;
  mergeDatasets: (primaryId: string, secondaryId: string, joinKey: keyof DataRow) => void;
  setBrushSelection: (selection: BrushSelection | null) => void;
  addChartAnnotation: (annotation: Omit<ChartAnnotation, 'id' | 'timestamp'>) => void;
  removeChartAnnotation: (annotationId: string) => void;
  setFilters: (filters: FilterState) => void;
  setActiveTab: (tab: TabType) => void;
  setSettings: (settings: UserSettings) => void;
  applyFilters: () => void;
  addDrillDownFilter: (key: string, value: any) => void;
  clearDrillDownFilters: () => void;
  saveFilterSet: (name: string) => void;
  loadFilterSet: (id: string) => void;
  deleteFilterSet: (id: string) => void;
  loadSampleData: () => void;
}

type AppAction = 
  | { type: 'SET_DATA'; payload: DataRow[] }
  | { type: 'ADD_DATASET'; payload: Dataset }
  | { type: 'REMOVE_DATASET'; payload: string }
  | { type: 'SET_ACTIVE_DATASET'; payload: string }
  | { type: 'SET_BRUSH_SELECTION'; payload: BrushSelection | null }
  | { type: 'ADD_CHART_ANNOTATION'; payload: ChartAnnotation }
  | { type: 'REMOVE_CHART_ANNOTATION'; payload: string }
  | { type: 'SET_FILTERED_DATA'; payload: DataRow[] }
  | { type: 'SET_FILTERS'; payload: FilterState }
  | { type: 'SET_ACTIVE_TAB'; payload: TabType }
  | { type: 'SET_SETTINGS'; payload: UserSettings }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'APPLY_FILTERS' }
  | { type: 'ADD_DRILL_DOWN_FILTER'; payload: { key: string; value: any } }
  | { type: 'CLEAR_DRILL_DOWN_FILTERS' }
  | { type: 'SET_SAMPLE_DATA_LOADED'; payload: boolean }
  | { type: 'SET_CHART_INTERACTION'; payload: { key: string; value: any } };

const initialState: AppState = {
  data: [],
  filteredData: [],
  datasets: [],
  activeDatasetId: null,
  chartInteractionMode: 'normal',
  brushSelection: null,
  chartAnnotations: [],
  filters: {
    dateRange: { start: '', end: '' },
    selectedProducts: [],
    selectedPlants: [],
    selectedFactories: [],
    drillDownFilters: {},
  },
  settings: {
    theme: 'light', 
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
  chartInteractions: {},
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_DATA':
      return {
        ...state,
        data: action.payload,
        filteredData: action.payload,
      };
    case 'ADD_DATASET':
      const newDatasets = [...state.datasets, action.payload];
      return {
        ...state,
        datasets: newDatasets,
        activeDatasetId: action.payload.id,
        data: action.payload.data,
        filteredData: action.payload.data,
      };
    case 'REMOVE_DATASET':
      const remainingDatasets = state.datasets.filter(d => d.id !== action.payload);
      const wasActive = state.activeDatasetId === action.payload;
      const newActiveId = wasActive && remainingDatasets.length > 0 ? remainingDatasets[0].id : state.activeDatasetId;
      const newActiveDataset = remainingDatasets.find(d => d.id === newActiveId);
      
      return {
        ...state,
        datasets: remainingDatasets,
        activeDatasetId: remainingDatasets.length > 0 ? newActiveId : null,
        data: newActiveDataset?.data || [],
        filteredData: newActiveDataset?.data || [],
      };
    case 'SET_ACTIVE_DATASET':
      const activeDataset = state.datasets.find(d => d.id === action.payload);
      return {
        ...state,
        activeDatasetId: action.payload,
        data: activeDataset?.data || [],
        filteredData: activeDataset?.data || [],
      };
    case 'SET_BRUSH_SELECTION':
      return {
        ...state,
        brushSelection: action.payload,
      };
    case 'ADD_CHART_ANNOTATION':
      return {
        ...state,
        chartAnnotations: [...state.chartAnnotations, action.payload],
      };
    case 'REMOVE_CHART_ANNOTATION':
      return {
        ...state,
        chartAnnotations: state.chartAnnotations.filter(a => a.id !== action.payload),
      };
    case 'SET_FILTERED_DATA':
      return {
        ...state,
        filteredData: action.payload,
      };
    case 'SET_FILTERS':
      return {
        ...state,
        filters: action.payload,
      };
    case 'SET_ACTIVE_TAB':
      return {
        ...state,
        activeTab: action.payload,
      };
    case 'SET_SETTINGS':
      return {
        ...state,
        settings: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case 'APPLY_FILTERS':
      const filtered = applyFiltersToData(state.data, state.filters);
      return {
        ...state,
        filteredData: filtered,
      };
    case 'ADD_DRILL_DOWN_FILTER':
      return {
        ...state,
        filters: {
          ...state.filters,
          drillDownFilters: {
            ...state.filters.drillDownFilters,
            [action.payload.key]: action.payload.value,
          },
        },
      };
    case 'CLEAR_DRILL_DOWN_FILTERS':
      return {
        ...state,
        filters: {
          ...state.filters,
          drillDownFilters: {},
        },
      };
    case 'SET_SAMPLE_DATA_LOADED':
      return {
        ...state,
        sampleDataLoaded: action.payload,
      };
    case 'SET_CHART_INTERACTION':
      return {
        ...state,
        chartInteractions: {
          ...state.chartInteractions,
          [action.payload.key]: action.payload.value,
        },
      };
    default:
      return state;
  }
}

function applyFiltersToData(data: DataRow[], filters: FilterState): DataRow[] {
  return data.filter(row => {
    // Date range filter
    if (filters.dateRange.start && filters.dateRange.end) {
      const rowDate = new Date(row.Date);
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      if (rowDate < startDate || rowDate > endDate) return false;
    }

    // Product filter
    if (filters.selectedProducts.length > 0 && !filters.selectedProducts.includes(row.ProductName)) {
      return false;
    }

    // Plant filter
    if (filters.selectedPlants.length > 0 && !filters.selectedPlants.includes(row.PlantName)) {
      return false;
    }

    // Factory filter
    if (filters.selectedFactories.length > 0 && !filters.selectedFactories.includes(row.FactoryName)) {
      return false;
    }

    // Drill-down filters
    for (const [key, value] of Object.entries(filters.drillDownFilters)) {
      if (value && row[key as keyof DataRow] !== value) {
        return false;
      }
    }
    return true;
  });
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load settings and datasets from localStorage/sessionStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('dashboard-settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        dispatch({ type: 'SET_SETTINGS', payload: { ...initialState.settings, ...settings } });
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }

    // Load datasets from sessionStorage if available
    const savedDatasets = sessionStorage.getItem('dashboard-datasets');
    if (savedDatasets) {
      try {
        const datasets = JSON.parse(savedDatasets);
        if (Array.isArray(datasets) && datasets.length > 0) {
          // Set datasets and active dataset
          datasets.forEach(ds => dispatch({ type: 'ADD_DATASET', payload: ds }));
        }
      } catch (error) {
        console.error('Failed to load saved datasets:', error);
      }
    }

    // Load data from sessionStorage if available (legacy, for current dataset)
    const savedData = sessionStorage.getItem('dashboard-data');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        dispatch({ type: 'SET_DATA', payload: data });
      } catch (error) {
        console.error('Failed to load saved data:', error);
      }
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('dashboard-settings', JSON.stringify(state.settings));
  }, [state.settings]);

  // Save data to sessionStorage when it changes (legacy, for current dataset)
  useEffect(() => {
    if (state.data.length > 0) {
      sessionStorage.setItem('dashboard-data', JSON.stringify(state.data));
    }
  }, [state.data]);

  // Save datasets to sessionStorage when they change
  useEffect(() => {
    if (state.datasets.length > 0) {
      sessionStorage.setItem('dashboard-datasets', JSON.stringify(state.datasets));
    } else {
      sessionStorage.removeItem('dashboard-datasets');
    }
  }, [state.datasets]);

  // Apply theme changes to document
  useEffect(() => {
    const root = document.documentElement;
    if (state.settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.settings.theme]);

  const setData = (data: DataRow[]) => {
    dispatch({ type: 'SET_DATA', payload: data });
  };

  const addDataset = (dataset: Dataset) => {
    dispatch({ type: 'ADD_DATASET', payload: dataset });
  };

  const removeDataset = (datasetId: string) => {
    dispatch({ type: 'REMOVE_DATASET', payload: datasetId });
  };

  const setActiveDataset = (datasetId: string) => {
    dispatch({ type: 'SET_ACTIVE_DATASET', payload: datasetId });
  };

  const mergeDatasets = (primaryId: string, secondaryId: string, joinKey: keyof DataRow) => {
    const primary = state.datasets.find(d => d.id === primaryId);
    const secondary = state.datasets.find(d => d.id === secondaryId);
    
    if (!primary || !secondary) return;
    
    // Full outer join (union) - just concatenate all rows for now
    const merged = [...primary.data, ...secondary.data];
    
    const mergedDataset: Dataset = {
      id: `merged-${Date.now()}`,
      name: `${primary.name} + ${secondary.name}`,
      data: merged,
      fileName: `merged-${primary.fileName}-${secondary.fileName}`,
      fileSize: primary.fileSize + secondary.fileSize,
      uploadDate: new Date().toISOString(),
      status: 'valid',
      rowCount: merged.length,
      color: '#8b5cf6',
      preview: merged.slice(0, 5),
    };
    
    addDataset(mergedDataset);
  };

  const setBrushSelection = (selection: BrushSelection | null) => {
    dispatch({ type: 'SET_BRUSH_SELECTION', payload: selection });
  };

  const addChartAnnotation = (annotation: Omit<ChartAnnotation, 'id' | 'timestamp'>) => {
    const fullAnnotation: ChartAnnotation = {
      ...annotation,
      id: `annotation-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_CHART_ANNOTATION', payload: fullAnnotation });
  };

  const removeChartAnnotation = (annotationId: string) => {
    dispatch({ type: 'REMOVE_CHART_ANNOTATION', payload: annotationId });
  };

  const setFilters = (filters: FilterState) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
    // Auto-apply filters when they change
    setTimeout(() => {
      dispatch({ type: 'APPLY_FILTERS' });
    }, 0);
  };

  const setActiveTab = (tab: TabType) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  };

  const setSettings = (settings: UserSettings) => {
    dispatch({ type: 'SET_SETTINGS', payload: settings });
  };

  const applyFilters = () => {
    dispatch({ type: 'APPLY_FILTERS' });
  };

  const addDrillDownFilter = (key: string, value: any) => {
    dispatch({ type: 'ADD_DRILL_DOWN_FILTER', payload: { key, value } });
    setTimeout(() => {
      dispatch({ type: 'APPLY_FILTERS' });
    }, 0);
  };

  const clearDrillDownFilters = () => {
    dispatch({ type: 'CLEAR_DRILL_DOWN_FILTERS' });
    setTimeout(() => {
      dispatch({ type: 'APPLY_FILTERS' });
    }, 0);
  };

  const saveFilterSet = (name: string) => {
    const newFilterSet = {
      id: Date.now().toString(),
      name,
      filters: state.filters,
      createdAt: new Date().toISOString(),
    };
    
    const updatedSettings = {
      ...state.settings,
      savedFilterSets: [...state.settings.savedFilterSets, newFilterSet],
    };
    
    setSettings(updatedSettings);
  };

  const loadFilterSet = (id: string) => {
    const filterSet = state.settings.savedFilterSets.find(set => set.id === id);
    if (filterSet) {
      setFilters(filterSet.filters);
    }
  };

  const deleteFilterSet = (id: string) => {
    const updatedSettings = {
      ...state.settings,
      savedFilterSets: state.settings.savedFilterSets.filter(set => set.id !== id),
    };
    setSettings(updatedSettings);
  };

  const loadSampleData = () => {
    // Generate sample data
    const sampleData: DataRow[] = generateSampleData();
    dispatch({ type: 'SET_DATA', payload: sampleData });
    dispatch({ type: 'SET_SAMPLE_DATA_LOADED', payload: true });
  };
  const value: AppContextType = {
    state,
    dispatch,
    setData,
    addDataset,
    removeDataset,
    setActiveDataset,
    mergeDatasets,
    setBrushSelection,
    addChartAnnotation,
    removeChartAnnotation,
    setFilters,
    setActiveTab,
    setSettings,
    applyFilters,
    addDrillDownFilter,
    clearDrillDownFilters,
    saveFilterSet,
    loadFilterSet,
    deleteFilterSet,
    loadSampleData,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Generate sample data for demo purposes
function generateSampleData(): DataRow[] {
  const factories = ['TechCorp Manufacturing', 'Global Industries', 'Innovation Labs', 'Future Systems'];
  const plants = ['Plant Alpha', 'Plant Beta', 'Plant Gamma', 'Plant Delta', 'Plant Epsilon'];
  const products = ['Widget Pro', 'Smart Device', 'Premium Tool', 'Advanced Kit', 'Elite Series'];
  
  const data: DataRow[] = [];
  const startDate = new Date('2023-01-01');
  const endDate = new Date('2024-12-31');
  
  for (let i = 0; i < 500; i++) {
    const factory = factories[Math.floor(Math.random() * factories.length)];
    const plant = plants[Math.floor(Math.random() * plants.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    
    const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
    
    data.push({
      Date: randomDate.toISOString().split('T')[0],
      FactoryID: `F${Math.floor(Math.random() * 100).toString().padStart(3, '0')}`,
      FactoryName: factory,
      PlantID: `P${Math.floor(Math.random() * 100).toString().padStart(3, '0')}`,
      PlantName: plant,
      Latitude: 40 + Math.random() * 10,
      Longitude: -120 + Math.random() * 40,
      ProductName: product,
      UnitsSold: Math.floor(Math.random() * 1000) + 50,
      Revenue: Math.floor(Math.random() * 50000) + 5000,
    });
  }
  
  return data;
}