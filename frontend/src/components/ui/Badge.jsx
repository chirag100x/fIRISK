import React from 'react';

export default function Badge({ children, tone = 'neutral', className = '', ...props }) {
  let style = {
    borderRadius: 'var(--radius-pill)',
    fontVariantNumeric: 'tabular-nums',
  };

  if (tone === 'up') {
    style = {
      ...style,
      backgroundColor: 'rgba(52, 211, 153, 0.14)',
      color: 'var(--green)',
      border: '1px solid rgba(52, 211, 153, 0.24)',
    };
  } else if (tone === 'down') {
    style = {
      ...style,
      backgroundColor: 'rgba(248, 113, 113, 0.14)',
      color: 'var(--red)',
      border: '1px solid rgba(248, 113, 113, 0.24)',
    };
  } else {
    style = {
      ...style,
      backgroundColor: 'var(--border)',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border-strong)',
    };
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold select-none ${className}`}
      style={style}
      {...props}
    >
      {children}
    </span>
  );
}
