import os
import time
import logging
from typing import Dict, Type
from app.providers.base import BaseProvider

logger = logging.getLogger("navix.providers")
# Ensure logging handler is configured if not already
if not logger.handlers:
    logger.setLevel(logging.INFO)
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        "[%(asctime)s] %(levelname)s [%(name)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)

_registry: Dict[str, Type[BaseProvider]] = {}
_instances: Dict[str, BaseProvider] = {}

def register_provider(name: str, provider_cls: Type[BaseProvider]):
    _registry[name.upper()] = provider_cls
    logger.info(f"Registered provider: {name.upper()}")

def get_active_provider() -> BaseProvider:
    # 1. Determine configured provider
    try:
        from app.config import ACTIVE_PROVIDER
    except ImportError:
        ACTIVE_PROVIDER = "DATABASE"
        
    provider_name = os.getenv("ACTIVE_PROVIDER", ACTIVE_PROVIDER).upper()

    # 2. Check if already instantiated
    if provider_name in _instances:
        return _instances[provider_name]

    # 3. Instantiate and cache
    if provider_name in _registry:
        logger.info(f"Provider selected: {provider_name}")
        provider_cls = _registry[provider_name]
        try:
            instance = provider_cls()
            _instances[provider_name] = instance
            return instance
        except Exception as e:
            logger.error(f"Failed to initialize provider {provider_name}: {e}. Trying runtime initialization fallback...")
            return _handle_provider_fallback(provider_name, e)
    else:
        logger.error(f"Configured provider {provider_name} not found in registry. Trying fallback...")
        return _handle_provider_fallback(provider_name, ValueError(f"Provider {provider_name} not registered"))

def _handle_provider_fallback(failed_name: str, error: Exception) -> BaseProvider:
    # Try fallbacks: DATABASE -> CSV -> MOCK
    fallbacks = ["DATABASE", "CSV", "MOCK"]
    for fb in fallbacks:
        if fb != failed_name and fb in _registry:
            logger.warning(f"Attempting initialization fallback to provider: {fb} due to failure of {failed_name}")
            try:
                if fb not in _instances:
                    _instances[fb] = _registry[fb]()
                return _instances[fb]
            except Exception as fe:
                logger.error(f"Initialization fallback to {fb} failed: {fe}")
    raise RuntimeError(f"All providers failed to load. Primary failure: {failed_name} ({error})")

# Import and register standard providers to populate the registry automatically
from app.providers.database_provider import DatabaseProvider
from app.providers.csv_provider import CSVProvider
from app.providers.mock_provider import MockProvider

register_provider("DATABASE", DatabaseProvider)
register_provider("CSV", CSVProvider)
register_provider("MOCK", MockProvider)

# Placeholders for future providers
from app.providers.irctc_provider import IRCTCProvider
from app.providers.bus_provider import BusProvider
from app.providers.flight_provider import FlightProvider

register_provider("IRCTC", IRCTCProvider)
register_provider("BUS", BusProvider)
register_provider("FLIGHT", FlightProvider)
