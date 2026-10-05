import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db, init_db, engine
from app.weather import fetch_weather, search_cities
from app.map_overlay import fetch_map_overlay, fetch_nepal_rivers
from app import crud, schemas

logger = logging.getLogger("weather_viz.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize PostgreSQL tables
    init_db()
    yield


app = FastAPI(title="Weather Viz API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health(db: Session = Depends(get_db)):
    db_connected = False
    try:
        db.execute(text("SELECT 1"))
        db_connected = True
    except Exception:
        db_connected = False

    return {
        "status": "ok",
        "database": "connected" if db_connected else "disconnected",
        "driver": engine.url.drivername,
    }


@app.get("/api/search")
async def search(q: str = Query(..., min_length=2), db: Session = Depends(get_db)):
    try:
        results = await search_cities(q)
        try:
            crud.record_search(db, q, len(results))
        except Exception as db_err:
            logger.warning(f"Failed to record search history: {db_err}")
        return {"results": results}
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Weather service error: {exc}") from exc


@app.get("/api/weather")
async def weather(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    name: str | None = Query(None),
    provider: str = Query("auto", description="Weather provider: auto, yr, or open_meteo"),
    db: Session = Depends(get_db),
):
    try:
        data = await fetch_weather(lat, lon, provider=provider)
        try:
            crud.record_weather_log(db, lat, lon, data, location_name=name)
        except Exception as db_err:
            logger.warning(f"Failed to record weather snapshot: {db_err}")
        return data
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Weather service error: {exc}") from exc


@app.get("/api/map")
async def map_overlay(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
):
    try:
        return await fetch_map_overlay(lat, lon)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Map overlay error: {exc}") from exc


@app.get("/api/rivers/nepal")
async def nepal_rivers():
    try:
        return await fetch_nepal_rivers()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"River data error: {exc}") from exc


# -------------------------------------------------------------
# Database-Backed Endpoints (Favorites, History, Database Stats)
# -------------------------------------------------------------

@app.get("/api/favorites", response_model=list[schemas.FavoriteCityOut])
def list_favorites(db: Session = Depends(get_db)):
    try:
        return crud.get_favorites(db)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error loading favorites: {exc}",
        ) from exc


@app.post("/api/favorites", response_model=schemas.FavoriteCityOut)
def add_favorite(payload: schemas.FavoriteCityCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_favorite(db, payload)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error saving favorite: {exc}",
        ) from exc


@app.delete("/api/favorites/{favorite_id}")
def remove_favorite(favorite_id: int, db: Session = Depends(get_db)):
    try:
        success = crud.delete_favorite(db, favorite_id)
        if not success:
            raise HTTPException(status_code=404, detail="Favorite city not found")
        return {"deleted": True, "id": favorite_id}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error removing favorite: {exc}",
        ) from exc


@app.get("/api/history", response_model=list[schemas.SearchHistoryOut])
def search_history(db: Session = Depends(get_db)):
    try:
        return crud.get_recent_searches(db)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error loading history: {exc}",
        ) from exc


@app.get("/api/db/stats", response_model=schemas.DatabaseStatus)
def db_stats(db: Session = Depends(get_db)):
    try:
        counts = crud.get_db_stats(db)
        return {
            "status": "connected",
            "dialect": engine.url.drivername,
            "database": engine.url.database or "default",
            "tables": counts,
        }
    except Exception as exc:
        return {
            "status": f"disconnected: {exc}",
            "dialect": engine.url.drivername,
            "database": engine.url.database or "unknown",
            "tables": {},
        }


# -------------------------------------------------------------
# Frontend Static Files (Single-Container Full-Stack Serving)
# -------------------------------------------------------------
import os  # noqa: E402
from fastapi.staticfiles import StaticFiles  # noqa: E402
from fastapi.responses import FileResponse  # noqa: E402

STATIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static"))
if os.path.exists(STATIC_DIR):
    assets_dir = os.path.join(STATIC_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API route not found")
        file_path = os.path.join(STATIC_DIR, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(STATIC_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"message": "Frontend not found"}

