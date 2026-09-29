"""Verification script for Phase 7: Forecasting Baseline.

Tests moving average baseline model and zero-leakage walk-forward backtest
using 2 years of AAPL daily price data.
Evaluates accuracy metrics (MAE, RMSE, MAPE, Directional Accuracy).
"""

from datetime import datetime, timedelta
from pathlib import Path
import sys
import pandas as pd

# Ensure backend root is in python path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.data.market_data import get_market_data
from app.forecasting.baseline import walk_forward_backtest
from app.forecasting.evaluation import evaluate_forecast

pd.set_option("display.max_columns", None)
pd.set_option("display.width", 1000)


def verify():
    print("=" * 80)
    print(" >>> STEP 1: FETCH 2 YEARS OF REAL MARKET DATA (AAPL) <<<")
    print("=" * 80)
    today = datetime.today()
    start_2y = (today - timedelta(days=730)).strftime("%Y-%m-%d")
    end_today = today.strftime("%Y-%m-%d")
    print(f"Date range: {start_2y} to {end_today}")

    print("Fetching AAPL...")
    aapl_df = get_market_data("AAPL", start=start_2y, end=end_today)
    print(f"  AAPL total rows fetched: {len(aapl_df)}")

    if aapl_df.empty:
        raise RuntimeError("Failed to fetch market data for AAPL.")

    aapl_prices = pd.Series(
        aapl_df["close"].values, index=aapl_df["date"], name="AAPL_Close"
    )

    print("\n" + "=" * 80)
    print(" >>> STEP 2: RUN WALK-FORWARD BACKTEST (window=20, test_size=60) <<<")
    print("=" * 80)
    window = 20
    test_size = 60

    backtest_df = walk_forward_backtest(
        aapl_prices, window=window, test_size=test_size
    )
    print(f"Backtest completed: {len(backtest_df)} out-of-sample days evaluated.")
    print("Columns:", backtest_df.columns.tolist())
    print("\nFirst 3 backtest predictions (.head(3)):")
    print(backtest_df.head(3))
    print("\nLast 3 backtest predictions (.tail(3)):")
    print(backtest_df.tail(3))

    print("\n" + "=" * 80)
    print(" >>> STEP 3: EXPLICIT ZERO-LEAKAGE VERIFICATION <<<")
    print("=" * 80)
    print("Verifying that each forecast uses ONLY data strictly prior to the test date...")

    all_dates = list(aapl_prices.index)
    sample_indices = [0, len(backtest_df) // 2, len(backtest_df) - 1]

    for idx in sample_indices:
        row = backtest_df.iloc[idx]
        forecast_date = row["date"]
        pos_in_prices = all_dates.index(forecast_date)
        last_history_date = all_dates[pos_in_prices - 1]

        # Strict check: last_history_date must be strictly before forecast_date
        assert last_history_date < forecast_date, (
            f"LEAKAGE DETECTED! Last history date {last_history_date} "
            f"is not before forecast date {forecast_date}!"
        )

        # Confirm the prediction equals the mean of the 20 days prior to pos_in_prices
        expected_pred = float(
            aapl_prices.iloc[pos_in_prices - window : pos_in_prices].mean()
        )
        assert abs(row["predicted"] - expected_pred) < 1e-6, (
            f"Calculation mismatch! Row: {row['predicted']}, Expected: {expected_pred}"
        )

        print(
            f"  Sample #{idx:2d} | Forecasted Date: {forecast_date} | "
            f"Last History Date: {last_history_date} | "
            f"Leakage Check: PASS (Last History < Forecast Date)"
        )

    print("\n  CONFIRMED: All test points strictly use prior data. Zero future leakage.")

    print("\n" + "=" * 80)
    print(" >>> STEP 4: EVALUATE FORECAST ACCURACY METRICS <<<")
    print("=" * 80)
    metrics = evaluate_forecast(backtest_df)

    print("Forecast Accuracy Evaluation:")
    print(f"  MAE  (Mean Absolute Error):         ${metrics['mae']:.2f}")
    print(f"  RMSE (Root Mean Squared Error):     ${metrics['rmse']:.2f}")
    print(f"  MAPE (Mean Absolute % Error):       {metrics['mape']:.2f}%")
    print(f"  Directional Accuracy:               {metrics['directional_accuracy']:.2f}%")
    print(f"  Evaluated Observations (n_obs):     {metrics['n_obs']}")

    print("\n[Sanity Note on Directional Accuracy]")
    print(
        "  Directional accuracy for a naive moving-average baseline is often near 50%\n"
        "  (comparable to a coin flip). This is EXPECTED and honest behavior for a\n"
        "  lagging moving average. It establishes the benchmark for V2/V3 models to beat."
    )

    print("\n" + "=" * 80)
    print(" >>> STEP 5: VERIFICATION ASSERTIONS <<<")
    print("=" * 80)
    assert len(backtest_df) == test_size, f"Backtest rows count mismatch: {len(backtest_df)}"
    assert metrics["n_obs"] == test_size, f"Evaluation n_obs mismatch: {metrics['n_obs']}"
    assert metrics["mae"] > 0, "MAE must be positive"
    assert metrics["rmse"] > 0, "RMSE must be positive"
    assert metrics["mape"] > 0, "MAPE must be positive"
    assert 0.0 <= metrics["directional_accuracy"] <= 100.0, "Directional accuracy must be [0, 100]"
    # Plausible dollar magnitude check for AAPL (~$200-$400 stock)
    assert 0.5 < metrics["mae"] < 50.0, f"Plausible MAE range check failed: {metrics['mae']}"

    print("  Assertion 1: Backtest output has exactly 60 test days -> PASS")
    print("  Assertion 2: Evaluation n_obs matches test size -> PASS")
    print("  Assertion 3: MAE, RMSE, MAPE positive and plausible -> PASS")
    print("  Assertion 4: Directional accuracy within [0, 100]% range -> PASS")

    print("\n" + "=" * 80)
    print(" >>> ALL PHASE 7 FORECASTING BASELINE VERIFICATIONS PASSED <<<")
    print("=" * 80)


if __name__ == "__main__":
    verify()
