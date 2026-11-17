import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { usePortfolioAnalysis } from '../hooks/usePortfolioAnalysis';
import { useDataAsOf } from '../context/DataAsOfContext';
import PortfolioResultsPanel from '../components/portfolio/PortfolioResultsPanel';

import StockPicker from '../components/ui/StockPicker';
import DateRangeControl from '../components/ui/DateRangeControl';
import Button from '../components/ui/Button';
import { getDateRange } from '../lib/dateUtils';

const INITIAL_HOLDINGS = [
  { ticker: 'AAPL', weight: 40 },
  { ticker: 'MSFT', weight: 30 },
  { ticker: 'RELIANCE.NS', weight: 30 },
];

export default function PortfolioBuilder() {
  const [holdings, setHoldings] = useState(INITIAL_HOLDINGS);
  const [selectedRange, setSelectedRange] = useState('1Y');
  const [validationError, setValidationError] = useState('');

  const { data, loading, error, analyze } = usePortfolioAnalysis();
  const { setAsOf } = useDataAsOf();

  // Set DataAsOfContext when data loads
  useEffect(() => {
    if (data && data.portfolio_value_index && data.portfolio_value_index.length > 0) {
      const lastPoint = data.portfolio_value_index[data.portfolio_value_index.length - 1];
      if (lastPoint && lastPoint.date) {
        setAsOf(lastPoint.date);
      }
    }
    return () => setAsOf(null);
  }, [data, setAsOf]);

  const addHolding = () => {
    setHoldings([...holdings, { ticker: '', weight: 0 }]);
  };

  const removeHolding = (index) => {
    if (holdings.length <= 1) return;
    setHoldings(holdings.filter((_, i) => i !== index));
  };

  const updateHolding = (index, field, value) => {
    const updated = [...holdings];
    updated[index] = {
      ...updated[index],
      [field]: field === 'weight' ? (value === '' ? '' : parseFloat(value) || 0) : value,
    };
    setHoldings(updated);
    if (validationError) setValidationError('');
  };

  const validate = () => {
    if (holdings.length === 0) {
      return 'Portfolio must contain at least one holding.';
    }

    let hasValidTicker = false;
    let totalWeight = 0;

    for (let i = 0; i < holdings.length; i++) {
      const h = holdings[i];
      const ticker = (h.ticker || '').trim();
      const weight = typeof h.weight === 'number' ? h.weight : parseFloat(h.weight) || 0;

      if (!ticker) {
        return `Row ${i + 1} has no asset ticker selected.`;
      }

      if (weight < 0) {
        return `Row ${i + 1} (${ticker}) has a negative weight. Weights must be >= 0.`;
      }

      if (weight > 0) {
        hasValidTicker = true;
      }
      totalWeight += weight;
    }

    if (totalWeight <= 0 || !hasValidTicker) {
      return 'Total portfolio weight must be strictly positive (> 0).';
    }

    return '';
  };

  const handleAnalyze = () => {
    const err = validate();
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError('');

    const sanitized = holdings
      .map((h) => ({
        ticker: h.ticker.trim().toUpperCase(),
        weight: typeof h.weight === 'number' ? h.weight : parseFloat(h.weight) || 0,
      }))
      .filter((h) => h.ticker && h.weight > 0);

    const { start, end } = getDateRange(selectedRange);
    analyze(sanitized, start, end);
  };

  const activeErrorMessage = validationError || error;

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-normal tracking-tight text-white"
          >
            Portfolio Builder
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-2)' }}>
            Construct custom allocations, test multi-currency portfolios, and compute live risk metrics.
          </p>
        </div>

        {/* Date Range Segmented Control */}
        <DateRangeControl
          value={selectedRange}
          onChange={setSelectedRange}
          className="self-start sm:self-auto"
        />
      </div>

      {/* Holdings Configuration Card */}
      <Card className="p-5 sm:p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div>
            <h2
              className="text-sm font-semibold uppercase tracking-wider"
              style={{ color: 'var(--cream)' }}
            >
              Portfolio Allocation
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              Weights do not need to sum to 100 — they are automatically normalized.
            </p>
          </div>
          <button
            type="button"
            id="add-holding-btn"
            onClick={addHolding}
            className="px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all border border-[var(--border)] hover:border-[var(--gold)] hover:text-[var(--gold)]"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              color: 'var(--text)',
            }}
          >
            + Add holding
          </button>
        </div>

        {/* Inline Error Banner */}
        {activeErrorMessage && (
          <div
            id="builder-error-banner"
            className="glass p-3.5 rounded-xl border flex items-start gap-3 transition-all"
            style={{
              background: 'linear-gradient(180deg, var(--loss-fill), rgba(255,90,110,.15))',
              borderColor: 'rgba(255,130,140,.32)',
              color: 'var(--loss-text)',
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
          <div className="grid grid-cols-12 gap-3 px-1 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            <div className="col-span-6 sm:col-span-7">Asset Ticker (e.g. AAPL, RELIANCE.NS)</div>
            <div className="col-span-4 sm:col-span-4">Weight</div>
            <div className="col-span-2 sm:col-span-1 text-right">Action</div>
          </div>

          {holdings.map((h, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-3 items-center p-2 rounded-xl border border-[var(--border)] transition-colors hover:border-[var(--border-strong)]"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)' }}
            >
              {/* Ticker Input with StockPicker */}
              <div className="col-span-6 sm:col-span-7">
                <StockPicker
                  id={`holding-ticker-${index}`}
                  compact={true}
                  value={h.ticker}
                  onChange={(val) => updateHolding(index, 'ticker', val)}
                  placeholder="e.g. AAPL"
                />
              </div>

              {/* Recessed Weight Input */}
              <div className="col-span-4 sm:col-span-4">
                <input
                  type="number"
                  id={`holding-weight-${index}`}
                  step="any"
                  min="0"
                  value={h.weight}
                  onChange={(e) => updateHolding(index, 'weight', e.target.value)}
                  placeholder="e.g. 40"
                  className="w-full px-3 py-1.5 rounded-lg text-xs sm:text-sm font-mono transition-colors focus:outline-none"
                  style={{
                    backgroundColor: '#11141c',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    borderRadius: '8px',
                    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.5)',
                    color: 'var(--text)',
                  }}
                  onFocusCapture={(e) => {
                    e.target.style.borderColor = 'var(--gold)';
                    e.target.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,.5), 0 0 0 1px var(--gold)';
                  }}
                  onBlurCapture={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.18)';
                    e.target.style.boxShadow = 'inset 0 1px 3px rgba(0, 0, 0, 0.5)';
                  }}
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
                      ? 'opacity-30 cursor-not-allowed text-[var(--muted)]'
                      : 'text-[var(--muted)] hover:text-[var(--loss-text)] hover:bg-[rgba(248,113,113,0.1)]'
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
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            {holdings.length} {holdings.length === 1 ? 'row' : 'rows'} configured
          </span>

          <Button
            id="analyze-btn"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading && (
              <div className="w-3.5 h-3.5 border-2 border-[#1a1205] border-t-transparent rounded-full animate-spin" />
            )}
            <span>{loading ? 'Analyzing...' : 'Analyze portfolio'}</span>
          </Button>
        </div>
      </Card>

      {/* Loading state when no previous data exists */}
      {loading && !data && (
        <div className="py-16 flex flex-col items-center justify-center gap-4 text-center">
          <div
            className="w-10 h-10 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin"
          />
          <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
            Analyzing portfolio risk across US &amp; Indian markets...
          </p>
        </div>
      )}

      {/* Results Panel */}
      {data && (
        <PortfolioResultsPanel
          data={data}
        />
      )}
    </div>
  );
}
