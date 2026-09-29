def get_benchmark_ticker(ticker: str) -> str:
    """
    Auto-select the benchmark market index for a given asset ticker.

    Rule:
        - Ticker ending with '.NS' -> '^NSEI' (NIFTY 50)
        - Otherwise -> '^GSPC' (S&P 500)
    """
    if ticker.strip().upper().endswith(".NS"):
        return "^NSEI"
    return "^GSPC"
