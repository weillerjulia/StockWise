from fastapi import FastAPI

from app.api import health, importacoes

app = FastAPI(title="StockWise API")

app.include_router(health.router)
app.include_router(importacoes.router)
