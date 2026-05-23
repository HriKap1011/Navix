from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import RouteSearchRequest, RouteSearchResponse
from app.generator import generate_routes

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
    routes = generate_routes(request.source, request.destination, request.date)
    return RouteSearchResponse(success=True, routes=routes)

@app.get("/")
def read_root():
    return {"name": "Navix Backend API", "status": "running"}
