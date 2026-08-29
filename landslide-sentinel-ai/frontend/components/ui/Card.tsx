import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  error?: string;
  footer?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  title,
  children,
  className = '',
  loading = false,
  error,
  footer,
}) => {
  return (
    <div
      className={`rounded-2xl p-6 transition-all duration-200 ${className}`}
      style={{
        background: 'var(--color-bg-card)',
        backdropFilter: 'blur(20px) saturate(150%)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {loading && (
        <div className="space-y-3">
          <div className="h-4 rounded-lg w-32 animate-shimmer" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <div className="h-4 rounded-lg w-48 animate-shimmer" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <div className="h-4 rounded-lg w-40 animate-shimmer" style={{ background: 'rgba(255,255,255,0.04)' }} />
        </div>
      )}

      {error && (
        <div
          className="p-3 rounded-xl mb-4 text-sm"
          style={{ background: 'rgba(255,69,58,0.08)', color: 'var(--color-risk-critical)' }}
        >
          {error}
        </div>
      )}

      {title && (
        <h2 className="text-sm font-semibold text-white mb-4">{title}</h2>
      )}

      <div className="space-y-4">{children}</div>

      {footer && (
        <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
