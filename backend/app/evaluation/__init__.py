"""
app/evaluation/__init__.py
==========================
Phase 5 — Recommendation Evaluation Lab (Internal Only)

Public surface of the internal evaluation framework.

Usage:
    from app.evaluation import EvaluationLab, JourneyComparator, TraceEngine

These classes operate as a read-only audit layer on top of the production
scoring engine. They NEVER modify Journey objects or NX Score values.
"""

from app.evaluation.evaluator import EvaluationLab
from app.evaluation.comparator import JourneyComparator
from app.evaluation.trace import TraceEngine
from app.evaluation.models import (
    RecommendationScorecard,
    ComparisonResult,
    RecommendationTrace,
    ComponentDetail,
    PenaltyDetail,
    BonusDetail,
    NormalizationDetails,
    ScoreDistribution,
    PairwiseAnalysis,
)

__all__ = [
    "EvaluationLab",
    "JourneyComparator",
    "TraceEngine",
    "RecommendationScorecard",
    "ComparisonResult",
    "RecommendationTrace",
    "ComponentDetail",
    "PenaltyDetail",
    "BonusDetail",
    "NormalizationDetails",
    "ScoreDistribution",
    "PairwiseAnalysis",
]
