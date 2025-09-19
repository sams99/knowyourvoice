import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'purple' | 'gray';
  message?: string;
}

export function LoadingSpinner({ size = 'md', color = 'blue', message }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const colorClasses = {
    blue: 'border-blue-600',
    purple: 'border-purple-600',
    gray: 'border-gray-600',
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div
        className={`
          ${sizeClasses[size]} 
          ${colorClasses[color]} 
          border-3 border-t-transparent rounded-full animate-spin
        `}
      />
      {message && (
        <p className="text-sm text-gray-600">{message}</p>
      )}
    </div>
  );
}