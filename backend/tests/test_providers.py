import pytest
from typing import Dict, Any, List
from app.providers.base import BaseProvider
from app.providers.database_provider import DatabaseProvider
from app.providers.csv_provider import CSVProvider
from app.providers.mock_provider import MockProvider
from app.providers.registry import get_active_provider
from app.generator import generate_routes
from app.domain.city import City
from app.domain.station import Station
from app.domain.corridor import Corridor
from app.domain.journey import Journey
from app.domain.leg import Leg, Duration
from app.domain.pricing import Pricing, Money
from app.domain.availability import SeatAvailability
from app.domain.services import calculate_friction_penalty, calculate_smart_scores

def test_provider_interface_satisfaction():
    """
    Ensure all three standard providers inherit from BaseProvider and implement the required interface.
    """
    providers = [DatabaseProvider(), CSVProvider(), MockProvider()]
    
    for provider in providers:
        assert isinstance(provider, BaseProvider)
        
        # Test basic metadata methods
        cities = provider.get_all_cities()
        assert isinstance(cities, list)
        if len(cities) > 0:
            c = cities[0]
            assert isinstance(c, City)
            assert c.name
            assert c.coordinates.latitude is not None
            assert c.coordinates.longitude is not None
            assert hasattr(c, "has_airport")
            assert hasattr(c, "has_train_station")
            
        stations = provider.search_stations()
        assert isinstance(stations, dict)
        
        corridors = provider.get_all_corridors()
        assert isinstance(corridors, dict)
        if len(corridors) > 0:
            corr = list(corridors.values())[0]
            assert isinstance(corr, Corridor)
            assert corr.source
            assert corr.destination
            assert corr.demand_level is not None
            
        demands = provider.get_seasonal_demands()
        assert isinstance(demands, list)
        
        # Health check
        assert isinstance(provider.health_check(), bool)

def test_recommendation_engine_output_equivalency():
    """
    Assert that the recommendation engine produces identical routes (scores, prices, modes, etc.)
    regardless of whether database, CSV, or Mock provider supplies the data.
    """
    db_provider = DatabaseProvider()
    csv_provider = CSVProvider()
    mock_provider = MockProvider()
    
    # We query Delhi to Patna on a Diwali festival rush date
    source = "Delhi"
    destination = "Patna"
    date = "2026-11-05" # Diwali period
    
    # Check if we can run search_routes on each provider
    db_routes = db_provider.search_routes(source, destination, date)
    csv_routes = csv_provider.search_routes(source, destination, date)
    mock_routes = mock_provider.search_routes(source, destination, date)
    
    assert len(db_routes) > 0
    assert len(db_routes) == len(csv_routes)
    assert len(db_routes) == len(mock_routes)
    
    for i in range(len(db_routes)):
        r_db = db_routes[i]
        r_csv = csv_routes[i]
        r_mock = mock_routes[i]
        
        # Verify structure and content are identical
        assert isinstance(r_db, Journey)
        assert r_db.route_id == r_csv.route_id
        assert r_db.route_id == r_mock.route_id
        
        assert r_db.source == r_csv.source
        assert r_db.destination == r_csv.destination
        
        assert r_db.duration.minutes == r_csv.duration.minutes
        assert r_db.price.total_price.amount == r_csv.price.total_price.amount
        assert r_db.nx_score == r_csv.nx_score
        assert r_db.seat_likelihood == r_csv.seat_likelihood
        assert r_db.comfort_score == r_csv.comfort_score
        assert r_db.transport_modes == r_csv.transport_modes

def test_provider_resiliency_and_fallback(monkeypatch):
    """
    Test that if the active provider fails at runtime, the route search engine recovers
    by calling the fallback providers rather than crashing.
    """
    # 1. Force get_active_provider to return DatabaseProvider
    monkeypatch.setenv("ACTIVE_PROVIDER", "DATABASE")
    
    # 2. Verify active provider is DatabaseProvider
    active = get_active_provider()
    assert isinstance(active, DatabaseProvider)
    
    # 3. Mock DatabaseProvider's search_routes to fail
    def mock_fail_search(*args, **kwargs):
        raise RuntimeError("Database Connection Terminated unexpectedly")
        
    monkeypatch.setattr(DatabaseProvider, "search_routes", mock_fail_search)
    
    # 4. Call generate_routes and verify that it doesn't crash but returns valid routes
    # (should fail database, log it, and fallback to CSV/Mock which succeeds)
    routes = generate_routes("Delhi", "Patna", "2026-11-05")
    
    # It must return a non-empty list of routes using the fallback provider!
    assert isinstance(routes, list)
    assert len(routes) > 0
    assert routes[0].source == "Delhi"

def test_domain_services_provider_independence():
    """
    Verify that domain services calculate comfort, friction, and scores correctly
    without depending on any provider context.
    """
    # Construct a dummy Journey completely in-memory
    leg = Leg(
        from_city="Delhi",
        to_city="Patna",
        mode="Train",
        duration=Duration(minutes=600),
        departure_time="08:00",
        arrival_time="18:00"
    )
    
    journey = Journey(
        route_id="TEST-001",
        source="Delhi",
        destination="Patna",
        duration=Duration(minutes=600),
        price=Pricing(base_price=Money(1000.0), total_price=Money(1000.0)),
        nx_score=0,
        seat_likelihood=80.0,
        comfort_score=75.0,
        transport_modes=["Train"],
        recommendation_reason="Test Reason",
        departure_time="08:00",
        arrival_time="18:00",
        legs=[leg],
        layover_duration=Duration(minutes=0),
        availability=SeatAvailability(likelihood=80.0)
    )
    
    # Run friction penalty calculation
    penalty = calculate_friction_penalty(journey)
    # The journey has convenient timings (08:00 to 18:00), no transfers, and high seat likelihood (80)
    # Friction penalty should be 0.
    assert penalty == 0
    
    # Run smart scoring
    scored = calculate_smart_scores([journey])
    assert len(scored) == 1
    assert scored[0].nx_score > 0
    assert scored[0].is_recommended is True
