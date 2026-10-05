from datetime import datetime
from pydantic import BaseModel, ConfigDict


class FavoriteCityBase(BaseModel):
    name: str
    admin1: str | None = None
    country: str | None = None
    latitude: float
    longitude: float


class FavoriteCityCreate(FavoriteCityBase):
    pass


class FavoriteCityOut(FavoriteCityBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SearchHistoryOut(BaseModel):
    id: int
    query: str
    result_count: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WeatherLogOut(BaseModel):
    id: int
    latitude: float
    longitude: float
    location_name: str | None = None
    temperature: float | None = None
    weather_description: str | None = None
    weather_code: int | None = None
    humidity: float | None = None
    wind_speed: float | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DatabaseStatus(BaseModel):
    status: str
    dialect: str
    database: str
    tables: dict[str, int]
