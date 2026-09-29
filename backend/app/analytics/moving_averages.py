from typing import List, Optional
import pandas as pd


def calculate_moving_averages(
    prices: pd.Series, windows: Optional[List[int]] = None
) -> pd.DataFrame:
    """
    Calculate Simple Moving Averages (SMA) for specified window sizes.

    Args:
        prices: pd.Series of asset prices (chronologically ordered).
        windows: List of window sizes (default [7, 20, 50, 200]).

    Returns:
        pd.DataFrame with columns named 'SMA_<window>', aligned to the input index.
        Early rows where the window is incomplete are NaN.
    """
    if windows is None:
        windows = [7, 20, 50, 200]

    if prices is None or prices.empty:
        cols = [f"SMA_{w}" for w in windows]
        return pd.DataFrame(columns=cols)

    sma_dict = {}
    for w in windows:
        sma_dict[f"SMA_{w}"] = prices.rolling(window=w).mean()

    return pd.DataFrame(sma_dict, index=prices.index)
