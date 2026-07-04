from abc import ABC, abstractmethod
from typing import Any, List
import time
from app.data_sources.metadata import DataSourceMetadata

class BaseConnector(ABC):
    @abstractmethod
    def connect(self) -> bool:
        pass

    @abstractmethod
    def validate(self) -> bool:
        pass

    @abstractmethod
    def fetch(self, source: str, destination: str, date: str) -> List[Any]:
        pass

    @abstractmethod
    def health_check(self) -> bool:
        pass

    @abstractmethod
    def metadata(self) -> DataSourceMetadata:
        pass

    @abstractmethod
    def disconnect(self) -> bool:
        pass

class DatabaseConnector(BaseConnector):
    def __init__(self):
        from app.providers.database_provider import DatabaseProvider
        self._provider = DatabaseProvider()
        self._metadata = DataSourceMetadata(
            source_id="DATABASE",
            name="PostgreSQL Travel Database",
            type="Database",
            status="Active",
            priority=1,
            supported_transport_modes=["Train", "Bus", "Flight"],
            version="1.0.0"
        )
        self._connected = False

    def connect(self) -> bool:
        try:
            # Try a lightweight check or just flag it
            self._connected = self._provider.health_check()
            return self._connected
        except Exception:
            self._connected = False
            return False

    def validate(self) -> bool:
        # Schema verification
        try:
            cities = self._provider.get_all_cities()
            if len(cities) > 0:
                self._metadata.validation_issues_count = 0
                return True
            self._metadata.validation_issues_count = 1
            return False
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


class CSVConnector(BaseConnector):
    def __init__(self):
        from app.providers.csv_provider import CSVProvider
        self._provider = CSVProvider()
        self._metadata = DataSourceMetadata(
            source_id="CSV",
            name="CSV Datasets Connector",
            type="CSV",
            status="Active",
            priority=2,
            supported_transport_modes=["Train", "Bus"],
            version="1.0.0"
        )
        self._connected = False

    def connect(self) -> bool:
        self._connected = True
        return True

    def validate(self) -> bool:
        try:
            # Validate csv cities and routes files load successfully
            cities = self._provider.get_all_cities()
            if len(cities) > 0:
                self._metadata.validation_issues_count = 0
                return True
            self._metadata.validation_issues_count = 1
            return False
        except Exception:
            self._metadata.validation_issues_count = 1
            return False

    def fetch(self, source: str, destination: str, date: str) -> List[Any]:
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


class MockConnector(BaseConnector):
    def __init__(self):
        from app.providers.mock_provider import MockProvider
        self._provider = MockProvider()
        self._metadata = DataSourceMetadata(
            source_id="MOCK",
            name="Mock API Simulator",
            type="API",
            status="Active",
            priority=3,
            supported_transport_modes=["Train", "Bus", "Flight"],
            version="1.0.0"
        )
        self._connected = False

    def connect(self) -> bool:
        self._connected = True
        return True

    def validate(self) -> bool:
        try:
            cities = self._provider.get_all_cities()
            if len(cities) > 0:
                self._metadata.validation_issues_count = 0
                return True
            self._metadata.validation_issues_count = 1
            return False
        except Exception:
            self._metadata.validation_issues_count = 1
            return False

    def fetch(self, source: str, destination: str, date: str) -> List[Any]:
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
