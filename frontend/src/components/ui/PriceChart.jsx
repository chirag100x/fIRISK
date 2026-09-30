import React from 'react';
import Chart from './Chart';

export default function PriceChart({
  priceData = [],
  smaData = [],
  height = 240,
  animate = true,
  currency = '$',
  className = '',
}) {
  const series = [
    {
      key: 'close',
      label: 'Price (Close)',
      color: 'var(--gold)',
      dashed: false,
      nonToggleable: true,
      visible: true,
      data: (priceData || []).map((p) => ({ date: p.date, value: p.close })),
    },
    {
      key: 'sma_20',
      label: 'SMA 20',
      color: '#3B7A8F',
      dashed: false,
      visible: true,
      data: (smaData || []).map((s) => ({ date: s.date, value: s.sma_20 })),
    },
    {
      key: 'sma_50',
      label: 'SMA 50',
      color: '#B59A57',
      dashed: false,
      visible: true,
      data: (smaData || []).map((s) => ({ date: s.date, value: s.sma_50 })),
    },
    {
      key: 'sma_7',
      label: 'SMA 7',
      color: '#8B8D9A',
      dashed: false,
      visible: false,
      data: (smaData || []).map((s) => ({ date: s.date, value: s.sma_7 })),
    },
    {
      key: 'sma_200',
      label: 'SMA 200',
      color: '#6B7280',
      dashed: false,
      visible: false,
      data: (smaData || []).map((s) => ({ date: s.date, value: s.sma_200 })),
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
      toggleableLegend={true}
      animate={animate}
      className={className}
    />
  );
}
