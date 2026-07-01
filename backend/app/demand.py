from datetime import datetime
import re
from typing import Dict, Any, List, Optional
from app.config import FALLBACK_FESTIVALS

class DemandProfile:
    def __init__(self):
        self.is_weekend_rush = False
        self.is_summer_rush = False
        self.active_festival = None
        self.seat_modifier = 1.0
        self.comfort_modifier = 0
        self.price_multiplier = 1.0
        self.crowd_modifier = 0
        self.contextual_message = None

_festivals_cache = None

def get_festivals_list() -> List[Dict[str, Any]]:
    global _festivals_cache
    if _festivals_cache is not None:
        return _festivals_cache
        
    festivals_list = []
    try:
        from app.providers.registry import get_active_provider
        provider = get_active_provider()
        festivals_list = provider.get_seasonal_demands()
    except Exception as e:
        print(f"Error in analyze_travel_demand load cache via provider, falling back to memory: {e}")

    if not festivals_list:
        festivals_list = [
            {
                "name": fest["name"],
                "start_month": fest["start_month"],
                "start_day": fest["start_day"],
                "end_month": fest["end_month"],
                "end_day": fest["end_day"],
                "seat_modifier": 0.7 if fest["name"] == "Summer Vacation" else 0.4,
                "comfort_modifier": -10 if fest["name"] == "Summer Vacation" else -20,
                "price_multiplier": 1.15 if fest["name"] == "Summer Vacation" else 1.3,
                "crowd_modifier": 25 if fest["name"] == "Summer Vacation" else 40
            }
            for fest in FALLBACK_FESTIVALS
        ]
        
    _festivals_cache = festivals_list
    return _festivals_cache

def analyze_travel_demand(origin: str, destination: str, date_str: str) -> DemandProfile:
    profile = DemandProfile()
    
    if not date_str:
        return profile
        
    try:
        # Check if it is a flexible month search string (YYYY-MM)
        is_flexible_month = False
        if re.match(r"^\d{4}-\d{2}$", date_str.strip()):
            is_flexible_month = True
            dt = datetime.strptime(date_str.strip(), "%Y-%m")
        else:
            dt = datetime.strptime(date_str.strip(), "%Y-%m-%d")
    except Exception:
        # Fallback to current date on parse error
        dt = datetime.now()
        is_flexible_month = False

    day_of_week = dt.weekday()  # Monday is 0, Sunday is 6
    month = dt.month
    day = dt.day

    # Check high demand corridors
    from app.data_store import store
    corridor_key = f"{origin.lower()}-{destination.lower()}"
    corridor = store.corridors.get(corridor_key)
    is_high_demand = corridor is not None

    # 1. Weekend Rush (Friday=4, Saturday=5, Sunday=6, Monday=0)
    if day_of_week in [4, 5, 6, 0]:
        profile.is_weekend_rush = True
        profile.seat_modifier *= 0.85
        profile.price_multiplier *= 1.1
        profile.crowd_modifier += 15
        profile.comfort_modifier -= 5
        profile.contextual_message = "Weekend travel congestion expected."

    # 2. Festivals & Seasonal spikes
    festivals_list = get_festivals_list()

    for fest in festivals_list:
        is_active = False
        sm = fest["start_month"]
        sd = fest["start_day"]
        em = fest["end_month"]
        ed = fest["end_day"]

        # Wrapping month logic for New Year (Dec 25 - Jan 5)
        if sm > em:
            if is_flexible_month:
                if month == sm or month == em:
                    is_active = True
            else:
                if (month == sm and day >= sd) or (month == em and day <= ed):
                    is_active = True
        else:
            if sm <= month <= em:
                if is_flexible_month:
                    is_active = True
                elif sm == em:
                    if sd <= day <= ed:
                        is_active = True
                elif month == sm and day >= sd:
                    is_active = True
                elif month == em and day <= ed:
                    is_active = True
                elif sm < month < em:
                    is_active = True

        if is_active:
            if fest["name"] == "Summer Vacation":
                profile.is_summer_rush = True
                profile.seat_modifier *= fest["seat_modifier"]
                profile.price_multiplier *= fest["price_multiplier"]
                profile.crowd_modifier += fest["crowd_modifier"]
                profile.comfort_modifier += fest["comfort_modifier"]
                profile.contextual_message = "Summer travel rush active."
            else:
                profile.active_festival = fest["name"]
                profile.seat_modifier *= fest["seat_modifier"]
                profile.price_multiplier *= fest["price_multiplier"]
                profile.crowd_modifier += fest["crowd_modifier"]
                profile.comfort_modifier += fest["comfort_modifier"]
                
                # High demand corridor scaling
                if is_high_demand and fest["name"] in ["Diwali", "Chhath Puja", "Holi"]:
                    profile.seat_modifier *= 0.6
                    profile.crowd_modifier += 15
                    profile.contextual_message = f"Extreme {fest['name']} rush on this corridor. Alternate routes highly recommended."
                else:
                    profile.contextual_message = f"{fest['name']} festival demand spike detected."
            break  # Apply the first matched festival only

    # 3. Dynamic Corridor Intelligence from DB
    if corridor:
        demand_level = corridor.get("tier", "Standard").lower()
        migration_relevance = corridor.get("migration_relevance", "Standard").lower()
        seasonal_pressure = corridor.get("seasonal_pressure", "Standard").lower()
        
        # Apply demand level modifiers
        if demand_level in ["extreme", "very high"]:
            profile.seat_modifier *= 0.7
            profile.crowd_modifier += 20
            profile.price_multiplier *= 1.25
            profile.comfort_modifier -= 10
            if profile.active_festival:
                profile.contextual_message = f"Extreme {profile.active_festival} rush on this corridor. Alternate routes highly recommended."
            elif not profile.contextual_message:
                profile.contextual_message = f"High demand travel corridor ({corridor.get('tier')} sector pressure)."
        elif demand_level == "high":
            profile.seat_modifier *= 0.85
            profile.crowd_modifier += 10
            profile.price_multiplier *= 1.15
            profile.comfort_modifier -= 5
            if not profile.contextual_message:
                profile.contextual_message = "High congestion expected on this route."

        # Apply migration flows (e.g. Delhi-Patna)
        if "high" in migration_relevance:
            profile.seat_modifier *= 0.85
            profile.crowd_modifier += 10
            
        # Apply seasonal pressure
        if "festival" in seasonal_pressure or "holiday" in seasonal_pressure:
            if profile.active_festival:
                profile.seat_modifier *= 0.8
                profile.crowd_modifier += 15
                profile.price_multiplier *= 1.15
        elif "summer" in seasonal_pressure and month in [5, 6]:
            profile.seat_modifier *= 0.85
            profile.crowd_modifier += 10

    # Cap surges to keep figures realistic
    profile.crowd_modifier = min(profile.crowd_modifier, 65)
    profile.price_multiplier = min(profile.price_multiplier, 1.75)

    return profile
