# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException
import pandas as pd

from app.data.economic_data import get_us_indicator
from app.data.market_data import get_market_data
from app.schemas.schemas import (
    Hypotheses,
    HypothesisTestRequest,
    HypothesisTestResponse,
    HypothesisTestResult,
    Period,
)
from app.statistics.hypothesis import run_correlation_hypothesis_test
from app.statistics.preprocessing import resample_to_period_returns

router = APIRouter(prefix="/api", tags=["Hypothesis Testing"])

SUPPORTED_INDICATORS = {
    "CPIAUCSL": "Inflation (CPI)",
    "FEDFUNDS": "Interest Rate",
    "UNRATE": "Unemployment Rate",
}


@router.post("/hypothesis-test", response_model=HypothesisTestResponse)
def perform_hypothesis_test(request: HypothesisTestRequest):
    """
    Statistically test the relationship between a monthly macroeconomic indicator
    and an asset's monthly equity returns.
    """
    code = request.indicator_code.strip()
    if code not in SUPPORTED_INDICATORS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported indicator_code '{request.indicator_code}'. "
                "Supported (monthly-frequency, verified): CPIAUCSL, FEDFUNDS, UNRATE."
            ),
        )

    indicator_name = SUPPORTED_INDICATORS[code]

    # 1. Fetch economic indicator data
    ind_df = get_us_indicator(code, start=request.start, end=request.end)
    if ind_df is None or ind_df.empty:
        raise HTTPException(
            status_code=404,
            detail=f"No data found for indicator '{code}' in the given range.",
        )

    # 2. Fetch asset market prices
    asset_df = get_market_data(request.ticker, start=request.start, end=request.end)
    if asset_df is None or asset_df.empty:
        raise HTTPException(
            status_code=404,
            detail=f"No data found for ticker '{request.ticker}' in the given range.",
        )

    # 3. Compute indicator MoM rate of change
    ind_series = pd.Series(ind_df["value"].values, index=ind_df["date"], name=code)
    ind_rate = ind_series.pct_change().dropna()

    # 4. Resample asset daily prices to monthly returns
    asset_prices = pd.Series(
        asset_df["close"].values, index=asset_df["date"], name=request.ticker
    )
    asset_monthly_returns = resample_to_period_returns(asset_prices, freq="M")

    # 5. Run generic Pearson correlation hypothesis test
    try:
        test_dict = run_correlation_hypothesis_test(
            ind_rate, asset_monthly_returns, alpha=request.alpha
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    h0_text = f"{code} has no significant relationship with {request.ticker}'s monthly returns."
    h1_text = f"{code} has a significant relationship with {request.ticker}'s monthly returns."

    return HypothesisTestResponse(
        indicator_code=code,
        indicator_name=indicator_name,
        ticker=request.ticker,
        period=Period(start=request.start, end=request.end),
        hypotheses=Hypotheses(h0=h0_text, h1=h1_text),
        result=HypothesisTestResult(
            r=test_dict["r"],
            p_value=test_dict["p_value"],
            alpha=test_dict["alpha"],
            n_obs=test_dict["n_obs"],
            reject_null=test_dict["reject_null"],
            interpretation=test_dict["interpretation"],
        ),
    )
