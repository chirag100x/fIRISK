import React, { useEffect } from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { usePortfolioAnalysis } from '../hooks/usePortfolioAnalysis';
import PortfolioResultsPanel from '../components/portfolio/PortfolioResultsPanel';

const DEMO_HOLDINGS = [
  { ticker: 'AAPL', weight: 40 },
  { ticker: 'MSFT', weight: 30 },
  { ticker: 'RELIANCE.NS', weight: 30 },
];

function getDateRange() {
  const end = new Date();
  const start = new Date();
  start.setFullYear(start.getFullYear() - 1);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export default function Dashboard() {
  const { data, loading, error, analyze } = usePortfolioAnalysis();

  useEffect(() => {
    const { start, end } = getDateRange();
    analyze(DEMO_HOLDINGS, start, end);
  }, [analyze]);

  if (loading || (!data && !error)) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-4 text-center">
        <div
          className="w-10 h-10 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin"
        />
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
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
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-headline)', color: 'var(--text-primary)' }}
          >
            Couldn't load portfolio data
          </h2>
          <p className="text-sm max-w-md" style={{ color: 'var(--text-secondary)' }}>
            Check that the backend is running at <code className="px-1.5 py-0.5 rounded bg-[var(--border)] font-mono text-xs">http://localhost:8000</code>.
          </p>
          <button
            type="button"
            onClick={handleFetch}
            className="mt-2 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: 'var(--gold)',
              color: '#0B0D14',
            }}
          >
            Retry Analysis
          </button>
        </Card>
      </div>
    );
  }

  return <PortfolioResultsPanel data={data} periodLabel="1-year return" />;
}
