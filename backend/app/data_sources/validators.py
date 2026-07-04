from typing import List, Dict, Any

class DataSourceValidator:
    @staticmethod
    def validate_schema(data_source_id: str, sample_records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Validate metadata schema fields for data sources.
        """
        issues = []
        if not sample_records:
            return {"valid": True, "issues": ["No sample records provided for schema validation."]}
            
        required_keys = ["route_id", "source", "destination", "duration", "price"]
        for idx, rec in enumerate(sample_records):
            for key in required_keys:
                if key not in rec:
                    issues.append(f"Record #{idx} is missing required key '{key}'")
                    
        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "validated_records_count": len(sample_records)
        }
