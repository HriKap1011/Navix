import time
from sqlalchemy.orm import Session
from pydantic import ValidationError

from app.models import SeasonalDemand
from app.database import db_session
from app.ingestion.config import SEASONAL_DEMANDS_FILE, logger
from app.ingestion.loader import load_data_file
from app.ingestion.validators import SeasonalDemandIngestSchema
from app.ingestion.database_writer import IngestionReport, execute_in_transaction, bulk_upsert

def import_seasonal_demands(session: Session, file_path: str = SEASONAL_DEMANDS_FILE) -> IngestionReport:
    """
    Imports seasonal travel demand data from CSV or JSON.
    """
    start_time = time.time()
    report = IngestionReport("Seasonal Demands")
    
    logger.info(f"Starting Seasonal Demands import from {file_path}...")
    
    # 1. Load data
    raw_records = load_data_file(file_path)
    if not raw_records:
        report.runtime_seconds = time.time() - start_time
        return report
        
    # 2. Validate records
    validated_records = []
    for idx, raw in enumerate(raw_records, start=1):
        try:
            schema = SeasonalDemandIngestSchema(**raw)
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
            model_class=SeasonalDemand,
            records=validated_records,
            natural_key_func=lambda r: r["festival_name"].strip().lower(),
            db_key_func=lambda s: s.festival_name.strip().lower(),
            update_fields=[
                "start_month", "start_day", "end_month", "end_day",
                "seat_modifier", "comfort_modifier", "price_multiplier",
                "crowd_modifier", "description"
            ]
        )
        
    try:
        counts = execute_in_transaction(session, perform_upsert)
        report.imported = counts["imported"]
        report.updated = counts["updated"]
        report.skipped = counts["skipped"]
    except Exception as e:
        logger.error(f"Failed to commit seasonal demands to database: {e}")
        
    report.runtime_seconds = time.time() - start_time
    logger.info(f"Finished Seasonal Demands import.\n{report.print_summary()}")
    return report

if __name__ == "__main__":
    from app.database import SessionLocal
    sess = SessionLocal()
    try:
        import_seasonal_demands(sess)
    finally:
        sess.close()
