import React from 'react';
import Card from '../ui/Card';
import StatCard from '../ui/StatCard';
import Badge from '../ui/Badge';
import AnimatedNumber from '../ui/AnimatedNumber';
import LineChart from '../ui/LineChart';

export default function PortfolioResultsPanel({ data, periodLabel = '1-year return' }) {
  if (!data) return null;

  const { metrics, portfolio_value_index } = data;
  const holdingsList = data.holdings || data.holdingsData || [];

  // Derive portfolio value from relative index (Base $100,000 for index 100.0)
  const firstPoint = portfolio_value_index?.[0]?.value;
  const latestPoint = portfolio_value_index?.[portfolio_value_index.length - 1]?.value;
  const derivedPortfolioValue = latestPoint ? latestPoint * 1000 : 0;
  const overallReturnPct = (firstPoint && latestPoint) ? ((latestPoint - firstPoint) / firstPoint) * 100 : 0;
  const overallTone = overallReturnPct >= 0 ? 'up' : 'down';
  const overallBadgeText = `${overallReturnPct >= 0 ? '▲' : '▼'} ${Math.abs(overallReturnPct).toFixed(2)}%`;

  // Drawdown formatting
  const ddValue = metrics?.max_drawdown?.value ?? 0;
  const ddPctStr = `${(ddValue * 100).toFixed(2)}%`;

  // Volatility formatting
  const volStr = metrics?.volatility !== undefined ? `${(metrics.volatility * 100).toFixed(2)}%` : '—';

  // Beta formatting
  const betaStr = metrics?.beta !== undefined ? metrics.beta.toFixed(2) : '—';

  // Sharpe formatting
  const sharpeVal = metrics?.sharpe_ratio ?? 0;
  const sharpeStr = sharpeVal.toFixed(2);
  const sharpeTone = sharpeVal > 1 ? 'up' : sharpeVal < 0 ? 'down' : 'neutral';

  // 95% Historical VaR formatting
  const var95Str = metrics?.historical_var_95 !== undefined
    ? `${(metrics.historical_var_95 * 100).toFixed(2)}%`
    : '—';

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Section: Portfolio Value, Return, & SVG LineChart */}
      <section>
        <div
          className="p-6 sm:p-8 transition-colors duration-200 overflow-hidden relative"
          style={{
            backgroundColor: 'var(--surface-hero)',
            border: '0.5px solid var(--border-strong)',
            borderRadius: 'var(--radius-hero)',
            boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div className="flex flex-col gap-3 mb-6">
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-secondary)' }}
            >
              Portfolio Value
            </span>
            <div className="flex flex-wrap items-baseline gap-3">
              <span
                className="text-4xl sm:text-6xl font-extrabold tracking-tight"
                style={{
                  fontFamily: 'var(--font-headline)',
                  color: 'var(--text-primary)',
                }}
              >
                <AnimatedNumber
                  value={derivedPortfolioValue}
                  format={(n) => `$${Math.round(n).toLocaleString()}`}
                  duration={1400}
                />
              </span>
              <div className="flex items-center gap-2">
                <Badge tone={overallTone}>{overallBadgeText}</Badge>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {periodLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Hand-rolled SVG Line Chart */}
          <div className="mt-2 -mx-2 sm:-mx-4">
            <LineChart
              data={portfolio_value_index}
              color="var(--gold)"
              height={140}
              animate={true}
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
              label="Beta (vs Benchmarks)"
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
              label="Value at Risk (95%)"
              value={var95Str}
              tone="neutral"
            />
          </div>
        </Card>
      </section>

      {/* Holdings Breakdown */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h2
            className="text-sm font-semibold tracking-tight uppercase"
            style={{ fontFamily: 'var(--font-headline)', color: 'var(--text-secondary)' }}
          >
            Portfolio Holdings
          </h2>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {holdingsList.length} {holdingsList.length === 1 ? 'asset' : 'assets'} • multi-currency normalized
          </span>
        </div>

        <Card className="overflow-hidden">
          <div className="divide-y divide-[var(--border)]">
            {holdingsList.map((h) => {
              const changeTone = h.dayChangePct > 0 ? 'up' : h.dayChangePct < 0 ? 'down' : 'neutral';
              const changeSign = h.dayChangePct >= 0 ? '▲' : '▼';
              const changeText = `${changeSign} ${Math.abs(h.dayChangePct).toFixed(2)}%`;

              return (
                <div
                  key={h.ticker}
                  className="flex items-center justify-between p-4 sm:px-6 hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs"
                      style={{
                        backgroundColor: 'var(--border)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {h.ticker.split('.')[0].slice(0, 3)}
                    </div>
                    <div className="flex flex-col">
                      <span
                        className="text-sm font-bold leading-tight"
                        style={{ fontFamily: 'var(--font-headline)', color: 'var(--text-primary)' }}
                      >
                        {h.ticker}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Allocation: {h.weight}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div className="flex flex-col items-end">
                      <span
                        className="text-sm font-semibold"
                        style={{
                          fontFamily: 'var(--font-headline)',
                          color: 'var(--text-primary)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {h.latestPrice !== null
                          ? `${h.currency}${h.latestPrice.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`
                          : '—'}
                      </span>
                      <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        Latest Close
                      </span>
                    </div>

                    <Badge tone={changeTone}>{changeText}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>
    </div>
  );
}
