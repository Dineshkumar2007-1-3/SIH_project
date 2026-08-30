"""
main.py — FastAPI application entrypoint for Landslide Sentinel AI.

Run locally:
    uvicorn main:app --reload --port 8000

Docs available at http://localhost:8000/docs
"""

import json
import asyncio
from typing import Set
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routes import predictions, alerts, reports, simulation, world

app = FastAPI(
    title="Landslide Sentinel AI",
    description="Backend API for real-time landslide risk prediction, alerts, and field reports.",
    version="1.0.0",
)

# Allow the Next.js frontend (default dev port 3000) to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predictions.router)
app.include_router(alerts.router)
app.include_router(reports.router)
app.include_router(simulation.router)
app.include_router(world.router)


# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast_prediction(self, prediction: dict):
        message = json.dumps({"type": "prediction", "data": prediction})
        await self._broadcast(message)

    async def broadcast_alert(self, alert: dict):
        message = json.dumps({"type": "alert", "data": alert})
        await self._broadcast(message)

    async def broadcast_report(self, report: dict):
        message = json.dumps({"type": "report", "data": report})
        await self._broadcast(message)

    async def broadcast_stats(self, stats: dict):
        message = json.dumps({"type": "stats", "data": stats})
        await self._broadcast(message)

    async def _broadcast(self, message: str):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.active_connections.discard(conn)


manager = ConnectionManager()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming client messages if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)


@app.on_event("startup")
async def on_startup():
    init_db()
    # Start background data generation
    asyncio.create_task(background_simulation_worker())


async def background_simulation_worker():
    """Periodically generate simulated sensor data."""
    # Wait a moment for the app to fully start
    await asyncio.sleep(5)

    while True:
        try:
            # Generate simulation data
            from routes.simulation import run_simulation_cycle
            await run_simulation_cycle()
            # Wait 30 seconds between generations
            await asyncio.sleep(30)
        except Exception as e:
            print(f"Background simulation error: {e}")
            await asyncio.sleep(60)


@app.get("/")
def root():
    return {"status": "ok", "service": "landslide-sentinel-ai-backend", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}
