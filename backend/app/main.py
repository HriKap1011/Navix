from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import RouteSearchRequest, RouteSearchResponse
from app.generator import generate_routes
from app.data_store import store

app = FastAPI(title="Navix Backend API")

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
            
        routes = generate_routes(source, destination, request.date)
        return RouteSearchResponse(success=True, routes=routes)
    except Exception as e:
        return RouteSearchResponse(success=False, routes=[], error=f"Search failed: {str(e)}")

@app.get("/cities")
def get_cities():
    try:
        return {"success": True, "cities": store.cities}
    except Exception as e:
        return {"success": False, "error": f"Failed to load cities: {str(e)}", "cities": []}

@app.get("/")
def read_root():
    return {"name": "Navix Backend API", "status": "running"}
