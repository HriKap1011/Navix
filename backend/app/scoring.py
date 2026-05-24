import re
from typing import List, Dict, Any
from app.config import (
    WEIGHT_COMFORT,
    WEIGHT_FRICTION,
    WEIGHT_SEAT,
    WEIGHT_TRANSFERS,
    WEIGHT_PRICE,
    WEIGHT_DURATION,
    WEIGHT_AVAILABILITY,
)

def get_minutes(d: str) -> int:
    h = re.search(r"(\d+)h", d)
    m = re.search(r"(\d+)m", d)
    return (int(h.group(1)) * 60 if h else 0) + (int(m.group(1)) if m else 0)

def get_price_num(p: Any) -> float:
    if isinstance(p, (int, float)):
        return float(p)
    return float(re.sub(r"[^0-9.]", "", str(p)))

def get_hour(t: str) -> int:
    parts = t.split(":")
    return int(parts[0]) if len(parts) >= 1 else 12

def calculate_friction_penalty(route: Dict[str, Any]) -> int:
    penalty = 0

    # 1. Excessive waiting / Long layovers
    layover_min = get_minutes(route.get("layover_duration", "0m"))
    if layover_min > 180:
        penalty += 25
    elif layover_min > 90:
        penalty += 15
    elif 0 < layover_min < 40:
        penalty += 10

    # 2. Overnight transfer difficulty
    legs = route.get("legs", [])
    if len(legs) > 1:
        leg1_arr_hour = get_hour(legs[0].get("arrival_time", "12:00"))
        leg2_dep_hour = get_hour(legs[1].get("departure_time", "12:00"))
        if (23 <= leg1_arr_hour or leg1_arr_hour < 5) or (23 <= leg2_dep_hour or leg2_dep_hour < 5):
            penalty += 20

    # 3. Too many modes / Transfers
    modes = route.get("transport_modes", [])
    if len(modes) >= 3:
        penalty += 25
    elif len(modes) == 2:
        penalty += 12

    # 4. Inconvenient timings
    dep_time = route.get("departure_time", "12:00")
    arr_time = route.get("arrival_time", "12:00")
    dep_hour = get_hour(dep_time)
    arr_hour = get_hour(arr_time)
    if dep_hour < 6:
        penalty += 12
    if 23 <= arr_hour or arr_hour < 4:
        penalty += 12

    # 5. High seat risk discomfort
    seat_likelihood = route.get("seat_likelihood", 100)
    if seat_likelihood < 35:
        penalty += 15

    return min(penalty, 100)

def calculate_smart_scores(routes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not routes:
        return routes

    # Compute friction penalty first
    routes_with_friction = []
    for r in routes:
        penalty = calculate_friction_penalty(r)
        friction_score = 100 - penalty
        routes_with_friction.append({
            "route": r,
            "friction_score": friction_score
        })

    # Extract metrics for normalization
    prices = [get_price_num(rwf["route"]["price"]) for rwf in routes_with_friction]
    durations = [get_minutes(rwf["route"]["duration"]) for rwf in routes_with_friction]
    transfers = [len(rwf["route"].get("legs", [])) - 1 for rwf in routes_with_friction]
    comforts = [rwf["route"]["comfort_score"] for rwf in routes_with_friction]
    seat_likelihoods = [rwf["route"]["seat_likelihood"] for rwf in routes_with_friction]
    friction_scores = [rwf["friction_score"] for rwf in routes_with_friction]

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
    scored_routes = []
    for rwf in routes_with_friction:
        r = rwf["route"]
        price = get_price_num(r["price"])
        duration = get_minutes(r["duration"])
        transfers_count = len(r.get("legs", [])) - 1

        comfort_score = normalize(r["comfort_score"], min_comfort, max_comfort) * WEIGHT_COMFORT
        friction_score = normalize(rwf["friction_score"], min_friction, max_friction) * WEIGHT_FRICTION
        seat_score = normalize(r["seat_likelihood"], min_seat, max_seat) * WEIGHT_SEAT
        transfer_score = normalize(transfers_count, min_transfers, max_transfers, invert=True) * WEIGHT_TRANSFERS
        price_score = normalize(price, min_price, max_price, invert=True) * WEIGHT_PRICE
        duration_score = normalize(duration, min_duration, max_duration, invert=True) * WEIGHT_DURATION
        avail_score = normalize(r["seat_likelihood"], min_seat, max_seat) * WEIGHT_AVAILABILITY

        total_score = (comfort_score + friction_score + seat_score + transfer_score + price_score + duration_score + avail_score) * 100
        r["nx_score"] = int(round(total_score))
        r["friction_score"] = rwf["friction_score"]
        scored_routes.append(r)

    # Determine badges and reasoning
    min_price_val = min(get_price_num(r["price"]) for r in scored_routes)
    min_duration_val = min(get_minutes(r["duration"]) for r in scored_routes)
    min_transfers_val = min(len(r.get("legs", [])) - 1 for r in scored_routes)

    sorted_by_score = sorted(scored_routes, key=lambda x: x["nx_score"], reverse=True)
    best_route_id = sorted_by_score[0]["route_id"] if sorted_by_score else None
    
    avg_price = sum(get_price_num(r["price"]) for r in scored_routes) / len(scored_routes)

    for r in scored_routes:
        is_best = r["route_id"] == best_route_id
        is_cheapest = get_price_num(r["price"]) == min_price_val
        is_fastest = get_minutes(r["duration"]) == min_duration_val

        tag = r.get("recommendation_reason", "")
        reasoning = []

        if is_best:
            price = get_price_num(r["price"])
            price_diff_pct = round(((avg_price - price) / avg_price) * 100)
            
            if price_diff_pct > 5:
                reasoning.append("Highly economical optimal route")
            elif is_cheapest:
                reasoning.append("Best value for comfortable budget travel")
            
            transfers_count = len(r.get("legs", [])) - 1
            if transfers_count <= min_transfers_val:
                reasoning.append("Saves transfer stress")
            
            if r["seat_likelihood"] > 70:
                reasoning.append("Highly confident seat availability")
            
            if r["comfort_score"] > 80:
                reasoning.append("Superior comfort and low travel friction")

            if r.get("friction_score", 100) > 90:
                reasoning.append("Daylight schedule with no waiting pain")
            elif r.get("friction_score", 100) > 75:
                reasoning.append("Bypasses overnight transfer stress")
            
            if not reasoning:
                reasoning.append("Bypasses active land sector congestion")

            r["is_recommended"] = True
            r["recommendation_reasoning"] = reasoning
            
            if not tag or tag == "Congested main express route" or "Optimal" in tag or tag == "Standard route":
                if r["comfort_score"] > 85:
                    tag = "Most Comfortable"
                elif r["seat_likelihood"] > 85:
                    tag = "Best Seat Confidence"
                elif r.get("friction_score", 100) > 90:
                    tag = "Zero Timing Friction"
                else:
                    tag = "Smoothest Journey"
        else:
            r["is_recommended"] = False
            r["recommendation_reasoning"] = []
            
            if is_cheapest:
                tag = "Best Value Comfort"
            elif is_fastest:
                tag = "Express Comfort"
            elif (len(r.get("legs", [])) - 1) == min_transfers_val:
                tag = "Easier Transfer"

        r["recommendation_reason"] = tag
        
        # Cleanup temporary keys
        if "friction_score" in r:
            del r["friction_score"]

    return sorted_by_score
