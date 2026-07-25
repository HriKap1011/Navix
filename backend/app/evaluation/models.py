"""
app/evaluation/models.py
========================
Phase 5 — Recommendation Evaluation Lab (Internal Only)

Data contracts for all evaluation lab outputs:
  - ComponentDetail       : one component's full scoring breakdown
  - PenaltyDetail         : one applied penalty
  - BonusDetail           : one applied bonus
  - NormalizationDetails  : population-level bounds used during scoring
  - RecommendationScorecard: full scorecard for one journey
  - ScoreDistribution     : cohort-level statistics
  - PairwiseAnalysis      : "why journey A beat journey B"
  - ComparisonResult      : full multi-journey comparison report
  - TraceStep             : one step in the 5-step trace pipeline
  - RecommendationTrace   : the complete 5-step audit trace
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any


# ---------------------------------------------------------------------------
# Fine-grained component detail
# ---------------------------------------------------------------------------

@dataclass
class ComponentDetail:
    """
    Full breakdown for a single semantic recommendation component.

    All normalized values and weighted contributions are audit-safe read-only
    copies — they do NOT feed back into any production scoring path.
    """
    name: str
    """Human-readable component name (e.g. 'Journey Value')."""

    raw_value: float
    """The raw, un-normalized metric value (e.g. 1500.0 for price in INR)."""

    raw_label: str
    """Human-readable description of the raw value (e.g. 'INR 1,500')."""

    normalized_value: float
    """Normalized scalar in [0.0, 1.0]."""

    component_weight: float
    """The config weight applied to this component in the NX Score assembly."""

    weighted_contribution: float
    """normalized_value * component_weight (before × 100 scaling)."""

    weighted_contribution_pts: float
    """weighted_contribution * 100 — the actual points this component adds to the score."""

    status: str
    """'strong' (≥ 0.75), 'average' (≥ 0.50), 'weak' (< 0.50)."""


# ---------------------------------------------------------------------------
# Penalty and Bonus details
# ---------------------------------------------------------------------------

@dataclass
class PenaltyDetail:
    """One discrete penalty deducted from the NX Score."""
    name: str
    category: str          # 'incomplete_data' | 'timing_friction' | 'waitlist'
    value: int             # Points deducted (positive integer)
    description: str
    applied: bool          # True if this penalty was actually applied


@dataclass
class BonusDetail:
    """One discrete bonus added during component scoring."""
    name: str
    category: str          # 'confirmation_probability' | 'mode_comfort'
    value: float           # Normalized bonus (0.0–0.20)
    description: str
    applied: bool


# ---------------------------------------------------------------------------
# Normalization details
# ---------------------------------------------------------------------------

@dataclass
class NormalizationDetails:
    """
    Population-level bounds used during cross-journey normalization.
    Provided for full audit transparency — engineers can verify that
    each journey's component was computed against the correct cohort range.
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
    cohort_size: int       # Number of journeys in this search result set


# ---------------------------------------------------------------------------
# Recommendation Scorecard
# ---------------------------------------------------------------------------

@dataclass
class RecommendationScorecard:
    """
    Engineering-only full scorecard for one evaluated journey.

    Exposes every input, intermediate value, and final score used to
    produce the journey's NX Score. Intended for internal debugging and
    calibration — never serialized to the production search API.
    """

    # --- Journey Identity --------------------------------------------------
    route_id: str
    source: str
    destination: str
    transport_modes: List[str]
    departure_time: str
    arrival_time: str
    price_inr: float
    duration_min: int
    transfers: int

    # --- Core Scores -------------------------------------------------------
    nx_score: int
    """Final NX Score [0-100] as produced by production calculate_smart_scores()."""

    component_breakdown: List[ComponentDetail]
    """All 7 semantic components with full audit detail."""

    # --- Penalties & Bonuses -----------------------------------------------
    penalties_applied: List[PenaltyDetail]
    bonuses_applied: List[BonusDetail]
    total_incomplete_penalty: int
    total_friction_penalty: int

    # --- Normalization context ---------------------------------------------
    normalization_details: NormalizationDetails

    # --- Ranking -----------------------------------------------------------
    ranking_position: int
    """1-based position in this evaluated cohort (1 = highest NX Score)."""

    # --- Recommendation reasoning ------------------------------------------
    recommendation_tag: str
    recommendation_reasons: List[str]
    is_recommended: bool

    # --- Comparison against top --------------------------------------------
    delta_vs_top: Optional[int]
    """NX Score delta vs. the rank-1 journey (None if this IS rank-1)."""

    primary_decisive_factors: List[str]
    """Top components that explain why this journey ranked above/below rank-1."""


# ---------------------------------------------------------------------------
# Comparison Result
# ---------------------------------------------------------------------------

@dataclass
class ScoreDistribution:
    """Statistical summary of NX Scores across the evaluated cohort."""
    min_score: int
    max_score: int
    mean_score: float
    median_score: float
    std_dev: float
    cohort_size: int


@dataclass
class PairwiseAnalysis:
    """
    Explains exactly why Journey A beat Journey B across all 7 components.

    Only covers journeys where a_score > b_score.
    """
    journey_a_route_id: str
    journey_b_route_id: str
    score_delta: int        # journey_a.nx_score - journey_b.nx_score
    component_deltas: Dict[str, float]
    """
    Key: component name, Value: journey_a_contribution_pts - journey_b_contribution_pts.
    Positive means journey A won on that component; negative means journey B won.
    """
    decisive_factors: List[str]
    """Components with the largest positive delta (A > B) explaining the win."""
    mitigating_factors: List[str]
    """Components where journey B actually outperformed A."""


@dataclass
class ComparisonResult:
    """
    Full comparison report for a multi-journey cohort.
    """
    ranking_table: List[Dict[str, Any]]
    """
    Sorted list of {rank, route_id, nx_score, source, destination,
    transport_modes, price_inr, duration_min, transfers} dicts.
    """

    score_distribution: ScoreDistribution

    strongest_strengths: Dict[str, str]
    """
    route_id → name of the component where this journey scores highest
    relative to the cohort.
    """

    weakest_components: Dict[str, str]
    """
    route_id → name of the component where this journey scores lowest
    relative to the cohort.
    """

    pairwise_analysis: List[PairwiseAnalysis]
    """
    All pairwise comparisons between adjacent ranked journeys:
    rank-1 vs rank-2, rank-2 vs rank-3, etc.
    """


# ---------------------------------------------------------------------------
# Recommendation Trace (5-step audit pipeline)
# ---------------------------------------------------------------------------

@dataclass
class TraceStep:
    """One step in the 5-step recommendation trace pipeline."""
    step_number: int
    step_name: str
    description: str
    inputs: Dict[str, Any]
    outputs: Dict[str, Any]
    notes: List[str] = field(default_factory=list)


@dataclass
class RecommendationTrace:
    """
    Complete 5-step audit trace for a single journey.

    Engineers can follow the exact computation path:
      Raw Data → Normalization → Components → Penalties/Bonuses →
      Weighted Contributions → Final NX Score
    """
    route_id: str
    final_nx_score: int

    step1_raw_data: TraceStep
    """Raw journey metrics and input attributes before any processing."""

    step2_normalization: TraceStep
    """Population bounds, normalized scalars, and component calculations."""

    step3_penalties_bonuses: TraceStep
    """Step-by-step penalty deductions and bonus additions."""

    step4_weighted_contributions: TraceStep
    """component_score × weight × 100 for each of the 7 components."""

    step5_final_score: TraceStep
    """Total score assembly: sum of weighted contributions − incomplete_penalty."""

    summary: str
    """Human-readable one-line summary of the trace result."""
