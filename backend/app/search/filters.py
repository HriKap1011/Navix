from typing import List
from app.search.pipeline import PipelineContext
from app.domain.journey import Journey

class FilteringStage:
    def process(self, context: PipelineContext, journeys: List[Journey]) -> List[Journey]:
        filters = context.filters
        if not filters:
            return journeys
            
        filtered: List[Journey] = []
        for j in journeys:
            # 1. Transport Mode filter
            allowed_modes = filters.get("modes")
            if allowed_modes:
                # Journey's modes must be subset of allowed_modes
                if not all(m in allowed_modes for m in j.transport_modes):
                    continue
            
            # 2. Max Duration filter (in minutes)
            max_duration = filters.get("max_duration_min")
            if max_duration is not None:
                if j.duration.minutes > max_duration:
                    continue
                    
            # 3. Max Price filter
            max_price = filters.get("max_price")
            if max_price is not None:
                if j.price.total_price.amount > max_price:
                    continue
                    
            # 4. Max Transfers filter
            max_transfers = filters.get("max_transfers")
            if max_transfers is not None:
                transfers = len(j.legs) - 1
                if transfers > max_transfers:
                    continue
                    
            # 5. Min Seat Availability filter
            min_seats = filters.get("min_seat_likelihood")
            if min_seats is not None:
                if j.seat_likelihood < min_seats:
                    continue
                    
            # 6. Min Comfort filter
            min_comfort = filters.get("min_comfort_score")
            if min_comfort is not None:
                if j.comfort_score < min_comfort:
                    continue
                    
            filtered.append(j)
            
        return filtered
