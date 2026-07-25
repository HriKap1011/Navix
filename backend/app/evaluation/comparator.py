"""
app/evaluation/comparator.py
=============================
Phase 5 — Recommendation Evaluation Lab (Internal Only)

JourneyComparator: Given a set of RecommendationScorecards, generates:
  - Ranking table
  - Score distribution statistics
  - Strongest strengths and weakest components per journey
  - Pairwise comparison ("Why journey A beat journey B")
"""

from __future__ import annotations

import math
import statistics
from typing import List, Dict, Any

from app.evaluation.models import (
    RecommendationScorecard,
    ComparisonResult,
    ScoreDistribution,
    PairwiseAnalysis,
)


class JourneyComparator:
    """
    Multi-journey comparison engine.

    Usage:
        comparator = JourneyComparator()
        result = comparator.compare(scorecards)
    """

    def compare(self, scorecards: List[RecommendationScorecard]) -> ComparisonResult:
        """
        Generate a full comparison report for a list of scorecards.

        The scorecards must already be ranked (ranking_position populated),
        e.g. as returned by EvaluationLab.evaluate().
        """
        if not scorecards:
            return ComparisonResult(
                ranking_table=[],
                score_distribution=ScoreDistribution(0, 0, 0.0, 0.0, 0.0, 0),
                strongest_strengths={},
                weakest_components={},
                pairwise_analysis=[],
            )

        ranked = sorted(scorecards, key=lambda s: s.ranking_position)

        ranking_table = self._build_ranking_table(ranked)
        score_distribution = self._build_score_distribution(ranked)
        strongest_strengths = self._build_strongest_strengths(ranked)
        weakest_components = self._build_weakest_components(ranked)
        pairwise = self._build_pairwise_analysis(ranked)

        return ComparisonResult(
            ranking_table=ranking_table,
            score_distribution=score_distribution,
            strongest_strengths=strongest_strengths,
            weakest_components=weakest_components,
            pairwise_analysis=pairwise,
        )

    # -----------------------------------------------------------------------
    # Ranking table
    # -----------------------------------------------------------------------

    def _build_ranking_table(
        self, ranked: List[RecommendationScorecard]
    ) -> List[Dict[str, Any]]:
        table = []
        for sc in ranked:
            table.append({
                "rank": sc.ranking_position,
                "route_id": sc.route_id,
                "nx_score": sc.nx_score,
                "source": sc.source,
                "destination": sc.destination,
                "transport_modes": sc.transport_modes,
                "price_inr": sc.price_inr,
                "duration_min": sc.duration_min,
                "transfers": sc.transfers,
                "recommendation_tag": sc.recommendation_tag,
                "is_recommended": sc.is_recommended,
                "delta_vs_top": sc.delta_vs_top,
            })
        return table

    # -----------------------------------------------------------------------
    # Score distribution
    # -----------------------------------------------------------------------

    def _build_score_distribution(
        self, ranked: List[RecommendationScorecard]
    ) -> ScoreDistribution:
        scores = [sc.nx_score for sc in ranked]
        n = len(scores)
        if n == 0:
            return ScoreDistribution(0, 0, 0.0, 0.0, 0.0, 0)

        mean = statistics.mean(scores)
        median = statistics.median(scores)
        std_dev = statistics.stdev(scores) if n > 1 else 0.0

        return ScoreDistribution(
            min_score=min(scores),
            max_score=max(scores),
            mean_score=round(mean, 2),
            median_score=round(float(median), 2),
            std_dev=round(std_dev, 2),
            cohort_size=n,
        )

    # -----------------------------------------------------------------------
    # Strengths and weaknesses
    # -----------------------------------------------------------------------

    def _build_strongest_strengths(
        self, ranked: List[RecommendationScorecard]
    ) -> Dict[str, str]:
        """
        For each journey, find the component where it scores highest
        relative to the rest of the cohort.
        """
        result: Dict[str, str] = {}
        if not ranked:
            return result

        # Collect per-component normalized scores across cohort
        component_names = [c.name for c in ranked[0].component_breakdown]
        # cohort average per component
        averages: Dict[str, float] = {}
        for name in component_names:
            vals = []
            for sc in ranked:
                for c in sc.component_breakdown:
                    if c.name == name:
                        vals.append(c.normalized_value)
            averages[name] = sum(vals) / len(vals) if vals else 0.0

        for sc in ranked:
            best_name = ""
            best_excess = -1.0
            for c in sc.component_breakdown:
                excess = c.normalized_value - averages.get(c.name, 0.0)
                if excess > best_excess:
                    best_excess = excess
                    best_name = c.name
            result[sc.route_id] = best_name

        return result

    def _build_weakest_components(
        self, ranked: List[RecommendationScorecard]
    ) -> Dict[str, str]:
        """
        For each journey, find the component where it scores lowest
        relative to the rest of the cohort.
        """
        result: Dict[str, str] = {}
        if not ranked:
            return result

        component_names = [c.name for c in ranked[0].component_breakdown]
        averages: Dict[str, float] = {}
        for name in component_names:
            vals = []
            for sc in ranked:
                for c in sc.component_breakdown:
                    if c.name == name:
                        vals.append(c.normalized_value)
            averages[name] = sum(vals) / len(vals) if vals else 0.0

        for sc in ranked:
            worst_name = ""
            worst_deficit = -1.0
            for c in sc.component_breakdown:
                deficit = averages.get(c.name, 0.0) - c.normalized_value
                if deficit > worst_deficit:
                    worst_deficit = deficit
                    worst_name = c.name
            result[sc.route_id] = worst_name

        return result

    # -----------------------------------------------------------------------
    # Pairwise analysis
    # -----------------------------------------------------------------------

    def _build_pairwise_analysis(
        self, ranked: List[RecommendationScorecard]
    ) -> List[PairwiseAnalysis]:
        """
        For each adjacent pair (rank N vs rank N+1), explain exactly why
        journey A beat journey B across all 7 components.
        """
        analyses = []
        for i in range(len(ranked) - 1):
            a = ranked[i]
            b = ranked[i + 1]
            analysis = self._pairwise(a, b)
            if analysis:
                analyses.append(analysis)
        return analyses

    def _pairwise(
        self, a: RecommendationScorecard, b: RecommendationScorecard
    ) -> PairwiseAnalysis:
        """
        Detailed component-level breakdown of why journey A outranked journey B.
        """
        # Build component contribution lookup for A and B
        a_contribs: Dict[str, float] = {c.name: c.weighted_contribution_pts for c in a.component_breakdown}
        b_contribs: Dict[str, float] = {c.name: c.weighted_contribution_pts for c in b.component_breakdown}

        all_names = list(a_contribs.keys())
        component_deltas: Dict[str, float] = {}
        for name in all_names:
            delta = round(a_contribs.get(name, 0.0) - b_contribs.get(name, 0.0), 3)
            component_deltas[name] = delta

        # Sort by delta descending
        sorted_deltas = sorted(component_deltas.items(), key=lambda x: x[1], reverse=True)

        # Decisive factors: components where A > B (positive delta)
        decisive = [name for name, d in sorted_deltas if d > 0.01][:3]

        # Mitigating factors: components where B > A (negative delta)
        mitigating = [name for name, d in sorted_deltas if d < -0.01][:3]

        # Human-readable decisive factor descriptions
        decisive_descriptions = []
        for name in decisive:
            d = component_deltas[name]
            a_val = next((c.normalized_value for c in a.component_breakdown if c.name == name), 0.0)
            b_val = next((c.normalized_value for c in b.component_breakdown if c.name == name), 0.0)
            decisive_descriptions.append(
                f"{name}: A={a_val:.3f} vs B={b_val:.3f} (+{d:.2f} pts contribution)"
            )

        mitigating_descriptions = []
        for name in mitigating:
            d = component_deltas[name]
            a_val = next((c.normalized_value for c in a.component_breakdown if c.name == name), 0.0)
            b_val = next((c.normalized_value for c in b.component_breakdown if c.name == name), 0.0)
            mitigating_descriptions.append(
                f"{name}: A={a_val:.3f} vs B={b_val:.3f} ({d:.2f} pts, B had the edge)"
            )

        return PairwiseAnalysis(
            journey_a_route_id=a.route_id,
            journey_b_route_id=b.route_id,
            score_delta=a.nx_score - b.nx_score,
            component_deltas=component_deltas,
            decisive_factors=decisive_descriptions,
            mitigating_factors=mitigating_descriptions,
        )
