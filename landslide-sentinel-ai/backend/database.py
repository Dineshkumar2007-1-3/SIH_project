"""
database.py — SQLAlchemy engine, session, and declarative base.

Uses SQLite by default (zero setup). Swap DATABASE_URL for Postgres/MySQL
in production, e.g.:
    postgresql://user:password@localhost:5432/landslide_sentinel
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./landslide_sentinel.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a DB session and closes it afterward."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables. Call once on startup."""
    from models import db_models  # noqa: F401  (ensures models are registered)

    Base.metadata.create_all(bind=engine)
