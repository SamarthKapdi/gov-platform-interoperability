import React from 'react';

const MetricCard = ({ title, value, icon: Icon, trend, trendLabel, colorClass = "text-blue-600", bgClass = "bg-blue-50" }) => {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`rounded-md p-3 ${bgClass}`}>
              <Icon className={`h-6 w-6 ${colorClass}`} aria-hidden="true" />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
                {trend && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trend > 0 ? '↑' : '↓'}
                    <span className="sr-only">{trend > 0 ? 'Increased' : 'Decreased'} by</span>
                    {Math.abs(trend)}%
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
      {trendLabel && (
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
          <div className="text-sm text-gray-500">{trendLabel}</div>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
