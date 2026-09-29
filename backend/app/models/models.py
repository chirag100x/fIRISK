from sqlalchemy import Column, Date, Float, Integer, String, UniqueConstraint
from app.models.database import Base


class MarketPrice(Base):
    """
    Historical daily OHLCV market prices for US and Indian equities.
    Mirrors Phase 2 market data contract with an auto-incrementing ID.
    """

    __tablename__ = "market_prices"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(Date, nullable=False, index=True)
    ticker = Column(String, nullable=False, index=True)
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    adj_close = Column(Float, nullable=False)
    volume = Column(Float, nullable=False)

    __table_args__ = (
        UniqueConstraint("ticker", "date", name="uq_market_prices_ticker_date"),
    )

    def __repr__(self) -> str:
        return f"<MarketPrice(ticker='{self.ticker}', date='{self.date}', close={self.close})>"


class EconomicIndicator(Base):
    """
    Macroeconomic indicators for US (FRED) and India (World Bank).
    Mirrors Phase 2 economic data contract with an auto-incrementing ID.
    """

    __tablename__ = "economic_indicators"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(Date, nullable=False, index=True)
    country = Column(String, nullable=False, index=True)
    indicator_code = Column(String, nullable=False, index=True)
    indicator_name = Column(String, nullable=False)
    value = Column(Float, nullable=False)

    __table_args__ = (
        UniqueConstraint(
            "country",
            "indicator_code",
            "date",
            name="uq_econ_ind_country_code_date",
        ),
    )

    def __repr__(self) -> str:
        return (
            f"<EconomicIndicator(country='{self.country}', "
            f"code='{self.indicator_code}', date='{self.date}', value={self.value})>"
        )
