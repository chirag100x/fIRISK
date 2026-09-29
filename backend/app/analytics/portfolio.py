from typing import Dict
import pandas as pd


def normalize_weights(weights: Dict[str, float]) -> Dict[str, float]:
    """
    Rescale asset weights to sum to 1.0.

    Args:
        weights: Dictionary mapping ticker to weight (e.g. {"AAPL": 40, "MSFT": 30, "RELIANCE.NS": 30}).

    Returns:
        dict: Normalized weights summing to 1.0 (e.g. {"AAPL": 0.4, "MSFT": 0.3, "RELIANCE.NS": 0.3}).

    Raises:
        ValueError: If weights is empty, any weight is negative, or sum of weights <= 0.
    """
    if not weights:
        raise ValueError("Weights dictionary cannot be empty.")

    for ticker, w in weights.items():
        if w < 0:
            raise ValueError(f"Weight for '{ticker}' cannot be negative: {w}")

    total_weight = sum(weights.values())
    if total_weight <= 0:
        raise ValueError(f"Sum of weights must be positive, got {total_weight}.")

    return {ticker: float(w) / total_weight for ticker, w in weights.items()}


def calculate_portfolio_returns(
    returns_df: pd.DataFrame, weights: Dict[str, float]
) -> pd.Series:
    """
    Calculate weighted daily returns for a multi-asset portfolio.

    Args:
        returns_df: pd.DataFrame where columns are tickers and values are daily simple returns.
                    Different markets have different trading holidays; inner join keeps dates
                    where ALL assets have data.
        weights: Dictionary mapping ticker to weight.

    Returns:
        pd.Series: Daily portfolio returns = sum(weight_i * return_i) per day.
    """
    if returns_df is None or returns_df.empty:
        return pd.Series(dtype=float, name="portfolio_returns")

    norm_weights = normalize_weights(weights)

    common_tickers = [t for t in norm_weights if t in returns_df.columns]
    if not common_tickers:
        return pd.Series(dtype=float, name="portfolio_returns")

    # Re-normalize if only a subset of tickers is present
    sub_weights = {t: norm_weights[t] for t in common_tickers}
    total_sub_weight = sum(sub_weights.values())
    aligned_weights = {t: w / total_sub_weight for t, w in sub_weights.items()}

    # Inner join on common dates across all tickers (drop any date where a ticker is NaN)
    aligned_returns = returns_df[common_tickers].dropna()

    if aligned_returns.empty:
        return pd.Series(dtype=float, name="portfolio_returns")

    weight_series = pd.Series(aligned_weights)
    portfolio_ret = aligned_returns.dot(weight_series)
    portfolio_ret.name = "portfolio_returns"

    return portfolio_ret


def calculate_portfolio_value_index(
    prices_df: pd.DataFrame, weights: Dict[str, float], base: float = 100.0
) -> pd.Series:
    """
    Calculate a normalized portfolio value index starting at `base` (default 100.0).

    CRITICAL CURRENCY-AGNOSTIC LOGIC:
    Since assets in different markets are denominated in different currencies
    (e.g. USD for US equities, INR for Indian equities), each asset's price
    series is normalized to its own first value (P_t / P_0) BEFORE applying weights.
    This tracks relative portfolio growth without requiring FX conversions.

    Args:
        prices_df: pd.DataFrame where columns are tickers and values are raw close prices.
        weights: Dictionary mapping ticker to weight.
        base: Starting value for index on day one (default 100.0).

    Returns:
        pd.Series: Portfolio value index starting at exactly `base`.
    """
    if prices_df is None or prices_df.empty:
        return pd.Series(dtype=float, name="portfolio_value_index")

    norm_weights = normalize_weights(weights)

    common_tickers = [t for t in norm_weights if t in prices_df.columns]
    if not common_tickers:
        return pd.Series(dtype=float, name="portfolio_value_index")

    sub_weights = {t: norm_weights[t] for t in common_tickers}
    total_sub_weight = sum(sub_weights.values())
    aligned_weights = {t: w / total_sub_weight for t, w in sub_weights.items()}

    # Inner join on common trading dates across all assets
    aligned_prices = prices_df[common_tickers].dropna()

    if aligned_prices.empty:
        return pd.Series(dtype=float, name="portfolio_value_index")

    # Normalize each ticker to start at 1.0 on day 0
    first_prices = aligned_prices.iloc[0]
    normalized_growth = aligned_prices.divide(first_prices, axis=1)

    # Weighted sum of normalized growth curves scaled by base
    weight_series = pd.Series(aligned_weights)
    weighted_growth = normalized_growth.dot(weight_series)
    index_series = weighted_growth * base
    index_series.name = "portfolio_value_index"

    return index_series


def calculate_portfolio_beta(
    asset_betas: Dict[str, float], weights: Dict[str, float]
) -> float:
    """
    Calculate portfolio Beta as a weighted average of individual asset Betas.

    NOTE ON METHODOLOGY (MVP Simplification):
    This computes the weighted average of individual betas: sum(weight_i * beta_i).
    While standard for quick portfolio risk profiling, true portfolio beta against
    a unified multi-asset benchmark requires a full asset-market covariance matrix.
    This is documented here as an intentional MVP approximation.

    Args:
        asset_betas: Dictionary mapping ticker to its individual Beta.
        weights: Dictionary mapping ticker to weight.

    Returns:
        float: Portfolio Beta.
    """
    if not asset_betas or not weights:
        return 0.0

    norm_weights = normalize_weights(weights)

    common_tickers = [t for t in norm_weights if t in asset_betas]
    if not common_tickers:
        return 0.0

    sub_weights = {t: norm_weights[t] for t in common_tickers}
    total_sub_weight = sum(sub_weights.values())
    aligned_weights = {t: w / total_sub_weight for t, w in sub_weights.items()}

    weighted_beta = sum(
        aligned_weights[t] * float(asset_betas[t]) for t in common_tickers
    )
    return float(weighted_beta)
