import React from 'react';

export default function Segmented({
  options = [],
  value,
  onChange,
  className = '',
  style = {},
  id,
  ...props
}) {
  return (
    <div
      id={id}
      className={`seg inline-flex items-center select-none ${className}`}
      style={{
        display: 'inline-flex',
        gap: '2px',
        padding: '3px',
        borderRadius: '999px',
        background: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        ...style,
      }}
      role="radiogroup"
      {...props}
    >
      {options.map((opt) => {
        const itemValue = typeof opt === 'object' && opt !== null ? opt.value : opt;
        const itemLabel = typeof opt === 'object' && opt !== null ? (opt.label ?? opt.value) : opt;
        const itemId = typeof opt === 'object' && opt !== null ? opt.id : undefined;
        const itemTitle = typeof opt === 'object' && opt !== null ? opt.title : undefined;
        const isActive = value === itemValue;

        const activeStyles = {
          background: 'linear-gradient(180deg, #ecedf1, #c9ccd4)',
          color: '#1b1d24',
          fontWeight: 600,
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.35)',
        };

        const inactiveStyles = {
          background: 'transparent',
          color: '#c9cbd1',
          fontWeight: 400,
        };

        return (
          <button
            key={String(itemValue)}
            type="button"
            id={itemId}
            title={itemTitle}
            aria-pressed={isActive}
            onClick={() => onChange?.(itemValue)}
            className={`transition-all border-none outline-none cursor-pointer ${
              isActive ? 'on' : 'hover:text-white'
            }`}
            style={{
              fontSize: '13px',
              padding: '6px 13px',
              borderRadius: '999px',
              whiteSpace: 'nowrap',
              lineHeight: 1,
              ...(isActive ? activeStyles : inactiveStyles),
            }}
          >
            {itemLabel}
          </button>
        );
      })}
    </div>
  );
}
