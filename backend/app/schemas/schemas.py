from typing import List, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Common / Shared Schemas
# ---------------------------------------------------------------------------
class Period(BaseModel):
    start: str
    end: str


class DrawdownMetric(BaseModel):
    value: float
    peak_date: Optional[str] = None
    trough_date: Optional[str] = None


class Metrics(BaseModel):
    volatility: float
    beta: float
    sharpe_ratio: float
    max_drawdown: DrawdownMetric
    historical_var_95: float


# ---------------------------------------------------------------------------
# Asset Price & Analytics Schemas
# ---------------------------------------------------------------------------
class PricePoint(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    adj_close: float
    volume: float


class PricesResponse(BaseModel):
    ticker: str
    start: str
    end: str
    data: List[PricePoint]


class MovingAveragePoint(BaseModel):
    date: str
    sma_7: Optional[float] = None
    sma_20: Optional[float] = None
    sma_50: Optional[float] = None
    sma_200: Optional[float] = None


class AnalyticsResponse(BaseModel):
    ticker: str
    benchmark_used: str
    period: Period
    metrics: Metrics
    moving_averages: List[MovingAveragePoint]


# ---------------------------------------------------------------------------
# Portfolio Schemas
# ---------------------------------------------------------------------------
class Holding(BaseModel):
    ticker: str
    weight: float = Field(..., description="Asset weight (raw or normalized)")


class PortfolioAnalyzeRequest(BaseModel):
    holdings: List[Holding]
    start: str
    end: str


class PortfolioIndexPoint(BaseModel):
    date: str
    value: float


class PortfolioAnalyzeResponse(BaseModel):
    holdings: List[Holding]
    period: Period
    portfolio_value_index: List[PortfolioIndexPoint]
    metrics: Metrics
