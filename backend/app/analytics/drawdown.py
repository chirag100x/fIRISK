from typing import Any, Dict
import pandas as pd


def calculate_max_drawdown(prices: pd.Series) -> Dict[str, Any]:
    """
    Calculate maximum drawdown from peak and identify peak & trough dates.

    Args:
        prices: pd.Series of asset prices (chronologically ordered, indexed by date).

    Returns:
        dict: {
            "max_drawdown": float,  # negative decimal, e.g. -0.187 (-18.7%)
            "peak_date": str or date,
            "trough_date": str or date,
        }
    """
    if prices is None or prices.empty:
        return {"max_drawdown": 0.0, "peak_date": None, "trough_date": None}

    clean_prices = prices.dropna()
    if clean_prices.empty:
        return {"max_drawdown": 0.0, "peak_date": None, "trough_date": None}

    # Running cumulative peak
    cumulative_max = clean_prices.cummax()

    # Drawdown series: strictly <= 0.0
    drawdown_series = (clean_prices - cumulative_max) / cumulative_max

    min_drawdown = float(drawdown_series.min())
    trough_date = drawdown_series.idxmin()

    # Peak must occur on or prior to the trough date
    peak_date = clean_prices.loc[:trough_date].idxmax()

    # Sign convention enforcement: max_drawdown MUST be <= 0.0
    if min_drawdown > 0:
        raise ValueError(
            f"Drawdown calculation error: positive drawdown {min_drawdown} encountered."
        )

    # Convert Timestamp indices to string format if applicable
    peak_date_str = (
        peak_date.strftime("%Y-%m-%d")
        if hasattr(peak_date, "strftime")
        else str(peak_date)
    )
    trough_date_str = (
        trough_date.strftime("%Y-%m-%d")
        if hasattr(trough_date, "strftime")
        else str(trough_date)
    )

    return {
        "max_drawdown": min_drawdown,
        "peak_date": peak_date_str,
        "trough_date": trough_date_str,
    }
