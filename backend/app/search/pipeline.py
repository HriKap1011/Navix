import time
from typing import Dict, Any, List

class PipelineContext:
    def __init__(self, source: str, destination: str, date: str, filters: Dict[str, Any] = None):
        self.source = source
        self.destination = destination
        self.date = date
        self.filters = filters or {}
        self.timings: Dict[str, float] = {}
        self.warnings: List[str] = []

class SearchPipeline:
    def __init__(self, stages: List[Any]):
        self.stages = stages

    def execute(self, context: PipelineContext, initial_data: Any) -> Any:
        data = initial_data
        for stage in self.stages:
            start_time = time.perf_counter()
            data = stage.process(context, data)
            duration_ms = (time.perf_counter() - start_time) * 1000
            context.timings[stage.__class__.__name__] = duration_ms
        return data
