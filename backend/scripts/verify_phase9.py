"""Verification script for Phase 9: Hypothesis Testing & Forecast Endpoints.

Tests the FastAPI endpoints in-process via TestClient:
- POST /api/hypothesis-test (valid monthly indicator & equity pair)
- POST /api/hypothesis-test (rejection of non-monthly/unsupported indicator codes with HTTP 400)
- GET /api/forecast/{ticker} (out-of-sample backtest & metrics)
- GET /api/forecast/{ticker} (404 error on invalid ticker)
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
    start_5y = (today - timedelta(days=5 * 365 + 30)).strftime("%Y-%m-%d")
    end_today = today.strftime("%Y-%m-%d")

    print("=" * 80)
    print(" >>> STEP 1: TEST POST /api/hypothesis-test (CPIAUCSL vs AAPL) <<<")
    print("=" * 80)
    payload_valid = {
        "indicator_code": "CPIAUCSL",
        "ticker": "AAPL",
        "start": start_5y,
        "end": end_today,
        "alpha": 0.05,
    }
    res = client.post("/api/hypothesis-test", json=payload_valid)
    print(f"Status Code: {res.status_code}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    hypo_json = res.json()
    print("Full Response:")
    print(json.dumps(hypo_json, indent=2))

    assert hypo_json["indicator_code"] == "CPIAUCSL"
    assert hypo_json["indicator_name"] == "Inflation (CPI)"
    assert hypo_json["ticker"] == "AAPL"
    assert -1.0 <= hypo_json["result"]["r"] <= 1.0
    assert 50 <= hypo_json["result"]["n_obs"] <= 70
    print(f"  Observed n_obs: {hypo_json['result']['n_obs']}, Pearson r: {hypo_json['result']['r']:.4f}")
    print("  CONFIRMED: Valid hypothesis test executed and returned expected schema.")

    print("\n" + "=" * 80)
    print(" >>> STEP 2: TEST POST /api/hypothesis-test WITH UNSUPPORTED 'GDP' <<<")
    print("=" * 80)
    payload_invalid_code = {
        "indicator_code": "GDP",
        "ticker": "AAPL",
        "start": start_5y,
        "end": end_today,
        "alpha": 0.05,
    }
    res = client.post("/api/hypothesis-test", json=payload_invalid_code)
    print(f"Status Code: {res.status_code}")
    assert res.status_code == 400, f"Expected 400, got {res.status_code}"
    error_detail = res.json()["detail"]
    print(f"Rejection Message: {error_detail}")
    expected_msg = (
        "Unsupported indicator_code 'GDP'. "
        "Supported (monthly-frequency, verified): CPIAUCSL, FEDFUNDS, UNRATE."
    )
    assert error_detail == expected_msg, (
        f"Detail mismatch!\nGot:      '{error_detail}'\nExpected: '{expected_msg}'"
    )
    print("  CONFIRMED: Non-monthly indicator 'GDP' rejected with exact HTTP 400 message.")

    print("\n" + "=" * 80)
    print(" >>> STEP 3: TEST GET /api/forecast/AAPL?window=20&test_size=60 <<<")
    print("=" * 80)
    res = client.get("/api/forecast/AAPL?window=20&test_size=60")
    print(f"Status Code: {res.status_code}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    forecast_json = res.json()
    print(f"Ticker: {forecast_json['ticker']}, Window: {forecast_json['window']}, Test Size: {forecast_json['test_size']}")
    print(f"Backtest entries count: {len(forecast_json['backtest'])}")
    assert len(forecast_json["backtest"]) == 60, f"Expected 60 backtest rows, got {len(forecast_json['backtest'])}"

    print("\nFirst 2 backtest predictions:")
    print(json.dumps(forecast_json["backtest"][:2], indent=2))

    print("\nEvaluation Metrics:")
    print(json.dumps(forecast_json["evaluation"], indent=2))
    assert forecast_json["evaluation"]["n_obs"] == 60
    assert forecast_json["evaluation"]["mae"] > 0
    assert forecast_json["evaluation"]["rmse"] > 0
    assert forecast_json["evaluation"]["mape"] > 0
    print("  CONFIRMED: Forecast endpoint produced backtest array of size 60 with complete metrics.")

    print("\n" + "=" * 80)
    print(" >>> STEP 4: TEST GET /api/forecast/INVALIDTICKER123 (404 ERROR) <<<")
    print("=" * 80)
    res = client.get("/api/forecast/INVALIDTICKER123")
    print(f"GET /api/forecast/INVALIDTICKER123 -> Status: {res.status_code}")
    assert res.status_code == 404, f"Expected 404, got {res.status_code}"
    print(f"Error detail: {res.json()['detail']}")
    assert "No data found for ticker 'INVALIDTICKER123'" in res.json()["detail"]
    print("  CONFIRMED: Invalid forecast ticker returns HTTP 404.")

    print("\n" + "=" * 80)
    print(" >>> ALL PHASE 9 VERIFICATION CHECKS PASSED SUCCESSFULLY <<<")
    print("=" * 80)


if __name__ == "__main__":
    verify()
