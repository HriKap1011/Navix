"""
Validation logic for individual railway dataset records.

Each function returns a (is_valid, issue_code, issue_detail) tuple.
Validators do NOT mutate; the importer decides what to do with issues.
"""

import re
from typing import Set, Tuple, Optional

TIME_RE = re.compile(r"^\d{2}:\d{2}$")


def validate_time(value: Optional[str]) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Accepts 'HH:MM', '--:--' (origin/terminus sentinel), or None/empty (treated as '--:--').
    Returns (valid, issue_code, detail).
    """
    if not value or value.strip() in ("", "--:--", "N/A", "NA", "-", "00:00"):
        return True, None, None
    if TIME_RE.match(value.strip()):
        h, m = map(int, value.strip().split(":"))
        if 0 <= h <= 23 and 0 <= m <= 59:
            return True, None, None
    return False, "INVALID_TIME", f"Time '{value}' is not in HH:MM format"


def validate_station_code(code: Optional[str]) -> Tuple[bool, Optional[str], Optional[str]]:
    """Station code must be 2–7 uppercase letters/digits."""
    if not code or not code.strip():
        return False, "MISSING_STATION_CODE", "Station code is empty"
    c = code.strip().upper()
    if re.match(r"^[A-Z0-9]{2,7}$", c):
        return True, None, None
    return False, "INVALID_STATION_CODE", f"Station code '{code}' has invalid format"


def validate_distance(value) -> Tuple[bool, Optional[str], Optional[str]]:
    """Distance must be non-negative number."""
    try:
        d = float(value)
        if d < 0:
            return False, "INVALID_DISTANCE", f"Distance {d} is negative"
        return True, None, None
    except (TypeError, ValueError):
        return False, "INVALID_DISTANCE", f"Cannot parse distance: '{value}'"


def validate_train_number(number: Optional[str]) -> Tuple[bool, Optional[str], Optional[str]]:
    """Train number must be 4–6 digits."""
    if not number or not number.strip():
        return False, "MISSING_TRAIN_NUMBER", "Train number is empty"
    n = number.strip()
    if re.match(r"^\d{4,6}$", n):
        return True, None, None
    return False, "INVALID_TRAIN_NUMBER", f"Train number '{number}' is not 4-6 digits"


def check_timing_anomaly(arrival: Optional[str], departure: Optional[str]) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    At intermediate stops, departure should be >= arrival.
    Origin has '--:--' arrival; terminus has '--:--' departure.
    """
    sentinels = {"", "--:--", None, "N/A", "NA"}
    if arrival in sentinels or departure in sentinels:
        return True, None, None
    try:
        ah, am = map(int, arrival.split(":"))
        dh, dm = map(int, departure.split(":"))
        a_min = ah * 60 + am
        d_min = dh * 60 + dm
        # Allow departure < arrival if train crosses midnight (d_min could be < a_min)
        # Only flag if departure is many hours before arrival at same stop on same day
        if a_min - d_min > 60:   # departure more than 1h before arrival — anomaly
            return False, "TIMING_ANOMALY", f"Departure {departure} is before arrival {arrival}"
        return True, None, None
    except Exception:
        return True, None, None   # Can't parse → already caught by validate_time


def is_station_linked(code: str, known_codes: Set[str]) -> bool:
    """Check if a station code is in the Navix stations table."""
    return code.upper() in known_codes


def normalize_time(value: Optional[str]) -> str:
    """Normalise time strings; return '--:--' for missing/invalid sentinel values."""
    if not value:
        return "--:--"
    v = value.strip()
    if v in ("", "N/A", "NA", "-", "00:00", "0:00"):
        return "--:--"
    if TIME_RE.match(v):
        return v
    return "--:--"


def normalize_running_days(value: Optional[str]) -> str:
    """Normalise running days field to a clean string."""
    if not value or value.strip() in ("", "0000000"):
        return "Unknown"
    v = value.strip()
    # Handle bitmask format "1111111" (Mon-Sun) or "1110111"
    if re.match(r"^[01]{7}$", v):
        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        active = [days[i] for i, b in enumerate(v) if b == "1"]
        if len(active) == 7:
            return "Daily"
        return ",".join(active)
    return v
