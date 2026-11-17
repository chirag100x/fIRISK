import React, { useState, useEffect, useCallback } from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import DateRangeControl from '../components/ui/DateRangeControl';
import { usePortfolioAnalysis } from '../hooks/usePortfolioAnalysis';
import { useDataAsOf } from '../context/DataAsOfContext';
import PortfolioResultsPanel from '../components/portfolio/PortfolioResultsPanel';
import { getDateRange } from '../lib/dateUtils';

const DEMO_HOLDINGS = [
  { ticker: 'AAPL', weight: 40 },
  { ticker: 'MSFT', weight: 30 },
  { ticker: 'RELIANCE.NS', weight: 30 },
];

export default function Dashboard() {
  const [selectedRange, setSelectedRange] = useState('1Y');
  const { data, loading, error, analyze } = usePortfolioAnalysis();
  const { setAsOf } = useDataAsOf();

  const handleFetch = useCallback(
    (range = selectedRange) => {
      const { start, end } = getDateRange(range);
      analyze(DEMO_HOLDINGS, start, end);
    },
    [analyze, selectedRange]
  );

  useEffect(() => {
    handleFetch('1Y');
  }, [analyze]);

  // Update DataAsOfContext when portfolio data is loaded
  useEffect(() => {
    if (data && data.portfolio_value_index && data.portfolio_value_index.length > 0) {
      const lastPoint = data.portfolio_value_index[data.portfolio_value_index.length - 1];
      if (lastPoint && lastPoint.date) {
        setAsOf(lastPoint.date);
      }
    }
    return () => setAsOf(null);
  }, [data, setAsOf]);

  const handleRangeChange = (range) => {
    setSelectedRange(range);
    const { start, end } = getDateRange(range);
    analyze(DEMO_HOLDINGS, start, end);
  };

  if (loading || (!data && !error)) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-4 text-center">
        <div
          className="w-10 h-10 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin"
        />
        <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
          Analyzing portfolio risk across US &amp; Indian markets...
        </p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="py-12">
        <Card className="max-w-xl mx-auto p-6 sm:p-8 text-center flex flex-col items-center gap-4">
          <Badge tone="down">Connection Error</Badge>
          <h2
            className="text-xl font-bold tracking-tight text-white"
          >
            Couldn't load portfolio data
          </h2>
          <p className="text-sm max-w-md" style={{ color: 'var(--muted)' }}>
            Check that the backend is running at <code className="px-1.5 py-0.5 rounded bg-[var(--border)] font-mono text-xs">http://localhost:8000</code>.
          </p>
          <Button
            onClick={() => handleFetch(selectedRange)}
            className="mt-2"
          >
            Retry Analysis
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <PortfolioResultsPanel
      data={data}
      rangeControl={
        <DateRangeControl
          options={['1M', '3M', '6M', '1Y']}
          value={selectedRange}
          onChange={handleRangeChange}
        />
      }
    />
  );
}
