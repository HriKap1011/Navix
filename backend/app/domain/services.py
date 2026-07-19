import math
import re
from typing import List
from app.domain.journey import Journey
from app.domain.leg import Duration
from app.domain.enums import DemandLevel
from app.domain.city import Coordinates
from app.config import (
    WEIGHT_COMFORT,
    WEIGHT_FRICTION,
    WEIGHT_SEAT,
    WEIGHT_TRANSFERS,
    WEIGHT_PRICE,
    WEIGHT_DURATION,
    WEIGHT_AVAILABILITY,
    WEIGHT_RELIABILITY,
    WEIGHT_INTEGRITY,
)
from app.domain.components import ComponentCalculator, NormalizationRanges, normalize

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> int:
    R = 6371.0  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c)

def get_hour(t: str) -> int:
    try:
        parts = t.split(":")
        return int(parts[0]) if len(parts) >= 1 else 12
    except Exception:
        return 12

def calculate_friction_penalty(journey: Journey) -> int:
    penalty = 0

    # 1. Excessive waiting / Long layovers
    layover_min = journey.layover_duration.minutes
    if layover_min > 180:
        penalty += 25
    elif layover_min > 90:
        penalty += 15
    elif 0 < layover_min < 40:
        penalty += 10

    # 2. Overnight transfer difficulty
    if len(journey.legs) > 1:
        leg1_arr_hour = get_hour(journey.legs[0].arrival_time)
        leg2_dep_hour = get_hour(journey.legs[1].departure_time)
        if (23 <= leg1_arr_hour or leg1_arr_hour < 5) or (23 <= leg2_dep_hour or leg2_dep_hour < 5):
            penalty += 20

    # 3. Too many modes / Transfers - REMOVED to avoid double penalization
    # modes = journey.transport_modes
    # if len(modes) >= 3:
    #     penalty += 25
    # elif len(modes) == 2:
    #     penalty += 12

    # 4. Inconvenient timings
    dep_hour = get_hour(journey.departure_time)
    arr_hour = get_hour(journey.arrival_time)
    if dep_hour < 6:
        penalty += 12
    if 23 <= arr_hour or arr_hour < 4:
        penalty += 12

    # 5. High seat risk discomfort - REMOVED to avoid duplicate seat weighting
    # if journey.seat_likelihood < 35:
    #     penalty += 15

    return min(penalty, 100)

def calculate_smart_scores(journeys: List[Journey]) -> List[Journey]:
    if not journeys:
        return journeys

    # Pre-process journeys: sanitize inputs and calculate incomplete-data penalties
    sanitized_data = []
    for j in journeys:
        incomplete_penalty = 0
        
        # Check if missing timings
        has_missing_time = getattr(j, "_missing_time", False)
        if has_missing_time or j.departure_time == "--:--" or j.arrival_time == "--:--" or not j.departure_time or not j.arrival_time:
            incomplete_penalty += 15
            
        # 1. Price Sanitization
        price = 0.0
        if j.price and j.price.total_price and j.price.total_price.amount is not None:
            price = float(j.price.total_price.amount)
        if price <= 0.0:
            price = 10000.0  # conservative high price fallback
            incomplete_penalty += 15
            
        # 2. Duration Sanitization
        duration = 0
        if j.duration and j.duration.minutes is not None:
            duration = int(j.duration.minutes)
        if duration <= 0:
            duration = 1440  # conservative high duration fallback (24 hours)
            incomplete_penalty += 15

        # 3. Comfort Score Sanitization
        comfort = 50.0
        if j.comfort_score is not None:
            comfort = float(j.comfort_score)
        else:
            incomplete_penalty += 10
        if comfort <= 0.0:
            comfort = 30.0  # low comfort fallback
            
        # 4. Seat Likelihood Sanitization
        seat = 50.0
        if j.seat_likelihood is not None:
            seat = float(j.seat_likelihood)
        else:
            incomplete_penalty += 10
        if seat <= 0.0:
            seat = 20.0  # low seat likelihood fallback

        penalty = calculate_friction_penalty(j)
        friction_score = 100 - penalty

        sanitized_data.append({
            "journey": j,
            "price": price,
            "duration": duration,
            "comfort": comfort,
            "seat": seat,
            "friction": friction_score,
            "transfers": len(j.legs) - 1,
            "incomplete_penalty": incomplete_penalty
        })

    # Extract metrics for normalization
    prices = [s["price"] for s in sanitized_data]
    durations = [s["duration"] for s in sanitized_data]
    transfers = [s["transfers"] for s in sanitized_data]
    comforts = [s["comfort"] for s in sanitized_data]
    seat_likelihoods = [s["seat"] for s in sanitized_data]
    friction_scores = [s["friction"] for s in sanitized_data]

    min_price, max_price = min(prices), max(prices)
    min_duration, max_duration = min(durations), max(durations)
    min_transfers, max_transfers = min(transfers), max(transfers)
    min_comfort, max_comfort = min(comforts), max(comforts)
    min_seat, max_seat = min(seat_likelihoods), max(seat_likelihoods)
    min_friction, max_friction = min(friction_scores), max(friction_scores)

    ranges = NormalizationRanges(
        min_price=min_price, max_price=max_price,
        min_duration=min_duration, max_duration=max_duration,
        min_transfers=min_transfers, max_transfers=max_transfers,
        min_comfort=min_comfort, max_comfort=max_comfort,
        min_seat=min_seat, max_seat=max_seat,
        min_friction=min_friction, max_friction=max_friction
    )

    # -----------------------------------------------------------------------
    # Phase 3 — Compute all 7 semantic components and assemble NX Score
    # -----------------------------------------------------------------------
    scored_journeys = []
    for s in sanitized_data:
        j = s["journey"]
        
        # Step A: Compute all 7 semantic components.
        # ComponentCalculator is the single source of truth for component values.
        comp = ComponentCalculator.compute(j, s, ranges)
        j.components = comp

        # Step B: Price/duration normalized scalars for reasoning label generation ONLY.
        # These scalars do NOT feed into the NX Score — journey_value is the sole
        # scoring vehicle for price and duration signals. See components.py mapping table.
        p_norm = normalize(s["price"], min_price, max_price, invert=True, min_span=200.0)
        d_norm = normalize(s["duration"], min_duration, max_duration, invert=True, min_span=60.0)

        # Step C: Assemble NX Score exclusively from all 7 semantic components.
        # Every raw metric reaches the score through a component — no direct norm bypass.
        #
        # Weight mapping (config weights → semantic components, total = 1.0):
        #   journey_value        ← WEIGHT_PRICE + WEIGHT_DURATION  (0.25)
        #   booking_confidence   ← WEIGHT_SEAT + WEIGHT_AVAILABILITY (0.20)
        #   journey_simplicity   ← WEIGHT_TRANSFERS                 (0.15)
        #   timing_convenience   ← WEIGHT_FRICTION                  (0.20)
        #   physical_comfort     ← WEIGHT_COMFORT                   (0.20)
        #   schedule_reliability ← WEIGHT_RELIABILITY               (0.0 — Sprint 3)
        #   information_integrity← WEIGHT_INTEGRITY                 (0.0 — Sprint 3)
        w_journey_value         = comp.journey_value         * (WEIGHT_PRICE + WEIGHT_DURATION)
        w_booking_confidence    = comp.booking_confidence    * (WEIGHT_SEAT + WEIGHT_AVAILABILITY)
        w_journey_simplicity    = comp.journey_simplicity    * WEIGHT_TRANSFERS
        w_timing_convenience    = comp.timing_convenience    * WEIGHT_FRICTION
        w_physical_comfort      = comp.physical_comfort      * WEIGHT_COMFORT
        w_schedule_reliability  = comp.schedule_reliability  * WEIGHT_RELIABILITY  # 0.0 — reserved Sprint 3
        w_information_integrity = comp.information_integrity * WEIGHT_INTEGRITY    # 0.0 — reserved Sprint 3

        total_score_pct = (
            w_journey_value + w_booking_confidence + w_journey_simplicity
            + w_timing_convenience + w_physical_comfort
            + w_schedule_reliability + w_information_integrity
        ) * 100

        total_score = max(0, min(100, int(round(total_score_pct)) - s["incomplete_penalty"]))
        j.nx_score = total_score

        # Step D: Persist weighted contributions and reasoning-only norms on the Journey
        # object for use in the badge/reasoning pass (Phase 4). These are temporary
        # dynamic attributes cleaned up at the end of Phase 4.
        j._p_norm = p_norm
        j._d_norm = d_norm
        j._w_journey_value        = w_journey_value
        j._w_booking_confidence   = w_booking_confidence
        j._w_journey_simplicity   = w_journey_simplicity
        j._w_timing_convenience   = w_timing_convenience
        j._w_physical_comfort     = w_physical_comfort
        j._incomplete_penalty     = s["incomplete_penalty"]
        
        scored_journeys.append(j)

    # -----------------------------------------------------------------------
    # Phase 4 — Badges, recommendation reasoning, and rescue hints
    # -----------------------------------------------------------------------
    prices_list = [j.price.total_price.amount for j in scored_journeys if j.price and j.price.total_price]
    min_price_val = min(prices_list) if prices_list else 1000.0
    
    durations_list = [j.duration.minutes for j in scored_journeys if j.duration]
    min_duration_val = min(durations_list) if durations_list else 60
    
    min_transfers_val = min(len(j.legs) - 1 for j in scored_journeys) if scored_journeys else 0

    sorted_by_score = sorted(scored_journeys, key=lambda x: x.nx_score, reverse=True)
    best_route_id = sorted_by_score[0].route_id if sorted_by_score else None
    second_best_j = sorted_by_score[1] if len(sorted_by_score) > 1 else None
    
    avg_price = sum(prices_list) / len(prices_list) if prices_list else 1000.0

    for j in scored_journeys:
        is_best = j.route_id == best_route_id
        is_cheapest = j.price.total_price.amount == min_price_val if j.price and j.price.total_price else False
        is_fastest = j.duration.minutes == min_duration_val if j.duration else False

        tag = j.recommendation_reason
        reasoning = []

        if is_best:
            # 1. Strongest Positive Factors (components where score >= 0.85)
            positives = []
            if j.components.physical_comfort >= 0.85:
                positives.append(f"Outstanding travel comfort (comfort level: {int(round(j.comfort_score))}/100)")
            if j._p_norm >= 0.85:
                positives.append(f"Highly economical pricing (INR {int(round(j.price.total_price.amount))})")
            if j.components.booking_confidence >= 0.85:
                positives.append("Highly confident seat availability")
            if j.components.journey_simplicity >= 0.85 and len(j.legs) - 1 == 0:
                positives.append("Direct connection with no transfer delays")
            if j.components.timing_convenience >= 0.85:
                positives.append("Zero layout/timing schedule friction")
            if j._d_norm >= 0.85:
                positives.append(f"Fast journey duration ({j.duration.formatted})")
                
            # If no component is >= 0.85, grab the top 2 highest scoring components
            if not positives:
                component_signals = [
                    ("comfort",   j.components.physical_comfort,  f"Good travel comfort ({int(round(j.comfort_score))}/100)"),
                    ("price",     j._p_norm,                      f"Reasonable travel price (INR {int(round(j.price.total_price.amount))})"),
                    ("booking",   j.components.booking_confidence, "Confirmed ticket availability"),
                    ("transfers", j.components.journey_simplicity, "Simple journey structure"),
                    ("friction",  j.components.timing_convenience, "Convenient departure/arrival timings"),
                    ("duration",  j._d_norm,                       f"Short transit time ({j.duration.formatted})"),
                ]
                component_signals.sort(key=lambda x: x[1], reverse=True)
                positives.append(component_signals[0][2])
                positives.append(component_signals[1][2])

            reasoning.extend(positives[:2])  # Keep top 2 positive factors

            # 2. Strongest Negative Factors (components where score <= 0.40)
            negatives = []
            if j._p_norm <= 0.40:
                negatives.append("Premium ticket pricing")
            if j._d_norm <= 0.40:
                negatives.append("Longer travel duration compared to flying")
            if j.components.booking_confidence <= 0.40:
                negatives.append("Risk of ticket waitlisting / low seat probability")
            if j.components.journey_simplicity <= 0.40:
                negatives.append("Requires multiple route transfers")
            if j.components.timing_convenience <= 0.40:
                negatives.append("Sub-optimal scheduling / inconvenient hours")
            if j._incomplete_penalty > 0:
                negatives.append("Incomplete record details penalized score confidence")

            if negatives:
                reasoning.append(f"Note: {negatives[0]}")

            # 3. Decisive differentiator over next best alternative
            if second_best_j:
                advantages = [
                    ("journey_value",  (getattr(j, "_w_journey_value", 0.0)      - getattr(second_best_j, "_w_journey_value", 0.0))      * 100, "better overall journey value"),
                    ("booking",        (getattr(j, "_w_booking_confidence", 0.0)  - getattr(second_best_j, "_w_booking_confidence", 0.0))  * 100, "better seat certainty"),
                    ("simplicity",     (getattr(j, "_w_journey_simplicity", 0.0)  - getattr(second_best_j, "_w_journey_simplicity", 0.0))  * 100, "fewer transfers"),
                    ("timing",         (getattr(j, "_w_timing_convenience", 0.0)  - getattr(second_best_j, "_w_timing_convenience", 0.0))  * 100, "lower timing and layover friction"),
                    ("comfort",        (getattr(j, "_w_physical_comfort", 0.0)    - getattr(second_best_j, "_w_physical_comfort", 0.0))    * 100, "superior travel comfort"),
                ]
                advantages.sort(key=lambda x: x[1], reverse=True)
                top_adv = advantages[0]
                if top_adv[1] > 1.0:  # Only mention if the advantage is positive and meaningful
                    reasoning.append(f"Ranked above other alternatives primarily due to {top_adv[2]}")
                else:
                    reasoning.append("Offers the best balanced combination of cost, time, and comfort")
            else:
                reasoning.append("Only direct verified connection found for this corridor")

            j.is_recommended = True
            j.recommendation_reasoning = reasoning
            
            if not tag or tag == "Congested main express route" or "Optimal" in tag or tag == "Standard route":
                if j.comfort_score > 85:
                    tag = "Most Comfortable"
                elif j.seat_likelihood > 85:
                    tag = "Best Seat Confidence"
                elif j.components.timing_convenience > 0.90:
                    tag = "Zero Timing Friction"
                else:
                    tag = "Smoothest Journey"
        else:
            j.is_recommended = False
            j.recommendation_reasoning = []
            
            if is_cheapest:
                tag = "Best Value Comfort"
            elif is_fastest:
                tag = "Express Comfort"
            elif (len(j.legs) - 1) == min_transfers_val:
                tag = "Easier Transfer"

        j.recommendation_reason = tag
        
        # Check TKG for alternate boarding suggestions on train journeys with low seat likelihood
        if j.seat_likelihood < 50 and "Train" in j.transport_modes:
            try:
                from app.graph.graph_queries import find_alternate_boarding_stations
                alt_stations = find_alternate_boarding_stations(j.source)
                current_stations = {leg.from_city.upper() for leg in j.legs if leg.mode == "Train"}
                valid_alts = [s for s in alt_stations if s.upper() not in current_stations]
                if valid_alts:
                    # TODO (Sprint 3): Surface TKG hint via journey.availability.rescue_recommendation
                    # by rebuilding SeatAvailability with the hint string. Setting a bare
                    # j.rescue_recommendation attribute is incorrect — it is never serialized
                    # to the DTO (the mapper reads journey.availability.rescue_recommendation).
                    pass
            except Exception:
                pass
        
        # Cleanup Phase 4 temporary reasoning attributes from Journey objects
        for attr in ["_p_norm", "_d_norm",
                     "_w_journey_value", "_w_booking_confidence", "_w_journey_simplicity",
                     "_w_timing_convenience", "_w_physical_comfort",
                     "_incomplete_penalty", "_missing_time"]:
            if hasattr(j, attr):
                delattr(j, attr)

    return sorted_by_score
