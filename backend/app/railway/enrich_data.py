"""
Railway Data Enrichment Script
===============================
This script updates the main Navix database tables (cities, stations, corridors,
and nearby_station_mappings) using the newly imported real train schedules.

It ensures that any cities, stations, or city-to-city corridors that appear in the
railway dataset but are missing from our reference tables are dynamically resolved,
created, and properly linked.
"""

import sys
import logging
from sqlalchemy.orm import Session

# Setup logger
logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(levelname)s: %(message)s")
logger = logging.getLogger("navix.railway.enricher")

STATION_CITY_OVERRIDES = {
    "NDLS": "Delhi",
    "DLI": "Delhi",
    "ANVT": "Delhi",
    "NZM": "Delhi",
    "CSMT": "Mumbai",
    "MMCT": "Mumbai",
    "BVI": "Mumbai",
    "BDTS": "Mumbai",
    "LTT": "Mumbai",
    "SBC": "Bengaluru",
    "YPR": "Bengaluru",
    "SMVB": "Bengaluru",
    "HWH": "Kolkata",
    "SDAH": "Kolkata",
    "MAS": "Chennai",
    "MS": "Chennai",
}

def clean_city_name(station_name: str) -> str:
    name = station_name
    # Strip common station suffixes to get the candidate city name
    for suffix in ["Junction", "Jn", "Jn.", "Cantt", "Cantt.", "Central", "Terminal", "Terminus", "City", "Road", "Town", "MGR"]:
        name = name.replace(suffix, "")
    # Extra cleanups
    name = name.strip()
    if not name:
        return "Unknown"
    return name

def enrich_reference_data(db: Session) -> dict:
    from app.models import City, Station, NearbyStationMapping, Corridor
    from app.railway.models_ext import RailwayTrain, RailwayTrainStop

    logger.info("Starting Reference Data Enrichment from Railway Dataset...")
    
    stats = {
        "cities_created": 0,
        "stations_created": 0,
        "mappings_created": 0,
        "corridors_created": 0
    }

    # 1. Resolve and Add Cities/Stations
    stops = db.query(RailwayTrainStop).all()
    logger.info(f"Loaded {len(stops)} stops from railway dataset. Checking for missing cities/stations...")

    for stop in stops:
        station_code = stop.station_code.strip().upper()
        raw_name = stop.station_name or station_code
        
        # Determine candidate city name
        if station_code in STATION_CITY_OVERRIDES:
            city_name = STATION_CITY_OVERRIDES[station_code]
        else:
            city_name = clean_city_name(raw_name)

        # Check if City exists
        city = db.query(City).filter(City.city_name.ilike(city_name)).first()
        if not city:
            # Create missing city
            import hashlib
            h = int(hashlib.md5(city_name.encode()).hexdigest(), 16)
            # Center coordinates around central India (approx lat 20.0, lon 78.0)
            lat = 15.0 + (h % 15)
            lon = 73.0 + ((h >> 4) % 12)
            
            city = City(
                city_name=city_name,
                state="India",
                tier="Tier 3",
                importance_score=40,
                demand_category="Standard",
                latitude=lat,
                longitude=lon,
                has_airport=False,
                has_train_station=True,
                code=station_code[:3],
                station=station_code
            )
            db.add(city)
            db.commit()
            db.refresh(city)
            stats["cities_created"] += 1
            logger.info(f"Created City: {city_name} (ID: {city.id}) based on station {station_code}")

        # Check if Station exists
        station = db.query(Station).filter(Station.station_code.ilike(station_code)).first()
        if not station:
            # Create missing station
            station = Station(
                station_code=station_code,
                station_name=raw_name,
                city_id=city.id,
                station_type="Rail",
                importance_score=70
            )
            db.add(station)
            db.commit()
            db.refresh(station)
            stats["stations_created"] += 1
            logger.info(f"Created Station: {raw_name} ({station_code}) linked to City: {city.city_name}")

            # Mark stop as linked in the database
            stop.station_linked = True
            db.add(stop)
            db.commit()

        # Update station linking in Stop if not already marked
        if not stop.station_linked:
            stop.station_linked = True
            db.add(stop)
            db.commit()

        # Check if NearbyStationMapping exists
        mapping = db.query(NearbyStationMapping).filter_by(
            city_id=city.id, station_id=station.id
        ).first()
        if not mapping:
            mapping = NearbyStationMapping(
                city_id=city.id,
                station_id=station.id,
                distance_km=0.0
            )
            db.add(mapping)
            db.commit()
            stats["mappings_created"] += 1
            logger.info(f"Created NearbyStationMapping between City {city.city_name} and Station {station.station_code}")

    # 2. Enrich Corridors from Train Routes
    trains = db.query(RailwayTrain).all()
    logger.info(f"Loaded {len(trains)} trains. Checking for missing city-to-city corridors...")

    for train in trains:
        src_code = train.from_station_code.strip().upper()
        dst_code = train.to_station_code.strip().upper()

        src_station = db.query(Station).filter(Station.station_code.ilike(src_code)).first()
        dst_station = db.query(Station).filter(Station.station_code.ilike(dst_code)).first()

        # Update endpoints links on the train model
        train.source_linked = (src_station is not None)
        train.destination_linked = (dst_station is not None)
        db.add(train)
        db.commit()

        if src_station and dst_station and src_station.city_id and dst_station.city_id:
            src_city_id = src_station.city_id
            dst_city_id = dst_station.city_id

            if src_city_id == dst_city_id:
                continue

            # Check if Corridor exists in direction source -> destination
            corridor = db.query(Corridor).filter_by(
                source_city_id=src_city_id,
                destination_city_id=dst_city_id
            ).first()
            
            if not corridor:
                # Calculate simple duration string
                dist = train.total_distance_km or 500
                speed = 60.0 # average speed km/h
                duration_hours = max(1, int(dist / speed))
                duration_str = f"{duration_hours}h"

                corridor = Corridor(
                    source_city_id=src_city_id,
                    destination_city_id=dst_city_id,
                    demand_level="Moderate",
                    migration_relevance="Standard",
                    seasonal_pressure="Standard",
                    avg_duration=duration_str
                )
                db.add(corridor)
                db.commit()
                stats["corridors_created"] += 1
                
                # Fetch city names for logs
                src_city = db.query(City).get(src_city_id)
                dst_city = db.query(City).get(dst_city_id)
                logger.info(f"Created Corridor: {src_city.city_name} -> {dst_city.city_name} (avg: {duration_str})")

    logger.info("Reference Data Enrichment successfully completed!")
    logger.info(f"Summary: {stats}")
    return stats

if __name__ == "__main__":
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        enrich_reference_data(db)
    finally:
        db.close()
