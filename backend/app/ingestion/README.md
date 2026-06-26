# Navix Data Ingestion Framework

This directory contains the modular data ingestion system for the Navix travel intelligence database. It reads, validates, normalizes, and upserts travel datasets from CSV (or JSON) files.

---

## Directory Structure

- `config.py`: Resolves dataset directories dynamically and configures logging.
- `validators.py`: Contains centralized Pydantic V2 schemas for each travel entity.
- `loader.py`: Handles CSV/JSON file reading and normalizes keys (like transforming human-readable headers to database schema snake_case).
- `database_writer.py`: Generic wrapper for database transaction boundary control and high-performance in-memory upsert/conflict prevention.
- `import_cities.py`: Importer for the cities dataset.
- `import_stations.py`: Importer for the stations dataset (resolves CSV City IDs/Names to database IDs).
- `import_corridors.py`: Importer for corridors (resolves source & destination endpoints to database IDs).
- `import_nearby_stations.py`: Importer for nearby station mappings (resolves city and station references).
- `import_seasonal_demands.py`: Importer for seasonal demands.
- `import_all.py`: Orchestrator CLI to run all importers in the correct dependency sequence.

---

## How it Works

### 1. Key Normalization
The framework handles differences between exported database dumps and custom human-designed CSVs:
- Automatically converts human headers (e.g. `City Name` or `Distance (KM)`) to standard Pydantic schema parameters (e.g. `city_name`, `distance_km`).
- Translates empty fields (`""`) to `None`.

### 2. ID Resolution & Mapping
To prevent broken foreign key references due to mismatching auto-increment primary keys:
- The loaders read the static files (like `cities.csv` or `stations.csv`) to map arbitrary CSV-level identifiers (`City ID` or `Station ID`) to natural unique keys (`City Name` or `Station Code`).
- The system then queries the database for the active, correct primary keys corresponding to those natural keys, ensuring foreign key integrity without hardcoding databases IDs.

### 3. Centralized Validation
All validations are performed by Pydantic V2 schemas in `validators.py`:
- Coordinates are validated to be within normal ranges.
- Modifiers, scores, and multipliers are checked against reasonable numeric bounds.
- Missing required fields or duplicate corridor endpoints are immediately caught.
- Any row failing validation raises a `ValidationError` which is logged as a warning; the importer **skips the invalid row** and continues processing the rest of the file.

### 4. Idempotency & Bulk Upserts
The ingestion framework is safe to run multiple times:
- On execution, all existing records are fetched from the database into an in-memory map by their natural unique keys (`city_name`, `station_code`, etc.).
- For each record, if it already exists, the framework compares fields. If values are identical, it is **skipped as a duplicate**; if fields differ, it executes an **update**. If the record is missing, it executes an **insert**.
- Operations are performed in batches and committed in a single transaction. In case of any database exception, the transaction is immediately rolled back.

---

## How to Run the Importer

Make sure you are in the `backend` folder as your working directory.

### Run all importers (default)
```bash
python -m app.ingestion.import_all
```

### Run a specific importer target
You can target only a specific target table using the `--only` flag:
```bash
python -m app.ingestion.import_all --only cities
python -m app.ingestion.import_all --only stations
python -m app.ingestion.import_all --only corridors
python -m app.ingestion.import_all --only nearby
python -m app.ingestion.import_all --only seasonal
```

### Use a custom dataset directory
By default, the importer reads files from `backend/datasets/`. You can specify a custom folder using the `--dir` flag:
```bash
python -m app.ingestion.import_all --dir /path/to/custom/datasets
```
*(Or specify the `DATASET_DIR` environment variable)*.

---

## How to Extend the Framework

### Adding a New Dataset
1. Create a new SQLAlchemy model in `backend/app/models.py` (if it does not exist) and run alembic migrations if needed.
2. In `app/ingestion/validators.py`, define a new Pydantic schema class subclassing `BaseModel`.
3. In `app/ingestion/import_<new_dataset>.py`, write an importer function using `bulk_upsert` from `database_writer.py` (model class, natural key lambda functions, fields to update).
4. Register the new target in `app/ingestion/import_all.py` CLI and orchestrator order.
