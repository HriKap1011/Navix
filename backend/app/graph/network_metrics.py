from typing import Dict, List, Any
from app.graph.graph_builder import tkg

class NetworkMetrics:
    @staticmethod
    def get_network_metrics() -> Dict[str, Any]:
        """
        Calculate graph topological metrics (node degrees, centralities, hubs, disconnected nodes).
        """
        degrees: Dict[str, int] = {}
        for source_id, connections in tkg.edges.items():
            degrees[source_id] = degrees.get(source_id, 0) + len(connections)
            for target_id, _, _ in connections:
                degrees[target_id] = degrees.get(target_id, 0) + 1

        # Fallback for nodes with 0 degree
        for node_id in tkg.nodes:
            if node_id not in degrees:
                degrees[node_id] = 0

        # Categorize node degrees
        city_degrees = {}
        station_degrees = {}
        disconnected_nodes = []

        for node_id, data in tkg.nodes.items():
            deg = degrees.get(node_id, 0)
            if deg == 0:
                disconnected_nodes.append({
                    "id": node_id,
                    "name": data["properties"].get("name", node_id),
                    "type": data["type"]
                })
            
            if data["type"] == "City":
                city_degrees[data["properties"].get("name")] = deg
            elif data["type"] == "Station":
                # station_name already contains the code in parentheses from the DB
                station_degrees[data["properties"].get("name", data["properties"].get("code"))] = deg

        # Hub cities (top 5)
        hub_cities = sorted(
            [{"name": k, "connections_count": v} for k, v in city_degrees.items()],
            key=lambda x: x["connections_count"],
            reverse=True
        )[:5]

        # Most connected stations (top 5)
        most_connected_stations = sorted(
            [{"name": k, "connections_count": v} for k, v in station_degrees.items()],
            key=lambda x: x["connections_count"],
            reverse=True
        )[:5]

        return {
            "degrees": degrees,
            "hub_cities": hub_cities,
            "most_connected_stations": most_connected_stations,
            "disconnected_nodes": disconnected_nodes[:10], # Cap to 10 nodes
            "disconnected_count": len(disconnected_nodes)
        }
