from typing import List, Dict, Any, Optional
from sqlalchemy.orm import aliased
from app.providers.base import BaseProvider
from app.database import db_session
from app.models import City, Station, NearbyStationMapping, Corridor, SeasonalDemand
from app.domain.city import City as DomainCity, Coordinates
from app.domain.station import Station as DomainStation
from app.domain.corridor import Corridor as DomainCorridor
from app.domain.recommendation import SeasonalDemand as DomainSeasonalDemand
from app.domain.mappers import (
    map_city_to_domain, map_station_to_domain, map_corridor_to_domain, map_seasonal_demand_to_domain
)
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

    def search_city(self, name: str) -> DomainCity:
        try:
            with db_session() as db:
                city = db.query(City).filter(City.city_name.ilike(name.strip())).first()
                if city:
                    return map_city_to_domain(city)
        except Exception as e:
            raise RuntimeError(f"Database error in search_city: {e}")

        # Fallback hash generator for unseen cities
        h = int(hashlib.md5(name.lower().encode()).hexdigest(), 16)
        code = "".join(filter(str.isalnum, name))[:3].upper()
        city_dict = {
            "name": name,
            "lat": 10.0 + (h % 20),
            "lon": 70.0 + ((h >> 4) % 20),
            "has_airport": (h % 10) > 4,
            "has_train_station": True,
            "code": code,
            "station": code
        }
        return map_city_to_domain(city_dict)

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

    def get_corridor(self, source: str, destination: str) -> Optional[DomainCorridor]:
        corridors = self.get_all_corridors()
        return corridors.get(f"{source.lower()}-{destination.lower()}")

    def health_check(self) -> bool:
        try:
            with db_session() as db:
                db.query(City).first()
                return True
        except Exception:
            return False

    def get_all_cities(self) -> List[DomainCity]:
        try:
            with db_session() as db:
                db_cities = db.query(City).order_by(City.city_name).all()
                if db_cities:
                    return [map_city_to_domain(city) for city in db_cities]
        except Exception as e:
            raise RuntimeError(f"Database error in get_all_cities: {e}")
        return []

    def get_all_corridors(self) -> Dict[str, DomainCorridor]:
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
                    corridors_dict[key] = map_corridor_to_domain(r)
                return corridors_dict
        except Exception as e:
            raise RuntimeError(f"Database error in get_all_corridors: {e}")
        return {}

    def get_seasonal_demands(self) -> List[DomainSeasonalDemand]:
        try:
            with db_session() as db:
                db_festivals = db.query(SeasonalDemand).all()
                if db_festivals:
                    return [map_seasonal_demand_to_domain(f) for f in db_festivals]
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

    def get_all_stations(self) -> List[DomainStation]:
        try:
            with db_session() as db:
                db_stations = db.query(Station).all()
                return [map_station_to_domain(s) for s in db_stations]
        except Exception as e:
            raise RuntimeError(f"Database error in get_all_stations: {e}")

    def get_all_nearby_mappings(self) -> List[Dict[str, Any]]:
        try:
            with db_session() as db:
                db_mappings = db.query(
                    City.city_name, Station.station_code, NearbyStationMapping.distance_km
                ).join(
                    NearbyStationMapping, NearbyStationMapping.city_id == City.id
                ).join(
                    Station, NearbyStationMapping.station_id == Station.id
                ).all()
                return [
                    {
                        "city_name": city_name,
                        "station_code": station_code,
                        "distance_km": distance_km
                    }
                    for city_name, station_code, distance_km in db_mappings
                ]
        except Exception as e:
            raise RuntimeError(f"Database error in get_all_nearby_mappings: {e}")
