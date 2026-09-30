import React from 'react';
import { DEFAULT_FORECAST_PRESETS } from '../../lib/forecastConstants';

export default function PresetControl({
  value = 'standard',
  onChange,
  presets = DEFAULT_FORECAST_PRESETS,
  className = '',
}) {
  return (
    <div
      className={`flex items-center gap-1 p-1 rounded-xl bg-[var(--surface)] border border-[var(--border)] ${className}`}
    >
      {presets.map((preset) => {
        const isActive = value === preset.id;
        return (
          <button
            key={preset.id}
            type="button"
            id={`preset-btn-${preset.id}`}
            onClick={() => onChange(preset.id)}
            title={preset.desc || preset.label}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              isActive ? 'shadow-sm' : 'hover:text-[var(--text-primary)]'
            }`}
            style={{
              backgroundColor: isActive ? 'var(--gold)' : 'transparent',
              color: isActive ? '#0B0D14' : 'var(--text-secondary)',
            }}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}
