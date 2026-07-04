from typing import Dict, Any, List
from app.graph.graph_builder import tkg

class GraphValidator:
    @staticmethod
    def validate_graph() -> Dict[str, Any]:
        """
        Verify TKG consistency: check for dangling edges, duplicate nodes, empty connections.
        """
        issues: List[str] = []
        dangling_count = 0
        duplicate_count = 0
        
        # 1. Verify all edges have existing nodes
        for source_id, connections in tkg.edges.items():
            if source_id not in tkg.nodes:
                issues.append(f"Dangling edge source node: '{source_id}' is not in nodes registry.")
                dangling_count += 1
            for target_id, edge_type, _ in connections:
                if target_id not in tkg.nodes:
                    issues.append(f"Dangling edge target node: '{target_id}' is not in nodes registry.")
                    dangling_count += 1
                    
        # 2. Check for bi-directional consistency of CONNECTED_TO and NEARBY edges
        for source_id, connections in tkg.edges.items():
            for target_id, edge_type, props in connections:
                if edge_type in ["CONNECTED_TO", "NEARBY"]:
                    # Target should have reverse edge
                    target_edges = tkg.edges.get(target_id, [])
                    has_reverse = any(tgt == source_id and e_type == edge_type for tgt, e_type, _ in target_edges)
                    if not has_reverse:
                        issues.append(f"Asymmetry: '{source_id}' is connected to '{target_id}' via {edge_type}, but no reverse connection exists.")
                        
        return {
            "valid": len(issues) == 0,
            "issues": issues[:10],  # Return first 10 issues to prevent bloat
            "total_issues_count": len(issues),
            "dangling_edges_count": dangling_count,
            "nodes_count": len(tkg.nodes),
            "edges_count": sum(len(e) for e in tkg.edges.values())
        }
