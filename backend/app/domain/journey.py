from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional, TYPE_CHECKING

from app.domain.leg import Leg, Duration
from app.domain.pricing import Money
from app.domain.availability import SeatAvailability

if TYPE_CHECKING:
    # Imported only for type annotations — avoids circular import at runtime
    # (components.py already imports Journey via TYPE_CHECKING in the other direction).
    from app.domain.components import RecommendationComponents


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
    # Populated by services.calculate_smart_scores() after component computation.
    # Declared here (not as a dynamic attribute) to enable static analysis and IDE completion.
    components: Optional[RecommendationComponents] = field(default=None)
