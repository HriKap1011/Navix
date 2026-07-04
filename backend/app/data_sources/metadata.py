from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional
from app.domain.enums import TransportMode

@dataclass
class DataSourceMetadata:
    source_id: str
    name: str
    type: str  # "Database", "CSV", "API", "GTFS", etc.
    status: str  # "Active", "Inactive", "Maintenance"
    priority: int
    last_sync: Optional[datetime] = None
    refresh_frequency_sec: int = 3600
    supported_transport_modes: List[str] = field(default_factory=list)
    version: str = "1.0.0"
    health_status: str = "Healthy"
    consecutive_failures: int = 0
    average_response_time_ms: float = 0.0
    total_records_count: int = 0
    validation_issues_count: int = 0
