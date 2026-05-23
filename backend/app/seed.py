import os
import json
import sys
from sqlalchemy.orm import Session

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app.models import City, Station, NearbyStationMapping, Corridor, SeasonalDemand

# Predefined India Top 100 Cities fallback data (to supplement JSON data)
ADDITIONAL_CITIES = [
    {"name": "Chandigarh", "state": "Chandigarh", "tier": "Tier 2", "importance_score": 75, "demand_category": "Standard", "lat": 30.7333, "lon": 76.7794, "has_airport": True, "has_train_station": True, "code": "IXC", "station": "CDG"},
    {"name": "Bhubaneswar", "state": "Odisha", "tier": "Tier 2", "importance_score": 70, "demand_category": "Standard", "lat": 20.2961, "lon": 85.8245, "has_airport": True, "has_train_station": True, "code": "BBI", "station": "BBS"},
    {"name": "Goa", "state": "Goa", "tier": "Tier 2", "importance_score": 85, "demand_category": "Standard", "lat": 15.2993, "lon": 74.1240, "has_airport": True, "has_train_station": True, "code": "GOI", "station": "MAO"},
    {"name": "Kochi", "state": "Kerala", "tier": "Tier 2", "importance_score": 80, "demand_category": "Standard", "lat": 9.9312, "lon": 76.2673, "has_airport": True, "has_train_station": True, "code": "COK", "station": "ERS"},
    {"name": "Indore", "state": "Madhya Pradesh", "tier": "Tier 2", "importance_score": 78, "demand_category": "Standard", "lat": 22.7196, "lon": 75.8577, "has_airport": True, "has_train_station": True, "code": "IDR", "station": "INDB"},
    {"name": "Bhopal", "state": "Madhya Pradesh", "tier": "Tier 2", "importance_score": 75, "demand_category": "Standard", "lat": 23.2599, "lon": 77.4126, "has_airport": True, "has_train_station": True, "code": "BHO", "station": "BPL"},
    {"name": "Nagpur", "state": "Maharashtra", "tier": "Tier 2", "importance_score": 76, "demand_category": "Standard", "lat": 21.1458, "lon": 79.0882, "has_airport": True, "has_train_station": True, "code": "NAG", "station": "NGP"},
    {"name": "Surat", "state": "Gujarat", "tier": "Tier 2", "importance_score": 80, "demand_category": "Standard", "lat": 21.1702, "lon": 72.8311, "has_airport": True, "has_train_station": True, "code": "STV", "station": "ST"},
    {"name": "Kanpur", "state": "Uttar Pradesh", "tier": "Tier 2", "importance_score": 74, "demand_category": "Standard", "lat": 26.4499, "lon": 80.3319, "has_airport": False, "has_train_station": True, "code": "KNU", "station": "CNB"},
    {"name": "Visakhapatnam", "state": "Andhra Pradesh", "tier": "Tier 2", "importance_score": 77, "demand_category": "Standard", "lat": 17.6868, "lon": 83.2185, "has_airport": True, "has_train_station": True, "code": "VTZ", "station": "VSKP"},
    {"name": "Agra", "state": "Uttar Pradesh", "tier": "Tier 2", "importance_score": 82, "demand_category": "Standard", "lat": 27.1767, "lon": 78.0081, "has_airport": False, "has_train_station": True, "code": "AGR", "station": "AGC"},
    {"name": "Vadodara", "state": "Gujarat", "tier": "Tier 2", "importance_score": 72, "demand_category": "Standard", "lat": 22.3072, "lon": 73.1812, "has_airport": True, "has_train_station": True, "code": "BDQ", "station": "BRC"},
    {"name": "Ghaziabad", "state": "Uttar Pradesh", "tier": "Tier 2", "importance_score": 68, "demand_category": "Standard", "lat": 28.6692, "lon": 77.4538, "has_airport": False, "has_train_station": True, "code": "GZB", "station": "GZB"},
    {"name": "Ludhiana", "state": "Punjab", "tier": "Tier 2", "importance_score": 73, "demand_category": "Standard", "lat": 30.9010, "lon": 75.8573, "has_airport": False, "has_train_station": True, "code": "LDH", "station": "LDH"},
    {"name": "Nashik", "state": "Maharashtra", "tier": "Tier 2", "importance_score": 72, "demand_category": "Standard", "lat": 19.9975, "lon": 73.7898, "has_airport": False, "has_train_station": True, "code": "ISK", "station": "NK"},
    {"name": "Faridabad", "state": "Haryana", "tier": "Tier 2", "importance_score": 66, "demand_category": "Standard", "lat": 28.4089, "lon": 77.3178, "has_airport": False, "has_train_station": True, "code": "FDB", "station": "FDB"},
    {"name": "Meerut", "state": "Uttar Pradesh", "tier": "Tier 2", "importance_score": 67, "demand_category": "Standard", "lat": 28.9845, "lon": 77.7064, "has_airport": False, "has_train_station": True, "code": "MTC", "station": "MTC"},
    {"name": "Rajkot", "state": "Gujarat", "tier": "Tier 2", "importance_score": 70, "demand_category": "Standard", "lat": 22.3039, "lon": 70.8022, "has_airport": True, "has_train_station": True, "code": "RAJ", "station": "RJT"},
    {"name": "Srinagar", "state": "Jammu and Kashmir", "tier": "Tier 2", "importance_score": 85, "demand_category": "Standard", "lat": 34.0837, "lon": 74.7973, "has_airport": True, "has_train_station": True, "code": "SXR", "station": "SINA"},
    {"name": "Aurangabad", "state": "Maharashtra", "tier": "Tier 2", "importance_score": 74, "demand_category": "Standard", "lat": 19.8762, "lon": 75.3433, "has_airport": True, "has_train_station": True, "code": "IXU", "station": "AWB"},
    {"name": "Dhanbad", "state": "Jharkhand", "tier": "Tier 2", "importance_score": 65, "demand_category": "Standard", "lat": 23.7957, "lon": 86.4304, "has_airport": False, "has_train_station": True, "code": "DHN", "station": "DHN"},
    {"name": "Amritsar", "state": "Punjab", "tier": "Tier 2", "importance_score": 84, "demand_category": "Standard", "lat": 31.6340, "lon": 74.8723, "has_airport": True, "has_train_station": True, "code": "ATQ", "station": "ASR"},
    {"name": "Ranchi", "state": "Jharkhand", "tier": "Tier 2", "importance_score": 72, "demand_category": "Standard", "lat": 23.3441, "lon": 85.3096, "has_airport": True, "has_train_station": True, "code": "IXR", "station": "RNC"},
    {"name": "Coimbatore", "state": "Tamil Nadu", "tier": "Tier 2", "importance_score": 76, "demand_category": "Standard", "lat": 11.0168, "lon": 76.9558, "has_airport": True, "has_train_station": True, "code": "CJB", "station": "CBE"},
    {"name": "Jabalpur", "state": "Madhya Pradesh", "tier": "Tier 2", "importance_score": 68, "demand_category": "Standard", "lat": 23.1815, "lon": 79.9864, "has_airport": True, "has_train_station": True, "code": "JLR", "station": "JBP"},
    {"name": "Gwalior", "state": "Madhya Pradesh", "tier": "Tier 2", "importance_score": 71, "demand_category": "Standard", "lat": 26.2124, "lon": 78.1772, "has_airport": True, "has_train_station": True, "code": "GWL", "station": "GWL"},
    {"name": "Vijayawada", "state": "Andhra Pradesh", "tier": "Tier 2", "importance_score": 73, "demand_category": "Standard", "lat": 16.5062, "lon": 80.6480, "has_airport": True, "has_train_station": True, "code": "VGA", "station": "BZA"},
    {"name": "Jodhpur", "state": "Rajasthan", "tier": "Tier 2", "importance_score": 80, "demand_category": "Standard", "lat": 26.2389, "lon": 73.0243, "has_airport": True, "has_train_station": True, "code": "JDH", "station": "JU"},
    {"name": "Madurai", "state": "Tamil Nadu", "tier": "Tier 2", "importance_score": 78, "demand_category": "Standard", "lat": 9.9252, "lon": 78.1198, "has_airport": True, "has_train_station": True, "code": "IXM", "station": "MDU"},
    {"name": "Raipur", "state": "Chhattisgarh", "tier": "Tier 2", "importance_score": 72, "demand_category": "Standard", "lat": 21.2514, "lon": 81.6296, "has_airport": True, "has_train_station": True, "code": "RPR", "station": "R"},
    {"name": "Kota", "state": "Rajasthan", "tier": "Tier 2", "importance_score": 70, "demand_category": "Standard", "lat": 25.2138, "lon": 75.8648, "has_airport": False, "has_train_station": True, "code": "KOT", "station": "KOTA"},
    {"name": "Guwahati", "state": "Assam", "tier": "Tier 2", "importance_score": 82, "demand_category": "Standard", "lat": 26.1445, "lon": 91.7362, "has_airport": True, "has_train_station": True, "code": "GAU", "station": "GHY"},
    {"name": "Solapur", "state": "Maharashtra", "tier": "Tier 2", "importance_score": 67, "demand_category": "Standard", "lat": 17.6599, "lon": 75.9064, "has_airport": False, "has_train_station": True, "code": "SSL", "station": "SUR"},
    {"name": "Bareilly", "state": "Uttar Pradesh", "tier": "Tier 2", "importance_score": 66, "demand_category": "Standard", "lat": 28.3640, "lon": 79.4150, "has_airport": False, "has_train_station": True, "code": "BE", "station": "BE"},
    {"name": "Mysore", "state": "Karnataka", "tier": "Tier 2", "importance_score": 83, "demand_category": "Standard", "lat": 12.2958, "lon": 76.6394, "has_airport": True, "has_train_station": True, "code": "MYQ", "station": "MYS"},
    {"name": "Gurgaon", "state": "Haryana", "tier": "Tier 2", "importance_score": 88, "demand_category": "Standard", "lat": 28.4595, "lon": 77.0266, "has_airport": False, "has_train_station": True, "code": "GUR", "station": "GGN"},
    {"name": "Aligarh", "state": "Uttar Pradesh", "tier": "Tier 2", "importance_score": 65, "demand_category": "Standard", "lat": 27.8974, "lon": 78.0880, "has_airport": False, "has_train_station": True, "code": "ALJN", "station": "ALJN"},
    {"name": "Jalandhar", "state": "Punjab", "tier": "Tier 2", "importance_score": 69, "demand_category": "Standard", "lat": 31.3260, "lon": 75.5762, "has_airport": False, "has_train_station": True, "code": "JUC", "station": "JUC"},
    {"name": "Tiruchirappalli", "state": "Tamil Nadu", "tier": "Tier 2", "importance_score": 74, "demand_category": "Standard", "lat": 10.7905, "lon": 78.7047, "has_airport": True, "has_train_station": True, "code": "TRZ", "station": "TPJ"},
    {"name": "Salem", "state": "Tamil Nadu", "tier": "Tier 2", "importance_score": 68, "demand_category": "Standard", "lat": 11.6643, "lon": 78.1460, "has_airport": False, "has_train_station": True, "code": "SXM", "station": "SA"},
    {"name": "Warangal", "state": "Telangana", "tier": "Tier 2", "importance_score": 67, "demand_category": "Standard", "lat": 17.9784, "lon": 79.5941, "has_airport": False, "has_train_station": True, "code": "WL", "station": "WL"},
    {"name": "Guntur", "state": "Andhra Pradesh", "tier": "Tier 2", "importance_score": 68, "demand_category": "Standard", "lat": 16.3067, "lon": 80.4365, "has_airport": False, "has_train_station": True, "code": "GNT", "station": "GNT"},
    {"name": "Gorakhpur", "state": "Uttar Pradesh", "tier": "Tier 2", "importance_score": 75, "demand_category": "Standard", "lat": 26.7606, "lon": 83.3731, "has_airport": True, "has_train_station": True, "code": "GOP", "station": "GKP"},
    {"name": "Bikaner", "state": "Rajasthan", "tier": "Tier 2", "importance_score": 72, "demand_category": "Standard", "lat": 28.0166, "lon": 73.3122, "has_airport": False, "has_train_station": True, "code": "BKN", "station": "BKN"},
    {"name": "Noida", "state": "Uttar Pradesh", "tier": "Tier 2", "importance_score": 85, "demand_category": "Standard", "lat": 28.5355, "lon": 77.3910, "has_airport": False, "has_train_station": False, "code": "NOD", "station": "NDLS"},
    {"name": "Jamshedpur", "state": "Jharkhand", "tier": "Tier 2", "importance_score": 77, "demand_category": "Standard", "lat": 22.8046, "lon": 86.2029, "has_airport": False, "has_train_station": True, "code": "IXW", "station": "TATA"},
    {"name": "Bhilai", "state": "Chhattisgarh", "tier": "Tier 2", "importance_score": 69, "demand_category": "Standard", "lat": 21.1938, "lon": 81.3509, "has_airport": False, "has_train_station": True, "code": "BHI", "station": "BPHB"},
    {"name": "Cuttack", "state": "Odisha", "tier": "Tier 2", "importance_score": 68, "demand_category": "Standard", "lat": 20.4625, "lon": 85.8830, "has_airport": False, "has_train_station": True, "code": "CTC", "station": "CTC"},
    {"name": "Dehradun", "state": "Uttarakhand", "tier": "Tier 2", "importance_score": 82, "demand_category": "Standard", "lat": 30.3165, "lon": 78.0322, "has_airport": True, "has_train_station": True, "code": "DED", "station": "DDN"},
    {"name": "Kolhapur", "state": "Maharashtra", "tier": "Tier 2", "importance_score": 73, "demand_category": "Standard", "lat": 16.7050, "lon": 74.2433, "has_airport": True, "has_train_station": True, "code": "KLH", "station": "KOP"},
    {"name": "Ajmer", "state": "Rajasthan", "tier": "Tier 2", "importance_score": 76, "demand_category": "Standard", "lat": 26.4498, "lon": 74.6399, "has_airport": False, "has_train_station": True, "code": "AII", "station": "AII"},
    {"name": "Ujjain", "state": "Madhya Pradesh", "tier": "Tier 2", "importance_score": 79, "demand_category": "Standard", "lat": 23.1760, "lon": 75.7885, "has_airport": False, "has_train_station": True, "code": "UJN", "station": "UJN"},
    {"name": "Jhansi", "state": "Uttar Pradesh", "tier": "Tier 2", "importance_score": 72, "demand_category": "Standard", "lat": 25.4484, "lon": 78.5685, "has_airport": False, "has_train_station": True, "code": "JHS", "station": "VGLJ"},
    {"name": "Pondicherry", "state": "Puducherry", "tier": "Tier 2", "importance_score": 81, "demand_category": "Standard", "lat": 11.9416, "lon": 79.8083, "has_airport": True, "has_train_station": True, "code": "PNY", "station": "PDY"},
    {"name": "Jammu", "state": "Jammu and Kashmir", "tier": "Tier 2", "importance_score": 77, "demand_category": "Standard", "lat": 32.7266, "lon": 74.8570, "has_airport": True, "has_train_station": True, "code": "IXJ", "station": "JAT"},
    {"name": "Mangalore", "state": "Karnataka", "tier": "Tier 2", "importance_score": 76, "demand_category": "Standard", "lat": 12.9141, "lon": 74.8560, "has_airport": True, "has_train_station": True, "code": "IXE", "station": "MAQ"},
    {"name": "Gaya", "state": "Bihar", "tier": "Tier 2", "importance_score": 78, "demand_category": "Standard", "lat": 24.7914, "lon": 85.0002, "has_airport": True, "has_train_station": True, "code": "GAY", "station": "GAYA"},
    {"name": "Udaipur", "state": "Rajasthan", "tier": "Tier 2", "importance_score": 84, "demand_category": "Standard", "lat": 24.5854, "lon": 73.7125, "has_airport": True, "has_train_station": True, "code": "UDR", "station": "UDZ"},
    {"name": "Kozhikode", "state": "Kerala", "tier": "Tier 2", "importance_score": 74, "demand_category": "Standard", "lat": 11.2588, "lon": 75.7804, "has_airport": True, "has_train_station": True, "code": "CCJ", "station": "CLT"},
    {"name": "Kurnool", "state": "Andhra Pradesh", "tier": "Tier 2", "importance_score": 67, "demand_category": "Standard", "lat": 15.8281, "lon": 78.0373, "has_airport": True, "has_train_station": True, "code": "KJB", "station": "KRNT"},
    {"name": "Vellore", "state": "Tamil Nadu", "tier": "Tier 2", "importance_score": 72, "demand_category": "Standard", "lat": 12.9165, "lon": 79.1325, "has_airport": False, "has_train_station": True, "code": "VLR", "station": "KPD"},
    {"name": "Prayagraj", "state": "Uttar Pradesh", "tier": "Tier 2", "importance_score": 78, "demand_category": "Standard", "lat": 25.4358, "lon": 81.8463, "has_airport": True, "has_train_station": True, "code": "IXD", "station": "PRYJ"},
    {"name": "Muzaffarpur", "state": "Bihar", "tier": "Tier 2", "importance_score": 72, "demand_category": "Standard", "lat": 26.1197, "lon": 85.3910, "has_airport": False, "has_train_station": True, "code": "MJP", "station": "MFP"},
    # We will generate programmatic fallbacks for the rest of the 100 cities inside loop
]

# Festival Calendar fallback data
FESTIVALS_SEED = [
    { "festival_name": "Holi", "start_month": 3, "start_day": 1, "end_month": 3, "end_day": 6, "seat_modifier": 0.4, "comfort_modifier": -20, "price_multiplier": 1.3, "crowd_modifier": 40, "description": "Holi festive travel rush" },
    { "festival_name": "Summer Vacation", "start_month": 5, "start_day": 10, "end_month": 6, "end_day": 15, "seat_modifier": 0.7, "comfort_modifier": -10, "price_multiplier": 1.15, "crowd_modifier": 25, "description": "Summer holidays school rush" },
    { "festival_name": "Raksha Bandhan", "start_month": 8, "start_day": 26, "end_month": 8, "end_day": 30, "seat_modifier": 0.4, "comfort_modifier": -20, "price_multiplier": 1.3, "crowd_modifier": 40, "description": "Rakhi weekend travel rush" },
    { "festival_name": "Durga Puja", "start_month": 10, "start_day": 14, "end_month": 10, "end_day": 22, "seat_modifier": 0.4, "comfort_modifier": -20, "price_multiplier": 1.3, "crowd_modifier": 40, "description": "Navratri and Durga Puja rush" },
    { "festival_name": "Diwali", "start_month": 11, "start_day": 4, "end_month": 11, "end_day": 11, "seat_modifier": 0.4, "comfort_modifier": -20, "price_multiplier": 1.3, "crowd_modifier": 40, "description": "Diwali homecoming rush" },
    { "festival_name": "Chhath Puja", "start_month": 11, "start_day": 12, "end_month": 11, "end_day": 17, "seat_modifier": 0.4, "comfort_modifier": -20, "price_multiplier": 1.3, "crowd_modifier": 40, "description": "Chhath Puja major migration rush" },
    { "festival_name": "New Year", "start_month": 12, "start_day": 25, "end_month": 1, "end_day": 5, "seat_modifier": 0.4, "comfort_modifier": -20, "price_multiplier": 1.3, "crowd_modifier": 40, "description": "New year and winter vacation rush" }
]

def load_data_file(filename: str) -> any:
    path = os.path.join(os.path.dirname(__file__), "data", filename)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None

def export_to_csv(session: Session):
    import csv
    print("Exporting database tables to database_export directory...")
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    export_dir = os.path.join(base_dir, "database_export")
    os.makedirs(export_dir, exist_ok=True)

    # 1. Cities
    cities = session.query(City).order_by(City.id).all()
    with open(os.path.join(export_dir, "cities.csv"), "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow(["ID", "City Name", "State", "Tier", "Importance Score", "Demand Category", "Latitude", "Longitude", "Has Airport", "Has Train Station", "Code", "Station"])
        for c in cities:
            writer.writerow([c.id, c.city_name, c.state, c.tier, c.importance_score, c.demand_category, c.latitude, c.longitude, c.has_airport, c.has_train_station, c.code, c.station])
            
    # 2. Stations
    stations = session.query(Station).order_by(Station.id).all()
    with open(os.path.join(export_dir, "stations.csv"), "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow(["ID", "Station Code", "Station Name", "City ID", "Station Type", "Importance Score"])
        for s in stations:
            writer.writerow([s.id, s.station_code, s.station_name, s.city_id, s.station_type, s.importance_score])
            
    # 3. Nearby mappings
    mappings = session.query(NearbyStationMapping).order_by(NearbyStationMapping.id).all()
    with open(os.path.join(export_dir, "nearby_station_mappings.csv"), "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow(["ID", "City ID", "Station ID", "Distance (KM)"])
        for m in mappings:
            writer.writerow([m.id, m.city_id, m.station_id, m.distance_km])
            
    # 4. Corridors
    corridors = session.query(Corridor).order_by(Corridor.id).all()
    with open(os.path.join(export_dir, "corridors.csv"), "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow(["ID", "Source City ID", "Destination City ID", "Demand Level", "Migration Relevance", "Seasonal Pressure", "Avg Duration"])
        for c in corridors:
            writer.writerow([c.id, c.source_city_id, c.destination_city_id, c.demand_level, c.migration_relevance, c.seasonal_pressure, c.avg_duration])
            
    # 5. Seasonal demands
    seasonal = session.query(SeasonalDemand).order_by(SeasonalDemand.id).all()
    with open(os.path.join(export_dir, "seasonal_demands.csv"), "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow(["ID", "Festival Name", "Start Month", "Start Day", "End Month", "End Day", "Seat Modifier", "Comfort Modifier", "Price Multiplier", "Crowd Modifier", "Description"])
        for s in seasonal:
            writer.writerow([s.id, s.festival_name, s.start_month, s.start_day, s.end_month, s.end_day, s.seat_modifier, s.comfort_modifier, s.price_multiplier, s.crowd_modifier, s.description])
            
    print(f"Exported all tables to CSV in: {export_dir}")

def seed_database():
    session = SessionLocal()
    try:
        print("Cleaning up existing database records...")
        session.query(NearbyStationMapping).delete()
        session.query(Corridor).delete()
        session.query(Station).delete()
        session.query(City).delete()
        session.query(SeasonalDemand).delete()
        session.commit()

        # 1. Load initial datasets from JSON files
        cities_json = load_data_file("cities.json") or []
        stations_json = load_data_file("stations.json") or {}
        nearby_json = load_data_file("nearby_stations.json") or {}
        corridors_json = load_data_file("corridors.json") or {}

        print(f"Loaded JSONs: {len(cities_json)} cities, {len(stations_json)} stations, {len(nearby_json)} nearby lists, {len(corridors_json)} corridors.")

        # 2. Seed Cities
        print("Seeding cities...")
        seeded_city_map = {} # city_name.lower() -> City ORM
        
        # Add cities from JSON first
        for c in cities_json:
            city = City(
                city_name=c["name"],
                state="State",
                tier="Tier 1" if c.get("has_airport") else "Tier 2",
                importance_score=90 if c.get("has_airport") else 70,
                demand_category="Metropolitan" if c.get("has_airport") else "Major Hub",
                latitude=c["lat"],
                longitude=c["lon"],
                has_airport=c["has_airport"],
                has_train_station=c["has_train_station"],
                code=c["code"],
                station=c["station"]
            )
            session.add(city)
            seeded_city_map[c["name"].lower()] = city
        
        # Add additional pre-defined cities
        for c in ADDITIONAL_CITIES:
            name_lower = c["name"].lower()
            if name_lower not in seeded_city_map:
                city = City(
                    city_name=c["name"],
                    state=c["state"],
                    tier=c["tier"],
                    importance_score=c["importance_score"],
                    demand_category=c["demand_category"],
                    latitude=c["lat"],
                    longitude=c["lon"],
                    has_airport=c["has_airport"],
                    has_train_station=c["has_train_station"],
                    code=c["code"],
                    station=c["station"]
                )
                session.add(city)
                seeded_city_map[name_lower] = city

        # Generate generic cities to reach 100
        city_index = 1
        states_pool = ["Maharashtra", "Uttar Pradesh", "Bihar", "West Bengal", "Madhya Pradesh", "Tamil Nadu", "Rajasthan", "Karnataka", "Gujarat", "Andhra Pradesh"]
        while len(seeded_city_map) < 100:
            name = f"City{city_index}"
            code = f"C{city_index:02d}"
            state = states_pool[city_index % len(states_pool)]
            city = City(
                city_name=name,
                state=state,
                tier="Tier 3",
                importance_score=40,
                demand_category="Standard",
                latitude=10.0 + (city_index * 0.25) % 20.0,
                longitude=70.0 + (city_index * 0.18) % 18.0,
                has_airport=False,
                has_train_station=True,
                code=code,
                station=f"{code}S"
            )
            session.add(city)
            seeded_city_map[name.lower()] = city
            city_index += 1

        session.commit()
        print(f"Seeded {len(seeded_city_map)} cities successfully.")

        # 3. Seed Stations
        print("Seeding stations...")
        seeded_station_map = {} # station_code -> Station ORM
        
        # Add stations from JSON
        for code, name in stations_json.items():
            station = Station(
                station_code=code,
                station_name=name,
                station_type="Rail",
                importance_score=80
            )
            session.add(station)
            seeded_station_map[code] = station
            
        # Ensure all cities have their primary stations in the stations table
        for name_lower, city in seeded_city_map.items():
            p_code = city.station
            if p_code and p_code not in seeded_station_map:
                station = Station(
                    station_code=p_code,
                    station_name=f"{city.city_name} Junction",
                    city_id=city.id,
                    station_type="Rail",
                    importance_score=90
                )
                session.add(station)
                seeded_station_map[p_code] = station
            elif p_code:
                # Associate existing station with city
                seeded_station_map[p_code].city_id = city.id

        session.commit()
        print(f"Seeded {len(seeded_station_map)} terminal stations successfully.")

        # 4. Seed Nearby Station Mappings
        print("Seeding nearby station mappings...")
        mapping_count = 0
        mapped_pairs = set()
        for city_name, station_codes in nearby_json.items():
            city = seeded_city_map.get(city_name.lower())
            if city:
                for code in station_codes:
                    # Retrieve or create station
                    station = seeded_station_map.get(code)
                    if not station:
                        station = Station(
                            station_code=code,
                            station_name=f"{city.city_name} Alternative {code}",
                            city_id=city.id,
                            station_type="Rail",
                            importance_score=60
                        )
                        session.add(station)
                        session.commit()
                        seeded_station_map[code] = station
                    
                    pair = (city.id, station.id)
                    if pair not in mapped_pairs:
                        mapping = NearbyStationMapping(
                            city_id=city.id,
                            station_id=station.id,
                            distance_km=15.0 + (len(code) % 3) * 5.0
                        )
                        session.add(mapping)
                        mapped_pairs.add(pair)
                        mapping_count += 1
        
        # Ensure all other cities have at least their primary station mapped
        for name_lower, city in seeded_city_map.items():
            p_code = city.station
            if p_code:
                station = seeded_station_map.get(p_code)
                if station:
                    pair = (city.id, station.id)
                    if pair not in mapped_pairs:
                        mapping = NearbyStationMapping(
                            city_id=city.id,
                            station_id=station.id,
                            distance_km=0.0
                        )
                        session.add(mapping)
                        mapped_pairs.add(pair)
                        mapping_count += 1

        session.commit()
        print(f"Seeded {mapping_count} nearby mappings successfully.")

        # 5. Seed Corridors
        print("Seeding corridors...")
        corridor_count = 0
        corridor_pairs = set()
        for key, details in corridors_json.items():
            parts = key.split("-")
            if len(parts) == 2:
                src_name, dest_name = parts[0], parts[1]
                src_city = seeded_city_map.get(src_name.lower())
                dest_city = seeded_city_map.get(dest_name.lower())
                if src_city and dest_city:
                    pair = (src_city.id, dest_city.id)
                    if pair not in corridor_pairs:
                        corridor = Corridor(
                            source_city_id=src_city.id,
                            destination_city_id=dest_city.id,
                            demand_level=details.get("demand_level", "High"),
                            migration_relevance="High" if details.get("migration_heavy") else "Standard",
                            seasonal_pressure="Festival Rush" if details.get("festival_heavy") else "Standard",
                            avg_duration="12h"
                        )
                        session.add(corridor)
                        corridor_pairs.add(pair)
                        corridor_count += 1
                
        # Seed additional realistic corridors among Top 10 cities
        core_corridors = [
            ("Mumbai", "Bengaluru", "High", "High", "Weekend/Summer", "18h"),
            ("Hyderabad", "Chennai", "Moderate", "Moderate", "Weekend", "9h"),
            ("Pune", "Bengaluru", "High", "High", "Corporate Rush", "14h"),
            ("Delhi", "Varanasi", "High", "Extreme", "Festivals", "12h"),
            ("Lucknow", "Delhi", "High", "High", "Daily Migration", "8h"),
            ("Ahmedabad", "Mumbai", "Extreme", "High", "Daily Business", "6h"),
            ("Delhi", "Prayagraj", "High", "High", "Weekend/Festivals", "7h"),
            ("Delhi", "Muzaffarpur", "Extreme", "High", "Festivals (Chhath)", "16h"),
            ("Patna", "Muzaffarpur", "Moderate", "Standard", "Daily commute", "2h"),
            ("Kolkata", "Ranchi", "High", "Standard", "Weekend", "7h"),
            ("Mumbai", "Nagpur", "High", "High", "Weekend/Holiday", "11h"),
            ("Delhi", "Gaya", "Extreme", "High", "Festivals (Pitrapaksha/Chhath)", "14h"),
            ("Kolkata", "Gaya", "High", "Standard", "Weekend/Festivals", "6h"),
        ]
        
        for src_name, dest_name, level, mig, pressure, duration in core_corridors:
            src_city = seeded_city_map.get(src_name.lower())
            dest_city = seeded_city_map.get(dest_name.lower())
            if src_city and dest_city:
                pair = (src_city.id, dest_city.id)
                if pair not in corridor_pairs:
                    corridor = Corridor(
                        source_city_id=src_city.id,
                        destination_city_id=dest_city.id,
                        demand_level=level,
                        migration_relevance=mig,
                        seasonal_pressure=pressure,
                        avg_duration=duration
                    )
                    session.add(corridor)
                    corridor_pairs.add(pair)
                    corridor_count += 1

        session.commit()
        print(f"Seeded {corridor_count} corridors successfully.")

        # 6. Seed Seasonal Demands
        print("Seeding seasonal demands...")
        for fest in FESTIVALS_SEED:
            demand = SeasonalDemand(
                festival_name=fest["festival_name"],
                start_month=fest["start_month"],
                start_day=fest["start_day"],
                end_month=fest["end_month"],
                end_day=fest["end_day"],
                seat_modifier=fest["seat_modifier"],
                comfort_modifier=fest["comfort_modifier"],
                price_multiplier=fest["price_multiplier"],
                crowd_modifier=fest["crowd_modifier"],
                description=fest["description"]
            )
            session.add(demand)
        
        session.commit()
        print(f"Seeded {len(FESTIVALS_SEED)} seasonal demands successfully.")

        # Export to CSV automatically
        export_to_csv(session)

        print("\nAll database seeding operations completed successfully!")
    except Exception as e:
        session.rollback()
        print(f"\nError seeding database: {e}")
        raise e
    finally:
        session.close()

if __name__ == "__main__":
    seed_database()
