"""
Railway Schedule Connector
===========================
Wraps RailwayScheduleProvider as a BaseConnector so the
SearchOrchestrator can run it alongside DATABASE/CSV/MOCK connectors.

Priority 0 — runs first. On success, real train results enter the
pipeline; the deduplicator downstream handles overlap with synthetic results.
"""

from typing import Any, List
from app.data_sources.connector import BaseConnector
from app.data_sources.metadata import DataSourceMetadata


class RailwayScheduleConnector(BaseConnector):
    def __init__(self):
        from app.railway.provider import RailwayScheduleProvider
        self._provider = RailwayScheduleProvider()
        self._metadata = DataSourceMetadata(
            source_id="RAILWAY_SCHEDULE",
            name="Indian Railways Dataset (NDSAP)",
            type="Database",
            status="Active",
            priority=0,   # Highest priority — real data first
            supported_transport_modes=["Train"],
            version="2024-Q1",
        )
        self._connected = False

    def connect(self) -> bool:
        try:
            self._connected = self._provider.health_check()
            self._metadata.health_status = "Healthy" if self._connected else "Unhealthy"
            return self._connected
        except Exception:
            self._connected = False
            self._metadata.health_status = "Unhealthy"
            return False

    def validate(self) -> bool:
        try:
            from app.database import SessionLocal
            from app.railway.models_ext import RailwayTrain
            with SessionLocal() as db:
                count = db.query(RailwayTrain).count()
                ok = count > 0
                self._metadata.validation_issues_count = 0 if ok else 1
                return ok
        except Exception:
            self._metadata.validation_issues_count = 1
            return False

    def fetch(self, source: str, destination: str, date: str) -> List[Any]:
        if not self._connected:
            self.connect()
        return self._provider.search_routes(source, destination, date)

    def health_check(self) -> bool:
        is_healthy = self._provider.health_check()
        self._metadata.health_status = "Healthy" if is_healthy else "Unhealthy"
        return is_healthy

    def metadata(self) -> DataSourceMetadata:
        return self._metadata

    def disconnect(self) -> bool:
        self._connected = False
        return True
