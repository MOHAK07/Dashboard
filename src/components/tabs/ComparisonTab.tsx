import React, { useState, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { DataRow } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Database, TrendingUp, Package, DollarSign, Factory, Users, Target, Award } from 'lucide-react';

interface ComparisonTabProps {
  data: DataRow[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

export function ComparisonTab({ data }: ComparisonTabProps) {
  const { state } = useApp();
  const { activeDatasetIds, datasets, settings } = state;
  const [selectedPlants, setSelectedPlants] = useState<string[]>([]);
  const [showTopN, setShowTopN] = useState(8);

  // Create multi-dataset plant data aggregation
  const createMultiDatasetPlantData = () => {
    const plantDataMap = new Map();
    
    activeDatasetIds.forEach((datasetId, datasetIndex) => {
      const dataset = datasets.find(d => d.id === datasetId);
      if (!dataset) return;
      
      const datasetColor = COLORS[datasetIndex % COLORS.length];
      
      // Group by plant for this dataset
      const plantGroups = dataset.data.reduce((acc, row) => {
        const plant = row.Plant || 'Unknown Plant';
        if (!acc[plant]) {
          acc[plant] = [];
        }
        acc[plant].push(row);
        return acc;
      }, {} as Record<string, DataRow[]>);
      
      // Process each plant in this dataset
      Object.entries(plantGroups).forEach(([plant, rows]) => {
        const totalRevenue = rows.reduce((sum, row) => {
          const revenue = typeof row.Revenue === 'number' ? row.Revenue : 
                         typeof row.Revenue === 'string' ? parseFloat(row.Revenue.replace(/[^0-9.-]/g, '')) || 0 : 0;
          return sum + revenue;
        }, 0);
        
        const totalUnits = rows.reduce((sum, row) => {
          const units = typeof row['Units Sold'] === 'number' ? row['Units Sold'] : 
                       typeof row['Units Sold'] === 'string' ? parseFloat(row['Units Sold']) || 0 : 0;
          return sum + units;
        }, 0);
        
        const uniqueProducts = new Set(rows.map(row => row.Product).filter(Boolean)).size;
        
        const avgPrice = totalUnits > 0 ? totalRevenue / totalUnits : 0;
        
        if (plantDataMap.has(plant)) {
          // Aggregate with existing data
          const existing = plantDataMap.get(plant);
          plantDataMap.set(plant, {
            ...existing,
            totalRevenue: existing.totalRevenue + totalRevenue,
            totalUnits: existing.totalUnits + totalUnits,
            products: existing.products + uniqueProducts,
            datasets: [...existing.datasets, { id: datasetId, name: dataset.name, color: datasetColor }],
            avgPrice: (existing.totalRevenue + totalRevenue) / (existing.totalUnits + totalUnits) || 0
          });
        } else {
          // Create new entry
          plantDataMap.set(plant, {
            plant,
            totalRevenue,
            totalUnits,
            products: uniqueProducts,
            avgPrice,
            datasets: [{ id: datasetId, name: dataset.name, color: datasetColor }]
          });
        }
      });
    });
    
    return Array.from(plantDataMap.values());
  };

  const plantKPIs = useMemo(() => {
    if (activeDatasetIds.length === 0) return [];
    
    if (activeDatasetIds.length === 1) {
      // Single dataset logic
      const plantGroups = data.reduce((acc, row) => {
        const plant = row.Plant || 'Unknown Plant';
        if (!acc[plant]) {
          acc[plant] = [];
        }
        acc[plant].push(row);
        return acc;
      }, {} as Record<string, DataRow[]>);

      return Object.entries(plantGroups).map(([plant, rows]) => {
        const totalRevenue = rows.reduce((sum, row) => {
          const revenue = typeof row.Revenue === 'number' ? row.Revenue : 
                         typeof row.Revenue === 'string' ? parseFloat(row.Revenue.replace(/[^0-9.-]/g, '')) || 0 : 0;
          return sum + revenue;
        }, 0);
        
        const totalUnits = rows.reduce((sum, row) => {
          const units = typeof row['Units Sold'] === 'number' ? row['Units Sold'] : 
                       typeof row['Units Sold'] === 'string' ? parseFloat(row['Units Sold']) || 0 : 0;
          return sum + units;
        }, 0);
        
        const uniqueProducts = new Set(rows.map(row => row.Product).filter(Boolean)).size;
        const avgPrice = totalUnits > 0 ? totalRevenue / totalUnits : 0;
        
        return {
          plant,
          totalRevenue,
          totalUnits,
          products: uniqueProducts,
          avgPrice,
          datasets: []
        };
      }).sort((a, b) => b.totalRevenue - a.totalRevenue);
    } else {
      // Multi-dataset logic
      return createMultiDatasetPlantData().sort((a, b) => b.totalRevenue - a.totalRevenue);
    }
  }, [data, activeDatasetIds, datasets]);

  const availablePlants = useMemo(() => {
    return plantKPIs.map(kpi => kpi.plant);
  }, [plantKPIs]);

  const displayedPlants = selectedPlants.length > 0 ? selectedPlants : availablePlants.slice(0, showTopN);

  const chartData = useMemo(() => {
    return plantKPIs
      .filter(kpi => displayedPlants.includes(kpi.plant))
      .map(kpi => ({
        plant: kpi.plant,
        revenue: kpi.totalRevenue,
        units: kpi.totalUnits,
        avgPrice: kpi.avgPrice,
        products: kpi.products
      }));
  }, [plantKPIs, displayedPlants]);

  const pieChartData = useMemo(() => {
    return chartData.map((item, index) => ({
      name: item.plant,
      value: item.revenue,
      color: COLORS[index % COLORS.length]
    }));
  }, [chartData]);

  const formatCurrency = (value: number) => {
    const currencySymbols = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'INR': '₹',
      'JPY': '¥'
    };
    
    const symbol = currencySymbols[settings.currency as keyof typeof currencySymbols] || settings.currency;
    
    if (value >= 1000000) {
      return `${symbol}${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${symbol}${(value / 1000).toFixed(1)}K`;
    } else {
      return `${symbol}${Math.round(value).toLocaleString()}`;
    }
  };

  const handlePlantToggle = (plant: string) => {
    setSelectedPlants(prev => 
      prev.includes(plant) 
        ? prev.filter(p => p !== plant)
        : [...prev, plant]
    );
  };

  if (activeDatasetIds.length === 0) {
    return (
      <div className="space-y-8">
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <Database className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Plant Comparison
            </h1>
          </div>
          <div className="text-center py-12">
            <Factory className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Active Datasets
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Please activate at least one dataset to view plant comparisons.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Database className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Plant Comparison
              </h1>
              {activeDatasets.length > 1 && (
                <div className="flex items-center space-x-2 mt-1">
                  <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <Database className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Multi-Dataset Comparison Mode
                    </span>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Comparing data across {activeDatasetIds.length} active datasets: {activeDatasetIds.map(id => {
                      const dataset = datasets.find(d => d.id === id);
                      return dataset?.name || id;
                    }).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Plant Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Select Plants to Compare {activeDatasetIds.length > 1 ? '(Across All Active Datasets)' : ''}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
            {availablePlants.map((plant) => (
              <label key={plant} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedPlants.includes(plant)}
                  onChange={() => handlePlantToggle(plant)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{plant}</span>
              </label>
            ))}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing top {Math.min(showTopN, availablePlants.length)} plants by default. Select plants above to customize comparison.
          </p>
        </div>
      </div>

      {/* Revenue by Product and Plant Chart - Full Width */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Revenue by Product and Plant Chart
        </h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="plant" 
                angle={-45}
                textAnchor="end"
                height={100}
                fontSize={12}
              />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'revenue' ? formatCurrency(value) : 
                  name === 'avgPrice' ? formatCurrency(value) : value.toLocaleString(),
                  name === 'revenue' ? 'Revenue' :
                  name === 'units' ? 'Units Sold' :
                  name === 'avgPrice' ? 'Avg Price' : 'Products'
                ]}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
              <Bar dataKey="units" fill="#10B981" name="Units Sold" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Multi-Metric Comparison - Full Width */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Multi-Metric Comparison
        </h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Plant Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {plantKPIs
          .filter(kpi => displayedPlants.includes(kpi.plant))
          .map((kpi, index) => (
            <div key={kpi.plant} className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {kpi.plant}
                </h3>
                {activeDatasetIds.length > 1 && kpi.datasets && (
                  <div className="flex items-center space-x-1">
                    {kpi.datasets.length > 1 ? (
                      <div className="w-3 h-3 rounded-full bg-gray-400" title="Multiple Datasets" />
                    ) : (
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: kpi.datasets[0]?.color }}
                        title={kpi.datasets[0]?.name}
                      />
                    )}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-sm font-bold text-blue-600 break-words">
                    {formatCurrency(kpi.totalRevenue)}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Units Sold</p>
                  <p className="text-sm font-bold text-green-600">
                    {kpi.totalUnits.toLocaleString()}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Avg Price</p>
                  <p className="text-sm font-bold text-orange-600 break-words">
                    {formatCurrency(kpi.avgPrice)}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Products</p>
                  <p className="text-sm font-bold text-purple-600">
                    {kpi.products}
                  </p>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}