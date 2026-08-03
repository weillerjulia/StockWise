from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import health, importacoes
from app.core.config import get_settings

app = FastAPI(title="StockWise API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[get_settings().frontend_origin],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(importacoes.router)
