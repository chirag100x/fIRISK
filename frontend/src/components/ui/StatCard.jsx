import React from 'react';

export default function StatCard({ label, value, tone = 'neutral', className = '', ...props }) {
  const valueColor =
    tone === 'up'
      ? 'var(--green)'
      : tone === 'down'
      ? 'var(--red)'
      : 'var(--text-primary)';

  return (
    <div className={`flex flex-col py-3 px-4 ${className}`} {...props}>
      <span
        className="text-[13px] font-medium leading-none tracking-tight mb-1.5"
        style={{ color: 'var(--text-secondary)' }}
      >
        {label}
      </span>
      <span
        className="text-[19px] font-bold leading-tight"
        style={{
          fontFamily: 'var(--font-headline)',
          color: valueColor,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
    </div>
  );
}
