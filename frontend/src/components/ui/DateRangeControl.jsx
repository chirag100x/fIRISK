import React from 'react';

export default function DateRangeControl({
  value = '1Y',
  onChange,
  options = ['1M', '3M', '6M', '1Y'],
  className = '',
}) {
  return (
    <div
      className={`flex items-center gap-1 p-1 rounded-xl bg-[var(--surface)] border border-[var(--border)] ${className}`}
    >
      {options.map((opt) => {
        const id = typeof opt === 'string' ? opt : opt.id;
        const label = typeof opt === 'string' ? opt : opt.label;
        const isActive = value === id;
        return (
          <button
            key={id}
            type="button"
            id={`range-btn-${id}`}
            onClick={() => onChange(id)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              isActive ? 'shadow-sm' : 'hover:text-[var(--text-primary)]'
            }`}
            style={{
              backgroundColor: isActive ? 'var(--gold)' : 'transparent',
              color: isActive ? '#0B0D14' : 'var(--text-secondary)',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
