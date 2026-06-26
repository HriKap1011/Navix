import csv
import json
import os
from typing import List, Dict, Any, Union
from app.ingestion.config import logger

def normalize_row_keys(row: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalizes keys from human-readable CSV headers or database dumps into standard
    attributes matching model fields / Pydantic schemas.
    """
    normalized = {}
    for k, v in row.items():
        if k is None:
            continue
        # Convert to lowercase and replace spaces/hyphens with underscores
        clean_key = k.strip().lower().replace(" ", "_").replace("-", "_")
        
        # Explicit mapping translations
        if clean_key in ("distance_(km)", "distance", "distance_km"):
            clean_key = "distance_km"
        elif clean_key in ("source_city_id", "source_id"):
            clean_key = "source_city_id"
        elif clean_key in ("destination_city_id", "destination_id"):
            clean_key = "destination_city_id"
        elif clean_key in ("source_city_name", "source_city", "source"):
            clean_key = "source_city_name"
        elif clean_key in ("destination_city_name", "destination_city", "destination"):
            clean_key = "destination_city_name"
        
        # Convert empty strings to None
        value = v
        if isinstance(value, str):
            value = value.strip()
            if value == "":
                value = None
                
        normalized[clean_key] = value
    return normalized

def load_data_file(file_path: str) -> List[Dict[str, Any]]:
    """
    Loads records from a file path. Decides between CSV and JSON based on file extension.
    Returns a list of dictionaries with normalized keys.
    """
    if not os.path.exists(file_path):
        logger.warning(f"File not found at: {file_path}")
        return []
    
    _, ext = os.path.splitext(file_path.lower())
    records = []
    
    try:
        if ext == ".csv":
            with open(file_path, mode="r", encoding="utf-8-sig") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    records.append(normalize_row_keys(row))
        elif ext == ".json":
            with open(file_path, mode="r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    for item in data:
                        if isinstance(item, dict):
                            records.append(normalize_row_keys(item))
                elif isinstance(data, dict):
                    records.append(normalize_row_keys(data))
        else:
            logger.error(f"Unsupported file format: {ext} for {file_path}")
    except Exception as e:
        logger.error(f"Error reading file {file_path}: {e}", exc_info=True)
        
    return records

def load_csv_id_to_natural_key_map(file_path: str, natural_key_field: str) -> Dict[str, str]:
    """
    Reads a CSV/JSON file and returns a mapping from its 'id' field to a natural key field.
    For example: 'id' -> 'city_name' in cities.csv
    """
    if not os.path.exists(file_path):
        return {}
    mapping = {}
    records = load_data_file(file_path)
    for r in records:
        csv_id = r.get("id")
        nat_val = r.get(natural_key_field)
        if csv_id is not None and nat_val is not None:
            mapping[str(csv_id).strip()] = str(nat_val).strip()
    return mapping

