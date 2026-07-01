from typing import List, Dict, Any, Optional
import os
import hashlib
from app.providers.base import BaseProvider
from app.ingestion.loader import load_data_file
from app.ingestion.config import (
    CITIES_FILE, STATIONS_FILE, CORRIDORS_FILE, NEARBY_MAPPINGS_FILE, SEASONAL_DEMANDS_FILE
)

class CSVProvider(BaseProvider):
    def __init__(self):
        self._cities_cache = None
        self._stations_cache = None
        self._nearby_cache = None
        self._corridors_cache = None
        self._seasonal_demands_cache = None
        
        # Load and parse caches on initialization
        self.load_all_caches()

    def load_all_caches(self):
        self.load_cities_cache()
        self.load_stations_cache()
        self.load_nearby_cache()
        self.load_corridors_cache()
        self.load_seasonal_demands_cache()

    def load_cities_cache(self):
        if self._cities_cache is not None:
            return
        records = load_data_file(CITIES_FILE)
        cities = []
        for r in records:
            cities.append({
                "id": str(r.get("id")),
                "name": r.get("city_name"),
                "state": r.get("state"),
                "tier": r.get("tier"),
                "importance_score": int(r.get("importance_score", 50) if r.get("importance_score") is not None else 50),
                "demand_category": r.get("demand_category", "Standard"),
                "lat": float(r.get("latitude")),
                "lon": float(r.get("longitude")),
                "has_airport": str(r.get("has_airport")).lower() in ("true", "1", "yes"),
                "has_train_station": str(r.get("has_train_station")).lower() in ("true", "1", "yes"),
                "code": r.get("code"),
                "station": r.get("station")
            })
        self._cities_cache = cities

    def load_stations_cache(self):
        if self._stations_cache is not None:
            return
        records = load_data_file(STATIONS_FILE)
        stations = {}
        self._station_id_to_code = {}
        for r in records:
            code = r.get("station_code")
            name = r.get("station_name")
            s_id = str(r.get("id"))
            if code and name:
                stations[code.upper().strip()] = name.strip()
                self._station_id_to_code[s_id] = code.upper().strip()
        self._stations_cache = stations

    def load_nearby_cache(self):
        if self._nearby_cache is not None:
            return
        
        self.load_cities_cache()
        self.load_stations_cache()
        
        records = load_data_file(NEARBY_MAPPINGS_FILE)
        city_id_to_name = {c["id"]: c["name"] for c in self._cities_cache}
        
        nearby = {}
        for r in records:
            city_id = str(r.get("city_id"))
            station_id = str(r.get("station_id"))
            city_name = city_id_to_name.get(city_id)
            station_code = self._station_id_to_code.get(station_id)
            
            if city_name and station_code:
                nearby.setdefault(city_name.lower(), []).append(station_code)
                
        self._nearby_cache = nearby

    def load_corridors_cache(self):
        if self._corridors_cache is not None:
            return
        
        self.load_cities_cache()
        records = load_data_file(CORRIDORS_FILE)
        city_id_to_name = {c["id"]: c["name"] for c in self._cities_cache}
        
        corridors = {}
        for r in records:
            src_id = str(r.get("source_city_id"))
            dest_id = str(r.get("destination_city_id"))
            src_name = city_id_to_name.get(src_id)
            dest_name = city_id_to_name.get(dest_id)
            
            if src_name and dest_name:
                key = f"{src_name.lower()}-{dest_name.lower()}"
                corridors[key] = {
                    "source": src_name,
                    "destination": dest_name,
                    "tier": r.get("demand_level", "Moderate"),
                    "migration_relevance": r.get("migration_relevance", "Standard"),
                    "seasonal_pressure": r.get("seasonal_pressure", "Standard"),
                    "avg_duration": r.get("avg_duration", "12h")
                }
        self._corridors_cache = corridors

    def load_seasonal_demands_cache(self):
        if self._seasonal_demands_cache is not None:
            return
        records = load_data_file(SEASONAL_DEMANDS_FILE)
        festivals = []
        for r in records:
            festivals.append({
                "name": r.get("festival_name"),
                "start_month": int(r.get("start_month")),
                "start_day": int(r.get("start_day")),
                "end_month": int(r.get("end_month")),
                "end_day": int(r.get("end_day")),
                "seat_modifier": float(r.get("seat_modifier", 1.0) if r.get("seat_modifier") is not None else 1.0),
                "comfort_modifier": int(r.get("comfort_modifier", 0) if r.get("comfort_modifier") is not None else 0),
                "price_multiplier": float(r.get("price_multiplier", 1.0) if r.get("price_multiplier") is not None else 1.0),
                "crowd_modifier": int(r.get("crowd_modifier", 0) if r.get("crowd_modifier") is not None else 0)
            })
        self._seasonal_demands_cache = festivals

    def search_stations(self) -> Dict[str, str]:
        self.load_stations_cache()
        return self._stations_cache

    def search_city(self, name: str) -> Dict[str, Any]:
        self.load_cities_cache()
        for c in self._cities_cache:
            if c["name"].lower() == name.strip().lower():
                return c
        
        # Fallback hash generator
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

    def get_nearby_stations(self, city_name: str) -> List[str]:
        self.load_nearby_cache()
        stations = self._nearby_cache.get(city_name.lower())
        if stations:
            return stations
        cleaned = "".join(filter(str.isalnum, city_name))
        city_code = cleaned[:3].upper()
        return [city_code, f"{city_code}C", f"{city_code}N"]

    def get_corridor(self, source: str, destination: str) -> Optional[Dict[str, Any]]:
        self.load_corridors_cache()
        return self._corridors_cache.get(f"{source.lower()}-{destination.lower()}")

    def health_check(self) -> bool:
        return (
            os.path.exists(CITIES_FILE) and
            os.path.exists(STATIONS_FILE) and
            os.path.exists(CORRIDORS_FILE)
        )

    def get_all_cities(self) -> List[Dict[str, Any]]:
        self.load_cities_cache()
        return self._cities_cache

    def get_all_corridors(self) -> Dict[str, Dict[str, Any]]:
        self.load_corridors_cache()
        return self._corridors_cache

    def get_seasonal_demands(self) -> List[Dict[str, Any]]:
        self.load_seasonal_demands_cache()
        return self._seasonal_demands_cache

    def is_valid_city(self, name: str) -> bool:
        self.load_cities_cache()
        return any(c["name"].lower() == name.strip().lower() for c in self._cities_cache)
