import { 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  Package, 
  DollarSign, 
  Users,
  IndianRupee,
  Euro,
  PoundSterling,
  JapaneseYen
} from 'lucide-react';
import { DataProcessor } from '../../utils/dataProcessing';
import { DataRow } from '../../types';

interface KPICardsProps {
  data: DataRow[];
  currency?: string;
}

export function KPICards({ data, currency = 'USD' }: KPICardsProps) {
  const kpis = DataProcessor.calculateKPIs(data);

  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case 'INR':
        return IndianRupee;
      case 'EUR':
        return Euro;
      case 'GBP':
        return PoundSterling;
      case 'JPY':
        return JapaneseYen;
      case 'USD':
      case 'CAD':
      default:
        return DollarSign;
    }
  };

  const cards = [
    {
      title: 'Total Revenue',
      value: DataProcessor.formatCurrency(kpis.totalRevenue, currency),
      change: 12.5,
      changeType: 'increase' as const,
      icon: getCurrencyIcon(currency),
      color: 'primary',
    },
    {
      title: 'Units Sold',
      value: DataProcessor.formatNumber(kpis.totalUnits),
      change: 8.2,
      changeType: 'increase' as const,
      icon: Package,
      color: 'secondary',
    },
    {
      title: 'Active Factories',
      value: kpis.totalFactories.toString(),
      change: 0,
      changeType: 'neutral' as const,
      icon: Building2,
      color: 'accent',
    },
    {
      title: 'Product Lines',
      value: kpis.totalProducts.toString(),
      change: -2.1,
      changeType: 'decrease' as const,
      icon: Users,
      color: 'secondary',
    },
  ];

  const getChangeIcon = (changeType: 'increase' | 'decrease' | 'neutral') => {
    switch (changeType) {
      case 'increase':
        return <TrendingUp className="h-4 w-4 text-success-500" />;
      case 'decrease':
        return <TrendingDown className="h-4 w-4 text-error-500" />;
      default:
        return null;
    }
  };

  const getChangeColor = (changeType: 'increase' | 'decrease' | 'neutral') => {
    switch (changeType) {
      case 'increase':
        return 'text-success-600 dark:text-success-400';
      case 'decrease':
        return 'text-error-600 dark:text-error-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        
        return (
          <div
            key={card.title}
            className="card hover:shadow-md transition-all duration-200 group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {card.value}
                </p>
                
                {card.change !== 0 && (
                  <div className={`flex items-center space-x-1.5 ${getChangeColor(card.changeType)}`}>
                    {getChangeIcon(card.changeType)}
                    <span className="text-sm font-medium">
                      {Math.abs(card.change)}%
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      vs last period
                    </span>
                  </div>
                )}
              </div>
              
              <div className={`
                p-3 rounded-lg group-hover:scale-110 transition-transform duration-200
                ${card.color === 'primary' ? 'bg-primary-100 dark:bg-primary-900/50' : ''}
                ${card.color === 'secondary' ? 'bg-secondary-100 dark:bg-secondary-900/50' : ''}
                ${card.color === 'accent' ? 'bg-accent-100 dark:bg-accent-900/50' : ''}
              `}>
                <Icon className={`
                  h-6 w-6
                  ${card.color === 'primary' ? 'text-primary-600 dark:text-primary-400' : ''}
                  ${card.color === 'secondary' ? 'text-secondary-600 dark:text-secondary-400' : ''}
                  ${card.color === 'accent' ? 'text-accent-600 dark:text-accent-400' : ''}
                `} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}