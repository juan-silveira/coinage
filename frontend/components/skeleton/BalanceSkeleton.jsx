import React from 'react';

// Skeleton para valores monetários
export const BalanceValueSkeleton = ({ width = 'w-24', height = 'h-6' }) => {
  return (
    <div className={`${height} ${width} bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded animate-pulse`} />
  );
};

// Skeleton para valores em destaque (grandes)
export const FeaturedBalanceSkeleton = ({ showLabel = true }) => {
  return (
    <div className="text-center space-y-2">
      {showLabel && (
        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded mx-auto animate-pulse" />
      )}
      <div className="h-8 w-32 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded mx-auto animate-pulse" />
      <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded mx-auto animate-pulse" />
    </div>
  );
};

// Skeleton para card de portfolio
export const PortfolioCardSkeleton = () => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600">
      <div className="space-y-4 animate-pulse">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-6 w-28 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded" />
          </div>
          <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full" />
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-5 w-20 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded" />
          </div>
          <div className="flex justify-between items-center">
            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-5 w-24 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded" />
          </div>
          <div className="flex justify-between items-center">
            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-5 w-16 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Skeleton para valores do dashboard principal
export const DashboardBalanceSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="text-center space-y-2 animate-pulse">
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mx-auto" />
          <div className="h-10 w-40 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded mx-auto" />
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="text-center space-y-2 animate-pulse">
          <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded mx-auto" />
          <div className="h-10 w-36 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded mx-auto" />
        </div>
      </div>
    </div>
  );
};

// Skeleton para gráfico donut
export const DonutChartSkeleton = () => {
  return (
    <div className="flex items-center justify-center animate-pulse">
      <div className="relative">
        <div className="h-32 w-32 border-8 border-slate-200 dark:border-slate-700 rounded-full" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-1">
            <div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded mx-auto" />
            <div className="h-6 w-20 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceValueSkeleton;