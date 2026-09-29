import numpy as np
import pandas as pd


def calculate_historical_var(
    returns: pd.Series, confidence_level: float = 0.95
) -> float:
    """
    Calculate Historical Value-at-Risk (VaR) at a specified confidence level.

    Args:
        returns: pd.Series of daily returns.
        confidence_level: Confidence level, e.g. 0.95 for 95% VaR (default 0.95).

    Returns:
        float: POSITIVE decimal representing potential loss magnitude
               (e.g. 0.032 for a 3.2% loss).
    """
    if returns is None or len(returns.dropna()) == 0:
        return 0.0

    clean_returns = returns.dropna()
    percentile_cutoff = (1.0 - confidence_level) * 100.0

    # Underlying return quantile (e.g. 5th percentile for 95% confidence)
    cutoff_return = float(np.percentile(clean_returns, percentile_cutoff))

    # Flip sign to represent loss magnitude as positive decimal
    # e.g., a return of -0.032 (-3.2%) becomes a loss magnitude of +0.032
    var_loss_magnitude = -cutoff_return

    # In standard convention, loss magnitude is non-negative
    return max(0.0, float(var_loss_magnitude))
