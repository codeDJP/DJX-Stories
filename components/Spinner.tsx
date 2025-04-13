import React from 'react';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'medium',
  className = ''
}) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className={`animate-pulse rounded-full bg-djx-yellow/30 ${sizeClasses[size]}`} />
      <div className="flex-1 space-y-4 py-1 ml-4">
        <div className="h-2 bg-djx-yellow/30 rounded w-3/4" />
        <div className="space-y-2">
          <div className="h-2 bg-djx-yellow/30 rounded" />
          <div className="h-2 bg-djx-yellow/30 rounded w-5/6" />
        </div>
      </div>
    </div>
  );
};