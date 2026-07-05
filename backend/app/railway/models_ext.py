"""
SQLAlchemy models for the real Indian Railways dataset.

Tables:
  railway_trains        - one row per train (train number, name, route metadata)
  railway_train_stops   - one row per station stop per train
  railway_dataset_imports - one row per import run (audit/metadata)

These tables are deliberately separate from the core Navix schema (cities,
stations, corridors) so the railway dataset can be imported, re-imported, or
wiped without touching any existing data.
"""

import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    ForeignKey, UniqueConstraint, Text
)
from sqlalchemy.orm import relationship
from app.database import Base


class RailwayTrain(Base):
    """
    Represents one Indian Railways train service.

    Source: Indian Railways Train Time Table
    License: National Data Sharing & Accessibility Policy (NDSAP) — Open Government Data License India v1.0
    """
    __tablename__ = "railway_trains"

    id = Column(Integer, primary_key=True, autoincrement=True)
    train_number   = Column(String(10), unique=True, nullable=False, index=True)
    train_name     = Column(String(200), nullable=False)
    train_type     = Column(String(50), nullable=True)   # Rajdhani, Shatabdi, Mail, Express ...
    zone           = Column(String(10), nullable=True)   # NR, SR, ER, WR, CR, SCR, SER, NER, NFR, ECR, WCR, NCR, SWR, SECR, ECoR, NWR, Metro

    from_station_code = Column(String(10), nullable=False)
    from_station_name = Column(String(200), nullable=False)
    to_station_code   = Column(String(10), nullable=False)
    to_station_name   = Column(String(200), nullable=False)

    # "Daily" | "Mon,Wed,Thu" | "Except Sun" etc.
    running_days      = Column(String(100), nullable=True, default="Daily")

    total_distance_km = Column(Float, nullable=True)
    total_stops       = Column(Integer, default=0)

    # Whether this train's source/destination match a known Navix station
    source_linked     = Column(Boolean, default=False)
    destination_linked = Column(Boolean, default=False)

    dataset_import_id = Column(Integer, ForeignKey("railway_dataset_imports.id"), nullable=True)

    stops = relationship("RailwayTrainStop", back_populates="train",
                         cascade="all, delete-orphan", order_by="RailwayTrainStop.stop_number")
    dataset_import = relationship("RailwayDatasetImport", back_populates="trains")


class RailwayTrainStop(Base):
    """One station stop for a train."""
    __tablename__ = "railway_train_stops"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    train_id     = Column(Integer, ForeignKey("railway_trains.id", ondelete="CASCADE"), nullable=False, index=True)
    stop_number  = Column(Integer, nullable=False)   # 1 = source, last = destination

    station_code = Column(String(10), nullable=False, index=True)
    station_name = Column(String(200), nullable=False)

    arrival_time   = Column(String(10), nullable=True)  # HH:MM or "--:--" for origin
    departure_time = Column(String(10), nullable=True)  # HH:MM or "--:--" for terminus
    halt_minutes   = Column(Integer, default=0)

    distance_from_source_km = Column(Float, default=0.0)

    # Whether station_code is resolved in the Navix stations table
    station_linked = Column(Boolean, default=False)

    train = relationship("RailwayTrain", back_populates="stops")

    __table_args__ = (
        UniqueConstraint("train_id", "stop_number", name="uix_train_stop"),
    )


class RailwayDatasetImport(Base):
    """
    Audit record for each import run.
    Allows tracking version history and re-imports.
    """
    __tablename__ = "railway_dataset_imports"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    dataset_name  = Column(String(200), nullable=False, default="Indian Railways Train Time Table")
    dataset_version = Column(String(50), nullable=True)
    source_url    = Column(String(500), nullable=True,
                           default="https://data.gov.in/catalog/indian-railway-train-time-table")
    license       = Column(String(200), nullable=True,
                           default="Open Government Data License India v1.0 (NDSAP)")
    import_date   = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    trains_imported   = Column(Integer, default=0)
    stops_imported    = Column(Integer, default=0)
    trains_skipped    = Column(Integer, default=0)
    validation_issues = Column(Integer, default=0)

    # "SUCCESS" | "PARTIAL" | "FAILED"
    status         = Column(String(20), default="SUCCESS")
    notes          = Column(Text, nullable=True)

    trains = relationship("RailwayTrain", back_populates="dataset_import")
