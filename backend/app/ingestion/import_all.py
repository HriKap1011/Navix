import time
import argparse
import os
import sys

# Ensure backend directory is in path when running directly
INGESTION_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(INGESTION_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.database import SessionLocal
from app.ingestion.config import logger, DATASET_DIR
from app.ingestion.import_cities import import_cities
from app.ingestion.import_stations import import_stations
from app.ingestion.import_corridors import import_corridors
from app.ingestion.import_nearby_stations import import_nearby_stations
from app.ingestion.import_seasonal_demands import import_seasonal_demands

def run_ingestion(dataset_dir: str = None, target: str = "all"):
    """
    Orchestrates the ingestion run.
    """
    if dataset_dir:
        # Override environment variables dynamically
        os.environ["DATASET_DIR"] = os.path.abspath(dataset_dir)
        import importlib
        import app.ingestion.config as ing_config
        importlib.reload(ing_config)
    
    # Reload paths based on configuration update
    from app.ingestion.config import (
        CITIES_FILE, STATIONS_FILE, CORRIDORS_FILE,
        NEARBY_MAPPINGS_FILE, SEASONAL_DEMANDS_FILE, DATASET_DIR as resolved_dir
    )
    
    logger.info(f"Using datasets directory: {resolved_dir}")
    
    session = SessionLocal()
    start_time = time.time()
    reports = []
    
    try:
        if target in ("all", "cities"):
            reports.append(import_cities(session, CITIES_FILE))
            
        if target in ("all", "stations"):
            reports.append(import_stations(session, STATIONS_FILE))
            
        if target in ("all", "corridors"):
            reports.append(import_corridors(session, CORRIDORS_FILE))
            
        if target in ("all", "nearby"):
            reports.append(import_nearby_stations(session, NEARBY_MAPPINGS_FILE))
            
        if target in ("all", "seasonal"):
            reports.append(import_seasonal_demands(session, SEASONAL_DEMANDS_FILE))
            
    except Exception as e:
        logger.error(f"Critical error occurred during ingestion orchestrator run: {e}", exc_info=True)
    finally:
        session.close()
        
    total_time = time.time() - start_time
    
    # Render Master Aggregated Report
    logger.info("=" * 50)
    logger.info("            NAVIX INGESTION RUN SUMMARY")
    logger.info("=" * 50)
    
    total_imported = 0
    total_updated = 0
    total_skipped = 0
    total_errors = 0
    
    for r in reports:
        logger.info(
            f"{r.name:<25} | Imported: {r.imported:<5} | Updated: {r.updated:<5} | Skipped: {r.skipped:<5} | Errors: {r.validation_errors:<5} | Time: {r.runtime_seconds:.2f}s"
        )
        total_imported += r.imported
        total_updated += r.updated
        total_skipped += r.skipped
        total_errors += r.validation_errors
        
    logger.info("-" * 50)
    logger.info(
        f"{'TOTALS':<25} | Imported: {total_imported:<5} | Updated: {total_updated:<5} | Skipped: {total_skipped:<5} | Errors: {total_errors:<5} | Time: {total_time:.2f}s"
    )
    logger.info("=" * 50)

def main():
    parser = argparse.ArgumentParser(description="Navix Travel Data Ingestion CLI")
    parser.add_argument(
        "--dir",
        type=str,
        default=None,
        help="Path to custom travel datasets directory containing CSV files."
    )
    parser.add_argument(
        "--only",
        type=str,
        choices=["cities", "stations", "corridors", "nearby", "seasonal"],
        default="all",
        help="Run ingestion only for a specific dataset target."
    )
    
    args = parser.parse_args()
    run_ingestion(dataset_dir=args.dir, target=args.only)

if __name__ == "__main__":
    main()
