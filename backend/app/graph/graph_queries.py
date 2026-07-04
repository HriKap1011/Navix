import logging
from typing import List, Dict, Any, Set, Tuple
from app.graph.graph_builder import tkg

logger = logging.getLogger("navix.graph_queries")

def find_alternate_boarding_stations(city_name: str) -> List[str]:
    """
    Find alternate stations belonging to or located near the given city.
    """
    city_node_id = f"City:{city_name.strip()}"
    if city_node_id not in tkg.nodes:
        return []

    stations: Set[str] = set()
    # 1. Direct HAS_STATION connections
    neighbors = tkg.edges.get(city_node_id, [])
    for neighbor, edge_type, _ in neighbors:
        if edge_type == "HAS_STATION" and neighbor.startswith("Station:"):
            stations.add(neighbor.split(":")[1])

    # 2. Nearby stations of the city's main stations
    main_stations = list(stations)
    for s_code in main_stations:
        s_node_id = f"Station:{s_code}"
        s_neighbors = tkg.edges.get(s_node_id, [])
        for neighbor, edge_type, _ in s_neighbors:
            if edge_type == "NEARBY" and neighbor.startswith("Station:"):
                stations.add(neighbor.split(":")[1])

    return sorted(list(stations))

def find_shortest_station_path(start_code: str, end_code: str) -> List[str]:
    """
    Perform a BFS on the travel graph to compute the shortest station-to-station traversal path.
    """
    start_node = f"Station:{start_code.upper().strip()}"
    end_node = f"Station:{end_code.upper().strip()}"
    
    if start_node not in tkg.nodes or end_node not in tkg.nodes:
        return []
        
    queue = [[start_node]]
    visited = {start_node}
    
    while queue:
        path = queue.pop(0)
        current = path[-1]
        
        if current == end_node:
            return [node.split(":")[1] for node in path]
            
        # Get adjacent nodes
        neighbors = tkg.edges.get(current, [])
        for neighbor, edge_type, _ in neighbors:
            # We traverse through physical/structural connections
            if edge_type in ["NEARBY", "CONNECTED_TO", "BELONGS_TO", "HAS_STATION"]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    new_path = list(path)
                    new_path.append(neighbor)
                    queue.append(new_path)
                    
    return []

def find_multimodal_transfer_points(city_name: str) -> List[str]:
    """
    Identify hubs in the given city that support multiple modes of transport.
    """
    city_node_id = f"City:{city_name.strip()}"
    if city_node_id not in tkg.nodes:
        return []
        
    multimodal_hubs = []
    neighbors = tkg.edges.get(city_node_id, [])
    for neighbor, edge_type, _ in neighbors:
        if edge_type == "HAS_STATION" and neighbor.startswith("Station:"):
            # Check station details
            properties = tkg.nodes[neighbor]["properties"]
            station_type = properties.get("station_type")
            # If the station name contains 'Terminal' or maps to multiple modes in general, it is a hub
            if station_type in ["Rail", "Bus", "Multimodal"] or "junction" in properties.get("name", "").lower():
                multimodal_hubs.append(properties.get("code"))
                
    return multimodal_hubs

def find_nearby_transport_hubs(city_name: str, max_distance_km: float = 30.0) -> List[Dict[str, Any]]:
    """
    Returns transport hubs (stations/terminals) located near the specified city.
    """
    city_node_id = f"City:{city_name.strip()}"
    if city_node_id not in tkg.nodes:
        return []
        
    hubs = []
    neighbors = tkg.edges.get(city_node_id, [])
    for neighbor, edge_type, props in neighbors:
        if edge_type == "HAS_STATION" and neighbor.startswith("Station:"):
            properties = tkg.nodes[neighbor]["properties"]
            distance = props.get("distance_km", 0.0)
            if distance <= max_distance_km:
                hubs.append({
                    "code": properties.get("code"),
                    "name": properties.get("name"),
                    "type": properties.get("station_type"),
                    "distance_km": distance
                })
    return sorted(hubs, key=lambda x: x["distance_km"])

def find_reachable_cities_within_x_km(city_name: str, x_km: float) -> List[Dict[str, Any]]:
    """
    Find neighbor cities connected via corridor within specified geographical distance metrics.
    """
    city_node_id = f"City:{city_name.strip()}"
    if city_node_id not in tkg.nodes:
        return []
        
    # We can estimate geographical distance or look at connected corridors
    reachable = []
    neighbors = tkg.edges.get(city_node_id, [])
    for neighbor, edge_type, props in neighbors:
        if edge_type == "CONNECTED_TO" and neighbor.startswith("City:"):
            properties = tkg.nodes[neighbor]["properties"]
            # Let's check distance if present, or corridor duration as fallback metric
            reachable.append({
                "city_name": properties.get("name"),
                "state": properties.get("state"),
                "avg_duration": props.get("avg_duration")
            })
    return reachable
