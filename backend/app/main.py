# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware

from app.api.assets import router as assets_router
from app.api.forecast import router as forecast_router
from app.api.hypothesis import router as hypothesis_router
from app.api.portfolio import router as portfolio_router

app = FastAPI(title="P_049 - Financial Risk Analytics & Forecasting Tool")

# Enable CORS for frontend interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


# Mount API routers
app.include_router(assets_router)
app.include_router(portfolio_router)
app.include_router(hypothesis_router)
app.include_router(forecast_router)
