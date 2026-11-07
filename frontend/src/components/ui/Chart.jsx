import React, { useState, useEffect, useId, useRef, useMemo } from 'react';

/**
 * Format a YYYY-MM-DD date string into a clean short label (e.g. 'Jul 08').
 */
function formatShortDate(dStr) {
  if (!dStr) return '';
  try {
    const parts = dStr.split('-');
    if (parts.length === 3) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return `${months[m] || parts[1]} ${d}`;
    }
  } catch {
    // fallback
  }
  return dStr;
}

export default function Chart({
  series = [],
  height = 240,
  yFormat,
  toggleableLegend = false,
  animate = true,
  className = '',
  variant = 'onDark', // 'onDark' | 'onHero'
  comparePoints = false,
}) {
  const isOnHero = variant === 'onHero';
  const gradientId = useId();
  const primaryPathRef = useRef(null);
  const svgRef = useRef(null);

  const [fillOpacity, setFillOpacity] = useState(animate ? 0 : 1);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [hoverPos, setHoverPos] = useState(null);
  const [anchorIndex, setAnchorIndex] = useState(null);

  // Manage visibility for each series (tracks keys that have been hidden)
  const [hiddenKeys, setHiddenKeys] = useState(() => {
    const hidden = new Set();
    series.forEach((s) => {
      if (s.visible === false) hidden.add(s.key);
    });
    return hidden;
  });

  const toggleSeries = (key) => {
    setHiddenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Collect all unique dates in chronological order
  const allDates = useMemo(() => {
    const dateSet = new Set();
    const dateList = [];
    series.forEach((s) => {
      (s.data || []).forEach((pt) => {
        if (pt && pt.date && !dateSet.has(pt.date)) {
          dateSet.add(pt.date);
          dateList.push(pt.date);
        }
      });
    });
    return dateList;
  }, [series]);

  // Create fast date-to-value map for each series
  const seriesMaps = useMemo(() => {
    return series.map((s) => {
      const map = new Map();
      (s.data || []).forEach((pt) => {
        if (pt && pt.date) {
          const val = pt.value ?? pt.close;
          map.set(pt.date, typeof val === 'number' && !isNaN(val) ? val : null);
        }
      });
      return { ...s, map };
    });
  }, [series]);

  // Draw-in animation for primary line
  useEffect(() => {
    if (!primaryPathRef.current || !animate || allDates.length < 2) {
      setFillOpacity(1);
      return;
    }

    const path = primaryPathRef.current;
    try {
      const length = path.getTotalLength();
      if (length > 0) {
        path.style.transition = 'none';
        path.style.strokeDasharray = `${length}`;
        path.style.strokeDashoffset = `${length}`;
        path.getBoundingClientRect(); // reflow

        path.style.transition = 'stroke-dashoffset 1400ms cubic-bezier(0.16, 1, 0.3, 1)';
        path.style.strokeDashoffset = '0';
      }
    } catch {
      // ignore
    }

    const timer = setTimeout(() => {
      setFillOpacity(1);
    }, 200);

    return () => clearTimeout(timer);
  }, [allDates, animate]);

  // Handle Escape key to clear compare anchor
  useEffect(() => {
    if (!comparePoints) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setAnchorIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [comparePoints]);

  if (!series || series.length === 0 || allDates.length < 2) {
    return (
      <div
        className={`flex items-center justify-center text-xs text-[var(--text-muted)] ${className}`}
        style={{ height }}
      >
        No chart data available
      </div>
    );
  }

  // Active/visible series
  const visibleSeries = seriesMaps.filter((s) => !hiddenKeys.has(s.key));

  // Compute shared Y-scale only across visible series
  const valuesToConsider = [];
  allDates.forEach((d) => {
    visibleSeries.forEach((s) => {
      const val = s.map.get(d);
      if (typeof val === 'number' && !isNaN(val)) {
        valuesToConsider.push(val);
      }
    });
  });

  const minVal = valuesToConsider.length > 0 ? Math.min(...valuesToConsider) : 0;
  const maxVal = valuesToConsider.length > 0 ? Math.max(...valuesToConsider) : 100;
  const span = maxVal - minVal || 1;
  const paddedMin = minVal - span * 0.05;
  const paddedMax = maxVal + span * 0.05;
  const range = paddedMax - paddedMin || 1;

  // Layout dimensions
  const width = 720;
  const marginLeft = 64;
  const marginRight = 16;
  const marginTop = 14;
  const marginBottom = 24;
  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;

  // Y-axis 4 horizontal gridlines & labels
  const gridTicks = [0, 0.333, 0.667, 1.0].map((ratio) => {
    const val = paddedMin + ratio * range;
    const y = marginTop + (1 - ratio) * plotHeight;
    return { val, y };
  });

  // X-axis 4-6 evenly spaced date ticks
  const numDateTicks = Math.min(5, allDates.length);
  const xTicks = [];
  if (allDates.length > 1) {
    for (let k = 0; k < numDateTicks; k++) {
      const idx = Math.round((k / (numDateTicks - 1)) * (allDates.length - 1));
      const dStr = allDates[idx];
      const x = marginLeft + (idx / (allDates.length - 1)) * plotWidth;
      xTicks.push({ date: dStr, x });
    }
  }

  // Build SVG path segments for each visible series (gracefully skipping null/NaN windows)
  const renderedPaths = visibleSeries.map((s, sIndex) => {
    let currentSegment = '';
    const segments = [];

    allDates.forEach((dStr, i) => {
      const x = marginLeft + (i / (allDates.length - 1)) * plotWidth;
      const val = s.map.get(dStr);

      if (val === null || val === undefined || isNaN(val)) {
        if (currentSegment) {
          segments.push(currentSegment);
          currentSegment = '';
        }
      } else {
        const normalizedY = (val - paddedMin) / range;
        const y = marginTop + (1 - normalizedY) * plotHeight;
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

    const pathD = segments.join(' ');
    const isPrimary = sIndex === 0;

    let areaD = null;
    if (isPrimary && segments.length === 1 && !s.dashed) {
      areaD = `${pathD} L ${(marginLeft + plotWidth).toFixed(1)} ${(marginTop + plotHeight).toFixed(1)} L ${marginLeft.toFixed(1)} ${(marginTop + plotHeight).toFixed(1)} Z`;
    }

    return {
      ...s,
      isPrimary,
      pathD,
      areaD,
    };
  });

  const getIdxFromEvent = (e) => {
    if (!svgRef.current || allDates.length < 2) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const normX = (clientX - rect.left) / rect.width;
    const svgX = normX * width;
    const plotX = svgX - marginLeft;
    const ratio = Math.max(0, Math.min(1, plotX / plotWidth));
    const idx = Math.round(ratio * (allDates.length - 1));

    return {
      idx,
      svgX: marginLeft + (idx / (allDates.length - 1)) * plotWidth,
      ratio,
      normY: (clientY - rect.top) / rect.height,
    };
  };

  // Pointer & Touch handlers for crosshair & tooltip
  const handlePointerMove = (e) => {
    const res = getIdxFromEvent(e);
    if (!res) return;
    setHoverIndex(res.idx);
    setHoverPos({
      svgX: res.svgX,
      ratio: res.ratio,
      normY: res.normY,
    });
  };

  const handlePointerLeave = () => {
    setHoverIndex(null);
    setHoverPos(null);
  };

  const handleChartClick = (e) => {
    if (!comparePoints) return;
    const res = getIdxFromEvent(e);
    if (!res) return;

    if (anchorIndex === null) {
      setAnchorIndex(res.idx);
    } else {
      setAnchorIndex(null);
    }
  };

  // Active hovered point details
  const activeDate = hoverIndex !== null ? allDates[hoverIndex] : null;
  const tooltipItems = activeDate
    ? visibleSeries.map((s) => {
        const val = s.map.get(activeDate);
        return {
          key: s.key,
          label: s.label,
          color: s.color,
          dashed: s.dashed,
          value: val,
          ySvg:
            val !== null && val !== undefined && !isNaN(val)
              ? marginTop + (1 - (val - paddedMin) / range) * plotHeight
              : null,
        };
      })
    : [];

  const nonToggleableSeries = series.filter((s) => s.nonToggleable);
  const toggleableSeries = series.filter((s) => !s.nonToggleable);

  // Compare mode data preparation (anchored to primary series = series[0])
  const primarySeries = seriesMaps[0] || null;
  const isComparing = comparePoints && anchorIndex !== null && hoverIndex !== null && anchorIndex !== hoverIndex;

  let compareData = null;
  if (isComparing && primarySeries) {
    const earlyIdx = Math.min(anchorIndex, hoverIndex);
    const lateIdx = Math.max(anchorIndex, hoverIndex);
    const earlyDate = allDates[earlyIdx];
    const lateDate = allDates[lateIdx];
    const earlyVal = primarySeries.map.get(earlyDate);
    const lateVal = primarySeries.map.get(lateDate);

    if (earlyVal !== null && lateVal !== null && earlyVal !== 0) {
      const pctChange = ((lateVal - earlyVal) / earlyVal) * 100;
      compareData = {
        earlyDate,
        earlyVal,
        lateDate,
        lateVal,
        pctChange,
        isPositive: pctChange >= 0,
      };
    }
  }

  const anchorSvgX = anchorIndex !== null ? marginLeft + (anchorIndex / (allDates.length - 1)) * plotWidth : null;
  const anchorVal = anchorIndex !== null && primarySeries ? primarySeries.map.get(allDates[anchorIndex]) : null;
  const anchorSvgY =
    anchorVal !== null && anchorVal !== undefined && !isNaN(anchorVal)
      ? marginTop + (1 - (anchorVal - paddedMin) / range) * plotHeight
      : null;

  return (
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      {/* Legend Row */}
      {(toggleableLegend || series.length > 1) && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs px-1">
          {toggleableLegend ? (
            <>
              {/* Always-visible / Non-toggleable labels (e.g. Price) */}
              <div className="flex items-center gap-3">
                {nonToggleableSeries.map((s) => (
                  <div key={s.key} className="flex items-center gap-1.5 font-semibold" style={{ color: 'var(--text-primary)' }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Toggleable pills (e.g. SMAs) */}
              <div className="flex flex-wrap items-center gap-1.5">
                {toggleableSeries.map((s) => {
                  const isActive = !hiddenKeys.has(s.key);
                  return (
                    <button
                      key={s.key}
                      type="button"
                      id={`legend-toggle-${s.key}`}
                      onClick={() => toggleSeries(s.key)}
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
                          backgroundColor: s.color,
                          transform: isActive ? 'scale(1.1)' : 'scale(0.8)',
                        }}
                      />
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            /* Static Legend for multi-series charts like Forecast (Actual vs Predicted) */
            <div className="flex items-center gap-4">
              {series.map((s) => (
                <div key={s.key} className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full inline-block ${s.dashed ? 'border border-dashed' : ''}`}
                    style={{
                      backgroundColor: s.color,
                      borderColor: s.dashed ? 'var(--border-strong)' : undefined,
                    }}
                  />
                  <span
                    className="font-semibold text-xs"
                    style={{ color: s.color === 'var(--orange)' ? 'var(--text-primary)' : s.color }}
                  >
                    {s.label}
                  </span>
                  {s.dashed && (
                    <span className="text-[11px] font-mono opacity-70 hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
                      (dashed)
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SVG Canvas & Interactive Container */}
      <div className="w-full relative select-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible block"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={isOnHero ? '#FFFFFF' : (series[0]?.color || 'var(--orange)')}
                stopOpacity={isOnHero ? 0.28 : 0.22}
              />
              <stop
                offset={isOnHero ? '100%' : '70%'}
                stopColor={isOnHero ? '#FFFFFF' : (series[0]?.color || 'var(--orange)')}
                stopOpacity={isOnHero ? 0.0 : 0.04}
              />
              {!isOnHero && (
                <stop
                  offset="100%"
                  stopColor={series[0]?.color || 'var(--orange)'}
                  stopOpacity={0.0}
                />
              )}
            </linearGradient>
          </defs>

          {/* Translucent Compare Band between anchor and hover */}
          {comparePoints && anchorIndex !== null && hoverIndex !== null && anchorIndex !== hoverIndex && (
            <rect
              x={Math.min(anchorSvgX, hoverPos.svgX)}
              y={marginTop}
              width={Math.abs(hoverPos.svgX - anchorSvgX)}
              height={plotHeight}
              fill={isOnHero ? 'rgba(255, 255, 255, 0.16)' : 'rgba(232, 115, 74, 0.15)'}
            />
          )}

          {/* Y-Axis Horizontal Gridlines & Value Labels */}
          {gridTicks.map((t, idx) => (
            <g key={`grid-${idx}`}>
              <line
                x1={marginLeft}
                y1={t.y}
                x2={marginLeft + plotWidth}
                y2={t.y}
                stroke={isOnHero ? 'rgba(255, 255, 255, 0.18)' : 'var(--border)'}
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity={isOnHero ? 1 : 0.45}
              />
              <text
                x={marginLeft - 8}
                y={t.y + 3.5}
                textAnchor="end"
                fontSize="10"
                fill={isOnHero ? 'rgba(255, 255, 255, 0.8)' : 'var(--text-muted)'}
                fontFamily="var(--font-mono)"
              >
                {yFormat ? yFormat(t.val) : t.val.toFixed(1)}
              </text>
            </g>
          ))}

          {/* X-Axis Date Labels along the bottom */}
          {xTicks.map((t, idx) => (
            <text
              key={`xtick-${idx}`}
              x={t.x}
              y={marginTop + plotHeight + 16}
              textAnchor="middle"
              fontSize="10"
              fill={isOnHero ? 'rgba(255, 255, 255, 0.8)' : 'var(--text-muted)'}
              fontFamily="var(--font-mono)"
            >
              {formatShortDate(t.date)}
            </text>
          ))}

          {/* Gradient Area Fill under Primary Series */}
          {renderedPaths.map(
            (p) =>
              p.areaD && (
                <path
                  key={`area-${p.key}`}
                  d={p.areaD}
                  fill={`url(#${gradientId})`}
                  style={{
                    opacity: fillOpacity,
                    transition: 'opacity 800ms ease-out',
                  }}
                />
              )
          )}

          {/* Series Lines */}
          {renderedPaths.map((p) => {
            const isPrimaryHero = p.isPrimary && isOnHero;
            return (
              <path
                key={`line-${p.key}`}
                ref={p.isPrimary && !p.dashed ? primaryPathRef : undefined}
                d={p.pathD}
                fill="none"
                stroke={isPrimaryHero ? '#FFFFFF' : p.color}
                strokeWidth={isPrimaryHero ? '2' : p.isPrimary ? '2.4' : p.dashed ? '2.0' : '1.8'}
                strokeDasharray={p.dashed ? '5,4' : undefined}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={p.isPrimary ? '1.0' : '0.9'}
              />
            );
          })}

          {/* Anchor Pin Marker (Compare mode) */}
          {comparePoints && anchorIndex !== null && anchorSvgX !== null && (
            <g>
              <line
                x1={anchorSvgX}
                y1={marginTop}
                x2={anchorSvgX}
                y2={marginTop + plotHeight}
                stroke={isOnHero ? 'rgba(255, 255, 255, 0.8)' : 'var(--orange)'}
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              {anchorSvgY !== null && (
                <circle
                  cx={anchorSvgX}
                  cy={anchorSvgY}
                  r="5"
                  fill={isOnHero ? '#FFFFFF' : 'var(--orange)'}
                  stroke={isOnHero ? 'var(--orange)' : 'var(--surface)'}
                  strokeWidth="2"
                />
              )}
            </g>
          )}

          {/* Hover Crosshair Vertical Line */}
          {hoverPos && (
            <line
              x1={hoverPos.svgX}
              y1={marginTop}
              x2={hoverPos.svgX}
              y2={marginTop + plotHeight}
              stroke={isOnHero ? 'rgba(255, 255, 255, 0.55)' : 'var(--orange)'}
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity={isOnHero ? 1 : 0.65}
            />
          )}

          {/* Hover Target Indicator Dots */}
          {hoverPos &&
            tooltipItems.map(
              (item) =>
                item.ySvg !== null && (
                  <circle
                    key={`dot-${item.key}`}
                    cx={hoverPos.svgX}
                    cy={item.ySvg}
                    r="4"
                    fill={isOnHero ? '#FFFFFF' : item.color}
                    stroke={isOnHero ? 'var(--orange)' : 'var(--surface)'}
                    strokeWidth="2"
                  />
                )
            )}

          {/* Interactive Overlay capturing pointer, click and touch events */}
          <rect
            x={marginLeft}
            y={marginTop}
            width={plotWidth}
            height={plotHeight}
            fill="transparent"
            className="cursor-crosshair"
            style={{ touchAction: 'pan-y' }}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            onClick={handleChartClick}
            onTouchStart={handlePointerMove}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerLeave}
          />
        </svg>

        {/* Hover Crosshair Floating Tooltip */}
        {hoverPos && activeDate && (
          <div
            id="chart-hover-tooltip"
            className="absolute pointer-events-none z-30 transition-transform duration-75 shadow-2xl"
            style={{
              left: `${(hoverPos.svgX / width) * 100}%`,
              top: `${Math.max(12, Math.min(68, (hoverPos.normY || 0.3) * 100))}%`,
              transform: hoverPos.ratio > 0.5 ? 'translate(-105%, -50%)' : 'translate(14px, -50%)',
              backgroundColor: isOnHero ? 'rgba(11, 13, 20, 0.82)' : 'var(--surface)',
              borderColor: isOnHero ? 'rgba(255, 255, 255, 0.12)' : 'var(--border-strong)',
              borderWidth: '1px',
              borderStyle: 'solid',
              backdropFilter: 'blur(16px)',
              borderRadius: isOnHero ? '10px' : '14px',
              padding: isOnHero ? '8px 10px' : '12px',
              color: isOnHero ? '#F5F3EF' : 'var(--text-primary)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
            }}
          >
            {isComparing && compareData ? (
              /* Compare Two Points Mode Tooltip */
              <div className="flex flex-col gap-1.5 min-w-[150px]">
                {/* Line 1: Earlier date + value */}
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-mono" style={{ color: isOnHero ? 'rgba(255, 255, 255, 0.75)' : 'var(--text-secondary)' }}>
                    {compareData.earlyDate}
                  </span>
                  <span className="font-mono font-bold">
                    {yFormat ? yFormat(compareData.earlyVal) : compareData.earlyVal.toFixed(2)}
                  </span>
                </div>

                {/* Pill with signed % change */}
                <div className="my-1 flex items-center justify-center">
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
                    style={
                      isOnHero
                        ? {
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            color: '#FFFFFF',
                          }
                        : {
                            backgroundColor: compareData.isPositive ? 'rgba(52, 211, 153, 0.15)' : 'rgba(248, 113, 113, 0.15)',
                            color: compareData.isPositive ? 'var(--green)' : 'var(--red)',
                          }
                    }
                  >
                    <span>{compareData.isPositive ? '▲' : '▼'}</span>
                    <span>
                      {compareData.isPositive ? '+' : '−'}
                      {Math.abs(compareData.pctChange).toFixed(2)}%
                    </span>
                  </span>
                </div>

                {/* Line 3: Later date + value */}
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-mono" style={{ color: isOnHero ? 'rgba(255, 255, 255, 0.75)' : 'var(--text-secondary)' }}>
                    {compareData.lateDate}
                  </span>
                  <span className="font-mono font-bold">
                    {yFormat ? yFormat(compareData.lateVal) : compareData.lateVal.toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              /* Single Point Tooltip */
              <>
                <div
                  className="text-xs font-mono font-bold mb-2 pb-1 border-b"
                  style={{
                    color: isOnHero ? '#F5F3EF' : 'var(--text-primary)',
                    borderColor: isOnHero ? 'rgba(255, 255, 255, 0.15)' : 'var(--border)',
                  }}
                >
                  {activeDate}
                </div>
                <div className="flex flex-col gap-1.5 min-w-[130px]">
                  {tooltipItems.map((item) => (
                    <div key={item.key} className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: isOnHero && item.key === primarySeries?.key ? '#FFFFFF' : item.color,
                            border: item.dashed ? '1px dashed var(--border-strong)' : undefined,
                          }}
                        />
                        <span style={{ color: isOnHero ? 'rgba(255, 255, 255, 0.75)' : 'var(--text-secondary)' }}>
                          {item.label}
                        </span>
                      </div>
                      <span
                        className="font-mono font-bold"
                        style={{ color: isOnHero ? '#F5F3EF' : 'var(--text-primary)' }}
                      >
                        {item.value !== null && item.value !== undefined && !isNaN(item.value)
                          ? yFormat
                            ? yFormat(item.value)
                            : item.value.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                          : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Compare Points Hint Line */}
      {comparePoints && (
        <div className="text-[11px] text-center" style={{ color: isOnHero ? 'rgba(255, 255, 255, 0.7)' : 'var(--text-muted)' }}>
          {anchorIndex !== null ? 'Click again to clear' : 'Click a point, then hover another to compare'}
        </div>
      )}
    </div>
  );
}
