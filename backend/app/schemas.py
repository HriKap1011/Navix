from pydantic import BaseModel
from typing import List, Optional

class RouteSearchRequest(BaseModel):
    source: str
    destination: str
    date: str

class RouteLegSchema(BaseModel):
    from_city: str
    to_city: str
    mode: str
    duration: str
    departure_time: str
    arrival_time: str

class RouteResponseItem(BaseModel):
    route_id: str
    source: str
    destination: str
    duration: str
    price: int
    nx_score: int
    seat_likelihood: int
    comfort_score: int
    transport_modes: List[str]
    recommendation_reason: str
    
    # Rich parameters for advanced layout integration
    departure_time: Optional[str] = None
    arrival_time: Optional[str] = None
    legs: Optional[List[RouteLegSchema]] = []
    layover_duration: Optional[str] = "0m"
    waitlist_code: Optional[str] = None
    confirmation_likelihood: Optional[str] = None
    confirmation_probability: Optional[int] = None
    peak_demand_factor: Optional[str] = None
    rescue_recommendation: Optional[str] = None
    recommendation_reasoning: Optional[List[str]] = []
    is_recommended: Optional[bool] = False

class RouteSearchResponse(BaseModel):
    success: bool
    routes: List[RouteResponseItem]
    error: Optional[str] = None
