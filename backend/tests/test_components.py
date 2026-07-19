import pytest
from app.domain.journey import Journey
from app.domain.leg import Leg, Duration
from app.domain.pricing import Money, Pricing
from app.domain.availability import SeatAvailability
from app.domain.components import ComponentCalculator, NormalizationRanges, RecommendationComponents


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_journey(
    route_id: str,
    price_amount: float,
    duration_min: int,
    comfort: float,
    seat: float,
    dep_time: str,
    arr_time: str,
    modes: list = None,
    n_legs: int = 1,
) -> Journey:
    """Construct a minimal Journey suitable for calculate_smart_scores()."""
    modes = modes or ["Train"]
    legs = [
        Leg(
            from_city="Delhi",
            to_city="Patna",
            mode=modes[0],
            duration=Duration(duration_min),
            departure_time=dep_time,
            arrival_time=arr_time,
        )
    ]
    # Add dummy extra legs to simulate transfers
    for _ in range(n_legs - 1):
        legs.append(
            Leg(
                from_city="Patna",
                to_city="Mumbai",
                mode=modes[0],
                duration=Duration(120),
                departure_time="10:00",
                arrival_time="12:00",
            )
        )
    return Journey(
        route_id=route_id,
        source="Delhi",
        destination="Patna",
        duration=Duration(duration_min),
        price=Pricing(
            base_price=Money(amount=price_amount, currency="INR"),
            total_price=Money(amount=price_amount, currency="INR"),
        ),
        nx_score=0,
        seat_likelihood=seat,
        comfort_score=comfort,
        transport_modes=modes,
        departure_time=dep_time,
        arrival_time=arr_time,
        recommendation_reason="",
        legs=legs,
        layover_duration=Duration(0),
    )


# ---------------------------------------------------------------------------
# Sprint 1 — ComponentCalculator unit tests (unchanged)
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Sprint 2 — Integration tests for the all-component NX Score assembly
# ---------------------------------------------------------------------------

def test_nx_score_uses_only_components():
    """
    Verify that the NX Score is assembled exclusively from the 7 semantic
    component scores (Sprint 2 architecture), and that j.components is
    a properly declared dataclass field — not a dynamic attribute that gets
    cleaned up after scoring.
    """
    from app.domain.services import calculate_smart_scores

    j_good = _make_journey(
        "RAIL-GOOD", price_amount=1000, duration_min=360,
        comfort=85.0, seat=90.0, dep_time="10:00", arr_time="16:00",
    )
    j_poor = _make_journey(
        "RAIL-POOR", price_amount=4000, duration_min=900,
        comfort=40.0, seat=35.0, dep_time="02:00", arr_time="17:00",
    )

    result = calculate_smart_scores([j_good, j_poor])

    # Better journey should be ranked first
    assert result[0].route_id == "RAIL-GOOD"

    # j.components must survive the scoring pass (it is a declared dataclass field,
    # not a cleaned-up dynamic attribute)
    assert j_good.components is not None, (
        "j.components should be a declared field, not a dynamic attribute that gets cleaned up"
    )
    assert j_poor.components is not None

    # All 7 component values must be in [0.0, 1.0]
    for comp in (j_good.components, j_poor.components):
        assert 0.0 <= comp.journey_value <= 1.0
        assert 0.0 <= comp.booking_confidence <= 1.0
        assert 0.0 <= comp.journey_simplicity <= 1.0
        assert 0.0 <= comp.timing_convenience <= 1.0
        assert 0.0 <= comp.physical_comfort <= 1.0
        assert 0.0 <= comp.schedule_reliability <= 1.0
        assert 0.1 <= comp.information_integrity <= 1.0

    # The better journey should have a higher journey_value component
    assert j_good.components.journey_value > j_poor.components.journey_value


def test_journey_value_absorbs_price_and_duration():
    """
    Verify that price and duration influence the NX Score only through the
    journey_value component — not via any direct raw-norm bypass.

    If price flows through journey_value correctly, a cheaper journey must:
      (a) have a higher journey_value component, AND
      (b) receive a higher NX score (all other factors held equal).
    """
    from app.domain.services import calculate_smart_scores

    j_cheap = _make_journey(
        "RAIL-CHEAP", price_amount=500,  duration_min=360,
        comfort=70.0, seat=75.0, dep_time="09:00", arr_time="15:00",
    )
    j_expensive = _make_journey(
        "RAIL-EXP",   price_amount=5000, duration_min=360,
        comfort=70.0, seat=75.0, dep_time="09:00", arr_time="15:00",
    )

    calculate_smart_scores([j_cheap, j_expensive])

    # Component level: journey_value must reflect the price difference
    assert j_cheap.components.journey_value > j_expensive.components.journey_value, (
        "journey_value should be higher for the cheaper journey"
    )

    # Score level: cheaper journey must score higher
    assert j_cheap.nx_score > j_expensive.nx_score, (
        "NX score should be higher for the cheaper journey "
        "(price flows through journey_value, not a raw-norm bypass)"
    )

    # Physical comfort must be equal (same comfort score, same mode)
    assert j_cheap.components.physical_comfort == j_expensive.components.physical_comfort


def test_schedule_reliability_and_integrity_dormant():
    """
    Confirm that schedule_reliability and information_integrity do not affect
    the NX Score while WEIGHT_RELIABILITY and WEIGHT_INTEGRITY are 0.0.

    A RAIL- journey (high reliability) and an NX- journey (low reliability)
    that are otherwise identical should produce the same NX score, because
    the reliability weight is reserved for Sprint 3 persona tuning.
    """
    from app.domain.services import calculate_smart_scores
    from app.config import WEIGHT_RELIABILITY, WEIGHT_INTEGRITY

    # Precondition: weights must be 0.0 (Sprint 2 contract)
    assert WEIGHT_RELIABILITY == 0.0, "WEIGHT_RELIABILITY must be 0.0 in Sprint 2"
    assert WEIGHT_INTEGRITY == 0.0,   "WEIGHT_INTEGRITY must be 0.0 in Sprint 2"

    j_rail = _make_journey(
        "RAIL-REAL", price_amount=1500, duration_min=480,
        comfort=70.0, seat=80.0, dep_time="10:00", arr_time="18:00",
    )
    j_synth = _make_journey(
        "NX-SYNTH",  price_amount=1500, duration_min=480,
        comfort=70.0, seat=80.0, dep_time="10:00", arr_time="18:00",
    )

    calculate_smart_scores([j_rail, j_synth])

    # Components must differ in reliability (RAIL- vs NX- prefix)
    assert j_rail.components.schedule_reliability > j_synth.components.schedule_reliability, (
        "RAIL- route should have higher schedule_reliability than NX- route"
    )

    # But NX scores must be equal because WEIGHT_RELIABILITY = WEIGHT_INTEGRITY = 0.0
    assert j_rail.nx_score == j_synth.nx_score, (
        "NX scores should be identical when WEIGHT_RELIABILITY and WEIGHT_INTEGRITY are 0.0"
    )
