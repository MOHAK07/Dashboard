export interface DateRangeFilter {
  startDate: string;
  endDate: string;
}

export interface MonthFilter {
  selectedMonths: string[];
}

export interface BuyerTypeFilter {
  selectedTypes: ('B2B' | 'B2C')[];
}

export interface GlobalFilters {
  dateRange: DateRangeFilter;
  months: MonthFilter;
  buyerTypes: BuyerTypeFilter;
  isActive: boolean;
}

export interface FilterValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FilterState {
  filters: GlobalFilters;
  isLoading: boolean;
  error: string | null;
  availableOptions: {
    dateRange: { min: string; max: string };
    months: string[];
    buyerTypes: ('B2B' | 'B2C')[];
  };
}

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const;

export const BUYER_TYPES = ['B2B', 'B2C'] as const;

export const DEFAULT_GLOBAL_FILTERS: GlobalFilters = {
  dateRange: {
    startDate: '',
    endDate: ''
  },
  months: {
    selectedMonths: []
  },
  buyerTypes: {
    selectedTypes: []
  },
  isActive: false
};