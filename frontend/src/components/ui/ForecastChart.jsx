import React from 'react';
import Chart from './Chart';

export default function ForecastChart({
  backtest = [],
  height = 240,
  animate = true,
  currency = '$',
  className = '',
}) {
  const series = [
    {
      key: 'actual',
      label: 'Actual',
      color: 'var(--gold)',
      dashed: false,
      visible: true,
      data: (backtest || []).map((b) => ({ date: b.date, value: b.actual })),
    },
    {
      key: 'predicted',
      label: 'Predicted',
      color: '#3B7A8F',
      dashed: true,
      visible: true,
      data: (backtest || []).map((b) => ({ date: b.date, value: b.predicted })),
    },
  ];

  const yFormat = (val) =>
    `${currency}${val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <Chart
      series={series}
      height={height}
      yFormat={yFormat}
      toggleableLegend={false}
      animate={animate}
      className={className}
    />
  );
}
