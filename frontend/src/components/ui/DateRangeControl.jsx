import React from 'react';
import Segmented from './Segmented';

export default function DateRangeControl({
  value = '1Y',
  onChange,
  options = ['1M', '3M', '6M', '1Y'],
  variant = 'default',
  className = '',
  ...props
}) {
  const segmentedOptions = options.map((opt) => {
    const id = typeof opt === 'string' ? opt : opt.id;
    const label = typeof opt === 'string' ? opt : opt.label;
    return {
      value: id,
      label,
      id: `range-btn-${id}`,
    };
  });

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
