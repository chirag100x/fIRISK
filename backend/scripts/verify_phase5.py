"""Verification script for Phase 5: Portfolio Engine.

Tests currency-agnostic multi-asset portfolio logic mixing US and Indian assets:
AAPL (40%), MSFT (30%), RELIANCE.NS (30%).
Reuses Phase 4 pure risk functions directly.
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
from app.data.market_data import get_market_data

pd.set_option("display.max_columns", None)
pd.set_option("display.width", 1000)


def verify():
    print("=" * 80)
    print(" >>> STEP 1: DEFINE & NORMALIZE PORTFOLIO WEIGHTS <<<")
    print("=" * 80)
    raw_weights = {"AAPL": 40, "MSFT": 30, "RELIANCE.NS": 30}
    weights = normalize_weights(raw_weights)
    print(f"Raw weights:        {raw_weights}")
    print(f"Normalized weights: {weights}")
    weight_sum = sum(weights.values())
    print(f"Sum of weights:     {weight_sum:.6f} [CHECK: {'PASS' if abs(weight_sum - 1.0) < 1e-6 else 'FAIL'}]")

    today = datetime.today()
    start_1y = (today - timedelta(days=365)).strftime("%Y-%m-%d")
    end_today = today.strftime("%Y-%m-%d")

    print("\n" + "=" * 80)
    print(" >>> STEP 2: FETCH 1-YEAR MARKET DATA (US + INDIA EQUITIES & BENCHMARKS) <<<")
    print("=" * 80)
    print(f"Date range: {start_1y} to {end_today}")

    # Fetch assets
    print("Fetching AAPL (US)...")
    aapl_df = get_market_data("AAPL", start=start_1y, end=end_today)
    print(f"  AAPL rows: {len(aapl_df)}")

    print("Fetching MSFT (US)...")
    msft_df = get_market_data("MSFT", start=start_1y, end=end_today)
    print(f"  MSFT rows: {len(msft_df)}")

    print("Fetching RELIANCE.NS (India NSE)...")
    reliance_df = get_market_data("RELIANCE.NS", start=start_1y, end=end_today)
    print(f"  RELIANCE.NS rows: {len(reliance_df)}")

    # Fetch benchmarks
    print("Fetching ^GSPC (S&P 500 benchmark for US assets)...")
    gspc_df = get_market_data("^GSPC", start=start_1y, end=end_today)
    print(f"  ^GSPC rows: {len(gspc_df)}")

    print("Fetching ^NSEI (NIFTY 50 benchmark for Indian asset)...")
    nsei_df = get_market_data("^NSEI", start=start_1y, end=end_today)
    print(f"  ^NSEI rows: {len(nsei_df)}")

    for name, df in [
        ("AAPL", aapl_df),
        ("MSFT", msft_df),
        ("RELIANCE.NS", reliance_df),
        ("^GSPC", gspc_df),
        ("^NSEI", nsei_df),
    ]:
        if df.empty:
            raise RuntimeError(f"Failed to fetch market data for {name}")

    # Create price Series indexed by date
    aapl_p = pd.Series(aapl_df["close"].values, index=aapl_df["date"], name="AAPL")
    msft_p = pd.Series(msft_df["close"].values, index=msft_df["date"], name="MSFT")
    reliance_p = pd.Series(reliance_df["close"].values, index=reliance_df["date"], name="RELIANCE.NS")
    gspc_p = pd.Series(gspc_df["close"].values, index=gspc_df["date"], name="^GSPC")
    nsei_p = pd.Series(nsei_df["close"].values, index=nsei_df["date"], name="^NSEI")

    print("\n" + "=" * 80)
    print(" >>> STEP 3: INDIVIDUAL ASSET RETURNS & BENCHMARK BETAS <<<")
    print("=" * 80)
    # Compute returns via Phase 4 calculate_returns
    aapl_ret = calculate_returns(aapl_p)
    msft_ret = calculate_returns(msft_p)
    reliance_ret = calculate_returns(reliance_p)
    gspc_ret = calculate_returns(gspc_p)
    nsei_ret = calculate_returns(nsei_p)

    # Compute individual Betas against respective market indices via Phase 4 calculate_beta
    beta_aapl = calculate_beta(aapl_ret, gspc_ret)
    beta_msft = calculate_beta(msft_ret, gspc_ret)
    beta_reliance = calculate_beta(reliance_ret, nsei_ret)
    asset_betas = {"AAPL": beta_aapl, "MSFT": beta_msft, "RELIANCE.NS": beta_reliance}

    print(f"Individual Betas:")
    print(f"  AAPL (vs ^GSPC):        {beta_aapl:.4f}")
    print(f"  MSFT (vs ^GSPC):        {beta_msft:.4f}")
    print(f"  RELIANCE.NS (vs ^NSEI): {beta_reliance:.4f}")

    print("\n" + "=" * 80)
    print(" >>> STEP 4: PORTFOLIO RETURNS & CURRENCY-AGNOSTIC VALUE INDEX <<<")
    print("=" * 80)
    # Build aligned DataFrames
    returns_df = pd.DataFrame({"AAPL": aapl_ret, "MSFT": msft_ret, "RELIANCE.NS": reliance_ret})
    prices_df = pd.DataFrame({"AAPL": aapl_p, "MSFT": msft_p, "RELIANCE.NS": reliance_p})

    # Portfolio daily returns
    portfolio_ret = calculate_portfolio_returns(returns_df, weights)
    print(f"Portfolio daily returns calculated (count = {len(portfolio_ret)} overlapping trading days):")
    print(f"  First 3 days: {portfolio_ret.head(3).to_dict()}")
    print(f"  Last 3 days:  {portfolio_ret.tail(3).to_dict()}")

    # Portfolio value index (base = 100.0)
    portfolio_idx = calculate_portfolio_value_index(prices_df, weights, base=100.0)
    idx_first_val = portfolio_idx.iloc[0]
    print(f"\nPortfolio Value Index (base=100.0):")
    print(f"  Day 1 Index Value: {idx_first_val:.4f} [CHECK: {'PASS' if abs(idx_first_val - 100.0) < 1e-6 else 'FAIL'}]")
    print(f"  Latest Value:      {portfolio_idx.iloc[-1]:.4f}")
    print("  First 5 index points:")
    print(portfolio_idx.head())

    print("\n" + "=" * 80)
    print(" >>> STEP 5: PORTFOLIO RISK METRICS (REUSING PHASE 4 FUNCTIONS) <<<")
    print("=" * 80)
    # Portfolio Beta
    port_beta = calculate_portfolio_beta(asset_betas, weights)
    print(f"Portfolio Beta (weighted average):           {port_beta:.4f}")

    # Portfolio Volatility via Phase 4 calculate_volatility
    port_vol = calculate_volatility(portfolio_ret, annualize=True)
    print(f"Portfolio Annualized Volatility:             {port_vol:.4f} ({port_vol * 100:.2f}%)")

    # Portfolio Sharpe Ratio via Phase 4 calculate_sharpe_ratio
    port_sharpe = calculate_sharpe_ratio(portfolio_ret, risk_free_rate=0.0, annualize=True)
    print(f"Portfolio Sharpe Ratio (rf=0.0):             {port_sharpe:.4f}")

    # Portfolio Max Drawdown via Phase 4 calculate_max_drawdown
    port_dd_info = calculate_max_drawdown(portfolio_idx)
    port_max_dd = port_dd_info["max_drawdown"]
    print(f"Portfolio Max Drawdown:                      {port_max_dd:.4f} ({port_max_dd * 100:.2f}%) [SIGN: {'PASS (negative)' if port_max_dd <= 0 else 'FAIL'}]")
    print(f"  Drawdown Peak Date:                        {port_dd_info['peak_date']}")
    print(f"  Drawdown Trough Date:                      {port_dd_info['trough_date']}")

    # Portfolio Historical VaR via Phase 4 calculate_historical_var
    port_var_95 = calculate_historical_var(portfolio_ret, confidence_level=0.95)
    print(f"Portfolio 95% Historical VaR:                {port_var_95:.4f} ({port_var_95 * 100:.2f}% potential loss) [SIGN: {'PASS (positive)' if port_var_95 >= 0 else 'FAIL'}]")

    print("\n" + "=" * 80)
    print(" >>> STEP 6: SANITY CHECKS & RIGOROUS ASSERTIONS <<<")
    print("=" * 80)
    assert abs(weight_sum - 1.0) < 1e-6, f"Weights do not sum to 1.0: {weight_sum}"
    assert abs(idx_first_val - 100.0) < 1e-6, f"Portfolio value index day 1 is not 100.0: {idx_first_val}"
    assert port_max_dd <= 0.0, f"Portfolio max drawdown must be negative or zero: {port_max_dd}"
    assert port_var_95 >= 0.0, f"Portfolio VaR must be positive: {port_var_95}"
    assert 0.05 < port_vol < 1.0, f"Portfolio volatility out of range: {port_vol}"
    assert 0.2 < port_beta < 2.5, f"Portfolio beta out of range: {port_beta}"

    print("  Assertion 1: Weights sum exactly to 1.0 -> PASS")
    print("  Assertion 2: Value index day 1 is exactly 100.0 -> PASS")
    print("  Assertion 3: Max drawdown is negative -> PASS")
    print("  Assertion 4: Historical VaR is positive -> PASS")
    print("  Assertion 5: Portfolio volatility is plausible single float -> PASS")
    print("  Assertion 6: Portfolio beta is plausible single float -> PASS")

    print("\n" + "=" * 80)
    print(" >>> ALL PHASE 5 PORTFOLIO ENGINE VERIFICATIONS PASSED <<<")
    print("=" * 80)


if __name__ == "__main__":
    verify()
