import logging
import pandas as pd
# pyrefly: ignore [missing-import]
import yfinance as yf

logger = logging.getLogger(__name__)

MARKET_DATA_COLUMNS = [
    "date",
    "ticker",
    "open",
    "high",
    "low",
    "close",
    "adj_close",
    "volume",
]


def get_market_data(ticker: str, start: str, end: str) -> pd.DataFrame:
    """
    Fetch OHLCV market data for a given ticker between start and end dates.

    Args:
        ticker: Asset symbol (e.g. 'AAPL' for US, 'RELIANCE.NS' for NSE India).
        start: Start date in 'YYYY-MM-DD' format.
        end: End date in 'YYYY-MM-DD' format.

    Returns:
        pd.DataFrame with columns:
        ['date', 'ticker', 'open', 'high', 'low', 'close', 'adj_close', 'volume']
    """
    empty_df = pd.DataFrame(columns=MARKET_DATA_COLUMNS)

    if not ticker or not start or not end:
        return empty_df

    try:
        # Download data without auto-adjust to retain both Close and Adj Close
        raw_df = yf.download(
            tickers=ticker,
            start=start,
            end=end,
            auto_adjust=False,
            multi_level_index=False,
            progress=False,
        )

        if raw_df is None or raw_df.empty:
            return empty_df

        df = raw_df.copy()

        # Handle potential MultiIndex columns defensively
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = [col[0] for col in df.columns]

        # Reset index to expose Date/Datetime as a column
        df = df.reset_index()

        # Normalize column names to lowercase with underscores
        normalized_cols = {}
        for col in df.columns:
            cleaned = str(col).strip().lower().replace(" ", "_")
            normalized_cols[col] = cleaned
        df = df.rename(columns=normalized_cols)

        # Standardize date column name
        if "date" not in df.columns:
            if "datetime" in df.columns:
                df = df.rename(columns={"datetime": "date"})
            elif "index" in df.columns:
                df = df.rename(columns={"index": "date"})

        if "date" not in df.columns:
            return empty_df

        # Format date as 'YYYY-MM-DD'
        df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")

        # Assign ticker symbol
        df["ticker"] = ticker

        # Fallback for adj_close if not present
        if "adj_close" not in df.columns and "close" in df.columns:
            df["adj_close"] = df["close"]

        # Ensure all required columns exist
        for col in ["open", "high", "low", "close", "adj_close", "volume"]:
            if col not in df.columns:
                return empty_df

        # Filter and order exactly to contract columns
        result = df[MARKET_DATA_COLUMNS].copy()
        result = result.dropna(subset=["date", "close"]).reset_index(drop=True)
        return result

    except Exception as exc:
        logger.warning("Failed to fetch market data for ticker %s: %s", ticker, exc)
        return empty_df
