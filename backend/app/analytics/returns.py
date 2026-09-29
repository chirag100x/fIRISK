import numpy as np
import pandas as pd


def calculate_returns(prices: pd.Series) -> pd.Series:
    """
    Calculate simple daily returns: (P_t - P_{t-1}) / P_{t-1}.

    Args:
        prices: pd.Series of asset prices (chronologically ordered).

    Returns:
        pd.Series of daily simple returns with length = len(prices) - 1.
    """
    if prices is None or len(prices) < 2:
        return pd.Series(dtype=float)

    returns = prices.pct_change().dropna()
    return returns


def calculate_log_returns(prices: pd.Series) -> pd.Series:
    """
    Calculate continuously compounded daily log returns: ln(P_t / P_{t-1}).

    Args:
        prices: pd.Series of asset prices (chronologically ordered).

    Returns:
        pd.Series of log returns with length = len(prices) - 1.
    """
    if prices is None or len(prices) < 2:
        return pd.Series(dtype=float)

    log_returns = np.log(prices / prices.shift(1)).dropna()
    return log_returns
