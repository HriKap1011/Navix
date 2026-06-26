import time
from sqlalchemy.orm import Session
from pydantic import ValidationError

from app.models import City, Corridor
from app.database import db_session
from app.ingestion.config import CORRIDORS_FILE, CITIES_FILE, logger
from app.ingestion.loader import load_data_file, load_csv_id_to_natural_key_map
from app.ingestion.validators import CorridorIngestSchema
from app.ingestion.database_writer import IngestionReport, execute_in_transaction, bulk_upsert

def import_corridors(session: Session, file_path: str = CORRIDORS_FILE) -> IngestionReport:
    """
    Imports travel corridor data from CSV or JSON.
    """
    start_time = time.time()
    report = IngestionReport("Corridors")
    
    logger.info(f"Starting Corridor import from {file_path}...")
    
    # 1. Load mappings from cities.csv
    csv_city_id_to_name = load_csv_id_to_natural_key_map(CITIES_FILE, "city_name")
    
    # 2. Fetch existing cities in DB
    db_cities = session.query(City).all()
    cities_by_name = {c.city_name.lower().strip(): c.id for c in db_cities}
    
    # 3. Load corridor records
    raw_records = load_data_file(file_path)
    if not raw_records:
        report.runtime_seconds = time.time() - start_time
        return report
        
    # 4. Resolve references and validate
    validated_records = []
    for idx, raw in enumerate(raw_records, start=1):
        try:
            # Resolve source city id
            resolved_source_id = None
            source_ref = None
            if raw.get("source_city_name"):
                source_ref = str(raw["source_city_name"]).strip()
            elif raw.get("source_city_id"):
                csv_id_str = str(raw["source_city_id"]).strip()
                source_ref = csv_city_id_to_name.get(csv_id_str)
                
            if source_ref:
                resolved_source_id = cities_by_name.get(source_ref.lower())
                if resolved_source_id is None:
                    raise ValueError(f"Source city '{source_ref}' not found in database")
            elif raw.get("source_city_id"):
                db_city_id = int(raw["source_city_id"])
                if db_city_id in cities_by_name.values():
                    resolved_source_id = db_city_id
                else:
                    raise ValueError(f"Source City ID '{raw['source_city_id']}' cannot be resolved")
                    
            # Resolve destination city id
            resolved_dest_id = None
            dest_ref = None
            if raw.get("destination_city_name"):
                dest_ref = str(raw["destination_city_name"]).strip()
            elif raw.get("destination_city_id"):
                csv_id_str = str(raw["destination_city_id"]).strip()
                dest_ref = csv_city_id_to_name.get(csv_id_str)
                
            if dest_ref:
                resolved_dest_id = cities_by_name.get(dest_ref.lower())
                if resolved_dest_id is None:
                    raise ValueError(f"Destination city '{dest_ref}' not found in database")
            elif raw.get("destination_city_id"):
                db_city_id = int(raw["destination_city_id"])
                if db_city_id in cities_by_name.values():
                    resolved_dest_id = db_city_id
                else:
                    raise ValueError(f"Destination City ID '{raw['destination_city_id']}' cannot be resolved")
            
            if resolved_source_id is None or resolved_dest_id is None:
                raise ValueError("Both source and destination cities must be resolvable")
                
            # Inject resolved IDs
            raw["source_city_id"] = resolved_source_id
            raw["destination_city_id"] = resolved_dest_id
            
            schema = CorridorIngestSchema(**raw)
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
            model_class=Corridor,
            records=validated_records,
            natural_key_func=lambda r: (r["source_city_id"], r["destination_city_id"]),
            db_key_func=lambda c: (c.source_city_id, c.destination_city_id),
            update_fields=["demand_level", "migration_relevance", "seasonal_pressure", "avg_duration"]
        )
        
    try:
        counts = execute_in_transaction(session, perform_upsert)
        report.imported = counts["imported"]
        report.updated = counts["updated"]
        report.skipped = counts["skipped"]
    except Exception as e:
        logger.error(f"Failed to commit corridors to database: {e}")
        
    report.runtime_seconds = time.time() - start_time
    logger.info(f"Finished Corridor import.\n{report.print_summary()}")
    return report

if __name__ == "__main__":
    from app.database import SessionLocal
    sess = SessionLocal()
    try:
        import_corridors(sess)
    finally:
        sess.close()
