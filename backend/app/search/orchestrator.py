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
        from app.providers.registry import _registry
        if provider_names is None:
            # Query all registered active providers by default
            self.provider_names = list(_registry.keys())
        else:
            self.provider_names = [p.upper() for p in provider_names]

    def search(self, source: str, destination: str, date: str, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        from app.providers.registry import _registry
        
        context = PipelineContext(source, destination, date, filters)
        start_time = time.perf_counter()
        
        provider_results = []
        provider_latencies = {}
        
        # 1. Concurrent Execution of providers
        with ThreadPoolExecutor(max_workers=max(1, len(self.provider_names))) as executor:
            future_to_provider = {}
            for name in self.provider_names:
                prov_cls = _registry.get(name)
                if not prov_cls:
                    continue
                try:
                    # Instantiate provider
                    prov_instance = prov_cls()
                    future = executor.submit(prov_instance.search_routes, source, destination, date)
                    future_to_provider[future] = name
                except Exception as ex:
                    logger.warning(f"Failed to initialize provider {name}: {ex}")
                    context.warnings.append(f"Provider {name} init failed: {ex}")
                    
            for future in as_completed(future_to_provider):
                name = future_to_provider[future]
                p_start = time.perf_counter()
                try:
                    routes = future.result()
                    latency = (time.perf_counter() - p_start) * 1000
                    provider_latencies[name] = latency
                    provider_results.append(routes)
                    logger.info(f"Provider {name} returned {len(routes)} routes in {latency:.2f}ms")
                except Exception as ex:
                    latency = (time.perf_counter() - p_start) * 1000
                    provider_latencies[name] = latency
                    logger.warning(f"Provider {name} failed: {ex}")
                    context.warnings.append(f"Provider {name} failed: {ex}")
                    
        # 2. Run Pipeline Stages
        pipeline = SearchPipeline([
            AggregationStage(),
            DeduplicationStage(),
            FilteringStage(),
            RankingStage(),
            ResponseBuilderStage()
        ])
        
        final_dtos = pipeline.execute(context, provider_results)
        
        # 3. Analyze travel demand
        demand = analyze_travel_demand(source, destination, date)
        
        # 4. Telemetry & logging to database SearchLog
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
