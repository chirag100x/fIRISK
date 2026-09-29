# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException
import pandas as pd

from app.analytics.beta import calculate_beta
from app.analytics.drawdown import calculate_max_drawdown
from app.analytics.portfolio import (
    calculate_portfolio_beta,
    calculate_portfolio_returns,
    calculate_portfolio_value_index,
    normalize_weights,
)
from app.analytics.returns import calculate_returns
from app.analytics.sharpe import calculate_sharpe_ratio
from app.analytics.var import calculate_historical_var
from app.analytics.volatility import calculate_volatility
from app.api.utils import get_benchmark_ticker
from app.data.db_writer import save_market_data
from app.data.market_data import get_market_data
from app.schemas.schemas import (
    DrawdownMetric,
    Holding,
    Metrics,
    Period,
    PortfolioAnalyzeRequest,
    PortfolioAnalyzeResponse,
    PortfolioIndexPoint,
)

router = APIRouter(prefix="/api/portfolio", tags=["Portfolio"])


@router.post("/analyze", response_model=PortfolioAnalyzeResponse)
def analyze_portfolio(request: PortfolioAnalyzeRequest):
    """
    Perform multi-asset portfolio risk and growth analysis.
    Supports mixed currencies (US & Indian equities) with automatic normalization.
    """
    if not request.holdings:
        raise HTTPException(status_code=400, detail="Holdings list cannot be empty.")

    # 1. Normalize weights
    raw_weights = {h.ticker.strip(): float(h.weight) for h in request.holdings}
    try:
        norm_weights = normalize_weights(raw_weights)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # 2. Fetch price data for each holding (fail fast if ANY ticker has no data)
    holding_price_series = {}
    holding_return_series = {}
    benchmark_cache = {}
    asset_betas = {}

    for ticker in norm_weights:
        df = get_market_data(ticker, start=request.start, end=request.end)
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

        p_series = pd.Series(df["close"].values, index=df["date"], name=ticker)
        holding_price_series[ticker] = p_series
        r_series = calculate_returns(p_series)
        holding_return_series[ticker] = r_series

        # 3. Calculate individual beta against auto-selected benchmark
        bench_ticker = get_benchmark_ticker(ticker)
        if bench_ticker not in benchmark_cache:
            bench_df = get_market_data(bench_ticker, start=request.start, end=request.end)
            if bench_df is not None and not bench_df.empty:
                b_prices = pd.Series(bench_df["close"].values, index=bench_df["date"], name=bench_ticker)
                b_returns = calculate_returns(b_prices)
                benchmark_cache[bench_ticker] = b_returns
            else:
                benchmark_cache[bench_ticker] = None

        bench_returns = benchmark_cache.get(bench_ticker)
        if bench_returns is not None and not bench_returns.empty:
            asset_betas[ticker] = calculate_beta(r_series, bench_returns)
        else:
            asset_betas[ticker] = 1.0

    # 4. Build combined aligned DataFrames
    prices_df = pd.DataFrame(holding_price_series)
    returns_df = pd.DataFrame(holding_return_series)

    # 5. Compute portfolio returns, value index, and beta
    portfolio_ret = calculate_portfolio_returns(returns_df, norm_weights)
    portfolio_idx = calculate_portfolio_value_index(prices_df, norm_weights, base=100.0)

    if portfolio_ret.empty or portfolio_idx.empty:
        raise HTTPException(
            status_code=400,
            detail="Insufficient overlapping trading days between portfolio assets.",
        )

    portfolio_beta = calculate_portfolio_beta(asset_betas, norm_weights)
    volatility_val = calculate_volatility(portfolio_ret, annualize=True)
    sharpe_val = calculate_sharpe_ratio(portfolio_ret, risk_free_rate=0.0, annualize=True)
    dd_dict = calculate_max_drawdown(portfolio_idx)
    var_95_val = calculate_historical_var(portfolio_ret, confidence_level=0.95)

    # 6. Format response with normalized holdings
    normalized_holdings = [
        Holding(ticker=t, weight=w) for t, w in norm_weights.items()
    ]

    index_points = [
        PortfolioIndexPoint(date=str(d), value=float(v))
        for d, v in portfolio_idx.items()
    ]

    return PortfolioAnalyzeResponse(
        holdings=normalized_holdings,
        period=Period(start=request.start, end=request.end),
        portfolio_value_index=index_points,
        metrics=Metrics(
            volatility=volatility_val,
            beta=portfolio_beta,
            sharpe_ratio=sharpe_val,
            max_drawdown=DrawdownMetric(
                value=dd_dict["max_drawdown"],
                peak_date=dd_dict["peak_date"],
                trough_date=dd_dict["trough_date"],
            ),
            historical_var_95=var_95_val,
        ),
    )
