from typing import List, Set
from app.search.pipeline import PipelineContext
from app.domain.journey import Journey

class DeduplicationStage:
    def process(self, context: PipelineContext, journeys: List[Journey]) -> List[Journey]:
        seen_signatures: Set[str] = set()
        deduplicated: List[Journey] = []
        
        for journey in journeys:
            leg_sigs = []
            for leg in journey.legs:
                # Signature consists of origin, destination, transport mode, and departure time
                leg_sigs.append(f"{leg.from_city}#{leg.to_city}#{leg.mode}#{leg.departure_time}")
            journey_sig = "|".join(leg_sigs)
            
            if journey_sig not in seen_signatures:
                seen_signatures.add(journey_sig)
                deduplicated.append(journey)
                
        return deduplicated
