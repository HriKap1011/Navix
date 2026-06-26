import time
from sqlalchemy.orm import Session
from pydantic import ValidationError

from app.models import City, Station
from app.database import db_session
from app.ingestion.config import STATIONS_FILE, CITIES_FILE, logger
from app.ingestion.loader import load_data_file, load_csv_id_to_natural_key_map
from app.ingestion.validators import StationIngestSchema
from app.ingestion.database_writer import IngestionReport, execute_in_transaction, bulk_upsert

def import_stations(session: Session, file_path: str = STATIONS_FILE) -> IngestionReport:
    """
    Imports station data from CSV or JSON.
    """
    start_time = time.time()
    report = IngestionReport("Stations")
    
    logger.info(f"Starting Station import from {file_path}...")
    
    # 1. Load mappings from cities.csv to resolve CSV City IDs to City Names
    csv_city_id_to_name = load_csv_id_to_natural_key_map(CITIES_FILE, "city_name")
    
    # 2. Fetch existing cities in database to map City Names to DB IDs
    db_cities = session.query(City).all()
    cities_by_name = {c.city_name.lower().strip(): c.id for c in db_cities}
    
    # 3. Load station records
    raw_records = load_data_file(file_path)
    if not raw_records:
        report.runtime_seconds = time.time() - start_time
        return report
        
    # 4. Resolve references and validate
    validated_records = []
    for idx, raw in enumerate(raw_records, start=1):
        try:
            # Resolve city_id using name-based lookup or CSV ID mapping
            resolved_city_id = None
            city_ref = None
            
            # Check if city name is provided directly
            if raw.get("city_name"):
                city_ref = str(raw["city_name"]).strip()
            # Otherwise resolve using CSV City ID -> Name map
            elif raw.get("city_id"):
                csv_id_str = str(raw["city_id"]).strip()
                city_ref = csv_city_id_to_name.get(csv_id_str)
                
            if city_ref:
                resolved_city_id = cities_by_name.get(city_ref.lower())
                if resolved_city_id is None:
                    raise ValueError(f"Referenced city '{city_ref}' not found in database")
            elif raw.get("city_id"):
                # If city_id was provided but not found in CSV ID mapping, check if it's already a valid DB ID
                db_city_id = int(raw["city_id"])
                if db_city_id in cities_by_name.values():
                    resolved_city_id = db_city_id
                else:
                    raise ValueError(f"Referenced City ID '{raw['city_id']}' cannot be resolved to any city")
            
            # Inject resolved city_id into raw dictionary
            raw["city_id"] = resolved_city_id
            
            schema = StationIngestSchema(**raw)
            validated_records.append(schema.model_dump())
        except (ValidationError, ValueError) as ve:
            report.validation_errors += 1
            logger.warning(f"Row {idx} in {file_path} failed validation: {ve}")
        except Exception as e:
            report.validation_errors += 1
            logger.error(f"Row {idx} failed with unexpected error: {e}")
            
    # 5. Bulk Upsert in Transaction
    def perform_upsert(db_sess: Session):
        return bulk_upsert(
            session=db_sess,
            model_class=Station,
            records=validated_records,
            natural_key_func=lambda r: r["station_code"].strip().upper(),
            db_key_func=lambda s: s.station_code.strip().upper(),
            update_fields=["station_name", "city_id", "station_type", "importance_score"]
        )
        
    try:
        counts = execute_in_transaction(session, perform_upsert)
        report.imported = counts["imported"]
        report.updated = counts["updated"]
        report.skipped = counts["skipped"]
    except Exception as e:
        logger.error(f"Failed to commit stations to database: {e}")
        
    report.runtime_seconds = time.time() - start_time
    logger.info(f"Finished Station import.\n{report.print_summary()}")
    return report

if __name__ == "__main__":
    from app.database import SessionLocal
    sess = SessionLocal()
    try:
        import_stations(sess)
    finally:
        sess.close()
