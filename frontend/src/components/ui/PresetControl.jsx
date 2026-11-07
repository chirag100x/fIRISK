import React from 'react';
import Segmented from './Segmented';
import { DEFAULT_FORECAST_PRESETS } from '../../lib/forecastConstants';

export default function PresetControl({
  value = 'standard',
  onChange,
  presets = DEFAULT_FORECAST_PRESETS,
  variant = 'default',
  className = '',
  ...props
}) {
  const segmentedOptions = presets.map((preset) => ({
    value: preset.id,
    label: preset.label,
    id: `preset-btn-${preset.id}`,
    title: preset.desc || preset.label,
  }));

  return (
    <Segmented
      options={segmentedOptions}
      value={value}
      onChange={onChange}
      variant={variant}
      className={className}
      {...props}
    />
  );
}
