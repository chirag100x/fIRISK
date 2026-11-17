import React from 'react';

export default function Button({
  variant = 'primary', // 'primary' | 'secondary' | 'glass'
  disabled = false,
  children,
  className = '',
  style = {},
  type = 'button',
  ...props
}) {
  const isPrimary = variant === 'primary';

  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: '999px',
    padding: '9px 20px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    transition: 'all 0.15s ease',
    border: 'none',
    outline: 'none',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  };

  const primaryStyles = {
    ...baseStyles,
    background: 'linear-gradient(180deg, #FBBF24, #F59E0B)',
    color: '#1a1205',
    boxShadow: disabled ? 'none' : '0 4px 14px rgba(245, 158, 11, 0.3)',
  };

  const secondaryStyles = {
    ...baseStyles,
    background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.08))',
    color: '#ffffff',
    border: '1px solid var(--glass-border)',
    borderTopColor: 'var(--glass-border-top)',
    backdropFilter: 'var(--glass-blur)',
    WebkitBackdropFilter: 'var(--glass-blur)',
    boxShadow: disabled ? 'none' : 'var(--glass-shadow)',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={`select-none ${isPrimary ? '' : 'glass'} ${className}`}
      style={{
        ...(isPrimary ? primaryStyles : secondaryStyles),
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
