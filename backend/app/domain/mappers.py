from typing import Any, Dict, List, Optional
from app.domain.city import City, Coordinates
from app.domain.station import Station
from app.domain.corridor import Corridor
from app.domain.enums import DemandLevel
from app.domain.recommendation import SeasonalDemand
from app.domain.journey import Journey
from app.domain.leg import Leg, Duration
from app.domain.pricing import Money

def map_city_to_domain(city_data: Any) -> City:
    if hasattr(city_data, "city_name"):  # SQLAlchemy model instance
        return City(
            name=city_data.city_name,
            state=city_data.state,
            tier=city_data.tier,
            importance_score=city_data.importance_score if city_data.importance_score is not None else 50,
            demand_category=city_data.demand_category or "Standard",
            coordinates=Coordinates(latitude=city_data.latitude, longitude=city_data.longitude),
            has_airport=bool(city_data.has_airport),
            has_train_station=bool(city_data.has_train_station),
            code=city_data.code or "",
            station=city_data.station or ""
        )
    elif isinstance(city_data, dict):
        lat = city_data.get("lat") or city_data.get("latitude")
        lon = city_data.get("lon") or city_data.get("longitude")
        return City(
            name=city_data.get("name") or city_data.get("city_name") or "",
            state=city_data.get("state"),
            tier=city_data.get("tier"),
            importance_score=city_data.get("importance_score") if city_data.get("importance_score") is not None else 50,
            demand_category=city_data.get("demand_category") or "Standard",
            coordinates=Coordinates(latitude=float(lat) if lat is not None else 0.0, longitude=float(lon) if lon is not None else 0.0),
            has_airport=bool(city_data.get("has_airport")),
            has_train_station=bool(city_data.get("has_train_station") if city_data.get("has_train_station") is not None else True),
            code=city_data.get("code") or "",
            station=city_data.get("station") or ""
        )
    else:
        raise TypeError(f"Cannot map type {type(city_data)} to City domain model")

def map_station_to_domain(station_data: Any) -> Station:
    if hasattr(station_data, "station_code"):  # SQLAlchemy model instance
        city_name = station_data.city.city_name if station_data.city else None
        return Station(
            station_code=station_data.station_code,
            station_name=station_data.station_name,
            city_name=city_name,
            station_type=station_data.station_type or "Rail",
            importance_score=station_data.importance_score if station_data.importance_score is not None else 50
        )
    elif isinstance(station_data, dict):
        return Station(
            station_code=station_data.get("station_code") or "",
            station_name=station_data.get("station_name") or "",
            city_name=station_data.get("city_name"),
            station_type=station_data.get("station_type") or "Rail",
            importance_score=station_data.get("importance_score") if station_data.get("importance_score") is not None else 50
        )
    else:
        raise TypeError(f"Cannot map type {type(station_data)} to Station domain model")

def map_demand_level(dl: Optional[str]) -> DemandLevel:
    if not dl:
        return DemandLevel.MODERATE
    cleaned = dl.strip().title()
    try:
        return DemandLevel(cleaned)
    except ValueError:
        return DemandLevel.MODERATE

def map_corridor_to_domain(corridor_data: Any) -> Corridor:
    if hasattr(corridor_data, "demand_level") or hasattr(corridor_data, "tier"):  # SQLAlchemy model or aliased query result
        src_name = corridor_data.src_name if hasattr(corridor_data, "src_name") else ""
        dest_name = corridor_data.dest_name if hasattr(corridor_data, "dest_name") else ""
        demand_level = corridor_data.demand_level if hasattr(corridor_data, "demand_level") else "Moderate"
        migration_relevance = corridor_data.migration_relevance if hasattr(corridor_data, "migration_relevance") else "Standard"
        seasonal_pressure = corridor_data.seasonal_pressure if hasattr(corridor_data, "seasonal_pressure") else "Standard"
        avg_duration = corridor_data.avg_duration if hasattr(corridor_data, "avg_duration") else "12h"
        return Corridor(
            source=src_name,
            destination=dest_name,
            demand_level=map_demand_level(demand_level),
            migration_relevance=migration_relevance or "Standard",
            seasonal_pressure=seasonal_pressure or "Standard",
            avg_duration=avg_duration or "12h"
        )
    elif isinstance(corridor_data, dict):
        dl = corridor_data.get("tier") or corridor_data.get("demand_level") or "Moderate"
        return Corridor(
            source=corridor_data.get("source") or "",
            destination=corridor_data.get("destination") or "",
            demand_level=map_demand_level(dl),
            migration_relevance=corridor_data.get("migration_relevance") or "Standard",
            seasonal_pressure=corridor_data.get("seasonal_pressure") or "Standard",
            avg_duration=corridor_data.get("avg_duration") or "12h"
        )
    else:
        raise TypeError(f"Cannot map type {type(corridor_data)} to Corridor domain model")


def map_seasonal_demand_to_domain(demand_data: Any) -> SeasonalDemand:
    if hasattr(demand_data, "festival_name"):  # SQLAlchemy model
        return SeasonalDemand(
            name=demand_data.festival_name,
            start_month=demand_data.start_month,
            start_day=demand_data.start_day,
            end_month=demand_data.end_month,
            end_day=demand_data.end_day,
            seat_modifier=demand_data.seat_modifier,
            comfort_modifier=demand_data.comfort_modifier,
            price_multiplier=demand_data.price_multiplier,
            crowd_modifier=demand_data.crowd_modifier
        )
    elif isinstance(demand_data, dict):
        return SeasonalDemand(
            name=demand_data.get("name") or demand_data.get("festival_name") or "",
            start_month=int(demand_data.get("start_month", 1)),
            start_day=int(demand_data.get("start_day", 1)),
            end_month=int(demand_data.get("end_month", 1)),
            end_day=int(demand_data.get("end_day", 1)),
            seat_modifier=float(demand_data.get("seat_modifier", 1.0)),
            comfort_modifier=int(demand_data.get("comfort_modifier", 0)),
            price_multiplier=float(demand_data.get("price_multiplier", 1.0)),
            crowd_modifier=int(demand_data.get("crowd_modifier", 0))
        )
    else:
        raise TypeError(f"Cannot map type {type(demand_data)} to SeasonalDemand domain model")

def map_journey_to_dto(journey: Journey) -> Dict[str, Any]:
    legs_dto = []
    for leg in journey.legs:
        legs_dto.append({
            "from_city": leg.from_city,
            "to_city": leg.to_city,
            "mode": leg.mode,
            "duration": leg.duration.formatted,
            "departure_time": leg.departure_time,
            "arrival_time": leg.arrival_time
        })

    dto = {
        "route_id": journey.route_id,
        "source": journey.source,
        "destination": journey.destination,
        "duration": journey.duration.formatted,
        "price": int(round(journey.price.total_price.amount if journey.price else 0)),
        "nx_score": journey.nx_score,
        "seat_likelihood": int(round(journey.seat_likelihood)),
        "comfort_score": int(round(journey.comfort_score)),
        "transport_modes": journey.transport_modes,
        "recommendation_reason": journey.recommendation_reason,
        "departure_time": journey.departure_time,
        "arrival_time": journey.arrival_time,
        "legs": legs_dto,
        "layover_duration": journey.layover_duration.formatted,
        "is_recommended": journey.is_recommended,
        "recommendation_reasoning": journey.recommendation_reasoning
    }

    if journey.availability:
        dto["waitlist_code"] = journey.availability.waitlist_code
        dto["confirmation_likelihood"] = journey.availability.confirmation_likelihood
        if journey.availability.confirmation_probability is not None:
            dto["confirmation_probability"] = int(round(journey.availability.confirmation_probability))
        dto["peak_demand_factor"] = journey.availability.peak_demand_factor
        dto["rescue_recommendation"] = journey.availability.rescue_recommendation

    return dto

def map_city_to_dto(city: City) -> Dict[str, Any]:
    return {
        "name": city.name,
        "state": city.state,
        "tier": city.tier,
        "lat": city.coordinates.latitude,
        "lon": city.coordinates.longitude,
        "has_airport": city.has_airport,
        "has_train_station": city.has_train_station,
        "code": city.code,
        "station": city.station
    }

