import time
from sqlalchemy.orm import Session
from pydantic import ValidationError

from app.models import City, Station, NearbyStationMapping
from app.database import db_session
from app.ingestion.config import NEARBY_MAPPINGS_FILE, CITIES_FILE, STATIONS_FILE, logger
from app.ingestion.loader import load_data_file, load_csv_id_to_natural_key_map
from app.ingestion.validators import NearbyMappingIngestSchema
from app.ingestion.database_writer import IngestionReport, execute_in_transaction, bulk_upsert

def import_nearby_stations(session: Session, file_path: str = NEARBY_MAPPINGS_FILE) -> IngestionReport:
    """
    Imports nearby station mapping data from CSV or JSON.
    """
    start_time = time.time()
    report = IngestionReport("Nearby Station Mappings")
    
    logger.info(f"Starting Nearby Station Mappings import from {file_path}...")
    
    # 1. Load mappings from cities.csv and stations.csv
    csv_city_id_to_name = load_csv_id_to_natural_key_map(CITIES_FILE, "city_name")
    csv_station_id_to_code = load_csv_id_to_natural_key_map(STATIONS_FILE, "station_code")
    
    # 2. Fetch existing database cities and stations for lookup
    db_cities = session.query(City).all()
    cities_by_name = {c.city_name.lower().strip(): c.id for c in db_cities}
    
    db_stations = session.query(Station).all()
    stations_by_code = {s.station_code.upper().strip(): s.id for s in db_stations}
    
    # 3. Load nearby records
    raw_records = load_data_file(file_path)
    if not raw_records:
        report.runtime_seconds = time.time() - start_time
        return report
        
    # 4. Resolve references and validate
    validated_records = []
    for idx, raw in enumerate(raw_records, start=1):
        try:
            # Resolve city_id
            resolved_city_id = None
            city_ref = None
            if raw.get("city_name"):
                city_ref = str(raw["city_name"]).strip()
            elif raw.get("city_id"):
                csv_id_str = str(raw["city_id"]).strip()
                city_ref = csv_city_id_to_name.get(csv_id_str)
                
            if city_ref:
                resolved_city_id = cities_by_name.get(city_ref.lower())
                if resolved_city_id is None:
                    raise ValueError(f"City '{city_ref}' not found in database")
            elif raw.get("city_id"):
                db_city_id = int(raw["city_id"])
                if db_city_id in cities_by_name.values():
                    resolved_city_id = db_city_id
                else:
                    raise ValueError(f"City ID '{raw['city_id']}' cannot be resolved")
            
            # Resolve station_id
            resolved_station_id = None
            station_ref = None
            if raw.get("station_code"):
                station_ref = str(raw["station_code"]).strip().upper()
            elif raw.get("station_id"):
                csv_id_str = str(raw["station_id"]).strip()
                station_ref = csv_station_id_to_code.get(csv_id_str)
                
            if station_ref:
                resolved_station_id = stations_by_code.get(station_ref.upper())
                if resolved_station_id is None:
                    raise ValueError(f"Station with code '{station_ref}' not found in database")
            elif raw.get("station_id"):
                db_station_id = int(raw["station_id"])
                if db_station_id in stations_by_code.values():
                    resolved_station_id = db_station_id
                else:
                    raise ValueError(f"Station ID '{raw['station_id']}' cannot be resolved")
                    
            if resolved_city_id is None or resolved_station_id is None:
                raise ValueError("Both city and station must be resolvable")
                
            # Inject resolved IDs
            raw["city_id"] = resolved_city_id
            raw["station_id"] = resolved_station_id
            
            schema = NearbyMappingIngestSchema(**raw)
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
            model_class=NearbyStationMapping,
            records=validated_records,
            natural_key_func=lambda r: (r["city_id"], r["station_id"]),
            db_key_func=lambda m: (m.city_id, m.station_id),
            update_fields=["distance_km"]
        )
        
    try:
        counts = execute_in_transaction(session, perform_upsert)
        report.imported = counts["imported"]
        report.updated = counts["updated"]
        report.skipped = counts["skipped"]
    except Exception as e:
        logger.error(f"Failed to commit nearby mappings to database: {e}")
        
    report.runtime_seconds = time.time() - start_time
    logger.info(f"Finished Nearby Station Mappings import.\n{report.print_summary()}")
    return report

if __name__ == "__main__":
    from app.database import SessionLocal
    sess = SessionLocal()
    try:
        import_nearby_stations(sess)
    finally:
        sess.close()
