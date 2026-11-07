# fIRISK — Financial Risk Analytics & Forecasting Platform

> Real portfolio risk analytics across US and Indian equity markets — volatility, beta, Sharpe ratio, drawdown, VaR, macroeconomic hypothesis testing, and a zero-leakage forecasting baseline.

---

## 1. Title & Tagline

**fIRISK — Financial Risk Analytics & Forecasting Platform**  
*Real portfolio risk analytics across US and Indian equity markets — volatility, beta, Sharpe ratio, drawdown, VaR, macroeconomic hypothesis testing, and a zero-leakage forecasting baseline.*

---

## 2. Overview

**fIRISK** (Project `P_049`) is a full-stack financial engineering platform that enables quantitative risk analysis, macro-economic hypothesis testing, and time-series forecasting across mixed-market equities.

Users can construct multi-asset portfolios blending US equities (e.g., `AAPL`, `MSFT`, `NVDA`) and Indian National Stock Exchange (NSE) equities (e.g., `RELIANCE.NS`, `TCS.NS`, `HDFCBANK.NS`), computing real, empirically verified risk analytics:
- **Daily & Log Returns**
- **Annualized Return Volatility** ($\sigma \times \sqrt{252}$)
- **Market Beta ($\beta$)** — auto-benchmarked against the **S&P 500 (`^GSPC`)** for US equities and the **NIFTY 50 (`^NSEI`)** for Indian equities
- **Sharpe Ratio** ($R_f = 0.0\%$, annualized)
- **Maximum Drawdown (MDD)** — including exact peak and trough dates
- **95% Historical Value-at-Risk (VaR)**
- **Simple Moving Averages (SMA)** — 7, 20, 50, and 200 days

Beyond asset and portfolio metrics, fIRISK provides:
1. **Macroeconomic Hypothesis Testing:** A statistical engine running two-tailed Pearson correlation hypothesis tests ($H_0: \rho = 0$ vs. $H_1: \rho \neq 0$) between verified monthly US macroeconomic indicators (CPI Inflation, Federal Funds Rate, Unemployment Rate) and equity returns, complete with honest significance evaluation and p-values.
2. **Zero-Leakage Forecast Baseline:** An out-of-sample walk-forward moving-average forecasting engine that enforces strict temporal separation (predicting $t$ using only data up to $t-1$) and reports Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), Mean Absolute Percentage Error (MAPE), and Directional Accuracy.

---

## 3. Features

The platform's user interface is structured across five dedicated views:

### Dashboard
- **Demo Portfolio Overview:** Pre-configured with a balanced multi-market portfolio (`AAPL` 40%, `MSFT` 30%, `RELIANCE.NS` 30%) over a trailing 1-year window.
- **Portfolio Value Index Chart:** Interactive SVG chart displaying relative capital growth from a base value of 100.0, complete with high-precision cursor crosshairs and date/value hover tooltips.
- **Risk Metric Stat Strip:** Instant display of annualized volatility, market beta, Sharpe ratio, maximum drawdown, and 95% historical Value-at-Risk.
- **Holdings Breakdown:** Real-time holdings list displaying normalized asset weights, live per-asset closing prices in native currency, and daily percentage change badges.

### Portfolio Builder
- **Editable Holdings Matrix:** Dynamically add, modify, and remove asset rows with weight allocation.
- **Searchable Stock Picker:** Search autocomplete powered by a curated list of over 70 verified US and Indian stocks.
- **Automatic Weight Normalization:** Asset weights do not need to sum to 100 or 1.0; the backend automatically normalizes them proportionally ($w_i / \sum w_k$).
- **Configurable Lookback Windows:** One-click presets for `1M`, `3M`, `6M`, `1Y`, and `5Y` time horizons.
- **Live Recompute:** Full asynchronous round-trip recalculation of portfolio growth index and risk statistics via the backend analytics engine.

### Asset Analysis
- **Universal Ticker Search:** Detailed risk profiling for any supported US or Indian stock symbol.
- **Deep-Linkable Routing:** Direct navigation via `/assets/:ticker` (e.g., `/assets/AAPL`, `/assets/RELIANCE.NS`).
- **Interactive Price Chart:** Responsive OHLCV closing price chart with toggleable simple moving average overlays (`SMA 7`, `SMA 20`, `SMA 50`, `SMA 200`).
- **Benchmark-Aware Beta:** Automatic benchmark resolution to `^NSEI` for NSE symbols or `^GSPC` for US symbols.
- **Stat Strip:** Asset-level volatility, beta against assigned benchmark, Sharpe ratio, drawdown with peak/trough timeline, and 95% historical VaR.

### Forecast
- **Walk-Forward Backtest Visualization:** Actual realized price vs. out-of-sample predicted price plotted side-by-side.
- **Deep-Linkable Routing:** Direct navigation via `/forecast/:ticker` (e.g., `/forecast/MSFT`).
- **Horizon Presets:**
  - **Short:** 10-day lookback window, 30-day out-of-sample test horizon.
  - **Standard:** 20-day lookback window, 60-day out-of-sample test horizon.
  - **Long:** 50-day lookback window, 90-day out-of-sample test horizon.
- **Strict Zero-Leakage Guarantee:** Sequential rolling prediction step where information at day $t$ is never accessible when predicting day $t$.
- **Model Evaluation Strip:** Reports MAE, RMSE, MAPE, Directional Accuracy, and total sample count ($n$).
- **Empirical Baseline Transparency:** Explicit callout acknowledging that directional accuracy near 50% is standard and expected for a random-walk financial price baseline.

### Hypothesis Testing
- **Macro-Equity Correlation:** Empirically tests the relationship between monthly macroeconomic shocks and monthly equity returns.
- **Deep-Linkable Routing:** Direct navigation via `/hypothesis/:ticker`.
- **Supported Indicator Whitelist:** Verified monthly-frequency indicators:
  - **Inflation (CPI)** (`CPIAUCSL`) via FRED
  - **Federal Funds Effective Rate** (`FEDFUNDS`) via FRED
  - **Unemployment Rate** (`UNRATE`) via FRED
- **Statistical Significance Engine:** Computes sample size ($n$), Pearson correlation coefficient ($r$), two-tailed $t$-test $p$-value, and tests against significance threshold $\alpha = 0.05$.
- **Honest Statistical Interpretation:** Plain-language conclusion declaring whether $H_0$ is rejected or failed to be rejected, clearly communicating that correlation does not imply causality.

### Application-Wide Features
- **Theme Persistence:** Seamless dark and light theme switching persisted in `localStorage`.
- **Currency-Aware Formatting:** Intelligent currency detection based on ticker symbol suffixes (e.g., `$` for standard tickers, `₹` for `.NS` tickers).

---

## 4. Tech Stack

### Backend
- **Python:** 3.10+
- **FastAPI:** High-performance, type-hinted asynchronous REST API framework
- **Uvicorn:** Production-grade ASGI web server
- **SQLAlchemy:** SQL toolkit and Object Relational Mapper (ORM)
- **SQLite:** Lightweight, file-based relational database (`firisk.db`), architected to be Postgres-ready via the `DATABASE_URL` environment variable
- **pandas:** Vectorized time-series manipulation, resampling, and window operations
- **scipy:** Statistical hypothesis testing (`scipy.stats.pearsonr`)
- **yfinance:** Market price data retrieval for US and Indian equities
- **pandas-datareader:** Data reader for Federal Reserve Economic Data (FRED)
- **requests & httpx:** HTTP client libraries for external REST interactions (World Bank API)
- **Pydantic:** Data validation and OpenAPI contract enforcement

### Frontend
- **React:** v19.2 (component-based architecture with modern hooks)
- **Vite:** v8.3 build tool and local development server
- **Tailwind CSS:** v4.3 modern utility-first CSS engine
- **React Router:** v7.18 client-side SPA routing

### Data Sources
- **Yahoo Finance (`yfinance`):** Historical OHLCV market prices for US equities and Indian NSE equities (`.NS` extension).
- **Federal Reserve Bank of St. Louis (FRED):** US macroeconomic indicators (`CPIAUCSL`, `FEDFUNDS`, `UNRATE`).
- **World Bank Open Data API:** Indian macroeconomic indicators (`FP.CPI.TOTL.ZG`, `NY.GDP.MKTP.KD.ZG`, `SL.UEM.TOTL.ZS`).

---

## 5. Architecture

### 5.1 System Diagram

```text
               +-------------------------------------------------------+
               |                  Client Web Browser                   |
               |             (React / Vite on Port 5173)               |
               +---------------------------+---------------------------+
                                           |
                                  HTTP REST / JSON
                                  (CORS-enabled)
                                           |
                                           v
               +-------------------------------------------------------+
               |                    FastAPI Backend                    |
               |                (Uvicorn on Port 8000)                 |
               +-------------+---------------------------+-------------+
                             |                           |
                  Local Read / Write           Outbound HTTPS (REST)
                             |                           |
                             v                           v
               +---------------------------+   +-----------------------+
               |      SQLite Database      |   | External Data Sources |
               |        (firisk.db)        |   +-----------------------+
               |                           |   | 1. Yahoo Finance      |
               | Tables:                   |   |    (yfinance)         |
               | - market_prices           |   | 2. St. Louis Fed FRED |
               | - economic_indicators     |   |    (pandas-datareader)|
               |                           |   | 3. World Bank API     |
               | (Postgres-ready via ORM)  |   |    (REST JSON)        |
               +---------------------------+   +-----------------------+
```

> **Boundary Guarantee:** Yahoo Finance, FRED, and the World Bank Open Data API are the **only** external network dependencies. No external telemetry, third-party CDNs, or secondary services are invoked.

---

### 5.2 Backend Layer Breakdown

The backend codebase follows a strict separation of concerns:

```text
backend/app/
├── data/         -> Pure data acquisition & normalization; DB write-through
├── models/       -> SQLAlchemy database models & session management
├── analytics/    -> Pure, stateless quantitative finance & portfolio math
├── statistics/   -> Pure statistical hypothesis testing & resampling
├── forecasting/  -> Moving average baseline & walk-forward backtesting
├── api/          -> FastAPI router endpoints, validation, and error mapping
└── schemas/      -> Pydantic schemas defining request and response contracts
```

1. **`app/data/` (Data Acquisition & Ingestion):**
   - [`market_data.py`](file:///Users/chiragchoudhary/Downloads/fiRISK/backend/app/data/market_data.py): Fetches raw OHLCV prices from Yahoo Finance and normalizes column shapes into a standardized 8-column schema: `date`, `ticker`, `open`, `high`, `low`, `close`, `adj_close`, `volume`.
   - [`economic_data.py`](file:///Users/chiragchoudhary/Downloads/fiRISK/backend/app/data/economic_data.py): Ingests US economic data via FRED and Indian economic metrics via the World Bank API, standardizing dates and outputting a uniform 5-column schema: `date`, `country`, `indicator_code`, `indicator_name`, `value`.
   - [`db_writer.py`](file:///Users/chiragchoudhary/Downloads/fiRISK/backend/app/data/db_writer.py): Executes dialect-agnostic idempotent upserts (`ON CONFLICT DO UPDATE`) into SQLite or PostgreSQL.
   - *Design rule:* Data fetchers are pure acquisition routines without analytical calculations.

2. **`app/models/` (Persistence Layer):**
   - [`database.py`](file:///Users/chiragchoudhary/Downloads/fiRISK/backend/app/models/database.py): Engine creation and session factory (`SessionLocal`), parsing `DATABASE_URL`.
   - [`models.py`](file:///Users/chiragchoudhary/Downloads/fiRISK/backend/app/models/models.py): Defines two database tables:
     - `market_prices`: indexed with a unique constraint on `(ticker, date)`.
     - `economic_indicators`: indexed with a unique constraint on `(country, indicator_code, date)`.

3. **`app/analytics/` (Financial Mathematics & Portfolio Engine):**
   - Stateless, functional modules: [`returns.py`](file:///Users/chiragchoudhary/Downloads/fiRISK/backend/app/analytics/returns.py), [`volatility.py`](file:///Users/chiragchoudhary/Downloads/fiRISK/backend/app/analytics/volatility.py), [`beta.py`](file:///Users/chiragchoudhary/Downloads/fiRISK/backend/app/analytics/beta.py), [`sharpe.py`](file:///Users/chiragchoudhary/Downloads/fiRISK/backend/app/analytics/sharpe.py), [`drawdown.py`](file:///Users/chiragchoudhary/Downloads/fiRISK/backend/app/analytics/drawdown.py), [`var.py`](file:///Users/chiragchoudhary/Downloads/fiRISK/backend/app/analytics/var.py), [`moving_averages.py`](file:///Users/chiragchoudhary/Downloads/fiRISK/backend/app/analytics/moving_averages.py), and [`portfolio.py`](file:///Users/chiragchoudhary/Downloads/fiRISK/backend/app/analytics/portfolio.py).
   - *Design rule:* These routines accept pandas Series or DataFrames and return native numerical types or dictionaries. They execute zero database queries and zero network operations, ensuring immediate unit-testability.

4. **`app/statistics/` (Statistical Inference):**
   - [`preprocessing.py`](file:///Users/chiragchoudhary/Downloads/fiRISK/backend/app/statistics/preprocessing.py): Resamples daily asset prices into monthly period returns aligned to month-ends.
   - [`hypothesis.py`](file:///Users/chiragchoudhary/Downloads/fiRISK/backend/app/statistics/hypothesis.py): Inner-joins resampled macroeconomic time series with equity returns and computes Pearson correlation, $t$-statistics, and two-tailed $p$-values.

5. **`app/forecasting/` (Time-Series Forecasting):**
   - [`baseline.py`](file:///Users/chiragchoudhary/Downloads/fiRISK/backend/app/forecasting/baseline.py): Implements simple moving average price forecasting and the rolling walk-forward backtesting loop.
   - [`evaluation.py`](file:///Users/chiragchoudhary/Downloads/fiRISK/backend/app/forecasting/evaluation.py): Evaluates forecast error distributions, computing MAE, RMSE, MAPE, and Directional Accuracy. Completely decoupled from the forecasting model.

6. **`app/api/` (API Routers & Controllers):**
   - [`assets.py`](file:///Users/chiragchoudhary/Downloads/fiRISK/backend/app/api/assets.py), [`portfolio.py`](file:///Users/chiragchoudhary/Downloads/fiRISK/backend/app/api/portfolio.py), [`hypothesis.py`](file:///Users/chiragchoudhary/Downloads/fiRISK/backend/app/api/hypothesis.py), [`forecast.py`](file:///Users/chiragchoudhary/Downloads/fiRISK/backend/app/api/forecast.py), and [`utils.py`](file:///Users/chiragchoudhary/Downloads/fiRISK/backend/app/api/utils.py).
   - *Design rule:* This layer manages HTTP concerns: parameter parsing, validation, calling data modules, delegating calculations to analytics, write-through caching, and throwing standard HTTP status codes (`400`, `404`).

7. **`app/schemas/` (Data Contracts):**
   - [`schemas.py`](file:///Users/chiragchoudhary/Downloads/fiRISK/backend/app/schemas/schemas.py): Pydantic request and response models guaranteeing strict contract typing.

---

### 5.3 Frontend Layer Breakdown

```text
frontend/src/
├── components/
│   ├── ui/          -> Primitives (Card, StatCard, Badge, AnimatedNumber, Chart, StockPicker, DateRangeControl)
│   ├── layout/      -> AmbientBackground, ThemeProvider, ThemeToggle
│   └── portfolio/   -> PortfolioResultsPanel (shared between Dashboard & PortfolioBuilder)
├── hooks/           -> Custom React hooks (usePortfolioAnalysis)
├── lib/             -> api.js (centralized fetch wrapper), dateUtils.js, forecastConstants.js
├── data/            -> tickers.js (curated list of verified US and Indian stocks)
└── pages/           -> Dashboard, PortfolioBuilder, AssetAnalysis, Forecast, HypothesisTest, Placeholder
```

- **`components/ui/`:** Reusable UI elements adhering to a dark-mode-first aesthetic with CSS variables and responsive SVG charting (`Chart.jsx`, `PriceChart.jsx`, `ForecastChart.jsx`).
- **`components/layout/`:** Persistent chrome handling themes, SVG glows, and navigation.
- **`components/portfolio/`:** Contains [`PortfolioResultsPanel.jsx`](file:///Users/chiragchoudhary/Downloads/fiRISK/frontend/src/components/portfolio/PortfolioResultsPanel.jsx). This shared presentation component ensures the Dashboard and the Portfolio Builder render identical visualizations from the same response shape.
- **`hooks/`:** [`usePortfolioAnalysis.js`](file:///Users/chiragchoudhary/Downloads/fiRISK/frontend/src/hooks/usePortfolioAnalysis.js) encapsulates parallel fetching of portfolio-level analytics and per-asset close prices, protecting against network race conditions via request IDs.
- **`lib/`:** [`api.js`](file:///Users/chiragchoudhary/Downloads/fiRISK/frontend/src/lib/api.js) is the single HTTP gateway, with standard error parsing and endpoint resolution.
- **`pages/`:** Route views that assemble UI components and hooks without duplicate API logic.

---

### 5.4 Example Request Lifecycle

To illustrate the concrete flow of execution, consider a user configuring a portfolio with **50% Apple (`AAPL`)** and **50% Microsoft (`MSFT`)** over a 1-year horizon:

```text
[User clicks "Analyze portfolio"]
       |
       v
1. PortfolioBuilder.jsx triggers analyze(sanitizedHoldings, start, end)
       |
       v
2. usePortfolioAnalysis hook dispatches POST request via lib/api.js:
   Payload: { "holdings": [{"ticker": "AAPL", "weight": 50}, {"ticker": "MSFT", "weight": 50}], "start": "...", "end": "..." }
       |
       v
3. FastAPI Router (app/api/portfolio.py -> POST /api/portfolio/analyze) receives request:
   a. Normalizes weights: {"AAPL": 0.5, "MSFT": 0.5} via app/analytics/portfolio.py
   b. Calls get_market_data("AAPL") and get_market_data("MSFT") via app/data/market_data.py
   c. Persists fetched OHLCV bars to SQLite via app/data/db_writer.py (write-through caching)
   d. Resolves benchmarks: both map to ^GSPC via app/api/utils.py
   e. Calculates individual asset Betas against ^GSPC via app/analytics/beta.py
   f. Generates Currency-Agnostic Portfolio Value Index:
      - Normalizes each asset: P_t / P_0
      - Computes weighted growth: sum(w_i * (P_t,i / P_0,i)) * 100.0
   g. Computes portfolio risk metrics:
      - Annualized volatility (volatility.py)
      - Weighted portfolio beta (portfolio.py)
      - Annualized Sharpe ratio (sharpe.py)
      - Maximum drawdown and peak/trough dates (drawdown.py)
      - 95% historical Value-at-Risk (var.py)
       |
       v
4. Backend returns JSON payload conforming to PortfolioAnalyzeResponse schema (HTTP 200)
       |
       v
5. Frontend hook stores response in React state; PortfolioResultsPanel re-renders:
   - AnimatedNumber smoothly animates derived portfolio dollar value
   - Chart renders responsive SVG line curve with hover crosshair
   - StatCard strip displays formatted risk metrics (volatility, beta, Sharpe, MDD, VaR)
   - Holdings list displays per-asset latest close prices and daily changes
   * Zero client-side math performed on the metrics — client only handles display formatting.
```

---

### 5.5 Deployment Architecture (Current vs. Planned)

- **Current State (Local Development Only):**
  - **Database:** Local file-based SQLite database (`firisk.db`).
  - **Backend Server:** Runs locally via `uvicorn app.main:app --reload --port 8000`.
  - **Frontend Server:** Runs locally via Vite development server on port 5173.
  - **CI/CD & Containers:** No Docker containers, Kubernetes manifests, or CI/CD pipelines are currently configured.

- **Planned Production Architecture:**
  - **Database:** Swap to managed PostgreSQL by setting `DATABASE_URL=postgresql://user:pass@host:5432/firisk` (supported out-of-the-box by SQLAlchemy and the dialect-aware upsert logic in `db_writer.py`).
  - **Backend:** Containerized ASGI deployment (Docker / Gunicorn + Uvicorn workers) hosted on any cloud compute service (Render, Railway, AWS ECS).
  - **Frontend:** Static SPA build (`vite build` -> `dist/`) deployed to any static CDN host (Cloudflare Pages, Vercel, AWS S3 + CloudFront).
  - **Security:** Restrict CORS `allow_origins` to production domain URLs.

---

## 6. Getting Started

### Prerequisites
- **Python:** 3.10 or higher
- **Node.js:** 18 or higher
- **npm:** 9 or higher
- **Git**

---

### Backend Setup

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   # Windows (PowerShell): .venv\Scripts\Activate.ps1
   # Windows (CMD): .venv\Scripts\activate.bat
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Create the local environment file from example:
   ```bash
   cp .env.example .env
   ```

5. (Optional) Initialize SQLite database tables:
   ```bash
   python scripts/init_db.py
   ```

6. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The backend API will be live at `http://localhost:8000`. Swagger documentation is available at `http://localhost:8000/docs`.

---

### Frontend Setup

1. Open a separate terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment configuration:
   ```bash
   cp .env.example .env
   ```
   *Note: `.env` sets `VITE_API_BASE_URL=http://localhost:8000`.*

4. Launch the Vite development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to:
   ```text
   http://localhost:5173
   ```
   *(The backend server must be running concurrently on port 8000 for live data to load).*

---

## 7. API Reference

### Summary of Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check endpoint returning API operational status |
| `GET` | `/api/assets/{ticker}/prices` | Daily historical OHLCV price series for a single ticker |
| `GET` | `/api/assets/{ticker}/analytics` | Comprehensive risk metrics and SMA overlays with auto-benchmarking |
| `POST` | `/api/portfolio/analyze` | Multi-asset portfolio return, value index, and aggregate risk metrics |
| `POST` | `/api/hypothesis-test` | Pearson correlation hypothesis test between US macro indicator and asset returns |
| `GET` | `/api/forecast/{ticker}` | Walk-forward moving average price forecast backtest and error evaluation |

---

### 1. `GET /health`

Performs an operational health check on the API service.

- **Request:**
  ```http
  GET /health HTTP/1.1
  Host: localhost:8000
  ```

- **Response:** `200 OK`
  ```json
  {
    "status": "ok"
  }
  ```

---

### 2. `GET /api/assets/{ticker}/prices`

Retrieves historical OHLCV market bars for a specific equity ticker within a specified date range. Fetched records are automatically persisted to the local database via write-through caching.

- **Query Parameters:**
  - `start` (string, required): Start date in `YYYY-MM-DD` format.
  - `end` (string, required): End date in `YYYY-MM-DD` format.

- **Request:**
  ```http
  GET /api/assets/AAPL/prices?start=2024-01-01&end=2024-01-05 HTTP/1.1
  Host: localhost:8000
  ```

- **Response:** `200 OK`
  ```json
  {
    "ticker": "AAPL",
    "start": "2024-01-01",
    "end": "2024-01-05",
    "data": [
      {
        "date": "2024-01-02",
        "open": 187.15,
        "high": 188.44,
        "low": 183.89,
        "close": 185.64,
        "adj_close": 184.25,
        "volume": 82488700.0
      },
      {
        "date": "2024-01-03",
        "open": 184.22,
        "high": 185.88,
        "low": 183.43,
        "close": 184.25,
        "adj_close": 182.87,
        "volume": 58414500.0
      },
      "..."
    ]
  }
  ```

- **Error Responses:**
  - `404 Not Found`: Ticker not found or no historical data returned in range.
    ```json
    {
      "detail": "No data found for ticker 'INVALIDTICKER' in the given range."
    }
    ```

---

### 3. `GET /api/assets/{ticker}/analytics`

Calculates comprehensive quantitative risk analytics and simple moving averages (`SMA 7`, `SMA 20`, `SMA 50`, `SMA 200`) for a specified equity. Automatically selects the benchmark market index:
- Tickers ending in `.NS` -> `^NSEI` (NIFTY 50)
- All other tickers -> `^GSPC` (S&P 500)

- **Query Parameters:**
  - `start` (string, required): Start date in `YYYY-MM-DD` format.
  - `end` (string, required): End date in `YYYY-MM-DD` format.

- **Request:**
  ```http
  GET /api/assets/AAPL/analytics?start=2023-01-01&end=2024-01-01 HTTP/1.1
  Host: localhost:8000
  ```

- **Response:** `200 OK`
  ```json
  {
    "ticker": "AAPL",
    "benchmark_used": "^GSPC",
    "period": {
      "start": "2023-01-01",
      "end": "2024-01-01"
    },
    "metrics": {
      "volatility": 0.2014,
      "beta": 1.1245,
      "sharpe_ratio": 2.1450,
      "max_drawdown": {
        "value": -0.1542,
        "peak_date": "2023-07-31",
        "trough_date": "2023-10-27"
      },
      "historical_var_95": 0.0182
    },
    "moving_averages": [
      {
        "date": "2023-01-03",
        "sma_7": null,
        "sma_20": null,
        "sma_50": null,
        "sma_200": null
      },
      {
        "date": "2023-01-12",
        "sma_7": 130.45,
        "sma_20": null,
        "sma_50": null,
        "sma_200": null
      },
      {
        "date": "2023-10-20",
        "sma_7": 175.20,
        "sma_20": 173.80,
        "sma_50": 178.10,
        "sma_200": 168.45
      },
      "..."
    ]
  }
  ```

---

### 4. `POST /api/portfolio/analyze`

Computes multi-asset portfolio returns, an indexed equity growth trajectory (base 100.0), and aggregate portfolio risk metrics. Asset weights are automatically normalized proportionally ($w_i / \sum w$). Mixed US and Indian portfolios are supported via currency-agnostic growth index normalization.

- **Request Body:**
  ```json
  {
    "holdings": [
      { "ticker": "AAPL", "weight": 50 },
      { "ticker": "MSFT", "weight": 50 }
    ],
    "start": "2023-01-01",
    "end": "2024-01-01"
  }
  ```

- **Request:**
  ```http
  POST /api/portfolio/analyze HTTP/1.1
  Host: localhost:8000
  Content-Type: application/json
  ```

- **Response:** `200 OK`
  ```json
  {
    "holdings": [
      { "ticker": "AAPL", "weight": 0.5 },
      { "ticker": "MSFT", "weight": 0.5 }
    ],
    "period": {
      "start": "2023-01-01",
      "end": "2024-01-01"
    },
    "portfolio_value_index": [
      { "date": "2023-01-03", "value": 100.0 },
      { "date": "2023-01-04", "value": 100.45 },
      "...",
      { "date": "2023-12-28", "value": 154.20 },
      { "date": "2023-12-29", "value": 153.85 }
    ],
    "metrics": {
      "volatility": 0.1985,
      "beta": 1.1520,
      "sharpe_ratio": 2.2150,
      "max_drawdown": {
        "value": -0.1420,
        "peak_date": "2023-07-18",
        "trough_date": "2023-10-26"
      },
      "historical_var_95": 0.0175
    }
  }
  ```

- **Error Responses:**
  - `400 Bad Request`: Empty holdings list, negative weight, or zero overlapping trading days.
  - `404 Not Found`: Explicitly names any invalid holding ticker in the payload.
    ```json
    {
      "detail": "No data found for ticker 'INVALIDTICKER' in the given range."
    }
    ```

---

### 5. `POST /api/hypothesis-test`

Runs a two-tailed Pearson correlation hypothesis test between a monthly macroeconomic shock series and an equity's resampled monthly returns.

> **Indicator Whitelist Rule:** Only `CPIAUCSL`, `FEDFUNDS`, and `UNRATE` are accepted. These are the only three indicators verified at a monthly frequency. Unaligned series (such as quarterly `GDP`) are rejected with `HTTP 400` to prevent silent temporal distortion.

- **Request Body:**
  ```json
  {
    "indicator_code": "CPIAUCSL",
    "ticker": "AAPL",
    "start": "2019-01-01",
    "end": "2024-01-01",
    "alpha": 0.05
  }
  ```

- **Request:**
  ```http
  POST /api/hypothesis-test HTTP/1.1
  Host: localhost:8000
  Content-Type: application/json
  ```

- **Response:** `200 OK`
  ```json
  {
    "indicator_code": "CPIAUCSL",
    "indicator_name": "Inflation (CPI)",
    "ticker": "AAPL",
    "period": {
      "start": "2019-01-01",
      "end": "2024-01-01"
    },
    "hypotheses": {
      "h0": "CPIAUCSL has no significant relationship with AAPL's monthly returns.",
      "h1": "CPIAUCSL has a significant relationship with AAPL's monthly returns."
    },
    "result": {
      "r": -0.1425,
      "p_value": 0.2854,
      "alpha": 0.05,
      "n_obs": 59,
      "reject_null": false,
      "interpretation": "Fail to reject H0: no statistically significant relationship was found (r=-0.1425, p=0.2854 >= alpha=0.05)."
    }
  }
  ```

- **Error Responses:**
  - `400 Bad Request`: Triggered when an unapproved indicator is passed.
    ```json
    {
      "detail": "Unsupported indicator_code 'GDP'. Supported (monthly-frequency, verified): CPIAUCSL, FEDFUNDS, UNRATE."
    }
    ```

---

### 6. `GET /api/forecast/{ticker}`

Executes an out-of-sample walk-forward moving average forecast backtest with strict zero lookahead bias. The endpoint automatically queries a fixed trailing 2-year window (730 days) of daily market prices.

- **Query Parameters:**
  - `window` (int, optional, default: 20): Rolling lookback window size in days.
  - `test_size` (int, optional, default: 60): Number of out-of-sample test trading days.

- **Request:**
  ```http
  GET /api/forecast/AAPL?window=20&test_size=60 HTTP/1.1
  Host: localhost:8000
  ```

- **Response:** `200 OK`
  ```json
  {
    "ticker": "AAPL",
    "window": 20,
    "test_size": 60,
    "backtest": [
      {
        "date": "2024-07-10",
        "prev_actual": 228.68,
        "actual": 232.98,
        "predicted": 215.42
      },
      {
        "date": "2024-07-11",
        "prev_actual": 232.98,
        "actual": 227.57,
        "predicted": 216.71
      },
      "...",
      {
        "date": "2024-10-04",
        "prev_actual": 225.67,
        "actual": 226.80,
        "predicted": 224.95
      }
    ],
    "evaluation": {
      "mae": 6.84,
      "rmse": 8.12,
      "mape": 3.05,
      "directional_accuracy": 51.67,
      "n_obs": 60
    }
  }
  ```

- **Notes on Baseline Evaluation:**
  - If `window + test_size + 1` exceeds available trading days, the endpoint returns `HTTP 400`.
  - Directional accuracy near 50% is standard and expected for moving average baselines on liquid equities due to market efficiency and near-martingale price dynamics.

---

## 8. Project Structure

```text
fiRISK/
├── README.md                           # Master repository documentation
├── LICENSE                             # MIT License file
├── backend/
│   ├── firisk.db                       # SQLite database file
│   ├── requirements.txt                # Python package dependencies
│   ├── .env.example                    # Backend environment configuration template
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                     # FastAPI application instance & route mounting
│   │   ├── api/                        # Route controllers & endpoint definitions
│   │   │   ├── __init__.py
│   │   │   ├── assets.py               # /api/assets routes
│   │   │   ├── portfolio.py            # /api/portfolio routes
│   │   │   ├── hypothesis.py           # /api/hypothesis-test route
│   │   │   ├── forecast.py             # /api/forecast routes
│   │   │   └── utils.py                # Benchmark resolution helpers
│   │   ├── schemas/                    # Pydantic contract definitions
│   │   │   ├── __init__.py
│   │   │   └── schemas.py              # Request/Response schemas for all endpoints
│   │   ├── data/                       # Ingestion & external API integrations
│   │   │   ├── __init__.py
│   │   │   ├── market_data.py          # Yahoo Finance market data fetcher
│   │   │   ├── economic_data.py        # FRED & World Bank macro data fetcher
│   │   │   └── db_writer.py            # Idempotent database upsert logic
│   │   ├── models/                     # SQLAlchemy models & database engine
│   │   │   ├── __init__.py
│   │   │   ├── database.py             # Database engine, SessionLocal, Base
│   │   │   └── models.py               # MarketPrice & EconomicIndicator ORM models
│   │   ├── analytics/                  # Pure quantitative finance calculations
│   │   │   ├── __init__.py
│   │   │   ├── returns.py              # Simple & log return routines
│   │   │   ├── volatility.py           # Annualized standard deviation
│   │   │   ├── beta.py                 # Asset covariance/variance beta
│   │   │   ├── sharpe.py               # Sharpe ratio calculation
│   │   │   ├── drawdown.py             # Maximum drawdown & peak/trough detection
│   │   │   ├── var.py                  # 95% Historical Value-at-Risk
│   │   │   ├── moving_averages.py      # SMA 7/20/50/200 calculations
│   │   │   └── portfolio.py            # Normalized weights, index growth, & beta
│   │   ├── statistics/                 # Pure statistical inference
│   │   │   ├── __init__.py
│   │   │   ├── preprocessing.py        # Period resampling (monthly return engine)
│   │   │   └── hypothesis.py           # Pearson correlation hypothesis testing
│   │   └── forecasting/                # Time-series baseline & validation
│   │       ├── __init__.py
│   │       ├── baseline.py             # Moving average forecast & walk-forward backtest
│   │       └── evaluation.py           # Generic MAE, RMSE, MAPE, Directional Accuracy
│   ├── scripts/                        # In-process verification & migration scripts
│   │   ├── init_db.py                  # Schema creation script
│   │   ├── verify_phase2.py            # Data acquisition verification
│   │   ├── verify_phase3.py            # Database schema verification
│   │   ├── verify_phase4.py            # Risk analytics verification
│   │   ├── verify_phase5.py            # Portfolio engine verification
│   │   ├── verify_phase6.py            # Hypothesis testing verification
│   │   ├── verify_phase7.py            # Forecasting baseline verification
│   │   ├── verify_phase8.py            # Asset & portfolio API verification
│   │   └── verify_phase9.py            # Hypothesis & forecast API verification
│   └── tests/
│       └── __init__.py
└── frontend/
    ├── package.json                    # Node dependencies and build scripts
    ├── vite.config.js                  # Vite configuration with Tailwind CSS v4 plugin
    ├── index.html                      # HTML document shell
    ├── .env.example                    # Frontend environment configuration template
    └── src/
        ├── App.jsx                     # Root router and application layout shell
        ├── App.css                     # Component style overrides
        ├── index.css                   # Tailwind v4 imports and theme variables
        ├── main.jsx                    # React application entry point
        ├── components/
        │   ├── ui/                     # Design system primitives
        │   │   ├── AnimatedNumber.jsx  # Number counter animation
        │   │   ├── Badge.jsx           # Metric and status indicators
        │   │   ├── Card.jsx            # Unified container surface
        │   │   ├── Chart.jsx           # Base responsive SVG line chart
        │   │   ├── DateRangeControl.jsx# Segmented time horizon selector
        │   │   ├── ForecastChart.jsx   # Actual vs predicted forecast chart
        │   │   ├── LineChart.jsx       # Lightweight SVG line chart
        │   │   ├── PresetControl.jsx   # Segmented control for forecast presets
        │   │   ├── PriceChart.jsx      # OHLCV price chart with toggleable SMAs
        │   │   ├── StatCard.jsx        # Standardized metric presentation tile
        │   │   └── StockPicker.jsx     # Autocomplete asset search component
        │   ├── layout/                 # Application shell & chrome
        │   │   ├── AmbientBackground.jsx# Ambient background gradients
        │   │   ├── ThemeProvider.jsx   # Theme state provider
        │   │   └── ThemeToggle.jsx     # Dark/light mode switcher
        │   └── portfolio/              # Shared portfolio domain components
        │       └── PortfolioResultsPanel.jsx # Shared portfolio chart and stat strip
        ├── hooks/
        │   └── usePortfolioAnalysis.js # Shared portfolio fetching & pricing hook
        ├── lib/
        │   ├── api.js                  # Centralized fetch client for backend endpoints
        │   ├── dateUtils.js            # Calendar math & preset date range calculation
        │   └── forecastConstants.js    # Presets for forecast lookbacks and horizons
        ├── data/
        │   └── tickers.js              # Curated registry of verified US & Indian stocks
        └── pages/
            ├── Dashboard.jsx           # Default portfolio overview page
            ├── PortfolioBuilder.jsx    # Custom allocation builder & recompute engine
            ├── AssetAnalysis.jsx       # Single equity risk analysis & SMA overlays
            ├── Forecast.jsx            # Walk-forward forecast page
            ├── HypothesisTest.jsx      # Macroeconomic hypothesis testing page
            └── Placeholder.jsx         # Fallback 404 page
```

---

## 9. Key Design Decisions

- **Currency-Agnostic Portfolios:**  
  Combining US stocks (denominated in USD) and Indian stocks (denominated in INR) in a single portfolio without live FX cross-rate conversion is achieved by normalizing each asset's closing price series to its own starting value ($P_t / P_0$) *before* applying portfolio weights. This models relative capital growth and compound returns accurately without introducing foreign exchange risk or synthetic conversion artifacts.
- **Automatic Benchmark Resolution:**  
  Beta calculations require an appropriate broad market index. The backend inspects ticker suffixes: any ticker ending in `.NS` is automatically benchmarked against India's **NIFTY 50 (`^NSEI`)**, while all other tickers default to the **S&P 500 (`^GSPC`)**.
- **Zero-Leakage Forecasting Framework:**  
  To prevent look-ahead bias, the walk-forward backtesting framework enforces strict temporal separation: when forecasting day $t$, the historical lookback slice contains observations strictly up to day $t-1$. The model is never evaluated on in-sample data.
- **Macroeconomic Frequency Alignment & Indicator Whitelist:**  
  Daily market equity prices and macroeconomic indicators operate on mismatched calendars. To prevent spurious correlation, equity prices are resampled to month-end simple returns before alignment with monthly indicators. Furthermore, the API enforces a strict whitelist (`CPIAUCSL`, `FEDFUNDS`, `UNRATE`). Non-monthly indicators (such as quarterly `GDP`) are rejected with `HTTP 400` to prevent unaligned calculations.
- **Write-Through Persistence Strategy:**  
  When market or economic data is fetched from external APIs, it is immediately written through to SQLite using idempotent upserts (`ON CONFLICT DO UPDATE`). However, the HTTP response is served directly from the fresh data fetch, ensuring that transient database locks never block read availability.

---

## 10. Known Limitations & Roadmap

The following capabilities are **not currently implemented** and represent planned enhancements:

### Planned Enhancements
- **User Authentication & Saved Portfolios:**  
  *Status: Planned.*  
  Currently, portfolios exist in memory within the frontend session. Multi-user authentication (JWT / OAuth2) and persistent user-saved portfolios in PostgreSQL are planned.
- **PDF & Exportable Analytical Reports:**  
  *Status: Planned.*  
  Exporting portfolio performance sheets, fact sheets, and tear-sheets to PDF or Excel format is planned.
- **Advanced Forecasting Models:**  
  *Status: Planned.*  
  The current platform strictly implements a moving-average baseline. Future iterations plan to integrate statistical and machine learning models (ARIMA, SARIMAX, GARCH for volatility clustering, and gradient-boosted trees / LSTM models).
- **Automated Test Suite & CI/CD Pipeline:**  
  *Status: Planned.*  
  Currently, verification is handled via in-process scripts (`backend/scripts/verify_phase*.py`). A dedicated `pytest` / GitHub Actions CI pipeline is planned.
- **Production Containerization & Cloud Deployment:**  
  *Status: Planned.*  
  Currently runs locally with SQLite and development servers. Production Docker configurations and managed PostgreSQL deployment are planned.

---

## 11. License

This project is licensed under the terms of the **MIT License**.  
See the [LICENSE](file:///Users/chiragchoudhary/Downloads/fiRISK/LICENSE) file in the repository root for the full license text.

Copyright (c) 2026 chirag100x.

---

## 12. Acknowledgments

fIRISK relies upon the following open data sources and scientific libraries:
- **[yfinance](https://github.com/ranaroussi/yfinance):** Market data extraction for US and Indian equity markets.
- **[Federal Reserve Bank of St. Louis (FRED)](https://fred.stlouisfed.org/):** Macroeconomic time-series database.
- **[World Bank Open Data](https://data.worldbank.org/):** Global economic indicators and development metrics.
- **[FastAPI](https://fastapi.tiangolo.com/):** High-performance Python backend framework.
- **[SciPy](https://scipy.org/):** Scientific computing library powering statistical inference.
- **[Tailwind CSS](https://tailwindcss.com/):** Modern utility styling engine.
