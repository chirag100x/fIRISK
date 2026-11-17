import React from 'react';
import Segmented from './Segmented';

export default function DateRangeControl({
  value = '1Y',
  onChange,
  options = ['1M', '3M', '6M', '1Y'],
  className = '',
  ...props
}) {
  const segmentedOptions = options.map((opt) => {
    const id = typeof opt === 'string' ? opt : opt.id;
    const label = typeof opt === 'string' ? opt : opt.label;
    return {
      value: id,
      label,
      id: `range-btn-${String(id).toLowerCase()}`,
    };
  });

  return (
    <Segmented
      options={segmentedOptions}
      value={value}
      onChange={onChange}
      className={className}
      {...props}
    />
  );
}
