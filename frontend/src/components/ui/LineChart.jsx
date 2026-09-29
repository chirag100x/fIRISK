import React, { useEffect, useId, useRef, useState } from 'react';

export default function LineChart({
  data = [],
  color = 'var(--gold)',
  height = 140,
  animate = true,
  className = '',
}) {
  const gradientId = useId();
  const pathRef = useRef(null);
  const [fillOpacity, setFillOpacity] = useState(animate ? 0 : 1);

  useEffect(() => {
    if (!pathRef.current || !animate || data.length < 2) {
      setFillOpacity(1);
      return;
    }

    const path = pathRef.current;
    const length = path.getTotalLength();

    path.style.transition = 'none';
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;
    // Force DOM reflow
    path.getBoundingClientRect();

    path.style.transition = 'stroke-dashoffset 1400ms cubic-bezier(0.16, 1, 0.3, 1)';
    path.style.strokeDashoffset = '0';

    const timer = setTimeout(() => {
      setFillOpacity(1);
    }, 200);

    return () => clearTimeout(timer);
  }, [data, animate]);

  if (!data || data.length < 2) {
    return (
      <div
        className={`flex items-center justify-center text-xs text-[var(--text-muted)] ${className}`}
        style={{ height }}
      >
        No chart data available
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const width = 600;
  const padTop = 12;
  const padBottom = 12;
  const usableHeight = height - padTop - padBottom;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const normalizedY = (d.value - minVal) / range;
    const y = padTop + (1 - normalizedY) * usableHeight;
    return { x, y };
  });

  const linePathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}` : `${acc} L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
  }, '');

  const areaPathD = `${linePathD} L ${width} ${height} L 0 ${height} Z`;

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible block"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="70%" stopColor={color} stopOpacity="0.06" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Gradient Area Fill under the line */}
        <path
          d={areaPathD}
          fill={`url(#${gradientId})`}
          style={{
            opacity: fillOpacity,
            transition: 'opacity 800ms ease-out',
          }}
        />

        {/* Animated Line Stroke */}
        <path
          ref={pathRef}
          d={linePathD}
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
