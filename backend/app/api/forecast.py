from datetime import datetime, timedelta
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, Query
import pandas as pd

from app.data.market_data import get_market_data
from app.forecasting.baseline import walk_forward_backtest
from app.forecasting.evaluation import evaluate_forecast
from app.schemas.schemas import BacktestPoint, ForecastEvaluation, ForecastResponse

router = APIRouter(prefix="/api/forecast", tags=["Forecasting"])


@router.get("/{ticker}", response_model=ForecastResponse)
def get_forecast(
    ticker: str,
    window: int = Query(default=20, ge=1, description="Moving average lookback window"),
    test_size: int = Query(default=60, ge=1, description="Out-of-sample backtest days"),
):
    """
    Generate out-of-sample moving average forecasts and evaluate accuracy metrics.
    Uses the last 2 years of daily market price data.
    """
    # Fixed 2-year lookback period for MVP baseline
    today = datetime.today()
    start_2y = (today - timedelta(days=730)).strftime("%Y-%m-%d")
    end_today = today.strftime("%Y-%m-%d")

    df = get_market_data(ticker, start=start_2y, end=end_today)
    if df is None or df.empty:
        raise HTTPException(
            status_code=404,
            detail=f"No data found for ticker '{ticker}' in the given range.",
        )

    min_required = window + test_size + 1
    if len(df) < min_required:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Insufficient price history ({len(df)} days) for window={window} + "
                f"test_size={test_size} (requires at least {min_required} days)."
            ),
        )

    prices = pd.Series(df["close"].values, index=df["date"], name=ticker)

    try:
        backtest_df = walk_forward_backtest(prices, window=window, test_size=test_size)
        eval_dict = evaluate_forecast(backtest_df)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    backtest_points = [
        BacktestPoint(
            date=str(row["date"]),
            prev_actual=float(row["prev_actual"]),
            actual=float(row["actual"]),
            predicted=float(row["predicted"]),
        )
        for _, row in backtest_df.iterrows()
    ]

    return ForecastResponse(
        ticker=ticker,
        window=window,
        test_size=test_size,
        backtest=backtest_points,
        evaluation=ForecastEvaluation(
            mae=eval_dict["mae"],
            rmse=eval_dict["rmse"],
            mape=eval_dict["mape"],
            directional_accuracy=eval_dict["directional_accuracy"],
            n_obs=eval_dict["n_obs"],
        ),
    )
