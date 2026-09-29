"""Verification script for Phase 6: Hypothesis Testing.

Tests correlation hypothesis test between US Inflation Rate (MoM % change of CPI)
and AAPL monthly returns over a 5-year period.
Demonstrates the ValueError path when fewer than 3 overlapping points exist.
"""

from datetime import datetime, timedelta
from pathlib import Path
import sys
import pandas as pd

# Ensure backend root is in python path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.data.economic_data import get_us_indicator
from app.data.market_data import get_market_data
from app.statistics.hypothesis import run_correlation_hypothesis_test
from app.statistics.preprocessing import resample_to_period_returns

pd.set_option("display.max_columns", None)
pd.set_option("display.width", 1000)


def verify():
    print("=" * 80)
    print(" >>> STEP 1: FETCH 5 YEARS OF REAL MARKET & MACRO DATA <<<")
    print("=" * 80)
    today = datetime.today()
    start_5y = (today - timedelta(days=5 * 365 + 30)).strftime("%Y-%m-%d")
    end_today = today.strftime("%Y-%m-%d")
    print(f"Date range: {start_5y} to {end_today}")

    print("Fetching AAPL daily prices...")
    aapl_df = get_market_data("AAPL", start=start_5y, end=end_today)
    print(f"  AAPL rows fetched: {len(aapl_df)}")

    print("Fetching US CPI (CPIAUCSL)...")
    cpi_df = get_us_indicator("CPIAUCSL", start=start_5y, end=end_today)
    print(f"  US CPI rows fetched: {len(cpi_df)}")

    if aapl_df.empty or cpi_df.empty:
        raise RuntimeError("Failed to fetch required 5-year verification data.")

    print("\n" + "=" * 80)
    print(" >>> STEP 2: PREPARE MONTHLY INFLATION RATE & ASSET RETURNS <<<")
    print("=" * 80)
    # Compute MoM Inflation Rate from CPI level
    cpi_series = pd.Series(cpi_df["value"].values, index=cpi_df["date"], name="CPI")
    inflation_rate = cpi_series.pct_change().dropna()
    inflation_rate.name = "US_Inflation_Rate"
    print(f"US Inflation Rate (MoM % change) - count {len(inflation_rate)}:")
    print(f"  First 3 months: {inflation_rate.head(3).to_dict()}")
    print(f"  Last 3 months:  {inflation_rate.tail(3).to_dict()}")

    # Resample AAPL daily prices to monthly returns
    aapl_prices = pd.Series(aapl_df["close"].values, index=aapl_df["date"], name="AAPL")
    aapl_monthly_returns = resample_to_period_returns(aapl_prices, freq="M")
    aapl_monthly_returns.name = "AAPL_Monthly_Returns"
    print(f"\nAAPL Monthly Returns - count {len(aapl_monthly_returns)}:")
    print(f"  First 3 months: {aapl_monthly_returns.head(3).to_dict()}")
    print(f"  Last 3 months:  {aapl_monthly_returns.tail(3).to_dict()}")

    print("\n" + "=" * 80)
    print(" >>> STEP 3: RUN HYPOTHESIS TEST <<<")
    print("=" * 80)
    print("Hypotheses:")
    print("  H0: Inflation has no significant relationship with AAPL's monthly returns.")
    print("  H1: Inflation has a significant relationship with AAPL's monthly returns.")
    print("-" * 80)

    result = run_correlation_hypothesis_test(
        inflation_rate, aapl_monthly_returns, alpha=0.05
    )

    print("\nHypothesis Test Result Dictionary:")
    for k, v in result.items():
        print(f"  {k:15}: {v}")

    print("\n" + "=" * 80)
    print(" >>> STEP 4: DEMONSTRATE VALUEERROR ON < 3 OVERLAPPING POINTS <<<")
    print("=" * 80)
    print("Constructing synthetic series with only 2 overlapping data points...")
    tiny_x = pd.Series([0.01, 0.02], index=["2025-01-01", "2025-02-01"])
    tiny_y = pd.Series([0.03, -0.01], index=["2025-01-01", "2025-02-01"])

    value_error_raised = False
    try:
        run_correlation_hypothesis_test(tiny_x, tiny_y, alpha=0.05)
    except ValueError as exc:
        value_error_raised = True
        print(f"  Successfully caught expected ValueError:\n  '{exc}'")

    print("\n" + "=" * 80)
    print(" >>> STEP 5: SANITY CHECKS & VERIFICATION ASSERTIONS <<<")
    print("=" * 80)
    assert value_error_raised, "FAILED: ValueError was not raised for n_obs < 3!"
    assert -1.0 <= result["r"] <= 1.0, f"FAILED: Pearson r out of [-1, 1] range: {result['r']}"
    assert 0.0 <= result["p_value"] <= 1.0, f"FAILED: p_value out of [0, 1] range: {result['p_value']}"
    assert 50 <= result["n_obs"] <= 70, f"FAILED: n_obs unexpected for 5y window: {result['n_obs']}"
    assert isinstance(result["reject_null"], bool), "FAILED: reject_null is not boolean"
    assert isinstance(result["interpretation"], str), "FAILED: interpretation is not string"

    print("  Assertion 1: ValueError raised on < 3 points -> PASS")
    print(f"  Assertion 2: Pearson r in [-1, 1] (r = {result['r']:.4f}) -> PASS")
    print(f"  Assertion 3: p_value in [0, 1] (p = {result['p_value']:.4f}) -> PASS")
    print(f"  Assertion 4: n_obs reasonable for 5y window (n_obs = {result['n_obs']}) -> PASS")
    print("  Assertion 5: reject_null boolean and interpretation generated -> PASS")

    print("\n" + "=" * 80)
    print(" >>> ALL PHASE 6 HYPOTHESIS TESTING VERIFICATIONS PASSED <<<")
    print("=" * 80)


if __name__ == "__main__":
    verify()
