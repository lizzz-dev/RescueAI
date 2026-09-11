import logging
import os
import sys

# Ensure backend directory is in sys.path when invoked as backend.main:app
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from database import Base, engine
import models  # noqa: F401 - ensures models are registered before create_all
from routers import incidents, misc, demo

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("rescueai")

app = FastAPI(
    title="RescueAI",
    description=(
        "AI Emergency Response & Resource Coordination System - a decision-support "
        "platform. The AI NEVER autonomously dispatches real resources; every "
        "recommendation requires human approval. All data in this deployment is "
        "synthetic/demo data."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

# Auto-seed initial demo dataset if database is newly initialized
try:
    from database import SessionLocal
    with SessionLocal() as db:
        if db.query(models.Hospital).count() == 0:
            try:
                import seed_pakistan
                seed_pakistan.seed()
            except Exception:
                import seed
                seed.seed()
except Exception as e:
    logger.warning("Auto-seed check: %s", e)

# All API routes live under /api/... so that they never collide with frontend static routes
app.include_router(incidents.router)
app.include_router(misc.resources_router)
app.include_router(misc.hospitals_router)
app.include_router(misc.dashboard_router)
app.include_router(misc.audit_router)
app.include_router(misc.notifications_router)
app.include_router(demo.router)


@app.get("/api")
def api_root():
    return {
        "service": "RescueAI",
        "status": "operational (decision-support only - no real dispatch capability)",
        "docs": "/docs",
    }


@app.get("/api/health")
def health():
    return {"status": "ok"}


# Serve the built React frontend
# Check frontend/dist first for local development, fall back to backend/static for Docker/prod
_frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(_frontend_dist) and os.path.exists(os.path.join(_frontend_dist, "index.html")):
    STATIC_DIR = _frontend_dist
else:
    STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

if os.path.exists(STATIC_DIR):
    assets_dir = os.path.join(STATIC_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{catchall:path}")
    def serve_react_app(catchall: str):
        response = FileResponse(os.path.join(STATIC_DIR, "index.html"))
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response
