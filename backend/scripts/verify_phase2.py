"""Manual verification script for Phase 2: Data Acquisition.

Fetches sample data for US/India equities, US CPI, and India GDP growth,
printing shapes and sample records to verify the data acquisition contracts.
"""

from datetime import datetime, timedelta
from pathlib import Path
import sys
import pandas as pd

# Ensure backend root is in python path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.data.economic_data import get_india_indicator, get_us_indicator
from app.data.market_data import get_market_data

# Ensure all columns are clearly printed
pd.set_option("display.max_columns", None)
pd.set_option("display.width", 1000)


def print_section(title: str, df) -> None:
    print("=" * 80)
    print(f" {title}")
    print("=" * 80)
    print(f"Columns: {df.columns.tolist()}")
    print(f"Shape:   {df.shape}")
    print("\nFirst 5 rows (.head()):")
    print(df.head())
    print("\n")


def main():
    today = datetime.today()
    start_30d = (today - timedelta(days=30)).strftime("%Y-%m-%d")
    end_today = today.strftime("%Y-%m-%d")
    start_2y = (today - timedelta(days=730)).strftime("%Y-%m-%d")

    print("\n>>> Running Phase 2 Verification Script <<<\n")
    print(f"Market Data Range (last 30 days): {start_30d} to {end_today}")
    print(f"US Economic Range (last 2 years): {start_2y} to {end_today}")
    print("India Economic Range: Full Available Range\n")

    # 1. Market Data: AAPL (US)
    aapl_df = get_market_data("AAPL", start=start_30d, end=end_today)
    print_section("Market Data: AAPL (US Equities, Last 30 Days)", aapl_df)

    # 2. Market Data: RELIANCE.NS (NSE India)
    reliance_df = get_market_data("RELIANCE.NS", start=start_30d, end=end_today)
    print_section("Market Data: RELIANCE.NS (NSE India, Last 30 Days)", reliance_df)

    # 3. US Economic Data: CPI (CPIAUCSL)
    us_cpi_df = get_us_indicator("CPIAUCSL", start=start_2y, end=end_today)
    print_section("Economic Data: US CPI - Inflation (CPIAUCSL, Last 2 Years)", us_cpi_df)

    # 4. India Economic Data: GDP Growth (NY.GDP.MKTP.KD.ZG)
    india_gdp_df = get_india_indicator("NY.GDP.MKTP.KD.ZG")
    print_section("Economic Data: India GDP Growth (NY.GDP.MKTP.KD.ZG, Full Range)", india_gdp_df)

    print(">>> All Phase 2 Data Acquisition Checks Completed Successfully <<<")


if __name__ == "__main__":
    main()
