from dataclasses import dataclass
from typing import Optional

@dataclass
class TravelDemand:
    is_weekend_rush: bool = False
    is_summer_rush: bool = False
    active_festival: Optional[str] = None
    seat_modifier: float = 1.0
    comfort_modifier: int = 0
    price_multiplier: float = 1.0
    crowd_modifier: int = 0
    contextual_message: Optional[str] = None

@dataclass
class SeasonalDemand:
    name: str
    start_month: int
    start_day: int
    end_month: int
    end_day: int
    seat_modifier: float
    comfort_modifier: int
    price_multiplier: float
    crowd_modifier: int

