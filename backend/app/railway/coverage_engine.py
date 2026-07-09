"""
Navix Coverage Intelligence Engine
===================================
Main logic for measuring dataset coverage, search query alignment,
transfer paths, data gaps, and future data import optimization recommendations.
Includes professional PDF and Excel builders for executives and analysts.
"""

import io
import logging
import datetime
from typing import List, Dict, Any, Set, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models import City, Station, NearbyStationMapping, Corridor, SearchLog, SearchCoverageLog
from app.railway.models_ext import RailwayTrain, RailwayTrainStop, RailwayDatasetImport
from app.graph.graph_builder import tkg

# PDF and Excel libraries
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side

logger = logging.getLogger("navix.coverage_engine")

# ──────────────────────────────────────────────────────────────────────────
# 0. Query Filtering Helpers
# ──────────────────────────────────────────────────────────────────────────

def apply_search_filters(query, filters: Dict[str, Any], db: Session):
    """Filters historical SearchCoverageLogs based on active dashboard settings."""
    if not filters:
        return query
    
    if filters.get("start_date"):
        try:
            sd = datetime.datetime.fromisoformat(filters["start_date"].replace("Z", "+00:00"))
            query = query.filter(SearchCoverageLog.timestamp >= sd)
        except Exception:
            pass
            
    if filters.get("end_date"):
        try:
            ed = datetime.datetime.fromisoformat(filters["end_date"].replace("Z", "+00:00"))
            query = query.filter(SearchCoverageLog.timestamp <= ed)
        except Exception:
            pass

    if filters.get("city"):
        query = query.filter((SearchCoverageLog.source == filters["city"]) | (SearchCoverageLog.destination == filters["city"]))

    if filters.get("state"):
        state_cities = db.query(City.city_name).filter(City.state == filters["state"]).all()
        state_city_names = [c[0] for c in state_cities]
        if state_city_names:
            query = query.filter((SearchCoverageLog.source.in_(state_city_names)) | (SearchCoverageLog.destination.in_(state_city_names)))
        else:
            query = query.filter(False)

    if filters.get("corridor"):
        parts = [p.strip() for p in filters["corridor"].split("->") if p.strip()]
        if len(parts) == 2:
            query = query.filter(SearchCoverageLog.source == parts[0], SearchCoverageLog.destination == parts[1])

    if filters.get("transport_mode"):
        # Real railway datasets currently cover only train modes
        if filters["transport_mode"].lower() != "train":
            query = query.filter(False)

    return query

def apply_station_filters(query, filters: Dict[str, Any], db: Session):
    """Filters stations listing based on active dashboard city/state parameters."""
    if not filters:
        return query
    if filters.get("city"):
        query = query.join(City).filter(City.city_name == filters["city"])
    if filters.get("state"):
        query = query.join(City).filter(City.state == filters["state"])
    return query

def apply_corridor_filters(query, filters: Dict[str, Any], db: Session):
    """Filters corridors lists based on active origin/dest inputs."""
    if not filters:
        return query
    if filters.get("city"):
        query = query.filter(
            Corridor.source_city.has(City.city_name == filters["city"]) |
            Corridor.destination_city.has(City.city_name == filters["city"])
        )
    if filters.get("state"):
        query = query.filter(
            Corridor.source_city.has(City.state == filters["state"]) |
            Corridor.destination_city.has(City.state == filters["state"])
        )
    if filters.get("corridor"):
        parts = [p.strip() for p in filters["corridor"].split("->") if p.strip()]
        if len(parts) == 2:
            query = query.filter(
                Corridor.source_city.has(City.city_name == parts[0]),
                Corridor.destination_city.has(City.city_name == parts[1])
            )
    return query

# ──────────────────────────────────────────────────────────────────────────
# 1. Dataset Coverage Metrics (Step 1)
# ──────────────────────────────────────────────────────────────────────────

def get_dataset_coverage_metrics(db: Session, filters: Dict[str, Any] = None) -> Dict[str, Any]:
    """Calculates dataset metrics and coverage rates supporting dashboard filters."""
    total_trains = db.query(RailwayTrain).count()
    total_stops = db.query(RailwayTrainStop).count()
    
    station_q = db.query(Station).filter_by(station_type="Rail")
    station_q = apply_station_filters(station_q, filters, db)
    total_stations = station_q.count()

    corridor_q = db.query(Corridor)
    corridor_q = apply_corridor_filters(corridor_q, filters, db)
    total_corridors = corridor_q.count()

    # Cities covered
    city_q = db.query(City).filter(
        City.id.in_(db.query(Station.city_id).filter_by(station_type="Rail"))
    )
    if filters and filters.get("city"):
        city_q = city_q.filter(City.city_name == filters["city"])
    if filters and filters.get("state"):
        city_q = city_q.filter(City.state == filters["state"])
    cities_covered = city_q.count()

    total_cities_q = db.query(City)
    if filters and filters.get("city"):
        total_cities_q = total_cities_q.filter(City.city_name == filters["city"])
    if filters and filters.get("state"):
        total_cities_q = total_cities_q.filter(City.state == filters["state"])
    total_cities = total_cities_q.count()
    
    city_coverage_pct = round(cities_covered / max(1, total_cities) * 100, 2)

    # Station coverage % (stations in selection that have stops timetables loaded)
    covered_stations_q = station_q.filter(
        Station.station_code.in_(db.query(RailwayTrainStop.station_code))
    )
    covered_stations = covered_stations_q.count()
    station_coverage_pct = round(covered_stations / max(1, total_stations) * 100, 2)

    # Corridor coverage %
    covered_corridors = 0
    filtered_corridors = corridor_q.all()
    for corr in filtered_corridors:
        src_stations = [s.station_code for s in corr.source_city.stations] if corr.source_city else []
        dest_stations = [s.station_code for s in corr.destination_city.stations] if corr.destination_city else []
        if src_stations and dest_stations:
            train_exists = db.query(RailwayTrainStop.train_id).filter(
                RailwayTrainStop.station_code.in_(src_stations),
                RailwayTrainStop.train_id.in_(
                    db.query(RailwayTrainStop.train_id).filter(RailwayTrainStop.station_code.in_(dest_stations))
                )
            ).first()
            if train_exists:
                covered_corridors += 1

    corridor_coverage_pct = round(covered_corridors / max(1, total_corridors) * 100, 2)

    # Completeness (stops / trains)
    trains_with_stops = db.query(RailwayTrainStop.train_id).distinct().count()
    completeness = round(trains_with_stops / max(1, total_trains) * 100, 2)

    # Last successful import
    last_import = db.query(RailwayDatasetImport).order_by(RailwayDatasetImport.import_date.desc()).first()
    last_import_date = last_import.import_date.isoformat() if last_import else None

    # Overall verified search coverage % from search analytics logs
    total_searches_q = db.query(SearchCoverageLog)
    total_searches_q = apply_search_filters(total_searches_q, filters, db)
    total_searches = total_searches_q.count()

    verified_searches_q = db.query(SearchCoverageLog).filter(
        SearchCoverageLog.classification.in_(["Fully Verified", "Partially Verified"])
    )
    verified_searches_q = apply_search_filters(verified_searches_q, filters, db)
    verified_searches = verified_searches_q.count()

    overall_search_coverage_pct = round(verified_searches / max(1, total_searches) * 100, 2) if total_searches > 0 else 0.0

    return {
        "total_trains": total_trains,
        "total_stops": total_stops,
        "total_stations": total_stations,
        "total_corridors": total_corridors,
        "cities_covered": cities_covered,
        "total_cities": total_cities,
        "city_coverage_pct": city_coverage_pct,
        "station_coverage_pct": station_coverage_pct,
        "corridor_coverage_pct": corridor_coverage_pct,
        "completeness_pct": completeness,
        "last_import_date": last_import_date,
        "dataset_freshness": "2024-Q1 (NDSAP License)",
        "overall_search_coverage_pct": overall_search_coverage_pct,
        "synthetic_fallback_pct": round(100.0 - overall_search_coverage_pct, 2)
    }

# ──────────────────────────────────────────────────────────────────────────
# 2. Search Coverage Analysis (Step 2)
# ──────────────────────────────────────────────────────────────────────────

def check_tkg_real_transfers(src_stations: List[str], dest_stations: List[str]) -> Tuple[bool, bool]:
    """Helper to check if there are 1-transfer or 2-transfer real rail connections in TKG."""
    one_transfer = False
    two_transfer = False

    for s_code in src_stations:
        start_node = f"Station:{s_code.upper()}"
        if start_node not in tkg.nodes:
            continue

        queue = [(start_node, 0)]
        visited = {start_node}

        while queue:
            curr, depth = queue.pop(0)

            if depth > 0 and curr.startswith("Station:") and curr.split(":")[1] in dest_stations:
                if depth == 2:
                    one_transfer = True
                elif depth == 3:
                    two_transfer = True

            if depth >= 3:
                continue

            for neighbor, edge_type, _ in tkg.edges.get(curr, []):
                if edge_type == "RAIL_SERVICE":
                    if neighbor not in visited:
                        visited.add(neighbor)
                        queue.append((neighbor, depth + 1))

    return one_transfer, two_transfer

def classify_and_log_search(db: Session, search_log_id: int, source: str, destination: str, date: str, routes: List[dict]):
    """Classifies search query coverage and saves analytics into search_coverage_logs."""
    try:
        from app.railway.provider import RailwayScheduleProvider
        provider = RailwayScheduleProvider()

        src_codes = list(provider._city_to_station_codes(source))
        dst_codes = list(provider._city_to_station_codes(destination))

        source_found = len(src_codes) > 0
        dest_found = len(dst_codes) > 0

        # Check if direct real train is returned in routes
        direct_real_exists = any(r.get("route_id", "").startswith("RAIL-") for r in routes)

        # Check transfer connections on Travel Network
        one_transfer_real = False
        two_transfer_real = False
        if not direct_real_exists and source_found and dest_found:
            one_transfer_real, two_transfer_real = check_tkg_real_transfers(src_codes, dst_codes)

        # Check if fallback used
        synthetic_fallback = False
        if not direct_real_exists:
            synthetic_fallback = any(r.get("route_id", "").startswith("NX-") and "Train" in r.get("transport_modes", []) for r in routes)

        # Score & Classification
        if direct_real_exists:
            score = 100.0
            classification = "Fully Verified"
        elif one_transfer_real:
            score = 75.0
            classification = "Partially Verified"
        elif two_transfer_real:
            score = 50.0
            classification = "Partially Verified"
        elif synthetic_fallback:
            score = 25.0
            classification = "Synthetic Assisted"
        else:
            score = 0.0
            classification = "Unsupported"

        # Write coverage log entry
        coverage_log = SearchCoverageLog(
            search_log_id=search_log_id,
            source=source,
            destination=destination,
            date=date,
            source_station_found=source_found,
            destination_station_found=dest_found,
            direct_real_exists=direct_real_exists,
            one_transfer_real_exists=one_transfer_real,
            two_transfer_real_exists=two_transfer_real,
            synthetic_fallback_used=synthetic_fallback,
            coverage_score=score,
            classification=classification
        )
        db.add(coverage_log)
        db.commit()

    except Exception as e:
        logger.error(f"Failed to log Search Coverage: {e}", exc_info=True)
        db.rollback()

# ──────────────────────────────────────────────────────────────────────────
# 3. Transfer Intelligence (Step 3)
# ──────────────────────────────────────────────────────────────────────────

def get_transfer_intelligence(db: Session, filters: Dict[str, Any] = None) -> Dict[str, Any]:
    """Measures connection topologies, hubs, reachable stations, and disconnected ones."""
    station_q = db.query(Station).filter_by(station_type="Rail")
    station_q = apply_station_filters(station_q, filters, db)
    stations = station_q.all()
    
    direct_connections_count = 0
    disconnected_stations = []
    
    for s in stations:
        s_node = f"Station:{s.station_code}"
        has_edge = False
        if s_node in tkg.edges:
            for neighbor, edge_type, _ in tkg.edges[s_node]:
                if edge_type == "RAIL_SERVICE":
                    has_edge = True
                    direct_connections_count += 1
                    
        if not has_edge:
            disconnected_stations.append({
                "code": s.station_code,
                "name": s.station_name,
                "city": s.city.city_name if s.city else "Orphaned"
            })

    # Find orphan stations
    orphan_q = db.query(Station).filter(Station.city_id == None)
    orphan_q = apply_station_filters(orphan_q, filters, db)
    orphan_stations = orphan_q.all()
    orphan_list = [{"code": s.station_code, "name": s.station_name} for s in orphan_stations]

    # Topological path sampling
    one_transfer_count = 0
    two_transfer_count = 0
    
    station_nodes = [f"Station:{s.station_code}" for s in stations if f"Station:{s.station_code}" in tkg.nodes]
    sampled_nodes = station_nodes[:40]
    for start in sampled_nodes:
        queue = [(start, 0)]
        visited = {start}
        while queue:
            curr, depth = queue.pop(0)
            if depth == 2:
                one_transfer_count += 1
            elif depth == 3:
                two_transfer_count += 1
                
            if depth >= 3:
                continue
                
            for neighbor, edge_type, _ in tkg.edges.get(curr, []):
                if edge_type == "RAIL_SERVICE" and neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, depth + 1))

    return {
        "direct_connections": direct_connections_count // 2,
        "sampled_one_transfer_paths": one_transfer_count,
        "sampled_two_transfer_paths": two_transfer_count,
        "disconnected_stations_count": len(disconnected_stations),
        "disconnected_stations": disconnected_stations[:15],
        "orphan_stations_count": len(orphan_list),
        "orphan_stations": orphan_list
    }

# ──────────────────────────────────────────────────────────────────────────
# 4. Corridor Intelligence & Data Gap (Step 4 & 5)
# ──────────────────────────────────────────────────────────────────────────

def get_corridor_intelligence(db: Session, filters: Dict[str, Any] = None) -> Dict[str, Any]:
    """Analyzes corridor listings, matching direct schedules and calculating coverages."""
    corridor_q = db.query(Corridor)
    corridor_q = apply_corridor_filters(corridor_q, filters, db)
    corridors = corridor_q.all()
    
    fully_covered = []
    partially_covered = []
    unsupported = []

    for corr in corridors:
        src_stations = [s.station_code for s in corr.source_city.stations] if corr.source_city else []
        dest_stations = [s.station_code for s in corr.destination_city.stations] if corr.destination_city else []

        if not src_stations or not dest_stations:
            unsupported.append(corr)
            continue

        has_direct = db.query(RailwayTrainStop.train_id).filter(
            RailwayTrainStop.station_code.in_(src_stations),
            RailwayTrainStop.train_id.in_(
                db.query(RailwayTrainStop.train_id).filter(RailwayTrainStop.station_code.in_(dest_stations))
            )
        ).first()

        if has_direct:
            fully_covered.append(corr)
        else:
            one_tr, two_tr = check_tkg_real_transfers(src_stations, dest_stations)
            if one_tr or two_tr:
                partially_covered.append(corr)
            else:
                unsupported.append(corr)

    demand_order = {"Extreme": 0, "High": 1, "Moderate": 2, "Low": 3}
    unsupported_sorted = sorted(unsupported, key=lambda c: demand_order.get(c.demand_level, 99))

    top_missing = []
    for c in unsupported_sorted[:15]:
        top_missing.append({
            "id": c.id,
            "source": c.source_city.city_name if c.source_city else "Unknown",
            "destination": c.destination_city.city_name if c.destination_city else "Unknown",
            "demand": c.demand_level,
            "estimated_impact": "High" if c.demand_level in ["Extreme", "High"] else "Medium"
        })

    return {
        "fully_covered_count": len(fully_covered),
        "partially_covered_count": len(partially_covered),
        "unsupported_count": len(unsupported),
        "top_missing_corridors": top_missing,
        "fully_covered_list": [{"source": c.source_city.city_name, "destination": c.destination_city.city_name, "demand": c.demand_level} for c in fully_covered],
        "partially_covered_list": [{"source": c.source_city.city_name, "destination": c.destination_city.city_name, "demand": c.demand_level} for c in partially_covered],
        "unsupported_list": [{"source": c.source_city.city_name, "destination": c.destination_city.city_name, "demand": c.demand_level} for c in unsupported]
    }

def get_data_gap_report(db: Session, filters: Dict[str, Any] = None) -> Dict[str, Any]:
    """Generates detailed lists of structural issues, unlinked items and schema gaps."""
    missing_stations_raw = db.query(RailwayTrainStop.station_code, RailwayTrainStop.station_name).filter(
        ~RailwayTrainStop.station_code.in_(db.query(Station.station_code))
    ).distinct().all()
    
    missing_stations = [{"code": r[0], "name": r[1]} for r in missing_stations_raw]

    if filters and filters.get("city"):
        city_stations = [s.station_code for s in db.query(Station.station_code).join(City).filter(City.city_name == filters["city"]).all()]
        missing_stations = [m for m in missing_stations if m["code"] in city_stations]

    missing_schedules_count = db.query(RailwayTrainStop).filter(
        (RailwayTrainStop.arrival_time == None) | (RailwayTrainStop.arrival_time == "") |
        (RailwayTrainStop.departure_time == None) | (RailwayTrainStop.departure_time == "")
    ).count()

    train_ids_with_stops = db.query(RailwayTrainStop.train_id).distinct()
    trains_missing_stops = db.query(RailwayTrain).filter(
        ~RailwayTrain.id.in_(train_ids_with_stops)
    ).all()
    
    missing_stops_list = [{"number": t.train_number, "name": t.train_name} for t in trains_missing_stops]

    invalid_mappings = db.query(NearbyStationMapping).filter(NearbyStationMapping.distance_km < 0).count()

    duplicates = db.query(
        RailwayTrainStop.train_id, RailwayTrainStop.station_code, func.count(RailwayTrainStop.id)
    ).group_by(
        RailwayTrainStop.train_id, RailwayTrainStop.station_code
    ).having(func.count(RailwayTrainStop.id) > 1).all()

    return {
        "missing_stations_count": len(missing_stations),
        "missing_stations": missing_stations[:25],
        "missing_schedules_count": missing_schedules_count,
        "trains_missing_stops_count": len(missing_stops_list),
        "trains_missing_stops": missing_stops_list[:25],
        "invalid_mappings_count": invalid_mappings,
        "duplicate_stops_count": len(duplicates)
    }

# ──────────────────────────────────────────────────────────────────────────
# 5. Optimization & Growth Simulator (Step 6)
# ──────────────────────────────────────────────────────────────────────────

def get_coverage_optimization_ranking(db: Session) -> List[Dict[str, Any]]:
    """Identifies imported trains with 0 stops and ranks them by estimated coverage impact."""
    train_ids_with_stops = db.query(RailwayTrainStop.train_id).distinct()
    unmapped_trains = db.query(RailwayTrain).filter(
        ~RailwayTrain.id.in_(train_ids_with_stops)
    ).all()

    rankings = []
    demand_weights = {"Extreme": 100, "High": 75, "Moderate": 40, "Low": 10}

    for t in unmapped_trains:
        src_station = db.query(Station).filter(Station.station_code.ilike(t.from_station_code)).first()
        dst_station = db.query(Station).filter(Station.station_code.ilike(t.to_station_code)).first()

        impact_score = 10
        corridor_demand = "Low"
        unlocked_corridor = f"{t.from_station_code} -> {t.to_station_code}"

        if src_station and dst_station and src_station.city_id and dst_station.city_id:
            corr = db.query(Corridor).filter_by(
                source_city_id=src_station.city_id,
                destination_city_id=dst_station.city_id
            ).first()
            if corr:
                corridor_demand = corr.demand_level
                impact_score = demand_weights.get(corr.demand_level, 10)
                src_city_name = src_station.city.city_name if src_station.city else "Unknown"
                dst_city_name = dst_station.city.city_name if dst_station.city else "Unknown"
                unlocked_corridor = f"{src_city_name} -> {dst_city_name}"

        rankings.append({
            "train_number": t.train_number,
            "train_name": t.train_name,
            "train_type": t.train_type or "Express",
            "unlocked_corridor": unlocked_corridor,
            "corridor_demand": corridor_demand,
            "unlocked_cities": 2,
            "unlocked_direct_journeys": 1,
            "unlocked_transfers_estimate": 8 if t.train_type in ["Rajdhani", "Shatabdi"] else 15,
            "impact_score": impact_score
        })

    return sorted(rankings, key=lambda r: r["impact_score"], reverse=True)

def simulate_coverage_growth(db: Session, train_numbers: List[str]) -> Dict[str, Any]:
    """Simulates coverage improvement if specified train numbers are fully imported/scheduled."""
    rankings = get_coverage_optimization_ranking(db)
    selected_trains = [r for r in rankings if r["train_number"] in train_numbers]
    
    total_unlocked_direct = len(selected_trains)
    total_unlocked_transfers = sum(t["unlocked_transfers_estimate"] for t in selected_trains)
    
    growth_estimate = 0.0
    for t in selected_trains:
        demand = t["corridor_demand"]
        if demand == "Extreme":
            growth_estimate += 2.5
        elif demand == "High":
            growth_estimate += 1.5
        elif demand == "Moderate":
            growth_estimate += 0.5
        else:
            growth_estimate += 0.1

    current_metrics = get_dataset_coverage_metrics(db)
    simulated_coverage = min(100.0, current_metrics["overall_search_coverage_pct"] + growth_estimate)

    return {
        "trains_simulated": len(train_numbers),
        "unlocked_direct_journeys": total_unlocked_direct,
        "unlocked_transfers_estimate": total_unlocked_transfers,
        "current_coverage_pct": current_metrics["overall_search_coverage_pct"],
        "simulated_coverage_pct": round(simulated_coverage, 2),
        "percentage_increase": round(simulated_coverage - current_metrics["overall_search_coverage_pct"], 2)
    }

# ──────────────────────────────────────────────────────────────────────────
# 6. Report Exporters (Excel & PDF)
# ──────────────────────────────────────────────────────────────────────────

def generate_coverage_excel(db: Session, filters: Dict[str, Any] = None) -> io.BytesIO:
    """Generates a detailed multi-tab Excel Workbook containing tabular coverage analytics."""
    metrics = get_dataset_coverage_metrics(db, filters)
    transfers = get_transfer_intelligence(db, filters)
    corridors = get_corridor_intelligence(db, filters)
    gaps = get_data_gap_report(db, filters)
    recs = get_coverage_optimization_ranking(db)[:25]

    wb = openpyxl.Workbook()
    
    header_fill = PatternFill(start_color="1F2937", end_color="1F2937", fill_type="solid")
    sub_fill = PatternFill(start_color="F3F4F6", end_color="F3F4F6", fill_type="solid")
    font_bold = Font(name="Calibri", size=11, bold=True)
    font_header = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    font_title = Font(name="Calibri", size=16, bold=True, color="1F2937")
    
    thin_border = Border(
        left=Side(style='thin', color='D1D5DB'),
        right=Side(style='thin', color='D1D5DB'),
        top=Side(style='thin', color='D1D5DB'),
        bottom=Side(style='thin', color='D1D5DB')
    )

    # Sheet 1: Executive Summary
    ws1 = wb.active
    ws1.title = "Executive Summary"
    ws1.views.sheetView[0].showGridLines = True
    
    ws1["A1"] = "NAVIX COVERAGE INTELLIGENCE EXECUTIVE SUMMARY"
    ws1["A1"].font = font_title
    
    ws1["A3"] = "Generated On:"
    ws1["B3"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ws1["A4"] = "Dataset Freshness:"
    ws1["B4"] = metrics["dataset_freshness"]
    
    for row in ["3", "4"]:
        ws1["A" + row].font = font_bold
        
    ws1["A6"] = "Key Coverage Metrics"
    ws1["A6"].font = Font(name="Calibri", size=13, bold=True)
    
    headers1 = ["Metric Indicator", "Value", "Baseline Interpretation"]
    ws1.append([])
    ws1.append(headers1)
    
    summary_data = [
        ["Overall Verified Search Coverage", f"{metrics['overall_search_coverage_pct']}%", "Direct schedule matches returned on queries"],
        ["Synthetic Fallback Rate", f"{metrics['synthetic_fallback_pct']}%", "Fallback synthetic routes generated"],
        ["Rail Station Coverage", f"{metrics['station_coverage_pct']}%", "Stations mapped to real timetables"],
        ["Dataset Completeness", f"{metrics['completeness_pct']}%", "Trains loaded with stop sequences"],
        ["Total Active Trains", metrics["total_trains"], "Total trains in database"],
        ["Total Mapped Stations", metrics["total_stations"], "Total rail stations in selected query"],
        ["Total Mapped Corridors", metrics["total_corridors"], "Total city pair corridors"],
    ]
    
    for rd in summary_data:
        ws1.append(rd)
        
    for col in range(1, 4):
        cell = ws1.cell(row=8, column=col)
        cell.font = font_header
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="left")
        
    for r in range(9, 16):
        for c in range(1, 4):
            cell = ws1.cell(row=r, column=c)
            cell.border = thin_border
            if c == 2:
                cell.font = font_bold
                cell.alignment = Alignment(horizontal="center")

    # Sheet 2: Corridor Coverage Detail
    ws2 = wb.create_sheet(title="Corridors Analysis")
    ws2.views.sheetView[0].showGridLines = True
    ws2.append(["City-Pair Corridor Coverage Details"])
    ws2["A1"].font = font_title
    ws2.append([])
    
    ws2.append(["Origin City", "Destination City", "Demand Level", "Coverage Status"])
    for corr_record in corridors["fully_covered_list"]:
        ws2.append([corr_record["source"], corr_record["destination"], corr_record["demand"], "Fully Covered"])
    for corr_record in corridors["partially_covered_list"]:
        ws2.append([corr_record["source"], corr_record["destination"], corr_record["demand"], "Partially Covered (Transfer)"])
    for corr_record in corridors["unsupported_list"]:
        ws2.append([corr_record["source"], corr_record["destination"], corr_record["demand"], "Unsupported (Synthetic Fallback)"])
        
    for col in range(1, 5):
        cell = ws2.cell(row=3, column=col)
        cell.font = font_header
        cell.fill = header_fill
        
    for r in range(4, ws2.max_row + 1):
        for c in range(1, 5):
            cell = ws2.cell(row=r, column=c)
            cell.border = thin_border
            if c == 4:
                status_val = cell.value
                if "Fully" in status_val:
                    cell.fill = PatternFill(start_color="D1FAE5", end_color="D1FAE5", fill_type="solid")
                elif "Partially" in status_val:
                    cell.fill = PatternFill(start_color="FEF3C7", end_color="FEF3C7", fill_type="solid")
                else:
                    cell.fill = PatternFill(start_color="FEE2E2", end_color="FEE2E2", fill_type="solid")

    # Sheet 3: Gaps & Data Quality
    ws3 = wb.create_sheet(title="Data Quality Gaps")
    ws3.views.sheetView[0].showGridLines = True
    ws3.append(["Structural Data Gap Analysis"])
    ws3["A1"].font = font_title
    ws3.append([])
    
    ws3.append(["Quality Checker Metrics", "Record Count"])
    ws3.append(["Unlinked Station Codes (referenced in stops but missing in Stations table)", gaps["missing_stations_count"]])
    ws3.append(["Trains Missing Schedule Stop Records (0 stops)", gaps["trains_missing_stops_count"]])
    ws3.append(["Stop Timetable Records Missing Times", gaps["missing_schedules_count"]])
    ws3.append(["Duplicate Station Stop Entries", gaps["duplicate_stops_count"]])
    ws3.append(["Negative Nearby Distance Mappings", gaps["invalid_mappings_count"]])
    
    for col in range(1, 3):
        cell = ws3.cell(row=3, column=col)
        cell.font = font_header
        cell.fill = header_fill
        
    for r in range(4, 9):
        for c in range(1, 3):
            cell = ws3.cell(row=r, column=c)
            cell.border = thin_border
            if c == 2:
                cell.font = font_bold
                cell.alignment = Alignment(horizontal="center")

    # Sheet 4: Optimization Recommendations
    ws4 = wb.create_sheet(title="Next Datasets Priority")
    ws4.views.sheetView[0].showGridLines = True
    ws4.append(["Candidate Schedules Ranked by Search Coverage Impact"])
    ws4["A1"].font = font_title
    ws4.append([])
    
    ws4.append(["Train Number", "Train Name", "Corridor Target", "Demand Level", "Unlocks Transfer Estimate", "Acquisition Impact Score"])
    for r in recs:
        ws4.append([
            r["train_number"], r["train_name"], r["unlocked_corridor"],
            r["corridor_demand"], r["unlocked_transfers_estimate"], r["impact_score"]
        ])
        
    for col in range(1, 7):
        cell = ws4.cell(row=3, column=col)
        cell.font = font_header
        cell.fill = header_fill
        
    for r in range(4, ws4.max_row + 1):
        for c in range(1, 7):
            cell = ws4.cell(row=r, column=c)
            cell.border = thin_border
            if c == 6:
                cell.font = font_bold
                cell.alignment = Alignment(horizontal="center")
                cell.fill = PatternFill(start_color="EEF2FF", end_color="EEF2FF", fill_type="solid")

    for ws in [ws1, ws2, ws3, ws4]:
        for col in ws.columns:
            max_len = max(len(str(cell.value or '')) for cell in col)
            col_letter = openpyxl.utils.get_column_letter(col[0].column)
            ws.column_dimensions[col_letter].width = max(max_len + 3, 12)

    out = io.BytesIO()
    wb.save(out)
    out.seek(0)
    return out

def generate_coverage_pdf(db: Session, filters: Dict[str, Any] = None) -> io.BytesIO:
    """Generates a professional executive PDF summary report with charts and metadata."""
    metrics = get_dataset_coverage_metrics(db, filters)
    transfers = get_transfer_intelligence(db, filters)
    corridors = get_corridor_intelligence(db, filters)
    gaps = get_data_gap_report(db, filters)
    recs = get_coverage_optimization_ranking(db)[:5]

    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        pdf_buffer,
        pagesize=letter,
        leftMargin=54, rightMargin=54,
        topMargin=54, bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1f2937'),
        spaceAfter=15
    )
    
    section_title_style = ParagraphStyle(
        'SecTitle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#4f46e5'),
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'ReportBody',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#374151')
    )

    bold_body_style = ParagraphStyle(
        'ReportBodyBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    header_style = ParagraphStyle(
        'TableHeader',
        parent=body_style,
        fontName='Helvetica-Bold',
        textColor=colors.white
    )

    story = []

    story.append(Paragraph("NAVIX COVERAGE INTELLIGENCE REPORT", title_style))
    story.append(Paragraph("<b>Executive Data Governance Summary</b>", body_style))
    story.append(Spacer(1, 10))

    meta_data = [
        [Paragraph("<b>Generated On:</b>", body_style), Paragraph(datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"), body_style),
         Paragraph("<b>Dataset Version:</b>", body_style), Paragraph(metrics["dataset_freshness"], body_style)],
        [Paragraph("<b>Verified Search Coverage:</b>", body_style), Paragraph(f"<b>{metrics['overall_search_coverage_pct']}%</b>", body_style),
         Paragraph("<b>Total Searchable Corridors:</b>", body_style), Paragraph(str(metrics["total_corridors"]), body_style)]
    ]
    meta_table = Table(meta_data, colWidths=[150, 100, 120, 130])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f9fafb')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#e5e7eb')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 15))

    story.append(Paragraph("Current Coverage Dashboard Metrics", section_title_style))
    pct_val = metrics['overall_search_coverage_pct']
    
    progress_table = Table([['', '']], colWidths=[max(1, pct_val * 4.9), max(1, (100 - pct_val) * 4.9)], rowHeights=[10])
    progress_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), colors.HexColor('#4f46e5')),
        ('BACKGROUND', (1,0), (1,0), colors.HexColor('#e5e7eb')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    
    metrics_table_data = [
        [Paragraph("<b>Indicator</b>", bold_body_style), Paragraph("<b>Rate / Status</b>", bold_body_style), Paragraph("<b>Visual Progression (Coverage %)</b>", bold_body_style)],
        [Paragraph("Overall Verified Search Coverage", body_style), Paragraph(f"{pct_val}%", bold_body_style), progress_table],
        [Paragraph("Synthetic Fallback Rate", body_style), Paragraph(f"{metrics['synthetic_fallback_pct']}%", body_style), Paragraph("Fallback routes used to satisfy missing coverage", body_style)],
        [Paragraph("Rail Station Schedule Coverage", body_style), Paragraph(f"{metrics['station_coverage_pct']}%", body_style), Paragraph(f"{metrics['total_stations']} Rail stations mapped", body_style)],
        [Paragraph("Corridor Coverage", body_style), Paragraph(f"{metrics['corridor_coverage_pct']}%", body_style), Paragraph(f"{metrics['total_corridors']} city-pairs listed", body_style)]
    ]
    metrics_table = Table(metrics_table_data, colWidths=[180, 80, 244])
    metrics_table.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,0), 1, colors.HexColor('#cbd5e1')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LINEBELOW', (0,1), (-1,-1), 0.5, colors.HexColor('#f1f5f9')),
    ]))
    story.append(metrics_table)
    story.append(Spacer(1, 15))

    story.append(Paragraph("Transfer & Network Topology Intelligence", section_title_style))
    topo_data = [
        [Paragraph("<b>Direct Active Pathways</b>", bold_body_style), Paragraph(str(transfers["direct_connections"]), body_style),
         Paragraph("<b>Disconnected Stations</b>", bold_body_style), Paragraph(str(transfers["disconnected_stations_count"]), body_style)],
        [Paragraph("<b>Sampled 1-Transfer Connections</b>", bold_body_style), Paragraph(str(transfers["sampled_one_transfer_paths"]), body_style),
         Paragraph("<b>Orphan Stations (No City)</b>", bold_body_style), Paragraph(str(transfers["orphan_stations_count"]), body_style)]
    ]
    topo_table = Table(topo_data, colWidths=[180, 70, 180, 74])
    topo_table.setStyle(TableStyle([
        ('PADDING', (0,0), (-1,-1), 6),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#e5e7eb')),
        ('LINEBELOW', (0,0), (-1,0), 0.5, colors.HexColor('#e5e7eb')),
        ('LINEAFTER', (1,0), (1,-1), 0.5, colors.HexColor('#e5e7eb')),
    ]))
    story.append(topo_table)
    story.append(Spacer(1, 15))

    story.append(Paragraph("Structural Data Gaps & Health Checks", section_title_style))
    gap_data = [
        [Paragraph("<b>Gap Indicator Metric</b>", bold_body_style), Paragraph("<b>Gaps Identified</b>", bold_body_style)],
        [Paragraph("Unlinked Station Codes (missing in main station nodes)", body_style), Paragraph(str(gaps["missing_stations_count"]), body_style)],
        [Paragraph("Imported Trains with 0 stops (Missing sequences)", body_style), Paragraph(str(gaps["trains_missing_stops_count"]), body_style)],
        [Paragraph("Missing stop timetable schedules (Empty times)", body_style), Paragraph(str(gaps["missing_schedules_count"]), body_style)],
        [Paragraph("Duplicate stop sequence indexes", body_style), Paragraph(str(gaps["duplicate_stops_count"]), body_style)]
    ]
    gap_table = Table(gap_data, colWidths=[360, 144])
    gap_table.setStyle(TableStyle([
        ('PADDING', (0,0), (-1,-1), 6),
        ('LINEBELOW', (0,0), (-1,0), 1, colors.HexColor('#cbd5e1')),
        ('LINEBELOW', (0,1), (-1,-1), 0.5, colors.HexColor('#f1f5f9')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(gap_table)
    story.append(Spacer(1, 15))

    story.append(Paragraph("Top Priority Dataset Acquisition Recommendations", section_title_style))
    rec_headers = [Paragraph("<b>Train #</b>", header_style), Paragraph("<b>Train Name</b>", header_style), Paragraph("<b>Target Corridor</b>", header_style), Paragraph("<b>Score</b>", header_style)]
    rec_rows = [rec_headers]
    for r in recs:
        rec_rows.append([
            Paragraph(r["train_number"], body_style),
            Paragraph(r["train_name"], body_style),
            Paragraph(f"{r['unlocked_corridor']} ({r['corridor_demand']})", body_style),
            Paragraph(str(r["impact_score"]), bold_body_style)
        ])
    
    rec_table = Table(rec_rows, colWidths=[60, 150, 234, 60])
    rec_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1f2937')),
        ('PADDING', (0,0), (-1,-1), 5),
        ('LINEBELOW', (0,1), (-1,-1), 0.5, colors.HexColor('#e5e7eb')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(rec_table)

    doc.build(story)
    pdf_buffer.seek(0)
    return pdf_buffer
