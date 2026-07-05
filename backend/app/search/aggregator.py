from typing import List
from app.search.pipeline import PipelineContext
from app.domain.journey import Journey

class AggregationStage:
    def process(self, context: PipelineContext, journeys_list: List[List[Journey]]) -> List[Journey]:
        flat_list: List[Journey] = []
        for j_list in journeys_list:
            if j_list:
                flat_list.extend(j_list)

        # Sort so real railway data (RAIL- prefix) comes first.
        # The downstream deduplicator keeps the first occurrence of each signature,
        # so real trains take precedence over synthetic duplicates.
        flat_list.sort(key=lambda j: (0 if j.route_id.startswith("RAIL-") else 1))
        return flat_list

