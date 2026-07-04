from dataclasses import dataclass
from typing import Optional

@dataclass(frozen=True)
class Coordinates:
    latitude: float
    longitude: float

@dataclass
class City:
    name: str
    state: Optional[str]
    tier: Optional[str]
    importance_score: int
    demand_category: str
    coordinates: Coordinates
    has_airport: bool
    has_train_station: bool
    code: str
    station: str
