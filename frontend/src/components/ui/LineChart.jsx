import React from 'react';
import Chart from './Chart';

export default function LineChart({
  data = [],
  color = 'var(--gold)',
  height = 140,
  animate = true,
  className = '',
}) {
  return (
    <Chart
      series={[
        {
          key: 'series',
          label: 'Index',
          color,
          data,
          visible: true,
        },
      ]}
      height={height}
      animate={animate}
      className={className}
      toggleableLegend={false}
    />
  );
}
