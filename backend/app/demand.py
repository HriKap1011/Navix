from datetime import datetime
import re
from typing import Dict, Any, Optional

# Accurate 2026 Festival Travel Windows (1-based months: 1=Jan, 12=Dec)
FESTIVALS = [
    { "name": "Holi", "start_month": 3, "start_day": 1, "end_month": 3, "end_day": 6 },
    { "name": "Summer Vacation", "start_month": 5, "start_day": 10, "end_month": 6, "end_day": 15 },
    { "name": "Raksha Bandhan", "start_month": 8, "start_day": 26, "end_month": 8, "end_day": 30 },
    { "name": "Durga Puja", "start_month": 10, "start_day": 14, "end_month": 10, "end_day": 22 },
    { "name": "Diwali", "start_month": 11, "start_day": 4, "end_month": 11, "end_day": 11 },
    { "name": "Chhath Puja", "start_month": 11, "start_day": 12, "end_month": 11, "end_day": 17 },
    { "name": "New Year", "start_month": 12, "start_day": 25, "end_month": 1, "end_day": 5 }
]

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
    is_high_demand = corridor_key in store.corridors

    # 1. Weekend Rush (Friday=4, Saturday=5, Sunday=6, Monday=0)
    if day_of_week in [4, 5, 6, 0]:
        profile.is_weekend_rush = True
        profile.seat_modifier *= 0.85
        profile.price_multiplier *= 1.1
        profile.crowd_modifier += 15
        profile.comfort_modifier -= 5
        profile.contextual_message = "Weekend travel congestion expected."

    # 2. Festivals & Seasonal spikes
    for fest in FESTIVALS:
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
                profile.seat_modifier *= 0.7
                profile.price_multiplier *= 1.15
                profile.crowd_modifier += 25
                profile.comfort_modifier -= 10
                profile.contextual_message = "Summer travel rush active."
            else:
                profile.active_festival = fest["name"]
                profile.seat_modifier *= 0.4
                profile.price_multiplier *= 1.3
                profile.crowd_modifier += 40
                profile.comfort_modifier -= 20
                
                # High demand corridor scaling
                if is_high_demand and fest["name"] in ["Diwali", "Chhath Puja", "Holi"]:
                    profile.seat_modifier *= 0.6
                    profile.crowd_modifier += 15
                    profile.contextual_message = f"Extreme {fest['name']} rush on this corridor. Alternate routes highly recommended."
                else:
                    profile.contextual_message = f"{fest['name']} festival demand spike detected."
            break  # Apply the first matched festival only

    # Cap surges to keep figures realistic
    profile.crowd_modifier = min(profile.crowd_modifier, 65)
    profile.price_multiplier = min(profile.price_multiplier, 1.75)

    return profile
