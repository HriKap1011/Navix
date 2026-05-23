import json
import os
import hashlib
from typing import Dict, Any, List

# Resolve data folder path relative to file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

class DataStore:
    def __init__(self):
        self.cities: List[Dict[str, Any]] = self._load_json("cities.json", [])
        self.stations: Dict[str, str] = self._load_json("stations.json", {})
        self.nearby_stations: Dict[str, List[str]] = self._load_json("nearby_stations.json", {})
        self.corridors: Dict[str, Dict[str, Any]] = self._load_json("corridors.json", {})
        self.bus_routes: List[Dict[str, Any]] = self._load_json("bus_routes.json", [])

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

    def is_valid_city(self, name: str) -> bool:
        return any(c["name"].lower() == name.strip().lower() for c in self.cities)

    def get_city(self, name: str) -> Dict[str, Any]:
        for c in self.cities:
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
        return self.stations.get(code, f"{code} Station")

    def get_nearby_stations(self, city_name: str) -> List[str]:
        # Match from mapping
        for key, stations in self.nearby_stations.items():
            if key.lower() == city_name.lower():
                return stations
        
        # Generate generic fallback station codes
        cleaned = "".join(filter(str.isalnum, city_name))
        city_code = cleaned[:3].upper()
        return [city_code, f"{city_code}C", f"{city_code}N"]

# Shared instance across the app
store = DataStore()
