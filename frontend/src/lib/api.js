const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Fetch portfolio analysis metrics and value index points.
 * @param {Array<{ticker: string, weight: number}>} holdings
 * @param {string} start - 'YYYY-MM-DD'
 * @param {string} end - 'YYYY-MM-DD'
 * @returns {Promise<any>}
 */
export async function getPortfolioAnalysis(holdings, start, end) {
  const url = `${BASE_URL}/api/portfolio/analyze`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      holdings,
      start,
      end,
    }),
  });

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.detail) {
        errorDetail = typeof errorData.detail === 'string'
          ? errorData.detail
          : JSON.stringify(errorData.detail);
      }
    } catch {
      // response wasn't JSON
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

/**
 * Fetch historical prices for an asset.
 * @param {string} ticker
 * @param {string} start - 'YYYY-MM-DD'
 * @param {string} end - 'YYYY-MM-DD'
 * @returns {Promise<any>}
 */
export async function getAssetPrices(ticker, start, end) {
  const params = new URLSearchParams({ start, end });
  const url = `${BASE_URL}/api/assets/${encodeURIComponent(ticker)}/prices?${params.toString()}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    let errorDetail = `Failed to fetch prices for ${ticker} (${response.status})`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.detail) {
        errorDetail = typeof errorData.detail === 'string'
          ? errorData.detail
          : JSON.stringify(errorData.detail);
      }
    } catch {
      // response wasn't JSON
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

/**
 * Fetch asset risk analytics and moving averages.
 * @param {string} ticker
 * @param {string} start - 'YYYY-MM-DD'
 * @param {string} end - 'YYYY-MM-DD'
 * @returns {Promise<any>}
 */
export async function getAssetAnalytics(ticker, start, end) {
  const params = new URLSearchParams({ start, end });
  const url = `${BASE_URL}/api/assets/${encodeURIComponent(ticker)}/analytics?${params.toString()}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    let errorDetail = `Failed to fetch analytics for ${ticker} (${response.status})`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.detail) {
        errorDetail = typeof errorData.detail === 'string'
          ? errorData.detail
          : JSON.stringify(errorData.detail);
      }
    } catch {
      // response wasn't JSON
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

/**
 * Fetch walk-forward forecast backtest and evaluation metrics.
 * @param {string} ticker
 * @param {number} window
 * @param {number} testSize
 * @returns {Promise<any>}
 */
export async function getForecast(ticker, window = 20, testSize = 60) {
  const params = new URLSearchParams({
    window: window.toString(),
    test_size: testSize.toString(),
  });
  const url = `${BASE_URL}/api/forecast/${encodeURIComponent(ticker)}?${params.toString()}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    let errorDetail = `Failed to fetch forecast for ${ticker} (${response.status})`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.detail) {
        errorDetail = typeof errorData.detail === 'string'
          ? errorData.detail
          : JSON.stringify(errorData.detail);
      }
    } catch {
      // response wasn't JSON
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

