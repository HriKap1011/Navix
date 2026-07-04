from concurrent.futures import ThreadPoolExecutor, as_completed
import time
import logging
import datetime
from typing import Dict, Any, List

from app.search.pipeline import PipelineContext, SearchPipeline
from app.search.aggregator import AggregationStage
from app.search.deduplicator import DeduplicationStage
from app.search.filters import FilteringStage
from app.search.ranking import RankingStage
from app.search.response_builder import ResponseBuilderStage
from app.demand import analyze_travel_demand

logger = logging.getLogger("navix.search")

class SearchOrchestrator:
    def __init__(self, provider_names: List[str] = None):
        self.provider_names = provider_names

    def search(self, source: str, destination: str, date: str, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        from app.data_sources.registry import registry
        from app.data_sources.health import health_monitor
        
        context = PipelineContext(source, destination, date, filters)
        start_time = time.perf_counter()
        
        # 1. Retrieve targeted connectors
        if self.provider_names is not None:
            connectors = []
            for name in self.provider_names:
                conn = registry.get_connector(name)
                if conn:
                    connectors.append(conn)
                else:
                    context.warnings.append(f"Connector {name} not registered in registry")
        else:
            connectors = registry.get_active_connectors()
            
        provider_results = []
        provider_latencies = {}
        
        # 2. Concurrent execution of connectors
        with ThreadPoolExecutor(max_workers=max(1, len(connectors))) as executor:
            future_to_connector = {}
            for conn in connectors:
                meta = conn.metadata()
                try:
                    conn.connect()
                    future = executor.submit(conn.fetch, source, destination, date)
                    future_to_connector[future] = conn
                except Exception as ex:
                    logger.warning(f"Failed to initialize connector {meta.source_id}: {ex}")
                    context.warnings.append(f"Connector {meta.source_id} init failed: {ex}")
                    
            for future in as_completed(future_to_connector):
                conn = future_to_connector[future]
                meta = conn.metadata()
                p_start = time.perf_counter()
                try:
                    routes = future.result()
                    latency = (time.perf_counter() - p_start) * 1000
                    provider_latencies[meta.source_id] = latency
                    provider_results.append(routes)
                    
                    # Track metrics on success
                    health_monitor.log_success(meta, latency, len(routes))
                    logger.info(f"Connector {meta.source_id} successfully returned {len(routes)} routes in {latency:.2f}ms")
                except Exception as ex:
                    latency = (time.perf_counter() - p_start) * 1000
                    provider_latencies[meta.source_id] = latency
                    
                    # Track metrics on failure
                    health_monitor.log_failure(meta, latency)
                    logger.warning(f"Connector {meta.source_id} failed: {ex}")
                    context.warnings.append(f"Connector {meta.source_id} failed: {ex}")
                    
        # 3. Execute pipeline stages
        pipeline = SearchPipeline([
            AggregationStage(),
            DeduplicationStage(),
            FilteringStage(),
            RankingStage(),
            ResponseBuilderStage()
        ])
        
        final_dtos = pipeline.execute(context, provider_results)
        
        # 4. Analyze travel demand
        demand = analyze_travel_demand(source, destination, date)
        
        # 5. Telemetry & database logging
        total_time_ms = (time.perf_counter() - start_time) * 1000
        
        try:
            from app.database import SessionLocal
            from app.models import SearchLog
            with SessionLocal() as db:
                log_entry = SearchLog(
                    timestamp=datetime.datetime.utcnow(),
                    source=source,
                    destination=destination,
                    date=date,
                    success=len(final_dtos) > 0 or not context.warnings,
                    results_count=len(final_dtos),
                    response_time_ms=total_time_ms,
                    error_message="; ".join(context.warnings) if context.warnings else None
                )
                db.add(log_entry)
                db.commit()
        except Exception as db_ex:
            logger.error(f"Failed to write SearchLog to database: {db_ex}")
            
        return {
            "success": True,
            "routes": final_dtos,
            "demand_profile": demand,
            "meta": {
                "total_duration_ms": total_time_ms,
                "provider_latencies": provider_latencies,
                "pipeline_timings": context.timings,
                "warnings": context.warnings
            }
        }
