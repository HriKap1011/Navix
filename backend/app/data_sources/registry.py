from typing import Dict, List, Optional
from app.data_sources.connector import BaseConnector, DatabaseConnector, CSVConnector, MockConnector
from app.railway.connector import RailwayScheduleConnector
from app.data_sources.configuration import DataSourceConfiguration

class DataSourceRegistry:
    def __init__(self):
        self._connectors: Dict[str, BaseConnector] = {
            "RAILWAY_SCHEDULE": RailwayScheduleConnector(),
            "DATABASE": DatabaseConnector(),
            "CSV": CSVConnector(),
            "MOCK": MockConnector()
        }
        self.apply_configurations()

    def apply_configurations(self):
        config = DataSourceConfiguration.load_config()
        for source_id, conn in self._connectors.items():
            meta = conn.metadata()
            # Apply file overrides if exists
            if source_id in config:
                meta.status = config[source_id].get("status", meta.status)
                meta.priority = config[source_id].get("priority", meta.priority)
            else:
                # Add default details if missing in config file
                config[source_id] = {
                    "status": meta.status,
                    "priority": meta.priority
                }
        DataSourceConfiguration.save_config(config)

    def get_all_connectors(self) -> List[BaseConnector]:
        # Return sorted by priority
        return sorted(list(self._connectors.values()), key=lambda c: c.metadata().priority)

    def get_active_connectors(self) -> List[BaseConnector]:
        self.apply_configurations()
        return [
            c for c in self.get_all_connectors()
            if c.metadata().status == "Active"
        ]

    def get_connector(self, source_id: str) -> Optional[BaseConnector]:
        return self._connectors.get(source_id.upper())

    def update_source_status(self, source_id: str, status: str) -> bool:
        source_id = source_id.upper()
        conn = self.get_connector(source_id)
        if not conn:
            return False
            
        # Update run metadata
        conn.metadata().status = status
        
        # Update config file
        config = DataSourceConfiguration.load_config()
        if source_id not in config:
            config[source_id] = {}
        config[source_id]["status"] = status
        config[source_id]["priority"] = conn.metadata().priority
        DataSourceConfiguration.save_config(config)
        return True

    def update_source_priority(self, source_id: str, priority: int) -> bool:
        source_id = source_id.upper()
        conn = self.get_connector(source_id)
        if not conn:
            return False
            
        # Update run metadata
        conn.metadata().priority = priority
        
        # Update config file
        config = DataSourceConfiguration.load_config()
        if source_id not in config:
            config[source_id] = {}
        config[source_id]["status"] = conn.metadata().status
        config[source_id]["priority"] = priority
        DataSourceConfiguration.save_config(config)
        return True

# Global Registry Instance
registry = DataSourceRegistry()
