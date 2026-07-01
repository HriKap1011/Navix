import pytest
from typing import Dict, Any, List
from app.providers.base import BaseProvider
from app.providers.database_provider import DatabaseProvider
from app.providers.csv_provider import CSVProvider
from app.providers.mock_provider import MockProvider
from app.providers.registry import get_active_provider, _registry
from app.generator import generate_routes

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
            assert "name" in c
            assert "lat" in c
            assert "lon" in c
            assert "has_airport" in c
            assert "has_train_station" in c
            
        stations = provider.search_stations()
        assert isinstance(stations, dict)
        
        corridors = provider.get_all_corridors()
        assert isinstance(corridors, dict)
        if len(corridors) > 0:
            corr = list(corridors.values())[0]
            assert "source" in corr
            assert "destination" in corr
            assert "tier" in corr
            
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
    
    # Helper to strip non-deterministic keys (like timestamps if any, though our generator has none)
    def clean_route_for_comparison(route: Dict[str, Any]) -> Dict[str, Any]:
        cleaned = dict(route)
        # Deep copy legs
        if "legs" in cleaned:
            cleaned["legs"] = [dict(leg) for leg in cleaned["legs"]]
        return cleaned

    for i in range(len(db_routes)):
        r_db = clean_route_for_comparison(db_routes[i])
        r_csv = clean_route_for_comparison(csv_routes[i])
        r_mock = clean_route_for_comparison(mock_routes[i])
        
        # Verify structure and content are identical
        assert r_db["route_id"] == r_csv["route_id"]
        assert r_db["route_id"] == r_mock["route_id"]
        
        assert r_db["source"] == r_csv["source"]
        assert r_db["destination"] == r_csv["destination"]
        
        assert r_db["duration"] == r_csv["duration"]
        assert r_db["price"] == r_csv["price"]
        assert r_db["nx_score"] == r_csv["nx_score"]
        assert r_db["seat_likelihood"] == r_csv["seat_likelihood"]
        assert r_db["comfort_score"] == r_csv["comfort_score"]
        assert r_db["transport_modes"] == r_csv["transport_modes"]
        
        # Deep compare everything
        assert r_db == r_csv
        assert r_db == r_mock

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
    assert routes[0]["source"] == "Delhi"
