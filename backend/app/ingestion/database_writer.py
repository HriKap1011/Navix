from typing import List, Dict, Any, Type, Callable
from sqlalchemy.orm import Session
from app.database import Base
from app.ingestion.config import logger

class IngestionReport:
    def __init__(self, name: str):
        self.name = name
        self.imported = 0
        self.updated = 0
        self.skipped = 0
        self.validation_errors = 0
        self.runtime_seconds = 0.0

    def print_summary(self) -> str:
        report = (
            f"--- {self.name} Import Summary ---\n"
            f"Imported (New):     {self.imported}\n"
            f"Updated (Existing): {self.updated}\n"
            f"Duplicates Skipped: {self.skipped}\n"
            f"Validation Errors:  {self.validation_errors}\n"
            f"Total Runtime:      {self.runtime_seconds:.3f} seconds\n"
        )
        return report

def execute_in_transaction(session: Session, action: Callable[[Session], Any]) -> Any:
    """
    Executes a callback function inside a safe transaction, rolling back on failure.
    """
    try:
        result = action(session)
        session.commit()
        return result
    except Exception as e:
        session.rollback()
        logger.error(f"Transaction failed, rolling back changes: {e}", exc_info=True)
        raise e

def bulk_upsert(
    session: Session,
    model_class: Type[Base],
    records: List[Dict[str, Any]],
    natural_key_func: Callable[[Dict[str, Any]], Any],
    db_key_func: Callable[[Any], Any],
    update_fields: List[str]
) -> Dict[str, int]:
    """
    A high-performance Python-side bulk upsert for SQLAlchemy.
    Fetches all existing rows into memory to prevent individual SELECT queries,
    and updates/inserts in a batch.
    """
    counts = {"imported": 0, "updated": 0, "skipped": 0}
    
    # 1. Fetch all existing records from the database
    existing_records = session.query(model_class).all()
    existing_map = {}
    for db_obj in existing_records:
        try:
            key = db_key_func(db_obj)
            existing_map[key] = db_obj
        except Exception as e:
            logger.warning(f"Failed to generate unique key for existing database record: {e}")
            
    # 2. Process records
    for record in records:
        # Strip internal 'id' if present, to let database handle autoincrement
        record_data = {k: v for k, v in record.items() if k != "id"}
        
        try:
            key = natural_key_func(record_data)
        except Exception as e:
            logger.error(f"Failed to extract natural key from record {record_data}: {e}")
            continue

        if key in existing_map:
            # Check if fields have changed
            db_obj = existing_map[key]
            updated = False
            for field in update_fields:
                if field in record_data:
                    incoming_val = record_data[field]
                    current_val = getattr(db_obj, field)
                    
                    # Basic type alignment and check
                    if incoming_val != current_val:
                        setattr(db_obj, field, incoming_val)
                        updated = True
            
            if updated:
                counts["updated"] += 1
            else:
                counts["skipped"] += 1
        else:
            # Create new record
            db_obj = model_class(**record_data)
            session.add(db_obj)
            counts["imported"] += 1
            # Add to map so subsequent duplicate rows in the same batch are handled
            existing_map[key] = db_obj
            
    return counts
