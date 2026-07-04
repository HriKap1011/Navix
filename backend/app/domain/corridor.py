from dataclasses import dataclass
from app.domain.enums import DemandLevel

@dataclass
class Corridor:
    source: str
    destination: str
    demand_level: DemandLevel
    migration_relevance: str
    seasonal_pressure: str
    avg_duration: str
