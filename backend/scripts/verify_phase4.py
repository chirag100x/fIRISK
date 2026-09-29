"""Verification script for Phase 4: Risk Analytics Engine.

Tests pure risk calculation functions using real 1-year historical data for
AAPL and ^GSPC (S&P 500 benchmark).
"""

from datetime import datetime, timedelta
from pathlib import Path
import sys
import pandas as pd

# Ensure backend root is in python path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.analytics.beta import calculate_beta
from app.analytics.drawdown import calculate_max_drawdown
from app.analytics.moving_averages import calculate_moving_averages
from app.analytics.returns import calculate_log_returns, calculate_returns
from app.analytics.sharpe import calculate_sharpe_ratio
from app.analytics.var import calculate_historical_var
from app.analytics.volatility import calculate_volatility
from app.data.market_data import get_market_data

pd.set_option("display.max_columns", None)
pd.set_option("display.width", 1000)


def verify():
    today = datetime.today()
    start_1y = (today - timedelta(days=365)).strftime("%Y-%m-%d")
    end_today = today.strftime("%Y-%m-%d")

    print("=" * 80)
    print(" >>> STEP 1: FETCH REAL 1-YEAR MARKET DATA <<<")
    print("=" * 80)
    print(f"Date range: {start_1y} to {end_today}")

    print("Fetching AAPL...")
    aapl_df = get_market_data("AAPL", start=start_1y, end=end_today)
    print(f"  AAPL rows fetched: {len(aapl_df)}")

    print("Fetching ^GSPC (S&P 500 benchmark)...")
    gspc_df = get_market_data("^GSPC", start=start_1y, end=end_today)
    print(f"  ^GSPC rows fetched: {len(gspc_df)}")

    if aapl_df.empty or gspc_df.empty:
        raise RuntimeError("Failed to fetch market data for verification.")

    # Create Series indexed by date string for analytics
    aapl_prices = pd.Series(aapl_df["close"].values, index=aapl_df["date"], name="AAPL")
    gspc_prices = pd.Series(gspc_df["close"].values, index=gspc_df["date"], name="^GSPC")

    print("\n" + "=" * 80)
    print(" >>> STEP 2: RUN RISK ANALYTICS CALCULATIONS <<<")
    print("=" * 80)

    # 1. Returns
    daily_returns = calculate_returns(aapl_prices)
    log_returns = calculate_log_returns(aapl_prices)
    gspc_returns = calculate_returns(gspc_prices)

    print(f"Daily Simple Returns (count = {len(daily_returns)}, expected = {len(aapl_prices) - 1}):")
    print(f"  First 3: {daily_returns.head(3).to_dict()}")
    print(f"  Last 3:  {daily_returns.tail(3).to_dict()}")

    print(f"\nDaily Log Returns (count = {len(log_returns)}, expected = {len(aapl_prices) - 1}):")
    print(f"  First 3: {log_returns.head(3).to_dict()}")
    print(f"  Last 3:  {log_returns.tail(3).to_dict()}")

    # 2. Volatility
    ann_vol = calculate_volatility(daily_returns, annualize=True)
    daily_vol = calculate_volatility(daily_returns, annualize=False)
    print(f"\nVolatility:")
    print(f"  Annualized Volatility (252 days): {ann_vol:.4f} ({ann_vol * 100:.2f}%)")
    print(f"  Daily Volatility:                 {daily_vol:.4f} ({daily_vol * 100:.2f}%)")

    # 3. Moving Averages
    smas_df = calculate_moving_averages(aapl_prices, windows=[7, 20, 50, 200])
    print(f"\nMoving Averages (SMA 7, 20, 50, 200) - shape {smas_df.shape}:")
    print("  Latest 5 rows:")
    print(smas_df.tail())

    # 4. Beta
    beta = calculate_beta(daily_returns, gspc_returns)
    print(f"\nBeta (AAPL vs ^GSPC S&P 500): {beta:.4f}")

    # 5. Sharpe Ratio
    sharpe_rf0 = calculate_sharpe_ratio(daily_returns, risk_free_rate=0.0, annualize=True)
    sharpe_rf4 = calculate_sharpe_ratio(daily_returns, risk_free_rate=0.04, annualize=True)
    print(f"\nSharpe Ratio (Annualized):")
    print(f"  With Risk-Free Rate = 0.0%: {sharpe_rf0:.4f}")
    print(f"  With Risk-Free Rate = 4.0%: {sharpe_rf4:.4f}")

    # 6. Max Drawdown
    drawdown_info = calculate_max_drawdown(aapl_prices)
    max_dd = drawdown_info["max_drawdown"]
    peak_date = drawdown_info["peak_date"]
    trough_date = drawdown_info["trough_date"]
    print(f"\nMax Drawdown (must be negative):")
    print(f"  Value:       {max_dd:.4f} ({max_dd * 100:.2f}%) [SIGN CHECK: {'PASS (negative)' if max_dd <= 0 else 'FAIL'}]")
    print(f"  Peak Date:   {peak_date}")
    print(f"  Trough Date: {trough_date}")

    # 7. Historical VaR
    var_95 = calculate_historical_var(daily_returns, confidence_level=0.95)
    var_99 = calculate_historical_var(daily_returns, confidence_level=0.99)
    print(f"\nHistorical Value-at-Risk (must be positive loss magnitude):")
    print(f"  95% Historical VaR: {var_95:.4f} ({var_95 * 100:.2f}% potential 1-day loss) [SIGN CHECK: {'PASS (positive)' if var_95 >= 0 else 'FAIL'}]")
    print(f"  99% Historical VaR: {var_99:.4f} ({var_99 * 100:.2f}% potential 1-day loss)")

    print("\n" + "=" * 80)
    print(" >>> STEP 3: SANITY CHECKS & ASSERTIONS <<<")
    print("=" * 80)

    # Sanity Assertions per requirements
    assert max_dd <= 0.0, f"FAILED: max_drawdown MUST be negative or zero, got {max_dd}"
    assert var_95 >= 0.0, f"FAILED: historical_var MUST be positive, got {var_95}"
    assert 0.05 < ann_vol < 1.0, f"FAILED: Annualized volatility unexpected magnitude: {ann_vol}"
    assert 0.2 < beta < 3.0, f"FAILED: AAPL Beta unexpected magnitude: {beta}"
    assert len(daily_returns) == len(aapl_prices) - 1, "FAILED: returns length convention"
    assert smas_df.shape[1] == 4, "FAILED: moving averages column count"

    print("  Assertion 1: max_drawdown <= 0 -> PASS")
    print("  Assertion 2: historical_var >= 0 -> PASS")
    print("  Assertion 3: volatility magnitude sensible -> PASS")
    print("  Assertion 4: beta in plausible range -> PASS")
    print("  Assertion 5: return length dropped 1st day -> PASS")
    print("  Assertion 6: all 4 SMAs computed -> PASS")

    print("\n" + "=" * 80)
    print(" >>> ALL PHASE 4 RISK ANALYTICS VERIFICATIONS PASSED <<<")
    print("=" * 80)


if __name__ == "__main__":
    verify()
