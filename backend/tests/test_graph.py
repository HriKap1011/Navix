import pytest
from app.graph.graph_builder import tkg, rebuild_graph
from app.graph.graph_queries import (
    find_alternate_boarding_stations,
    find_shortest_station_path,
    find_multimodal_transfer_points,
    find_nearby_transport_hubs,
    find_reachable_cities_within_x_km
)
from app.graph.graph_validator import GraphValidator
from app.graph.network_metrics import NetworkMetrics

def test_graph_construction():
    """
    Assert that rebuilding the graph creates city and station nodes, has-station structural links,
    and CONNECTED_TO corridors correctly from database rows.
    """
    success = rebuild_graph()
    assert success is True
    
    # Assert nodes and edges count are positive
    assert len(tkg.nodes) > 0
    assert len(tkg.edges) > 0
    
    # Assert key nodes exist
    assert "City:Delhi" in tkg.nodes
    assert "City:Patna" in tkg.nodes
    
    # Check node properties
    delhi = tkg.nodes["City:Delhi"]
    assert delhi["type"] == "City"
    assert delhi["properties"]["name"] == "Delhi"

def test_graph_validation():
    """
    Assert that the graph validator returns health details and reports no symmetry/dangling edge issues.
    """
    rebuild_graph()
    report = GraphValidator.validate_graph()
    
    assert report["valid"] is True
    assert report["dangling_edges_count"] == 0
    assert report["total_issues_count"] == 0

def test_graph_queries():
    """
    Verify traversal query outputs: alternate boarding, BFS shortest paths, hubs.
    """
    rebuild_graph()
    
    # 1. Alternate boarding stations for Delhi
    alt_stations = find_alternate_boarding_stations("Delhi")
    assert isinstance(alt_stations, list)
    assert len(alt_stations) > 0
    
    # 2. BFS Shortest Path between NDLS (Delhi) and PNBE (Patna)
    # The nodes are: Station:NDLS -> City:Delhi -> City:Patna -> Station:PNBE
    path = find_shortest_station_path("NDLS", "PNBE")
    assert isinstance(path, list)
    assert len(path) >= 2
    assert path[0] == "NDLS"
    assert path[-1] == "PNBE"
    
    # 3. Reachable cities within a large corridor search
    reachable = find_reachable_cities_within_x_km("Delhi", 1000.0)
    assert isinstance(reachable, list)
    assert len(reachable) > 0
    
    # 4. Nearby hubs
    hubs = find_nearby_transport_hubs("Delhi", 30.0)
    assert isinstance(hubs, list)
    assert len(hubs) > 0

def test_network_metrics():
    """
    Assert degree centralities and hub sorting return properly.
    """
    rebuild_graph()
    metrics = NetworkMetrics.get_network_metrics()
    
    assert len(metrics["hub_cities"]) > 0
    assert len(metrics["most_connected_stations"]) > 0
    assert metrics["hub_cities"][0]["connections_count"] > 0
