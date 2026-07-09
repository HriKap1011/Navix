import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db

logger = logging.getLogger("navix.railway.api")
router = APIRouter(prefix="/admin", tags=["admin"])

def log_audit(db: Session, operation: str, entity: str, record_id: Optional[str], details: Optional[str] = None):
    try:
        from app.models import AuditLog
        log_entry = AuditLog(
            operation=operation,
            entity=entity,
            record_id=str(record_id) if record_id is not None else None,
            details=details
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to write audit log: {e}")
        db.rollback()

# =============================================================================
# RAILWAY DATASET ENDPOINTS
# =============================================================================

@router.get("/railway/status")
def railway_status(db: Session = Depends(get_db)):
    """Returns metadata about the imported railway dataset."""
    try:
        from app.railway.models_ext import RailwayTrain, RailwayTrainStop, RailwayDatasetImport
        from sqlalchemy import func

        last_import = db.query(RailwayDatasetImport).order_by(
            RailwayDatasetImport.import_date.desc()
        ).first()

        trains_count = db.query(func.count(RailwayTrain.id)).scalar()
        stops_count  = db.query(func.count(RailwayTrainStop.id)).scalar()
        linked_trains = db.query(func.count(RailwayTrain.id)).filter(
            RailwayTrain.source_linked == True,
            RailwayTrain.destination_linked == True
        ).scalar()
        unlinked_stations = db.query(func.count(RailwayTrainStop.id)).filter(
            RailwayTrainStop.station_linked == False
        ).scalar()

        import_data = None
        if last_import:
            import_data = {
                "id": last_import.id,
                "dataset_name": last_import.dataset_name,
                "dataset_version": last_import.dataset_version,
                "source_url": last_import.source_url,
                "license": last_import.license,
                "import_date": last_import.import_date.isoformat(),
                "trains_imported": last_import.trains_imported,
                "stops_imported": last_import.stops_imported,
                "trains_skipped": last_import.trains_skipped,
                "validation_issues": last_import.validation_issues,
                "status": last_import.status,
                "notes": last_import.notes
            }

        return {
            "success": True,
            "dataset_name": "Indian Railways Train Time Table",
            "license": "Open Government Data License India v1.0 (NDSAP)",
            "source_url": "https://data.gov.in/catalog/indian-railway-train-time-table",
            "last_import": import_data,
            "trains_count": trains_count,
            "stops_count": stops_count,
            "linked_trains": linked_trains,
            "unlinked_stations": unlinked_stations,
            "validation_issues": last_import.validation_issues if last_import else 0,
            "coverage_note": (
                "Major Indian Railways services: Rajdhani, Shatabdi, Duronto, "
                "Garib Rath, Humsafar, Tejas, and Mail/Express trains across all zones."
            )
        }
    except Exception as e:
        logger.error(f"railway_status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/railway/trains")
def list_railway_trains(
    page: int = 1,
    limit: int = 20,
    search: str = "",
    train_type: str = "",
    zone: str = "",
    db: Session = Depends(get_db)
):
    """Paginated listing of all imported railway trains."""
    try:
        from app.railway.models_ext import RailwayTrain
        from sqlalchemy import or_

        q = db.query(RailwayTrain)
        if search:
            q = q.filter(or_(
                RailwayTrain.train_number.ilike(f"%{search}%"),
                RailwayTrain.train_name.ilike(f"%{search}%"),
                RailwayTrain.from_station_name.ilike(f"%{search}%"),
                RailwayTrain.to_station_name.ilike(f"%{search}%"),
            ))
        if train_type:
            q = q.filter(RailwayTrain.train_type.ilike(f"%{train_type}%"))
        if zone:
            q = q.filter(RailwayTrain.zone == zone.upper())

        total = q.count()
        trains = q.order_by(RailwayTrain.train_number).offset((page - 1) * limit).limit(limit).all()

        return {
            "success": True,
            "total": total,
            "page": page,
            "limit": limit,
            "trains": [
                {
                    "id": t.id,
                    "train_number": t.train_number,
                    "train_name": t.train_name,
                    "train_type": t.train_type,
                    "zone": t.zone,
                    "from_station_code": t.from_station_code,
                    "from_station_name": t.from_station_name,
                    "to_station_code": t.to_station_code,
                    "to_station_name": t.to_station_name,
                    "running_days": t.running_days,
                    "total_distance_km": t.total_distance_km,
                    "total_stops": t.total_stops,
                    "source_linked": t.source_linked,
                    "destination_linked": t.destination_linked,
                }
                for t in trains
            ]
        }
    except Exception as e:
        logger.error(f"list_railway_trains error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/railway/trains/{train_number}")
def get_railway_train(train_number: str, db: Session = Depends(get_db)):
    """Returns full detail for a single train including all stops."""
    try:
        from app.railway.models_ext import RailwayTrain, RailwayTrainStop

        train = db.query(RailwayTrain).filter_by(train_number=train_number).first()
        if not train:
            raise HTTPException(status_code=404, detail=f"Train {train_number} not found")

        stops = db.query(RailwayTrainStop).filter_by(train_id=train.id).order_by(
            RailwayTrainStop.stop_number
        ).all()

        return {
            "success": True,
            "train": {
                "id": train.id,
                "train_number": train.train_number,
                "train_name": train.train_name,
                "train_type": train.train_type,
                "zone": train.zone,
                "from_station_code": train.from_station_code,
                "from_station_name": train.from_station_name,
                "to_station_code": train.to_station_code,
                "to_station_name": train.to_station_name,
                "running_days": train.running_days,
                "total_distance_km": train.total_distance_km,
                "total_stops": train.total_stops,
                "source_linked": train.source_linked,
                "destination_linked": train.destination_linked,
                "stops": [
                    {
                        "stop_number": s.stop_number,
                        "station_code": s.station_code,
                        "station_name": s.station_name,
                        "arrival_time": s.arrival_time,
                        "departure_time": s.departure_time,
                        "halt_minutes": s.halt_minutes,
                        "distance_from_source_km": s.distance_from_source_km,
                        "station_linked": s.station_linked,
                    }
                    for s in stops
                ]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"get_railway_train error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/railway/import")
def trigger_railway_import(force: bool = False, db: Session = Depends(get_db)):
    """Manually trigger a railway dataset import. Set force=true to re-import."""
    try:
        from app.railway.importer import run_import
        result = run_import(db, force=force)
        log_audit(db, "IMPORTED", "RailwayDataset",
                  record_id=None,
                  details=result.get("message", "Railway import triggered"))
        return result
    except Exception as e:
        logger.error(f"trigger_railway_import error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/railway/validation")
def railway_validation_report(db: Session = Depends(get_db)):
    """Returns the full validation report for the last import."""
    try:
        from app.railway.models_ext import RailwayTrain, RailwayTrainStop, RailwayDatasetImport
        from sqlalchemy import func

        last_import = db.query(RailwayDatasetImport).order_by(
            RailwayDatasetImport.import_date.desc()
        ).first()

        unlinked_stops = db.query(RailwayTrainStop).filter(
            RailwayTrainStop.station_linked == False
        ).limit(50).all()

        unlinked_trains = db.query(RailwayTrain).filter(
            (RailwayTrain.source_linked == False) | (RailwayTrain.destination_linked == False)
        ).limit(50).all()

        train_types = db.query(
            RailwayTrain.train_type,
            func.count(RailwayTrain.id).label("count")
        ).group_by(RailwayTrain.train_type).all()

        zones = db.query(
            RailwayTrain.zone,
            func.count(RailwayTrain.id).label("count")
        ).group_by(RailwayTrain.zone).all()

        return {
            "success": True,
            "last_import_status": last_import.status if last_import else "NEVER_IMPORTED",
            "last_import_notes": last_import.notes if last_import else None,
            "trains_skipped": last_import.trains_skipped if last_import else 0,
            "validation_issues": last_import.validation_issues if last_import else 0,
            "train_type_breakdown": [
                {"type": r.train_type, "count": r.count} for r in train_types
            ],
            "zone_breakdown": [
                {"zone": r.zone, "count": r.count} for r in zones
            ],
            "unlinked_station_stops": [
                {
                    "train_id": s.train_id,
                    "station_code": s.station_code,
                    "station_name": s.station_name
                }
                for s in unlinked_stops
            ],
            "trains_with_unlinked_endpoints": [
                {
                    "train_number": t.train_number,
                    "train_name": t.train_name,
                    "source_linked": t.source_linked,
                    "from_station_code": t.from_station_code,
                    "destination_linked": t.destination_linked,
                    "to_station_code": t.to_station_code,
                }
                for t in unlinked_trains
            ]
        }
    except Exception as e:
        logger.error(f"railway_validation_report error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/railway/corridors")
def railway_corridors(db: Session = Depends(get_db)):
    """
    Returns corridors covered by the railway dataset (trains with >= 2 stops).
    Shows which origin->destination pairs have at least one real scheduleable train.
    """
    try:
        from app.railway.models_ext import RailwayTrain, RailwayTrainStop
        from sqlalchemy import func

        trains_with_stops = (
            db.query(RailwayTrain)
            .join(RailwayTrainStop, RailwayTrainStop.train_id == RailwayTrain.id)
            .group_by(RailwayTrain.id)
            .having(func.count(RailwayTrainStop.id) >= 2)
            .all()
        )

        corridors = []
        seen = set()
        for t in trains_with_stops:
            key = f"{t.from_station_code}-{t.to_station_code}"
            if key not in seen:
                seen.add(key)
                corridors.append({
                    "from_code": t.from_station_code,
                    "from_name": t.from_station_name,
                    "to_code": t.to_station_code,
                    "to_name": t.to_station_name,
                    "distance_km": t.total_distance_km,
                    "train_count": sum(
                        1 for x in trains_with_stops
                        if x.from_station_code == t.from_station_code
                        and x.to_station_code == t.to_station_code
                    )
                })

        return {
            "success": True,
            "total_corridors": len(corridors),
            "corridors": sorted(corridors, key=lambda c: c["from_name"] or "")
        }
    except Exception as e:
        logger.error(f"railway_corridors error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/railway/search-coverage")
def railway_search_coverage(source: str = "", destination: str = "", db: Session = Depends(get_db)):
    """
    Check whether the railway dataset has real trains for a source->destination city pair.
    """
    try:
        from app.railway.provider import RailwayScheduleProvider
        provider = RailwayScheduleProvider()
        src_codes = list(provider._city_to_station_codes(source)) if source else []
        dst_codes = list(provider._city_to_station_codes(destination)) if destination else []

        covered = False
        trains_found = []
        if src_codes and dst_codes:
            journeys = provider.search_routes(source, destination, "2025-01-01")
            covered = len(journeys) > 0
            trains_found = [
                {
                    "route_id": j.route_id,
                    "train_name": j.recommendation_reason,
                    "departure": j.departure_time,
                    "arrival": j.arrival_time,
                    "duration": j.duration.formatted,
                    "price_inr": int(j.price.total_price.amount),
                }
                for j in journeys
            ]

        return {
            "success": True,
            "source": source,
            "destination": destination,
            "source_station_codes": src_codes,
            "destination_station_codes": dst_codes,
            "covered_by_real_data": covered,
            "trains_found": len(trains_found),
            "trains": trains_found
        }
    except Exception as e:
        logger.error(f"railway_search_coverage error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
