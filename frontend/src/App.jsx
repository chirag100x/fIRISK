import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { ThemeProvider } from './components/layout/ThemeProvider';
import { DataAsOfProvider } from './context/DataAsOfContext';
import Atmosphere from './components/layout/Atmosphere';
import TopBar from './components/layout/TopBar';
import Dashboard from './pages/Dashboard';
import AssetAnalysis from './pages/AssetAnalysis';
import PortfolioBuilder from './pages/PortfolioBuilder';
import Forecast from './pages/Forecast';
import HypothesisTest from './pages/HypothesisTest';
import Placeholder from './pages/Placeholder';

function AppLayout() {
  return (
    <div className="relative min-h-screen">
      <Atmosphere />
      <TopBar />
      <main className="col">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DataAsOfProvider>
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
      </DataAsOfProvider>
    </ThemeProvider>
  );
}
