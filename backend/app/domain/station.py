from dataclasses import dataclass
from typing import Optional

@dataclass
class Station:
    station_code: str
    station_name: str
    city_name: Optional[str]
    station_type: str  # e.g., "Rail", "Bus", "Airport"
    importance_score: int
