import React, { useEffect, useId, useRef, useState } from 'react';

export default function ForecastChart({
  backtest = [],
  height = 240,
  animate = true,
  className = '',
}) {
  const gradientId = useId();
  const actualPathRef = useRef(null);
  const [fillOpacity, setFillOpacity] = useState(animate ? 0 : 1);

  // Draw-in animation for the actual line and gradient fill
  useEffect(() => {
    if (!actualPathRef.current || !animate || backtest.length < 2) {
      setFillOpacity(1);
      return;
    }

    const path = actualPathRef.current;
    const length = path.getTotalLength();

    path.style.transition = 'none';
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;
    path.getBoundingClientRect(); // reflow

    path.style.transition = 'stroke-dashoffset 1400ms cubic-bezier(0.16, 1, 0.3, 1)';
    path.style.strokeDashoffset = '0';

    const timer = setTimeout(() => {
      setFillOpacity(1);
    }, 200);

    return () => clearTimeout(timer);
  }, [backtest, animate]);

  if (!backtest || backtest.length < 2) {
    return (
      <div
        className={`flex items-center justify-center text-xs text-[var(--text-muted)] ${className}`}
        style={{ height }}
      >
        No backtest forecast data available
      </div>
    );
  }

  // Calculate global min and max across all actual and predicted values
  const valuesToConsider = [];
  backtest.forEach((pt) => {
    if (typeof pt.actual === 'number' && !isNaN(pt.actual)) {
      valuesToConsider.push(pt.actual);
    }
    if (typeof pt.predicted === 'number' && !isNaN(pt.predicted)) {
      valuesToConsider.push(pt.predicted);
    }
  });

  const minVal = valuesToConsider.length > 0 ? Math.min(...valuesToConsider) : 0;
  const maxVal = valuesToConsider.length > 0 ? Math.max(...valuesToConsider) : 100;
  const span = maxVal - minVal || 1;
  const paddedMin = minVal - span * 0.06;
  const paddedMax = maxVal + span * 0.06;
  const range = paddedMax - paddedMin || 1;

  const width = 700;
  const padTop = 14;
  const padBottom = 16;
  const usableHeight = height - padTop - padBottom;

  // Build points for actual line
  const actualPoints = backtest.map((d, i) => {
    const x = (i / (backtest.length - 1)) * width;
    const normalizedY = (d.actual - paddedMin) / range;
    const y = padTop + (1 - normalizedY) * usableHeight;
    return { x, y };
  });

  const actualPathD = actualPoints.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}` : `${acc} L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
  }, '');

  const areaPathD = `${actualPathD} L ${width} ${height} L 0 ${height} Z`;

  // Build points for predicted line
  const predictedPoints = backtest.map((d, i) => {
    const x = (i / (backtest.length - 1)) * width;
    const normalizedY = (d.predicted - paddedMin) / range;
    const y = padTop + (1 - normalizedY) * usableHeight;
    return { x, y };
  });

  const predictedPathD = predictedPoints.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}` : `${acc} L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
  }, '');

  const startDate = backtest[0]?.date || '';
  const endDate = backtest[backtest.length - 1]?.date || '';

  return (
    <div className={`flex flex-col gap-3 w-full ${className}`}>
      {/* Legend Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs px-1">
        <div className="flex items-center gap-4">
          {/* Actual Price Swatch */}
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: 'var(--gold)' }}
            />
            <span className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>
              Actual
            </span>
          </div>

          {/* Predicted Price Swatch */}
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block border border-dashed"
              style={{
                backgroundColor: '#3B7A8F',
                borderColor: 'var(--border-strong)',
              }}
            />
            <span className="font-semibold text-xs" style={{ color: '#3B7A8F' }}>
              Predicted
            </span>
            <span
              className="text-[11px] font-mono opacity-70 hidden sm:inline"
              style={{ color: 'var(--text-muted)' }}
            >
              (dashed)
            </span>
          </div>
        </div>

        {/* Date Span */}
        {startDate && endDate && (
          <div className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
            Backtest: {startDate} → {endDate}
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-hidden relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible block"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.22" />
              <stop offset="70%" stopColor="var(--gold)" stopOpacity="0.04" />
              <stop offset="100%" stopColor="var(--gold)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Gradient Area Fill under Actual */}
          <path
            d={areaPathD}
            fill={`url(#${gradientId})`}
            style={{
              opacity: fillOpacity,
              transition: 'opacity 800ms ease-out',
            }}
          />

          {/* Predicted Line (Dashed Stroke in Teal #3B7A8F) */}
          <path
            d={predictedPathD}
            fill="none"
            stroke="#3B7A8F"
            strokeWidth="2"
            strokeDasharray="5,4"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.95"
          />

          {/* Actual Line (Solid Stroke in Gold) */}
          <path
            ref={actualPathRef}
            d={actualPathD}
            fill="none"
            stroke="var(--gold)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
