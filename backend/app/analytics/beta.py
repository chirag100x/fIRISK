import numpy as np
import pandas as pd


def calculate_beta(asset_returns: pd.Series, market_returns: pd.Series) -> float:
    """
    Calculate asset Beta relative to a benchmark market index.
    Beta = Cov(asset_returns, market_returns) / Var(market_returns).

    Args:
        asset_returns: pd.Series of asset returns.
        market_returns: pd.Series of benchmark market returns.

    Returns:
        float: Dimensionless Beta value.
    """
    if (
        asset_returns is None
        or market_returns is None
        or asset_returns.empty
        or market_returns.empty
    ):
        return 0.0

    # Align both return series strictly on common index (inner join)
    aligned = pd.concat(
        [asset_returns.rename("asset"), market_returns.rename("market")],
        axis=1,
        join="inner",
    ).dropna()

    if len(aligned) < 2:
        return 0.0

    covariance = aligned["asset"].cov(aligned["market"])
    market_variance = aligned["market"].var()

    if market_variance == 0 or np.isnan(market_variance) or np.isnan(covariance):
        return 0.0

    return float(covariance / market_variance)
