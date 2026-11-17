import React from 'react';

export default function TickerBadge({ ticker = '', initials, className = '', style = {}, ...props }) {
  const displayInitials =
    initials ||
    (ticker
      ? ticker
          .replace(/\..*$/, '')
          .slice(0, 2)
          .toUpperCase()
      : '—');

  return (
    <span
      className={`badge ${className}`}
      style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 600,
        color: '#f3e6da',
        background: '#27272d',
        border: '1px solid rgba(255, 255, 255, 0.16)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        flexShrink: 0,
        ...style,
      }}
      {...props}
    >
      {displayInitials}
    </span>
  );
}
