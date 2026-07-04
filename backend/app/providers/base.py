from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from app.domain.city import City
from app.domain.station import Station
from app.domain.corridor import Corridor
from app.domain.recommendation import SeasonalDemand
from app.domain.journey import Journey

class BaseProvider(ABC):
    def search_routes(self, source: str, destination: str, date: str) -> List[Journey]:
        """
        Search routes between source and destination cities on a given date.
        By default, delegates to the shared routing generator using self as the provider.
        """
        from app.generator import generate_routes_for_provider
        return generate_routes_for_provider(source, destination, date, provider=self)

    def get_station_name(self, code: str) -> str:
        stations = self.search_stations()
        return stations.get(code.upper().strip(), f"{code} Station")

    def get_city(self, name: str) -> City:
        return self.search_city(name)

    @abstractmethod
    def search_stations(self) -> Dict[str, str]:
        """Get all stations as a mapping of station_code -> station_name."""
        pass

    @abstractmethod
    def search_city(self, name: str) -> City:
        """Get city details by name."""
        pass

    @abstractmethod
    def get_nearby_stations(self, city_name: str) -> List[str]:
        """Get nearby stations for a city."""
        pass

    @abstractmethod
    def get_corridor(self, source: str, destination: str) -> Optional[Corridor]:
        """Get corridor details between source and destination cities."""
        pass

    @abstractmethod
    def health_check(self) -> bool:
        """Check the health of the provider."""
        pass

    @abstractmethod
    def get_all_cities(self) -> List[City]:
        """Get all cities."""
        pass

    @abstractmethod
    def get_all_corridors(self) -> Dict[str, Corridor]:
        """Get all corridors."""
        pass

    @abstractmethod
    def get_seasonal_demands(self) -> List[SeasonalDemand]:
        """Get seasonal demands/festivals."""
        pass

    @abstractmethod
    def is_valid_city(self, name: str) -> bool:
        """Check if a city name is valid."""
        pass

    @abstractmethod
    def get_all_stations(self) -> List[Station]:
        """Get all stations as a list of Station domain objects."""
        pass

    @abstractmethod
    def get_all_nearby_mappings(self) -> List[Dict[str, Any]]:
        """Get all nearby station mappings as a list of dictionaries with natural keys."""
        pass


