import React, { useState, useEffect, useId, useRef, useMemo } from 'react';
import CHART_THEME from '../../lib/chartTheme';

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

function smoothPath(p) {
  if (!p || p.length === 0) return '';
  if (p.length === 1) return `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
  let d = 'M' + p[0][0].toFixed(1) + ',' + p[0][1].toFixed(1);
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] || p2;
    const t = 0.16;
    d +=
      ' C' +
      (p1[0] + (p2[0] - p0[0]) * t).toFixed(1) +
      ',' +
      (p1[1] + (p2[1] - p0[1]) * t).toFixed(1) +
      ' ' +
      (p2[0] - (p3[0] - p1[0]) * t).toFixed(1) +
      ',' +
      (p2[1] - (p3[1] - p1[1]) * t).toFixed(1) +
      ' ' +
      p2[0].toFixed(1) +
      ',' +
      p2[1].toFixed(1);
  }
  return d;
}

export default function Chart({
  series = [],
  height = 196,
  yFormat,
  toggleableLegend = false,
  animate = true,
  className = '',
  comparePoints = false,
}) {
  const plotRef = useRef(null);
  const primaryPathRef = useRef(null);
  const gradientId = useId();
  const blurId = useId();

  const [plotDims, setPlotDims] = useState({ width: 700, height: 172 });
  const [fillOpacity, setFillOpacity] = useState(animate ? 0 : 1);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [hoverPos, setHoverPos] = useState(null);
  const [anchorIndex, setAnchorIndex] = useState(null);

  // ResizeObserver to measure exact client width and height of the plot container
  useEffect(() => {
    if (!plotRef.current) return;
    const el = plotRef.current;
    const updateDims = () => {
      const w = el.clientWidth || 700;
      const h = el.clientHeight || (height - 24);
      setPlotDims({ width: w, height: h });
    };
    updateDims();

    const ro = new ResizeObserver(() => {
      updateDims();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [height]);

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

  // Check prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Draw-in animation for primary line
  useEffect(() => {
    if (!primaryPathRef.current || !animate || prefersReducedMotion || allDates.length < 2) {
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
  }, [allDates, animate, prefersReducedMotion]);

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
        className={`flex items-center justify-center text-xs text-[var(--muted)] ${className}`}
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

  const rawMin = valuesToConsider.length > 0 ? Math.min(...valuesToConsider) : 0;
  const rawMax = valuesToConsider.length > 0 ? Math.max(...valuesToConsider) : 100;
  const rawSpan = rawMax - rawMin || 1;
  const paddedMin = rawMin - rawSpan * 0.05;
  const paddedMax = rawMax + rawSpan * 0.05;
  const range = paddedMax - paddedMin || 1;

  const W = plotDims.width || 700;
  const H = plotDims.height || (height - 24);
  const padT = 12;
  const padB = 4;

  const X = (i) => (allDates.length > 1 ? (W * i) / (allDates.length - 1) : 0);
  const Y = (v) => H - padB - ((v - paddedMin) / range) * (H - padT - padB);

  // Y-axis 5 horizontal gridlines
  const gridTicks = [0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
    const val = paddedMin + ratio * range;
    const y = Y(val);
    return { val, y };
  });

  // X-axis adaptive count
  const nLab = Math.max(3, Math.min(6, Math.floor(W / 72)));
  const xTicks = [];
  if (allDates.length > 1) {
    for (let q = 0; q < nLab; q++) {
      const idx = Math.round(((allDates.length - 1) * q) / (nLab - 1));
      const dateStr = allDates[idx];
      const xPos = X(idx);
      const transform = idx === 0 ? '0' : idx === allDates.length - 1 ? '-100%' : '-50%';
      xTicks.push({ idx, date: dateStr, x: xPos, transform });
    }
  }

  // Build rendered series points
  const renderedSeries = visibleSeries.map((s, sIndex) => {
    const pts = [];
    allDates.forEach((dStr, i) => {
      const val = s.map.get(dStr);
      if (val !== null && val !== undefined && !isNaN(val)) {
        pts.push([X(i), Y(val)]);
      }
    });

    const isPrimary = sIndex === 0;
    const pathD = smoothPath(pts);
    let areaD = null;
    if (isPrimary && pts.length > 1) {
      areaD = `${pathD} L${W.toFixed(1)},${H.toFixed(1)} L0,${H.toFixed(1)} Z`;
    }

    return {
      ...s,
      isPrimary,
      pts,
      pathD,
      areaD,
    };
  });

  const primaryRendered = renderedSeries[0] || null;
  const lastPoint =
    primaryRendered && primaryRendered.pts.length > 0
      ? primaryRendered.pts[primaryRendered.pts.length - 1]
      : null;

  // Pointer & Click handlers
  const getIdxFromClientX = (clientX) => {
    if (!plotRef.current || allDates.length < 2) return null;
    const rect = plotRef.current.getBoundingClientRect();
    const plotX = Math.max(0, Math.min(W, clientX - rect.left));
    const ratio = plotX / W;
    const idx = Math.round(ratio * (allDates.length - 1));
    return {
      idx,
      svgX: X(idx),
      ratio,
    };
  };

  const handlePointerMove = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const res = getIdxFromClientX(clientX);
    if (!res) return;
    setHoverIndex(res.idx);
    setHoverPos({
      svgX: res.svgX,
      ratio: res.ratio,
      clientY,
    });
  };

  const handlePointerLeave = () => {
    setHoverIndex(null);
    setHoverPos(null);
  };

  const handleChartClick = (e) => {
    if (!comparePoints) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const res = getIdxFromClientX(clientX);
    if (!res) return;

    if (anchorIndex === null) {
      setAnchorIndex(res.idx);
    } else {
      setAnchorIndex(null);
    }
  };

  // Compare mode data preparation (anchored to primary series = series[0])
  const primarySeries = seriesMaps[0] || null;
  const isComparing =
    comparePoints && anchorIndex !== null && hoverIndex !== null && anchorIndex !== hoverIndex;

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

  const anchorSvgX = anchorIndex !== null ? X(anchorIndex) : null;
  const anchorVal =
    anchorIndex !== null && primarySeries ? primarySeries.map.get(allDates[anchorIndex]) : null;
  const anchorSvgY =
    anchorVal !== null && anchorVal !== undefined && !isNaN(anchorVal) ? Y(anchorVal) : null;

  // Active hovered point items for single tooltip
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
          ySvg: val !== null && val !== undefined && !isNaN(val) ? Y(val) : null,
        };
      })
    : [];

  const nonToggleableSeries = series.filter((s) => s.nonToggleable);
  const toggleableSeries = series.filter((s) => !s.nonToggleable);

  return (
    <div className={`flex flex-col w-full ${className}`}>
      {/* Legend Row if toggleable or multiple series */}
      {(toggleableLegend || series.length > 1) && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs mb-2 px-1">
          {toggleableLegend ? (
            <>
              <div className="flex items-center gap-3">
                {nonToggleableSeries.map((s) => (
                  <div
                    key={s.key}
                    className="flex items-center gap-1.5 font-medium"
                    style={{ color: 'var(--text)' }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: s.color || CHART_THEME.primary.stroke }}
                    />
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {toggleableSeries.map((s) => {
                  const isActive = !hiddenKeys.has(s.key);
                  return (
                    <button
                      key={s.key}
                      type="button"
                      id={`legend-toggle-${s.key}`}
                      onClick={() => toggleSeries(s.key)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer border ${
                        isActive
                          ? 'border-[var(--border)]'
                          : 'border-transparent opacity-40 hover:opacity-75'
                      }`}
                      style={{
                        backgroundColor: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                        color: isActive ? '#fff' : 'var(--muted)',
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: s.color || CHART_THEME.secondary.sma20.color,
                        }}
                      />
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              {series.map((s) => (
                <div key={s.key} className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full inline-block ${
                      s.dashed ? 'border border-dashed' : ''
                    }`}
                    style={{
                      backgroundColor: s.color || CHART_THEME.primary.stroke,
                      borderColor: s.dashed ? 'var(--border)' : undefined,
                    }}
                  />
                  <span className="font-medium text-xs" style={{ color: '#fff' }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chart Component Container matching gemini-dashboard.html */}
      <div className="chart" style={{ position: 'relative', height: `${height}px`, marginTop: '20px' }}>
        <div
          ref={plotRef}
          className="plot"
          style={{
            position: 'absolute',
            left: '42px',
            right: 0,
            top: 0,
            bottom: '24px',
          }}
        >
          {/* Y-Axis Labels outside the plot on left */}
          {gridTicks.map((t, idx) => (
            <span
              key={`ylab-${idx}`}
              className="ylab"
              style={{
                position: 'absolute',
                left: '-42px',
                width: '34px',
                fontSize: '11px',
                color: CHART_THEME.grid.yLabelColor,
                transform: 'translateY(-50%)',
                textAlign: 'right',
                top: `${t.y}px`,
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              {yFormat ? yFormat(t.val) : t.val.toFixed(1)}
            </span>
          ))}

          {/* X-Axis Labels below the plot */}
          {xTicks.map((t, idx) => (
            <span
              key={`xlab-${idx}`}
              className="xlab"
              style={{
                position: 'absolute',
                bottom: '-22px',
                fontSize: '11px',
                color: CHART_THEME.grid.xLabelColor,
                whiteSpace: 'nowrap',
                left: `${t.x}px`,
                transform: `translateX(${t.transform})`,
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              {formatShortDate(t.date)}
            </span>
          ))}

          {/* SVG Canvas for grid, paths, glow, and compare markers */}
          <svg
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={CHART_THEME.primary.areaGradientColor}
                  stopOpacity={CHART_THEME.primary.areaOpacityTop}
                />
                <stop
                  offset="100%"
                  stopColor={CHART_THEME.primary.areaGradientColor}
                  stopOpacity={CHART_THEME.primary.areaOpacityBottom}
                />
              </linearGradient>
              <filter id={blurId} x="-5%" y="-30%" width="110%" height="160%">
                <feGaussianBlur stdDeviation="5" />
              </filter>
            </defs>

            {/* Compare Two Points: Translucent Selection Band */}
            {comparePoints &&
              anchorIndex !== null &&
              hoverIndex !== null &&
              anchorIndex !== hoverIndex && (
                <rect
                  x={Math.min(anchorSvgX, hoverPos.svgX)}
                  y={0}
                  width={Math.abs(hoverPos.svgX - anchorSvgX)}
                  height={H}
                  fill="rgba(245, 158, 11, 0.16)"
                />
              )}

            {/* Horizontal Gridlines (5 dashed lines) */}
            {gridTicks.map((t, idx) => (
              <line
                key={`hgrid-${idx}`}
                x1="0"
                x2={W}
                y1={t.y}
                y2={t.y}
                stroke={CHART_THEME.grid.horizontalStroke}
                strokeDasharray={CHART_THEME.grid.dashArray}
              />
            ))}

            {/* Vertical Gridlines (5 dashed lines, 6 equal columns) */}
            {[1, 2, 3, 4, 5].map((c) => (
              <line
                key={`vgrid-${c}`}
                x1={(W * c) / 6}
                x2={(W * c) / 6}
                y1="0"
                y2={H}
                stroke={CHART_THEME.grid.verticalStroke}
                strokeDasharray={CHART_THEME.grid.dashArray}
              />
            ))}

            {/* Area Fill for Primary Series */}
            {primaryRendered && primaryRendered.areaD && (
              <path
                d={primaryRendered.areaD}
                fill={`url(#${gradientId})`}
                style={{
                  opacity: fillOpacity,
                  transition: 'opacity 800ms ease-out',
                }}
              />
            )}

            {/* Secondary Series lines */}
            {renderedSeries
              .filter((s) => !s.isPrimary)
              .map((s) => (
                <path
                  key={`sec-line-${s.key}`}
                  d={s.pathD}
                  fill="none"
                  stroke={s.color || '#6366F1'}
                  strokeWidth={s.dashed ? '2' : '1.8'}
                  strokeDasharray={s.dashed ? '4 4' : undefined}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.88}
                />
              ))}

            {/* Primary Series: Three strokes exactly from gemini-dashboard.html */}
            {primaryRendered && (
              <>
                {/* 1. Glow stroke */}
                <path
                  d={primaryRendered.pathD}
                  fill="none"
                  stroke={CHART_THEME.primary.glowStroke}
                  strokeWidth={CHART_THEME.primary.glowWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter={`url(#${blurId})`}
                />
                {/* 2. Main stroke */}
                <path
                  ref={primaryPathRef}
                  d={primaryRendered.pathD}
                  fill="none"
                  stroke={CHART_THEME.primary.stroke}
                  strokeWidth={CHART_THEME.primary.strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* 3. Highlight stroke */}
                <path
                  d={primaryRendered.pathD}
                  fill="none"
                  stroke={CHART_THEME.primary.highlightStroke}
                  strokeWidth={CHART_THEME.primary.highlightWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={CHART_THEME.primary.highlightOpacity}
                />
              </>
            )}

            {/* End dot on the last point of primary series */}
            {lastPoint && (
              <>
                <circle
                  cx={lastPoint[0]}
                  cy={lastPoint[1]}
                  r={CHART_THEME.primary.endDotGlowRadius}
                  fill={CHART_THEME.primary.endDotGlow}
                  filter={`url(#${blurId})`}
                />
                <circle
                  cx={lastPoint[0]}
                  cy={lastPoint[1]}
                  r={CHART_THEME.primary.endDotRadius}
                  fill={CHART_THEME.primary.endDotFill}
                />
              </>
            )}

            {/* Anchor Pin Marker (Compare mode) */}
            {comparePoints && anchorIndex !== null && anchorSvgX !== null && (
              <g>
                <line
                  x1={anchorSvgX}
                  y1={0}
                  x2={anchorSvgX}
                  y2={H}
                  stroke="var(--gold)"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
                {anchorSvgY !== null && (
                  <circle
                    cx={anchorSvgX}
                    cy={anchorSvgY}
                    r="5"
                    fill="var(--gold-core)"
                    stroke="#1a1d27"
                    strokeWidth="2"
                  />
                )}
              </g>
            )}

            {/* Hover Crosshair Vertical Line */}
            {hoverPos && (
              <line
                x1={hoverPos.svgX}
                y1={0}
                x2={hoverPos.svgX}
                y2={H}
                stroke="rgba(255, 255, 255, 0.45)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            )}

            {/* Hover Indicator Dots */}
            {hoverPos &&
              tooltipItems.map(
                (item) =>
                  item.ySvg !== null && (
                    <circle
                      key={`dot-${item.key}`}
                      cx={hoverPos.svgX}
                      cy={item.ySvg}
                      r="4"
                      fill={item.color || 'var(--gold)'}
                      stroke="#14161c"
                      strokeWidth="2"
                    />
                  )
              )}

            {/* Transparent Overlay capturing pointer and touch events */}
            <rect
              x="0"
              y="0"
              width={W}
              height={H}
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

          {/* Hover Floating Tooltip */}
          {hoverPos && activeDate && (
            <div
              id="chart-hover-tooltip"
              className="absolute pointer-events-none z-30 transition-transform duration-75 shadow-2xl"
              style={{
                left: `${hoverPos.svgX}px`,
                top: `35%`,
                transform: hoverPos.ratio > 0.5 ? 'translate(-105%, -50%)' : 'translate(14px, -50%)',
                backgroundColor: CHART_THEME.tooltip.background,
                border: CHART_THEME.tooltip.border,
                borderRadius: CHART_THEME.tooltip.borderRadius,
                padding: '8px 12px',
                color: CHART_THEME.tooltip.color,
                fontSize: CHART_THEME.tooltip.fontSize,
                backdropFilter: CHART_THEME.tooltip.backdropBlur,
                WebkitBackdropFilter: CHART_THEME.tooltip.backdropBlur,
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
              }}
            >
              {isComparing && compareData ? (
                /* Compare Two Points Mode Tooltip */
                <div className="flex flex-col gap-1.5 min-w-[150px]">
                  {/* Line 1: Earlier date + value */}
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-mono text-[var(--muted-2)]">
                      {compareData.earlyDate}
                    </span>
                    <span className="font-mono font-medium text-white">
                      {yFormat ? yFormat(compareData.earlyVal) : compareData.earlyVal.toFixed(2)}
                    </span>
                  </div>

                  {/* Pill with signed % change */}
                  <div className="my-1 flex items-center justify-center">
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold"
                      style={
                        compareData.isPositive
                          ? {
                              backgroundColor: 'var(--gain-bg)',
                              color: 'var(--gain-text)',
                              border: '1px solid rgba(124, 228, 180, 0.22)',
                            }
                          : {
                              backgroundColor: '#44313b',
                              color: 'var(--loss-text)',
                              border: '1px solid rgba(229, 94, 101, 0.3)',
                            }
                      }
                    >
                      <span>
                        {compareData.isPositive ? '+' : '−'}
                        {Math.abs(compareData.pctChange).toFixed(2)}%
                      </span>
                    </span>
                  </div>

                  {/* Line 3: Later date + value */}
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-mono text-[var(--muted-2)]">
                      {compareData.lateDate}
                    </span>
                    <span className="font-mono font-medium text-white">
                      {yFormat ? yFormat(compareData.lateVal) : compareData.lateVal.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                /* Single Point Tooltip */
                <>
                  <div
                    className="text-xs font-mono font-semibold mb-1.5 pb-1 border-b"
                    style={{
                      color: 'var(--cream)',
                      borderColor: 'rgba(255, 255, 255, 0.12)',
                    }}
                  >
                    {activeDate}
                  </div>
                  <div className="flex flex-col gap-1.5 min-w-[130px]">
                    {tooltipItems.map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: item.color || CHART_THEME.primary.stroke,
                            }}
                          />
                          <span style={{ color: 'var(--muted)' }}>{item.label}</span>
                        </div>
                        <span className="font-mono font-semibold text-white">
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
      </div>

      {/* Compare Points Hint Line */}
      {comparePoints && (
        <div className="hint" style={{ margin: '8px 0 0 42px', fontSize: '11px', color: '#9ea3af' }}>
          {anchorIndex !== null
            ? 'Click again to clear'
            : 'Click a point, then hover another to compare'}
        </div>
      )}
    </div>
  );
}
