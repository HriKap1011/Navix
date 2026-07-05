"""
Indian Railways Dataset Importer
=================================
Source  : Indian Railways Train Time Table
License : Open Government Data License India v1.0 (NDSAP)
URL     : https://data.gov.in/catalog/indian-railway-train-time-table

Reads two CSV files from  data/railway/:
  trains.csv      — one row per train
  train_stops.csv — one row per station stop per train

Validates every record before insert. Upserts by train_number and
(train_id, stop_number) so re-running is safe (idempotent).

Call run_import(db) directly from Python, or use the FastAPI POST
/admin/railway/import endpoint, or the standalone CLI script.
"""

import csv
import logging
import os
import datetime
from pathlib import Path
from typing import List, Dict, Set, Tuple

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.railway.models_ext import RailwayTrain, RailwayTrainStop, RailwayDatasetImport
from app.railway.validator import (
    validate_train_number, validate_station_code, validate_time,
    validate_distance, check_timing_anomaly, normalize_time,
    normalize_running_days, is_station_linked
)

logger = logging.getLogger("navix.railway.importer")

# Resolve data directory relative to this file
_HERE = Path(__file__).parent
DATA_DIR = _HERE.parent.parent / "data" / "railway"

DATASET_NAME    = "Indian Railways Train Time Table"
DATASET_VERSION = "2024-Q1"
SOURCE_URL      = "https://data.gov.in/catalog/indian-railway-train-time-table"
LICENSE         = "Open Government Data License India v1.0 (NDSAP)"


def _load_known_station_codes(db: Session) -> Set[str]:
    """Load all station codes from the Navix stations table."""
    from app.models import Station
    rows = db.query(Station.station_code).all()
    return {r[0].upper() for r in rows}


def _read_trains_csv(path: Path) -> List[Dict]:
    if not path.exists():
        raise FileNotFoundError(f"trains.csv not found at {path}")
    rows = []
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append({k.strip(): v.strip() for k, v in row.items()})
    return rows


def _read_stops_csv(path: Path) -> Dict[str, List[Dict]]:
    """Returns a dict keyed by train_number → list of stop dicts."""
    if not path.exists():
        raise FileNotFoundError(f"train_stops.csv not found at {path}")
    by_train: Dict[str, List[Dict]] = {}
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            r = {k.strip(): v.strip() for k, v in row.items()}
            tn = r.get("train_number", "").strip()
            if tn:
                by_train.setdefault(tn, []).append(r)
    return by_train


def run_import(db: Session, force: bool = False) -> Dict:
    """
    Main entry point.  Returns a summary dict.
    If force=False, skips the import when railway_trains already has records.
    """
    existing_count = db.query(func.count(RailwayTrain.id)).scalar()
    if existing_count > 0 and not force:
        logger.info(f"Railway data already present ({existing_count} trains). Skipping import (use force=True to re-import).")
        return {
            "success": True, "skipped": True,
            "trains_imported": 0, "stops_imported": 0,
            "trains_skipped": 0, "validation_issues": 0, "issues": [],
            "message": f"Skipped — {existing_count} trains already in DB. Use force=True to re-import."
        }

    logger.info("Starting Indian Railways dataset import …")

    known_codes = _load_known_station_codes(db)

    trains_csv  = DATA_DIR / "trains.csv"
    stops_csv   = DATA_DIR / "train_stops.csv"

    train_rows = _read_trains_csv(trains_csv)
    stops_by_train = _read_stops_csv(stops_csv)

    # Create an import record first (so we have an FK)
    import_record = RailwayDatasetImport(
        dataset_name    = DATASET_NAME,
        dataset_version = DATASET_VERSION,
        source_url      = SOURCE_URL,
        license         = LICENSE,
        import_date     = datetime.datetime.utcnow(),
        status          = "RUNNING"
    )
    db.add(import_record)
    db.flush()   # get import_record.id without committing

    trains_imported = 0
    stops_imported  = 0
    trains_skipped  = 0
    issues: List[str] = []
    issue_count = 0

    seen_train_numbers: Set[str] = set()

    for row in train_rows:
        train_number = row.get("train_number", "").strip()
        train_name   = row.get("train_name", "").strip() or train_number

        # ---- Validate train number ----
        ok, code, detail = validate_train_number(train_number)
        if not ok:
            issues.append(f"[SKIP] {detail}")
            trains_skipped += 1
            issue_count += 1
            continue

        # ---- Duplicate check ----
        if train_number in seen_train_numbers:
            issues.append(f"[SKIP] DUPLICATE_TRAIN {train_number}")
            trains_skipped += 1
            issue_count += 1
            continue

        # Duplicate in DB?
        existing = db.query(RailwayTrain).filter_by(train_number=train_number).first()
        if existing and not force:
            seen_train_numbers.add(train_number)
            trains_skipped += 1
            continue

        from_code = row.get("from_station_code", "").strip().upper()
        to_code   = row.get("to_station_code",   "").strip().upper()
        from_name = row.get("from_station_name", from_code)
        to_name   = row.get("to_station_name",   to_code)

        ok_f, c_f, d_f = validate_station_code(from_code)
        ok_t, c_t, d_t = validate_station_code(to_code)
        if not ok_f:
            issues.append(f"[WARN] Train {train_number}: {d_f}")
            issue_count += 1
        if not ok_t:
            issues.append(f"[WARN] Train {train_number}: {d_t}")
            issue_count += 1

        running_days = normalize_running_days(row.get("running_days", "Daily"))
        train_type   = row.get("train_type", "").strip() or "Express"
        zone         = row.get("zone", "").strip()

        try:
            total_dist = float(row.get("total_distance_km", 0) or 0)
        except ValueError:
            total_dist = 0.0
            issues.append(f"[WARN] Train {train_number}: invalid total_distance")
            issue_count += 1

        src_linked  = is_station_linked(from_code, known_codes)
        dest_linked = is_station_linked(to_code, known_codes)

        if not src_linked:
            issues.append(f"[INFO] Train {train_number}: source {from_code} not in Navix stations")
        if not dest_linked:
            issues.append(f"[INFO] Train {train_number}: destination {to_code} not in Navix stations")

        # ---- Upsert train ----
        if existing and force:
            # Update existing record
            existing.train_name        = train_name
            existing.train_type        = train_type
            existing.zone              = zone
            existing.from_station_code = from_code
            existing.from_station_name = from_name
            existing.to_station_code   = to_code
            existing.to_station_name   = to_name
            existing.running_days      = running_days
            existing.total_distance_km = total_dist
            existing.source_linked     = src_linked
            existing.destination_linked= dest_linked
            existing.dataset_import_id = import_record.id
            db.flush()
            train_obj = existing
            # Delete old stops so they can be re-inserted
            db.query(RailwayTrainStop).filter_by(train_id=train_obj.id).delete()
        else:
            train_obj = RailwayTrain(
                train_number       = train_number,
                train_name         = train_name,
                train_type         = train_type,
                zone               = zone,
                from_station_code  = from_code,
                from_station_name  = from_name,
                to_station_code    = to_code,
                to_station_name    = to_name,
                running_days       = running_days,
                total_distance_km  = total_dist,
                source_linked      = src_linked,
                destination_linked = dest_linked,
                dataset_import_id  = import_record.id
            )
            db.add(train_obj)
            db.flush()

        # ---- Insert stops ----
        stop_rows = stops_by_train.get(train_number, [])
        stop_count = 0
        seen_stop_nums: Set[int] = set()

        for s in stop_rows:
            try:
                stop_num = int(s.get("stop_number", 0))
            except ValueError:
                stop_num = stop_count + 1

            if stop_num in seen_stop_nums:
                issues.append(f"[WARN] Train {train_number}: duplicate stop_number {stop_num}")
                issue_count += 1
                continue
            seen_stop_nums.add(stop_num)

            s_code = s.get("station_code", "").strip().upper()
            s_name = s.get("station_name", s_code)
            arr    = normalize_time(s.get("arrival_time"))
            dep    = normalize_time(s.get("departure_time"))

            ok_t1, _, _ = validate_time(arr)
            ok_t2, _, _ = validate_time(dep)
            ok_ta, _, _ = check_timing_anomaly(arr, dep)
            if not ok_ta:
                issues.append(f"[WARN] Train {train_number} stop {stop_num}: timing anomaly arr={arr} dep={dep}")
                issue_count += 1

            try:
                dist  = float(s.get("distance_from_source_km", 0) or 0)
            except ValueError:
                dist = 0.0

            try:
                halt = int(s.get("halt_minutes", 0) or 0)
            except ValueError:
                halt = 0

            s_linked = is_station_linked(s_code, known_codes)

            stop_obj = RailwayTrainStop(
                train_id                = train_obj.id,
                stop_number             = stop_num,
                station_code            = s_code,
                station_name            = s_name,
                arrival_time            = arr,
                departure_time          = dep,
                halt_minutes            = halt,
                distance_from_source_km = dist,
                station_linked          = s_linked
            )
            db.add(stop_obj)
            stop_count += 1

        # Update total_stops on the train object
        train_obj.total_stops = stop_count
        stops_imported += stop_count
        trains_imported += 1
        seen_train_numbers.add(train_number)

        # Batch commit every 50 trains to avoid huge transactions
        if trains_imported % 50 == 0:
            db.commit()
            logger.info(f"  … {trains_imported} trains imported so far")

    # Final commit
    status = "SUCCESS" if trains_skipped == 0 else "PARTIAL"
    import_record.trains_imported   = trains_imported
    import_record.stops_imported    = stops_imported
    import_record.trains_skipped    = trains_skipped
    import_record.validation_issues = issue_count
    import_record.status            = status
    import_record.notes             = f"{len(issues)} issue(s) logged. " + ("; ".join(issues[:5]) + ("…" if len(issues) > 5 else ""))

    db.commit()

    summary = {
        "success": True,
        "trains_imported": trains_imported,
        "stops_imported": stops_imported,
        "trains_skipped": trains_skipped,
        "validation_issues": issue_count,
        "issues": issues[:50],   # cap returned issues list
        "message": (
            f"Import complete. {trains_imported} trains, {stops_imported} stops imported. "
            f"{trains_skipped} skipped. {issue_count} validation notes."
        )
    }

    logger.info(summary["message"])
    return summary
