import { useState, useRef, useCallback } from 'react';
import { getPortfolioAnalysis, getAssetPrices } from '../lib/api';

/**
 * Shared hook for portfolio analysis and asset pricing.
 * Used by both Dashboard and PortfolioBuilder.
 *
 * @returns {{
 *   data: any,
 *   loading: boolean,
 *   error: string | null,
 *   analyze: (holdings: Array<{ticker: string, weight: number}>, start: string, end: string) => Promise<any>
 * }}
 */
export function usePortfolioAnalysis() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestIdRef = useRef(0);

  const analyze = useCallback(async (holdings, start, end) => {
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      // Parallel fetch: portfolio aggregate analysis + individual asset prices
      const [portfolioRes, ...assetsRes] = await Promise.all([
        getPortfolioAnalysis(holdings, start, end),
        ...holdings.map((h) => getAssetPrices(h.ticker, start, end)),
      ]);

      // Guard against race condition: ignore out-of-order response if newer request dispatched
      if (currentRequestId !== requestIdRef.current) {
        return null;
      }

      // Process holdings pricing & daily return
      const processedHoldings = holdings.map((h, i) => {
        const prices = assetsRes[i]?.data || [];
        const isNS = h.ticker.endsWith('.NS');
        const currency = isNS ? '₹' : '$';

        let latestPrice = null;
        let dayChangePct = 0;

        if (prices.length >= 1) {
          latestPrice = prices[prices.length - 1].close;
        }
        if (prices.length >= 2) {
          const prevPrice = prices[prices.length - 2].close;
          if (prevPrice > 0 && latestPrice !== null) {
            dayChangePct = ((latestPrice - prevPrice) / prevPrice) * 100;
          }
        }

        return {
          ticker: h.ticker,
          weight: h.weight,
          currency,
          latestPrice,
          dayChangePct,
        };
      });

      const combinedData = {
        ...portfolioRes,
        holdings: processedHoldings,
        holdingsData: processedHoldings,
      };

      setData(combinedData);
      setError(null);
      return combinedData;
    } catch (err) {
      if (currentRequestId !== requestIdRef.current) {
        return null;
      }
      console.error('Error in usePortfolioAnalysis:', err);
      const errMsg = err.message || "Couldn't load portfolio data. Check that the backend is running.";
      setError(errMsg);
      // Keep previous data intact so user doesn't lose good view on error
      return null;
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  return { data, loading, error, analyze };
}

export default usePortfolioAnalysis;
