from typing import List, Set
from app.search.pipeline import PipelineContext
from app.domain.journey import Journey

class DeduplicationStage:
    def process(self, context: PipelineContext, journeys: List[Journey]) -> List[Journey]:
        # Check if we have any real train schedules from the database
        has_real_trains = any(journey.route_id.startswith("RAIL-") for journey in journeys)
        
        filtered_journeys = []
        for journey in journeys:
            # If we have real train data, drop synthetic direct train routes (i.e. pure Train mode only),
            # but preserve multi-modal connecting routes (e.g. Bus + Train, Flight + Train).
            if has_real_trains and (journey.route_id.startswith("NX-") or not journey.route_id.startswith("RAIL-")) and journey.transport_modes == ["Train"]:
                continue
            filtered_journeys.append(journey)
            
        seen_signatures: Set[str] = set()
        deduplicated: List[Journey] = []
        
        for journey in filtered_journeys:
            leg_sigs = []
            for leg in journey.legs:
                # Signature consists of origin, destination, transport mode, and departure time
                leg_sigs.append(f"{leg.from_city}#{leg.to_city}#{leg.mode}#{leg.departure_time}")
            journey_sig = "|".join(leg_sigs)
            
            if journey_sig not in seen_signatures:
                seen_signatures.add(journey_sig)
                deduplicated.append(journey)
                
        return deduplicated

