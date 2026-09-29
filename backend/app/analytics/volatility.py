import numpy as np
import pandas as pd


def calculate_volatility(
    returns: pd.Series, annualize: bool = True, trading_days: int = 252
) -> float:
    """
    Calculate return volatility (standard deviation), optionally annualized.

    Args:
        returns: pd.Series of daily returns.
        annualize: If True, multiplies standard deviation by sqrt(trading_days).
        trading_days: Number of trading days per year (default 252).

    Returns:
        float: Volatility as a decimal (e.g. 0.22 for 22%).
    """
    if returns is None or len(returns.dropna()) < 2:
        return 0.0

    clean_returns = returns.dropna()
    daily_vol = clean_returns.std()

    if np.isnan(daily_vol):
        return 0.0

    if annualize:
        return float(daily_vol * np.sqrt(trading_days))

    return float(daily_vol)
