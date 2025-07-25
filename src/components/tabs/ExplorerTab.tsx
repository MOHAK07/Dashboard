import React from 'react';
import { DataRow } from '../../types';
import { DataTable } from '../DataTable';

interface ExplorerTabProps {
  data: DataRow[];
}

export function ExplorerTab({ data }: ExplorerTabProps) {
  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Data Explorer
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Browse and search through your dataset. Use the search bar and column filters to find specific data points.
          The table is virtualized to handle large datasets efficiently.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-primary-700 dark:text-primary-300">Total Rows</h4>
            <p className="text-2xl font-bold text-primary-900 dark:text-primary-100">
              {data.length.toLocaleString()}
            </p>
          </div>
          
          <div className="bg-secondary-50 dark:bg-secondary-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-secondary-700 dark:text-secondary-300">Date Range</h4>
            <p className="text-sm text-secondary-900 dark:text-secondary-100">
              {data.length > 0 ? (
                <>
                  {Math.min(...data.map(d => new Date(d.Date).getTime()))} - 
                  {Math.max(...data.map(d => new Date(d.Date).getTime()))}
                </>
              ) : 'No data'}
            </p>
          </div>
          
          <div className="bg-accent-50 dark:bg-accent-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-accent-700 dark:text-accent-300">Columns</h4>
            <p className="text-2xl font-bold text-accent-900 dark:text-accent-100">
              {data.length > 0 ? Object.keys(data[0]).length : 0}
            </p>
          </div>
        </div>
      </div>

      <DataTable data={data} />
    </div>
  );
}