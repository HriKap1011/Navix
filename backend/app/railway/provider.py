"""
Railway Schedule Provider
==========================
Queries the imported Indian Railways dataset (railway_trains, railway_train_stops)
to return real Journey domain objects for routes covered by the dataset.

Resolution chain:
  City name  →  NearbyStationMapping  →  station_code(s)
             →  RailwayTrainStop lookup (both endpoints)
             →  RailwayTrain metadata
             →  Journey + Leg domain objects

Returns [] when no real trains found (triggers synthetic fallback from other connectors).
"""

import hashlib
import logging
from typing import List, Set, Tuple, Optional, Dict
from app.providers.base import BaseProvider
from app.domain.journey import Journey
from app.domain.leg import Leg, Duration
from app.domain.pricing import Money, Pricing
from app.domain.availability import SeatAvailability

logger = logging.getLogger("navix.railway.provider")

# ──────────────────────────────────────────────
# Fare estimation (Indian Railways base rates)
# ──────────────────────────────────────────────
# Rates per km by train category (approx sleeper class)
_FARE_PER_KM: Dict[str, float] = {
    "Rajdhani":  3.5,
    "Duronto":   3.2,
    "Shatabdi":  3.8,
    "Tejas":     4.0,
    "Humsafar":  3.0,
    "Garib Rath": 1.8,
    "Superfast": 1.5,
    "Mail/Express": 1.2,
    "Express":   1.2,
    "default":   1.0,
}
_MIN_FARE = 100.0   # INR
_MAX_FARE = 8000.0  # INR

def _estimate_fare(distance_km: float, train_type: str) -> float:
    rate = _FARE_PER_KM.get(train_type or "default", _FARE_PER_KM["default"])
    fare = distance_km * rate
    return max(_MIN_FARE, min(fare, _MAX_FARE))


# ──────────────────────────────────────────────
# Comfort & seat scores by train type
# ──────────────────────────────────────────────
_COMFORT: Dict[str, float] = {
    "Rajdhani":     92.0,
    "Tejas":        90.0,
    "Shatabdi":     88.0,
    "Duronto":      85.0,
    "Humsafar":     82.0,
    "Garib Rath":   75.0,
    "Superfast":    70.0,
    "Mail/Express": 62.0,
    "Express":      62.0,
    "default":      60.0,
}
_SEAT_LIKELIHOOD: Dict[str, float] = {
    "Rajdhani":     78.0,
    "Tejas":        80.0,
    "Shatabdi":     82.0,
    "Duronto":      72.0,
    "Humsafar":     75.0,
    "Garib Rath":   55.0,
    "Superfast":    60.0,
    "Mail/Express": 48.0,
    "Express":      48.0,
    "default":      50.0,
}


def _time_to_minutes(t: Optional[str]) -> Optional[int]:
    """Convert 'HH:MM' to minutes since midnight. Returns None for missing/sentinel."""
    if not t or t.strip() in ("--:--", "", "N/A"):
        return None
    try:
        h, m = map(int, t.strip().split(":"))
        return h * 60 + m
    except Exception:
        return None


def _duration_minutes(dep: Optional[str], arr: Optional[str]) -> int:
    """Calculate travel minutes, accounting for overnight trains."""
    d = _time_to_minutes(dep)
    a = _time_to_minutes(arr)
    if d is None or a is None:
        return 0
    diff = a - d
    if diff < 0:
        diff += 24 * 60   # crosses midnight
    return diff


def _make_route_id(train_number: str, src_code: str, dst_code: str) -> str:
    raw = f"RAIL-{train_number}-{src_code}-{dst_code}"
    h = hashlib.md5(raw.encode()).hexdigest()[:6].upper()
    return f"RAIL-{train_number}-{src_code}-{dst_code}-{h}"


class RailwayScheduleProvider(BaseProvider):
    """
    Provider backed by the imported Indian Railways dataset.
    Only overrides search_routes(); all other abstract methods
    delegate to the DatabaseProvider for city/station/corridor metadata.
    """

    def __init__(self):
        from app.providers.database_provider import DatabaseProvider
        self._db_provider = DatabaseProvider()

    # ── Core search method ─────────────────────────────────────────────────

    def search_routes(self, source: str, destination: str, date: str) -> List[Journey]:
        """
        Find real trains covering source city → destination city.
        Returns Journey list (empty if none found).
        """
        try:
            src_codes  = self._city_to_station_codes(source)
            dest_codes = self._city_to_station_codes(destination)

            if not src_codes or not dest_codes:
                logger.debug(f"No station codes found for {source!r} or {destination!r}")
                return []

            journeys = self._query_trains(source, destination, src_codes, dest_codes)
            logger.info(
                f"RailwayScheduleProvider: {source} → {destination}: "
                f"{len(journeys)} real train(s) found"
            )
            return journeys

        except Exception as e:
            logger.error(f"RailwayScheduleProvider.search_routes error: {e}", exc_info=True)
            return []

    # ── City → station code resolution ────────────────────────────────────

    def _city_to_station_codes(self, city_name: str) -> Set[str]:
        """
        Return all station codes associated with a city, using:
          1. NearbyStationMapping (most precise)
          2. Station.city FK join
          3. City.code / City.station fallback
        """
        codes: Set[str] = set()
        try:
            from app.database import SessionLocal
            from app.models import City, Station, NearbyStationMapping

            with SessionLocal() as db:
                # Approach 1: NearbyStationMapping
                rows = db.query(Station.station_code).join(
                    NearbyStationMapping, NearbyStationMapping.station_id == Station.id
                ).join(
                    City, NearbyStationMapping.city_id == City.id
                ).filter(
                    City.city_name.ilike(city_name.strip())
                ).all()
                codes.update(r[0].upper() for r in rows)

                # Approach 2: Direct City→Station FK
                rows2 = db.query(Station.station_code).join(
                    City, Station.city_id == City.id
                ).filter(
                    City.city_name.ilike(city_name.strip())
                ).all()
                codes.update(r[0].upper() for r in rows2)

                # Approach 3: City.code / City.station columns as fallback
                city_row = db.query(City).filter(
                    City.city_name.ilike(city_name.strip())
                ).first()
                if city_row:
                    if city_row.code:
                        codes.add(city_row.code.upper())
                    if city_row.station:
                        codes.add(city_row.station.upper())

        except Exception as e:
            logger.warning(f"Station code resolution failed for {city_name!r}: {e}")

        return codes

    # ── Train query ────────────────────────────────────────────────────────

    def _query_trains(
        self,
        source_city: str,
        dest_city: str,
        src_codes: Set[str],
        dest_codes: Set[str],
    ) -> List[Journey]:
        """
        Find trains where:
          - A stop with station_code in src_codes exists
          - A stop with station_code in dest_codes exists
          - The destination stop_number > source stop_number (correct direction)
        """
        journeys: List[Journey] = []

        try:
            from app.database import SessionLocal
            from app.railway.models_ext import RailwayTrain, RailwayTrainStop
            from sqlalchemy.orm import aliased

            with SessionLocal() as db:
                SrcStop  = aliased(RailwayTrainStop)
                DestStop = aliased(RailwayTrainStop)

                results = (
                    db.query(RailwayTrain, SrcStop, DestStop)
                    .join(SrcStop, SrcStop.train_id == RailwayTrain.id)
                    .join(DestStop, DestStop.train_id == RailwayTrain.id)
                    .filter(
                        SrcStop.station_code.in_(src_codes),
                        DestStop.station_code.in_(dest_codes),
                        DestStop.stop_number > SrcStop.stop_number,
                    )
                    .order_by(RailwayTrain.train_number, SrcStop.stop_number)
                    .all()
                )

                # Deduplicate by train_number (pick earliest matching src stop)
                seen: Set[str] = set()
                for train, src_stop, dest_stop in results:
                    key = f"{train.train_number}-{src_stop.station_code}-{dest_stop.station_code}"
                    if key in seen:
                        continue
                    seen.add(key)

                    journey = self._build_journey(
                        train, src_stop, dest_stop, source_city, dest_city
                    )
                    if journey:
                        journeys.append(journey)

        except Exception as e:
            logger.error(f"Railway train query failed: {e}", exc_info=True)

        return journeys

    # ── Journey builder ────────────────────────────────────────────────────

    def _build_journey(
        self,
        train,
        src_stop,
        dest_stop,
        source_city: str,
        dest_city: str,
    ) -> Optional[Journey]:
        """Convert a matched train + stop pair into a Journey domain object."""
        try:
            dep_time = src_stop.departure_time or "--:--"
            arr_time = dest_stop.arrival_time  or "--:--"

            duration_min = _duration_minutes(dep_time, arr_time)
            # Guard against missing times producing 0 — estimate from distance instead
            if duration_min == 0 and dest_stop.distance_from_source_km and src_stop.distance_from_source_km:
                dist = dest_stop.distance_from_source_km - src_stop.distance_from_source_km
                # Average Indian train speed ~65 km/h
                duration_min = max(60, int((dist / 65.0) * 60))

            # Distance for this segment
            seg_dist = 0.0
            if dest_stop.distance_from_source_km and src_stop.distance_from_source_km:
                seg_dist = max(0.0, dest_stop.distance_from_source_km - src_stop.distance_from_source_km)
            elif train.total_distance_km:
                seg_dist = float(train.total_distance_km)

            train_type  = train.train_type or "Express"
            fare        = _estimate_fare(seg_dist, train_type)
            comfort     = _COMFORT.get(train_type, _COMFORT["default"])
            seat_pct    = _SEAT_LIKELIHOOD.get(train_type, _SEAT_LIKELIHOOD["default"])

            # Availability semantics
            if seat_pct >= 75:
                waitlist = "AVL"
                conf_prob = 90.0
                conf_str = "Highly Likely"
            elif seat_pct >= 55:
                waitlist = "RAC"
                conf_prob = 65.0
                conf_str = "Likely"
            else:
                waitlist = "WL/5"
                conf_prob = 40.0
                conf_str = "Uncertain"

            availability = SeatAvailability(
                likelihood=seat_pct,
                waitlist_code=waitlist,
                confirmation_probability=conf_prob,
                confirmation_likelihood=conf_str,
                peak_demand_factor="Moderate",
                rescue_recommendation=None,
            )

            leg = Leg(
                from_city=src_stop.station_name or src_stop.station_code,
                to_city=dest_stop.station_name or dest_stop.station_code,
                mode="Train",
                duration=Duration(minutes=duration_min),
                departure_time=dep_time,
                arrival_time=arr_time,
            )

            route_id = _make_route_id(
                train.train_number, src_stop.station_code, dest_stop.station_code
            )

            return Journey(
                route_id=route_id,
                source=source_city,
                destination=dest_city,
                duration=Duration(minutes=duration_min),
                price=Pricing(
                    base_price=Money(amount=fare),
                    total_price=Money(amount=fare),
                ),
                nx_score=0,   # set by NX scorer downstream
                seat_likelihood=seat_pct,
                comfort_score=comfort,
                transport_modes=["Train"],
                recommendation_reason=f"{train.train_number} {train.train_name}",
                departure_time=dep_time,
                arrival_time=arr_time,
                legs=[leg],
                availability=availability,
                is_recommended=False,
            )
        except Exception as e:
            logger.warning(f"Failed to build Journey for train {getattr(train, 'train_number', '?')}: {e}")
            return None

    # ── BaseProvider stubs (delegate to DatabaseProvider) ──────────────────

    def search_stations(self):
        return self._db_provider.search_stations()

    def search_city(self, name):
        return self._db_provider.search_city(name)

    def get_nearby_stations(self, city_name):
        return self._db_provider.get_nearby_stations(city_name)

    def get_corridor(self, source, destination):
        return self._db_provider.get_corridor(source, destination)

    def health_check(self) -> bool:
        try:
            from app.database import SessionLocal
            from app.railway.models_ext import RailwayTrain
            with SessionLocal() as db:
                db.query(RailwayTrain).first()
            return True
        except Exception:
            return False

    def get_all_cities(self):
        return self._db_provider.get_all_cities()

    def get_all_corridors(self):
        return self._db_provider.get_all_corridors()

    def get_seasonal_demands(self):
        return self._db_provider.get_seasonal_demands()

    def is_valid_city(self, name):
        return self._db_provider.is_valid_city(name)

    def get_all_stations(self):
        return self._db_provider.get_all_stations()

    def get_all_nearby_mappings(self):
        return self._db_provider.get_all_nearby_mappings()
