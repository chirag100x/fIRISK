import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TICKERS from '../data/tickers';
import { getAssetAnalytics, getAssetPrices } from '../lib/api';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import AnimatedNumber from '../components/ui/AnimatedNumber';
import StockPicker from '../components/ui/StockPicker';
import DateRangeControl from '../components/ui/DateRangeControl';
import { getDateRange } from '../lib/dateUtils';
import PriceChart from '../components/ui/PriceChart';

export default function AssetAnalysis() {
  const { ticker: paramTicker } = useParams();
  const navigate = useNavigate();

  const [selectedTicker, setSelectedTicker] = useState(paramTicker ? paramTicker.toUpperCase() : '');
  const [selectedRange, setSelectedRange] = useState('1Y');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [pricesData, setPricesData] = useState(null);

  const requestIdRef = useRef(0);

  // Lookup company metadata from curated list
  const companyInfo = TICKERS.find((t) => t.ticker === selectedTicker);

  const fetchAssetData = useCallback(async (ticker, range) => {
    if (!ticker) return;
    const currentReqId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    const { start, end } = getDateRange(range);

    try {
      const [analyticsRes, pricesRes] = await Promise.all([
        getAssetAnalytics(ticker, start, end),
        getAssetPrices(ticker, start, end),
      ]);

      if (currentReqId !== requestIdRef.current) return;

      setAnalyticsData(analyticsRes);
      setPricesData(pricesRes);
      setError(null);
    } catch (err) {
      if (currentReqId !== requestIdRef.current) return;
      console.error('Error fetching asset data:', err);
      setError(err.message || `Failed to load asset analysis for ${ticker}.`);
    } finally {
      if (currentReqId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Sync with route param if provided on mount or url change
  useEffect(() => {
    if (paramTicker) {
      const upper = paramTicker.toUpperCase();
      setSelectedTicker(upper);
      fetchAssetData(upper, selectedRange);
    }
  }, [paramTicker, selectedRange, fetchAssetData]);

  // Handle ticker change from picker
  const handleTickerSelect = (newTicker) => {
    if (!newTicker || newTicker === selectedTicker) return;
    setSelectedTicker(newTicker);
    navigate(`/assets/${encodeURIComponent(newTicker)}`);
    fetchAssetData(newTicker, selectedRange);
  };

  // Handle date range change
  const handleRangeChange = (newRange) => {
    setSelectedRange(newRange);
    if (selectedTicker) {
      fetchAssetData(selectedTicker, newRange);
    }
  };

  // Currency & Latest Price Calculations
  const isNS = selectedTicker.endsWith('.NS');
  const currency = isNS ? '₹' : '$';

  const pricePoints = pricesData?.data || [];
  const latestPricePoint = pricePoints.length > 0 ? pricePoints[pricePoints.length - 1] : null;
  const prevPricePoint = pricePoints.length > 1 ? pricePoints[pricePoints.length - 2] : null;

  const latestPrice = latestPricePoint ? latestPricePoint.close : null;
  let dayChangePct = 0;
  if (latestPricePoint && prevPricePoint && prevPricePoint.close > 0) {
    dayChangePct = ((latestPricePoint.close - prevPricePoint.close) / prevPricePoint.close) * 100;
  }
  const dayTone = dayChangePct > 0 ? 'up' : dayChangePct < 0 ? 'down' : 'neutral';
  const daySign = dayChangePct >= 0 ? '▲' : '▼';
  const dayText = `${daySign} ${Math.abs(dayChangePct).toFixed(2)}%`;

  // Formatted Metrics from Analytics
  const metrics = analyticsData?.metrics;
  const volStr = metrics?.volatility !== undefined ? `${(metrics.volatility * 100).toFixed(2)}%` : '—';
  const betaStr = metrics?.beta !== undefined ? metrics.beta.toFixed(2) : '—';
  const sharpeVal = metrics?.sharpe_ratio ?? 0;
  const sharpeStr = sharpeVal.toFixed(2);
  const sharpeTone = sharpeVal > 1 ? 'up' : sharpeVal < 0 ? 'down' : 'neutral';
  const ddValue = metrics?.max_drawdown?.value ?? 0;
  const ddPctStr = `${(ddValue * 100).toFixed(2)}%`;
  const var95Str = metrics?.historical_var_95 !== undefined ? `${(metrics.historical_var_95 * 100).toFixed(2)}%` : '—';

  return (
    <div className="flex flex-col gap-8">
      {/* Search Header / Picker Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-extrabold tracking-tight"
              style={{ fontFamily: 'var(--font-headline)', color: 'var(--text-primary)' }}
            >
              Asset Analysis
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Individual risk metrics, moving average overlays, and benchmark sensitivity.
            </p>
          </div>

          {/* Date Range Control (active when ticker chosen) */}
          {selectedTicker && (
            <DateRangeControl
              value={selectedRange}
              onChange={handleRangeChange}
              className="self-start sm:self-auto"
            />
          )}
        </div>

        {/* Prominent Search Bar */}
        <div className="w-full max-w-xl">
          <StockPicker
            id="asset-stock-picker"
            value={selectedTicker}
            onChange={handleTickerSelect}
            placeholder="Search US or Indian stock (e.g. GOOGL, TCS.NS)..."
          />
        </div>
      </div>

      {/* Inline Error Message */}
      {error && (
        <div
          id="asset-error-banner"
          className="p-4 rounded-xl border flex items-start gap-3 transition-all"
          style={{
            backgroundColor: 'rgba(248, 113, 113, 0.1)',
            borderColor: 'rgba(248, 113, 113, 0.3)',
            color: 'var(--red)',
          }}
        >
          <div className="mt-0.5">
            <Badge tone="down">Error</Badge>
          </div>
          <div className="flex-1 text-sm font-medium leading-relaxed">
            {error}
          </div>
        </div>
      )}

      {/* Loading Spinner */}
      {loading && (
        <div className="py-16 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-10 h-10 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Computing risk metrics &amp; moving averages for {selectedTicker}...
          </p>
        </div>
      )}

      {/* Empty State (When no ticker chosen yet) */}
      {!selectedTicker && !loading && (
        <Card className="py-20 px-6 text-center flex flex-col items-center justify-center gap-4 max-w-lg mx-auto">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold"
            style={{
              backgroundColor: 'var(--surface-hero)',
              color: 'var(--gold)',
              border: '1px solid var(--border)',
            }}
          >
            📈
          </div>
          <h2
            className="text-lg font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-headline)', color: 'var(--text-primary)' }}
          >
            No Asset Selected
          </h2>
          <p className="text-sm max-w-sm" style={{ color: 'var(--text-secondary)' }}>
            Search a US or Indian stock above to explore its price chart, moving averages, and risk analytics.
          </p>
        </Card>
      )}

      {/* Main Asset View (When data is available) */}
      {selectedTicker && analyticsData && pricesData && !loading && (
        <div className="flex flex-col gap-6">
          {/* Hero Section: Asset Header, Price, and PriceChart */}
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
              {/* Header: Ticker, Name, Benchmark */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span
                      className="text-2xl sm:text-4xl font-extrabold tracking-tight font-mono"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {selectedTicker}
                    </span>
                    <Badge tone="neutral" className="text-xs">
                      {isNS ? 'India (NSE)' : 'US Equities'}
                    </Badge>
                  </div>
                  {companyInfo?.name && (
                    <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {companyInfo.name}
                    </p>
                  )}
                  {analyticsData.benchmark_used && (
                    <span className="text-xs inline-block mt-1" style={{ color: 'var(--text-muted)' }}>
                      Benchmarked against{' '}
                      <code className="px-1.5 py-0.5 rounded bg-[var(--border)] font-mono text-[11px]">
                        {analyticsData.benchmark_used}
                      </code>
                    </span>
                  )}
                </div>

                {/* Latest Price & Daily Change */}
                {latestPrice !== null && (
                  <div className="flex flex-col sm:items-end">
                    <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                      <AnimatedNumber
                        value={latestPrice}
                        format={(n) =>
                          `${currency}${n.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        }
                        duration={1200}
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge tone={dayTone}>{dayText}</Badge>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Latest Close
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* PriceChart with toggleable SMAs */}
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <PriceChart
                  priceData={pricesData.data}
                  smaData={analyticsData.moving_averages}
                  height={240}
                  currency={currency}
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
                  label={`Beta (vs ${analyticsData.benchmark_used || 'Market'})`}
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
        </div>
      )}
    </div>
  );
}
