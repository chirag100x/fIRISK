import React from 'react';
import GlassPanel from './GlassPanel';

export default function StatCard({
  label,
  value,
  tone = 'neutral', // 'neutral' | 'loss' | 'down' | 'up'
  valueTone, // optional override: 'loss' | 'gain' | 'neutral'
  className = '',
  style = {},
  ...props
}) {
  const isNegCard = tone === 'loss';
  const isLossText = isNegCard || valueTone === 'loss' || valueTone === 'down' || tone === 'down';

  const valueColor = isLossText
    ? 'var(--loss-text)'
    : valueTone === 'gain' || valueTone === 'up'
    ? 'var(--gain-text)'
    : '#ffffff';

  return (
    <GlassPanel
      variant={isNegCard ? 'statNeg' : 'stat'}
      className={`flex flex-col justify-between ${className}`}
      style={{
        borderRadius: '12px',
        padding: '16px 18px 14px 22px',
        minHeight: '84px',
        ...style,
      }}
      {...props}
    >
      <div
        style={{
          fontSize: '13px',
          lineHeight: '16px',
          color: 'var(--label-card)',
          fontWeight: 400,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '26px',
          lineHeight: '30px',
          marginTop: '6px',
          fontWeight: 400,
          color: valueColor,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
    </GlassPanel>
  );
}
