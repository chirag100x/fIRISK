import React from 'react';

export default function DeltaPill({
  value,
  children,
  className = '',
  style = {},
  ...props
}) {
  const num = typeof value === 'number' ? value : parseFloat(value);
  const isLoss = !isNaN(num) ? num < 0 : false;

  let displayText = children;
  if (displayText === undefined && !isNaN(num)) {
    const sign = isLoss ? '−' : '+';
    displayText = `${sign}${Math.abs(num).toFixed(2)}%`;
  }

  const gainStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    height: '34px',
    padding: '0 14px',
    borderRadius: '8px',
    marginLeft: '14px',
    verticalAlign: 'middle',
    fontSize: '16px',
    fontWeight: 500,
    color: 'var(--gain-text)',
    background: 'var(--gain-bg)',
    border: '1px solid rgba(124,228,180,.22)',
    whiteSpace: 'nowrap',
  };

  const lossStyles = {
    ...gainStyles,
    color: 'var(--loss-text)',
    background: '#44313b',
    border: '1px solid rgba(229,94,101,.3)',
  };

  return (
    <span
      className={`delta ${isLoss ? 'loss' : ''} ${className}`}
      style={{
        ...(isLoss ? lossStyles : gainStyles),
        ...style,
      }}
      {...props}
    >
      {displayText}
    </span>
  );
}
