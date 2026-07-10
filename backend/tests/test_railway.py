import pytest
from app.railway.provider import RailwayScheduleProvider
from app.railway.connector import RailwayScheduleConnector
from app.search.orchestrator import SearchOrchestrator
from app.data_sources.registry import registry

def test_railway_provider_direct():
    """Verify RailwayScheduleProvider works and handles lookup."""
    provider = RailwayScheduleProvider()
    assert provider.health_check() is True

    # Delhi -> Patna has real train stops in train_stops.csv (e.g. 12301, 12305, etc.)
    routes = provider.search_routes("Delhi", "Patna", "2025-07-10")
    assert isinstance(routes, list)
    assert len(routes) > 0
    for r in routes:
        assert r.source == "Delhi"
        assert r.destination == "Patna"
        assert r.transport_modes == ["Train"]
        assert r.legs[0].mode == "Train"
        assert r.route_id.startswith("RAIL-")

    # Surat -> Bikaner has no real trains in train_stops.csv
    routes_unsupported = provider.search_routes("Surat", "Bikaner", "2025-07-10")
    assert isinstance(routes_unsupported, list)
    assert len(routes_unsupported) == 0

def test_railway_connector_registry():
    """Verify RailwayScheduleConnector is registered correctly."""
    conn = registry.get_connector("RAILWAY_SCHEDULE")
    assert conn is not None
    assert isinstance(conn, RailwayScheduleConnector)
    assert conn.metadata().priority == 0
    assert conn.metadata().status == "Active"

def test_search_orchestrator_integration():
    """Verify SearchOrchestrator falls back to synthetic when real railway is not covered."""
    orchestrator = SearchOrchestrator()

    # Delhi -> Patna: should contain real trains (RAIL- prefix)
    res_real = orchestrator.search("Delhi", "Patna", "2025-07-10")
    assert res_real["success"] is True
    journeys_real = res_real["routes"]
    assert len(journeys_real) > 0
    
    # Check if there is at least one real train (RAIL- prefix)
    has_real = any(j["route_id"].startswith("RAIL-") for j in journeys_real)
    assert has_real is True

    # Assert that NO direct synthetic/dummy train routes exist when real ones exist
    has_synthetic_train = any(j["route_id"].startswith("NX-") and j["transport_modes"] == ["Train"] for j in journeys_real)
    assert has_synthetic_train is False


    # Surat -> Bikaner: should fallback to synthetic (DATABASE/CSV/MOCK)
    res_fallback = orchestrator.search("Surat", "Bikaner", "2025-07-10")
    assert res_fallback["success"] is True
    journeys_fallback = res_fallback["routes"]
    assert len(journeys_fallback) > 0
    # None should have RAIL- prefix because Surat->Bikaner has no real train schedule data
    has_real_fallback = any(j["route_id"].startswith("RAIL-") for j in journeys_fallback)
    assert has_real_fallback is False
