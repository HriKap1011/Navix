from typing import List, Dict, Any, Optional
from sqlalchemy.orm import aliased
from app.providers.base import BaseProvider
from app.database import db_session
from app.models import City, Station, NearbyStationMapping, Corridor, SeasonalDemand
import hashlib

class DatabaseProvider(BaseProvider):
    def search_stations(self) -> Dict[str, str]:
        try:
            with db_session() as db:
                db_stations = db.query(Station).all()
                if db_stations:
                    return {s.station_code: s.station_name for s in db_stations}
        except Exception as e:
            raise RuntimeError(f"Database error in search_stations: {e}")
        return {}

    def search_city(self, name: str) -> Dict[str, Any]:
        try:
            with db_session() as db:
                city = db.query(City).filter(City.city_name.ilike(name.strip())).first()
                if city:
                    return {
                        "name": city.city_name,
                        "lat": city.latitude,
                        "lon": city.longitude,
                        "has_airport": city.has_airport,
                        "has_train_station": city.has_train_station,
                        "code": city.code,
                        "station": city.station
                    }
        except Exception as e:
            raise RuntimeError(f"Database error in search_city: {e}")

        # Fallback hash generator for unseen cities
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
        try:
            with db_session() as db:
                db_mappings = db.query(
                    City.city_name, Station.station_code
                ).join(
                    NearbyStationMapping, NearbyStationMapping.city_id == City.id
                ).join(
                    Station, NearbyStationMapping.station_id == Station.id
                ).filter(
                    City.city_name.ilike(city_name.strip())
                ).all()
                if db_mappings:
                    return [station_code for _, station_code in db_mappings]
        except Exception as e:
            raise RuntimeError(f"Database error in get_nearby_stations: {e}")

        # Fallback code generator
        cleaned = "".join(filter(str.isalnum, city_name))
        city_code = cleaned[:3].upper()
        return [city_code, f"{city_code}C", f"{city_code}N"]

    def get_corridor(self, source: str, destination: str) -> Optional[Dict[str, Any]]:
        corridors = self.get_all_corridors()
        return corridors.get(f"{source.lower()}-{destination.lower()}")

    def health_check(self) -> bool:
        try:
            with db_session() as db:
                db.query(City).first()
                return True
        except Exception:
            return False

    def get_all_cities(self) -> List[Dict[str, Any]]:
        try:
            with db_session() as db:
                db_cities = db.query(City).order_by(City.city_name).all()
                if db_cities:
                    return [
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
        except Exception as e:
            raise RuntimeError(f"Database error in get_all_cities: {e}")
        return []

    def get_all_corridors(self) -> Dict[str, Dict[str, Any]]:
        try:
            with db_session() as db:
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
                
                corridors_dict = {}
                for r in results:
                    key = f"{r.src_name.lower()}-{r.dest_name.lower()}"
                    corridors_dict[key] = {
                        "source": r.src_name,
                        "destination": r.dest_name,
                        "tier": r.demand_level,
                        "migration_relevance": r.migration_relevance or "Standard",
                        "seasonal_pressure": r.seasonal_pressure or "Standard",
                        "avg_duration": r.avg_duration or "12h"
                    }
                return corridors_dict
        except Exception as e:
            raise RuntimeError(f"Database error in get_all_corridors: {e}")
        return {}

    def get_seasonal_demands(self) -> List[Dict[str, Any]]:
        try:
            with db_session() as db:
                db_festivals = db.query(SeasonalDemand).all()
                if db_festivals:
                    return [
                        {
                            "name": f.festival_name,
                            "start_month": f.start_month,
                            "start_day": f.start_day,
                            "end_month": f.end_month,
                            "end_day": f.end_day,
                            "seat_modifier": f.seat_modifier,
                            "comfort_modifier": f.comfort_modifier,
                            "price_multiplier": f.price_multiplier,
                            "crowd_modifier": f.crowd_modifier
                        }
                        for f in db_festivals
                    ]
        except Exception as e:
            raise RuntimeError(f"Database error in get_seasonal_demands: {e}")
        return []

    def is_valid_city(self, name: str) -> bool:
        try:
            with db_session() as db:
                count = db.query(City).filter(City.city_name.ilike(name.strip())).count()
                return count > 0
        except Exception as e:
            raise RuntimeError(f"Database error in is_valid_city: {e}")
        return False
