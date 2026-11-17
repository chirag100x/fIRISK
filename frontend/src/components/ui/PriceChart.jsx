import React from 'react';
import Chart from './Chart';
import CHART_THEME from '../../lib/chartTheme';

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
      color: CHART_THEME.primary.stroke,
      dashed: false,
      nonToggleable: true,
      visible: true,
      data: (priceData || []).map((p) => ({ date: p.date, value: p.close })),
    },
    {
      key: 'sma_20',
      label: 'SMA 20',
      color: CHART_THEME.secondary.sma20.color,
      dashed: false,
      visible: true,
      data: (smaData || []).map((s) => ({ date: s.date, value: s.sma_20 })),
    },
    {
      key: 'sma_50',
      label: 'SMA 50',
      color: CHART_THEME.secondary.sma50.color,
      dashed: false,
      visible: true,
      data: (smaData || []).map((s) => ({ date: s.date, value: s.sma_50 })),
    },
    {
      key: 'sma_7',
      label: 'SMA 7',
      color: CHART_THEME.secondary.sma7.color,
      dashed: false,
      visible: false,
      data: (smaData || []).map((s) => ({ date: s.date, value: s.sma_7 })),
    },
    {
      key: 'sma_200',
      label: 'SMA 200',
      color: CHART_THEME.secondary.sma200.color,
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
      comparePoints={true}
    />
  );
}
