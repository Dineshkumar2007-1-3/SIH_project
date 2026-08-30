"""
routes/simulation.py — Generates realistic simulated sensor data for demo purposes.
Creates data with varying conditions that produce diverse risk levels.
"""

import random
import asyncio
from datetime import datetime
from fastapi import APIRouter

router = APIRouter(prefix="/simulation", tags=["simulation"])

# Monitored sites with realistic parameters
MONITOR_SITES = [
    {
        "name": "Munnar Hillside",
        "latitude": 10.0889,
        "longitude": 77.0595,
        "elevation_m": 1532,
        "slope_angle_range": (15, 45),
        "base_rainfall": 180,
        "risk_bias": 0.3,
    },
    {
        "name": "Wayanad Western Ghats",
        "latitude": 11.6854,
        "longitude": 76.1320,
        "elevation_m": 780,
        "slope_angle_range": (20, 55),
        "base_rainfall": 320,
        "risk_bias": 0.6,
    },
    {
        "name": "Cherrapunji Valley",
        "latitude": 25.2998,
        "longitude": 91.7003,
        "elevation_m": 1484,
        "slope_angle_range": (25, 60),
        "base_rainfall": 1100,
        "risk_bias": 0.7,
    },
    {
        "name": "Darjeeling Slopes",
        "latitude": 27.0410,
        "longitude": 88.2663,
        "elevation_m": 2200,
        "slope_angle_range": (30, 65),
        "base_rainfall": 250,
        "risk_bias": 0.4,
    },
    {
        "name": "Nilgiri Plateau",
        "latitude": 11.4085,
        "longitude": 76.7140,
        "elevation_m": 2240,
        "slope_angle_range": (10, 35),
        "base_rainfall": 150,
        "risk_bias": 0.2,
    },
    {
        "name": "Coorg Highlands",
        "latitude": 12.4244,
        "longitude": 75.7382,
        "elevation_m": 1170,
        "slope_angle_range": (18, 50),
        "base_rainfall": 200,
        "risk_bias": 0.35,
    },
    {
        "name": "Agumbe Ridge",
        "latitude": 13.4898,
        "longitude": 75.0945,
        "elevation_m": 640,
        "slope_angle_range": (22, 58),
        "base_rainfall": 750,
        "risk_bias": 0.55,
    },
    {
        "name": "Shillong Plateau Edge",
        "latitude": 25.5788,
        "longitude": 91.8933,
        "elevation_m": 1525,
        "slope_angle_range": (20, 48),
        "base_rainfall": 280,
        "risk_bias": 0.45,
    },
]


def generate_sensor_reading(site: dict) -> dict:
    """Generate a realistic sensor reading for a given site."""
    season_factor = random.uniform(0.2, 3.0)
    rainfall = max(0, site["base_rainfall"] * season_factor / 30 * random.uniform(0.5, 2.0))
    soil_moisture = min(100, 30 + rainfall * 0.3 + random.uniform(-10, 15))
    vegetation = max(0, min(100, random.uniform(40, 85) + random.uniform(-10, 10)))
    slope_angle = random.uniform(*site["slope_angle_range"])
    previous_landslides = random.randint(0, 5)

    return {
        "site_name": site["name"],
        "latitude": site["latitude"] + random.uniform(-0.01, 0.01),
        "longitude": site["longitude"] + random.uniform(-0.01, 0.01),
        "rainfall_mm": round(rainfall, 2),
        "slope_angle": round(slope_angle, 2),
        "soil_moisture": round(soil_moisture, 2),
        "vegetation_cover": round(vegetation, 2),
        "elevation_m": site["elevation_m"] + random.uniform(-50, 50),
        "previous_landslides": previous_landslides,
    }


def _rule_based_prediction(reading: dict, risk_bias: float = 0.3) -> dict:
    """Fallback rule-based prediction when ML model is not available."""
    score = 0.0

    rainfall = reading.get("rainfall_mm", 0)
    if rainfall > 200:
        score += 30
    elif rainfall > 100:
        score += 20
    elif rainfall > 50:
        score += 10

    slope = reading.get("slope_angle", 0)
    if slope > 50:
        score += 25
    elif slope > 35:
        score += 15
    elif slope > 20:
        score += 8

    moisture = reading.get("soil_moisture", 0)
    if moisture > 80:
        score += 25
    elif moisture > 60:
        score += 15
    elif moisture > 40:
        score += 8

    prev = reading.get("previous_landslides", 0)
    score += min(10, prev * 3)

    veg = reading.get("vegetation_cover", 50)
    vegetation_reduction = max(0, (veg - 50) / 50 * 10)
    score -= vegetation_reduction

    score = score * (1 + risk_bias)
    score = max(0, min(100, score))

    probability = score / 100.0

    if probability >= 0.75:
        level = "critical"
        label = 1
    elif probability >= 0.5:
        level = "high"
        label = 1
    elif probability >= 0.25:
        level = "moderate"
        label = 0
    else:
        level = "low"
        label = 0

    return {
        "risk_label": label,
        "risk_probability": round(probability, 4),
        "risk_level": level,
    }


async def run_simulation_cycle():
    """Run a single simulation cycle across all monitored sites.
    This is a plain async function — no FastAPI dependency injection needed,
    so it can be called from background workers too.
    """
    from database import SessionLocal
    from models.db_models import SensorReading, RiskPrediction, Alert
    from models.schemas import SensorReadingIn
    from prediction import get_risk_prediction

    results = []
    db = SessionLocal()

    try:
        for site in MONITOR_SITES:
            reading_data = generate_sensor_reading(site)
            reading = SensorReadingIn(**reading_data)

            db_reading = SensorReading(**reading.model_dump())
            db.add(db_reading)
            db.commit()
            db.refresh(db_reading)

            try:
                result = get_risk_prediction(
                    {
                        "rainfall_mm": reading.rainfall_mm,
                        "slope_angle": reading.slope_angle,
                        "soil_moisture": reading.soil_moisture,
                        "vegetation_cover": reading.vegetation_cover,
                        "elevation_m": reading.elevation_m,
                        "previous_landslides": reading.previous_landslides,
                    }
                )
            except RuntimeError:
                result = _rule_based_prediction(reading_data, site["risk_bias"])

            db_prediction = RiskPrediction(
                sensor_reading_id=db_reading.id,
                site_name=reading.site_name,
                risk_label=result["risk_label"],
                risk_probability=result["risk_probability"],
                risk_level=result["risk_level"],
            )
            db.add(db_prediction)

            if result["risk_level"] in ("high", "critical"):
                db.add(
                    Alert(
                        site_name=reading.site_name,
                        risk_level=result["risk_level"],
                        message=(
                            f"{result['risk_level'].upper()} landslide risk detected at "
                            f"{reading.site_name} — rainfall {reading.rainfall_mm:.0f}mm, "
                            f"soil moisture {reading.soil_moisture:.0f}%, "
                            f"probability {result['risk_probability']:.0%}."
                        ),
                        latitude=reading.latitude,
                        longitude=reading.longitude,
                    )
                )

            db.commit()

            # Broadcast via WebSocket
            try:
                from main import manager
                prediction_data = {
                    "id": db_prediction.id,
                    "site_name": db_prediction.site_name,
                    "risk_label": db_prediction.risk_label,
                    "risk_probability": float(db_prediction.risk_probability),
                    "risk_level": db_prediction.risk_level,
                    "created_at": db_prediction.created_at.isoformat() if db_prediction.created_at else None,
                }
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    loop.create_task(manager.broadcast_prediction(prediction_data))
            except Exception:
                pass

            results.append({
                "site": site["name"],
                "reading": reading_data,
                "prediction": {
                    "risk_level": result["risk_level"],
                    "risk_probability": result["risk_probability"],
                },
            })
    finally:
        db.close()

    return {
        "status": "ok",
        "sites_processed": len(results),
        "results": results,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.post("/generate")
async def generate_simulation_data():
    """Generate one round of simulated data across all monitored sites."""
    return await run_simulation_cycle()


@router.post("/start")
async def start_continuous_simulation(interval_seconds: int = 30):
    """Start continuous simulation (generates data at interval)."""
    async def run_simulation():
        while True:
            try:
                await run_simulation_cycle()
            except Exception as e:
                print(f"Simulation error: {e}")
            await asyncio.sleep(interval_seconds)

    asyncio.create_task(run_simulation())
    return {"status": "started", "interval_seconds": interval_seconds}


@router.get("/sites")
def get_monitored_sites():
    """Return list of all monitored sites."""
    return [
        {
            "name": s["name"],
            "latitude": s["latitude"],
            "longitude": s["longitude"],
            "elevation_m": s["elevation_m"],
        }
        for s in MONITOR_SITES
    ]
