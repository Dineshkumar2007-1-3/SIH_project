"""
routes/predictions.py — Accepts sensor readings, scores landslide risk,
and persists both the reading and the prediction. Auto-creates an Alert
when risk is high or critical.
"""

from datetime import datetime
import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.db_models import SensorReading, RiskPrediction, Alert
from models.schemas import SensorReadingIn, PredictionOut
from prediction import get_risk_prediction

router = APIRouter(prefix="/predictions", tags=["predictions"])


# Import the manager from main (circular import workaround)
def get_manager():
    from main import manager
    return manager


@router.post("/", response_model=PredictionOut)
def create_prediction(reading: SensorReadingIn, db: Session = Depends(get_db)):
    # Persist the raw sensor reading
    db_reading = SensorReading(**reading.model_dump())
    db.add(db_reading)
    db.commit()
    db.refresh(db_reading)

    # Run the ML model
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
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    db_prediction = RiskPrediction(
        sensor_reading_id=db_reading.id,
        site_name=reading.site_name,
        risk_label=result["risk_label"],
        risk_probability=result["risk_probability"],
        risk_level=result["risk_level"],
    )
    db.add(db_prediction)

    # Auto-generate an alert for elevated risk
    if result["risk_level"] in ("high", "critical"):
        db.add(
            Alert(
                site_name=reading.site_name,
                risk_level=result["risk_level"],
                message=(
                    f"{result['risk_level'].upper()} landslide risk detected at "
                    f"{reading.site_name} (probability {result['risk_probability']:.0%})."
                ),
                latitude=reading.latitude,
                longitude=reading.longitude,
            )
        )

    db.commit()
    db.refresh(db_prediction)

    # Broadcast new prediction via WebSocket
    try:
        manager = get_manager()
        prediction_data = {
            "id": db_prediction.id,
            "site_name": db_prediction.site_name,
            "risk_label": db_prediction.risk_label,
            "risk_probability": float(db_prediction.risk_probability),
            "risk_level": db_prediction.risk_level,
            "created_at": db_prediction.created_at.isoformat() if db_prediction.created_at else None,
        }
        # Note: In a real app, we'd use background tasks to avoid blocking
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(manager.broadcast_prediction(prediction_data))
            else:
                asyncio.run(manager.broadcast_prediction(prediction_data))
        except:
            # Fallback if asyncio fails
            pass
    except:
        # Don't let WebSocket errors break the main flow
        pass

    return db_prediction


@router.get("/site/{site_name}", response_model=list[PredictionOut])
def get_predictions_for_site(site_name: str, db: Session = Depends(get_db)):
    return (
        db.query(RiskPrediction)
        .filter(RiskPrediction.site_name == site_name)
        .order_by(RiskPrediction.created_at.desc())
        .all()
    )


@router.get("/", response_model=list[PredictionOut])
def list_predictions(limit: int = 50, db: Session = Depends(get_db)):
    return (
        db.query(RiskPrediction)
        .order_by(RiskPrediction.created_at.desc())
        .limit(limit)
        .all()
    )
