import pytest
from app.search.orchestrator import SearchOrchestrator
from app.search.pipeline import PipelineContext
from app.search.deduplicator import DeduplicationStage
from app.search.filters import FilteringStage
from app.domain.journey import Journey
from app.domain.leg import Leg, Duration
from app.domain.pricing import Pricing, Money
from app.domain.availability import SeatAvailability

def test_orchestrator_single_provider():
    """
    Test that the orchestrator works correctly when querying a single provider.
    """
    orchestrator = SearchOrchestrator(provider_names=["MOCK"])
    result = orchestrator.search("Delhi", "Patna", "2026-11-05")
    
    assert result["success"] is True
    assert len(result["routes"]) > 0
    assert result["meta"]["provider_latencies"]["MOCK"] is not None

def test_orchestrator_multiple_providers():
    """
    Test that the orchestrator queries multiple providers and returns aggregated results.
    """
    orchestrator = SearchOrchestrator(provider_names=["CSV", "MOCK"])
    result = orchestrator.search("Delhi", "Patna", "2026-11-05")
    
    assert result["success"] is True
    assert len(result["routes"]) > 0
    assert "CSV" in result["meta"]["provider_latencies"]
    assert "MOCK" in result["meta"]["provider_latencies"]

def test_orchestrator_provider_failure():
    """
    Test that a failing or unimplemented provider does not crash the entire search.
    """
    # IRCTC raises NotImplementedError
    orchestrator = SearchOrchestrator(provider_names=["MOCK", "IRCTC"])
    result = orchestrator.search("Delhi", "Patna", "2026-11-05")
    
    assert result["success"] is True
    assert len(result["routes"]) > 0
    assert len(result["meta"]["warnings"]) > 0
    assert any("IRCTC" in w for w in result["meta"]["warnings"])

def test_deduplicator():
    """
    Verify that the DeduplicationStage removes journeys with identical leg configurations.
    """
    leg_1 = Leg("Delhi", "Patna", "Train", Duration(600), "08:00", "18:00")
    leg_2 = Leg("Delhi", "Patna", "Train", Duration(600), "08:00", "18:00")
    
    journey_1 = Journey(
        route_id="J1", source="Delhi", destination="Patna", duration=Duration(600),
        price=Pricing(Money(100.0), Money(100.0)), nx_score=0, seat_likelihood=90.0, comfort_score=80.0,
        transport_modes=["Train"], recommendation_reason="", departure_time="08:00", arrival_time="18:00",
        legs=[leg_1]
    )
    journey_2 = Journey(
        route_id="J2", source="Delhi", destination="Patna", duration=Duration(600),
        price=Pricing(Money(100.0), Money(100.0)), nx_score=0, seat_likelihood=90.0, comfort_score=80.0,
        transport_modes=["Train"], recommendation_reason="", departure_time="08:00", arrival_time="18:00",
        legs=[leg_2]
    )
    
    context = PipelineContext("Delhi", "Patna", "2026-11-05")
    stage = DeduplicationStage()
    deduped = stage.process(context, [journey_1, journey_2])
    
    # Since they have identical legs, one of them should be removed
    assert len(deduped) == 1
    assert deduped[0].route_id == "J1"

def test_filtering_stage():
    """
    Verify that the FilteringStage correctly applies different filtering criteria.
    """
    leg = Leg("Delhi", "Patna", "Train", Duration(600), "08:00", "18:00")
    
    journey_expensive = Journey(
        route_id="J_EXP", source="Delhi", destination="Patna", duration=Duration(600),
        price=Pricing(Money(5000.0), Money(5000.0)), nx_score=0, seat_likelihood=90.0, comfort_score=80.0,
        transport_modes=["Train"], recommendation_reason="", departure_time="08:00", arrival_time="18:00",
        legs=[leg]
    )
    journey_cheap = Journey(
        route_id="J_CHP", source="Delhi", destination="Patna", duration=Duration(600),
        price=Pricing(Money(500.0), Money(500.0)), nx_score=0, seat_likelihood=90.0, comfort_score=80.0,
        transport_modes=["Train"], recommendation_reason="", departure_time="08:00", arrival_time="18:00",
        legs=[leg]
    )
    
    # 1. Price Filter (max price = 1000)
    context = PipelineContext("Delhi", "Patna", "2026-11-05", filters={"max_price": 1000})
    stage = FilteringStage()
    filtered = stage.process(context, [journey_expensive, journey_cheap])
    assert len(filtered) == 1
    assert filtered[0].route_id == "J_CHP"
    
    # 2. Mode Filter (must be Flight)
    context_mode = PipelineContext("Delhi", "Patna", "2026-11-05", filters={"modes": ["Flight"]})
    filtered_mode = stage.process(context_mode, [journey_expensive, journey_cheap])
    assert len(filtered_mode) == 0
