import React from 'react';

interface TooltipProps {
  children: React.ReactNode;
  label: string;
  placement?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  children,
  label,
  placement = 'top',
  className = '',
}) => {
  const placementClasses = {
    top: 'bottom-full mb-2',
    right: 'start-full ms-2',
    bottom: 'top-full mt-2',
    left: 'end-full me-2',
  };

  const arrowClasses = {
    top: 'border-t-transparent border-b-black',
    right: 'border-r-transparent border-l-black',
    bottom: 'border-t-black border-b-transparent',
    left: 'border-r-transparent border-l-black',
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {children}
      <div className={`absolute z-10 ${placementClasses[placement]} px-3 py-1.5 text-xs font-medium text-white
        bg-slate-900/90 rounded-md shadow-lg
        ${arrowClasses[placement]}
        animate-fade-in`}>
        <div className="whitespace-nowrap">{label}</div>
      </div>
    </div>
  );
};

export default Tooltip;