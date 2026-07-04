from typing import List, Dict, Any
from app.search.pipeline import PipelineContext
from app.domain.journey import Journey
from app.domain.mappers import map_journey_to_dto

class ResponseBuilderStage:
    def process(self, context: PipelineContext, journeys: List[Journey]) -> List[Dict[str, Any]]:
        # Map list of domain Journey objects to response DTO dictionaries
        return [map_journey_to_dto(j) for j in journeys]
