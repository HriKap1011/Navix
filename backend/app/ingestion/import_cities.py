import time
from sqlalchemy.orm import Session
from pydantic import ValidationError

from app.models import City
from app.database import db_session
from app.ingestion.config import CITIES_FILE, logger
from app.ingestion.loader import load_data_file
from app.ingestion.validators import CityIngestSchema
from app.ingestion.database_writer import IngestionReport, execute_in_transaction, bulk_upsert

def import_cities(session: Session, file_path: str = CITIES_FILE) -> IngestionReport:
    """
    Imports city data from CSV or JSON.
    """
    start_time = time.time()
    report = IngestionReport("Cities")
    
    logger.info(f"Starting City import from {file_path}...")
    
    # 1. Load data
    raw_records = load_data_file(file_path)
    if not raw_records:
        report.runtime_seconds = time.time() - start_time
        return report
        
    # 2. Validate records
    validated_records = []
    for idx, raw in enumerate(raw_records, start=1):
        try:
            schema = CityIngestSchema(**raw)
            validated_records.append(schema.model_dump())
        except ValidationError as ve:
            report.validation_errors += 1
            logger.warning(f"Row {idx} in {file_path} failed validation: {ve.errors()}")
        except Exception as e:
            report.validation_errors += 1
            logger.error(f"Row {idx} failed with unexpected error: {e}")
            
    # 3. Bulk Upsert in Transaction
    def perform_upsert(db_sess: Session):
        return bulk_upsert(
            session=db_sess,
            model_class=City,
            records=validated_records,
            natural_key_func=lambda r: r["city_name"].strip().lower(),
            db_key_func=lambda c: c.city_name.strip().lower(),
            update_fields=[
                "state", "tier", "importance_score", "demand_category",
                "latitude", "longitude", "has_airport", "has_train_station",
                "code", "station"
            ]
        )
        
    try:
        counts = execute_in_transaction(session, perform_upsert)
        report.imported = counts["imported"]
        report.updated = counts["updated"]
        report.skipped = counts["skipped"]
    except Exception as e:
        logger.error(f"Failed to commit cities to database: {e}")
        
    report.runtime_seconds = time.time() - start_time
    logger.info(f"Finished City import.\n{report.print_summary()}")
    return report

if __name__ == "__main__":
    from app.database import SessionLocal
    sess = SessionLocal()
    try:
        import_cities(sess)
    finally:
        sess.close()
