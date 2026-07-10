import pytest
from app.domain.journey import Journey
from app.domain.leg import Duration
from app.domain.pricing import Money
from app.domain.availability import SeatAvailability
from app.domain.components import ComponentCalculator, NormalizationRanges, RecommendationComponents

def test_component_calculator_basic():
    # Construct a dummy Journey
    j = Journey(
        route_id="RAIL-12345-TEST",
        source="Delhi",
        destination="Patna",
        duration=Duration(480), # 8 hours
        price=Money(amount=1500, currency="INR"),
        nx_score=0,
        seat_likelihood=80.0,
        comfort_score=75.0,
        transport_modes=["Train"],
        departure_time="14:50",
        arrival_time="22:52",
        recommendation_reason=""
    )
    j.availability = SeatAvailability(
        likelihood=80.0,
        waitlist_code="AVL",
        confirmation_probability=95.0
    )

    sanitized = {
        "price": 1500.0,
        "duration": 480,
        "comfort": 75.0,
        "seat": 80.0,
        "friction": 90.0,
        "transfers": 0,
        "incomplete_penalty": 0
    }

    ranges = NormalizationRanges(
        min_price=500.0, max_price=5000.0,
        min_duration=120, max_duration=1200,
        min_transfers=0, max_transfers=3,
        min_comfort=30.0, max_comfort=100.0,
        min_seat=20.0, max_seat=100.0,
        min_friction=30.0, max_friction=100.0
    )

    comp = ComponentCalculator.compute(j, sanitized, ranges)

    assert isinstance(comp, RecommendationComponents)
    assert 0.0 <= comp.journey_value <= 1.0
    assert 0.0 <= comp.booking_confidence <= 1.0
    assert 0.0 <= comp.journey_simplicity <= 1.0
    assert 0.0 <= comp.timing_convenience <= 1.0
    assert 0.0 <= comp.physical_comfort <= 1.0
    assert 0.0 <= comp.schedule_reliability <= 1.0
    assert 0.1 <= comp.information_integrity <= 1.0

    # Journey Simplicity for 0 transfers should be 1.0
    assert comp.journey_simplicity == 1.0

    # Information Integrity with 0 penalty should be 1.0
    assert comp.information_integrity == 1.0

def test_component_calculator_integrity_penalty():
    j = Journey(
        route_id="NX-MOCK-EST",
        source="Delhi",
        destination="Patna",
        duration=Duration(1440),
        price=Money(amount=10000, currency="INR"),
        nx_score=0,
        seat_likelihood=20.0,
        comfort_score=30.0,
        transport_modes=["Bus"],
        departure_time="--:--",
        arrival_time="--:--",
        recommendation_reason=""
    )

    sanitized = {
        "price": 10000.0,
        "duration": 1440,
        "comfort": 30.0,
        "seat": 20.0,
        "friction": 50.0,
        "transfers": 1,
        "incomplete_penalty": 40
    }

    ranges = NormalizationRanges(
        min_price=500.0, max_price=12000.0,
        min_duration=120, max_duration=1800,
        min_transfers=0, max_transfers=3,
        min_comfort=30.0, max_comfort=100.0,
        min_seat=20.0, max_seat=100.0,
        min_friction=30.0, max_friction=100.0
    )

    comp = ComponentCalculator.compute(j, sanitized, ranges)
    
    # penalty is 40 -> integrity = 1.0 - 40/50 = 0.20
    assert abs(comp.information_integrity - 0.20) < 1e-5
    # Schedule reliability for synthetic route (NX-) should be lower than RAIL-
    assert comp.schedule_reliability < 0.90
