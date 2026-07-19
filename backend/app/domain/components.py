"""
app/domain/components.py
========================
Phase 5 — Recommendation Engine v2, Sprint 2
Internal Recommendation Component Engine

Computes seven semantic recommendation components for every Journey object.
These components are the internal foundation of the NX Score and will drive
persona-aware scoring in Sprint 3.

Each component is a normalized float in [0.0, 1.0]:
  1.0 = best possible value for that dimension
  0.0 = worst possible value for that dimension

Components are intentionally decoupled — each has a single responsibility
and does NOT re-use or duplicate logic from another component.

------------------------------------------------------------------------------
Metric-to-Component Mapping  (Sprint 2 canonical reference)
------------------------------------------------------------------------------
The table below documents which raw metrics each semantic component absorbs,
replacing the old pattern of feeding raw metrics directly into the NX Score.

  Raw Metric                  Semantic Component       Role
  ────────────────────────    ─────────────────────    ────────────────────────────
  price (normalized)          journey_value            p_norm × 0.45
  duration (normalized)       journey_value            d_norm × 0.35
  comfort (softening term)    journey_value            c_norm × 0.20 comfort dividend
  comfort (primary signal)    physical_comfort         c_norm × 0.75 + mode bonus × 0.25
  seat_likelihood             booking_confidence       s_norm × base (0.60)
  confirmation_probability    booking_confidence       avail bonus up to +0.20
  waitlist_code               booking_confidence       WL/RAC penalty −0.15
  transfers (leg count − 1)   journey_simplicity       t_norm (inverted, fewer = better)
  friction_score (layovers,   timing_convenience       f_norm (high friction = low convenience)
    overnight, early dep.)    
  route_id prefix             schedule_reliability     RAIL- → 1.0  /  NX- → 0.55
  transport_modes             schedule_reliability     harmonic mean punctuality × 0.40
  transport_modes             physical_comfort         geometric mean mode bonus × 0.25
  incomplete_penalty          information_integrity    linear map [0 → 1.0, 50 → 0.10]
  ────────────────────────    ─────────────────────    ────────────────────────────

IMPORTANT — internal normalization contract:
  p_norm and d_norm are computed inside ComponentCalculator.compute() and
  consumed exclusively by _journey_value(). They are NOT re-exported and must
  NOT be re-derived elsewhere for scoring purposes. services.py computes its own
  p_norm/d_norm copies solely for human-readable reasoning labels.
------------------------------------------------------------------------------
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from app.domain.journey import Journey


# ---------------------------------------------------------------------------
# Data Contract
# ---------------------------------------------------------------------------

@dataclass
class RecommendationComponents:
    """
    Holds the seven semantic recommendation component scores for a single Journey.

    All values are normalized to [0.0, 1.0] where 1.0 is the ideal value.
    The final NX Score is assembled from these components in services.py using
    the weight configuration from config.py.
    """

    # 1. Journey Value — economic attractiveness considering price + duration + comfort blend
    journey_value: float

    # 2. Booking Confidence — certainty that a seat can be confirmed
    booking_confidence: float

    # 3. Journey Simplicity — structural ease (fewer transfers = higher score)
    journey_simplicity: float

    # 4. Timing Convenience — quality of departure/arrival timings and layover friction
    timing_convenience: float

    # 5. Physical Comfort — in-vehicle experience quality
    physical_comfort: float

    # 6. Schedule Reliability — operational trust (real vs synthetic, transport mode)
    schedule_reliability: float

    # 7. Information Integrity — confidence in the completeness of journey data
    information_integrity: float


# ---------------------------------------------------------------------------
# Normalization Helper (module-level, shared with services.py)
# ---------------------------------------------------------------------------

def normalize(
    val: float,
    min_val: float,
    max_val: float,
    invert: bool = False,
    min_span: float = 0.0,
    default_bounds=None,
) -> float:
    """
    Normalize a raw metric value into [0.0, 1.0].

    Args:
        val:           The raw value to normalize.
        min_val:       Minimum observed value across the search results.
        max_val:       Maximum observed value across the search results.
        invert:        If True, lower raw value -> higher normalized score.
        min_span:      Minimum spread to avoid degenerate normalization when
                       all journeys have identical raw values.
        default_bounds: (abs_min, abs_max) used when span is still zero after
                        min_span padding (e.g. comfort is always 0-100).

    Returns:
        Normalized float in [0.0, 1.0].
    """
    if val is None:
        return 0.0
    if min_val is None or max_val is None:
        return 0.5

    if min_val > max_val:
        min_val, max_val = max_val, min_val

    span = max_val - min_val
    if span <= 0.0:
        if default_bounds:
            d_min, d_max = default_bounds
            d_span = d_max - d_min
            if d_span > 0.0:
                norm = (val - d_min) / d_span
                return 1.0 - norm if invert else norm
        return 0.5

    if span < min_span:
        padding = (min_span - span) / 2.0
        min_val = max(0.0, min_val - padding)
        max_val = max_val + padding
        span = max_val - min_val

    val = max(min_val, min(max_val, val))
    norm = (val - min_val) / span
    return 1.0 - norm if invert else norm


# ---------------------------------------------------------------------------
# Normalization Ranges Container
# ---------------------------------------------------------------------------

@dataclass
class NormalizationRanges:
    """
    Population-level min/max values for cross-journey normalization.
    Computed once per search result set in services.py and passed into
    ComponentCalculator.compute().
    """
    min_price: float
    max_price: float
    min_duration: float
    max_duration: float
    min_transfers: float
    max_transfers: float
    min_comfort: float
    max_comfort: float
    min_seat: float
    max_seat: float
    min_friction: float
    max_friction: float


# ---------------------------------------------------------------------------
# Component Calculator
# ---------------------------------------------------------------------------

class ComponentCalculator:
    """
    Computes all seven semantic recommendation components for a single Journey.

    Usage:
        ranges = NormalizationRanges(...)
        components = ComponentCalculator.compute(journey, sanitized, ranges)

    All component methods are private static methods with a single
    responsibility. They never call each other -- all inputs are passed
    explicitly by compute().
    """

    @staticmethod
    def compute(
        journey: "Journey",
        sanitized: dict,
        ranges: NormalizationRanges,
    ) -> RecommendationComponents:
        """
        Entry point: compute all seven components in order and return
        a fully populated RecommendationComponents dataclass.

        Args:
            journey:    The Journey domain object (read-only inside components).
            sanitized:  Pre-sanitized metrics dict from services.py:
                        {price, duration, comfort, seat, friction, transfers, incomplete_penalty}
            ranges:     Population-level min/max normalization ranges.

        Internal normalization contract:
            p_norm and d_norm are local to this method and are passed into
            _journey_value() only. They are intentionally NOT returned or
            exposed — services.py must not use them for scoring.
        """
        # Pre-compute normalized scalars shared across multiple components
        p_norm = normalize(
            sanitized["price"],
            ranges.min_price, ranges.max_price,
            invert=True, min_span=200.0,
        )
        d_norm = normalize(
            sanitized["duration"],
            ranges.min_duration, ranges.max_duration,
            invert=True, min_span=60.0,
        )
        c_norm = normalize(
            sanitized["comfort"],
            ranges.min_comfort, ranges.max_comfort,
            min_span=20.0, default_bounds=(0.0, 100.0),
        )
        t_norm = normalize(
            sanitized["transfers"],
            ranges.min_transfers, ranges.max_transfers,
            invert=True, min_span=2.0, default_bounds=(0.0, 3.0),
        )
        s_norm = normalize(
            sanitized["seat"],
            ranges.min_seat, ranges.max_seat,
            min_span=20.0, default_bounds=(0.0, 100.0),
        )
        f_norm = normalize(
            sanitized["friction"],
            ranges.min_friction, ranges.max_friction,
            min_span=20.0, default_bounds=(0.0, 100.0),
        )

        return RecommendationComponents(
            journey_value=ComponentCalculator._journey_value(p_norm, d_norm, c_norm),
            booking_confidence=ComponentCalculator._booking_confidence(s_norm, journey),
            journey_simplicity=ComponentCalculator._journey_simplicity(t_norm),
            timing_convenience=ComponentCalculator._timing_convenience(f_norm),
            physical_comfort=ComponentCalculator._physical_comfort(c_norm, journey.transport_modes),
            schedule_reliability=ComponentCalculator._schedule_reliability(journey.route_id, journey.transport_modes),
            information_integrity=ComponentCalculator._information_integrity(sanitized["incomplete_penalty"]),
        )

    # -- Component 1: Journey Value -------------------------------------------
    @staticmethod
    def _journey_value(p_norm: float, d_norm: float, c_norm: float) -> float:
        """
        Journey Value -- economic attractiveness of the overall journey.

        Combines:
          - Price efficiency  (weight 0.45): cheaper relative to alternatives is better
          - Time efficiency   (weight 0.35): faster relative to alternatives is better
          - Comfort dividend  (weight 0.20): comfort partially sets the value of the price paid

        Comfort dividend accounts for the idea that paying more for a more comfortable
        journey can still be good value, so comfort softens the price penalty slightly.

        Returns: float in [0.0, 1.0]
        """
        return (p_norm * 0.45) + (d_norm * 0.35) + (c_norm * 0.20)

    # -- Component 2: Booking Confidence --------------------------------------
    @staticmethod
    def _booking_confidence(s_norm: float, journey: "Journey") -> float:
        """
        Booking Confidence -- probability that a ticket can actually be confirmed.

        Primary signal:
          - Seat likelihood normalized score (s_norm, weight 0.60 with availability data,
            or 1.00 fallback when no SeatAvailability object is present)

        Secondary signals derived from SeatAvailability if present:
          - Confirmation probability bonus: up to +0.20 if journey.availability
            carries a numeric confirmation_probability
          - Waitlist penalty: -0.15 if waitlist_code indicates WL/RAC status

        Returns: float clamped to [0.0, 1.0]
        """
        score = s_norm * 0.60

        avail = journey.availability
        if avail is not None:
            # Confirmation probability bonus (0.0-100.0 scale)
            if avail.confirmation_probability is not None:
                conf_prob = float(avail.confirmation_probability)
                score += (conf_prob / 100.0) * 0.20  # bonus up to +0.20

            # Waitlist penalty
            wl = avail.waitlist_code or ""
            if wl.upper().startswith("WL") or wl.upper().startswith("RAC"):
                score -= 0.15

            # Remaining weight (0.20) from confirmation path
            # filled by base s_norm if no extra bonus applied
            score += s_norm * 0.20
        else:
            # No SeatAvailability object: use s_norm for the full remaining weight
            score += s_norm * 0.40

        return max(0.0, min(1.0, score))

    # -- Component 3: Journey Simplicity --------------------------------------
    @staticmethod
    def _journey_simplicity(t_norm: float) -> float:
        """
        Journey Simplicity -- structural ease of the journey.

        Derived entirely from the normalized inverse-transfer score.
        No double-counting with timing friction or any other component.

          0 transfers -> t_norm ~= 1.0 -> simplicity ~= 1.0
          3+ transfers -> t_norm ~= 0.0 -> simplicity ~= 0.0

        Returns: float in [0.0, 1.0]
        """
        return t_norm

    # -- Component 4: Timing Convenience --------------------------------------
    @staticmethod
    def _timing_convenience(f_norm: float) -> float:
        """
        Timing Convenience -- quality of departure, arrival, and layover timings.

        Reuses the output of calculate_friction_penalty() (exposed as f_norm),
        which already accounts for:
          - Early morning departures (before 06:00)
          - Late night arrivals (after 23:00)
          - Short layovers (< 40 min) and excessive layovers (> 180 min)
          - Overnight transfer difficulty

        This component does NOT add new timing logic -- it is a clean mapping
        from the existing friction score to avoid double-penalization.

        Returns: float in [0.0, 1.0]
        """
        return f_norm

    # -- Component 5: Physical Comfort ----------------------------------------
    @staticmethod
    def _physical_comfort(c_norm: float, transport_modes: List[str]) -> float:
        """
        Physical Comfort -- in-vehicle experience quality.

        Primary signal:
          - comfort_score normalized (c_norm, weight 0.75)

        Transport category bonus (weight 0.25):
          Captures intrinsic comfort characteristics of the transport mode.
          When multiple modes are involved, uses the geometric mean to avoid
          over-rewarding or over-penalizing any single leg.

            Flight      -> 0.90 (highest baseline)
            Train       -> 0.70 (varies by class)
            Sleeper Bus -> 0.60 (better than day bus for overnight)
            Bus         -> 0.40 (lower baseline)
            Other       -> 0.50

        Returns: float in [0.0, 1.0]
        """
        mode_scores = {
            "Flight": 0.90,
            "Train": 0.70,
            "Sleeper Bus": 0.60,
            "Bus": 0.40,
        }

        if transport_modes:
            cat_vals = [mode_scores.get(m, 0.50) for m in transport_modes]
            # Geometric mean balances multi-leg journeys fairly
            product = 1.0
            for v in cat_vals:
                product *= v
            cat_bonus = product ** (1.0 / len(cat_vals))
        else:
            cat_bonus = 0.50

        return (c_norm * 0.75) + (cat_bonus * 0.25)

    # -- Component 6: Schedule Reliability ------------------------------------
    @staticmethod
    def _schedule_reliability(route_id: str, transport_modes: List[str]) -> float:
        """
        Schedule Reliability -- expected operational trustworthiness of the schedule.

        No historical delay data is available in Sprint 2, so reliability is derived
        conservatively from structural signals only. This will be refined in Sprint 3+
        using historical on-time performance data.

        Route type signal (weight 0.60):
          - RAIL- prefix: real IRCTC timetable  -> 1.0
          - NX- prefix:   synthetic/estimated   -> 0.55
          - Other/unknown                        -> 0.70

        Transport mode punctuality baseline (weight 0.40):
          - Flight -> 0.85 (better average, clustered delays at peak hours)
          - Train  -> 0.75 (reasonable punctuality on Indian rail network)
          - Bus    -> 0.55 (highest variance; road conditions unpredictable)
          Mixed multi-leg: harmonic mean (penalises a single unreliable mode)

        Returns: float in [0.0, 1.0]
        """
        if route_id.startswith("RAIL-"):
            route_trust = 1.0
        elif route_id.startswith("NX-"):
            route_trust = 0.55
        else:
            route_trust = 0.70

        mode_punctuality = {
            "Train": 0.75,
            "Flight": 0.85,
            "Bus": 0.55,
            "Sleeper Bus": 0.55,
        }

        if transport_modes:
            mode_vals = [mode_punctuality.get(m, 0.65) for m in transport_modes]
            # Harmonic mean: one very unreliable mode drags the score down
            harmonic = len(mode_vals) / sum(1.0 / v for v in mode_vals)
        else:
            harmonic = 0.65

        return (route_trust * 0.60) + (harmonic * 0.40)

    # -- Component 7: Information Integrity ------------------------------------
    @staticmethod
    def _information_integrity(incomplete_penalty: int) -> float:
        """
        Information Integrity -- confidence in the completeness of journey data.

        Derived from the accumulated incomplete_penalty score from services.py:

          penalty == 0   -> full integrity  (1.0)
          penalty >= 50  -> minimum integrity (0.10)

        Linear mapping between these bounds, clamped to [0.10, 1.0].
        Minimum of 0.10 ensures the component never collapses to zero,
        preserving incomplete journeys in rankings while still penalizing them.

        Penalty contributors (from services.py sanitization):
          +15  missing departure or arrival time
          +15  missing or zero price
          +15  missing or zero duration
          +10  missing comfort score
          +10  missing seat likelihood

        Returns: float in [0.10, 1.0]
        """
        MAX_PENALTY = 50.0
        integrity = 1.0 - (min(incomplete_penalty, MAX_PENALTY) / MAX_PENALTY)
        return max(0.10, integrity)
