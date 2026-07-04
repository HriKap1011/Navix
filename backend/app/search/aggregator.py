from typing import List
from app.search.pipeline import PipelineContext
from app.domain.journey import Journey

class AggregationStage:
    def process(self, context: PipelineContext, journeys_list: List[List[Journey]]) -> List[Journey]:
        flat_list: List[Journey] = []
        for j_list in journeys_list:
            if j_list:
                flat_list.extend(j_list)
        return flat_list
