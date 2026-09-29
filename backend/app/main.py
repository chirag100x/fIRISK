# pyrefly: ignore [missing-import]
from fastapi import FastAPI

app = FastAPI(title="P_049 - Financial Risk Analytics & Forecasting Tool")


@app.get("/health")
def health():
    return {"status": "ok"}
