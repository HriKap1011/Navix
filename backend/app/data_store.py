import json
import os
import hashlib
from typing import Dict, Any, List

# Resolve data folder path relative to file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

class DataStore:
    def __init__(self):
        self._cities_fallback: List[Dict[str, Any]] = self._load_json("cities.json", [])
        self._stations_fallback: Dict[str, str] = self._load_json("stations.json", {})
        self._nearby_fallback: Dict[str, List[str]] = self._load_json("nearby_stations.json", {})
        self._corridors_fallback: Dict[str, Dict[str, Any]] = self._load_json("corridors.json", {})
        self.bus_routes: List[Dict[str, Any]] = self._load_json("bus_routes.json", [])
        
        # Caches loaded from DB
        self._cities_cache = None
        self._stations_cache = None
        self._nearby_cache = None
        self._corridors_cache = None

    def _load_json(self, filename: str, default: Any) -> Any:
        path = os.path.join(DATA_DIR, filename)
        if not os.path.exists(path):
            print(f"Warning: JSON dataset file not found at {path}")
            return default
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading {path}: {e}")
            return default

    def load_cities_cache(self):
        if self._cities_cache is not None:
            return
        try:
            from app.database import SessionLocal
            from app.models import City
            db = SessionLocal()
            try:
                db_cities = db.query(City).order_by(City.city_name).all()
                if db_cities:
                    self._cities_cache = [
                        {
                            "name": city.city_name,
                            "lat": city.latitude,
                            "lon": city.longitude,
                            "has_airport": city.has_airport,
                            "has_train_station": city.has_train_station,
                            "code": city.code,
                            "station": city.station
                        }
                        for city in db_cities
                    ]
            finally:
                db.close()
        except Exception as e:
            print(f"Database error loading cities cache: {e}")
        
        if not self._cities_cache:
            self._cities_cache = self._cities_fallback

    def load_stations_cache(self):
        if self._stations_cache is not None:
            return
        try:
            from app.database import SessionLocal
            from app.models import Station
            db = SessionLocal()
            try:
                db_stations = db.query(Station).all()
                if db_stations:
                    self._stations_cache = {s.station_code: s.station_name for s in db_stations}
            finally:
                db.close()
        except Exception as e:
            print(f"Database error loading stations cache: {e}")
            
        if not self._stations_cache:
            self._stations_cache = self._stations_fallback

    def load_nearby_cache(self):
        if self._nearby_cache is not None:
            return
        try:
            from app.database import SessionLocal
            from app.models import City, Station, NearbyStationMapping
            db = SessionLocal()
            try:
                db_mappings = db.query(
                    City.city_name, Station.station_code
                ).join(
                    NearbyStationMapping, NearbyStationMapping.city_id == City.id
                ).join(
                    Station, NearbyStationMapping.station_id == Station.id
                ).all()
                if db_mappings:
                    m_dict = {}
                    for city_name, station_code in db_mappings:
                        m_dict.setdefault(city_name.lower(), []).append(station_code)
                    self._nearby_cache = m_dict
            finally:
                db.close()
        except Exception as e:
            print(f"Database error loading nearby cache: {e}")
            
        if not self._nearby_cache:
            # Normalize fallback keys to lowercase for uniform lookup
            self._nearby_cache = {k.lower(): v for k, v in self._nearby_fallback.items()}

    def load_corridors_cache(self):
        if self._corridors_cache is not None:
            return
        try:
            from app.database import SessionLocal
            from app.models import Corridor, City
            from sqlalchemy.orm import aliased
            db = SessionLocal()
            try:
                src_alias = aliased(City)
                dest_alias = aliased(City)
                results = db.query(
                    src_alias.city_name.label("src_name"),
                    dest_alias.city_name.label("dest_name"),
                    Corridor.demand_level,
                    Corridor.migration_relevance,
                    Corridor.seasonal_pressure,
                    Corridor.avg_duration
                ).join(
                    src_alias, Corridor.source_city_id == src_alias.id
                ).join(
                    dest_alias, Corridor.destination_city_id == dest_alias.id
                ).all()
                
                if results:
                    corridors_dict = {}
                    for r in results:
                        key = f"{r.src_name.lower()}-{r.dest_name.lower()}"
                        corridors_dict[key] = {
                            "source": r.src_name,
                            "destination": r.dest_name,
                            "tier": r.demand_level,
                            "migration_relevance": r.migration_relevance,
                            "seasonal_pressure": r.seasonal_pressure,
                            "avg_duration": r.avg_duration
                        }
                    self._corridors_cache = corridors_dict
            finally:
                db.close()
        except Exception as e:
            print(f"Database error loading corridors cache: {e}")
            
        if not self._corridors_cache:
            self._corridors_cache = self._corridors_fallback

    @property
    def cities(self) -> List[Dict[str, Any]]:
        self.load_cities_cache()
        return self._cities_cache

    @property
    def corridors(self) -> Dict[str, Dict[str, Any]]:
        self.load_corridors_cache()
        return self._corridors_cache

    def is_valid_city(self, name: str) -> bool:
        self.load_cities_cache()
        return any(c["name"].lower() == name.strip().lower() for c in self._cities_cache)

    def get_city(self, name: str) -> Dict[str, Any]:
        self.load_cities_cache()
        for c in self._cities_cache:
            if c["name"].lower() == name.lower():
                return c
        
        # Safe fallback hash-based generator for unseen cities
        h = int(hashlib.md5(name.lower().encode()).hexdigest(), 16)
        code = "".join(filter(str.isalnum, name))[:3].upper()
        return {
            "name": name,
            "lat": 10.0 + (h % 20),
            "lon": 70.0 + ((h >> 4) % 20),
            "has_airport": (h % 10) > 4,
            "has_train_station": True,
            "code": code,
            "station": code
        }

    def get_station_name(self, code: str) -> str:
        self.load_stations_cache()
        return self._stations_cache.get(code.upper().strip(), f"{code} Station")

    def get_nearby_stations(self, city_name: str) -> List[str]:
        self.load_nearby_cache()
        stations = self._nearby_cache.get(city_name.lower())
        if stations:
            return stations
        
        # Generate generic fallback station codes
        cleaned = "".join(filter(str.isalnum, city_name))
        city_code = cleaned[:3].upper()
        return [city_code, f"{city_code}C", f"{city_code}N"]

# Shared instance across the app
store = DataStore()
