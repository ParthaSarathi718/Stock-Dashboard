from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import router as api_router
from app import models
from app.database import engine

# Automatically generate database tables 
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Stock Data Intelligence API",
    description="REST API for fetching, analyzing, and predicting stock market data.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"status": "success", "message": "Welcome to Stock Data Intelligence API!"}
