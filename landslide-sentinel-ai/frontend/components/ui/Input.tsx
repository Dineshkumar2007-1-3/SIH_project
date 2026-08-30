import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
          {label}
        </label>
      )}
      <input
        className={`input-field ${error ? '!border-[var(--color-risk-critical)]' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs" style={{ color: 'var(--color-risk-critical)' }}>{error}</p>
      )}
      {!error && helperText && (
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{helperText}</p>
      )}
    </div>
  );
};

export default Input;
