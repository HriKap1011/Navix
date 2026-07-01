import math
import hashlib
from typing import List, Dict, Any
from app.data_store import store
from app.demand import analyze_travel_demand
from app.scoring import calculate_smart_scores
from app.config import (
    SPEED_TRAIN,
    SPEED_BUS,
    SPEED_BUS_INTERCITY,
    SPEED_FLIGHT,
    COST_BASE_TRAIN,
    COST_BASE_BUS,
    COST_BASE_BUS_INTERCITY,
    COST_BASE_FLIGHT
)

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> int:
    R = 6371.0  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c)

def format_duration(total_minutes: int) -> str:
    hours = total_minutes // 60
    minutes = total_minutes % 60
    return f"{hours}h {minutes:02d}m"

def add_minutes_to_time(time_str: str, add_min: int) -> str:
    try:
        h, m = map(int, time_str.split(":"))
        total = h * 60 + m + int(add_min)
        return f"{(total // 60) % 24:02d}:{total % 60:02d}"
    except Exception:
        return time_str

def get_hash_seed(origin: str, destination: str, date: str) -> int:
    key = f"{origin.lower()}-{destination.lower()}-{date}"
    return int(hashlib.md5(key.encode()).hexdigest(), 16)

def find_intermediate_hub(src_city: Dict[str, Any], dest_city: Dict[str, Any], must_have_airport: bool = False, provider: Any = None) -> str:
    if provider is None:
        from app.data_store import store
        provider = store
        
    if hasattr(provider, "get_all_cities"):
        candidate_cities = provider.get_all_cities()
    else:
        candidate_cities = provider.cities

    if not candidate_cities:
        if must_have_airport:
            return "Varanasi"
        if src_city["name"].lower() == "delhi" and dest_city["name"].lower() == "patna":
            return "Lucknow"
        elif src_city["name"].lower() == "mumbai" and dest_city["name"].lower() == "pune":
            return "Thane"
        return "Varanasi"

    d_direct = calculate_distance(src_city["lat"], src_city["lon"], dest_city["lat"], dest_city["lon"])
    best_hub = None
    min_detour = float('inf')
    
    for c in candidate_cities:
        if c["name"].lower() == src_city["name"].lower() or c["name"].lower() == dest_city["name"].lower():
            continue
            
        if must_have_airport and not c["has_airport"]:
            continue
            
        d1 = calculate_distance(src_city["lat"], src_city["lon"], c["lat"], c["lon"])
        d2 = calculate_distance(c["lat"], c["lon"], dest_city["lat"], dest_city["lon"])
        detour = (d1 + d2) - d_direct
        
        if d1 > 50 and d2 > 50 and detour < min_detour:
            min_detour = detour
            best_hub = c["name"]
            
    if best_hub:
        return best_hub
        
    if must_have_airport:
        return "Varanasi"
    if src_city["name"].lower() == "delhi" and dest_city["name"].lower() == "patna":
        return "Lucknow"
    elif src_city["name"].lower() == "mumbai" and dest_city["name"].lower() == "pune":
        return "Thane"
    return "Varanasi"

import time
import logging

logger = logging.getLogger("navix.providers")

def generate_routes(source: str, destination: str, date: str) -> List[Dict[str, Any]]:
    """
    Core entrypoint for searching routes. Retrieves the active provider and executes search_routes
    with runtime error handling and fallbacks.
    """
    from app.providers.registry import get_active_provider, _registry
    
    provider = get_active_provider()
    provider_name = provider.__class__.__name__
    
    start_time = time.perf_counter()
    logger.info(f"Provider selected: {provider_name} for {source} -> {destination} on {date}")
    
    try:
        routes = provider.search_routes(source, destination, date)
        query_time_ms = (time.perf_counter() - start_time) * 1000
        logger.info(f"Provider {provider_name} successfully returned {len(routes)} records in {query_time_ms:.2f}ms")
        return routes
    except Exception as e:
        query_time_ms = (time.perf_counter() - start_time) * 1000
        logger.error(f"Provider failure: {provider_name} failed in {query_time_ms:.2f}ms: {e}. Attempting fallbacks...")
        
        # Runtime Fallback loop: DATABASE -> CSV -> MOCK
        fallbacks = ["DATABASE", "CSV", "MOCK"]
        primary_provider_key = provider_name.replace("Provider", "").upper()
        
        for fb in fallbacks:
            if fb == primary_provider_key:
                continue
            if fb not in _registry:
                continue
                
            fb_start_time = time.perf_counter()
            logger.warning(f"Runtime fallback: attempting provider {fb}")
            try:
                fb_provider_cls = _registry[fb]
                fb_provider = fb_provider_cls()
                routes = fb_provider.search_routes(source, destination, date)
                fb_time_ms = (time.perf_counter() - fb_start_time) * 1000
                logger.info(f"Runtime fallback to {fb} succeeded in {fb_time_ms:.2f}ms. Returned {len(routes)} records.")
                return routes
            except Exception as fe:
                fb_time_ms = (time.perf_counter() - fb_start_time) * 1000
                logger.error(f"Runtime fallback to {fb} failed in {fb_time_ms:.2f}ms: {fe}")
                
        raise RuntimeError(f"All travel providers failed to process search. Primary error: {e}")

def generate_routes_for_provider(source: str, destination: str, date: str, provider: Any) -> List[Dict[str, Any]]:
    src_city = provider.get_city(source)
    dest_city = provider.get_city(destination)
    
    if src_city["name"].lower() == dest_city["name"].lower():
        return []
        
    corridor = provider.get_corridor(src_city["name"], dest_city["name"])
    distance = calculate_distance(src_city["lat"], src_city["lon"], dest_city["lat"], dest_city["lon"])
    demand = analyze_travel_demand(src_city["name"], dest_city["name"], date)
    seed = get_hash_seed(src_city["name"], dest_city["name"], date)
    
    # Predefined stations
    src_stations = provider.get_nearby_stations(src_city["name"])
    dest_stations = provider.get_nearby_stations(dest_city["name"])
    
    routes = []
    
    # 1. DIRECT TRAIN (Main terminals)
    dep_time_1 = "07:30"
    duration_min_1 = round((distance / SPEED_TRAIN) * 60)
    arr_time_1 = add_minutes_to_time(dep_time_1, duration_min_1)
    
    price_1 = round((distance * 1.2 + COST_BASE_TRAIN) * demand.price_multiplier)
    seat_1 = max(5, round(25 * demand.seat_modifier))
    comfort_1 = max(10, min(100, 55 + demand.comfort_modifier))
    
    leg_1 = {
        "from_city": provider.get_station_name(src_stations[0]),
        "to_city": provider.get_station_name(dest_stations[0]),
        "mode": "Train - Exp (12393)",
        "duration": format_duration(duration_min_1),
        "departure_time": dep_time_1,
        "arrival_time": arr_time_1
    }
    
    direct_train = {
        "route_id": f"NX-{seed%1000:03d}-T1",
        "source": src_city["name"],
        "destination": dest_city["name"],
        "duration": format_duration(duration_min_1),
        "price": price_1,
        "nx_score": 0,
        "seat_likelihood": seat_1,
        "comfort_score": comfort_1,
        "transport_modes": ["Train"],
        "recommendation_reason": "Standard route",
        "departure_time": dep_time_1,
        "arrival_time": arr_time_1,
        "legs": [leg_1],
        "layover_duration": "0m"
    }
    
    # Setup waitlist simulation if congested
    if seat_1 < 45:
        wl_num = 20 + (seed % 40)
        direct_train["waitlist_code"] = f"GNWL {wl_num} / WL {round(wl_num * 0.6)}"
        direct_train["confirmation_probability"] = seat_1
        direct_train["confirmation_likelihood"] = "Low" if seat_1 < 25 else "Medium"
        direct_train["peak_demand_factor"] = f"{demand.active_festival or 'Peak'} Rush"
        direct_train["rescue_recommendation"] = f"Navix Comfort Tip: Secure better seat availability by boarding at {provider.get_station_name(src_stations[1]) if len(src_stations) > 1 else 'nearby terminals'}!"
        direct_train["recommendation_reason"] = "Congested main express route"
        
        if corridor:
            tier = corridor.get("tier", "High")
            mig = corridor.get("migration_relevance", "Standard")
            if tier == "Extreme":
                direct_train["peak_demand_factor"] = "Extreme Corridor Demand"
                direct_train["recommendation_reason"] = "Highly congested corridor"
            elif "high" in mig.lower():
                direct_train["peak_demand_factor"] = "High Migration Flow"
                direct_train["recommendation_reason"] = "High migration corridor"
 
    routes.append(direct_train)
    
    # 2. SMART BOARDING (Alternate Origin)
    if len(src_stations) > 1:
        alt_origin = src_stations[1]
        dep_time_2 = "08:15"
        duration_min_2 = round((distance / SPEED_TRAIN) * 60)
        arr_time_2 = add_minutes_to_time(dep_time_2, duration_min_2)
        price_2 = round((distance * 1.2 + COST_BASE_TRAIN) * demand.price_multiplier)
        seat_2 = max(5, round(60 * demand.seat_modifier))
        comfort_2 = max(10, min(100, 72 + demand.comfort_modifier))
        
        leg_2 = {
            "from_city": provider.get_station_name(alt_origin),
            "to_city": provider.get_station_name(dest_stations[0]),
            "mode": "Train - SF Exp (12395)",
            "duration": format_duration(duration_min_2),
            "departure_time": dep_time_2,
            "arrival_time": arr_time_2
        }
        
        smart_boarding = {
            "route_id": f"NX-{seed%1000:03d}-T2",
            "source": src_city["name"],
            "destination": dest_city["name"],
            "duration": format_duration(duration_min_2),
            "price": price_2,
            "nx_score": 0,
            "seat_likelihood": seat_2,
            "comfort_score": comfort_2,
            "transport_modes": ["Train"],
            "recommendation_reason": "Better seat availability via alternate boarding",
            "departure_time": dep_time_2,
            "arrival_time": arr_time_2,
            "legs": [leg_2],
            "layover_duration": "0m"
        }
        
        if seat_2 < 45:
            smart_boarding["waitlist_code"] = f"RLWL 10 / WL 4"
            smart_boarding["confirmation_probability"] = seat_2
            smart_boarding["confirmation_likelihood"] = "Medium"
            
        routes.append(smart_boarding)
        
    # 3. CONGESTION BYPASS (Alternate Destination)
    if len(dest_stations) > 1:
        alt_dest = dest_stations[1]
        dep_time_3 = "12:00"
        duration_min_3 = round((distance / SPEED_TRAIN) * 60)
        arr_time_3 = add_minutes_to_time(dep_time_3, duration_min_3)
        price_3 = round((distance * 1.2 + COST_BASE_TRAIN) * demand.price_multiplier)
        seat_3 = max(5, round(65 * demand.seat_modifier))
        comfort_3 = max(10, min(100, 74 + demand.comfort_modifier))
        
        leg_3 = {
            "from_city": provider.get_station_name(src_stations[0]),
            "to_city": provider.get_station_name(alt_dest),
            "mode": "Train - Humsafar (22317)",
            "duration": format_duration(duration_min_3),
            "departure_time": dep_time_3,
            "arrival_time": arr_time_3
        }
        
        congestion_bypass = {
            "route_id": f"NX-{seed%1000:03d}-T3",
            "source": src_city["name"],
            "destination": dest_city["name"],
            "duration": format_duration(duration_min_3),
            "price": price_3,
            "nx_score": 0,
            "seat_likelihood": seat_3,
            "comfort_score": comfort_3,
            "transport_modes": ["Train"],
            "recommendation_reason": "Easier boarding from nearby station",
            "departure_time": dep_time_3,
            "arrival_time": arr_time_3,
            "legs": [leg_3],
            "layover_duration": "0m"
        }
        
        routes.append(congestion_bypass)
 
    # 4. SMART SPLIT (Bus + Train via Intermediate Transit Hub)
    transit_hub = find_intermediate_hub(src_city, dest_city, must_have_airport=False, provider=provider)
    hub_city = provider.get_city(transit_hub)
    if hub_city["name"].lower() != src_city["name"].lower() and hub_city["name"].lower() != dest_city["name"].lower():
        dist_leg_1 = calculate_distance(src_city["lat"], src_city["lon"], hub_city["lat"], hub_city["lon"])
        dist_leg_2 = calculate_distance(hub_city["lat"], hub_city["lon"], dest_city["lat"], dest_city["lon"])
        
        dep_time_s = "06:00"
        dur_leg_1 = round((dist_leg_1 / SPEED_BUS_INTERCITY) * 60)
        arr_time_s1 = add_minutes_to_time(dep_time_s, dur_leg_1)
        
        layover = 90  # 1.5h layover
        dep_time_s2 = add_minutes_to_time(arr_time_s1, layover)
        dur_leg_2 = round((dist_leg_2 / SPEED_TRAIN) * 60)
        arr_time_s2 = add_minutes_to_time(dep_time_s2, dur_leg_2)
        
        price_s = round((dist_leg_1 * 1.8 + COST_BASE_BUS_INTERCITY + dist_leg_2 * 1.2 + COST_BASE_TRAIN) * demand.price_multiplier)
        seat_s = max(10, round(78 * demand.seat_modifier))
        comfort_s = max(10, min(100, 70 + demand.comfort_modifier))
        
        leg_s1 = {
            "from_city": src_city["name"],
            "to_city": hub_city["name"],
            "mode": "Intercity Bus - IntrCity AC",
            "duration": format_duration(dur_leg_1),
            "departure_time": dep_time_s,
            "arrival_time": arr_time_s1
        }
        leg_s2 = {
            "from_city": provider.get_station_name(hub_city["station"]),
            "to_city": provider.get_station_name(dest_stations[0]),
            "mode": "Train - SF Exp",
            "duration": format_duration(dur_leg_2),
            "departure_time": dep_time_s2,
            "arrival_time": arr_time_s2
        }
        
        smart_split = {
            "route_id": f"NX-{seed%1000:03d}-S1",
            "source": src_city["name"],
            "destination": dest_city["name"],
            "duration": format_duration(dur_leg_1 + layover + dur_leg_2),
            "price": price_s,
            "nx_score": 0,
            "seat_likelihood": seat_s,
            "comfort_score": comfort_s,
            "transport_modes": ["Bus", "Train"],
            "recommendation_reason": "Lower crowding than main corridor",
            "departure_time": dep_time_s,
            "arrival_time": arr_time_s2,
            "legs": [leg_s1, leg_s2],
            "layover_duration": format_duration(layover)
        }
        routes.append(smart_split)
 
    # 5. OVERNIGHT SLEEPER BUS
    duration_min_4 = round((distance / SPEED_BUS) * 60)
    dep_time_4 = "20:00"
    arr_time_4 = add_minutes_to_time(dep_time_4, duration_min_4)
    price_4 = round((distance * 2.2 + COST_BASE_BUS) * demand.price_multiplier)
    seat_4 = max(10, round(85 * demand.seat_modifier))
    comfort_4 = max(10, min(100, 68 + demand.comfort_modifier))
    
    leg_4 = {
        "from_city": src_city["name"],
        "to_city": dest_city["name"],
        "mode": "Sleeper Bus - Zingbus Premium",
        "duration": format_duration(duration_min_4),
        "departure_time": dep_time_4,
        "arrival_time": arr_time_4
    }
    
    overnight_bus = {
        "route_id": f"NX-{seed%1000:03d}-B1",
        "source": src_city["name"],
        "destination": dest_city["name"],
        "duration": format_duration(duration_min_4),
        "price": price_4,
        "nx_score": 0,
        "seat_likelihood": seat_4,
        "comfort_score": comfort_4,
        "transport_modes": ["Sleeper Bus"],
        "recommendation_reason": "Smoother overnight connection",
        "departure_time": dep_time_4,
        "arrival_time": arr_time_4,
        "legs": [leg_4],
        "layover_duration": "0m"
    }
    routes.append(overnight_bus)
 
    # 6. PREMIUM FLIGHT (if airports exist)
    if src_city["has_airport"] and dest_city["has_airport"] and distance > 300:
        flight_time_min = round((distance / SPEED_FLIGHT) * 60)
        overhead = 150 
        duration_min_5 = flight_time_min + overhead
        dep_time_5 = "11:30"
        arr_time_5 = add_minutes_to_time(dep_time_5, duration_min_5)
        
        price_5 = round((distance * 5.5 + COST_BASE_FLIGHT) * demand.price_multiplier)
        seat_5 = 98
        comfort_5 = max(10, min(100, 90 + demand.comfort_modifier))
        
        leg_5 = {
            "from_city": f"{src_city['name']} Airport ({src_city['code']})",
            "to_city": f"{dest_city['name']} Airport ({dest_city['code']})",
            "mode": "Flight - IndiGo",
            "duration": format_duration(flight_time_min),
            "departure_time": add_minutes_to_time(dep_time_5, 120),  # security wait
            "arrival_time": add_minutes_to_time(dep_time_5, 120 + flight_time_min)
        }
        
        premium_flight = {
            "route_id": f"NX-{seed%1000:03d}-F1",
            "source": src_city["name"],
            "destination": dest_city["name"],
            "duration": format_duration(duration_min_5),
            "price": price_5,
            "nx_score": 0,
            "seat_likelihood": seat_5,
            "comfort_score": comfort_5,
            "transport_modes": ["Flight"],
            "recommendation_reason": "Direct air route secures high seat confidence",
            "departure_time": dep_time_5,
            "arrival_time": arr_time_5,
            "legs": [leg_5],
            "layover_duration": "0m"
        }
        routes.append(premium_flight)
 
    # 7. FLIGHT + TRAIN HYBRID (if source has airport, and intermediate hub has airport)
    air_hub = find_intermediate_hub(src_city, dest_city, must_have_airport=True, provider=provider)
    air_hub_city = provider.get_city(air_hub)
    if src_city["has_airport"] and air_hub_city["has_airport"] and air_hub_city["name"].lower() != dest_city["name"].lower():
        dist_h1 = calculate_distance(src_city["lat"], src_city["lon"], air_hub_city["lat"], air_hub_city["lon"])
        dist_h2 = calculate_distance(air_hub_city["lat"], air_hub_city["lon"], dest_city["lat"], dest_city["lon"])
        
        dep_time_h = "09:00"
        flight_t_min = round((dist_h1 / SPEED_FLIGHT) * 60)
        dur_h1 = flight_t_min + 150 # flight leg with overhead
        arr_time_h1 = add_minutes_to_time(dep_time_h, dur_h1)
        
        layover_h = 120 # 2h layover
        dep_time_h2 = add_minutes_to_time(arr_time_h1, layover_h)
        dur_h2 = round((dist_h2 / SPEED_TRAIN) * 60)
        arr_time_h2 = add_minutes_to_time(dep_time_h2, dur_h2)
        
        price_h = round((dist_h1 * 5.5 + COST_BASE_FLIGHT + dist_h2 * 1.2 + COST_BASE_TRAIN) * demand.price_multiplier)
        seat_h = max(10, round(92 * demand.seat_modifier))
        comfort_h = max(10, min(100, 85 + demand.comfort_modifier))
        
        leg_h1 = {
            "from_city": f"{src_city['name']} Airport ({src_city['code']})",
            "to_city": f"{air_hub_city['name']} Airport ({air_hub_city['code']})",
            "mode": "Flight - IndiGo",
            "duration": format_duration(flight_t_min),
            "departure_time": add_minutes_to_time(dep_time_h, 120),
            "arrival_time": add_minutes_to_time(dep_time_h, 120 + flight_t_min)
        }
        leg_h2 = {
            "from_city": provider.get_station_name(air_hub_city["station"]),
            "to_city": provider.get_station_name(dest_stations[0]),
            "mode": "Train - SF Exp",
            "duration": format_duration(dur_h2),
            "departure_time": dep_time_h2,
            "arrival_time": arr_time_h2
        }
        
        air_hybrid = {
            "route_id": f"NX-{seed%1000:03d}-H1",
            "source": src_city["name"],
            "destination": dest_city["name"],
            "duration": format_duration(dur_h1 + layover_h + dur_h2),
            "price": price_h,
            "nx_score": 0,
            "seat_likelihood": seat_h,
            "comfort_score": comfort_h,
            "transport_modes": ["Flight", "Train"],
            "recommendation_reason": "Air hybrid saves hours vs direct rail",
            "departure_time": dep_time_h,
            "arrival_time": arr_time_h2,
            "legs": [leg_h1, leg_h2],
            "layover_duration": format_duration(layover_h)
        }
        routes.append(air_hybrid)
        
    # SCORE AND RANK ALL ROUTES
    final_routes = calculate_smart_scores(routes)
    return final_routes
