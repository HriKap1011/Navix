from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base

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
