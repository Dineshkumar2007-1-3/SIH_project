"""
db_models.py — SQLAlchemy ORM table definitions.
"""

from datetime import datetime

from sqlalchemy import Column, Integer, Float, String, DateTime, Text
from database import Base


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    site_name = Column(String, index=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    rainfall_mm = Column(Float, nullable=False)
    slope_angle = Column(Float, nullable=False)
    soil_moisture = Column(Float, nullable=False)
    vegetation_cover = Column(Float, nullable=False)
    elevation_m = Column(Float, nullable=False)
    previous_landslides = Column(Integer, default=0)
    recorded_at = Column(DateTime, default=datetime.utcnow)


class RiskPrediction(Base):
    __tablename__ = "risk_predictions"

    id = Column(Integer, primary_key=True, index=True)
    sensor_reading_id = Column(Integer, index=True, nullable=True)
    site_name = Column(String, index=True, nullable=False)
    risk_label = Column(Integer, nullable=False)  # 0 = low/no risk, 1 = high risk
    risk_probability = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)  # low | moderate | high | critical
    created_at = Column(DateTime, default=datetime.utcnow)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    site_name = Column(String, index=True, nullable=False)
    risk_level = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_resolved = Column(Integer, default=0)  # 0 = active, 1 = resolved
    created_at = Column(DateTime, default=datetime.utcnow)


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_name = Column(String, nullable=True)
    site_name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    severity = Column(String, default="unverified")  # unverified | low | medium | high
    created_at = Column(DateTime, default=datetime.utcnow)
