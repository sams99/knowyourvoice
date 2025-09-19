import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showPercentage?: boolean;
  color?: 'blue' | 'green' | 'purple';
}

export function ProgressBar({ 
  value, 
  max = 100, 
  className = '', 
  showPercentage = true,
  color = 'blue' 
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${colorClasses[color]} h-2 rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showPercentage && (
        <div className="text-right">
          <span className="text-sm text-gray-600">{Math.round(percentage)}%</span>
        </div>
      )}
    </div>
  );
}