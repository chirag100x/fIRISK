import logging
import pandas as pd
from app.models.database import SessionLocal, engine
from app.models.models import EconomicIndicator, MarketPrice

logger = logging.getLogger(__name__)


def _get_insert_fn():
    """Return the dialect-specific INSERT function supporting ON CONFLICT."""
    if engine.dialect.name == "postgresql":
        from sqlalchemy.dialects.postgresql import insert as pg_insert
        return pg_insert
    else:
        from sqlalchemy.dialects.sqlite import insert as sqlite_insert
        return sqlite_insert


def save_market_data(df: pd.DataFrame) -> int:
    """
    Save or upsert market data into the market_prices table.

    Args:
        df: DataFrame matching the Phase 2 contract with columns:
            ['date', 'ticker', 'open', 'high', 'low', 'close', 'adj_close', 'volume']

    Returns:
        int: Number of rows inserted or updated.
    """
    if df is None or df.empty:
        return 0

    required_cols = ["date", "ticker", "open", "high", "low", "close", "adj_close", "volume"]
    for col in required_cols:
        if col not in df.columns:
            logger.error("Missing required column '%s' in market data DataFrame", col)
            return 0

    clean_df = df[required_cols].copy()
    clean_df = clean_df.dropna(subset=["date", "ticker", "close"])

    if clean_df.empty:
        return 0

    # Ensure date is converted to datetime.date object
    clean_df["date"] = pd.to_datetime(clean_df["date"]).dt.date
    clean_df["open"] = pd.to_numeric(clean_df["open"], errors="coerce")
    clean_df["high"] = pd.to_numeric(clean_df["high"], errors="coerce")
    clean_df["low"] = pd.to_numeric(clean_df["low"], errors="coerce")
    clean_df["close"] = pd.to_numeric(clean_df["close"], errors="coerce")
    clean_df["adj_close"] = pd.to_numeric(clean_df["adj_close"], errors="coerce")
    clean_df["volume"] = pd.to_numeric(clean_df["volume"], errors="coerce")

    records = clean_df.to_dict(orient="records")
    if not records:
        return 0

    insert_fn = _get_insert_fn()
    stmt = insert_fn(MarketPrice).values(records)
    stmt = stmt.on_conflict_do_update(
        index_elements=["ticker", "date"],
        set_={
            "open": stmt.excluded.open,
            "high": stmt.excluded.high,
            "low": stmt.excluded.low,
            "close": stmt.excluded.close,
            "adj_close": stmt.excluded.adj_close,
            "volume": stmt.excluded.volume,
        },
    )

    try:
        with SessionLocal() as session:
            result = session.execute(stmt)
            session.commit()
            rows_affected = result.rowcount if result.rowcount is not None and result.rowcount >= 0 else len(records)
            return rows_affected
    except Exception as exc:
        logger.error("Failed to save market data to database: %s", exc)
        raise exc


def save_economic_data(df: pd.DataFrame) -> int:
    """
    Save or upsert economic indicator data into the economic_indicators table.

    Args:
        df: DataFrame matching the Phase 2 contract with columns:
            ['date', 'country', 'indicator_code', 'indicator_name', 'value']

    Returns:
        int: Number of rows inserted or updated.
    """
    if df is None or df.empty:
        return 0

    required_cols = ["date", "country", "indicator_code", "indicator_name", "value"]
    for col in required_cols:
        if col not in df.columns:
            logger.error("Missing required column '%s' in economic data DataFrame", col)
            return 0

    clean_df = df[required_cols].copy()
    clean_df = clean_df.dropna(subset=["date", "country", "indicator_code", "value"])

    if clean_df.empty:
        return 0

    # Ensure date is converted to datetime.date object
    clean_df["date"] = pd.to_datetime(clean_df["date"]).dt.date
    clean_df["value"] = pd.to_numeric(clean_df["value"], errors="coerce")

    records = clean_df.to_dict(orient="records")
    if not records:
        return 0

    insert_fn = _get_insert_fn()
    stmt = insert_fn(EconomicIndicator).values(records)
    stmt = stmt.on_conflict_do_update(
        index_elements=["country", "indicator_code", "date"],
        set_={
            "indicator_name": stmt.excluded.indicator_name,
            "value": stmt.excluded.value,
        },
    )

    try:
        with SessionLocal() as session:
            result = session.execute(stmt)
            session.commit()
            rows_affected = result.rowcount if result.rowcount is not None and result.rowcount >= 0 else len(records)
            return rows_affected
    except Exception as exc:
        logger.error("Failed to save economic data to database: %s", exc)
        raise exc
