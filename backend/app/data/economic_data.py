import logging
import pandas as pd
# pyrefly: ignore [missing-import]
import pandas_datareader.data as web
import requests

logger = logging.getLogger(__name__)

ECONOMIC_DATA_COLUMNS = [
    "date",
    "country",
    "indicator_code",
    "indicator_name",
    "value",
]

# Locked indicator mappings
INDICATOR_NAMES = {
    # US (FRED codes)
    "CPIAUCSL": "Inflation (CPI)",
    "FEDFUNDS": "Interest Rate",
    "GDP": "GDP Growth",
    "UNRATE": "Unemployment",
    # India (World Bank codes)
    "FP.CPI.TOTL.ZG": "Inflation (CPI)",
    "NY.GDP.MKTP.KD.ZG": "GDP Growth",
    "SL.UEM.TOTL.ZS": "Unemployment",
}


def get_us_indicator(indicator_code: str, start: str, end: str) -> pd.DataFrame:
    """
    Fetch US economic indicator data from FRED via pandas-datareader.

    Args:
        indicator_code: FRED series ID (e.g. 'CPIAUCSL', 'FEDFUNDS', 'GDP', 'UNRATE').
        start: Start date in 'YYYY-MM-DD' format.
        end: End date in 'YYYY-MM-DD' format.

    Returns:
        pd.DataFrame with columns:
        ['date', 'country', 'indicator_code', 'indicator_name', 'value']
    """
    empty_df = pd.DataFrame(columns=ECONOMIC_DATA_COLUMNS)

    if not indicator_code or not start or not end:
        return empty_df

    try:
        raw_df = web.DataReader(indicator_code, "fred", start, end)

        if raw_df is None or raw_df.empty:
            return empty_df

        df = raw_df.reset_index()

        # Date column is the index (DATE or Date)
        date_col = df.columns[0]
        value_col = df.columns[1] if len(df.columns) > 1 else indicator_code

        df["date"] = pd.to_datetime(df[date_col]).dt.strftime("%Y-%m-%d")
        df["country"] = "US"
        df["indicator_code"] = indicator_code
        df["indicator_name"] = INDICATOR_NAMES.get(indicator_code, indicator_code)
        df["value"] = pd.to_numeric(df[value_col], errors="coerce")

        result = df[ECONOMIC_DATA_COLUMNS].copy()
        result = result.dropna(subset=["date", "value"]).reset_index(drop=True)
        return result

    except Exception as exc:
        logger.warning("Failed to fetch US indicator %s from FRED: %s", indicator_code, exc)
        return empty_df


def get_india_indicator(indicator_code: str) -> pd.DataFrame:
    """
    Fetch Indian economic indicator data directly from the World Bank REST API.

    Args:
        indicator_code: World Bank indicator code (e.g. 'FP.CPI.TOTL.ZG', 'NY.GDP.MKTP.KD.ZG', 'SL.UEM.TOTL.ZS').

    Returns:
        pd.DataFrame with columns:
        ['date', 'country', 'indicator_code', 'indicator_name', 'value']
    """
    empty_df = pd.DataFrame(columns=ECONOMIC_DATA_COLUMNS)

    if not indicator_code:
        return empty_df

    url = f"https://api.worldbank.org/v2/country/IN/indicator/{indicator_code}?format=json&per_page=1000"

    try:
        response = requests.get(url, timeout=15)
        if response.status_code != 200:
            logger.warning(
                "World Bank API returned status %s for indicator %s",
                response.status_code,
                indicator_code,
            )
            return empty_df

        data = response.json()
        if not isinstance(data, list) or len(data) < 2 or not isinstance(data[1], list):
            return empty_df

        records = data[1]
        rows = []
        for item in records:
            if not isinstance(item, dict):
                continue

            val = item.get("value")
            if val is None:
                continue

            date_val = str(item.get("date", "")).strip()
            if not date_val:
                continue

            # Normalize annual year values to full date "YYYY-01-01"
            if len(date_val) == 4 and date_val.isdigit():
                date_val = f"{date_val}-01-01"
            else:
                try:
                    date_val = pd.to_datetime(date_val).strftime("%Y-%m-%d")
                except Exception:
                    pass

            # Determine indicator name
            raw_indicator_info = item.get("indicator")
            default_label = (
                raw_indicator_info.get("value", indicator_code)
                if isinstance(raw_indicator_info, dict)
                else indicator_code
            )
            indicator_name = INDICATOR_NAMES.get(indicator_code, default_label)

            rows.append(
                {
                    "date": date_val,
                    "country": "IN",
                    "indicator_code": indicator_code,
                    "indicator_name": indicator_name,
                    "value": float(val),
                }
            )

        if not rows:
            return empty_df

        result = pd.DataFrame(rows)[ECONOMIC_DATA_COLUMNS]
        return result.reset_index(drop=True)

    except Exception as exc:
        logger.warning(
            "Failed to fetch India indicator %s from World Bank: %s",
            indicator_code,
            exc,
        )
        return empty_df
