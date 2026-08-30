"""
routes/reports.py — Community/field reports of observed ground movement,
cracks, etc. Separate from ML-driven predictions; these are human-submitted.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.db_models import Report
from models.schemas import ReportCreate, ReportOut

router = APIRouter(prefix="/reports", tags=["reports"])


# Import the manager from main (circular import workaround)
def get_manager():
    from main import manager
    return manager


@router.get("/", response_model=list[ReportOut])
def list_reports(db: Session = Depends(get_db)):
    return db.query(Report).order_by(Report.created_at.desc()).all()


@router.post("/", response_model=ReportOut)
def create_report(report: ReportCreate, db: Session = Depends(get_db)):
    db_report = Report(**report.model_dump())
    db.add(db_report)
    db.commit()
    db.refresh(db_report)

    # Broadcast new report via WebSocket
    try:
        manager = get_manager()
        report_data = {
            "id": db_report.id,
            "reporter_name": db_report.reporter_name,
            "site_name": db_report.site_name,
            "description": db_report.description,
            "latitude": float(db_report.latitude) if db_report.latitude is not None else None,
            "longitude": float(db_report.longitude) if db_report.longitude is not None else None,
            "severity": db_report.severity,
            "created_at": db_report.created_at.isoformat() if db_report.created_at else None,
        }
        # Note: In a real app, we'd use background tasks to avoid blocking
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                loop.create_task(manager.broadcast_report(report_data))
            else:
                asyncio.run(manager.broadcast_report(report_data))
        except:
            # Fallback if asyncio fails
            pass
    except:
        # Don't let WebSocket errors break the main flow
        pass

    return db_report


@router.get("/{report_id}", response_model=ReportOut)
def get_report(report_id: int, db: Session = Depends(get_db)):
    db_report = db.query(Report).filter(Report.id == report_id).first()
    if not db_report:
        raise HTTPException(status_code=404, detail="Report not found")
    return db_report
