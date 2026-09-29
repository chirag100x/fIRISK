import React from 'react';

export default function Card({ children, className = '', style = {}, ...props }) {
  return (
    <div
      className={`transition-colors duration-200 ${className}`}
      style={{
        backgroundColor: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
