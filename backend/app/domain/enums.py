from enum import Enum

class TransportMode(str, Enum):
    TRAIN = "Train"
    SLEEPER_BUS = "Sleeper Bus"
    BUS = "Bus"
    FLIGHT = "Flight"

class JourneyType(str, Enum):
    DIRECT_TRAIN = "Direct Train"
    SMART_BOARDING = "Smart Boarding"
    CONGESTION_BYPASS = "Congestion Bypass"
    SMART_SPLIT = "Smart Split"
    OVERNIGHT_BUS = "Overnight Sleeper Bus"
    PREMIUM_FLIGHT = "Premium Flight"
    AIR_HYBRID = "Flight + Train Hybrid"

class AvailabilityStatus(str, Enum):
    AVAILABLE = "Available"
    CONGESTED = "Congested"
    WAITLIST = "Waitlist"

class DemandLevel(str, Enum):
    LOW = "Low"
    MODERATE = "Moderate"
    HIGH = "High"
    VERY_HIGH = "Very High"
    EXTREME = "Extreme"
    STANDARD = "Standard"


class ComfortLevel(str, Enum):
    LOW = "Low"
    MODERATE = "Moderate"
    HIGH = "High"
    EXCELLENT = "Excellent"

class ProviderType(str, Enum):
    DATABASE = "DATABASE"
    CSV = "CSV"
    MOCK = "MOCK"
    IRCTC = "IRCTC"
    BUS = "BUS"
    FLIGHT = "FLIGHT"

class TransferType(str, Enum):
    SAME_STATION = "Same Station"
    INTER_TERMINAL = "Inter-terminal"
    NONE = "None"
