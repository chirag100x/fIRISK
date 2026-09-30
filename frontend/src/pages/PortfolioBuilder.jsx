import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { usePortfolioAnalysis } from '../hooks/usePortfolioAnalysis';
import PortfolioResultsPanel from '../components/portfolio/PortfolioResultsPanel';

const INITIAL_HOLDINGS = [
  { ticker: 'AAPL', weight: 40 },
  { ticker: 'MSFT', weight: 30 },
  { ticker: 'RELIANCE.NS', weight: 30 },
];

const DATE_RANGES = [
  { id: '1M', label: '1M' },
  { id: '3M', label: '3M' },
  { id: '6M', label: '6M' },
  { id: '1Y', label: '1Y' },
];

function getDateRange(rangePreset) {
  const end = new Date();
  const start = new Date();
  if (rangePreset === '1M') {
    start.setMonth(start.getMonth() - 1);
  } else if (rangePreset === '3M') {
    start.setMonth(start.getMonth() - 3);
  } else if (rangePreset === '6M') {
    start.setMonth(start.getMonth() - 6);
  } else {
    // 1Y
    start.setFullYear(start.getFullYear() - 1);
  }
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export default function PortfolioBuilder() {
  const [holdings, setHoldings] = useState(INITIAL_HOLDINGS);
  const [selectedRange, setSelectedRange] = useState('1Y');
  const [validationError, setValidationError] = useState(null);

  const { data, loading, error, analyze } = usePortfolioAnalysis();

  // On mount: auto-run analyze once with the demo portfolio
  useEffect(() => {
    const { start, end } = getDateRange('1Y');
    analyze(INITIAL_HOLDINGS, start, end);
  }, [analyze]);

  const updateHolding = (index, field, value) => {
    setHoldings((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
    // Clear validation error when user edits
    if (validationError) setValidationError(null);
  };

  const handleTickerBlur = (index, value) => {
    updateHolding(index, 'ticker', value.trim().toUpperCase());
  };

  const addHolding = () => {
    setHoldings((prev) => [...prev, { ticker: '', weight: '' }]);
    if (validationError) setValidationError(null);
  };

  const removeHolding = (index) => {
    setHoldings((prev) => prev.filter((_, i) => i !== index));
    if (validationError) setValidationError(null);
  };

  const handleAnalyze = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    // Client-side validation before calling analyze()
    if (!holdings || holdings.length === 0) {
      setValidationError('Add at least one holding with a ticker and weight.');
      return;
    }

    for (let i = 0; i < holdings.length; i++) {
      const h = holdings[i];
      const ticker = (h.ticker || '').trim();
      const weightNum = Number(h.weight);

      if (!ticker) {
        setValidationError('Add at least one holding with a ticker and weight. Ticker cannot be empty.');
        return;
      }

      if (isNaN(weightNum) || weightNum <= 0) {
        setValidationError(`Holding "${ticker}" must have a positive weight.`);
        return;
      }
    }

    setValidationError(null);

    const sanitizedHoldings = holdings.map((h) => ({
      ticker: h.ticker.trim().toUpperCase(),
      weight: Number(h.weight),
    }));

    const { start, end } = getDateRange(selectedRange);
    await analyze(sanitizedHoldings, start, end);
  };

  const activeErrorMessage = validationError || error;

  return (
    <div className="flex flex-col gap-8">
      {/* Page Title & Intro */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-extrabold tracking-tight"
            style={{ fontFamily: 'var(--font-headline)', color: 'var(--text-primary)' }}
          >
            Portfolio Builder
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Construct custom allocations, test multi-currency portfolios, and compute live risk metrics.
          </p>
        </div>

        {/* Date Range Segmented Control */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--surface)] border border-[var(--border)] self-start sm:self-auto">
          {DATE_RANGES.map((r) => {
            const isActive = selectedRange === r.id;
            return (
              <button
                key={r.id}
                type="button"
                id={`range-btn-${r.id}`}
                onClick={() => setSelectedRange(r.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? 'shadow-sm'
                    : 'hover:text-[var(--text-primary)]'
                }`}
                style={{
                  backgroundColor: isActive ? 'var(--gold)' : 'transparent',
                  color: isActive ? '#0B0D14' : 'var(--text-secondary)',
                }}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Holdings Configuration Card */}
      <Card className="p-5 sm:p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div>
            <h2
              className="text-sm font-bold uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-headline)', color: 'var(--text-primary)' }}
            >
              Portfolio Allocation
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Weights do not need to sum to 100 — they are automatically normalized.
            </p>
          </div>
          <button
            type="button"
            id="add-holding-btn"
            onClick={addHolding}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all border border-[var(--border)] hover:border-[var(--gold)] hover:text-[var(--gold)]"
            style={{
              backgroundColor: 'var(--surface-hero)',
              color: 'var(--text-primary)',
            }}
          >
            + Add holding
          </button>
        </div>

        {/* Inline Error Banner (Shown above holdings editor for both validation and backend errors) */}
        {activeErrorMessage && (
          <div
            id="builder-error-banner"
            className="p-3.5 rounded-xl border flex items-start gap-3 transition-all"
            style={{
              backgroundColor: 'rgba(248, 113, 113, 0.1)',
              borderColor: 'rgba(248, 113, 113, 0.3)',
              color: 'var(--red)',
            }}
          >
            <div className="mt-0.5">
              <Badge tone="down">{validationError ? 'Validation' : 'Error'}</Badge>
            </div>
            <div className="flex-1 text-xs sm:text-sm font-medium leading-relaxed">
              {activeErrorMessage}
            </div>
          </div>
        )}

        {/* Holdings Rows */}
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-12 gap-3 px-1 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            <div className="col-span-6 sm:col-span-7">Asset Ticker (e.g. AAPL, RELIANCE.NS)</div>
            <div className="col-span-4 sm:col-span-4">Weight</div>
            <div className="col-span-2 sm:col-span-1 text-right">Action</div>
          </div>

          {holdings.map((h, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-3 items-center p-2 rounded-xl bg-[var(--surface-hero)] border border-[var(--border)] transition-colors hover:border-[var(--border-strong)]"
            >
              {/* Ticker Input */}
              <div className="col-span-6 sm:col-span-7">
                <input
                  type="text"
                  id={`holding-ticker-${index}`}
                  value={h.ticker}
                  onChange={(e) => updateHolding(index, 'ticker', e.target.value)}
                  onBlur={(e) => handleTickerBlur(index, e.target.value)}
                  placeholder="e.g. AAPL"
                  className="w-full px-3 py-1.5 rounded-lg text-xs sm:text-sm font-mono tracking-wide bg-[var(--surface)] border border-[var(--border)] focus:outline-none focus:border-[var(--gold)] transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>

              {/* Weight Input */}
              <div className="col-span-4 sm:col-span-4">
                <input
                  type="number"
                  id={`holding-weight-${index}`}
                  step="any"
                  min="0"
                  value={h.weight}
                  onChange={(e) => updateHolding(index, 'weight', e.target.value)}
                  placeholder="e.g. 40"
                  className="w-full px-3 py-1.5 rounded-lg text-xs sm:text-sm font-mono bg-[var(--surface)] border border-[var(--border)] focus:outline-none focus:border-[var(--gold)] transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                />
              </div>

              {/* Remove Action */}
              <div className="col-span-2 sm:col-span-1 flex justify-end">
                <button
                  type="button"
                  id={`remove-holding-${index}`}
                  onClick={() => removeHolding(index)}
                  title="Remove holding"
                  disabled={holdings.length <= 1}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors cursor-pointer ${
                    holdings.length <= 1
                      ? 'opacity-30 cursor-not-allowed text-[var(--text-muted)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--red)] hover:bg-[rgba(248,113,113,0.1)]'
                  }`}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {holdings.length} {holdings.length === 1 ? 'row' : 'rows'} configured
          </span>

          <button
            type="button"
            id="analyze-btn"
            onClick={handleAnalyze}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            style={{
              backgroundColor: 'var(--gold)',
              color: '#0B0D14',
            }}
          >
            {loading && (
              <div className="w-3.5 h-3.5 border-2 border-[#0B0D14] border-t-transparent rounded-full animate-spin" />
            )}
            <span>{loading ? 'Analyzing...' : 'Analyze portfolio'}</span>
          </button>
        </div>
      </Card>

      {/* Loading state when no previous data exists */}
      {loading && !data && (
        <div className="py-16 flex flex-col items-center justify-center gap-4 text-center">
          <div
            className="w-10 h-10 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin"
          />
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Analyzing portfolio risk across US &amp; Indian markets...
          </p>
        </div>
      )}

      {/* Results Panel */}
      {data && (
        <PortfolioResultsPanel
          data={data}
          periodLabel={`${selectedRange} return`}
        />
      )}
    </div>
  );
}
