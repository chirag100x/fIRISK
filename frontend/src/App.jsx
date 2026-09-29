import React from 'react';
import { ThemeProvider } from './components/layout/ThemeProvider';
import ThemeToggle from './components/layout/ThemeToggle';
import AmbientBackground from './components/layout/AmbientBackground';
import Card from './components/ui/Card';
import StatCard from './components/ui/StatCard';
import Badge from './components/ui/Badge';
import AnimatedNumber from './components/ui/AnimatedNumber';

function StyleGuideContent() {
  return (
    <div className="relative z-10 min-h-screen px-4 sm:px-8 py-10 max-w-5xl mx-auto flex flex-col gap-8">
      {/* Top Bar / Header */}
      <header className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm tracking-tighter"
            style={{
              backgroundColor: 'var(--gold)',
              color: '#0B0D14',
            }}
          >
            fR
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1
                className="text-lg font-bold tracking-tight"
                style={{ fontFamily: 'var(--font-headline)', color: 'var(--text-primary)' }}
              >
                fIRISK
              </h1>
              <Badge tone="neutral">Design System Primitives</Badge>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Phase 10 — Locked Tokens &amp; Motion Parity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
            Switch theme
          </span>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero Showcase Card */}
      <section>
        <div
          className="p-6 sm:p-8 transition-colors duration-200"
          style={{
            backgroundColor: 'var(--surface-hero)',
            border: '0.5px solid var(--border-strong)',
            borderRadius: 'var(--radius-hero)',
            boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div className="flex flex-col gap-2">
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-secondary)' }}
            >
              Total Portfolio Value
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
                  value={109059}
                  format={(n) => `$${Math.round(n).toLocaleString()}`}
                  duration={1400}
                />
              </span>
              <div className="flex items-center gap-2">
                <Badge tone="up">▲ 9.06%</Badge>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  all-time return
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stat Strip Showcase */}
      <section>
        <Card className="overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border)]">
            <StatCard
              label="Volatility (Ann.)"
              value="16.68%"
              tone="neutral"
            />
            <StatCard
              label="Beta (vs S&P 500)"
              value="0.86"
              tone="neutral"
            />
            <StatCard
              label="Sharpe Ratio"
              value="0.51"
              tone="neutral"
            />
            <StatCard
              label="Max Drawdown"
              value="-17.03%"
              tone="down"
            />
            <StatCard
              label="Value at Risk (95%)"
              value="1.61%"
              tone="neutral"
            />
          </div>
        </Card>
      </section>

      {/* Primitives Visual Checker Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Badges & Accents Card */}
        <Card className="p-5 flex flex-col gap-3">
          <h2
            className="text-sm font-semibold tracking-tight"
            style={{ fontFamily: 'var(--font-headline)', color: 'var(--text-primary)' }}
          >
            Badge &amp; Accent Primitives
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="up">▲ 9.06% Gain</Badge>
            <Badge tone="down">▼ 3.42% Loss</Badge>
            <Badge tone="neutral">● Active</Badge>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Green is reserved exclusively for gains (<span style={{ color: 'var(--green)' }}>#34D399</span>). Red is reserved exclusively for losses (<span style={{ color: 'var(--red)' }}>#F87171</span>). Gold is the brand accent (<span style={{ color: 'var(--gold)' }}>#C9A24B</span>).
          </p>
        </Card>

        {/* Surface & Radii Card */}
        <Card className="p-5 flex flex-col gap-3">
          <h2
            className="text-sm font-semibold tracking-tight"
            style={{ fontFamily: 'var(--font-headline)', color: 'var(--text-primary)' }}
          >
            Card Surfaces &amp; Radii
          </h2>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span className="px-2 py-1 rounded" style={{ backgroundColor: 'var(--border)' }}>
              radius-hero: 24px
            </span>
            <span className="px-2 py-1 rounded" style={{ backgroundColor: 'var(--border)' }}>
              radius-card: 14px
            </span>
            <span className="px-2 py-1 rounded" style={{ backgroundColor: 'var(--border)' }}>
              radius-pill: 999px
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Surfaces adapt smoothly between dark default (<span style={{ fontFamily: 'monospace' }}>#0B0D14</span> / <span style={{ fontFamily: 'monospace' }}>#12141F</span>) and light (<span style={{ fontFamily: 'monospace' }}>#F7F6F3</span> / <span style={{ fontFamily: 'monospace' }}>#FFFFFF</span>).
          </p>
        </Card>
      </section>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <div className="relative min-h-screen overflow-x-hidden">
        <AmbientBackground />
        <StyleGuideContent />
      </div>
    </ThemeProvider>
  );
}
