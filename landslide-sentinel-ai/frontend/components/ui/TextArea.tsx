import React from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  rows?: number;
}

const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  helperText,
  required = false,
  rows = 4,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-400">
            {label}
          </span>
          {required && (
            <span className="text-xs text-red-500">*</span>
          )}
        </div>
      )}
      <textarea
        className={`w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm text-white
          focus:border-blue-500 focus:ring-blue-500
          ${error ? 'border-red-500' : ''}
          ${className}`}
        rows={rows}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
      {!error && helperText && (
        <p className="text-xs text-slate-500 mt-1">{helperText}</p>
      )}
    </div>
  );
};

export default TextArea;