import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  className = '',
}) => {
  return (
    <div
      className={`animate-pulse rounded bg-slate-700/50
        ${typeof width === 'number' ? `w-${width}` : `w-${width}`}
        ${typeof height === 'number' ? `h-${height}` : `h-${height}`}
        ${className}`}
    />
  );
};

export default Skeleton;