import React from 'react';

export default function GlassPanel({
  variant = 'default', // 'hero' | 'stat' | 'statNeg' | 'holdings' | 'default'
  children,
  className = '',
  style = {},
  ...props
}) {
  let variantStyles = {};

  if (variant === 'hero') {
    variantStyles = {
      borderRadius: '18px',
      padding: '28px 27px 27px 28px',
      marginBottom: '15px',
      position: 'relative',
      background:
        'radial-gradient(520px 340px at 0% 58%, rgba(190,200,225,.13), transparent 70%), radial-gradient(520px 340px at 100% 58%, rgba(190,200,225,.12), transparent 70%), linear-gradient(180deg, rgba(255,255,255,.15), rgba(255,255,255,.085))',
    };
  } else if (variant === 'stat') {
    variantStyles = {
      borderRadius: '12px',
      padding: '16px 18px 14px 22px',
      background: 'linear-gradient(180deg, rgba(255,255,255,.19), rgba(255,255,255,.12))',
    };
  } else if (variant === 'statNeg') {
    variantStyles = {
      borderRadius: '12px',
      padding: '16px 18px 14px 22px',
      background: 'linear-gradient(180deg, var(--loss-fill), rgba(255,90,110,.15))',
      borderColor: 'rgba(255,130,140,.32)',
      borderTopColor: 'rgba(255,170,175,.4)',
    };
  } else if (variant === 'holdings') {
    variantStyles = {
      borderRadius: '18px',
      padding: '0 20px 6px',
      background: 'linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.07))',
    };
  } else {
    variantStyles = {
      borderRadius: '14px',
      padding: '20px',
      background: 'linear-gradient(180deg, rgba(255,255,255,.14), rgba(255,255,255,.08))',
    };
  }

  const variantClass =
    variant === 'hero'
      ? 'hero'
      : variant === 'stat'
      ? 'stat'
      : variant === 'statNeg'
      ? 'stat neg'
      : variant === 'holdings'
      ? 'holdings'
      : '';

  return (
    <div
      className={`glass ${variantClass} ${className}`.trim()}
      style={{
        ...variantStyles,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
