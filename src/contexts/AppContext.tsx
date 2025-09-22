import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import {
  Dataset,
  FlexibleDataRow,
  FilterState,
  UserSettings,
  TabType,
} from "../types";
import { ColorManager } from "../utils/colorManager";
import { useSupabaseData } from "../hooks/useSupabaseData";
import { useRealtimeSubscriptions } from "../hooks/useRealtimeSubscriptions";
import { useAuth } from "../hooks/useAuth";
import { TableName } from "../lib/supabase";

// Define the state interface
interface AppState {
  datasets: Dataset[];
  activeDatasetIds: string[];
  data: FlexibleDataRow[];
  filteredData: FlexibleDataRow[];
  filters: FilterState;
  settings: UserSettings;
  activeTab: TabType;
  isLoading: boolean;
  error: string | null;
  isConnectedToDatabase: boolean;
  databaseError: string | null;
  user: any;
  isAuthenticated: boolean;
  isExporting: boolean;
  exportSuccessMessage: string | null;
}

// Define action types
type AppAction =
  | { type: "SET_DATASETS"; payload: Dataset[] }
  | { type: "ADD_DATASET"; payload: Dataset }
  | { type: "SET_ACTIVE_DATASETS"; payload: string[] }
  | { type: "TOGGLE_DATASET_ACTIVE"; payload: string }
  | { type: "DELETE_DATASET"; payload: string }
  | { type: "SET_DATA"; payload: FlexibleDataRow[] }
  | { type: "SET_FILTERED_DATA"; payload: FlexibleDataRow[] }
  | { type: "SET_FILTERS"; payload: FilterState }
  | { type: "SET_SETTINGS"; payload: UserSettings }
  | { type: "SET_ACTIVE_TAB"; payload: TabType }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_DATABASE_CONNECTION"; payload: boolean }
  | { type: "SET_DATABASE_ERROR"; payload: string | null }
  | { type: "SYNC_FROM_DATABASE"; payload: Dataset[] }
  | { type: "SET_USER"; payload: any }
  | { type: "SET_AUTHENTICATED"; payload: boolean }
  | { type: "RESET_STATE" } // New action to reset the state
  | { type: "SET_ACTIVE_ALL"; payload: boolean }
  | { type: "SET_EXPORTING"; payload: boolean }
  | { type: "SET_EXPORT_SUCCESS"; payload: string | null };

// Initial state
const initialState: AppState = {
  datasets: [],
  activeDatasetIds: [],
  data: [],
  filteredData: [],
  filters: {
    dateRange: { start: "", end: "" },
    selectedValues: {},
    selectedProducts: [],
    selectedPlants: [],
    selectedFactories: [],
    drillDownFilters: {},
  },
  settings: {
    theme: "light" as "light" | "dark" | "system",
    currency: "INR",
    language: "en",
    notifications: true,
    autoSave: true,
    savedFilterSets: [],
    chartPreferences: {},
  },
  activeTab: "overview",
  isLoading: false,
  error: null,
  isConnectedToDatabase: false,
  databaseError: null,
  user: null,
  isAuthenticated: false,
  isExporting: false,
  exportSuccessMessage: null,
};

// Helper function to combine data from active datasets

function combineActiveDatasets(
  datasets: Dataset[],
  activeDatasetIds: string[]
): FlexibleDataRow[] {
  if (activeDatasetIds.length === 0) return [];

  const activeDatasets = datasets.filter((d) =>
    activeDatasetIds.includes(d.id)
  );

  return activeDatasets.flatMap((dataset) =>
    dataset.data.map((row) => ({
      ...row,
      __datasetId: dataset.id,
      __datasetName: dataset.name,
      __datasetColor: dataset.color,
    }))
  );
}

// Reducer function
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_DATASETS":
      return { ...state, datasets: action.payload };

    case "ADD_DATASET": {
      const newDatasets = [...state.datasets, action.payload];
      const newActiveDatasetIds =
        state.datasets.length === 0
          ? [action.payload.id]
          : state.activeDatasetIds;
      const combinedData = combineActiveDatasets(
        newDatasets,
        newActiveDatasetIds
      );

      return {
        ...state,
        datasets: newDatasets,
        activeDatasetIds: newActiveDatasetIds,
        data: combinedData,
        filteredData: combinedData,
      };
    }

    case "SET_ACTIVE_DATASETS": {
      const combinedData = combineActiveDatasets(
        state.datasets,
        action.payload
      );
      return {
        ...state,
        activeDatasetIds: action.payload,
        data: combinedData,
        filteredData: combinedData,
      };
    }

    case "TOGGLE_DATASET_ACTIVE": {
      const datasetId = action.payload;
      const isActive = state.activeDatasetIds.includes(datasetId);
      const newActiveIds = isActive
        ? state.activeDatasetIds.filter((id) => id !== datasetId)
        : [...state.activeDatasetIds, datasetId];

      const newCombinedData = combineActiveDatasets(
        state.datasets,
        newActiveIds
      );
      return {
        ...state,
        activeDatasetIds: newActiveIds,
        data: newCombinedData,
        filteredData: newCombinedData,
      };
    }

    case "SET_ACTIVE_ALL": {
      const newActiveIds = action.payload
        ? state.datasets.map((d) => d.id)
        : [];
      const newCombinedData = combineActiveDatasets(
        state.datasets,
        newActiveIds
      );
      return {
        ...state,
        activeDatasetIds: newActiveIds,
        data: newCombinedData,
        filteredData: newCombinedData,
      };
    }

    case "DELETE_DATASET": {
      const filteredDatasets = state.datasets.filter(
        (d) => d.id !== action.payload
      );
      const filteredActiveIds = state.activeDatasetIds.filter(
        (id) => id !== action.payload
      );
      const newCombinedData = combineActiveDatasets(
        filteredDatasets,
        filteredActiveIds
      );

      return {
        ...state,
        datasets: filteredDatasets,
        activeDatasetIds: filteredActiveIds,
        data: newCombinedData,
        filteredData: newCombinedData,
      };
    }

    case "SET_DATA":
      return { ...state, data: action.payload };

    case "SET_FILTERED_DATA":
      return { ...state, filteredData: action.payload };

    case "SET_FILTERS":
      return { ...state, filters: action.payload };

    case "SET_SETTINGS":
      return { ...state, settings: action.payload };

    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.payload };

    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload };

    case "SET_DATABASE_CONNECTION":
      return { ...state, isConnectedToDatabase: action.payload };

    case "SET_DATABASE_ERROR":
      return { ...state, databaseError: action.payload };

    case "SYNC_FROM_DATABASE": {
      const databaseDatasets = action.payload;
      const newActiveIds = state.activeDatasetIds.filter((id) =>
        databaseDatasets.some((d) => d.id === id)
      );

      // If no active datasets remain, default to the first one
      if (newActiveIds.length === 0 && databaseDatasets.length > 0) {
        newActiveIds.push(databaseDatasets[0].id);
      }
      const combinedData = combineActiveDatasets(
        databaseDatasets,
        newActiveIds
      );

      return {
        ...state,
        datasets: databaseDatasets,
        activeDatasetIds: newActiveIds,
        data: combinedData,
        filteredData: combinedData,
        isConnectedToDatabase: true,
        databaseError: null,
      };
    }

    case "SET_USER":
      return { ...state, user: action.payload };

    case "SET_AUTHENTICATED":
      return { ...state, isAuthenticated: action.payload };

    case "RESET_STATE":
      sessionStorage.removeItem("dashboard-datasets");
      sessionStorage.removeItem("dashboard-data");
      sessionStorage.removeItem("dashboard-active-ids");
      return initialState;

    case "SET_EXPORTING":
      return { ...state, isExporting: action.payload };

    case "SET_EXPORT_SUCCESS":
      return { ...state, exportSuccessMessage: action.payload };

    default:
      return state;
  }
}

// Create context
const AppContext = createContext<
  | {
      state: AppState;
      dispatch: React.Dispatch<AppAction>;
      // Helper functions
      setActiveTab: (tab: TabType) => void;
      setFilters: (filters: FilterState) => void;
      setSettings: (settings: UserSettings) => void;
      toggleDatasetActive: (id: string) => void;
      toggleAllDatasetsActive: (activate: boolean) => void;
      removeDataset: (id: string) => void;
      addDrillDownFilter: (key: string, value: any) => void;
      clearDrillDownFilters: () => void;
      clearGlobalFilters: () => void;
      getMultiDatasetData: () => Array<{
        datasetId: string;
        datasetName: string;
        data: FlexibleDataRow[];
        color: string;
      }>;
      saveFilterSet: (name: string) => void;
      loadFilterSet: (id: string) => void;
      deleteFilterSet: (id: string) => void;
      mergeDatasets: (
        primaryId: string,
        secondaryId: string,
        joinKey: string
      ) => void;
      uploadToDatabase: (
        tableName: TableName,
        data: FlexibleDataRow[]
      ) => Promise<boolean>;
      syncFromDatabase: () => Promise<void>;
    }
  | undefined
>(undefined);

// Component that handles realtime subscriptions safely
function RealtimeSubscriptionHandler({ children }: { children: ReactNode }) {
  useRealtimeSubscriptions();
  return <>{children}</>;
}

// Provider component
export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const {
    datasets: supabaseDatasets,
    isLoading: supabaseLoading,
    error: supabaseError,
    refetch: refetchSupabaseData,
    uploadData,
  } = useSupabaseData(!!user);

  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load state from storage only once on initial mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("dashboard-settings");
      if (savedSettings) {
        dispatch({ type: "SET_SETTINGS", payload: JSON.parse(savedSettings) });
      }
    } catch (error) {
      console.error("Error loading saved state:", error);
    }

    // Listen for global filter events
    const handleGlobalFiltersApplied = (event: CustomEvent) => {
      dispatch({
        type: "SET_FILTERED_DATA",
        payload: event.detail.filteredData,
      });
    };

    window.addEventListener(
      "global-filters-applied",
      handleGlobalFiltersApplied as EventListener
    );

    return () => {
      window.removeEventListener(
        "global-filters-applied",
        handleGlobalFiltersApplied as EventListener
      );
    };
  }, []);

  // Update auth state when user changes
  useEffect(() => {
    dispatch({ type: "SET_USER", payload: user });
    dispatch({ type: "SET_AUTHENTICATED", payload: !!user });

    // If the user is logged out, reset the entire state
    if (!user) {
      dispatch({ type: "RESET_STATE" });
    }
  }, [user?.id]);

  // Sync Supabase data with local state
  useEffect(() => {
    if (!user) return;
    if (supabaseDatasets.length > 0) {
      dispatch({ type: "SYNC_FROM_DATABASE", payload: supabaseDatasets });
    }
    if (supabaseError) {
      dispatch({ type: "SET_DATABASE_ERROR", payload: supabaseError });
    }
    dispatch({ type: "SET_LOADING", payload: supabaseLoading });
  }, [supabaseDatasets, supabaseError, supabaseLoading, user]);

  // Effect to apply filters whenever data or filters change
  useEffect(() => {
    // Only apply drill-down filters here (global filters are handled by GlobalFilterContext)
    let currentFilteredData = state.filteredData; // Use already filtered data from global filters

    const drillDownFilters = state.filters.drillDownFilters;
    if (Object.keys(drillDownFilters).length > 0) {
      currentFilteredData = currentFilteredData.filter((row) => {
        return Object.entries(drillDownFilters).every(([key, value]) => {
          return String(row[key] || "") === String(value);
        });
      });
    }

    // Update filtered data only if drill-down filters changed the data
    if (
      JSON.stringify(currentFilteredData) !== JSON.stringify(state.filteredData)
    ) {
      dispatch({ type: "SET_FILTERED_DATA", payload: currentFilteredData });
    }
  }, [state.filteredData, state.filters.drillDownFilters, dispatch]);

  // Save state to sessionStorage whenever it changes
  // useEffect(() => {
  //   if (state.datasets.length > 0) {
  //     try {
  //       sessionStorage.setItem(
  //         "dashboard-datasets",
  //         JSON.stringify(state.datasets)
  //       );
  //       sessionStorage.setItem("dashboard-data", JSON.stringify(state.data));
  //       sessionStorage.setItem(
  //         "dashboard-active-ids",
  //         JSON.stringify(state.activeDatasetIds)
  //       );
  //     } catch (error) {
  //       console.error("Error saving state to sessionStorage:", error);
  //     }
  //   }
  // }, [state.datasets, state.data, state.activeDatasetIds]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(
        "dashboard-settings",
        JSON.stringify(state.settings)
      );
    } catch (error) {
      console.error("Error saving settings to localStorage:", error);
    }
  }, [state.settings]);

  const setActiveTab = (tab: TabType) => {
    dispatch({ type: "SET_ACTIVE_TAB", payload: tab });
  };
  const setFilters = (filters: FilterState) => {
    dispatch({ type: "SET_FILTERS", payload: filters });
  };
  const setSettings = (settings: UserSettings) => {
    dispatch({ type: "SET_SETTINGS", payload: settings });
    if (settings.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (settings.theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      if (prefersDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };
  const toggleDatasetActive = (id: string) => {
    dispatch({ type: "TOGGLE_DATASET_ACTIVE", payload: id });
  };

  const toggleAllDatasetsActive = (activate: boolean) => {
    dispatch({ type: "SET_ACTIVE_ALL", payload: activate });
  };

  const removeDataset = (id: string) => {
    dispatch({ type: "DELETE_DATASET", payload: id });
  };
  const addDrillDownFilter = (key: string, value: any) => {
    dispatch({
      type: "SET_FILTERS",
      payload: {
        ...state.filters,
        drillDownFilters: { ...state.filters.drillDownFilters, [key]: value },
      },
    });
  };
  const clearDrillDownFilters = () => {
    dispatch({
      type: "SET_FILTERS",
      payload: { ...state.filters, drillDownFilters: {} },
    });
  };
  const clearGlobalFilters = () => {
    // This function is now handled by the GlobalFilterContext
    // Keep for backward compatibility but delegate to new system
    console.warn(
      "clearGlobalFilters is deprecated. Use GlobalFilterContext instead."
    );
  };
  const getMultiDatasetData = () => {
    return state.datasets
      .filter((d) => state.activeDatasetIds.includes(d.id))
      .map((dataset) => ({
        datasetId: dataset.id,
        datasetName: dataset.name,
        data: dataset.data,
        color: dataset.color,
      }));
  };
  const saveFilterSet = (name: string) => {
    const newFilterSet = {
      id: Math.random().toString(36).substr(2, 9),
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
    const filterSet = state.settings.savedFilterSets.find(
      (set) => set.id === id
    );
    if (filterSet) {
      setFilters(filterSet.filters);
    }
  };
  const deleteFilterSet = (id: string) => {
    const updatedSettings = {
      ...state.settings,
      savedFilterSets: state.settings.savedFilterSets.filter(
        (set) => set.id !== id
      ),
    };
    setSettings(updatedSettings);
  };
  const mergeDatasets = (
    primaryId: string,
    secondaryId: string,
    joinKey: string
  ) => {
    const primaryDataset = state.datasets.find((d) => d.id === primaryId);
    const secondaryDataset = state.datasets.find((d) => d.id === secondaryId);
    if (!primaryDataset || !secondaryDataset) return;
    const mergedData = [...primaryDataset.data, ...secondaryDataset.data];
    const mergedDataset: Dataset = {
      id: `merged-${Date.now()}`,
      name: `${primaryDataset.name} + ${secondaryDataset.name}`,
      data: mergedData,
      fileName: `merged-${primaryDataset.fileName}-${secondaryDataset.fileName}`,
      fileSize: primaryDataset.fileSize + secondaryDataset.fileSize,
      uploadDate: new Date().toISOString(),
      status: "valid",
      rowCount: mergedData.length,
      validationSummary: `Merged ${primaryDataset.rowCount} + ${secondaryDataset.rowCount} rows`,
      color: "#6366f1",
      preview: mergedData.slice(0, 5),
      dataType: primaryDataset.dataType,
      detectedColumns: [
        ...new Set([
          ...primaryDataset.detectedColumns,
          ...secondaryDataset.detectedColumns,
        ]),
      ],
    };
    dispatch({ type: "ADD_DATASET", payload: mergedDataset });
  };

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        setActiveTab,
        setFilters,
        setSettings,
        toggleDatasetActive,
        toggleAllDatasetsActive,
        removeDataset,
        addDrillDownFilter,
        clearDrillDownFilters,
        clearGlobalFilters,
        getMultiDatasetData,
        saveFilterSet,
        loadFilterSet,
        deleteFilterSet,
        mergeDatasets,
        uploadToDatabase: uploadData,
        syncFromDatabase: refetchSupabaseData,
      }}
    >
      <RealtimeSubscriptionHandler>{children}</RealtimeSubscriptionHandler>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
