"""Verification script for Phase 8: FastAPI Asset & Portfolio Endpoints.

Tests the FastAPI REST API in-process via starlette/fastapi TestClient:
- Asset price endpoint with write-through persistence
- Asset analytics with auto-benchmark selection (^GSPC vs ^NSEI)
- JSON null representation for incomplete moving averages
- Mixed multi-asset portfolio analysis with normalized weights
- Error handling (404) on invalid asset and portfolio tickers
"""

from datetime import datetime, timedelta
import json
from pathlib import Path
import sys

# Ensure backend root is in python path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# pyrefly: ignore [missing-import]
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def verify():
    today = datetime.today()
    start_30d = (today - timedelta(days=30)).strftime("%Y-%m-%d")
    start_1y = (today - timedelta(days=365)).strftime("%Y-%m-%d")
    end_today = today.strftime("%Y-%m-%d")

    print("=" * 80)
    print(" >>> STEP 1: TEST GET /api/assets/AAPL/prices <<<")
    print("=" * 80)
    res = client.get(f"/api/assets/AAPL/prices?start={start_30d}&end={end_today}")
    print(f"Status Code: {res.status_code}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    prices_json = res.json()
    print(f"Ticker: {prices_json['ticker']}, Period: {prices_json['start']} to {prices_json['end']}")
    print(f"Total price points: {len(prices_json['data'])}")
    print("First 2 price points:")
    print(json.dumps(prices_json["data"][:2], indent=2))
    assert len(prices_json["data"]) > 0, "Price points list is empty"

    print("\n" + "=" * 80)
    print(" >>> STEP 2: TEST GET /api/assets/AAPL/analytics & NULL JSON VERIFICATION <<<")
    print("=" * 80)
    res = client.get(f"/api/assets/AAPL/analytics?start={start_1y}&end={end_today}")
    print(f"Status Code: {res.status_code}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    analytics_json = res.json()
    print(f"Ticker: {analytics_json['ticker']}, Benchmark Used: {analytics_json['benchmark_used']}")
    assert analytics_json["benchmark_used"] == "^GSPC", f"Expected ^GSPC, got {analytics_json['benchmark_used']}"

    print("\nMetrics:")
    print(json.dumps(analytics_json["metrics"], indent=2))

    # Verify JSON null values for early moving averages
    raw_text = res.text
    first_ma = analytics_json["moving_averages"][0]
    print(f"\nFirst moving average record (Python parsed): {first_ma}")
    assert first_ma["sma_200"] is None, "Expected sma_200 to be None (JSON null) on day 1"

    # Confirm raw JSON contains '"sma_200": null' not 'NaN'
    assert '"sma_200": null' in raw_text or '"sma_200":null' in raw_text, (
        "Raw response must contain JSON null for sma_200, not NaN!"
    )
    assert "NaN" not in raw_text, "Found invalid 'NaN' string in raw JSON response!"
    print("  CONFIRMED: Early moving averages serialize to valid JSON null (not NaN).")

    print("\n" + "=" * 80)
    print(" >>> STEP 3: TEST GET /api/assets/RELIANCE.NS/analytics (BENCHMARK AUTO-SELECTION) <<<")
    print("=" * 80)
    res = client.get(f"/api/assets/RELIANCE.NS/analytics?start={start_1y}&end={end_today}")
    print(f"Status Code: {res.status_code}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    reliance_json = res.json()
    print(f"Ticker: {reliance_json['ticker']}, Benchmark Used: {reliance_json['benchmark_used']}")
    assert reliance_json["benchmark_used"] == "^NSEI", (
        f"Expected auto-selected benchmark ^NSEI for .NS ticker, got {reliance_json['benchmark_used']}"
    )
    print("  CONFIRMED: Indian equity (.NS) automatically assigned ^NSEI benchmark.")

    print("\n" + "=" * 80)
    print(" >>> STEP 4: TEST POST /api/portfolio/analyze (MIXED PORTFOLIO) <<<")
    print("=" * 80)
    payload = {
        "holdings": [
            {"ticker": "AAPL", "weight": 40},
            {"ticker": "MSFT", "weight": 30},
            {"ticker": "RELIANCE.NS", "weight": 30},
        ],
        "start": start_1y,
        "end": end_today,
    }
    res = client.post("/api/portfolio/analyze", json=payload)
    print(f"Status Code: {res.status_code}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    port_json = res.json()

    print("\nNormalized Holdings:")
    for h in port_json["holdings"]:
        print(f"  {h['ticker']:15}: {h['weight']:.4f}")

    total_weight = sum(h["weight"] for h in port_json["holdings"])
    print(f"  Sum of weights : {total_weight:.6f}")
    assert abs(total_weight - 1.0) < 1e-6, f"Weights do not sum to 1.0: {total_weight}"

    # Verify portfolio_value_index starts at 100.0
    day1_val = port_json["portfolio_value_index"][0]["value"]
    print(f"\nPortfolio Value Index (Day 1): {day1_val:.4f}")
    assert abs(day1_val - 100.0) < 1e-6, f"Expected 100.0 on Day 1, got {day1_val}"

    print("\nPortfolio Metrics:")
    print(json.dumps(port_json["metrics"], indent=2))

    print("\n" + "=" * 80)
    print(" >>> STEP 5: TEST 404 ERROR ON INVALID ASSET TICKER <<<")
    print("=" * 80)
    res = client.get(f"/api/assets/INVALIDTICKER123/prices?start={start_30d}&end={end_today}")
    print(f"GET /api/assets/INVALIDTICKER123/prices -> Status: {res.status_code}")
    assert res.status_code == 404, f"Expected 404, got {res.status_code}"
    print(f"Error detail: {res.json()['detail']}")
    assert "No data found for ticker 'INVALIDTICKER123'" in res.json()["detail"]
    print("  CONFIRMED: Invalid ticker returns 404 with descriptive detail.")

    print("\n" + "=" * 80)
    print(" >>> STEP 6: TEST 404 ERROR ON INVALID TICKER IN PORTFOLIO <<<")
    print("=" * 80)
    bad_portfolio = {
        "holdings": [
            {"ticker": "AAPL", "weight": 50},
            {"ticker": "INVALIDTICKER999", "weight": 50},
        ],
        "start": start_30d,
        "end": end_today,
    }
    res = client.post("/api/portfolio/analyze", json=bad_portfolio)
    print(f"POST /api/portfolio/analyze with bad ticker -> Status: {res.status_code}")
    assert res.status_code == 404, f"Expected 404, got {res.status_code}"
    error_detail = res.json()["detail"]
    print(f"Error detail: {error_detail}")
    assert "INVALIDTICKER999" in error_detail, (
        f"Expected detail to explicitly name 'INVALIDTICKER999', got: {error_detail}"
    )
    print("  CONFIRMED: Portfolio endpoint fails fast with 404 naming the failed ticker.")

    print("\n" + "=" * 80)
    print(" >>> ALL PHASE 8 API ENDPOINT VERIFICATIONS PASSED <<<")
    print("=" * 80)


if __name__ == "__main__":
    verify()
