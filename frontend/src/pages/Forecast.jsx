import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TICKERS from '../data/tickers';
import { getForecast } from '../lib/api';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import StockPicker from '../components/ui/StockPicker';
import PresetControl from '../components/ui/PresetControl';
import { DEFAULT_FORECAST_PRESETS } from '../lib/forecastConstants';
import ForecastChart from '../components/ui/ForecastChart';

export default function Forecast() {
  const { ticker: paramTicker } = useParams();
  const navigate = useNavigate();

  const [selectedTicker, setSelectedTicker] = useState(paramTicker ? paramTicker.toUpperCase() : '');
  const [activePreset, setActivePreset] = useState('standard');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [forecastData, setForecastData] = useState(null);

  const requestIdRef = useRef(0);

  // Lookup company metadata from curated list
  const companyInfo = TICKERS.find((t) => t.ticker === selectedTicker);

  const currentPresetConfig = DEFAULT_FORECAST_PRESETS.find((p) => p.id === activePreset) || DEFAULT_FORECAST_PRESETS[1];

  const fetchForecastData = useCallback(async (ticker, presetId) => {
    if (!ticker) return;
    const currentReqId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    const preset = DEFAULT_FORECAST_PRESETS.find((p) => p.id === presetId) || DEFAULT_FORECAST_PRESETS[1];

    try {
      const data = await getForecast(ticker, preset.window, preset.testSize);

      if (currentReqId !== requestIdRef.current) return;

      setForecastData(data);
      setError(null);
    } catch (err) {
      if (currentReqId !== requestIdRef.current) return;
      console.error('Error fetching forecast data:', err);
      setError(err.message || `Failed to load forecast for ${ticker}.`);
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
      fetchForecastData(upper, activePreset);
    }
  }, [paramTicker, activePreset, fetchForecastData]);

  // Handle ticker selection from picker
  const handleTickerSelect = (newTicker) => {
    if (!newTicker || newTicker === selectedTicker) return;
    setSelectedTicker(newTicker);
    navigate(`/forecast/${encodeURIComponent(newTicker)}`);
    fetchForecastData(newTicker, activePreset);
  };

  // Handle preset change (Short, Standard, Long)
  const handlePresetChange = (newPresetId) => {
    setActivePreset(newPresetId);
    if (selectedTicker) {
      fetchForecastData(selectedTicker, newPresetId);
    }
  };

  // Currency & Metric calculations
  const isNS = selectedTicker.endsWith('.NS');
  const currency = isNS ? '₹' : '$';

  const evaluation = forecastData?.evaluation;
  const maeStr = evaluation?.mae !== undefined ? `${currency}${evaluation.mae.toFixed(2)}` : '—';
  const rmseStr = evaluation?.rmse !== undefined ? `${currency}${evaluation.rmse.toFixed(2)}` : '—';
  const mapeStr = evaluation?.mape !== undefined ? `${evaluation.mape.toFixed(2)}%` : '—';
  const dirAccStr =
    evaluation?.directional_accuracy !== undefined ? `${evaluation.directional_accuracy.toFixed(2)}%` : '—';
  const nObsStr = evaluation?.n_obs !== undefined ? `${evaluation.n_obs}` : '—';

  return (
    <div className="flex flex-col gap-8">
      {/* Header and Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-extrabold tracking-tight"
              style={{ fontFamily: 'var(--font-headline)', color: 'var(--text-primary)' }}
            >
              Forecast Engine
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Walk-forward out-of-sample backtesting with zero-leakage error evaluation.
            </p>
          </div>

          {/* Preset Segmented Control (active when ticker chosen) */}
          {selectedTicker && (
            <PresetControl
              value={activePreset}
              onChange={handlePresetChange}
              className="self-start sm:self-auto"
            />
          )}
        </div>

        {/* Prominent Search Bar */}
        <div className="w-full max-w-xl">
          <StockPicker
            id="forecast-stock-picker"
            value={selectedTicker}
            onChange={handleTickerSelect}
            placeholder="Search US or Indian stock (e.g. AMZN, TCS.NS)..."
          />
        </div>
      </div>

      {/* Inline Calm Error Banner */}
      {error && (
        <div
          id="forecast-error-banner"
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
            Computing walk-forward backtest for {selectedTicker} ({currentPresetConfig.window}d MA / {currentPresetConfig.testSize}d test)...
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
            🔮
          </div>
          <h2
            className="text-lg font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-headline)', color: 'var(--text-primary)' }}
          >
            No Asset Selected
          </h2>
          <p className="text-sm max-w-sm" style={{ color: 'var(--text-secondary)' }}>
            Search a stock to see its forecast backtest, actual vs. predicted price overlay, and out-of-sample metrics.
          </p>
        </Card>
      )}

      {/* Main Forecast View (When data is available) */}
      {selectedTicker && forecastData && !loading && (
        <div className="flex flex-col gap-6">
          {/* Hero Section: Header + Dual-Line Forecast Chart */}
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
              {/* Header: Ticker, Name, Parameter Badges */}
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
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Lookback Window:{' '}
                      <code className="px-1.5 py-0.5 rounded bg-[var(--border)] font-mono text-[11px] font-semibold">
                        {forecastData.window} days
                      </code>
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Out-of-Sample Test:{' '}
                      <code className="px-1.5 py-0.5 rounded bg-[var(--border)] font-mono text-[11px] font-semibold">
                        {forecastData.test_size} days
                      </code>
                    </span>
                  </div>
                </div>
              </div>

              {/* Dual-Line Forecast Chart (Actual vs. Predicted) */}
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                <ForecastChart
                  backtest={forecastData.backtest}
                  height={240}
                  currency={currency}
                  animate={true}
                />
              </div>
            </div>
          </section>

          {/* Stat Strip: 5 Evaluation Metric Cards */}
          <section>
            <Card className="overflow-hidden">
              <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border)]">
                <StatCard
                  label="MAE"
                  value={maeStr}
                  tone="neutral"
                />
                <StatCard
                  label="RMSE"
                  value={rmseStr}
                  tone="neutral"
                />
                <StatCard
                  label="MAPE"
                  value={mapeStr}
                  tone="neutral"
                />
                <StatCard
                  label="Directional Accuracy"
                  value={dirAccStr}
                  tone="neutral"
                />
                <StatCard
                  label="Observations (n)"
                  value={nObsStr}
                  tone="neutral"
                />
              </div>
            </Card>
          </section>

          {/* Honest Baseline Model Notice */}
          <section>
            <div
              id="forecast-baseline-note"
              className="p-4 rounded-xl border flex items-start gap-3 transition-all"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              <span className="text-base select-none mt-0.5">ℹ️</span>
              <div className="flex-1 text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Baseline Model Notice:{' '}
                </span>
                This forecast uses an out-of-sample walk-forward moving-average baseline with zero lookahead bias. For a naive baseline on efficient financial markets, directional accuracy hovering near 50% is expected and reflects honest empirical evaluation, not a model malfunction.
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
