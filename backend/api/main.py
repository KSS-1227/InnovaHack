"""
Enterprise Compliance Intelligence Platform
FastAPI Entry Point

Hackathon Prototype
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

from backend.api.routes.upload import router as upload_router
from backend.api.routes.query import router as query_router
from backend.api.routes.graph import router as graph_router
from backend.api.routes.report import router as report_router

app = FastAPI(
    title="Enterprise Compliance Intelligence Platform",
    description="""
AI-powered Multi-Modal Knowledge Graph Synthesis for Enterprise Compliance

Features:
- PDF Upload
- Knowledge Graph Generation
- GraphRAG Query
- Explainable AI
- Evidence-backed Answers
- Compliance Reporting
""",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ------------------------------
# CORS
# ------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------
# Routers
# ------------------------------

app.include_router(upload_router, prefix="/api")
app.include_router(query_router, prefix="/api")
app.include_router(graph_router, prefix="/api")
app.include_router(report_router, prefix="/api")


# ------------------------------
# Health Check
# ------------------------------

@app.get("/")
async def root():
    return {
        "application": "Enterprise Compliance Intelligence Platform",
        "status": "Running",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():

    return {
        "status": "healthy",
        "openai_key_loaded": bool(os.getenv("OPENAI_API_KEY")),
        "graph_engine": "MMGraphRAG",
        "prototype": True
    }