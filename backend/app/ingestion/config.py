import os
import logging

# Directory containing the raw travel datasets
INGESTION_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(os.path.dirname(INGESTION_DIR))
DEFAULT_DATASET_DIR = os.path.abspath(os.path.join(BACKEND_DIR, "datasets"))


DATASET_DIR = os.getenv("DATASET_DIR", DEFAULT_DATASET_DIR)

# File paths for specific datasets
CITIES_FILE = os.path.join(DATASET_DIR, "cities.csv")
STATIONS_FILE = os.path.join(DATASET_DIR, "stations.csv")
CORRIDORS_FILE = os.path.join(DATASET_DIR, "corridors.csv")
NEARBY_MAPPINGS_FILE = os.path.join(DATASET_DIR, "nearby_station_mappings.csv")
SEASONAL_DEMANDS_FILE = os.path.join(DATASET_DIR, "seasonal_demands.csv")

# Setup Logging for Ingestion
logger = logging.getLogger("navix.ingestion")
if not logger.handlers:
    logger.setLevel(logging.INFO)
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        "[%(asctime)s] %(levelname)s [%(name)s:%(filename)s:%(lineno)d] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
