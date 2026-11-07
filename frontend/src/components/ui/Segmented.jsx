import React from 'react';

export default function Segmented({
  options = [],
  value,
  onChange,
  variant = 'default',
  className = '',
  style = {},
  id,
  ...props
}) {
  const isOnHero = variant === 'onHero';

  const containerStyle = isOnHero
    ? {
        backgroundColor: 'rgba(255, 255, 255, 0.14)',
        border: 'none',
        borderRadius: 'var(--radius-pill)',
        padding: '3px',
        gap: '2px',
        ...style,
      }
    : {
        backgroundColor: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-pill)',
        padding: '3px',
        gap: '2px',
        ...style,
      };

  return (
    <div
      id={id}
      className={`inline-flex items-center select-none ${className}`}
      style={containerStyle}
      role="radiogroup"
      {...props}
    >
      {options.map((opt) => {
        const itemValue = typeof opt === 'object' && opt !== null ? opt.value : opt;
        const itemLabel = typeof opt === 'object' && opt !== null ? (opt.label ?? opt.value) : opt;
        const itemId = typeof opt === 'object' && opt !== null ? opt.id : undefined;
        const itemTitle = typeof opt === 'object' && opt !== null ? opt.title : undefined;
        const isActive = value === itemValue;

        let itemStyle = {
          padding: '6px 12px',
          borderRadius: 'var(--radius-pill)',
          fontSize: '12.5px',
          lineHeight: '1',
          transition: 'all 0.15s ease',
        };

        let itemClasses = 'cursor-pointer transition-all border-none outline-none';

        if (isOnHero) {
          if (isActive) {
            itemStyle = {
              ...itemStyle,
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              color: '#FFFFFF',
              fontWeight: 700,
            };
          } else {
            itemStyle = {
              ...itemStyle,
              backgroundColor: 'transparent',
              color: 'rgba(255, 255, 255, 0.8)',
              fontWeight: 500,
            };
            itemClasses += ' hover:text-white';
          }
        } else {
          if (isActive) {
            itemStyle = {
              ...itemStyle,
              backgroundColor: 'var(--orange)',
              color: '#FFFFFF',
              fontWeight: 600,
            };
          } else {
            itemStyle = {
              ...itemStyle,
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              fontWeight: 500,
            };
            itemClasses += ' hover:text-[var(--text-primary)]';
          }
        }

        return (
          <button
            key={String(itemValue)}
            type="button"
            id={itemId}
            title={itemTitle}
            aria-pressed={isActive}
            onClick={() => onChange?.(itemValue)}
            className={itemClasses}
            style={itemStyle}
          >
            {itemLabel}
          </button>
        );
      })}
    </div>
  );
}
