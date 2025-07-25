import React from 'react';
import { BarChart3, Upload, Zap, Shield, Globe, TrendingUp } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface WelcomeScreenProps {
  onFileUpload: () => void;
}

export function WelcomeScreen({ onFileUpload }: WelcomeScreenProps) {
  const { loadSampleData } = useApp();

  const features = [
    {
      icon: BarChart3,
      title: 'Interactive Charts',
      description: 'Multiple chart types with drill-down capabilities and real-time filtering',
    },
    {
      icon: Zap,
      title: 'High Performance',
      description: 'Handles large datasets with virtualization and web workers',
    },
    {
      icon: Shield,
      title: 'Client-Side Processing',
      description: 'All data processing happens in your browser - completely secure',
    },
    {
      icon: Globe,
      title: 'Responsive Design',
      description: 'Works perfectly on desktop, tablet, and mobile devices',
    },
    {
      icon: TrendingUp,
      title: 'Advanced Analytics',
      description: 'KPI tracking, trend analysis, and geographical visualizations',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 dark:bg-primary-900/50 rounded-full mb-6">
            <BarChart3 className="h-10 w-10 text-primary-600 dark:text-primary-400" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Welcome to <span className="text-primary-600 dark:text-primary-400">DataHub</span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
            Transform your data into actionable insights with our powerful, client-side analytics dashboard. 
            Upload your files or try our sample data to get started.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button
              onClick={onFileUpload}
              className="btn-primary text-lg px-8 py-4 flex items-center space-x-2 transform hover:scale-105 transition-transform"
            >
              <Upload className="h-5 w-5" />
              <span>Upload Multiple Datasets</span>
            </button>
            
            <button
              onClick={loadSampleData}
              className="btn-secondary text-lg px-8 py-4 transform hover:scale-105 transition-transform"
            >
              Try Sample Data
            </button>
          </div>

          {/* Supported Formats */}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Supports Excel (.xlsx), CSV (.csv), and JSON (.json) files • Multi-file upload • Drag & drop
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Data Schema Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
            Expected Data Format
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Required Columns
              </h3>
              <div className="space-y-2">
                {[
                  'Date (YYYY-MM-DD)',
                  'FactoryID',
                  'FactoryName', 
                  'PlantID',
                  'PlantName',
                  'Latitude (numeric)',
                  'Longitude (numeric)',
                  'ProductName',
                  'UnitsSold (numeric)',
                  'Revenue (numeric)'
                ].map((column) => (
                  <div key={column} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                      {column}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Sample Data Preview
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-xs font-mono overflow-x-auto">
                <div className="whitespace-nowrap">
                  <div className="text-gray-500 dark:text-gray-400 mb-2">
                    Date,FactoryName,PlantName,ProductName,UnitsSold,Revenue
                  </div>
                  <div className="text-gray-700 dark:text-gray-300">
                    2024-01-15,TechCorp,Plant Alpha,Widget Pro,150,25000
                  </div>
                  <div className="text-gray-700 dark:text-gray-300">
                    2024-01-16,Global Inc,Plant Beta,Smart Device,200,45000
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}