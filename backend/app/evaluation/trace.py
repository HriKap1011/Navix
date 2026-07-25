"""
app/evaluation/trace.py
========================
Phase 5 — Recommendation Evaluation Lab (Internal Only)

TraceEngine: Generates a complete 5-step audit trace for a single journey,
letting engineers follow the exact computation path from raw data to
final NX Score.

  Step 1: Raw Data
  Step 2: Normalization & Component Calculations
  Step 3: Penalties & Bonuses
  Step 4: Weighted Contributions
  Step 5: Final NX Score Assembly
"""

from __future__ import annotations

from typing import Any, Dict, List, TYPE_CHECKING

from app.domain.components import ComponentCalculator, NormalizationRanges, normalize
from app.domain.services import calculate_friction_penalty
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
from app.evaluation.models import RecommendationTrace, TraceStep

if TYPE_CHECKING:
    from app.domain.journey import Journey
    from app.domain.components import NormalizationRanges


# ---------------------------------------------------------------------------
# Weight mapping (mirrors services.py Step C)
# ---------------------------------------------------------------------------
_COMPONENT_WEIGHTS = {
    "journey_value":         WEIGHT_PRICE + WEIGHT_DURATION,
    "booking_confidence":    WEIGHT_SEAT + WEIGHT_AVAILABILITY,
    "journey_simplicity":    WEIGHT_TRANSFERS,
    "timing_convenience":    WEIGHT_FRICTION,
    "physical_comfort":      WEIGHT_COMFORT,
    "schedule_reliability":  WEIGHT_RELIABILITY,
    "information_integrity": WEIGHT_INTEGRITY,
}

_COMPONENT_DISPLAY = {
    "journey_value":         "Journey Value",
    "booking_confidence":    "Booking Confidence",
    "journey_simplicity":    "Journey Simplicity",
    "timing_convenience":    "Timing Convenience",
    "physical_comfort":      "Physical Comfort",
    "schedule_reliability":  "Schedule Reliability",
    "information_integrity": "Information Integrity",
}


class TraceEngine:
    """
    Generates a step-by-step audit trace for a single journey.

    Usage:
        trace = TraceEngine()
        result = trace.trace(journey, sanitized, ranges)

    The journey must have already been scored by calculate_smart_scores()
    (i.e. journey.nx_score and journey.components must be populated).
    """

    def trace(
        self,
        journey: "Journey",
        sanitized: dict,
        ranges: NormalizationRanges,
    ) -> RecommendationTrace:
        """
        Build the full 5-step trace.

        Args:
            journey:   A Journey that has been through calculate_smart_scores().
            sanitized: The sanitized metrics dict for this journey
                       (price, duration, comfort, seat, friction, transfers,
                        incomplete_penalty).
            ranges:    The NormalizationRanges used when scoring this cohort.
        """
        step1 = self._step1_raw_data(journey, sanitized)
        step2 = self._step2_normalization(journey, sanitized, ranges)
        step3 = self._step3_penalties_bonuses(journey, sanitized, ranges)
        step4 = self._step4_weighted(journey)
        step5 = self._step5_final(journey, sanitized)

        summary = (
            f"Journey '{journey.route_id}' scored {journey.nx_score}/100. "
            f"Gross weighted score ≈ {step4.outputs.get('gross_score_pct', '?')} pts. "
            f"Incomplete penalty: −{sanitized['incomplete_penalty']} pts. "
            f"Final NX Score: {journey.nx_score}."
        )

        return RecommendationTrace(
            route_id=journey.route_id,
            final_nx_score=journey.nx_score,
            step1_raw_data=step1,
            step2_normalization=step2,
            step3_penalties_bonuses=step3,
            step4_weighted_contributions=step4,
            step5_final_score=step5,
            summary=summary,
        )

    # -----------------------------------------------------------------------
    # Step 1: Raw Data
    # -----------------------------------------------------------------------

    def _step1_raw_data(self, journey: "Journey", sanitized: dict) -> TraceStep:
        avail = journey.availability

        inputs: Dict[str, Any] = {
            "route_id":            journey.route_id,
            "source":              journey.source,
            "destination":         journey.destination,
            "transport_modes":     journey.transport_modes,
            "departure_time":      journey.departure_time,
            "arrival_time":        journey.arrival_time,
            "legs_count":          len(journey.legs),
            "layover_minutes":     journey.layover_duration.minutes if journey.layover_duration else 0,
            "seat_availability":   {
                "likelihood":              avail.likelihood if avail else None,
                "waitlist_code":           avail.waitlist_code if avail else None,
                "confirmation_probability": avail.confirmation_probability if avail else None,
            } if avail else None,
        }

        outputs: Dict[str, Any] = {
            "raw_price_inr":      sanitized["price"],
            "raw_duration_min":   sanitized["duration"],
            "raw_comfort_score":  sanitized["comfort"],
            "raw_seat_likelihood":sanitized["seat"],
            "raw_transfers":      sanitized["transfers"],
            "friction_score_0_100": sanitized["friction"],
            "incomplete_penalty": sanitized["incomplete_penalty"],
        }

        notes = []
        if sanitized["price"] == 10000.0:
            notes.append("Price was missing/zero → conservative fallback 10,000 INR applied (+15 penalty)")
        if sanitized["duration"] == 1440:
            notes.append("Duration was missing/zero → conservative fallback 1,440 min applied (+15 penalty)")
        if sanitized["incomplete_penalty"] > 0:
            notes.append(f"Total incomplete data penalty accumulated: {sanitized['incomplete_penalty']} pts")
        raw_friction = 100 - sanitized["friction"]
        if raw_friction > 0:
            notes.append(
                f"Friction penalty {raw_friction} pts → friction_score = 100 − {raw_friction} = {sanitized['friction']}"
            )

        return TraceStep(
            step_number=1,
            step_name="Raw Data Ingestion & Sanitization",
            description=(
                "Read raw journey metrics. Missing or invalid values are replaced with "
                "conservative fallback values, and an incomplete_penalty is accumulated "
                "for each missing field."
            ),
            inputs=inputs,
            outputs=outputs,
            notes=notes,
        )

    # -----------------------------------------------------------------------
    # Step 2: Normalization & Component Calculations
    # -----------------------------------------------------------------------

    def _step2_normalization(
        self, journey: "Journey", sanitized: dict, ranges: NormalizationRanges
    ) -> TraceStep:
        # Re-compute normalized scalars
        p_norm = normalize(sanitized["price"],    ranges.min_price,    ranges.max_price,    invert=True, min_span=200.0)
        d_norm = normalize(sanitized["duration"], ranges.min_duration, ranges.max_duration, invert=True, min_span=60.0)
        c_norm = normalize(sanitized["comfort"],  ranges.min_comfort,  ranges.max_comfort,  min_span=20.0, default_bounds=(0.0, 100.0))
        t_norm = normalize(sanitized["transfers"],ranges.min_transfers,ranges.max_transfers,invert=True, min_span=2.0, default_bounds=(0.0, 3.0))
        s_norm = normalize(sanitized["seat"],     ranges.min_seat,     ranges.max_seat,     min_span=20.0, default_bounds=(0.0, 100.0))
        f_norm = normalize(sanitized["friction"], ranges.min_friction, ranges.max_friction, min_span=20.0, default_bounds=(0.0, 100.0))

        comp = journey.components

        inputs: Dict[str, Any] = {
            "population_bounds": {
                "price":    [ranges.min_price, ranges.max_price],
                "duration": [ranges.min_duration, ranges.max_duration],
                "comfort":  [ranges.min_comfort, ranges.max_comfort],
                "seat":     [ranges.min_seat, ranges.max_seat],
                "friction": [ranges.min_friction, ranges.max_friction],
                "transfers":[ranges.min_transfers, ranges.max_transfers],
            },
            "sanitized_metrics": {
                "price":    sanitized["price"],
                "duration": sanitized["duration"],
                "comfort":  sanitized["comfort"],
                "seat":     sanitized["seat"],
                "friction": sanitized["friction"],
                "transfers":sanitized["transfers"],
            },
        }

        outputs: Dict[str, Any] = {
            "intermediate_normalized_scalars": {
                "p_norm (price, inverted)":    round(p_norm, 4),
                "d_norm (duration, inverted)": round(d_norm, 4),
                "c_norm (comfort)":            round(c_norm, 4),
                "t_norm (transfers, inverted)":round(t_norm, 4),
                "s_norm (seat likelihood)":    round(s_norm, 4),
                "f_norm (friction score)":     round(f_norm, 4),
            },
            "seven_component_scores": {
                "journey_value":         round(comp.journey_value, 4) if comp else None,
                "booking_confidence":    round(comp.booking_confidence, 4) if comp else None,
                "journey_simplicity":    round(comp.journey_simplicity, 4) if comp else None,
                "timing_convenience":    round(comp.timing_convenience, 4) if comp else None,
                "physical_comfort":      round(comp.physical_comfort, 4) if comp else None,
                "schedule_reliability":  round(comp.schedule_reliability, 4) if comp else None,
                "information_integrity": round(comp.information_integrity, 4) if comp else None,
            },
        }

        notes = [
            "journey_value = p_norm×0.45 + d_norm×0.35 + c_norm×0.20",
            "booking_confidence = s_norm×0.60 + conf_bonus (up to +0.20) + s_norm×0.20 (or ×0.40 if no avail) − WL_penalty (−0.15)",
            "journey_simplicity = t_norm (0 transfers → 1.0)",
            "timing_convenience = f_norm (direct mapping from friction score)",
            "physical_comfort = c_norm×0.75 + mode_geometric_mean×0.25",
            "schedule_reliability = route_trust×0.60 + mode_harmonic_punctuality×0.40",
            "information_integrity = linear_map(incomplete_penalty, 0→1.0, 50→0.10)",
        ]

        return TraceStep(
            step_number=2,
            step_name="Normalization & Component Calculations",
            description=(
                "Each raw metric is min-max normalized against the full cohort. "
                "Normalized scalars are combined into 7 semantic component scores "
                "by ComponentCalculator.compute()."
            ),
            inputs=inputs,
            outputs=outputs,
            notes=notes,
        )

    # -----------------------------------------------------------------------
    # Step 3: Penalties & Bonuses
    # -----------------------------------------------------------------------

    def _step3_penalties_bonuses(
        self, journey: "Journey", sanitized: dict, ranges: NormalizationRanges
    ) -> TraceStep:
        avail = journey.availability
        incomplete = sanitized["incomplete_penalty"]
        raw_friction_penalty = 100 - sanitized["friction"]

        # Confirmation probability bonus
        conf_bonus = 0.0
        if avail and avail.confirmation_probability is not None:
            conf_bonus = (float(avail.confirmation_probability) / 100.0) * 0.20

        # Waitlist penalty
        wl_penalty = 0.0
        if avail:
            wl = avail.waitlist_code or ""
            if wl.upper().startswith("WL") or wl.upper().startswith("RAC"):
                wl_penalty = 0.15

        inputs: Dict[str, Any] = {
            "incomplete_penalty_pts":   incomplete,
            "friction_raw_penalty_pts": raw_friction_penalty,
            "waitlist_code":            avail.waitlist_code if avail else None,
            "confirmation_probability": avail.confirmation_probability if avail else None,
        }

        outputs: Dict[str, Any] = {
            "incomplete_data_deduction_pts": incomplete,
            "friction_penalty_pts":          raw_friction_penalty,
            "confirmation_bonus_norm":       round(conf_bonus, 4),
            "waitlist_penalty_norm":         round(wl_penalty, 4),
            "net_incomplete_effect":         f"−{incomplete} pts deducted from final score AFTER weighted sum",
            "net_booking_confidence_adj":    f"+{conf_bonus:.4f} (bonus) − {wl_penalty:.4f} (WL penalty) applied inside booking_confidence component",
        }

        notes = [
            "Incomplete data penalties (pts) are deducted from the final integer NX Score AFTER the weighted sum.",
            "Confirmation probability bonus and waitlist penalty are absorbed into the booking_confidence component (not the final score directly).",
            "Friction penalty reduces the friction_score input → f_norm → timing_convenience component → weighted contribution.",
        ]

        return TraceStep(
            step_number=3,
            step_name="Penalties & Bonuses",
            description=(
                "Tracks all adjustments: incomplete data penalties (applied to final score), "
                "timing friction penalties (absorbed through f_norm), and booking confidence "
                "adjustments (confirmation probability bonus, waitlist penalty)."
            ),
            inputs=inputs,
            outputs=outputs,
            notes=notes,
        )

    # -----------------------------------------------------------------------
    # Step 4: Weighted Contributions
    # -----------------------------------------------------------------------

    def _step4_weighted(self, journey: "Journey") -> TraceStep:
        comp = journey.components

        if comp is None:
            return TraceStep(
                step_number=4,
                step_name="Weighted Contributions",
                description="Components not available (journey may not have been scored).",
                inputs={},
                outputs={},
                notes=["Call calculate_smart_scores() before tracing."],
            )

        contributions: Dict[str, Any] = {}
        gross = 0.0
        for key, weight in _COMPONENT_WEIGHTS.items():
            norm_val = getattr(comp, key)
            contrib = norm_val * weight * 100
            gross += contrib
            contributions[_COMPONENT_DISPLAY[key]] = {
                "normalized_score": round(norm_val, 4),
                "config_weight":    weight,
                "contribution_pts": round(contrib, 2),
                "formula":          f"{norm_val:.4f} × {weight} × 100 = {contrib:.2f} pts",
            }

        return TraceStep(
            step_number=4,
            step_name="Weighted Contributions Assembly",
            description=(
                "Each component score is multiplied by its config weight and scaled to 100 "
                "to produce contribution points. All 7 contributions are summed to form "
                "the gross score before the incomplete penalty deduction."
            ),
            inputs={
                "component_scores": {
                    _COMPONENT_DISPLAY[k]: round(getattr(comp, k), 4)
                    for k in _COMPONENT_WEIGHTS
                },
                "config_weights": {_COMPONENT_DISPLAY[k]: v for k, v in _COMPONENT_WEIGHTS.items()},
            },
            outputs={
                "per_component_contributions": contributions,
                "gross_score_pct": round(gross, 2),
            },
            notes=[
                "Total weight: " + str(round(sum(_COMPONENT_WEIGHTS.values()), 4)),
                "WEIGHT_RELIABILITY and WEIGHT_INTEGRITY are 0.0 (Sprint 3 reserved) — those components contribute 0 pts.",
            ],
        )

    # -----------------------------------------------------------------------
    # Step 5: Final Score Assembly
    # -----------------------------------------------------------------------

    def _step5_final(self, journey: "Journey", sanitized: dict) -> TraceStep:
        comp = journey.components
        incomplete = sanitized["incomplete_penalty"]

        gross_pts = 0.0
        if comp:
            for key, weight in _COMPONENT_WEIGHTS.items():
                gross_pts += getattr(comp, key) * weight * 100

        gross_rounded = int(round(gross_pts))
        final = max(0, min(100, gross_rounded - incomplete))

        return TraceStep(
            step_number=5,
            step_name="Final NX Score Assembly",
            description=(
                "The gross weighted score is rounded to an integer, the incomplete data "
                "penalty is subtracted, and the result is clamped to [0, 100]."
            ),
            inputs={
                "gross_weighted_score_pct": round(gross_pts, 4),
                "incomplete_penalty_pts":   incomplete,
            },
            outputs={
                "gross_rounded_pts":            gross_rounded,
                "after_penalty":                gross_rounded - incomplete,
                "clamped_to_0_100":             final,
                "final_nx_score":               journey.nx_score,
                "formula": (
                    f"max(0, min(100, round({gross_pts:.4f}) − {incomplete})) "
                    f"= max(0, min(100, {gross_rounded} − {incomplete})) = {final}"
                ),
            },
            notes=[
                "Production value (journey.nx_score) must equal the computed final score.",
                "Any discrepancy indicates a re-scoring mismatch — the trace should be regenerated from a freshly scored cohort.",
            ],
        )
