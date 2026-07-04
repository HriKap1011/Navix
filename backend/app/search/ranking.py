from typing import List
from app.search.pipeline import PipelineContext
from app.domain.journey import Journey
from app.domain.services import calculate_smart_scores

class RankingStage:
    def process(self, context: PipelineContext, journeys: List[Journey]) -> List[Journey]:
        # Outsource comfort/friction score calculations and ranking to domain service
        return calculate_smart_scores(journeys)
