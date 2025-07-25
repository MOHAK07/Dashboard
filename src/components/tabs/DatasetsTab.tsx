import React, { useState } from 'react';
import { 
  Database, 
  Eye, 
  Trash2, 
  Download, 
  Merge, 
  Calendar,
  FileText,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  BarChart3,
  X,
  Upload,
  Plus,
  Filter,
  Search,
  Grid,
  List
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { Dataset } from '../../types';
import { DataProcessor } from '../../utils/dataProcessing';

export function DatasetsTab() {
  const { state, setActiveDataset, removeDataset, mergeDatasets } = useApp();
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>([]);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [previewDataset, setPreviewDataset] = useState<Dataset | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'rows'>('date');
  const [filterStatus, setFilterStatus] = useState<'all' | 'valid' | 'warning' | 'error'>('all');

  const getStatusIcon = (status: Dataset['status']) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-success-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-error-500" />;
    }
  };

  const getStatusColor = (status: Dataset['status']) => {
    switch (status) {
      case 'valid':
        return 'bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-300';
      case 'warning':
        return 'bg-warning-100 dark:bg-warning-900/20 text-warning-700 dark:text-warning-300';
      case 'error':
        return 'bg-error-100 dark:bg-error-900/20 text-error-700 dark:text-error-300';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDatasetSelect = (datasetId: string) => {
    if (selectedDatasets.includes(datasetId)) {
      setSelectedDatasets(prev => prev.filter(id => id !== datasetId));
    } else {
      setSelectedDatasets(prev => [...prev, datasetId]);
    }
  };

  const handleMergeDatasets = () => {
    if (selectedDatasets.length >= 2) {
      setShowMergeDialog(true);
    }
  };

  const handleConfirmMerge = () => {
    if (selectedDatasets.length >= 2) {
      mergeDatasets(selectedDatasets[0], selectedDatasets[1], 'Date');
      setShowMergeDialog(false);
      setSelectedDatasets([]);
    }
  };

  const handleCancelMerge = () => {
    setShowMergeDialog(false);
  };

  // Filter and sort datasets
  const filteredDatasets = state.datasets
    .filter(dataset => {
      const matchesSearch = dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           dataset.fileName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || dataset.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
        case 'size':
          return b.fileSize - a.fileSize;
        case 'rows':
          return b.rowCount - a.rowCount;
        default:
          return 0;
      }
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Dataset Library
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and organize your data sources
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openFileUpload'))}
            className="btn-primary flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Dataset</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/50 rounded-lg">
              <Database className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Datasets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {state.datasets.length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-success-100 dark:bg-success-900/50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-success-600 dark:text-success-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Valid Datasets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {state.datasets.filter(d => d.status === 'valid').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-secondary-100 dark:bg-secondary-900/50 rounded-lg">
              <FileText className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Rows</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {state.datasets.reduce((sum, d) => sum + d.rowCount, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-accent-100 dark:bg-accent-900/50 rounded-lg">
              <BarChart3 className="h-5 w-5 text-accent-600 dark:text-accent-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Dataset</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {state.activeDatasetId ? 
                  state.datasets.find(d => d.id === state.activeDatasetId)?.name.substring(0, 12) + '...' : 
                  'None'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search datasets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10 w-64"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="valid">Valid</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="input-field"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="size">Sort by Size</option>
              <option value="rows">Sort by Rows</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white dark:bg-gray-600 shadow-sm' 
                    : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white dark:bg-gray-600 shadow-sm' 
                    : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* Bulk Actions */}
            {selectedDatasets.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedDatasets.length} selected
                </span>
                <button
                  onClick={handleMergeDatasets}
                  disabled={selectedDatasets.length < 2}
                  className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <Merge className="h-4 w-4" />
                  <span>Merge</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dataset Grid/List */}
      {filteredDatasets.length === 0 ? (
        <div className="card text-center py-12">
          <Database className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No datasets found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Upload your first dataset to get started'
            }
          </p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openFileUpload'))}
            className="btn-primary flex items-center space-x-2 mx-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Upload Dataset</span>
          </button>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'
        }>
          {filteredDatasets.map((dataset) => (
            <div
              key={dataset.id}
              className={`
                card cursor-pointer transition-all duration-200 hover:shadow-lg
                ${state.activeDatasetId === dataset.id 
                  ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                  : 'hover:shadow-md'
                }
                ${selectedDatasets.includes(dataset.id) ? 'ring-2 ring-secondary-500' : ''}
                ${viewMode === 'list' ? 'flex items-center space-x-4' : ''}
              `}
            >
              <div className={viewMode === 'list' ? 'flex items-center space-x-3' : 'mb-4'}>
                <input
                  type="checkbox"
                  checked={selectedDatasets.includes(dataset.id)}
                  onChange={() => handleDatasetSelect(dataset.id)}
                  className="rounded border-gray-300 text-secondary-600 focus:ring-secondary-500"
                  onClick={(e) => e.stopPropagation()}
                />
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: dataset.color }}
                />
                <div className={viewMode === 'list' ? 'flex-1 min-w-0' : ''}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {dataset.name}
                    </h3>
                    {viewMode === 'grid' && getStatusIcon(dataset.status)}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {dataset.fileName}
                  </p>
                </div>
              </div>

              {viewMode === 'grid' ? (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Rows</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {dataset.rowCount.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Size</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatFileSize(dataset.fileSize)}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(dataset.status)}`}>
                      {getStatusIcon(dataset.status)}
                      <span className="ml-1 capitalize">{dataset.status}</span>
                    </span>
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    {new Date(dataset.uploadDate).toLocaleDateString()}
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDataset(dataset.id);
                      }}
                      className={`text-xs px-3 py-1 rounded-full transition-colors ${
                        state.activeDatasetId === dataset.id
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {state.activeDatasetId === dataset.id ? 'Active' : 'Activate'}
                    </button>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewDataset(dataset);
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                        title="Preview data"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeDataset(dataset.id);
                        }}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded transition-colors"
                        title="Delete dataset"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between flex-1">
                  <div className="flex items-center space-x-6">
                    <div className="text-sm">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {dataset.rowCount.toLocaleString()}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 ml-1">rows</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {formatFileSize(dataset.fileSize)}
                      </span>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(dataset.status)}`}>
                      {getStatusIcon(dataset.status)}
                      <span className="ml-1 capitalize">{dataset.status}</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDataset(dataset.id);
                      }}
                      className={`text-xs px-3 py-1 rounded-full transition-colors ${
                        state.activeDatasetId === dataset.id
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {state.activeDatasetId === dataset.id ? 'Active' : 'Activate'}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewDataset(dataset);
                      }}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      title="Preview data"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeDataset(dataset.id);
                      }}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded transition-colors"
                      title="Delete dataset"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Merge Dialog */}
      {showMergeDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Merge Datasets
            </h3>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              Are you sure you want to merge the selected datasets? This will create a new merged dataset.
            </p>
            <div className="flex justify-end space-x-3">
              <button onClick={handleCancelMerge} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleConfirmMerge} className="btn-primary">
                Merge Datasets
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dataset Preview Modal */}
      {previewDataset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {previewDataset.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {previewDataset.rowCount.toLocaleString()} rows • {formatFileSize(previewDataset.fileSize)}
                </p>
              </div>
              <button
                onClick={() => setPreviewDataset(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {Array.isArray(previewDataset.data) && previewDataset.data.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        {Object.keys(previewDataset.data[0]).map(col => (
                          <th key={col} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {previewDataset.data.slice(0, 50).map((row, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700' : ''}>
                          {Object.keys(previewDataset.data[0]).map(col => (
                            <td key={col} className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                              {String(row[col as keyof typeof row])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:justify-between gap-4 bg-white dark:bg-gray-800">
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <span>Showing first 50 rows of {previewDataset.rowCount.toLocaleString()}</span>
                {getStatusIcon(previewDataset.status)}
                <span>{previewDataset.validationSummary}</span>
              </div>
              <button
                onClick={() => {
                  setActiveDataset(previewDataset.id);
                  setPreviewDataset(null);
                }}
                className="btn-primary w-full md:w-auto"
              >
                Use This Dataset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}