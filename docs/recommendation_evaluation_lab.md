# Navix Recommendation Evaluation Lab
## Engineering Report — Phase 5 (Internal Only)

> **Scope**: This document describes the internal Recommendation Evaluation Lab.  
> **Audience**: Navix backend engineers and recommendation quality reviewers.  
> **Production Impact**: Zero — no production scoring logic, APIs, or frontend behavior is modified.

---

## 1. Overview

The **Recommendation Evaluation Lab** is an internal engineering framework that exposes full transparency into how each journey receives its NX Score. It enables engineers to:

- **Debug** anomalous recommendation rankings
- **Calibrate** component weights and penalty thresholds
- **Audit** the full scoring pipeline from raw data to final integer score
- **Compare** multiple journeys and explain exactly why one outranked another

The lab operates as a read-only audit layer on top of the production scoring engine. It never modifies Journey objects, NX Score values, or any public search API behavior.

---

## 2. Evaluation Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Production Search Pipeline                        │
│  Provider → Journeys → calculate_smart_scores() → Ranked Results    │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ (read-only copy)
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  Recommendation Evaluation Lab                        │
│                                                                       │
│  ┌────────────────┐  ┌──────────────────┐  ┌───────────────────┐    │
│  │ EvaluationLab  │  │ JourneyComparator│  │  TraceEngine      │    │
│  │                │  │                  │  │                   │    │
│  │ • Re-sanitizes │  │ • Ranking table  │  │ • 5-step pipeline │    │
│  │   metrics      │  │ • Score distrib. │  │ • Step-by-step    │    │
│  │ • Re-builds    │  │ • Strengths /    │  │   I/O at each     │    │
│  │   norm ranges  │  │   weaknesses     │  │   computation     │    │
│  │ • Reads comp   │  │ • Pairwise       │  │   stage           │    │
│  │   from journey │  │   analysis       │  │                   │    │
│  │                │  │                  │  │                   │    │
│  └───────┬────────┘  └────────┬─────────┘  └────────┬──────────┘    │
│          │                   │                      │                │
│          ▼                   ▼                      ▼                │
│  RecommendationScorecard  ComparisonResult  RecommendationTrace      │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
              /admin/eval-lab/* (Internal API Endpoints)
```

### Module Structure

```
backend/app/evaluation/
├── __init__.py        # Public surface: exports EvaluationLab, JourneyComparator, TraceEngine
├── models.py          # Data contracts (dataclasses)
├── evaluator.py       # EvaluationLab class
├── comparator.py      # JourneyComparator class
└── trace.py           # TraceEngine class
```

---

## 3. Score Computation Flow

The NX Score is computed in 4 phases by `calculate_smart_scores()` in `services.py`:

### Phase 1 — Sanitization

Raw journey metrics are sanitized with conservative fallbacks and an `incomplete_penalty` is accumulated for each missing field:

| Missing Field       | Fallback         | Penalty |
|---------------------|------------------|---------|
| Departure/Arrival time | `--:--` treated as missing | +15 pts |
| Price ≤ 0           | 10,000 INR       | +15 pts |
| Duration ≤ 0        | 1,440 min        | +15 pts |
| Comfort score       | 30.0             | +10 pts |
| Seat likelihood     | 20.0             | +10 pts |

### Phase 2 — Normalization

Each sanitized metric is min-max normalized against the **full search cohort**:

```
normalize(val, min_val, max_val, invert?, min_span?, default_bounds?)
```

Key contracts:
- `invert=True` means lower raw value → higher normalized score (used for price and duration)
- `min_span` prevents degenerate normalization when all journeys have identical values
- `default_bounds` provides absolute fallback when the cohort span is still zero

### Phase 3 — Seven Semantic Component Scores

`ComponentCalculator.compute()` combines normalized scalars into 7 semantic components:

| Component | Formula | Config Weight |
|-----------|---------|---------------|
| **Journey Value** | `p_norm×0.45 + d_norm×0.35 + c_norm×0.20` | `WEIGHT_PRICE + WEIGHT_DURATION` = 0.25 |
| **Booking Confidence** | `s_norm×0.60 + conf_bonus(up to +0.20) + s_norm×0.20 − WL_penalty(−0.15)` | `WEIGHT_SEAT + WEIGHT_AVAILABILITY` = 0.20 |
| **Journey Simplicity** | `t_norm` | `WEIGHT_TRANSFERS` = 0.15 |
| **Timing Convenience** | `f_norm` | `WEIGHT_FRICTION` = 0.20 |
| **Physical Comfort** | `c_norm×0.75 + mode_geometric_mean×0.25` | `WEIGHT_COMFORT` = 0.20 |
| **Schedule Reliability** | `route_trust×0.60 + mode_harmonic_punctuality×0.40` | `WEIGHT_RELIABILITY` = 0.0 *(Sprint 3)* |
| **Information Integrity** | `1.0 − (penalty/50), clamped to [0.10, 1.0]` | `WEIGHT_INTEGRITY` = 0.0 *(Sprint 3)* |

### Phase 4 — NX Score Assembly

```python
gross_score_pct = sum(comp_score × weight for each component) × 100
nx_score = max(0, min(100, round(gross_score_pct) − incomplete_penalty))
```

---

## 4. Score Trace Pipeline (5 Steps)

`TraceEngine.trace(journey, sanitized, ranges)` generates a complete 5-step audit trace:

### Step 1 — Raw Data Ingestion & Sanitization
**Inputs**: Raw Journey object (route_id, times, price, legs, availability)  
**Outputs**: Sanitized metric values, friction_score, incomplete_penalty accumulated  
**Notes**: Documents every fallback applied

### Step 2 — Normalization & Component Calculations
**Inputs**: Sanitized metrics, population-level normalization bounds  
**Outputs**: All 6 intermediate normalized scalars (p_norm, d_norm, c_norm, t_norm, s_norm, f_norm) and all 7 component scores  
**Notes**: Component formulas explained

### Step 3 — Penalties & Bonuses
**Inputs**: incomplete_penalty, waitlist_code, confirmation_probability  
**Outputs**: incomplete data deduction, confirmation bonus, WL penalty adjustments  
**Notes**: Clarifies which adjustments apply to final score vs. component scores

### Step 4 — Weighted Contributions Assembly
**Inputs**: 7 component scores, config weights  
**Outputs**: Per-component weighted contribution points and gross score  
**Notes**: Formula per component: `normalized × weight × 100`

### Step 5 — Final NX Score Assembly
**Inputs**: Gross score, incomplete_penalty  
**Outputs**: gross_rounded, after_penalty, clamped final score  
**Notes**: `max(0, min(100, round(gross) − incomplete_penalty))`

---

## 5. Internal API Endpoints

All endpoints are under `/admin/eval-lab/` and are available only through the admin router.

### `POST /admin/eval-lab/evaluate`

Fetches journeys for a corridor, runs production scoring, and returns full scorecards.

**Request:**
```json
{
  "source": "DELHI",
  "destination": "MUMBAI"
}
```

**Response** (abbreviated):
```json
{
  "success": true,
  "cohort_size": 5,
  "scorecards": [
    {
      "route_id": "RAIL-12345",
      "nx_score": 78,
      "ranking_position": 1,
      "component_breakdown": [
        {
          "name": "Journey Value",
          "raw_value": 1500.0,
          "raw_label": "INR 1,500  |  480 min",
          "normalized_value": 0.7812,
          "component_weight": 0.25,
          "weighted_contribution": 0.1953,
          "weighted_contribution_pts": 19.53,
          "status": "strong"
        }
        // ... 6 more components
      ],
      "normalization_details": { ... },
      "penalties_applied": [ ... ],
      "bonuses_applied": [ ... ]
    }
  ]
}
```

---

### `POST /admin/eval-lab/compare`

Returns ranking table, score distribution, strengths/weaknesses, and pairwise "Why A beat B" analysis.

**Response** (abbreviated):
```json
{
  "comparison": {
    "ranking_table": [
      { "rank": 1, "route_id": "RAIL-12345", "nx_score": 78, ... }
    ],
    "score_distribution": {
      "min_score": 42, "max_score": 78,
      "mean_score": 61.4, "median_score": 63.0, "std_dev": 14.2,
      "cohort_size": 5
    },
    "strongest_strengths": {
      "RAIL-12345": "Booking Confidence",
      "NX-98765":   "Journey Value"
    },
    "weakest_components": {
      "RAIL-12345": "Schedule Reliability",
      "NX-98765":   "Physical Comfort"
    },
    "pairwise_analysis": [
      {
        "journey_a": "RAIL-12345",
        "journey_b": "RAIL-67890",
        "score_delta": 12,
        "component_deltas": {
          "Journey Value": 3.12,
          "Booking Confidence": 8.40,
          "Timing Convenience": -1.20
        },
        "decisive_factors": [
          "Booking Confidence: A=0.9200 vs B=0.4800 (+8.40 pts contribution)"
        ],
        "mitigating_factors": [
          "Timing Convenience: A=0.6100 vs B=0.7200 (-1.20 pts, B had the edge)"
        ]
      }
    ]
  }
}
```

---

### `GET /admin/eval-lab/trace/{route_id}?source=DELHI&destination=MUMBAI`

Returns the complete 5-step audit trace for one journey.

**Response** (abbreviated):
```json
{
  "route_id": "RAIL-12345",
  "final_nx_score": 78,
  "summary": "Journey 'RAIL-12345' scored 78/100. Gross weighted score ≈ 80.0 pts. Incomplete penalty: −0 pts. Final NX Score: 78.",
  "steps": [
    { "step_number": 1, "step_name": "Raw Data Ingestion & Sanitization", ... },
    { "step_number": 2, "step_name": "Normalization & Component Calculations", ... },
    { "step_number": 3, "step_name": "Penalties & Bonuses", ... },
    { "step_number": 4, "step_name": "Weighted Contributions Assembly", ... },
    { "step_number": 5, "step_name": "Final NX Score Assembly", ... }
  ]
}
```

---

## 6. Calibration Opportunities

### 6.1 Component Weights

Current active weights in `config.py`:

| Component | Current Weight | Notes |
|-----------|---------------|-------|
| Journey Value | 0.25 | WEIGHT_PRICE(0.15) + WEIGHT_DURATION(0.10) |
| Booking Confidence | 0.20 | WEIGHT_SEAT(0.15) + WEIGHT_AVAILABILITY(0.05) |
| Journey Simplicity | 0.15 | WEIGHT_TRANSFERS |
| Timing Convenience | 0.20 | WEIGHT_FRICTION |
| Physical Comfort | 0.20 | WEIGHT_COMFORT |
| Schedule Reliability | **0.0** | Reserved Sprint 3 |
| Information Integrity | **0.0** | Reserved Sprint 3 |

**Calibration levers**: Adjust `WEIGHT_*` constants in `config.py` and use `POST /admin/eval-lab/compare` to observe score distribution changes. Total active weights sum to 1.0.

### 6.2 Penalty Thresholds

Incomplete data penalty values (in `services.py`) are calibrated at:
- Missing time: +15 pts
- Missing/zero price: +15 pts
- Missing/zero duration: +15 pts
- Missing comfort: +10 pts
- Missing seat: +10 pts
- Maximum penalty cap: 50 pts → minimum `information_integrity` = 0.10

To increase penalty severity for incomplete data, raise the individual values (keeping max cap at 50).

### 6.3 Friction Penalty Thresholds

In `services.py → calculate_friction_penalty()`:
- Long layover (>180 min): +25
- Medium layover (90–180 min): +15
- Short layover (<40 min): +10
- Overnight transfer: +20
- Very early departure (<06:00): +12
- Late night arrival (≥23:00 or <04:00): +12

Use `GET /admin/eval-lab/trace/{route_id}` to observe exactly how friction penalties flow through `f_norm → timing_convenience → weighted contribution`.

### 6.4 Booking Confidence Adjustments

- Confirmation probability bonus: `conf_prob/100 × 0.20` (up to +0.20)
- Waitlist penalty: −0.15 (flat, regardless of WL depth)

To make waitlist penalties proportional to WL depth, modify `_booking_confidence()` in `components.py` (note: this would be a production change — must be tested against the full component test suite).

---

## 7. Future Extension Points

### 7.1 Sprint 3 — Schedule Reliability & Information Integrity Activation

`WEIGHT_RELIABILITY` and `WEIGHT_INTEGRITY` are currently 0.0 (reserved). To activate them:
1. Set `WEIGHT_RELIABILITY = 0.08` and `WEIGHT_INTEGRITY = 0.05` in `config.py`
2. Compensate by reducing `WEIGHT_SEAT` or `WEIGHT_AVAILABILITY` to keep total = 1.0
3. Run the evaluation lab comparison before/after to measure ranking shifts

### 7.2 Historical Reliability Data

Currently `schedule_reliability` uses static route-type signals (RAIL- vs. NX-) and mode punctuality baselines. Once historical on-time performance data is available:
- Replace `ComponentCalculator._schedule_reliability()` with a data-driven lookup
- The evaluation lab's trace will automatically expose the new reliability inputs

### 7.3 Persona-Aware Scoring

Sprint 3 will introduce persona-specific weight profiles (budget traveler, business traveler, family). The evaluation lab can support persona testing by:
1. Creating a `PersonaConfig` dataclass with persona-specific weights
2. Passing it to `EvaluationLab.evaluate(journeys, persona=PersonaConfig(...))`
3. Using `compare` to diff persona A vs. persona B rankings on the same corridor

### 7.4 ML Feedback Loop

Future integration point: once user booking decisions are collected, the evaluation lab can be used to:
1. Load a historical scored cohort alongside actual booking outcomes
2. Identify which component scores correlate with booking success
3. Surface calibration recommendations to the recommendation team

### 7.5 Automated Regression Testing

The `test_evaluation_lab.py` invariance tests already guarantee that scorecard scores match production. This test suite can be extended to:
- Test every known route corridor against a golden scorecard snapshot
- Alert on scoring drift between releases via CI/CD integration

---

## 8. Production Safety Guarantees

| Guarantee | Implementation |
|-----------|---------------|
| Zero scoring change | `EvaluationLab.evaluate()` calls `calculate_smart_scores()` exactly once; no re-scoring |
| No Journey mutation | All intermediate values re-derived in read-only local variables |
| Mathematical identity | `scorecard.nx_score == journey.nx_score` enforced by `TestInvariance` test class |
| Isolation from search API | All eval-lab endpoints mounted under `/admin/eval-lab/` with no shared state |
| No frontend impact | Evaluation lab is backend-only; no frontend code is touched |
