from dataclasses import dataclass
from typing import Optional

@dataclass(frozen=True)
class SeatAvailability:
    likelihood: float  # 0 to 100
    waitlist_code: Optional[str] = None
    confirmation_probability: Optional[float] = None
    confirmation_likelihood: Optional[str] = None
    peak_demand_factor: Optional[str] = None
    rescue_recommendation: Optional[str] = None
