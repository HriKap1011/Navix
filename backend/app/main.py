from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import RouteSearchRequest, RouteSearchResponse
from app.generator import generate_routes
from app.data_store import store
from app.database import Base, engine
from app.admin_api import router as admin_router

# Automatically create missing database tables (like audit_logs) on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Navix Backend API")
app.include_router(admin_router)

@app.on_event("startup")
def startup_event():
    from app.graph.graph_builder import rebuild_graph
    rebuild_graph()



# Configure CORS so local Next.js frontend can communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local development, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/search-routes", response_model=RouteSearchResponse)
def search_routes(request: RouteSearchRequest):
    try:
        source = request.source.strip()
        destination = request.destination.strip()
        
        if not source:
            return RouteSearchResponse(success=False, routes=[], error="Source city cannot be empty")
        if not destination:
            return RouteSearchResponse(success=False, routes=[], error="Destination city cannot be empty")
            
        if not store.is_valid_city(source):
            return RouteSearchResponse(success=False, routes=[], error=f"'{source}' is not a supported source city")
        if not store.is_valid_city(destination):
            return RouteSearchResponse(success=False, routes=[], error=f"'{destination}' is not a supported destination city")
            
        if source.lower() == destination.lower():
            return RouteSearchResponse(success=False, routes=[], error="Source and destination cities cannot be the same")
            
        from app.search.orchestrator import SearchOrchestrator
        orchestrator = SearchOrchestrator(provider_names=["DATABASE", "CSV", "MOCK"])
        result = orchestrator.search(source, destination, request.date)
        demand = result["demand_profile"]
        demand_data = {
            "is_weekend_rush": demand.is_weekend_rush,
            "is_summer_rush": demand.is_summer_rush,
            "active_festival": demand.active_festival,
            "seat_modifier": demand.seat_modifier,
            "comfort_modifier": demand.comfort_modifier,
            "price_multiplier": demand.price_multiplier,
            "crowd_modifier": demand.crowd_modifier,
            "contextual_message": demand.contextual_message
        }
        return RouteSearchResponse(success=True, routes=result["routes"], demand_profile=demand_data)
    except Exception as e:
        return RouteSearchResponse(success=False, routes=[], error=f"Search failed: {str(e)}")

@app.get("/cities")
def get_cities():
    try:
        from app.domain.mappers import map_city_to_dto
        cities_dtos = [map_city_to_dto(c) for c in store.cities]
        return {"success": True, "cities": cities_dtos}
    except Exception as e:
        return {"success": False, "error": f"Failed to load cities: {str(e)}", "cities": []}

@app.get("/")
def read_root():
    return {"name": "Navix Backend API", "status": "running"}
