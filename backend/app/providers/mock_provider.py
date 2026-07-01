import json
import os
import hashlib
from typing import List, Dict, Any, Optional
from app.providers.base import BaseProvider

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")

class MockProvider(BaseProvider):
    def __init__(self):
        self._cities = self._load_json("cities.json", [])
        self._stations = self._load_json("stations.json", {})
        self._nearby_raw = {k.lower(): v for k, v in self._load_json("nearby_stations.json", {}).items()}
        self._corridors_raw = self._load_json("corridors.json", {})
        
        # Standard fallback seasonal demands
        self._seasonal_demands = [
            {
                "festival_name": "Holi", "start_month": 3, "start_day": 1, "end_month": 3, "end_day": 6,
                "seat_modifier": 0.4, "comfort_modifier": -20, "price_multiplier": 1.3, "crowd_modifier": 40
            },
            {
                "festival_name": "Summer Vacation", "start_month": 5, "start_day": 10, "end_month": 6, "end_day": 15,
                "seat_modifier": 0.7, "comfort_modifier": -10, "price_multiplier": 1.15, "crowd_modifier": 25
            },
            {
                "festival_name": "Raksha Bandhan", "start_month": 8, "start_day": 26, "end_month": 8, "end_day": 30,
                "seat_modifier": 0.4, "comfort_modifier": -20, "price_multiplier": 1.3, "crowd_modifier": 40
            },
            {
                "festival_name": "Durga Puja", "start_month": 10, "start_day": 14, "end_month": 10, "end_day": 22,
                "seat_modifier": 0.4, "comfort_modifier": -20, "price_multiplier": 1.3, "crowd_modifier": 40
            },
            {
                "festival_name": "Diwali", "start_month": 11, "start_day": 4, "end_month": 11, "end_day": 11,
                "seat_modifier": 0.4, "comfort_modifier": -20, "price_multiplier": 1.3, "crowd_modifier": 40
            },
            {
                "festival_name": "Chhath Puja", "start_month": 11, "start_day": 12, "end_month": 11, "end_day": 17,
                "seat_modifier": 0.4, "comfort_modifier": -20, "price_multiplier": 1.3, "crowd_modifier": 40
            },
            {
                "festival_name": "New Year", "start_month": 12, "start_day": 25, "end_month": 1, "end_day": 5,
                "seat_modifier": 0.4, "comfort_modifier": -20, "price_multiplier": 1.3, "crowd_modifier": 40
            }
        ]

    def _load_json(self, filename: str, default: Any) -> Any:
        path = os.path.join(DATA_DIR, filename)
        if not os.path.exists(path):
            return default
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return default

    def search_stations(self) -> Dict[str, str]:
        return self._stations

    def search_city(self, name: str) -> Dict[str, Any]:
        for c in self._cities:
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
        stations = self._nearby_raw.get(city_name.lower())
        if stations:
            return stations
        cleaned = "".join(filter(str.isalnum, city_name))
        city_code = cleaned[:3].upper()
        return [city_code, f"{city_code}C", f"{city_code}N"]

    def get_corridor(self, source: str, destination: str) -> Optional[Dict[str, Any]]:
        corridors = self.get_all_corridors()
        return corridors.get(f"{source.lower()}-{destination.lower()}")

    def health_check(self) -> bool:
        return len(self._cities) > 0

    def get_all_cities(self) -> List[Dict[str, Any]]:
        return self._cities

    def get_all_corridors(self) -> Dict[str, Dict[str, Any]]:
        normalized = {}
        for k, v in self._corridors_raw.items():
            src, dest = k.split("-")
            src_name = src.capitalize()
            dest_name = dest.capitalize()
            normalized[k] = {
                "source": src_name,
                "destination": dest_name,
                "tier": v.get("demand_level", "Moderate"),
                "migration_relevance": "High" if v.get("migration_heavy") or v.get("migration_relevance") == "High" else "Standard",
                "seasonal_pressure": "Festival Rush" if v.get("festival_heavy") or v.get("seasonal_pressure") == "Festival Rush" else "Standard",
                "avg_duration": v.get("avg_duration", "12h")
            }
        return normalized

    def get_seasonal_demands(self) -> List[Dict[str, Any]]:
        return self._seasonal_demands

    def is_valid_city(self, name: str) -> bool:
        return any(c["name"].lower() == name.strip().lower() for c in self._cities)
