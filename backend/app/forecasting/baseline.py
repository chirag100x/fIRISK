import pandas as pd


def moving_average_forecast(price_history: pd.Series, window: int = 20) -> float:
    """
    Calculate a simple moving-average price forecast from historical prices.

    Args:
        price_history: Chronologically ordered past prices strictly up to yesterday.
        window: Moving average window length (default 20).

    Returns:
        float: Mean of the last `window` values.

    Raises:
        ValueError: If len(price_history) < window or window <= 0.
    """
    if price_history is None or price_history.empty:
        raise ValueError("Price history cannot be empty.")

    if window <= 0:
        raise ValueError(f"Window must be a positive integer, got {window}.")

    clean_history = price_history.dropna()
    if len(clean_history) < window:
        raise ValueError(
            f"Insufficient price history for window={window}: "
            f"available {len(clean_history)} observations."
        )

    # Use the strictly latest `window` observations in history
    return float(clean_history.iloc[-window:].mean())


def walk_forward_backtest(
    prices: pd.Series, window: int = 20, test_size: int = 60
) -> pd.DataFrame:
    """
    Perform a walk-forward out-of-sample backtest with strict zero-leakage.

    For each test date t in the last `test_size` dates:
        - History consists ONLY of prices[:t] (strictly prior to date t).
        - Forecast is computed as moving_average_forecast(prices[:t], window).
        - Ground truth is actual price at date t.
        - Previous day's actual price (at date t-1) is captured for directional accuracy.

    Args:
        prices: Full chronological daily price series.
        window: Moving average window size (default 20).
        test_size: Number of out-of-sample test days (default 60).

    Returns:
        pd.DataFrame with columns:
        ['date', 'prev_actual', 'actual', 'predicted']

    Raises:
        ValueError: If prices length is less than window + test_size + 1.
    """
    if prices is None or prices.empty:
        raise ValueError("Prices series cannot be empty.")

    clean_prices = prices.dropna()
    min_required = window + test_size + 1
    if len(clean_prices) < min_required:
        raise ValueError(
            f"Insufficient price data for backtest: need at least {min_required} "
            f"(window={window} + test_size={test_size} + 1), but got {len(clean_prices)}."
        )

    records = []
    total_len = len(clean_prices)
    test_start_idx = total_len - test_size

    for i in range(test_start_idx, total_len):
        # Strict zero-leakage slice: index i is excluded from history
        prior_history = clean_prices.iloc[:i]

        pred = moving_average_forecast(prior_history, window=window)
        actual = float(clean_prices.iloc[i])
        prev_actual = float(clean_prices.iloc[i - 1])

        date_val = clean_prices.index[i]
        date_str = (
            date_val.strftime("%Y-%m-%d")
            if hasattr(date_val, "strftime")
            else str(date_val)
        )

        records.append(
            {
                "date": date_str,
                "prev_actual": prev_actual,
                "actual": actual,
                "predicted": pred,
            }
        )

    return pd.DataFrame(
        records, columns=["date", "prev_actual", "actual", "predicted"]
    )
