export interface DataRow {
  Date: string;
  FactoryID: string;
  FactoryName: string;
  PlantID: string;
  PlantName: string;
  Latitude: number;
  Longitude: number;
  ProductName: string;
  UnitsSold: number;
  Revenue: number;
}

export interface ValidationResult {
  validData: DataRow[];
  isValid: boolean;
  totalRows: number;
  validRows: number;
  errors: ValidationError[];
  missingColumns: string[];
  summary: ValidationSummary;
}

export interface ValidationError {
  row: number;
  column: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationSummary {
  message: string;
  type: 'success' | 'warning' | 'error';
}

export interface FilterState {
  dateRange: {
    start: string;
    end: string;
  };
  selectedProducts: string[];
  selectedPlants: string[];
  selectedFactories: string[];
  drillDownFilters: {
    [key: string]: any;
  };
}

export interface ChartType {
  id: string;
  name: string;
  icon: string;
}

export interface KPICard {
  title: string;
  value: string;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: string;
  color: string;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  currency: string;
  language: string;
  notifications: boolean;
  autoSave: boolean;
  savedFilterSets: SavedFilterSet[];
  chartPreferences: {
    [key: string]: string;
  };
}

export interface SavedFilterSet {
  id: string;
  name: string;
  filters: FilterState;
  createdAt: string;
}

export interface ExportOptions {
  format: 'pdf' | 'png' | 'csv' | 'json';
  includeCharts: boolean;
  includeData: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  quality?: 'low' | 'medium' | 'high';
}

export type TabType = 'overview' | 'comparison' | 'deepdive' | 'explorer' | 'datasets' | 'settings';

export interface AppState {
  data: DataRow[];
  filteredData: DataRow[];
  datasets: Dataset[];
  activeDatasetId: string | null;
  datasetLibraryOpen: boolean;
  chartInteractionMode: 'normal' | 'brush' | 'crossfilter';
  brushSelection: BrushSelection | null;
  chartAnnotations: ChartAnnotation[];
  filters: FilterState;
  settings: UserSettings;
  activeTab: TabType;
  isLoading: boolean;
  error: string | null;
  sampleDataLoaded: boolean;
  chartInteractions: {
    [key: string]: any;
  };
}

export interface Dataset {
  id: string;
  name: string;
  data: DataRow[];
  fileName: string;
  fileSize: number;
  uploadDate: string;
  status: 'valid' | 'warning' | 'error';
  rowCount: number;
  validationSummary?: string;
  color: string;
  preview: DataRow[];
}

export interface BrushSelection {
  chartId: string;
  selection: {
    xaxis?: { min: number; max: number };
    yaxis?: { min: number; max: number };
  };
}

export interface ChartAnnotation {
  id: string;
  chartId: string;
  x: number;
  y: number;
  text: string;
  color: string;
  timestamp: string;
}

export interface DatasetMergeConfig {
  primaryDatasetId: string;
  secondaryDatasetId: string;
  joinKey: keyof DataRow;
  joinType: 'inner' | 'left' | 'right' | 'outer';
}

export interface ChartRecommendation {
  type: string;
  title: string;
  description: string;
  confidence: number;
  reason: string;
}