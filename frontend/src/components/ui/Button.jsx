import React from 'react';

export default function Button({
  variant = 'primary',
  disabled = false,
  children,
  className = '',
  style = {},
  type = 'button',
  ...props
}) {
  const isPrimary = variant === 'primary';

  const baseClasses =
    'inline-flex items-center justify-center gap-2 rounded-full font-bold text-xs sm:text-sm tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orange)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:opacity-45 disabled:cursor-not-allowed disabled:transform-none';

  const variantClasses = isPrimary
    ? 'bg-[var(--orange)] hover:bg-[var(--orange-dim)] text-white shadow-sm'
    : 'bg-[var(--surface)] hover:bg-[var(--surface-hero)] text-[var(--text-primary)] border border-[var(--border-strong)]';

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses} ${
        disabled ? '' : 'cursor-pointer active:scale-[0.98]'
      } ${className}`}
      style={{
        padding: '10px 20px',
        fontWeight: 700,
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
