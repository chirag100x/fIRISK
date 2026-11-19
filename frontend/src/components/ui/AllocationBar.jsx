import React from 'react';

export default function AllocationBar({
  weight = 0,
  showPercentage = true,
  className = '',
  style = {},
  ...props
}) {
  const num = typeof weight === 'number' ? weight : parseFloat(weight) || 0;
  const pct = num <= 1 && num > 0 ? num * 100 : num;
  const clampedPct = Math.max(0, Math.min(100, pct));
  const displayPctStr = `${clampedPct.toFixed(0)}%`;

  return (
    <div
      className={`alloc ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        paddingRight: '8px',
        ...style,
      }}
      {...props}
    >
      <div
        className="track"
        style={{
          flex: 1,
          height: '8px',
          borderRadius: '99px',
          background: 'rgba(255, 255, 255, 0.12)',
          overflow: 'hidden',
        }}
      >
        <i
          style={{
            display: 'block',
            height: '100%',
            width: `${clampedPct}%`,
            borderRadius: '99px',
            background:
              'linear-gradient(90deg, #292750 0%, #4a4a8e 30%, #5c5d9d 46%, #c9b58f 76%, #eeca8d 100%)',
            transition: 'width 0.4s ease',
          }}
        />
      </div>
      {showPercentage && (
        <span
          style={{
            fontSize: '13px',
            color: 'var(--muted-2)',
            width: '32px',
            textAlign: 'right',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {displayPctStr}
        </span>
      )}
    </div>
  );
}

