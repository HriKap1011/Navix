from dataclasses import dataclass, field
from typing import List, Optional
from app.domain.leg import Leg, Duration
from app.domain.pricing import Money
from app.domain.availability import SeatAvailability

@dataclass
class Journey:
    route_id: str
    source: str
    destination: str
    duration: Duration
    price: Money
    nx_score: int
    seat_likelihood: float
    comfort_score: float
    transport_modes: List[str]
    recommendation_reason: str
    departure_time: str
    arrival_time: str
    legs: List[Leg] = field(default_factory=list)
    layover_duration: Duration = field(default_factory=lambda: Duration(0))
    availability: Optional[SeatAvailability] = None
    is_recommended: bool = False
    recommendation_reasoning: List[str] = field(default_factory=list)
