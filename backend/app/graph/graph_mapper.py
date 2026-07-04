from typing import Tuple, Dict, Any
from app.models import City, Station, Corridor

def map_city_node(c: City) -> Tuple[str, Dict[str, Any]]:
    node_id = f"City:{c.city_name}"
    properties = {
        "id": c.id,
        "name": c.city_name,
        "state": c.state,
        "tier": c.tier,
        "latitude": c.latitude,
        "longitude": c.longitude,
        "importance_score": c.importance_score
    }
    return node_id, properties

def map_station_node(s: Station) -> Tuple[str, Dict[str, Any]]:
    node_id = f"Station:{s.station_code}"
    properties = {
        "id": s.id,
        "code": s.station_code,
        "name": s.station_name,
        "station_type": s.station_type,
        "importance_score": s.importance_score
    }
    return node_id, properties
