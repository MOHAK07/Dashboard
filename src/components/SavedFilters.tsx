import React, { useState } from 'react';
import { Save, Bookmark, Trash2, Plus, X } from 'lucide-react';
import { useGlobalFilterContext } from '../contexts/GlobalFilterContext';

interface SavedFiltersProps {
  className?: string;
}

export function SavedFilters({ className = '' }: SavedFiltersProps) {
  const { filterState, updateFilters } = useGlobalFilterContext();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [savedFilterSets, setSavedFilterSets] = useState<any[]>([]);

  // Load saved filter sets from localStorage
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('global-filter-sets');
      if (saved) {
        setSavedFilterSets(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved filter sets:', error);
    }
  }, []);
  const handleSaveFilter = () => {
    if (filterName.trim()) {
      const newFilterSet = {
        id: Math.random().toString(36).substr(2, 9),
        name: filterName.trim(),
        filters: filterState.filters,
        createdAt: new Date().toISOString(),
      };
      
      const updatedSets = [...savedFilterSets, newFilterSet];
      setSavedFilterSets(updatedSets);
      localStorage.setItem('global-filter-sets', JSON.stringify(updatedSets));
      
      setFilterName('');
      setShowSaveModal(false);
    }
  };

  const loadFilterSet = (filterSet: any) => {
    updateFilters(filterSet.filters);
    setShowDropdown(false);
  };

  const deleteFilterSet = (id: string) => {
    const updatedSets = savedFilterSets.filter(set => set.id !== id);
    setSavedFilterSets(updatedSets);
    localStorage.setItem('global-filter-sets', JSON.stringify(updatedSets));
  };

  const hasActiveFilters = filterState.filters.isActive;

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center space-x-2">
        {/* Save Current Filters */}
        {hasActiveFilters && (
          <button
            onClick={() => setShowSaveModal(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
            title="Save current filters"
          >
            <Save className="h-4 w-4" />
          </button>
        )}

        {/* Saved Filters Dropdown */}
        {savedFilterSets.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              title="Load saved filters"
            >
              <Bookmark className="h-4 w-4" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">Saved Filters</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {savedFilterSets.map((filterSet) => (
                    <div
                      key={filterSet.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <button
                        onClick={() => {
                          loadFilterSet(filterSet);
                          setShowDropdown(false);
                        }}
                        className="flex-1 text-left text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                      >
                        <div className="font-medium">{filterSet.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(filterSet.createdAt).toLocaleDateString()}
                        </div>
                      </button>
                      <button
                        onClick={() => deleteFilterSet(filterSet.id)}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete filter set"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save Filter Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Save Filter Set
                </h3>
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Filter Set Name
                  </label>
                  <input
                    type="text"
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    placeholder="Enter a name for this filter set"
                    className="input-field w-full"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveFilter();
                      }
                    }}
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowSaveModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveFilter}
                    disabled={!filterName.trim()}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}