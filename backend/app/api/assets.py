import math
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, Query
import pandas as pd

from app.analytics.beta import calculate_beta
from app.analytics.drawdown import calculate_max_drawdown
from app.analytics.moving_averages import calculate_moving_averages
from app.analytics.returns import calculate_returns
from app.analytics.sharpe import calculate_sharpe_ratio
from app.analytics.var import calculate_historical_var
from app.analytics.volatility import calculate_volatility
from app.api.utils import get_benchmark_ticker
from app.data.db_writer import save_market_data
from app.data.market_data import get_market_data
from app.schemas.schemas import (
    AnalyticsResponse,
    DrawdownMetric,
    Metrics,
    MovingAveragePoint,
    Period,
    PricePoint,
    PricesResponse,
)

router = APIRouter(prefix="/api/assets", tags=["Assets"])


@router.get("/{ticker}/prices", response_model=PricesResponse)
def get_asset_prices(
    ticker: str,
    start: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end: str = Query(..., description="End date in YYYY-MM-DD format"),
):
    """
    Fetch OHLCV market prices for a given ticker and date range.
    Persists data to the database on successful fetch (write-through).
    """
    df = get_market_data(ticker, start=start, end=end)
    if df is None or df.empty:
        raise HTTPException(
            status_code=404,
            detail=f"No data found for ticker '{ticker}' in the given range.",
        )

    # Write-through persistence to database
    try:
        save_market_data(df)
    except Exception:
        # Non-blocking write-through failure should not prevent serving live response
        pass

    data_points = [
        PricePoint(
            date=str(row["date"]),
            open=float(row["open"]),
            high=float(row["high"]),
            low=float(row["low"]),
            close=float(row["close"]),
            adj_close=float(row["adj_close"]),
            volume=float(row["volume"]),
        )
        for _, row in df.iterrows()
    ]

    return PricesResponse(ticker=ticker, start=start, end=end, data=data_points)


@router.get("/{ticker}/analytics", response_model=AnalyticsResponse)
def get_asset_analytics(
    ticker: str,
    start: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end: str = Query(..., description="End date in YYYY-MM-DD format"),
):
    """
    Compute comprehensive risk analytics and moving averages for an asset.
    Auto-selects market benchmark (^NSEI for .NS, ^GSPC otherwise).
    """
    # 1. Fetch asset market data
    df = get_market_data(ticker, start=start, end=end)
    if df is None or df.empty:
        raise HTTPException(
            status_code=404,
            detail=f"No data found for ticker '{ticker}' in the given range.",
        )

    # Write-through persistence
    try:
        save_market_data(df)
    except Exception:
        pass

    # 2. Auto-select and fetch benchmark
    benchmark_ticker = get_benchmark_ticker(ticker)
    bench_df = get_market_data(benchmark_ticker, start=start, end=end)

    # 3. Prepare price Series
    asset_prices = pd.Series(df["close"].values, index=df["date"], name=ticker)
    asset_returns = calculate_returns(asset_prices)

    if bench_df is not None and not bench_df.empty:
        bench_prices = pd.Series(
            bench_df["close"].values, index=bench_df["date"], name=benchmark_ticker
        )
        bench_returns = calculate_returns(bench_prices)
        beta_val = calculate_beta(asset_returns, bench_returns)
    else:
        beta_val = 1.0

    # 4. Compute risk metrics using Phase 4 functions
    volatility_val = calculate_volatility(asset_returns, annualize=True)
    sharpe_val = calculate_sharpe_ratio(asset_returns, risk_free_rate=0.0, annualize=True)
    dd_dict = calculate_max_drawdown(asset_prices)
    var_95_val = calculate_historical_var(asset_returns, confidence_level=0.95)

    # 5. Compute moving averages & properly convert NaNs to None (JSON null)
    sma_df = calculate_moving_averages(asset_prices, windows=[7, 20, 50, 200])
    ma_points = []
    for date_idx, row in sma_df.iterrows():
        ma_points.append(
            MovingAveragePoint(
                date=str(date_idx),
                sma_7=None if pd.isna(row.get("SMA_7")) or math.isnan(row.get("SMA_7")) else float(row["SMA_7"]),
                sma_20=None if pd.isna(row.get("SMA_20")) or math.isnan(row.get("SMA_20")) else float(row["SMA_20"]),
                sma_50=None if pd.isna(row.get("SMA_50")) or math.isnan(row.get("SMA_50")) else float(row["SMA_50"]),
                sma_200=None if pd.isna(row.get("SMA_200")) or math.isnan(row.get("SMA_200")) else float(row["SMA_200"]),
            )
        )

    return AnalyticsResponse(
        ticker=ticker,
        benchmark_used=benchmark_ticker,
        period=Period(start=start, end=end),
        metrics=Metrics(
            volatility=volatility_val,
            beta=beta_val,
            sharpe_ratio=sharpe_val,
            max_drawdown=DrawdownMetric(
                value=dd_dict["max_drawdown"],
                peak_date=dd_dict["peak_date"],
                trough_date=dd_dict["trough_date"],
            ),
            historical_var_95=var_95_val,
        ),
        moving_averages=ma_points,
    )
