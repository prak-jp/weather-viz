import json
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import FavoriteCity, SearchHistory, WeatherLog
from app.schemas import FavoriteCityCreate


def get_favorites(db: Session, limit: int = 50) -> list[FavoriteCity]:
    return db.query(FavoriteCity).order_by(FavoriteCity.created_at.desc()).limit(limit).all()


def get_favorite_by_coords(db: Session, lat: float, lon: float) -> FavoriteCity | None:
    # Round to 2 decimal places to match near points
    return (
        db.query(FavoriteCity)
        .filter(
            func.abs(FavoriteCity.latitude - lat) < 0.05,
            func.abs(FavoriteCity.longitude - lon) < 0.05,
        )
        .first()
    )


def create_favorite(db: Session, favorite_in: FavoriteCityCreate) -> FavoriteCity:
    existing = get_favorite_by_coords(db, favorite_in.latitude, favorite_in.longitude)
    if existing:
        return existing

    fav = FavoriteCity(
        name=favorite_in.name,
        admin1=favorite_in.admin1,
        country=favorite_in.country,
        latitude=favorite_in.latitude,
        longitude=favorite_in.longitude,
    )
    db.add(fav)
    db.commit()
    db.refresh(fav)
    return fav


def delete_favorite(db: Session, favorite_id: int) -> bool:
    fav = db.query(FavoriteCity).filter(FavoriteCity.id == favorite_id).first()
    if not fav:
        return False
    db.delete(fav)
    db.commit()
    return True


def record_search(db: Session, query: str, count: int) -> SearchHistory:
    record = SearchHistory(query=query, result_count=count)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_recent_searches(db: Session, limit: int = 10) -> list[SearchHistory]:
    return (
        db.query(SearchHistory)
        .order_by(SearchHistory.created_at.desc())
        .limit(limit)
        .all()
    )


def record_weather_log(
    db: Session,
    lat: float,
    lon: float,
    weather_data: dict,
    location_name: str | None = None,
) -> WeatherLog:
    current = weather_data.get("current", {})
    entry = WeatherLog(
        latitude=lat,
        longitude=lon,
        location_name=location_name,
        temperature=current.get("temperature_2m"),
        weather_description=current.get("weather_description"),
        weather_code=current.get("weather_code"),
        humidity=current.get("relative_humidity_2m"),
        wind_speed=current.get("wind_speed_10m"),
        cached_payload=json.dumps(weather_data),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_db_stats(db: Session) -> dict:
    favorites_count = db.query(func.count(FavoriteCity.id)).scalar() or 0
    searches_count = db.query(func.count(SearchHistory.id)).scalar() or 0
    weather_logs_count = db.query(func.count(WeatherLog.id)).scalar() or 0
    return {
        "favorite_cities": favorites_count,
        "search_history": searches_count,
        "weather_logs": weather_logs_count,
    }
