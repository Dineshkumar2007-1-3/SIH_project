"""
main.py — FastAPI application entrypoint for Landslide Sentinel AI.

Run locally:
    uvicorn main:app --reload --port 8000

Docs available at http://localhost:8000/docs
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routes import predictions, alerts, reports

app = FastAPI(
    title="Landslide Sentinel AI",
    description="Backend API for landslide risk prediction, alerts, and field reports.",
    version="0.1.0",
)

# Allow the Next.js frontend (default dev port 3000) to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predictions.router)
app.include_router(alerts.router)
app.include_router(reports.router)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/")
def root():
    return {"status": "ok", "service": "landslide-sentinel-ai-backend"}


@app.get("/health")
def health():
    return {"status": "healthy"}
