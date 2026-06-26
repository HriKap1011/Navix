from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, Union

# Helper for string-to-boolean conversion in CSV environments
def coerce_bool(val: Union[str, bool, int, None]) -> bool:
    if val is None:
        return False
    if isinstance(val, bool):
        return val
    if isinstance(val, int):
        return val != 0
    s = str(val).strip().lower()
    return s in ("true", "yes", "1", "t", "y")

class CityIngestSchema(BaseModel):
    city_name: str
    state: Optional[str] = None
    tier: Optional[str] = None
    importance_score: int = Field(default=50)
    demand_category: str = Field(default="Standard")
    latitude: float
    longitude: float
    has_airport: bool = Field(default=False)
    has_train_station: bool = Field(default=True)
    code: Optional[str] = None
    station: Optional[str] = None

    @field_validator("city_name")
    def validate_city_name(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("City name cannot be empty")
        return stripped

    @field_validator("latitude")
    def validate_latitude(cls, v: float) -> float:
        if not (-90.0 <= v <= 90.0):
            raise ValueError("Latitude must be between -90.0 and 90.0")
        return v

    @field_validator("longitude")
    def validate_longitude(cls, v: float) -> float:
        if not (-180.0 <= v <= 180.0):
            raise ValueError("Longitude must be between -180.0 and 180.0")
        return v

    @field_validator("importance_score")
    def validate_importance_score(cls, v: int) -> int:
        if not (0 <= v <= 100):
            raise ValueError("Importance score must be between 0 and 100")
        return v

    @model_validator(mode="before")
    @classmethod
    def preprocess_booleans(cls, data: dict) -> dict:
        if isinstance(data, dict):
            for k in ("has_airport", "has_train_station"):
                if k in data:
                    data[k] = coerce_bool(data[k])
        return data


class StationIngestSchema(BaseModel):
    station_code: str
    station_name: str
    city_name: Optional[str] = None
    city_id: Optional[int] = None
    station_type: str = Field(default="Rail")
    importance_score: int = Field(default=50)

    @field_validator("station_code")
    def validate_station_code(cls, v: str) -> str:
        stripped = v.strip().upper()
        if not stripped:
            raise ValueError("Station code cannot be empty")
        if not (1 <= len(stripped) <= 10):
            raise ValueError("Station code must be between 1 and 10 characters")

        return stripped

    @field_validator("station_name")
    def validate_station_name(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Station name cannot be empty")
        return stripped

    @field_validator("importance_score")
    def validate_importance_score(cls, v: int) -> int:
        if not (0 <= v <= 100):
            raise ValueError("Importance score must be between 0 and 100")
        return v


class NearbyMappingIngestSchema(BaseModel):
    city_name: Optional[str] = None
    city_id: Optional[Union[str, int]] = None
    station_code: Optional[str] = None
    station_id: Optional[Union[str, int]] = None
    distance_km: float = Field(default=0.0)

    @field_validator("distance_km")
    def validate_distance(cls, v: float) -> float:
        if v < 0.0:
            raise ValueError("Distance cannot be negative")
        return v

    @model_validator(mode="after")
    def verify_references(self) -> "NearbyMappingIngestSchema":
        if not self.city_name and not self.city_id:
            raise ValueError("Either City Name or City ID must be provided")
        if not self.station_code and not self.station_id:
            raise ValueError("Either Station Code or Station ID must be provided")
        return self


class CorridorIngestSchema(BaseModel):
    source_city_name: Optional[str] = None
    source_city_id: Optional[Union[str, int]] = None
    destination_city_name: Optional[str] = None
    destination_city_id: Optional[Union[str, int]] = None
    demand_level: str = Field(default="Moderate")
    migration_relevance: Optional[str] = None
    seasonal_pressure: Optional[str] = None
    avg_duration: Optional[str] = None

    @model_validator(mode="after")
    def verify_corridor_endpoints(self) -> "CorridorIngestSchema":
        has_source = bool(self.source_city_name or self.source_city_id)
        has_dest = bool(self.destination_city_name or self.destination_city_id)
        if not has_source:
            raise ValueError("Source City (name or ID) is required")
        if not has_dest:
            raise ValueError("Destination City (name or ID) is required")
        
        # Check matching endpoints
        if self.source_city_id and self.destination_city_id:
            if str(self.source_city_id).strip() == str(self.destination_city_id).strip():
                raise ValueError("Source and destination endpoints cannot be the same ID")
        if self.source_city_name and self.destination_city_name:
            if self.source_city_name.strip().lower() == self.destination_city_name.strip().lower():
                raise ValueError("Source and destination endpoints cannot be the same City Name")
        return self


class SeasonalDemandIngestSchema(BaseModel):
    festival_name: str
    start_month: int
    start_day: int
    end_month: int
    end_day: int
    seat_modifier: float = Field(default=1.0)
    comfort_modifier: int = Field(default=0)
    price_multiplier: float = Field(default=1.0)
    crowd_modifier: int = Field(default=0)
    description: Optional[str] = None

    @field_validator("festival_name")
    def validate_festival_name(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Festival Name cannot be empty")
        return stripped

    @field_validator("start_month", "end_month")
    def validate_month(cls, v: int) -> int:
        if not (1 <= v <= 12):
            raise ValueError("Month must be between 1 and 12")
        return v

    @field_validator("start_day", "end_day")
    def validate_day(cls, v: int) -> int:
        if not (1 <= v <= 31):
            raise ValueError("Day must be between 1 and 31")
        return v

    @field_validator("price_multiplier")
    def validate_price_multiplier(cls, v: float) -> float:
        if v <= 0.0:
            raise ValueError("Price multiplier must be greater than 0")
        return v
