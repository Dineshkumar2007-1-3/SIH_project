"""
schemas.py — Pydantic models for request validation and API responses.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ---------- Sensor readings / predictions ----------

class SensorReadingIn(BaseModel):
    site_name: str
    latitude: float
    longitude: float
    rainfall_mm: float = Field(ge=0)
    slope_angle: float = Field(ge=0, le=90)
    soil_moisture: float = Field(ge=0, le=100)
    vegetation_cover: float = Field(ge=0, le=100)
    elevation_m: float = Field(ge=0)
    previous_landslides: int = Field(ge=0, default=0)


class PredictionOut(BaseModel):
    site_name: str
    risk_label: int
    risk_probability: float
    risk_level: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Alerts ----------

class AlertOut(BaseModel):
    id: int
    site_name: str
    risk_level: str
    message: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_resolved: int
    created_at: datetime

    class Config:
        from_attributes = True


class AlertCreate(BaseModel):
    site_name: str
    risk_level: str
    message: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


# ---------- Reports ----------

class ReportCreate(BaseModel):
    reporter_name: Optional[str] = None
    site_name: str
    description: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    severity: Optional[str] = "unverified"


class ReportOut(ReportCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
