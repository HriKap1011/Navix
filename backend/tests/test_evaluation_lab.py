"""
tests/test_evaluation_lab.py
==============================
Phase 5 — Recommendation Evaluation Lab (Internal Only)

Test suite covering:
  1. EvaluationLab — scorecard generation and 7-component score breakdown
  2. JourneyComparator — ranking table, score distribution, and pairwise analysis
  3. TraceEngine — 5-step trace pipeline execution
  4. Invariance — scorecard.nx_score must match production calculate_smart_scores() output
"""

import pytest
from app.domain.journey import Journey
from app.domain.leg import Leg, Duration
from app.domain.pricing import Money, Pricing
from app.domain.availability import SeatAvailability
from app.domain.components import NormalizationRanges

from app.evaluation import EvaluationLab, JourneyComparator, TraceEngine
from app.evaluation.models import (
    RecommendationScorecard,
    ComparisonResult,
    RecommendationTrace,
    ComponentDetail,
)


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def _make_journey(
    route_id: str,
    price: float = 1500.0,
    duration: int = 480,
    comfort: float = 70.0,
    seat: float = 80.0,
    dep_time: str = "10:00",
    arr_time: str = "18:00",
    modes: list = None,
    n_legs: int = 1,
    waitlist_code: str = "AVL",
    confirmation_probability: float = 90.0,
) -> Journey:
    """Build a minimal Journey with SeatAvailability for evaluation tests."""
    modes = modes or ["Train"]
    legs = [
        Leg(
            from_city="Delhi",
            to_city="Mumbai",
            mode=modes[0],
            duration=Duration(duration),
            departure_time=dep_time,
            arrival_time=arr_time,
        )
    ]
    for _ in range(n_legs - 1):
        legs.append(
            Leg(
                from_city="Mumbai",
                to_city="Pune",
                mode=modes[-1] if len(modes) > 1 else modes[0],
                duration=Duration(120),
                departure_time="20:00",
                arrival_time="22:00",
            )
        )
    j = Journey(
        route_id=route_id,
        source="Delhi",
        destination="Mumbai",
        duration=Duration(duration),
        price=Pricing(
            base_price=Money(amount=price, currency="INR"),
            total_price=Money(amount=price, currency="INR"),
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
    j.availability = SeatAvailability(
        likelihood=seat,
        waitlist_code=waitlist_code,
        confirmation_probability=confirmation_probability,
    )
    return j


def _make_cohort():
    """Three journeys with clearly differentiated quality for comparison tests."""
    good = _make_journey(
        "RAIL-GOOD", price=800.0, duration=300, comfort=90.0, seat=95.0,
        dep_time="08:00", arr_time="13:00",
    )
    average = _make_journey(
        "RAIL-AVG", price=1500.0, duration=480, comfort=65.0, seat=70.0,
        dep_time="12:00", arr_time="20:00",
    )
    poor = _make_journey(
        "NX-POOR", price=4000.0, duration=900, comfort=35.0, seat=30.0,
        dep_time="01:00", arr_time="16:00",   # very early departure penalty
    )
    return [good, average, poor]


# ===========================================================================
# 1. EvaluationLab — Scorecard generation
# ===========================================================================

class TestEvaluationLab:

    def test_evaluate_returns_scorecards_for_all_journeys(self):
        """EvaluationLab.evaluate() should return one scorecard per journey."""
        journeys = _make_cohort()
        lab = EvaluationLab()
        scorecards = lab.evaluate(journeys)

        assert len(scorecards) == 3
        assert all(isinstance(sc, RecommendationScorecard) for sc in scorecards)

    def test_scorecards_are_ranked_by_nx_score(self):
        """Scorecards must be sorted by NX Score descending (rank 1 = best)."""
        lab = EvaluationLab()
        scorecards = lab.evaluate(_make_cohort())

        for i in range(len(scorecards) - 1):
            assert scorecards[i].nx_score >= scorecards[i + 1].nx_score, (
                f"Scorecard at index {i} has lower score than {i + 1}: "
                f"{scorecards[i].nx_score} vs {scorecards[i + 1].nx_score}"
            )

    def test_ranking_position_is_correct(self):
        """ranking_position must be 1-based and sequential."""
        lab = EvaluationLab()
        scorecards = lab.evaluate(_make_cohort())

        for i, sc in enumerate(scorecards):
            assert sc.ranking_position == i + 1, (
                f"Expected ranking_position={i + 1}, got {sc.ranking_position}"
            )

    def test_scorecard_has_seven_components(self):
        """Every scorecard must expose exactly 7 component detail entries."""
        lab = EvaluationLab()
        scorecards = lab.evaluate(_make_cohort())

        expected_names = {
            "Journey Value",
            "Booking Confidence",
            "Journey Simplicity",
            "Timing Convenience",
            "Physical Comfort",
            "Schedule Reliability",
            "Information Integrity",
        }
        for sc in scorecards:
            assert len(sc.component_breakdown) == 7
            actual_names = {c.name for c in sc.component_breakdown}
            assert actual_names == expected_names, (
                f"Component names mismatch for {sc.route_id}: {actual_names}"
            )

    def test_all_normalized_values_in_range(self):
        """All normalized component values must be in [0.0, 1.0]."""
        lab = EvaluationLab()
        scorecards = lab.evaluate(_make_cohort())

        for sc in scorecards:
            for c in sc.component_breakdown:
                assert 0.0 <= c.normalized_value <= 1.0, (
                    f"{sc.route_id} / {c.name}: normalized_value={c.normalized_value} out of range"
                )

    def test_component_status_labels_are_valid(self):
        """Component status must be 'strong', 'average', or 'weak'."""
        lab = EvaluationLab()
        scorecards = lab.evaluate(_make_cohort())
        valid_statuses = {"strong", "average", "weak"}
        for sc in scorecards:
            for c in sc.component_breakdown:
                assert c.status in valid_statuses, (
                    f"{sc.route_id} / {c.name}: invalid status '{c.status}'"
                )

    def test_best_journey_is_rank_one(self):
        """The cheapest/fastest/best-comfort journey must be ranked #1."""
        lab = EvaluationLab()
        scorecards = lab.evaluate(_make_cohort())

        rank_1 = scorecards[0]
        assert rank_1.route_id == "RAIL-GOOD", (
            f"Expected RAIL-GOOD at rank 1, got {rank_1.route_id}"
        )

    def test_rank_one_has_no_delta_vs_top(self):
        """The rank-1 journey must have delta_vs_top == None."""
        lab = EvaluationLab()
        scorecards = lab.evaluate(_make_cohort())
        assert scorecards[0].delta_vs_top is None

    def test_lower_ranked_journeys_have_positive_delta(self):
        """Journeys below rank 1 must have delta_vs_top >= 0."""
        lab = EvaluationLab()
        scorecards = lab.evaluate(_make_cohort())
        for sc in scorecards[1:]:
            assert sc.delta_vs_top is not None
            assert sc.delta_vs_top >= 0, (
                f"{sc.route_id}: delta_vs_top={sc.delta_vs_top} should be >= 0"
            )

    def test_normalization_details_populated(self):
        """NormalizationDetails must contain non-zero cohort_size."""
        lab = EvaluationLab()
        scorecards = lab.evaluate(_make_cohort())
        for sc in scorecards:
            nd = sc.normalization_details
            assert nd.cohort_size == 3
            assert nd.min_price <= nd.max_price
            assert nd.min_duration <= nd.max_duration

    def test_penalties_list_is_populated(self):
        """Every scorecard must carry a non-empty list of PenaltyDetails."""
        lab = EvaluationLab()
        scorecards = lab.evaluate(_make_cohort())
        for sc in scorecards:
            assert len(sc.penalties_applied) > 0

    def test_bonuses_list_is_populated(self):
        """Every scorecard must carry a non-empty list of BonusDetails."""
        lab = EvaluationLab()
        scorecards = lab.evaluate(_make_cohort())
        for sc in scorecards:
            assert len(sc.bonuses_applied) > 0

    def test_evaluate_empty_list_returns_empty(self):
        """EvaluationLab.evaluate([]) must return an empty list without error."""
        lab = EvaluationLab()
        result = lab.evaluate([])
        assert result == []


# ===========================================================================
# 2. Mathematical Invariance — scorecard.nx_score == production nx_score
# ===========================================================================

class TestInvariance:

    def test_scorecard_nx_score_matches_production(self):
        """
        Core invariance test: scorecard.nx_score must equal journey.nx_score
        produced by the production calculate_smart_scores() engine.

        This verifies that EvaluationLab is a transparent read-only wrapper —
        it never alters the scores, only exposes their audit trail.
        """
        from app.domain.services import calculate_smart_scores

        journeys = _make_cohort()

        # Score via production engine first
        scored = calculate_smart_scores(list(journeys))
        production_scores = {j.route_id: j.nx_score for j in scored}

        # Score via EvaluationLab (using evaluate_scored to avoid double-scoring)
        lab = EvaluationLab()
        scorecards = lab.evaluate_scored(scored)
        lab_scores = {sc.route_id: sc.nx_score for sc in scorecards}

        for route_id, prod_score in production_scores.items():
            assert route_id in lab_scores, f"Scorecard missing for {route_id}"
            assert lab_scores[route_id] == prod_score, (
                f"Score mismatch for {route_id}: "
                f"production={prod_score}, scorecard={lab_scores[route_id]}"
            )

    def test_weighted_contributions_sum_matches_gross_score(self):
        """
        The sum of weighted_contribution_pts across all 7 components must
        approximately equal the gross score (before incomplete penalty deduction).
        """
        lab = EvaluationLab()
        # Use a clean journey with no incomplete penalty
        j = _make_journey("RAIL-CLEAN", price=1200.0, duration=360, comfort=80.0, seat=85.0)
        scorecards = lab.evaluate([j])
        sc = scorecards[0]

        total_contrib = sum(c.weighted_contribution_pts for c in sc.component_breakdown)
        gross_rounded = int(round(total_contrib))
        expected_nx = max(0, min(100, gross_rounded - sc.total_incomplete_penalty))

        assert abs(expected_nx - sc.nx_score) <= 1, (
            f"Weighted sum {total_contrib:.2f} → expected nx_score ≈ {expected_nx}, "
            f"got {sc.nx_score}"
        )

    def test_components_good_journey_outscores_poor(self):
        """
        A high-quality journey must score higher than a low-quality one
        on journey_value, booking_confidence, and timing_convenience.
        """
        lab = EvaluationLab()
        good = _make_journey("RAIL-A", price=500.0, duration=240, comfort=90.0, seat=95.0,
                              dep_time="09:00", arr_time="13:00")
        poor = _make_journey("RAIL-B", price=5000.0, duration=1200, comfort=25.0, seat=20.0,
                              dep_time="02:00", arr_time="22:00")
        scorecards = lab.evaluate([good, poor])

        sc_good = next(sc for sc in scorecards if sc.route_id == "RAIL-A")
        sc_poor = next(sc for sc in scorecards if sc.route_id == "RAIL-B")

        def _get(sc, name):
            return next(c.normalized_value for c in sc.component_breakdown if c.name == name)

        assert _get(sc_good, "Journey Value") > _get(sc_poor, "Journey Value")
        assert _get(sc_good, "Booking Confidence") > _get(sc_poor, "Booking Confidence")
        assert sc_good.nx_score > sc_poor.nx_score


# ===========================================================================
# 3. JourneyComparator
# ===========================================================================

class TestJourneyComparator:

    def _get_scorecards(self):
        lab = EvaluationLab()
        return lab.evaluate(_make_cohort())

    def test_compare_returns_comparison_result(self):
        """JourneyComparator.compare() must return a ComparisonResult."""
        comparator = JourneyComparator()
        result = comparator.compare(self._get_scorecards())
        assert isinstance(result, ComparisonResult)

    def test_ranking_table_length_matches_cohort(self):
        """Ranking table must have one entry per journey."""
        comparator = JourneyComparator()
        result = comparator.compare(self._get_scorecards())
        assert len(result.ranking_table) == 3

    def test_ranking_table_sorted_by_score(self):
        """Ranking table must be sorted by nx_score descending."""
        comparator = JourneyComparator()
        result = comparator.compare(self._get_scorecards())
        scores = [row["nx_score"] for row in result.ranking_table]
        assert scores == sorted(scores, reverse=True), (
            f"Ranking table not sorted: {scores}"
        )

    def test_ranking_table_required_fields(self):
        """Each ranking table row must include all required fields."""
        comparator = JourneyComparator()
        result = comparator.compare(self._get_scorecards())
        required = {"rank", "route_id", "nx_score", "transport_modes", "price_inr", "duration_min"}
        for row in result.ranking_table:
            missing = required - set(row.keys())
            assert not missing, f"Ranking table row missing fields: {missing}"

    def test_score_distribution_min_le_max(self):
        """min_score must be <= max_score in the distribution."""
        comparator = JourneyComparator()
        result = comparator.compare(self._get_scorecards())
        dist = result.score_distribution
        assert dist.min_score <= dist.max_score
        assert dist.cohort_size == 3

    def test_score_distribution_mean_in_range(self):
        """Mean score must be between min and max."""
        comparator = JourneyComparator()
        result = comparator.compare(self._get_scorecards())
        dist = result.score_distribution
        assert dist.min_score <= dist.mean_score <= dist.max_score

    def test_strongest_strengths_keys_match_routes(self):
        """strongest_strengths must have one key per route_id."""
        scorecards = self._get_scorecards()
        comparator = JourneyComparator()
        result = comparator.compare(scorecards)

        expected_routes = {sc.route_id for sc in scorecards}
        assert set(result.strongest_strengths.keys()) == expected_routes

    def test_weakest_components_keys_match_routes(self):
        """weakest_components must have one key per route_id."""
        scorecards = self._get_scorecards()
        comparator = JourneyComparator()
        result = comparator.compare(scorecards)

        expected_routes = {sc.route_id for sc in scorecards}
        assert set(result.weakest_components.keys()) == expected_routes

    def test_pairwise_analysis_count(self):
        """Pairwise analysis must have (n - 1) comparisons for n journeys."""
        scorecards = self._get_scorecards()
        comparator = JourneyComparator()
        result = comparator.compare(scorecards)
        assert len(result.pairwise_analysis) == len(scorecards) - 1

    def test_pairwise_score_delta_positive(self):
        """Each pairwise comparison (rank N vs N+1) must have a positive or zero score_delta."""
        scorecards = self._get_scorecards()
        comparator = JourneyComparator()
        result = comparator.compare(scorecards)
        for pa in result.pairwise_analysis:
            assert pa.score_delta >= 0, (
                f"Pairwise {pa.journey_a_route_id} vs {pa.journey_b_route_id}: "
                f"score_delta={pa.score_delta} should be >= 0"
            )

    def test_pairwise_component_deltas_cover_all_seven(self):
        """Each pairwise analysis must include deltas for all 7 component names."""
        scorecards = self._get_scorecards()
        comparator = JourneyComparator()
        result = comparator.compare(scorecards)
        expected_components = {
            "Journey Value", "Booking Confidence", "Journey Simplicity",
            "Timing Convenience", "Physical Comfort",
            "Schedule Reliability", "Information Integrity",
        }
        for pa in result.pairwise_analysis:
            assert set(pa.component_deltas.keys()) == expected_components, (
                f"Missing components in pairwise analysis for "
                f"{pa.journey_a_route_id} vs {pa.journey_b_route_id}"
            )

    def test_compare_empty_scorecards_returns_empty_result(self):
        """JourneyComparator.compare([]) must return an empty result without error."""
        comparator = JourneyComparator()
        result = comparator.compare([])
        assert result.ranking_table == []
        assert result.score_distribution.cohort_size == 0


# ===========================================================================
# 4. TraceEngine — 5-step pipeline
# ===========================================================================

class TestTraceEngine:

    def _get_trace(self, journey=None):
        """Build a trace for a single journey after scoring it in a 3-journey cohort."""
        from app.domain.services import calculate_smart_scores
        from app.evaluation.evaluator import EvaluationLab

        journeys = _make_cohort() if journey is None else [journey] + _make_cohort()[:2]

        lab = EvaluationLab()
        lab.evaluate(journeys)  # scores journeys in-place

        sanitized_data = lab._sanitize_all(journeys)
        prices    = [s["price"] for s in sanitized_data]
        durations = [s["duration"] for s in sanitized_data]
        transfers = [s["transfers"] for s in sanitized_data]
        comforts  = [s["comfort"] for s in sanitized_data]
        seats     = [s["seat"] for s in sanitized_data]
        frictions = [s["friction"] for s in sanitized_data]

        from app.domain.components import NormalizationRanges
        ranges = NormalizationRanges(
            min_price=min(prices),       max_price=max(prices),
            min_duration=min(durations), max_duration=max(durations),
            min_transfers=min(transfers),max_transfers=max(transfers),
            min_comfort=min(comforts),   max_comfort=max(comforts),
            min_seat=min(seats),         max_seat=max(seats),
            min_friction=min(frictions), max_friction=max(frictions),
        )

        target = journeys[0]
        target_san = sanitized_data[0]

        engine = TraceEngine()
        return engine.trace(target, target_san, ranges)

    def test_trace_returns_recommendation_trace(self):
        """TraceEngine.trace() must return a RecommendationTrace object."""
        trace = self._get_trace()
        assert isinstance(trace, RecommendationTrace)

    def test_trace_has_five_steps(self):
        """Trace must expose all 5 steps as named attributes."""
        trace = self._get_trace()
        assert trace.step1_raw_data.step_number == 1
        assert trace.step2_normalization.step_number == 2
        assert trace.step3_penalties_bonuses.step_number == 3
        assert trace.step4_weighted_contributions.step_number == 4
        assert trace.step5_final_score.step_number == 5

    def test_step1_outputs_raw_metrics(self):
        """Step 1 must expose raw_price_inr, raw_duration_min, raw_comfort_score."""
        trace = self._get_trace()
        outputs = trace.step1_raw_data.outputs
        assert "raw_price_inr" in outputs
        assert "raw_duration_min" in outputs
        assert "raw_comfort_score" in outputs
        assert "raw_seat_likelihood" in outputs
        assert "incomplete_penalty" in outputs

    def test_step2_outputs_normalized_scalars(self):
        """Step 2 must expose all intermediate normalized scalars."""
        trace = self._get_trace()
        scalars = trace.step2_normalization.outputs.get("intermediate_normalized_scalars", {})
        assert any("p_norm" in k for k in scalars)
        assert any("d_norm" in k for k in scalars)
        assert any("c_norm" in k for k in scalars)
        assert any("s_norm" in k for k in scalars)
        assert any("f_norm" in k for k in scalars)

    def test_step2_outputs_seven_component_scores(self):
        """Step 2 must expose all 7 component scores."""
        trace = self._get_trace()
        component_scores = trace.step2_normalization.outputs.get("seven_component_scores", {})
        expected = {
            "journey_value", "booking_confidence", "journey_simplicity",
            "timing_convenience", "physical_comfort", "schedule_reliability",
            "information_integrity",
        }
        assert set(component_scores.keys()) == expected

    def test_step4_outputs_per_component_contributions(self):
        """Step 4 must expose per-component weighted contributions."""
        trace = self._get_trace()
        contribs = trace.step4_weighted_contributions.outputs.get("per_component_contributions", {})
        assert len(contribs) == 7
        for name, detail in contribs.items():
            assert "contribution_pts" in detail
            assert "formula" in detail

    def test_step5_final_score_matches_trace_nx_score(self):
        """Step 5 final_nx_score output must match trace.final_nx_score."""
        trace = self._get_trace()
        step5_output = trace.step5_final_score.outputs
        assert "final_nx_score" in step5_output
        assert step5_output["final_nx_score"] == trace.final_nx_score

    def test_trace_nx_score_matches_journey_nx_score(self):
        """trace.final_nx_score must equal the journey.nx_score from production scoring."""
        from app.domain.services import calculate_smart_scores
        from app.evaluation.evaluator import EvaluationLab

        journeys = _make_cohort()
        lab = EvaluationLab()
        lab.evaluate(journeys)  # scores in-place

        san = lab._sanitize_all(journeys)
        prices    = [s["price"] for s in san]
        durations = [s["duration"] for s in san]
        transfers = [s["transfers"] for s in san]
        comforts  = [s["comfort"] for s in san]
        seats     = [s["seat"] for s in san]
        frictions = [s["friction"] for s in san]

        from app.domain.components import NormalizationRanges
        ranges = NormalizationRanges(
            min_price=min(prices),       max_price=max(prices),
            min_duration=min(durations), max_duration=max(durations),
            min_transfers=min(transfers),max_transfers=max(transfers),
            min_comfort=min(comforts),   max_comfort=max(comforts),
            min_seat=min(seats),         max_seat=max(seats),
            min_friction=min(frictions), max_friction=max(frictions),
        )

        engine = TraceEngine()
        for j, s in zip(journeys, san):
            trace = engine.trace(j, s, ranges)
            assert abs(trace.final_nx_score - j.nx_score) <= 1, (
                f"{j.route_id}: trace.final_nx_score={trace.final_nx_score}, "
                f"journey.nx_score={j.nx_score}"
            )

    def test_trace_summary_is_non_empty(self):
        """trace.summary must be a non-empty string."""
        trace = self._get_trace()
        assert isinstance(trace.summary, str)
        assert len(trace.summary) > 10

    def test_trace_has_notes(self):
        """Key steps must include explanatory notes."""
        trace = self._get_trace()
        assert len(trace.step2_normalization.notes) > 0
        assert len(trace.step4_weighted_contributions.notes) > 0


# ===========================================================================
# 5. Waitlist penalty integration test
# ===========================================================================

class TestWaitlistPenalty:

    def test_waitlist_journey_has_wl_penalty_applied(self):
        """A journey with WL waitlist code must have the waitlist penalty marked as applied."""
        wl_journey = _make_journey(
            "RAIL-WL", price=1000.0, duration=480, comfort=70.0, seat=40.0,
            waitlist_code="WL/RAC",
        )
        clean_journey = _make_journey(
            "RAIL-OK", price=1000.0, duration=480, comfort=70.0, seat=80.0,
            waitlist_code="AVL",
        )

        lab = EvaluationLab()
        scorecards = lab.evaluate([wl_journey, clean_journey])

        sc_wl = next(sc for sc in scorecards if sc.route_id == "RAIL-WL")
        sc_ok = next(sc for sc in scorecards if sc.route_id == "RAIL-OK")

        wl_penalty = next(
            (p for p in sc_wl.penalties_applied if p.category == "waitlist"), None
        )
        assert wl_penalty is not None
        assert wl_penalty.applied is True, "WL penalty must be marked as applied for WL/RAC code"

        ok_penalty = next(
            (p for p in sc_ok.penalties_applied if p.category == "waitlist"), None
        )
        assert ok_penalty is not None
        assert ok_penalty.applied is False, "Waitlist penalty must NOT be applied for AVL status"

    def test_waitlist_journey_has_lower_booking_confidence(self):
        """A WL/RAC journey must have a lower Booking Confidence than an AVL journey."""
        wl_journey = _make_journey("RAIL-WL2", seat=40.0, waitlist_code="WL12")
        avl_journey = _make_journey("RAIL-AVL2", seat=80.0, waitlist_code="AVL")

        lab = EvaluationLab()
        scorecards = lab.evaluate([wl_journey, avl_journey])

        def _bc(sc):
            return next(c.normalized_value for c in sc.component_breakdown if c.name == "Booking Confidence")

        sc_wl  = next(sc for sc in scorecards if sc.route_id == "RAIL-WL2")
        sc_avl = next(sc for sc in scorecards if sc.route_id == "RAIL-AVL2")

        assert _bc(sc_wl) < _bc(sc_avl), (
            f"WL journey booking_confidence={_bc(sc_wl):.4f} should be < "
            f"AVL journey booking_confidence={_bc(sc_avl):.4f}"
        )
