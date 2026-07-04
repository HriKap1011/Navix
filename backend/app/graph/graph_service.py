from app.graph.graph_builder import tkg, rebuild_graph
from app.graph.graph_queries import (
    find_alternate_boarding_stations,
    find_shortest_station_path,
    find_multimodal_transfer_points,
    find_nearby_transport_hubs,
    find_reachable_cities_within_x_km
)
from app.graph.graph_validator import GraphValidator

class TravelGraphService:
    @staticmethod
    def rebuild() -> bool:
        return rebuild_graph()

    @staticmethod
    def get_stats() -> dict:
        validator_results = GraphValidator.validate_graph()
        
        # Calculate hub cities (Cities with most edges)
        from app.graph.network_metrics import NetworkMetrics
        metrics = NetworkMetrics.get_network_metrics()
        
        return {
            "success": True,
            "nodes_count": len(tkg.nodes),
            "edges_count": sum(len(e) for e in tkg.edges.values()),
            "hub_cities": metrics["hub_cities"],
            "most_connected_stations": metrics["most_connected_stations"],
            "disconnected_nodes": metrics["disconnected_nodes"],
            "health_status": "Healthy" if validator_results["valid"] else "Degraded",
            "validation_report": validator_results
        }
