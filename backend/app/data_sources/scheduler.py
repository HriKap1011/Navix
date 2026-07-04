import time
import logging
from typing import Dict, Any
from app.data_sources.registry import registry

logger = logging.getLogger("navix.scheduler")

class DataSourceScheduler:
    @staticmethod
    def sync_all_sources() -> Dict[str, Any]:
        """
        Iterates over all registered data sources, connects, validates, and runs health checks.
        """
        results = {}
        connectors = registry.get_all_connectors()
        
        for conn in connectors:
            meta = conn.metadata()
            start_time = time.perf_counter()
            try:
                conn.connect()
                valid = conn.validate()
                healthy = conn.health_check()
                duration = (time.perf_counter() - start_time) * 1000
                
                results[meta.source_id] = {
                    "success": True,
                    "valid": valid,
                    "healthy": healthy,
                    "duration_ms": duration
                }
                logger.info(f"Sync successfully completed for data source '{meta.source_id}' in {duration:.2f}ms")
            except Exception as e:
                results[meta.source_id] = {
                    "success": False,
                    "error": str(e)
                }
                logger.error(f"Sync failed for data source '{meta.source_id}': {e}")
                
        return results
