from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base

# Import railway dataset models so they are registered with Base.metadata
# and created by Base.metadata.create_all()
from app.railway.models_ext import RailwayTrain, RailwayTrainStop, RailwayDatasetImport  # noqa: F401


class City(Base):
    __tablename__ = "cities"

    id = Column(Integer, primary_key=True, autoincrement=True)
    city_name = Column(String(100), unique=True, nullable=False, index=True)
    state = Column(String(100), nullable=True)
    tier = Column(String(50), nullable=True)
    importance_score = Column(Integer, default=50)
    demand_category = Column(String(50), default="Standard")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    has_airport = Column(Boolean, default=False)
    has_train_station = Column(Boolean, default=True)
    code = Column(String(10), nullable=True)
    station = Column(String(50), nullable=True)

    # Relationships
    stations = relationship("Station", back_populates="city", cascade="all, delete-orphan")
    nearby_mappings = relationship("NearbyStationMapping", back_populates="city", cascade="all, delete-orphan")

class Station(Base):
    __tablename__ = "stations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    station_code = Column(String(10), unique=True, nullable=False, index=True)
    station_name = Column(String(200), nullable=False)
    city_id = Column(Integer, ForeignKey("cities.id", ondelete="CASCADE"), nullable=True)
    station_type = Column(String(50), nullable=True)  # e.g., "Rail", "Bus", "Airport"
    importance_score = Column(Integer, default=50)

    # Relationships
    city = relationship("City", back_populates="stations")
    nearby_mappings = relationship("NearbyStationMapping", back_populates="station", cascade="all, delete-orphan")

class NearbyStationMapping(Base):
    __tablename__ = "nearby_station_mappings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    city_id = Column(Integer, ForeignKey("cities.id", ondelete="CASCADE"), nullable=False)
    station_id = Column(Integer, ForeignKey("stations.id", ondelete="CASCADE"), nullable=False)
    distance_km = Column(Float, default=0.0)

    # Relationships
    city = relationship("City", back_populates="nearby_mappings")
    station = relationship("Station", back_populates="nearby_mappings")

    __table_args__ = (
        UniqueConstraint("city_id", "station_id", name="uix_city_station"),
    )

class Corridor(Base):
    __tablename__ = "corridors"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source_city_id = Column(Integer, ForeignKey("cities.id", ondelete="CASCADE"), nullable=False)
    destination_city_id = Column(Integer, ForeignKey("cities.id", ondelete="CASCADE"), nullable=False)
    demand_level = Column(String(50), default="Moderate")  # e.g., "High", "Extreme"
    migration_relevance = Column(String(100), nullable=True)
    seasonal_pressure = Column(String(100), nullable=True)
    avg_duration = Column(String(50), nullable=True)  # e.g., "14h"

    # Relationships
    source_city = relationship("City", foreign_keys=[source_city_id])
    destination_city = relationship("City", foreign_keys=[destination_city_id])

    __table_args__ = (
        UniqueConstraint("source_city_id", "destination_city_id", name="uix_source_destination"),
    )

class SeasonalDemand(Base):
    __tablename__ = "seasonal_demands"

    id = Column(Integer, primary_key=True, autoincrement=True)
    festival_name = Column(String(100), unique=True, nullable=False, index=True)
    start_month = Column(Integer, nullable=False)
    start_day = Column(Integer, nullable=False)
    end_month = Column(Integer, nullable=False)
    end_day = Column(Integer, nullable=False)
    seat_modifier = Column(Float, default=1.0)
    comfort_modifier = Column(Integer, default=0)
    price_multiplier = Column(Float, default=1.0)
    crowd_modifier = Column(Integer, default=0)
    description = Column(String(500), nullable=True)

from sqlalchemy import DateTime
import datetime

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    operation = Column(String(50), nullable=False)  # CREATED, UPDATED, DELETED, IMPORTED
    entity = Column(String(100), nullable=False)    # City, Station, Corridor, etc.
    record_id = Column(String(50), nullable=True)
    details = Column(String(1000), nullable=True)


class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String(100), primary_key=True)
    value = Column(String(500), nullable=False)
    description = Column(String(500), nullable=True)
    category = Column(String(50), default="General")


class SearchLog(Base):
    __tablename__ = "search_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    source = Column(String(100), nullable=False)
    destination = Column(String(100), nullable=False)
    date = Column(String(20), nullable=True)
    success = Column(Boolean, default=True)
    results_count = Column(Integer, default=0)
    response_time_ms = Column(Float, default=0.0)
    error_message = Column(String(500), nullable=True)


class APIMetric(Base):
    __tablename__ = "api_metrics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    path = Column(String(200), nullable=False)
    method = Column(String(10), nullable=False)
    status_code = Column(Integer, nullable=False)
    response_time_ms = Column(Float, default=0.0)


class SyncHistory(Base):
    __tablename__ = "sync_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    provider = Column(String(100), nullable=False)
    target = Column(String(100), nullable=False)
    start_time = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    end_time = Column(DateTime, nullable=True)
    duration = Column(Float, nullable=True)
    new_records = Column(Integer, default=0)
    updated_records = Column(Integer, default=0)
    removed_records = Column(Integer, default=0)
    validation_errors = Column(Integer, default=0)
    status = Column(String(50), default="RUNNING")  # SUCCESS, FAILED, RUNNING
    logs = Column(String(4000), nullable=True)


class SearchCoverageLog(Base):
    __tablename__ = "search_coverage_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    search_log_id = Column(Integer, ForeignKey("search_logs.id", ondelete="CASCADE"), nullable=True)
    source = Column(String(100), nullable=False)
    destination = Column(String(100), nullable=False)
    date = Column(String(20), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    source_station_found = Column(Boolean, default=False)
    destination_station_found = Column(Boolean, default=False)
    direct_real_exists = Column(Boolean, default=False)
    one_transfer_real_exists = Column(Boolean, default=False)
    two_transfer_real_exists = Column(Boolean, default=False)
    synthetic_fallback_used = Column(Boolean, default=False)
    coverage_score = Column(Float, default=0.0)

    classification = Column(String(50), nullable=False)  # Fully Verified, Partially Verified, Synthetic Assisted, Unsupported




