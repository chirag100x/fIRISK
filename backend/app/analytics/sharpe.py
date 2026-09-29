import numpy as np
import pandas as pd


def calculate_sharpe_ratio(
    returns: pd.Series,
    risk_free_rate: float = 0.0,
    annualize: bool = True,
    trading_days: int = 252,
) -> float:
    """
    Calculate the Sharpe ratio: (Return - Risk-Free Rate) / Volatility.

    Args:
        returns: pd.Series of daily returns.
        risk_free_rate: Annualized risk-free rate as a decimal (e.g. 0.04 for 4%).
                        Default is 0.0. Not re-annualized.
        annualize: If True, annualizes the mean return and volatility using trading_days.
        trading_days: Number of trading days per year (default 252).

    Returns:
        float: Dimensionless Sharpe ratio.
    """
    if returns is None or len(returns.dropna()) < 2:
        return 0.0

    clean_returns = returns.dropna()
    mean_return = clean_returns.mean()
    volatility = clean_returns.std()

    if volatility == 0 or np.isnan(volatility) or np.isnan(mean_return):
        return 0.0

    if annualize:
        annual_mean_return = mean_return * trading_days
        annual_volatility = volatility * np.sqrt(trading_days)
        if annual_volatility == 0 or np.isnan(annual_volatility):
            return 0.0
        return float((annual_mean_return - risk_free_rate) / annual_volatility)

    return float((mean_return - risk_free_rate) / volatility)
