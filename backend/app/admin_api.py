import os
import shutil
import tempfile
from typing import Optional, List
import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, asc
from sqlalchemy.orm import aliased

from app.database import get_db
from app.models import City, Station, NearbyStationMapping, Corridor, SeasonalDemand, AuditLog
from app.ingestion.validators import (
    CityIngestSchema, StationIngestSchema, NearbyMappingIngestSchema,
    CorridorIngestSchema, SeasonalDemandIngestSchema
)
from app.ingestion.import_cities import import_cities
from app.ingestion.import_stations import import_stations
from app.ingestion.import_corridors import import_corridors
from app.ingestion.import_nearby_stations import import_nearby_stations
from app.ingestion.import_seasonal_demands import import_seasonal_demands

logger = logging.getLogger("navix.admin")

router = APIRouter(prefix="/admin", tags=["admin"])

# Helper to write Audit Logs
def log_audit(db: Session, operation: str, entity: str, record_id: Optional[str], details: Optional[str] = None):
    try:
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

# 1. Admin Stats Dashboard Card
@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    try:
        total_cities = db.query(City).count()
        total_stations = db.query(Station).count()
        total_corridors = db.query(Corridor).count()
        total_nearby = db.query(NearbyStationMapping).count()
        total_seasonal = db.query(SeasonalDemand).count()
        
        last_import = db.query(AuditLog).filter(AuditLog.operation == "IMPORTED").order_by(AuditLog.timestamp.desc()).first()
        last_import_time = last_import.timestamp.isoformat() if last_import else None
        
        return {
            "success": True,
            "total_cities": total_cities,
            "total_stations": total_stations,
            "total_corridors": total_corridors,
            "total_nearby": total_nearby,
            "total_seasonal": total_seasonal,
            "last_import_time": last_import_time
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load admin stats: {str(e)}")

# 2. Cities CRUD
@router.get("/cities/filters")
def get_cities_filters(db: Session = Depends(get_db)):
    try:
        states = [r[0] for r in db.query(City.state).distinct().all() if r[0]]
        tiers = [r[0] for r in db.query(City.tier).distinct().all() if r[0]]
        return {"success": True, "states": sorted(states), "tiers": sorted(tiers)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cities")
def list_cities(
    search: Optional[str] = None,
    state: Optional[str] = None,
    tier: Optional[str] = None,
    sort_by: Optional[str] = "city_name",
    sort_order: Optional[str] = "asc",
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    query = db.query(City)
    if search:
        query = query.filter(
            or_(
                City.city_name.ilike(f"%{search}%"),
                City.state.ilike(f"%{search}%"),
                City.code.ilike(f"%{search}%")
            )
        )
    if state:
        query = query.filter(City.state == state)
    if tier:
        query = query.filter(City.tier == tier)
        
    total = query.count()
    
    col = getattr(City, sort_by, City.city_name)
    if sort_order == "desc":
        query = query.order_by(desc(col))
    else:
        query = query.order_by(asc(col))
        
    offset = (page - 1) * limit
    cities = query.offset(offset).limit(limit).all()
    
    return {
        "success": True,
        "total": total,
        "page": page,
        "limit": limit,
        "data": [
            {
                "id": c.id,
                "city_name": c.city_name,
                "state": c.state,
                "tier": c.tier,
                "importance_score": c.importance_score,
                "demand_category": c.demand_category,
                "latitude": c.latitude,
                "longitude": c.longitude,
                "has_airport": c.has_airport,
                "has_train_station": c.has_train_station,
                "code": c.code,
                "station": c.station
            } for c in cities
        ]
    }

@router.post("/cities")
def create_city(payload: CityIngestSchema, db: Session = Depends(get_db)):
    # Check duplicates
    existing = db.query(City).filter(City.city_name.ilike(payload.city_name)).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"City with name '{payload.city_name}' already exists")
    
    city = City(**payload.model_dump())
    db.add(city)
    db.commit()
    db.refresh(city)
    
    log_audit(db, "CREATED", "City", city.id, f"Created city '{city.city_name}' ({city.code})")
    return {"success": True, "data": {"id": city.id, "city_name": city.city_name}}

@router.put("/cities/{id}")
def update_city(id: int, payload: CityIngestSchema, db: Session = Depends(get_db)):
    city = db.query(City).filter(City.id == id).first()
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
        
    existing = db.query(City).filter(City.city_name.ilike(payload.city_name), City.id != id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Another city with name '{payload.city_name}' already exists")
        
    for k, v in payload.model_dump().items():
        setattr(city, k, v)
        
    db.commit()
    db.refresh(city)
    
    log_audit(db, "UPDATED", "City", city.id, f"Updated city '{city.city_name}'")
    return {"success": True, "data": {"id": city.id, "city_name": city.city_name}}

@router.delete("/cities/{id}")
def delete_city(id: int, db: Session = Depends(get_db)):
    city = db.query(City).filter(City.id == id).first()
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
        
    city_name = city.city_name
    db.delete(city)
    db.commit()
    
    log_audit(db, "DELETED", "City", id, f"Deleted city '{city_name}'")
    return {"success": True, "message": f"City '{city_name}' deleted successfully"}


# 3. Stations CRUD
@router.get("/stations")
def list_stations(
    search: Optional[str] = None,
    city_id: Optional[int] = None,
    sort_by: Optional[str] = "station_code",
    sort_order: Optional[str] = "asc",
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    query = db.query(Station).join(City, Station.city_id == City.id, isouter=True)
    if search:
        query = query.filter(
            or_(
                Station.station_code.ilike(f"%{search}%"),
                Station.station_name.ilike(f"%{search}%"),
                City.city_name.ilike(f"%{search}%")
            )
        )
    if city_id:
        query = query.filter(Station.city_id == city_id)
        
    total = query.count()
    
    col = getattr(Station, sort_by, Station.station_code)
    if sort_order == "desc":
        query = query.order_by(desc(col))
    else:
        query = query.order_by(asc(col))
        
    offset = (page - 1) * limit
    stations = query.offset(offset).limit(limit).all()
    
    return {
        "success": True,
        "total": total,
        "page": page,
        "limit": limit,
        "data": [
            {
                "id": s.id,
                "station_code": s.station_code,
                "station_name": s.station_name,
                "city_id": s.city_id,
                "city_name": s.city.city_name if s.city else None,
                "station_type": s.station_type,
                "importance_score": s.importance_score
            } for s in stations
        ]
    }

@router.post("/stations")
def create_station(payload: StationIngestSchema, db: Session = Depends(get_db)):
    # Check unique station code
    existing = db.query(Station).filter(Station.station_code.ilike(payload.station_code)).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Station code '{payload.station_code}' is already registered")
        
    # Check city link
    if payload.city_id:
        city = db.query(City).filter(City.id == payload.city_id).first()
        if not city:
            raise HTTPException(status_code=400, detail=f"Linked city ID {payload.city_id} does not exist")
            
    data = payload.model_dump()
    data.pop("city_name", None)
    station = Station(**data)
    db.add(station)
    db.commit()
    db.refresh(station)
    
    log_audit(db, "CREATED", "Station", station.id, f"Created station '{station.station_name}' ({station.station_code})")
    return {"success": True, "data": {"id": station.id, "station_code": station.station_code}}

@router.put("/stations/{id}")
def update_station(id: int, payload: StationIngestSchema, db: Session = Depends(get_db)):
    station = db.query(Station).filter(Station.id == id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
        
    existing = db.query(Station).filter(Station.station_code.ilike(payload.station_code), Station.id != id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Another station with code '{payload.station_code}' already exists")
        
    if payload.city_id:
        city = db.query(City).filter(City.id == payload.city_id).first()
        if not city:
            raise HTTPException(status_code=400, detail="Linked City ID does not exist")
            
    data = payload.model_dump()
    data.pop("city_name", None)
    for k, v in data.items():
        setattr(station, k, v)
        
    db.commit()
    db.refresh(station)
    
    log_audit(db, "UPDATED", "Station", station.id, f"Updated station '{station.station_code}'")
    return {"success": True, "data": {"id": station.id, "station_code": station.station_code}}

@router.delete("/stations/{id}")
def delete_station(id: int, db: Session = Depends(get_db)):
    station = db.query(Station).filter(Station.id == id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
        
    station_code = station.station_code
    db.delete(station)
    db.commit()
    
    log_audit(db, "DELETED", "Station", id, f"Deleted station '{station_code}'")
    return {"success": True, "message": f"Station '{station_code}' deleted successfully"}


# 4. Corridors CRUD
@router.get("/corridors")
def list_corridors(
    search: Optional[str] = None,
    sort_by: Optional[str] = "id",
    sort_order: Optional[str] = "asc",
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    src_alias = aliased(City)
    dest_alias = aliased(City)
    
    query = db.query(Corridor).join(
        src_alias, Corridor.source_city_id == src_alias.id
    ).join(
        dest_alias, Corridor.destination_city_id == dest_alias.id
    )
    
    if search:
        query = query.filter(
            or_(
                src_alias.city_name.ilike(f"%{search}%"),
                dest_alias.city_name.ilike(f"%{search}%")
            )
        )
        
    total = query.count()
    
    col = getattr(Corridor, sort_by, Corridor.id)
    if sort_order == "desc":
        query = query.order_by(desc(col))
    else:
        query = query.order_by(asc(col))
        
    offset = (page - 1) * limit
    corridors = query.offset(offset).limit(limit).all()
    
    return {
        "success": True,
        "total": total,
        "page": page,
        "limit": limit,
        "data": [
            {
                "id": c.id,
                "source_city_id": c.source_city_id,
                "source_city_name": c.source_city.city_name,
                "destination_city_id": c.destination_city_id,
                "destination_city_name": c.destination_city.city_name,
                "demand_level": c.demand_level,
                "migration_relevance": c.migration_relevance,
                "seasonal_pressure": c.seasonal_pressure,
                "avg_duration": c.avg_duration
            } for c in corridors
        ]
    }

@router.post("/corridors")
def create_corridor(payload: CorridorIngestSchema, db: Session = Depends(get_db)):
    # Check endpoints exist
    src = db.query(City).filter(City.id == payload.source_city_id).first()
    dest = db.query(City).filter(City.id == payload.destination_city_id).first()
    if not src or not dest:
        raise HTTPException(status_code=400, detail="Invalid source or destination city reference")
        
    # Check unique corridor endpoints
    existing = db.query(Corridor).filter(
        Corridor.source_city_id == payload.source_city_id,
        Corridor.destination_city_id == payload.destination_city_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Corridor between these cities already exists")
        
    data = payload.model_dump()
    data.pop("source_city_name", None)
    data.pop("destination_city_name", None)
    corridor = Corridor(**data)
    db.add(corridor)
    db.commit()
    db.refresh(corridor)
    
    log_audit(db, "CREATED", "Corridor", corridor.id, f"Created corridor {src.city_name} -> {dest.city_name}")
    return {"success": True, "data": {"id": corridor.id}}

@router.put("/corridors/{id}")
def update_corridor(id: int, payload: CorridorIngestSchema, db: Session = Depends(get_db)):
    corridor = db.query(Corridor).filter(Corridor.id == id).first()
    if not corridor:
        raise HTTPException(status_code=404, detail="Corridor not found")
        
    src = db.query(City).filter(City.id == payload.source_city_id).first()
    dest = db.query(City).filter(City.id == payload.destination_city_id).first()
    if not src or not dest:
        raise HTTPException(status_code=400, detail="Invalid source or destination city reference")
        
    existing = db.query(Corridor).filter(
        Corridor.source_city_id == payload.source_city_id,
        Corridor.destination_city_id == payload.destination_city_id,
        Corridor.id != id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Another corridor between these cities already exists")
        
    data = payload.model_dump()
    data.pop("source_city_name", None)
    data.pop("destination_city_name", None)
    for k, v in data.items():
        setattr(corridor, k, v)
        
    db.commit()
    db.refresh(corridor)
    
    log_audit(db, "UPDATED", "Corridor", corridor.id, f"Updated corridor {src.city_name} -> {dest.city_name}")
    return {"success": True, "data": {"id": corridor.id}}

@router.delete("/corridors/{id}")
def delete_corridor(id: int, db: Session = Depends(get_db)):
    corridor = db.query(Corridor).filter(Corridor.id == id).first()
    if not corridor:
        raise HTTPException(status_code=404, detail="Corridor not found")
        
    route_name = f"{corridor.source_city.city_name} -> {corridor.destination_city.city_name}"
    db.delete(corridor)
    db.commit()
    
    log_audit(db, "DELETED", "Corridor", id, f"Deleted corridor {route_name}")
    return {"success": True, "message": "Corridor deleted successfully"}


# 5. Nearby Mappings CRUD
@router.get("/nearby-mappings")
def list_nearby_mappings(
    search: Optional[str] = None,
    sort_by: Optional[str] = "id",
    sort_order: Optional[str] = "asc",
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    query = db.query(NearbyStationMapping).join(
        City, NearbyStationMapping.city_id == City.id
    ).join(
        Station, NearbyStationMapping.station_id == Station.id
    )
    
    if search:
        query = query.filter(
            or_(
                City.city_name.ilike(f"%{search}%"),
                Station.station_code.ilike(f"%{search}%"),
                Station.station_name.ilike(f"%{search}%")
            )
        )
        
    total = query.count()
    
    col = getattr(NearbyStationMapping, sort_by, NearbyStationMapping.id)
    if sort_order == "desc":
        query = query.order_by(desc(col))
    else:
        query = query.order_by(asc(col))
        
    offset = (page - 1) * limit
    mappings = query.offset(offset).limit(limit).all()
    
    return {
        "success": True,
        "total": total,
        "page": page,
        "limit": limit,
        "data": [
            {
                "id": m.id,
                "city_id": m.city_id,
                "city_name": m.city.city_name,
                "station_id": m.station_id,
                "station_code": m.station.station_code,
                "station_name": m.station.station_name,
                "distance_km": m.distance_km
            } for m in mappings
        ]
    }

@router.post("/nearby-mappings")
def create_nearby_mapping(payload: NearbyMappingIngestSchema, db: Session = Depends(get_db)):
    city = db.query(City).filter(City.id == payload.city_id).first()
    station = db.query(Station).filter(Station.id == payload.station_id).first()
    if not city or not station:
        raise HTTPException(status_code=400, detail="Invalid city or station references")
        
    # Check duplicate mapping
    existing = db.query(NearbyStationMapping).filter(
        NearbyStationMapping.city_id == payload.city_id,
        NearbyStationMapping.station_id == payload.station_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="This city and station mapping already exists")
        
    data = payload.model_dump()
    data.pop("city_name", None)
    data.pop("station_code", None)
    mapping = NearbyStationMapping(**data)
    db.add(mapping)
    db.commit()
    db.refresh(mapping)
    
    log_audit(
        db, 
        "CREATED", 
        "Nearby Mapping", 
        mapping.id, 
        f"Mapped {station.station_code} to city {city.city_name} ({mapping.distance_km} KM)"
    )
    return {"success": True, "data": {"id": mapping.id}}

@router.put("/nearby-mappings/{id}")
def update_nearby_mapping(id: int, payload: NearbyMappingIngestSchema, db: Session = Depends(get_db)):
    mapping = db.query(NearbyStationMapping).filter(NearbyStationMapping.id == id).first()
    if not mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")
        
    city = db.query(City).filter(City.id == payload.city_id).first()
    station = db.query(Station).filter(Station.id == payload.station_id).first()
    if not city or not station:
        raise HTTPException(status_code=400, detail="Invalid city or station references")
        
    existing = db.query(NearbyStationMapping).filter(
        NearbyStationMapping.city_id == payload.city_id,
        NearbyStationMapping.station_id == payload.station_id,
        NearbyStationMapping.id != id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Another mapping for this city and station already exists")
        
    data = payload.model_dump()
    data.pop("city_name", None)
    data.pop("station_code", None)
    for k, v in data.items():
        setattr(mapping, k, v)
        
    db.commit()
    db.refresh(mapping)
    
    log_audit(db, "UPDATED", "Nearby Mapping", mapping.id, f"Updated mapping of {station.station_code} to {city.city_name}")
    return {"success": True, "data": {"id": mapping.id}}

@router.delete("/nearby-mappings/{id}")
def delete_nearby_mapping(id: int, db: Session = Depends(get_db)):
    mapping = db.query(NearbyStationMapping).filter(NearbyStationMapping.id == id).first()
    if not mapping:
        raise HTTPException(status_code=404, detail="Mapping not found")
        
    details = f"Removed station {mapping.station.station_code} from city {mapping.city.city_name}"
    db.delete(mapping)
    db.commit()
    
    log_audit(db, "DELETED", "Nearby Mapping", id, details)
    return {"success": True, "message": "Mapping removed successfully"}


# 6. Seasonal Demands CRUD
@router.get("/seasonal-demands")
def list_seasonal_demands(
    search: Optional[str] = None,
    sort_by: Optional[str] = "festival_name",
    sort_order: Optional[str] = "asc",
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    query = db.query(SeasonalDemand)
    if search:
        query = query.filter(
            or_(
                SeasonalDemand.festival_name.ilike(f"%{search}%"),
                SeasonalDemand.description.ilike(f"%{search}%")
            )
        )
        
    total = query.count()
    
    col = getattr(SeasonalDemand, sort_by, SeasonalDemand.festival_name)
    if sort_order == "desc":
        query = query.order_by(desc(col))
    else:
        query = query.order_by(asc(col))
        
    offset = (page - 1) * limit
    demands = query.offset(offset).limit(limit).all()
    
    return {
        "success": True,
        "total": total,
        "page": page,
        "limit": limit,
        "data": [
            {
                "id": d.id,
                "festival_name": d.festival_name,
                "start_month": d.start_month,
                "start_day": d.start_day,
                "end_month": d.end_month,
                "end_day": d.end_day,
                "seat_modifier": d.seat_modifier,
                "comfort_modifier": d.comfort_modifier,
                "price_multiplier": d.price_multiplier,
                "crowd_modifier": d.crowd_modifier,
                "description": d.description
            } for d in demands
        ]
    }

@router.post("/seasonal-demands")
def create_seasonal_demand(payload: SeasonalDemandIngestSchema, db: Session = Depends(get_db)):
    existing = db.query(SeasonalDemand).filter(SeasonalDemand.festival_name.ilike(payload.festival_name)).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Festival '{payload.festival_name}' already exists")
        
    demand = SeasonalDemand(**payload.model_dump())
    db.add(demand)
    db.commit()
    db.refresh(demand)
    
    log_audit(db, "CREATED", "Seasonal Demand", demand.id, f"Created seasonal period for '{demand.festival_name}'")
    return {"success": True, "data": {"id": demand.id, "festival_name": demand.festival_name}}

@router.put("/seasonal-demands/{id}")
def update_seasonal_demand(id: int, payload: SeasonalDemandIngestSchema, db: Session = Depends(get_db)):
    demand = db.query(SeasonalDemand).filter(SeasonalDemand.id == id).first()
    if not demand:
        raise HTTPException(status_code=404, detail="Seasonal record not found")
        
    existing = db.query(SeasonalDemand).filter(SeasonalDemand.festival_name.ilike(payload.festival_name), SeasonalDemand.id != id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Another festival with name '{payload.festival_name}' already exists")
        
    for k, v in payload.model_dump().items():
        setattr(demand, k, v)
        
    db.commit()
    db.refresh(demand)
    
    log_audit(db, "UPDATED", "Seasonal Demand", demand.id, f"Updated seasonal period '{demand.festival_name}'")
    return {"success": True, "data": {"id": demand.id, "festival_name": demand.festival_name}}

@router.delete("/seasonal-demands/{id}")
def delete_seasonal_demand(id: int, db: Session = Depends(get_db)):
    demand = db.query(SeasonalDemand).filter(SeasonalDemand.id == id).first()
    if not demand:
        raise HTTPException(status_code=404, detail="Seasonal record not found")
        
    name = demand.festival_name
    db.delete(demand)
    db.commit()
    
    log_audit(db, "DELETED", "Seasonal Demand", id, f"Deleted seasonal period '{name}'")
    return {"success": True, "message": "Seasonal demand deleted successfully"}


# 7. Import Center Upload Ingestion
@router.post("/import")
def run_import(
    target: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if target not in ("cities", "stations", "corridors", "nearby", "seasonal"):
        raise HTTPException(status_code=400, detail="Invalid import target")
        
    filename = file.filename or ""
    if not (filename.endswith(".csv") or filename.endswith(".json")):
        raise HTTPException(status_code=400, detail="Only CSV and JSON files are supported")
        
    suffix = ".csv" if filename.endswith(".csv") else ".json"
    
    try:
        fd, temp_path = tempfile.mkstemp(suffix=suffix)
        with os.fdopen(fd, 'wb') as tmp:
            shutil.copyfileobj(file.file, tmp)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process upload: {str(e)}")
        
    try:
        report = None
        if target == "cities":
            report = import_cities(db, temp_path)
        elif target == "stations":
            report = import_stations(db, temp_path)
        elif target == "corridors":
            report = import_corridors(db, temp_path)
        elif target == "nearby":
            report = import_nearby_stations(db, temp_path)
        elif target == "seasonal":
            report = import_seasonal_demands(db, temp_path)
            
        if report:
            log_audit(
                db, 
                "IMPORTED", 
                f"{target.capitalize()} Dataset", 
                None, 
                f"File: {filename}. New: {report.imported}, Updated: {report.updated}, Skipped: {report.skipped}, Errors: {report.validation_errors}"
            )
            return {
                "success": True,
                "name": report.name,
                "imported": report.imported,
                "updated": report.updated,
                "skipped": report.skipped,
                "validation_errors": report.validation_errors,
                "runtime_seconds": report.runtime_seconds,
                "summary": report.print_summary()
            }
        else:
            raise HTTPException(status_code=500, detail="No ingestion report generated")
    except Exception as e:
        logger.error(f"Ingestion upload failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Ingestion run failed: {str(e)}")
    finally:
        if os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except Exception:
                pass


# 8. Audit Logs
@router.get("/audit-logs")
def list_audit_logs(
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    try:
        query = db.query(AuditLog).order_by(desc(AuditLog.timestamp))
        total = query.count()
        offset = (page - 1) * limit
        logs = query.offset(offset).limit(limit).all()
        
        return {
            "success": True,
            "total": total,
            "page": page,
            "limit": limit,
            "data": [
                {
                    "id": l.id,
                    "timestamp": l.timestamp.isoformat(),
                    "operation": l.operation,
                    "entity": l.entity,
                    "record_id": l.record_id,
                    "details": l.details
                } for l in logs
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load audit logs: {str(e)}")


# 9. Data Sources
def serialize_metadata(meta):
    return {
        "source_id": meta.source_id,
        "name": meta.name,
        "type": meta.type,
        "status": meta.status,
        "priority": meta.priority,
        "last_sync": meta.last_sync.isoformat() if meta.last_sync else None,
        "refresh_frequency_sec": meta.refresh_frequency_sec,
        "supported_transport_modes": meta.supported_transport_modes,
        "version": meta.version,
        "health_status": meta.health_status,
        "consecutive_failures": meta.consecutive_failures,
        "average_response_time_ms": meta.average_response_time_ms,
        "total_records_count": meta.total_records_count,
        "validation_issues_count": meta.validation_issues_count
    }

@router.get("/data-sources")
def list_data_sources():
    from app.data_sources.registry import registry
    connectors = registry.get_all_connectors()
    return {
        "success": True,
        "data": [serialize_metadata(c.metadata()) for c in connectors]
    }

@router.post("/data-sources/{source_id}/toggle")
def toggle_data_source(source_id: str, db: Session = Depends(get_db)):
    from app.data_sources.registry import registry
    conn = registry.get_connector(source_id)
    if not conn:
        raise HTTPException(status_code=404, detail=f"Data source '{source_id}' not found")
        
    meta = conn.metadata()
    new_status = "Inactive" if meta.status == "Active" else "Active"
    registry.update_source_status(source_id, new_status)
    
    log_audit(db, "TOGGLED_SOURCE", "DataSource", None, f"Toggled Data Source '{source_id}' to status '{new_status}'")
    return {"success": True, "data": serialize_metadata(meta)}

@router.post("/data-sources/{source_id}/sync")
def sync_data_source(source_id: str, db: Session = Depends(get_db)):
    from app.data_sources.registry import registry
    from app.data_sources.health import health_monitor
    conn = registry.get_connector(source_id)
    if not conn:
        raise HTTPException(status_code=404, detail=f"Data source '{source_id}' not found")
        
    start_time = time.perf_counter()
    try:
        conn.connect()
        valid = conn.validate()
        healthy = conn.health_check()
        duration = (time.perf_counter() - start_time) * 1000
        
        # Pull count
        routes = conn.fetch("Delhi", "Patna", "2026-11-05")
        health_monitor.log_success(conn.metadata(), duration, len(routes))
        
        log_audit(db, "SYNC_SOURCE", "DataSource", None, f"Manually synced and validated Data Source '{source_id}' in {duration:.2f}ms")
        return {"success": True, "data": serialize_metadata(conn.metadata())}
    except Exception as ex:
        duration = (time.perf_counter() - start_time) * 1000
        health_monitor.log_failure(conn.metadata(), duration)
        raise HTTPException(status_code=500, detail=f"Sync failed for source '{source_id}': {ex}")

@router.get("/data-sources/{source_id}/connector")
def get_connector_details(source_id: str):
    from app.data_sources.registry import registry
    conn = registry.get_connector(source_id)
    if not conn:
        raise HTTPException(status_code=404, detail=f"Data source '{source_id}' not found")
    meta = conn.metadata()
    return {
        "success": True,
        "connector_class": conn.__class__.__name__,
        "supported_transport_modes": meta.supported_transport_modes,
        "validation_issues_count": meta.validation_issues_count,
        "version": meta.version
    }

@router.post("/data-sources/{source_id}/priority")
def set_data_source_priority(source_id: str, payload: dict, db: Session = Depends(get_db)):
    from app.data_sources.registry import registry
    conn = registry.get_connector(source_id)
    if not conn:
        raise HTTPException(status_code=404, detail=f"Data source '{source_id}' not found")
    
    priority = payload.get("priority")
    if priority is None or not isinstance(priority, int):
        raise HTTPException(status_code=400, detail="Invalid priority value (must be integer)")
        
    registry.update_source_priority(source_id, priority)
    log_audit(db, "SET_PRIORITY", "DataSource", None, f"Set Data Source '{source_id}' priority to {priority}")
    return {"success": True, "data": serialize_metadata(conn.metadata())}

