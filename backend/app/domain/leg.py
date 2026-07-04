from dataclasses import dataclass

@dataclass(frozen=True)
class Duration:
    minutes: int

    @property
    def formatted(self) -> str:
        hours = self.minutes // 60
        mins = self.minutes % 60
        return f"{hours}h {mins:02d}m"

@dataclass
class Leg:
    from_city: str
    to_city: str
    mode: str
    duration: Duration
    departure_time: str
    arrival_time: str
