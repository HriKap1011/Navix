"""
app/evaluation/evaluator.py
============================
Phase 5 — Recommendation Evaluation Lab (Internal Only)

EvaluationLab: Wraps the production scoring pipeline to extract full
per-journey audit detail without changing any production scores.

Design guarantees:
  - Calls calculate_smart_scores() exactly once on the input journeys.
  - Reads component values, weights, and penalties AFTER scoring completes.
  - Never modifies a Journey object beyond what calculate_smart_scores() does.
  - Mathematical identity: scorecard.nx_score == journey.nx_score (always).
"""

from __future__ import annotations

import statistics
from typing import List, Optional

from app.domain.journey import Journey
from app.domain.services import calculate_smart_scores, calculate_friction_penalty
from app.domain.components import (
    ComponentCalculator,
    NormalizationRanges,
    normalize,
)
from app.config import (
    WEIGHT_PRICE,
    WEIGHT_DURATION,
    WEIGHT_SEAT,
    WEIGHT_AVAILABILITY,
    WEIGHT_TRANSFERS,
    WEIGHT_FRICTION,
    WEIGHT_COMFORT,
    WEIGHT_RELIABILITY,
    WEIGHT_INTEGRITY,
)
from app.evaluation.models import (
    RecommendationScorecard,
    ComponentDetail,
    PenaltyDetail,
    BonusDetail,
    NormalizationDetails,
)


# ---------------------------------------------------------------------------
# Weight mapping: config weights → semantic component names
# (mirrors the assembly logic in services.py, Step C)
# ---------------------------------------------------------------------------
_COMPONENT_WEIGHT_MAP = {
    "Journey Value":        WEIGHT_PRICE + WEIGHT_DURATION,
    "Booking Confidence":   WEIGHT_SEAT + WEIGHT_AVAILABILITY,
    "Journey Simplicity":   WEIGHT_TRANSFERS,
    "Timing Convenience":   WEIGHT_FRICTION,
    "Physical Comfort":     WEIGHT_COMFORT,
    "Schedule Reliability": WEIGHT_RELIABILITY,
    "Information Integrity": WEIGHT_INTEGRITY,
}

_COMPONENT_ORDER = list(_COMPONENT_WEIGHT_MAP.keys())


def _status(normalized: float) -> str:
    if normalized >= 0.75:
        return "strong"
    if normalized >= 0.50:
        return "average"
    return "weak"


def _raw_label(component_name: str, journey: Journey, sanitized: dict) -> tuple:
    """Return (raw_value, raw_label) for each component."""
    if component_name == "Journey Value":
        return (sanitized["price"], f"INR {int(sanitized['price']):,}  |  {sanitized['duration']} min")
    if component_name == "Booking Confidence":
        return (sanitized["seat"], f"Seat likelihood: {sanitized['seat']:.0f}%")
    if component_name == "Journey Simplicity":
        t = sanitized["transfers"]
        return (t, f"{t} transfer{'s' if t != 1 else ''}")
    if component_name == "Timing Convenience":
        return (sanitized["friction"], f"Friction score: {sanitized['friction']:.0f}/100")
    if component_name == "Physical Comfort":
        return (sanitized["comfort"], f"Comfort score: {sanitized['comfort']:.0f}/100")
    if component_name == "Schedule Reliability":
        prefix = "RAIL" if journey.route_id.startswith("RAIL-") else ("NX" if journey.route_id.startswith("NX-") else "OTHER")
        return (0.0, f"Route type: {prefix}  |  modes: {', '.join(journey.transport_modes)}")
    if component_name == "Information Integrity":
        return (sanitized["incomplete_penalty"], f"Incomplete data penalty: {sanitized['incomplete_penalty']} pts")
    return (0.0, "")


def _build_penalties(journey: Journey, sanitized: dict) -> List[PenaltyDetail]:
    """Build the full penalty detail list for one journey."""
    penalties = []

    # -- Incomplete data penalties (mirrors services.py sanitization logic) --
    has_missing_time = (
        getattr(journey, "_missing_time", False)
        or journey.departure_time in ("--:--", "", None)
        or journey.arrival_time in ("--:--", "", None)
    )
    penalties.append(PenaltyDetail(
        name="Missing Timing",
        category="incomplete_data",
        value=15,
        description="Departure or arrival time is missing or placeholder",
        applied=has_missing_time,
    ))

    no_price = not (journey.price and journey.price.total_price
                    and journey.price.total_price.amount
                    and journey.price.total_price.amount > 0)
    penalties.append(PenaltyDetail(
        name="Missing/Zero Price",
        category="incomplete_data",
        value=15,
        description="Price is absent or zero — conservative fallback applied",
        applied=no_price,
    ))

    no_duration = not (journey.duration and journey.duration.minutes
                       and journey.duration.minutes > 0)
    penalties.append(PenaltyDetail(
        name="Missing Duration",
        category="incomplete_data",
        value=15,
        description="Duration is absent or zero — conservative fallback applied",
        applied=no_duration,
    ))

    no_comfort = journey.comfort_score is None
    penalties.append(PenaltyDetail(
        name="Missing Comfort Score",
        category="incomplete_data",
        value=10,
        description="Comfort score not available for this journey",
        applied=no_comfort,
    ))

    no_seat = journey.seat_likelihood is None
    penalties.append(PenaltyDetail(
        name="Missing Seat Likelihood",
        category="incomplete_data",
        value=10,
        description="Seat likelihood not available for this journey",
        applied=no_seat,
    ))

    # -- Friction penalties (derived from calculate_friction_penalty output) --
    raw_friction_penalty = 100 - sanitized["friction"]
    layover = journey.layover_duration.minutes if journey.layover_duration else 0
    long_layover = layover > 180
    medium_layover = 90 < layover <= 180
    short_layover = 0 < layover < 40
    penalties.append(PenaltyDetail(
        name="Long Layover (>180 min)",
        category="timing_friction",
        value=25,
        description=f"Layover duration {layover} min exceeds 180 min threshold",
        applied=long_layover,
    ))
    penalties.append(PenaltyDetail(
        name="Medium Layover (90–180 min)",
        category="timing_friction",
        value=15,
        description=f"Layover duration {layover} min",
        applied=medium_layover,
    ))
    penalties.append(PenaltyDetail(
        name="Short Layover (<40 min)",
        category="timing_friction",
        value=10,
        description=f"Layover duration {layover} min is uncomfortably short",
        applied=short_layover,
    ))

    try:
        dep_h = int(journey.departure_time.split(":")[0]) if journey.departure_time else 12
        arr_h = int(journey.arrival_time.split(":")[0]) if journey.arrival_time else 12
    except Exception:
        dep_h, arr_h = 12, 12

    penalties.append(PenaltyDetail(
        name="Very Early Departure (<06:00)",
        category="timing_friction",
        value=12,
        description=f"Departure at {journey.departure_time}",
        applied=dep_h < 6,
    ))
    penalties.append(PenaltyDetail(
        name="Late Night Arrival (≥23:00 or <04:00)",
        category="timing_friction",
        value=12,
        description=f"Arrival at {journey.arrival_time}",
        applied=(arr_h >= 23 or arr_h < 4),
    ))

    # -- Waitlist penalty --
    avail = journey.availability
    is_wl = False
    if avail:
        wl = avail.waitlist_code or ""
        is_wl = wl.upper().startswith("WL") or wl.upper().startswith("RAC")
    penalties.append(PenaltyDetail(
        name="Waitlist / RAC Status",
        category="waitlist",
        value=15,
        description=f"Waitlist code: {avail.waitlist_code if avail else 'N/A'}",
        applied=is_wl,
    ))

    return penalties


def _build_bonuses(journey: Journey, s_norm: float) -> List[BonusDetail]:
    """Build bonus detail list for one journey."""
    bonuses = []

    avail = journey.availability
    conf_applied = False
    conf_value = 0.0
    if avail and avail.confirmation_probability is not None:
        conf_prob = float(avail.confirmation_probability)
        conf_value = (conf_prob / 100.0) * 0.20
        conf_applied = True
    bonuses.append(BonusDetail(
        name="Confirmation Probability Bonus",
        category="confirmation_probability",
        value=conf_value,
        description=(
            f"Confirmation probability: {avail.confirmation_probability:.0f}%  →  +{conf_value:.3f} to booking_confidence"
            if conf_applied
            else "No confirmation probability data available"
        ),
        applied=conf_applied,
    ))

    mode_scores = {"Flight": 0.90, "Train": 0.70, "Sleeper Bus": 0.60, "Bus": 0.40}
    modes = journey.transport_modes or []
    if modes:
        cat_vals = [mode_scores.get(m, 0.50) for m in modes]
        product = 1.0
        for v in cat_vals:
            product *= v
        cat_bonus = product ** (1.0 / len(cat_vals))
    else:
        cat_bonus = 0.50
    bonuses.append(BonusDetail(
        name="Mode Comfort Bonus",
        category="mode_comfort",
        value=cat_bonus * 0.25,
        description=(
            f"Transport mode(s): {', '.join(modes)}  →  mode bonus {cat_bonus:.3f}  ×  0.25 weight"
            if modes
            else "No transport modes — using default 0.50"
        ),
        applied=True,
    ))

    return bonuses


class EvaluationLab:
    """
    Internal evaluation framework that wraps production scoring to produce
    detailed per-journey RecommendationScorecards.

    Usage:
        lab = EvaluationLab()
        scorecards = lab.evaluate(journeys)   # journeys must NOT yet be scored
    
    Alternatively, pass already-scored journeys:
        scorecards = lab.evaluate_scored(scored_journeys)
    """

    def evaluate(self, journeys: List[Journey]) -> List[RecommendationScorecard]:
        """
        Score the journeys using the production engine, then build scorecards.

        IMPORTANT: This calls calculate_smart_scores() on the input list.
        Pass un-scored Journey objects to avoid double-scoring.
        """
        if not journeys:
            return []
        scored = calculate_smart_scores(journeys)
        return self._build_scorecards(scored)

    def evaluate_scored(self, scored_journeys: List[Journey]) -> List[RecommendationScorecard]:
        """
        Build scorecards from journeys that have ALREADY been through
        calculate_smart_scores(). Does NOT re-score.
        """
        if not scored_journeys:
            return []
        return self._build_scorecards(scored_journeys)

    # -----------------------------------------------------------------------
    # Internal: build scorecards
    # -----------------------------------------------------------------------

    def _build_scorecards(self, scored: List[Journey]) -> List[RecommendationScorecard]:
        """
        Build RecommendationScorecards from a list of already-scored journeys.

        We re-derive all intermediate values (sanitization, normalization)
        so the scorecard is self-contained and fully auditable — the production
        journey object is only read, never mutated here.
        """
        # Step 1: Re-sanitize (mirrors services.py logic exactly)
        sanitized_data = self._sanitize_all(scored)

        # Step 2: Re-build normalization ranges
        prices    = [s["price"] for s in sanitized_data]
        durations = [s["duration"] for s in sanitized_data]
        transfers = [s["transfers"] for s in sanitized_data]
        comforts  = [s["comfort"] for s in sanitized_data]
        seats     = [s["seat"] for s in sanitized_data]
        frictions = [s["friction"] for s in sanitized_data]

        ranges = NormalizationRanges(
            min_price=min(prices),      max_price=max(prices),
            min_duration=min(durations), max_duration=max(durations),
            min_transfers=min(transfers),max_transfers=max(transfers),
            min_comfort=min(comforts),   max_comfort=max(comforts),
            min_seat=min(seats),         max_seat=max(seats),
            min_friction=min(frictions), max_friction=max(frictions),
        )
        norm_details = NormalizationDetails(
            min_price=ranges.min_price,      max_price=ranges.max_price,
            min_duration=ranges.min_duration,max_duration=ranges.max_duration,
            min_transfers=ranges.min_transfers,max_transfers=ranges.max_transfers,
            min_comfort=ranges.min_comfort,  max_comfort=ranges.max_comfort,
            min_seat=ranges.min_seat,        max_seat=ranges.max_seat,
            min_friction=ranges.min_friction,max_friction=ranges.max_friction,
            cohort_size=len(scored),
        )

        # Step 3: Rank by nx_score (descending)
        ranked = sorted(scored, key=lambda j: j.nx_score, reverse=True)
        rank_map = {j.route_id: idx + 1 for idx, j in enumerate(ranked)}
        top_score = ranked[0].nx_score if ranked else 0

        # Step 4: Build per-journey scorecards
        scorecards = []
        sanitized_map = {s["journey"].route_id: s for s in sanitized_data}

        for j in ranked:
            s = sanitized_map[j.route_id]
            card = self._build_one_scorecard(j, s, ranges, norm_details, rank_map, top_score)
            scorecards.append(card)

        return scorecards

    def _sanitize_all(self, journeys: List[Journey]) -> list:
        """Re-derive sanitized metrics for each journey (read-only)."""
        result = []
        for j in journeys:
            incomplete_penalty = 0

            has_missing_time = (
                getattr(j, "_missing_time", False)
                or not j.departure_time
                or j.departure_time in ("--:--",)
                or not j.arrival_time
                or j.arrival_time in ("--:--",)
            )
            if has_missing_time:
                incomplete_penalty += 15

            price = 0.0
            if j.price and j.price.total_price and j.price.total_price.amount is not None:
                price = float(j.price.total_price.amount)
            if price <= 0.0:
                price = 10000.0
                incomplete_penalty += 15

            duration = 0
            if j.duration and j.duration.minutes is not None:
                duration = int(j.duration.minutes)
            if duration <= 0:
                duration = 1440
                incomplete_penalty += 15

            comfort = 50.0
            if j.comfort_score is not None:
                comfort = float(j.comfort_score)
            else:
                incomplete_penalty += 10
            if comfort <= 0.0:
                comfort = 30.0

            seat = 50.0
            if j.seat_likelihood is not None:
                seat = float(j.seat_likelihood)
            else:
                incomplete_penalty += 10
            if seat <= 0.0:
                seat = 20.0

            raw_friction = calculate_friction_penalty(j)
            friction_score = 100 - raw_friction

            result.append({
                "journey": j,
                "price": price,
                "duration": duration,
                "comfort": comfort,
                "seat": seat,
                "friction": friction_score,
                "transfers": len(j.legs) - 1,
                "incomplete_penalty": incomplete_penalty,
            })
        return result

    def _build_one_scorecard(
        self,
        journey: Journey,
        sanitized: dict,
        ranges: NormalizationRanges,
        norm_details: NormalizationDetails,
        rank_map: dict,
        top_score: int,
    ) -> RecommendationScorecard:
        """Build one RecommendationScorecard for a single scored Journey."""

        comp = journey.components
        if comp is None:
            # Fallback: re-compute components if journey was not scored by us
            comp = ComponentCalculator.compute(journey, sanitized, ranges)

        # Map component objects to their normalized scores
        comp_values = {
            "Journey Value":        comp.journey_value,
            "Booking Confidence":   comp.booking_confidence,
            "Journey Simplicity":   comp.journey_simplicity,
            "Timing Convenience":   comp.timing_convenience,
            "Physical Comfort":     comp.physical_comfort,
            "Schedule Reliability": comp.schedule_reliability,
            "Information Integrity":comp.information_integrity,
        }

        # Build ComponentDetail list
        component_breakdown = []
        for name in _COMPONENT_ORDER:
            weight = _COMPONENT_WEIGHT_MAP[name]
            norm_val = comp_values[name]
            w_contrib = norm_val * weight
            raw_val, raw_lbl = _raw_label(name, journey, sanitized)
            component_breakdown.append(ComponentDetail(
                name=name,
                raw_value=raw_val,
                raw_label=raw_lbl,
                normalized_value=round(norm_val, 4),
                component_weight=weight,
                weighted_contribution=round(w_contrib, 4),
                weighted_contribution_pts=round(w_contrib * 100, 2),
                status=_status(norm_val),
            ))

        # Build penalties
        penalties = _build_penalties(journey, sanitized)

        # Build bonuses
        s_norm = normalize(
            sanitized["seat"],
            ranges.min_seat, ranges.max_seat,
            min_span=20.0, default_bounds=(0.0, 100.0),
        )
        bonuses = _build_bonuses(journey, s_norm)

        # Totals
        total_incomplete = sanitized["incomplete_penalty"]
        total_friction = 100 - sanitized["friction"]

        # Ranking
        rank = rank_map.get(journey.route_id, 0)
        delta = (top_score - journey.nx_score) if rank > 1 else None

        # Decisive factors vs top (sorted by weighted contribution desc)
        decisive = [
            c.name for c in sorted(component_breakdown, key=lambda x: x.weighted_contribution_pts, reverse=True)
            if c.weighted_contribution_pts > 0
        ][:3]

        return RecommendationScorecard(
            route_id=journey.route_id,
            source=journey.source,
            destination=journey.destination,
            transport_modes=list(journey.transport_modes),
            departure_time=journey.departure_time,
            arrival_time=journey.arrival_time,
            price_inr=sanitized["price"],
            duration_min=sanitized["duration"],
            transfers=sanitized["transfers"],
            nx_score=journey.nx_score,
            component_breakdown=component_breakdown,
            penalties_applied=penalties,
            bonuses_applied=bonuses,
            total_incomplete_penalty=total_incomplete,
            total_friction_penalty=total_friction,
            normalization_details=norm_details,
            ranking_position=rank,
            recommendation_tag=journey.recommendation_reason or "",
            recommendation_reasons=list(journey.recommendation_reasoning),
            is_recommended=journey.is_recommended,
            delta_vs_top=delta,
            primary_decisive_factors=decisive,
        )
