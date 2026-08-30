"""
routes/alerts.py — CRUD-lite endpoints for landslide alerts.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.db_models import Alert
from models.schemas import AlertOut, AlertCreate

router = APIRouter(prefix="/alerts", tags=["alerts"])


# Import the manager from main (circular import workaround)
def get_manager():
    from main import manager
    return manager


@router.get("/", response_model=list[AlertOut])
def list_alerts(active_only: bool = True, db: Session = Depends(get_db)):
    query = db.query(Alert)
    if active_only:
        query = query.filter(Alert.is_resolved == 0)
    return query.order_by(Alert.created_at.desc()).all()


@router.post("/", response_model=AlertOut)
def create_alert(alert: AlertCreate, db: Session = Depends(get_db)):
    db_alert = Alert(**alert.model_dump())
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)

    # Broadcast new alert via WebSocket
    try:
        manager = get_manager()
        alert_data = {
            "id": db_alert.id,
            "site_name": db_alert.site_name,
            "risk_level": db_alert.risk_level,
            "message": db_alert.message,
            "latitude": float(db_alert.latitude) if db_alert.latitude is not None else None,
            "longitude": float(db_alert.longitude) if db_alert.longitude is not None else None,
            "is_resolved": db_alert.is_resolved,
            "created_at": db_alert.created_at.isoformat() if db_alert.created_at else None,
        }
        # Note: In a real app, we'd use background tasks to avoid blocking
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(manager.broadcast_alert(alert_data))
            else:
                asyncio.run(manager.broadcast_alert(alert_data))
        except:
            # Fallback if asyncio fails
            pass
    except:
        # Don't let WebSocket errors break the main flow
        pass

    return db_alert


@router.patch("/{alert_id}/resolve", response_model=AlertOut)
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    db_alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not db_alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    db_alert.is_resolved = 1
    db.commit()
    db.refresh(db_alert)

    # Broadcast alert update via WebSocket
    try:
        manager = get_manager()
        alert_data = {
            "id": db_alert.id,
            "site_name": db_alert.site_name,
            "risk_level": db_alert.risk_level,
            "message": db_alert.message,
            "latitude": float(db_alert.latitude) if db_alert.latitude is not None else None,
            "longitude": float(db_alert.longitude) if db_alert.longitude is not None else None,
            "is_resolved": db_alert.is_resolved,
            "created_at": db_alert.created_at.isoformat() if db_alert.created_at else None,
        }
        # Note: In a real app, we'd use background tasks to avoid blocking
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(manager.broadcast_alert(alert_data))
            else:
                asyncio.run(manager.broadcast_alert(alert_data))
        except:
            # Fallback if asyncio fails
            pass
    except:
        # Don't let WebSocket errors break the main flow
        pass

    return db_alert
