import logging
from typing import Dict, List, Any, Tuple

logger = logging.getLogger("navix.graph")

class TravelKnowledgeGraph:
    def __init__(self):
        # Nodes: node_id -> {type: str, properties: dict}
        self.nodes: Dict[str, Dict[str, Any]] = {}
        # Edges: source_id -> list of (target_id, edge_type, properties_dict)
        self.edges: Dict[str, List[Tuple[str, str, Dict[str, Any]]]] = {}

    def clear(self):
        self.nodes.clear()
        self.edges.clear()

    def add_node(self, node_id: str, node_type: str, properties: Dict[str, Any] = None):
        self.nodes[node_id] = {
            "type": node_type,
            "properties": properties or {}
        }

    def add_edge(self, source_id: str, target_id: str, edge_type: str, properties: Dict[str, Any] = None):
        # Ensure nodes exist to prevent dangling relationships
        if source_id not in self.nodes or target_id not in self.nodes:
            return
            
        if source_id not in self.edges:
            self.edges[source_id] = []
            
        # Avoid duplicate edges
        for tgt, t_type, _ in self.edges[source_id]:
            if tgt == target_id and t_type == edge_type:
                return
                
        self.edges[source_id].append((target_id, edge_type, properties or {}))

        # Make CONNECTED_TO and NEARBY bi-directional
        if edge_type in ["CONNECTED_TO", "NEARBY"]:
            if target_id not in self.edges:
                self.edges[target_id] = []
            for tgt, t_type, _ in self.edges[target_id]:
                if tgt == source_id and t_type == edge_type:
                    return
            self.edges[target_id].append((source_id, edge_type, properties or {}))

    def get_neighbors(self, node_id: str) -> List[Tuple[str, str, Dict[str, Any]]]:
        return self.edges.get(node_id, [])

# Global in-memory instance
tkg = TravelKnowledgeGraph()

def rebuild_graph() -> bool:
    """
    Query all tables from PostgreSQL database and construct/populate the TKG in-memory representation.
    """
    tkg.clear()
    
    try:
        from app.database import SessionLocal
        from app.models import City, Station, NearbyStationMapping, Corridor
        from app.graph.graph_mapper import map_city_node, map_station_node
        
        with SessionLocal() as db:
            db_cities = db.query(City).all()
            db_stations = db.query(Station).all()
            db_corridors = db.query(Corridor).all()
            db_mappings = db.query(NearbyStationMapping).all()
            
            # 1. Map and Add Nodes
            city_id_map = {}
            for city in db_cities:
                node_id, properties = map_city_node(city)
                tkg.add_node(node_id, "City", properties)
                city_id_map[city.id] = node_id
                
            station_id_map = {}
            for station in db_stations:
                node_id, properties = map_station_node(station)
                tkg.add_node(node_id, "Station", properties)
                station_id_map[station.id] = node_id
                
            # 2. Add structural edges
            # Link stations back to their parent cities
            for station in db_stations:
                s_node = f"Station:{station.station_code}"
                if station.city_id and station.city_id in city_id_map:
                    c_node = city_id_map[station.city_id]
                    tkg.add_edge(c_node, s_node, "HAS_STATION")
                    tkg.add_edge(s_node, c_node, "BELONGS_TO")

            # Add nearby mappings connections
            for mapping in db_mappings:
                if mapping.city_id in city_id_map and mapping.station_id in station_id_map:
                    c_node = city_id_map[mapping.city_id]
                    s_node = station_id_map[mapping.station_id]
                    tkg.add_edge(c_node, s_node, "HAS_STATION", {"distance_km": mapping.distance_km})
                    tkg.add_edge(s_node, c_node, "BELONGS_TO", {"distance_km": mapping.distance_km})

            # Add city-to-city corridors
            for corr in db_corridors:
                if corr.source_city_id in city_id_map and corr.destination_city_id in city_id_map:
                    src_node = city_id_map[corr.source_city_id]
                    dest_node = city_id_map[corr.destination_city_id]
                    
                    tkg.add_edge(src_node, dest_node, "CONNECTED_TO", {
                        "demand_level": corr.demand_level,
                        "avg_duration": corr.avg_duration
                    })

            # Build NEARBY station relationships between stations within the same city
            for city_node_id, node_data in tkg.nodes.items():
                if node_data["type"] != "City":
                    continue
                # Get all stations belonging to this city
                stations = []
                for s_node_id, edge_type, props in tkg.edges.get(city_node_id, []):
                    if edge_type == "HAS_STATION":
                        stations.append(s_node_id)
                # Connect all stations within same city as NEARBY
                for i in range(len(stations)):
                    for j in range(i + 1, len(stations)):
                        tkg.add_edge(stations[i], stations[j], "NEARBY", {"type": "intra_city"})

        logger.info(f"Travel Knowledge Graph successfully rebuilt. Nodes: {len(tkg.nodes)}, Edges: {sum(len(v) for v in tkg.edges.values())}")
        return True
    except Exception as e:
        logger.error(f"Failed to rebuild Travel Knowledge Graph: {e}", exc_info=True)
        return False
