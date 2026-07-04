import pytest
from app.data_sources.connector import BaseConnector, DatabaseConnector, CSVConnector, MockConnector
from app.data_sources.registry import registry
from app.data_sources.validators import DataSourceValidator

def test_connector_contract():
    """
    Assert that all concrete connectors implement BaseConnector interface and return correct metadata.
    """
    connectors = [DatabaseConnector(), CSVConnector(), MockConnector()]
    
    for conn in connectors:
        assert isinstance(conn, BaseConnector)
        
        # Test lifecycle
        assert conn.connect() is True
        assert conn.validate() is True
        assert conn.health_check() is True
        
        meta = conn.metadata()
        assert meta.source_id in ["DATABASE", "CSV", "MOCK"]
        assert meta.name
        assert meta.type in ["Database", "CSV", "API"]
        assert meta.status == "Active"
        assert meta.priority >= 1
        assert meta.version == "1.0.0"
        
        # Fetch testing
        routes = conn.fetch("Delhi", "Patna", "2026-11-05")
        assert isinstance(routes, list)
        if len(routes) > 0:
            assert routes[0].source == "Delhi"
            assert routes[0].destination == "Patna"
            
        assert conn.disconnect() is True

def test_registry_toggling():
    """
    Verify that updating connector settings inside the DataSourceRegistry updates configurations.
    """
    # Disable MOCK connector
    registry.update_source_status("MOCK", "Inactive")
    mock_conn = registry.get_connector("MOCK")
    assert mock_conn.metadata().status == "Inactive"
    
    # Active list should not contain MOCK
    active_connectors = registry.get_active_connectors()
    assert all(c.metadata().source_id != "MOCK" for c in active_connectors)
    
    # Enable back
    registry.update_source_status("MOCK", "Active")
    assert mock_conn.metadata().status == "Active"
    
    # Adjust priority
    registry.update_source_priority("MOCK", 5)
    assert mock_conn.metadata().priority == 5
    # Verify ordering is updated (higher priority values sort last)
    all_conns = registry.get_all_connectors()
    assert all_conns[-1].metadata().source_id == "MOCK"
    
    # Reset default priority
    registry.update_source_priority("MOCK", 3)

def test_data_source_validator():
    """
    Validate that validator correctly checks data source schemas.
    """
    sample_records = [
        {"route_id": "NX-01", "source": "Delhi", "destination": "Patna", "duration": "10h", "price": 1000}
    ]
    res = DataSourceValidator.validate_schema("TEST", sample_records)
    assert res["valid"] is True
    assert res["validated_records_count"] == 1
    
    invalid_records = [
        {"route_id": "NX-02", "source": "Delhi"}
    ]
    res_invalid = DataSourceValidator.validate_schema("TEST", invalid_records)
    assert res_invalid["valid"] is False
    assert len(res_invalid["issues"]) > 0
