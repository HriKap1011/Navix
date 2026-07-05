"""
Pydantic schemas for railway API responses.
"""

from pydantic import BaseModel
from typing import List, Optional
import datetime


class TrainStopOut(BaseModel):
    stop_number: int
    station_code: str
    station_name: str
    arrival_time: Optional[str]
    departure_time: Optional[str]
    halt_minutes: int
    distance_from_source_km: float
    station_linked: bool

    class Config:
        from_attributes = True


class TrainOut(BaseModel):
    id: int
    train_number: str
    train_name: str
    train_type: Optional[str]
    zone: Optional[str]
    from_station_code: str
    from_station_name: str
    to_station_code: str
    to_station_name: str
    running_days: Optional[str]
    total_distance_km: Optional[float]
    total_stops: int
    source_linked: bool
    destination_linked: bool

    class Config:
        from_attributes = True


class TrainDetailOut(TrainOut):
    stops: List[TrainStopOut] = []


class DatasetImportOut(BaseModel):
    id: int
    dataset_name: str
    dataset_version: Optional[str]
    source_url: Optional[str]
    license: Optional[str]
    import_date: datetime.datetime
    trains_imported: int
    stops_imported: int
    trains_skipped: int
    validation_issues: int
    status: str
    notes: Optional[str]

    class Config:
        from_attributes = True


class RailwayStatusOut(BaseModel):
    success: bool
    dataset_name: str
    license: str
    source_url: str
    last_import: Optional[DatasetImportOut]
    trains_count: int
    stops_count: int
    linked_trains: int
    unlinked_stations: int
    validation_issues: int
    coverage_note: str


class ImportResultOut(BaseModel):
    success: bool
    trains_imported: int
    stops_imported: int
    trains_skipped: int
    validation_issues: int
    issues: List[str]
    message: str
