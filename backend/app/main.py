from fastapi import FastAPI
from app.routes.launch import router as launch_router
from app.routes.totals import router as totals_router
from app.routes.year_totals import router as year_totals_router
from app.routes.last_refresh import router as last_refresh_router
from app.routes.starlink_totals import router as starlink_totals_router
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = FastAPI()

# Fetch the API key from environment variables
API_KEY = os.getenv("API_KEY")

# Include routes
app.include_router(launch_router, prefix="/api")
app.include_router(totals_router, prefix="/api")  
app.include_router(year_totals_router, prefix="/api")  
app.include_router(last_refresh_router, prefix="/api")  
app.include_router(starlink_totals_router, prefix="/api")  

# Middleware to check API key
@app.middleware("http")
async def verify_api_key(request, call_next):
    api_key = request.headers.get("x-api-key")  # Header to store the API key
    if api_key != API_KEY:
        # Return a simplified JSON response for invalid API key
        return JSONResponse(
            status_code=403,
            content={"detail": "Wrong API Key"}
        )
    return await call_next(request)
# Test route
@app.get("/")
def root():
    return {"message": "Backend is running"}

app.add_middleware(
    CORSMiddleware,
    # allow_origins=["http://localhost:3000"],  # React app URL
    allow_origins=["*"],  # React app URL
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)