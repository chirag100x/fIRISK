"""Verification script for Phase 3: Database Schema & Persistence.

1. Initializes the database tables via init_db().
2. Fetches sample data via Phase 2 modules (AAPL 30d, US CPI 2y).
3. Saves data into the database using db_writer functions.
4. Executes the save step a second time to verify idempotency (no duplicates, no errors).
5. Queries records back out of SQLite to verify round-trip persistence.
"""

from datetime import datetime, timedelta
from pathlib import Path
import sys
import pandas as pd

# Ensure backend root is in python path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.data.db_writer import save_economic_data, save_market_data
from app.data.economic_data import get_us_indicator
from app.data.market_data import get_market_data
from app.models.database import SessionLocal, engine
from app.models.models import EconomicIndicator, MarketPrice
from scripts.init_db import init_db

# Configure pandas formatting for clear output
pd.set_option("display.max_columns", None)
pd.set_option("display.width", 1000)


def verify():
    print("=" * 80)
    print(" >>> STEP 1: INITIALIZE DATABASE <<<")
    print("=" * 80)
    init_db()

    today = datetime.today()
    start_30d = (today - timedelta(days=30)).strftime("%Y-%m-%d")
    end_today = today.strftime("%Y-%m-%d")
    start_2y = (today - timedelta(days=730)).strftime("%Y-%m-%d")

    print("\n" + "=" * 80)
    print(" >>> STEP 2: FETCH SAMPLE DATA (Phase 2 modules) <<<")
    print("=" * 80)
    print(f"Fetching AAPL ({start_30d} to {end_today})...")
    aapl_df = get_market_data("AAPL", start=start_30d, end=end_today)
    print(f"  Fetched AAPL rows: {len(aapl_df)}")

    print(f"Fetching US CPI - CPIAUCSL ({start_2y} to {end_today})...")
    cpi_df = get_us_indicator("CPIAUCSL", start=start_2y, end=end_today)
    print(f"  Fetched US CPI rows: {len(cpi_df)}")

    print("\n" + "=" * 80)
    print(" >>> STEP 3: FIRST DATABASE SAVE <<<")
    print("=" * 80)
    market_saved_1 = save_market_data(aapl_df)
    econ_saved_1 = save_economic_data(cpi_df)
    print(f"  save_market_data returned: {market_saved_1}")
    print(f"  save_economic_data returned: {econ_saved_1}")

    with SessionLocal() as session:
        mp_count_1 = session.query(MarketPrice).count()
        ei_count_1 = session.query(EconomicIndicator).count()
        print(f"  DB count after run 1 -> MarketPrice: {mp_count_1}, EconomicIndicator: {ei_count_1}")

    print("\n" + "=" * 80)
    print(" >>> STEP 4: SECOND DATABASE SAVE (Idempotency & Conflict Check) <<<")
    print("=" * 80)
    print("Re-running save_market_data and save_economic_data with exact same data...")
    market_saved_2 = save_market_data(aapl_df)
    econ_saved_2 = save_economic_data(cpi_df)
    print(f"  save_market_data (2nd run) returned: {market_saved_2}")
    print(f"  save_economic_data (2nd run) returned: {econ_saved_2}")

    with SessionLocal() as session:
        mp_count_2 = session.query(MarketPrice).count()
        ei_count_2 = session.query(EconomicIndicator).count()
        print(f"  DB count after run 2 -> MarketPrice: {mp_count_2}, EconomicIndicator: {ei_count_2}")

    # Assert no duplicate rows were created
    assert mp_count_1 == mp_count_2, f"MarketPrice count changed! Run 1: {mp_count_1}, Run 2: {mp_count_2}"
    assert ei_count_1 == ei_count_2, f"EconomicIndicator count changed! Run 1: {ei_count_1}, Run 2: {ei_count_2}"
    print("  CONFIRMED: Zero duplicate rows created on re-run, no uniqueness errors raised.")

    print("\n" + "=" * 80)
    print(" >>> STEP 5: QUERY DATA BACK OUT OF SQLITE DATABASE <<<")
    print("=" * 80)
    with SessionLocal() as session:
        # Query MarketPrice rows
        mp_rows = session.query(MarketPrice).filter(MarketPrice.ticker == "AAPL").order_by(MarketPrice.date.asc()).all()
        mp_data = [
            {
                "id": r.id,
                "date": str(r.date),
                "ticker": r.ticker,
                "open": r.open,
                "high": r.high,
                "low": r.low,
                "close": r.close,
                "adj_close": r.adj_close,
                "volume": r.volume,
            }
            for r in mp_rows
        ]
        queried_market_df = pd.DataFrame(mp_data)

        # Query EconomicIndicator rows
        ei_rows = (
            session.query(EconomicIndicator)
            .filter(EconomicIndicator.indicator_code == "CPIAUCSL")
            .order_by(EconomicIndicator.date.asc())
            .all()
        )
        ei_data = [
            {
                "id": r.id,
                "date": str(r.date),
                "country": r.country,
                "indicator_code": r.indicator_code,
                "indicator_name": r.indicator_name,
                "value": r.value,
            }
            for r in ei_rows
        ]
        queried_econ_df = pd.DataFrame(ei_data)

    print(f"\n[Queried from SQLite Table: 'market_prices'] Total rows: {len(queried_market_df)}")
    print(f"Columns: {queried_market_df.columns.tolist()}")
    print("First 5 rows (.head()):")
    print(queried_market_df.head())

    print(f"\n[Queried from SQLite Table: 'economic_indicators'] Total rows: {len(queried_econ_df)}")
    print(f"Columns: {queried_econ_df.columns.tolist()}")
    print("First 5 rows (.head()):")
    print(queried_econ_df.head())

    print("\n" + "=" * 80)
    print(" >>> ALL PHASE 3 VERIFICATION CHECKS PASSED SUCCESSFULLY <<<")
    print("=" * 80)


if __name__ == "__main__":
    verify()
