import os
from typing import Any

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:1357@localhost:5432/navix")

# Default values for dynamic settings
_DEFAULTS = {
    "SPEED_TRAIN": 55.0,
    "SPEED_BUS": 42.0,
    "SPEED_BUS_INTERCITY": 46.0,
    "SPEED_FLIGHT": 650.0,
    "COST_BASE_TRAIN": 180.0,
    "COST_BASE_BUS": 400.0,
    "COST_BASE_BUS_INTERCITY": 200.0,
    "COST_BASE_FLIGHT": 2500.0,
    "WEIGHT_COMFORT": 0.20,
    "WEIGHT_FRICTION": 0.20,
    "WEIGHT_SEAT": 0.15,
    "WEIGHT_TRANSFERS": 0.15,
    "WEIGHT_PRICE": 0.15,
    "WEIGHT_DURATION": 0.10,
    "WEIGHT_AVAILABILITY": 0.05,
    "WEIGHT_RELIABILITY": 0.0,   # Reserved — Schedule Reliability component (Sprint 3 persona tuning)
    "WEIGHT_INTEGRITY": 0.0,     # Reserved — Information Integrity component (Sprint 3 persona tuning)
    "COMFORT_THRESHOLD": 70.0,
    "RECOMMENDATION_THRESHOLD": 60.0,
    "IMPORT_LOCATION": "database_export",
    "FEATURE_FLAG_AIR_HYBRID": True,
    "ACTIVE_PROVIDER": "DATABASE",
}

def get_setting(key: str, default: Any) -> Any:
    """
    Retrieve setting value from database system_settings table if available.
    Falls back to default value.
    """
    try:
        from app.database import SessionLocal
        from app.models import SystemSetting
        with SessionLocal() as db:
            setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
            if setting is not None:
                val = setting.value
                if isinstance(default, bool):
                    return val.lower() in ("true", "1", "yes", "on")
                elif isinstance(default, int):
                    return int(val)
                elif isinstance(default, float):
                    return float(val)
                return val
    except Exception:
        pass
    return default

def __getattr__(name: str) -> Any:
    if name in _DEFAULTS:
        return get_setting(name, _DEFAULTS[name])
    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")

# Supported modes
TRANSPORT_MODES = ["Train", "Sleeper Bus", "Bus", "Flight"]

# Fallback Festival Calendar (1-based months: 1=Jan, 12=Dec)
FALLBACK_FESTIVALS = [
    { "name": "Holi", "start_month": 3, "start_day": 1, "end_month": 3, "end_day": 6 },
    { "name": "Summer Vacation", "start_month": 5, "start_day": 10, "end_month": 6, "end_day": 15 },
    { "name": "Raksha Bandhan", "start_month": 8, "start_day": 26, "end_month": 8, "end_day": 30 },
    { "name": "Durga Puja", "start_month": 10, "start_day": 14, "end_month": 10, "end_day": 22 },
    { "name": "Diwali", "start_month": 11, "start_day": 4, "end_month": 11, "end_day": 11 },
    { "name": "Chhath Puja", "start_month": 11, "start_day": 12, "end_month": 11, "end_day": 17 },
    { "name": "New Year", "start_month": 12, "start_day": 25, "end_month": 1, "end_day": 5 }
]

