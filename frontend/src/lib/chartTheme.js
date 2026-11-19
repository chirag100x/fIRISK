export const CHART_THEME = {
  primary: {
    stroke: '#FBB02D',
    strokeWidth: 3.4,
    glowStroke: 'rgba(245, 158, 11, 0.85)',
    glowWidth: 11,
    highlightStroke: '#FFE08A',
    highlightWidth: 1.3,
    highlightOpacity: 0.85,
    areaGradientColor: '#F8A92C',
    areaOpacityTop: 0.66,
    areaOpacityBottom: 0.035,
    endDotGlow: 'rgba(255, 190, 70, 0.55)',
    endDotGlowRadius: 8,
    endDotFill: '#FFE784',
    endDotRadius: 3.6,
  },
  secondary: {
    sma7: { color: '#9ca3af', width: 1.5, dashed: false },
    sma20: { color: '#6366F1', width: 2, dashed: false },
    sma50: { color: '#E2D4B7', width: 1.8, dashed: false },
    sma200: { color: '#6b7280', width: 1.5, dashed: false },
    forecastPredicted: { color: '#6366F1', width: 2, dashed: '4 4' },
  },
  grid: {
    horizontalStroke: 'rgba(255, 255, 255, 0.20)',
    verticalStroke: 'rgba(255, 255, 255, 0.16)',
    dashArray: '4 5',
    yLabelColor: '#9ea3af',
    xLabelColor: '#9ea3af',
  },
  tooltip: {
    background: 'rgba(15, 17, 23, 0.93)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    borderRadius: '10px',
    color: '#F5F3EF',
    fontSize: '11px',
    backdropBlur: 'blur(6px)',
  },
};

export default CHART_THEME;

