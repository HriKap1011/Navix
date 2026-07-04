import datetime
from typing import Dict
from app.data_sources.metadata import DataSourceMetadata

class HealthMonitor:
    def __init__(self):
        # We hold temporary run metrics (e.g. response times accumulator)
        self._latencies: Dict[str, list] = {}

    def log_success(self, meta: DataSourceMetadata, latency_ms: float, record_count: int):
        meta.last_sync = datetime.datetime.now()
        meta.consecutive_failures = 0
        meta.health_status = "Healthy"
        meta.total_records_count = record_count
        
        # Accumulate latency
        if meta.source_id not in self._latencies:
            self._latencies[meta.source_id] = []
        self._latencies[meta.source_id].append(latency_ms)
        # Keep last 50 queries
        if len(self._latencies[meta.source_id]) > 50:
            self._latencies[meta.source_id].pop(0)
            
        meta.average_response_time_ms = sum(self._latencies[meta.source_id]) / len(self._latencies[meta.source_id])

    def log_failure(self, meta: DataSourceMetadata, latency_ms: float):
        meta.consecutive_failures += 1
        
        # Accumulate latency
        if meta.source_id not in self._latencies:
            self._latencies[meta.source_id] = []
        self._latencies[meta.source_id].append(latency_ms)
        if len(self._latencies[meta.source_id]) > 50:
            self._latencies[meta.source_id].pop(0)
            
        meta.average_response_time_ms = sum(self._latencies[meta.source_id]) / len(self._latencies[meta.source_id])
        
        if meta.consecutive_failures >= 3:
            meta.health_status = "Unhealthy"
        else:
            meta.health_status = "Degraded"

health_monitor = HealthMonitor()
