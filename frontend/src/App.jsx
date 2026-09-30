import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, Outlet } from 'react-router-dom';
import { ThemeProvider } from './components/layout/ThemeProvider';
import ThemeToggle from './components/layout/ThemeToggle';
import AmbientBackground from './components/layout/AmbientBackground';
import Dashboard from './pages/Dashboard';
import AssetAnalysis from './pages/AssetAnalysis';
import PortfolioBuilder from './pages/PortfolioBuilder';
import Forecast from './pages/Forecast';
import HypothesisTest from './pages/HypothesisTest';
import Placeholder from './pages/Placeholder';

function AppLayout() {
  const navLinks = [
    { to: '/', label: 'Dashboard' },
    { to: '/assets', label: 'Assets' },
    { to: '/portfolio', label: 'Portfolio' },
    { to: '/forecast', label: 'Forecast' },
    { to: '/hypothesis', label: 'Hypothesis Test' },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <AmbientBackground />

      <div className="relative z-10 min-h-screen px-4 sm:px-8 py-8 max-w-5xl mx-auto flex flex-col gap-6">
        {/* Top Navigation Bar */}
        <header className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <NavLink to="/" className="flex items-center gap-2.5 group">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm tracking-tighter transition-transform group-hover:scale-105"
                style={{
                  backgroundColor: 'var(--gold)',
                  color: '#0B0D14',
                }}
              >
                fR
              </div>
              <span
                className="text-lg font-bold tracking-tight"
                style={{ fontFamily: 'var(--font-headline)', color: 'var(--text-primary)' }}
              >
                fIRISK
              </span>
            </NavLink>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6">
            {/* Nav links */}
            <nav className="flex items-center gap-1 sm:gap-2">
              {navLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'font-semibold'
                        : 'hover:text-[var(--text-primary)]'
                    }`
                  }
                  style={({ isActive }) => ({
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    backgroundColor: isActive ? 'var(--border)' : 'transparent',
                  })}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center pl-2 border-l border-[var(--border)]">
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Route Outlet */}
        <main className="flex-1 pb-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="assets" element={<AssetAnalysis />} />
            <Route path="assets/:ticker" element={<AssetAnalysis />} />
            <Route
              path="portfolio"
              element={<PortfolioBuilder />}
            />
            <Route path="forecast" element={<Forecast />} />
            <Route path="forecast/:ticker" element={<Forecast />} />
            <Route path="hypothesis" element={<HypothesisTest />} />
            <Route path="hypothesis/:ticker" element={<HypothesisTest />} />
            <Route
              path="*"
              element={
                <Placeholder
                  title="Page Not Found"
                  description="The page you are looking for does not exist."
                />
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
