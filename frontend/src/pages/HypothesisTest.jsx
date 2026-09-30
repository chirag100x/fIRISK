import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TICKERS from '../data/tickers';
import { getHypothesisTest } from '../lib/api';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import StockPicker from '../components/ui/StockPicker';
import DateRangeControl from '../components/ui/DateRangeControl';
import { getDateRange } from '../lib/dateUtils';

const SUPPORTED_INDICATORS = [
  { code: 'CPIAUCSL', label: 'Inflation (CPI)' },
  { code: 'FEDFUNDS', label: 'Interest Rate (Fed Funds)' },
  { code: 'UNRATE', label: 'Unemployment Rate' },
];

export default function HypothesisTest() {
  const { ticker: paramTicker } = useParams();
  const navigate = useNavigate();

  const [selectedIndicator, setSelectedIndicator] = useState('CPIAUCSL');
  const [selectedTicker, setSelectedTicker] = useState(paramTicker ? paramTicker.toUpperCase() : '');
  const [selectedRange, setSelectedRange] = useState('5Y');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const requestIdRef = useRef(0);

  // Lookup company metadata if in curated list
  const companyInfo = TICKERS.find((t) => t.ticker === selectedTicker);

  // Sync with route param if present
  useEffect(() => {
    if (paramTicker) {
      setSelectedTicker(paramTicker.toUpperCase());
    }
  }, [paramTicker]);

  const handleTickerSelect = (newTicker) => {
    if (!newTicker) return;
    const upper = newTicker.trim().toUpperCase();
    setSelectedTicker(upper);
    navigate(`/hypothesis/${encodeURIComponent(upper)}`);
  };

  const handleRunTest = useCallback(async () => {
    if (!selectedTicker) return;
    const currentReqId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    const { start, end } = getDateRange(selectedRange);

    try {
      const data = await getHypothesisTest(
        selectedIndicator,
        selectedTicker,
        start,
        end,
        0.05
      );

      if (currentReqId !== requestIdRef.current) return;

      setTestResult(data);
      setError(null);
    } catch (err) {
      if (currentReqId !== requestIdRef.current) return;
      console.error('Error running hypothesis test:', err);
      setError(err.message || `Failed to run hypothesis test for ${selectedTicker}.`);
    } finally {
      if (currentReqId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [selectedIndicator, selectedTicker, selectedRange]);

  const isNS = selectedTicker.endsWith('.NS');
  const resultData = testResult?.result;
  const isSignificant = resultData?.reject_null === true;

  return (
    <div className="flex flex-col gap-8">
      {/* Header and Controls */}
      <div className="flex flex-col gap-5">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-extrabold tracking-tight"
            style={{ fontFamily: 'var(--font-headline)', color: 'var(--text-primary)' }}
          >
            Macro Hypothesis Testing
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Statistically evaluate empirical relationships between macroeconomic indicators and equity returns.
          </p>
        </div>

        {/* Input Configuration Card */}
        <Card className="p-5 sm:p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              1. Select Macroeconomic Indicator
            </span>
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[var(--surface-hero)] border border-[var(--border)] self-start">
              {SUPPORTED_INDICATORS.map((ind) => {
                const isActive = selectedIndicator === ind.code;
                return (
                  <button
                    key={ind.code}
                    type="button"
                    id={`indicator-btn-${ind.code.toLowerCase()}`}
                    onClick={() => setSelectedIndicator(ind.code)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      isActive ? 'shadow-sm' : 'hover:text-[var(--text-primary)]'
                    }`}
                    style={{
                      backgroundColor: isActive ? 'var(--gold)' : 'transparent',
                      color: isActive ? '#0B0D14' : 'var(--text-secondary)',
                    }}
                  >
                    {ind.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                2. Select Asset Ticker
              </span>
              <StockPicker
                id="hypothesis-stock-picker"
                value={selectedTicker}
                onChange={handleTickerSelect}
                placeholder="Search US or Indian stock (e.g. MSFT, TCS.NS)..."
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                3. Date Range
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <DateRangeControl
                  value={selectedRange}
                  onChange={setSelectedRange}
                  options={['1Y', '3Y', '5Y']}
                />

                {/* Explicit Run Test Button */}
                <button
                  type="button"
                  id="run-hypothesis-btn"
                  onClick={handleRunTest}
                  disabled={!selectedTicker || loading}
                  className={`px-5 py-2 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 ${
                    !selectedTicker || loading
                      ? 'opacity-40 cursor-not-allowed'
                      : 'cursor-pointer hover:brightness-110 active:scale-[0.98]'
                  }`}
                  style={{
                    backgroundColor: 'var(--gold)',
                    color: '#0B0D14',
                  }}
                >
                  {loading ? 'Running Test...' : 'Run Test'}
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Inline Calm Error Banner */}
      {error && (
        <div
          id="hypothesis-error-banner"
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
            Evaluating Pearson correlation for {selectedIndicator} vs. {selectedTicker} ({selectedRange})...
          </p>
        </div>
      )}

      {/* Empty State before first test execution */}
      {!testResult && !loading && !error && (
        <Card className="py-20 px-6 text-center flex flex-col items-center justify-center gap-4 max-w-lg mx-auto">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold"
            style={{
              backgroundColor: 'var(--surface-hero)',
              color: 'var(--gold)',
              border: '1px solid var(--border)',
            }}
          >
            🔬
          </div>
          <h2
            className="text-lg font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-headline)', color: 'var(--text-primary)' }}
          >
            Ready to Test
          </h2>
          <p className="text-sm max-w-sm" style={{ color: 'var(--text-secondary)' }}>
            Pick an indicator, select an asset ticker, and click <strong>Run Test</strong> to compute honest out-of-sample statistical significance.
          </p>
        </Card>
      )}

      {/* Results View */}
      {testResult && !loading && (
        <div className="flex flex-col gap-6">
          {/* Hero Section: Test Summary & Prominent Interpretation */}
          <section>
            <div
              className="p-6 sm:p-8 transition-colors duration-200 overflow-hidden relative flex flex-col gap-6"
              style={{
                backgroundColor: 'var(--surface-hero)',
                border: '0.5px solid var(--border-strong)',
                borderRadius: 'var(--radius-hero)',
                boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.25)',
              }}
            >
              {/* Header: Indicator, Ticker, and Verdict Badge */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className="text-2xl sm:text-3xl font-extrabold tracking-tight"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {testResult.indicator_name}
                    </span>
                    <span className="text-sm font-mono px-2 py-0.5 rounded bg-[var(--border)]" style={{ color: 'var(--text-muted)' }}>
                      {testResult.indicator_code}
                    </span>
                    <span className="text-xl" style={{ color: 'var(--text-muted)' }}>
                      vs.
                    </span>
                    <span
                      className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono"
                      style={{ color: 'var(--gold)' }}
                    >
                      {testResult.ticker}
                    </span>
                    <Badge tone="neutral" className="text-xs">
                      {isNS ? 'India (NSE)' : 'US Equities'}
                    </Badge>
                  </div>
                  {companyInfo?.name && (
                    <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {companyInfo.name}
                    </p>
                  )}
                  <div className="text-xs font-mono mt-1.5" style={{ color: 'var(--text-muted)' }}>
                    Sample Period: {testResult.period.start} → {testResult.period.end}
                  </div>
                </div>

                {/* Verdict Badge */}
                <div className="flex sm:flex-col sm:items-end gap-1.5">
                  <div className="text-xs font-semibold uppercase tracking-wider hidden sm:block" style={{ color: 'var(--text-muted)' }}>
                    Verdict
                  </div>
                  <Badge
                    id="hypothesis-verdict-badge"
                    tone={isSignificant ? 'up' : 'neutral'}
                    className="text-xs sm:text-sm font-bold px-3 py-1"
                  >
                    {isSignificant ? 'Statistically significant' : 'Not statistically significant'}
                  </Badge>
                </div>
              </div>

              {/* Prominent Plain-English Interpretation Callout */}
              <div
                id="hypothesis-interpretation"
                className="p-4 sm:p-5 rounded-xl border flex items-start gap-3.5 transition-all"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: isSignificant ? 'var(--green-border)' : 'var(--border-strong)',
                }}
              >
                <span className="text-xl select-none mt-0.5">{isSignificant ? '⚡' : '⚖️'}</span>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Statistical Interpretation
                  </span>
                  <p className="text-sm sm:text-base font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    {resultData.interpretation}
                  </p>
                </div>
              </div>

              {/* Formulated Hypotheses Block */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--border)]">
                <div className="flex flex-col gap-1 p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                  <span className="text-[11px] font-mono font-bold uppercase" style={{ color: 'var(--text-muted)' }}>
                    Null Hypothesis (H₀)
                  </span>
                  <p id="hypothesis-h0-text" className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {testResult.hypotheses.h0}
                  </p>
                </div>

                <div className="flex flex-col gap-1 p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                  <span className="text-[11px] font-mono font-bold uppercase" style={{ color: 'var(--text-muted)' }}>
                    Alternative Hypothesis (H₁)
                  </span>
                  <p id="hypothesis-h1-text" className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {testResult.hypotheses.h1}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Stat Strip: Summary Statistics Only */}
          <section>
            <Card className="overflow-hidden">
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border)]">
                <StatCard
                  label="Correlation (r)"
                  value={resultData.r !== undefined ? resultData.r.toFixed(4) : '—'}
                  tone="neutral"
                />
                <StatCard
                  label="p-value"
                  value={
                    resultData.p_value !== undefined
                      ? resultData.p_value < 0.0001
                        ? '< 0.0001'
                        : resultData.p_value.toFixed(4)
                      : '—'
                  }
                  tone={isSignificant ? 'up' : 'neutral'}
                />
                <StatCard
                  label="Sample Size (n)"
                  value={`${resultData.n_obs}`}
                  tone="neutral"
                />
                <StatCard
                  label="Significance Threshold (α)"
                  value={`${resultData.alpha}`}
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
