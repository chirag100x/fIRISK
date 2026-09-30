import React, { useState, useEffect, useId, useRef, useMemo } from 'react';

const SMA_CONFIGS = [
  { key: 'sma_20', label: 'SMA 20', color: '#3B7A8F', defaultActive: true },
  { key: 'sma_50', label: 'SMA 50', color: '#B59A57', defaultActive: true },
  { key: 'sma_7', label: 'SMA 7', color: '#8B8D9A', defaultActive: false },
  { key: 'sma_200', label: 'SMA 200', color: '#6B7280', defaultActive: false },
];

export default function PriceChart({
  priceData = [],
  smaData = [],
  height = 240,
  animate = true,
  className = '',
}) {
  const gradientId = useId();
  const pathRef = useRef(null);
  const [fillOpacity, setFillOpacity] = useState(animate ? 0 : 1);

  // Active state for each SMA line
  const [activeSMAs, setActiveSMAs] = useState({
    sma_20: true,
    sma_50: true,
    sma_7: false,
    sma_200: false,
  });

  const toggleSMA = (key) => {
    setActiveSMAs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Draw-in animation for main price line
  useEffect(() => {
    if (!pathRef.current || !animate || priceData.length < 2) {
      setFillOpacity(1);
      return;
    }

    const path = pathRef.current;
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
  }, [priceData, animate]);

  // Map dates to SMA values
  const smaMap = useMemo(() => {
    const map = new Map();
    (smaData || []).forEach((item) => {
      if (item && item.date) {
        map.set(item.date, item);
      }
    });
    return map;
  }, [smaData]);

  if (!priceData || priceData.length < 2) {
    return (
      <div
        className={`flex items-center justify-center text-xs text-[var(--text-muted)] ${className}`}
        style={{ height }}
      >
        No price data available
      </div>
    );
  }

  // Calculate global min and max among all currently visible lines
  const valuesToConsider = [];
  priceData.forEach((p) => {
    const c = p.close ?? p.value;
    if (typeof c === 'number' && !isNaN(c)) {
      valuesToConsider.push(c);
    }

    const smaObj = smaMap.get(p.date);
    if (smaObj) {
      SMA_CONFIGS.forEach((cfg) => {
        if (activeSMAs[cfg.key]) {
          const val = smaObj[cfg.key];
          if (typeof val === 'number' && !isNaN(val)) {
            valuesToConsider.push(val);
          }
        }
      });
    }
  });

  const minVal = valuesToConsider.length > 0 ? Math.min(...valuesToConsider) : 0;
  const maxVal = valuesToConsider.length > 0 ? Math.max(...valuesToConsider) : 100;
  const span = maxVal - minVal || 1;
  const paddedMin = minVal - span * 0.04;
  const paddedMax = maxVal + span * 0.04;
  const range = paddedMax - paddedMin || 1;

  const width = 700;
  const padTop = 14;
  const padBottom = 16;
  const usableHeight = height - padTop - padBottom;

  // Build price line points & SVG path
  const pricePoints = priceData.map((d, i) => {
    const x = (i / (priceData.length - 1)) * width;
    const c = d.close ?? d.value;
    const normalizedY = (c - paddedMin) / range;
    const y = padTop + (1 - normalizedY) * usableHeight;
    return { x, y };
  });

  const pricePathD = pricePoints.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}` : `${acc} L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
  }, '');

  const areaPathD = `${pricePathD} L ${width} ${height} L 0 ${height} Z`;

  // Build paths for each active SMA line (gracefully skipping null/undefined windows)
  const smaPaths = SMA_CONFIGS.map((cfg) => {
    if (!activeSMAs[cfg.key]) return null;

    let currentSegment = '';
    const segments = [];

    priceData.forEach((p, i) => {
      const x = (i / (priceData.length - 1)) * width;
      const smaObj = smaMap.get(p.date);
      const val = smaObj ? smaObj[cfg.key] : null;

      if (val === null || val === undefined || isNaN(val)) {
        if (currentSegment) {
          segments.push(currentSegment);
          currentSegment = '';
        }
      } else {
        const normalizedY = (val - paddedMin) / range;
        const y = padTop + (1 - normalizedY) * usableHeight;
        if (!currentSegment) {
          currentSegment = `M ${x.toFixed(1)} ${y.toFixed(1)}`;
        } else {
          currentSegment += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
        }
      }
    });

    if (currentSegment) {
      segments.push(currentSegment);
    }

    return {
      ...cfg,
      pathD: segments.join(' '),
    };
  }).filter(Boolean);

  return (
    <div className={`flex flex-col gap-3 w-full ${className}`}>
      {/* Legend Row: Price & Toggleable SMAs */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs px-1">
        <div className="flex items-center gap-2">
          {/* Main Price Indicator */}
          <div className="flex items-center gap-1.5 font-semibold" style={{ color: 'var(--text-primary)' }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--gold)' }} />
            <span>Price (Close)</span>
          </div>
        </div>

        {/* Toggleable SMA Overlays */}
        <div className="flex flex-wrap items-center gap-1.5">
          {SMA_CONFIGS.map((cfg) => {
            const isActive = activeSMAs[cfg.key];
            return (
              <button
                key={cfg.key}
                type="button"
                id={`legend-toggle-${cfg.key}`}
                onClick={() => toggleSMA(cfg.key)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                  isActive
                    ? 'border-[var(--border-strong)]'
                    : 'border-transparent opacity-40 hover:opacity-75'
                }`}
                style={{
                  backgroundColor: isActive ? 'var(--surface-hero)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                <span
                  className="w-2 h-2 rounded-full transition-transform"
                  style={{
                    backgroundColor: cfg.color,
                    transform: isActive ? 'scale(1.1)' : 'scale(0.8)',
                  }}
                />
                <span>{cfg.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Chart Canvas */}
      <div className="w-full overflow-hidden relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible block"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.25" />
              <stop offset="70%" stopColor="var(--gold)" stopOpacity="0.05" />
              <stop offset="100%" stopColor="var(--gold)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Gradient Area Fill under price */}
          <path
            d={areaPathD}
            fill={`url(#${gradientId})`}
            style={{
              opacity: fillOpacity,
              transition: 'opacity 800ms ease-out',
            }}
          />

          {/* Toggleable SMA Overlay Lines */}
          {smaPaths.map((sma) => (
            <path
              key={sma.key}
              d={sma.pathD}
              fill="none"
              stroke={sma.color}
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />
          ))}

          {/* Main Animated Price Line */}
          <path
            ref={pathRef}
            d={pricePathD}
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
