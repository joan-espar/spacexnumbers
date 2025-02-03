from fastapi import FastAPI, Request
from app.routes.launch import router as launch_router
from app.routes.totals import router as totals_router
from app.routes.homepage_totals import router as homepage_totals_router
from app.routes.year_totals import router as year_totals_router
from app.routes.last_refresh import router as last_refresh_router
from app.routes.starlink_totals import router as starlink_totals_router
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = FastAPI()

# Fetch the API key from environment variables
# API_KEY = os.getenv("API_KEY")

# Include routes
app.include_router(launch_router, prefix="/api")
app.include_router(totals_router, prefix="/api")  
app.include_router(homepage_totals_router, prefix="/api")  
app.include_router(year_totals_router, prefix="/api")  
app.include_router(last_refresh_router, prefix="/api")  
app.include_router(starlink_totals_router, prefix="/api")  

# Add middleware to handle forwarded headers
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["spacexnumbers.hopto.org", "localhost", "127.0.0.1", "35.180.42.188"]
)

# Middleware for API key and HTTPS headers
@app.middleware("http")
async def verify_api_key_and_https(request: Request, call_next):
    # API key verification
    # api_key = request.headers.get("x-api-key")
    # if api_key != API_KEY:
    #     return JSONResponse(
    #         status_code=403,
    #         content={"detail": "Wrong API Key"}
    #     )
    
    # Process the request
    response = await call_next(request)
    
    # Add HTTPS security headers
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    return response


# Test route
@app.get("/")
def root():
    return {"message": "Backend is running"}

# Allow requests from your React app's domain
origins = [
    "https://www.spacexnumbers.com",  # Add the allowed origin
    "https://spacexnumbers.hopto.org",  # Add any other allowed origins if needed
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Updated for production and development
    # allow_origins=["*"],  # React app URL
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)