interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
}

const StatsCard = ({ title, value, icon, trend, className = '' }: StatsCardProps) => {
  return (
    <div className={`bg-white rounded-2xl shadow-soft border border-gray-200 p-6 hover:shadow-medium transition-all duration-200 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          {trend && (
            <div className={`flex items-center text-sm ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              <svg
                className={`w-4 h-4 mr-1 ${trend.positive ? '' : 'rotate-180'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span className="font-medium">
                {Math.abs(trend.value)}% from last month
              </span>
            </div>
          )}
        </div>

        <div className="text-4xl ml-4 opacity-80">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;