import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import StatCard from '../ui/StatCard';
import AnimatedNumber from '../ui/AnimatedNumber';
import Chart from '../ui/Chart';

export default function PortfolioResultsPanel({
  data,
  periodLabel = '1-year return',
  rangeControl,
}) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!data) return null;

  const { metrics, portfolio_value_index } = data;
  const holdingsList = data.holdings || data.holdingsData || [];

  // Derive portfolio value from relative index (Base $100,000 for index 100.0)
  const firstPoint = portfolio_value_index?.[0]?.value;
  const latestPoint = portfolio_value_index?.[portfolio_value_index.length - 1]?.value;
  const derivedPortfolioValue = latestPoint ? latestPoint * 1000 : 0;
  const overallReturnPct =
    firstPoint && latestPoint ? ((latestPoint - firstPoint) / firstPoint) * 100 : 0;

  const isPositive = overallReturnPct >= 0;
  const deltaPillText = `${isPositive ? '▲ +' : '▼ −'}${Math.abs(overallReturnPct).toFixed(2)}%`;

  // Drawdown formatting
  const ddValue = metrics?.max_drawdown?.value ?? 0;
  const ddPctStr = `${(ddValue * 100).toFixed(2)}%`;

  // Volatility formatting
  const volStr =
    metrics?.volatility !== undefined ? `${(metrics.volatility * 100).toFixed(2)}%` : '—';

  // Beta formatting
  const betaStr = metrics?.beta !== undefined ? metrics.beta.toFixed(2) : '—';

  // Sharpe formatting
  const sharpeVal = metrics?.sharpe_ratio ?? 0;
  const sharpeStr = sharpeVal.toFixed(2);
  const sharpeTone = sharpeVal > 1 ? 'up' : sharpeVal < 0 ? 'down' : 'neutral';

  // 95% Historical VaR formatting
  const var95Str =
    metrics?.historical_var_95 !== undefined
      ? `${(metrics.historical_var_95 * 100).toFixed(2)}%`
      : '—';

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Section: Orange Gradient Hero Card */}
      <section>
        <div
          className="p-[18px] sm:p-6 rounded-[24px] relative overflow-hidden text-white"
          style={{
            background: 'var(--hero-gradient)',
            boxShadow: '0 8px 32px -4px rgba(232, 115, 74, 0.25)',
          }}
        >
          {/* Top Row: Portfolio Value + Delta Pill on Left, Range Control on Right */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex flex-col gap-1">
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.95)',
                  letterSpacing: '0.025em',
                  textTransform: 'uppercase',
                }}
              >
                Portfolio value
              </span>
              <div className="flex flex-wrap items-baseline gap-3">
                <span
                  style={{
                    fontFamily: 'var(--font-headline)',
                    fontWeight: 800,
                    fontSize: 'clamp(30px, 5vw, 44px)',
                    lineHeight: 1.1,
                    color: '#FFFFFF',
                  }}
                >
                  <AnimatedNumber
                    value={derivedPortfolioValue}
                    format={(n) => `$${Math.round(n).toLocaleString()}`}
                    duration={1400}
                  />
                </span>

                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center rounded-full"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: '#FFFFFF',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      padding: '3px 10px',
                    }}
                  >
                    {deltaPillText}
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'rgba(255, 255, 255, 0.92)',
                    }}
                  >
                    {periodLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Optional Range Control Slot */}
            {rangeControl && (
              <div className="self-start sm:self-center">
                {rangeControl}
              </div>
            )}
          </div>

          {/* Interactive Chart with variant="onHero" and comparePoints */}
          <div className="mt-1 -mx-2 sm:-mx-3">
            <Chart
              series={[
                {
                  key: 'portfolio_value_index',
                  label: 'Portfolio Index',
                  color: 'var(--orange)',
                  dashed: false,
                  data: portfolio_value_index,
                  visible: true,
                },
              ]}
              height={isMobile ? 160 : 220}
              yFormat={(val) => val.toFixed(1)}
              toggleableLegend={false}
              animate={true}
              variant="onHero"
              comparePoints={true}
            />
          </div>
        </div>
      </section>

      {/* Stat Strip: 5 Metric Cards inside a single unified Card */}
      <section>
        <Card className="overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border)]">
            <StatCard
              label="Volatility (Ann.)"
              value={volStr}
              tone="neutral"
            />
            <StatCard
              label="Portfolio Beta"
              value={betaStr}
              tone="neutral"
            />
            <StatCard
              label="Sharpe Ratio"
              value={sharpeStr}
              tone={sharpeTone}
            />
            <StatCard
              label="Max Drawdown"
              value={ddPctStr}
              tone="down"
            />
            <StatCard
              label="95% Hist. VaR"
              value={var95Str}
              tone="down"
            />
          </div>
        </Card>
      </section>

      {/* Holdings Breakdown Table */}
      <section>
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-base font-bold tracking-tight"
              style={{
                fontFamily: 'var(--font-headline)',
                color: 'var(--text-primary)',
              }}
            >
              Portfolio Holdings
            </h2>
            <span
              className="text-xs font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              {holdingsList.length} assets allocated
            </span>
          </div>

          <div className="overflow-x-auto -mx-5 sm:mx-0">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th
                    className="pb-3 px-4 font-semibold uppercase text-[11px] tracking-wider"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Asset
                  </th>
                  <th
                    className="pb-3 px-4 font-semibold uppercase text-[11px] tracking-wider text-right"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Weight
                  </th>
                  <th
                    className="pb-3 px-4 font-semibold uppercase text-[11px] tracking-wider text-right"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Latest Close
                  </th>
                  <th
                    className="pb-3 px-4 font-semibold uppercase text-[11px] tracking-wider text-right"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Daily Change
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] font-mono">
                {holdingsList.map((h) => {
                  const isPositive = (h.pct_change ?? 0) >= 0;
                  const tone = isPositive ? 'up' : 'down';
                  const sign = isPositive ? '+' : '';
                  const changeStr =
                    h.pct_change !== null && h.pct_change !== undefined
                      ? `${sign}${h.pct_change.toFixed(2)}%`
                      : '—';

                  const currency = h.currency || (h.ticker.endsWith('.NS') ? '₹' : '$');
                  const closeStr =
                    h.latest_close !== null && h.latest_close !== undefined
                      ? `${currency}${h.latest_close.toFixed(2)}`
                      : '—';

                  return (
                    <tr
                      key={h.ticker}
                      className="hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-bold tracking-wide"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {h.ticker}
                          </span>
                          <span
                            className="text-xs hidden sm:inline"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {h.name}
                          </span>
                        </div>
                      </td>
                      <td
                        className="py-3 px-4 text-right font-medium"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {(h.weight * 100).toFixed(1)}%
                      </td>
                      <td
                        className="py-3 px-4 text-right"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {closeStr}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className="inline-block px-2 py-0.5 rounded text-xs font-semibold"
                          style={{
                            color: isPositive ? 'var(--green)' : 'var(--red)',
                            backgroundColor: isPositive
                              ? 'rgba(52, 211, 153, 0.12)'
                              : 'rgba(248, 113, 113, 0.12)',
                          }}
                        >
                          {changeStr}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </div>
  );
}
