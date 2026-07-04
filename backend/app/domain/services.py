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
)

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

    # 3. Too many modes / Transfers
    modes = journey.transport_modes
    if len(modes) >= 3:
        penalty += 25
    elif len(modes) == 2:
        penalty += 12

    # 4. Inconvenient timings
    dep_hour = get_hour(journey.departure_time)
    arr_hour = get_hour(journey.arrival_time)
    if dep_hour < 6:
        penalty += 12
    if 23 <= arr_hour or arr_hour < 4:
        penalty += 12

    # 5. High seat risk discomfort
    if journey.seat_likelihood < 35:
        penalty += 15

    return min(penalty, 100)

def calculate_smart_scores(journeys: List[Journey]) -> List[Journey]:
    if not journeys:
        return journeys

    # Compute friction penalty first
    journeys_with_friction = []
    for j in journeys:
        penalty = calculate_friction_penalty(j)
        friction_score = 100 - penalty
        journeys_with_friction.append((j, friction_score))

    # Extract metrics for normalization
    prices = [jwf[0].price.total_price.amount for jwf in journeys_with_friction]
    durations = [jwf[0].duration.minutes for jwf in journeys_with_friction]
    transfers = [len(jwf[0].legs) - 1 for jwf in journeys_with_friction]
    comforts = [jwf[0].comfort_score for jwf in journeys_with_friction]
    seat_likelihoods = [jwf[0].seat_likelihood for jwf in journeys_with_friction]
    friction_scores = [jwf[1] for jwf in journeys_with_friction]

    min_price, max_price = min(prices), max(prices)
    min_duration, max_duration = min(durations), max(durations)
    min_transfers, max_transfers = min(transfers), max(transfers)
    min_comfort, max_comfort = min(comforts), max(comforts)
    min_seat, max_seat = min(seat_likelihoods), max(seat_likelihoods)
    min_friction, max_friction = min(friction_scores), max(friction_scores)

    def normalize(val: float, min_val: float, max_val: float, invert: bool = False) -> float:
        if max_val == min_val:
            return 1.0
        norm = (val - min_val) / (max_val - min_val)
        return 1.0 - norm if invert else norm

    # Apply Weights from Config
    scored_journeys = []
    for jwf, f_score in journeys_with_friction:
        j = jwf
        price = j.price.total_price.amount
        duration = j.duration.minutes
        transfers_count = len(j.legs) - 1

        comfort_norm = normalize(j.comfort_score, min_comfort, max_comfort) * WEIGHT_COMFORT
        friction_norm = normalize(f_score, min_friction, max_friction) * WEIGHT_FRICTION
        seat_norm = normalize(j.seat_likelihood, min_seat, max_seat) * WEIGHT_SEAT
        transfer_norm = normalize(transfers_count, min_transfers, max_transfers, invert=True) * WEIGHT_TRANSFERS
        price_norm = normalize(price, min_price, max_price, invert=True) * WEIGHT_PRICE
        duration_norm = normalize(duration, min_duration, max_duration, invert=True) * WEIGHT_DURATION
        avail_norm = normalize(j.seat_likelihood, min_seat, max_seat) * WEIGHT_AVAILABILITY

        total_score = (comfort_norm + friction_norm + seat_norm + transfer_norm + price_norm + duration_norm + avail_norm) * 100
        j.nx_score = int(round(total_score))
        
        # Temporary friction score attribute used to calculate reasoning but not stored in domain Journey
        j._friction_score = f_score
        scored_journeys.append(j)

    # Determine badges and reasoning
    min_price_val = min(j.price.total_price.amount for j in scored_journeys)
    min_duration_val = min(j.duration.minutes for j in scored_journeys)
    min_transfers_val = min(len(j.legs) - 1 for j in scored_journeys)

    sorted_by_score = sorted(scored_journeys, key=lambda x: x.nx_score, reverse=True)
    best_route_id = sorted_by_score[0].route_id if sorted_by_score else None
    
    avg_price = sum(j.price.total_price.amount for j in scored_journeys) / len(scored_journeys)

    for j in scored_journeys:
        is_best = j.route_id == best_route_id
        is_cheapest = j.price.total_price.amount == min_price_val
        is_fastest = j.duration.minutes == min_duration_val

        tag = j.recommendation_reason
        reasoning = []

        if is_best:
            price = j.price.total_price.amount
            price_diff_pct = round(((avg_price - price) / avg_price) * 100)
            
            if price_diff_pct > 5:
                reasoning.append("Highly economical optimal route")
            elif is_cheapest:
                reasoning.append("Best value for comfortable budget travel")
            
            transfers_count = len(j.legs) - 1
            if transfers_count <= min_transfers_val:
                reasoning.append("Saves transfer stress")
            
            if j.seat_likelihood > 70:
                reasoning.append("Highly confident seat availability")
            
            if j.comfort_score > 80:
                reasoning.append("Superior comfort and low travel friction")
            
            f_score = getattr(j, "_friction_score", 100)
            if f_score > 90:
                reasoning.append("Daylight schedule with no waiting pain")
            elif f_score > 75:
                reasoning.append("Bypasses overnight transfer stress")
            
            if not reasoning:
                reasoning.append("Bypasses active land sector congestion")

            j.is_recommended = True
            j.recommendation_reasoning = reasoning
            
            if not tag or tag == "Congested main express route" or "Optimal" in tag or tag == "Standard route":
                if j.comfort_score > 85:
                    tag = "Most Comfortable"
                elif j.seat_likelihood > 85:
                    tag = "Best Seat Confidence"
                elif getattr(j, "_friction_score", 100) > 90:
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
        
        # Cleanup temporary friction attribute
        if hasattr(j, "_friction_score"):
            delattr(j, "_friction_score")

    return sorted_by_score
