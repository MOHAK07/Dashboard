import { DataRow } from '../types';

export class DataProcessor {
  static getUniqueValues(data: DataRow[], column: keyof DataRow): string[] {
    const values = data.map(row => String(row[column])).filter(Boolean);
    return [...new Set(values)].sort();
  }

  static getDateRange(data: DataRow[]): { start: string; end: string } {
    if (data.length === 0) return { start: '', end: '' };
    
    const dates = data.map(row => new Date(row.Date)).filter(date => !isNaN(date.getTime()));
    dates.sort((a, b) => a.getTime() - b.getTime());
    
    return {
      start: dates[0]?.toISOString().split('T')[0] || '',
      end: dates[dates.length - 1]?.toISOString().split('T')[0] || ''
    };
  }

  static aggregateByFactory(data: DataRow[]) {
    const factoryMap = new Map();
    
    data.forEach(row => {
      const key = row.FactoryName;
      if (!factoryMap.has(key)) {
        factoryMap.set(key, {
          name: row.FactoryName,
          totalRevenue: 0,
          totalUnits: 0,
          products: new Set(),
          plants: new Set(),
          latitude: row.Latitude,
          longitude: row.Longitude,
        });
      }
      
      const factory = factoryMap.get(key);
      factory.totalRevenue += row.Revenue;
      factory.totalUnits += row.UnitsSold;
      factory.products.add(row.ProductName);
      factory.plants.add(row.PlantName);
    });
    
    return Array.from(factoryMap.values()).map(factory => ({
      ...factory,
      products: factory.products.size,
      plants: factory.plants.size,
    }));
  }

  static aggregateByPlant(data: DataRow[]) {
    const plantMap = new Map();
    
    data.forEach(row => {
      const key = row.PlantName;
      if (!plantMap.has(key)) {
        plantMap.set(key, {
          name: row.PlantName,
          factoryName: row.FactoryName,
          totalRevenue: 0,
          totalUnits: 0,
          products: new Map(),
          latitude: row.Latitude,
          longitude: row.Longitude,
        });
      }
      
      const plant = plantMap.get(key);
      plant.totalRevenue += row.Revenue;
      plant.totalUnits += row.UnitsSold;
      
      if (!plant.products.has(row.ProductName)) {
        plant.products.set(row.ProductName, { revenue: 0, units: 0 });
      }
      const product = plant.products.get(row.ProductName);
      product.revenue += row.Revenue;
      product.units += row.UnitsSold;
    });
    
    return Array.from(plantMap.values()).map(plant => ({
      ...plant,
      products: Object.fromEntries(plant.products),
      avgRevenuePerUnit: plant.totalUnits > 0 ? plant.totalRevenue / plant.totalUnits : 0,
    }));
  }

  static aggregateByProduct(data: DataRow[]) {
    const productMap = new Map();
    
    data.forEach(row => {
      const key = row.ProductName;
      if (!productMap.has(key)) {
        productMap.set(key, {
          name: row.ProductName,
          totalRevenue: 0,
          totalUnits: 0,
          factories: new Set(),
          plants: new Set(),
          monthlySales: new Map(),
        });
      }
      
      const product = productMap.get(key);
      product.totalRevenue += row.Revenue;
      product.totalUnits += row.UnitsSold;
      product.factories.add(row.FactoryName);
      product.plants.add(row.PlantName);
      
      // Monthly sales
      const month = row.Date.substring(0, 7); // YYYY-MM
      if (!product.monthlySales.has(month)) {
        product.monthlySales.set(month, 0);
      }
      product.monthlySales.set(month, product.monthlySales.get(month) + row.Revenue);
    });
    
    return Array.from(productMap.values()).map(product => ({
      ...product,
      factories: product.factories.size,
      plants: product.plants.size,
      avgRevenuePerUnit: product.totalUnits > 0 ? product.totalRevenue / product.totalUnits : 0,
      monthlySales: Object.fromEntries(product.monthlySales),
    }));
  }

  static getTimeSeries(data: DataRow[], groupBy: 'day' | 'week' | 'month' = 'month') {
    const timeMap = new Map();
    
    data.forEach(row => {
      let timeKey: string;
      const date = new Date(row.Date);
      
      switch (groupBy) {
        case 'day':
          timeKey = row.Date;
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          timeKey = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          timeKey = row.Date.substring(0, 7);
          break;
        default:
          timeKey = row.Date.substring(0, 7);
      }
      
      if (!timeMap.has(timeKey)) {
        timeMap.set(timeKey, {
          date: timeKey,
          revenue: 0,
          units: 0,
          orders: 0,
        });
      }
      
      const timePoint = timeMap.get(timeKey);
      timePoint.revenue += row.Revenue;
      timePoint.units += row.UnitsSold;
      timePoint.orders += 1;
    });
    
    return Array.from(timeMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  static calculateKPIs(data: DataRow[]) {
    if (data.length === 0) {
      return {
        totalRevenue: 0,
        totalUnits: 0,
        totalFactories: 0,
        totalPlants: 0,
        totalProducts: 0,
        avgRevenuePerUnit: 0,
        avgOrderValue: 0,
      };
    }

    const totalRevenue = data.reduce((sum, row) => sum + row.Revenue, 0);
    const totalUnits = data.reduce((sum, row) => sum + row.UnitsSold, 0);
    const uniqueFactories = new Set(data.map(row => row.FactoryName)).size;
    const uniquePlants = new Set(data.map(row => row.PlantName)).size;
    const uniqueProducts = new Set(data.map(row => row.ProductName)).size;

    return {
      totalRevenue,
      totalUnits,
      totalFactories: uniqueFactories,
      totalPlants: uniquePlants,
      totalProducts: uniqueProducts,
      avgRevenuePerUnit: totalUnits > 0 ? totalRevenue / totalUnits : 0,
      avgOrderValue: data.length > 0 ? totalRevenue / data.length : 0,
    };
  }

  static formatCurrency(value: number, currency: string = 'INR'): string {
    // Handle Indian numbering system for INR
    if (currency === 'INR') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    
    // Handle other currencies with appropriate locales
    const localeMap: { [key: string]: string } = {
      'USD': 'en-US',
      'EUR': 'de-DE',
      'GBP': 'en-GB', 
      'JPY': 'ja-JP',
      'CAD': 'en-CA',
    };
    
    const locale = localeMap[currency] || 'en-US';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  static formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  static formatPercentage(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value / 100);
  }
}