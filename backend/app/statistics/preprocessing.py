import pandas as pd


def resample_to_period_returns(prices: pd.Series, freq: str = "M") -> pd.Series:
    """
    Resample a daily price series to period-end using freq and compute simple period returns.

    Args:
        prices: pd.Series of asset prices (chronologically ordered, indexed by date).
        freq: Resampling frequency string (default 'M' for month-end; handles 'ME', 'Q', 'QE', 'Y', 'YE').

    Returns:
        pd.Series: Simple returns between consecutive period-end prices:
                   (P_end - P_prev_end) / P_prev_end. Leading NaN is dropped.
                   Index corresponds to period-end dates.
    """
    if prices is None or prices.empty:
        return pd.Series(dtype=float)

    # Map legacy offset aliases to current pandas aliases (e.g. 'M' -> 'ME')
    freq_map = {
        "M": "ME",
        "Y": "YE",
        "Q": "QE",
        "A": "YE",
    }
    offset_rule = freq_map.get(freq.upper(), freq)

    clean_prices = prices.dropna()
    if len(clean_prices) < 2:
        return pd.Series(dtype=float)

    # Ensure DatetimeIndex for resample operation
    if not isinstance(clean_prices.index, pd.DatetimeIndex):
        clean_prices = clean_prices.copy()
        clean_prices.index = pd.to_datetime(clean_prices.index)

    # Period-end price series
    period_prices = clean_prices.resample(offset_rule).last().dropna()

    if len(period_prices) < 2:
        return pd.Series(dtype=float)

    # Compute period returns and drop leading NaN
    period_returns = period_prices.pct_change().dropna()
    return period_returns
