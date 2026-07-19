import sys
import os
sys.path.append(r"c:\Users\hriti\Navix\Navix\backend")

from app.search.orchestrator import SearchOrchestrator
from app.domain.services import calculate_smart_scores
from app.config import (
    WEIGHT_COMFORT,
    WEIGHT_FRICTION,
    WEIGHT_SEAT,
    WEIGHT_TRANSFERS,
    WEIGHT_PRICE,
    WEIGHT_DURATION,
    WEIGHT_AVAILABILITY,
    WEIGHT_RELIABILITY,
    WEIGHT_INTEGRITY
)

def run_compare(src, dest, date):
    orchestrator = SearchOrchestrator()
    res = orchestrator.search(src, dest, date)
    if not res["success"]:
        return
    
    print(f"\n--- {src} -> {dest} ---")
    # Since search already scored them, let's look at the journeys
    # We can retrieve the raw sanitized data or re-evaluate them
    for i, r in enumerate(res["routes"]):
        route_id = r["route_id"]
        # Wait, the search endpoint returns serialized route items.
        # Let's see if we can get the components from the search orchestrator.
        # The components are saved on the Journey object, which was scored in services.py.
        # Let's import the search orchestrator's backend pipeline to inspect the raw Journey objects before formatting.
        pass

# Let's write a direct test using the data pipeline
from app.search.pipeline import PipelineContext
from app.railway.provider import RailwayScheduleProvider
from app.domain.components import ComponentCalculator, NormalizationRanges, normalize

def main():
    # Let's fetch journeys from RailwayScheduleProvider and score them manually using both formulas
    provider = RailwayScheduleProvider()
    journeys = provider.search_routes("Delhi", "Patna", "2025-07-10")
    
    # We also need some from other providers to test mixed modes
    from app.data_sources.registry import registry
    csv_conn = registry.get_connector("CSV")
    if csv_conn:
        csv_conn.connect()
        # let's find source/dest coordinates
        from app.database import SessionLocal
        from app.models import City
        db = SessionLocal()
        src_city = db.query(City).filter(City.city_name == "Delhi").first()
        dest_city = db.query(City).filter(City.city_name == "Patna").first()
        db.close()
        if src_city and dest_city:
            from app.data_sources.configuration import DataSourceConfig
            from app.domain.mappers import map_city_to_domain
            ctx = PipelineContext("Delhi", "Patna", "2025-07-10")
            # Let's query CSV
            csv_journeys = csv_conn.query(map_city_to_domain(src_city), map_city_to_domain(dest_city), ctx)
            journeys.extend(csv_journeys)

    # Let's deduplicate
    from app.search.deduplicator import DeduplicationStage
    context = PipelineContext("Delhi", "Patna", "2025-07-10")
    deduper = DeduplicationStage()
    journeys = deduper.process(context, journeys)

    # Now let's calculate scores with two formulas:
    # Formula A: Current implementation in services.py
    # Formula B: Assembly using only the 7 components
    
    # 1. Sanitize data (replicate services.py)
    sanitized_data = []
    for j in journeys:
        incomplete_penalty = 0
        has_missing_time = getattr(j, "_missing_time", False)
        if has_missing_time or j.departure_time == "--:--" or j.arrival_time == "--:--" or not j.departure_time or not j.arrival_time:
            incomplete_penalty += 15
            
        price = 0.0
        if j.price and j.price.total_price and j.price.total_price.amount is not None:
            price = float(j.price.total_price.amount)
        if price <= 0.0:
            price = 10000.0
            incomplete_penalty += 15
            
        duration = 0
        if j.duration and j.duration.minutes is not None:
            duration = int(j.duration.minutes)
        if duration <= 0:
            duration = 1440
            incomplete_penalty += 15

        comfort = 50.0
        if j.comfort_score is not None:
            comfort = float(j.comfort_score)
        else:
            incomplete_penalty += 10
        if comfort <= 0.0:
            comfort = 30.0
            
        seat = 50.0
        if j.seat_likelihood is not None:
            seat = float(j.seat_likelihood)
        else:
            incomplete_penalty += 10
        if seat <= 0.0:
            seat = 20.0

        from app.domain.services import calculate_friction_penalty
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

    results = []
    for s in sanitized_data:
        j = s["journey"]
        comp = ComponentCalculator.compute(j, s, ranges)
        
        # Formula A (Current)
        c_norm = normalize(s["comfort"], min_comfort, max_comfort, min_span=20.0, default_bounds=(0.0, 100.0))
        f_norm = normalize(s["friction"], min_friction, max_friction, min_span=20.0, default_bounds=(0.0, 100.0))
        bc_norm = normalize(s["seat"], min_seat, max_seat, min_span=20.0, default_bounds=(0.0, 100.0))
        t_norm = normalize(s["transfers"], min_transfers, max_transfers, invert=True, min_span=2.0, default_bounds=(0.0, 3.0))
        p_norm = normalize(s["price"], min_price, max_price, invert=True, min_span=200.0)
        d_norm = normalize(s["duration"], min_duration, max_duration, invert=True, min_span=60.0)

        w_comfort_A = comp.physical_comfort * WEIGHT_COMFORT
        w_friction_A = comp.timing_convenience * WEIGHT_FRICTION
        w_booking_A = comp.booking_confidence * (WEIGHT_SEAT + WEIGHT_AVAILABILITY)
        w_transfers_A = comp.journey_simplicity * WEIGHT_TRANSFERS
        w_price_A = p_norm * WEIGHT_PRICE
        w_duration_A = d_norm * WEIGHT_DURATION

        score_pct_A = (w_comfort_A + w_friction_A + w_booking_A + w_transfers_A + w_price_A + w_duration_A) * 100
        score_A = max(0, min(100, int(round(score_pct_A)) - s["incomplete_penalty"]))

        # Formula B (Pure Component Assembly)
        w_comfort_B = comp.physical_comfort * WEIGHT_COMFORT
        w_friction_B = comp.timing_convenience * WEIGHT_FRICTION
        w_booking_B = comp.booking_confidence * (WEIGHT_SEAT + WEIGHT_AVAILABILITY)
        w_transfers_B = comp.journey_simplicity * WEIGHT_TRANSFERS
        
        # Journey Value replaces Price and Duration calculations
        w_value_B = comp.journey_value * (WEIGHT_PRICE + WEIGHT_DURATION)
        
        # Add Reliability and Integrity with their weights (0.0 for now)
        w_reliability_B = comp.schedule_reliability * WEIGHT_RELIABILITY
        w_integrity_B = comp.information_integrity * WEIGHT_INTEGRITY
        
        score_pct_B = (w_comfort_B + w_friction_B + w_booking_B + w_transfers_B + w_value_B + w_reliability_B + w_integrity_B) * 100
        score_B = max(0, min(100, int(round(score_pct_B)) - s["incomplete_penalty"]))
        
        results.append({
            "route_id": j.route_id,
            "modes": j.transport_modes,
            "price": s["price"],
            "score_A": score_A,
            "score_B": score_B,
            "diff": score_B - score_A
        })

    # Sort and display results
    print("\n--- Compare Scores ---")
    results.sort(key=lambda x: x["score_A"], reverse=True)
    for r in results:
        print(f"Route: {r['route_id']} | Modes: {r['modes']} | Score A (Current): {r['score_A']} | Score B (Component): {r['score_B']} | Diff: {r['diff']}")

if __name__ == "__main__":
    main()
