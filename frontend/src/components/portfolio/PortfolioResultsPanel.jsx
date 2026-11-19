import React from 'react';
import GlassPanel from '../ui/GlassPanel';
import StatCard from '../ui/StatCard';
import DeltaPill from '../ui/DeltaPill';
import TickerBadge from '../ui/TickerBadge';
import AllocationBar from '../ui/AllocationBar';
import AnimatedNumber from '../ui/AnimatedNumber';
import Chart from '../ui/Chart';
import TICKERS from '../../data/tickers';

export default function PortfolioResultsPanel({
  data,
  rangeControl,
}) {
  if (!data) return null;

  const { metrics, portfolio_value_index } = data;
  const holdingsList = data.holdings || data.holdingsData || [];

  // Derive portfolio value from relative index (Base $100,000 for index 100.0)
  const firstPoint = portfolio_value_index?.[0]?.value;
  const latestPoint = portfolio_value_index?.[portfolio_value_index.length - 1]?.value;
  const derivedPortfolioValue = latestPoint ? latestPoint * 1000 : 0;
  const overallReturnPct =
    firstPoint && latestPoint ? ((latestPoint - firstPoint) / firstPoint) * 100 : 0;

  // Drawdown formatting
  const ddValue = metrics?.max_drawdown?.value ?? 0;
  const ddPctStr = `${ddValue < 0 ? '−' : ddValue > 0 ? '−' : ''}${Math.abs(ddValue * 100).toFixed(2)}%`;

  // Volatility formatting
  const volStr =
    metrics?.volatility !== undefined ? `${(metrics.volatility * 100).toFixed(2)}%` : '—';

  // Beta formatting
  const betaStr = metrics?.beta !== undefined ? metrics.beta.toFixed(2) : '—';

  // Sharpe formatting
  const sharpeVal = metrics?.sharpe_ratio ?? 0;
  const sharpeStr = sharpeVal.toFixed(2);
  const isNegativeSharpe = sharpeVal < 0;

  // 95% Historical VaR formatting
  const var95Str =
    metrics?.historical_var_95 !== undefined
      ? `${(metrics.historical_var_95 * 100).toFixed(2)}%`
      : '—';

  return (
    <>
      {/* 1. Hero GlassPanel */}
      <section className="hero glass">
        <div className="hero-top">
          <div>
            <p className="hero-label">Portfolio Value</p>
            <div className="flex items-baseline flex-wrap">
              <span className="hero-value">
                <AnimatedNumber
                  value={derivedPortfolioValue}
                  format={(n) => `$${Math.round(n).toLocaleString()}`}
                  duration={1400}
                />
              </span>
              <DeltaPill value={overallReturnPct} />
            </div>
          </div>

          {/* Top-right slot: rangeControl (Dashboard passes 1M/3M/6M/1Y, Portfolio Builder passes nothing) */}
          {rangeControl && <div>{rangeControl}</div>}
        </div>

        {/* Chart height 196 (plot 172) with comparePoints */}
        <Chart
          series={[
            {
              key: 'portfolio_value_index',
              label: 'Portfolio Index',
              data: portfolio_value_index,
            },
          ]}
          height={196}
          yFormat={(val) => val.toFixed(1)}
          toggleableLegend={false}
          animate={true}
          comparePoints={true}
        />
      </section>

      {/* 2. Five StatCards in repeat(5, minmax(0,1fr)) with 15px gap */}
      <section className="stats">
        <StatCard label="Volatility" value={volStr} />
        <StatCard label="Beta" value={betaStr} />
        <StatCard
          label="Sharpe Ratio"
          value={sharpeStr}
          valueTone={isNegativeSharpe ? 'loss' : undefined}
        />
        <StatCard label="Max Drawdown" value={ddPctStr} tone="loss" />
        <StatCard label="VaR (95%)" value={var95Str} />
      </section>

      {/* 3. Holdings Panel matching gemini-dashboard.html */}
      <section className="holdings glass">
        <div className="h-title">Portfolio Holdings</div>
        <div className="hrow head">
          <span>Ticker</span>
          <span>Allocation</span>
          <span className="r">Latest Price</span>
        </div>

        {holdingsList.map((h) => {
          const curated = TICKERS.find((t) => t.ticker === h.ticker);
          const companyName = curated?.name || h.name;
          const latestPrice = h.latestPrice ?? h.latest_close;
          const dayChangePct = h.dayChangePct ?? h.pct_change;
          const isGain = (dayChangePct ?? 0) >= 0;
          const glyph = isGain ? '▲' : '▼';
          const currency = h.currency || (h.ticker.endsWith('.NS') ? '₹' : '$');
          const closeStr =
            latestPrice !== null && latestPrice !== undefined
              ? `${currency}${latestPrice.toFixed(2)}`
              : '—';
          const changeStr =
            dayChangePct !== null && dayChangePct !== undefined
              ? `${glyph} ${Math.abs(dayChangePct).toFixed(2)}%`
              : '—';

          return (
            <div key={h.ticker} className="hrow">
              <div className="tk">
                <TickerBadge ticker={h.ticker} />
                <div>
                  <b>{h.ticker}</b>
                  {companyName && <small>{companyName}</small>}
                </div>
              </div>

              <AllocationBar weight={h.weight} />

              <div className="r px">
                {closeStr}
                <span className="sep">/</span>
                <span className={`chg ${isGain ? 'up' : 'dn'}`}>{changeStr}</span>
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
