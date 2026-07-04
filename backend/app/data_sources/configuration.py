import os
import json
from typing import Dict, Any

CONFIG_FILE = os.path.join(os.path.dirname(__file__), "config.json")

class DataSourceConfiguration:
    @staticmethod
    def load_config() -> Dict[str, Dict[str, Any]]:
        if not os.path.exists(CONFIG_FILE):
            # Create default config on first run
            default_config = {
                "DATABASE": {"status": "Active", "priority": 1},
                "CSV": {"status": "Active", "priority": 2},
                "MOCK": {"status": "Active", "priority": 3}
            }
            DataSourceConfiguration.save_config(default_config)
            return default_config
            
        try:
            with open(CONFIG_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return {}

    @staticmethod
    def save_config(config: Dict[str, Dict[str, Any]]) -> bool:
        try:
            with open(CONFIG_FILE, "w") as f:
                json.dump(config, f, indent=4)
            return True
        except Exception:
            return False
