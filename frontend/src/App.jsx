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
    { to: '/portfolio', label: 'Portfolio' },
    { to: '/assets', label: 'Assets' },
    { to: '/forecast', label: 'Forecast' },
    { to: '/hypothesis', label: 'Hypothesis' },
  ];

  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <AmbientBackground />

      {/* Centered Shell: max-width 1200px, margin 24px auto (12px under 640px) */}
      <div
        className="relative z-10 w-full px-3 sm:px-4 my-3 sm:my-6 mx-auto"
        style={{ maxWidth: '1200px' }}
      >
        {/* Frame: frame background, 1px border-strong, radius 28px (20px under 640px), padding 16px (12px under 640px) */}
        <div
          className="p-3 sm:p-4 rounded-[20px] sm:rounded-[28px] border border-[var(--border-strong)] flex flex-col gap-6"
          style={{ backgroundColor: 'var(--frame)' }}
        >
          {/* Pill Nav */}
          <header
            className="w-full max-[719px]:rounded-[20px] min-[720px]:rounded-full border border-[var(--border)] transition-colors select-none"
            style={{ backgroundColor: 'var(--surface)' }}
          >
            {/* Mobile layout (< 720px): 2 rows */}
            <div className="flex min-[720px]:hidden flex-col gap-2 px-2.5 py-1.5">
              <div className="flex items-center justify-between w-full">
                <NavLink to="/" className="flex items-center gap-2 group flex-shrink-0">
                  <span
                    className="rounded-full inline-block"
                    style={{ width: '6px', height: '6px', backgroundColor: 'var(--orange)' }}
                  />
                  <span
                    className="text-base tracking-tight text-[var(--text-primary)]"
                    style={{ fontFamily: 'var(--font-headline)', fontWeight: 700 }}
                  >
                    fIRISK
                  </span>
                </NavLink>
                <ThemeToggle />
              </div>
              <nav
                className="flex items-center gap-1 overflow-x-auto whitespace-nowrap py-0.5 [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {navLinks.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className="transition-colors hover:text-[var(--text-primary)] cursor-pointer"
                    style={({ isActive }) => ({
                      padding: '6px 12px',
                      fontSize: '13px',
                      fontWeight: isActive ? 600 : 500,
                      backgroundColor: isActive ? 'var(--text-primary)' : 'transparent',
                      color: isActive ? 'var(--frame)' : 'var(--text-secondary)',
                      borderRadius: 'var(--radius-pill)',
                      whiteSpace: 'nowrap',
                    })}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Desktop layout (>= 720px): 1 row */}
            <div className="hidden min-[720px]:flex items-center justify-between w-full gap-4 px-3.5 py-1.5">
              <NavLink to="/" className="flex items-center gap-2 group flex-shrink-0">
                <span
                  className="rounded-full inline-block"
                  style={{ width: '6px', height: '6px', backgroundColor: 'var(--orange)' }}
                />
                <span
                  className="text-base tracking-tight text-[var(--text-primary)]"
                  style={{ fontFamily: 'var(--font-headline)', fontWeight: 700 }}
                >
                  fIRISK
                </span>
              </NavLink>

              <nav className="flex items-center justify-center gap-1 flex-1">
                {navLinks.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className="transition-colors hover:text-[var(--text-primary)] cursor-pointer"
                    style={({ isActive }) => ({
                      padding: '6px 12px',
                      fontSize: '13px',
                      fontWeight: isActive ? 600 : 500,
                      backgroundColor: isActive ? 'var(--text-primary)' : 'transparent',
                      color: isActive ? 'var(--frame)' : 'var(--text-secondary)',
                      borderRadius: 'var(--radius-pill)',
                      whiteSpace: 'nowrap',
                    })}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <div className="flex items-center flex-shrink-0">
                <ThemeToggle />
              </div>
            </div>
          </header>

          {/* ALL route content renders inside the frame, below the nav */}
          <main className="w-full flex-1">
            <Outlet />
          </main>
        </div>
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
            <Route path="portfolio" element={<PortfolioBuilder />} />
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
